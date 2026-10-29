"""
Input Sanitization & XSS Prevention Utility (#42, #43).
Sanitizes free-text inputs against script injection, HTML tags, and malicious payloads.
"""

import re
import html
from typing import Optional, Any, Dict, List, Union

# Regex patterns for dangerous HTML/script injection
SCRIPT_TAG_REGEX = re.compile(r'<script.*?>.*?</script>', flags=re.IGNORECASE | re.DOTALL)
HTML_TAG_REGEX = re.compile(r'<[^>]+>')
JAVASCRIPT_URI_REGEX = re.compile(r'javascript\s*:', flags=re.IGNORECASE)
DATA_URI_REGEX = re.compile(r'data:\s*text/html', flags=re.IGNORECASE)
DANGEROUS_ATTRS_REGEX = re.compile(r'\bon\w+\s*=', flags=re.IGNORECASE)  # e.g. onerror=, onclick=

def sanitize_text(val: Optional[str], strip_all_html: bool = True) -> Optional[str]:
    """
    Sanitizes a string by stripping or neutralizing malicious scripts and HTML tags (#42, #43).
    """
    if val is None:
        return None
    s = str(val).strip()
    if not s:
        return ""

    # Neutralize script tags and event handlers
    s = SCRIPT_TAG_REGEX.sub('', s)
    s = JAVASCRIPT_URI_REGEX.sub('blocked_protocol:', s)
    s = DATA_URI_REGEX.sub('blocked_data:', s)
    s = DANGEROUS_ATTRS_REGEX.sub('blocked_attr=', s)

    if strip_all_html:
        s = HTML_TAG_REGEX.sub('', s)
        s = html.escape(s, quote=True)

    return s

def sanitize_payload(obj: Union[Dict, List, str, Any]) -> Any:
    """Recursively sanitizes all text values in a request dictionary or list."""
    if isinstance(obj, dict):
        return {k: sanitize_payload(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [sanitize_payload(elem) for elem in obj]
    elif isinstance(obj, str):
        return sanitize_text(obj, strip_all_html=False)
    return obj
