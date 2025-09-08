import config
from browser import Browser
from utils import Utils


class SiteBingx:
    def __init__(self):
        self.email = config.OUTLOOK_AUTH[0]
        self.email_password = config.OUTLOOK_AUTH[1]
        self.init_url = "https://bingx.com/"
        self.current_url = self.init_url
        self.login_url = "https://bingx.com/en/accounts/login/"
        self.browser = Browser(self.current_url)

    async def open_window(self):
        await self.browser.open_window()

    def open(self):
        self.browser.go_to(self.init_url)

    def login(self):
        self.browser.go_to(self.login_url)

    def is_logged(self):
        pass

    def get_otp(self):
        return Utils.get_otp(config.GA_BINGX_TOKEN)
