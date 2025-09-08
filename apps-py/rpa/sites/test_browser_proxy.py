import pprint
import unittest

from browser import Browser


class TestBrowserProxy(unittest.IsolatedAsyncioTestCase):

    async def test_cloudflare(self):
        browser = Browser("https://tiny-moon-189c.web3-explorer.workers.dev/",
                          account_index=1,
                          proxy_enable=True,
                          proxy_rules="http://127.0.0.1:7897")
        await browser.open_window()
        browser.open_url()
        res = browser.exec_js("""return document.body.textContent;""")
        pprint.pprint(res)

    async def test_httpbin(self):
        browser = Browser("https://httpbin.org/ip",
                          account_index=1,
                          proxy_enable=True,
                          proxy_rules="http://127.0.0.1:7897")

        await browser.open_window()
        browser.open_url()
        res = browser.exec_js("""return document.body.textContent;""")
        pprint.pprint(res['result'].strip())

    async def test_proxy(self):
        browser = Browser("https://2025.ip138.com/",
                          account_index=1,
                          proxy_enable=True,
                          proxy_rules="http://127.0.0.1:7897")
        await browser.open_window()
        browser.open_url()
        res = browser.exec_js("""return document.body.textContent;""")
        pprint.pprint(res['result'].strip().split("\n")[0])

    async def test_ip(self):
        browser = Browser("https://ifconfig.me/all.json", account_index=1)
        await browser.open_window()
        browser.open_url()
        res = browser.exec_js("""return document.body.textContent;""")
        pprint.pprint(res)


    async def test_ip138(self):
        browser = Browser("https://2025.ip138.com/", account_index=1)
        await browser.open_window()
        browser.open_url()
        res = browser.exec_js("""return document.body.textContent;""")
        pprint.pprint(res.strip().split("\n")[0])

    async def test_google(self):
        browser = Browser("https://www.google.com/", account_index=1)
        await browser.open_window()
        browser.open_url()
        browser.set_proxy(False, 'http://127.0.0.1:7897')
        browser.go_to("https://www.google.com/")
        await browser.wait_dom_ready()
        res = browser.exec_js("""return document.body.textContent;""")
        pprint.pprint(res.strip().split("\n")[0])


if __name__ == '__main__':
    unittest.main()
