import { MongoClient } from 'mongodb';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Sample NYC crash data
const sampleCrashes = [
  {
    crash_date: "2023-12-01",
    crash_time: "08:30",
    borough: "MANHATTAN",
    on_street_name: "BROADWAY",
    cross_street_name: "42 STREET",
    latitude: 40.7580,
    longitude: -73.9855,
    number_of_persons_injured: 1,
    number_of_persons_killed: 0,
    vehicle_type_code1: "SEDAN",
    vehicle_type_code2: "TAXI",
    contributing_factor_vehicle_1: "DRIVER INATTENTION/DISTRACTION"
  },
  {
    crash_date: "2023-12-02",
    crash_time: "17:45",
    borough: "MANHATTAN",
    on_street_name: "5 AVENUE",
    cross_street_name: "59 STREET",
    latitude: 40.7647,
    longitude: -73.9730,
    number_of_persons_injured: 0,
    number_of_persons_killed: 1,
    vehicle_type_code1: "SPORT UTILITY / STATION WAGON",
    vehicle_type_code2: "BICYCLE",
    contributing_factor_vehicle_1: "FAILURE TO YIELD RIGHT-OF-WAY"
  },
  {
    crash_date: "2023-12-03",
    crash_time: "12:15",
    borough: "MANHATTAN",
    on_street_name: "WEST SIDE HIGHWAY",
    cross_street_name: "14 STREET",
    latitude: 40.7398,
    longitude: -74.0080,
    number_of_persons_injured: 3,
    number_of_persons_killed: 0,
    vehicle_type_code1: "SEDAN",
    vehicle_type_code2: "PICK-UP TRUCK",
    contributing_factor_vehicle_1: "FOLLOWING TOO CLOSELY"
  },
  {
    crash_date: "2023-12-04",
    crash_time: "22:30",
    borough: "BROOKLYN",
    on_street_name: "FLATBUSH AVENUE",
    cross_street_name: "ATLANTIC AVENUE",
    latitude: 40.6838,
    longitude: -73.9760,
    number_of_persons_injured: 2,
    number_of_persons_killed: 0,
    vehicle_type_code1: "SEDAN",
    vehicle_type_code2: "MOTORCYCLE",
    contributing_factor_vehicle_1: "ALCOHOL INVOLVEMENT"
  },
  {
    crash_date: "2023-12-05",
    crash_time: "06:45",
    borough: "MANHATTAN",
    on_street_name: "FDR DRIVE",
    cross_street_name: "HOUSTON STREET",
    latitude: 40.7209,
    longitude: -73.9756,
    number_of_persons_injured: 1,
    number_of_persons_killed: 0,
    vehicle_type_code1: "SEDAN",
    vehicle_type_code2: "TRUCK",
    contributing_factor_vehicle_1: "UNSAFE SPEED"
  }
];

async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: text.substring(0, 8000),
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    return null;
  }
}

async function ingestSampleData() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('safestep');
    const collection = db.collection('crashes');
    
    console.log('🚀 Starting sample data ingestion...\n');
    
    // Clear existing data (optional)
    const existingCount = await collection.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing documents. Clearing collection...`);
      await collection.deleteMany({});
    }
    
    let processed = 0;
    
    for (const crash of sampleCrashes) {
      console.log(`Processing crash ${processed + 1}/${sampleCrashes.length}...`);
      
      // Create narrative for embedding
      const narrative = `${crash.borough} ${crash.on_street_name} ${crash.contributing_factor_vehicle_1} ${crash.vehicle_type_code1} injuries:${crash.number_of_persons_injured} deaths:${crash.number_of_persons_killed}`;
      
      // Generate embedding
      console.log('  Generating AI embedding...');
      const embedding = await generateEmbedding(narrative);
      
      if (!embedding) {
        console.log('  ❌ Failed to generate embedding, skipping...');
        continue;
      }
      
      // Prepare document with all required fields
      const document = {
        ...crash,
        crash_narrative: narrative,
        vector_embedding: embedding,
        location: {
          type: 'Point',
          coordinates: [crash.longitude, crash.latitude]
        }
      };
      
      // Insert document
      await collection.insertOne(document);
      processed++;
      console.log('  ✅ Inserted with embedding');
    }
    
    console.log(`\n🎉 Successfully ingested ${processed} crash records!`);
    
    // Verify the data
    const finalCount = await collection.countDocuments();
    const sampleDoc = await collection.findOne();
    
    console.log(`\n📊 Final verification:`);
    console.log(`Total documents: ${finalCount}`);
    console.log(`Has vector_embedding: ${!!sampleDoc.vector_embedding}`);
    console.log(`Has location: ${!!sampleDoc.location}`);
    console.log(`Has crash_narrative: ${!!sampleDoc.crash_narrative}`);
    console.log(`Embedding dimensions: ${sampleDoc.vector_embedding?.length}`);
    
  } catch (error) {
    console.error('❌ Error during ingestion:', error);
  } finally {
    await client.close();
  }
}

ingestSampleData();