import mongoose from "mongoose";

/**
 * Connects this test file to its own database on the shared in-memory
 * replica set, wipes collections between tests, and drops the database at the end.
 *
 * Usage (top of a test file):
 *   useTestDatabase();
 */
export function useTestDatabase() {
  beforeAll(async () => {
    const uri = process.env.MONGO_TEST_URI;
    if (!uri) throw new Error("MONGO_TEST_URI not set: is globalSetup configured?");

    const dbName = `test_${process.env.JEST_WORKER_ID}_${Date.now()}`;
    await mongoose.connect(uri, { dbName });
    // Make sure unique indexes exist before tests rely on them.
    await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  });

  afterEach(async () => {
    const collections = await mongoose.connection.db!.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });
}
