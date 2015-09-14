#!/bin/bash  
project_name='rpi-monitor'
dir_base=`pwd`
user=`whoami`
pkgs="git libcairo2-dev libpango1.0-dev libglib2.0-dev libxml2-dev librrd-dev python2.7-dev rrdtool python-rrdtool python-setuptools"
target_path="$dir_base/$project_name"

#check if rpi-monitor exist here  
if [[ $dir_base =~ $project_name ]]; then
    echo "$project_name is exist in this path: $dir_base"
    exit 1
fi

if [ -d $target_path ]; then
    echo "$project_name is exist in this directory."
    exit 1
fi

#mkdir $target_path && cd $target_path

#asking password  
echo "Install requirements..."
read -s -p "Enter Password($user): " user_pwd
#update and install packages 
echo $user_pwd | sudo -S apt-get update
echo $user_pwd | sudo -S apt-get install -y $pkgs
echo $user_pwd | sudo -S easy_install pip
echo $user_pwd | sudo -S pip install bottle 'psutil>=2.1.1'
echo "Packages are installed."

#clone project here
git clone https://github.com/oopsmonk/rpi-monitor.git $target_path
if [ $? -ne 0 ]; then
    echo "git clone failed...exit"
    exit 1
fi

#run rpi-monitor for test and get initial data 
python "$target_path/rpi_monitor.py" 
if [ $? -ne 0 ]; then
    echo "initail data error...exit"
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
echo "Create symbolic link at: $target_path/web-server/data"

#crontab 
schedule="*/14 * * * * $target_path/rpi_monitor.py"
echo "add to crontab: $schedule"
(crontab -u $user -l; echo "$schedule" ) | crontab -u $user -

#run web server
echo "Starting rpi-monitor at: $target_path/web-server/rpi_monitor_web.py"
python $target_path/web-server/rpi_monitor_web.py
