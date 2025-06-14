import { MongoClient, Collection } from 'mongodb'
import * as dotenv from 'dotenv'
dotenv.config()

let client: MongoClient
export async function getCrashCollection(): Promise<Collection> {
  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI!)
    await client.connect()
  }
  return client.db(process.env.DB_NAME).collection(process.env.COLL_NAME!)
}
