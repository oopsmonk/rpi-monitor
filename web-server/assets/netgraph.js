/*
darw network graphics
*/

$(document).ready(function(){

    function draw_eth(tag_id, rrd_file, if_name, start_time, end_time, g_height, g_width, s_height, s_width) {

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

        //var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format );
        var rrdflot_opts={use_windows: true, window_min: start_time, window_max: end_time,
                    use_rra:true, rra: rra_id,
                    graph_height: g_height, graph_width: g_width,
                    scale_height: s_height, scale_width: s_width}

        //var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format );
        var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format, rrdflot_opts);
    }

    function createNetGraph(rrd_files){
        rrd_files = rrd_files.sort();
        //alert("len = " + rrd_files.length + ", data = " + rrd_files );
        for( i = 0; i < rrd_files.length; i++ ){
            var if_name = rrd_files[i];
            if_name = if_name.replace("interface-","");
            if_name = if_name.replace(".rrd", "");
            //alert("data = " + rrd_files[i] + ", if = " + if_name);
            graph_template('#net_container', if_name + "_info", if_name, "datePicker_" + if_name, "graph" + if_name);
            draw_eth("graph" + if_name ,"data/" + rrd_files[i], if_name);
            date_picker('#datePicker_' + if_name);
            $('#datePicker_' + if_name).on('apply.daterangepicker', function(ev, picker) { 
                var if_name = this.id.replace('datePicker_','');
                draw_eth("graph" + if_name, "data/interface-" + if_name +".rrd", if_name, picker.startDate.valueOf(), picker.endDate.valueOf());
            });
        
        }
    }
    

    $.getJSON("netrrd", function(data){
        $.each(data, function(index, value){
            //alert("index: " + index + " , value: "+ value);
            createNetGraph(value);
        });
    });

}); //EOF ready 

