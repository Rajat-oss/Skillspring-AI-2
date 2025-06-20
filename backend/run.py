
#!/usr/bin/env python3

import uvicorn
import os
import sys
import logging
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

def main():
    """Start the FastAPI server"""
    try:
        logger.info("Starting SkillSpring AI Backend Server...")
        logger.info(f"Backend directory: {backend_dir}")
        
        # Ensure data directory exists
        data_dir = backend_dir / "data"
        data_dir.mkdir(exist_ok=True)
        logger.info(f"Data directory: {data_dir}")
        
        # Start the server
        uvicorn.run(
            "main:app",
            host="0.0.0.0",
            port=8000,
            reload=True,
            reload_dirs=[str(backend_dir)],
            log_level="info"
        )
        
    except Exception as e:
        logger.error(f"Failed to start server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
