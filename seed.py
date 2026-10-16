"""
Root wrapper for seeding the Drift database.
Enables running `python seed.py` directly from the project root.
"""

import sys
from pathlib import Path

# Add backend directory to sys.path
backend_path = Path(__file__).resolve().parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from simulator.seed import seed_database, print_summary

if __name__ == "__main__":
    seed_database()
    print_summary()
