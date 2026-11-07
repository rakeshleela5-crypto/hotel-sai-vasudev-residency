import React, { useState } from 'react';
import { useOfflineSync } from '../../hooks/useOfflineSync';

export const OfflineSyncStatusBar: React.FC = () => {
  const { isOnline, pendingCount, isSyncing, lastSyncTime, pendingMutations, triggerSync } = useOfflineSync();
  const [showDrawer, setShowDrawer] = useState(false);

  return (
    <>
      <div
        className="offline-sync-pill"
        onClick={() => setShowDrawer(prev => !prev)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
          userSelect: 'none',
          transition: 'all 0.2s ease',
          backgroundColor: !isOnline
            ? '#fef2f2'
            : pendingCount > 0
            ? '#fffbeb'
            : '#f0fdf4',
          color: !isOnline
            ? '#dc2626'
            : pendingCount > 0
            ? '#d97706'
            : '#16a34a',
          border: `1px solid ${
            !isOnline
              ? '#fca5a5'
              : pendingCount > 0
              ? '#fde68a'
              : '#bbf7d0'
          }`
        }}
        title="Click to view offline queue & sync status"
      >
        <span style={{ fontSize: 13 }}>
          {!isOnline ? '📡' : isSyncing ? '🔄' : pendingCount > 0 ? '⏳' : '🟢'}
        </span>
        <span>
          {!isOnline
            ? `Offline (${pendingCount} queued)`
            : isSyncing
            ? `Syncing (${pendingCount})...`
            : pendingCount > 0
            ? `${pendingCount} pending sync`
            : 'Cloud Synced'}
        </span>
      </div>

      {showDrawer && (
        <div
          className="sync-popover-backdrop"
          onClick={() => setShowDrawer(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.3)',
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}
        >
          <div
            className="sync-popover"
            onClick={e => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 12,
              padding: 20,
              width: 440,
              maxWidth: '90vw',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e2e8f0'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 18 }}>📶</span>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>
                  Local Dexie.js Sync Engine
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDrawer(false)}
                style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>

            <div style={{ fontSize: 12, color: '#475569', marginBottom: 16 }}>
              IndexedDB local-first persistence guarantees continuous operations in Rayagada during Wi-Fi or broadband outages.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
              <div style={{ padding: 10, backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Network Status</div>
                <div style={{ fontWeight: 700, color: isOnline ? '#16a34a' : '#dc2626', fontSize: 14 }}>
                  {isOnline ? 'Online (Wi-Fi Connected)' : 'Offline (Disconnected)'}
                </div>
              </div>
              <div style={{ padding: 10, backgroundColor: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>Pending Mutations</div>
                <div style={{ fontWeight: 700, color: pendingCount > 0 ? '#d97706' : '#16a34a', fontSize: 14 }}>
                  {pendingCount} records
                </div>
              </div>
            </div>

            {lastSyncTime && (
              <div style={{ fontSize: 11, color: '#64748b', marginBottom: 12 }}>
                Last successful cloud synchronization: {lastSyncTime}
              </div>
            )}

            {pendingMutations.length > 0 && (
              <div style={{ maxHeight: 150, overflowY: 'auto', marginBottom: 16, border: '1px solid #e2e8f0', borderRadius: 6 }}>
                <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left', color: '#475569' }}>
                      <th style={{ padding: '6px 8px' }}>Type</th>
                      <th style={{ padding: '6px 8px' }}>Endpoint</th>
                      <th style={{ padding: '6px 8px' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingMutations.map(m => (
                      <tr key={m.id || m.clientRef} style={{ borderTop: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 8px', fontWeight: 600 }}>{m.entityType}</td>
                        <td style={{ padding: '6px 8px', color: '#64748b' }}>{m.endpoint}</td>
                        <td style={{ padding: '6px 8px', color: m.syncStatus === 'failed' ? '#dc2626' : '#d97706' }}>
                          {m.syncStatus}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => triggerSync()}
                disabled={isSyncing || !isOnline}
                style={{
                  padding: '6px 14px',
                  backgroundColor: isOnline ? '#2563eb' : '#94a3b8',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: isOnline && !isSyncing ? 'pointer' : 'not-allowed'
                }}
              >
                {isSyncing ? 'Syncing...' : 'Force Sync Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

