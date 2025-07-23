import unittest
import requests

class ProxyTestCase(unittest.TestCase):
    def test_myip(self):
        auth = "Account_10001:pwd"
        proxy = f'http://{auth}@127.0.0.1:4445'
        proxy_servers = {
            'https': proxy,
        }
        res = requests.get("https://api.myip.com/",proxies=proxy_servers)
        print(res.text)
        self.assertEqual(res.status_code, 200)  # add assertion here

    def test_baidu(self):
        auth = "Account_10001:pwd"
        proxy = f'http://{auth}@127.0.0.1:4445'
        proxy_servers = {
            'https': proxy,
        }
        res = requests.get("https://www.baidu.com/",proxies=proxy_servers)
        print(res.text)
        self.assertEqual(res.status_code, 200)  # add assertion here


if __name__ == '__main__':
    unittest.main()
