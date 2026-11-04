"""Soft Deletes, GST Compliance & Concurrency Hardening Migration

Revision ID: 002
Revises: 001
Create Date: 2026-11-04 20:10:00.000000

Adds:
- is_deleted (Boolean, default False) and void_reason (String(255)) columns to:
  - rooms
  - bookings
  - room_folio_items
  - kot_tickets
  - food_bills
  - checkout_records
  - bar_invoices
  - folios
  - kot_orders
- B-Tree indexes on ix_<table>_is_deleted across all hardened entities
- Safe reversible upgrade and downgrade paths with batch_alter_table
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = '002'
down_revision: Union[str, None] = '001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

HARDENED_TABLES = [
    'rooms',
    'bookings',
    'room_folio_items',
    'kot_tickets',
    'food_bills',
    'checkout_records',
    'bar_invoices',
    'folios',
    'kot_orders'
]

def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()

    for table_name in HARDENED_TABLES:
        if table_name in existing_tables:
            columns = [c['name'] for c in inspector.get_columns(table_name)]
            indexes = [idx['name'] for idx in inspector.get_indexes(table_name)]

            with op.batch_alter_table(table_name) as batch_op:
                if 'is_deleted' not in columns:
                    batch_op.add_column(
                        sa.Column('is_deleted', sa.Boolean(), server_default=sa.text('false'), nullable=False)
                    )
                if 'void_reason' not in columns:
                    batch_op.add_column(
                        sa.Column('void_reason', sa.String(length=255), nullable=True)
                    )

            # Re-inspect to create index safely
            updated_inspector = inspect(bind)
            updated_indexes = [idx['name'] for idx in updated_inspector.get_indexes(table_name)]
            idx_name = f'ix_{table_name}_is_deleted'
            if idx_name not in updated_indexes:
                op.create_index(idx_name, table_name, ['is_deleted'])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()

    for table_name in HARDENED_TABLES:
        if table_name in existing_tables:
            columns = [c['name'] for c in inspector.get_columns(table_name)]
            indexes = [idx['name'] for idx in inspector.get_indexes(table_name)]
            idx_name = f'ix_{table_name}_is_deleted'

            if idx_name in indexes:
                op.drop_index(idx_name, table_name=table_name)

            with op.batch_alter_table(table_name) as batch_op:
                if 'void_reason' in columns:
                    batch_op.drop_column('void_reason')
                if 'is_deleted' in columns:
                    batch_op.drop_column('is_deleted')

