#!/usr/bin/env python

from bottle import route, static_file, debug, run, get, redirect
#from bottle import post, request
import os, re, inspect
import json

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
    return json.dumps({"rrdfiles":sysrrdlist})


#get network rrd files
@get(routePath + '/netrrd')
def getNetworkRRD():
    global RRDDIR 
    flist = [f for f in os.listdir(RRDDIR) if re.match('^interface-\w*\.rrd', f)] 
    print flist 
    return json.dumps({"rrdflies":flist})
    
#get HDD rrd files
@get(routePath + '/hddrrd')
def getHDDRRD():
    global RRDDIR 
    hdd_files = [f for f in os.listdir(RRDDIR) if re.match('^hdd-\w*\.rrd', f)] 
    return json.dumps({"rrdflies":hdd_files})

#get mount point rrd files
@get(routePath + '/mountrrd')
def getMountRRD():
    flist = [f for f in os.listdir(RRDDIR) if re.match('^mount-\w*\.rrd', f)] 
    return json.dumps({"rrdflies":flist})


run(host='localhost', port=9999, reloader=True) #debug
