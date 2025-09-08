import pprint
import unittest
import requests
from config import BROWSER_API_BASE_URL
from utils import Utils


class TestSendMsg(unittest.IsolatedAsyncioTestCase):

    def _send_msg(self,client_id, action, payload = None):
        try:
            json = {
                "clientId":client_id,
                "action":action,
                "payload": payload if payload is not None else {}
            }
            response = requests.post(f"{BROWSER_API_BASE_URL}/browser/sendMsg", json=json)
            json_res = response.json()
            print("_send_msg:", json, json_res)
            return json_res['body']
        except Exception as e:
            print("_send_msg request error:", e)
        return None

    #
    # async def test_packages(self):
    #     res = self._send_msg("atx-1","packages")
    #     pprint.pprint(res)
    #
    # async def test_packages_info(self):
    #     res = self._send_msg("atx-1","packagesInfo",{
    #         "packageName":"com.xingin.xhs"
    #     })
    #     pprint.pprint(res)
    #
    # async def test_packages_icon(self):
    #     res = self._send_msg("atx-1","packagesIcon",{
    #         "packageName":"com.xingin.xhs"
    #     })
    #     # Utils.show_datauri_image(res['imgData'])
    #     pprint.pprint(res)
    #
    # async def test_start_app(self):
    #     res = self._send_msg("atx-1","startApp",{
    #         "packageName":"com.xingin.xhs"
    #     })
    #     pprint.pprint(res)
    #
    # async def test_stop_app(self):
    #     res = self._send_msg("atx-1", "stopApp", {
    #         "packageName": "com.xingin.xhs"
    #     })
    #     pprint.pprint(res)
    #
    # async def test_kill_app(self):
    #     res = self._send_msg("atx-1", "killApp", {
    #         "packageName": "com.xingin.xhs"
    #     })
    #     pprint.pprint(res)
    #
    # async def test_dump_hierarchy(self):
    #     res = self._send_msg("atx-1", "dumpHierarchy")
    #     pprint.pprint(res)
    #
    # async def test_uiautomator(self):
    #     res = self._send_msg("atx-1", "uiautomator",{
    #         "method":"GET"
    #     })
    #     pprint.pprint(res)
    #     # if res['res']['running'] is False:
    #     #     res = self._send_msg("atx-1", "uiautomator", {
    #     #         "method": "POST"
    #     #     })
    #     #     pprint.pprint(res)
    #
    # async def test_screenshot(self):
    #     res = self._send_msg("atx-1", "screenshot")
    #     Utils.show_datauri_image(res['imgData'])
    #
    #     # pprint.pprint(res)


    async def test_version(self):
        self._send_msg("test-1", "version")

    async def test_shell(self):
        self._send_msg("test-1", "shell",{
            "cmd":"ls -alh"
        })
    async def test_deviceInfo(self):
        self._send_msg("test-1", "deviceInfo")

    async def test_pressKey(self):
        self._send_msg("test-1", "pressKey", {
            "params":["home"]
        })

    async def test_click(self):
        self._send_msg("test-1", "click",{
            "params":[1,1]
        })
    async def test_screenshot(self):
        self._send_msg("test-1", "screenshot",{
            "widthHierarchy":True
        })



if __name__ == '__main__':
    unittest.main()
