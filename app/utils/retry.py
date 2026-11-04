"""
Retry Mechanism (#68) & Exponential Backoff (#69)
Reusable retry decorator using Tenacity for outbound Decentro API calls and Cloudflare R2 uploads.
Strictly targets network errors, timeouts, and 5xx server errors only (never 4xx).
"""

import logging
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception,
    before_sleep_log
)
import httpx

logger = logging.getLogger("pms_retry")

def is_network_or_5xx_error(exc: Exception) -> bool:
    """
    Predicate returning True only for network failures, 5xx server errors, and timeouts.
    Never retries 4xx client errors (400, 401, 403, 404, 409, 422, etc.).
    """
    # 1. Standard python network/socket timeouts
    if isinstance(exc, (TimeoutError, ConnectionError, OSError)):
        return True

    # 2. HTTPX client network & status errors
    if isinstance(exc, (httpx.TimeoutException, httpx.NetworkError, httpx.ConnectError, httpx.ReadTimeout, httpx.WriteTimeout)):
        return True
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code >= 500

    # 3. AWS / Cloudflare R2 / Boto3 / Botocore errors
    try:
        from botocore.exceptions import BotoCoreError, ClientError, EndpointConnectionError, ConnectTimeoutError, ReadTimeoutError
        if isinstance(exc, (BotoCoreError, EndpointConnectionError, ConnectTimeoutError, ReadTimeoutError)):
            return True
        if isinstance(exc, ClientError):
            status_code = exc.response.get("ResponseMetadata", {}).get("HTTPStatusCode")
            if status_code and status_code >= 500:
                return True
            code = exc.response.get("Error", {}).get("Code", "")
            if code in {"RequestTimeout", "InternalError", "ServiceUnavailable", "SlowDown", "Throttling", "RequestTimeTooSkewed"}:
                return True
    except ImportError:
        pass

    return False

# Reusable retry decorator: 3 attempts, exponential backoff (multiplier=1, min=2, max=10)
retry_network_or_5xx = retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception(is_network_or_5xx_error),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True
)

