
    sudo docker build -t lvdou .
    docker run -it lvdou bash
    sudo docker run -p 8080:80 lvdou
    sudo docker ps
    fastapi run app/main.py --port 80 --proxy-headers
    fastapi dev app/main.py --port 3080 --proxy-headers
