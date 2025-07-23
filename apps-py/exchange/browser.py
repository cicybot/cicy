import asyncio
import time
from typing import Callable, Any, Union

import requests

from config import BROWSER_API_BASE_URL
from utils import wait_for_result

class Browser:
    def __init__(self, url, request_filters=None, account_index=None, proxy_enable=False, proxy_rules=None):
        if account_index is not None:
            self.account_index = account_index
        else:
            self.account_index = 0
        self.request_filters = request_filters
        self.proxy_enable = proxy_enable
        self.proxy_rules = proxy_rules
        self.url = url
        self.window_id = None

    async def wait_for(self,
                       cb: Callable[[], Union[Any, asyncio.Future]],
                       timeout: int = -1,
                       interval: int = 100
                       ):
        return await wait_for_result(cb, timeout, interval)

    def info(self):
        try:
            print("get Browser info",self.window_id)
            response = requests.get(f"{BROWSER_API_BASE_URL}/browser/info",params={
                "windowId": self.window_id
            })
            json_res = response.json()
            print("Browser info", json_res)
            return json_res['result']
        except Exception as e:
            print("info request error:", e)
        return None

    def _api(self, path, json):
        try:
            print("_api req:", path,json)
            response = requests.post(f"{BROWSER_API_BASE_URL}/{path}", json=json)
            json_res = response.json()
            print("_api res:", path, json_res)
            return json_res
        except Exception as e:
            print("api request error:", e)
        return None

    def open_url(self, url=None):
        return self.exec_js(f"location.href='{self.url if url is None else url}'")

    def go_to(self, url):
        return self.exec_js(f"location.href='{url}'")

    def _open(self, url=None):

        if url is not None:
            self.url = url
        body = self._api("browser/open", {
            "url": self.url,
            "accountIndex": self.account_index,
        })
        if body is not None:
            self.window_id = body['result']['windowId']
            return self.window_id
        else:
            raise RuntimeError("Error opening browser")

    async def open_window(self):
        self._open()
        await self.wait_opened()
        if self.proxy_rules is not None:
            self.set_proxy(self.proxy_enable, self.proxy_rules)
        if self.request_filters is not None:
            self.set_request_filters(self.request_filters)

    def exec_js(self, code):
        return self._web_contents("execJs", {
            "code": code
        })

    def type_words(self, words):
        return self._web_contents("typeWords", {
            "words": words
        })

    def get_web_contents_id(self):
        body = self._api("browser/WebContents/id", {
            "windowId": self.window_id,
        })
        if body is not None:
            return body['result']["webContentsId"]
        else:
            raise RuntimeError("Error get_web_contents_id")

    def sleep(self, seconds):
        time.sleep(seconds)

    def _web_contents(self, action, params=None):
        body = self._api("browser/WebContents", {
            "windowId": self.window_id,
            "method": action,
            "params": params if params is not None else {}
        })
        if body is not None:
            return body
        else:
            raise RuntimeError(f"Error: {action}")

    def _base_window(self, method, params=None):
        body = self._api("browser/BaseWindow", {
            "windowId": self.window_id,
            "method": method,
            "params": params if params is not None else {}
        })

        if body is not None:
            return body
        else:
            raise RuntimeError(f"Error: {method}")

    def close(self):
        return self._base_window("close")

    def get_bounds(self):
        return self._base_window("getBounds")

    async def wait_opened(self):
        async def cb():
            try:
                id = self.get_web_contents_id()
                if id > 0:
                    return True
                else:
                    return False
            except:
                return False

        res = await self.wait_for(cb, 10000, 500)
        if res['err'] is None:
            return res['result']
        else:
            raise RuntimeError("wait_opened is False")

    async def wait_dom_ready(self):
        async def cb():
            try:
                state = self.get_document_ready_state()
                if state == "complete":
                    return True
                else:
                    return False
            except:
                return False

        res = await self.wait_for(cb, 10000, 500)
        if res['err'] is None:
            return res['result']
        else:
            raise RuntimeError(res['err'] if res['err'] else "wait_opened is False")

    def set_proxy(self, enable, proxy_rules):
        return self._web_contents("setProxy", {
            "proxyRules": proxy_rules if enable is True else ""
        })

    def set_request_filters(self, request_filters):
        return self._web_contents("setRequestFilters", {
            "requestFilters": request_filters
        })

    def get_requests(self):
        return self._web_contents("getRequests")['requests']

    def click_rect(self, rect, delay=100, show_point=None):

        x = rect['left'] + rect['width'] / 2
        y = rect['top'] + rect['height'] / 2
        return self._web_contents("sendClickEvent", {
            "x": x,
            "y": y,
            "delay": delay,
            "showPoint": show_point is not None
        })

    def click_selector(self, selector, delay=100, show_point=None):
        return self._web_contents("clickSelector", {
            "selector": selector,
            "delay": delay,
            "showPoint": show_point is not None
        })

    async def wait_for_selector(self, selector):
        async def cb():
            try:
                rect = self.get_selector_bounds(selector)
                return "err" not in rect
            except:
                return False

        res = await self.wait_for(cb, 10000, 500)
        if res['err'] is None:
            return res['result']
        else:
            raise RuntimeError("wait_opened is False")

    def click(self, x, y, delay=100):
        return self._web_contents("sendClickEvent", {
            "x": x,
            "y": y,
            "delay": delay,
        })

    def send_input_event(self, event):
        return self._web_contents("sendInputEvent", {
            "event": event
        })

    def get_document_ready_state(self):
        return self._web_contents("getDocumentReadyState")['readyState']

    def set_input_value(self, sel, value):
        return self._web_contents("setInputValue", {
            "selector": sel,
            "value": value
        })

    def get_selector_bounds(self, sel):
        return self._web_contents("getSelectorBounds", {
            "selector": sel,
        })

    def show_rect(self, rect, hideDelaySec=3):
        return self._web_contents("showRect", {
            "rect": rect,
            "hideDelaySec": hideDelaySec
        })

    def capture_page(self, rect):
        return self._web_contents("capturePage", {
            "rect": rect,
        })['imgData']
