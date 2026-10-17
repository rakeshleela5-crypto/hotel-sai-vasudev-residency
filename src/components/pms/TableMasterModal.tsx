import React, { useState, useEffect } from 'react';
import type { PmsDiningTable } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import './pmsStyles.css';

interface TableMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TableMasterModal: React.FC<TableMasterModalProps> = ({ isOpen, onClose }) => {
  const [tables, setTables] = useState<PmsDiningTable[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Add / Edit Modal State (Frame 0820)
  const [isAddTableOpen, setIsAddTableOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<PmsDiningTable | null>(null);
  const [formTableName, setFormTableName] = useState('');
  const [formTableGroup, setFormTableGroup] = useState('General');

  const TABLE_GROUPS = [
    'General',
    'NC',
    'AC Hall',
    'Garden',
    'Family Section',
    'Terrace',
    'Banquet',
    'Lawn'
  ];

  const refreshData = () => {
    setTables(PmsStore.getTables());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setSuccessBanner(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpenAddTable = (tbl?: PmsDiningTable) => {
    if (tbl) {
      setEditingTable(tbl);
      setFormTableName(tbl.tableName);
      setFormTableGroup(tbl.tableGroup);
    } else {
      setEditingTable(null);
      setFormTableName('');
      setFormTableGroup('General');
    }
    setIsAddTableOpen(true);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTableName.trim()) {
      alert('Please enter Table Name');
      return;
    }

    const newTable: PmsDiningTable = {
      id: editingTable ? editingTable.id : `tbl-${Date.now()}`,
      tableName: formTableName.trim().toUpperCase(),
      tableGroup: formTableGroup,
      capacity: 4,
      status: editingTable?.status || 'Vacant'
    };

    PmsStore.saveTable(newTable);
    setSuccessBanner(editingTable ? 'Table updated successfully' : 'table created successfully');
    setIsAddTableOpen(false);
    refreshData();
  };

  const handleDeleteTable = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete table "${name}"?`)) {
      PmsStore.deleteTable(id);
      setSuccessBanner(`Table ${name} deleted successfully`);
      refreshData();
    }
  };

  const filteredTables = tables.filter(t =>
    t.tableName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.tableGroup.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pms-overlay" onClick={onClose}>
      <div className="pms-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 950, height: '85vh' }}>
        {/* Header */}
        <header className="pms-header" style={{ background: '#212529', color: '#fff' }}>
          <div className="pms-header-left">
            <span style={{ fontSize: 16 }}>🍽️</span>
            <h2 className="pms-brand-title" style={{ fontSize: 15 }}>
              HOTEL SAI VASUDEV RESIDENCY &bull; RESTAURANT TABLE MASTER (/tables)
            </h2>
          </div>
          <div className="pms-header-right">
            <button
              type="button"
              onClick={onClose}
              className="pms-close-btn"
              title="Close"
            >
              ✕
            </button>
          </div>
        </header>

        {/* Toolbar matching Frame 0820 */}
        <div style={{ background: '#f8f9fa', padding: '12px 18px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#333' }}>Table</h3>
            <span style={{ fontSize: 12, color: '#6c757d' }}>Manage restaurant dine-in tables, room service dispatch, and banquet seating</span>
          </div>
          <button
            type="button"
            onClick={() => handleOpenAddTable()}
            style={{
              background: '#0d6efd',
              color: '#fff',
              border: 'none',
              padding: '7px 18px',
              borderRadius: 4,
              fontWeight: 600,
              fontSize: 13,
              cursor: 'pointer'
            }}
          >
            Add New Table
          </button>
        </div>

        {/* Success Banner matching Frame 0820 ("table created successfully") */}
        {successBanner && (
          <div style={{ background: '#d1e7dd', color: '#0f5132', border: '1px solid #badbcc', padding: '10px 18px', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>✓ {successBanner}</span>
            <button
              type="button"
              onClick={() => setSuccessBanner(null)}
              style={{ background: 'none', border: 'none', color: '#0f5132', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Filter Toolbar */}
        <div style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderBottom: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#495057' }}>
            <select
              value={entriesPerPage}
              onChange={e => setEntriesPerPage(Number(e.target.value))}
              style={{ padding: '4px 8px', border: '1px solid #ced4da', borderRadius: 3 }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>entries per page</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 13, color: '#495057' }}>Search:</label>
            <input
              type="text"
              placeholder="Search table or group..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid #ced4da', borderRadius: 3, width: 220, fontSize: 13 }}
            />
          </div>
        </div>

        {/* Datatable matching Frame 0820 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 18, background: '#fff' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left', color: '#495057' }}>
                <th style={{ padding: '10px 12px', width: 80 }}>S.No</th>
                <th style={{ padding: '10px 12px' }}>Table Name</th>
                <th style={{ padding: '10px 12px' }}>Table Group</th>
                <th style={{ padding: '10px 12px', width: 100, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTables.slice(0, entriesPerPage).map((t, idx) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '8px 12px', color: '#6c757d' }}>{idx + 1}</td>
                  <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>{t.tableName}</td>
                  <td style={{ padding: '8px 12px' }}>
                    <span style={{ background: '#f1f5f9', color: '#334155', padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 500 }}>
                      {t.tableGroup}
                    </span>
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleOpenAddTable(t)}
                        style={{
                          background: '#0d6efd',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 3,
                          padding: '3px 8px',
                          cursor: 'pointer',
                          fontSize: 11
                        }}
                        title="Edit Table"
                      >
                        ✎
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTable(t.id, t.tableName)}
                        style={{
                          background: '#dc3545',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 3,
                          padding: '3px 8px',
                          cursor: 'pointer',
                          fontSize: 11
                        }}
                        title="Delete Table"
                      >
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ background: '#f8f9fa', padding: '10px 18px', borderTop: '1px solid #dee2e6', fontSize: 12, color: '#6c757d', display: 'flex', justifyContent: 'space-between' }}>
          <span>Showing 1 to {filteredTables.length} of {tables.length} entries</span>
          <span>HOTEL SAI VASUDEV RESIDENCY &bull; RESTAURANT PMS</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ADD / EDIT TABLE MODAL (Frame 0820 Exact Replica)          */}
      {/* ========================================================= */}
      {isAddTableOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 10005,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setIsAddTableOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              width: 440,
              maxWidth: '95vw',
              borderRadius: 6,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#212529' }}>
                {editingTable ? 'Edit Table' : 'Add Table'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddTableOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6c757d' }}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveTable} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 6, textAlign: 'center' }}>
                  Table Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. NC2, T-1, G-1"
                  value={formTableName}
                  onChange={e => setFormTableName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 14 }}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 6, textAlign: 'center' }}>
                  Select Table Group
                </label>
                <select
                  value={formTableGroup}
                  onChange={e => setFormTableGroup(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                >
                  {TABLE_GROUPS.map(grp => (
                    <option key={grp} value={grp}>{grp}</option>
                  ))}
                </select>
              </div>

              {/* Buttons matching Frame 0820 (Close, Save) */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #dee2e6' }}>
                <button
                  type="button"
                  onClick={() => setIsAddTableOpen(false)}
                  style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '6px 20px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
