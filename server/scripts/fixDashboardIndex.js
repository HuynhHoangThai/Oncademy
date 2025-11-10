import mongoose from 'mongoose';
import Dashboard from '../models/Dashboard.js';
import 'dotenv/config';

/**
 * Fix Dashboard Index Issue
 * 
 * Problem: Old index "userId_1" exists but model uses "educatorId"
 * Solution: 
 * 1. Drop old "userId_1" index
 * 2. Delete documents with null educatorId
 * 3. Recreate proper indexes
 */

const fixDashboardIndex = async () => {
  try {
    console.log('🔧 Starting Dashboard index fix...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('dashboards');

    // 1. Get all indexes
    console.log('\n📋 Current indexes:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)}: ${index.name}`);
    });

    // 2. Drop old userId_1 index if exists
    try {
      await collection.dropIndex('userId_1');
      console.log('\n✅ Dropped old "userId_1" index');
    } catch (err) {
      if (err.code === 27 || err.codeName === 'IndexNotFound') {
        console.log('\n⚠️  "userId_1" index not found (already dropped or never existed)');
      } else {
        throw err;
      }
    }

    // 2.5. Drop ALL indexes except _id (force clean)
    console.log('\n🔧 Dropping all indexes except _id...');
    const allIndexes = await collection.indexes();
    for (const index of allIndexes) {
      if (index.name !== '_id_') {
        try {
          await collection.dropIndex(index.name);
          console.log(`  ✅ Dropped index: ${index.name}`);
        } catch (err) {
          console.log(`  ⚠️  Failed to drop ${index.name}:`, err.message);
        }
      }
    }

    // 3. Delete documents with null educatorId
    const deleteResult = await collection.deleteMany({ 
      $or: [
        { educatorId: null },
        { educatorId: { $exists: false } }
      ]
    });
    console.log(`\n🗑️  Deleted ${deleteResult.deletedCount} documents with null educatorId`);

    // 4. Find duplicate educatorIds
    const duplicates = await collection.aggregate([
      {
        $group: {
          _id: '$educatorId',
          count: { $sum: 1 },
          ids: { $push: '$_id' }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]).toArray();

    if (duplicates.length > 0) {
      console.log(`\n⚠️  Found ${duplicates.length} duplicate educatorIds:`);
      for (const dup of duplicates) {
        console.log(`  - educatorId: ${dup._id}, count: ${dup.count}`);
        
        // Keep the most recent one, delete others
        const idsToDelete = dup.ids.slice(0, -1); // Keep last one
        await collection.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`    ✅ Deleted ${idsToDelete.length} duplicate(s), kept newest`);
      }
    } else {
      console.log('\n✅ No duplicate educatorIds found');
    }

    // 5. Recreate indexes using Mongoose
    await Dashboard.syncIndexes();
    console.log('\n✅ Recreated proper indexes');

    // 6. Verify new indexes
    console.log('\n📋 Updated indexes:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(index => {
      console.log(`  - ${JSON.stringify(index.key)}: ${index.name}`);
    });

    // 7. Count remaining documents
    const count = await collection.countDocuments();
    console.log(`\n📊 Total dashboard documents: ${count}`);

    console.log('\n🎉 Dashboard index fix completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error fixing dashboard index:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the fix
fixDashboardIndex();
