import { v4 as uuidv4 } from 'uuid';
import { Task } from '../types';
import { Database } from '../db/database';
import { SyncService } from './syncService';

export class TaskService {

  private syncService: SyncService;

  constructor(private db: Database) {
    this.syncService = new SyncService(db, this);
  }

  async createTask(taskData: Partial<Task>): Promise<Task> {
    const id = uuidv4();
    const now = new Date().toISOString();

    const task: Task = {
      id,
      title: taskData.title!,
      description: taskData.description || '',
      completed: false,
      created_at: new Date(now),
      updated_at: new Date(now),
      is_deleted: false,
      sync_status: 'pending',
    };

    const sql = `
      INSERT INTO tasks 
      (id, title, description, completed, created_at, updated_at, is_deleted, sync_status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await this.db.run(sql, [
      task.id,
      task.title,
      task.description,
      task.completed ? 1 : 0,
      task.created_at.toISOString(),
      task.updated_at.toISOString(),
      task.is_deleted ? 1 : 0,
      task.sync_status,
    ]);

    await this.syncService.addToSyncQueue(task.id, 'create', task);

    return task;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const task = await this.getTask(id);
    if (!task) return null;

    const updatedAt = new Date();
    const newTask: Task = { 
      ...task, 
      ...updates, 
      updated_at: updatedAt, 
      sync_status: 'pending' 
    };

    const sql = `
      UPDATE tasks 
      SET title=?, description=?, completed=?, updated_at=?, is_deleted=?, sync_status=? 
      WHERE id=?
    `;
    
    await this.db.run(sql, [
      newTask.title,
      newTask.description,
      newTask.completed ? 1 : 0,
      updatedAt.toISOString(),
      newTask.is_deleted ? 1 : 0,
      newTask.sync_status,
      id,
    ]);

    await this.syncService.addToSyncQueue(id, 'update', updates);

    return newTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    const task = await this.getTask(id);
    if (!task) return false;

    const updated_at = new Date().toISOString();

    await this.db.run(
      'UPDATE tasks SET is_deleted=1, updated_at=?, sync_status=? WHERE id=?',
      [updated_at, 'pending', id]
    );

    await this.syncService.addToSyncQueue(id, 'delete', { ...task, is_deleted: true });

    return true;
  }

  async getTask(id: string): Promise<Task | null> {
    const row = await this.db.get('SELECT * FROM tasks WHERE id=?', [id]);
    if (!row || row.is_deleted) return null;

    return this.mapRowToTask(row);
  }

  async getAllTasks(): Promise<Task[]> {
    const rows = await this.db.all('SELECT * FROM tasks WHERE is_deleted=0');
    return rows.map(this.mapRowToTask);
  }

  async getTasksNeedingSync(): Promise<Task[]> {
    const rows = await this.db.all(
      'SELECT * FROM tasks WHERE sync_status IN (\'pending\', \'error\')'
    );
    return rows.map(this.mapRowToTask);
  }

  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      completed: !!row.completed,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      is_deleted: !!row.is_deleted,
      sync_status: row.sync_status,
      server_id: row.server_id,
      last_synced_at: row.last_synced_at ? new Date(row.last_synced_at) : undefined,
    };
  }
}