import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/mongodb.js';
import { clerkWebhooks } from './controllers/webhooks.js';
//Initialize Express
const app = express();
//Connecet to MongoDB

await connectDB();
//Middleware
app.use(cors());
//Routes
app.get('/', (req, res) => res.send('API is running...'));
app.post('/clerk', express.json() , clerkWebhooks)
//Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//Export app for testing or further usage

export default app;