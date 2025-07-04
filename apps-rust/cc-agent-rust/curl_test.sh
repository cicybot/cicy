#!/bin/bash
set -ex
ip=${ip:-192.168.36.189}
prot=${prot:-4447}


echo "Testing version "
curl http://$ip:$prot/version
echo -e "\n"

echo "Testing deviceInfo "
curl http://$ip:$prot/deviceInfo
echo -e "\n"

echo "Testing ping method"
curl -X POST http://$ip:$prot/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","params":null,"id":1}'
echo -e "\n"

echo "Testing deviceInfo method"
curl -X POST http://$ip:$prot/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"deviceInfo","params":null,"id":2}'
echo -e "\n"

echo "Testing shell method (ls -alh)"
curl -X POST http://$ip:$prot/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"shell","params":["ls -alh"],"id":3}'
echo -e "\n"

echo "Testing invalid method"
curl -X POST http://$ip:$prot/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"unknownMethod","params":null,"id":4}'
echo -e "\n"
