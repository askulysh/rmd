#!/bin/bash

MIN_CHANNELS=15

get_map() {

local center=$1
local sample_rate=$2
local nCh=$3

declare -a ch_present

local i

for i in $(seq $nCh); do
	ch_present[$i]=0
done

local ch_bw=$((sample_rate/nCh))

local left
local right
local freq

for freq in $(awk 'BEGIN { FS=";"} / dmr/ { print $1 }' ./bookmarks.csv); do
	for i in $(seq $nCh); do
		left=$((center-sample_rate/2+(i-1)*ch_bw))
		right=$((center-sample_rate/2+i*ch_bw))
		[ $left -le $freq ] && [ $right -ge $freq ] && ch_present[$i]=1
	done
done

for i in $(seq $nCh); do
	left=$((center-sample_rate/2+(i-1)*ch_bw))
	right=$((center-sample_rate/2+i*ch_bw))
	echo $left $right ${ch_present[$i]}
done

to_add=1
add=0
step=$((1 + RANDOM % 8))
for j in $(seq $step $step $nCh ); do
	if [ ${ch_present[$j]} -eq 0 ]; then
		ch_present[$j]=1
		add=$((add+1))
		[ $add -eq $to_add ] && break
	fi
done

ch_map=""
for i in $(seq $nCh); do
	ch_map=$ch_map${ch_present[$i]}
done

echo ${ch_present[*]}
}

. ./rmd.cfg

start=${1:-$LOOP_START}
end=${2:-$LOOP_END}
rate=${3:-$RATE}
interval=${4:-$INTERVAL}
offset=${OFFSET:-0}

start=$((start*1000000))
end=$((end*1000000))
interval=$((interval*60))

start=$((start+rate/2))

freq=$start
while true; do
	echo $freq
	nCh=45

	get_map $freq $rate $nCh
	echo $ch_map

	date=`date +%y%m%d_%H%M%S`
	rx_sdr $DRIVER -f $((freq-offset)) -s $rate -b $((nCh*8192)) -F cs16 - | ./poly -I -p $date -c $freq -r $rate -m $ch_map &

	pid=$!
	#ionice -c 1 -p $pid
	echo "$date pid=$pid"
	sleep $interval
	kill $pid
	wait
	(for f in $(ls *cf32); do
		nice -n 10 ./run2 $f
		rm $f
	done) &

	freq=$((freq+rate))
	if [ $freq -ge $end ]; then
		freq=$start
	fi

done

