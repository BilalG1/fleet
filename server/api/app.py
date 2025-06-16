from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, APIRouter, Depends
from fastapi.middleware.cors import CORSMiddleware
from api.auth.dependencies import get_authenticated_user_id
from .settings import config
from api.project.views import router as project_router
from api.task.views import router as task_router
from api.auth.views import router as auth_router
from api.task.cleanup_service import start_cleanup_service, stop_cleanup_service

router = APIRouter(dependencies=[Depends(get_authenticated_user_id)])
router.include_router(project_router)
router.include_router(task_router)
router.include_router(auth_router)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    await start_cleanup_service()
    yield
    await stop_cleanup_service()


def get_app() -> FastAPI:
    app = FastAPI(
        docs_url=None,
        redoc_url=None,
        openapi_url="/openapi.json" if config.is_local else None,
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router)
    
    return app
