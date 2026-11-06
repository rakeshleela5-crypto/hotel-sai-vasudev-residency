/**
 * PMS Modal Event Dispatcher & Registry
 * Enables any PMS component, dashboard, or drawer to open submodals
 * without mounting duplicate modal instances in the React tree.
 */

export type PmsModalId =
  | 'new_booking'
  | 'new_checkin'
  | 'booking_receipt'
  | 'direct_checkout'
  | 'calendar'
  | 'unconfirmed'
  | 'housekeeping'
  | 'petty_expense'
  | 'fbb_report'
  | 'kot_entry'
  | 'food_bill'
  | 'advance_receipt'
  | 'party_ledger'
  | 'room_master'
  | 'table_master'
  | 'item_master'
  | 'other_master'
  | 'business_setting'
  | 'company_info'
  | 'room_shift'
  | 'checkin_register'
  | 'kitchen_dashboard'
  | 'restaurant_kot'
  | 'table_dashboard'
  | 'shift_table'
  | 'nc_kot_register'
  | 'room_kot_register'
  | 'receipt_register'
  | 'outstanding_receivables'
  | 'payment_register'
  | 'purchase'
  | 'stock_transfer'
  | 'stock_report'
  | 'store_wise_stock'
  | 'online_guest_booking'
  | 'user_management'
  | 'roles_permissions'
  | 'chain_property'
  | 'device_preview'
  | 'whatsapp_setting'
  | 'whatsapp_logs'
  | 'police_station_report'
  | 'online_vs_offline'
  | 'hotel_bill_format'
  | 'company_branding'
  | 'checkout_register'
  | 'top20_features'
  | 'gst_reports'
  | 'day_end_report'
  | 'item_sales_report'
  | 'item_stock'
  | 'guest_log'
  | 'shift_handover'
  | 'help_support'
  | 'agent_commission'
  | 'liquor_bar'
  | 'no_discount_master'
  | 'banquet_billing'
  | 'gstr1_export'
  | 'r2_storage'
  | 'housekeeping_discrepancy'
  | 'rfid_keycard'
  | 'monthly_hotel_sale'
  | 'monthly_restaurant_sale'
  | 'staff_payroll'
  | 'eod_analytics'
  | 'room_qr_manager'
  | 'ca_export'
  | 'guest_portal';

export interface PmsModalOpenDetail {
  modal: PmsModalId;
  props?: Record<string, any>;
}

export function openPmsModal(modal: PmsModalId, props?: Record<string, any>): void {
  window.dispatchEvent(
    new CustomEvent<PmsModalOpenDetail>('pms:open_modal', {
      detail: { modal, props }
    })
  );
}

