import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

async function checkData() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db('safestep');
    const collection = db.collection('crashes');
    
    console.log('🔍 Checking MongoDB data structure...\n');
    
    // Check total documents
    const totalDocs = await collection.countDocuments();
    console.log(`📊 Total crash documents: ${totalDocs}`);
    
    if (totalDocs === 0) {
      console.log('❌ No crash data found! You need to ingest data first.');
      return;
    }
    
    // Check sample document structure
    const sampleDoc = await collection.findOne();
    console.log('\n📋 Sample document structure:');
    console.log('Fields present:', Object.keys(sampleDoc));
    
    // Check for required fields
    const hasEmbedding = 'vector_embedding' in sampleDoc;
    const hasLocation = 'location' in sampleDoc;
    const hasNarrative = 'crash_narrative' in sampleDoc;
    
    console.log('\n✅ Required fields check:');
    console.log(`vector_embedding: ${hasEmbedding ? '✅' : '❌'}`);
    console.log(`location (GeoJSON): ${hasLocation ? '✅' : '❌'}`);
    console.log(`crash_narrative: ${hasNarrative ? '✅' : '❌'}`);
    
    if (hasEmbedding) {
      console.log(`Embedding dimensions: ${sampleDoc.vector_embedding?.length || 'N/A'}`);
    }
    
    // Check indexes
    console.log('\n🔧 Checking indexes...');
    const indexes = await collection.listIndexes().toArray();
    console.log('Available indexes:');
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });
    
    // Check search indexes (Atlas Search)
    try {
      const searchIndexes = await collection.listSearchIndexes().toArray();
      console.log('\n🔍 Atlas Search indexes:');
      searchIndexes.forEach(index => {
        console.log(`- ${index.name}: ${index.type}`);
        if (index.mappings?.fields?.vector_embedding) {
          console.log('  ✅ Vector search configured');
        }
      });
    } catch (error) {
      console.log('\n⚠️ Could not check search indexes (may not be available)');
    }
    
  } catch (error) {
    console.error('❌ Error checking data:', error);
  } finally {
    await client.close();
  }
}

checkData();