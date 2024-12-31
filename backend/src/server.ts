import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import sendEmailRoutes from './routes/sendEmail'; // Import the email sending route
import statusRoutes from './routes/status'; // Import the new route


dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(cors({
  origin: ['http://nomadmee.com'], // Replace with your frontend's domain
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Add allowed HTTP methods
  credentials: true, // If you're using cookies
}));
app.options('*', cors({ origin: 'http://nomadmeshop.com', credentials: true }));

app.use(bodyParser.json());

// Routes
app.use('/api/sendEmail', sendEmailRoutes); // Set up the route for sending emails
app.use('/api/status', statusRoutes); // Set up the status route


// Server Listening
const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
