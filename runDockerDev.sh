#!/bin/bash
CONTAINERNAME=compound
IMAGENAME=compound-protocol

docker rm -f $CONTAINERNAME
docker run -t -d -v $PWD:/compound-protocol --name=$CONTAINERNAME $IMAGENAME
docker exec -it $CONTAINERNAME /bin/sh
