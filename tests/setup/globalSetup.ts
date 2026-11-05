import { MongoMemoryReplSet } from "mongodb-memory-server";

// Starts one in-memory MongoDB replica set for the whole test run.
// A replica set (not a standalone server) is used so tests can exercise
// multi-document transactions, like production should.
export default async function globalSetup() {
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1, storageEngine: "wiredTiger" },
  });

  // Test workers are spawned after globalSetup and inherit process.env.
  process.env.MONGO_TEST_URI = replSet.getUri();
  (globalThis as any).__MONGO_REPLSET__ = replSet;
}
