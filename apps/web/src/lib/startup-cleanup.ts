import { prisma } from './db';
import { getCleanupService } from './notification-cleanup';

/**
 * Startup cleanup service
 * Runs automatic cleanup when the app starts
 */

let startupCleanupDone = false;

export async function runStartupCleanup(): Promise<void> {
  if (startupCleanupDone) {
    return;
  }

  try {
    console.log('🚀 Running startup notification cleanup...');
    
    const cleanupService = getCleanupService(prisma);
    const result = await cleanupService.smartCleanup();
    
    if (result.skipped) {
      console.log('⏭️ Startup cleanup skipped - ran recently');
    } else {
      console.log(`✅ Startup cleanup completed! Deleted ${result.deleted} old notifications`);
    }
    
    startupCleanupDone = true;
  } catch (error) {
    console.error('❌ Startup cleanup failed:', error);
    // Don't throw - this shouldn't break app startup
  }
}

// Auto-run cleanup on module load (for serverless environments)
if (typeof window === 'undefined') {
  // Only run on server side
  runStartupCleanup().catch(console.error);
}
