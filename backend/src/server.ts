import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import sendEmailRoutes from './routes/sendEmail';
import statusRoutes from './routes/status';
import portalRoutes from './routes/portal';
import { connectMongo } from './config/mongoose';

const app = express();

// Middleware for CORS to allow all origins
const corsOptions = {
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Allow cookies or auth headers
};

// Use CORS middleware
app.use(cors(corsOptions));

// Middleware for parsing requests
app.use(bodyParser.json());

// Handle preflight requests (OPTIONS)
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*'); // Allow all origins in preflight response
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200); // Respond with OK
});

// Routes
app.use('/api/sendEmail', sendEmailRoutes);
app.use('/api/status', statusRoutes);
app.use('/api/portal', portalRoutes);

async function startServer(): Promise<void> {
  await connectMongo();

  const port = process.env.PORT || 8000;
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

void startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
