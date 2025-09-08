import pprint
import unittest
import subprocess
from utils import Utils
import logging

logging.basicConfig(level=logging.DEBUG)


class TestLocalAdb(unittest.IsolatedAsyncioTestCase):

    def _adb(self, cmd: str) -> str:
        command = f"/Users/ton/Desktop/Android/sdk/platform-tools/adb {cmd}"
        logging.debug(f"Executing: {command}")
        try:
            result = subprocess.run(
                command, shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                check=False  # Don't raise exception on non-zero return code
            )

            print(f"stdout: {result.stdout.strip()}")
            if result.stderr:
                logging.warning(f"stderr: {result.stderr.strip()}")

            return result.stdout.strip()

        except Exception as e:
            logging.error(f"ADB command failed: {e}")
            return ""

    def shell(self,cmd):
        return self._adb(f"shell {cmd}")

    def test_shell_appops(self):
        # 查看系统 appops 权限（适用于 Android 10+）
        # PROJECT_MEDIA: allow
        # 这说明应用已获得“屏幕录制”权限（MediaProjection）。
        self.shell("appops get com.web3desk.adr")
        self.shell("appops get com.web3desk.adr | grep PROJECT_MEDIA")
        self.shell("appops set com.web3desk.adr PROJECT_MEDIA deny")
        self.shell("appops get com.web3desk.adr | grep PROJECT_MEDIA")
        self.shell("appops set com.web3desk.adr PROJECT_MEDIA allow")
        self.shell("appops get com.web3desk.adr | grep PROJECT_MEDIA")
        self.shell("dumpsys media_projection")

    def test_shell_enabled_accessibility_services(self):
        self.shell("settings get secure enabled_accessibility_services")

        # Rooted devices
        self.shell("settings put secure enabled_accessibility_services com.web3desk.adr/com.web3desk.adr.InputService")
        self.shell("settings put secure accessibility_enabled 1")




if __name__ == '__main__':
    unittest.main()
