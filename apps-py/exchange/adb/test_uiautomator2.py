import pprint
import unittest
import subprocess

import requests

from utils import Utils
import logging
import uiautomator2 as u2

logging.basicConfig(level=logging.DEBUG)


class TestUiautomator2(unittest.IsolatedAsyncioTestCase):

    def test_info(self):
        #https://github.com/openatx/uiautomator2
        d = u2.connect()
        d.debug = True
        print(d.info)
        print(d.serial)
        print(d.wlan_ip)
        # d.clipboard = 'hello-world'
        d.set_input_ime()
        print(d.clipboard)
        d.screen_on()
        d.info.get('screenOn')
        d.dump_hierarchy()
        d.toast.show("Hello", duration=3)

    def test_app_info(self):
        d = u2.connect()
        info = d.app_info("com.web3desk.adr")
        print(info)
        running_apps = d.app_list_running()
        print(running_apps)


    def test_app_start(self):
        d = u2.connect()
        # monkey -p com.web3desk.adr -c android.intent.category.LAUNCHER 1
        d.app_start('com.web3desk.adr', stop=True)


    def test_screenshot(self):
        d = u2.connect()
        d.screenshot().save("/tmp/saved.png")

    def test_xpath(self):
        d = u2.connect()
        d.xpath('//*[@text="我的"]').click()


    def test_press(self):
        d = u2.connect()
        d.press("home")
        d.click(1,1)


    def test_send_keys(self):
        d = u2.connect()
        d.debug = True
        d.send_keys("hello")

    def test_dump_hierarchy(self):
        d = u2.connect()
        d.dump_hierarchy(compressed=True, pretty=True, max_depth=30)

if __name__ == '__main__':
    unittest.main()
