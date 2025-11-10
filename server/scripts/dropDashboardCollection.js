import mongoose from 'mongoose';
import 'dotenv/config';

/**
 * Nuclear option: Drop entire dashboards collection and recreate
 */

const dropDashboardCollection = async () => {
  try {
    console.log('🔧 Dropping dashboards collection...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Drop the entire collection
    try {
      await db.dropCollection('dashboards');
      console.log('✅ Dropped dashboards collection');
    } catch (err) {
      if (err.code === 26) {
        console.log('⚠️  Collection does not exist');
      } else {
        throw err;
      }
    }

    // Create new collection will happen automatically on first insert
    console.log('\n✅ Collection will be recreated on next dashboard sync');
    console.log('   Go to educator dashboard to trigger sync');
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

dropDashboardCollection();
