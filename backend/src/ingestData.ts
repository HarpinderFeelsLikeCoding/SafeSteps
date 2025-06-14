import fs from 'fs'
import csv from 'csv-parser'
import { MongoClient } from 'mongodb'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'
dotenv.config()

const uri = process.env.MONGODB_URI!
const dbName = process.env.DB_NAME!
const collName = process.env.COLL_NAME!
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

async function run() {
  const client = new MongoClient(uri)
  await client.connect()
  const coll = client.db(dbName).collection(collName)

  const records: any[] = []
  fs.createReadStream('NYC_Motor_Vehicle_Collisions.csv')
    .pipe(csv())
    .on('data', (data) => records.push(data))
    .on('end', async () => {
      for (const row of records) {
        // build a text narrative
        const text = `
          On ${row.CRASH_DATE} at ${row.ON_STREET_NAME || 'Unknown street'}, borough: ${row.BOROUGH}.
          Vehicles: ${row.VEHICLE_TYPE_CODE1 || 'N/A'}${row.VEHICLE_TYPE_CODE2 ? ', '+row.VEHICLE_TYPE_CODE2 : ''}.
          Injuries: ${row.NUMBER_OF_PERSONS_INJURED}, Deaths: ${row.NUMBER_OF_PERSONS_KILLED}.
          Contributing factors: ${row.CONTRIBUTING_FACTOR_VEHICLE_1}.
        `
        // get embedding
        const embeddingRes = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: text
        })
        const embedding = embeddingRes.data[0].embedding

        // insert document
        await coll.insertOne({
          borough: row.BOROUGH,
          crash_date: row.CRASH_DATE,
          on_street_name: row.ON_STREET_NAME,
          latitude: parseFloat(row.LATITUDE),
          longitude: parseFloat(row.LONGITUDE),
          injuries_total: parseInt(row.NUMBER_OF_PERSONS_INJURED),
          deaths_total: parseInt(row.NUMBER_OF_PERSONS_KILLED),
          narrative: text,
          embedding
        })
      }
      console.log('Ingestion complete!')
      process.exit(0)
    })
}

run().catch(console.error)
