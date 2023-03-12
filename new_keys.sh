#!/bin/bash

. rmd.cfg

SAVED_DIR=${SAVED_DIR:-.}

freqs=$(bzgrep -l " 2[1-5] 10 " $SAVED_DIR/*/*/logs/*|awk 'BEGIN {FS="_"} /log-/ {print $1}'|sort -u)

for fff in $freqs; do
	ff=$(basename $fff)
	f=${ff:4}
	grep  "$f; unk" bookmarks.csv && bzgrep "  2[1-5] 10 " $SAVED_DIR/*/$f/logs/log-*
done

