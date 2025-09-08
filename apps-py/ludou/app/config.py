import os

ASSETS_DIR = os.getenv("ASSETS_DIR", "/Users/ton/Desktop/projects/cicy/docker/docker-nginx-rtmp/web/data/assets")
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-super-secret-key-change-in-production")


INVITE_MESSAGE="""
1.世界上最优秀的成人视频App-绿豆，永久免费，无需翻墙！
2.极速秒播，海量影片资源，后台缓存让您随时离线观看
3.使用推广码:{invite_code} 还可以获取专属观影特权
4.下载戳我：
{invite_link}
5.还有激情主播直播等你哦！
"""
INVITE_LINK="https://www.baidu.com?i={code}"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
WALLET_DEPOSIT_ITEMS  = """[{"amount":30},{"amount":50},{"add_first":3,"amount":100,"gift":true,"vipGift":3},{"add_first":3,"amount":200,"gift":true,"vipGift":7},{"add_first":3,"amount":300,"gift":true,"vipGift":7},{"add_first":3,"amount":400,"gift":true,"vipGift":7}]"""
VIPS = """[{"type":"svip","isSupper":true,"title":"超级VIP永久卡","info":"9999天永久SVIP","permission":"无限观看+无限下载","amount":999,"amount_first":200,"add_first":3},{"type":"year","isSupper":false,"title":"年卡","info":"钻石360天，天天都有新花样","permission":"无限观看+无限下载","amount":698,"amount_first":400,"add_first":3},{"type":"month","isSupper":false,"title":"月卡","info":"30天VIP特权","permission":"无限观看+无限下载","amount":60}]"""