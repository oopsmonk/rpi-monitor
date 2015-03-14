/*
darw storage graphics
*/

$(document).ready(function(){

    function draw_mp(tag_id, rrd_file, mp_name, start_time, end_time, g_height, g_width, s_height, s_width) {
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
            {'total':{title: mp_name + ' total', label:'total', color: "#ff0000", checked: true
            } ,
            'used':{title: mp_name + ' used', label:'used', color: "#0080ff", checked: true, lines: { 
                show: true, fill: true, fillColor:{
                    colors:[{opacity:0.2},{opacity:0.9}]}
            }},
            'free':{title: mp_name + ' free', label:'free', color: "#00ff00", checked: true 
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
        //var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format,null,ds_op_list,null);

        var rrdflot_opts={use_windows: true, window_min: start_time, window_max: end_time,
                    use_rra:true, rra: rra_id,
                    graph_height: g_height, graph_width: g_width,
                    scale_height: s_height, scale_width: s_width}

        var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format, rrdflot_opts, ds_op_list);
    }

    function draw_mp_percent(tag_id, rrd_file, mp_name, start_time, end_time, g_height, g_width, s_height, s_width) {
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
            {'percent':{title: mp_name + ' Usage(%)', label:'usage', color: "#0080ff", checked: true,lines: { 
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
        //var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format,null,ds_op_list,null);

        var rrdflot_opts={use_windows: true, window_min: start_time, window_max: end_time,
                    use_rra:true, rra: rra_id,
                    graph_height: g_height, graph_width: g_width,
                    scale_height: s_height, scale_width: s_width}

        var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format, rrdflot_opts, ds_op_list);
    }

    function draw_hdd(tag_id, rrd_file, hdd_name, start_time, end_time, g_height, g_width, s_height, s_width) {
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
            {'rbytes':{title: hdd_name + ' read', label:'read', color: "#00ff00", checked: true,lines: { 
                show: true, fill: true, fillColor:{
                    colors:[{opacity:0.5},{opacity:0.1}]}
            }} ,
            'wbytes':{title: hdd_name + ' write', label:'write', color: "#0080ff", checked: true, lines: { 
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
        //var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format,null,ds_op_list,null);

        var rrdflot_opts={use_windows: true, window_min: start_time, window_max: end_time,
                    use_rra:true, rra: rra_id,
                    graph_height: g_height, graph_width: g_width,
                    scale_height: s_height, scale_width: s_width}

        var f=new rrdFlotAsync(tag_id ,rrd_file ,null,graph_options,gtype_format, rrdflot_opts, ds_op_list);
    }

    function createHDDGraph(rrd_files){
        rrd_files = rrd_files.sort();
        //alert("len = " + rrd_files.length + ", data = " + rrd_files );
        for( i = 0; i < rrd_files.length; i++ ){
            var hdd_name = rrd_files[i];
            hdd_name = hdd_name.replace("hdd-","");
            hdd_name = hdd_name.replace(".rrd", "");

            graph_template('#hdd_container', "hdd_" + hdd_name, hdd_name, "datePicker_hdd_" + hdd_name, "hdd_graph_" + hdd_name);
            draw_hdd("hdd_graph_" + hdd_name ,"data/" + rrd_files[i], hdd_name);
            date_picker('#datePicker_hdd_' + hdd_name);
            $('#datePicker_hdd_' + hdd_name).on('apply.daterangepicker', function(ev, picker) { 
                var hdd_name = this.id.replace('datePicker_hdd_','');
                draw_hdd("hdd_graph_" + hdd_name, "data/hdd-" + hdd_name +".rrd", hdd_name, picker.startDate.valueOf(), picker.endDate.valueOf());
            });

        }
    }

    function createMPGraph(rrd_files){
        rrd_files = rrd_files.sort();
        //alert("len = " + rrd_files.length + ", data = " + rrd_files );
        for( i = 0; i < rrd_files.length; i++ ){
            var mp_name = rrd_files[i];
            mp_name = mp_name.replace("mount-","");
            mp_name = mp_name.replace(".rrd", "");
            //alert("data = " + rrd_files[i] + ", if = " + mp_name);
            graph_template('#hdd_container', "mp_" + mp_name, mp_name, "datePicker_mp_" + mp_name, "mp_graph_" + mp_name);
            graph_template('#hdd_container', "percent_" + mp_name, mp_name + " Usage(%)", "datePicker_percent_" + mp_name, "percent_graph_" + mp_name);
            draw_mp("mp_graph_" + mp_name ,"data/" + rrd_files[i], mp_name);
            draw_mp_percent("percent_graph_" + mp_name ,"data/" + rrd_files[i], mp_name);
            date_picker('#datePicker_mp_' + mp_name);
            date_picker('#datePicker_percent_' + mp_name);
            $('#datePicker_mp_' + mp_name).on('apply.daterangepicker', function(ev, picker) { 
                var mp_name = this.id.replace('datePicker_mp_','');
                draw_mp("mp_graph_" + mp_name, "data/mount-" + mp_name +".rrd", mp_name, picker.startDate.valueOf(), picker.endDate.valueOf());
            });
            $('#datePicker_percent_' + mp_name).on('apply.daterangepicker', function(ev, picker) { 
                var mp_name = this.id.replace('datePicker_percent_','');
                draw_mp_percent("percent_graph_" + mp_name, "data/mount-" + mp_name +".rrd", mp_name, picker.startDate.valueOf(), picker.endDate.valueOf());
            });
        }
    }

    $.getJSON("hddrrd", function(data){
        createHDDGraph(data["rrdfile"]);
    });

    $.getJSON("mountrrd", function(data){
        createMPGraph(data["rrdfile"]);
    });
}); //EOF ready 

