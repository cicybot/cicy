import unittest

from browser import Browser
from site_bingx import SiteBingx
from utils import wait_for_result


class TestSiteBingx(unittest.IsolatedAsyncioTestCase):
    def test_otp(self):
        bingx = SiteBingx()
        otp = bingx.get_otp()
        print("[+] otp", otp)
        self.assertEqual(len(otp), 6)

    def test_lanu(self):
        browser = Browser("https://mail5.lanu.cn/index.aspx?p=user")
        # print("window_id", browser.window_id)

    async def test_wait_for(self):
        async def try_get_data():
            from random import randint
            return randint(0, 5) == 3 and "Success"

        result = await wait_for_result(try_get_data, timeout=2000, interval=200)
        self.assertTrue(result['result'] == "Success" or "err" in result)

    async def test_login(self):
        bingx = SiteBingx()
        await bingx.browser.wait_opened()
        bingx.browser.open_url()
        bingx.login()
        print(bingx.email)
        print(bingx.email_password)
        result = bingx.browser.exec_js(f"""
        const inputs = document.querySelectorAll("input")
        console.log(inputs)
        const username = inputs[0]
        const password = inputs[1]
        username.value = "{bingx.email}"
        username.dispatchEvent(new Event("input", {{ bubbles: true }}));
        password.value = "{bingx.email_password}"
        password.dispatchEvent(new Event("input", {{ bubbles: true }}));
        const btn = document.querySelectorAll("button")[0]
        btn.click()
        """)
        print("executeJavaScript", result)


if __name__ == '__main__':
    unittest.main()
