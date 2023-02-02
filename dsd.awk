#!/bin/awk -f

BEGIN {
	FS=";"
	left=center-sample_rate/2
	right=center+sample_rate/2
}

/dmr/ {
	if ($1 > left && $1 < right) {
		gsub(/ /, "", $1)
		c="#000000"
		if (index($2,"K") != 0)
			c="#0000FF"
		if (index($2,"A") != 0)
			c="#FF0000"

		print $1, c
	}
}


