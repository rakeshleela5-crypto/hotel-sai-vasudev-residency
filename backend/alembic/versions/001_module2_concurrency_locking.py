"""Module 2: Database, Concurrency & Locking Migration

Revision ID: 001
Revises: 
Create Date: 2026-10-28 14:30:00.000000

Adds:
- idempotency_keys table (#1)
- webhook_events and failed_webhook_dlq tables (#36, #39)
- audit_logs table upgrade (staff_id, role, action, entity_type, entity_id, old_data, new_data, ip_address, created_at TIMESTAMPTZ) (#48)
- version_id optimistic locking integer column on rooms, rate_plans, guests, folios, and bookings (#25, #26)
- rate_plans, guests, folios, kot_orders tables
- Composite B-Tree indexes on bookings(check_in_date, check_out_date, status), folios(booking_id, status), kot_orders(room_id, status), kot_tickets(room_no, status), guests(phone, gstin) (#20)
- PostgreSQL btree_gist exclusion constraint on bookings preventing overlapping active reservations for same room_id (#14)
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy import inspect

revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()

    # 1. idempotency_keys table (#1)
    if 'idempotency_keys' not in existing_tables:
        op.create_table(
            'idempotency_keys',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('key', sa.String(length=255), nullable=False),
            sa.Column('endpoint', sa.String(length=255), nullable=False),
            sa.Column('request_hash', sa.String(length=64), nullable=False),
            sa.Column('response_status', sa.Integer(), nullable=True),
            sa.Column('response_body', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
        )
        op.create_index('ix_idempotency_keys_key', 'idempotency_keys', ['key'], unique=True)
        op.create_index('ix_idempotency_keys_id', 'idempotency_keys', ['id'])

    # 2. webhook_events table (#36)
    if 'webhook_events' not in existing_tables:
        op.create_table(
            'webhook_events',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('event_id', sa.String(length=100), nullable=False),
            sa.Column('source', sa.String(length=50), server_default='DECENTRO', nullable=False),
            sa.Column('event_type', sa.String(length=100), nullable=True),
            sa.Column('payload_json', sa.Text(), nullable=False),
            sa.Column('status', sa.String(length=50), server_default='PENDING', nullable=False),
            sa.Column('attempts', sa.Integer(), server_default='0', nullable=False),
            sa.Column('last_error', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True)
        )
        op.create_index('ix_webhook_events_event_id', 'webhook_events', ['event_id'], unique=True)
        op.create_index('ix_webhook_events_status', 'webhook_events', ['status'])
        op.create_index('ix_webhook_events_id', 'webhook_events', ['id'])

    # 3. failed_webhook_dlq table (#39)
    if 'failed_webhook_dlq' not in existing_tables:
        op.create_table(
            'failed_webhook_dlq',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('event_id', sa.String(length=100), nullable=False),
            sa.Column('source', sa.String(length=50), server_default='DECENTRO', nullable=False),
            sa.Column('payload_json', sa.Text(), nullable=False),
            sa.Column('failure_reason', sa.Text(), nullable=False),
            sa.Column('retry_count', sa.Integer(), server_default='3', nullable=False),
            sa.Column('status', sa.String(length=50), server_default='FAILED', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('replayed_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('replayed_by', sa.String(length=100), nullable=True)
        )
        op.create_index('ix_failed_webhook_dlq_event_id', 'failed_webhook_dlq', ['event_id'])
        op.create_index('ix_failed_webhook_dlq_status', 'failed_webhook_dlq', ['status'])
        op.create_index('ix_failed_webhook_dlq_id', 'failed_webhook_dlq', ['id'])

    # 4. audit_logs table (#48)
    if 'audit_logs' not in existing_tables:
        op.create_table(
            'audit_logs',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('staff_id', sa.String(length=100), nullable=True),
            sa.Column('role', sa.String(length=50), nullable=True),
            sa.Column('action', sa.String(length=100), nullable=True),
            sa.Column('entity_type', sa.String(length=100), nullable=True),
            sa.Column('entity_id', sa.String(length=100), nullable=True),
            sa.Column('old_data', sa.Text(), nullable=True),
            sa.Column('new_data', sa.Text(), nullable=True),
            sa.Column('ip_address', sa.String(length=50), nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
            sa.Column('event_type', sa.String(length=50), nullable=True),
            sa.Column('booking_ref', sa.String(length=50), nullable=True),
            sa.Column('performed_by', sa.String(length=100), nullable=True),
            sa.Column('details_json', sa.Text(), nullable=True)
        )
        op.create_index('ix_audit_logs_staff_id', 'audit_logs', ['staff_id'])
        op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])
        op.create_index('ix_audit_logs_entity_type', 'audit_logs', ['entity_type'])
        op.create_index('ix_audit_logs_entity_id', 'audit_logs', ['entity_id'])
        op.create_index('ix_audit_logs_id', 'audit_logs', ['id'])
    else:
        # Upgrade existing audit_logs columns
        existing_cols = [c['name'] for c in inspector.get_columns('audit_logs')]
        with op.batch_alter_table('audit_logs') as batch_op:
            if 'staff_id' not in existing_cols:
                batch_op.add_column(sa.Column('staff_id', sa.String(length=100), nullable=True))
                batch_op.create_index('ix_audit_logs_staff_id', ['staff_id'])
            if 'role' not in existing_cols:
                batch_op.add_column(sa.Column('role', sa.String(length=50), nullable=True))
            if 'action' not in existing_cols:
                batch_op.add_column(sa.Column('action', sa.String(length=100), nullable=True))
                batch_op.create_index('ix_audit_logs_action', ['action'])
            if 'entity_type' not in existing_cols:
                batch_op.add_column(sa.Column('entity_type', sa.String(length=100), nullable=True))
                batch_op.create_index('ix_audit_logs_entity_type', ['entity_type'])
            if 'entity_id' not in existing_cols:
                batch_op.add_column(sa.Column('entity_id', sa.String(length=100), nullable=True))
                batch_op.create_index('ix_audit_logs_entity_id', ['entity_id'])
            if 'old_data' not in existing_cols:
                batch_op.add_column(sa.Column('old_data', sa.Text(), nullable=True))
            if 'new_data' not in existing_cols:
                batch_op.add_column(sa.Column('new_data', sa.Text(), nullable=True))
            if 'ip_address' not in existing_cols:
                batch_op.add_column(sa.Column('ip_address', sa.String(length=50), nullable=True))

    # 5. rate_plans table
    if 'rate_plans' not in existing_tables:
        op.create_table(
            'rate_plans',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('plan_code', sa.String(length=50), nullable=False),
            sa.Column('name', sa.String(length=100), nullable=False),
            sa.Column('room_type_id', sa.Integer(), nullable=True),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('base_price_modifier', sa.Float(), server_default='0.0', nullable=True),
            sa.Column('is_active', sa.Boolean(), server_default='1', nullable=True),
            sa.Column('version_id', sa.Integer(), server_default='1', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True)
        )
        op.create_index('ix_rate_plans_plan_code', 'rate_plans', ['plan_code'], unique=True)
        op.create_index('ix_rate_plans_id', 'rate_plans', ['id'])

    # 6. guests table
    if 'guests' not in existing_tables:
        op.create_table(
            'guests',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('name', sa.String(length=150), nullable=False),
            sa.Column('phone', sa.String(length=50), nullable=False),
            sa.Column('email', sa.String(length=150), nullable=True),
            sa.Column('gstin', sa.String(length=20), nullable=True),
            sa.Column('id_proof_type', sa.String(length=50), server_default='Aadhaar Card', nullable=True),
            sa.Column('id_proof_number', sa.String(length=100), nullable=True),
            sa.Column('address', sa.Text(), nullable=True),
            sa.Column('city', sa.String(length=100), nullable=True),
            sa.Column('state', sa.String(length=100), nullable=True),
            sa.Column('pincode', sa.String(length=20), nullable=True),
            sa.Column('version_id', sa.Integer(), server_default='1', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True)
        )
        op.create_index('ix_guests_phone_gstin', 'guests', ['phone', 'gstin'])
        op.create_index('ix_guests_phone', 'guests', ['phone'])
        op.create_index('ix_guests_gstin', 'guests', ['gstin'])
        op.create_index('ix_guests_id', 'guests', ['id'])

    # 7. folios table
    if 'folios' not in existing_tables:
        op.create_table(
            'folios',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('booking_id', sa.Integer(), sa.ForeignKey('bookings.id'), nullable=False),
            sa.Column('folio_number', sa.String(length=50), nullable=False),
            sa.Column('status', sa.String(length=50), server_default='OPEN', nullable=False),
            sa.Column('total_charges', sa.Float(), server_default='0.0', nullable=True),
            sa.Column('total_payments', sa.Float(), server_default='0.0', nullable=True),
            sa.Column('balance_due', sa.Float(), server_default='0.0', nullable=True),
            sa.Column('version_id', sa.Integer(), server_default='1', nullable=False),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True)
        )
        op.create_index('ix_folios_folio_number', 'folios', ['folio_number'], unique=True)
        op.create_index('ix_folios_booking_id', 'folios', ['booking_id'])
        op.create_index('ix_folios_status', 'folios', ['status'])
        op.create_index('ix_folios_booking_id_status', 'folios', ['booking_id', 'status'])
        op.create_index('ix_folios_id', 'folios', ['id'])

    # 8. kot_orders table
    if 'kot_orders' not in existing_tables:
        op.create_table(
            'kot_orders',
            sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column('kot_number', sa.String(length=50), nullable=False),
            sa.Column('room_id', sa.Integer(), sa.ForeignKey('rooms.id'), nullable=True),
            sa.Column('room_no', sa.String(length=50), nullable=True),
            sa.Column('table_no', sa.String(length=50), nullable=True),
            sa.Column('status', sa.String(length=50), server_default='PLACED', nullable=False),
            sa.Column('total_amount', sa.Float(), server_default='0.0', nullable=True),
            sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
            sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True)
        )
        op.create_index('ix_kot_orders_kot_number', 'kot_orders', ['kot_number'], unique=True)
        op.create_index('ix_kot_orders_room_id', 'kot_orders', ['room_id'])
        op.create_index('ix_kot_orders_status', 'kot_orders', ['status'])
        op.create_index('ix_kot_orders_room_id_status', 'kot_orders', ['room_id', 'status'])
        op.create_index('ix_kot_orders_id', 'kot_orders', ['id'])

    # 9. Add version_id and missing columns to rooms table (#25, #26)
    if 'rooms' in existing_tables:
        room_cols = [c['name'] for c in inspector.get_columns('rooms')]
        with op.batch_alter_table('rooms') as batch_op:
            if 'version_id' not in room_cols:
                batch_op.add_column(sa.Column('version_id', sa.Integer(), server_default='1', nullable=False))
            if 'total_inventory' not in room_cols:
                batch_op.add_column(sa.Column('total_inventory', sa.Integer(), server_default='5', nullable=True))
            if 'housekeeping_status' not in room_cols:
                batch_op.add_column(sa.Column('housekeeping_status', sa.String(length=50), server_default='Clean', nullable=True))

    # 10. Add version_id and missing columns to bookings table (#25, #26)
    if 'bookings' in existing_tables:
        booking_cols = [c['name'] for c in inspector.get_columns('bookings')]
        booking_indexes = [idx['name'] for idx in inspector.get_indexes('bookings')]
        with op.batch_alter_table('bookings') as batch_op:
            if 'version_id' not in booking_cols:
                batch_op.add_column(sa.Column('version_id', sa.Integer(), server_default='1', nullable=False))
            if 'invoice_number' not in booking_cols:
                batch_op.add_column(sa.Column('invoice_number', sa.String(length=50), nullable=True))
            if 'id_proof_type' not in booking_cols:
                batch_op.add_column(sa.Column('id_proof_type', sa.String(length=50), server_default='Aadhaar Card', nullable=True))
            if 'id_proof_number' not in booking_cols:
                batch_op.add_column(sa.Column('id_proof_number', sa.String(length=50), nullable=True))
            if 'base_rate' not in booking_cols:
                batch_op.add_column(sa.Column('base_rate', sa.Float(), server_default='0.0', nullable=True))
            if 'base_amount' not in booking_cols:
                batch_op.add_column(sa.Column('base_amount', sa.Float(), server_default='0.0', nullable=True))
            if 'extra_guest_charge' not in booking_cols:
                batch_op.add_column(sa.Column('extra_guest_charge', sa.Float(), server_default='0.0', nullable=True))
            if 'gst_rate' not in booking_cols:
                batch_op.add_column(sa.Column('gst_rate', sa.Float(), server_default='12.0', nullable=True))
            if 'cgst_amount' not in booking_cols:
                batch_op.add_column(sa.Column('cgst_amount', sa.Float(), server_default='0.0', nullable=True))
            if 'sgst_amount' not in booking_cols:
                batch_op.add_column(sa.Column('sgst_amount', sa.Float(), server_default='0.0', nullable=True))
            if 'total_tax' not in booking_cols:
                batch_op.add_column(sa.Column('total_tax', sa.Float(), server_default='0.0', nullable=True))
            if 'total_paid' not in booking_cols:
                batch_op.add_column(sa.Column('total_paid', sa.Float(), server_default='0.0', nullable=True))
            if 'balance_due' not in booking_cols:
                batch_op.add_column(sa.Column('balance_due', sa.Float(), server_default='0.0', nullable=True))
            if 'key_deposit' not in booking_cols:
                batch_op.add_column(sa.Column('key_deposit', sa.Float(), server_default='0.0', nullable=True))
            if 'payment_status' not in booking_cols:
                batch_op.add_column(sa.Column('payment_status', sa.String(length=50), server_default='Pending', nullable=True))
            if 'payment_method' not in booking_cols:
                batch_op.add_column(sa.Column('payment_method', sa.String(length=50), server_default='Pay at Hotel', nullable=True))
            if 'updated_at' not in booking_cols:
                batch_op.add_column(sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True))

            if 'ix_bookings_check_in_date' not in booking_indexes:
                batch_op.create_index('ix_bookings_check_in_date', ['check_in_date'])
            if 'ix_bookings_check_out_date' not in booking_indexes:
                batch_op.create_index('ix_bookings_check_out_date', ['check_out_date'])
            if 'ix_bookings_invoice_number' not in booking_indexes:
                batch_op.create_index('ix_bookings_invoice_number', ['invoice_number'], unique=True)
            if 'ix_bookings_room_id' not in booking_indexes:
                batch_op.create_index('ix_bookings_room_id', ['room_id'])
            if 'ix_bookings_status' not in booking_indexes:
                batch_op.create_index('ix_bookings_status', ['status'])

    # 11. Add composite indexes on bookings, room_folio_items, kot_tickets (#20)
    if 'bookings' in existing_tables:
        booking_indexes = [idx['name'] for idx in inspector.get_indexes('bookings')]
        if 'ix_bookings_checkin_checkout_status' not in booking_indexes:
            op.create_index(
                'ix_bookings_checkin_checkout_status',
                'bookings',
                ['check_in_date', 'check_out_date', 'status']
            )

    if 'room_folio_items' in existing_tables:
        folio_indexes = [idx['name'] for idx in inspector.get_indexes('room_folio_items')]
        if 'ix_room_folio_items_booking_status' not in folio_indexes:
            op.create_index(
                'ix_room_folio_items_booking_status',
                'room_folio_items',
                ['booking_id', 'status']
            )

    if 'kot_tickets' in existing_tables:
        kot_indexes = [idx['name'] for idx in inspector.get_indexes('kot_tickets')]
        if 'ix_kot_tickets_room_status' not in kot_indexes:
            op.create_index(
                'ix_kot_tickets_room_status',
                'kot_tickets',
                ['room_no', 'status']
            )

    if 'inquiries' in existing_tables:
        inquiry_cols = [c['name'] for c in inspector.get_columns('inquiries')]
        if 'status' not in inquiry_cols:
            with op.batch_alter_table('inquiries') as batch_op:
                batch_op.add_column(sa.Column('status', sa.String(length=50), server_default='New', nullable=True))

    if 'housekeeping_discrepancies' in existing_tables:
        hk_indexes = [idx['name'] for idx in inspector.get_indexes('housekeeping_discrepancies')]
        if 'ix_housekeeping_discrepancies_discrepancy_id' not in hk_indexes:
            op.create_index('ix_housekeeping_discrepancies_discrepancy_id', 'housekeeping_discrepancies', ['discrepancy_id'])

    # 12. PostgreSQL btree_gist exclusion constraint on bookings (#14)
    if bind.dialect.name == "postgresql":
        op.execute("CREATE EXTENSION IF NOT EXISTS btree_gist;")
        op.execute("""
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = 'no_overlapping_active_bookings'
                ) THEN
                    ALTER TABLE bookings 
                    ADD CONSTRAINT no_overlapping_active_bookings 
                    EXCLUDE USING gist (
                        room_id WITH =,
                        daterange(check_in_date::date, check_out_date::date) WITH &&
                    ) WHERE (status IN ('Confirmed', 'Checked-In', 'CONFIRMED', 'CHECKED_IN'));
                END IF;
            END $$;
        """)

def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TABLE bookings DROP CONSTRAINT IF EXISTS no_overlapping_active_bookings;")

    with op.batch_alter_table('housekeeping_discrepancies') as batch_op:
        batch_op.drop_index('ix_housekeeping_discrepancies_discrepancy_id')
    with op.batch_alter_table('kot_tickets') as batch_op:
        batch_op.drop_index('ix_kot_tickets_room_status')
    with op.batch_alter_table('room_folio_items') as batch_op:
        batch_op.drop_index('ix_room_folio_items_booking_status')
    with op.batch_alter_table('bookings') as batch_op:
        batch_op.drop_index('ix_bookings_checkin_checkout_status')
        batch_op.drop_column('version_id')
    with op.batch_alter_table('rooms') as batch_op:
        batch_op.drop_column('version_id')

    op.drop_table('kot_orders')
    op.drop_table('folios')
    op.drop_table('guests')
    op.drop_table('rate_plans')
    op.drop_table('failed_webhook_dlq')
    op.drop_table('webhook_events')
    op.drop_table('idempotency_keys')
