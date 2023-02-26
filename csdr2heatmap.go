package main
import (
    "bufio"
    "fmt"
    "os"
    "time"
    "flag"
)
func main() {
    center := flag.Int("c", 144000000, "# center frequency")
    rate := flag.Int("r", 2048000, "# sample rate")
    samples := flag.Int("n", 4096, "# sample count")
    start := flag.Int64("s", time.Now().Unix(), "# start time")
    flag.Parse()
    startFreq := *center - *rate/2
    endFreq :=  *center + *rate/2
    buf := make([]string, 0, *samples)
    scanner := bufio.NewScanner(os.Stdin)
    scanner.Split(bufio.ScanWords)
    count := 0
    t := time.Unix(*start, 0)
    for scanner.Scan() {
        count++
        value := scanner.Text()
        buf = append(buf, value)
        if count%*samples == 0 {
            fmt.Print(t.Format("2006-01-02, 15:04:05, "))
            t = t.Add(time.Second)
            fmt.Printf("%d, %d, %d, %d, ", startFreq, endFreq, *samples, *samples)
            for i := range buf {
                fmt.Print(buf[i])
                if i < *samples-1 {
                    fmt.Print(", ")
                }
            }
            fmt.Println("")
            buf = buf[:0]
        }
    }
}
