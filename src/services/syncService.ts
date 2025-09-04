import axios from 'axios';
import { Task, SyncQueueItem, SyncResult, BatchSyncRequest, BatchSyncResponse } from '../types';
import { Database } from '../db/database';
import { TaskService } from './taskService';
import { v4 as uuidv4 } from 'uuid';

export class SyncService {
  private apiUrl: string;
  private BATCH_SIZE = parseInt(process.env.SYNC_BATCH_SIZE || '10', 10);
  private MAX_RETRIES = 3;
  
  constructor(
    private db: Database,
    private taskService: TaskService,
    apiUrl: string = process.env.API_BASE_URL || 'http://localhost:3000/api'
  ) {
    this.apiUrl = apiUrl;
  }

  async sync(): Promise<SyncResult> {
    const items: SyncQueueItem[] = await this.db.all('SELECT * FROM sync_queue ORDER BY created_at ASC');

    const batches: SyncQueueItem[][] = [];
    for (let i = 0; i < items.length; i += this.BATCH_SIZE) {
      batches.push(items.slice(i, i + this.BATCH_SIZE));
    }

    let synced = 0, failed = 0;
    const errors: any[] = [];

    for (const batch of batches) {
      try {
        const response = await this.processBatch(batch);

        for (const item of response.processed_items) {
          if (item.status === 'success') {
            synced++;
            await this.updateSyncStatus(item.client_id, 'synced', item.resolved_data);
          } else if (item.status === 'conflict' && item.resolved_data) {
            await this.taskService.updateTask(item.client_id, item.resolved_data);
            synced++;
          } else {
            failed++;
            errors.push({ task_id: item.client_id, operation: 'unknown', error: item.error || 'sync failed', timestamp: new Date() });
          }
        }
      } catch (err: any) {
        failed += batch.length;
        for (const it of batch) {
          errors.push({ task_id: it.task_id, operation: it.operation, error: err.message, timestamp: new Date() });
          await this.handleSyncError(it, err);
        }
      }
    }

    return { success: failed === 0, synced_items: synced, failed_items: failed, errors };
  }

  async addToSyncQueue(taskId: string, operation: 'create' | 'update' | 'delete', data: Partial<Task>): Promise<void> {
    const id = uuidv4();
    const sql = `
      INSERT INTO sync_queue (id, task_id, operation, data) 
      VALUES (?, ?, ?, ?)
    `;
    await this.db.run(sql, [id, taskId, operation, JSON.stringify(data)]);
  }

  private async processBatch(items: SyncQueueItem[]): Promise<BatchSyncResponse> {
    const req: BatchSyncRequest = {
      items,
      client_timestamp: new Date()
    };

    const { data } = await axios.post<BatchSyncResponse>(`${this.apiUrl}/sync/batch`, req);
    return data;
  }

  // private async resolveConflict(localTask: Task, serverTask: Task): Promise<Task> {
  //   return localTask.updated_at > serverTask.updated_at ? localTask : serverTask;

  // }

  private async updateSyncStatus(taskId: string, status: 'synced' | 'error', serverData?: Partial<Task>): Promise<void> {
    const now = new Date().toISOString();

    let sql = 'UPDATE tasks SET sync_status=?, last_synced_at=?';
    const params: any[] = [status, now];

    if (serverData?.id) {
      sql += ', server_id=?';
      params.push(serverData.id);
    }

    sql += ' WHERE id=?';
    params.push(taskId);

    await this.db.run(sql, params);

    if (status === 'synced') {
      await this.db.run('DELETE FROM sync_queue WHERE task_id=?', [taskId]);
    }
  }

  private async handleSyncError(item: SyncQueueItem, error: Error): Promise<void> {
    const newRetryCount = item.retry_count + 1;
    await this.db.run(
      'UPDATE sync_queue SET retry_count=?, error_message=? WHERE id=?',
      [newRetryCount, error.message, item.id]
    );

    if (newRetryCount >= this.MAX_RETRIES) {
      await this.updateSyncStatus(item.task_id, 'error');
    }
  }

  async checkConnectivity(): Promise<boolean> {
    try {
      await axios.get(`${this.apiUrl}/health`, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}