#!/bin/bash

PID=$$

chrt --idle -p 0 "${PID}"
ionice -c 3 -p "${PID}"
renice -n 19 -p "${PID}" > /dev/null

time ./run2 $1
rm $1
