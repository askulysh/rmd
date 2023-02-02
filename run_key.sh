#!/bin/bash

key=$1

logs=$(bzgrep -l "21 10 $key" log-*)

for l in $logs; do
	echo $l
	f=${l:4:-4}
	[ -f demod-$f.flac ] && ./run_demod demod-$f.flac
done
