import os
from pathlib import Path


def get_file_size(file_path: str) -> int:
    """
    Get the size of a file in bytes.

    Args:
        file_path: Path to the file

    Returns:
        int: File size in bytes, returns 0 if file doesn't exist or is not a file
    """
    try:
        # Check if file exists and is a file (not a directory)
        if not os.path.exists(file_path) or not os.path.isfile(file_path):
            return 0

        # Get file size
        return os.path.getsize(file_path)

    except Exception:
        # Return 0 for any error (permission issues, etc.)
        return 0
def create_dir(file_path: str) -> bool:
    """
    Create directory for the given file path using pathlib.

    Args:
        file_path: The full file path (e.g., "/data/data/test.mp4")

    Returns:
        bool: True if directory was created or already exists, False on error
    """
    try:
        # Create a Path object
        path = Path(file_path)

        # Get the parent directory and create it
        path.parent.mkdir(parents=True, exist_ok=True)
        return True

    except Exception as e:
        print(f"Error creating directory for {file_path}: {e}")
        return False
