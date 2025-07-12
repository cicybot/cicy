# mitmproxy -s forward_to_clash.py --listen-port 4449
import mitmproxy
def request(flow):
    flow.server_conn.via = ("127.0.0.1", 4445)