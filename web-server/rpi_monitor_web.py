#!/usr/bin/env python

from bottle import route, static_file, debug, run, get, redirect
#from bottle import post, request
import os, inspect
import json

#enable bottle debug
debug(True)

# WebApp route path
routePath = '/RpiMonitor'
# get directory of WebApp (pyWebMOC.py's dir)
rootPath = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

def getRRDFiles():
    global rootPath 
    files = os.listdir(rootPath + "/data")
    rrdlist = [ f for f in files if f.find("rrd") != -1 ]
    return rrdlist 

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
    rrdlist = getRRDFiles()
    print rrdlist  
    flist = [ rrdf for rrdf in rrdlist if 'interface' in rrdf ]
    print flist 
    return json.dumps({"rrdflies":flist})
    
#get HDD rrd files
@get(routePath + '/hddrrd')
def getHDDRRD():
    rrdlist = getRRDFiles()
    flist = [ rrdf for rrdf in rrdlist if "hdd" in rrdf ]
    return json.dumps({"rrdflies":flist})

#get mount point rrd files
@get(routePath + '/mountrrd')
def getMountRRD():
    rrdlist = getRRDFiles()
    flist = [ rrdf for rrdf in rrdlist if "mount" in rrdf ]
    return json.dumps({"rrdflies":flist})


run(host='localhost', port=9999, reloader=True) #debug
