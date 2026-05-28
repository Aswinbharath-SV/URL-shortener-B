import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import urlRoutes from './routes/urlRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import redirectRoutes from './routes/redirectRoutes.js';
import workspaceRoutes from './routes/workspaceRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { initSocket } from './utils/socket.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Security HTTP Headers Configuration
app.use(helmet({
  contentSecurityPolicy: false, // Turn off CSP for easy local resources/images
}));

// CORS Configuration (Dynamically allows any local/development origin)
const corsOptions = {
  origin: (origin, callback) => {
    callback(null, true);
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Dynamic base landing endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Premium URL Shortener & Analytics API is fully operational.',
    version: '1.0.0'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/r', redirectRoutes); // shortcode base path e.g. http://localhost:5000/r/xyz

// 404 and Error Handler Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const httpServer = createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
