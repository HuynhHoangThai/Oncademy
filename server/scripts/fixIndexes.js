import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import mongoose from 'mongoose';
import { CourseProgress } from '../models/CourseProgress.js';

// Load .env from server directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

/**
 * One-time script to fix duplicate index warnings
 * Run from root: node server/scripts/fixIndexes.js
 */

const fixIndexes = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI not found in environment variables');
        }
        
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');
        
        console.log('\n=== Fixing CourseProgress Indexes ===');
        
        // Show current indexes
        const currentIndexes = await CourseProgress.collection.indexes();
        console.log('\nCurrent indexes:');
        currentIndexes.forEach(idx => {
            console.log(`- ${idx.name}:`, Object.keys(idx.key));
        });
        
        // Drop all indexes except _id
        console.log('\nDropping all indexes except _id...');
        await CourseProgress.collection.dropIndexes();
        console.log('✅ Indexes dropped');
        
        // Recreate indexes from schema
        console.log('\nRecreating indexes from schema...');
        await CourseProgress.syncIndexes();
        console.log('✅ Indexes recreated');
        
        // Show new indexes
        const newIndexes = await CourseProgress.collection.indexes();
        console.log('\nNew indexes:');
        newIndexes.forEach(idx => {
            console.log(`- ${idx.name}:`, Object.keys(idx.key));
        });
        
        console.log('\n✅ Index fix complete! Duplicate warning should be gone.');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
        process.exit(0);
    }
};

fixIndexes();
