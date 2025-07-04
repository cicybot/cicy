import pprint
import unittest
import requests
from config import BROWSER_API_BASE_URL

class TestLdClient(unittest.IsolatedAsyncioTestCase):

    def _api(self, action, payload=None):
        try:
            response = requests.post(f"{BROWSER_API_BASE_URL}/ld/client", json={
                "action": action,
                "payload": payload if payload is not None else {}
            })
            json_res = response.json()
            print("_api:", action, json_res)
            return json_res
        except Exception as e:
            print("_api request error:", e)
        return None

    def _ld_console(self, cmd):
        return self._api("ldConsole", {
            "cmd": cmd
        })

    def test_help(self):
        res = self._api("help")
        pprint.pprint(res)

    def test_checkIfInstalled(self):
        res = self._api("checkIfInstalled")
        pprint.pprint(res)

    def test_getVmList(self):
        res = self._api("getVmList")
        pprint.pprint(res)

    def test_getLdList(self):
        res = self._api("getLdList")
        pprint.pprint(res)

    def test_runningList(self):
        res = self._api("runningList")
        pprint.pprint(res)

    def test_quitAll(self):
        res = self._api("quitAll")
        pprint.pprint(res)

    def test_add(self):
        res = self._api("add", {
            "name": "testAdd"
        })
        pprint.pprint(res)

    def test_remove(self):
        res = self._api("remove", {
            "index": 1
        })
        pprint.pprint(res)

    def test_quit(self):
        res = self._api("quit", {
            "index": 1
        })
        pprint.pprint(res)

    def test_isRunning(self):
        res = self._api("isRunning", {
            "index": 1
        })
        pprint.pprint(res)

    def test_reboot(self):
        res = self._api("reboot", {
            "index": 1
        })
        pprint.pprint(res)

    def test_backup(self):
        res = self._api("backup", {
            "index": 1
        })
        pprint.pprint(res)

    def test_rename(self):
        res = self._api("rename", {
            "index": 1,
            "title": "title"
        })
        pprint.pprint(res)

    def test_getConfig(self):
        res = self._api("getConfig", {
            "index": 1
        })
        pprint.pprint(res)

    def test_setRootMode(self):
        res = self._api("setRootMode", {
            "index": 1,
            "enable": True
        })
        pprint.pprint(res)

    def test_setAdbDebug(self):
        res = self._api("editConfig", {
            "index": 1,
            "key": "basicSettings.adbDebug",
            "enable": 1  # 0 1 2
        })
        pprint.pprint(res)

    def test_modify(self):
        res = self._api("modify", {
            "index": 1,
            "model": True,
        })
        pprint.pprint(res)

    def test_installApp(self):
        res = self._api("installApp", {
            "index": 1,
            "apk": "app-uiautomator-test.apk",
        })
        pprint.pprint(res)

    def test_installApp_web3(self):
        res = self._api("installApp", {
            "index": 4,
            "apk": "app-debug.apk",
        })
        pprint.pprint(res)

    def test_runApp(self):
        res = self._api("runApp", {
            "index": 3,
            "packageName": "com.web3desk.adr",
        })

        pprint.pprint(res)

    def test_unInstallApp(self):
        res = self._api("unInstallApp", {
            "index": 1,
            "packageName": "com.web3desk.adr",
        })

        pprint.pprint(res)

    def test_backupApp(self):
        res = self._api("backupApp", {
            "index": 1,
            "packageName": "com.pioneer.vpn.pro",
            "name": "pioneer"
        })
        pprint.pprint(res)

    def test_getApkInfo(self):
        res = self._api("getApkInfo", {
            "apk": "web3.apk",
        })
        pprint.pprint(res)

    def test_getprop(self):
        index = 1
        keyName = "ro.product.cpu.abi"
        res = self._api("ldConsole", {
            "cmd": f"getprop --index {index} --key {keyName}",
        })
        pprint.pprint(res)

    def test_launch(self):
        res = self._api("launch", {
            "index": 1
        })
        pprint.pprint(res)

    def test_adb_help(self):
        res = self._api("adb", {
            "cmd": "help",
            "index": 1
        })
        pprint.pprint(res)


    def test_adb_devices(self):
        self.test_runningList()
        res = self._api("adb", {
            "cmd": "devices",
            "index": 1
        })
        pprint.pprint(res)



if __name__ == '__main__':
    unittest.main()
