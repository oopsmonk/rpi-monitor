/*
darw system graphics
*/

$(document).ready(function(){

    var mHeight_def = "300px";
    var mWidth_def = "500px";
    var sHeight_def = "110px";
    var sWidth_def = "250px";

    function tzTimeMS(){
        var tz = new Date();
        return (tz.getTimezoneOffset() * 60 * 1000);
    }

    function getRRAID(time_diff){
        if(time_diff < (3 * 24 * 60 * 60)){ //3 days
            return 0;
        }else if(time_diff < (14 * 24 * 60 * 60)){ // 14 days
            return 1;
        }else if(time_diff < (62 * 24 * 60 * 60)){ // 2 month
            return 2;
        }else{ // 1 year
            return 3;
        }
    }

    function date_picker(picker_id){
        
        var cb = function(start, end, label) {
            console.log(start.toISOString(), end.toISOString(), label);
            $(picker_id + ' span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
            //alert("Callback has fired: [" + start.format('MMMM D, YYYY') + " to " + end.format('MMMM D, YYYY') + ", label = " + label + "]");
        }

        var optionSet1 = {
        startDate: moment().subtract(24, 'hour'),
        endDate: moment(),
        minDate: moment().subtract(12, 'month'),
        maxDate: moment(),
        dateLimit: { years: 1 },
        showDropdowns: true,
        showWeekNumbers: true,
        timePicker: true,
        timePickerIncrement: 5,
        timePicker12Hour: false,
        ranges: {
           '24 Hours': [moment().subtract(24, 'hour'), moment()],
           '3 Days': [moment().subtract(3, 'day'), moment()],
           '14 Days': [moment().subtract(14, 'day'), moment()],
           '1 Month': [moment().subtract(1, 'month'), moment()],
           '2 Month': [moment().subtract(2, 'month'), moment()],
           '6 Month': [moment().subtract(6, 'month'), moment()],
           'This Year': [moment().startOf('year'), moment()]
        },
        opens: 'left',
        buttonClasses: ['btn btn-default'],
        applyClass: 'btn-small btn-primary',
        cancelClass: 'btn-small',
        format: 'MM/DD/YYYY',
        separator: ' to ',
        locale: {
            applyLabel: 'Submit',
            cancelLabel: 'Clear',
            fromLabel: 'From',
            toLabel: 'To',
            customRangeLabel: 'Custom',
            daysOfWeek: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr','Sa'],
            monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            firstDay: 1
        }
        };

        $(picker_id + ' span').html(moment().subtract(24, 'hour').format('MMMM D, YYYY') + ' - ' + moment().format('MMMM D, YYYY'));

        $(picker_id).daterangepicker(optionSet1, cb);

        //$(picker_id).on('show.daterangepicker', function() { console.log("show event fired"); });
        //$(picker_id).on('hide.daterangepicker', function() { console.log("hide event fired"); });
        //$(picker_id).on('cancel.daterangepicker', function(ev, picker) { console.log("cancel event fired"); });
    }

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

