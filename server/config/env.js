import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/drivex',
  NODE_ENV: process.env.NODE_ENV || 'development',
  REPLICATION_FACTOR: parseInt(process.env.REPLICATION_FACTOR || '2'),
  UPLOAD_DIR: process.env.UPLOAD_DIR || './storage',
};