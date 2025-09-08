import pprint
import unittest

from browser import Browser


class TestCloudFlare(unittest.IsolatedAsyncioTestCase):

    async def test_gmail(self):
        browser = Browser("https://dash.cloudflare.com/",
                          account_index=0,
                          proxy_enable=True,
                          proxy_rules="http://127.0.0.1:7897")
        await browser.open_window()
        browser.open_url()


if __name__ == '__main__':
    unittest.main()
