import unittest
import requests

class MyTestCase(unittest.TestCase):
    def test_proxy6001(self):
        proxy_user = "usa"
        proxy = f'http://{proxy_user}:@127.0.0.1:6001'
        proxy_servers = {
            'http': proxy,
            'https': proxy,
        }
        res = requests.get("https://api.myip.com/",proxies=proxy_servers)
        print(res.text)
        self.assertEqual(True, True)  # add assertion here


if __name__ == '__main__':
    unittest.main()
