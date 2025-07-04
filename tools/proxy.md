# test

    curl -x socks5://user1:password123@$DEV_IP:1080 https://ifconfig.me/ip
    curl -x http://user1:password123@$DEV_IP:3128 https://ifconfig.me/ip

    curl --proxy http://user1:password123@$DEV_IP:3128 https://ifconfig.me

docker rm -f socks5-3proxy

docker run -d --name socks5-3proxy \
 -p 1080:1080 \
 -v $(pwd)/3proxy.cfg:/etc/3proxy.cfg \
 --restart unless-stopped \
 3proxy/3proxy /bin/3proxy /etc/3proxy.cfg

docker run -d --name socks5-3proxy \
 -p 3128:3128 \
 -v $(pwd)/3proxy.cfg:/etc/3proxy.cfg \
 --restart unless-stopped \
 3proxy/3proxy /bin/3proxy /etc/3proxy.cfg

# 3proxy.cfg

    nserver 8.8.8.8
    nserver 8.8.4.4
    log /dev/stdout
    #auth none
    auth strong
    users user1:CL:password123
    socks -p1080
    socks -p3128
