#!/bin/sh
#set -e

start=${1:-145}
end=${2:-174}
rate=${3:-2544000}
interval=${4:-60}

start=$((start*1000000))
end=$((end*1000000))
interval=$((interval*60))

start=$((start+rate/2))

freq=$start
while true; do
	echo $freq
	date=`date +%y%m%d_%H%M%S`
	fname="$date"_"$freq"_"$rate".cs16
	#rx_sdr -d driver=airspy -g 10 -f $freq -s $rate -F CS16 $fname &
	rx_sdr -d driver=sdrplay -f $freq -s $rate -F CS16 $fname &
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

