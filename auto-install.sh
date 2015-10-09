#!/bin/bash  
project_name='rpi-monitor'
dir_base=`pwd`
user=`whoami`
pkgs="git libcairo2-dev libpango1.0-dev libglib2.0-dev libxml2-dev librrd-dev python2.7-dev rrdtool python-rrdtool python-setuptools"

function info {
    echo -e "\e[1;36m$1\e[0m"
}

function err {
    echo -e "\e[1;31m$1\e[0m"
}

read -p "Installation path [${dir_base}]: " user_dir
if [ -n "$user_dir" ]; then
    dir_base=${user_dir}
fi
target_path="$dir_base/$project_name"

#check if rpi-monitor exist here  
if [[ $dir_base =~ $project_name ]]; then
    err "$project_name is exist in this path: $dir_base"
    exit 1
fi

if [ -d $target_path ]; then
    err "$project_name is exist in this directory."
    exit 1
fi

#asking password  
info "Install requirements..."
read -s -p "[sudo] password for $user: " user_pwd
#check pwd
sudo -k
echo $user_pwd | sudo -S echo oops &> /dev/null
if [ $? -ne 0 ]; then
    err "Invalid password...exit"
    exit 1
fi

#update and install packages 
echo $user_pwd | sudo -S apt-get update
echo $user_pwd | sudo -S apt-get install -y $pkgs
echo $user_pwd | sudo -S easy_install pip
echo $user_pwd | sudo -S pip install bottle 'psutil>=2.1.1'
info "Packages are installed."

#clone project here
git clone https://github.com/oopsmonk/rpi-monitor.git $target_path
if [ $? -ne 0 ]; then
    err "git clone failed...exit"
    exit 1
fi

#run rpi-monitor for test and get initial data 
python "$target_path/rpi_monitor.py" 
if [ $? -ne 0 ]; then
    err "initial data error...exit"
    exit 1
fi

sync

#create symbolic link for web  
cd "$target_path/web-server/data"
for entry in "$target_path/rrds"/*
do
    file_name=$(basename $entry)
    ln -s "../../rrds/$file_name" $file_nam 
done

#crontab 
schedule="*/5 * * * * $target_path/rpi_monitor.py"
#echo "add to crontab: $schedule"
(crontab -u $user -l; echo "$schedule" ) | crontab -u $user -

#nginx
function nginx_setup {
cat > $target_path/rpi-mointor.com <<EOF
server {
    listen 9000;
    server_name localhost;
    access_log /var/log/nginx/rpiMonitor_access.log;
    error_log /var/log/nginx/rpiMonitor_error.log;
    location / {
        proxy_pass http://127.0.0.1:9999;
    }
}
EOF
}

read -p $'\e[1;33mStart rpi-monitor now? [Y/n]:\e[0m ' start_web
if [[ $start_web =~ ^(n|N)$ ]]; then
    echo "You can start rpi-mointor via: "
    info "python $target_path/web-server/rpi_monitor_web.py"
else
    echo "Starting rpi-mointor at: "
    info "$target_path/web-server/rpi_monitor_web.py"
    python $target_path/web-server/rpi_monitor_web.py > /dev/null 2>&1 &
    if [ $? -ne 0 ]; then
        err "Start rpi-mointor error!!"
        exit 1
    fi
    info "rpi-monitor is started (pid $!)"
fi

echo "RRD data symbolic link at: "
info "$target_path/web-server/data"
echo "Schedule is appended to crontab: "
info "$schedule"

read -p $'\e[1;33mEnable nginx web server? [Y/n]:\e[0m ' config_nginx
if [[ $config_nginx =~ ^(n|N)$ ]]; then
    echo "You can access local rpi-mointor via:"
    info "http://localhost:9999/RpiMonitor"
else
    info "Install nginx..."
    echo $user_pwd | sudo -S apt-get install -y nginx
    nginx_setup
    echo $user_pwd | sudo -S mv -f $target_path/rpi-mointor.com /etc/nginx/sites-enabled/
    echo $user_pwd | sudo -S service nginx restart
    myIP=`ifconfig eth0 | awk '/inet addr/{print substr($2,6)}'`
    echo "You can access rpi-mointor via:"
    info "http://$myIP:9000/RpiMonitor"
fi
info "rpi-mointor is installed in ${target_path}"
exit 0
