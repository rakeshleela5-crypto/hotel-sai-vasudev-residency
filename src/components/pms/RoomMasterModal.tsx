import React, { useState, useEffect } from 'react';
import type { PmsRoom, PmsRoomType } from '../../types/pmsModels';
import { PmsStore } from '../../services/pmsStore';
import { R2StorageClient } from '../../services/r2Storage';
import './pmsStyles.css';

interface RoomMasterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomsChanged?: () => void;
  initialTab?: 'rooms' | 'roomTypes';
}

export const RoomMasterModal: React.FC<RoomMasterModalProps> = ({
  isOpen,
  onClose,
  onRoomsChanged,
  initialTab = 'rooms'
}) => {
  const [activeTab, setActiveTab] = useState<'rooms' | 'roomTypes'>(initialTab);
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [roomTypes, setRoomTypes] = useState<PmsRoomType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Add / Edit Room Modal State
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<PmsRoom | null>(null);
  const [formRoomNo, setFormRoomNo] = useState('');
  const [formRoomType, setFormRoomType] = useState('');
  const [formFloor, setFormFloor] = useState<number>(1);
  const [formFacilities, setFormFacilities] = useState('');
  const [facilitySuggestionsOpen, setFacilitySuggestionsOpen] = useState(false);
  const [roomImage1, setRoomImage1] = useState<string>('');
  const [roomImage2, setRoomImage2] = useState<string>('');
  const [roomImage3, setRoomImage3] = useState<string>('');
  const [uploadingImageSlot, setUploadingImageSlot] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Add / Edit Room Type Modal State
  const [isAddRoomTypeOpen, setIsAddRoomTypeOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<PmsRoomType | null>(null);
  const [formTypeName, setFormTypeName] = useState('');
  const [formPackage, setFormPackage] = useState('GENERAL || 0 || 0');
  const [formGstTax, setFormGstTax] = useState('GST 12% || 12.00 || 0.00');
  const [formTariff, setFormTariff] = useState<number>(2000);
  const [formDiscount, setFormDiscount] = useState<number>(0);

  const FACILITY_CHIPS = [
    'AC ,DOUBALE BED ,GEEJER,WIFI',
    'DOUBLE BED , AC, TV',
    'TRIPLE BED ,AC ,TV',
    'AC,WIFI,TRIPAL BED ROOM',
    'AC,WIFI,TRIPAL BED ROOM,wardrobe',
    '15 MEMBER, BUNK BEDS, AC',
    'Lawn Area, Lights, Buffet Setup',
    'Central AC, Stage, 200 pax'
  ];

  const refreshData = () => {
    setRooms(PmsStore.getRooms());
    setRoomTypes(PmsStore.getRoomTypes());
  };

  useEffect(() => {
    if (isOpen) {
      refreshData();
      setActiveTab(initialTab);
      setSuccessBanner(null);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Handlers for Room
  const handleOpenAddRoom = (room?: PmsRoom) => {
    if (room) {
      setEditingRoom(room);
      setFormRoomNo(room.roomNo);
      setFormRoomType(room.roomType);
      setFormFloor(room.floor);
      setFormFacilities(room.facilities || '');
      setRoomImage1(room.image1 || '');
      setRoomImage2(room.image2 || '');
      setRoomImage3(room.image3 || '');
    } else {
      setEditingRoom(null);
      setFormRoomNo('');
      const defaultType = roomTypes[0]?.roomTypeName || 'DELUXE';
      setFormRoomType(defaultType);
      setFormFloor(1);
      setFormFacilities('AC, DOUBLE BED, TV, GEYSER');
      setRoomImage1('');
      setRoomImage2('');
      setRoomImage3('');
    }
    setFacilitySuggestionsOpen(false);
    setIsAddRoomOpen(true);
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRoomNo.trim()) {
      alert('Please enter Room Number');
      return;
    }

    const selectedTypeObj = roomTypes.find(rt => rt.roomTypeName === formRoomType);
    const tariff = selectedTypeObj ? selectedTypeObj.roomTariff : 2000;

    const newRoom: PmsRoom = {
      id: editingRoom ? editingRoom.id : `rm-${formRoomNo.trim().toLowerCase().replace(/\s+/g, '-')}`,
      roomNo: formRoomNo.trim(),
      roomType: (formRoomType as any) || 'DELUXE',
      tariff,
      status: editingRoom ? editingRoom.status : 'vacant',
      floor: Number(formFloor),
      facilities: formFacilities.trim() || 'Standard Hotel Room Amenities',
      image1: roomImage1 || (editingRoom ? editingRoom.image1 : undefined),
      image2: roomImage2 || (editingRoom ? editingRoom.image2 : undefined),
      image3: roomImage3 || (editingRoom ? editingRoom.image3 : undefined)
    };

    if (editingRoom) {
      PmsStore.updateRoom(newRoom);
      setSuccessBanner(`Room ${newRoom.roomNo} updated successfully!`);
    } else {
      PmsStore.addRoom(newRoom);
      setSuccessBanner(`Room ${newRoom.roomNo} created successfully!`);
    }

    setIsAddRoomOpen(false);
    refreshData();
    if (onRoomsChanged) onRoomsChanged();
  };

  const handleDeleteRoom = (roomNo: string) => {
    if (window.confirm(`Are you sure you want to delete Room ${roomNo}?`)) {
      PmsStore.deleteRoom(roomNo);
      setSuccessBanner(`Room ${roomNo} deleted successfully.`);
      refreshData();
      if (onRoomsChanged) onRoomsChanged();
    }
  };

  // Handlers for Room Type
  const handleOpenAddRoomType = (rt?: PmsRoomType) => {
    if (rt) {
      setEditingRoomType(rt);
      setFormTypeName(rt.roomTypeName);
      setFormPackage(rt.package);
      setFormGstTax(rt.gstTaxString);
      setFormTariff(rt.roomTariff);
      setFormDiscount(rt.discountPercent);
    } else {
      setEditingRoomType(null);
      setFormTypeName('');
      setFormPackage('GENERAL || 0 || 0');
      setFormGstTax('GST 12% || 12.00 || 0.00');
      setFormTariff(2000);
      setFormDiscount(0);
    }
    setIsAddRoomTypeOpen(true);
  };

  const handleSaveRoomType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTypeName.trim()) {
      alert('Please enter Room Type Name');
      return;
    }

    let gstPercent = 12;
    if (formGstTax.includes('18')) gstPercent = 18;
    else if (formGstTax.includes('5')) gstPercent = 5;
    else if (formGstTax.includes('28')) gstPercent = 28;
    else if (formGstTax.includes('0')) gstPercent = 0;

    const newRT: PmsRoomType = {
      id: editingRoomType ? editingRoomType.id : `rt-${Date.now()}`,
      roomTypeName: formTypeName.trim().toUpperCase(),
      package: formPackage,
      gstTaxString: formGstTax,
      gstPercent,
      roomTariff: Number(formTariff) || 0,
      discountPercent: Number(formDiscount) || 0
    };

    PmsStore.saveRoomType(newRT);
    setSuccessBanner(editingRoomType ? 'Room Type updated successfully!' : 'Room Type Created successfully!');
    setIsAddRoomTypeOpen(false);
    refreshData();
  };

  const handleDeleteRoomType = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete Room Type "${name}"?`)) {
      PmsStore.deleteRoomType(id);
      setSuccessBanner(`Room Type ${name} deleted successfully.`);
      refreshData();
    }
  };

  // Filtered lists
  const filteredRooms = rooms.filter(r =>
    r.roomNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.roomType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.facilities && r.facilities.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredRoomTypes = roomTypes.filter(rt =>
    rt.roomTypeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rt.package.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pms-overlay" onClick={onClose}>
      <div className="pms-window" onClick={e => e.stopPropagation()} style={{ maxWidth: 1200, height: '90vh' }}>
        {/* Header bar */}
        <header className="pms-header" style={{ background: '#212529', color: '#fff' }}>
          <div className="pms-header-left">
            <span style={{ fontSize: 16 }}>🏢</span>
            <h2 className="pms-brand-title" style={{ fontSize: 15 }}>
              SRI SAI VASUDEV RESIDENCY &bull; {activeTab === 'rooms' ? 'ROOM MASTER (/rooms)' : 'ROOM TYPE MASTER (/roomtypes)'}
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

        {/* Tab Selector & Action Toolbar */}
        <div style={{ background: '#f8f9fa', padding: '10px 16px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => { setActiveTab('rooms'); setSuccessBanner(null); }}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #ced4da',
                borderRadius: 4,
                cursor: 'pointer',
                background: activeTab === 'rooms' ? '#0d6efd' : '#fff',
                color: activeTab === 'rooms' ? '#fff' : '#495057'
              }}
            >
              🛏️ Room Master ({rooms.length})
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('roomTypes'); setSuccessBanner(null); }}
              style={{
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                border: '1px solid #ced4da',
                borderRadius: 4,
                cursor: 'pointer',
                background: activeTab === 'roomTypes' ? '#0d6efd' : '#fff',
                color: activeTab === 'roomTypes' ? '#fff' : '#495057'
              }}
            >
              🏷️ Room Type Master ({roomTypes.length})
            </button>
          </div>

          <div>
            {activeTab === 'rooms' ? (
              <button
                type="button"
                onClick={() => handleOpenAddRoom()}
                style={{
                  background: '#0d6efd',
                  color: '#fff',
                  border: 'none',
                  padding: '7px 16px',
                  borderRadius: 4,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                + Add Room
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleOpenAddRoomType()}
                style={{
                  background: '#0d6efd',
                  color: '#fff',
                  border: 'none',
                  padding: '7px 16px',
                  borderRadius: 4,
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer'
                }}
              >
                + Add New Room Type
              </button>
            )}
          </div>
        </div>

        {/* Success Flash Banner matching Video 08 Frame 0640 */}
        {successBanner && (
          <div style={{ background: '#d1e7dd', color: '#0f5132', border: '1px solid #badbcc', padding: '10px 16px', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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

        {/* Datatable Filter Controls */}
        <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderBottom: '1px solid #e9ecef' }}>
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
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ padding: '4px 8px', border: '1px solid #ced4da', borderRadius: 3, width: 200, fontSize: 13 }}
            />
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#fff' }}>
          {activeTab === 'rooms' ? (
            /* Room Master Table matching Frame 0660 */
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left', color: '#495057' }}>
                  <th style={{ padding: '10px 12px', width: 60 }}>S.No</th>
                  <th style={{ padding: '10px 12px', width: 120 }}>Room No</th>
                  <th style={{ padding: '10px 12px', width: 180 }}>Room Type</th>
                  <th style={{ padding: '10px 12px', width: 90 }}>Floor</th>
                  <th style={{ padding: '10px 12px', width: 110 }}>Tariff (₹)</th>
                  <th style={{ padding: '10px 12px', width: 100 }}>Status</th>
                  <th style={{ padding: '10px 12px' }}>Facilities</th>
                  <th style={{ padding: '10px 12px', width: 90, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRooms.slice(0, entriesPerPage).map((room, idx) => (
                  <tr key={room.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '8px 12px', color: '#6c757d' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>{room.roomNo}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {room.roomType}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px' }}>{room.floor === 0 ? 'Ground' : `Floor ${room.floor}`}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#16a34a' }}>₹{room.tariff.toFixed(2)}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span
                        style={{
                          textTransform: 'capitalize',
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 3,
                          background:
                            room.status === 'vacant' ? '#dcfce7' :
                            room.status === 'occupied' ? '#fee2e2' :
                            room.status === 'booked' ? '#fef3c7' : '#f3e8ff',
                          color:
                            room.status === 'vacant' ? '#15803d' :
                            room.status === 'occupied' ? '#b91c1c' :
                            room.status === 'booked' ? '#b45309' : '#7e22ce'
                        }}
                      >
                        {room.status}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#475569', fontSize: 12 }}>
                      {room.facilities || '-'}
                    </td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenAddRoom(room)}
                          style={{
                            background: '#0d6efd',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 3,
                            padding: '3px 8px',
                            cursor: 'pointer',
                            fontSize: 11
                          }}
                          title="Edit Room"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRoom(room.roomNo)}
                          style={{
                            background: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 3,
                            padding: '3px 8px',
                            cursor: 'pointer',
                            fontSize: 11
                          }}
                          title="Delete Room"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            /* Room Type Master Table matching Frame 0640 */
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6', textAlign: 'left', color: '#495057' }}>
                  <th style={{ padding: '10px 12px', width: 60 }}>S.No</th>
                  <th style={{ padding: '10px 12px', width: 220 }}>Room Type</th>
                  <th style={{ padding: '10px 12px', width: 220 }}>Package</th>
                  <th style={{ padding: '10px 12px', width: 120 }}>GST %</th>
                  <th style={{ padding: '10px 12px', width: 130 }}>Room Tariff</th>
                  <th style={{ padding: '10px 12px', width: 90 }}>Dis %</th>
                  <th style={{ padding: '10px 12px', width: 90, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoomTypes.slice(0, entriesPerPage).map((rt, idx) => (
                  <tr key={rt.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '8px 12px', color: '#6c757d' }}>{idx + 1}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 700, color: '#0f172a' }}>{rt.roomTypeName}</td>
                    <td style={{ padding: '8px 12px', color: '#475569' }}>{rt.package}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 6px', borderRadius: 3, fontSize: 11, fontWeight: 600 }}>
                        GST {rt.gstPercent}%
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#16a34a' }}>₹{rt.roomTariff.toFixed(2)}</td>
                    <td style={{ padding: '8px 12px', color: '#6c757d' }}>{rt.discountPercent}%</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleOpenAddRoomType(rt)}
                          style={{
                            background: '#0d6efd',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 3,
                            padding: '3px 8px',
                            cursor: 'pointer',
                            fontSize: 11
                          }}
                          title="Edit Room Type"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRoomType(rt.id, rt.roomTypeName)}
                          style={{
                            background: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 3,
                            padding: '3px 8px',
                            cursor: 'pointer',
                            fontSize: 11
                          }}
                          title="Delete Room Type"
                        >
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info bar */}
        <div style={{ background: '#f8f9fa', padding: '8px 16px', borderTop: '1px solid #dee2e6', fontSize: 12, color: '#6c757d', display: 'flex', justifyContent: 'space-between' }}>
          <span>
            Showing 1 to {activeTab === 'rooms' ? filteredRooms.length : filteredRoomTypes.length} of {activeTab === 'rooms' ? rooms.length : roomTypes.length} entries
          </span>
          <span>SRI SAI VASUDEV RESIDENCY &bull; RAYAGADA PMS</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ADD / UPDATE ROOM POPUP MODAL (Exact Replica of Frame 0660) */}
      {/* ========================================================= */}
      {isAddRoomOpen && (
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
          onClick={() => setIsAddRoomOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              width: 500,
              maxWidth: '95vw',
              borderRadius: 6,
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: '12px 18px', borderBottom: '1px solid #dee2e6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: '#212529' }}>
                {editingRoom ? 'Update Room' : 'Add Room'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddRoomOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6c757d' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveRoom} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 4 }}>
                  Room No
                </label>
                <input
                  type="text"
                  placeholder="e.g. 701, 101, Ground 2 BHK"
                  value={formRoomNo}
                  onChange={e => setFormRoomNo(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 4 }}>
                  Room Type
                </label>
                <select
                  value={formRoomType}
                  onChange={e => setFormRoomType(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                >
                  {roomTypes.map(rt => (
                    <option key={rt.id} value={rt.roomTypeName}>
                      {rt.roomTypeName} || {rt.roomTariff} || GST {rt.gstPercent}%
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 4 }}>
                  Floor
                </label>
                <select
                  value={formFloor}
                  onChange={e => setFormFloor(Number(e.target.value))}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                >
                  <option value={0}>Ground Floor (0)</option>
                  <option value={1}>1st Floor</option>
                  <option value={2}>2nd Floor</option>
                  <option value={3}>3rd Floor</option>
                  <option value={4}>4th Floor</option>
                  <option value={5}>5th Floor</option>
                  <option value={6}>6th Floor</option>
                  <option value={7}>7th Floor</option>
                </select>
              </div>

              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 4 }}>
                  Facilities
                </label>
                <input
                  type="text"
                  placeholder="Room Facilities"
                  value={formFacilities}
                  onFocus={() => setFacilitySuggestionsOpen(true)}
                  onChange={e => setFormFacilities(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                />

                {facilitySuggestionsOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: '#fff',
                      border: '1px solid #ced4da',
                      borderRadius: 4,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      zIndex: 10,
                      maxHeight: 180,
                      overflowY: 'auto'
                    }}
                  >
                    <div style={{ padding: '4px 8px', fontSize: 11, color: '#6c757d', background: '#f8f9fa', borderBottom: '1px solid #eee' }}>
                      Suggested Facilities (Click to apply):
                    </div>
                    {FACILITY_CHIPS.map((chip, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setFormFacilities(chip);
                          setFacilitySuggestionsOpen(false);
                        }}
                        style={{
                          padding: '6px 10px',
                          fontSize: 12,
                          cursor: 'pointer',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        {chip}
                      </div>
                    ))}
                    <div
                      onClick={() => setFacilitySuggestionsOpen(false)}
                      style={{ padding: '4px 8px', textAlign: 'center', fontSize: 11, color: '#0d6efd', cursor: 'pointer', background: '#f8f9fa' }}
                    >
                      Close Suggestions
                    </div>
                  </div>
                )}
              </div>

              {/* Cloudflare R2 Room Image Uploads */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', margin: 0 }}>
                    📸 Room Gallery Images (Cloudflare R2)
                  </label>
                  <span style={{ fontSize: 11, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>
                    ☁️ S3 Compatible Storage
                  </span>
                </div>

                {uploadError && (
                  <div style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca', padding: '6px 10px', borderRadius: 4, fontSize: 11, marginBottom: 8 }}>
                    ⚠️ {uploadError}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {[1, 2, 3].map((slot) => {
                    const currentImg = slot === 1 ? roomImage1 : slot === 2 ? roomImage2 : roomImage3;
                    const setImg = slot === 1 ? setRoomImage1 : slot === 2 ? setRoomImage2 : setRoomImage3;
                    const isUploading = uploadingImageSlot === slot;

                    return (
                      <div key={slot} style={{ border: '1px dashed #cbd5e1', borderRadius: 6, padding: 6, textAlign: 'center', background: '#fff' }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>
                          Image {slot}
                        </div>
                        {currentImg ? (
                          <div style={{ position: 'relative', width: '100%', height: 64, borderRadius: 4, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                            <img src={currentImg} alt={`Room ${slot}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <button
                              type="button"
                              onClick={() => setImg('')}
                              title="Remove image"
                              style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', lineHeight: '18px', padding: 0 }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 64, cursor: isUploading ? 'not-allowed' : 'pointer', background: '#f1f5f9', borderRadius: 4, fontSize: 11, color: '#0284c7' }}>
                            {isUploading ? (
                              <span style={{ fontSize: 10 }}>⏳ Uploading...</span>
                            ) : (
                              <>
                                <span style={{ fontSize: 16 }}>📷</span>
                                <span style={{ fontSize: 10, fontWeight: 600 }}>Upload to R2</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploading}
                              style={{ display: 'none' }}
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadError(null);
                                setUploadingImageSlot(slot);
                                try {
                                  const res = await R2StorageClient.uploadPropertyImage(file);
                                  setImg(res.url);
                                } catch (err: any) {
                                  setUploadError(err.message || 'Image upload failed');
                                } finally {
                                  setUploadingImageSlot(null);
                                }
                              }}
                            />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid #dee2e6' }}>
                <button
                  type="button"
                  onClick={() => setIsAddRoomOpen(false)}
                  style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '6px 18px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD / UPDATE ROOM TYPE POPUP MODAL (Exact Replica of Frame 0620) */}
      {/* ========================================================= */}
      {isAddRoomTypeOpen && (
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
          onClick={() => setIsAddRoomTypeOpen(false)}
        >
          <div
            style={{
              background: '#fff',
              width: 480,
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
                {editingRoomType ? 'Edit Room Type' : 'Add Room Type'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddRoomTypeOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: '#6c757d' }}
              >
                ✕
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveRoomType} style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 4 }}>
                  Room Type Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. AC EXECUTIVE ROOM"
                  value={formTypeName}
                  onChange={e => setFormTypeName(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 4 }}>
                  Package
                </label>
                <select
                  value={formPackage}
                  onChange={e => setFormPackage(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                >
                  <option value="GENERAL || 0 || 0">GENERAL || 0 || 0</option>
                  <option value="WITHOUT BREACKFAST">WITHOUT BREACKFAST</option>
                  <option value="CONTINENTAL BREAKFAST">CONTINENTAL BREAKFAST</option>
                  <option value="EP (European Plan)">EP (European Plan)</option>
                  <option value="CP (Continental Plan)">CP (Continental Plan)</option>
                  <option value="MAP (Modified American)">MAP (Modified American)</option>
                  <option value="AP (American Plan)">AP (American Plan)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 4 }}>
                  GST / TAX %
                </label>
                <select
                  value={formGstTax}
                  onChange={e => setFormGstTax(e.target.value)}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                >
                  <option value="GST 5% || 5.00 || 0.00">GST 5% || 5.00 || 0.00</option>
                  <option value="GST 12% || 12.00 || 0.00">GST 12% || 12.00 || 0.00</option>
                  <option value="GST 18% || 18.00 || 0.00">GST 18% || 18.00 || 0.00</option>
                  <option value="GST 28% || 28.00 || 0.00">GST 28% || 28.00 || 0.00</option>
                  <option value="GST 0% || 0.00 || 0.00">GST 0% || 0.00 || 0.00</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 4 }}>
                  Room Tariff (₹)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={formTariff}
                  onChange={e => setFormTariff(Number(e.target.value))}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#495057', marginBottom: 4 }}>
                  Dis %
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={formDiscount}
                  onChange={e => setFormDiscount(Number(e.target.value))}
                  style={{ width: '100%', padding: '7px 10px', border: '1px solid #ced4da', borderRadius: 4, fontSize: 13 }}
                />
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10, paddingTop: 10, borderTop: '1px solid #dee2e6' }}>
                <button
                  type="button"
                  onClick={() => setIsAddRoomTypeOpen(false)}
                  style={{ background: '#6c757d', color: '#fff', border: 'none', padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  style={{ background: '#0d6efd', color: '#fff', border: 'none', padding: '6px 18px', borderRadius: 4, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
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
