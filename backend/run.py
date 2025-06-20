
#!/usr/bin/env python3

import uvicorn
import os
import sys

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    # Run the FastAPI application
    print("Starting SkillSpring Backend on 0.0.0.0:8000...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0", 
        port=8000,
        reload=True,
        reload_dirs=["./"],
        log_level="info"
    )
