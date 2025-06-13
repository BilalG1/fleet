import uvicorn
from .settings import config


def main() -> None:
    uvicorn.run(
        "api.app:get_app",
        workers=1,
        host="0.0.0.0",
        port=8000,
        reload=config.is_local,
        loop="uvloop",
        factory=True,
    )


if __name__ == "__main__":
    main()
