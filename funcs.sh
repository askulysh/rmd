copy_audio() {
	local f=$1
	local freq=${f:0:9}
	local date=${f:10:6}
	local i=1
	local dst_dir=$SAVED_DIR/$date/$freq/audio
	mkdir -p $dst_dir
	for w in $(ls /tmp/$f_*wav); do
		sox $w $dst_dir/"$f"_$i.ogg
		i=$((i+1))
		rm $w
	done
}

gather_result() {
	local f=$1
	local freq=${f:0:9}
	local date=${f:10:6}
	echo $freq $date
	(grep -q -e "key found" -e "Unencrypted voice" /tmp/log-$f && copy_audio $f
	rm -f /tmp/"$f"_*wav
	bzip2 -9 /tmp/log-$f
	local dst_dir=$SAVED_DIR/$date/$freq/logs/
	mkdir -p $dst_dir
	mv /tmp/log-$f.bz2 $dst_dir)
}
