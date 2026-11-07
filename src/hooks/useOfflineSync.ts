import { useState, useEffect, useCallback } from 'react';
import {
  getPendingMutationCount,
  getPendingMutations,
  flushMutationQueue,
  type QueuedMutation
} from '../services/db';

export interface OfflineSyncState {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingMutations: QueuedMutation[];
  triggerSync: () => Promise<{ synced: number; failed: number; totalPending: number }>;
}

export function useOfflineSync(): OfflineSyncState {
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.navigator.onLine : true
  );
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingMutations, setPendingMutations] = useState<QueuedMutation[]>([]);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      const count = await getPendingMutationCount();
      const list = await getPendingMutations();
      setPendingCount(count);
      setPendingMutations(list);
    } catch {
      // In-memory / SSR fallback
    }
  }, []);

  const triggerSync = useCallback(async () => {
    setIsSyncing(true);
    try {
      const res = await flushMutationQueue();
      setLastSyncTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      await refreshStatus();
      return res;
    } finally {
      setIsSyncing(false);
    }
  }, [refreshStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleStatusChanged = () => {
      refreshStatus();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('svr:sync_status_changed', handleStatusChanged);
    window.addEventListener('svr:mutation_queued', handleStatusChanged);
    window.addEventListener('svr:mutation_synced', handleStatusChanged);
    window.addEventListener('svr:kot_offline_queued', handleStatusChanged);
    window.addEventListener('svr:kot_synced', handleStatusChanged);

    refreshStatus();
    const interval = setInterval(refreshStatus, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('svr:sync_status_changed', handleStatusChanged);
      window.removeEventListener('svr:mutation_queued', handleStatusChanged);
      window.removeEventListener('svr:mutation_synced', handleStatusChanged);
      window.removeEventListener('svr:kot_offline_queued', handleStatusChanged);
      window.removeEventListener('svr:kot_synced', handleStatusChanged);
      clearInterval(interval);
    };
  }, [refreshStatus, triggerSync]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncTime,
    pendingMutations,
    triggerSync
  };
}

