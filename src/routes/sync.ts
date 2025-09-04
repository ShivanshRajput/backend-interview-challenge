import { Router, Request, Response } from 'express';
import { SyncService } from '../services/syncService';
import { TaskService } from '../services/taskService';
import { Database } from '../db/database';

export function createSyncRouter(db: Database): Router {
  const router = Router();
  const taskService = new TaskService(db);
  const syncService = new SyncService(db, taskService);

  // Trigger manual sync
  router.post('/sync', async (_req: Request, res: Response) => {
    try {
      if (!(await syncService.checkConnectivity())) {
        return res.status(503).json({ error: 'Server not reachable' });
      }
      const result = await syncService.sync();
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ error: 'Sync failed' });
    }
  });

  // Check sync status
  router.get('/status', async (_req: Request, res: Response) => {
    try {
      const tasks = await taskService.getTasksNeedingSync();
      const last = await db.get('SELECT MAX(last_synced_at) as last FROM tasks');
      const connectivity = await syncService.checkConnectivity();
  
      return res.json({
        pending: tasks.length,
        last_sync: last?.last || null,
        server_online: connectivity,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to get sync status' });
    }
  });

  // Batch sync endpoint (for server-side)
  router.post('/batch', async (_req: Request, res: Response) => {
    // TODO: Implement batch sync endpoint
    // This would be implemented on the server side
    // to handle batch sync requests from clients
    return res.status(501).json({ error: 'Not implemented' });
  });

  // Health check endpoint
  router.get('/health', async (_req: Request, res: Response) => {
    return res.json({ status: 'ok', timestamp: new Date() });
  });

  return router;
}