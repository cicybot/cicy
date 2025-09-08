import pprint
import unittest
import requests
from config import BROWSER_API_BASE_URL
import subprocess
import re


url = "http://192.168.25.98:9008/jsonrpc/0"

class TestLdClientU2Rpc(unittest.IsolatedAsyncioTestCase):

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

    def test_deviceInfo(self):
        self._api("u2Rpc", {
            "url":url,
            "method": "deviceInfo",
        })
    def test_dumpWindowHierarchy(self):
        self._api("u2Rpc", {
            "method": "dumpWindowHierarchy",
            "params":[False, 50]
        })

    def test_takeScreenshot(self):
        self._api("u2Rpc", {
            "method": "takeScreenshot",
            "params":[1, 80]
        })

    def test_setClipboard(self):
        self._api("u2Rpc", {
            "method": "setClipboard",
            "params":[None, "hello-world"]
        })

    def test_press(self):
        self._api("u2Rpc", {
            "method": "pressKey",
            "params":["home"]
        })

    def test_click(self):
        self._api("u2Rpc", {
            "method": "click",
            "params":[1,1]
        })


    def test_input(self):
        self._api("adb", {
            "cmd": "shell input -h",
            "index": 1
        })

if __name__ == '__main__':
    unittest.main()
