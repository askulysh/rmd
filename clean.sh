#!/bin/bash

d=$(date +%y%m%d)

mkdir -p $d
mv -f "$d"_*jpg "$d"_*png $d

for f in $(ls demod-*flac); do
       s=${f:6:-5}
#       mv logs/log-$s.bz2 .
       bzgrep -q  "21 10 " log-$s.bz2 || mv demod-$s.flac to_del
done

#for f in $(ls *wav); do
#	s=${f::-4}
#	bzgrep -q  "key found" log-$s || mv $s.wav to_del
#done

for freq in $(awk 'BEGIN { FS=";"} /dmr/ { print $1 }' ./bookmarks.csv); do
	echo "$freq"
	ls demod-$freq* 2>/dev/null | sort | head -n 1 > /tmp/keep
	ls demod-$freq* 2>/dev/null | sort | tail -n 10 >> /tmp/keep
	cat /tmp/keep
	mv $(ls demod-$freq* 2>/dev/null | grep -f /tmp/keep -v ) to_del
done

