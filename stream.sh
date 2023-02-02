#!/bin/sh
#set -e

freq=${1:-158050000}
#rate=${2:-2544000}
#rate=${2:-9984000}
#rate=${2:-7968000}
rate=${2:-6000000}
interval=${3:-20}

interval=$((interval*60))

#fmt="u8"
fmt="s16"

offset=0

dec_coef=$((rate/48000))

I=1

while true; do
	center=$((freq+I*15*rate/32))
	cmd="print(float($center-$freq-$offset)/$rate)"
	f_shift=$(python3 -c $cmd)
	echo $f_shift

	darkice -c ./darkice.cfg &
	dark_pid=$!
	(./dsd -i- -fr -mc -w stream-last.wav 2>log-stream-last <demod-stream-last; sox stream-last.wav stream-last.ogg; rm stream-last.wav; oggfwd 192.168.6.7 8000 dmr23 /158050last.ogg <stream-last.ogg) &
	echo $freq $center $I
	date=`date +%y%m%d_%H%M%S`
	fname="$date"_"$center"_"$rate".c$fmt
        f="$freq"_$fname
	#rx_sdr -d driver=airspy -g 10 -f $freq -s $rate -F CS16 $fname &
	(rx_sdr -d driver=sdrplay -f $center -s $rate -F C$fmt - | tee $fname | csdr convert_"$fmt"_f |csdr shift_addition_cc $f_shift|csdr fir_decimate_cc $dec_coef 0.005 HAMMING | csdr fmdemod_quadri_cf | csdr convert_f_s16 | tee demod-stream | ./dsd -i- -fr -mc -o pa:0 2>log-stream) &
	pid=$!
	echo "$date pid=$pid"
	sleep $interval
	killall rx_sdr
	kill $dark_pid
	mv demod-stream demod-stream-last
	wait

	nice -n 5 ./run_del.sh $fname &
	sleep 1
	I=$((-1*I))
done

