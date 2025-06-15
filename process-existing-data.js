import { MongoClient } from 'mongodb';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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

async function processExistingData() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB Atlas');
    
    // Use your actual database and collection names
    const db = client.db('NYC_Crashes');
    const collection = db.collection('NYC_Crash_Data');
    
    console.log('🔍 Checking existing data...');
    
    // Check total documents
    const totalDocs = await collection.countDocuments();
    console.log(`📊 Total documents: ${totalDocs}`);
    
    // Check if any documents already have the required fields
    const processedDocs = await collection.countDocuments({ 
      vector_embedding: { $exists: true } 
    });
    console.log(`📋 Already processed: ${processedDocs}`);
    
    if (processedDocs === totalDocs) {
      console.log('✅ All documents already processed!');
      return;
    }
    
    // Find documents that need processing (limit to 100 for demo)
    const unprocessedDocs = await collection.find({ 
      vector_embedding: { $exists: false } 
    }).limit(100).toArray();
    
    console.log(`🚀 Processing ${unprocessedDocs.length} documents...`);
    
    let processed = 0;
    let errors = 0;
    
    for (const doc of unprocessedDocs) {
      try {
        console.log(`Processing document ${processed + 1}/${unprocessedDocs.length}...`);
        
        // Create crash narrative from existing fields
        const narrative = [
          doc.BOROUGH || '',
          doc.ON_STREET_NAME || '',
          doc.CROSS_STREET_NAME || '',
          doc.CONTRIBUTING_FACTOR_VEHICLE_1 || '',
          doc.VEHICLE_TYPE_CODE_1 || '',
          `injuries:${doc.NUMBER_OF_PERSONS_INJURED || 0}`,
          `deaths:${doc.NUMBER_OF_PERSONS_KILLED || 0}`
        ].filter(Boolean).join(' ');
        
        // Generate embedding
        console.log('  🧠 Generating AI embedding...');
        const embedding = await generateEmbedding(narrative);
        
        if (!embedding) {
          console.log('  ❌ Failed to generate embedding, skipping...');
          errors++;
          continue;
        }
        
        // Prepare update document
        const updateDoc = {
          crash_narrative: narrative,
          vector_embedding: embedding
        };
        
        // Add GeoJSON location if coordinates exist
        if (doc.LATITUDE && doc.LONGITUDE) {
          const lat = parseFloat(doc.LATITUDE);
          const lng = parseFloat(doc.LONGITUDE);
          
          if (!isNaN(lat) && !isNaN(lng)) {
            updateDoc.location = {
              type: 'Point',
              coordinates: [lng, lat] // Note: GeoJSON is [longitude, latitude]
            };
          }
        }
        
        // Update the document
        await collection.updateOne(
          { _id: doc._id },
          { $set: updateDoc }
        );
        
        processed++;
        console.log('  ✅ Updated with embedding and location');
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`  ❌ Error processing document:`, error.message);
        errors++;
      }
    }
    
    console.log(`\n🎉 Processing complete!`);
    console.log(`✅ Successfully processed: ${processed}`);
    console.log(`❌ Errors: ${errors}`);
    
    // Verify the updates
    const updatedCount = await collection.countDocuments({ 
      vector_embedding: { $exists: true } 
    });
    console.log(`📊 Total documents with embeddings: ${updatedCount}`);
    
    // Show sample processed document
    const sampleDoc = await collection.findOne({ 
      vector_embedding: { $exists: true } 
    });
    
    if (sampleDoc) {
      console.log('\n📋 Sample processed document:');
      console.log(`- Has vector_embedding: ${!!sampleDoc.vector_embedding}`);
      console.log(`- Has location: ${!!sampleDoc.location}`);
      console.log(`- Has crash_narrative: ${!!sampleDoc.crash_narrative}`);
      console.log(`- Embedding dimensions: ${sampleDoc.vector_embedding?.length}`);
      console.log(`- Narrative: "${sampleDoc.crash_narrative?.substring(0, 100)}..."`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

processExistingData();