
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


/*
 *<div id="cpu_info">
 *    <div class="row">
 *        <div class="col-md-5">
 *            <h1>CPU Information</h1>
 *        </div>
 *        <div class="col-md-7">
 *            <div id="CPUDateRange" class="pull-left date-picker-range" >
 *              <i class="glyphicon glyphicon-calendar fa fa-calendar"></i>
 *              <span></span> <b class="caret"></b>
 *            </div>
 *        </div>
 *    </div>
 *    <div class="row">
 *        <div class="col-md-12">
 *            <div id="graphCPU"></div>
 *        </div>
 *    </div>
 *</div>
 */

function graph_template(parent_id, item_id, title, datePicker_id, graph_id){
   $(parent_id).append(
            "<div id=" + item_id + ">" +
            "<div class=\"row\">" +
            "<div class=\"col-md-5\">" +
            "<h1>" + title + "</h1>" +
            "</div>" +
            "<div class=\"col-md-7\">" +
            "<div id="+ datePicker_id + " class=\"pull-left date-picker-range\">" +
            "<i class=\"glyphicon glyphicon-calendar fa fa-calendar\"></i>" +
            "<span></span> <b class=\"caret\"></b>" +
            "</div></div></div><div class=\"row\"><div class=\"col-md-12\">" +
            "<div id=" + graph_id + "></div></div></div>"
           ); 
}

