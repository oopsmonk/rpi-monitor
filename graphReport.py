#!/usr/bin/env python
import sys, re, os
import rrdtool

RUNDIR = os.path.dirname(os.path.realpath(__file__))
RRDSDIR = RUNDIR + '/rrds'
REPORTDIR = RUNDIR + '/report'
MemRRDFile = RRDSDIR + '/meminfo.rrd'
CpuRRDFile = RRDSDIR + '/cpustatus.rrd'
UptimeRRDFile = RRDSDIR + '/uptime.rrd'

cRED='#FF0000'
cGREEN='#00FF00'
cBLUE='#0000FF'
cBROWN='#842B00'
cPINK='#FF00FF'
cTrans='#0000FF80'
cList=[cRED, cGREEN, cBLUE, cBROWN, cPINK]
KB=1024
MB=KB*1024
GB=MB*1024

gWidth='600'
gHeight='200'

def CpuInfo(period):
    #Temp
    rrdtool.graph(REPORTDIR + '/cpuTemp' + period + '.png', '--start', period,
        '--title', 'CPU Temperature', '-w', gWidth, '-h', gHeight, 
        '--lower-limit', '40', '--upper-limit', '70',
        'DEF:ctemp=' + CpuRRDFile + ':cputemp:AVERAGE', 
        'LINE1:ctemp' + cRED,
        'GPRINT:ctemp:AVERAGE:Avg\\:%2.0lf',
        'GPRINT:ctemp:MAX:Max\\:%2.0lf',
        'GPRINT:ctemp:MIN:Min\\:%2.0lf',
        'COMMENT:\\n')

    #Usage
    rrdtool.graph(REPORTDIR + '/cpuUsage' + period + '.png', '--start', period,
        '--title', 'CPU Usage (%)', '-w', gWidth, '-h', gHeight, 
        '--lower-limit', '0', '--upper-limit', '100',
        'DEF:cusage=' + CpuRRDFile + ':cpuUsage:AVERAGE', 
        'AREA:cusage' + cGREEN,
        'GPRINT:cusage:AVERAGE:Avg\\:%2.0lf',
        'COMMENT:\\n')

    #PID
    rrdtool.graph(REPORTDIR + '/PIDs' + period + '.png', '--start', period,
        '--title', 'PIDs', '-w', gWidth, '-h', gHeight, 
        '--lower-limit', '40', 
        'DEF:cpid=' + CpuRRDFile + ':pids:AVERAGE', 
        'LINE1:cpid' + cBLUE,
        'COMMENT: ',
        'GPRINT:cpid:AVERAGE:Avg\\:%2.0lf',
        'GPRINT:cpid:MAX:Max\\:%2.0lf',
        'GPRINT:cpid:MIN:Min\\:%2.0lf',
        'COMMENT:\\n')

def UptimeInfo(period):
    #Temp
    rrdtool.graph(REPORTDIR + '/uptime' + period + '.png', '--start', period,
        '--title', 'System Uptime', '-w', gWidth, '-h', gHeight, 
        'DEF:cuptime=' + UptimeRRDFile + ':uptime:AVERAGE', 
        'LINE1:cuptime' + cGREEN,
        'GPRINT:cuptime:AVERAGE:Avg\\:%2.0lf',
        'GPRINT:cuptime:MAX:Max\\:%2.0lf',
        'GPRINT:cuptime:MIN:Min\\:%2.0lf',
        'COMMENT:\\n')

def MemoryInfo(period):
    #Memory Usage
    rrdtool.graph(REPORTDIR + '/memUsage' + period + '.png', '--start', period,
        '--title', 'Memory Usage', '-w', gWidth, '-h', gHeight,
        'DEF:total=' + MemRRDFile + ':total:AVERAGE',
        'DEF:used=' + MemRRDFile + ':used:AVERAGE',
        'DEF:buf=' + MemRRDFile + ':buf:AVERAGE',
        'DEF:cached=' + MemRRDFile + ':cached:AVERAGE',
        'DEF:free=' + MemRRDFile + ':free:AVERAGE',
        'CDEF:usedMB=used,' + str(MB) + ',/',
        'AREA:used' + cBLUE + ':Used',
        'LINE1:total' + cRED + ':Total',
        'LINE2:free' + cGREEN + ':Free',
        'COMMENT:\\n',
        'GPRINT:usedMB:AVERAGE:Used\\: Avg %0.2lf%S(MB)',
        'GPRINT:usedMB:MAX:Max %0.2lf%S(MB)',
        'GPRINT:usedMB:MIN:Min %0.2lf%S(MB)',
        'COMMENT:\\n')

def DiskInfo(period):
    #Mount Point Used Percentage
    mount_files = [f for f in os.listdir(RRDSDIR) if re.match('^mount-\w*\.rrd', f)] 
    cmdList = [REPORTDIR + '/mountPointPercent' + period + '.png', '--start', period,
            '--lower-limit', '0', '--upper-limit', '100',
            '--title', 'Mount Point Usage (%)', '-w', gWidth, '-h', gHeight]

    count = 1
    for mp in mount_files:
        rrdfile = RRDSDIR + '/' + mp
        cmdList.append('DEF:mp' + str(count) + '=' + rrdfile + ':percent:AVERAGE')
        count+=1

    count = 1
    for mp in mount_files:
        mp_name = mp.replace('mount-','').replace('.rrd','')
        cmdList.append('LINE' + str(count) + ':mp' + str(count) + cList[count-1] + ':' + mp_name)
        count+=1

    cmdList.append('COMMENT:\\n')
    rrdtool.graph(cmdList)
    
    #Mount Point Usage
    for mp in mount_files:
        rrdfile = RRDSDIR + '/' + mp
        mp_name = mp.replace('mount-','').replace('.rrd','')
        pngfile = REPORTDIR + '/mountPoint-' + mp_name + period + '.png'
        cmdList = [pngfile, '--start', period, '-w', gWidth, '-h', gHeight,
                '--title', mp_name + ' Usage (Bytes)', 
                'DEF:total=' + rrdfile + ':total:AVERAGE',
                'DEF:used=' + rrdfile + ':used:AVERAGE',
                'DEF:free=' + rrdfile + ':free:AVERAGE',
                'CDEF:usedGB=used,' + str(GB) + ',/',
                'AREA:used' + cGREEN + ':Used',
                'LINE1:total' + cRED + ':Total',
                'LINE1:free' + cBLUE + ':Free',
                'COMMENT:\\n',
                'GPRINT:usedGB:AVERAGE:Used\\: Avg %0.2lf%S(GB)',
                'GPRINT:usedGB:MAX:Max %0.2lf%S(GB)',
                'GPRINT:usedGB:MIN:Min %0.2lf%S(GB)',
                'COMMENT:\\n']
        rrdtool.graph(cmdList)
    
    #Disk I/O
    hdd_files = [f for f in os.listdir(RRDSDIR) if re.match('^hdd-\w*\.rrd', f)] 
    
    for disk in hdd_files:
        rrdfile = RRDSDIR + '/' + disk
        disk_name = disk.replace('hdd-','').replace('.rrd','')
        pngfile = REPORTDIR + '/hdd-' + disk_name + period + '.png'
        cmdList = [pngfile, '--start', period, '-w', gWidth, '-h', gHeight,
                '--title', disk_name + ' I/O (Bytes)', 
                'DEF:rbytes=' + rrdfile + ':rbytes:AVERAGE',
                'DEF:wbytes=' + rrdfile + ':wbytes:AVERAGE',
                'CDEF:rKB=rbytes,' + str(KB) + ',/',
                'CDEF:wKB=wbytes,' + str(KB) + ',/',
                'AREA:rbytes' + cGREEN + ':Read',
                'GPRINT:rKB:AVERAGE:Avg %0.2lf%S(KB)',
                'GPRINT:rKB:MAX:Max %0.2lf%S(KB)',
                'COMMENT:\\n',
                'LINE1:wbytes' + cBLUE + ':Write',
                'GPRINT:wKB:AVERAGE:Avg %0.2lf%S(KB)',
                'GPRINT:wKB:MAX:Max %0.2lf%S(KB)',
                'COMMENT:\\n']

        rrdtool.graph(cmdList)

def NetInfo(period):
    net_files = [f for f in os.listdir(RRDSDIR) if re.match('^interface-\w*\.rrd', f)]
    for net in net_files:
        rrdfile = RRDSDIR + '/' + net
        net_name = net.replace('interface-','').replace('.rrd','')
        pngfile = REPORTDIR + '/interface-' + net_name + period + '.png'
        cmdList = [pngfile, '--start', period, '-w', gWidth, '-h', gHeight,
                '--title', net_name + ' I/O (Bytes)', 
                'DEF:recv=' + rrdfile + ':recv:AVERAGE',
                'DEF:send=' + rrdfile + ':send:AVERAGE',
                'CDEF:recvKB=recv,' + str(KB) + ',/',
                'CDEF:sendKB=send,' + str(KB) + ',/',
                'AREA:recv' + cGREEN + ':Recev',
                'GPRINT:recvKB:AVERAGE:Avg %0.2lf%S(KB)',
                'GPRINT:recvKB:MAX:Max %0.2lf%S(KB)',
                'COMMENT:\\n',
                'AREA:send' + cTrans+ ':Send',
                'GPRINT:sendKB:AVERAGE:Avg %0.2lf%S(KB)',
                'GPRINT:sendKB:MAX:Max %0.2lf%S(KB)',
                'COMMENT:\\n']

        rrdtool.graph(cmdList)
    
def usage():
    print "usage"

def main():

    if len(sys.argv) < 2:
        usage()
        sys.exit(1)

    p = sys.argv[1]
    
    if not re.match('^-\d+[m,h,d,w]$', p):
        print 'formate Error...'
        sys.exit(1)

    CpuInfo(p)
    UptimeInfo(p)
    MemoryInfo(p)
    DiskInfo(p)
    NetInfo(p)


if __name__ == '__main__':
    main()
