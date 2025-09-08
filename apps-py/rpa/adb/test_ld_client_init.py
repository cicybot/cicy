import pprint
import unittest
import requests
from config import BROWSER_API_BASE_URL
import subprocess
import re

index = 0


def get_local_ws_server_ip():
    try:
        result = subprocess.run(['ifconfig'], capture_output=True, text=True)
        # Match 192.168.x.x addresses
        matches = re.findall(r'inet (192\.168\.\d+\.\d+)', result.stdout)
        if matches:
            return matches[0]
    except Exception as e:
        print(f"Error getting IP: {e}")
    return None


class TestLdClientInit(unittest.IsolatedAsyncioTestCase):

    def _api(self, action, payload=None):
        try:
            json = {
                "action": action,
                "payload": payload if payload is not None else {}
            }
            response = requests.post(f"{BROWSER_API_BASE_URL}/ld/client", json=json)
            json_res = response.json()
            print("_api:", json, json_res)
            return json_res
        except Exception as e:
            print("_api request error:", e)
        return None

    def test_get_ip(self):
        self._api("adb", {
            "cmd": "shell ifconfig | grep 192",
            "index": index
        })


    def test_api(self):
        ip = get_local_ws_server_ip()
        print(f"local_ws_server_ip: {ip}")
        ws = f"ws://{ip}:3101/ws?id=ld-{index}"
        self._api("adb", {
            "cmd": f"shell /data/local/tmp/cc-agent-adr server -d --stop --ws='{ws}'",
            "index": index
        })
        self._api("adb", {
            "cmd": "shell /data/local/tmp/cc-agent-adr curl http://127.0.0.1:4444/version",
            "index": index
        })
        self._api("adb", {
            "cmd": "shell /data/local/tmp/cc-agent-adr curl http://127.0.0.1:9008/ping",
            "index": index
        })

    def test_handle_files(self):
        keyName = "ro.product.cpu.abi"
        res = self._api("ldConsole", {
            "cmd": f"getprop --index {index} --key {keyName}",
        })
        abi = res['res']  # x86_64
        cc_agent_adr_name = {
            "x86_64": "cc-agent-adr-386"
        }[abi]

        cc_agent_ws_name = {
            "x86_64": "cc-agent-ws-386"
        }[abi]

        print(f"abi: {abi}")
        print(f"cc_agent_adr_name: {cc_agent_adr_name}")
        print(f"cc_agent_ws_name: {cc_agent_ws_name}")

        self._api("adb", {
            "cmd": "push $assets/u2.jar /data/local/tmp/",
            "index": index
        })

        self._api("adb", {
            "cmd": f"push $assets/{cc_agent_adr_name} /data/local/tmp/cc-agent-adr",
            "index": index
        })

        self._api("adb", {
            "cmd": f"push $assets/{cc_agent_ws_name} /data/local/tmp/cc-agent-ws",
            "index": index
        })

        self._api("adb", {
            "cmd": f"shell chmod +x /data/local/tmp/cc-agent-adr",
            "index": index
        })

        self._api("adb", {
            "cmd": f"shell chmod +x /data/local/tmp/cc-agent-ws",
            "index": index
        })
        self._api("adb", {
            "cmd": "shell ls /data/local/tmp",
            "index": index
        })


if __name__ == '__main__':
    unittest.main()
