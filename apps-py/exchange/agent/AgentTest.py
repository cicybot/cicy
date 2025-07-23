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


if __name__ == '__main__':
    unittest.main()
