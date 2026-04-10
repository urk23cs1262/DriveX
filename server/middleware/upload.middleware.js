import multer from 'multer';

/**
 * Multer config — store file in memory as Buffer
 * so coordinator can replicate it to multiple nodes
 */
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Allow all file types — restrict here if needed
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB max
  },
});