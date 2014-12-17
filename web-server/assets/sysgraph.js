/*
darw system graphics
*/

$(document).ready(function(){

    function draw_cpu(tag_id, rrd_file) {

        var gtype_format={'cputemp':{ title: 'Temperature', label:'Temp',color: "#ff9500", checked:true, lines:{
                show: true, fill: true, fillColor:{
                    colors:['#fe0','#f50']}
                }
            },
            'cpuUsage':{title: 'Usage', label:'Usage', color: "#0000ff", checked:true, lines:{
                show: true, fill: true, fillColor:{
                    colors:[{opacity:0.3},{opacity:0.7}]}
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

}); //EOF ready 

