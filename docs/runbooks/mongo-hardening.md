# Runbook: harden production MongoDB (existing data)

**Goal:** move the production `mongo` container from "no password, port open to the
internet" to "authentication on, no public port, single-node replica set (transactions)",
**without losing data**.

**Downtime:** about 1 minute (containers restart once).
**Tested:** the full procedure was rehearsed on a copy of an unauthenticated `mongo:7`
volume containing data; data was preserved and the API reconnected.

> Do steps 1–5 on the **old** deployment (auth still off). Only step 6 switches over.

---

## 0. Before you start

- SSH access to the server, in the folder containing `docker-compose.yml`.
- The new code (this branch) available on the server, but **not deployed yet**.
- Generate three values on your machine (keep them in your password manager):

```bash
openssl rand -hex 24                          # ROOT_PASSWORD
openssl rand -hex 24                          # APP_PASSWORD
openssl rand -base64 756 | tr -d '\n'         # REPLICA_KEY
```

Hex passwords avoid URL-encoding problems in `MONGO_URI`.

## 1. Check whether the database is exposed (from a machine OUTSIDE the server)

```bash
nc -vz <server-ip> 27017
```

If it connects, the database is currently public. Continue quickly.

## 2. Check for signs of compromise

Open, unauthenticated MongoDB servers are routinely scanned and wiped by ransom bots.

```bash
docker exec backend_mongo mongosh --quiet --eval \
  'db.adminCommand({listDatabases:1}).databases.forEach(d => print(d.name, d.sizeOnDisk))'
```

Look for unexpected databases (e.g. `READ_ME_TO_RECOVER_YOUR_DATA`, `README`) or your app
database missing / empty. Note your **app database name** (referred to as `<db>` below).

## 3. Back up

```bash
docker exec backend_mongo mongodump --archive --gzip > backup-$(date +%F).archive.gz
ls -lh backup-*.archive.gz            # must not be ~0 bytes
```

Copy the backup **off the server** (e.g. `scp` to your machine).

## 4. Create the users (auth is still off, so no login needed)

Replace the placeholders, keep the quotes:

```bash
docker exec -i backend_mongo mongosh --quiet <<'EOF'
db.getSiblingDB("admin").createUser({
  user: "hera_root", pwd: "ROOT_PASSWORD", roles: ["root"]
})
db.getSiblingDB("<db>").createUser({
  user: "hera_app", pwd: "APP_PASSWORD", roles: [{ role: "readWrite", db: "<db>" }]
})
EOF
```

**Verify both users exist before going further:**

```bash
docker exec backend_mongo mongosh --quiet --eval \
  'db.getSiblingDB("admin").system.users.find().forEach(u => print(u._id))'
# expected: admin.hera_root  and  <db>.hera_app
```

## 5. Write the config files

`.env.mongo` (new file, next to `docker-compose.yml`, never committed):

```dotenv
MONGO_INITDB_ROOT_USERNAME=hera_root
MONGO_INITDB_ROOT_PASSWORD=ROOT_PASSWORD
MONGO_REPLICA_KEY=REPLICA_KEY
```

The username/password **must match step 4**: the container healthcheck logs in with them.

In `.env`, replace `MONGO_URI` with:

```dotenv
MONGO_URI=mongodb://hera_app:APP_PASSWORD@mongo:27017/<db>?authSource=<db>&replicaSet=rs0
```

## 6. Deploy

```bash
git pull                                   # or however you ship the new code
docker compose up -d --build
```

Compose stops the old containers gracefully, starts `mongo` with auth + replica set,
initialises the replica set via the healthcheck (~30 s), then starts the API once
`mongo` is healthy.

> Never stop MongoDB with `docker rm -f` / `kill -9` right after writing users:
> the last writes may not be flushed yet.

## 7. Verify

```bash
docker compose ps                                  # both "healthy"
docker logs backend_api --tail 5                   # "Successfully connected to MongoDB!"
curl -s http://127.0.0.1:3000/healthz              # OK

# Unauthenticated access is refused:
docker exec backend_mongo mongosh --quiet --eval 'db.adminCommand({listDatabases:1})'
# -> "requires authentication"

# Replica set is up:
docker exec backend_mongo mongosh --quiet -u hera_root -p ROOT_PASSWORD \
  --authenticationDatabase admin --eval 'rs.status().members[0].stateStr'
# -> PRIMARY
```

From a machine **outside** the server: `nc -vz <server-ip> 27017` must now fail.
Finally, log in from the mobile app.

## Rollback

Users created in step 4 are harmless to the old setup. To roll back:

```bash
git checkout <previous-commit> -- docker-compose.yml Dockerfile
# restore the previous MONGO_URI in .env
docker compose up -d --build
```

If data is damaged, restore the backup:

```bash
docker exec -i backend_mongo mongorestore --archive --gzip --drop \
  -u hera_root -p ROOT_PASSWORD --authenticationDatabase admin < backup-YYYY-MM-DD.archive.gz
```

## Admin access from your machine afterwards

The port is no longer published. Use an SSH tunnel to the container's IP:

```bash
# on the server: find the container IP
docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' backend_mongo
# on your machine:
ssh -L 27017:<container-ip>:27017 user@<server-ip>
# then connect Compass to mongodb://hera_root:...@localhost:27017/?authSource=admin&directConnection=true
```
