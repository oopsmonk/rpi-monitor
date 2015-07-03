var update_interval=5; //seconds
var KB=1024;
var MB=KB*1024;
var GB=MB*1024;
var max_point=50;
var tip_fixed=2;
var timestamp;

function date2str(x, y) {
    var z = {
        M: x.getMonth() + 1,
        d: x.getDate(),
        h: x.getHours(),
        m: x.getMinutes(),
        s: x.getSeconds()
    };
    y = y.replace(/(M+|d+|h+|m+|s+)/g, function(v) {
        return ((v.length > 1 ? "0" : "") + eval('z.' + v.slice(-1))).slice(-2)
    });

    return y.replace(/(y+)/g, function(v) {
        return x.getFullYear().toString().slice(-v.length)
    });
}

function traffic_tip(label, xval, yval, flotItem){
    var time = date2str(new Date(xval), 'hh:mm:ss');
    if (yval > GB)
        return label + ' ' + (yval/GB).toFixed(tip_fixed) + 'GB' + '<br>' + time;
    else if (yval > MB)
        return label + ' ' + (yval/MB).toFixed(tip_fixed) + 'MB' + '<br>' + time;
    else if (yval > KB)
        return label + ' ' + (yval/KB).toFixed(tip_fixed) + 'KB' + '<br>' + time;
    else
        return label + ' ' + yval + 'B' + '<br>' + time;
}

function mem_tip(label, xval, yval, flotItem){
    if (yval > GB)
        return label + ' ' + (yval/GB).toFixed(tip_fixed) + 'GB';
    else if (yval > MB)
        return label + ' ' + (yval/MB).toFixed(tip_fixed) + 'MB';
    else if (yval > KB)
        return label + ' ' + (yval/KB).toFixed(tip_fixed) + 'KB';
    else
        return label + ' ' + yval + 'B';
}

function suffixFormatter(val, axis) {
    if (val > GB)
        return (val / GB).toFixed(tip_fixed) + " GB";
    else if (val > MB)
        return (val / MB).toFixed(tip_fixed) + " MB";
    else if (val > KB)
        return (val / KB).toFixed(tip_fixed) + " KB";
    else
        return val.toFixed(tip_fixed);
}

var init=0;
var net_sent=0;
var net_rec=0;
var net_data = [[],[]];
var net_option={
    series: {
        shadowSize: 0   // Drawing is faster without shadows
    },
    yaxis: {
        min: 0,
        //max: 100000 
        tickFormatter: suffixFormatter,
        tickDecimals: 0
    },
    xaxis: {
        show: false
    },
    lines:{show:true},points:{show:true},
    grid: { hoverable: true, clickable: false},
    tooltip: {
        show: true,
        content: traffic_tip, 
        shifts: {
          x: 20,
          y: 0
        }
    }
};
var net_plot = $.plot("#net_io", net_data, net_option);

function rt_update_net(value){
    // This could be an ajax call back.
    if(init==0){
        net_sent = value[0];
        net_rec = value[1];
        init = 1;
    }else{
        var s = value[0] - net_sent;
        var c = value[1] - net_rec;
        net_sent = value[0];
        net_rec = value[1];
        var datum1 = [timestamp, s/update_interval];
        var datum2 = [timestamp, c/update_interval];
        //console.log('data0:' + datum1);
        //console.log('data1:' + datum2);
        net_data[0].push(datum1);
        net_data[1].push(datum2);
        if(net_data[0].length > max_point){
            // only allow record max_point points
            net_data[0] = net_data[0].splice(1);
            net_data[1] = net_data[1].splice(1);
        }
    }
    //net_plot.setData(net_data);
    net_plot.setData([
        { data: net_data[0], label: 'Sent'},
        { data: net_data[1], label: 'Recv'}
    ]);
    net_plot.setupGrid();
    net_plot.draw();
}

//disk data
var init_disk=0;
var disk_read=0;
var disk_write=0;

var disk_data = [[],[]];
var disk_option={
    series: {
        shadowSize: 0   // Drawing is faster without shadows
    },
    yaxis: {
        min: 0,
        //max: 100000 
        tickFormatter: suffixFormatter,
        tickDecimals: 0
    },
    xaxis: {
        show: false
    },
    lines:{show:true},points:{show:true},
    grid: { hoverable: true, clickable: false},
    tooltip: {
        show: true,
        content: traffic_tip, 
        shifts: {
          x: 20,
          y: 0
        }
    }
};
var disk_plot = $.plot("#disk_io", disk_data, disk_option);

function rt_update_disk(value){
    // This could be an ajax call back.
    if(init_disk==0){
        disk_read = value[2];
        disk_write = value[3];
        init_disk = 1;
    }else{
        var s = value[2] - disk_read;
        var c = value[3] - disk_write;
        disk_read = value[2];
        disk_write = value[3];
        var datum1 = [timestamp, s/update_interval];
        var datum2 = [timestamp, c/update_interval];
        disk_data[0].push(datum1);
        disk_data[1].push(datum2);
        if(disk_data[0].length > max_point){
            // only allow record max_point points
            disk_data[0] = disk_data[0].splice(1);
            disk_data[1] = disk_data[1].splice(1);
        }
        
    }
    //disk_plot.setData(disk_data);
    disk_plot.setData([
        { data: disk_data[0], label: 'Read'},
        { data: disk_data[1], label: 'Write'}
    ]);
    disk_plot.setupGrid();
    disk_plot.draw();
}

function rt_update_mem(value){
    //vmem(total=508686336L, available=432787456L, percent=14.9, used=480034816L, free=28651520L, active=214945792, inactive=228995072, buffers=43900928L, cached=360235008)
    var mem_data=[
        {data:(value[0]-value[1]), label: 'Used'},
        {data:value[1], label: 'Available'}
    ];
    $.plot('#mem_pie', mem_data, {
        series: {
            pie: {
                innerRadius: 0.3,
                show: true,
                label: {
                    show: true
                }
            }
        },
        grid: {
            hoverable: true,
            clickable: false 
        },
        legend: {
            show: false
        },
        tooltip: {
            show: true,
            content: mem_tip, 
            shifts: {
              x: 20,
              y: 0
            }
        }
    });
}

var user_table_obj={};
function rt_update_users(value){

    //name='sam.chen', terminal=':0', host='localhost', started=1435538304.0
    var user_info=[];
    if(value[0] != null){
        for(i=0; i < value.length ; i++){
            user_info.push([value[i][0], value[i][2], value[i][1]]);
        }
        //console.log('get : ' + user_info);
    }else{
        user_info.push(['Na','Na','Na']);
    }
    user_table_obj.fnClearTable();
    user_table_obj.fnAddData(user_info);
    user_table_obj.fnDraw(); 
}

var proc_table_obj={};
function rt_update_procs(value){

    var procs_info=[];
    //console.log('proc count: ' + value.length);
    //console.log('[0]' + value[0]) ;
    for(i=0; i < value.length ; i++){
        //(['pid', 'name', 'username', 'cpu_percent', 'memory_percent', 'create_time', 'status'])
        procs_info.push([value[i][0], value[i][1], value[i][2], value[i][3], value[i][4].toFixed(2), value[i][5], value[i][6]]);
    }
    proc_table_obj.fnClearTable();
    proc_table_obj.fnAddData(procs_info);
    proc_table_obj.fnDraw(); 
}

//bernii/gauge.js
var gauge_opts = {
    lines: 12, // The number of lines to draw
    angle: 0, // The length of each line
    lineWidth: 0.4, // The line thickness
    pointer: {
        length: 0.7, // The radius of the inner circle
        strokeWidth: 0.035, // The rotation offset
        color: '#000000' // Fill color
    },
    limitMax: 'false',   // If true, the pointer will not go past the end of the gauge
    percentColors: [[0.0, "#009933" ], [0.50, "#CC9933"], [1.0, "#FF0033"]],
    colorStart: '#6FADCF',   // Colors
    colorStop: '#8FC0DA',    // just experiment with them
    strokeColor: '#E0E0E0',   // to see which ones work best for you
    generateGradient: true
};

var temp_gauge={};
var cpu_gauge={};
function rt_update_temp(value){
    $('#temp_text').text(value + ' \u00B0C');
    temp_gauge.set(value); // set actual value
}

function rt_update_cpu(value){
    $('#cpu_load_text').text(value + ' %');
    cpu_gauge.set(value); // set actual value
}

function fetchData(){
    timestamp= new Date();

    $.getJSON('rt_info', function(data){
        //netio(bytes_sent=42988, bytes_recv=42988, packets_sent=595, packets_recv=595, errin=0, errout=0, dropin=0, dropout=0)
        rt_update_net(data[0]);
        //diskio(read_count=9837, write_count=43761, read_bytes=198268416, write_bytes=933855232, read_time=87870, write_time=35913990)
        rt_update_disk(data[1]);
        //vmem(total=508686336L, available=432787456L, percent=14.9, used=480034816L, free=28651520L, active=214945792, inactive=228995072, buffers=43900928L, cached=360235008)
        rt_update_mem(data[2]);

        rt_update_users(data[3]);
        rt_update_procs(data[4]);
        rt_update_temp(data[5]);
        rt_update_cpu(data[6]);
        setTimeout(function(){fetchData();},update_interval*1000);

    });   

}


$(document).ready(function(){

    $('#user_list').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="user_table"></table>' );
    user_table_obj = $('#user_table').dataTable( {
        //"dom": 'lrtip',
        "searching": false,
        "paging":   false,
        "info":     false,
        "data": [],
        "columns": [
            { "title": "Name" },
            { "title": "Host" },
            { "title": "Terminal" }
        ]
    } );  

    //(['pid', 'name', 'username', 'cpu_percent', 'memory_percent', 'create_time', 'status'])
    $('#proc_list').html( '<table cellpadding="0" cellspacing="0" border="0" class="display" id="proc_table"></table>' );
    proc_table_obj = $('#proc_table').dataTable( {
        //"paging":   false,
        //"info":     false,
        "data": [],
        "order": [[ 3, "desc" ]],
        "columns": [
            { "title": "PID" },
            { "title": "Name" },
            { "title": "User" },
            { "title": "CPU %" },
            { "title": "Memory %" },
            { "title": "Create Time" },
            { "title": "Status" }
        ]
    } );  

    temp_gauge = new Gauge(document.getElementById('temp_meter')).setOptions(gauge_opts); // create sexy gauge!
    temp_gauge.maxValue = 100; // set max gauge value
    cpu_gauge = new Gauge(document.getElementById('cpu_meter')).setOptions(gauge_opts); // create sexy gauge!
    cpu_gauge.maxValue = 100; // set max gauge value

    fetchData();



}); //EOF page init
