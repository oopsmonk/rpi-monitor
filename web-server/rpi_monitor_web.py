#!/usr/bin/env python

from bottle import route, static_file, debug, run, get, redirect
from bottle import post, request
import os, re, inspect
import json
import psutil

#enable bottle debug
debug(True)

# WebApp route path
routePath = '/RpiMonitor'
# get directory of WebApp (pyWebMOC.py's dir)
rootPath = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
RRDDIR = rootPath + '/data'

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
            top_info.append(p)

    rt_info.append(psutil.users())
    rt_info.append(top_info)
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
