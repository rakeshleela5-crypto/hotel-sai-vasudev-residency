import React, { useState, useEffect } from 'react';
import { PmsStore } from '../../services/pmsStore';
import { ShiftTableModal } from './ShiftTableModal';
import { NcKotRegisterModal } from './NcKotRegisterModal';
import { TableMasterModal } from './TableMasterModal';
import type { PmsDiningTable } from '../../types/pmsModels';

interface RestaurantTableDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenKotForTable?: (tableNo: string) => void;
  onOpenBillForTable?: (tableNo: string) => void;
  onOpenKitchenDashboard?: () => void;
  onOpenKotRegister?: () => void;
}

export const RestaurantTableDashboardModal: React.FC<RestaurantTableDashboardModalProps> = ({
  isOpen,
  onClose,
  onOpenKotForTable,
  onOpenBillForTable,
  onOpenKitchenDashboard,
  onOpenKotRegister
}) => {
  const [tables, setTables] = useState<PmsDiningTable[]>([]);
  const [selectedDate, setSelectedDate] = useState('16-06-2025');
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isNcRegisterOpen, setIsNcRegisterOpen] = useState(false);
  const [isTableMasterOpen, setIsTableMasterOpen] = useState(false);
  const [selectedSourceTable, setSelectedSourceTable] = useState<string | undefined>(undefined);

  const loadTables = () => {
    const all = PmsStore.getTables();
    setTables(all);
  };

  useEffect(() => {
    if (!isOpen) return;

    loadTables();

    // 1. Subscribe to reactive PMS Store changes (#97)
    const unsub = PmsStore.subscribe(() => {
      loadTables();
    });

    // 2. Listen to real-time KOT events and WebSocket broadcasts (#97, #98)
    const handleSync = () => {
      loadTables();
    };

    window.addEventListener('svr_kot_event', handleSync);
    window.addEventListener('svr:ws_message', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      unsub();
      window.removeEventListener('svr_kot_event', handleSync);
      window.removeEventListener('svr:ws_message', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const unprintedRestaurantKots = PmsStore.getUnprintedRestaurantKots();

  // Group tables matching Video 13 Frame 110 & 140
  const generalTables = tables.filter(
    (t) => !t.tableGroup || t.tableGroup === 'General' || t.tableGroup === 'Dining'
  );
  const takeAwayTables = tables.filter(
    (t) => t.tableGroup === 'TakeAway' || t.tableGroup === 'Take Away'
  );
  const ncTables = tables.filter(
    (t) => t.tableGroup === 'Nc' || t.tableGroup === 'NC'
  );
  const selfServiceTables = tables.filter(
    (t) => t.tableGroup === 'SelfService' || t.tableGroup === 'Self Service'
  );

  const renderTableCard = (table: PmsDiningTable) => {
    const isOccupied = table.status === 'Running' || table.status === 'Occupied';

    return (
      <div
        key={table.id}
        style={{
          border: isOccupied ? '2px solid #166534' : '2px solid #b91c1c',
          borderRadius: 6,
          background: isOccupied ? '#15803d' : '#ffffff',
          color: isOccupied ? '#ffffff' : '#0f172a',
          boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 130,
          transition: 'all 0.15s ease'
        }}
      >
        {/* Table Title Bar */}
        <div
          style={{
            padding: '8px 10px',
            textAlign: 'center',
            fontWeight: 800,
            fontSize: 13.5,
            borderBottom: isOccupied ? '1px solid #166534' : '1px solid #fecaca',
            background: isOccupied ? '#15803d' : '#ffffff'
          }}
        >
          {table.tableName}
        </div>

        {/* Action Buttons Matching Frame 110 & 140 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderTop: isOccupied ? '1px solid rgba(255,255,255,0.2)' : '1px solid #e2e8f0',
            background: '#ffffff'
          }}
        >
          {/* Left Button: Pink Chef Hat / KOT icon */}
          <button
            type="button"
            title={`Add KOT for ${table.tableName}`}
            onClick={() => {
              if (onOpenKotForTable) {
                onOpenKotForTable(table.tableName);
              }
            }}
            style={{
              background: '#ffffff',
              border: 'none',
              borderRight: '1px solid #06b6d4',
              padding: '6px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#d946ef',
              fontSize: 16
            }}
          >
            <span role="img" aria-label="kot" style={{ color: '#c026d3' }}>
              👚
            </span>
          </button>

          {/* Right Button: Calculator / Bill icon */}
          <button
            type="button"
            title={`Generate Food Bill for ${table.tableName}`}
            onClick={() => {
              if (onOpenBillForTable) {
                onOpenBillForTable(table.tableName);
              }
            }}
            style={{
              background: '#ffffff',
              border: 'none',
              padding: '6px 0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#0284c7',
              fontSize: 15
            }}
          >
            <span role="img" aria-label="bill">
              🧮
            </span>
          </button>
        </div>
      </div>
    );
  };

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
        zIndex: 9999,
        padding: '12px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: 8,
          width: '100%',
          maxWidth: 1280,
          height: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Dark Navigation Bar */}
        <div
          style={{
            background: '#1e293b',
            color: '#ffffff',
            padding: '10px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 18 }}>🏬</span>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '0.02em' }}>
              SRI SAI VASUDEV RESIDENCY — Restaurant Table Matrix
            </span>
            <span
              style={{
                background: '#0284c7',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: 12,
                fontSize: 11,
                fontWeight: 700
              }}
            >
              pms.hotelsai-vasudev.com/table_dashboard
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Quick Actions */}
            <button
              type="button"
              onClick={() => setIsNcRegisterOpen(true)}
              style={{
                background: '#9d174d',
                color: '#ffffff',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              NC KOT Register
            </button>

            {onOpenKitchenDashboard && (
              <button
                type="button"
                onClick={onOpenKitchenDashboard}
                style={{
                  background: '#d97706',
                  color: '#ffffff',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Kitchen KDS
              </button>
            )}

            {onOpenKotRegister && (
              <button
                type="button"
                onClick={onOpenKotRegister}
                style={{
                  background: unprintedRestaurantKots.length > 0 ? '#dc2626' : '#0284c7',
                  color: '#ffffff',
                  border: 'none',
                  padding: '5px 12px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}
              >
                <span>KOT Register</span>
                {unprintedRestaurantKots.length > 0 && (
                  <span style={{ background: '#ffffff', color: '#b91c1c', padding: '1px 6px', borderRadius: 10, fontSize: 10, fontWeight: 900 }}>
                    🔴 {unprintedRestaurantKots.length} Unprinted
                  </span>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsTableMasterOpen(true)}
              style={{
                background: '#475569',
                color: '#ffffff',
                border: 'none',
                padding: '5px 12px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Table Master
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

        {/* Top Control Bar matching Frame 140 */}
        <div
          style={{
            padding: '12px 24px',
            background: '#f8fafc',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          {/* Maroon / Crimson Shift Table Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedSourceTable(undefined);
              setIsShiftModalOpen(true);
            }}
            style={{
              backgroundColor: '#b91c1c',
              color: '#ffffff',
              border: 'none',
              padding: '7px 18px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <span>Shift Table</span>
          </button>

          {/* Date Selector & Search Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#334155', fontWeight: 600 }}>Select Date</span>
            <input
              type="text"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              style={{
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                padding: '6px 12px',
                fontSize: 13,
                outline: 'none',
                width: 140,
                fontWeight: 600
              }}
            />
            <button
              type="button"
              onClick={() => loadTables()}
              style={{
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: 4,
                padding: '6px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              🔍
            </button>
          </div>
        </div>

        {/* Main Matrix Body with Lime-Green Category Dividers */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {/* Section 1: General */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                background: '#84cc16',
                color: '#14532d',
                padding: '5px 14px',
                fontWeight: 800,
                fontSize: 13.5,
                borderRadius: 3,
                textAlign: 'center',
                letterSpacing: '0.04em',
                marginBottom: 14
              }}
            >
              General
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 14
              }}
            >
              {generalTables.map((t) => renderTableCard(t))}
            </div>
          </div>

          {/* Section 2: TakeAway */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                background: '#84cc16',
                color: '#14532d',
                padding: '5px 14px',
                fontWeight: 800,
                fontSize: 13.5,
                borderRadius: 3,
                textAlign: 'center',
                letterSpacing: '0.04em',
                marginBottom: 14
              }}
            >
              TakeAway
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 14
              }}
            >
              {takeAwayTables.map((t) => renderTableCard(t))}
            </div>
          </div>

          {/* Section 3: Nc */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                background: '#84cc16',
                color: '#14532d',
                padding: '5px 14px',
                fontWeight: 800,
                fontSize: 13.5,
                borderRadius: 3,
                textAlign: 'center',
                letterSpacing: '0.04em',
                marginBottom: 14
              }}
            >
              Nc
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 14
              }}
            >
              {ncTables.map((t) => renderTableCard(t))}
            </div>
          </div>

          {/* Section 4: SelfService */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                background: '#84cc16',
                color: '#14532d',
                padding: '5px 14px',
                fontWeight: 800,
                fontSize: 13.5,
                borderRadius: 3,
                textAlign: 'center',
                letterSpacing: '0.04em',
                marginBottom: 14
              }}
            >
              SelfService
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: 14
              }}
            >
              {selfServiceTables.map((t) => renderTableCard(t))}
            </div>
          </div>
        </div>

        {/* Legend / Info Footer */}
        <div
          style={{
            padding: '10px 24px',
            background: '#f8fafc',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 12,
            color: '#475569'
          }}
        >
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  background: '#15803d',
                  border: '1px solid #166534',
                  borderRadius: 2,
                  display: 'inline-block'
                }}
              />
              <strong>Green:</strong> Occupied / Running Orders
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span
                style={{
                  width: 14,
                  height: 14,
                  background: '#ffffff',
                  border: '1px solid #b91c1c',
                  borderRadius: 2,
                  display: 'inline-block'
                }}
              />
              <strong>White (Red Border):</strong> Vacant / Available
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ color: '#c026d3' }}>👚</span>
              <span>New KOT</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>🧮</span>
              <span>Food Bill</span>
            </span>
          </div>

          <div style={{ fontWeight: 600 }}>
            Total Tables: {tables.length} (Occupied:{' '}
            {tables.filter((t) => t.status === 'Running' || t.status === 'Occupied').length})
          </div>
        </div>
      </div>

      {/* Submodals */}
      <ShiftTableModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        initialFromTable={selectedSourceTable}
        onShiftCompleted={() => {
          loadTables();
        }}
      />

      <NcKotRegisterModal
        isOpen={isNcRegisterOpen}
        onClose={() => setIsNcRegisterOpen(false)}
        onOpenNewKot={() => {
          if (onOpenKotForTable) {
            onOpenKotForTable('Table NC1');
          }
        }}
      />

      <TableMasterModal
        isOpen={isTableMasterOpen}
        onClose={() => setIsTableMasterOpen(false)}
        onTableChange={() => {
          loadTables();
        }}
      />
    </div>
  );
};
