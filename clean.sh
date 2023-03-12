#!/bin/bash

. rmd.cfg

SAVED_DIR=${SAVED_DIR:-.}

d=$(date +%y%m%d)
mkdir -p $d
mv -f "$d"_*jpg "$d"_*png heat

for dd in $(ls demod-*flac); do
       f=${dd:6:-5}
       freq=${f:0:9}
       date=${f:10:6}

       bzgrep -q " 21 10 " $SAVED_DIR/$date/$freq/logs/log-$f.bz2 || mv demod-$f.flac to_del
done

#for f in $(ls *wav); do
#	s=${f::-4}
#	bzgrep -q  "key found" log-$s || mv $s.wav to_del
#done

for freq in $(awk 'BEGIN { FS=";"} /dmr/ { print $1 }' ./bookmarks.csv); do
#	echo "$freq"
	ls demod-$freq* 2>/dev/null | sort | head -n 1 > /tmp/keep
	ls demod-$freq* 2>/dev/null | sort | tail -n 10 >> /tmp/keep
#	echo "keep:"
#	cat /tmp/keep
	del_list=$(ls demod-$freq* 2>/dev/null | grep -f /tmp/keep -v )
#	echo "to_del:"
	[ -z $del_list ] || mv $del_list to_del
done

