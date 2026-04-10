import cron from 'node-cron';
import { File } from '../models/File.model.js';
import { deleteFileFromNodes } from './coordinator.service.js';
import { eventBus, EVENT_TYPES } from './eventBus.service.js';

export const startCronJobs = () => {
  // Run daily at midnight: '0 0 * * *'
  cron.schedule('0 0 * * *', async () => {
    console.log('⏰ Running daily recycle bin cleanup...');
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find files deleted more than 30 days ago
      const expiredFiles = await File.find({
        isDeleted: true,
        deletedAt: { $lte: thirtyDaysAgo },
      });

      if (expiredFiles.length === 0) {
        console.log('🧹 No expired trash files to delete.');
        return;
      }

      console.log(`🗑️ Found ${expiredFiles.length} expired files. Deleting permanently...`);
      for (const file of expiredFiles) {
        try {
          await deleteFileFromNodes(file.fileId);
          eventBus.emit(EVENT_TYPES.FILE_DELETED, { fileId: file.fileId });
          console.log(`✅ Permanently deleted: ${file.originalName}`);
        } catch (err) {
          console.error(`❌ Failed to permanently delete ${file.originalName}:`, err.message);
        }
      }
    } catch (err) {
      console.error('❌ Error during recycle bin cleanup:', err.message);
    }
  });

  console.log('🕒 Cron jobs initialized.');
};
