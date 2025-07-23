import pprint
import unittest
import requests

class Agent:
    def __init__(self,client_id):
        self.client_id = client_id
    def jsonrpc(self,method,params = None):
        res = requests.post("http://localhost:4444/api/ws/sendMsg",json={
            "clientId": self.client_id,
            "action": "jsonrpc",
            "id":"1",
            "payload": {
                "method": method,
                "params": params if params is not None else []
            }
        },headers={
            "Authorization": "Bearer 50e75837-dc64-470a-a48d-faee468641d8"
        })
        return res.json()

    def shell(self,cmd):
        return self.jsonrpc("shell",[cmd])

agent = Agent("ADR-Redmi-2409BRN2CC-APP")

class AgentTest(unittest.TestCase):

    def test_info(self):
        deviceInfo  = agent.jsonrpc("deviceInfo")
        pprint.pprint(deviceInfo)
        agentAppInfo  = agent.jsonrpc("agentAppInfo")
        pprint.pprint(agentAppInfo)

    def test_current_package(self):
        res  = agent.shell("dumpsys window")
        print("\n")
        for line in res['result'].split("\n"):
            if "mCurrentFocus" in line and "=null" not in line:
                print(line.strip())

    def test_current_mem_info(self):
        res  = agent.shell("dumpsys meminfo com.cicy.agent.alpha")
        print("\n")

        for line in res['result'].split("\n"):
            if "TOTAL" in line:
                print(line.strip())


    def test_package_list(self):
        res  = agent.shell("pm list packages -3")
        # print("\n",res)

        for line in res['result'].split("\n"):
            print(line.strip())


    def test_package_list_f(self):
        res  = agent.shell("pm list packages -f")
        # print("\n",res)

        for line in res['result'].split("\n"):
            print(line.strip())

    def test_info(self):
        res  = agent.shell("dumpsys package com.microsoft.emmx")
        # print("\n",res)

        for line in res['result'].split("\n"):
            if "Main" in line.strip():
                print(line.strip())

    def test_start(self):
        res  = agent.shell("am start -n com.microsoft.emmx/com.microsoft.ruby.Main")
        # print("\n",res)

        for line in res['result'].split("\n"):
            print(line.strip())

    # com.microsoft.emmx
if __name__ == '__main__':
    unittest.main()
