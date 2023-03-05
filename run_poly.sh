#!/bin/bash

USAGE="csdr-fm: a script to listen to FM radio with RTL-SDR and csdr.

usage:
	csdr-dsd file frequency_hz

example:
	csdr-dsd file 89.5
	csdr-dsd file 89.5
"
if [ $# -ne 1 ]; then echo "$USAGE"; exit -1; fi

file=$1
IFS='_' read -a strarr <<< "$file"
center=${strarr[2]}
IFS='.' read -a strarr2 <<< "${strarr[3]}"
s_rate=${strarr2[0]}

if grep -q u8 <<< $file; then
	fmt="u8"
else
	fmt="s16"
fi
echo $fmt

offset=0
dec_coef=$((s_rate/48000))
rate=48000
sample_rate=$((dec_coef*rate))
echo $s_rate $dec_coef $sample_rate

if [[ !($1 =~ _$sample_rate) ]]; then echo "$USAGE"; exit -1; fi

nCh=45
declare -a ch_present
for i in $(seq $nCh); do
	ch_present[$i]=0
done

ch_bw=$((sample_rate/nCh))
echo $ch_bw
echo $s_rate $((ch_bw*nCh))

for freq in $(awk 'BEGIN { FS=";"} / dmr/ { print $1 }' ./bookmarks.csv); do
	for i in $(seq $nCh); do
		left=$((center-sample_rate/2+(i-1)*ch_bw))
		right=$((center-sample_rate/2+i*ch_bw))
		[ $left -le $freq ] && [ $right -ge $freq ] && ch_present[$i]=1
	done
done

ch_map=""

for i in $(seq $nCh); do
#	echo $i
	left=$((center-sample_rate/2+(i-1)*ch_bw))
	right=$((center-sample_rate/2+i*ch_bw))
	echo $left $right ${ch_present[$i]}
	ch_map=$ch_map${ch_present[$i]}
done

echo ${ch_present[*]}
echo $ch_map


rm -f pbf*
echo "-p pbf230211_1 -c $center -r $sample_rate -m $ch_map"
#csdr convert_"$fmt"_f < $1 | ./poly -p pbf230211_1 -c $center -r $sample_rate -m $ch_map
cat $1 | ./poly -I -p pbf230211_1 -c $center -r $sample_rate -m $ch_map
./dsd.awk -v center=$center -v sample_rate=$sample_rate ./bookmarks.csv > "freq_list"
for f in $(ls pb*cf32); do
    ./run2 $f &
done
wait
