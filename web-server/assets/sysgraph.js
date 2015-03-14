/*
darw system graphics
*/

$(document).ready(function(){

    function draw_cpu(tag_id, rrd_file, start_time, end_time, g_height, g_width, s_height, s_width) {

        start_time = typeof start_time !== 'undefined' ? start_time : moment().subtract(24, 'hour').valueOf();
        end_time = typeof end_time !== 'undefined' ? end_time : moment().valueOf();
        g_height = typeof g_height !== 'undefined' ? g_height : mHeight_def;
        g_width = typeof g_width !== 'undefined' ? g_width : mWidth_def;
        s_height = typeof s_height !== 'undefined' ? s_height : sHeight_def;
        s_width = typeof s_width !== 'undefined' ? s_width : sWidth_def;

        start_time = start_time - tzTimeMS();
        end_time = end_time - tzTimeMS();

        var time_diff = (moment().valueOf() - start_time) / 1000;
        var rra_id = getRRAID(time_diff);

        var gtype_format={'cputemp':{ title: 'Temperature', label:'Temp',color: "#ff8000", checked:true, lines:{
                show: true, fill: true, fillColor:{
                    //colors:['#fe0','#f50']}
                    colors:[{opacity:0.3},{opacity:1}]}
                }
            },
            'cpuUsage':{title: 'Usage', label:'Usage', color: "#0050ff", checked:true, lines:{
                show: true, fill: true, fillColor:{
                    colors:[{opacity:0.5},{opacity:0.9}]}
                }
            },
            'pids':{title: 'Processes', label:'Processes', color: "#c00000"}};

        var graph_options = {tooltipOpts: { content: function(label, xval, yval){
            var dataX = new Date((xval + tzTimeMS()));
            return "<strong>%s</strong> %y.2<br>" + dataX.toLocaleString(); 
        }
        }};
        
        var rrdflot_opts={use_windows: true, window_min: start_time, window_max: end_time,
                    use_rra:true, rra: rra_id,
                    graph_height: g_height, graph_width: g_width,
                    scale_height: s_height, scale_width: s_width}

        //var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format );
        var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format, rrdflot_opts);

    }

    function draw_mem(tag_id, rrd_file, start_time, end_time, g_height, g_width, s_height, s_width) {
        start_time = typeof start_time !== 'undefined' ? start_time : moment().subtract(24, 'hour').valueOf();
        end_time = typeof end_time !== 'undefined' ? end_time : moment().valueOf();
        g_height = typeof g_height !== 'undefined' ? g_height : mHeight_def;
        g_width = typeof g_width !== 'undefined' ? g_width : mWidth_def;
        s_height = typeof s_height !== 'undefined' ? s_height : sHeight_def;
        s_width = typeof s_width !== 'undefined' ? s_width : sWidth_def;

        start_time = start_time - tzTimeMS();
        end_time = end_time - tzTimeMS();

        var time_diff = (moment().valueOf() - start_time) / 1000;
        var rra_id = getRRAID(time_diff);

        var gtype_format=
        {'total':{title: 'Total Memory', label:'Total', color: "#0000ff", checked: true},
            'used':{ title: 'Used Memory', label:'Used',color: "#00f800", checked:true, lines:{ 
                show: true, fill: true, fillColor:{
                    colors:[{opacity:0.3},{opacity:0.9}]}
                }
            },
            'buf':{title: 'Buffered Memory', label:'Buffered', color: "#ff0000", lines:{
                show: true, fill: true, fillColor:{
                    colors:[{opacity:0.3},{opacity:0.9}]}
                }
            },
            'cached':{title: 'Cached Memory', label:'Cached', color: "#c0ff00", lines:{
                show: true, fill: true, fillColor:{
                    colors:[{opacity:0.3},{opacity:0.9}]}
                }
            },
            'free':{title: 'Free Memory', label:'Free', color: "#c0c000"}};

        var graph_options = {tooltipOpts: { content: function(label, xval, yval){
            var dataX = new Date((xval + tzTimeMS()));
            if(yval > (1024*1024*1024)){
                var dataY = yval/1024/1024/1024;
                return "<strong>%s</strong> " + dataY.toFixed(2) + " GB<br>" + dataX.toLocaleString(); 
            }else if(yval > (1024*1024)){
                var dataY = yval/1024/1024;
                return "<strong>%s</strong> " + dataY.toFixed(2) + " MB<br>" + dataX.toLocaleString(); 
            }else{
                var dataY = yval/1024;
                return "<strong>%s</strong> " + dataY.toFixed(2) + " KB<br>" + dataX.toLocaleString(); 
            }
        }
        }};

        var ds_op_list=['total','used','free','buf', 'cached'];
        var rrdflot_opts={use_windows: true, window_min: start_time, window_max: end_time,
                    use_rra:true, rra: rra_id,
                    graph_height: g_height, graph_width: g_width,
                    scale_height: s_height, scale_width: s_width}
        var f=new rrdFlotAsync(tag_id, rrd_file, null, graph_options, gtype_format, rrdflot_opts, ds_op_list, null);

    }

    function draw_uptime(tag_id, rrd_file, start_time, end_time, g_height, g_width, s_height, s_width) {
        start_time = typeof start_time !== 'undefined' ? start_time : moment().subtract(24, 'hour').valueOf();
        end_time = typeof end_time !== 'undefined' ? end_time : moment().valueOf();
        g_height = typeof g_height !== 'undefined' ? g_height : mHeight_def;
        g_width = typeof g_width !== 'undefined' ? g_width : mWidth_def;
        s_height = typeof s_height !== 'undefined' ? s_height : sHeight_def;
        s_width = typeof s_width !== 'undefined' ? s_width : sWidth_def;

        start_time = start_time - tzTimeMS();
        end_time = end_time - tzTimeMS();

        var time_diff = (moment().valueOf() - start_time) / 1000;
        var rra_id = getRRAID(time_diff);

        var gtype_format={'uptime':{ title: 'System Uptime (minutes)', label:'Uptime',color: "#808000", checked:true}};

        var graph_options = {tooltipOpts: { content: function(label, xval, yval){
            var dataX = new Date((xval + tzTimeMS()));
            var days = Math.floor(yval/60/24);
            var hours = Math.floor(yval/60)%24;
            if(hours < 10){
                hours = "0" + hours;
            }
            var mins = Math.floor(yval%60);

            if(days){
                if(days > 1)
                    return "<strong>%s</strong> " + days + " days, " + hours + ":" + mins + "<br>" + dataX.toLocaleString();
                else
                    return "<strong>%s</strong> " + days + " day, " + hours + ":" + mins + "<br>" + dataX.toLocaleString();
            }else{
                return "<strong>%s</strong> " + hours + ":" + mins + "<br>" + dataX.toLocaleString();
            }
        }
        }};

        var rrdflot_opts={use_windows: true, window_min: start_time, window_max: end_time,
                    use_rra:true, rra: rra_id,
                    graph_height: g_height, graph_width: g_width,
                    scale_height: s_height, scale_width: s_width}

        var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format, rrdflot_opts);

    }

    function draw_cores(cores, tag_id, rrd_file, start_time, end_time, g_height, g_width, s_height, s_width) {

        start_time = typeof start_time !== 'undefined' ? start_time : moment().subtract(24, 'hour').valueOf();
        end_time = typeof end_time !== 'undefined' ? end_time : moment().valueOf();
        g_height = typeof g_height !== 'undefined' ? g_height : mHeight_def;
        g_width = typeof g_width !== 'undefined' ? g_width : mWidth_def;
        s_height = typeof s_height !== 'undefined' ? s_height : sHeight_def;
        s_width = typeof s_width !== 'undefined' ? s_width : sWidth_def;

        start_time = start_time - tzTimeMS();
        end_time = end_time - tzTimeMS();

        var time_diff = (moment().valueOf() - start_time) / 1000;
        var rra_id = getRRAID(time_diff);
        
        var core_colors = ["#00f800", "#0000ff", "#c0ff00", "#c0c000", "#ff0000"];
        var gtype_format = new Object();
        for(i = 0; i < cores; i++){
            gtype_format ['core_' + i] = {title: 'Core_'+i, lable:'Core_'+i, color:core_colors[i % core_colors.length], checked: true}; 
        }

        var graph_options = {tooltipOpts: { content: function(label, xval, yval){
            var dataX = new Date((xval + tzTimeMS()));
            return "<strong>%s</strong> %y.2<br>" + dataX.toLocaleString(); 
        }
        }};
        
        var rrdflot_opts={use_windows: true, window_min: start_time, window_max: end_time,
                    use_rra:true, rra: rra_id,
                    graph_height: g_height, graph_width: g_width,
                    scale_height: s_height, scale_width: s_width}

        //var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format );
        var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format, rrdflot_opts);

    }

    function createCoresGraph(core_num){

        if(!core_num){
            return ;
        }

        graph_template('#cores_info', "cpu_cores", "CPU Cores Loading", "datePicker_cores", "cores_graph");
        draw_cores(core_num, "cores_graph","data/cpucores.rrd");
        date_picker('#datePicker_cores');
        $('#datePicker_cores').on('apply.daterangepicker', function(ev, picker) { 
            draw_cores(core_num, "cores_graph", "data/cpucores.rrd", picker.startDate.valueOf(), picker.endDate.valueOf());
        });

    }

    draw_cpu("graphCPU", "data/cpustatus.rrd");
    date_picker('#CPUDateRange');
    $('#CPUDateRange').on('apply.daterangepicker', function(ev, picker) { 
        draw_cpu("graphCPU", "data/cpustatus.rrd", picker.startDate.valueOf(), picker.endDate.valueOf());
        //console.log("apply event fired, start/end dates are " 
          //+ picker.startDate.format() 
          //+ " to " 
          //+ picker.endDate.format() 
        //); 
    });

    $.getJSON("cpucores", function(data){
        createCoresGraph(data["core_num"]);
    });

    draw_mem("graphMem", "data/meminfo.rrd");
    date_picker('#MEMDateRange');
    $('#MEMDateRange').on('apply.daterangepicker', function(ev, picker) { 
        draw_mem("graphMem", "data/meminfo.rrd", picker.startDate.valueOf(), picker.endDate.valueOf());
    });

    draw_uptime("graphUptime", "data/uptime.rrd");
    date_picker('#UpTimeDateRange');
    $('#UpTimeDateRange').on('apply.daterangepicker', function(ev, picker) { 
        draw_uptime("graphUptime", "data/uptime.rrd", picker.startDate.valueOf(), picker.endDate.valueOf());
    });

}); //EOF ready 

