import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/mongodb.js';
import { clerkWebhooks,stripeWebhooks } from './controllers/webhooks.js';
import educatorRouter from './routes/educatorRoutes.js';
import { clerkMiddleware } from '@clerk/express';
import connectCloudinary from './configs/cloundinary.js';
import courseRouter from './routes/courseRoute.js';
import userRouter from './routes/userRoutes.js';
import quizRouter from './routes/quizRoutes.js';
import adminRouter from './routes/adminRoutes.js';
//Initialize Express
const app = express();
//Connecet to MongoDB
await connectDB();
await connectCloudinary()
//Middleware
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(clerkMiddleware());
//Routes
app.get('/', (req, res) => res.send('API is running...'));
app.post('/clerk', express.json() , clerkWebhooks)
app.use('/api/educator', express.json(), educatorRouter);
app.use('/api/course', express.json(), courseRouter)
app.use('/api/user', express.json(), userRouter);
app.use('/api/quiz', express.json(), quizRouter);
app.use('/api/admin', express.json(), adminRouter);
app.post('/stripe',express.raw({type: 'application/json'}),  stripeWebhooks)
//Port
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
//Export app for testing or further usage

export default app;