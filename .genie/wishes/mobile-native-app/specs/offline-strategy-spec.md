# Offline Strategy & Sync Implementation

**Purpose:** Complete offline-first architecture for mobile app  
**Status:** 📋 Planning Complete  
**Last Updated:** 2025-11-11

---

## Table of Contents

1. [Overview](#overview)
2. [Storage Architecture](#storage-architecture)
3. [Offline Queue System](#offline-queue-system)
4. [Sync Strategy](#sync-strategy)
5. [Conflict Resolution](#conflict-resolution)
6. [Implementation Details](#implementation-details)
7. [Testing Strategy](#testing-strategy)

---

## 1. Overview

### 1.1 Goals

- **Core features work offline** - Tasks, conversations, diffs viewable without internet
- **Queue actions** - User actions queued and synced when online
- **Optimistic updates** - UI updates immediately, syncs in background
- **Conflict resolution** - Handle conflicts when syncing
- **Minimal data loss** - Persist everything locally first

### 1.2 Offline Capabilities

| Feature | Offline Support | Notes |
|---------|----------------|-------|
| **View Tasks** | ✅ Full | Cached in IndexedDB |
| **View Conversations** | ✅ Full | Cached with pagination |
| **View Diffs** | ✅ Full | Cached per attempt |
| **Create Task** | ✅ Queued | Synced when online |
| **Send Follow-up** | ✅ Queued | Synced when online |
| **Edit Task** | ✅ Queued | Synced when online |
| **Delete Task** | ✅ Queued | Synced when online |
| **Start Attempt** | ❌ Requires online | Needs backend executor |
| **View Preview** | ❌ Requires online | Needs dev server |
| **GitHub Operations** | ❌ Requires online | Needs GitHub API |

### 1.3 Architecture Diagram

```
┌─────────────────────────────────────────┐
│           React Components              │
│  (Tasks, Chat, Diffs, etc.)            │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         Offline Manager                 │
│  - Check network status                 │
│  - Route to cache or API                │
│  - Queue offline actions                │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│  IndexedDB   │    │   API Client │
│   (Cache)    │    │  (Network)   │
└──────────────┘    └──────────────┘
        │                   │
        └─────────┬─────────┘
                  ▼
        ┌──────────────────┐
        │  Sync Manager    │
        │  - Sync on online│
        │  - Retry failed  │
        │  - Resolve       │
        └──────────────────┘
```

---

## 2. Storage Architecture

### 2.1 IndexedDB Schema

**Database:** `forge-mobile-db`  
**Version:** 1

**Object Stores:**

```typescript
interface ForgeDatabase {
  // Core entities
  projects: Project[];
  tasks: Task[];
  taskAttempts: TaskAttempt[];
  executionProcesses: ExecutionProcess[];
  
  // Conversation data
  conversationEntries: ConversationEntry[];
  
  // Diffs
  diffs: Diff[];
  
  // User config
  config: Config;
  
  // Offline queue
  offlineQueue: QueuedAction[];
  
  // Sync metadata
  syncMetadata: SyncMetadata[];
}
```

### 2.2 IndexedDB Implementation

**File:** `frontend/src/lib/offline/db.ts`

```typescript
import { openDB, DBSchema, IDBPDatabase } from 'idb';

/**
 * Database schema
 */
interface ForgeDB extends DBSchema {
  projects: {
    key: string; // project ID
    value: Project;
    indexes: { 'by-updated': Date };
  };
  
  tasks: {
    key: string; // task ID
    value: Task;
    indexes: { 
      'by-project': string;
      'by-status': string;
      'by-updated': Date;
    };
  };
  
  taskAttempts: {
    key: string; // attempt ID
    value: TaskAttempt;
    indexes: { 
      'by-task': string;
      'by-updated': Date;
    };
  };
  
  conversationEntries: {
    key: string; // entry ID
    value: ConversationEntry;
    indexes: { 
      'by-attempt': string;
      'by-timestamp': Date;
    };
  };
  
  diffs: {
    key: string; // diff ID (attemptId)
    value: Diff[];
    indexes: { 'by-attempt': string };
  };
  
  config: {
    key: string; // 'user-config'
    value: Config;
  };
  
  offlineQueue: {
    key: string; // action ID
    value: QueuedAction;
    indexes: { 
      'by-timestamp': Date;
      'by-status': string;
    };
  };
  
  syncMetadata: {
    key: string; // entity type
    value: SyncMetadata;
  };
}

/**
 * Queued action
 */
interface QueuedAction {
  id: string;
  type: 'create-task' | 'update-task' | 'delete-task' | 'send-follow-up';
  payload: any;
  timestamp: Date;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
  retryCount: number;
  error?: string;
}

/**
 * Sync metadata
 */
interface SyncMetadata {
  entityType: string;
  lastSyncTime: Date;
  syncVersion: number;
}

/**
 * Database manager
 */
export class DatabaseManager {
  private static db: IDBPDatabase<ForgeDB> | null = null;

  /**
   * Initialize database
   */
  static async initialize(): Promise<void> {
    this.db = await openDB<ForgeDB>('forge-mobile-db', 1, {
      upgrade(db) {
        // Projects
        const projectsStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectsStore.createIndex('by-updated', 'updated_at');

        // Tasks
        const tasksStore = db.createObjectStore('tasks', { keyPath: 'id' });
        tasksStore.createIndex('by-project', 'project_id');
        tasksStore.createIndex('by-status', 'status');
        tasksStore.createIndex('by-updated', 'updated_at');

        // Task Attempts
        const attemptsStore = db.createObjectStore('taskAttempts', { keyPath: 'id' });
        attemptsStore.createIndex('by-task', 'task_id');
        attemptsStore.createIndex('by-updated', 'updated_at');

        // Conversation Entries
        const entriesStore = db.createObjectStore('conversationEntries', { keyPath: 'id' });
        entriesStore.createIndex('by-attempt', 'attempt_id');
        entriesStore.createIndex('by-timestamp', 'timestamp');

        // Diffs
        const diffsStore = db.createObjectStore('diffs', { keyPath: 'attempt_id' });
        diffsStore.createIndex('by-attempt', 'attempt_id');

        // Config
        db.createObjectStore('config', { keyPath: 'key' });

        // Offline Queue
        const queueStore = db.createObjectStore('offlineQueue', { keyPath: 'id' });
        queueStore.createIndex('by-timestamp', 'timestamp');
        queueStore.createIndex('by-status', 'status');

        // Sync Metadata
        db.createObjectStore('syncMetadata', { keyPath: 'entityType' });
      }
    });
  }

  /**
   * Get database instance
   */
  private static getDB(): IDBPDatabase<ForgeDB> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    return this.db;
  }

  // Projects
  static async getProjects(): Promise<Project[]> {
    return await this.getDB().getAll('projects');
  }

  static async getProject(id: string): Promise<Project | undefined> {
    return await this.getDB().get('projects', id);
  }

  static async saveProject(project: Project): Promise<void> {
    await this.getDB().put('projects', project);
  }

  static async deleteProject(id: string): Promise<void> {
    await this.getDB().delete('projects', id);
  }

  // Tasks
  static async getTasks(projectId: string): Promise<Task[]> {
    const index = this.getDB().transaction('tasks').store.index('by-project');
    return await index.getAll(projectId);
  }

  static async getTask(id: string): Promise<Task | undefined> {
    return await this.getDB().get('tasks', id);
  }

  static async saveTask(task: Task): Promise<void> {
    await this.getDB().put('tasks', task);
  }

  static async deleteTask(id: string): Promise<void> {
    await this.getDB().delete('tasks', id);
  }

  // Task Attempts
  static async getTaskAttempts(taskId: string): Promise<TaskAttempt[]> {
    const index = this.getDB().transaction('taskAttempts').store.index('by-task');
    return await index.getAll(taskId);
  }

  static async getTaskAttempt(id: string): Promise<TaskAttempt | undefined> {
    return await this.getDB().get('taskAttempts', id);
  }

  static async saveTaskAttempt(attempt: TaskAttempt): Promise<void> {
    await this.getDB().put('taskAttempts', attempt);
  }

  // Conversation Entries
  static async getConversationEntries(attemptId: string): Promise<ConversationEntry[]> {
    const index = this.getDB().transaction('conversationEntries').store.index('by-attempt');
    return await index.getAll(attemptId);
  }

  static async saveConversationEntry(entry: ConversationEntry): Promise<void> {
    await this.getDB().put('conversationEntries', entry);
  }

  static async saveConversationEntries(entries: ConversationEntry[]): Promise<void> {
    const tx = this.getDB().transaction('conversationEntries', 'readwrite');
    await Promise.all(entries.map(entry => tx.store.put(entry)));
    await tx.done;
  }

  // Diffs
  static async getDiffs(attemptId: string): Promise<Diff[] | undefined> {
    return await this.getDB().get('diffs', attemptId);
  }

  static async saveDiffs(attemptId: string, diffs: Diff[]): Promise<void> {
    await this.getDB().put('diffs', { attempt_id: attemptId, ...diffs });
  }

  // Config
  static async getConfig(): Promise<Config | undefined> {
    return await this.getDB().get('config', 'user-config');
  }

  static async saveConfig(config: Config): Promise<void> {
    await this.getDB().put('config', { key: 'user-config', ...config });
  }

  // Offline Queue
  static async queueAction(action: Omit<QueuedAction, 'id' | 'timestamp' | 'status' | 'retryCount'>): Promise<string> {
    const id = crypto.randomUUID();
    const queuedAction: QueuedAction = {
      id,
      ...action,
      timestamp: new Date(),
      status: 'pending',
      retryCount: 0
    };
    await this.getDB().put('offlineQueue', queuedAction);
    return id;
  }

  static async getPendingActions(): Promise<QueuedAction[]> {
    const index = this.getDB().transaction('offlineQueue').store.index('by-status');
    return await index.getAll('pending');
  }

  static async updateActionStatus(
    id: string, 
    status: QueuedAction['status'],
    error?: string
  ): Promise<void> {
    const action = await this.getDB().get('offlineQueue', id);
    if (action) {
      action.status = status;
      if (error) action.error = error;
      if (status === 'failed') action.retryCount++;
      await this.getDB().put('offlineQueue', action);
    }
  }

  static async deleteAction(id: string): Promise<void> {
    await this.getDB().delete('offlineQueue', id);
  }

  // Sync Metadata
  static async getSyncMetadata(entityType: string): Promise<SyncMetadata | undefined> {
    return await this.getDB().get('syncMetadata', entityType);
  }

  static async updateSyncMetadata(metadata: SyncMetadata): Promise<void> {
    await this.getDB().put('syncMetadata', metadata);
  }

  // Utility
  static async clear(): Promise<void> {
    const db = this.getDB();
    const storeNames = ['projects', 'tasks', 'taskAttempts', 'conversationEntries', 'diffs', 'offlineQueue'];
    
    for (const storeName of storeNames) {
      await db.clear(storeName as any);
    }
  }
}
```

---

## 3. Offline Queue System

### 3.1 Queue Manager

**File:** `frontend/src/lib/offline/queue.ts`

```typescript
import { DatabaseManager } from './db';
import { NetworkService } from '../native/network';
import { api } from '../api';

/**
 * Offline queue manager
 */
export class QueueManager {
  private static isProcessing = false;
  private static maxRetries = 3;

  /**
   * Initialize queue manager
   */
  static async initialize(): Promise<void> {
    // Listen for network changes
    NetworkService.onChange(async (status) => {
      if (status.connected && !this.isProcessing) {
        await this.processQueue();
      }
    });

    // Process queue on startup if online
    const status = await NetworkService.getStatus();
    if (status.connected) {
      await this.processQueue();
    }
  }

  /**
   * Queue an action
   */
  static async queueAction(
    type: QueuedAction['type'],
    payload: any
  ): Promise<string> {
    return await DatabaseManager.queueAction({ type, payload });
  }

  /**
   * Process queued actions
   */
  static async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;

    try {
      const actions = await DatabaseManager.getPendingActions();
      
      for (const action of actions) {
        // Skip if max retries exceeded
        if (action.retryCount >= this.maxRetries) {
          await DatabaseManager.updateActionStatus(
            action.id,
            'failed',
            'Max retries exceeded'
          );
          continue;
        }

        // Update status to syncing
        await DatabaseManager.updateActionStatus(action.id, 'syncing');

        try {
          // Execute action
          await this.executeAction(action);

          // Mark as completed
          await DatabaseManager.updateActionStatus(action.id, 'completed');

          // Delete completed action
          await DatabaseManager.deleteAction(action.id);
        } catch (error) {
          // Mark as failed
          await DatabaseManager.updateActionStatus(
            action.id,
            'failed',
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Execute a queued action
   */
  private static async executeAction(action: QueuedAction): Promise<void> {
    switch (action.type) {
      case 'create-task':
        await api.tasks.create(action.payload.projectId, action.payload.task);
        break;

      case 'update-task':
        await api.tasks.update(
          action.payload.projectId,
          action.payload.taskId,
          action.payload.updates
        );
        break;

      case 'delete-task':
        await api.tasks.delete(action.payload.projectId, action.payload.taskId);
        break;

      case 'send-follow-up':
        await api.attempts.followUp(
          action.payload.attemptId,
          action.payload.prompt,
          action.payload.options
        );
        break;

      default:
        throw new Error(`Unknown action type: ${(action as any).type}`);
    }
  }

  /**
   * Get queue status
   */
  static async getStatus(): Promise<{
    pending: number;
    failed: number;
  }> {
    const actions = await DatabaseManager.getPendingActions();
    const failed = actions.filter(a => a.status === 'failed').length;
    
    return {
      pending: actions.length - failed,
      failed
    };
  }

  /**
   * Retry failed actions
   */
  static async retryFailed(): Promise<void> {
    const actions = await DatabaseManager.getPendingActions();
    const failed = actions.filter(a => a.status === 'failed');

    for (const action of failed) {
      await DatabaseManager.updateActionStatus(action.id, 'pending');
    }

    await this.processQueue();
  }

  /**
   * Clear all queued actions
   */
  static async clearQueue(): Promise<void> {
    const actions = await DatabaseManager.getPendingActions();
    
    for (const action of actions) {
      await DatabaseManager.deleteAction(action.id);
    }
  }
}
```

---

## 4. Sync Strategy

### 4.1 Sync Manager

**File:** `frontend/src/lib/offline/sync.ts`

```typescript
import { DatabaseManager } from './db';
import { api } from '../api';

/**
 * Sync manager
 */
export class SyncManager {
  /**
   * Sync all data from server
   */
  static async syncAll(): Promise<void> {
    await Promise.all([
      this.syncProjects(),
      this.syncConfig()
    ]);
  }

  /**
   * Sync projects
   */
  static async syncProjects(): Promise<void> {
    try {
      const projects = await api.projects.list();
      
      for (const project of projects) {
        await DatabaseManager.saveProject(project);
      }

      await DatabaseManager.updateSyncMetadata({
        entityType: 'projects',
        lastSyncTime: new Date(),
        syncVersion: 1
      });
    } catch (error) {
      console.error('Failed to sync projects:', error);
    }
  }

  /**
   * Sync tasks for a project
   */
  static async syncTasks(projectId: string): Promise<void> {
    try {
      const tasks = await api.tasks.list(projectId);
      
      for (const task of tasks) {
        await DatabaseManager.saveTask(task);
      }

      await DatabaseManager.updateSyncMetadata({
        entityType: `tasks:${projectId}`,
        lastSyncTime: new Date(),
        syncVersion: 1
      });
    } catch (error) {
      console.error('Failed to sync tasks:', error);
    }
  }

  /**
   * Sync task attempts
   */
  static async syncTaskAttempts(taskId: string): Promise<void> {
    try {
      const attempts = await api.attempts.list(taskId);
      
      for (const attempt of attempts) {
        await DatabaseManager.saveTaskAttempt(attempt);
      }

      await DatabaseManager.updateSyncMetadata({
        entityType: `attempts:${taskId}`,
        lastSyncTime: new Date(),
        syncVersion: 1
      });
    } catch (error) {
      console.error('Failed to sync attempts:', error);
    }
  }

  /**
   * Sync conversation entries
   */
  static async syncConversation(attemptId: string): Promise<void> {
    try {
      const entries = await api.executionProcesses.getConversation(attemptId);
      
      await DatabaseManager.saveConversationEntries(entries);

      await DatabaseManager.updateSyncMetadata({
        entityType: `conversation:${attemptId}`,
        lastSyncTime: new Date(),
        syncVersion: 1
      });
    } catch (error) {
      console.error('Failed to sync conversation:', error);
    }
  }

  /**
   * Sync diffs
   */
  static async syncDiffs(attemptId: string): Promise<void> {
    try {
      const diffs = await api.attempts.getDiffs(attemptId);
      
      await DatabaseManager.saveDiffs(attemptId, diffs);

      await DatabaseManager.updateSyncMetadata({
        entityType: `diffs:${attemptId}`,
        lastSyncTime: new Date(),
        syncVersion: 1
      });
    } catch (error) {
      console.error('Failed to sync diffs:', error);
    }
  }

  /**
   * Sync config
   */
  static async syncConfig(): Promise<void> {
    try {
      const config = await api.config.get();
      
      await DatabaseManager.saveConfig(config);

      await DatabaseManager.updateSyncMetadata({
        entityType: 'config',
        lastSyncTime: new Date(),
        syncVersion: 1
      });
    } catch (error) {
      console.error('Failed to sync config:', error);
    }
  }

  /**
   * Check if entity needs sync
   */
  static async needsSync(
    entityType: string,
    maxAge: number = 5 * 60 * 1000 // 5 minutes
  ): Promise<boolean> {
    const metadata = await DatabaseManager.getSyncMetadata(entityType);
    
    if (!metadata) return true;
    
    const age = Date.now() - metadata.lastSyncTime.getTime();
    return age > maxAge;
  }
}
```

### 4.2 Offline-First Data Fetching

**File:** `frontend/src/lib/offline/fetch.ts`

```typescript
import { DatabaseManager } from './db';
import { SyncManager } from './sync';
import { NetworkService } from '../native/network';
import { api } from '../api';

/**
 * Offline-first data fetcher
 */
export class OfflineFetch {
  /**
   * Get projects (offline-first)
   */
  static async getProjects(): Promise<Project[]> {
    // Try cache first
    const cached = await DatabaseManager.getProjects();
    
    // Check if online and needs sync
    const status = await NetworkService.getStatus();
    if (status.connected && await SyncManager.needsSync('projects')) {
      // Sync in background
      SyncManager.syncProjects().catch(console.error);
    }
    
    // Return cached data immediately
    if (cached.length > 0) {
      return cached;
    }
    
    // If no cache and online, fetch from API
    if (status.connected) {
      const projects = await api.projects.list();
      
      // Cache for next time
      for (const project of projects) {
        await DatabaseManager.saveProject(project);
      }
      
      return projects;
    }
    
    // No cache and offline
    return [];
  }

  /**
   * Get tasks (offline-first)
   */
  static async getTasks(projectId: string): Promise<Task[]> {
    // Try cache first
    const cached = await DatabaseManager.getTasks(projectId);
    
    // Check if online and needs sync
    const status = await NetworkService.getStatus();
    if (status.connected && await SyncManager.needsSync(`tasks:${projectId}`)) {
      // Sync in background
      SyncManager.syncTasks(projectId).catch(console.error);
    }
    
    // Return cached data immediately
    if (cached.length > 0) {
      return cached;
    }
    
    // If no cache and online, fetch from API
    if (status.connected) {
      const tasks = await api.tasks.list(projectId);
      
      // Cache for next time
      for (const task of tasks) {
        await DatabaseManager.saveTask(task);
      }
      
      return tasks;
    }
    
    // No cache and offline
    return [];
  }

  /**
   * Get task attempts (offline-first)
   */
  static async getTaskAttempts(taskId: string): Promise<TaskAttempt[]> {
    // Try cache first
    const cached = await DatabaseManager.getTaskAttempts(taskId);
    
    // Check if online and needs sync
    const status = await NetworkService.getStatus();
    if (status.connected && await SyncManager.needsSync(`attempts:${taskId}`)) {
      // Sync in background
      SyncManager.syncTaskAttempts(taskId).catch(console.error);
    }
    
    // Return cached data
    return cached;
  }

  /**
   * Get conversation entries (offline-first)
   */
  static async getConversation(attemptId: string): Promise<ConversationEntry[]> {
    // Try cache first
    const cached = await DatabaseManager.getConversationEntries(attemptId);
    
    // Check if online and needs sync
    const status = await NetworkService.getStatus();
    if (status.connected && await SyncManager.needsSync(`conversation:${attemptId}`)) {
      // Sync in background
      SyncManager.syncConversation(attemptId).catch(console.error);
    }
    
    // Return cached data
    return cached;
  }

  /**
   * Get diffs (offline-first)
   */
  static async getDiffs(attemptId: string): Promise<Diff[]> {
    // Try cache first
    const cached = await DatabaseManager.getDiffs(attemptId);
    
    // Check if online and needs sync
    const status = await NetworkService.getStatus();
    if (status.connected && await SyncManager.needsSync(`diffs:${attemptId}`)) {
      // Sync in background
      SyncManager.syncDiffs(attemptId).catch(console.error);
    }
    
    // Return cached data or empty array
    return cached || [];
  }
}
```

---

## 5. Conflict Resolution

### 5.1 Conflict Detection

```typescript
/**
 * Conflict types
 */
export type ConflictType = 
  | 'version-mismatch'  // Entity was updated on server
  | 'deleted'           // Entity was deleted on server
  | 'concurrent-edit';  // Multiple edits to same entity

/**
 * Conflict
 */
export interface Conflict {
  type: ConflictType;
  entityType: string;
  entityId: string;
  localVersion: any;
  serverVersion: any;
  timestamp: Date;
}

/**
 * Conflict resolver
 */
export class ConflictResolver {
  /**
   * Detect conflicts
   */
  static async detectConflicts(
    action: QueuedAction
  ): Promise<Conflict | null> {
    // Get current server version
    const serverVersion = await this.getServerVersion(action);
    
    if (!serverVersion) {
      return {
        type: 'deleted',
        entityType: action.type,
        entityId: action.payload.id,
        localVersion: action.payload,
        serverVersion: null,
        timestamp: new Date()
      };
    }
    
    // Check version mismatch
    if (this.hasVersionMismatch(action.payload, serverVersion)) {
      return {
        type: 'version-mismatch',
        entityType: action.type,
        entityId: action.payload.id,
        localVersion: action.payload,
        serverVersion,
        timestamp: new Date()
      };
    }
    
    return null;
  }

  /**
   * Resolve conflict
   */
  static async resolveConflict(
    conflict: Conflict,
    strategy: 'local' | 'server' | 'merge'
  ): Promise<any> {
    switch (strategy) {
      case 'local':
        // Use local version (force push)
        return conflict.localVersion;

      case 'server':
        // Use server version (discard local)
        return conflict.serverVersion;

      case 'merge':
        // Merge both versions
        return this.mergeVersions(conflict.localVersion, conflict.serverVersion);

      default:
        throw new Error(`Unknown strategy: ${strategy}`);
    }
  }

  private static async getServerVersion(action: QueuedAction): Promise<any> {
    // Fetch current version from server
    // Implementation depends on action type
    return null;
  }

  private static hasVersionMismatch(local: any, server: any): boolean {
    // Compare versions
    return local.updated_at !== server.updated_at;
  }

  private static mergeVersions(local: any, server: any): any {
    // Merge logic (prefer local for user-editable fields)
    return {
      ...server,
      ...local,
      // Preserve server timestamps
      created_at: server.created_at,
      updated_at: server.updated_at
    };
  }
}
```

---

## 6. Implementation Details

### 6.1 React Hooks

**File:** `frontend/src/hooks/useOfflineData.ts`

```typescript
import { useQuery } from '@tanstack/react-query';
import { OfflineFetch } from '@/lib/offline/fetch';
import { useNetwork } from '@/lib/native/network';

/**
 * Hook for offline-first projects
 */
export function useOfflineProjects() {
  const { isOnline } = useNetwork();

  return useQuery({
    queryKey: ['projects', 'offline'],
    queryFn: () => OfflineFetch.getProjects(),
    staleTime: isOnline ? 5 * 60 * 1000 : Infinity, // 5 min if online, never if offline
    gcTime: Infinity // Keep in cache forever
  });
}

/**
 * Hook for offline-first tasks
 */
export function useOfflineTasks(projectId: string) {
  const { isOnline } = useNetwork();

  return useQuery({
    queryKey: ['tasks', projectId, 'offline'],
    queryFn: () => OfflineFetch.getTasks(projectId),
    enabled: !!projectId,
    staleTime: isOnline ? 5 * 60 * 1000 : Infinity,
    gcTime: Infinity
  });
}

/**
 * Hook for offline queue status
 */
export function useOfflineQueue() {
  const { isOnline } = useNetwork();

  return useQuery({
    queryKey: ['offline-queue'],
    queryFn: () => QueueManager.getStatus(),
    refetchInterval: isOnline ? 10000 : false // Poll every 10s when online
  });
}
```

### 6.2 UI Components

**File:** `frontend/src/components/mobile/OfflineIndicator.tsx`

```typescript
import React from 'react';
import { WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { useNetwork } from '@/lib/native/network';
import { useOfflineQueue } from '@/hooks/useOfflineData';
import { QueueManager } from '@/lib/offline/queue';

export function OfflineIndicator() {
  const { isOnline } = useNetwork();
  const { data: queueStatus } = useOfflineQueue();

  if (isOnline && (!queueStatus || queueStatus.pending === 0)) {
    return null;
  }

  return (
    <div className="fixed top-safe left-0 right-0 z-50 bg-warning text-warning-foreground px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">Offline</span>
            </>
          ) : (
            <>
              <CloudOff className="w-4 h-4" />
              <span className="text-sm font-medium">
                Syncing {queueStatus?.pending} action{queueStatus?.pending !== 1 ? 's' : ''}...
              </span>
            </>
          )}
        </div>

        {queueStatus && queueStatus.failed > 0 && (
          <button
            onClick={() => QueueManager.retryFailed()}
            className="flex items-center gap-1 text-sm"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## 7. Testing Strategy

### 7.1 Offline Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| **Go offline while viewing tasks** | Tasks remain visible from cache |
| **Create task while offline** | Task queued, appears in UI immediately |
| **Go online after creating task** | Task syncs to server automatically |
| **Edit task while offline** | Edit queued, UI updates immediately |
| **Delete task while offline** | Delete queued, task removed from UI |
| **Sync fails (server error)** | Action retried up to 3 times |
| **Conflict detected** | User prompted to resolve |

### 7.2 Testing Checklist

**IndexedDB:**
- [ ] Database initializes correctly
- [ ] All stores created with indexes
- [ ] CRUD operations work
- [ ] Queries by index work
- [ ] Database clears correctly

**Queue:**
- [ ] Actions queue when offline
- [ ] Queue processes when online
- [ ] Failed actions retry
- [ ] Max retries respected
- [ ] Queue status accurate

**Sync:**
- [ ] Initial sync works
- [ ] Background sync works
- [ ] Sync respects max age
- [ ] Sync handles errors gracefully

**Offline-First Fetching:**
- [ ] Returns cached data immediately
- [ ] Syncs in background when online
- [ ] Falls back to API when no cache
- [ ] Handles offline gracefully

**Conflict Resolution:**
- [ ] Detects version mismatches
- [ ] Detects deletions
- [ ] Resolves with local strategy
- [ ] Resolves with server strategy
- [ ] Resolves with merge strategy

---

**Document Version:** 1.0  
**Last Updated:** 2025-11-11  
**Status:** ✅ Complete
