import { CourseProgress } from '../models/CourseProgress.js';

/**
 * Sync database indexes - drop old indexes and recreate from schema
 * Run this once to fix duplicate index warnings
 */
export const syncCourseProgressIndexes = async () => {
    try {
        console.log('Syncing CourseProgress indexes...');
        
        // Drop all indexes except _id
        await CourseProgress.collection.dropIndexes();
        console.log('Dropped all CourseProgress indexes');
        
        // Recreate indexes from schema
        await CourseProgress.syncIndexes();
        console.log('Recreated CourseProgress indexes from schema');
        
        // List current indexes
        const indexes = await CourseProgress.collection.indexes();
        console.log('Current indexes:', indexes);
        
    } catch (error) {
        console.error('Error syncing indexes:', error.message);
    }
};
