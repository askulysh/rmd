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
end=$((end+rate/2))

freq=$start
while true; do
	echo $freq
	date=`date +%y%m%d_%H%M%S`
	fname=$IQ_DIR"$date"_"$freq"_"$rate".c$FMT
	rx_sdr $DRIVER -f $freq -s $rate -F c$FMT $fname &
	pid=$!
	ionice -c 1 -p $pid
	echo "$date pid=$pid"
	sleep $interval
	kill $pid
	wait
	nice -n 5 ./run_del.sh $fname &
	./dsd.awk -v center=$freq -v sample_rate=$rate ./bookmarks.csv > freq_list
	freq=$((freq+rate))
	if [ $freq -ge $end ]; then
		freq=$start
	fi

done

