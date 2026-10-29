"""
Application-Layer Field Encryption Utility (cryptography.fernet) (#50).
Protects sensitive guest Personally Identifiable Information (PII) including
Aadhaar numbers and Passport numbers prior to database persistence.
"""

import base64
import hashlib
import logging
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from sqlalchemy.types import TypeDecorator, String
from app.config import settings

logger = logging.getLogger("pms_encryption")

def _get_fernet_instance() -> Fernet:
    """Initializes or derives a valid 32-byte Fernet key from settings."""
    raw_key = (settings.FERNET_KEY or "").strip()
    try:
        if raw_key:
            # Validate if it's already a valid Fernet key (32 url-safe base64 bytes)
            key_bytes = raw_key.encode('utf-8')
            return Fernet(key_bytes)
    except Exception as exc:
        logger.warning(f"[Encryption] Key derivation fallback required ({exc}).")

    # Deterministically derive 32-byte url-safe base64 key from configured secret
    seed = raw_key or settings.JWT_SECRET_KEY or "svr-hotel-fernet-pii-secret-2026"
    digest = hashlib.sha256(seed.encode('utf-8')).digest()
    b64_key = base64.urlsafe_b64encode(digest)
    return Fernet(b64_key)

_fernet = _get_fernet_instance()
get_fernet_cipher = _get_fernet_instance

def encrypt_pii(plaintext: Optional[str]) -> Optional[str]:
    """
    Encrypts sensitive PII string using Fernet symmetric encryption.
    Prevents double-encryption if value already starts with Fernet signature ('gAAAAA').
    """
    if plaintext is None:
        return None
    cleaned = str(plaintext).strip()
    if not cleaned:
        return ""
    if cleaned.startswith("gAAAAA"):
        return cleaned  # Already encrypted

    try:
        encrypted_bytes = _fernet.encrypt(cleaned.encode('utf-8'))
        return encrypted_bytes.decode('utf-8')
    except Exception as exc:
        logger.error(f"[Encryption] Encryption failed for PII field: {exc}")
        return cleaned

def decrypt_pii(ciphertext: Optional[str]) -> Optional[str]:
    """
    Decrypts Fernet ciphertext back to UTF-8 plaintext.
    Gracefully handles unencrypted legacy text (returns plaintext as-is).
    """
    if ciphertext is None:
        return None
    cleaned = str(ciphertext).strip()
    if not cleaned:
        return ""
    if not cleaned.startswith("gAAAAA"):
        return cleaned  # Plaintext legacy record

    try:
        decrypted_bytes = _fernet.decrypt(cleaned.encode('utf-8'))
        return decrypted_bytes.decode('utf-8')
    except InvalidToken:
        logger.warning("[Encryption] Invalid token during PII decryption; returning masked fallback.")
        return "XXXX-INVALID-TOKEN"
    except Exception as exc:
        logger.error(f"[Encryption] Decryption error: {exc}")
        return cleaned

def mask_pii(val: Optional[str], visible_last: int = 4) -> Optional[str]:
    """
    Returns a privacy-safe masked string (e.g. Aadhaar XXXXXXXX5721).
    Automatically decrypts first if value is ciphertext.
    """
    if not val:
        return ""
    plain = decrypt_pii(val)
    if not plain or len(plain) <= visible_last:
        return "X" * len(plain)
    
    masked_part = "X" * (len(plain) - visible_last)
    return f"{masked_part}{plain[-visible_last:]}"

class EncryptedString(TypeDecorator):
    """
    SQLAlchemy TypeDecorator that transparently encrypts strings on write
    and decrypts on read (#50).
    """
    impl = String(255)
    cache_ok = True

    def process_bind_param(self, value, dialect):
        return encrypt_pii(value)

    def process_result_value(self, value, dialect):
        return decrypt_pii(value)
