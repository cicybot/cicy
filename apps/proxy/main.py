#!/usr/local/opt/python@3.11/bin/python3.11
# -*- coding: utf-8 -*-
import re
import sys
from mitmproxy.tools.main import mitmweb

# ./main.py --mode upstream:http://127.0.0.1:4445 --upstream-auth user:pwd
if __name__ == '__main__':
    sys.argv[0] = re.sub(r'(-script\.pyw|\.exe)?$', '', sys.argv[0])
    sys.exit(mitmweb())
