const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const ApiResponse = require('../utils/response');
const config = require('../config/appConfig');


// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = config.uploadDir;

    // Create subdirectories based on file type
    if (file.fieldname.includes('license')) {
      uploadPath = path.join(config.uploadDir, 'licenses');
    } else if (file.fieldname.includes('registration')) {
      uploadPath = path.join(config.uploadDir, 'registrations');
    } else if (file.fieldname.includes('profile')) {
      uploadPath = path.join(config.uploadDir, 'profiles');
    }

    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    const filename = `${uniqueId}${extension}`;
    cb(null, filename);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/jpg': 'jpg',
    'application/pdf': 'pdf'
  };

  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: config.maxFileSize, // 5MB
    files: 5 // Maximum 5 files
  },
  fileFilter: fileFilter
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return ApiResponse.error(res, 'File too large. Maximum size is 5MB', 400);
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return ApiResponse.error(res, 'Too many files. Maximum 5 files allowed', 400);
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return ApiResponse.error(res, 'Unexpected file field', 400);
    }
  }

  if (err.message === 'Invalid file type. Only JPEG, PNG and PDF files are allowed') {
    return ApiResponse.error(res, err.message, 400);
  }

  next(err);
};

// Upload middlewares for different purposes
const uploadDriverDocs = upload.fields([
  { name: 'driverLicense', maxCount: 1 },
  { name: 'vehicleRegistration', maxCount: 1 },
  { name: 'vehicleInsurance', maxCount: 1 }
]);

const uploadProfilePicture = upload.single('profilePicture');

const uploadMultiple = upload.array('files', 5);

module.exports = {
  uploadDriverDocs,
  uploadProfilePicture,
  uploadMultiple,
  handleUploadError
};
