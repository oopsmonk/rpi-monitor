#!/usr/bin/env python

from bottle import route, static_file, debug, run, get, redirect
from bottle import post, request
import os, re, inspect
import json
import psutil
import datetime

#enable bottle debug
debug(True)

# WebApp route path
routePath = '/RpiMonitor'
# get directory of WebApp (pyWebMOC.py's dir)
rootPath = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
RRDDIR = rootPath + '/data'

def get_cpu_temp():

    tempfile = '/sys/class/thermal/thermal_zone0/temp'
    if os.path.exists(tempfile):
        tf = open(tempfile)
        cpu_temp = tf.read()
        tf.close()
        return round(float(cpu_temp)/1000,2)
    else:
        return 0

@route(routePath)
def rootHome():
    #return redirect(routePath+'/index.html')
    return redirect(routePath+'/index.html')

@route(routePath + '/<filename:re:.*\.html>')
def html_file(filename):
    return static_file(filename, root=rootPath)

@get(routePath + '/assets/<filepath:path>')
def assets_file(filepath):
    return static_file(filepath, root=rootPath+'/assets')

@get(routePath + '/data/<filepath:path>')
def rrd_file(filepath):
    return static_file(filepath, root=rootPath+'/data')

#get system rrdfiles
@get(routePath + '/sysrrd')
def sysRRDFile():
    sysrrdlist = ["cpustatus.rrd", "meminfo.rrd", "uptime.rrd"]
    return json.dumps({"rrdfile":sysrrdlist})


#get network rrd files
@get(routePath + '/netrrd')
def getNetworkRRD():
    global RRDDIR 
    flist = [f for f in os.listdir(RRDDIR) if re.match('^interface-\w*\.rrd', f)] 
    print flist 
    return json.dumps({"rrdfile":flist})
    
#get HDD rrd files
@get(routePath + '/hddrrd')
def getHDDRRD():
    global RRDDIR 
    hdd_files = [f for f in os.listdir(RRDDIR) if re.match('^hdd-\w*\.rrd', f)] 
    return json.dumps({"rrdfile":hdd_files})

#get mount point rrd files
@get(routePath + '/mountrrd')
def getMountRRD():
    flist = [f for f in os.listdir(RRDDIR) if re.match('^mount-\w*\.rrd', f)] 
    return json.dumps({"rrdfile":flist})

#get cpu core rrd file
@get(routePath + '/cpucores')
def cpuRRDFile():
    corerrdfile = 'cpucores.rrd'
    if os.path.isfile(RRDDIR + '/' + corerrdfile):
        core_cnt = psutil.cpu_count()
        return json.dumps({'core_num':core_cnt})

    return json.dumps({})

#get system real time info
@get(routePath + '/rt_info')
def realTimeInfo():
    rt_info = []
    top_info = []
    for p in psutil.process_iter():
        try:
            p = p.as_dict(['pid', 'name', 'username', 'cpu_percent', 'memory_percent', 'create_time', 'status'])
        except psutil.NoSuchProcess:
            return json.dumps({'error':'NoSuchProcess'})
        else:
            top_info.append([p.get('pid'), p.get('name'), p.get('username'), p.get('cpu_percent'), p.get('memory_percent'), datetime.datetime.fromtimestamp(p.get('create_time')).strftime("%Y-%m-%d %H:%M:%S"), p.get('status')])

    nets = psutil.net_io_counters()
    #snetio(bytes_sent=42988, bytes_recv=42988, packets_sent=595, packets_recv=595, errin=0, errout=0, dropin=0, dropout=0)
    disks = psutil.disk_io_counters()
    #sdiskio(read_count=9837, write_count=43761, read_bytes=198268416, write_bytes=933855232, read_time=87870, write_time=35913990)
    mem = psutil.virtual_memory()
    #svmem(total=508686336L, available=432787456L, percent=14.9, used=480034816L, free=28651520L, active=214945792, inactive=228995072, buffers=43900928L, cached=360235008)

    rt_info.append(nets)
    rt_info.append(disks)
    rt_info.append(mem)
    rt_info.append(psutil.users())
    rt_info.append(top_info)
    rt_info.append(get_cpu_temp())
    rt_info.append(psutil.cpu_percent())
    return json.dumps(rt_info)

#get process detail info by pid
#input JSON: {'pid':100}
#out JSON: psutil.Process().as_dict()
@post(routePath + '/proc_info')
def processInfo():
    data = request.json
    if data is None:
        print('NoneData')
        return json.dumps({'error':'NoneData'})

    p = data.get('pid')

    try:
        proc_info = psutil.Process(int(p)).as_dict()
    except psutil.NoSuchProcess:
        print('error')
        return json.dumps({'error':'NoSuchProcess'})
    else:
        return json.dumps(proc_info)

run(host='localhost', port=9999, reloader=True) #debug
