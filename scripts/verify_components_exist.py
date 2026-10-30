import os

# Let's verify specific files exist and check their exact paths
checks = [
    'src/components/pms/NewRoomCheckInModal.tsx',
    'src/components/pms/RoomCheckOutModal.tsx',
    'src/components/pms/CheckOutRegisterModal.tsx',
    'src/components/pms/KotEntryModal.tsx',
    'src/components/pms/FoodBillModal.tsx',
    'src/components/pms/BanquetHallBillingModal.tsx',
    'src/components/pms/LiquorBarManagementModal.tsx',
    'src/components/pms/AgentCommissionModal.tsx',
    'src/components/pms/ShiftHandoverModal.tsx',
    'src/components/pms/BookingCalendarModal.tsx',
    'src/components/pms/UnconfirmedBookingsModal.tsx',
    'src/components/pms/AdvanceReceiptModal.tsx',
    'src/components/pms/PettyExpenseModal.tsx',
    'src/components/pms/PaymentRegisterModal.tsx',
    'src/components/pms/ReceiptRegisterModal.tsx',
    'src/components/pms/PurchaseEntryModal.tsx',
    'src/components/pms/StockTransferModal.tsx',
    'src/components/pms/RfidKeyCardModal.tsx',
    'src/components/pms/HousekeepingTrackerModal.tsx',
    'src/components/pms/HousekeepingDiscrepancyModal.tsx',
    'src/components/pms/CompanyInfoModal.tsx',
    'src/components/pms/UserManagementModal.tsx',
    'src/components/pms/RolesPermissionsModal.tsx',
    'src/components/pms/WhatsAppSettingModal.tsx',
    'src/components/pms/WhatsAppLogsModal.tsx',
    'src/components/pms/OtherMasterModal.tsx'
]

for c in checks:
    assert os.path.exists(c), f"File {c} does not exist!"

print("All audited components verified present on disk.")
