#!/usr/bin/env python
import rrdtool
from rrdtool import update as rrd_update
import os, time 
import psutil

RUNDIR = os.path.dirname(os.path.realpath(__file__))
RRDSDIR = RUNDIR + '/rrds'
CpuRRDFile = RRDSDIR + '/cpustatus.rrd'
MemRRDFile = RRDSDIR + '/meminfo.rrd'
UptimeRRDFile = RRDSDIR + '/uptime.rrd'
CPUCoresRRDFile = RRDSDIR + '/cpucores.rrd'

'''
1 day - 5-minute resolution
1 week - 15-minute resolution
1 month - 1-hour resolution
1 year - 6-hour resolution

RRA:AVERAGE:0.5:1:288
RRA:AVERAGE:0.5:3:672
RRA:AVERAGE:0.5:12:744
RRA:AVERAGE:0.5:72:1480

5-minute for 3 days
RRA:AVERAGE:0.5:1:864
15-minute for 2 weeks
RRA:AVERAGE:0.5:3:1344
1-hour for 2 months
RRA:AVERAGE:0.5:12:1488
3-hour for 1 year
RRA:AVERAGE:0.5:36:2960
'''

def floatFormat(num):
    return "{0:.2f}".format(num)

#def updateCPURRD(ctemp, gtemp, cusage):
#    global CpuRRDFile 
#    if not os.path.exists(CpuRRDFile):
#        ret = rrdtool.create(CpuRRDFile, '--step', '300',
#                'DS:cputemp:GAUGE:600:30:100',
#                'DS:gputemp:GAUGE:600:30:100',
#                'DS:cpuUsage:GAUGE:600:0:100',
#                'RRA:AVERAGE:0.5:1:228',
#                'RRA:AVERAGE:0.5:3:672',
#                'RRA:AVERAGE:0.5:12:744')
#        if ret:
#            print rrdtool.error()
#            return False
#
#    #update data
#    ret = rrd_update(CpuRRDFile, 'N:%s:%s:%s' %(ctemp, gtemp, cusage));
#    if ret:
#        print rrdtool.error()
#        return False
#
#    return True

def updateCPURRD(ctemp, cusage, pids):
    if not os.path.exists(CpuRRDFile):
        ret = rrdtool.create(CpuRRDFile, '--step', '300',
                'DS:cputemp:GAUGE:600:0:100',
                'DS:cpuUsage:GAUGE:600:0:100',
                'DS:pids:GAUGE:600:0:U',
                'RRA:AVERAGE:0.5:1:864',
                'RRA:AVERAGE:0.5:3:1344',
                'RRA:AVERAGE:0.5:12:1488',
                'RRA:AVERAGE:0.5:36:2960')
        if ret:
            print rrdtool.error()
            return False

    #update data
    ret = rrd_update(CpuRRDFile, 'N:%s:%s:%s' %(ctemp, cusage, pids));
    if ret:
        print rrdtool.error()
        return False

    return True

def updateCPUCoreRRD(cpu_cores, cpu_num):
    if not os.path.exists(CPUCoresRRDFile):

        core_DS=[]
        for i in range(cpu_num):
            core_DS.append("DS:core_" + str(i) + ":GAUGE:600:0:100")

        core_DS.append("DS:core_avg:GAUGE:600:0:100")
        ret = rrdtool.create(CPUCoresRRDFile, '--step', '300',
                core_DS,
                'RRA:AVERAGE:0.5:1:864',
                'RRA:AVERAGE:0.5:3:1344',
                'RRA:AVERAGE:0.5:12:1488',
                'RRA:AVERAGE:0.5:36:2960')
        if ret:
            print rrdtool.error()
            return False

    core_avg = sum(cpu_cores)/float(4)

    #update data
    core_data = "N"
    for i in range(cpu_num):
        core_data+= ":" + str(cpu_cores[i])

    core_data+=":"+str(core_avg)

    ret = rrd_update(CPUCoresRRDFile, core_data);
    if ret:
        print rrdtool.error()
        return False

    return True

def updateUptimeRRD(uptime):
    if not os.path.exists(UptimeRRDFile):
        ret = rrdtool.create(UptimeRRDFile, '--step', '300',
                'DS:uptime:GAUGE:600:0:U',
                'RRA:LAST:0.5:1:864',
                'RRA:LAST:0.5:3:1344',
                'RRA:LAST:0.5:12:1488',
                'RRA:LAST:0.5:36:2960')
        if ret:
            print rrdtool.error()
            return False

    #update data
    ret = rrd_update(UptimeRRDFile, 'N:%s' %(uptime));
    if ret:
        print rrdtool.error()
        return False

    return True

def updateMemRRD(total, used, buf, cached, free):
    if not os.path.exists(MemRRDFile):
        ret = rrdtool.create(MemRRDFile, '--step', '300',
                'DS:total:GAUGE:600:0:U',
                'DS:used:GAUGE:600:0:U',
                'DS:buf:GAUGE:600:0:U',
                'DS:cached:GAUGE:600:0:U',
                'DS:free:GAUGE:600:0:U',
                'RRA:AVERAGE:0.5:1:864',
                'RRA:AVERAGE:0.5:3:1344',
                'RRA:AVERAGE:0.5:12:1488',
                'RRA:AVERAGE:0.5:36:2960')

        if ret:
            print rrdtool.error()
            return False

    #update data
    ret = rrd_update(MemRRDFile, 'N:%s:%s:%s:%s:%s' %(total, used, buf, cached, free));
    if ret:
        print rrdtool.error()
        return False
    return True

def updatePartitionRRD(index, total, used, free, percent):
    MountRRDFile = RRDSDIR +'/' +'mount-%s.rrd' % (index)
    if not os.path.exists(MountRRDFile):
        ret = rrdtool.create(MountRRDFile, '--step', '300',
                'DS:total:GAUGE:600:0:U',
                'DS:used:GAUGE:600:0:U',
                'DS:free:GAUGE:600:0:U',
                'DS:percent:GAUGE:600:0:100',
                'RRA:AVERAGE:0.5:1:864',
                'RRA:AVERAGE:0.5:3:1344',
                'RRA:AVERAGE:0.5:12:1488',
                'RRA:AVERAGE:0.5:36:2960')

        if ret:
            print rrdtool.error()
            return False

    #update data
    ret = rrd_update(MountRRDFile, 'N:%s:%s:%s:%s' %(total, used, free, percent));
    if ret:
        print rrdtool.error()
        return False
    return True

def updateNetRRD(net, send, recv):
    NetRRDFile = RRDSDIR + '/' + 'interface-%s.rrd' % (net)
    if not os.path.exists(NetRRDFile):
        ret = rrdtool.create(NetRRDFile, '--step', '300',
                'DS:send:DERIVE:600:0:U',
                'DS:recv:DERIVE:600:0:U',
                'RRA:AVERAGE:0.5:1:864',
                'RRA:AVERAGE:0.5:3:1344',
                'RRA:AVERAGE:0.5:12:1488',
                'RRA:AVERAGE:0.5:36:2960')

        if ret:
            print rrdtool.error()
            return False

    #update data
    ret = rrd_update(NetRRDFile, 'N:%s:%s' %(send, recv));
    if ret:
        print rrdtool.error()
        return False
    return True

def updateDiskRRD(name, rcount, wcount, rbytes, wbytes,
        rtime, wtime):
    DiskRRDFile = RRDSDIR +'/' +'hdd-%s.rrd' % (name)
    if not os.path.exists(DiskRRDFile):
        ret = rrdtool.create(DiskRRDFile, '--step', '300',
                'DS:rcount:DERIVE:600:0:U',
                'DS:wcount:DERIVE:600:0:U',
                'DS:rbytes:DERIVE:600:0:U',
                'DS:wbytes:DERIVE:600:0:U',
                'DS:rtime:DERIVE:600:0:U',
                'DS:wtime:DERIVE:600:0:U',
                'RRA:AVERAGE:0.5:1:864',
                'RRA:AVERAGE:0.5:3:1344',
                'RRA:AVERAGE:0.5:12:1488',
                'RRA:AVERAGE:0.5:36:2960')

        if ret:
            print rrdtool.error()
            return False

    #update data
    ret = rrd_update(DiskRRDFile, 
            'N:%s:%s:%s:%s:%s:%s' %(rcount, wcount, rbytes, wbytes, rtime, wtime));
    if ret:
        print rrdtool.error()
        return False
    return True
    
def get_cpu_temp():

    tempfile = '/sys/class/thermal/thermal_zone0/temp'
    if os.path.exists(tempfile):
        tf = open(tempfile)
        cpu_temp = tf.read()
        tf.close()
        return float(cpu_temp)/1000
    else:
        return 0

#def get_gpu_temp():
#    #cmd = subprocess.Popen(['sudo /opt/vc/bin/vcgencmd measure_temp'], shell=True, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
#    #cmd.communicate('password\n')
#    cmd = subprocess.Popen(['/opt/vc/bin/vcgencmd measure_temp'], 
#        shell=True, stdin=subprocess.PIPE, stdout=subprocess.PIPE)
#    gpu_temp = cmd.communicate()[0].replace( 'temp=', '' ).replace( '\'C', '' )
#    return float(gpu_temp)
    
def get_cpuInfo():
    time.sleep(3)
    cpuUsage = psutil.cpu_percent()
    cpuNum = psutil.cpu_count()
    cTemp = get_cpu_temp()
    pids = psutil.pids()
#    gTemp = get_gpu_temp()
#    if updateCPURRD(cTemp, gTemp, cpuUsage) == False:
    if updateCPURRD(cTemp,  cpuUsage, len(pids)) == False:
        return False

    if cpuNum > 1:
        cpuCores = psutil.cpu_percent(percpu=True)
        if updateCPUCoreRRD(cpuCores, cpuNum) == False:
            return False

    
    uptime = int(time.time() - psutil.boot_time())/60 #uptime in minutes
    if updateUptimeRRD(uptime) == False:
        return False

    return True
    

def get_memInfo():
    '''
    svmem(total=508686336L, available=432787456L, percent=14.9, used=480034816L, free=28651520L, active=214945792, inactive=228995072, buffers=43900928L, cached=360235008)
    '''
    mem = psutil.phymem_usage()

    if updateMemRRD(mem.total, mem.used, 
            mem.buffers, mem.cached, (mem.total - mem.used)) == False:
        return False

    return True    
    
   
def get_mountInfo():
    disks = psutil.disk_partitions()
    index = ""
    for d in disks:
        mpoint = d.mountpoint
        diskInfo = psutil.disk_usage(mpoint)

        if mpoint == '/':
            index = "root"
        else:
            lp = mpoint.split('/')
            index = lp[ len(lp) - 1 ]

#        updatePartitionRRD(index, dtotal, dused, dfree, float(diskInfo.percent))
        updatePartitionRRD(index, diskInfo.total, 
                diskInfo.used, diskInfo.free, float(diskInfo.percent))

        '''
        sdiskusage(total=7764254720L, used=3972837376L, free=3429568512L, percent=51.2)
        '''
def get_netInfo():
    nets = psutil.net_io_counters(pernic=True)
    for net in nets.keys():
        if net == 'lo':
            continue
        
        info = nets.get(net)
        #snetio(bytes_sent=42988, bytes_recv=42988, packets_sent=595, packets_recv=595, errin=0, errout=0, dropin=0, dropout=0)
        updateNetRRD(net, info.bytes_sent, info.bytes_recv)

def get_diskInfo():
    disks = psutil.disk_io_counters(perdisk=True)

    for dname in disks.keys():
        diskio = disks.get(dname)
        #sdiskio(read_count=9837, write_count=43761, read_bytes=198268416, write_bytes=933855232, read_time=87870, write_time=35913990)

        updateDiskRRD(dname, diskio.read_count, diskio.write_count,
                diskio.read_bytes, diskio.write_bytes,
                diskio.read_time, diskio.write_time)

def test():
    print 'test....'
    #get_netInfo()
    get_cpuInfo()

def main():

    get_cpuInfo()
    get_memInfo()
    get_diskInfo()
    get_mountInfo()
    get_netInfo()
        
if __name__ == '__main__':
    main()
    #test()
