import pprint
import unittest

from browser import Browser


class TestBrowser(unittest.IsolatedAsyncioTestCase):

    async def test_exec_js(self):
        browser = Browser("https://www.baidu.com/", account_index=1)
        await browser.open_window()
        info = browser.info()
        pprint.pprint(info)
        if info['url'] and (info['url'] == 'about:blank' or info['err']!=''):
            browser.open_url()
        res = browser.exec_js("""console.log(1)""")
        pprint.pprint(res)

    async def test_exec_js_1(self):
        browser = Browser("https://www.baidu.com/", account_index=1)
        await browser.open_window()
        browser.open_url()
        res = browser.exec_js("""return {test:1}""")
        pprint.pprint(res)

    async def test_navigator(self):
        browser = Browser("https://www.baidu.com/", account_index=1)
        await browser.open_window()
        browser.open_url()
        res = browser.exec_js("""
        return {
            userAgent:navigator.userAgent,
            userAgentData:navigator.userAgentData,
            language:navigator.language,
            languages:navigator.languages,
            platform:navigator.platform,
            vendor:navigator.vendor,
            appVersion:navigator.appVersion
        };""")
        pprint.pprint(res)


    async def test_close(self):
        browser = Browser("https://www.google.com/", account_index=1)
        await browser.open_window()
        browser.open_url()
        browser.sleep(2)
        browser.get_bounds()
        browser.close()

if __name__ == '__main__':
    unittest.main()
