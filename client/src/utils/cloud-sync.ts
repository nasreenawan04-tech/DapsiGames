/**
 * Cloud sync utilities using Supabase Storage
 * Handles file uploads, downloads, and cross-device synchronization
 */

import { apiRequest } from "@/lib/queryClient";

export interface SyncFile {
  id: string;
  name: string;
  path: string;
  size: number;
  mimeType: string;
  lastModified: Date;
  userId: string;
}

export interface SyncStatus {
  lastSyncTime: Date | null;
  pendingUploads: number;
  pendingDownloads: number;
  syncEnabled: boolean;
}

/**
 * Upload a file to cloud storage
 */
export async function uploadFile(
  file: File,
  category: 'notes' | 'planners' | 'avatars' | 'exports'
): Promise<SyncFile> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);

  const response = await apiRequest('POST', '/api/storage/upload', formData);
  return response;
}

/**
 * Download a file from cloud storage
 */
export async function downloadFile(fileId: string): Promise<Blob> {
  const response = await fetch(`/api/storage/download/${fileId}`);
  if (!response.ok) {
    throw new Error('Failed to download file');
  }
  return response.blob();
}

/**
 * List all files for the current user
 */
export async function listUserFiles(category?: string): Promise<SyncFile[]> {
  const url = category 
    ? `/api/storage/files?category=${category}`
    : '/api/storage/files';
  
  const response = await apiRequest('GET', url);
  return response;
}

/**
 * Delete a file from cloud storage
 */
export async function deleteFile(fileId: string): Promise<void> {
  await apiRequest('DELETE', `/api/storage/files/${fileId}`);
}

/**
 * Sync notes to cloud
 */
export async function syncNotesToCloud(notes: any[]): Promise<void> {
  const notesBlob = new Blob([JSON.stringify(notes)], { type: 'application/json' });
  const file = new File([notesBlob], 'notes.json', { type: 'application/json' });
  await uploadFile(file, 'notes');
}

/**
 * Load notes from cloud
 */
export async function loadNotesFromCloud(): Promise<any[]> {
  try {
    const files = await listUserFiles('notes');
    if (files.length === 0) {
      return [];
    }

    // Get the most recent notes file
    const latestFile = files.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    )[0];

    const blob = await downloadFile(latestFile.id);
    const text = await blob.text();
    return JSON.parse(text);
  } catch (error) {
    console.error('Failed to load notes from cloud:', error);
    return [];
  }
}

/**
 * Export planner to PDF and upload to cloud
 */
export async function exportAndSyncPlanner(plannerData: any): Promise<string> {
  const response = await apiRequest('POST', '/api/planner/export-pdf', {
    plannerData
  });
  
  return response.downloadUrl;
}

/**
 * Get sync status for current user
 */
export async function getSyncStatus(): Promise<SyncStatus> {
  const response = await apiRequest('GET', '/api/storage/sync-status');
  return {
    ...response,
    lastSyncTime: response.lastSyncTime ? new Date(response.lastSyncTime) : null,
  };
}

/**
 * Enable or disable cloud sync
 */
export async function toggleCloudSync(enabled: boolean): Promise<void> {
  await apiRequest('POST', '/api/storage/toggle-sync', { enabled });
}

/**
 * Perform full sync of all data
 */
export async function performFullSync(): Promise<void> {
  // Get local data
  const localNotes = getLocalNotes();
  const localSessions = getLocalSessions();
  
  // Upload to cloud
  if (localNotes.length > 0) {
    await syncNotesToCloud(localNotes);
  }
  
  if (localSessions.length > 0) {
    await syncSessionsToCloud(localSessions);
  }
  
  // Update sync timestamp
  localStorage.setItem('lastSyncTime', new Date().toISOString());
}

/**
 * Sync study sessions to cloud
 */
export async function syncSessionsToCloud(sessions: any[]): Promise<void> {
  for (const session of sessions) {
    try {
      await apiRequest('POST', '/api/study-sessions', session);
    } catch (error) {
      console.error('Failed to sync session:', error);
    }
  }
}

/**
 * Helper: Get local notes from localStorage
 */
function getLocalNotes(): any[] {
  try {
    const notes = localStorage.getItem('userNotes');
    return notes ? JSON.parse(notes) : [];
  } catch {
    return [];
  }
}

/**
 * Helper: Get local sessions from localStorage
 */
function getLocalSessions(): any[] {
  try {
    const sessions = localStorage.getItem('pendingSessions');
    return sessions ? JSON.parse(sessions) : [];
  } catch {
    return [];
  }
}

/**
 * Auto-sync at intervals (call this on app start)
 */
export function startAutoSync(intervalMinutes: number = 15): NodeJS.Timeout {
  const intervalMs = intervalMinutes * 60 * 1000;
  
  return setInterval(async () => {
    try {
      const status = await getSyncStatus();
      if (status.syncEnabled) {
        await performFullSync();
      }
    } catch (error) {
      console.error('Auto-sync failed:', error);
    }
  }, intervalMs);
}

/**
 * Check if user has Pro subscription (required for cloud sync)
 */
export async function hasCloudSyncAccess(): Promise<boolean> {
  try {
    const response = await apiRequest('GET', '/api/user/subscription-status');
    return response.isPro;
  } catch {
    return false;
  }
}
