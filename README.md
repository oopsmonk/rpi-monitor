rpi-monitor
===========

Raspberry Pi System Monitor

###Install Requirements 

**psutil >= 2.1.1**  

    $ sudo apt-get install libcairo2-dev libpango1.0-dev libglib2.0-dev libxml2-dev librrd-dev python2.7-dev rrdtool python-rrdtool python-setuptools  
    $ sudo easy_install pip  
    $ sudo pip install bottle psutil  

###Checkout Source  

    $ git ckeckout https://github.com/oopsmonk/rpi-monitor.git  

###Crontab Configuration  

By default, the `cron.log` is disabled in [Raspbian](http://www.raspbian.org/).  
Enable crontab log for debug:  

    #Ubuntu 14.04
    $ sudo vi /etc/rsyslog.d/50-default.conf
    #Raspberry Pi
    $ sudo vi /etc/rsyslog.conf

Find the line and uncomment it.  

    # cron.*                          /var/log/cron.log

Restart `rsyslog` :  

    $ sudo /etc/init.d/rsyslog restart  

Modify `crontab`  

    $ crontab -e  

Add schedule as below 

    #data collection every 5 minutes
    */5 * * * * /path/to/rpi-monitor/rpi_monitor.py
    #generate daily graph report at 00:01
    1 0 * * * /path/to/rpi-monitor/graphReport.py -1d 
    #generate weekly graph report at 00:03 on Monday
    3 0 * * 1 /path/to/rpi-monitor/graphReport.py -1w

###Web Server Configuration 

* Add rrd files which want to show on web. 

        $ cd ./web-server/data/
        $ ln -s ../../rrds/cpustatus.rrd cpustatus.rrd  
        $ ln -s ../../rrds/meminfo.rrd meminfo.rrd
        $ ln -s ../../rrds/uptime.rrd uptime.rrd  
        ....
        $ ln -s ../../rrds/hdd-sda1.rrd hdd-sda1.rrd

    Here is an example :  

        $ tree ./web-server/data/
        ./web-server/data/
        ├── cpustatus.rrd -> ../../rrds/cpustatus.rrd
        ├── hdd-sda1.rrd -> ../../rrds/hdd-sda1.rrd
        ├── hdd-sda2.rrd -> ../../rrds/hdd-sda2.rrd
        ├── interface-eth1.rrd -> ../../rrds/interface-eth1.rrd
        ├── interface-eth2.rrd -> ../../rrds/interface-eth2.rrd
        ├── meminfo.rrd -> ../../rrds/meminfo.rrd
        ├── mount-root.rrd -> ../../rrds/mount-root.rrd
        └── uptime.rrd -> ../../rrds/uptime.rrd

* Start web server  

    $ ./web-server/rpi_monitor_web.py  

    Connect to http://localhost:9999/RpiMonitor/index.html  

###Web Screenshots  

<img src="https://raw.githubusercontent.com/oopsmonk/markdown-note/master/pictures/20141230-RPi-Monitor-Screenshot-1s.gif">

###License 

[The MIT license](https://github.com/oopsmonk/rpi-monitor/blob/master/LICENSE)  

