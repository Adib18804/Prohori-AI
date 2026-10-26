"""
Database initialization script
Runs the init_database function to create tables and seed data
"""

import sys
import os

# Add the parent directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database.init_db import init_database

if __name__ == "__main__":
    print("Initializing database...")
    try:
        init_database()
        print("✅ Database initialized successfully!")
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
