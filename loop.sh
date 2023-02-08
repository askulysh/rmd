#!/bin/sh

. ./rmd.cfg

start=${1:-$LOOP_START}
end=${2:-$LOOP_END}
rate=${3:-$RATE}
interval=${4:-$INTERVAL}

start=$((start*1000000))
end=$((end*1000000))
interval=$((interval*60))

start=$((start+rate/2))

freq=$start
while true; do
	echo $freq
	date=`date +%y%m%d_%H%M%S`
	fname="$date"_"$freq"_"$rate".c$FMT
	rx_sdr $DRIVER -f $freq -s $rate -F c$FMT $fname &
	pid=$!
	echo "$date pid=$pid"
	sleep $interval
	kill $pid
	wait
	nice -n 5 ./run_del.sh $fname &
	freq=$((freq+rate))
	if [ $freq -ge $end ]; then
		freq=$start
	fi

done

