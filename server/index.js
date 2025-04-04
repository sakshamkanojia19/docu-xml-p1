
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser')
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const verifyToken = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');


dotenv.config();


const app = express();

const PORT = process.env.PORT;

// Middleware
// app.use(cors({
//   origin: 'https://docu-xml.vercel.app', 
//   credentials: true, 
// }));
// app.options('*', cors()); 
app.use(cors());
app.use(express.json());
app.use(cookieParser());


mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => {
    logger.error(`Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', verifyToken, fileRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('DocuXML API is running!');
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server is running on http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  logger.error(err.stack);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});
