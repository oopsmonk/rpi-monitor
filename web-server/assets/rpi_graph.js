function draw_cpu() {
    //document.write('<div id="graphCPU"></div>');

    fname="data/cpustatus.rrd";

    var gtype_format={'cputemp':{ title: 'Temperature', label:'Temp',color: "#00f800", checked:true},
        'cpuUsage':{title: 'Usage', label:'Usage', color: "#c00000", checked:true },
        'pids':{title: 'Processes', label:'Processes', color: "#000000"}};

    var graph_options = {tooltipOpts: { content: function(label, xval, yval){
            var diff = new Date();
            var dataX = new Date((xval + (diff.getTimezoneOffset() * 60 * 1000)));
            return "<strong>%s</strong> %y.2<br>" + dataX.toLocaleString(); 
            }
        }};
    //var f=new rrdFlotAsync("graphCPU",fname,null,null,gtype_format);
    var f=new rrdFlotAsync("graphCPU",fname,null,graph_options,gtype_format );

    //var ops={use_checked_DSs: true, checked_DSs: ['cputemp','cpuUsage', 'pids'], use_rra:true, rra:2, use_windows: true, window_min:1388505600000, window_max: 1419868800000}

    //var f=new rrdFlotAsync("graphCPU",fname,null,null,gtype_format,ops,ds_op_list,null);
}

function draw_mem() {
    //document.write('<div id="mygraph2"></div>');

    fname="data/meminfo.rrd";

    var gtype_format=
        {'total':{title: 'Total Memory', label:'Total', color: "#0000ff", checked: true},
        'used':{ title: 'Used Memory', label:'Used',color: "#00f800", checked:true},
        'buf':{title: 'Buffered Memory', label:'Buffered', color: "#ff0000"},
        'cached':{title: 'Cached Memory', label:'Cached', color: "#c0ff00"},
        'free':{title: 'Free Memory', label:'Free', color: "#c00000"}};
    
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
    var f=new rrdFlotAsync("graphMem",fname,null,graph_options,gtype_format,null,ds_op_list,null);

    //var f=new rrdFlotAsync("graphMem",fname,null,null,gtype_format);
}

function draw_uptime() {

    fname="data/uptime.rrd";

    var gtype_format={'uptime':{ title: 'System Uptime (minutes)', label:'Uptime',color: "#00f800", checked:true}};

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
    var f=new rrdFlotAsync("graphUptime",fname,null,graph_options,gtype_format );

}

function draw_eth0() {

    fname="data/interface-eth0.rrd";

    var gtype_format=
        {'recv':{title: 'eth0 recv', label:'recv', color: "#00ff00", checked: true},
        'send':{title: 'eth0 send', label:'send', color: "#0000ff", checked: true}};
    
    var graph_options = {tooltipOpts: { content: function(label, xval, yval){
            var dataY = yval/1024 ;
            var diff = new Date();
            var dataX = new Date((xval + (diff.getTimezoneOffset() * 60 * 1000)));
            return "<strong>%s</strong> " + dataY.toFixed(2) + " KB<br>" + dataX.toLocaleString(); 
            }
        }};

    //var ds_op_list=['total','used','free','buf', 'cached'];
    //var f=new rrdFlotAsync("graphEth0",fname,null,graph_options,gtype_format,null,ds_op_list,null);

    //var f=new rrdFlotAsync("graphEth0",fname,null,null,gtype_format);
    var f=new rrdFlotAsync("graphEth0",fname,null,graph_options,gtype_format );
}

function draw_eth1() {

    fname="data/interface-eth1.rrd";

    var gtype_format=
        {'recv':{title: 'eth1 recv', label:'recv', color: "#0000ff", checked: true},
        'send':{title: 'eth1 send', label:'send', color: "#00ff00", checked: true}};
    
    var graph_options = {tooltipOpts: { content: function(label, xval, yval){
            var dataY = yval/1024 ;
            var diff = new Date();
            var dataX = new Date((xval + (diff.getTimezoneOffset() * 60 * 1000)));
            return "<strong>%s</strong> " + dataY.toFixed(2) + " KB<br>" + dataX.toLocaleString(); 
            }
        }};

    //var ds_op_list=['total','used','free','buf', 'cached'];
    //var f=new rrdFlotAsync("graphEth0",fname,null,graph_options,gtype_format,null,ds_op_list,null);

    var f=new rrdFlotAsync("graphEth1",fname,null,graph_options,gtype_format );
}
