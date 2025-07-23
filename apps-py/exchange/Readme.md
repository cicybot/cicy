    pip install --upgrade pip

    uv venv -v
    uv init
    uv lock
    uv pip install requests
    python -m unittest test_site_bingx.TestSiteBingx.test_login
