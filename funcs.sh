copy_audio() {
	local f=$1
	local i=1
	for w in $(ls /tmp/$f_*wav); do
		sox $w "$f"_$i.ogg
		i=$((i+1))
		rm $w
	done
}

gather_result() {
	local f=$1
	(grep -q "key found" /tmp/log-$f && copy_audio $f
	rm -f /tmp/"$f"_*wav
	bzip2 -9 /tmp/log-$f
	mv /tmp/log-$f.bz2 .)
}
