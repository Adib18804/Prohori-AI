"""
Test runner for Prohori AI security tests

Usage:
    python run_tests.py              # Run all tests
    python run_tests.py --unit       # Run only unit tests
    python run_tests.py --integration # Run only integration tests
    python run_tests.py --coverage   # Run with coverage report
"""

import sys
import subprocess
from pathlib import Path

def run_tests(test_type=None, coverage=False):
    """Run tests with specified configuration"""
    
    # Change to tests directory
    tests_dir = Path(__file__).parent
    
    # Build pytest command
    cmd = ["pytest"]
    
    if test_type == "unit":
        cmd.extend([
            "test_agents.py",
            "test_attack_taxonomy.py",
        ])
    elif test_type == "integration":
        cmd.extend([
            "test_integration.py",
            "test_security.py",
        ])
    else:
        cmd.append(".")
    
    # Add options
    cmd.extend([
        "-v",          # Verbose
        "-s",          # Show print statements
        "--tb=short",  # Shorter traceback
        "--color=yes", # Colored output
    ])
    
    if coverage:
        cmd.extend([
            "--cov=app",
            "--cov-report=html",
            "--cov-report=term",
        ])
    
    print(f"Running: {' '.join(cmd)}")
    print("=" * 60)
    
    # Run tests
    result = subprocess.run(cmd, cwd=tests_dir)
    
    if coverage:
        print("\n" + "=" * 60)
        print("Coverage report generated in htmlcov/index.html")
    
    return result.returncode


def main():
    """Parse arguments and run tests"""
    
    args = sys.argv[1:]
    
    test_type = None
    coverage = False
    
    if "--unit" in args:
        test_type = "unit"
    elif "--integration" in args:
        test_type = "integration"
    
    if "--coverage" in args:
        coverage = True
    
    if "--help" in args or "-h" in args:
        print(__doc__)
        return 0
    
    return run_tests(test_type, coverage)


if __name__ == "__main__":
    sys.exit(main())
