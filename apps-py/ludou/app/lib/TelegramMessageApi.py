import requests

class TelegramMessageApi:
    def __init__(self,token:str):
        self.token = token
        self.api = f"https://api.telegram.org/bot{token}"

    def get_uid_by_uname(self,username:str):
        res = requests.get(f"{self.api}/getChat",{"chat_id":f"@{username}"})
        json = res.json()
        print(json)

    def get_chat_member(self,chat_id:str,user_id:str):
        res = requests.get(f"{self.api}/getChatMember?chat_id={chat_id}&user_id={user_id}")
        json = res.json()
        print(json)

#
#
# async getChatMember(chatId: string, userId: string) {
#     const response = await fetch(
#     `${this.api}/getChatMember?chat_id=${chatId}&user_id=${userId}`
# );
# return response.json();
# }
# async getUserIdFromUsername(username: string) {
#     const response = await fetch(`${this.api}/getChat?chat_id=@${username}`);
# const res = (await response.json()) as any;
# if (res.ok && res.result && res.result.id) {
# return res.result.id;
# }
# throw new Error('User not found');
# }
