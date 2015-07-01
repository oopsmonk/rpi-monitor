
var max_point=50
//net data
var init=0;
var net_xaxis=0;
var net_sent=0;
var net_rec=0;
var net_data = [[],[]];
var net_option={
    series: {
        shadowSize: 0   // Drawing is faster without shadows
    },
    yaxis: {
        min: 0
        //max: 100000 
    },
    xaxis: {
        show: false
    },
    lines:{show:true},points:{show:true},
    grid: { hoverable: true, clickable: false} 
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
        var datum1 = [net_xaxis, s/1024];
        var datum2 = [net_xaxis, c/1024];
        //console.log('data0:' + datum1);
        //console.log('data1:' + datum2);
        net_data[0].push(datum1);
        net_data[1].push(datum2);
        if(net_data[0].length > max_point){
            // only allow record max_point points
            net_data[0] = net_data[0].splice(1);
            net_data[1] = net_data[1].splice(1);
        }
        net_xaxis++;
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
var disk_xaxis=0;
var disk_read=0;
var disk_write=0;

var disk_data = [[],[]];
var disk_option={
    series: {
        shadowSize: 0   // Drawing is faster without shadows
    },
    yaxis: {
        min: 0
        //max: 100000 
    },
    xaxis: {
        show: false
    },
    lines:{show:true},points:{show:true},
    grid: { hoverable: true, clickable: false} 
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
        var datum1 = [disk_xaxis, s/1024];
        var datum2 = [disk_xaxis, c/1024];
        disk_data[0].push(datum1);
        disk_data[1].push(datum2);
        if(disk_data[0].length > max_point){
            // only allow record max_point points
            disk_data[0] = disk_data[0].splice(1);
            disk_data[1] = disk_data[1].splice(1);
        }
        disk_xaxis++;
        
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
    var MB=1024*1024;
    var mem_data=[
        {data:Math.round(value[3]/MB), label: 'Used'},
        {data:Math.round(value[4]/MB), label: 'Free'}
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
            content: "%n MB", // show percentages, rounding to 2 decimal places
            shifts: {
              x: 20,
              y: 0
            }
        }
    });
    return 0;
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
    console.log('proc count: ' + value.length);
    console.log('[0]' + value[0]) ;
    for(i=0; i < value.length ; i++){
        //(['pid', 'name', 'username', 'cpu_percent', 'memory_percent', 'create_time', 'status'])
        procs_info.push([value[i][0], value[i][1], value[i][2], value[i][3], value[i][4].toFixed(2), value[i][5], value[i][6]]);
    }
    proc_table_obj.fnClearTable();
    proc_table_obj.fnAddData(procs_info);
    proc_table_obj.fnDraw(); 
}

function fetchData(){

    $.getJSON('rt_info', function(data){
        //netio(bytes_sent=42988, bytes_recv=42988, packets_sent=595, packets_recv=595, errin=0, errout=0, dropin=0, dropout=0)
        rt_update_net(data[0]);
        //diskio(read_count=9837, write_count=43761, read_bytes=198268416, write_bytes=933855232, read_time=87870, write_time=35913990)
        rt_update_disk(data[1]);
        //vmem(total=508686336L, available=432787456L, percent=14.9, used=480034816L, free=28651520L, active=214945792, inactive=228995072, buffers=43900928L, cached=360235008)
        rt_update_mem(data[2]);

        rt_update_users(data[3]);
        rt_update_procs(data[4]);
        setTimeout(function(){fetchData();},5000);

    });   

}

function showTooltip(x, y, contents) {
    $('<div id="tooltip">' + contents + '</div>').css( {
        position: 'absolute',
        display: 'none',
        top: y + 5,
        left: x + 5,
        border: '1px solid #fdd',
        padding: '2px',
        'background-color': '#fee',
        opacity: 0.80
    }).appendTo("body").fadeIn(200);
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

    fetchData();

    var net_previousPoint = null;
    $("#net_io").bind("plothover", function (event, pos, item) {
        //$("#x").text(pos.x.toFixed(2));
        //$("#y").text(pos.y.toFixed(2));

        if (item) {
            if (net_previousPoint != item.datapoint) {
                net_previousPoint = item.datapoint;
                
                $("#tooltip").remove();
                var x = item.datapoint[0].toFixed(2),
                    y = item.datapoint[1].toFixed(2);
                
                showTooltip(item.pageX, item.pageY,
                            item.series.label + " " + y + "KB");
            }
        }
        else {
            $("#tooltip").remove();
            clicksYet = false;
            net_previousPoint = null;            
        }
    });
    var disk_previousPoint = null;
    $("#disk_io").bind("plothover", function (event, pos, item) {

        if (item) {
            if (disk_previousPoint != item.datapoint) {
                disk_previousPoint = item.datapoint;
                
                $("#tooltip").remove();
                var x = item.datapoint[0].toFixed(2),
                    y = item.datapoint[1].toFixed(2);
                
                showTooltip(item.pageX, item.pageY,
                            item.series.label + " " + y + "KB");
            }
        }
        else {
            $("#tooltip").remove();
            clicksYet = false;
            disk_previousPoint = null;            
        }
    });

}); //EOF page init
