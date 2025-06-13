from fastapi import FastAPI, APIRouter, Depends
from fastapi.middleware.cors import CORSMiddleware
from api.auth.dependencies import get_authenticated_user_id
from .settings import config
from api.project.views import router as project_router
from api.task.views import router as task_router

router = APIRouter(dependencies=[Depends(get_authenticated_user_id)])
router.include_router(project_router)
router.include_router(task_router)


def get_app() -> FastAPI:
    app = FastAPI(
        docs_url=None,
        redoc_url=None,
        openapi_url="/openapi.json" if config.is_local else None,
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
