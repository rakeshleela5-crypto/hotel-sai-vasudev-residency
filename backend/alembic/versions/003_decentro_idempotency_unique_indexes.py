"""Decentro Unique Indexes and Idempotency Keys Migration

Revision ID: 003
Revises: 002
Create Date: 2026-11-04 20:30:00.000000

Adds:
- decentro_txn_id and idempotency_key UNIQUE columns/indexes to payment_transactions
- decentro_txn_id and idempotency_key UNIQUE columns/indexes to webhook_events
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision: str = '003'
down_revision: Union[str, None] = '002'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()

    # 1. payment_transactions table
    if 'payment_transactions' in existing_tables:
        columns = [c['name'] for c in inspector.get_columns('payment_transactions')]

        with op.batch_alter_table('payment_transactions') as batch_op:
            if 'decentro_txn_id' not in columns:
                batch_op.add_column(sa.Column('decentro_txn_id', sa.String(length=150), nullable=True))
            if 'idempotency_key' not in columns:
                batch_op.add_column(sa.Column('idempotency_key', sa.String(length=255), nullable=True))

        updated_inspector = inspect(bind)
        updated_indexes = [idx['name'] for idx in updated_inspector.get_indexes('payment_transactions')]

        if 'uq_payment_transactions_decentro_txn_id' not in updated_indexes:
            try:
                op.create_index(
                    'uq_payment_transactions_decentro_txn_id',
                    'payment_transactions',
                    ['decentro_txn_id'],
                    unique=True
                )
            except Exception:
                pass

        if 'uq_payment_transactions_idempotency_key' not in updated_indexes:
            try:
                op.create_index(
                    'uq_payment_transactions_idempotency_key',
                    'payment_transactions',
                    ['idempotency_key'],
                    unique=True
                )
            except Exception:
                pass

    # 2. webhook_events table
    if 'webhook_events' in existing_tables:
        columns = [c['name'] for c in inspector.get_columns('webhook_events')]

        with op.batch_alter_table('webhook_events') as batch_op:
            if 'decentro_txn_id' not in columns:
                batch_op.add_column(sa.Column('decentro_txn_id', sa.String(length=150), nullable=True))
            if 'idempotency_key' not in columns:
                batch_op.add_column(sa.Column('idempotency_key', sa.String(length=255), nullable=True))

        updated_inspector = inspect(bind)
        updated_indexes = [idx['name'] for idx in updated_inspector.get_indexes('webhook_events')]

        if 'uq_webhook_events_decentro_txn_id' not in updated_indexes:
            try:
                op.create_index(
                    'uq_webhook_events_decentro_txn_id',
                    'webhook_events',
                    ['decentro_txn_id'],
                    unique=True
                )
            except Exception:
                pass

        if 'uq_webhook_events_idempotency_key' not in updated_indexes:
            try:
                op.create_index(
                    'uq_webhook_events_idempotency_key',
                    'webhook_events',
                    ['idempotency_key'],
                    unique=True
                )
            except Exception:
                pass


def downgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        bind.execute(sa.text("DROP TABLE IF EXISTS _alembic_tmp_webhook_events"))
        bind.execute(sa.text("DROP TABLE IF EXISTS _alembic_tmp_payment_transactions"))

    inspector = inspect(bind)
    existing_tables = inspector.get_table_names()

    if 'webhook_events' in existing_tables:
        indexes = [idx['name'] for idx in inspector.get_indexes('webhook_events')]
        if 'uq_webhook_events_idempotency_key' in indexes:
            op.drop_index('uq_webhook_events_idempotency_key', table_name='webhook_events')
        if 'uq_webhook_events_decentro_txn_id' in indexes:
            op.drop_index('uq_webhook_events_decentro_txn_id', table_name='webhook_events')

        columns = [c['name'] for c in inspector.get_columns('webhook_events')]
        with op.batch_alter_table('webhook_events') as batch_op:
            if 'idempotency_key' in columns:
                batch_op.drop_column('idempotency_key')
            if 'decentro_txn_id' in columns:
                batch_op.drop_column('decentro_txn_id')

    if 'payment_transactions' in existing_tables:
        indexes = [idx['name'] for idx in inspector.get_indexes('payment_transactions')]
        if 'uq_payment_transactions_idempotency_key' in indexes:
            op.drop_index('uq_payment_transactions_idempotency_key', table_name='payment_transactions')
        if 'uq_payment_transactions_decentro_txn_id' in indexes:
            op.drop_index('uq_payment_transactions_decentro_txn_id', table_name='payment_transactions')

        columns = [c['name'] for c in inspector.get_columns('payment_transactions')]
        with op.batch_alter_table('payment_transactions') as batch_op:
            if 'idempotency_key' in columns:
                batch_op.drop_column('idempotency_key')
