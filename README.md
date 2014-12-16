rpi-monitor
===========

Raspberry Pi Status Monitor

##How to use  

###Install  

    sudo apt-get install libcairo2-dev libpango1.0-dev libglib2.0-dev libxml2-dev librrd-dev python2.7-dev rrdtool python-rrdtool  
    wget https://pypi.python.org/packages/source/p/psutil/psutil-2.1.1.tar.gz  
    tar xf psutil-2.1.1.tar.gz  
    cd psutil-2.1.1  
    sudo python setup.py install  

###Setup Crontab  
By defualt, the `cron.log` is disabled in [Raspbian](http://www.raspbian.org/).  
To enable it:  

    #Ubuntu 14.04
    $sudo vi /etc/rsyslog.d/50-default.conf
    #Raspberry Pi
    $sudo vi /etc/rsyslog.conf

find the line and uncomment it.  

    # cron.*                          /var/log/cron.log

Restart `rsyslog` via:  

    sudo /etc/init.d/rsyslog restart  

Modify `crontab`  

    crontab -e  

Add schedule as below 

    #data collection every 5 minutes
    */5 * * * * /path/to/rpi-monitor/rpi_monitor.py
    #generate daily graph report at 00:01
    1 0 * * * /path/to/rpi-monitor/graphReport.py -1d 
    #generate weekly graph report at 00:03 on Monday
    3 0 * * 1 /path/to/rpi-monitor/graphReport.py -1w

