import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(uri: string, dbName?: string): Promise<Db> {
  if (db) return db;

  if (!uri) {
    throw new Error('Missing MongoDB connection string (MONGODB_URI)');
  }

  client = new MongoClient(uri);
  await client.connect();

  // If no dbName provided, MongoDB driver uses 'test' by default
  db = client.db(dbName);
  return db;
}

export function getDb(): Db {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

