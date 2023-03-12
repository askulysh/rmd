#!/bin/bash

. rmd.cfg

key=$1

logs=$(bzgrep -l " 21 10 $key " $SAVED_DIR/*/*/logs/*)

for l in $logs; do
	echo $l
	ll=$(basename $l)
	f=${ll:4:-4}
	[ -f demod-$f.flac ] && ./run_demod demod-$f.flac
done
