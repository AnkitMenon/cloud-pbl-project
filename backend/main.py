import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import FRONTEND_ORIGINS, MAX_FILE_SIZE_MB
from database import Base, engine
from routes import auth, files

logger = logging.getLogger("cloudvault")

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="CloudVault API",
    description="REST API for CloudVault — a cloud-based file management system.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    """Turn pydantic's nested error list into one readable message for the UI."""
    first = exc.errors()[0] if exc.errors() else {}
    field = first.get("loc", ["", ""])[-1]
    msg = str(first.get("msg", "Invalid request")).removeprefix("Value error, ")
    if field == "file":
        msg = "Please choose a file to upload"
    elif field:
        msg = f"{str(field).capitalize()}: {msg}"
    return JSONResponse(status_code=422, content={"detail": msg})


@app.exception_handler(Exception)
async def unhandled_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Something went wrong on the server"})


app.include_router(auth.router)
app.include_router(files.router)


@app.get("/", tags=["Health"])
def health():
    return {"status": "ok", "service": "CloudVault API", "max_file_size_mb": MAX_FILE_SIZE_MB}
