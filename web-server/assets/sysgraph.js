/*
darw system graphics
*/

$(document).ready(function(){

    function cpu_date(){
        
        var cb = function(start, end, label) {
            console.log(start.toISOString(), end.toISOString(), label);
            $('#CPUDateRange span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
            //alert("Callback has fired: [" + start.format('MMMM D, YYYY') + " to " + end.format('MMMM D, YYYY') + ", label = " + label + "]");
        }

        var optionSet1 = {
        startDate: moment().subtract(29, 'days'),
        endDate: moment(),
        minDate: '01/01/2012',
        maxDate: '12/31/2014',
        dateLimit: { days: 60 },
        showDropdowns: true,
        showWeekNumbers: true,
        timePicker: false,
        timePickerIncrement: 1,
        timePicker12Hour: true,
        ranges: {
           'Today': [moment(), moment()],
           'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
           'Last 7 Days': [moment().subtract(6, 'days'), moment()],
           'Last 30 Days': [moment().subtract(29, 'days'), moment()],
           'This Month': [moment().startOf('month'), moment().endOf('month')],
           'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
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

        $('#CPUDateRange span').html(moment().subtract(29, 'days').format('MMMM D, YYYY') + ' - ' + moment().format('MMMM D, YYYY'));

        $('#CPUDateRange').daterangepicker(optionSet1, cb);

        $('#CPUDateRange').on('show.daterangepicker', function() { console.log("show event fired"); });
        $('#CPUDateRange').on('hide.daterangepicker', function() { console.log("hide event fired"); });
        $('#CPUDateRange').on('apply.daterangepicker', function(ev, picker) { 
        console.log("apply event fired, start/end dates are " 
          + picker.startDate.format('MMMM D, YYYY') 
          + " to " 
          + picker.endDate.format('MMMM D, YYYY')
        ); 
        });
        $('#CPUDateRange').on('cancel.daterangepicker', function(ev, picker) { console.log("cancel event fired"); });
    }

    function draw_cpu(tag_id, rrd_file) {

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
            var diff = new Date();
            var dataX = new Date((xval + (diff.getTimezoneOffset() * 60 * 1000)));
            return "<strong>%s</strong> %y.2<br>" + dataX.toLocaleString(); 
        }
        }};
        //var f=new rrdFlotAsync(tag_id ,rrd_file ,null,null,gtype_format);
        var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format );

        //var ops={use_checked_DSs: true, checked_DSs: ['cputemp','cpuUsage', 'pids'], use_rra:true, rra:2, use_windows: true, window_min:1388505600000, window_max: 1419868800000}

        //var f=new rrdFlotAsync(tag_id ,rrd_file ,null,null,gtype_format,ops,ds_op_list,null);
    }

    function draw_mem(tag_id, rrd_file) {

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
            var diff = new Date();
            var dataX = new Date((xval + (diff.getTimezoneOffset() * 60 * 1000)));
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
        //var graph_options = {tooltipOpts: { content: function(label, xval, yval){
        //var dataY = yval/1024/1024 ;
        //var dataX = new Date(xval);
        //return "<strong>%s</strong> Value:" + dataY.toFixed(2) + " MB<br>" + dataX.toLocaleString(); 
        //}
        //}};

        var ds_op_list=['total','used','free','buf', 'cached'];
        var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format,null,ds_op_list,null);

        //var f=new rrdFlotAsync(tag_id ,rrd_file ,null,null,gtype_format);
    }

    function draw_uptime(tag_id, rrd_file) {

        var gtype_format={'uptime':{ title: 'System Uptime (minutes)', label:'Uptime',color: "#808000", checked:true}};

        var graph_options = {tooltipOpts: { content: function(label, xval, yval){
            var diff = new Date();
            var dataX = new Date((xval + (diff.getTimezoneOffset() * 60 * 1000)));
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
        var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format );

    }

    draw_cpu("graphCPU", "data/cpustatus.rrd");
    draw_mem("graphMem", "data/meminfo.rrd");
    draw_uptime("graphUptime", "data/uptime.rrd");

    cpu_date(); 
}); //EOF ready 

