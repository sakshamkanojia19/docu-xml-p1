
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const { convertPdfToXml } = require('../utils/pdfToXml');
const logger = require('../utils/logger');
const router = express.Router();

// Set up storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const userDir = path.join(__dirname, '../uploads', req.user.id.toString());
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }
    
    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Only accept PDFs
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'), false);
  }
};

// Set up multer with error handling
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter
}).single('file');

// Custom multer error handling middleware
const handleUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File is too large. Maximum size is 10MB.'
        });
      }
      if (err.message === 'Only PDF files are allowed') {
        return res.status(400).json({
          success: false,
          message: 'Invalid file type. Only PDF files are allowed.'
        });
      }
      logger.error(`File upload error: ${err.message}`);
      return res.status(400).json({
        success: false,
        message: `File upload failed: ${err.message}`
      });
    }
    next();
  });
};

// @route   POST /api/files/upload
// @desc    Upload a file
// @access  Private
router.post('/upload', handleUpload, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    logger.info(`File uploaded: ${req.file.originalname} by user ${req.user.id}`);

    // Create new file document
    const file = await File.create({
      fileName: req.file.filename,
      originalFileName: req.file.originalname,
      fileSize: formatFileSize(req.file.size),
      filePath: req.file.path,
      status: 'processing',
      user: req.user.id
    });

    // Start PDF to XML conversion process asynchronously
    processFile(file._id, req.file.path);

    res.status(201).json({
      success: true,
      file: {
        id: file._id,
        fileName: file.originalFileName,
        fileSize: file.fileSize,
        createdAt: file.createdAt,
        status: file.status
      }
    });
  } catch (error) {
    logger.error(`Error in file upload: ${error.message}`);
    next(error);
  }
});

// Function to process the PDF file asynchronously
async function processFile(fileId, filePath) {
  try {
    logger.info(`Starting PDF to XML conversion for file ID: ${fileId}`);
    
    // Perform the actual conversion
    const xmlOutput = await convertPdfToXml(filePath);
    
    // Update the file record with successful conversion
    await File.findByIdAndUpdate(fileId, { 
      status: 'completed',
      xmlOutput: xmlOutput,
      processedAt: new Date()
    });
    
    logger.info(`Successfully converted file ID: ${fileId} to XML`);
  } catch (error) {
    logger.error(`Error converting file ID: ${fileId} to XML: ${error.message}`);
    
    // Update the file record with error details
    await File.findByIdAndUpdate(fileId, {
      status: 'failed',
      error: {
        message: error.message,
        stack: error.stack,
        timestamp: new Date()
      },
      processedAt: new Date()
    });
  }
}

// @route   GET /api/files
// @desc    Get all files for a user
// @access  Private
router.get('/', async (req, res, next) => {
  try {
    const files = await File.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: files.length,
      files: files.map(file => ({
        id: file._id,
        fileName: file.originalFileName,
        fileSize: file.fileSize,
        createdAt: file.createdAt,
        status: file.status,
        processedAt: file.processedAt
      }))
    });
  } catch (error) {
    logger.error(`Error retrieving files: ${error.message}`);
    next(error);
  }
});

// @route   GET /api/files/:id
// @desc    Get file by ID
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    
    // Check if file exists
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Check if file belongs to user
    if (file.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this file'
      });
    }
    
    res.status(200).json({
      success: true,
      file: {
        id: file._id,
        fileName: file.originalFileName,
        fileSize: file.fileSize,
        createdAt: file.createdAt,
        status: file.status,
        xmlOutput: file.xmlOutput,
        processedAt: file.processedAt,
        error: file.status === 'failed' ? file.error : undefined
      }
    });
  } catch (error) {
    logger.error(`Error retrieving file details: ${error.message}`);
    next(error);
  }
});

// @route   DELETE /api/files/:id
// @desc    Delete file by ID
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    
    // Check if file exists
    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }
    
    // Check if file belongs to user
    if (file.user.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this file'
      });
    }
    
    // Delete the file from the filesystem
    try {
      fs.unlinkSync(file.filePath);
      logger.info(`Deleted file from filesystem: ${file.filePath}`);
    } catch (error) {
      logger.warn(`Could not delete file from filesystem: ${error.message}`);
      // Continue with deletion from database even if file system delete fails
    }
    
    // Delete the file document from the database
    await File.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting file: ${error.message}`);
    next(error);
  }
});

// Format file size
const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else return (bytes / 1048576).toFixed(1) + ' MB';
};

module.exports = router;
