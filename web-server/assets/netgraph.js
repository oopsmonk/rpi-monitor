/*
darw network graphics
*/

$(document).ready(function(){

    function draw_eth(tag_id, rrd_file, if_name) {

        var gtype_format=
            {'recv':{title: if_name + ' recv', label:'recv', color: "#00ff00", checked: true,lines: { 
                show: true, fill: true, fillColor:{
                    colors:[{opacity:0.5},{opacity:0.1}]}
            }} ,
            'send':{title: if_name + ' send', label:'send', color: "#0080ff", checked: true, lines: { 
                show: true, fill: true, fillColor:{
                    colors:[{opacity:0.2},{opacity:0.9}]}
            }}
            };

        var graph_options = {tooltipOpts: { content: function(label, xval, yval){
            var diff = new Date();
            var dataX = new Date((xval + (diff.getTimezoneOffset() * 60 * 1000)));
            if(yval < 1024){
                return "<strong>%s</strong> %y.2 Bytes<br>" + dataX.toLocaleString(); 
            }else{
                var dataY = yval/1024 ;
                return "<strong>%s</strong> " + dataY.toFixed(2) + " KB<br>" + dataX.toLocaleString(); 
            }
        }
        }};

        //var ds_op_list=['total','used','free','buf', 'cached'];
        //var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format,null,ds_op_list,null);

        var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format );
    }

    function createNetGraph(rrd_files){
        rrd_files = rrd_files.sort();
        //alert("len = " + rrd_files.length + ", data = " + rrd_files );
        for( i = 0; i < rrd_files.length; i++ ){
            var if_name = rrd_files[i];
            if_name = if_name.replace("interface-","");
            if_name = if_name.replace(".rrd", "");
            //alert("data = " + rrd_files[i] + ", if = " + if_name);
            $('#id_container').append("<h1>" + if_name + "</h1><div id=graph" + if_name + "></div>" );
            draw_eth("graph" + if_name ,"data/" + rrd_files[i], if_name);
        }
    }

    $.getJSON("netrrd", function(data){
        $.each(data, function(index, value){
            //alert("index: " + index + " , value: "+ value);
            createNetGraph(value);
        });
    });

}); //EOF ready 

