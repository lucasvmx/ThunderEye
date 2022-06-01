#!/bin/bash

while true
do
	echo "[+] sending health request ..."
	data=$(curl -X GET -s 'https://thundereye.herokuapp.com/health')
	echo "[+] output: $data"
	sleep 6h
done

