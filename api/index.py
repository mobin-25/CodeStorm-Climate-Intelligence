import os
import sys

# Add the backend directory to sys.path so 'app' can be imported cleanly
current_dir = os.path.dirname(os.path.abspath(__file__))
root_dir = os.path.dirname(current_dir)
backend_path = os.path.join(root_dir, "backend")

if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Import the FastAPI application instance
from app.main import app  # noqa: E402

# Vercel ASGI serverless entrypoint
__all__ = ["app"]

