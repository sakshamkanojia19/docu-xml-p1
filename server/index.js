
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const dotenv = require('dotenv');
// const authRoutes = require('./routes/auth');
// const fileRoutes = require('./routes/files');
// const verifyToken = require('./middleware/auth');
// const { notFound, errorHandler } = require('./middleware/errorHandler');
// const logger = require('./utils/logger');

// // Load environment variables
// dotenv.config();

// // Create Express app
// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Connect to MongoDB
// mongoose.connect(process.env.MONGODB_URI)
//   .then(() => logger.info('Connected to MongoDB'))
//   .catch(err => {
//     logger.error(`Failed to connect to MongoDB: ${err.message}`);
//     process.exit(1);
//   });

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/files', verifyToken, fileRoutes);

// // Basic route
// app.get('/', (req, res) => {
//   res.send('DocuXML API is running!');
// });

// // Error handling middleware
// app.use(notFound);
// app.use(errorHandler);

// // Start server
// const PORT = process.env.PORT;
// app.listen(PORT, () => {
//   logger.info(`Server is running on ${PORT}`);
// });

// // Handle unhandled promise rejections
// process.on('unhandledRejection', (err) => {
//   logger.error(`Unhandled Rejection: ${err.message}`);
//   logger.error(err.stack);
// });

// // Handle uncaught exceptions
// process.on('uncaughtException', (err) => {
//   logger.error(`Uncaught Exception: ${err.message}`);
//   logger.error(err.stack);
//   process.exit(1);
// });


const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth');
const fileRoutes = require('./routes/files');
const verifyToken = require('./middleware/auth');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const logger = require('./utils/logger');

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Validate environment variables
if (!process.env.MONGODB_URI) {
  throw new Error("Missing MONGODB_URI in environment variables");
}
if (!process.env.JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment variables");
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('✅ Connected to MongoDB'))
  .catch(err => {
    logger.error(`❌ Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', verifyToken, fileRoutes);

// Basic route
app.get('/', (req, res) => {
  res.send('🚀 DocuXML API is running!');
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Export app for Vercel
module.exports = app;

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error(`❌ Unhandled Rejection: ${err.message}`);
  logger.error(err.stack);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error(`❌ Uncaught Exception: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});
