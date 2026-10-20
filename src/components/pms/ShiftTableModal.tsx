import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { PmsDiningTable, PmsTableShiftRecord } from '../../types/pmsModels';

interface ShiftTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShiftCompleted?: () => void;
  initialFromTable?: string;
}

export const ShiftTableModal: React.FC<ShiftTableModalProps> = ({
  isOpen,
  onClose,
  onShiftCompleted,
  initialFromTable
}) => {
  const [tables, setTables] = useState<PmsDiningTable[]>([]);
  const [fromTable, setFromTable] = useState<string>('');
  const [toTable, setToTable] = useState<string>('');
  const [shiftRecords, setShiftRecords] = useState<PmsTableShiftRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const allTables = PmsStore.getTables();
      setTables(allTables);
      setShiftRecords(PmsStore.getTableShifts());

      if (initialFromTable) {
        setFromTable(initialFromTable);
      } else {
        const firstOccupied = allTables.find(t => t.status === 'Running' || t.status === 'Occupied');
        if (firstOccupied) {
          setFromTable(firstOccupied.tableName);
        } else if (allTables.length > 0) {
          setFromTable(allTables[0].tableName);
        }
      }

      // Default destination
      const firstVacant = allTables.find(t => t.status === 'Vacant');
      if (firstVacant) {
        setToTable(firstVacant.tableName);
      } else if (allTables.length > 1) {
        setToTable(allTables[1].tableName);
      }
    }
  }, [isOpen, initialFromTable]);

  if (!isOpen) return null;

  const handleShiftNow = () => {
    if (!fromTable) {
      alert('Please select a source table (Select From Table).');
      return;
    }
    if (!toTable) {
      alert('Please select a destination table (Select To Table).');
      return;
    }
    if (fromTable.toLowerCase() === toTable.toLowerCase()) {
      alert('Source and destination tables cannot be the same!');
      return;
    }

    setIsSubmitting(true);
    const result = PmsStore.shiftTable(fromTable, toTable, 'Restaurant Manager (Admin)');
    setIsSubmitting(false);

    alert(result.message);
    if (result.success) {
      setShiftRecords(PmsStore.getTableShifts());
      setTables(PmsStore.getTables());
      if (onShiftCompleted) {
        onShiftCompleted();
      }
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 8,
          width: '100%',
          maxWidth: 720,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar with back/close */}
        <div
          style={{
            background: '#1e293b',
            color: '#ffffff',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 18 }}>🔁</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>Restaurant Table Shifting</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#334155',
              border: 'none',
              color: '#ffffff',
              borderRadius: 4,
              width: 28,
              height: 28,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14
            }}
          >
            ✕
          </button>
        </div>

        {/* Inner Content - Exact Frame 130 and Frame 155 layout */}
        <div style={{ padding: '30px 24px' }}>
          <h2
            style={{
              textAlign: 'center',
              color: '#1d4ed8',
              fontSize: 20,
              fontWeight: 700,
              margin: '0 0 28px 0',
              fontFamily: 'inherit'
            }}
          >
            Shift KOTs from One Table to Another
          </h2>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr auto',
              gap: 16,
              alignItems: 'flex-end',
              background: '#f8fafc',
              padding: '20px',
              borderRadius: 8,
              border: '1px solid #e2e8f0'
            }}
          >
            {/* Select From Table */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: 6
                }}
              >
                Select From Table
              </label>
              <select
                value={fromTable}
                onChange={(e) => setFromTable(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1.5px solid #0284c7',
                  fontSize: 14,
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  color: '#0f172a',
                  fontWeight: 600
                }}
              >
                <option value="">-- Select Source Table --</option>
                {tables.map(t => (
                  <option key={t.id} value={t.tableName}>
                    {t.tableName} ({t.tableGroup}) {t.status === 'Running' || t.status === 'Occupied' ? '🟢 Active Orders' : '⚪ Vacant'}
                  </option>
                ))}
              </select>
            </div>

            {/* Select To Table */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: 6
                }}
              >
                Select To Table
              </label>
              <select
                value={toTable}
                onChange={(e) => setToTable(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 12px',
                  borderRadius: 6,
                  border: '1.5px solid #cbd5e1',
                  fontSize: 14,
                  backgroundColor: '#ffffff',
                  outline: 'none',
                  color: '#0f172a',
                  fontWeight: 600
                }}
              >
                <option value="">-- Select Destination Table --</option>
                {tables.map(t => (
                  <option key={t.id} value={t.tableName}>
                    {t.tableName} ({t.tableGroup}) {t.status === 'Running' || t.status === 'Occupied' ? '🟢 Active Orders' : '⚪ Vacant'}
                  </option>
                ))}
              </select>
            </div>

            {/* Shift Now Button - Matching Frame 130 */}
            <div>
              <button
                type="button"
                onClick={handleShiftNow}
                disabled={isSubmitting}
                style={{
                  backgroundColor: '#15803d',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                {isSubmitting ? 'Shifting...' : 'Shift Now'}
              </button>
            </div>
          </div>

          {/* Explanation from Video 13 speech */}
          <div
            style={{
              marginTop: 18,
              padding: '12px 16px',
              backgroundColor: '#eff6ff',
              borderLeft: '4px solid #3b82f6',
              borderRadius: 4,
              fontSize: 12.5,
              color: '#1e40af',
              lineHeight: 1.5
            }}
          >
            <strong>Table Shifting Policy:</strong> Shifting moves all open KOT tickets and items from the source table to the new destination table seamlessly. The destination table is automatically marked as Occupied/Running (green) on the Live Table Matrix, and the source table is cleared back to Vacant.
          </div>

          {/* Recent Shift History */}
          {shiftRecords.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 10, textTransform: 'uppercase' }}>
                Recent Table Shifts
              </h4>
              <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 6 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead style={{ background: '#f1f5f9', color: '#475569', borderBottom: '1px solid #cbd5e1' }}>
                    <tr>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>Time</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>From</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>To</th>
                      <th style={{ padding: '6px 10px', textAlign: 'center' }}>KOTs Moved</th>
                      <th style={{ padding: '6px 10px', textAlign: 'left' }}>Shifted By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shiftRecords.slice(0, 5).map(sr => (
                      <tr key={sr.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '6px 10px', color: '#64748b' }}>
                          {new Date(sr.shiftedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '6px 10px', fontWeight: 600, color: '#dc2626' }}>
                          {sr.fromTable}
                        </td>
                        <td style={{ padding: '6px 10px', fontWeight: 600, color: '#16a34a' }}>
                          {sr.toTable}
                        </td>
                        <td style={{ padding: '6px 10px', textAlign: 'center', fontWeight: 700 }}>
                          {sr.kotsShifted}
                        </td>
                        <td style={{ padding: '6px 10px', color: '#475569' }}>
                          {sr.shiftedBy}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
