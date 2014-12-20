/*
darw network graphics
*/

$(document).ready(function(){

    function draw_mp(tag_id, rrd_file, if_name) {

        var gtype_format=
            {'total':{title: if_name + ' total', label:'total', color: "#ff0000", checked: true
            } ,
            'used':{title: if_name + ' used', label:'used', color: "#0080ff", checked: true, lines: { 
                show: true, fill: true, fillColor:{
                    colors:[{opacity:0.2},{opacity:0.9}]}
            }},
            'free':{title: if_name + ' free', label:'free', color: "#00ff00", checked: true 
            }};

        var graph_options = {tooltipOpts: { content: function(label, xval, yval){
            var diff = new Date();
            var dataX = new Date((xval + (diff.getTimezoneOffset() * 60 * 1000)));
            if(yval > (1024*1024*1024*1024)){
                var dataY = yval/1024/1024/1024/1024 ;
                return "<strong>%s</strong> " + dataY.toFixed(2) + " TB<br>" + dataX.toLocaleString(); 
            }else if(yval > (1024*1024/1024)){
                var dataY = yval/1024/1024/1024 ;
                return "<strong>%s</strong> " + dataY.toFixed(2) + " GB<br>" + dataX.toLocaleString(); 
            }else if(yval > (1024*1024)){
                var dataY = yval/1024/1024 ;
                return "<strong>%s</strong> " + dataY.toFixed(2) + " MB<br>" + dataX.toLocaleString(); 
            }else if(yval > 1024){
                var dataY = yval/1024 ;
                return "<strong>%s</strong> " + dataY.toFixed(2) + " KB<br>" + dataX.toLocaleString(); 
            }else{
                return "<strong>%s</strong> %y.2 Bytes<br>" + dataX.toLocaleString(); 
            }
        }
        }};

        var ds_op_list=['total','used','free'];
        var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format,null,ds_op_list,null);

        //var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format );
    }

    function draw_mp_percent(tag_id, rrd_file, if_name) {

        var gtype_format=
            {'percent':{title: if_name + ' Usage(%)', label:'usage', color: "#0080ff", checked: true,lines: { 
                show: true, fill: true, fillColor:{
                    colors:[{opacity:0.5},{opacity:0.1}]}
            }}
            };

        var graph_options = {tooltipOpts: { content: function(label, xval, yval){
            var diff = new Date();
            var dataX = new Date((xval + (diff.getTimezoneOffset() * 60 * 1000)));
            return "<strong>%s</strong> %y.2 <br>" + dataX.toLocaleString(); 
        }
        }};

        var ds_op_list=['percent'];
        var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format,null,ds_op_list,null);

        //var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format );
    }
    function draw_hdd(tag_id, rrd_file, if_name) {

        var gtype_format=
            {'rbytes':{title: if_name + ' read', label:'read', color: "#00ff00", checked: true,lines: { 
                show: true, fill: true, fillColor:{
                    colors:[{opacity:0.5},{opacity:0.1}]}
            }} ,
            'wbytes':{title: if_name + ' write', label:'write', color: "#0080ff", checked: true, lines: { 
                show: true, fill: true, fillColor:{
                    colors:[{opacity:0.2},{opacity:0.9}]}
            }}
            };

        var graph_options = {tooltipOpts: { content: function(label, xval, yval){
            var diff = new Date();
            var dataX = new Date((xval + (diff.getTimezoneOffset() * 60 * 1000)));
            if(yval > (1024*1024*1024)){
                var dataY = yval/1024/1024/1024 ;
                return "<strong>%s</strong> " + dataY.toFixed(2) + " GB<br>" + dataX.toLocaleString(); 
            }else if(yval > (1024*1024)){
                var dataY = yval/1024/1024 ;
                return "<strong>%s</strong> " + dataY.toFixed(2) + " MB<br>" + dataX.toLocaleString(); 
            }else if(yval > 1024){
                var dataY = yval/1024 ;
                return "<strong>%s</strong> " + dataY.toFixed(2) + " KB<br>" + dataX.toLocaleString(); 
            }else{
                return "<strong>%s</strong> %y.2 Bytes<br>" + dataX.toLocaleString(); 
            }
        }
        }};

        var ds_op_list=['rbytes','wbytes'];
        var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format,null,ds_op_list,null);
        //var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format );
    }

    function createHDDGraph(rrd_files){
        rrd_files = rrd_files.sort();
        //alert("len = " + rrd_files.length + ", data = " + rrd_files );
        for( i = 0; i < rrd_files.length; i++ ){
            var if_name = rrd_files[i];
            if_name = if_name.replace("hdd-","");
            if_name = if_name.replace(".rrd", "");
            //alert("data = " + rrd_files[i] + ", if = " + if_name);
            $('#hdd').append("<h1>" + if_name + "</h1><div id=graph" + if_name + "></div>" );
            draw_hdd("graph" + if_name ,"data/" + rrd_files[i], if_name);
        }
    }

    function createMPGraph(rrd_files){
        rrd_files = rrd_files.sort();
        //alert("len = " + rrd_files.length + ", data = " + rrd_files );
        for( i = 0; i < rrd_files.length; i++ ){
            var if_name = rrd_files[i];
            if_name = if_name.replace("mount-","");
            if_name = if_name.replace(".rrd", "");
            //alert("data = " + rrd_files[i] + ", if = " + if_name);
            $('#mount_point').append("<h1>" + if_name + "</h1><div id=graph" + if_name + "></div><h1>" + if_name +" Usage %</h1><div id=graph_percent" + if_name +"></div>" );
            draw_mp("graph" + if_name ,"data/" + rrd_files[i], if_name);
            draw_mp_percent("graph_percent" + if_name ,"data/" + rrd_files[i], if_name);
        }
    }

    $.getJSON("hddrrd", function(data){
        $.each(data, function(index, value){
            //alert("index: " + index + " , value: "+ value);
            createHDDGraph(value);
        });
    });

    $.getJSON("mountrrd", function(data){
        $.each(data, function(index, value){
            //alert("index: " + index + " , value: "+ value);
            createMPGraph(value);
        });
    });
}); //EOF ready 

