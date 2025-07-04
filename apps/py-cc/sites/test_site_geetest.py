import unittest

from browser import Browser
from utils import Utils


class TestSiteGeetest(unittest.IsolatedAsyncioTestCase):
    async def test_geetest(self):
        url = "https://gt4.geetest.com/"
        browser = Browser(url)
        await browser.open_window()
        browser.open_url()
        await browser.wait_dom_ready()
        browser.click_selector(".geetest_holder")
        await browser.wait_for_selector(".geetest_box")
        browser.sleep(2)
        rect = browser.get_selector_bounds(".geetest_box")
        if rect is not None:
            print("geetest_box rect", rect)
            Utils.open_local_browser(
                f"http://localhost:3101/capture/page?windowId={browser.window_id}&x={rect['x']}&width={rect['width']}&y={rect['y']}&height={rect['height']}")


if __name__ == '__main__':
    unittest.main()
