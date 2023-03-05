#!/bin/bash


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

local num=$((IO_MBPS*1024*1024/(ch_bw*2*4)))
local n_present=0

for freq in $(awk 'BEGIN { FS=";"} / dmr/ { print $1 }' ./bookmarks.csv); do
	for i in $(seq $nCh); do
		left=$((center-sample_rate/2+(i-1)*ch_bw))
		right=$((center-sample_rate/2+i*ch_bw))
		[ $left -le $freq ] && [ $right -ge $freq ] && ch_present[$i]=1
	done
done

for s in ${ch_present[@]}; do
	[ $s -eq 1 ] && n_present=$((n_present+1))
done

for i in $(seq $nCh); do
	left=$((center-sample_rate/2+(i-1)*ch_bw))
	right=$((center-sample_rate/2+i*ch_bw))
	echo $left $right ${ch_present[$i]}
done

local to_add=$((num-n_present))
[ $to_add -le 0 ] && to_add=0
echo "target channels:" $num "present:" $n_present "to add:" $to_add

local add=0
local step=$((1 + RANDOM % 8))
for j in $(seq $step $step $nCh ); do
	if [ ${ch_present[$j]} -eq 0 ]; then
		[ $add -eq $to_add ] && break
		ch_present[$j]=1
		add=$((add+1))
	fi
done

ch_map=""
n_present=0
for s in ${ch_present[@]}; do
	ch_map=$ch_map$s
	[ $s -eq 1 ] && n_present=$((n_present+1))
done

echo ${ch_present[*]}
local r=$((n_present*ch_bw*8/1024/1024))
echo write $n_present channels IO rate $r MB/s total size $((r*interval)) MB
}

. ./rmd.cfg

IO_MBPS=${IO_MBPS:-20}
IQ_DIR=${IQ_DIR:-""}
PFB_CHANNELS=${PFB_CHANNELS:-13}
PFB_MULT=${PFB_MULT:-4}

start=${1:-$LOOP_START}
end=${2:-$LOOP_END}
interval=${3:-$INTERVAL}
offset=${OFFSET:-0}

start=$((start*1000000))
end=$((end*1000000))
interval=$((interval*60))

rate=$((48000*PFB_CHANNELS*PFB_MULT))

start=$((start+rate/2))
freq=$start
while true; do
	echo $freq

	get_map $freq $rate $PFB_CHANNELS
	echo $ch_map

	date=$IQ_DIR$(date +%y%m%d_%H%M%S)
	rx_sdr $DRIVER -f $((freq-offset)) -s $rate -F cs16 - | ./poly -I -p $date -c $freq -r $rate -m $ch_map &

	pid=$!
	#ionice -c 1 -p $pid
	echo "$date pid=$pid"
	sleep $interval
	kill $pid
	wait
	./dsd.awk -v center=$freq -v sample_rate=$rate ./bookmarks.csv > freq_list
	(for f in $(ls "$iq_dir"*cf32); do
		nice -n 10 ./run2 $f
		rm $f
	done) &

	freq=$((freq+rate))
	if [ $freq -ge $end ]; then
		freq=$start
	fi

done

