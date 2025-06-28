from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, NoResultFound
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """Global error handling middleware"""
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except HTTPException:
            # Let FastAPI handle HTTP exceptions normally
            raise
        except RequestValidationError:
            # Let FastAPI handle validation errors normally
            raise
        except NoResultFound as e:
            logger.warning(f"Resource not found: {str(e)}")
            return JSONResponse(
                status_code=404,
                content={"detail": "Resource not found"}
            )
        except IntegrityError as e:
            logger.error(f"Database integrity error: {str(e)}")
            return JSONResponse(
                status_code=409,
                content={"detail": "Data integrity constraint violation"}
            )
        except Exception as e:
            logger.error(f"Unhandled error: {str(e)}", exc_info=True)
            return JSONResponse(
                status_code=500,
                content={"detail": "Internal server error"}
            )