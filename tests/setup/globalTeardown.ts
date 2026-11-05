import type { MongoMemoryReplSet } from "mongodb-memory-server";

export default async function globalTeardown() {
  const replSet = (globalThis as any).__MONGO_REPLSET__ as MongoMemoryReplSet | undefined;
  await replSet?.stop();
}
