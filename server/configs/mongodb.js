import mongoose from "mongoose";

// Suppress duplicate index warnings
mongoose.set('strictQuery', false);

// Connect to the MongoDB database
const connectDB = async () => {

    mongoose.connection.on('connected', () => console.log('Database Connected'))

    await mongoose.connect(process.env.MONGODB_URI, {
        // Suppress duplicate index warnings in development
        autoIndex: true
    })

}

export default connectDB