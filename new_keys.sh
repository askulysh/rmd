#!/bin/bash

freqs=$(bzgrep -l "2[1-5] 10 " log-*|awk 'BEGIN {FS="_"} /log-/ {print $1}'|sort -u)

for ff in $freqs; do
	f=${ff:4}
	echo $f
	grep $f bookmarks.csv
done

