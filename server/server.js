import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/mongodb.js';
import { clerkWebhooks } from './controllers/webhooks.js';
import educatorRouter from './routes/educatorRoutes.js';
import { clerkMiddleware } from '@clerk/express';
import connectCloudinary from './configs/cloundinary.js';
import courseRouter from './routes/courseRoute.js';
import userRouter from './routes/userRoutes.js';
//Initialize Express
const app = express();
//Connecet to MongoDB
await connectDB();
await connectCloudinary
//Middleware
app.use(cors());
app.use(clerkMiddleware());
//Routes
app.get('/', (req, res) => res.send('API is running...'));
app.post('/clerk', express.json() , clerkWebhooks)
app.use('/api/educator', express.json(), educatorRouter);
app.use('/api/course', express.json(), courseRouter)
app.use('/api/user', express.json(), userRouter);

//Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//Export app for testing or further usage

export default app;