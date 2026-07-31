"""Request Processing Time and Logging Middleware.

Logs execution metrics and duration for each HTTP request.
"""

import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.logging import logger


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for measuring and logging HTTP request execution duration."""

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time_ms = (time.time() - start_time) * 1000

        logger.info(
            "%s %s - Status: %s - Processed in %.2fms",
            request.method,
            request.url.path,
            response.status_code,
            process_time_ms,
        )
        response.headers["X-Process-Time-MS"] = f"{process_time_ms:.2f}"
        return response
