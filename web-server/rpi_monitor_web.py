#!/usr/bin/env python

from bottle import route, static_file, debug, run, get, redirect
#from bottle import post, request
import os, inspect

#enable bottle debug
debug(True)

# WebApp route path
routePath = '/RpiMonitor'
# get directory of WebApp (pyWebMOC.py's dir)
rootPath = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))

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

run(host='localhost', port=9999, reloader=True) #debug
