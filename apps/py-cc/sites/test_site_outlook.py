import pprint
import unittest

import requests

import config
from browser import Browser


class TestOutlook(unittest.IsolatedAsyncioTestCase):

    async def test_login(self):
        browser = Browser(
            "https://www.microsoft.com/cascadeauth/store/account/signin?ru=https%3A%2F%2Fwww.microsoft.com%2Fzh-cn%2F",
            account_index=1
        )
        await browser.open_window()
        browser.open_url()
        await browser.wait_dom_ready()
        browser.set_input_value("#usernameEntry", "")
        browser.click_selector("#usernameEntry")
        browser.type_words(config.OUTLOOK_AUTH[0])
        browser.click_selector("""button[data-testid="primaryButton"]""")
        browser.sleep(1)
        passwordEntry = await browser.wait_for_selector("#passwordEntry")
        if passwordEntry:
            browser.click_selector("#passwordEntry")
            browser.type_words(config.OUTLOOK_AUTH[1])
            browser.click_selector("""button[data-testid="primaryButton"]""")
            browser.sleep(1)
            kmsiVideo = await browser.wait_for_selector("""div[data-testid="kmsiVideo"]""")
            if kmsiVideo:
                browser.click_selector("""button[data-testid="primaryButton"]""")
                browser.sleep(2)
                await browser.wait_dom_ready()
                browser.go_to("https://outlook.live.com/mail/0/")

    async def test_get_email(self):
        browser = Browser(
            "https://outlook.live.com/mail/0/",
            account_index=0,
            request_filters=['service.svc?action=FindItem&app=Mail&n=0'],
            proxy_enable=True,
            proxy_rules="http://127.0.0.1:7897"
        )

        await browser.open_window()
        browser.open_url()
        await browser.wait_dom_ready()

        async def cb():
            try:
                res = browser.get_requests()
                request_rows = list(res.items())
                if len(request_rows) == 0:
                    return False
                else:
                    return request_rows
            except Exception as e:
                return False

        requests_res = await browser.wait_for(cb)
        if requests_res['err'] is not None:
            print(requests_res['err'])
        else:
            (_, request) = requests_res['res'][0]  # Convert to list and get first element
            url = request['url']
            headers = request['requestHeaders']
            try:
                body = request.get('postData', {})
                response = requests.post(url, headers=headers, data=body)
                json = response.json()
                item = json['Body']['ResponseMessages']['Items'][0]['RootFolder']['Items'][0]
                subject = item['Subject']
                sender = item['Sender']['Mailbox']['EmailAddress']
                preview = item['Preview']
                pprint.pprint((subject, sender, preview))

            except Exception as e:
                print("Error making request:", e)

    async def test_is_logged(self):
        browser = Browser(
            "https://outlook.live.com/mail/0/",
            account_index=1)
        await browser.open_window()
        browser.open_url()
        await browser.wait_dom_ready()
        browser.sleep(2)
        body = browser.exec_js("""return document.querySelector("body").textContent""")
        print(body)


if __name__ == '__main__':
    unittest.main()
