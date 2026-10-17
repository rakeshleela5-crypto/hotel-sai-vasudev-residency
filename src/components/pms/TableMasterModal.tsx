import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import type { PmsDiningTable, TableGroup } from '../../types/pmsModels';

interface TableMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTableChange?: () => void;
}

export const TableMasterModal: React.FC<TableMasterModalProps> = ({
  isOpen,
  onClose,
  onTableChange
}) => {
  const [tables, setTables] = useState<PmsDiningTable[]>([]);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<PmsDiningTable | null>(null);

  // Form fields matching Frame 200
  const [tableName, setTableName] = useState('');
  const [tableGroup, setTableGroup] = useState<string>('General');
  const [capacity, setCapacity] = useState(4);

  const loadTables = () => {
    const list = PmsStore.getTables();
    setTables(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadTables();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingTable(null);
    setTableName('');
    setTableGroup('General');
    setCapacity(4);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (t: PmsDiningTable) => {
    setEditingTable(t);
    setTableName(t.tableName);
    setTableGroup(t.tableGroup);
    setCapacity(t.capacity || 4);
    setIsAddModalOpen(true);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableName.trim()) {
      alert('Please enter Table Name.');
      return;
    }

    const formattedName = tableName.trim().startsWith('Table')
      ? tableName.trim()
      : `Table ${tableName.trim()}`;

    const newTable: PmsDiningTable = {
      id: editingTable ? editingTable.id : `t-${Date.now()}`,
      tableName: formattedName,
      tableGroup: tableGroup as TableGroup,
      capacity: Number(capacity) || 4,
      status: editingTable ? editingTable.status : 'Vacant'
    };

    PmsStore.saveTable(newTable);
    loadTables();
    setIsAddModalOpen(false);
    if (onTableChange) onTableChange();
    alert(`Table "${formattedName}" saved successfully in group "${tableGroup}".`);
  };

  const handleDeleteTable = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      PmsStore.deleteTable(id);
      loadTables();
      if (onTableChange) onTableChange();
    }
  };

  const filteredTables = tables.filter(t => 
    t.tableName.toLowerCase().includes(search.toLowerCase()) ||
    t.tableGroup.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
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
          maxWidth: 950,
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
            <span style={{ fontSize: 18 }}>🪑</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>
              Restaurant Table Master (Master &gt; Other &gt; Tables)
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={handleOpenAdd}
              style={{
                background: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 4,
                fontWeight: 700,
                fontSize: 12.5,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              + Add Table
            </button>
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
        </div>

        {/* Search bar */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>
            Configure General, TakeAway, NC, and SelfService Dining Tables
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>Search:</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Table Name or Group..."
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                padding: '5px 10px',
                fontSize: 13,
                outline: 'none',
                width: 220
              }}
            />
          </div>
        </div>

        {/* Table List matching Frame 200 background */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 20px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 12 }}>
            <thead>
              <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1', color: '#334155' }}>
                <th style={{ padding: '9px 10px', textAlign: 'center', width: 60 }}>S.No▴</th>
                <th style={{ padding: '9px 16px', textAlign: 'left' }}>Table Name</th>
                <th style={{ padding: '9px 16px', textAlign: 'left' }}>Group</th>
                <th style={{ padding: '9px 12px', textAlign: 'center' }}>Capacity</th>
                <th style={{ padding: '9px 12px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '9px 12px', textAlign: 'center', width: 90 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTables.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    No tables found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTables.map((t, idx) => {
                  const isRunning = t.status === 'Running' || t.status === 'Occupied';
                  return (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        background: idx % 2 === 0 ? '#ffffff' : '#f8fafc'
                      }}
                    >
                      <td style={{ padding: '8px 10px', textAlign: 'center', color: '#64748b' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '8px 16px', fontWeight: 700, color: '#0f172a' }}>
                        {t.tableName}
                      </td>
                      <td style={{ padding: '8px 16px' }}>
                        <span
                          style={{
                            background:
                              t.tableGroup === 'Nc' || t.tableGroup === 'NC'
                                ? '#fce7f3'
                                : t.tableGroup === 'TakeAway'
                                ? '#fef9c3'
                                : '#e0f2fe',
                            color:
                              t.tableGroup === 'Nc' || t.tableGroup === 'NC'
                                ? '#9d174d'
                                : t.tableGroup === 'TakeAway'
                                ? '#854d0e'
                                : '#0369a1',
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700
                          }}
                        >
                          {t.tableGroup}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center', color: '#475569' }}>
                        {t.capacity || 4} Pax
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <span
                          style={{
                            background: isRunning ? '#dcfce7' : '#f1f5f9',
                            color: isRunning ? '#15803d' : '#64748b',
                            padding: '2px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700
                          }}
                        >
                          {isRunning ? '🟢 Running' : '⚪ Vacant'}
                        </span>
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                          {/* Edit Frame 200 blue pen */}
                          <button
                            type="button"
                            title="Edit Table"
                            onClick={() => handleOpenEdit(t)}
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #93c5fd',
                              color: '#1d4ed8',
                              borderRadius: 4,
                              padding: '3px 6px',
                              cursor: 'pointer',
                              fontSize: 12
                            }}
                          >
                            ✏️
                          </button>
                          {/* Delete Frame 200 red trash */}
                          <button
                            type="button"
                            title="Delete Table"
                            onClick={() => handleDeleteTable(t.id, t.tableName)}
                            style={{
                              background: '#fef2f2',
                              border: '1px solid #fca5a5',
                              color: '#dc2626',
                              borderRadius: 4,
                              padding: '3px 6px',
                              cursor: 'pointer',
                              fontSize: 12
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12.5,
            color: '#64748b'
          }}
        >
          <div>Total Tables: {tables.length}</div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#475569',
              color: '#ffffff',
              border: 'none',
              padding: '6px 16px',
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Close
          </button>
        </div>
      </div>

      {/* Add / Edit Table Modal - Exact Replica of Frame 200 */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10005
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 8,
              width: '100%',
              maxWidth: 440,
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Frame 200 */}
            <div
              style={{
                padding: '14px 18px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>
                {editingTable ? 'Edit Table' : 'Add Table'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: 18,
                  cursor: 'pointer',
                  color: '#64748b'
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTable} style={{ padding: '20px 18px' }}>
              {/* Table Name */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 6,
                    textAlign: 'center'
                  }}
                >
                  Table Name
                </label>
                <input
                  type="text"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  placeholder="e.g. NC3 or T-17"
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Select Table Group - Matching Frame 200 Dropdown */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 6,
                    textAlign: 'center'
                  }}
                >
                  Select Table Group
                </label>
                <select
                  value={tableGroup}
                  onChange={(e) => setTableGroup(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1.5px solid #93c5fd',
                    borderRadius: 6,
                    fontSize: 14,
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    color: '#1e293b',
                    boxSizing: 'border-box'
                  }}
                >
                  <option value="General">General</option>
                  <option value="Nc">NC</option>
                  <option value="TakeAway">Take Away</option>
                  <option value="SelfService">Self Service</option>
                </select>
              </div>

              {/* Capacity */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: 6,
                    textAlign: 'center'
                  }}
                >
                  Seating Capacity (Pax)
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 14,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
