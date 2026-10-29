"""
Backwards-compatibility shim for decentro_client.
All core logic is implemented in app.services.decentro.
"""
from app.services.decentro import (
    DecentroClient,
    decentro_client,
    circuit_breaker,
    AsyncCircuitBreaker,
    CircuitState,
    DECENTRO_TIMEOUT,
    logger
)

__all__ = [
    "DecentroClient",
    "decentro_client",
    "circuit_breaker",
    "AsyncCircuitBreaker",
    "CircuitState",
    "DECENTRO_TIMEOUT",
    "logger"
]
