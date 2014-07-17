#!/bin/bash 
RUNDIR="/home/oopsmonk/rpi-monitor"
RRDPATH="$RUNDIR/rrds" 
REPORTPATH="$RUNDIR/report" 
cRED="#FF0000" 
cGREEN="#00FF00" 
cBLUE="#0000FF" 
cBROWN="#842B00" 
cPINK="#FF00FF" 

gWidth=800
gHeight=400

function usage(){
    echo "usage : $0 option"
    echo "option: -rm, -?h, -?d, ..."
    echo "$0 -1h"
    echo "$0 -6h"
    echo "$0 -1d"
    echo "$0 -1w"
    echo "Reference http://oss.oetiker.ch/rrdtool/doc/rrdgraph.en.html "
}

if [ $# -ne 0 ]; then
    if [ $1 = "-rm" ]; then
        rm $REPORTPATH/*.png
        echo "clean Repoert files..."
        exit 0
    fi

    PERIOD=$1
else
    usage
    exit 0
fi

echo "Perio = $PERIOD"

#CPU Temperature 
rrdtool graph $REPORTPATH/cpuTemp$PERIOD.png --start $PERIOD \
    --title "CPU Temperature" \
    -w $gWidth -h $gHeight \
    --lower-limit 40 --upper-limit 70 \
    DEF:ctemp=$RRDPATH/cpustatus.rrd:cputemp:AVERAGE \
    COMMENT:" " \
    LINE1:ctemp$cRED:"Cpu Temp"

#CPU Usage 
rrdtool graph $REPORTPATH/cpuUsage$PERIOD.png --start $PERIOD \
    --title "CPU Usage (%)" \
    -w $gWidth -h $gHeight \
    --lower-limit 0 --upper-limit 100 \
    DEF:cusage=$RRDPATH/cpustatus.rrd:cpuUsage:AVERAGE \
    COMMENT:" " \
    LINE2:cusage$cGREEN:"Cpu Usage"

#PIDs
rrdtool graph $REPORTPATH/pids$PERIOD.png --start $PERIOD \
    --title "PID count" \
    -w $gWidth -h $gHeight \
    --lower-limit 0 \
    DEF:pids=$RRDPATH/cpustatus.rrd:pids:AVERAGE \
    COMMENT:" " \
    LINE2:pids$cGREEN:"PIDs"

#Memoery
rrdtool graph $REPORTPATH/memInfo$PERIOD.png --start $PERIOD \
    --title "Memoery Usage" \
    -w $gWidth -h $gHeight \
    DEF:total=$RRDPATH/meminfo.rrd:total:AVERAGE \
    DEF:used=$RRDPATH/meminfo.rrd:used:AVERAGE \
    DEF:buf=$RRDPATH/meminfo.rrd:buf:AVERAGE \
    DEF:cached=$RRDPATH/meminfo.rrd:cached:AVERAGE \
    DEF:free=$RRDPATH/meminfo.rrd:free:AVERAGE \
    COMMENT:" " \
    AREA:used$cBLUE:"Used":STACK \
    LINE1:total$cRED:"Total" \
    LINE2:free$cGREEN:"Free"
#    LINE3:buf$cBROWN:"Buffer" \
#    LINE4:cached$cPINK:"Cached"
#    LINE5:free$cPINK:"Free"
#    LINE2:used$cBLUE:"Used"

##Disk0 
#rrdtool graph $REPORTPATH/disk-0$PERIOD.png --start $PERIOD \
#    --title "Disk Usage (bytes)" \
#    -w $gWidth -h $gHeight \
#    DEF:total=$RRDPATH/disk-0.rrd:total:AVERAGE \
#    DEF:used=$RRDPATH/disk-0.rrd:used:AVERAGE \
#    DEF:free=$RRDPATH/disk-0.rrd:free:AVERAGE \
#    LINE1:total$cRED:"Total" \
#    LINE2:used$cGREEN:"Used" \
#    LINE3:free$cBLUE:"Free"
#
##Disk1 
#rrdtool graph $REPORTPATH/disk-1$PERIOD.png --start $PERIOD \
#    --title "Disk Usage (bytes)" \
#    -w $gWidth -h $gHeight \
#    DEF:total=$RRDPATH/disk-1.rrd:total:AVERAGE \
#    DEF:used=$RRDPATH/disk-1.rrd:used:AVERAGE \
#    DEF:free=$RRDPATH/disk-1.rrd:free:AVERAGE \
#    LINE1:total$cRED:"Total" \
#    LINE2:used$cGREEN:"Used" \
#    LINE3:free$cBLUE:"Free"

#Disk Percentage 
rrdtool graph $REPORTPATH/mount-usage$PERIOD.png --start $PERIOD \
    --title "Mount Point Usage (%)" \
    -w $gWidth -h $gHeight \
    --lower-limit 0 --upper-limit 100 \
    DEF:d1=$RRDPATH/mount-root.rrd:percent:AVERAGE \
    DEF:d2=$RRDPATH/mount-boot.rrd:percent:AVERAGE \
    COMMENT:"Mount Point" \
    LINE1:d1$cBROWN:"Root" \
    LINE2:d2$cGREEN:"Boot"


#Eth0 I/O Bytes 
rrdtool graph $REPORTPATH/net-eth0$PERIOD.png --start $PERIOD \
    --title "Internet I/O Bytes" \
    --vertical-label="Bytes/s" \
    -w $gWidth -h $gHeight \
    DEF:send=$RRDPATH/interface-eth0.rrd:send:AVERAGE \
    DEF:recv=$RRDPATH/interface-eth0.rrd:recv:AVERAGE \
    COMMENT:" " \
    AREA:recv$cGREEN:"Recv":STACK \
    AREA:send$cBLUE:"Send":STACK \
#    LINE1:send$cBLUE:"Send" \
#    AREA:send$cRED:"Send_bytes":STACK \
#    LINE2:recv$cGREEN:"Recv_bytes"

#Disk IO
rrdtool graph $REPORTPATH/HD-mmcblk0$PERIOD.png --start $PERIOD \
    --title "mmcblk0 IO (bytes)" \
    -w $gWidth -h $gHeight \
    DEF:rbytes=$RRDPATH/HD-mmcblk0.rrd:rbytes:AVERAGE \
    DEF:wbytes=$RRDPATH/HD-mmcblk0.rrd:wbytes:AVERAGE \
    COMMENT:" " \
    LINE1:rbytes$cGREEN:"Read" \
    LINE2:wbytes$cBLUE:"Write"

##Disk IO
#rrdtool graph $REPORTPATH/HD-mmcblk0p1$PERIOD.png --start $PERIOD \
#    --title "mmcblk0p1 IO (bytes)" \
#    -w $gWidth -h $gHeight \
#    DEF:rbytes=$RRDPATH/HD-mmcblk0p1.rrd:rbytes:AVERAGE \
#    DEF:wbytes=$RRDPATH/HD-mmcblk0p1.rrd:wbytes:AVERAGE \
#    COMMENT:" " \
#    LINE1:rbytes$cGREEN:"Read" \
#    LINE2:wbytes$cBLUE:"Write"

##Disk IO
#rrdtool graph $REPORTPATH/HD-mmcblk0p2$PERIOD.png --start $PERIOD \
#    --title "mmcblk0p2 IO (bytes)" \
#    -w $gWidth -h $gHeight \
#    DEF:rbytes=$RRDPATH/HD-mmcblk0p2.rrd:rbytes:AVERAGE \
#    DEF:wbytes=$RRDPATH/HD-mmcblk0p2.rrd:wbytes:AVERAGE \
#    COMMENT:" " \
#    LINE1:rbytes$cGREEN:"Read" \
#    LINE2:wbytes$cBLUE:"Write"

exit 0
