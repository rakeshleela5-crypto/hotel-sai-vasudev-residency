import Dexie, { type Table } from 'dexie';
import { apiClient, generateUUIDv4 } from './apiClient';

// =========================================================================
// TypeScript Interfaces for Dexie IndexedDB (#6, #33)
// =========================================================================

export interface CachedRoomRecord {
  id: string | number;
  roomNo: string;
  roomType: string;
  status: string; // vacant, occupied, dirty, blocked, maintenance
  tariff: number;
  floor: number;
  assignedStaff?: string;
  currentGuest?: string;
  priority?: string;
  lastCleaned?: string;
  lastUpdated: string;
  raw?: any;
}

export interface CachedMenuItemRecord {
  id: string | number;
  itemCode: string;
  itemName: string;
  category: string;
  rate: number;
  isAvailable: boolean;
  sacCode?: string;
  lastUpdated: string;
  raw?: any;
}

export interface QueuedKotOrder {
  id?: number; // Auto-incremented primary key
  clientRef: string; // Unique UUIDv4 for idempotency (#1)
  kotNo: string;
  serviceType: 'Room' | 'Restaurant' | 'Banquet';
  tableNo?: string;
  roomNo?: string;
  waiterName?: string;
  guestName?: string;
  items: Array<{
    sNo?: number;
    itemName: string;
    itemCode?: string;
    qty: number;
    rate: number;
    amount: number;
  }>;
  totalAmount: number;
  status: string;
  date: string;
  time: string;
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed';
  retryCount: number;
  lastError?: string;
}

export interface CachedBookingRecord {
  id: string;
  bookingNo: string;
  roomNo: string;
  guestName: string;
  phone?: string;
  status: string;
  checkInDate: string;
  checkOutDate: string;
  raw?: any;
}

export interface CachedCheckoutRecord {
  invoiceNo: string;
  roomNo: string;
  guestName: string;
  checkOutDate: string;
  netPayable: number;
  raw?: any;
}

export interface CachedKycDocument {
  id: string;
  guestId?: string;
  roomNo?: string;
  docType: string;
  docData: string;
  createdAt: string;
}

export interface CachedExpenseRecord {
  id: string;
  date: string;
  category: string;
  amount: number;
  description?: string;
  raw?: any;
}

export interface CachedStaffRecord {
  id: string;
  staffId: string;
  userName: string;
  role: string;
  department?: string;
  raw?: any;
}

export interface CachedAdvanceRecord {
  id: string;
  staffId: string;
  date: string;
  amount: number;
  raw?: any;
}

export interface CachedEodReportRecord {
  reportDate: string;
  summaryData: any;
  createdAt: string;
}

export interface QueuedMutation {
  id?: number;
  clientRef: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  payload: any;
  entityType: 'KOT' | 'HOUSEKEEPING' | 'CHECKIN' | 'RECEIPT' | 'PAYMENT' | 'EXPENSE' | 'GENERAL';
  statusDescription?: string;
  createdAt: string;
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
  retryCount: number;
  lastError?: string;
}

// =========================================================================
// SRI SAI VASUDEV RESIDENCY IndexedDB Database Class
// =========================================================================

export class HotelSaiVasudevDB extends Dexie {
  rooms!: Table<CachedRoomRecord, string | number>;
  menuItems!: Table<CachedMenuItemRecord, string | number>;
  kotQueue!: Table<QueuedKotOrder, number>;
  bookings!: Table<CachedBookingRecord, string>;
  checkouts!: Table<CachedCheckoutRecord, string>;
  kycDocuments!: Table<CachedKycDocument, string>;
  expenses!: Table<CachedExpenseRecord, string>;
  staff!: Table<CachedStaffRecord, string>;
  advances!: Table<CachedAdvanceRecord, string>;
  eodReports!: Table<CachedEodReportRecord, string>;
  offlineMutations!: Table<QueuedMutation, number>;

  constructor() {
    super('HotelSaiVasudev_ERP_Offline_DB');
    this.version(1).stores({
      rooms: 'id, roomNo, status, roomType, floor',
      menuItems: 'id, itemCode, category, isAvailable',
      kotQueue: '++id, clientRef, syncStatus, serviceType, createdAt'
    });
    this.version(2).stores({
      rooms: 'id, roomNo, status, roomType, floor',
      menuItems: 'id, itemCode, category, isAvailable',
      kotQueue: '++id, clientRef, syncStatus, serviceType, createdAt',
      bookings: 'id, bookingNo, roomNo, status, checkInDate, checkOutDate',
      checkouts: 'invoiceNo, roomNo, checkOutDate',
      kycDocuments: 'id, guestId, roomNo, docType, createdAt',
      expenses: 'id, date, category',
      staff: 'id, staffId, userName, role',
      advances: 'id, staffId, date',
      eodReports: 'reportDate, createdAt'
    });
    this.version(3).stores({
      rooms: 'id, roomNo, status, roomType, floor',
      menuItems: 'id, itemCode, category, isAvailable',
      kotQueue: '++id, clientRef, syncStatus, serviceType, createdAt',
      bookings: 'id, bookingNo, roomNo, status, checkInDate, checkOutDate',
      checkouts: 'invoiceNo, roomNo, checkOutDate',
      kycDocuments: 'id, guestId, roomNo, docType, createdAt',
      expenses: 'id, date, category',
      staff: 'id, staffId, userName, role',
      advances: 'id, staffId, date',
      eodReports: 'reportDate, createdAt',
      offlineMutations: '++id, clientRef, endpoint, syncStatus, entityType, createdAt'
    });
  }
}

export const offlineDb = new HotelSaiVasudevDB();

// =========================================================================
// Room Rack & Restaurant Menu Dexie Caching Helpers (#6, #33 Part A)
// =========================================================================

/**
 * Caches room rack inventory in IndexedDB for instant UI rendering on load
 */
export async function cacheRoomsLocally(rooms: any[]): Promise<void> {
  if (!rooms || rooms.length === 0) return;
  try {
    const records: CachedRoomRecord[] = rooms.map(r => ({
      id: String(r.id || r.roomNo),
      roomNo: String(r.roomNo || r.id),
      roomType: r.roomType || r.room_type || 'Deluxe',
      status: (r.status || 'vacant').toLowerCase(),
      tariff: Number(r.tariff || r.price_per_night || 2000),
      floor: Number(r.floor ?? (String(r.roomNo).startsWith('2') ? 1 : 0)),
      assignedStaff: r.assignedStaff,
      currentGuest: r.currentGuest,
      priority: r.priority,
      lastCleaned: r.lastCleaned,
      lastUpdated: new Date().toISOString(),
      raw: r
    }));

    await offlineDb.rooms.bulkPut(records);
  } catch (err) {
    console.warn('[Dexie] Failed to cache rooms in IndexedDB:', err);
  }
}

/**
 * Retrieves cached room records from IndexedDB
 */
export async function getCachedRooms(): Promise<CachedRoomRecord[]> {
  try {
    return await offlineDb.rooms.toArray();
  } catch (err) {
    console.warn('[Dexie] Failed to read rooms from IndexedDB:', err);
    return [];
  }
}

/**
 * Updates a single room's status in IndexedDB (e.g. from real-time WebSocket)
 */
export async function updateCachedRoomStatus(roomNo: string, newStatus: string): Promise<void> {
  try {
    const cleanRoomNo = String(roomNo).trim();
    const existing = await offlineDb.rooms.where('roomNo').equals(cleanRoomNo).first();
    if (existing) {
      await offlineDb.rooms.update(existing.id, {
        status: newStatus.toLowerCase(),
        lastUpdated: new Date().toISOString()
      });
    }
  } catch (err) {
    console.warn(`[Dexie] Failed to update room ${roomNo} status in IndexedDB:`, err);
  }
}

/**
 * Caches restaurant menu items in IndexedDB for instant offline order taking
 */
export async function cacheMenuLocally(menuItems: any[]): Promise<void> {
  if (!menuItems || menuItems.length === 0) return;
  try {
    const records: CachedMenuItemRecord[] = menuItems.map((item, idx) => ({
      id: String(item.id || item.itemCode || idx),
      itemCode: String(item.itemCode || item.code || idx),
      itemName: item.itemName || item.name || 'Menu Item',
      category: item.category || 'Food',
      rate: Number(item.rate || item.price || 0),
      isAvailable: item.isAvailable !== false,
      sacCode: item.sacCode || '996331',
      lastUpdated: new Date().toISOString(),
      raw: item
    }));

    await offlineDb.menuItems.bulkPut(records);
  } catch (err) {
    console.warn('[Dexie] Failed to cache menu items in IndexedDB:', err);
  }
}

/**
 * Retrieves cached menu items from IndexedDB
 */
export async function getCachedMenu(): Promise<CachedMenuItemRecord[]> {
  try {
    return await offlineDb.menuItems.toArray();
  } catch (err) {
    console.warn('[Dexie] Failed to read menu from IndexedDB:', err);
    return [];
  }
}

// =========================================================================
// Steward Offline KOT Queue & Auto-Sync Engine (#33 Part B)
// =========================================================================

/**
 * Saves a KOT order to IndexedDB queue if Wi-Fi drops or offline (#33)
 */
export async function queueOfflineKot(kotData: any): Promise<QueuedKotOrder> {
  const clientRef = kotData.clientRef || generateUUIDv4();
  const queuedOrder: QueuedKotOrder = {
    clientRef,
    kotNo: kotData.kotNo || `KOT/OFFLINE-${Date.now().toString(36).toUpperCase()}`,
    serviceType: kotData.serviceType || (kotData.roomNo ? 'Room' : 'Restaurant'),
    tableNo: kotData.tableNo,
    roomNo: kotData.roomNo,
    waiterName: kotData.waiterName || 'Steward',
    guestName: kotData.guestName || 'Guest',
    items: kotData.items || [],
    totalAmount: Number(kotData.totalAmount || 0),
    status: kotData.status || 'Running',
    date: kotData.date || new Date().toISOString().split('T')[0],
    time: kotData.time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    createdAt: new Date().toISOString(),
    syncStatus: 'pending',
    retryCount: 0
  };

  try {
    const id = await offlineDb.kotQueue.add(queuedOrder);
    queuedOrder.id = id;
    console.info(`[Offline KOT] Queued order ${queuedOrder.kotNo} in IndexedDB (ID: ${id})`);
  } catch (dbErr) {
    console.warn(`[Offline KOT] Failed to persist order ${queuedOrder.kotNo} to IndexedDB, using client memory fallback:`, dbErr);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('svr:kot_offline_queued', { detail: queuedOrder }));
  }

  // If currently online, trigger background flush immediately
  if (typeof window !== 'undefined' && window.navigator.onLine) {
    setTimeout(() => {
      flushKotQueue().catch(err => console.debug('[Offline KOT] Immediate flush note:', err));
    }, 100);
  }

  return queuedOrder;
}

/**
 * Gets count of pending offline KOT orders
 */
export async function getPendingKotCount(): Promise<number> {
  try {
    return await offlineDb.kotQueue.where('syncStatus').equals('pending').count();
  } catch {
    return 0;
  }
}

/**
 * Flushes all pending KOT orders in IndexedDB to the backend API (#33)
 * Automatically attaches clientRef as X-Idempotency-Key (#1)
 */
let isFlushingQueue = false;

export async function flushKotQueue(): Promise<{ synced: number; failed: number; totalPending: number }> {
  if (typeof window === 'undefined' || !window.navigator.onLine) {
    const count = await getPendingKotCount();
    return { synced: 0, failed: 0, totalPending: count };
  }

  if (isFlushingQueue) {
    return { synced: 0, failed: 0, totalPending: await getPendingKotCount() };
  }

  isFlushingQueue = true;
  let synced = 0;
  let failed = 0;

  try {
    const pendingOrders = await offlineDb.kotQueue
      .where('syncStatus')
      .anyOf('pending', 'failed')
      .toArray();

    if (pendingOrders.length === 0) {
      return { synced: 0, failed: 0, totalPending: 0 };
    }

    console.info(`[Offline KOT Sync] Wi-Fi active. Flushing ${pendingOrders.length} queued steward KOT orders to Central Kitchen...`);

    for (const order of pendingOrders) {
      if (!order.id) continue;

      try {
        await offlineDb.kotQueue.update(order.id, { syncStatus: 'syncing' });

        // Map payload to FastAPI /api/v1/kot schema
        const payload = {
          kotNo: order.kotNo,
          serviceType: order.serviceType,
          tableNo: order.tableNo,
          roomNo: order.roomNo,
          waiterName: order.waiterName,
          guestName: order.guestName,
          pax: 2,
          date: order.date,
          time: order.time,
          items: order.items,
          totalAmount: order.totalAmount,
          status: order.status,
          isPrinted: false
        };

        // Post to backend with UUIDv4 Idempotency Key
        await apiClient.post('/kot', payload, {
          idempotencyKey: order.clientRef
        });

        // Mark as synced in IndexedDB
        await offlineDb.kotQueue.update(order.id, {
          syncStatus: 'synced',
          retryCount: order.retryCount + 1
        });

        synced++;
        console.info(`[Offline KOT Sync] ✓ Successfully flushed KOT: ${order.kotNo}`);

        // Broadcast sync notification
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('svr:kot_synced', { detail: order }));
        }
      } catch (err: any) {
        failed++;
        console.warn(`[Offline KOT Sync] ⚠️ Failed to flush KOT ${order.kotNo}:`, err);
        await offlineDb.kotQueue.update(order.id, {
          syncStatus: 'failed',
          retryCount: order.retryCount + 1,
          lastError: err.message || String(err)
        });
      }
    }

    // Trigger visual toast / event if any items were flushed
    if (synced > 0 && typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('svr:kot_queue_flushed', {
          detail: { synced, failed, totalRemaining: await getPendingKotCount() }
        })
      );
    }
  } catch (err) {
    console.warn('[Offline KOT Sync] Queue iteration error:', err);
  } finally {
    isFlushingQueue = false;
  }

  const remaining = await getPendingKotCount();
  return { synced, failed, totalPending: remaining };
}

// =========================================================================
// Automated Online Reconnection & Periodic Heartbeat Sync Listener (#33)
// =========================================================================

// Generic Offline Mutation Queue
export async function queueOfflineMutation(
  mutation: Omit<QueuedMutation, 'id' | 'createdAt' | 'syncStatus' | 'retryCount'>
): Promise<QueuedMutation> {
  const clientRef = mutation.clientRef || generateUUIDv4();
  const queued: QueuedMutation = {
    ...mutation,
    clientRef,
    createdAt: new Date().toISOString(),
    syncStatus: 'pending',
    retryCount: 0
  };

  try {
    const id = await offlineDb.offlineMutations.add(queued);
    queued.id = id;
    console.info(`[Offline Sync] Queued ${queued.entityType} mutation for ${queued.endpoint} (ID: ${id})`);
  } catch (err) {
    console.warn('[Offline Sync] Failed to store mutation in IndexedDB:', err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('svr:mutation_queued', { detail: queued }));
    window.dispatchEvent(new CustomEvent('svr:sync_status_changed'));
  }

  if (typeof window !== 'undefined' && window.navigator.onLine) {
    setTimeout(() => {
      flushMutationQueue().catch(err => console.debug('[Offline Sync] Auto-flush error:', err));
    }, 150);
  }

  return queued;
}

export async function getPendingMutationCount(): Promise<number> {
  try {
    const mutCount = await offlineDb.offlineMutations
      .where('syncStatus')
      .anyOf('pending', 'failed')
      .count();
    const kotCount = await getPendingKotCount();
    return mutCount + kotCount;
  } catch {
    return 0;
  }
}

export async function getPendingMutations(): Promise<QueuedMutation[]> {
  try {
    return await offlineDb.offlineMutations
      .where('syncStatus')
      .anyOf('pending', 'failed', 'syncing')
      .sortBy('createdAt');
  } catch {
    return [];
  }
}

let isFlushingMutations = false;

export async function flushMutationQueue(): Promise<{ synced: number; failed: number; totalPending: number }> {
  // 1. Flush KOT orders first
  await flushKotQueue();

  if (typeof window === 'undefined' || !window.navigator.onLine) {
    const total = await getPendingMutationCount();
    return { synced: 0, failed: 0, totalPending: total };
  }

  if (isFlushingMutations) {
    return { synced: 0, failed: 0, totalPending: await getPendingMutationCount() };
  }

  isFlushingMutations = true;
  let synced = 0;
  let failed = 0;

  try {
    const pending = await offlineDb.offlineMutations
      .where('syncStatus')
      .anyOf('pending', 'failed')
      .sortBy('createdAt');

    for (const m of pending) {
      if (!m.id) continue;
      try {
        await offlineDb.offlineMutations.update(m.id, { syncStatus: 'syncing' });

        const method = (m.method || 'POST').toUpperCase();
        let res: any;
        if (method === 'POST') {
          res = await apiClient.post(m.endpoint, m.payload, { idempotencyKey: m.clientRef });
        } else if (method === 'PUT') {
          res = await apiClient.put(m.endpoint, m.payload, { idempotencyKey: m.clientRef });
        } else if (method === 'PATCH') {
          res = await apiClient.patch(m.endpoint, m.payload, { idempotencyKey: m.clientRef });
        } else if (method === 'DELETE') {
          res = await apiClient.delete(m.endpoint, { idempotencyKey: m.clientRef });
        }

        await offlineDb.offlineMutations.update(m.id, {
          syncStatus: 'synced',
          retryCount: m.retryCount + 1
        });
        synced++;

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('svr:mutation_synced', { detail: { mutation: m, response: res } }));
        }
      } catch (err: any) {
        failed++;
        const isConflict = err.status === 409;
        await offlineDb.offlineMutations.update(m.id, {
          syncStatus: isConflict ? 'conflict' : 'failed',
          retryCount: m.retryCount + 1,
          lastError: err.message || String(err)
        });
      }
    }

    if (synced > 0 && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('svr:mutation_queue_flushed', {
        detail: { synced, failed, totalRemaining: await getPendingMutationCount() }
      }));
      window.dispatchEvent(new CustomEvent('svr:sync_status_changed'));
    }
  } catch (err) {
    console.warn('[Offline Sync] Flush error:', err);
  } finally {
    isFlushingMutations = false;
  }

  const remaining = await getPendingMutationCount();
  return { synced, failed, totalPending: remaining };
}

if (typeof window !== 'undefined') {
  // Listen for Wi-Fi / Network restoration
  window.addEventListener('online', () => {
    console.info('[Network] Hotel Wi-Fi restored! Automatically flushing offline mutations & KOT queue...');
    flushMutationQueue().catch(err => console.warn('[Network] Auto-flush error on online event:', err));
  });

  // Periodic safety check every 25 seconds
  setInterval(() => {
    if (window.navigator.onLine) {
      getPendingMutationCount().then(count => {
        if (count > 0) {
          flushMutationQueue();
        }
      });
    }
  }, 25000);
}

// =========================================================================
// Heavy KYC Documents & PMS Store Asynchronous IndexedDB Helpers
// =========================================================================

export async function saveKycDocToIndexedDb(doc: CachedKycDocument): Promise<void> {
  try {
    await offlineDb.kycDocuments.put(doc);
  } catch (e) {
    console.warn('[IndexedDB] Failed to save KYC doc to IndexedDB:', e);
  }
}

export async function getKycDocFromIndexedDb(id: string): Promise<CachedKycDocument | undefined> {
  try {
    return await offlineDb.kycDocuments.get(id);
  } catch (e) {
    console.warn('[IndexedDB] Failed to retrieve KYC doc:', e);
    return undefined;
  }
}

export async function backupPmsStoreToIndexedDb(data: {
  bookings?: any[];
  checkouts?: any[];
  expenses?: any[];
}): Promise<void> {
  try {
    if (data.bookings?.length) {
      const records: CachedBookingRecord[] = data.bookings.map(b => ({
        id: String(b.bookingId || b.id || b.bookingNo),
        bookingNo: b.bookingNo || '',
        roomNo: b.roomNo || '',
        guestName: b.guestName || b.name || '',
        phone: b.guestPhone || b.phone || '',
        status: b.status || 'booked',
        checkInDate: b.checkInDate || '',
        checkOutDate: b.checkOutDate || '',
        raw: b
      }));
      await offlineDb.bookings.bulkPut(records);
    }
    if (data.checkouts?.length) {
      const records: CachedCheckoutRecord[] = data.checkouts.map(c => ({
        invoiceNo: c.invoiceNo,
        roomNo: c.roomNo,
        guestName: c.guestName,
        checkOutDate: c.checkOutDate,
        netPayable: c.netPayable,
        raw: c
      }));
      await offlineDb.checkouts.bulkPut(records);
    }
    if (data.expenses?.length) {
      const records: CachedExpenseRecord[] = data.expenses.map(e => ({
        id: String(e.id || Math.random()),
        date: e.date || '',
        category: e.category || 'General',
        amount: Number(e.amount || 0),
        description: e.description,
        raw: e
      }));
      await offlineDb.expenses.bulkPut(records);
    }
  } catch (err) {
    console.warn('[IndexedDB Backup] Failed to persist data to IndexedDB:', err);
  }
}
