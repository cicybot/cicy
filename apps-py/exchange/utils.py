import asyncio
import base64
import io
import subprocess
import time
from typing import Callable, Any, Optional, Union

import pyotp
from PIL import Image

class Utils:
    def open_local_browser(url):
        subprocess.run(["open", url])

    def show_datauri_image(datauri):
        """
        Display an image from a Data URI string using PIL.
        
        Args:
            datauri (str): Data URI string (starts with 'data:image/...')
        """
        # Extract the base64 part from the data URI
        header, encoded = datauri.split(",", 1)

        # Decode the base64 data
        image_data = base64.b64decode(encoded)

        # Create a BytesIO object and open it with PIL
        image = Image.open(io.BytesIO(image_data))

        # Show the image
        image.show()

    def get_otp(token):
        totp = pyotp.TOTP(token)
        return totp.now()

    def write_file(file_path, content, mode='w', encoding='utf-8', newline=None):
        """
        Write content to a file with specified parameters.
        
        Parameters:
            file_path (str): Path to the file to be written
            content (str or list): Content to write (string or list of strings)
            mode (str): File opening mode ('w' for write, 'a' for append)
            encoding (str): File encoding (default: 'utf-8')
            newline (str): Controls universal newlines mode (None for system default)
            
        Returns:
            int: Number of characters/bytes written
            
        Raises:
            IOError: If file cannot be written
        """
        try:
            with open(file_path, mode, encoding=encoding, newline=newline) as f:
                if isinstance(content, list):
                    # Join list with newlines if it's a list
                    content = '\n'.join(content)
                chars_written = f.write(content)
            return chars_written
        except IOError as e:
            raise IOError(f"Failed to write file {file_path}: {str(e)}")


async def wait_for_result(
        cb: Callable[[], Union[Any, asyncio.Future]],
        timeout: int = -1,
        interval: int = 100
) -> Optional[Any]:
    """
    Repeatedly calls an async or sync callback until it returns a truthy value,
    a timeout is reached, or an error occurs.
    
    Args:
        cb: A synchronous or asynchronous function to be executed repeatedly.
        timeout: Timeout in milliseconds. Default is -1 (no timeout).
        interval: Interval between calls in milliseconds.

    Returns:
        The truthy result from the callback, or a dict with an error.
    Example:
    
async def try_get_data():
    # Simulate a check that might return a value later
    from random import randint
    return randint(0, 5) == 3 and "Success"

result = await wait_for_result(try_get_data, timeout=2000, interval=200)
print(result)


    """
    start_time = time.time()

    while True:
        try:
            res = cb()
            if asyncio.iscoroutine(res):
                res = await res

            if res:
                return {"err": None, "result": res}

            if -1 < timeout < (time.time() - start_time) * 1000:
                return {'err': 'ERR_TIMEOUT'}

            await asyncio.sleep(interval / 1000.0)
        except Exception as e:
            print(f'Error in wait_for_result callback: {e}')
            return {'err': f'ERR:{e}'}
