
/*
 * BinaryFile over XMLHttpRequest
 * Part of the javascriptRRD package
 * Copyright (c) 2009 Frank Wuerthwein, fkw@ucsd.edu
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 *
 * Original repository: http://javascriptrrd.sourceforge.net/
 *
 * Based on:
 *   Binary Ajax 0.1.5
 *   Copyright (c) 2008 Jacob Seidelin, cupboy@gmail.com, http://blog.nihilogic.dk/
 *   MIT License [http://www.opensource.org/licenses/mit-license.php]
 */

// ============================================================
// Exception class
function InvalidBinaryFile(msg) {
  this.message=msg;
  this.name="Invalid BinaryFile";
}

// pretty print
InvalidBinaryFile.prototype.toString = function() {
  return this.name + ': "' + this.message + '"';
}

// =====================================================================
// BinaryFile class
//   Allows access to element inside a binary stream
function BinaryFile(strData, iDataOffset, iDataLength) {
	var data = strData;
	var dataOffset = iDataOffset || 0;
	var dataLength = 0;
	// added 
	var doubleMantExpHi=Math.pow(2,-28);
	var doubleMantExpLo=Math.pow(2,-52);
	var doubleMantExpFast=Math.pow(2,-20);

	var switch_endian = false;

	this.getRawData = function() {
		return data;
	}

	if (typeof strData == "string") {
		dataLength = iDataLength || data.length;

		this.getByteAt = function(iOffset) {
			return data.charCodeAt(iOffset + dataOffset) & 0xFF;
		}
	} else if (typeof strData == "unknown") {
		dataLength = iDataLength || IEBinary_getLength(data);

		this.getByteAt = function(iOffset) {
			return IEBinary_getByteAt(data, iOffset + dataOffset);
		}
	} else {
	  throw new InvalidBinaryFile("Unsupported type " + (typeof strData));
	}

	this.getEndianByteAt = function(iOffset,width,delta) {
	  if (this.switch_endian) 
	    return this.getByteAt(iOffset+width-delta-1);
	  else
	    return this.getByteAt(iOffset+delta);
	}

	this.getLength = function() {
		return dataLength;
	}

	this.getSByteAt = function(iOffset) {
		var iByte = this.getByteAt(iOffset);
		if (iByte > 127)
			return iByte - 256;
		else
			return iByte;
	}

	this.getShortAt = function(iOffset) {
	        var iShort = (this.getEndianByteAt(iOffset,2,1) << 8) + this.getEndianByteAt(iOffset,2,0)
		if (iShort < 0) iShort += 65536;
		return iShort;
	}
	this.getSShortAt = function(iOffset) {
		var iUShort = this.getShortAt(iOffset);
		if (iUShort > 32767)
			return iUShort - 65536;
		else
			return iUShort;
	}
	this.getLongAt = function(iOffset) {
	        var iByte1 = this.getEndianByteAt(iOffset,4,0),
	             iByte2 = this.getEndianByteAt(iOffset,4,1),
	             iByte3 = this.getEndianByteAt(iOffset,4,2),
	             iByte4 = this.getEndianByteAt(iOffset,4,3);

		var iLong = (((((iByte4 << 8) + iByte3) << 8) + iByte2) << 8) + iByte1;
		if (iLong < 0) iLong += 4294967296;
		return iLong;
	}
	this.getSLongAt = function(iOffset) {
		var iULong = this.getLongAt(iOffset);
		if (iULong > 2147483647)
			return iULong - 4294967296;
		else
			return iULong;
	}
	this.getStringAt = function(iOffset, iLength) {
		var aStr = [];
		for (var i=iOffset,j=0;i<iOffset+iLength;i++,j++) {
			aStr[j] = String.fromCharCode(this.getByteAt(i));
		}
		return aStr.join("");
	}

	// Added
	this.getCStringAt = function(iOffset, iMaxLength) {
		var aStr = [];
		for (var i=iOffset,j=0;(i<iOffset+iMaxLength) && (this.getByteAt(i)>0);i++,j++) {
			aStr[j] = String.fromCharCode(this.getByteAt(i));
		}
		return aStr.join("");
	}

	// Added
	this.getDoubleAt = function(iOffset) {
	        var iByte1 = this.getEndianByteAt(iOffset,8,0),
	             iByte2 = this.getEndianByteAt(iOffset,8,1),
	             iByte3 = this.getEndianByteAt(iOffset,8,2),
	             iByte4 = this.getEndianByteAt(iOffset,8,3),
	             iByte5 = this.getEndianByteAt(iOffset,8,4),
	             iByte6 = this.getEndianByteAt(iOffset,8,5),
	             iByte7 = this.getEndianByteAt(iOffset,8,6),
	             iByte8 = this.getEndianByteAt(iOffset,8,7);
		var iSign=iByte8 >> 7;
		var iExpRaw=((iByte8 & 0x7F)<< 4) + (iByte7 >> 4);
		var iMantHi=((((((iByte7 & 0x0F) << 8) + iByte6) << 8) + iByte5) << 8) + iByte4;
		var iMantLo=((((iByte3) << 8) + iByte2) << 8) + iByte1;

		if (iExpRaw==0) return 0.0;
		if (iExpRaw==0x7ff) return undefined;

		var iExp=(iExpRaw & 0x7FF)-1023;

		var dDouble = ((iSign==1)?-1:1)*Math.pow(2,iExp)*(1.0 + iMantLo*doubleMantExpLo + iMantHi*doubleMantExpHi);
		return dDouble;
	}
	// added
	// Extracts only 4 bytes out of 8, loosing in precision (20 bit mantissa)
	this.getFastDoubleAt = function(iOffset) {
	        var iByte5 = this.getEndianByteAt(iOffset,8,4),
		     iByte6 = this.getEndianByteAt(iOffset,8,5),
		     iByte7 = this.getEndianByteAt(iOffset,8,6),
		     iByte8 = this.getEndianByteAt(iOffset,8,7);
		var iSign=iByte8 >> 7;
		var iExpRaw=((iByte8 & 0x7F)<< 4) + (iByte7 >> 4);
		var iMant=((((iByte7 & 0x0F) << 8) + iByte6) << 8) + iByte5;

		if (iExpRaw==0) return 0.0;
		if (iExpRaw==0x7ff) return undefined;

		var iExp=(iExpRaw & 0x7FF)-1023;

		var dDouble = ((iSign==1)?-1:1)*Math.pow(2,iExp)*(1.0 + iMant*doubleMantExpFast);
		return dDouble;
	}

	this.getCharAt = function(iOffset) {
		return String.fromCharCode(this.getByteAt(iOffset));
	}
}


document.write(
	"<script type='text/vbscript'>\r\n"
	+ "Function IEBinary_getByteAt(strBinary, iOffset)\r\n"
	+ "	IEBinary_getByteAt = AscB(MidB(strBinary,iOffset+1,1))\r\n"
	+ "End Function\r\n"
	+ "Function IEBinary_getLength(strBinary)\r\n"
	+ "	IEBinary_getLength = LenB(strBinary)\r\n"
	+ "End Function\r\n"
	+ "</script>\r\n"
);



// ===============================================================
// Load a binary file from the specified URL 
// Will return an object of type BinaryFile
function FetchBinaryURL(url) {
  var request =  new XMLHttpRequest();
  request.open("GET", url,false);
  try {
    request.overrideMimeType('text/plain; charset=x-user-defined');
  } catch (err) {
    // ignore any error, just to make both FF and IE work
  }
  request.send(null);

  var response=this.responseText;
  try {
    // for older IE versions, the value in responseText is not usable
    if (IEBinary_getLength(this.responseBody)>0) {
      // will get here only for older verson of IE
      response=this.responseBody;
    }
  } catch (err) {
    // not IE, do nothing
  }

  var bf=new BinaryFile(response);
  return bf;
}


// ===============================================================
// Asyncronously load a binary file from the specified URL 
//
// callback must be a function with one or two arguments:
//  - bf = an object of type BinaryFile
//  - optional argument object (used only if callback_arg not undefined) 
function FetchBinaryURLAsync(url, callback, callback_arg) {
  var callback_wrapper = function() {
    if(this.readyState == 4) {
      var response=this.responseText;
      try {
        // for older IE versions, the value in responseText is not usable
        if (IEBinary_getLength(this.responseBody)>0) {
          // will get here only for older verson of IE
          response=this.responseBody;
        }
      } catch (err) {
       // not IE, do nothing
      }

      var bf=new BinaryFile(response);
      if (callback_arg!=null) {
	callback(bf,callback_arg);
      } else {
	callback(bf);
      }
    }
  }

  var request =  new XMLHttpRequest();
  request.onreadystatechange = callback_wrapper;
  request.open("GET", url,true);
  try {
    request.overrideMimeType('text/plain; charset=x-user-defined');
  } catch (err) {
    // ignore any error, just to make both FF and IE work
  }
  request.send(null);
  return request
}
/*
 * Client library for access to RRD archive files
 * Part of the javascriptRRD package
 * Copyright (c) 2009-2010 Frank Wuerthwein, fkw@ucsd.edu
 *                         Igor Sfiligoi, isfiligoi@ucsd.edu
 *
 * Original repository: http://javascriptrrd.sourceforge.net/
 * 
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 *
 */

/*
 *
 * RRDTool has been developed and is maintained by
 * Tobias Oether [http://oss.oetiker.ch/rrdtool/]
 *
 * This software can be used to read files produced by the RRDTool
 * but has been developed independently.
 * 
 * Limitations:
 *
 * This version of the module assumes RRD files created on linux 
 * with intel architecture and supports both 32 and 64 bit CPUs.
 * All integers in RRD files are suppoes to fit in 32bit values.
 *
 * Only versions 3 and 4 of the RRD archive are supported.
 *
 * Only AVERAGE,MAXIMUM,MINIMUM and LAST consolidation functions are
 * supported. For all others, the behaviour is at the moment undefined.
 *
 */

/*
 * Dependencies:
 *   
 * The data provided to this module require an object of a class
 * that implements the following methods:
 *   getByteAt(idx)            - Return a 8 bit unsigned integer at offset idx
 *   getLongAt(idx)            - Return a 32 bit unsigned integer at offset idx
 *   getDoubleAt(idx)          - Return a double float at offset idx
 *   getFastDoubleAt(idx)      - Similar to getDoubleAt but with less precision
 *   getCStringAt(idx,maxsize) - Return a string of at most maxsize characters
 *                               that was 0-terminated in the source
 *
 * The BinaryFile from binaryXHR.js implements this interface.
 *
 */


// ============================================================
// Exception class
function InvalidRRD(msg) {
  this.message=msg;
  this.name="Invalid RRD";
}

// pretty print
InvalidRRD.prototype.toString = function() {
  return this.name + ': "' + this.message + '"';
}


// ============================================================
// RRD DS Info class
function RRDDS(rrd_data,rrd_data_idx,my_idx) {
  this.rrd_data=rrd_data;
  this.rrd_data_idx=rrd_data_idx;
  this.my_idx=my_idx;
}

RRDDS.prototype.getIdx = function() {
  return this.my_idx;
}
RRDDS.prototype.getName = function() {
  return this.rrd_data.getCStringAt(this.rrd_data_idx,20);
}
RRDDS.prototype.getType = function() {
  return this.rrd_data.getCStringAt(this.rrd_data_idx+20,20);
}
RRDDS.prototype.getMin = function() {
  return this.rrd_data.getDoubleAt(this.rrd_data_idx+48);
}
RRDDS.prototype.getMax = function() {
  return this.rrd_data.getDoubleAt(this.rrd_data_idx+56);
}


// ============================================================
// RRD RRA Info class
function RRDRRAInfo(rrd_data,rra_def_idx,
		    int_align,row_cnt,pdp_step,my_idx) {
  this.rrd_data=rrd_data;
  this.rra_def_idx=rra_def_idx;
  this.int_align=int_align;
  this.row_cnt=row_cnt;
  this.pdp_step=pdp_step;
  this.my_idx=my_idx;

  // char nam[20], uint row_cnt, uint pdp_cnt
  this.rra_pdp_cnt_idx=rra_def_idx+Math.ceil(20/int_align)*int_align+int_align;
}

RRDRRAInfo.prototype.getIdx = function() {
  return this.my_idx;
}

// Get number of rows
RRDRRAInfo.prototype.getNrRows = function() {
  return this.row_cnt;
}

// Get number of slots used for consolidation
// Mostly for internal use
RRDRRAInfo.prototype.getPdpPerRow = function() {
  return this.rrd_data.getLongAt(this.rra_pdp_cnt_idx);
}

// Get RRA step (expressed in seconds)
RRDRRAInfo.prototype.getStep = function() {
  return this.pdp_step*this.getPdpPerRow();
}

// Get consolidation function name
RRDRRAInfo.prototype.getCFName = function() {
  return this.rrd_data.getCStringAt(this.rra_def_idx,20);
}


// ============================================================
// RRD RRA handling class
function RRDRRA(rrd_data,rra_ptr_idx,
		rra_info,
		header_size,prev_row_cnts,ds_cnt) {
  this.rrd_data=rrd_data;
  this.rra_info=rra_info;
  this.row_cnt=rra_info.row_cnt;
  this.ds_cnt=ds_cnt;

  var row_size=ds_cnt*8;

  this.base_rrd_db_idx=header_size+prev_row_cnts*row_size;

  // get imediately, since it will be needed often
  this.cur_row=rrd_data.getLongAt(rra_ptr_idx);

  // calculate idx relative to base_rrd_db_idx
  // mostly used internally
  this.calc_idx = function(row_idx,ds_idx) {
    if ((row_idx>=0) && (row_idx<this.row_cnt)) {
      if ((ds_idx>=0) && (ds_idx<ds_cnt)){
	// it is round robin, starting from cur_row+1
	var real_row_idx=row_idx+this.cur_row+1;
	if (real_row_idx>=this.row_cnt) real_row_idx-=this.row_cnt;
	return row_size*real_row_idx+ds_idx*8;
      } else {
	throw RangeError("DS idx ("+ row_idx +") out of range [0-" + ds_cnt +").");
      }
    } else {
      throw RangeError("Row idx ("+ row_idx +") out of range [0-" + this.row_cnt +").");
    }	
  }
}

RRDRRA.prototype.getIdx = function() {
  return this.rra_info.getIdx();
}

// Get number of rows/columns
RRDRRA.prototype.getNrRows = function() {
  return this.row_cnt;
}
RRDRRA.prototype.getNrDSs = function() {
  return this.ds_cnt;
}

// Get RRA step (expressed in seconds)
RRDRRA.prototype.getStep = function() {
  return this.rra_info.getStep();
}

// Get consolidation function name
RRDRRA.prototype.getCFName = function() {
  return this.rra_info.getCFName();
}

RRDRRA.prototype.getEl = function(row_idx,ds_idx) {
  return this.rrd_data.getDoubleAt(this.base_rrd_db_idx+this.calc_idx(row_idx,ds_idx));
}

// Low precision version of getEl
// Uses getFastDoubleAt
RRDRRA.prototype.getElFast = function(row_idx,ds_idx) {
  return this.rrd_data.getFastDoubleAt(this.base_rrd_db_idx+this.calc_idx(row_idx,ds_idx));
}

// ============================================================
// RRD Header handling class
function RRDHeader(rrd_data) {
  this.rrd_data=rrd_data;
  this.validate_rrd();
  this.calc_idxs();
}

// Internal, used for initialization
RRDHeader.prototype.validate_rrd = function() {
  if (this.rrd_data.getLength()<1) throw new InvalidRRD("Empty file.");
  if (this.rrd_data.getLength()<16) throw new InvalidRRD("File too short.");
  if (this.rrd_data.getCStringAt(0,4)!=="RRD") throw new InvalidRRD("Wrong magic id.");

  this.rrd_version=this.rrd_data.getCStringAt(4,5);
  if ((this.rrd_version!=="0003")&&(this.rrd_version!=="0004")&&(this.rrd_version!=="0001")) {
    throw new InvalidRRD("Unsupported RRD version "+this.rrd_version+".");
  }

  this.float_width=8;
  if (this.rrd_data.getLongAt(12)==0) {
    // not a double here... likely 64 bit
    this.float_align=8;
    if (! (this.rrd_data.getDoubleAt(16)==8.642135e+130)) {
      // uhm... wrong endian?
      this.rrd_data.switch_endian=true;
    }
    if (this.rrd_data.getDoubleAt(16)==8.642135e+130) {
      // now, is it all 64bit or only float 64 bit?
      if (this.rrd_data.getLongAt(28)==0) {
	// true 64 bit align
	this.int_align=8;
	this.int_width=8;
      } else {
	// integers are 32bit aligned
	this.int_align=4;
	this.int_width=4;
      }
    } else {
      throw new InvalidRRD("Magic float not found at 16.");
    }
  } else {
    /// should be 32 bit alignment
    if (! (this.rrd_data.getDoubleAt(12)==8.642135e+130)) {
      // uhm... wrong endian?
      this.rrd_data.switch_endian=true;
    }
    if (this.rrd_data.getDoubleAt(12)==8.642135e+130) {
      this.float_align=4;
      this.int_align=4;
      this.int_width=4;
    } else {
      throw new InvalidRRD("Magic float not found at 12.");
    }
  }
  this.unival_width=this.float_width;
  this.unival_align=this.float_align;

  // process the header here, since I need it for validation

  // char magic[4], char version[5], double magic_float

  // long ds_cnt, long rra_cnt, long pdp_step, unival par[10]
  this.ds_cnt_idx=Math.ceil((4+5)/this.float_align)*this.float_align+this.float_width;
  this.rra_cnt_idx=this.ds_cnt_idx+this.int_width;
  this.pdp_step_idx=this.rra_cnt_idx+this.int_width;

  //always get only the low 32 bits, the high 32 on 64 bit archs should always be 0
  this.ds_cnt=this.rrd_data.getLongAt(this.ds_cnt_idx);
  if (this.ds_cnt<1) {
    throw new InvalidRRD("ds count less than 1.");
  }

  this.rra_cnt=this.rrd_data.getLongAt(this.rra_cnt_idx);
  if (this.ds_cnt<1) {
    throw new InvalidRRD("rra count less than 1.");
  }

  this.pdp_step=this.rrd_data.getLongAt(this.pdp_step_idx);
  if (this.pdp_step<1) {
    throw new InvalidRRD("pdp step less than 1.");
  }

  // best guess, assuming no weird align problems
  this.top_header_size=Math.ceil((this.pdp_step_idx+this.int_width)/this.unival_align)*this.unival_align+10*this.unival_width;
  var t=this.rrd_data.getLongAt(this.top_header_size);
  if (t==0) {
    throw new InvalidRRD("Could not find first DS name.");
  }
}

// Internal, used for initialization
RRDHeader.prototype.calc_idxs = function() {
  this.ds_def_idx=this.top_header_size;
  // char ds_nam[20], char dst[20], unival par[10]
  this.ds_el_size=Math.ceil((20+20)/this.unival_align)*this.unival_align+10*this.unival_width;

  this.rra_def_idx=this.ds_def_idx+this.ds_el_size*this.ds_cnt;
  // char cf_nam[20], uint row_cnt, uint pdp_cnt, unival par[10]
  this.row_cnt_idx=Math.ceil(20/this.int_align)*this.int_align;
  this.rra_def_el_size=Math.ceil((this.row_cnt_idx+2*this.int_width)/this.unival_align)*this.unival_align+10*this.unival_width;

  this.live_head_idx=this.rra_def_idx+this.rra_def_el_size*this.rra_cnt;
  // time_t last_up, int last_up_usec
  this.live_head_size=2*this.int_width;

  this.pdp_prep_idx=this.live_head_idx+this.live_head_size;
  // char last_ds[30], unival scratch[10]
  this.pdp_prep_el_size=Math.ceil(30/this.unival_align)*this.unival_align+10*this.unival_width;

  this.cdp_prep_idx=this.pdp_prep_idx+this.pdp_prep_el_size*this.ds_cnt;
  // unival scratch[10]
  this.cdp_prep_el_size=10*this.unival_width;

  this.rra_ptr_idx=this.cdp_prep_idx+this.cdp_prep_el_size*this.ds_cnt*this.rra_cnt;
  // uint cur_row
  this.rra_ptr_el_size=1*this.int_width;
  
  this.header_size=this.rra_ptr_idx+this.rra_ptr_el_size*this.rra_cnt;
}

// Optional initialization
// Read and calculate row counts
RRDHeader.prototype.load_row_cnts = function() {
  this.rra_def_row_cnts=[];
  this.rra_def_row_cnt_sums=[]; // how many rows before me
  for (var i=0; i<this.rra_cnt; i++) {
    this.rra_def_row_cnts[i]=this.rrd_data.getLongAt(this.rra_def_idx+i*this.rra_def_el_size+this.row_cnt_idx,false);
    if (i==0) {
      this.rra_def_row_cnt_sums[i]=0;
    } else {
      this.rra_def_row_cnt_sums[i]=this.rra_def_row_cnt_sums[i-1]+this.rra_def_row_cnts[i-1];
    }
  }
}

// ---------------------------
// Start of user functions

RRDHeader.prototype.getMinStep = function() {
  return this.pdp_step;
}
RRDHeader.prototype.getLastUpdate = function() {
  return this.rrd_data.getLongAt(this.live_head_idx,false);
}

RRDHeader.prototype.getNrDSs = function() {
  return this.ds_cnt;
}
RRDHeader.prototype.getDSNames = function() {
  var ds_names=[]
  for (var idx=0; idx<this.ds_cnt; idx++) {
    var ds=this.getDSbyIdx(idx);
    var ds_name=ds.getName()
    ds_names.push(ds_name);
  }
  return ds_names;
}
RRDHeader.prototype.getDSbyIdx = function(idx) {
  if ((idx>=0) && (idx<this.ds_cnt)) {
    return new RRDDS(this.rrd_data,this.ds_def_idx+this.ds_el_size*idx,idx);
  } else {
    throw RangeError("DS idx ("+ idx +") out of range [0-" + this.ds_cnt +").");
  }	
}
RRDHeader.prototype.getDSbyName = function(name) {
  for (var idx=0; idx<this.ds_cnt; idx++) {
    var ds=this.getDSbyIdx(idx);
    var ds_name=ds.getName()
    if (ds_name==name)
      return ds;
  }
  throw RangeError("DS name "+ name +" unknown.");
}

RRDHeader.prototype.getNrRRAs = function() {
  return this.rra_cnt;
}
RRDHeader.prototype.getRRAInfo = function(idx) {
  if ((idx>=0) && (idx<this.rra_cnt)) {
    return new RRDRRAInfo(this.rrd_data,
			  this.rra_def_idx+idx*this.rra_def_el_size,
			  this.int_align,this.rra_def_row_cnts[idx],this.pdp_step,
			  idx);
  } else {
    throw RangeError("RRA idx ("+ idx +") out of range [0-" + this.rra_cnt +").");
  }	
}

// ============================================================
// RRDFile class
//   Given a BinaryFile, gives access to the RRD archive fields
// 
// Arguments:
//   bf must be an object compatible with the BinaryFile interface
//   file_options - currently no semantics... introduced for future expandability
function RRDFile(bf,file_options) {
  this.file_options=file_options;

  var rrd_data=bf

  this.rrd_header=new RRDHeader(rrd_data);
  this.rrd_header.load_row_cnts();

  // ===================================
  // Start of user functions

  this.getMinStep = function() {
    return this.rrd_header.getMinStep();
  }
  this.getLastUpdate = function() {
    return this.rrd_header.getLastUpdate();
  }

  this.getNrDSs = function() {
    return this.rrd_header.getNrDSs();
  }
  this.getDSNames = function() {
    return this.rrd_header.getDSNames();
  }
  this.getDS = function(id) {
    if (typeof id == "number") {
      return this.rrd_header.getDSbyIdx(id);
    } else {
      return this.rrd_header.getDSbyName(id);
    }
  }

  this.getNrRRAs = function() {
    return this.rrd_header.getNrRRAs();
  }

  this.getRRAInfo = function(idx) {
    return this.rrd_header.getRRAInfo(idx);
  }

  this.getRRA = function(idx) {
    rra_info=this.rrd_header.getRRAInfo(idx);
    return new RRDRRA(rrd_data,
		      this.rrd_header.rra_ptr_idx+idx*this.rrd_header.rra_ptr_el_size,
		      rra_info,
		      this.rrd_header.header_size,
		      this.rrd_header.rra_def_row_cnt_sums[idx],
		      this.rrd_header.ds_cnt);
  }

}
/*
 * Support library aimed at providing commonly used functions and classes
 * that may be used while plotting RRD files with Flot
 *
 * Part of the javascriptRRD package
 * Copyright (c) 2009 Frank Wuerthwein, fkw@ucsd.edu
 *
 * Original repository: http://javascriptrrd.sourceforge.net/
 * 
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 *
 */

/*
 *
 * Flot is a javascript plotting library developed and maintained by
 * Ole Laursen [http://www.flotcharts.org/]
 *
 */

// Return a Flot-like data structure
// Since Flot does not properly handle empty elements, min and max are returned, too
function rrdDS2FlotSeries(rrd_file,ds_id,rra_idx,want_rounding) {
  var ds=rrd_file.getDS(ds_id);
  var ds_name=ds.getName();
  var ds_idx=ds.getIdx();
  var rra=rrd_file.getRRA(rra_idx);
  var rra_rows=rra.getNrRows();
  var last_update=rrd_file.getLastUpdate();
  var step=rra.getStep();

  if (want_rounding!=false) {
    // round last_update to step
    // so that all elements are sync
    last_update-=(last_update%step); 
  }

  var first_el=last_update-(rra_rows-1)*step;
  var timestamp=first_el;
  var flot_series=[];
  for (var i=0;i<rra_rows;i++) {
    var el=rra.getEl(i,ds_idx);
    if (el!=undefined) {
      flot_series.push([timestamp*1000.0,el]);
    }
    timestamp+=step;
  } // end for

  return {label: ds_name, data: flot_series, min: first_el*1000.0, max:last_update*1000.0};
}

// return an object with an array containing Flot elements, one per DS
// min and max are also returned
function rrdRRA2FlotObj(rrd_file,rra_idx,ds_list,want_ds_labels,want_rounding) {
  var rra=rrd_file.getRRA(rra_idx);
  var rra_rows=rra.getNrRows();
  var last_update=rrd_file.getLastUpdate();
  var step=rra.getStep();
  if (want_rounding!=false) {
    // round last_update to step
    // so that all elements are sync
    last_update-=(last_update%step); 
  }

  var first_el=last_update-(rra_rows-1)*step;

  var out_el={data:[], min:first_el*1000.0, max:last_update*1000.0};

  var ds_list_len = ds_list.length;
  for (var ds_list_idx=0; ds_list_idx<ds_list_len; ++ds_list_idx) { 
    var ds_id=ds_list[ds_list_idx];
    var ds=rrd_file.getDS(ds_id);
    var ds_name=ds.getName();
    var ds_idx=ds.getIdx();

    var timestamp=first_el;
    var flot_series=[];
    for (var i=0;i<rra_rows;i++) {
      var el=rra.getEl(i,ds_idx);
      if (el!=undefined) {
	flot_series.push([timestamp*1000.0,el]);
      }
      timestamp+=step;
    } // end for
    
    var flot_el={data:flot_series};
    if (want_ds_labels!=false) {
      var ds_name=ds.getName();
      flot_el.label= ds_name;
    }
    out_el.data.push(flot_el);
  } //end for ds_list_idx
  return out_el;
}

// return an object with an array containing Flot elements
//  have a positive and a negative stack of DSes, plus DSes with no stacking
// min and max are also returned
// If one_undefined_enough==true, a whole stack is invalidated if a single element
//  of the stack is invalid
function rrdRRAStackFlotObj(rrd_file,rra_idx,
			    ds_positive_stack_list,ds_negative_stack_list,ds_single_list,
                            timestamp_shift, want_ds_labels,want_rounding,one_undefined_enough) {
  var rra=rrd_file.getRRA(rra_idx);
  var rra_rows=rra.getNrRows();
  var last_update=rrd_file.getLastUpdate();
  var step=rra.getStep();
  if (want_rounding!=false) {
    // round last_update to step
    // so that all elements are sync
    last_update-=(last_update%step); 
  }
  if (one_undefined_enough!=true) { // make sure it is a boolean
    one_undefined_enough=false;
  }

  var first_el=last_update-(rra_rows-1)*step;

  var out_el={data:[], min:(first_el+timestamp_shift)*1000.0, max:(last_update+timestamp_shift)*1000.0};

  // first the stacks stack
  var stack_els=[ds_positive_stack_list,ds_negative_stack_list];
  var stack_els_len = stack_els.length;
  for (var stack_list_id=0; stack_list_id<stack_els_len; ++stack_list_id) {
    var stack_list=stack_els[stack_list_id];
    var tmp_flot_els=[];
    var tmp_ds_ids=[];
    var tmp_nr_ids=stack_list.length;
    var stack_list_len = stack_list.length;
    for (var ds_list_idx=0; ds_list_idx<stack_list_len; ++ds_list_idx) {
      var ds_id=stack_list[ds_list_idx];
      var ds=rrd_file.getDS(ds_id);
      var ds_name=ds.getName();
      var ds_idx=ds.getIdx();
      tmp_ds_ids.push(ds_idx); // getting this is expensive, call only once
      
      // initialize
      var flot_el={data:[]}
      if (want_ds_labels!=false) {
	var ds_name=ds.getName();
	flot_el.label= ds_name;
      }
      tmp_flot_els.push(flot_el);
    }

    var timestamp=first_el;
    for (var row=0;row<rra_rows;row++) {
      var ds_vals=[];
      var all_undef=true;
      var all_def=true;
      for (var id=0; id<tmp_nr_ids; id++) {
	var ds_idx=tmp_ds_ids[id];
	var el=rra.getEl(row,ds_idx);
	if (el!=undefined) {
	  all_undef=false;
	  ds_vals.push(el);
	} else {
	  all_def=false;
	  ds_vals.push(0);
	}
      } // end for id
      if (!all_undef) { // if all undefined, skip
	if (all_def || (!one_undefined_enough)) {
	  // this is a valid column, do the math
	  for (var id=1; id<tmp_nr_ids; id++) {
	    ds_vals[id]+=ds_vals[id-1]; // both positive and negative stack use a +, negative stack assumes negative values
	  }
	  // fill the flot data
	  for (var id=0; id<tmp_nr_ids; id++) {
	    tmp_flot_els[id].data.push([(timestamp+timestamp_shift)*1000.0,ds_vals[id]]);
	  }
	}
      } // end if

      timestamp+=step;
    } // end for row
    
    // put flot data in output object
    // reverse order so higher numbers are behind
    for (var id=0; id<tmp_nr_ids; id++) {
      out_el.data.push(tmp_flot_els[tmp_nr_ids-id-1]);
    }
  } //end for stack_list_id

  var ds_single_list_len = ds_single_list.length;
  for (var ds_list_idx=0; ds_list_idx<ds_single_list_len; ++ds_list_idx) { 
    var ds_id=ds_single_list[ds_list_idx];
    var ds=rrd_file.getDS(ds_id);
    var ds_name=ds.getName();
    var ds_idx=ds.getIdx();

    var timestamp=first_el;
    var flot_series=[];
    for (var i=0;i<rra_rows;i++) {
      var el=rra.getEl(i,ds_idx);
      if (el!=undefined) {
	flot_series.push([(timestamp+timestamp_shift)*1000.0,el]);
      }
      timestamp+=step;
    } // end for
    
    var flot_el={data:flot_series};
    if (want_ds_labels!=false) {
      var ds_name=ds.getName();
      flot_el.label= ds_name;
    }
    out_el.data.push(flot_el);
  } //end for ds_list_idx

  return out_el;
}

// return an object with an array containing Flot elements, one per RRD
// min and max are also returned
function rrdRRAMultiStackFlotObj(rrd_files, // a list of [rrd_id,rrd_file] pairs, all rrds must have the same step
				 rra_idx,ds_id,
				 want_rrd_labels,want_rounding,
				 one_undefined_enough) { // If true, a whole stack is invalidated if a single element of the stack is invalid

  var reference_rra=rrd_files[0][1].getRRA(rra_idx); // get the first one, all should be the same
  var rows=reference_rra.getNrRows();
  var step=reference_rra.getStep();
  var ds_idx=rrd_files[0][1].getDS(ds_id).getIdx(); // this can be expensive, do once (all the same)

  // rrds can be slightly shifted, calculate range
  var max_ts=null;
  var min_ts=null;

  // initialize list of rrd data elements
  var tmp_flot_els=[];
  var tmp_rras=[];
  var tmp_last_updates=[];
  var tmp_nr_ids=rrd_files.length;
  for (var id=0; id<tmp_nr_ids; id++) {
    var rrd_file=rrd_files[id][1];
    var rrd_rra=rrd_file.getRRA(rra_idx);

    var rrd_last_update=rrd_file.getLastUpdate();
    if (want_rounding!=false) {
      // round last_update to step
      // so that all elements are sync
      rrd_last_update-=(rrd_last_update%step); 
    }
    tmp_last_updates.push(rrd_last_update);

    var rrd_min_ts=rrd_last_update-(rows-1)*step;
    if ((max_ts==null) || (rrd_last_update>max_ts)) {
      max_ts=rrd_last_update;
    }
    if ((min_ts==null) || (rrd_min_ts<min_ts)) {
      min_ts=rrd_min_ts;
    }
    
    tmp_rras.push(rrd_rra);
      
    // initialize
    var flot_el={data:[]}
    if (want_rrd_labels!=false) {
	var rrd_name=rrd_files[id][0];
	flot_el.label= rrd_name;
    }
    tmp_flot_els.push(flot_el);
  }

  var out_el={data:[], min:min_ts*1000.0, max:max_ts*1000.0};

  for (var ts=min_ts;ts<=max_ts;ts+=step) {
      var rrd_vals=[];
      var all_undef=true;
      var all_def=true;
      for (var id=0; id<tmp_nr_ids; id++) {
        var rrd_rra=tmp_rras[id];
        var rrd_last_update=tmp_last_updates[id];
	var row_delta=Math.round((rrd_last_update-ts)/step);
	var el=undefined; // if out of range
        if ((row_delta>=0) && (row_delta<rows)) {
          el=rrd_rra.getEl(rows-row_delta-1,ds_idx);
        }
	if (el!=undefined) {
	  all_undef=false;
	  rrd_vals.push(el);
	} else {
	  all_def=false;
	  rrd_vals.push(0);
	}
      } // end for id
      if (!all_undef) { // if all undefined, skip
	if (all_def || (!one_undefined_enough)) {
	  // this is a valid column, do the math
	  for (var id=1; id<tmp_nr_ids; id++) {
	    rrd_vals[id]+=rrd_vals[id-1]; 
	  }
	  // fill the flot data
	  for (var id=0; id<tmp_nr_ids; id++) {
	    tmp_flot_els[id].data.push([ts*1000.0,rrd_vals[id]]);
	  }
	}
      } // end if
  } // end for ts
    
  // put flot data in output object
  // reverse order so higher numbers are behind
  for (var id=0; id<tmp_nr_ids; id++) {
    out_el.data.push(tmp_flot_els[tmp_nr_ids-id-1]);
  }
  
  return out_el;
}

// ======================================
// Helper class for handling selections
// =======================================================
function rrdFlotSelection() {
  this.selection_min=null;
  this.selection_max=null;
};

// reset to a state where ther is no selection
rrdFlotSelection.prototype.reset = function() {
  this.selection_min=null;
  this.selection_max=null;
};

// given the selection ranges, set internal variable accordingly
rrdFlotSelection.prototype.setFromFlotRanges = function(ranges) {
  this.selection_min=ranges.xaxis.from;
  this.selection_max=ranges.xaxis.to;
};

// Return a Flot ranges structure that can be promptly used in setSelection
rrdFlotSelection.prototype.getFlotRanges = function() {
  return { xaxis: {from: this.selection_min, to: this.selection_max}};
};

// return true is a selection is in use
rrdFlotSelection.prototype.isSet = function() {
  return this.selection_min!=null;
};

// Given an array of flot lines, limit to the selection
rrdFlotSelection.prototype.trim_flot_data = function(flot_data) {
  var out_data=[];
  for (var i=0; i<flot_data.length; i++) {
    var data_el=flot_data[i];
    out_data.push({label : data_el.label, data:this.trim_data(data_el.data), color:data_el.color, lines:data_el.lines, yaxis:data_el.yaxis});
  }
  return out_data;
};

// Limit to selection the flot series data element
rrdFlotSelection.prototype.trim_data = function(data_list) {
  if (this.selection_min==null) return data_list; // no selection => no filtering

  var out_data=[];
  for (var i=0; i<data_list.length; i++) {
    
    if (data_list[i]==null) continue; // protect
    //data_list[i][0]+=3550000*5;
    var nr=data_list[i][0]; //date in unix time
    if ((nr>=this.selection_min) && (nr<=this.selection_max)) {
      out_data.push(data_list[i]);
    }
  }
  return out_data;
};


// Given an array of flot lines, limit to the selection
rrdFlotSelection.prototype.trim_flot_timezone_data = function(flot_data,shift) {
  var out_data=[];
  for (var i=0; i<flot_data.length; i++) {
    var data_el=flot_data[i];
    out_data.push({label : data_el.label, data:this.trim_timezone_data(data_el.data,shift), color:data_el.color, lines:data_el.lines, yaxis:data_el.yaxis});
  }
  return out_data;
};

// Limit to selection the flot series data element
rrdFlotSelection.prototype.trim_timezone_data = function(data_list,shift) {
  if (this.selection_min==null) return data_list; // no selection => no filtering

  var out_data=[];
  for (var i=0; i<data_list.length; i++) {
    if (data_list[i]==null) continue; // protect
    var nr=data_list[i][0]+shift;
    if ((nr>=this.selection_min) && (nr<=this.selection_max)) {
      out_data.push(data_list[i]);
    }
  }
  return out_data;
};


// ======================================
// Miscelaneous helper functions
// ======================================

function rfs_format_time(s) {
  if (s<120) {
    return s+"s";
  } else {
    var s60=s%60;
    var m=(s-s60)/60;
    if ((m<10) && (s60>9)) {
      return m+":"+s60+"min";
    } if (m<120) {
      return m+"min";
    } else {
      var m60=m%60;
      var h=(m-m60)/60;
      if ((h<12) && (m60>9)) {
	return h+":"+m60+"h";
      } if (h<48) {
	return h+"h";
      } else {
	var h24=h%24;
	var d=(h-h24)/24;
	if ((d<7) && (h24>0)) {
	  return d+" days "+h24+"h";
	} if (d<60) {
	  return d+" days";
	} else {
	  var d30=d%30;
	  var mt=(d-d30)/30;
	  return mt+" months";
	}
      }
    }
    
  }
}
/*
 * RRD graphing libraries, based on Flot
 * Part of the javascriptRRD package
 * Copyright (c) 2010 Frank Wuerthwein, fkw@ucsd.edu
 *                    Igor Sfiligoi, isfiligoi@ucsd.edu
 *
 * Original repository: http://javascriptrrd.sourceforge.net/
 * 
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 *
 */

/*
 *
 * Flot is a javascript plotting library developed and maintained by
 * Ole Laursen [http://code.google.com/p/flot/]
 *
 */

/*
 * Local dependencies:
 *  rrdFlotSupport.py
 *
 * External dependencies:
 *  [Flot]/jquery.py
 *  [Flot]/jquery.flot.js
 *  [Flot]/jquery.flot.selection.js
 */

/* graph_options defaults (see Flot docs for details)
 * {
 *  legend: { position:"nw",noColumns:3},
 *  lines: { show:true },
 *  yaxis: { autoscaleMargin: 0.20},
 *  tooltip: true,
 *  tooltipOpts: { content: "<h4>%s</h4> Value: %y.3" }
 * }
 *
 * ds_graph_options is a dictionary of DS_name, 
 *   with each element being a graph_option
 *   The defaults for each element are
 *   {
 *     title: label  or ds_name     // this is what is displayed in the checkboxes
 *     checked: first_ds_in_list?   // boolean
 *     label: title or ds_name      // this is what is displayed in the legend
 *     color: ds_index              // see Flot docs for details
 *     lines: { show:true }         // see Flot docs for details
 *     yaxis: 1                     // can be 1 or 2
 *     stack: 'none'                // other options are 'positive' and 'negative'
 *   }
 *
 * //overwrites other defaults; mostly used for linking via the URL
 * rrdflot_defaults defaults (see Flot docs for details) 	 
 * {
 *    graph_only: false        // If true, limit the display to the graph only
 *    legend: "Top"            //Starting location of legend. Options are: 
 *                             //   "Top","Bottom","TopRight","BottomRight","None".
 *    num_cb_rows: 12          //How many rows of DS checkboxes per column.
 *    use_element_buttons: false  //To be used in conjunction with num_cb_rows: This option
 *                             //    creates a button above every column, which selects
 *                             //    every element in the column. 
 *    multi_ds: false          //"true" appends the name of the aggregation function to the 
 *                             //    name of the DS element. 
 *    multi_rra: false         //"true" appends the name of the RRA consolidation function (CF) 
 *                             //    (AVERAGE, MIN, MAX or LAST) to the name of the RRA. Useful 
 *                             //    for RRAs over the same interval with different CFs.  
 *    use_checked_DSs: false   //Use the list checked_DSs below.
 *    checked_DSs: []          //List of elements to be checked by default when graph is loaded. 
 *                             //    Overwrites graph options. 
 *    use_rra: false           //Whether to use the rra index specified below.
 *    rra: 0                   //RRA (rra index in rrd) to be selected when graph is loaded. 
 *    use_windows: false       //Whether to use the window zoom specifications below.
 *    window_min: 0            //Sets minimum for window zoom. X-axis usually in unix time. 
 *    window_max: 0            //Sets maximum for window zoom.
 *    graph_height: "300px"    //Height of main graph. 
 *    graph_width: "500px"     //Width of main graph.
 *    scale_height: "110px"    //Height of small scaler graph.
 *    scale_width: "250px"     //Width of small scaler graph.
 *    timezone: local          //timezone.
 * } 
 */

var local_checked_DSs = [];
var selected_rra = 0;
var window_min=0;
var window_max=0;
var elem_group=null;
var timezone_shift=0;

function rrdFlot(html_id, rrd_file, graph_options, ds_graph_options, rrdflot_defaults) {
  this.html_id=html_id;
  this.rrd_file=rrd_file;
  this.graph_options=graph_options;
  if (rrdflot_defaults==null) {
    this.rrdflot_defaults=new Object(); // empty object, just not to be null
  } else {
    this.rrdflot_defaults=rrdflot_defaults;
  }
  if (ds_graph_options==null) {
    this.ds_graph_options=new Object(); // empty object, just not to be null
  } else {
    this.ds_graph_options=ds_graph_options;
  }
  this.selection_range=new rrdFlotSelection();

  graph_info={};
  this.createHTML();
  this.populateRes();
  this.populateDScb();
  this.drawFlotGraph();

  if (this.rrdflot_defaults.graph_only==true) {
    this.cleanHTMLCruft();
  }
}


// ===============================================
// Create the HTML tags needed to host the graphs
rrdFlot.prototype.createHTML = function() {
  var rf_this=this; // use obj inside other functions

  var base_el=document.getElementById(this.html_id);

  this.res_id=this.html_id+"_res";
  this.ds_cb_id=this.html_id+"_ds_cb";
  this.graph_id=this.html_id+"_graph";
  this.scale_id=this.html_id+"_scale";
  this.legend_sel_id=this.html_id+"_legend_sel";
  this.time_sel_id=this.html_id+"_time_sel";
  this.elem_group_id=this.html_id+"_elem_group";
  this.res_row_id="res_row_"+this.html_id;
  this.scale_row_id="scale_row_"+this.html_id;

  // First clean up anything in the element
  while (base_el.lastChild!=null) base_el.removeChild(base_el.lastChild);

  // Now create the layout
  var external_table=document.createElement("Table");
  this.external_table=external_table;

  // Header two: resulution select and DS selection title
  var rowHeader=external_table.insertRow(-1);
  rowHeader.id=this.res_row_id;
  rowHeader.className="rrd_res_row";
  var cellRes=rowHeader.insertCell(-1);
  cellRes.colSpan=3;
  cellRes.appendChild(document.createTextNode("Resolution:"));
  var forRes=document.createElement("Select");
  forRes.id=this.res_id;
  //forRes.onChange= this.callback_res_changed;
  forRes.onchange= function () {rf_this.callback_res_changed();};
  cellRes.appendChild(forRes);
  
  var cellDSTitle=rowHeader.insertCell(-1);
  cellDSTitle.appendChild(document.createTextNode("Select elements to plot:"));

  // Graph row: main graph and DS selection block
  var rowGraph=external_table.insertRow(-1);
  var cellGraph=rowGraph.insertCell(-1);
  cellGraph.colSpan=3;
  var elGraph=document.createElement("Div");
  if(this.rrdflot_defaults.graph_width!=null) {
     elGraph.style.width=this.rrdflot_defaults.graph_width;
  } else {elGraph.style.width="500px";}
  if(this.rrdflot_defaults.graph_height!=null) {
     elGraph.style.height=this.rrdflot_defaults.graph_height;
  } else {elGraph.style.height="300px";}
  elGraph.id=this.graph_id;
  cellGraph.appendChild(elGraph);

  var cellDScb=rowGraph.insertCell(-1);
  

  cellDScb.vAlign="top";
  var formDScb=document.createElement("Form");
  formDScb.id=this.ds_cb_id;
  formDScb.onchange= function () {rf_this.callback_ds_cb_changed();};
  cellDScb.appendChild(formDScb);

  // Scale row: scaled down selection graph
  var rowScale=external_table.insertRow(-1);
  rowScale.id=this.scale_row_id;
  rowScale.className="rrd_scale_row";

  var cellScaleLegend=rowScale.insertCell(-1);
  cellScaleLegend.vAlign="top";
  cellScaleLegend.appendChild(document.createTextNode("Legend:"));
  cellScaleLegend.appendChild(document.createElement('br'));

  var forScaleLegend=document.createElement("Select");
  forScaleLegend.id=this.legend_sel_id;
  forScaleLegend.appendChild(new Option("Top","nw",this.rrdflot_defaults.legend=="Top",this.rrdflot_defaults.legend=="Top"));
  forScaleLegend.appendChild(new Option("Bottom","sw",this.rrdflot_defaults.legend=="Bottom",this.rrdflot_defaults.legend=="Bottom"));
  forScaleLegend.appendChild(new Option("TopRight","ne",this.rrdflot_defaults.legend=="TopRight",this.rrdflot_defaults.legend=="TopRight"));
  forScaleLegend.appendChild(new Option("BottomRight","se",this.rrdflot_defaults.legend=="BottomRight",this.rrdflot_defaults.legend=="BottomRight"));
  forScaleLegend.appendChild(new Option("None","None",this.rrdflot_defaults.legend=="None",this.rrdflot_defaults.legend=="None"));
  forScaleLegend.onchange= function () {rf_this.callback_legend_changed();};
  cellScaleLegend.appendChild(forScaleLegend);


  cellScaleLegend.appendChild(document.createElement('br'));
  cellScaleLegend.appendChild(document.createTextNode("Timezone:"));
  cellScaleLegend.appendChild(document.createElement('br'));

  var timezone=document.createElement("Select");
  timezone.id=this.time_sel_id;

  var timezones = ["+12","+11","+10","+9","+8","+7","+6","+5","+4","+3","+2","+1","0",
                  "-1","-2","-3","-4","-5","-6","-7","-8","-9","-10","-11","-12"];
  var tz_found=false;
  var true_tz;
  for(var j=0; j<24; j++) {
    if (Math.ceil(this.rrdflot_defaults.timezone)==Math.ceil(timezones[j])) {
      tz_found=true;
      true_tz=Math.ceil(this.rrdflot_defaults.timezone);
      break;
    }
  }
  if (!tz_found) {
    // the passed timezone does not make sense
    // find the local time
    var d= new Date();
    true_tz=-Math.ceil(d.getTimezoneOffset()/60);
  }
  for(var j=0; j<24; j++) {
    timezone.appendChild(new Option(timezones[j],timezones[j],true_tz==Math.ceil(timezones[j]),true_tz==Math.ceil(timezones[j])));
  }
  timezone.onchange= function () {rf_this.callback_timezone_changed();};

  cellScaleLegend.appendChild(timezone);

  var cellScale=rowScale.insertCell(-1);
  cellScale.align="right";
  var elScale=document.createElement("Div");
  if(this.rrdflot_defaults.scale_width!=null) {
     elScale.style.width=this.rrdflot_defaults.scale_width;
  } else {elScale.style.width="250px";}
  if(this.rrdflot_defaults.scale_height!=null) {
     elScale.style.height=this.rrdflot_defaults.scale_height;
  } else {elScale.style.height="110px";}
  elScale.id=this.scale_id;
  cellScale.appendChild(elScale);
  
  var cellScaleReset=rowScale.insertCell(-1);
  cellScaleReset.vAlign="top";
  cellScaleReset.appendChild(document.createTextNode(" "));
  cellScaleReset.appendChild(document.createElement('br'));
  var elScaleReset=document.createElement("input");
  elScaleReset.type = "button";
  elScaleReset.value = "Reset selection";
  elScaleReset.onclick = function () {rf_this.callback_scale_reset();}

  cellScaleReset.appendChild(elScaleReset);

  base_el.appendChild(external_table);
};

// ===============================================
// Remove all HTMl elements but the graph
rrdFlot.prototype.cleanHTMLCruft = function() {
  var rf_this=this; // use obj inside other functions

  // delete top and bottom rows... graph is in the middle
  this.external_table.deleteRow(-1);
  this.external_table.deleteRow(0);

  var ds_el=document.getElementById(this.ds_cb_id);
  ds_el.removeChild(ds_el.lastChild);
}

// ======================================
// Populate RRA and RD info
rrdFlot.prototype.populateRes = function() {
  var form_el=document.getElementById(this.res_id);

  // First clean up anything in the element
  while (form_el.lastChild!=null) form_el.removeChild(form_el.lastChild);

  // now populate with RRA info
  var nrRRAs=this.rrd_file.getNrRRAs();
  for (var i=0; i<nrRRAs; i++) {

    var rra=this.rrd_file.getRRAInfo(i);
    var step=rra.getStep();
    var rows=rra.getNrRows();
    var period=step*rows;
    var rra_label=rfs_format_time(step)+" ("+rfs_format_time(period)+" total)";
    if (this.rrdflot_defaults.multi_rra) rra_label+=" "+rra.getCFName();
    form_el.appendChild(new Option(rra_label,i));
  }
    if(this.rrdflot_defaults.use_rra) {form_el.selectedIndex = this.rrdflot_defaults.rra;}
};

rrdFlot.prototype.populateDScb = function() {
  var rf_this=this; // use obj inside other functions
  var form_el=document.getElementById(this.ds_cb_id);
 
  //Create a table within a table to arrange
  // checkbuttons into two or more columns
  var table_el=document.createElement("Table");
  var row_el=table_el.insertRow(-1);
  row_el.vAlign="top";
  var cell_el=null; // will define later

  if (this.rrdflot_defaults.num_cb_rows==null) {
     this.rrdflot_defaults.num_cb_rows=12; 
  }
  // now populate with DS info
  var nrDSs=this.rrd_file.getNrDSs();
  var elem_group_number = 0;
 
  for (var i=0; i<nrDSs; i++) {

    if ((i%this.rrdflot_defaults.num_cb_rows)==0) { // one column every x DSs
      if(this.rrdflot_defaults.use_element_buttons) {
        cell_el=row_el.insertCell(-1); //make next element column 
        if(nrDSs>this.rrdflot_defaults.num_cb_rows) { //if only one column, no need for a button
          elem_group_number = (i/this.rrdflot_defaults.num_cb_rows)+1;
          var elGroupSelect = document.createElement("input");
          elGroupSelect.type = "button";
          elGroupSelect.value = "Group "+elem_group_number;
          elGroupSelect.onclick = (function(e) { //lambda function!!
             return function() {rf_this.callback_elem_group_changed(e);};})(elem_group_number);

          cell_el.appendChild(elGroupSelect);
          cell_el.appendChild(document.createElement('br')); //add space between the two
        }
      } else {
         //just make next element column
         cell_el=row_el.insertCell(-1); 
      }
    }
    var ds=this.rrd_file.getDS(i);
    if (this.rrdflot_defaults.multi_ds) { //null==false in boolean ops
       var name=ds.getName()+"-"+ds.getType();
       var name2=ds.getName();
    }
    else {var name=ds.getName(); var name2=ds.getName();}
    var title=name; 
    if(this.rrdflot_defaults.use_checked_DSs) {
       if(this.rrdflot_defaults.checked_DSs.length==0) {
          var checked=(i==0); // only first checked by default
       } else{checked=false;}
    } else {var checked=(i==0);}
    if (this.ds_graph_options[name]!=null) {
      var dgo=this.ds_graph_options[name];
      if (dgo['title']!=null) {
	// if the user provided the title, use it
	title=dgo['title'];
      } else if (dgo['label']!=null) {
	// use label as a second choiceit
	title=dgo['label'];
      } // else leave the ds name
      if(this.rrdflot_defaults.use_checked_DSs) {
         if(this.rrdflot_defaults.checked_DSs.length==0) {
           // if the user provided the title, use it
           checked=dgo['checked'];
         }
      } else {
         if (dgo['checked']!=null) {
            checked=dgo['checked']; 
         }
      }
    }
    if(this.rrdflot_defaults.use_checked_DSs) {
       if(this.rrdflot_defaults.checked_DSs==null) {continue;}
       for(var j=0;j<this.rrdflot_defaults.checked_DSs.length;j++){
             if (name==this.rrdflot_defaults.checked_DSs[j]) {checked=true;}
       }
    }
    var cb_el = document.createElement("input");
    cb_el.type = "checkbox";
    cb_el.name = "ds";
    cb_el.value = name2;
    cb_el.checked = cb_el.defaultChecked = checked;
    cell_el.appendChild(cb_el);
    cell_el.appendChild(document.createTextNode(title));
    cell_el.appendChild(document.createElement('br'));
  }
  form_el.appendChild(table_el);
};

// ======================================
// 
rrdFlot.prototype.drawFlotGraph = function() {
  // Res contains the RRA idx
  var oSelect=document.getElementById(this.res_id);
  var rra_idx=Number(oSelect.options[oSelect.selectedIndex].value);
  selected_rra=rra_idx;
  if(this.rrdflot_defaults.use_rra) {
    oSelect.options[oSelect.selectedIndex].value = this.rrdflot_defaults.rra;
    rra_idx = this.rrdflot_defaults.rra;
  }

  // now get the list of selected DSs
  var ds_positive_stack_list=[];
  var ds_negative_stack_list=[];
  var ds_single_list=[];
  var ds_colors={};
  var oCB=document.getElementById(this.ds_cb_id);
  var nrDSs=oCB.ds.length;
  local_checked_DSs=[];
  if (oCB.ds.length>0) {
    for (var i=0; i<oCB.ds.length; i++) {
      if (oCB.ds[i].checked==true) {
	var ds_name=oCB.ds[i].value;
	var ds_stack_type='none';
        local_checked_DSs.push(ds_name);;
	if (this.ds_graph_options[ds_name]!=null) {
	  var dgo=this.ds_graph_options[ds_name];
	  if (dgo['stack']!=null) {
	    var ds_stack_type=dgo['stack'];
	  }
	}
	if (ds_stack_type=='positive') {
	  ds_positive_stack_list.push(ds_name);
	} else if (ds_stack_type=='negative') {
	  ds_negative_stack_list.push(ds_name);
	} else {
	  ds_single_list.push(ds_name);
	}
	ds_colors[ds_name]=i;
      }
    }
  } else { // single element is not treated as an array
    if (oCB.ds.checked==true) {
      // no sense trying to stack a single element
      var ds_name=oCB.ds.value;
      ds_single_list.push(ds_name);
      ds_colors[ds_name]=0;
      local_checked_DSs.push(ds_name);
    }
  }

  var timeSelect=document.getElementById(this.time_sel_id);
  timezone_shift=timeSelect.options[timeSelect.selectedIndex].value;

  // then extract RRA data about those DSs
  var flot_obj=rrdRRAStackFlotObj(this.rrd_file,rra_idx,
				  ds_positive_stack_list,ds_negative_stack_list,ds_single_list,
                                  timezone_shift*3600);

  // fix the colors, based on the position in the RRD
  for (var i=0; i<flot_obj.data.length; i++) {
    var name=flot_obj.data[i].label; // at this point, label is the ds_name
    var color=ds_colors[name]; // default color as defined above
    if (this.ds_graph_options[name]!=null) {
      var dgo=this.ds_graph_options[name];
      if (dgo['color']!=null) {
	color=dgo['color'];
      }
      if (dgo['label']!=null) {
	// if the user provided the label, use it
	flot_obj.data[i].label=dgo['label'];
      } else  if (dgo['title']!=null) {
	// use title as a second choice 
	flot_obj.data[i].label=dgo['title'];
      } // else use the ds name
      if (dgo['lines']!=null) {
	// if the user provided the label, use it
	flot_obj.data[i].lines=dgo['lines'];
      }
      if (dgo['yaxis']!=null) {
	// if the user provided the label, use it
	flot_obj.data[i].yaxis=dgo['yaxis'];
      }
    }
    flot_obj.data[i].color=color;
  }

  // finally do the real plotting
  this.bindFlotGraph(flot_obj);
};

// ======================================
// Bind the graphs to the HTML tags
rrdFlot.prototype.bindFlotGraph = function(flot_obj) {
  var rf_this=this; // use obj inside other functions

  // Legend
  var oSelect=document.getElementById(this.legend_sel_id);
  var legend_id=oSelect.options[oSelect.selectedIndex].value;
  var graph_jq_id="#"+this.graph_id;
  var scale_jq_id="#"+this.scale_id;

  var graph_options = {
    legend: {show:false, position:"nw",noColumns:3},
    lines: {show:true},
    xaxis: { mode: "time" },
    yaxis: { autoscaleMargin: 0.20},
    selection: { mode: "x" },
    tooltip: true,
    tooltipOpts: { content: "<h4>%s</h4> Value: %y.3" },
    grid: { hoverable: true },
  };
  
  if (legend_id=="None") {
    // do nothing
  } else {
    graph_options.legend.show=true;
    graph_options.legend.position=legend_id;
  }

  if (this.graph_options!=null) {
    graph_options=populateGraphOptions(graph_options,this.graph_options);
  }

  if (graph_options.tooltip==false) {
    // avoid the need for the caller specify both
    graph_options.grid.hoverable=false;
  }

  if (this.selection_range.isSet()) {
    var selection_range=this.selection_range.getFlotRanges();
    if(this.rrdflot_defaults.use_windows) {
       graph_options.xaxis.min = this.rrdflot_defaults.window_min;  
       graph_options.xaxis.max = this.rrdflot_defaults.window_max;  
    } else {
    graph_options.xaxis.min=selection_range.xaxis.from;
    graph_options.xaxis.max=selection_range.xaxis.to;
    }
  } else if(this.rrdflot_defaults.use_windows) {
    graph_options.xaxis.min = this.rrdflot_defaults.window_min;  
    graph_options.xaxis.max = this.rrdflot_defaults.window_max;  
  } else {
    graph_options.xaxis.min=flot_obj.min;
    graph_options.xaxis.max=flot_obj.max;
  }

  var scale_options = {
    legend: {show:false},
    lines: {show:true},
    xaxis: {mode: "time", min:flot_obj.min, max:flot_obj.max },
    yaxis: graph_options.yaxis,
    selection: { mode: "x" },
  };

  //this.selection_range.selection_min=flot_obj.min;
  //this.selection_range.selection_max=flot_obj.max;

  var flot_data=flot_obj.data;
  var graph_data=this.selection_range.trim_flot_data(flot_data);
  var scale_data=flot_data;

  this.graph = $.plot($(graph_jq_id), graph_data, graph_options);
  this.scale = $.plot($(scale_jq_id), scale_data, scale_options);
 
  
  if(this.rrdflot_defaults.use_windows) {
    ranges = {};
    ranges.xaxis = [];
    ranges.xaxis.from = this.rrdflot_defaults.window_min;
    ranges.xaxis.to = this.rrdflot_defaults.window_max;
    rf_this.scale.setSelection(ranges,true);
    window_min = ranges.xaxis.from;
    window_max = ranges.xaxis.to;
  }

  if (this.selection_range.isSet()) {
    this.scale.setSelection(this.selection_range.getFlotRanges(),true); //don't fire event, no need
  }

  // now connect the two    
  $(graph_jq_id).unbind("plotselected"); // but first remove old function
  $(graph_jq_id).bind("plotselected", function (event, ranges) {
      // do the zooming
      rf_this.selection_range.setFromFlotRanges(ranges);
      graph_options.xaxis.min=ranges.xaxis.from;
      graph_options.xaxis.max=ranges.xaxis.to;
      window_min = ranges.xaxis.from;
      window_max = ranges.xaxis.to;
      rf_this.graph = $.plot($(graph_jq_id), rf_this.selection_range.trim_flot_data(flot_data), graph_options);
      
      // don't fire event on the scale to prevent eternal loop
      rf_this.scale.setSelection(ranges, true); //puts the transparent window on minigraph
  });
   
  $(scale_jq_id).unbind("plotselected"); //same here 
  $(scale_jq_id).bind("plotselected", function (event, ranges) {
      rf_this.graph.setSelection(ranges);
  });

  // only the scale has a selection
  // so when that is cleared, redraw also the graph
  $(scale_jq_id).bind("plotunselected", function() {
      rf_this.selection_range.reset();
      graph_options.xaxis.min=flot_obj.min;
      graph_options.xaxis.max=flot_obj.max;
      rf_this.graph = $.plot($(graph_jq_id), rf_this.selection_range.trim_flot_data(flot_data), graph_options);
      window_min = 0;
      window_max = 0;
  });
};

// callback functions that are called when one of the selections changes
rrdFlot.prototype.callback_res_changed = function() {
  this.rrdflot_defaults.use_rra = false;
  this.drawFlotGraph();
};

rrdFlot.prototype.callback_ds_cb_changed = function() {
  this.drawFlotGraph();
};

rrdFlot.prototype.callback_scale_reset = function() {
  this.scale.clearSelection();
};

rrdFlot.prototype.callback_legend_changed = function() {
  this.drawFlotGraph();
};

rrdFlot.prototype.callback_timezone_changed = function() {
  this.drawFlotGraph();
};

rrdFlot.prototype.callback_elem_group_changed = function(num) { //,window_min,window_max) {

  var oCB=document.getElementById(this.ds_cb_id);
  var nrDSs=oCB.ds.length;
  if (oCB.ds.length>0) {
    for (var i=0; i<oCB.ds.length; i++) {
      if(Math.floor(i/this.rrdflot_defaults.num_cb_rows)==num-1) {oCB.ds[i].checked=true; }
      else {oCB.ds[i].checked=false;}
    }
  }
  this.drawFlotGraph()
};

function getGraphInfo() {
   var graph_info = {};
   graph_info['dss'] = local_checked_DSs;
   graph_info['rra'] = selected_rra;
   graph_info['window_min'] = window_min;
   graph_info['window_max'] = window_max;
   graph_info['timezone'] = timezone_shift;
   return graph_info;
};

function resetWindow() {
  window_min = 0;
  window_max = 0; 
};

function populateGraphOptions(me, other) {
  for (e in other) {
    if (me[e]!=undefined) {
      if (Object.prototype.toString.call(other[e])=="[object Object]") {
	me[e]=populateGraphOptions(me[e],other[e]);
      } else {
	me[e]=other[e];
      }
    } else {
      /// create a new one
      if (Object.prototype.toString.call(other[e])=="[object Object]") {
	// This will do a deep copy
	me[e]=populateGraphOptions({},other[e]);
      } else {
	me[e]=other[e];
      }
    }
  }
  return me;
};
/*
 * RRD graphing libraries, based on Flot
 * Part of the javascriptRRD package
 * Copyright (c) 2010 Frank Wuerthwein, fkw@ucsd.edu
 *                    Igor Sfiligoi, isfiligoi@ucsd.edu
 *
 * Original repository: http://javascriptrrd.sourceforge.net/
 * 
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 *
 */

/*
 *
 * Flot is a javascript plotting library developed and maintained by
 * Ole Laursen [http://www.flotcharts.org/]
 *
 */

/*
 * The rrd_files is a list of 
 *  [rrd_id,rrd_file] pairs
 * All rrd_files must have the same step, the same DSes and the same number of RRAs.
 *
 */ 

/*
 * The ds_list is a list of 
 *  [ds_id, ds_title] pairs
 * If not defined, the list will be created from the RRDs
 *
 */ 

/*
 * Local dependencies:
 *  rrdFlotSupport.py
 *
 * External dependencies:
 *  [Flot]/jquery.py
 *  [Flot]/jquery.flot.js
 *  [Flot]/jquery.flot.selection.js
 */

/* graph_options defaults (see Flot docs for details)
 * {
 *  legend: { position:"nw",noColumns:3},
 *  lines: { show:true },
 *  yaxis: { autoscaleMargin: 0.20}
 * }
 *
 * rrd_graph_options is a dictionary of rrd_id, 
 *   with each element being a graph_option
 *   The defaults for each element are
 *   {
 *     title: label  or rrd_name                          // this is what is displayed in the checkboxes
 *     checked: true                                      // boolean
 *     label: title or rrd_name                           // this is what is displayed in the legend
 *     color: rrd_index                                   // see Flot docs for details
 *     lines: { show:true, fill: true, fillColor:color }  // see Flot docs for details
 *   }
 *
 * //overwrites other defaults; mostly used for linking via the URL
 * rrdflot_defaults defaults (see Flot docs for details) 	 
 * {
 *    graph_only: false        // If true, limit the display to the graph only
 *    legend: "Top"            //Starting location of legend. Options are: 
 *                             //   "Top","Bottom","TopRight","BottomRight","None".
 *    num_cb_rows: 12          //How many rows of DS checkboxes per column.
 *    use_element_buttons: false  //To be used in conjunction with num_cb_rows: This option
 *                             //    creates a button above every column, which selects
 *                             //    every element in the column. 
 *    multi_rra: false         //"true" appends the name of the RRA consolidation function (CF) 
 *                             //    (AVERAGE, MIN, MAX or LAST) to the name of the RRA. Useful 
 *                             //    for RRAs over the same interval with different CFs.  
 *    use_checked_RRDs: false   //Use the list checked_RRDs below.
 *    checked_RRDs: []          //List of elements to be checked by default when graph is loaded. 
 *                             //    Overwrites graph options. 
 *    use_rra: false           //Whether to use the rra index specified below.
 *    rra: 0                   //RRA (rra index in rrd) to be selected when graph is loaded. 
 *    use_windows: false       //Whether to use the window zoom specifications below.
 *    window_min: 0            //Sets minimum for window zoom. X-axis usually in unix time. 
 *    window_max: 0            //Sets maximum for window zoom.
 *    graph_height: "300px"    //Height of main graph. 
 *    graph_width: "500px"     //Width of main graph.
 *    scale_height: "110px"    //Height of small scaler graph.
 *    scale_width: "250px"     //Width of small scaler graph.
 * } 
 */

var local_checked_RRDs = [];
var selected_rra = 0;
var window_min=0;
var window_max=0;
var elem_group=null;


function rrdFlotMatrix(html_id, rrd_files, ds_list, graph_options, rrd_graph_options,rrdflot_defaults) {
  this.html_id=html_id;
  this.rrd_files=rrd_files;
  if (rrdflot_defaults==null) {
    this.rrdflot_defaults=new Object(); // empty object, just not to be null
  } else {
    this.rrdflot_defaults=rrdflot_defaults;
  }
  if (ds_list==null) {
    this.ds_list=[];
    var rrd_file=this.rrd_files[0][1]; // get the first one... they are all the same
    var nrDSs=rrd_file.getNrDSs();
    for (var i=0; i<nrDSs; i++) {
      var ds=this.rrd_files[0][1].getDS(i);
      var name=ds.getName();
      this.ds_list.push([name,name]);
    }
  } else {
    this.ds_list=ds_list;
  }
  this.graph_options=graph_options;
  if (rrd_graph_options==null) {
    this.rrd_graph_options=new Object(); // empty object, just not to be null
  } else {
    this.rrd_graph_options=rrd_graph_options;
  }
  this.selection_range=new rrdFlotSelection();

  this.createHTML();
  this.populateDS();
  this.populateRes();
  this.populateRRDcb();
  this.drawFlotGraph()

  if (this.rrdflot_defaults.graph_only==true) {
    this.cleanHTMLCruft();
  }
}


// ===============================================
// Create the HTML tags needed to host the graphs
rrdFlotMatrix.prototype.createHTML = function() {
  var rf_this=this; // use obj inside other functions

  var base_el=document.getElementById(this.html_id);

  this.ds_id=this.html_id+"_ds";
  this.res_id=this.html_id+"_res";
  this.rrd_cb_id=this.html_id+"_rrd_cb";
  this.graph_id=this.html_id+"_graph";
  this.scale_id=this.html_id+"_scale";
  this.legend_sel_id=this.html_id+"_legend_sel";

  // First clean up anything in the element
  while (base_el.lastChild!=null) base_el.removeChild(base_el.lastChild);

  // Now create the layout
  var external_table=document.createElement("Table");
  this.external_table=external_table;

  // DS rows: select DS
  var rowDS=external_table.insertRow(-1);
  var cellDS=rowDS.insertCell(-1);
  cellDS.colSpan=4
  cellDS.appendChild(document.createTextNode("Element:"));
  var forDS=document.createElement("Select");
  forDS.id=this.ds_id;
  forDS.onchange= function () {rf_this.callback_ds_changed();};
  cellDS.appendChild(forDS);

  // Header row: resulution select and DS selection title
  var rowHeader=external_table.insertRow(-1);
  var cellRes=rowHeader.insertCell(-1);
  cellRes.colSpan=3;
  cellRes.appendChild(document.createTextNode("Resolution:"));
  var forRes=document.createElement("Select");
  forRes.id=this.res_id;
  forRes.onchange= function () {rf_this.callback_res_changed();};
  cellRes.appendChild(forRes);

  var cellRRDTitle=rowHeader.insertCell(-1);
  cellRRDTitle.appendChild(document.createTextNode("Select RRDs to plot:"));

  // Graph row: main graph and DS selection block
  var rowGraph=external_table.insertRow(-1);
  var cellGraph=rowGraph.insertCell(-1);
  cellGraph.colSpan=3;
  var elGraph=document.createElement("Div");
  if(this.rrdflot_defaults.graph_width!=null) {
     elGraph.style.width=this.rrdflot_defaults.graph_width;
  } else {elGraph.style.width="500px";}
  if(this.rrdflot_defaults.graph_height!=null) {
     elGraph.style.height=this.rrdflot_defaults.graph_height;
  } else {elGraph.style.height="300px";}
  elGraph.id=this.graph_id;
  cellGraph.appendChild(elGraph);

  var cellRRDcb=rowGraph.insertCell(-1);
  cellRRDcb.vAlign="top";
  var formRRDcb=document.createElement("Form");
  formRRDcb.id=this.rrd_cb_id;
  formRRDcb.onchange= function () {rf_this.callback_rrd_cb_changed();};
  cellRRDcb.appendChild(formRRDcb);

  // Scale row: scaled down selection graph
  var rowScale=external_table.insertRow(-1);

  var cellScaleLegend=rowScale.insertCell(-1);
  cellScaleLegend.vAlign="top";
  cellScaleLegend.appendChild(document.createTextNode("Legend:"));
  cellScaleLegend.appendChild(document.createElement('br'));
  var forScaleLegend=document.createElement("Select");
  forScaleLegend.id=this.legend_sel_id;
  forScaleLegend.appendChild(new Option("Top","nw",this.rrdflot_defaults.legend=="Top",this.rrdflot_defaults.legend=="Top"));
  forScaleLegend.appendChild(new Option("Bottom","sw",this.rrdflot_defaults.legend=="Bottom",this.rrdflot_defaults.legend=="Bottom"));
  forScaleLegend.appendChild(new Option("TopRight","ne",this.rrdflot_defaults.legend=="TopRight",this.rrdflot_defaults.legend=="TopRight"));
  forScaleLegend.appendChild(new Option("BottomRight","se",this.rrdflot_defaults.legend=="BottomRight",this.rrdflot_defaults.legend=="BottomRight"));
  forScaleLegend.appendChild(new Option("None","None",this.rrdflot_defaults.legend=="None",this.rrdflot_defaults.legend=="None"));
  forScaleLegend.onchange= function () {rf_this.callback_legend_changed();};
  cellScaleLegend.appendChild(forScaleLegend);

  var cellScale=rowScale.insertCell(-1);
  cellScale.align="right";
  var elScale=document.createElement("Div");
  if(this.rrdflot_defaults.scale_width!=null) {
     elScale.style.width=this.rrdflot_defaults.scale_width;
  } else {elScale.style.width="250px";}
  if(this.rrdflot_defaults.scale_height!=null) {
     elScale.style.height=this.rrdflot_defaults.scale_height;
  } else {elScale.style.height="110px";}
  elScale.id=this.scale_id;
  cellScale.appendChild(elScale);
  
  var cellScaleReset=rowScale.insertCell(-1);
  cellScaleReset.vAlign="top";
  cellScaleReset.appendChild(document.createTextNode(" "));
  cellScaleReset.appendChild(document.createElement('br'));
  var elScaleReset=document.createElement("input");
  elScaleReset.type = "button";
  elScaleReset.value = "Reset selection";
  elScaleReset.onclick = function () {rf_this.callback_scale_reset();}
  cellScaleReset.appendChild(elScaleReset);


  base_el.appendChild(external_table);
};

// ===============================================
// Remove all HTMl elements but the graph
rrdFlotMatrix.prototype.cleanHTMLCruft = function() {
  var rf_this=this; // use obj inside other functions

  // delete 2 top and 1 bottom rows... graph is in the middle
  this.external_table.deleteRow(-1);
  this.external_table.deleteRow(0);
  this.external_table.deleteRow(0);

  var rrd_el=document.getElementById(this.rrd_cb_id);
  rrd_el.removeChild(rrd_el.lastChild);
}

// ======================================
// Populate DSs, RRA and RRD info
rrdFlotMatrix.prototype.populateDS = function() {
  var form_el=document.getElementById(this.ds_id);

  // First clean up anything in the element
  while (form_el.lastChild!=null) form_el.removeChild(form_el.lastChild);

  for (i in this.ds_list) {
    var ds=this.ds_list[i];
    form_el.appendChild(new Option(ds[1],ds[0]));
  }
};

rrdFlotMatrix.prototype.populateRes = function() {
  var form_el=document.getElementById(this.res_id);

  // First clean up anything in the element
  while (form_el.lastChild!=null) form_el.removeChild(form_el.lastChild);

  var rrd_file=this.rrd_files[0][1]; // get the first one... they are all the same
  // now populate with RRA info
  var nrRRAs=rrd_file.getNrRRAs();
  for (var i=0; i<nrRRAs; i++) {
    var rra=rrd_file.getRRAInfo(i);
    var step=rra.getStep();
    var rows=rra.getNrRows();
    var period=step*rows;
    var rra_label=rfs_format_time(step)+" ("+rfs_format_time(period)+" total)";
    if (this.rrdflot_defaults.multi_rra) rra_label+=" "+rra.getCFName();
    form_el.appendChild(new Option(rra_label,i));
  }
  if(this.rrdflot_defaults.use_rra) {form_el.selectedIndex = this.rrdflot_defaults.rra;}
};

rrdFlotMatrix.prototype.populateRRDcb = function() {
  var rf_this=this; // use obj inside other functions
  var form_el=document.getElementById(this.rrd_cb_id);
 
  //Create a table within a table to arrange
  // checkbuttons into two or more columns
  var table_el=document.createElement("Table");
  var row_el=table_el.insertRow(-1);
  row_el.vAlign="top";
  var cell_el=null; // will define later

  if (this.rrdflot_defaults.num_cb_rows==null) {
     this.rrdflot_defaults.num_cb_rows=12; 
  }
  // now populate with RRD info
  var nrRRDs=this.rrd_files.length;
  var elem_group_number = 0;
 
  for (var i=0; i<nrRRDs; i++) {

    if ((i%this.rrdflot_defaults.num_cb_rows)==0) { // one column every x RRDs
      if(this.rrdflot_defaults.use_element_buttons) {
        cell_el=row_el.insertCell(-1); //make next element column 
        if(nrRRDs>this.rrdflot_defaults.num_cb_rows) { //if only one column, no need for a button
          elem_group_number = (i/this.rrdflot_defaults.num_cb_rows)+1;
          var elGroupSelect = document.createElement("input");
          elGroupSelect.type = "button";
          elGroupSelect.value = "Group "+elem_group_number;
          elGroupSelect.onclick = (function(e) { //lambda function!!
             return function() {rf_this.callback_elem_group_changed(e);};})(elem_group_number);

          cell_el.appendChild(elGroupSelect);
          cell_el.appendChild(document.createElement('br')); //add space between the two
        }
      } else {
         //just make next element column
         cell_el=row_el.insertCell(-1); 
      }
    }

    var rrd_el=this.rrd_files[i];
    var rrd_file=rrd_el[1];
    var name=rrd_el[0];
    var title=name;
 
    if(this.rrdflot_defaults.use_checked_RRDs) {
       if(this.rrdflot_defaults.checked_RRDs.length==0) {
          var checked=(i==0); // only first checked by default
       } else{checked=false;}
    } else {var checked=(i==0);}
    if (this.rrd_graph_options[name]!=null) {
      var rgo=this.rrd_graph_options[name];
      if (rgo['title']!=null) {
	// if the user provided the title, use it
	title=rgo['title'];
      } else if (rgo['label']!=null) {
	// use label as a second choiceit
	title=rgo['label'];
      } // else leave the rrd name
      if(this.rrdflot_defaults.use_checked_RRDs) {
         if(this.rrdflot_defaults.checked_RRDs.length==0) {
           // if the user provided the title, use it
           checked=rgo['checked'];
         }
      } else {
         if (rgo['checked']!=null) {
            checked=rgo['checked']; 
         }
      }
    }
    if(this.rrdflot_defaults.use_checked_RRDs) {
       if(this.rrdflot_defaults.checked_RRDs==null) {continue;}
       for(var j=0;j<this.rrdflot_defaults.checked_RRDs.length;j++){
             if (name==this.rrdflot_defaults.checked_RRDs[j]) {checked=true;}
       }
    }
    var cb_el = document.createElement("input");
    cb_el.type = "checkbox";
    cb_el.name = "rrd";
    cb_el.value = i;
    cb_el.checked = cb_el.defaultChecked = checked;
    cell_el.appendChild(cb_el);
    cell_el.appendChild(document.createTextNode(title));
    cell_el.appendChild(document.createElement('br'));
  }
  form_el.appendChild(table_el);
};

// ======================================
// 
rrdFlotMatrix.prototype.drawFlotGraph = function() {
  // DS
  var oSelect=document.getElementById(this.ds_id);
  var ds_id=oSelect.options[oSelect.selectedIndex].value;

  // Res contains the RRA idx
  oSelect=document.getElementById(this.res_id);
  var rra_idx=Number(oSelect.options[oSelect.selectedIndex].value);

  selected_rra=rra_idx;
  if(this.rrdflot_defaults.use_rra) {
    oSelect.options[oSelect.selectedIndex].value = this.rrdflot_defaults.rra;
    rra_idx = this.rrdflot_defaults.rra;
  }

  // Extract ds info ... to be finished
  var ds_positive_stack=null;

  var std_colors=["#00ff00","#00ffff","#0000ff","#ff00ff",
		  "#808080","#ff0000","#ffff00","#e66266",
		  "#33cccc","#fff8a9","#ccffff","#a57e81",
		  "#7bea81","#8d4dff","#ffcc99","#000000"];

  // now get the list of selected RRDs
  var rrd_list=[];
  var rrd_colors=[];
  var oCB=document.getElementById(this.rrd_cb_id);
  var nrRRDs=oCB.rrd.length;
  if (oCB.rrd.length>0) {
    for (var i=0; i<oCB.rrd.length; i++) {
      if (oCB.rrd[i].checked==true) {
	//var rrd_idx=Number(oCB.rrd[i].value);
	rrd_list.push(this.rrd_files[i]);
	color=std_colors[i%std_colors.length];
	if ((i/std_colors.length)>=1) {
	  // wraparound, change them a little
	  idiv=Math.floor(i/std_colors.length);
	  c1=parseInt(color[1]+color[2],16);
	  c2=parseInt(color[3]+color[4],16);
	  c3=parseInt(color[5]+color[6],16);
	  m1=Math.floor((c1-128)/Math.sqrt(idiv+1))+128;
	  m2=Math.floor((c2-128)/Math.sqrt(idiv+1))+128;
	  m3=Math.floor((c3-128)/Math.sqrt(idiv+1))+128;
	  if (m1>15) s1=(m1).toString(16); else s1="0"+(m1).toString(16);
	  if (m2>15) s2=(m2).toString(16); else s2="0"+(m2).toString(16);
	  if (m3>15) s3=(m3).toString(16); else s3="0"+(m3).toString(16);
	  color="#"+s1+s2+s3;
	}
        rrd_colors.push(color);
      }
    }
  } else { // single element is not treated as an array
    if (oCB.rrd.checked==true) {
      // no sense trying to stack a single element
      rrd_list.push(this.rrd_files[0]);
      rrd_colors.push(std_colors[0]);
    }
  }
  
  // then extract RRA data about those DSs... to be finished
  var flot_obj=rrdRRAMultiStackFlotObj(rrd_list,rra_idx,ds_id);

  // fix the colors, based on the position in the RRD
  for (var i=0; i<flot_obj.data.length; i++) {
    var name=flot_obj.data[i].label; // at this point, label is the rrd_name
    var color=rrd_colors[flot_obj.data.length-i-1]; // stack inverts colors
    var lines=null;
    if (this.rrd_graph_options[name]!=null) {
      var dgo=this.rrd_graph_options[name];
      if (dgo['color']!=null) {
	color=dgo['color'];
      }
      if (dgo['label']!=null) {
	// if the user provided the label, use it
	flot_obj.data[i].label=dgo['label'];
      } else  if (dgo['title']!=null) {
	// use title as a second choice 
	flot_obj.data[i].label=dgo['title'];
      } // else use the rrd name
      if (dgo['lines']!=null) {
	// if the user provided the label, use it
	flot_obj.data[i].lines=dgo['lines'];
      }
    }
    if (lines==null) {
	flot_obj.data[i].lines= { show:true, fill: true, fillColor:color };
    }
    flot_obj.data[i].color=color;
  }

  // finally do the real plotting
  this.bindFlotGraph(flot_obj);
};

// ======================================
// Bind the graphs to the HTML tags
rrdFlotMatrix.prototype.bindFlotGraph = function(flot_obj) {
  var rf_this=this; // use obj inside other functions

  // Legend
  var oSelect=document.getElementById(this.legend_sel_id);
  var legend_id=oSelect.options[oSelect.selectedIndex].value;
  var graph_jq_id="#"+this.graph_id;
  var scale_jq_id="#"+this.scale_id;

  var graph_options = {
    legend: {show:false, position:"nw",noColumns:3},
    lines: {show:true},
    xaxis: { mode: "time" },
    yaxis: { autoscaleMargin: 0.20},
    selection: { mode: "x" },
    tooltip: true,
    tooltipOpts: { content: "<h4>%s</h4> Value: %y.3" },
    grid: { hoverable: true },
  };
  
  if (legend_id=="None") {
    // do nothing
  } else {
    graph_options.legend.show=true;
    graph_options.legend.position=legend_id;
  }

  if (this.graph_options!=null) {
    graph_options=populateGraphOptions(graph_options,this.graph_options);
  }

  if (graph_options.tooltip==false) {
    // avoid the need for the caller specify both
    graph_options.grid.hoverable=false;
  }


  if (this.selection_range.isSet()) {
    var selection_range=this.selection_range.getFlotRanges();
    if(this.rrdflot_defaults.use_windows) {
       graph_options.xaxis.min = this.rrdflot_defaults.window_min;  
       graph_options.xaxis.max = this.rrdflot_defaults.window_max;  
    } else {
    graph_options.xaxis.min=selection_range.xaxis.from;
    graph_options.xaxis.max=selection_range.xaxis.to;
    }
  } else if(this.rrdflot_defaults.use_windows) {
    graph_options.xaxis.min = this.rrdflot_defaults.window_min;  
    graph_options.xaxis.max = this.rrdflot_defaults.window_max;  
  } else {
    graph_options.xaxis.min=flot_obj.min;
    graph_options.xaxis.max=flot_obj.max;
  }

  var scale_options = {
    legend: {show:false},
    lines: {show:true},
    xaxis: { mode: "time", min:flot_obj.min, max:flot_obj.max },
    selection: { mode: "x" },
  };
    
  var flot_data=flot_obj.data;

  var graph_data=this.selection_range.trim_flot_data(flot_data);
  var scale_data=flot_data;

  this.graph = $.plot($(graph_jq_id), graph_data, graph_options);
  this.scale = $.plot($(scale_jq_id), scale_data, scale_options);

  if(this.rrdflot_defaults.use_windows) {
    ranges = {};
    ranges.xaxis = [];
    ranges.xaxis.from = this.rrdflot_defaults.window_min;
    ranges.xaxis.to = this.rrdflot_defaults.window_max;
    rf_this.scale.setSelection(ranges,true);
    window_min = ranges.xaxis.from;
    window_max = ranges.xaxis.to;
  }

  if (this.selection_range.isSet()) {
    this.scale.setSelection(this.selection_range.getFlotRanges(),true); //don't fire event, no need
  }

  // now connect the two    
  $(graph_jq_id).bind("plotselected", function (event, ranges) {
      // do the zooming
      rf_this.selection_range.setFromFlotRanges(ranges);
      graph_options.xaxis.min=ranges.xaxis.from;
      graph_options.xaxis.max=ranges.xaxis.to;
      window_min = ranges.xaxis.from;
      window_max = ranges.xaxis.to;
      rf_this.graph = $.plot($(graph_jq_id), rf_this.selection_range.trim_flot_data(flot_data), graph_options);
      
      // don't fire event on the scale to prevent eternal loop
      rf_this.scale.setSelection(ranges, true);
  });
    
  $(scale_jq_id).bind("plotselected", function (event, ranges) {
      rf_this.graph.setSelection(ranges);
  });

  // only the scale has a selection
  // so when that is cleared, redraw also the graph
  $(scale_jq_id).bind("plotunselected", function() {
      rf_this.selection_range.reset();
      graph_options.xaxis.min=flot_obj.min;
      graph_options.xaxis.max=flot_obj.max;
      rf_this.graph = $.plot($(graph_jq_id), rf_this.selection_range.trim_flot_data(flot_data), graph_options);
  });
};

// callback functions that are called when one of the selections changes
rrdFlotMatrix.prototype.callback_res_changed = function() {
  this.drawFlotGraph();
};

rrdFlotMatrix.prototype.callback_ds_changed = function() {
  this.drawFlotGraph();
};

rrdFlotMatrix.prototype.callback_rrd_cb_changed = function() {
  this.drawFlotGraph();
};

rrdFlotMatrix.prototype.callback_scale_reset = function() {
  this.scale.clearSelection();
};

rrdFlotMatrix.prototype.callback_legend_changed = function() {
  this.drawFlotGraph();
};

rrdFlotMatrix.prototype.callback_elem_group_changed = function(num) { 

  var oCB=document.getElementById(this.rrd_cb_id);
  var nrRRDs=oCB.rrd.length;
  if (oCB.rrd.length>0) {
    for (var i=0; i<oCB.rrd.length; i++) {
      if(Math.floor(i/this.rrdflot_defaults.num_cb_rows)==num-1) {oCB.rrd[i].checked=true; }
      else {oCB.rrd[i].checked=false;}
    }
  }
  this.drawFlotGraph()
};

function populateGraphOptions(me, other) {
  for (e in other) {
    if (me[e]!=undefined) {
      if (Object.prototype.toString.call(other[e])=="[object Object]") {
	me[e]=populateGraphOptions(me[e],other[e]);
      } else {
	me[e]=other[e];
      }
    } else {
      /// create a new one
      if (Object.prototype.toString.call(other[e])=="[object Object]") {
	// This will do a deep copy
	me[e]=populateGraphOptions({},other[e]);
      } else {
	me[e]=other[e];
      }
    }
  }
  return me;
};
/*
 * Filter classes for rrdFile
 * They implement the same interface, but changing the content
 * 
 * Part of the javascriptRRD package
 * Copyright (c) 2009 Frank Wuerthwein, fkw@ucsd.edu
 *
 * Original repository: http://javascriptrrd.sourceforge.net/
 * 
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 *
 */

/*
 * All filter classes must implement the following interface:
 *     getMinStep()
 *     getLastUpdate()
 *     getNrRRAs()
 *     getRRAInfo(rra_idx)
 *     getFilterRRA(rra_idx)
 *     getName()
 *
 * Where getFilterRRA returns an object implementing the following interface:
 *     getIdx()
 *     getNrRows()
 *     getStep()
 *     getCFName()
 *     getEl(row_idx)
 *     getElFast(row_idx)
 *
 */


// ================================================================
// Filter out a subset of DSs (identified either by idx or by name)

// Internal
function RRDRRAFilterDS(rrd_rra,ds_list) {
  this.rrd_rra=rrd_rra;
  this.ds_list=ds_list;
}
RRDRRAFilterDS.prototype.getIdx = function() {return this.rrd_rra.getIdx();}
RRDRRAFilterDS.prototype.getNrRows = function() {return this.rrd_rra.getNrRows();}
RRDRRAFilterDS.prototype.getNrDSs = function() {return this.ds_list.length;}
RRDRRAFilterDS.prototype.getStep = function() {return this.rrd_rra.getStep();}
RRDRRAFilterDS.prototype.getCFName = function() {return this.rrd_rra.getCFName();}
RRDRRAFilterDS.prototype.getEl = function(row_idx,ds_idx) {
  if ((ds_idx>=0) && (ds_idx<this.ds_list.length)) {
    var real_ds_idx=this.ds_list[ds_idx].real_ds_idx;
    return this.rrd_rra.getEl(row_idx,real_ds_idx);
  } else {
    throw RangeError("DS idx ("+ ds_idx +") out of range [0-" + this.ds_list.length +").");
  }	
}
RRDRRAFilterDS.prototype.getElFast = function(row_idx,ds_idx) {
  if ((ds_idx>=0) && (ds_idx<this.ds_list.length)) {
    var real_ds_idx=this.ds_list[ds_idx].real_ds_idx;
    return this.rrd_rra.getElFast(row_idx,real_ds_idx);
  } else {
    throw RangeError("DS idx ("+ ds_idx +") out of range [0-" + this.ds_list.length +").");
  }	
}

// --------------------------------------------------
// Public
// NOTE: This class is deprecated, use RRDFilterOp instead
function RRDFilterDS(rrd_file,ds_id_list) {
  this.rrd_file=rrd_file;
  this.ds_list=[];
  for (var i=0; i<ds_id_list.length; i++) {
    var org_ds=rrd_file.getDS(ds_id_list[i]);
    // must create a new copy, as the index has changed
    var new_ds=new RRDDS(org_ds.rrd_data,org_ds.rrd_data_idx,i);
    // then extend it to include the real RRD index
    new_ds.real_ds_idx=org_ds.my_idx;

    this.ds_list.push(new_ds);
  }
}
RRDFilterDS.prototype.getMinStep = function() {return this.rrd_file.getMinStep();}
RRDFilterDS.prototype.getLastUpdate = function() {return this.rrd_file.getLastUpdate();}

RRDFilterDS.prototype.getNrDSs = function() {return this.ds_list.length;}
RRDFilterDS.prototype.getDSNames = function() {
  var ds_names=[];
  for (var i=0; i<this.ds_list.length; i++) {
    ds_names.push(ds_list[i].getName());
  }
  return ds_names;
}
RRDFilterDS.prototype.getDS = function(id) {
  if (typeof id == "number") {
    return this.getDSbyIdx(id);
  } else {
    return this.getDSbyName(id);
  }
}

// INTERNAL: Do not call directly
RRDFilterDS.prototype.getDSbyIdx = function(idx) {
  if ((idx>=0) && (idx<this.ds_list.length)) {
    return this.ds_list[idx];
  } else {
    throw RangeError("DS idx ("+ idx +") out of range [0-" + this.ds_list.length +").");
  }	
}

// INTERNAL: Do not call directly
RRDFilterDS.prototype.getDSbyName = function(name) {
  for (var idx=0; idx<this.ds_list.length; idx++) {
    var ds=this.ds_list[idx];
    var ds_name=ds.getName()
    if (ds_name==name)
      return ds;
  }
  throw RangeError("DS name "+ name +" unknown.");
}

RRDFilterDS.prototype.getNrRRAs = function() {return this.rrd_file.getNrRRAs();}
RRDFilterDS.prototype.getRRAInfo = function(idx) {return this.rrd_file.getRRAInfo(idx);}
RRDFilterDS.prototype.getRRA = function(idx) {return new RRDRRAFilterDS(this.rrd_file.getRRA(idx),this.ds_list);}

// ================================================================
// Filter out by using a user provided filter object
// The object must implement the following interface
//   getName()               - Symbolic name give to this function
//   getDSName()             - list of DSs used in computing the result (names or indexes)
//   computeResult(val_list) - val_list contains the values of the requested DSs (in the same order) 

// If the element is a string or a number, it will just use that ds

// Example class that implements the interface:
//   function DoNothing(ds_name) { //Leaves the DS alone.
//     this.getName = function() {return ds_name;}
//     this.getDSNames = function() {return [ds_name];}
//     this.computeResult = function(val_list) {return val_list[0];}
//   }
//   function sumDS(ds1_name,ds2_name) { //Sums the two DSs.
//     this.getName = function() {return ds1_name+"+"+ds2_name;}
//     this.getDSNames = function() {return [ds1_name,ds2_name];}
//     this.computeResult = function(val_list) {return val_list[0]+val_list[1];}
//   }
//
// So to add a summed DS of your 1st and second DS: 
// var ds0_name = rrd_data.getDS(0).getName();
// var ds1_name = rrd_data.getDS(1).getName();
// rrd_data = new RRDFilterOp(rrd_data, [new DoNothing(ds0_name), 
//                DoNothing(ds1_name), sumDS(ds0_name, ds1_name]);
//
// You get the same resoult with
// rrd_data = new RRDFilterOp(rrd_data, [ds0_name,1,new sumDS(ds0_name, ds1_name)]);
////////////////////////////////////////////////////////////////////

// this implements the conceptual NoNothing above
function RRDFltOpIdent(ds_name) {
     this.getName = function() {return ds_name;}
     this.getDSNames = function() {return [ds_name];}
     this.computeResult = function(val_list) {return val_list[0];}
}

// similar to the above, but extracts the name from the index
// requires two parametes, since it it need context
function RRDFltOpIdentId(rrd_data,id) {
     this.ds_name=rrd_data.getDS(id).getName();
     this.getName = function() {return this.ds_name;}
     this.getDSNames = function() {return [this.ds_name];}
     this.computeResult = function(val_list) {return val_list[0];}
}

//Private
function RRDDSFilterOp(rrd_file,op_obj,my_idx) {
  this.rrd_file=rrd_file;
  this.op_obj=op_obj;
  this.my_idx=my_idx;
  var ds_names=op_obj.getDSNames();
  var ds_idx_list=[];
  for (var i=0; i<ds_names.length; i++) {
    ds_idx_list.push(rrd_file.getDS(ds_names[i]).getIdx());
  }
  this.ds_idx_list=ds_idx_list;
}
RRDDSFilterOp.prototype.getIdx = function() {return this.my_idx;}
RRDDSFilterOp.prototype.getName = function() {return this.op_obj.getName();}

RRDDSFilterOp.prototype.getType = function() {return "function";}
RRDDSFilterOp.prototype.getMin = function() {return undefined;}
RRDDSFilterOp.prototype.getMax = function() {return undefined;}

// These are new to RRDDSFilterOp
RRDDSFilterOp.prototype.getRealDSList = function() { return this.ds_idx_list;}
RRDDSFilterOp.prototype.computeResult = function(val_list) {return this.op_obj.computeResult(val_list);}

// ------ --------------------------------------------
//Private
function RRDRRAFilterOp(rrd_rra,ds_list) {
  this.rrd_rra=rrd_rra;
  this.ds_list=ds_list;
}
RRDRRAFilterOp.prototype.getIdx = function() {return this.rrd_rra.getIdx();}
RRDRRAFilterOp.prototype.getNrRows = function() {return this.rrd_rra.getNrRows();}
RRDRRAFilterOp.prototype.getNrDSs = function() {return this.ds_list.length;}
RRDRRAFilterOp.prototype.getStep = function() {return this.rrd_rra.getStep();}
RRDRRAFilterOp.prototype.getCFName = function() {return this.rrd_rra.getCFName();}
RRDRRAFilterOp.prototype.getEl = function(row_idx,ds_idx) {
  if ((ds_idx>=0) && (ds_idx<this.ds_list.length)) {
    var ds_idx_list=this.ds_list[ds_idx].getRealDSList();
    var val_list=[];
    for (var i=0; i<ds_idx_list.length; i++) {
      val_list.push(this.rrd_rra.getEl(row_idx,ds_idx_list[i]));
    }
    return this.ds_list[ds_idx].computeResult(val_list);
  } else {
    throw RangeError("DS idx ("+ ds_idx +") out of range [0-" + this.ds_list.length +").");
  }	
}
RRDRRAFilterOp.prototype.getElFast = function(row_idx,ds_idx) {
  if ((ds_idx>=0) && (ds_idx<this.ds_list.length)) {
    var ds_idx_list=this.ds_list[ds_idx].getRealDSList();
    var val_list=[];
    for (var i=0; i<ds_idx_list.length; i++) {
      val_list.push(this.rrd_rra.getEl(row_idx,ds_idx_list[i]));
    }
    return this.ds_list[ds_idx].computeResult(val_list);
  } else {
    throw RangeError("DS idx ("+ ds_idx +") out of range [0-" + this.ds_list.length +").");
  }	
}

// --------------------------------------------------
//Public
function RRDFilterOp(rrd_file,op_obj_list) {
  this.rrd_file=rrd_file;
  this.ds_list=[];
  for (i in op_obj_list) {
    var el=op_obj_list[i];
    var outel=null;
    if (typeof(el)=="string") {outel=new RRDFltOpIdent(el);}
    else if (typeof(el)=="number") {outel=new RRDFltOpIdentId(this.rrd_file,el);}
    else {outel=el;}
    this.ds_list.push(new RRDDSFilterOp(rrd_file,outel,i));
  }
}
RRDFilterOp.prototype.getMinStep = function() {return this.rrd_file.getMinStep();}
RRDFilterOp.prototype.getLastUpdate = function() {return this.rrd_file.getLastUpdate();}
RRDFilterOp.prototype.getNrDSs = function() {return this.ds_list.length;}
RRDFilterOp.prototype.getDSNames = function() {
  var ds_names=[];
  for (var i=0; i<this.ds_list.length; i++) {
    ds_names.push(ds_list[i].getName());
  }
  return ds_names;
}
RRDFilterOp.prototype.getDS = function(id) {
  if (typeof id == "number") {
    return this.getDSbyIdx(id);
  } else {
    return this.getDSbyName(id);
  }
}

// INTERNAL: Do not call directly
RRDFilterOp.prototype.getDSbyIdx = function(idx) {
  if ((idx>=0) && (idx<this.ds_list.length)) {
    return this.ds_list[idx];
  } else {
    throw RangeError("DS idx ("+ idx +") out of range [0-" + this.ds_list.length +").");
  }	
}

// INTERNAL: Do not call directly
RRDFilterOp.prototype.getDSbyName = function(name) {
  for (var idx=0; idx<this.ds_list.length; idx++) {
    var ds=this.ds_list[idx];
    var ds_name=ds.getName()
    if (ds_name==name)
      return ds;
  }
  throw RangeError("DS name "+ name +" unknown.");
}

RRDFilterOp.prototype.getNrRRAs = function() {return this.rrd_file.getNrRRAs();}
RRDFilterOp.prototype.getRRAInfo = function(idx) {return this.rrd_file.getRRAInfo(idx);}
RRDFilterOp.prototype.getRRA = function(idx) {return new RRDRRAFilterOp(this.rrd_file.getRRA(idx),this.ds_list);}

// ================================================================
// NOTE: This function is archaic, and will likely be deprecated in future releases
//
// Shift RRAs in rra_list by the integer shift_int (in seconds).
// Only change is getLastUpdate - this takes care of everything.
// Example: To shift the first three 3 RRAs in the file by one hour, 
//         rrd_data = new RRAFilterShift(rra_data, 3600, [0,1,2]);

function RRAFilterShift(rrd_file, shift_int, rra_list) {
  this.rrd_file = rrd_file;
  this.shift_int = shift_int;
  this.rra_list = rra_list;
  this.shift_in_seconds = this.shift_int*3600; //number of steps needed to move 1 hour
}
RRAFilterShift.prototype.getMinStep = function() {return this.rrd_file.getMinStep();}
RRAFilterShift.prototype.getLastUpdate = function() {return this.rrd_file.getLastUpdate()+this.shift_in_seconds;}
RRAFilterShift.prototype.getNrDSs = function() {return this.rrd_file.getNrDSs();}
RRAFilterShift.prototype.getDSNames = function() {return this.rrd_file.getDSNames();}
RRAFilterShift.prototype.getDS = function(id) {return this.rrd_file.getDS(id);}
RRAFilterShift.prototype.getNrRRAs = function() {return this.rra_list.length;}
RRAFilterShift.prototype.getRRAInfo = function(idx) {return this.rrd_file.getRRAInfo(idx);}
RRAFilterShift.prototype.getRRA = function(idx) {return this.rrd_file.getRRA(idx);}

// ================================================================
// Filter RRAs by using a user provided filter object
// The object must implement the following interface
//   getIdx()               - Index of RRA to use
//   getStep()              - new step size (return null to use step size of RRA specified by getIdx() 

// If a number is passed, it implies to just use the RRA as it is
// If an array is passed, it is assumed to be [rra_id,new_step_in_seconds] 
//    and a RRDRRAFltAvgOpNewStep object will be instantiated internally

/* Example classes that implements the interface:
*
*      //This RRA Filter object leaves the original RRA unchanged.
*
*      function RRADoNothing(rra_idx) {
*         this.getIdx = function() {return rra_idx;}
*         this.getStep = function() {return null;} 
*      }
*      
*      // This Filter creates a new RRA with a different step size 
*      // based on another RRA, whose data the new RRA averages. 
*      // rra_idx should be index of RRA with largest step size 
*      // that doesn't exceed new step size.  
*
*      function RRA_Avg(rra_idx,new_step_in_seconds) {
*         this.getIdx = function() {return rra_idx;}
*         this.getStep = function() {return new_step_in_seconds;}
*      }
*      //For example, if you have two RRAs, one with a 5 second step,
*      //and another with a 60 second step, and you'd like a 30 second step,
*      //rrd_data = new RRDRRAFilterAvg(rrd_data,[new RRADoNothing(0), new RRDDoNothing(1),new RRA_Avg(1,30)];)
*/

// Users can use this one directly for simple use cases
// It is equivalent to RRADoNothing and RRA_Avg above
function RRDRRAFltAvgOpNewStep(rra_idx,new_step_in_seconds) {
  this.getIdx = function() {return rra_idx;}
  this.getStep = function() {return new_step_in_seconds;}
}


//Private Function
function RRAInfoFilterAvg(rrd_file, rra, op_obj, idx) {
  this.rrd_file = rrd_file;
  this.op_obj = op_obj;
  this.base_rra = rrd_file.getRRA(this.op_obj.getIdx());
  this.rra = rra;
  this.idx = idx;
  var scaler = 1;
  if (this.op_obj.getStep()!=null) {scaler = this.op_obj.getStep()/this.base_rra.getStep();}
  this.scaler = scaler;
}
RRAInfoFilterAvg.prototype.getIdx = function() {return this.idx;}
RRAInfoFilterAvg.prototype.getNrRows = function() {return this.rra.getNrRows();} //draw info from RRAFilterAvg
RRAInfoFilterAvg.prototype.getStep = function() {return this.rra.getStep();}
RRAInfoFilterAvg.prototype.getCFName = function() {return this.rra.getCFName();}
RRAInfoFilterAvg.prototype.getPdpPerRow = function() {return this.rrd_file.getRRAInfo(this.op_obj.getIdx()).getPdpPerRow()*this.scaler;}

//---------------------------------------------------------------------------
//Private Function
function RRAFilterAvg(rrd_file, op_obj) {
  this.rrd_file = rrd_file;
  this.op_obj = op_obj;
  this.base_rra = rrd_file.getRRA(op_obj.getIdx());
  var scaler=1; 
  if (op_obj.getStep()!=null) {scaler = op_obj.getStep()/this.base_rra.getStep();}
  this.scaler = Math.floor(scaler);
  //document.write(this.scaler+",");
}
RRAFilterAvg.prototype.getIdx = function() {return this.op_obj.getIdx();}
RRAFilterAvg.prototype.getCFName = function() {return this.base_rra.getCFName();}
RRAFilterAvg.prototype.getNrRows = function() {return Math.floor(this.base_rra.getNrRows()/this.scaler);}
RRAFilterAvg.prototype.getNrDSs = function() {return this.base_rra.getNrDSs();}
RRAFilterAvg.prototype.getStep = function() {
   if(this.op_obj.getStep()!=null) {
      return this.op_obj.getStep(); 
   } else { return this.base_rra.getStep();}
}
RRAFilterAvg.prototype.getEl = function(row,ds) {
   var sum=0;
   for(var i=0;i<this.scaler;i++) {
      sum += this.base_rra.getEl((this.scaler*row)+i,ds);
   }
   return sum/this.scaler;
}
RRAFilterAvg.prototype.getElFast = function(row,ds) {
   var sum=0;
   for(var i=0;i<this.scaler;i++) {
      sum += this.base_rra.getElFast((this.scaler*row)+i,ds);
   }
   return sum/this.scaler;
}

//----------------------------------------------------------------------------
//Public function - use this one for RRA averaging
function RRDRRAFilterAvg(rrd_file, op_obj_list) {
  this.rrd_file = rrd_file;
  this.op_obj_list = new Array();
  this.rra_list=[];
  for (var i in op_obj_list) {
    var el=op_obj_list[i];
    var outel=null;
    if (Object.prototype.toString.call(el)=="[object Number]") {outel=new RRDRRAFltAvgOpNewStep(el,null);}
    else if (Object.prototype.toString.call(el)=="[object Array]") {outel=new RRDRRAFltAvgOpNewStep(el[0],el[1]);}
    else {outel=el;}
    this.op_obj_list.push(outel);
    this.rra_list.push(new RRAFilterAvg(rrd_file,outel));
  }
}
RRDRRAFilterAvg.prototype.getMinStep = function() {return this.rrd_file.getMinStep();} //other RRA steps change, not min
RRDRRAFilterAvg.prototype.getLastUpdate = function() {return this.rrd_file.getLastUpdate();}
RRDRRAFilterAvg.prototype.getNrDSs = function() {return this.rrd_file.getNrDSs();} //DSs unchanged
RRDRRAFilterAvg.prototype.getDSNames = function() {return this.rrd_file.getDSNames();}
RRDRRAFilterAvg.prototype.getDS = function(id) {return this.rrd_file.getDS(id);}
RRDRRAFilterAvg.prototype.getNrRRAs = function() {return this.rra_list.length;} 
RRDRRAFilterAvg.prototype.getRRAInfo = function(idx) {
  if ((idx>=0) && (idx<this.rra_list.length)) {
    return new RRAInfoFilterAvg(this.rrd_file, this.rra_list[idx],this.op_obj_list[idx],idx); 
  } else {return this.rrd_file.getRRAInfo(0);}
}
RRDRRAFilterAvg.prototype.getRRA = function(idx) {
  if ((idx>=0) && (idx<this.rra_list.length)) {
    return this.rra_list[idx];
  }
}


/*
 * Combine multiple rrdFiles into one object
 * It implements the same interface, but changing the content
 * 
 * Part of the javascriptRRD package
 * Copyright (c) 2010 Igor Sfiligoi, isfiligoi@ucsd.edu
 *
 * Original repository: http://javascriptrrd.sourceforge.net/
 * 
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 *
 */

// ============================================================
// RRD RRA handling class
function RRDRRASum(rra_list,offset_list,treat_undefined_as_zero) {
  this.rra_list=rra_list;
  this.offset_list=offset_list;
  this.treat_undefined_as_zero=treat_undefined_as_zero;
  this.row_cnt= this.rra_list[0].getNrRows();
}

RRDRRASum.prototype.getIdx = function() {
  return this.rra_list[0].getIdx();
}

// Get number of rows/columns
RRDRRASum.prototype.getNrRows = function() {
  return this.row_cnt;
}
RRDRRASum.prototype.getNrDSs = function() {
  return this.rra_list[0].getNrDSs();
}

// Get RRA step (expressed in seconds)
RRDRRASum.prototype.getStep = function() {
  return this.rra_list[0].getStep();
}

// Get consolidation function name
RRDRRASum.prototype.getCFName = function() {
  return this.rra_list[0].getCFName();
}

RRDRRASum.prototype.getEl = function(row_idx,ds_idx) {
  var outSum=0.0;
  for (var i in this.rra_list) {
    var offset=this.offset_list[i];
    if ((row_idx+offset)<this.row_cnt) {
      var rra=this.rra_list[i];
      val=rra.getEl(row_idx+offset,ds_idx);
    } else {
      /* out of row range -> undefined*/
      val=undefined;
    }
    /* treat all undefines as 0 for now */
    if (val==undefined) {
      if (this.treat_undefined_as_zero) {
	val=0;
      } else {
	/* if even one element is undefined, the whole sum is undefined */
	outSum=undefined;
	break;
      }
    }
    outSum+=val;
  }
  return outSum;
}

// Low precision version of getEl
// Uses getFastDoubleAt
RRDRRASum.prototype.getElFast = function(row_idx,ds_idx) {
  var outSum=0.0;
  for (var i in this.rra_list) {
    var offset=this.offset_list[i];
    if ((row_id+offset)<this.row_cnt) {
      var rra=this.rra_list[i];
      val=rra.getElFast(row_idx+offset,ds_idx);
    } else {
      /* out of row range -> undefined*/
      val=undefined;
    }
    /* treat all undefines as 0 for now */
    if (val==undefined) {
      if (this.treat_undefined_as_zero) {
	val=0;
      } else {
	/* if even one element is undefined, the whole sum is undefined */
	outSum=undefined;
	break;
      }
    }
    outSum+=val;
  }
  return outSum;
}

/*** INTERNAL ** sort by lastupdate, descending ***/

function rrdFileSort(f1, f2) {
  return f2.getLastUpdate()-f1.getLastUpdate();
}

/*
 * Sum several RRDfiles together
 * They must all have the same DSes and the same RRAs
 */ 


/*
 * sumfile_options, if defined, must be an object containing any of these
 *   treat_undefined_as_zero
 *
 */

// For backwards comatibility, if sumfile_options is a boolean,
// it is interpreted like the "old treat_undefined_as_zero" argument

function RRDFileSum(file_list,sumfile_options) {
  if (sumfile_options==undefined) {
    sumfile_options={};
  } else if (typeof(sumfile_options)=="boolean") {
    sumfile_options={treat_undefined_as_zero:sumfile_options};
  }
  this.sumfile_options=sumfile_options;

  
  if (this.sumfile_options.treat_undefined_as_zero==undefined) {
    this.treat_undefined_as_zero=true;
   } else {
    this.treat_undefined_as_zero=this.sumfile_options.treat_undefined_as_zero;
  }
  this.file_list=file_list;
  this.file_list.sort();

  // ===================================
  // Start of user functions

  this.getMinStep = function() {
    return this.file_list[0].getMinStep();
  }
  this.getLastUpdate = function() {
    return this.file_list[0].getLastUpdate();
  }

  this.getNrDSs = function() {
    return this.file_list[0].getNrDSs();
  }

  this.getDSNames = function() {
    return this.file_list[0].getDSNames();
  }

  this.getDS = function(id) {
    return this.file_list[0].getDS(id);
  }

  this.getNrRRAs = function() {
    return this.file_list[0].getNrRRAs();
  }

  this.getRRAInfo = function(idx) {
    return this.file_list[0].getRRAInfo(idx);
  }

  this.getRRA = function(idx) {
    var rra_info=this.getRRAInfo(idx);
    var rra_step=rra_info.getStep();
    var realLastUpdate=undefined;

    var rra_list=new Array();
    var offset_list=new Array();
    for (var i in this.file_list) {
      file=file_list[i];
      fileLastUpdate=file.getLastUpdate();
      if (realLastUpdate!=undefined) {
	fileSkrew=Math.floor((realLastUpdate-fileLastUpdate)/rra_step);
      } else {
	fileSkrew=0;
	firstLastUpdate=fileLastUpdate;
      }
      offset_list.push(fileSkrew);
      fileRRA=file.getRRA(idx);
      rra_list.push(fileRRA);
    }

    return new RRDRRASum(rra_list,offset_list,this.treat_undefined_as_zero);
  }

}
/*
 * Async versions of the rrdFlot class
 * Part of the javascriptRRD package
 * Copyright (c) 2013 Igor Sfiligoi, isfiligoi@ucsd.edu
 *
 * Original repository: http://javascriptrrd.sourceforge.net/
 * 
 * MIT License [http://www.opensource.org/licenses/mit-license.php]
 *
 */

/*
 * Local dependencies:
 *  binaryXHR.js
 *  rrdFile.js and/or rrdMultiFile.js
 *  optionally rrdFilter.js
 *  rrdFlot.js and/or rrdFlotMatrix.js
 *
 * Those modules may have other requirements.
 *
 */


/*
 * customization_callback = function(obj)
 *  This function, if defined, is called after the data has been loaded 
 *    and before the rrdFlot object is instantiated
 *
 *  The object passed as the sole argument is guaranteed to have the following arguments
 *    obj.rrd_data
 *    obj.graph_options
 *    obj.ds_graph_options or obj.rrd_graph_options
 *    obj.rrdflot_defaults
 *    obj.ds_op_list
 *    obj.rra_op_list
 *
 *  The purpose of this callback is to give the caller the option of personalizing
 *    the Flot graph based on the content of the rrd_data
 *    
/* Internal helper function */
function rrdFlotAsyncCallback(bf,obj) {
  var i_rrd_data=undefined;
  if (bf.getLength()<1) {
    alert("File "+obj.url+" is empty (possibly loading failed)!");
    return 1;
  }
  try {
    i_rrd_data=new RRDFile(bf,obj.file_options);
  } catch(err) {
    alert("File "+obj.url+" is not a valid RRD archive!\n"+err);
  }
  if (i_rrd_data!=undefined) {
    if (obj.rrd_data!=null) delete obj.rrd_data;
    obj.rrd_data=i_rrd_data;
    obj.callback();
  }
}

/* Use url==null if you do not know the url yet */
function rrdFlotAsync(html_id, url, 
		      file_options,                                      // see rrdFile.js::RRDFile for documentation
		      graph_options, ds_graph_options, rrdflot_defaults, // see rrdFlot.js::rrdFlot for documentation of these
		      ds_op_list,                                        // if defined, see rrdFilter.js::RRDFilterOp for documentation
		      rra_op_list,                                       // if defined, see rrdFilter.js::RRDRRAFilterAvg for documentation
                      customization_callback                             // if defined, see above
		      ) {
  this.html_id=html_id;
  this.url=url;
  this.file_options=file_options;
  this.graph_options=graph_options;
  this.ds_graph_options=ds_graph_options;
  this.rrdflot_defaults=rrdflot_defaults;
  this.ds_op_list=ds_op_list;
  this.rra_op_list=rra_op_list;

  this.customization_callback=customization_callback;

  this.rrd_flot_obj=null;
  this.rrd_data=null;

  if (url!=null) {
    this.reload(url);
  }
}

rrdFlotAsync.prototype.reload = function(url) {
  this.url=url;
  try {
    FetchBinaryURLAsync(url,rrdFlotAsyncCallback,this);
  } catch (err) {
    alert("Failed loading "+url+"\n"+err);
  }
};

rrdFlotAsync.prototype.callback = function() {
  if (this.rrd_flot_obj!=null) delete this.rrd_flot_obj;

  if (this.customization_callback!=undefined) this.customization_callback(this);

  var irrd_data=this.rrd_data;
  if (this.ds_op_list!=undefined) irrd_data=new RRDFilterOp(irrd_data,this.ds_op_list);
  if (this.rra_op_list!=undefined) irrd_data=new RRDRRAFilterAvg(irrd_data,this.rra_op_list);
  this.rrd_flot_obj=new rrdFlot(this.html_id, irrd_data, this.graph_options, this.ds_graph_options, this.rrdflot_defaults);
};


// ================================================================================================================

/* Internal helper function */
function rrdFlotMultiAsyncCallback(bf,arr) {
  var obj=arr[0];
  var idx=arr[1];

  obj.files_loaded++; // increase this even if it fails later on, else we will never finish

  var i_rrd_data=undefined;
  if (bf.getLength()<1) {
    alert("File "+obj.url_list[idx]+" is empty (possibly loading failed)! You may get a parial result in the graph.");
  } else {
    try {
      i_rrd_data=new RRDFile(bf,obj.file_options);
    } catch(err) {
      alert("File "+obj.url_list[idx]+" is not a valid RRD archive! You may get a partial result in the graph.\n"+err);
    }
  }
  if (i_rrd_data!=undefined) {
    obj.loaded_data[idx]=i_rrd_data;
  }

  if (obj.files_loaded==obj.files_needed) {
    obj.callback();
  }
}

/* Another internal helper function */
function rrdFlotMultiAsyncReload(obj,url_list) {
  obj.files_needed=url_list.length;
  obj.url_list=url_list;
  delete obj.loaded_data;
  obj.loaded_data=[];
  obj.files_loaded=0;
  for (i in url_list) {
    try {
      FetchBinaryURLAsync(url_list[i],rrdFlotMultiAsyncCallback,[obj,i]);
    } catch (err) {
      alert("Failed loading "+url_list[i]+". You may get a partial result in the graph.\n"+err);
      obj.files_needed--;
    }
  }
};



/* Use url_list==null if you do not know the urls yet */
function rrdFlotSumAsync(html_id, url_list,
			 file_options,                                      // see rrdFile.js::RRDFile for documentation
			 sumfile_options,                                   // see rrdMultiFile.js::RRDFileSum for documentation
			 graph_options, ds_graph_options, rrdflot_defaults, // see rrdFlot.js::rrdFlot for documentation of these
			 ds_op_list,                                        // if defined, see rrdFilter.js::RRDFilterOp for documentation
			 rra_op_list,                                       // if defined, see rrdFilter.js::RRDRRAFilterAvg for documentation
			 customization_callback                             // if defined, see above
		      ) {
  this.html_id=html_id;
  this.url_list=url_list;
  this.file_options=file_options;
  this.sumfile_options=sumfile_options;
  this.graph_options=graph_options;
  this.ds_graph_options=ds_graph_options;
  this.rrdflot_defaults=rrdflot_defaults;
  this.ds_op_list=ds_op_list;
  this.rra_op_list=rra_op_list;

  this.customization_callback=customization_callback;

  this.rrd_flot_obj=null;
  this.rrd_data=null; //rrd_data will contain the sum of all the loaded data

  this.loaded_data=null;

  if (url_list!=null) {
    this.reload(url_list);
  }
}

rrdFlotSumAsync.prototype.reload = function(url_list) {rrdFlotMultiAsyncReload(this,url_list);}


rrdFlotSumAsync.prototype.callback = function() {
  if (this.rrd_flot_obj!=null) delete this.rrd_flot_obj;
  var real_data_arr=new Array();
  for (i in this.loaded_data) {
    // account for failed loaded urls
    var el=this.loaded_data[i];
    if (el!=undefined) real_data_arr.push(el);
  }
  var rrd_sum=new RRDFileSum(real_data_arr,this.sumfile_options);
  if (this.rrd_data!=null) delete this.rrd_data;
  this.rrd_data=rrd_sum;

  if (this.customization_callback!=undefined) this.customization_callback(this);

  rrd_sum=this.rrd_data; // customization_callback may have altered it
  if (this.ds_op_list!=undefined) rrd_sum=new RRDFilterOp(rrd_sum,this.ds_op_list);
  if (this.rra_op_list!=undefined) rrd_sum=new RRDRRAFilterAvg(rrd_sum,this.rra_op_list);
  this.rrd_flot_obj=new rrdFlot(this.html_id, rrd_sum, this.graph_options, this.ds_graph_options, this.rrdflot_defaults);
};

// ================================================================================================================

/* Use url_list==null if you do not know the urls yet */
function rrdFlotMatrixAsync(html_id, 
			    url_pair_list,                                     // see rrdFlotMatrix.js::rrdFlotMatrix for documentation
			    file_options,                                      // see rrdFile.js::RRDFile for documentation
			    ds_list,                                           // see rrdFlotMatrix.js::rrdFlotMatrix for documentation
			    graph_options, rrd_graph_options, rrdflot_defaults, // see rrdFlotMatrix.js::rrdFlotMatrix for documentation of these
			    ds_op_list,                                        // if defined, see rrdFilter.js::RRDFilterOp for documentation
			    rra_op_list,                                       // if defined, see rrdFilter.js::RRDRRAFilterAvg for documentation
			    customization_callback                             // if defined, see above
			    ) {
  this.html_id=html_id;
  this.url_pair_list=url_pair_list;
  this.file_options=file_options;
  this.ds_list=ds_list;
  this.graph_options=graph_options;
  this.rrd_graph_options=rrd_graph_options;
  this.rrdflot_defaults=rrdflot_defaults;
  this.ds_op_list=ds_op_list;
  this.rra_op_list=rra_op_list;

  this.customization_callback=customization_callback;

  this.rrd_flot_obj=null;
  this.rrd_data=null; //rrd_data will contain the data of the first url; still useful to explore the DS and RRA structure

  this.loaded_data=null;

  this.url_list=null;
  if (url_pair_list!=null) {
    this.reload(url_pair_list);
  }
}

rrdFlotMatrixAsync.prototype.reload = function(url_pair_list) {
  this.url_pair_list=url_pair_list;
  var url_list=[];
  for (var i in this.url_pair_list) {
    url_list.push(this.url_pair_list[i][1]);
  }

  rrdFlotMultiAsyncReload(this,url_list);
}

rrdFlotMatrixAsync.prototype.callback = function() {
  if (this.rrd_flot_obj!=null) delete this.rrd_flot_obj;

  var real_data_arr=new Array();
  for (var i in this.loaded_data) {
    // account for failed loaded urls
    var el=this.loaded_data[i];
    if (el!=undefined) real_data_arr.push([this.url_pair_list[i][0],el]);
  }
  this.rrd_data=real_data_arr[0];

  if (this.customization_callback!=undefined) this.customization_callback(this);

  for (var i in real_data_arr) {
    if (this.ds_op_list!=undefined) real_data_arr[i]=new RRDFilterOp(real_data_arr[i],this.ds_op_list);
    if (this.rra_op_list!=undefined) real_data_arr[i]=new RRDRRAFilterAvg(real_data_arr[i],this.rra_op_list);
  }
  this.rrd_flot_obj=new rrdFlotMatrix(this.html_id, real_data_arr, this.ds_list, this.graph_options, this.rrd_graph_options, this.rrdflot_defaults);
};

/*
 * jQuery JavaScript Library v1.11.1
 * http://jquery.com/
 *
 * Includes Sizzle.js
 * http://sizzlejs.com/
 *
 * Copyright 2005, 2014 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-05-01T17:42Z
 */
(function(b,a){if(typeof module==="object"&&typeof module.exports==="object"){module.exports=b.document?a(b,true):function(c){if(!c.document){throw new Error("jQuery requires a window with a document")}return a(c)}}else{a(b)}}(typeof window!=="undefined"?window:this,function(a4,au){var aO=[];var O=aO.slice;var ay=aO.concat;var w=aO.push;var bT=aO.indexOf;var ab={};var x=ab.toString;var J=ab.hasOwnProperty;var C={};var ah="1.11.1",bH=function(e,i){return new bH.fn.init(e,i)},D=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,bR=/^-ms-/,aV=/-([\da-z])/gi,N=function(e,i){return i.toUpperCase()};bH.fn=bH.prototype={jquery:ah,constructor:bH,selector:"",length:0,toArray:function(){return O.call(this)},get:function(e){return e!=null?(e<0?this[e+this.length]:this[e]):O.call(this)},pushStack:function(e){var i=bH.merge(this.constructor(),e);i.prevObject=this;i.context=this.context;return i},each:function(i,e){return bH.each(this,i,e)},map:function(e){return this.pushStack(bH.map(this,function(b6,b5){return e.call(b6,b5,b6)}))},slice:function(){return this.pushStack(O.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(b6){var e=this.length,b5=+b6+(b6<0?e:0);return this.pushStack(b5>=0&&b5<e?[this[b5]]:[])},end:function(){return this.prevObject||this.constructor(null)},push:w,sort:aO.sort,splice:aO.splice};bH.extend=bH.fn.extend=function(){var e,ca,b5,b6,cd,cb,b9=arguments[0]||{},b8=1,b7=arguments.length,cc=false;if(typeof b9==="boolean"){cc=b9;b9=arguments[b8]||{};b8++}if(typeof b9!=="object"&&!bH.isFunction(b9)){b9={}}if(b8===b7){b9=this;b8--}for(;b8<b7;b8++){if((cd=arguments[b8])!=null){for(b6 in cd){e=b9[b6];b5=cd[b6];if(b9===b5){continue}if(cc&&b5&&(bH.isPlainObject(b5)||(ca=bH.isArray(b5)))){if(ca){ca=false;cb=e&&bH.isArray(e)?e:[]}else{cb=e&&bH.isPlainObject(e)?e:{}}b9[b6]=bH.extend(cc,cb,b5)}else{if(b5!==undefined){b9[b6]=b5}}}}}return b9};bH.extend({expando:"jQuery"+(ah+Math.random()).replace(/\D/g,""),isReady:true,error:function(e){throw new Error(e)},noop:function(){},isFunction:function(e){return bH.type(e)==="function"},isArray:Array.isArray||function(e){return bH.type(e)==="array"},isWindow:function(e){return e!=null&&e==e.window},isNumeric:function(e){return !bH.isArray(e)&&e-parseFloat(e)>=0},isEmptyObject:function(i){var e;for(e in i){return false}return true},isPlainObject:function(b6){var i;if(!b6||bH.type(b6)!=="object"||b6.nodeType||bH.isWindow(b6)){return false}try{if(b6.constructor&&!J.call(b6,"constructor")&&!J.call(b6.constructor.prototype,"isPrototypeOf")){return false}}catch(b5){return false}if(C.ownLast){for(i in b6){return J.call(b6,i)}}for(i in b6){}return i===undefined||J.call(b6,i)},type:function(e){if(e==null){return e+""}return typeof e==="object"||typeof e==="function"?ab[x.call(e)]||"object":typeof e},globalEval:function(e){if(e&&bH.trim(e)){(a4.execScript||function(i){a4["eval"].call(a4,i)})(e)}},camelCase:function(e){return e.replace(bR,"ms-").replace(aV,N)},nodeName:function(i,e){return i.nodeName&&i.nodeName.toLowerCase()===e.toLowerCase()},each:function(b9,ca,b5){var b8,b6=0,b7=b9.length,e=ac(b9);if(b5){if(e){for(;b6<b7;b6++){b8=ca.apply(b9[b6],b5);if(b8===false){break}}}else{for(b6 in b9){b8=ca.apply(b9[b6],b5);if(b8===false){break}}}}else{if(e){for(;b6<b7;b6++){b8=ca.call(b9[b6],b6,b9[b6]);if(b8===false){break}}}else{for(b6 in b9){b8=ca.call(b9[b6],b6,b9[b6]);if(b8===false){break}}}}return b9},trim:function(e){return e==null?"":(e+"").replace(D,"")},makeArray:function(e,b5){var i=b5||[];if(e!=null){if(ac(Object(e))){bH.merge(i,typeof e==="string"?[e]:e)}else{w.call(i,e)}}return i},inArray:function(b7,b5,b6){var e;if(b5){if(bT){return bT.call(b5,b7,b6)}e=b5.length;b6=b6?b6<0?Math.max(0,e+b6):b6:0;for(;b6<e;b6++){if(b6 in b5&&b5[b6]===b7){return b6}}}return -1},merge:function(b8,b6){var e=+b6.length,b5=0,b7=b8.length;while(b5<e){b8[b7++]=b6[b5++]}if(e!==e){while(b6[b5]!==undefined){b8[b7++]=b6[b5++]}}b8.length=b7;return b8},grep:function(e,cb,b8){var ca,b7=[],b5=0,b6=e.length,b9=!b8;for(;b5<b6;b5++){ca=!cb(e[b5],b5);if(ca!==b9){b7.push(e[b5])}}return b7},map:function(b6,cb,e){var ca,b8=0,b9=b6.length,b5=ac(b6),b7=[];if(b5){for(;b8<b9;b8++){ca=cb(b6[b8],b8,e);if(ca!=null){b7.push(ca)}}}else{for(b8 in b6){ca=cb(b6[b8],b8,e);if(ca!=null){b7.push(ca)}}}return ay.apply([],b7)},guid:1,proxy:function(b7,b6){var e,b5,i;if(typeof b6==="string"){i=b7[b6];b6=b7;b7=i}if(!bH.isFunction(b7)){return undefined}e=O.call(arguments,2);b5=function(){return b7.apply(b6||this,e.concat(O.call(arguments)))};b5.guid=b7.guid=b7.guid||bH.guid++;return b5},now:function(){return +(new Date())},support:C});bH.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(b5,e){ab["[object "+e+"]"]=e.toLowerCase()});function ac(b5){var i=b5.length,e=bH.type(b5);if(e==="function"||bH.isWindow(b5)){return false}if(b5.nodeType===1&&i){return true}return e==="array"||i===0||typeof i==="number"&&i>0&&(i-1) in b5}var m=
/*
 * Sizzle CSS Selector Engine v1.10.19
 * http://sizzlejs.com/
 *
 * Copyright 2013 jQuery Foundation, Inc. and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: 2014-04-18
 */
(function(dd){var cw,dg,cm,cF,cI,cg,cU,df,dk,cG,cV,cX,cA,cn,c6,c1,de,cd,cD,c8="sizzle"+-(new Date()),cH=dd.document,dh=0,c2=0,b8=cy(),c7=cy(),cE=cy(),cC=function(i,e){if(i===e){cV=true}return 0},dc=typeof undefined,cO=1<<31,cM=({}).hasOwnProperty,da=[],db=da.pop,cK=da.push,b6=da.push,cl=da.slice,cc=da.indexOf||function(dm){var dl=0,e=this.length;for(;dl<e;dl++){if(this[dl]===dm){return dl}}return -1},b7="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",co="[\\x20\\t\\r\\n\\f]",b5="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",cJ=b5.replace("w","w#"),c4="\\["+co+"*("+b5+")(?:"+co+"*([*^$|!~]?=)"+co+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+cJ+"))|)"+co+"*\\]",cj=":("+b5+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+c4+")*)|.*)\\)|)",cq=new RegExp("^"+co+"+|((?:^|[^\\\\])(?:\\\\.)*)"+co+"+$","g"),ct=new RegExp("^"+co+"*,"+co+"*"),cz=new RegExp("^"+co+"*([>+~]|"+co+")"+co+"*"),cs=new RegExp("="+co+"*([^\\]'\"]*?)"+co+"*\\]","g"),cQ=new RegExp(cj),cS=new RegExp("^"+cJ+"$"),c0={ID:new RegExp("^#("+b5+")"),CLASS:new RegExp("^\\.("+b5+")"),TAG:new RegExp("^("+b5.replace("w","w*")+")"),ATTR:new RegExp("^"+c4),PSEUDO:new RegExp("^"+cj),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+co+"*(even|odd|(([+-]|)(\\d*)n|)"+co+"*(?:([+-]|)"+co+"*(\\d+)|))"+co+"*\\)|)","i"),bool:new RegExp("^(?:"+b7+")$","i"),needsContext:new RegExp("^"+co+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+co+"*((?:-\\d)?\\d*)"+co+"*\\)|)(?=[^-]|$)","i")},cb=/^(?:input|select|textarea|button)$/i,ck=/^h\d$/i,cN=/^[^{]+\{\s*\[native \w/,cP=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,cZ=/[+~]/,cL=/'|\\/g,cr=new RegExp("\\\\([\\da-f]{1,6}"+co+"?|("+co+")|.)","ig"),c3=function(e,dm,i){var dl="0x"+dm-65536;return dl!==dl||i?dm:dl<0?String.fromCharCode(dl+65536):String.fromCharCode(dl>>10|55296,dl&1023|56320)};try{b6.apply((da=cl.call(cH.childNodes)),cH.childNodes);da[cH.childNodes.length].nodeType}catch(cB){b6={apply:da.length?function(i,e){cK.apply(i,cl.call(e))}:function(dn,dm){var e=dn.length,dl=0;while((dn[e++]=dm[dl++])){}dn.length=e-1}}}function cu(dt,dl,dx,dz){var dy,dq,dr,dv,dw,dp,dn,e,dm,du;if((dl?dl.ownerDocument||dl:cH)!==cA){cX(dl)}dl=dl||cA;dx=dx||[];if(!dt||typeof dt!=="string"){return dx}if((dv=dl.nodeType)!==1&&dv!==9){return[]}if(c6&&!dz){if((dy=cP.exec(dt))){if((dr=dy[1])){if(dv===9){dq=dl.getElementById(dr);if(dq&&dq.parentNode){if(dq.id===dr){dx.push(dq);return dx}}else{return dx}}else{if(dl.ownerDocument&&(dq=dl.ownerDocument.getElementById(dr))&&cD(dl,dq)&&dq.id===dr){dx.push(dq);return dx}}}else{if(dy[2]){b6.apply(dx,dl.getElementsByTagName(dt));return dx}else{if((dr=dy[3])&&dg.getElementsByClassName&&dl.getElementsByClassName){b6.apply(dx,dl.getElementsByClassName(dr));return dx}}}}if(dg.qsa&&(!c1||!c1.test(dt))){e=dn=c8;dm=dl;du=dv===9&&dt;if(dv===1&&dl.nodeName.toLowerCase()!=="object"){dp=cg(dt);if((dn=dl.getAttribute("id"))){e=dn.replace(cL,"\\$&")}else{dl.setAttribute("id",e)}e="[id='"+e+"'] ";dw=dp.length;while(dw--){dp[dw]=e+ch(dp[dw])}dm=cZ.test(dt)&&cR(dl.parentNode)||dl;du=dp.join(",")}if(du){try{b6.apply(dx,dm.querySelectorAll(du));return dx}catch(ds){}finally{if(!dn){dl.removeAttribute("id")}}}}}return df(dt.replace(cq,"$1"),dl,dx,dz)}function cy(){var i=[];function e(dl,dm){if(i.push(dl+" ")>cm.cacheLength){delete e[i.shift()]}return(e[dl+" "]=dm)}return e}function ci(e){e[c8]=true;return e}function ce(i){var dm=cA.createElement("div");try{return !!i(dm)}catch(dl){return false}finally{if(dm.parentNode){dm.parentNode.removeChild(dm)}dm=null}}function di(dl,dn){var e=dl.split("|"),dm=dl.length;while(dm--){cm.attrHandle[e[dm]]=dn}}function b9(i,e){var dm=e&&i,dl=dm&&i.nodeType===1&&e.nodeType===1&&(~e.sourceIndex||cO)-(~i.sourceIndex||cO);if(dl){return dl}if(dm){while((dm=dm.nextSibling)){if(dm===e){return -1}}}return i?1:-1}function cv(e){return function(dl){var i=dl.nodeName.toLowerCase();return i==="input"&&dl.type===e}}function ca(e){return function(dl){var i=dl.nodeName.toLowerCase();return(i==="input"||i==="button")&&dl.type===e}}function c5(e){return ci(function(i){i=+i;return ci(function(dl,dq){var dn,dm=e([],dl.length,i),dp=dm.length;while(dp--){if(dl[(dn=dm[dp])]){dl[dn]=!(dq[dn]=dl[dn])}}})})}function cR(e){return e&&typeof e.getElementsByTagName!==dc&&e}dg=cu.support={};cI=cu.isXML=function(e){var i=e&&(e.ownerDocument||e).documentElement;return i?i.nodeName!=="HTML":false};cX=cu.setDocument=function(dl){var e,dm=dl?dl.ownerDocument||dl:cH,i=dm.defaultView;if(dm===cA||dm.nodeType!==9||!dm.documentElement){return cA}cA=dm;cn=dm.documentElement;c6=!cI(dm);if(i&&i!==i.top){if(i.addEventListener){i.addEventListener("unload",function(){cX()},false)}else{if(i.attachEvent){i.attachEvent("onunload",function(){cX()})}}}dg.attributes=ce(function(dn){dn.className="i";return !dn.getAttribute("className")});dg.getElementsByTagName=ce(function(dn){dn.appendChild(dm.createComment(""));return !dn.getElementsByTagName("*").length});dg.getElementsByClassName=cN.test(dm.getElementsByClassName)&&ce(function(dn){dn.innerHTML="<div class='a'></div><div class='a i'></div>";dn.firstChild.className="i";return dn.getElementsByClassName("i").length===2});dg.getById=ce(function(dn){cn.appendChild(dn).id=c8;return !dm.getElementsByName||!dm.getElementsByName(c8).length});if(dg.getById){cm.find.ID=function(dq,dp){if(typeof dp.getElementById!==dc&&c6){var dn=dp.getElementById(dq);return dn&&dn.parentNode?[dn]:[]}};cm.filter.ID=function(dp){var dn=dp.replace(cr,c3);return function(dq){return dq.getAttribute("id")===dn}}}else{delete cm.find.ID;cm.filter.ID=function(dp){var dn=dp.replace(cr,c3);return function(dr){var dq=typeof dr.getAttributeNode!==dc&&dr.getAttributeNode("id");return dq&&dq.value===dn}}}cm.find.TAG=dg.getElementsByTagName?function(dn,dp){if(typeof dp.getElementsByTagName!==dc){return dp.getElementsByTagName(dn)}}:function(dn,ds){var dt,dr=[],dq=0,dp=ds.getElementsByTagName(dn);if(dn==="*"){while((dt=dp[dq++])){if(dt.nodeType===1){dr.push(dt)}}return dr}return dp};cm.find.CLASS=dg.getElementsByClassName&&function(dp,dn){if(typeof dn.getElementsByClassName!==dc&&c6){return dn.getElementsByClassName(dp)}};de=[];c1=[];if((dg.qsa=cN.test(dm.querySelectorAll))){ce(function(dn){dn.innerHTML="<select msallowclip=''><option selected=''></option></select>";if(dn.querySelectorAll("[msallowclip^='']").length){c1.push("[*^$]="+co+"*(?:''|\"\")")}if(!dn.querySelectorAll("[selected]").length){c1.push("\\["+co+"*(?:value|"+b7+")")}if(!dn.querySelectorAll(":checked").length){c1.push(":checked")}});ce(function(dp){var dn=dm.createElement("input");dn.setAttribute("type","hidden");dp.appendChild(dn).setAttribute("name","D");if(dp.querySelectorAll("[name=d]").length){c1.push("name"+co+"*[*^$|!~]?=")}if(!dp.querySelectorAll(":enabled").length){c1.push(":enabled",":disabled")}dp.querySelectorAll("*,:x");c1.push(",.*:")})}if((dg.matchesSelector=cN.test((cd=cn.matches||cn.webkitMatchesSelector||cn.mozMatchesSelector||cn.oMatchesSelector||cn.msMatchesSelector)))){ce(function(dn){dg.disconnectedMatch=cd.call(dn,"div");cd.call(dn,"[s!='']:x");de.push("!=",cj)})}c1=c1.length&&new RegExp(c1.join("|"));de=de.length&&new RegExp(de.join("|"));e=cN.test(cn.compareDocumentPosition);cD=e||cN.test(cn.contains)?function(dp,dn){var dr=dp.nodeType===9?dp.documentElement:dp,dq=dn&&dn.parentNode;return dp===dq||!!(dq&&dq.nodeType===1&&(dr.contains?dr.contains(dq):dp.compareDocumentPosition&&dp.compareDocumentPosition(dq)&16))}:function(dp,dn){if(dn){while((dn=dn.parentNode)){if(dn===dp){return true}}}return false};cC=e?function(dp,dn){if(dp===dn){cV=true;return 0}var dq=!dp.compareDocumentPosition-!dn.compareDocumentPosition;if(dq){return dq}dq=(dp.ownerDocument||dp)===(dn.ownerDocument||dn)?dp.compareDocumentPosition(dn):1;if(dq&1||(!dg.sortDetached&&dn.compareDocumentPosition(dp)===dq)){if(dp===dm||dp.ownerDocument===cH&&cD(cH,dp)){return -1}if(dn===dm||dn.ownerDocument===cH&&cD(cH,dn)){return 1}return cG?(cc.call(cG,dp)-cc.call(cG,dn)):0}return dq&4?-1:1}:function(dp,dn){if(dp===dn){cV=true;return 0}var dv,ds=0,du=dp.parentNode,dr=dn.parentNode,dq=[dp],dt=[dn];if(!du||!dr){return dp===dm?-1:dn===dm?1:du?-1:dr?1:cG?(cc.call(cG,dp)-cc.call(cG,dn)):0}else{if(du===dr){return b9(dp,dn)}}dv=dp;while((dv=dv.parentNode)){dq.unshift(dv)}dv=dn;while((dv=dv.parentNode)){dt.unshift(dv)}while(dq[ds]===dt[ds]){ds++}return ds?b9(dq[ds],dt[ds]):dq[ds]===cH?-1:dt[ds]===cH?1:0};return dm};cu.matches=function(i,e){return cu(i,null,null,e)};cu.matchesSelector=function(dl,dn){if((dl.ownerDocument||dl)!==cA){cX(dl)}dn=dn.replace(cs,"='$1']");if(dg.matchesSelector&&c6&&(!de||!de.test(dn))&&(!c1||!c1.test(dn))){try{var i=cd.call(dl,dn);if(i||dg.disconnectedMatch||dl.document&&dl.document.nodeType!==11){return i}}catch(dm){}}return cu(dn,cA,null,[dl]).length>0};cu.contains=function(e,i){if((e.ownerDocument||e)!==cA){cX(e)}return cD(e,i)};cu.attr=function(dl,e){if((dl.ownerDocument||dl)!==cA){cX(dl)}var i=cm.attrHandle[e.toLowerCase()],dm=i&&cM.call(cm.attrHandle,e.toLowerCase())?i(dl,e,!c6):undefined;return dm!==undefined?dm:dg.attributes||!c6?dl.getAttribute(e):(dm=dl.getAttributeNode(e))&&dm.specified?dm.value:null};cu.error=function(e){throw new Error("Syntax error, unrecognized expression: "+e)};cu.uniqueSort=function(dm){var dn,dp=[],e=0,dl=0;cV=!dg.detectDuplicates;cG=!dg.sortStable&&dm.slice(0);dm.sort(cC);if(cV){while((dn=dm[dl++])){if(dn===dm[dl]){e=dp.push(dl)}}while(e--){dm.splice(dp[e],1)}}cG=null;return dm};cF=cu.getText=function(dp){var dn,dl="",dm=0,e=dp.nodeType;if(!e){while((dn=dp[dm++])){dl+=cF(dn)}}else{if(e===1||e===9||e===11){if(typeof dp.textContent==="string"){return dp.textContent}else{for(dp=dp.firstChild;dp;dp=dp.nextSibling){dl+=cF(dp)}}}else{if(e===3||e===4){return dp.nodeValue}}}return dl};cm=cu.selectors={cacheLength:50,createPseudo:ci,match:c0,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:true}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:true},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(e){e[1]=e[1].replace(cr,c3);e[3]=(e[3]||e[4]||e[5]||"").replace(cr,c3);if(e[2]==="~="){e[3]=" "+e[3]+" "}return e.slice(0,4)},CHILD:function(e){e[1]=e[1].toLowerCase();if(e[1].slice(0,3)==="nth"){if(!e[3]){cu.error(e[0])}e[4]=+(e[4]?e[5]+(e[6]||1):2*(e[3]==="even"||e[3]==="odd"));e[5]=+((e[7]+e[8])||e[3]==="odd")}else{if(e[3]){cu.error(e[0])}}return e},PSEUDO:function(i){var e,dl=!i[6]&&i[2];if(c0.CHILD.test(i[0])){return null}if(i[3]){i[2]=i[4]||i[5]||""}else{if(dl&&cQ.test(dl)&&(e=cg(dl,true))&&(e=dl.indexOf(")",dl.length-e)-dl.length)){i[0]=i[0].slice(0,e);i[2]=dl.slice(0,e)}}return i.slice(0,3)}},filter:{TAG:function(i){var e=i.replace(cr,c3).toLowerCase();return i==="*"?function(){return true}:function(dl){return dl.nodeName&&dl.nodeName.toLowerCase()===e}},CLASS:function(e){var i=b8[e+" "];return i||(i=new RegExp("(^|"+co+")"+e+"("+co+"|$)"))&&b8(e,function(dl){return i.test(typeof dl.className==="string"&&dl.className||typeof dl.getAttribute!==dc&&dl.getAttribute("class")||"")})},ATTR:function(dl,i,e){return function(dn){var dm=cu.attr(dn,dl);if(dm==null){return i==="!="}if(!i){return true}dm+="";return i==="="?dm===e:i==="!="?dm!==e:i==="^="?e&&dm.indexOf(e)===0:i==="*="?e&&dm.indexOf(e)>-1:i==="$="?e&&dm.slice(-e.length)===e:i==="~="?(" "+dm+" ").indexOf(e)>-1:i==="|="?dm===e||dm.slice(0,e.length+1)===e+"-":false}},CHILD:function(i,dn,dm,dp,dl){var dr=i.slice(0,3)!=="nth",e=i.slice(-4)!=="last",dq=dn==="of-type";return dp===1&&dl===0?function(ds){return !!ds.parentNode}:function(dy,dw,dB){var ds,dE,dz,dD,dA,dv,dx=dr!==e?"nextSibling":"previousSibling",dC=dy.parentNode,du=dq&&dy.nodeName.toLowerCase(),dt=!dB&&!dq;if(dC){if(dr){while(dx){dz=dy;while((dz=dz[dx])){if(dq?dz.nodeName.toLowerCase()===du:dz.nodeType===1){return false}}dv=dx=i==="only"&&!dv&&"nextSibling"}return true}dv=[e?dC.firstChild:dC.lastChild];if(e&&dt){dE=dC[c8]||(dC[c8]={});ds=dE[i]||[];dA=ds[0]===dh&&ds[1];dD=ds[0]===dh&&ds[2];dz=dA&&dC.childNodes[dA];while((dz=++dA&&dz&&dz[dx]||(dD=dA=0)||dv.pop())){if(dz.nodeType===1&&++dD&&dz===dy){dE[i]=[dh,dA,dD];break}}}else{if(dt&&(ds=(dy[c8]||(dy[c8]={}))[i])&&ds[0]===dh){dD=ds[1]}else{while((dz=++dA&&dz&&dz[dx]||(dD=dA=0)||dv.pop())){if((dq?dz.nodeName.toLowerCase()===du:dz.nodeType===1)&&++dD){if(dt){(dz[c8]||(dz[c8]={}))[i]=[dh,dD]}if(dz===dy){break}}}}}dD-=dl;return dD===dp||(dD%dp===0&&dD/dp>=0)}}},PSEUDO:function(dm,dl){var e,i=cm.pseudos[dm]||cm.setFilters[dm.toLowerCase()]||cu.error("unsupported pseudo: "+dm);if(i[c8]){return i(dl)}if(i.length>1){e=[dm,dm,"",dl];return cm.setFilters.hasOwnProperty(dm.toLowerCase())?ci(function(dq,ds){var dp,dn=i(dq,dl),dr=dn.length;while(dr--){dp=cc.call(dq,dn[dr]);dq[dp]=!(ds[dp]=dn[dr])}}):function(dn){return i(dn,0,e)}}return i}},pseudos:{not:ci(function(e){var i=[],dl=[],dm=cU(e.replace(cq,"$1"));return dm[c8]?ci(function(dp,du,ds,dq){var dt,dn=dm(dp,null,dq,[]),dr=dp.length;while(dr--){if((dt=dn[dr])){dp[dr]=!(du[dr]=dt)}}}):function(dq,dp,dn){i[0]=dq;dm(i,null,dn,dl);return !dl.pop()}}),has:ci(function(e){return function(i){return cu(e,i).length>0}}),contains:ci(function(e){return function(i){return(i.textContent||i.innerText||cF(i)).indexOf(e)>-1}}),lang:ci(function(e){if(!cS.test(e||"")){cu.error("unsupported lang: "+e)}e=e.replace(cr,c3).toLowerCase();return function(dl){var i;do{if((i=c6?dl.lang:dl.getAttribute("xml:lang")||dl.getAttribute("lang"))){i=i.toLowerCase();return i===e||i.indexOf(e+"-")===0}}while((dl=dl.parentNode)&&dl.nodeType===1);return false}}),target:function(e){var i=dd.location&&dd.location.hash;return i&&i.slice(1)===e.id},root:function(e){return e===cn},focus:function(e){return e===cA.activeElement&&(!cA.hasFocus||cA.hasFocus())&&!!(e.type||e.href||~e.tabIndex)},enabled:function(e){return e.disabled===false},disabled:function(e){return e.disabled===true},checked:function(e){var i=e.nodeName.toLowerCase();return(i==="input"&&!!e.checked)||(i==="option"&&!!e.selected)},selected:function(e){if(e.parentNode){e.parentNode.selectedIndex}return e.selected===true},empty:function(e){for(e=e.firstChild;e;e=e.nextSibling){if(e.nodeType<6){return false}}return true},parent:function(e){return !cm.pseudos.empty(e)},header:function(e){return ck.test(e.nodeName)},input:function(e){return cb.test(e.nodeName)},button:function(i){var e=i.nodeName.toLowerCase();return e==="input"&&i.type==="button"||e==="button"},text:function(i){var e;return i.nodeName.toLowerCase()==="input"&&i.type==="text"&&((e=i.getAttribute("type"))==null||e.toLowerCase()==="text")},first:c5(function(){return[0]}),last:c5(function(e,i){return[i-1]}),eq:c5(function(e,dl,i){return[i<0?i+dl:i]}),even:c5(function(e,dm){var dl=0;for(;dl<dm;dl+=2){e.push(dl)}return e}),odd:c5(function(e,dm){var dl=1;for(;dl<dm;dl+=2){e.push(dl)}return e}),lt:c5(function(e,dn,dm){var dl=dm<0?dm+dn:dm;for(;--dl>=0;){e.push(dl)}return e}),gt:c5(function(e,dn,dm){var dl=dm<0?dm+dn:dm;for(;++dl<dn;){e.push(dl)}return e})}};cm.pseudos.nth=cm.pseudos.eq;for(cw in {radio:true,checkbox:true,file:true,password:true,image:true}){cm.pseudos[cw]=cv(cw)}for(cw in {submit:true,reset:true}){cm.pseudos[cw]=ca(cw)}function cT(){}cT.prototype=cm.filters=cm.pseudos;cm.setFilters=new cT();cg=cu.tokenize=function(dn,dt){var i,dp,dr,ds,dq,dl,e,dm=c7[dn+" "];if(dm){return dt?0:dm.slice(0)}dq=dn;dl=[];e=cm.preFilter;while(dq){if(!i||(dp=ct.exec(dq))){if(dp){dq=dq.slice(dp[0].length)||dq}dl.push((dr=[]))}i=false;if((dp=cz.exec(dq))){i=dp.shift();dr.push({value:i,type:dp[0].replace(cq," ")});dq=dq.slice(i.length)}for(ds in cm.filter){if((dp=c0[ds].exec(dq))&&(!e[ds]||(dp=e[ds](dp)))){i=dp.shift();dr.push({value:i,type:ds,matches:dp});dq=dq.slice(i.length)}}if(!i){break}}return dt?dq.length:dq?cu.error(dn):c7(dn,dl).slice(0)};function ch(dn){var dm=0,dl=dn.length,e="";for(;dm<dl;dm++){e+=dn[dm].value}return e}function cp(dn,dl,dm){var e=dl.dir,dp=dm&&e==="parentNode",i=c2++;return dl.first?function(ds,dr,dq){while((ds=ds[e])){if(ds.nodeType===1||dp){return dn(ds,dr,dq)}}}:function(du,ds,dr){var dv,dt,dq=[dh,i];if(dr){while((du=du[e])){if(du.nodeType===1||dp){if(dn(du,ds,dr)){return true}}}}else{while((du=du[e])){if(du.nodeType===1||dp){dt=du[c8]||(du[c8]={});if((dv=dt[e])&&dv[0]===dh&&dv[1]===i){return(dq[2]=dv[2])}else{dt[e]=dq;if((dq[2]=dn(du,ds,dr))){return true}}}}}}}function dj(e){return e.length>1?function(dp,dn,dl){var dm=e.length;while(dm--){if(!e[dm](dp,dn,dl)){return false}}return true}:e[0]}function cx(dl,dp,dn){var dm=0,e=dp.length;for(;dm<e;dm++){cu(dl,dp[dm],dn)}return dn}function cY(e,dl,dm,dn,dr){var dp,du=[],dq=0,ds=e.length,dt=dl!=null;for(;dq<ds;dq++){if((dp=e[dq])){if(!dm||dm(dp,dn,dr)){du.push(dp);if(dt){dl.push(dq)}}}}return du}function cf(dl,i,dn,dm,dp,e){if(dm&&!dm[c8]){dm=cf(dm)}if(dp&&!dp[c8]){dp=cf(dp,e)}return ci(function(dA,dx,ds,dz){var dC,dy,du,dt=[],dB=[],dr=dx.length,dq=dA||cx(i||"*",ds.nodeType?[ds]:ds,[]),dv=dl&&(dA||!i)?cY(dq,dt,dl,ds,dz):dq,dw=dn?dp||(dA?dl:dr||dm)?[]:dx:dv;if(dn){dn(dv,dw,ds,dz)}if(dm){dC=cY(dw,dB);dm(dC,[],ds,dz);dy=dC.length;while(dy--){if((du=dC[dy])){dw[dB[dy]]=!(dv[dB[dy]]=du)}}}if(dA){if(dp||dl){if(dp){dC=[];dy=dw.length;while(dy--){if((du=dw[dy])){dC.push((dv[dy]=du))}}dp(null,(dw=[]),dC,dz)}dy=dw.length;while(dy--){if((du=dw[dy])&&(dC=dp?cc.call(dA,du):dt[dy])>-1){dA[dC]=!(dx[dC]=du)}}}}else{dw=cY(dw===dx?dw.splice(dr,dw.length):dw);if(dp){dp(null,dx,dw,dz)}else{b6.apply(dx,dw)}}})}function c9(dr){var dl,dp,dm,dq=dr.length,du=cm.relative[dr[0].type],dv=du||cm.relative[" "],dn=du?1:0,ds=cp(function(i){return i===dl},dv,true),dt=cp(function(i){return cc.call(dl,i)>-1},dv,true),e=[function(dx,dw,i){return(!du&&(i||dw!==dk))||((dl=dw).nodeType?ds(dx,dw,i):dt(dx,dw,i))}];for(;dn<dq;dn++){if((dp=cm.relative[dr[dn].type])){e=[cp(dj(e),dp)]}else{dp=cm.filter[dr[dn].type].apply(null,dr[dn].matches);if(dp[c8]){dm=++dn;for(;dm<dq;dm++){if(cm.relative[dr[dm].type]){break}}return cf(dn>1&&dj(e),dn>1&&ch(dr.slice(0,dn-1).concat({value:dr[dn-2].type===" "?"*":""})).replace(cq,"$1"),dp,dn<dm&&c9(dr.slice(dn,dm)),dm<dq&&c9((dr=dr.slice(dm))),dm<dq&&ch(dr))}e.push(dp)}}return dj(e)}function cW(dm,dl){var e=dl.length>0,dn=dm.length>0,i=function(dy,ds,dx,dw,dB){var dt,du,dz,dD=0,dv="0",dp=dy&&[],dE=[],dC=dk,dr=dy||dn&&cm.find.TAG("*",dB),dq=(dh+=dC==null?1:Math.random()||0.1),dA=dr.length;if(dB){dk=ds!==cA&&ds}for(;dv!==dA&&(dt=dr[dv])!=null;dv++){if(dn&&dt){du=0;while((dz=dm[du++])){if(dz(dt,ds,dx)){dw.push(dt);break}}if(dB){dh=dq}}if(e){if((dt=!dz&&dt)){dD--}if(dy){dp.push(dt)}}}dD+=dv;if(e&&dv!==dD){du=0;while((dz=dl[du++])){dz(dp,dE,ds,dx)}if(dy){if(dD>0){while(dv--){if(!(dp[dv]||dE[dv])){dE[dv]=db.call(dw)}}}dE=cY(dE)}b6.apply(dw,dE);if(dB&&!dy&&dE.length>0&&(dD+dl.length)>1){cu.uniqueSort(dw)}}if(dB){dh=dq;dk=dC}return dp};return e?ci(i):i}cU=cu.compile=function(e,dm){var dn,dl=[],dq=[],dp=cE[e+" "];if(!dp){if(!dm){dm=cg(e)}dn=dm.length;while(dn--){dp=c9(dm[dn]);if(dp[c8]){dl.push(dp)}else{dq.push(dp)}}dp=cE(e,cW(dq,dl));dp.selector=e}return dp};df=cu.select=function(dm,e,dn,dr){var dp,du,dl,dv,ds,dt=typeof dm==="function"&&dm,dq=!dr&&cg((dm=dt.selector||dm));dn=dn||[];if(dq.length===1){du=dq[0]=dq[0].slice(0);if(du.length>2&&(dl=du[0]).type==="ID"&&dg.getById&&e.nodeType===9&&c6&&cm.relative[du[1].type]){e=(cm.find.ID(dl.matches[0].replace(cr,c3),e)||[])[0];if(!e){return dn}else{if(dt){e=e.parentNode}}dm=dm.slice(du.shift().value.length)}dp=c0.needsContext.test(dm)?0:du.length;while(dp--){dl=du[dp];if(cm.relative[(dv=dl.type)]){break}if((ds=cm.find[dv])){if((dr=ds(dl.matches[0].replace(cr,c3),cZ.test(du[0].type)&&cR(e.parentNode)||e))){du.splice(dp,1);dm=dr.length&&ch(du);if(!dm){b6.apply(dn,dr);return dn}break}}}}(dt||cU(dm,dq))(dr,e,!c6,dn,cZ.test(dm)&&cR(e.parentNode)||e);return dn};dg.sortStable=c8.split("").sort(cC).join("")===c8;dg.detectDuplicates=!!cV;cX();dg.sortDetached=ce(function(e){return e.compareDocumentPosition(cA.createElement("div"))&1});if(!ce(function(e){e.innerHTML="<a href='#'></a>";return e.firstChild.getAttribute("href")==="#"})){di("type|href|height|width",function(i,e,dl){if(!dl){return i.getAttribute(e,e.toLowerCase()==="type"?1:2)}})}if(!dg.attributes||!ce(function(e){e.innerHTML="<input/>";e.firstChild.setAttribute("value","");return e.firstChild.getAttribute("value")===""})){di("value",function(i,e,dl){if(!dl&&i.nodeName.toLowerCase()==="input"){return i.defaultValue}})}if(!ce(function(e){return e.getAttribute("disabled")==null})){di(b7,function(i,e,dm){var dl;if(!dm){return i[e]===true?e.toLowerCase():(dl=i.getAttributeNode(e))&&dl.specified?dl.value:null}})}return cu})(a4);bH.find=m;bH.expr=m.selectors;bH.expr[":"]=bH.expr.pseudos;bH.unique=m.uniqueSort;bH.text=m.getText;bH.isXMLDoc=m.isXML;bH.contains=m.contains;var z=bH.expr.match.needsContext;var a=(/^<(\w+)\s*\/?>(?:<\/\1>|)$/);var aK=/^.[^:#\[\.,]*$/;function aQ(b5,e,i){if(bH.isFunction(e)){return bH.grep(b5,function(b7,b6){return !!e.call(b7,b6,b7)!==i})}if(e.nodeType){return bH.grep(b5,function(b6){return(b6===e)!==i})}if(typeof e==="string"){if(aK.test(e)){return bH.filter(e,b5,i)}e=bH.filter(e,b5)}return bH.grep(b5,function(b6){return(bH.inArray(b6,e)>=0)!==i})}bH.filter=function(b6,e,b5){var i=e[0];if(b5){b6=":not("+b6+")"}return e.length===1&&i.nodeType===1?bH.find.matchesSelector(i,b6)?[i]:[]:bH.find.matches(b6,bH.grep(e,function(b7){return b7.nodeType===1}))};bH.fn.extend({find:function(b5){var b8,b7=[],b6=this,e=b6.length;if(typeof b5!=="string"){return this.pushStack(bH(b5).filter(function(){for(b8=0;b8<e;b8++){if(bH.contains(b6[b8],this)){return true}}}))}for(b8=0;b8<e;b8++){bH.find(b5,b6[b8],b7)}b7=this.pushStack(e>1?bH.unique(b7):b7);b7.selector=this.selector?this.selector+" "+b5:b5;return b7},filter:function(e){return this.pushStack(aQ(this,e||[],false))},not:function(e){return this.pushStack(aQ(this,e||[],true))},is:function(e){return !!aQ(this,typeof e==="string"&&z.test(e)?bH(e):e||[],false).length}});var y,n=a4.document,bs=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,bU=bH.fn.init=function(e,b5){var i,b6;if(!e){return this}if(typeof e==="string"){if(e.charAt(0)==="<"&&e.charAt(e.length-1)===">"&&e.length>=3){i=[null,e,null]}else{i=bs.exec(e)}if(i&&(i[1]||!b5)){if(i[1]){b5=b5 instanceof bH?b5[0]:b5;bH.merge(this,bH.parseHTML(i[1],b5&&b5.nodeType?b5.ownerDocument||b5:n,true));if(a.test(i[1])&&bH.isPlainObject(b5)){for(i in b5){if(bH.isFunction(this[i])){this[i](b5[i])}else{this.attr(i,b5[i])}}}return this}else{b6=n.getElementById(i[2]);if(b6&&b6.parentNode){if(b6.id!==i[2]){return y.find(e)}this.length=1;this[0]=b6}this.context=n;this.selector=e;return this}}else{if(!b5||b5.jquery){return(b5||y).find(e)}else{return this.constructor(b5).find(e)}}}else{if(e.nodeType){this.context=this[0]=e;this.length=1;return this}else{if(bH.isFunction(e)){return typeof y.ready!=="undefined"?y.ready(e):e(bH)}}}if(e.selector!==undefined){this.selector=e.selector;this.context=e.context}return bH.makeArray(e,this)};bU.prototype=bH.fn;y=bH(n);var bu=/^(?:parents|prev(?:Until|All))/,by={children:true,contents:true,next:true,prev:true};bH.extend({dir:function(b5,i,b7){var e=[],b6=b5[i];while(b6&&b6.nodeType!==9&&(b7===undefined||b6.nodeType!==1||!bH(b6).is(b7))){if(b6.nodeType===1){e.push(b6)}b6=b6[i]}return e},sibling:function(b5,i){var e=[];for(;b5;b5=b5.nextSibling){if(b5.nodeType===1&&b5!==i){e.push(b5)}}return e}});bH.fn.extend({has:function(b7){var b6,b5=bH(b7,this),e=b5.length;return this.filter(function(){for(b6=0;b6<e;b6++){if(bH.contains(this,b5[b6])){return true}}})},closest:function(b8,b7){var b9,b6=0,b5=this.length,e=[],ca=z.test(b8)||typeof b8!=="string"?bH(b8,b7||this.context):0;for(;b6<b5;b6++){for(b9=this[b6];b9&&b9!==b7;b9=b9.parentNode){if(b9.nodeType<11&&(ca?ca.index(b9)>-1:b9.nodeType===1&&bH.find.matchesSelector(b9,b8))){e.push(b9);break}}}return this.pushStack(e.length>1?bH.unique(e):e)},index:function(e){if(!e){return(this[0]&&this[0].parentNode)?this.first().prevAll().length:-1}if(typeof e==="string"){return bH.inArray(this[0],bH(e))}return bH.inArray(e.jquery?e[0]:e,this)},add:function(e,i){return this.pushStack(bH.unique(bH.merge(this.get(),bH(e,i))))},addBack:function(e){return this.add(e==null?this.prevObject:this.prevObject.filter(e))}});function aX(i,e){do{i=i[e]}while(i&&i.nodeType!==1);return i}bH.each({parent:function(i){var e=i.parentNode;return e&&e.nodeType!==11?e:null},parents:function(e){return bH.dir(e,"parentNode")},parentsUntil:function(b5,e,b6){return bH.dir(b5,"parentNode",b6)},next:function(e){return aX(e,"nextSibling")},prev:function(e){return aX(e,"previousSibling")},nextAll:function(e){return bH.dir(e,"nextSibling")},prevAll:function(e){return bH.dir(e,"previousSibling")},nextUntil:function(b5,e,b6){return bH.dir(b5,"nextSibling",b6)},prevUntil:function(b5,e,b6){return bH.dir(b5,"previousSibling",b6)},siblings:function(e){return bH.sibling((e.parentNode||{}).firstChild,e)},children:function(e){return bH.sibling(e.firstChild)},contents:function(e){return bH.nodeName(e,"iframe")?e.contentDocument||e.contentWindow.document:bH.merge([],e.childNodes)}},function(e,i){bH.fn[e]=function(b7,b5){var b6=bH.map(this,i,b7);if(e.slice(-5)!=="Until"){b5=b7}if(b5&&typeof b5==="string"){b6=bH.filter(b5,b6)}if(this.length>1){if(!by[e]){b6=bH.unique(b6)}if(bu.test(e)){b6=b6.reverse()}}return this.pushStack(b6)}});var aE=(/\S+/g);var b1={};function ae(i){var e=b1[i]={};bH.each(i.match(aE)||[],function(b6,b5){e[b5]=true});return e}bH.Callbacks=function(cd){cd=typeof cd==="string"?(b1[cd]||ae(cd)):bH.extend({},cd);var b7,b6,e,b8,b9,b5,ca=[],cb=!cd.once&&[],i=function(ce){b6=cd.memory&&ce;e=true;b9=b5||0;b5=0;b8=ca.length;b7=true;for(;ca&&b9<b8;b9++){if(ca[b9].apply(ce[0],ce[1])===false&&cd.stopOnFalse){b6=false;break}}b7=false;if(ca){if(cb){if(cb.length){i(cb.shift())}}else{if(b6){ca=[]}else{cc.disable()}}}},cc={add:function(){if(ca){var cf=ca.length;(function ce(cg){bH.each(cg,function(ci,ch){var cj=bH.type(ch);if(cj==="function"){if(!cd.unique||!cc.has(ch)){ca.push(ch)}}else{if(ch&&ch.length&&cj!=="string"){ce(ch)}}})})(arguments);if(b7){b8=ca.length}else{if(b6){b5=cf;i(b6)}}}return this},remove:function(){if(ca){bH.each(arguments,function(cg,ce){var cf;while((cf=bH.inArray(ce,ca,cf))>-1){ca.splice(cf,1);if(b7){if(cf<=b8){b8--}if(cf<=b9){b9--}}}})}return this},has:function(ce){return ce?bH.inArray(ce,ca)>-1:!!(ca&&ca.length)},empty:function(){ca=[];b8=0;return this},disable:function(){ca=cb=b6=undefined;return this},disabled:function(){return !ca},lock:function(){cb=undefined;if(!b6){cc.disable()}return this},locked:function(){return !cb},fireWith:function(cf,ce){if(ca&&(!e||cb)){ce=ce||[];ce=[cf,ce.slice?ce.slice():ce];if(b7){cb.push(ce)}else{i(ce)}}return this},fire:function(){cc.fireWith(this,arguments);return this},fired:function(){return !!e}};return cc};bH.extend({Deferred:function(b5){var i=[["resolve","done",bH.Callbacks("once memory"),"resolved"],["reject","fail",bH.Callbacks("once memory"),"rejected"],["notify","progress",bH.Callbacks("memory")]],b6="pending",b7={state:function(){return b6},always:function(){e.done(arguments).fail(arguments);return this},then:function(){var b8=arguments;return bH.Deferred(function(b9){bH.each(i,function(cb,ca){var cc=bH.isFunction(b8[cb])&&b8[cb];e[ca[1]](function(){var cd=cc&&cc.apply(this,arguments);if(cd&&bH.isFunction(cd.promise)){cd.promise().done(b9.resolve).fail(b9.reject).progress(b9.notify)}else{b9[ca[0]+"With"](this===b7?b9.promise():this,cc?[cd]:arguments)}})});b8=null}).promise()},promise:function(b8){return b8!=null?bH.extend(b8,b7):b7}},e={};b7.pipe=b7.then;bH.each(i,function(b9,b8){var cb=b8[2],ca=b8[3];b7[b8[1]]=cb.add;if(ca){cb.add(function(){b6=ca},i[b9^1][2].disable,i[2][2].lock)}e[b8[0]]=function(){e[b8[0]+"With"](this===e?b7:this,arguments);return this};e[b8[0]+"With"]=cb.fireWith});b7.promise(e);if(b5){b5.call(e,e)}return e},when:function(b8){var b6=0,ca=O.call(arguments),e=ca.length,b5=e!==1||(b8&&bH.isFunction(b8.promise))?e:0,cd=b5===1?b8:bH.Deferred(),b7=function(cf,cg,ce){return function(i){cg[cf]=this;ce[cf]=arguments.length>1?O.call(arguments):i;if(ce===cc){cd.notifyWith(cg,ce)}else{if(!(--b5)){cd.resolveWith(cg,ce)}}}},cc,b9,cb;if(e>1){cc=new Array(e);b9=new Array(e);cb=new Array(e);for(;b6<e;b6++){if(ca[b6]&&bH.isFunction(ca[b6].promise)){ca[b6].promise().done(b7(b6,cb,ca)).fail(cd.reject).progress(b7(b6,b9,cc))}else{--b5}}}if(!b5){cd.resolveWith(cb,ca)}return cd.promise()}});var aj;bH.fn.ready=function(e){bH.ready.promise().done(e);return this};bH.extend({isReady:false,readyWait:1,holdReady:function(e){if(e){bH.readyWait++}else{bH.ready(true)}},ready:function(e){if(e===true?--bH.readyWait:bH.isReady){return}if(!n.body){return setTimeout(bH.ready)}bH.isReady=true;if(e!==true&&--bH.readyWait>0){return}aj.resolveWith(n,[bH]);if(bH.fn.triggerHandler){bH(n).triggerHandler("ready");bH(n).off("ready")}}});function bl(){if(n.addEventListener){n.removeEventListener("DOMContentLoaded",bY,false);a4.removeEventListener("load",bY,false)}else{n.detachEvent("onreadystatechange",bY);a4.detachEvent("onload",bY)}}function bY(){if(n.addEventListener||event.type==="load"||n.readyState==="complete"){bl();bH.ready()}}bH.ready.promise=function(b7){if(!aj){aj=bH.Deferred();if(n.readyState==="complete"){setTimeout(bH.ready)}else{if(n.addEventListener){n.addEventListener("DOMContentLoaded",bY,false);a4.addEventListener("load",bY,false)}else{n.attachEvent("onreadystatechange",bY);a4.attachEvent("onload",bY);var b6=false;try{b6=a4.frameElement==null&&n.documentElement}catch(b5){}if(b6&&b6.doScroll){(function i(){if(!bH.isReady){try{b6.doScroll("left")}catch(b8){return setTimeout(i,50)}bl();bH.ready()}})()}}}}return aj.promise(b7)};var aB=typeof undefined;var bg;for(bg in bH(C)){break}C.ownLast=bg!=="0";C.inlineBlockNeedsLayout=false;bH(function(){var b5,b6,e,i;e=n.getElementsByTagName("body")[0];if(!e||!e.style){return}b6=n.createElement("div");i=n.createElement("div");i.style.cssText="position:absolute;border:0;width:0;height:0;top:0;left:-9999px";e.appendChild(i).appendChild(b6);if(typeof b6.style.zoom!==aB){b6.style.cssText="display:inline;margin:0;border:0;padding:1px;width:1px;zoom:1";C.inlineBlockNeedsLayout=b5=b6.offsetWidth===3;if(b5){e.style.zoom=1}}e.removeChild(i)});(function(){var b5=n.createElement("div");if(C.deleteExpando==null){C.deleteExpando=true;try{delete b5.test}catch(i){C.deleteExpando=false}}b5=null})();bH.acceptData=function(b5){var i=bH.noData[(b5.nodeName+" ").toLowerCase()],e=+b5.nodeType||1;return e!==1&&e!==9?false:!i||i!==true&&b5.getAttribute("classid")===i};var bx=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,aP=/([A-Z])/g;function bz(b6,b5,b7){if(b7===undefined&&b6.nodeType===1){var i="data-"+b5.replace(aP,"-$1").toLowerCase();b7=b6.getAttribute(i);if(typeof b7==="string"){try{b7=b7==="true"?true:b7==="false"?false:b7==="null"?null:+b7+""===b7?+b7:bx.test(b7)?bH.parseJSON(b7):b7}catch(b8){}bH.data(b6,b5,b7)}else{b7=undefined}}return b7}function P(i){var e;for(e in i){if(e==="data"&&bH.isEmptyObject(i[e])){continue}if(e!=="toJSON"){return false}}return true}function bb(b6,i,b8,b7){if(!bH.acceptData(b6)){return}var ca,b9,cb=bH.expando,cc=b6.nodeType,e=cc?bH.cache:b6,b5=cc?b6[cb]:b6[cb]&&cb;if((!b5||!e[b5]||(!b7&&!e[b5].data))&&b8===undefined&&typeof i==="string"){return}if(!b5){if(cc){b5=b6[cb]=aO.pop()||bH.guid++}else{b5=cb}}if(!e[b5]){e[b5]=cc?{}:{toJSON:bH.noop}}if(typeof i==="object"||typeof i==="function"){if(b7){e[b5]=bH.extend(e[b5],i)}else{e[b5].data=bH.extend(e[b5].data,i)}}b9=e[b5];if(!b7){if(!b9.data){b9.data={}}b9=b9.data}if(b8!==undefined){b9[bH.camelCase(i)]=b8}if(typeof i==="string"){ca=b9[i];if(ca==null){ca=b9[bH.camelCase(i)]}}else{ca=b9}return ca}function aa(b8,b6,e){if(!bH.acceptData(b8)){return}var ca,b7,b9=b8.nodeType,b5=b9?bH.cache:b8,cb=b9?b8[bH.expando]:bH.expando;if(!b5[cb]){return}if(b6){ca=e?b5[cb]:b5[cb].data;if(ca){if(!bH.isArray(b6)){if(b6 in ca){b6=[b6]}else{b6=bH.camelCase(b6);if(b6 in ca){b6=[b6]}else{b6=b6.split(" ")}}}else{b6=b6.concat(bH.map(b6,bH.camelCase))}b7=b6.length;while(b7--){delete ca[b6[b7]]}if(e?!P(ca):!bH.isEmptyObject(ca)){return}}}if(!e){delete b5[cb].data;if(!P(b5[cb])){return}}if(b9){bH.cleanData([b8],true)}else{if(C.deleteExpando||b5!=b5.window){delete b5[cb]}else{b5[cb]=null}}}bH.extend({cache:{},noData:{"applet ":true,"embed ":true,"object ":"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"},hasData:function(e){e=e.nodeType?bH.cache[e[bH.expando]]:e[bH.expando];return !!e&&!P(e)},data:function(i,e,b5){return bb(i,e,b5)},removeData:function(i,e){return aa(i,e)},_data:function(i,e,b5){return bb(i,e,b5,true)},_removeData:function(i,e){return aa(i,e,true)}});bH.fn.extend({data:function(b7,ca){var b6,b5,b9,b8=this[0],e=b8&&b8.attributes;if(b7===undefined){if(this.length){b9=bH.data(b8);if(b8.nodeType===1&&!bH._data(b8,"parsedAttrs")){b6=e.length;while(b6--){if(e[b6]){b5=e[b6].name;if(b5.indexOf("data-")===0){b5=bH.camelCase(b5.slice(5));bz(b8,b5,b9[b5])}}}bH._data(b8,"parsedAttrs",true)}}return b9}if(typeof b7==="object"){return this.each(function(){bH.data(this,b7)})}return arguments.length>1?this.each(function(){bH.data(this,b7,ca)}):b8?bz(b8,b7,bH.data(b8,b7)):undefined},removeData:function(e){return this.each(function(){bH.removeData(this,e)})}});bH.extend({queue:function(b5,i,b6){var e;if(b5){i=(i||"fx")+"queue";e=bH._data(b5,i);if(b6){if(!e||bH.isArray(b6)){e=bH._data(b5,i,bH.makeArray(b6))}else{e.push(b6)}}return e||[]}},dequeue:function(b8,b7){b7=b7||"fx";var i=bH.queue(b8,b7),b9=i.length,b6=i.shift(),e=bH._queueHooks(b8,b7),b5=function(){bH.dequeue(b8,b7)};if(b6==="inprogress"){b6=i.shift();b9--}if(b6){if(b7==="fx"){i.unshift("inprogress")}delete e.stop;b6.call(b8,b5,e)}if(!b9&&e){e.empty.fire()}},_queueHooks:function(b5,i){var e=i+"queueHooks";return bH._data(b5,e)||bH._data(b5,e,{empty:bH.Callbacks("once memory").add(function(){bH._removeData(b5,i+"queue");bH._removeData(b5,e)})})}});bH.fn.extend({queue:function(e,i){var b5=2;if(typeof e!=="string"){i=e;e="fx";b5--}if(arguments.length<b5){return bH.queue(this[0],e)}return i===undefined?this:this.each(function(){var b6=bH.queue(this,e,i);bH._queueHooks(this,e);if(e==="fx"&&b6[0]!=="inprogress"){bH.dequeue(this,e)}})},dequeue:function(e){return this.each(function(){bH.dequeue(this,e)})},clearQueue:function(e){return this.queue(e||"fx",[])},promise:function(b6,ca){var b5,b7=1,cb=bH.Deferred(),b9=this,e=this.length,b8=function(){if(!(--b7)){cb.resolveWith(b9,[b9])}};if(typeof b6!=="string"){ca=b6;b6=undefined}b6=b6||"fx";while(e--){b5=bH._data(b9[e],b6+"queueHooks");if(b5&&b5.empty){b7++;b5.empty.add(b8)}}b8();return cb.promise(ca)}});var aD=(/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/).source;var bS=["Top","Right","Bottom","Left"];var R=function(i,e){i=e||i;return bH.css(i,"display")==="none"||!bH.contains(i.ownerDocument,i)};var aA=bH.access=function(e,b9,cb,ca,b7,cd,cc){var b6=0,b5=e.length,b8=cb==null;if(bH.type(cb)==="object"){b7=true;for(b6 in cb){bH.access(e,b9,b6,cb[b6],true,cd,cc)}}else{if(ca!==undefined){b7=true;if(!bH.isFunction(ca)){cc=true}if(b8){if(cc){b9.call(e,ca);b9=null}else{b8=b9;b9=function(ce,i,cf){return b8.call(bH(ce),cf)}}}if(b9){for(;b6<b5;b6++){b9(e[b6],cb,cc?ca:ca.call(e[b6],b6,b9(e[b6],cb)))}}}}return b7?e:b8?b9.call(e):b5?b9(e[0],cb):cd};var aL=(/^(?:checkbox|radio)$/i);(function(){var i=n.createElement("input"),b7=n.createElement("div"),b5=n.createDocumentFragment();b7.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";C.leadingWhitespace=b7.firstChild.nodeType===3;C.tbody=!b7.getElementsByTagName("tbody").length;C.htmlSerialize=!!b7.getElementsByTagName("link").length;C.html5Clone=n.createElement("nav").cloneNode(true).outerHTML!=="<:nav></:nav>";i.type="checkbox";i.checked=true;b5.appendChild(i);C.appendChecked=i.checked;b7.innerHTML="<textarea>x</textarea>";C.noCloneChecked=!!b7.cloneNode(true).lastChild.defaultValue;b5.appendChild(b7);b7.innerHTML="<input type='radio' checked='checked' name='t'/>";C.checkClone=b7.cloneNode(true).cloneNode(true).lastChild.checked;C.noCloneEvent=true;if(b7.attachEvent){b7.attachEvent("onclick",function(){C.noCloneEvent=false});b7.cloneNode(true).click()}if(C.deleteExpando==null){C.deleteExpando=true;try{delete b7.test}catch(b6){C.deleteExpando=false}}})();(function(){var b5,e,b6=n.createElement("div");for(b5 in {submit:true,change:true,focusin:true}){e="on"+b5;if(!(C[b5+"Bubbles"]=e in a4)){b6.setAttribute(e,"t");C[b5+"Bubbles"]=b6.attributes[e].expando===false}}b6=null})();var bF=/^(?:input|select|textarea)$/i,a5=/^key/,bL=/^(?:mouse|pointer|contextmenu)|click/,bB=/^(?:focusinfocus|focusoutblur)$/,bw=/^([^.]*)(?:\.(.+)|)$/;function T(){return true}function Y(){return false}function al(){try{return n.activeElement}catch(e){}}bH.event={global:{},add:function(b7,cc,ch,b9,b8){var ca,ci,cj,b5,ce,cb,cg,b6,cf,e,i,cd=bH._data(b7);if(!cd){return}if(ch.handler){b5=ch;ch=b5.handler;b8=b5.selector}if(!ch.guid){ch.guid=bH.guid++}if(!(ci=cd.events)){ci=cd.events={}}if(!(cb=cd.handle)){cb=cd.handle=function(ck){return typeof bH!==aB&&(!ck||bH.event.triggered!==ck.type)?bH.event.dispatch.apply(cb.elem,arguments):undefined};cb.elem=b7}cc=(cc||"").match(aE)||[""];cj=cc.length;while(cj--){ca=bw.exec(cc[cj])||[];cf=i=ca[1];e=(ca[2]||"").split(".").sort();if(!cf){continue}ce=bH.event.special[cf]||{};cf=(b8?ce.delegateType:ce.bindType)||cf;ce=bH.event.special[cf]||{};cg=bH.extend({type:cf,origType:i,data:b9,handler:ch,guid:ch.guid,selector:b8,needsContext:b8&&bH.expr.match.needsContext.test(b8),namespace:e.join(".")},b5);if(!(b6=ci[cf])){b6=ci[cf]=[];b6.delegateCount=0;if(!ce.setup||ce.setup.call(b7,b9,e,cb)===false){if(b7.addEventListener){b7.addEventListener(cf,cb,false)}else{if(b7.attachEvent){b7.attachEvent("on"+cf,cb)}}}}if(ce.add){ce.add.call(b7,cg);if(!cg.handler.guid){cg.handler.guid=ch.guid}}if(b8){b6.splice(b6.delegateCount++,0,cg)}else{b6.push(cg)}bH.event.global[cf]=true}b7=null},remove:function(b6,cc,cj,b7,cb){var b9,cg,ca,b8,ci,ch,ce,b5,cf,e,i,cd=bH.hasData(b6)&&bH._data(b6);if(!cd||!(ch=cd.events)){return}cc=(cc||"").match(aE)||[""];ci=cc.length;while(ci--){ca=bw.exec(cc[ci])||[];cf=i=ca[1];e=(ca[2]||"").split(".").sort();if(!cf){for(cf in ch){bH.event.remove(b6,cf+cc[ci],cj,b7,true)}continue}ce=bH.event.special[cf]||{};cf=(b7?ce.delegateType:ce.bindType)||cf;b5=ch[cf]||[];ca=ca[2]&&new RegExp("(^|\\.)"+e.join("\\.(?:.*\\.|)")+"(\\.|$)");b8=b9=b5.length;while(b9--){cg=b5[b9];if((cb||i===cg.origType)&&(!cj||cj.guid===cg.guid)&&(!ca||ca.test(cg.namespace))&&(!b7||b7===cg.selector||b7==="**"&&cg.selector)){b5.splice(b9,1);if(cg.selector){b5.delegateCount--}if(ce.remove){ce.remove.call(b6,cg)}}}if(b8&&!b5.length){if(!ce.teardown||ce.teardown.call(b6,e,cd.handle)===false){bH.removeEvent(b6,cf,cd.handle)}delete ch[cf]}}if(bH.isEmptyObject(ch)){delete cd.handle;bH._removeData(b6,"events")}},trigger:function(b5,cc,b8,cj){var cd,b7,ch,ci,cf,cb,ca,b9=[b8||n],cg=J.call(b5,"type")?b5.type:b5,b6=J.call(b5,"namespace")?b5.namespace.split("."):[];ch=cb=b8=b8||n;if(b8.nodeType===3||b8.nodeType===8){return}if(bB.test(cg+bH.event.triggered)){return}if(cg.indexOf(".")>=0){b6=cg.split(".");cg=b6.shift();b6.sort()}b7=cg.indexOf(":")<0&&"on"+cg;b5=b5[bH.expando]?b5:new bH.Event(cg,typeof b5==="object"&&b5);b5.isTrigger=cj?2:3;b5.namespace=b6.join(".");b5.namespace_re=b5.namespace?new RegExp("(^|\\.)"+b6.join("\\.(?:.*\\.|)")+"(\\.|$)"):null;b5.result=undefined;if(!b5.target){b5.target=b8}cc=cc==null?[b5]:bH.makeArray(cc,[b5]);cf=bH.event.special[cg]||{};if(!cj&&cf.trigger&&cf.trigger.apply(b8,cc)===false){return}if(!cj&&!cf.noBubble&&!bH.isWindow(b8)){ci=cf.delegateType||cg;if(!bB.test(ci+cg)){ch=ch.parentNode}for(;ch;ch=ch.parentNode){b9.push(ch);cb=ch}if(cb===(b8.ownerDocument||n)){b9.push(cb.defaultView||cb.parentWindow||a4)}}ca=0;while((ch=b9[ca++])&&!b5.isPropagationStopped()){b5.type=ca>1?ci:cf.bindType||cg;cd=(bH._data(ch,"events")||{})[b5.type]&&bH._data(ch,"handle");if(cd){cd.apply(ch,cc)}cd=b7&&ch[b7];if(cd&&cd.apply&&bH.acceptData(ch)){b5.result=cd.apply(ch,cc);if(b5.result===false){b5.preventDefault()}}}b5.type=cg;if(!cj&&!b5.isDefaultPrevented()){if((!cf._default||cf._default.apply(b9.pop(),cc)===false)&&bH.acceptData(b8)){if(b7&&b8[cg]&&!bH.isWindow(b8)){cb=b8[b7];if(cb){b8[b7]=null}bH.event.triggered=cg;try{b8[cg]()}catch(ce){}bH.event.triggered=undefined;if(cb){b8[b7]=cb}}}}return b5.result},dispatch:function(e){e=bH.event.fix(e);var b8,b9,cd,b5,b7,cc=[],cb=O.call(arguments),b6=(bH._data(this,"events")||{})[e.type]||[],ca=bH.event.special[e.type]||{};cb[0]=e;e.delegateTarget=this;if(ca.preDispatch&&ca.preDispatch.call(this,e)===false){return}cc=bH.event.handlers.call(this,e,b6);b8=0;while((b5=cc[b8++])&&!e.isPropagationStopped()){e.currentTarget=b5.elem;b7=0;while((cd=b5.handlers[b7++])&&!e.isImmediatePropagationStopped()){if(!e.namespace_re||e.namespace_re.test(cd.namespace)){e.handleObj=cd;e.data=cd.data;b9=((bH.event.special[cd.origType]||{}).handle||cd.handler).apply(b5.elem,cb);if(b9!==undefined){if((e.result=b9)===false){e.preventDefault();e.stopPropagation()}}}}}if(ca.postDispatch){ca.postDispatch.call(this,e)}return e.result},handlers:function(e,b6){var b5,cb,b9,b8,ca=[],b7=b6.delegateCount,cc=e.target;if(b7&&cc.nodeType&&(!e.button||e.type!=="click")){for(;cc!=this;cc=cc.parentNode||this){if(cc.nodeType===1&&(cc.disabled!==true||e.type!=="click")){b9=[];for(b8=0;b8<b7;b8++){cb=b6[b8];b5=cb.selector+" ";if(b9[b5]===undefined){b9[b5]=cb.needsContext?bH(b5,this).index(cc)>=0:bH.find(b5,this,null,[cc]).length}if(b9[b5]){b9.push(cb)}}if(b9.length){ca.push({elem:cc,handlers:b9})}}}}if(b7<b6.length){ca.push({elem:this,handlers:b6.slice(b7)})}return ca},fix:function(b7){if(b7[bH.expando]){return b7}var b5,ca,b9,b6=b7.type,e=b7,b8=this.fixHooks[b6];if(!b8){this.fixHooks[b6]=b8=bL.test(b6)?this.mouseHooks:a5.test(b6)?this.keyHooks:{}}b9=b8.props?this.props.concat(b8.props):this.props;b7=new bH.Event(e);b5=b9.length;while(b5--){ca=b9[b5];b7[ca]=e[ca]}if(!b7.target){b7.target=e.srcElement||n}if(b7.target.nodeType===3){b7.target=b7.target.parentNode}b7.metaKey=!!b7.metaKey;return b8.filter?b8.filter(b7,e):b7},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(i,e){if(i.which==null){i.which=e.charCode!=null?e.charCode:e.keyCode}return i}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(b6,b5){var e,b7,b8,i=b5.button,b9=b5.fromElement;if(b6.pageX==null&&b5.clientX!=null){b7=b6.target.ownerDocument||n;b8=b7.documentElement;e=b7.body;b6.pageX=b5.clientX+(b8&&b8.scrollLeft||e&&e.scrollLeft||0)-(b8&&b8.clientLeft||e&&e.clientLeft||0);b6.pageY=b5.clientY+(b8&&b8.scrollTop||e&&e.scrollTop||0)-(b8&&b8.clientTop||e&&e.clientTop||0)}if(!b6.relatedTarget&&b9){b6.relatedTarget=b9===b6.target?b5.toElement:b9}if(!b6.which&&i!==undefined){b6.which=(i&1?1:(i&2?3:(i&4?2:0)))}return b6}},special:{load:{noBubble:true},focus:{trigger:function(){if(this!==al()&&this.focus){try{this.focus();return false}catch(i){}}},delegateType:"focusin"},blur:{trigger:function(){if(this===al()&&this.blur){this.blur();return false}},delegateType:"focusout"},click:{trigger:function(){if(bH.nodeName(this,"input")&&this.type==="checkbox"&&this.click){this.click();return false}},_default:function(e){return bH.nodeName(e.target,"a")}},beforeunload:{postDispatch:function(e){if(e.result!==undefined&&e.originalEvent){e.originalEvent.returnValue=e.result}}}},simulate:function(b5,b7,b6,i){var b8=bH.extend(new bH.Event(),b6,{type:b5,isSimulated:true,originalEvent:{}});if(i){bH.event.trigger(b8,null,b7)}else{bH.event.dispatch.call(b7,b8)}if(b8.isDefaultPrevented()){b6.preventDefault()}}};bH.removeEvent=n.removeEventListener?function(i,e,b5){if(i.removeEventListener){i.removeEventListener(e,b5,false)}}:function(b5,i,b6){var e="on"+i;if(b5.detachEvent){if(typeof b5[e]===aB){b5[e]=null}b5.detachEvent(e,b6)}};bH.Event=function(i,e){if(!(this instanceof bH.Event)){return new bH.Event(i,e)}if(i&&i.type){this.originalEvent=i;this.type=i.type;this.isDefaultPrevented=i.defaultPrevented||i.defaultPrevented===undefined&&i.returnValue===false?T:Y}else{this.type=i}if(e){bH.extend(this,e)}this.timeStamp=i&&i.timeStamp||bH.now();this[bH.expando]=true};bH.Event.prototype={isDefaultPrevented:Y,isPropagationStopped:Y,isImmediatePropagationStopped:Y,preventDefault:function(){var i=this.originalEvent;this.isDefaultPrevented=T;if(!i){return}if(i.preventDefault){i.preventDefault()}else{i.returnValue=false}},stopPropagation:function(){var i=this.originalEvent;this.isPropagationStopped=T;if(!i){return}if(i.stopPropagation){i.stopPropagation()}i.cancelBubble=true},stopImmediatePropagation:function(){var i=this.originalEvent;this.isImmediatePropagationStopped=T;if(i&&i.stopImmediatePropagation){i.stopImmediatePropagation()}this.stopPropagation()}};bH.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(i,e){bH.event.special[i]={delegateType:e,bindType:e,handle:function(b7){var b5,b9=this,b8=b7.relatedTarget,b6=b7.handleObj;if(!b8||(b8!==b9&&!bH.contains(b9,b8))){b7.type=b6.origType;b5=b6.handler.apply(this,arguments);b7.type=e}return b5}}});if(!C.submitBubbles){bH.event.special.submit={setup:function(){if(bH.nodeName(this,"form")){return false}bH.event.add(this,"click._submit keypress._submit",function(b6){var b5=b6.target,i=bH.nodeName(b5,"input")||bH.nodeName(b5,"button")?b5.form:undefined;if(i&&!bH._data(i,"submitBubbles")){bH.event.add(i,"submit._submit",function(e){e._submit_bubble=true});bH._data(i,"submitBubbles",true)}})},postDispatch:function(e){if(e._submit_bubble){delete e._submit_bubble;if(this.parentNode&&!e.isTrigger){bH.event.simulate("submit",this.parentNode,e,true)}}},teardown:function(){if(bH.nodeName(this,"form")){return false}bH.event.remove(this,"._submit")}}}if(!C.changeBubbles){bH.event.special.change={setup:function(){if(bF.test(this.nodeName)){if(this.type==="checkbox"||this.type==="radio"){bH.event.add(this,"propertychange._change",function(e){if(e.originalEvent.propertyName==="checked"){this._just_changed=true}});bH.event.add(this,"click._change",function(e){if(this._just_changed&&!e.isTrigger){this._just_changed=false}bH.event.simulate("change",this,e,true)})}return false}bH.event.add(this,"beforeactivate._change",function(b5){var i=b5.target;if(bF.test(i.nodeName)&&!bH._data(i,"changeBubbles")){bH.event.add(i,"change._change",function(e){if(this.parentNode&&!e.isSimulated&&!e.isTrigger){bH.event.simulate("change",this.parentNode,e,true)}});bH._data(i,"changeBubbles",true)}})},handle:function(i){var e=i.target;if(this!==e||i.isSimulated||i.isTrigger||(e.type!=="radio"&&e.type!=="checkbox")){return i.handleObj.handler.apply(this,arguments)}},teardown:function(){bH.event.remove(this,"._change");return !bF.test(this.nodeName)}}}if(!C.focusinBubbles){bH.each({focus:"focusin",blur:"focusout"},function(b5,e){var i=function(b6){bH.event.simulate(e,b6.target,bH.event.fix(b6),true)};bH.event.special[e]={setup:function(){var b7=this.ownerDocument||this,b6=bH._data(b7,e);if(!b6){b7.addEventListener(b5,i,true)}bH._data(b7,e,(b6||0)+1)},teardown:function(){var b7=this.ownerDocument||this,b6=bH._data(b7,e)-1;if(!b6){b7.removeEventListener(b5,i,true);bH._removeData(b7,e)}else{bH._data(b7,e,b6)}}}})}bH.fn.extend({on:function(b5,e,b8,b7,i){var b6,b9;if(typeof b5==="object"){if(typeof e!=="string"){b8=b8||e;e=undefined}for(b6 in b5){this.on(b6,e,b8,b5[b6],i)}return this}if(b8==null&&b7==null){b7=e;b8=e=undefined}else{if(b7==null){if(typeof e==="string"){b7=b8;b8=undefined}else{b7=b8;b8=e;e=undefined}}}if(b7===false){b7=Y}else{if(!b7){return this}}if(i===1){b9=b7;b7=function(ca){bH().off(ca);return b9.apply(this,arguments)};b7.guid=b9.guid||(b9.guid=bH.guid++)}return this.each(function(){bH.event.add(this,b5,b7,b8,e)})},one:function(i,e,b6,b5){return this.on(i,e,b6,b5,1)},off:function(b5,e,b7){var i,b6;if(b5&&b5.preventDefault&&b5.handleObj){i=b5.handleObj;bH(b5.delegateTarget).off(i.namespace?i.origType+"."+i.namespace:i.origType,i.selector,i.handler);return this}if(typeof b5==="object"){for(b6 in b5){this.off(b6,e,b5[b6])}return this}if(e===false||typeof e==="function"){b7=e;e=undefined}if(b7===false){b7=Y}return this.each(function(){bH.event.remove(this,b5,b7,e)})},trigger:function(e,i){return this.each(function(){bH.event.trigger(e,i,this)})},triggerHandler:function(e,b5){var i=this[0];if(i){return bH.event.trigger(e,b5,i,true)}}});function A(e){var b5=d.split("|"),i=e.createDocumentFragment();if(i.createElement){while(b5.length){i.createElement(b5.pop())}}return i}var d="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",aC=/ jQuery\d+="(?:null|\d+)"/g,L=new RegExp("<(?:"+d+")[\\s/>]","i"),b4=/^\s+/,aG=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,o=/<([\w:]+)/,bZ=/<tbody/i,K=/<|&#?\w+;/,am=/<(?:script|style|link)/i,bV=/checked\s*(?:[^=]|=\s*.checked.)/i,bA=/^$|\/(?:java|ecma)script/i,aq=/^true\/(.*)/,aN=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,V={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:C.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]},aS=A(n),k=aS.appendChild(n.createElement("div"));V.optgroup=V.option;V.tbody=V.tfoot=V.colgroup=V.caption=V.thead;V.th=V.td;function l(b7,e){var b5,b8,b6=0,b9=typeof b7.getElementsByTagName!==aB?b7.getElementsByTagName(e||"*"):typeof b7.querySelectorAll!==aB?b7.querySelectorAll(e||"*"):undefined;if(!b9){for(b9=[],b5=b7.childNodes||b7;(b8=b5[b6])!=null;b6++){if(!e||bH.nodeName(b8,e)){b9.push(b8)}else{bH.merge(b9,l(b8,e))}}}return e===undefined||e&&bH.nodeName(b7,e)?bH.merge([b7],b9):b9}function bX(e){if(aL.test(e.type)){e.defaultChecked=e.checked}}function a2(i,e){return bH.nodeName(i,"table")&&bH.nodeName(e.nodeType!==11?e:e.firstChild,"tr")?i.getElementsByTagName("tbody")[0]||i.appendChild(i.ownerDocument.createElement("tbody")):i}function t(e){e.type=(bH.find.attr(e,"type")!==null)+"/"+e.type;return e}function be(i){var e=aq.exec(i.type);if(e){i.type=e[1]}else{i.removeAttribute("type")}return i}function bt(e,b6){var b7,b5=0;for(;(b7=e[b5])!=null;b5++){bH._data(b7,"globalEval",!b6||bH._data(b6[b5],"globalEval"))}}function ar(cb,b5){if(b5.nodeType!==1||!bH.hasData(cb)){return}var b8,b7,e,ca=bH._data(cb),b9=bH._data(b5,ca),b6=ca.events;if(b6){delete b9.handle;b9.events={};for(b8 in b6){for(b7=0,e=b6[b8].length;b7<e;b7++){bH.event.add(b5,b8,b6[b8][b7])}}}if(b9.data){b9.data=bH.extend({},b9.data)}}function S(b7,i){var b8,b6,b5;if(i.nodeType!==1){return}b8=i.nodeName.toLowerCase();if(!C.noCloneEvent&&i[bH.expando]){b5=bH._data(i);for(b6 in b5.events){bH.removeEvent(i,b6,b5.handle)}i.removeAttribute(bH.expando)}if(b8==="script"&&i.text!==b7.text){t(i).text=b7.text;be(i)}else{if(b8==="object"){if(i.parentNode){i.outerHTML=b7.outerHTML}if(C.html5Clone&&(b7.innerHTML&&!bH.trim(i.innerHTML))){i.innerHTML=b7.innerHTML}}else{if(b8==="input"&&aL.test(b7.type)){i.defaultChecked=i.checked=b7.checked;if(i.value!==b7.value){i.value=b7.value}}else{if(b8==="option"){i.defaultSelected=i.selected=b7.defaultSelected}else{if(b8==="input"||b8==="textarea"){i.defaultValue=b7.defaultValue}}}}}}bH.extend({clone:function(b5,b7,e){var b9,b6,cc,b8,ca,cb=bH.contains(b5.ownerDocument,b5);if(C.html5Clone||bH.isXMLDoc(b5)||!L.test("<"+b5.nodeName+">")){cc=b5.cloneNode(true)}else{k.innerHTML=b5.outerHTML;k.removeChild(cc=k.firstChild)}if((!C.noCloneEvent||!C.noCloneChecked)&&(b5.nodeType===1||b5.nodeType===11)&&!bH.isXMLDoc(b5)){b9=l(cc);ca=l(b5);for(b8=0;(b6=ca[b8])!=null;++b8){if(b9[b8]){S(b6,b9[b8])}}}if(b7){if(e){ca=ca||l(b5);b9=b9||l(cc);for(b8=0;(b6=ca[b8])!=null;b8++){ar(b6,b9[b8])}}else{ar(b5,cc)}}b9=l(cc,"script");if(b9.length>0){bt(b9,!cb&&l(b5,"script"))}b9=ca=b6=null;return cc},buildFragment:function(b5,b7,cc,ch){var cd,b9,cb,cg,ci,cf,b6,ca=b5.length,b8=A(b7),e=[],ce=0;for(;ce<ca;ce++){b9=b5[ce];if(b9||b9===0){if(bH.type(b9)==="object"){bH.merge(e,b9.nodeType?[b9]:b9)}else{if(!K.test(b9)){e.push(b7.createTextNode(b9))}else{cg=cg||b8.appendChild(b7.createElement("div"));ci=(o.exec(b9)||["",""])[1].toLowerCase();b6=V[ci]||V._default;cg.innerHTML=b6[1]+b9.replace(aG,"<$1></$2>")+b6[2];cd=b6[0];while(cd--){cg=cg.lastChild}if(!C.leadingWhitespace&&b4.test(b9)){e.push(b7.createTextNode(b4.exec(b9)[0]))}if(!C.tbody){b9=ci==="table"&&!bZ.test(b9)?cg.firstChild:b6[1]==="<table>"&&!bZ.test(b9)?cg:0;cd=b9&&b9.childNodes.length;while(cd--){if(bH.nodeName((cf=b9.childNodes[cd]),"tbody")&&!cf.childNodes.length){b9.removeChild(cf)}}}bH.merge(e,cg.childNodes);cg.textContent="";while(cg.firstChild){cg.removeChild(cg.firstChild)}cg=b8.lastChild}}}}if(cg){b8.removeChild(cg)}if(!C.appendChecked){bH.grep(l(e,"input"),bX)}ce=0;while((b9=e[ce++])){if(ch&&bH.inArray(b9,ch)!==-1){continue}cb=bH.contains(b9.ownerDocument,b9);cg=l(b8.appendChild(b9),"script");if(cb){bt(cg)}if(cc){cd=0;while((b9=cg[cd++])){if(bA.test(b9.type||"")){cc.push(b9)}}}}cg=null;return b8},cleanData:function(b5,cd){var b7,cc,b6,b8,b9=0,ce=bH.expando,e=bH.cache,ca=C.deleteExpando,cb=bH.event.special;for(;(b7=b5[b9])!=null;b9++){if(cd||bH.acceptData(b7)){b6=b7[ce];b8=b6&&e[b6];if(b8){if(b8.events){for(cc in b8.events){if(cb[cc]){bH.event.remove(b7,cc)}else{bH.removeEvent(b7,cc,b8.handle)}}}if(e[b6]){delete e[b6];if(ca){delete b7[ce]}else{if(typeof b7.removeAttribute!==aB){b7.removeAttribute(ce)}else{b7[ce]=null}}aO.push(b6)}}}}}});bH.fn.extend({text:function(e){return aA(this,function(i){return i===undefined?bH.text(this):this.empty().append((this[0]&&this[0].ownerDocument||n).createTextNode(i))},null,e,arguments.length)},append:function(){return this.domManip(arguments,function(e){if(this.nodeType===1||this.nodeType===11||this.nodeType===9){var i=a2(this,e);i.appendChild(e)}})},prepend:function(){return this.domManip(arguments,function(e){if(this.nodeType===1||this.nodeType===11||this.nodeType===9){var i=a2(this,e);i.insertBefore(e,i.firstChild)}})},before:function(){return this.domManip(arguments,function(e){if(this.parentNode){this.parentNode.insertBefore(e,this)}})},after:function(){return this.domManip(arguments,function(e){if(this.parentNode){this.parentNode.insertBefore(e,this.nextSibling)}})},remove:function(e,b8){var b7,b5=e?bH.filter(e,this):this,b6=0;for(;(b7=b5[b6])!=null;b6++){if(!b8&&b7.nodeType===1){bH.cleanData(l(b7))}if(b7.parentNode){if(b8&&bH.contains(b7.ownerDocument,b7)){bt(l(b7,"script"))}b7.parentNode.removeChild(b7)}}return this},empty:function(){var b5,e=0;for(;(b5=this[e])!=null;e++){if(b5.nodeType===1){bH.cleanData(l(b5,false))}while(b5.firstChild){b5.removeChild(b5.firstChild)}if(b5.options&&bH.nodeName(b5,"select")){b5.options.length=0}}return this},clone:function(i,e){i=i==null?false:i;e=e==null?i:e;return this.map(function(){return bH.clone(this,i,e)})},html:function(e){return aA(this,function(b8){var b7=this[0]||{},b6=0,b5=this.length;if(b8===undefined){return b7.nodeType===1?b7.innerHTML.replace(aC,""):undefined}if(typeof b8==="string"&&!am.test(b8)&&(C.htmlSerialize||!L.test(b8))&&(C.leadingWhitespace||!b4.test(b8))&&!V[(o.exec(b8)||["",""])[1].toLowerCase()]){b8=b8.replace(aG,"<$1></$2>");try{for(;b6<b5;b6++){b7=this[b6]||{};if(b7.nodeType===1){bH.cleanData(l(b7,false));b7.innerHTML=b8}}b7=0}catch(b9){}}if(b7){this.empty().append(b8)}},null,e,arguments.length)},replaceWith:function(){var e=arguments[0];this.domManip(arguments,function(i){e=this.parentNode;bH.cleanData(l(this));if(e){e.replaceChild(i,this)}});return e&&(e.length||e.nodeType)?this:this.remove()},detach:function(e){return this.remove(e,true)},domManip:function(cc,ch){cc=ay.apply([],cc);var ca,b6,e,b8,cf,cb,b9=0,b7=this.length,ce=this,cg=b7-1,cd=cc[0],b5=bH.isFunction(cd);if(b5||(b7>1&&typeof cd==="string"&&!C.checkClone&&bV.test(cd))){return this.each(function(ci){var i=ce.eq(ci);if(b5){cc[0]=cd.call(this,ci,i.html())}i.domManip(cc,ch)})}if(b7){cb=bH.buildFragment(cc,this[0].ownerDocument,false,this);ca=cb.firstChild;if(cb.childNodes.length===1){cb=ca}if(ca){b8=bH.map(l(cb,"script"),t);e=b8.length;for(;b9<b7;b9++){b6=cb;if(b9!==cg){b6=bH.clone(b6,true,true);if(e){bH.merge(b8,l(b6,"script"))}}ch.call(this[b9],b6,b9)}if(e){cf=b8[b8.length-1].ownerDocument;bH.map(b8,be);for(b9=0;b9<e;b9++){b6=b8[b9];if(bA.test(b6.type||"")&&!bH._data(b6,"globalEval")&&bH.contains(cf,b6)){if(b6.src){if(bH._evalUrl){bH._evalUrl(b6.src)}}else{bH.globalEval((b6.text||b6.textContent||b6.innerHTML||"").replace(aN,""))}}}}cb=ca=null}}return this}});bH.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(e,i){bH.fn[e]=function(b5){var b6,b8=0,b7=[],ca=bH(b5),b9=ca.length-1;for(;b8<=b9;b8++){b6=b8===b9?this:this.clone(true);bH(ca[b8])[i](b6);w.apply(b7,b6.get())}return this.pushStack(b7)}});var aH,bk={};function a3(e,b7){var i,b5=bH(b7.createElement(e)).appendTo(b7.body),b6=a4.getDefaultComputedStyle&&(i=a4.getDefaultComputedStyle(b5[0]))?i.display:bH.css(b5[0],"display");b5.detach();return b6}function aZ(b5){var i=n,e=bk[b5];if(!e){e=a3(b5,i);if(e==="none"||!e){aH=(aH||bH("<iframe frameborder='0' width='0' height='0'/>")).appendTo(i.documentElement);i=(aH[0].contentWindow||aH[0].contentDocument).document;i.write();i.close();e=a3(b5,i);aH.detach()}bk[b5]=e}return e}(function(){var e;C.shrinkWrapBlocks=function(){if(e!=null){return e}e=false;var b6,i,b5;i=n.getElementsByTagName("body")[0];if(!i||!i.style){return}b6=n.createElement("div");b5=n.createElement("div");b5.style.cssText="position:absolute;border:0;width:0;height:0;top:0;left:-9999px";i.appendChild(b5).appendChild(b6);if(typeof b6.style.zoom!==aB){b6.style.cssText="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:1px;width:1px;zoom:1";b6.appendChild(n.createElement("div")).style.width="5px";e=b6.offsetWidth!==3}i.removeChild(b5);return e}})();var aY=(/^margin/);var X=new RegExp("^("+aD+")(?!px)[a-z%]+$","i");var bp,F,bn=/^(top|right|bottom|left)$/;if(a4.getComputedStyle){bp=function(e){return e.ownerDocument.defaultView.getComputedStyle(e,null)};F=function(ca,i,b9){var b7,b6,b8,e,b5=ca.style;b9=b9||bp(ca);e=b9?b9.getPropertyValue(i)||b9[i]:undefined;if(b9){if(e===""&&!bH.contains(ca.ownerDocument,ca)){e=bH.style(ca,i)}if(X.test(e)&&aY.test(i)){b7=b5.width;b6=b5.minWidth;b8=b5.maxWidth;b5.minWidth=b5.maxWidth=b5.width=e;e=b9.width;b5.width=b7;b5.minWidth=b6;b5.maxWidth=b8}}return e===undefined?e:e+""}}else{if(n.documentElement.currentStyle){bp=function(e){return e.currentStyle};F=function(b9,b6,b8){var ca,i,e,b5,b7=b9.style;b8=b8||bp(b9);b5=b8?b8[b6]:undefined;if(b5==null&&b7&&b7[b6]){b5=b7[b6]}if(X.test(b5)&&!bn.test(b6)){ca=b7.left;i=b9.runtimeStyle;e=i&&i.left;if(e){i.left=b9.currentStyle.left}b7.left=b6==="fontSize"?"1em":b5;b5=b7.pixelLeft+"px";b7.left=ca;if(e){i.left=e}}return b5===undefined?b5:b5+""||"auto"}}}function a6(e,i){return{get:function(){var b5=e();if(b5==null){return}if(b5){delete this.get;return}return(this.get=i).apply(this,arguments)}}}(function(){var ca,b8,b6,b9,b5,b7,i;ca=n.createElement("div");ca.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";b6=ca.getElementsByTagName("a")[0];b8=b6&&b6.style;if(!b8){return}b8.cssText="float:left;opacity:.5";C.opacity=b8.opacity==="0.5";C.cssFloat=!!b8.cssFloat;ca.style.backgroundClip="content-box";ca.cloneNode(true).style.backgroundClip="";C.clearCloneStyle=ca.style.backgroundClip==="content-box";C.boxSizing=b8.boxSizing===""||b8.MozBoxSizing===""||b8.WebkitBoxSizing==="";bH.extend(C,{reliableHiddenOffsets:function(){if(b7==null){e()}return b7},boxSizingReliable:function(){if(b5==null){e()}return b5},pixelPosition:function(){if(b9==null){e()}return b9},reliableMarginRight:function(){if(i==null){e()}return i}});function e(){var ce,cb,cc,cd;cb=n.getElementsByTagName("body")[0];if(!cb||!cb.style){return}ce=n.createElement("div");cc=n.createElement("div");cc.style.cssText="position:absolute;border:0;width:0;height:0;top:0;left:-9999px";cb.appendChild(cc).appendChild(ce);ce.style.cssText="-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;display:block;margin-top:1%;top:1%;border:1px;padding:1px;width:4px;position:absolute";b9=b5=false;i=true;if(a4.getComputedStyle){b9=(a4.getComputedStyle(ce,null)||{}).top!=="1%";b5=(a4.getComputedStyle(ce,null)||{width:"4px"}).width==="4px";cd=ce.appendChild(n.createElement("div"));cd.style.cssText=ce.style.cssText="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0";cd.style.marginRight=cd.style.width="0";ce.style.width="1px";i=!parseFloat((a4.getComputedStyle(cd,null)||{}).marginRight)}ce.innerHTML="<table><tr><td></td><td>t</td></tr></table>";cd=ce.getElementsByTagName("td");cd[0].style.cssText="margin:0;border:0;padding:0;display:none";b7=cd[0].offsetHeight===0;if(b7){cd[0].style.display="";cd[1].style.display="none";b7=cd[0].offsetHeight===0}cb.removeChild(cc)}})();bH.swap=function(b8,b7,b9,b6){var b5,i,e={};for(i in b7){e[i]=b8.style[i];b8.style[i]=b7[i]}b5=b9.apply(b8,b6||[]);for(i in b7){b8.style[i]=e[i]}return b5};var bi=/alpha\([^)]*\)/i,aT=/opacity\s*=\s*([^)]*)/,G=/^(none|table(?!-c[ea]).+)/,ba=new RegExp("^("+aD+")(.*)$","i"),U=new RegExp("^([+-])=("+aD+")","i"),bd={position:"absolute",visibility:"hidden",display:"block"},bC={letterSpacing:"0",fontWeight:"400"},av=["Webkit","O","Moz","ms"];function c(b7,b5){if(b5 in b7){return b5}var b8=b5.charAt(0).toUpperCase()+b5.slice(1),e=b5,b6=av.length;while(b6--){b5=av[b6]+b8;if(b5 in b7){return b5}}return e}function r(b9,e){var ca,b7,b8,i=[],b5=0,b6=b9.length;for(;b5<b6;b5++){b7=b9[b5];if(!b7.style){continue}i[b5]=bH._data(b7,"olddisplay");ca=b7.style.display;if(e){if(!i[b5]&&ca==="none"){b7.style.display=""}if(b7.style.display===""&&R(b7)){i[b5]=bH._data(b7,"olddisplay",aZ(b7.nodeName))}}else{b8=R(b7);if(ca&&ca!=="none"||!b8){bH._data(b7,"olddisplay",b8?ca:bH.css(b7,"display"))}}}for(b5=0;b5<b6;b5++){b7=b9[b5];if(!b7.style){continue}if(!e||b7.style.display==="none"||b7.style.display===""){b7.style.display=e?i[b5]||"":"none"}}return b9}function aM(e,b5,b6){var i=ba.exec(b5);return i?Math.max(0,i[1]-(b6||0))+(i[2]||"px"):b5}function aw(b8,b5,e,ca,b7){var b6=e===(ca?"border":"content")?4:b5==="width"?1:0,b9=0;for(;b6<4;b6+=2){if(e==="margin"){b9+=bH.css(b8,e+bS[b6],true,b7)}if(ca){if(e==="content"){b9-=bH.css(b8,"padding"+bS[b6],true,b7)}if(e!=="margin"){b9-=bH.css(b8,"border"+bS[b6]+"Width",true,b7)}}else{b9+=bH.css(b8,"padding"+bS[b6],true,b7);if(e!=="padding"){b9+=bH.css(b8,"border"+bS[b6]+"Width",true,b7)}}}return b9}function u(b7,i,e){var b6=true,b8=i==="width"?b7.offsetWidth:b7.offsetHeight,b5=bp(b7),b9=C.boxSizing&&bH.css(b7,"boxSizing",false,b5)==="border-box";if(b8<=0||b8==null){b8=F(b7,i,b5);if(b8<0||b8==null){b8=b7.style[i]}if(X.test(b8)){return b8}b6=b9&&(C.boxSizingReliable()||b8===b7.style[i]);b8=parseFloat(b8)||0}return(b8+aw(b7,i,e||(b9?"border":"content"),b6,b5))+"px"}bH.extend({cssHooks:{opacity:{get:function(b5,i){if(i){var e=F(b5,"opacity");return e===""?"1":e}}}},cssNumber:{columnCount:true,fillOpacity:true,flexGrow:true,flexShrink:true,fontWeight:true,lineHeight:true,opacity:true,order:true,orphans:true,widows:true,zIndex:true,zoom:true},cssProps:{"float":C.cssFloat?"cssFloat":"styleFloat"},style:function(b6,b5,cc,b7){if(!b6||b6.nodeType===3||b6.nodeType===8||!b6.style){return}var ca,cb,cd,b8=bH.camelCase(b5),i=b6.style;b5=bH.cssProps[b8]||(bH.cssProps[b8]=c(i,b8));cd=bH.cssHooks[b5]||bH.cssHooks[b8];if(cc!==undefined){cb=typeof cc;if(cb==="string"&&(ca=U.exec(cc))){cc=(ca[1]+1)*ca[2]+parseFloat(bH.css(b6,b5));cb="number"}if(cc==null||cc!==cc){return}if(cb==="number"&&!bH.cssNumber[b8]){cc+="px"}if(!C.clearCloneStyle&&cc===""&&b5.indexOf("background")===0){i[b5]="inherit"}if(!cd||!("set" in cd)||(cc=cd.set(b6,cc,b7))!==undefined){try{i[b5]=cc}catch(b9){}}}else{if(cd&&"get" in cd&&(ca=cd.get(b6,false,b7))!==undefined){return ca}return i[b5]}},css:function(b9,b7,i,b8){var b6,ca,e,b5=bH.camelCase(b7);b7=bH.cssProps[b5]||(bH.cssProps[b5]=c(b9.style,b5));e=bH.cssHooks[b7]||bH.cssHooks[b5];if(e&&"get" in e){ca=e.get(b9,true,i)}if(ca===undefined){ca=F(b9,b7,b8)}if(ca==="normal"&&b7 in bC){ca=bC[b7]}if(i===""||i){b6=parseFloat(ca);return i===true||bH.isNumeric(b6)?b6||0:ca}return ca}});bH.each(["height","width"],function(b5,e){bH.cssHooks[e]={get:function(b7,b6,i){if(b6){return G.test(bH.css(b7,"display"))&&b7.offsetWidth===0?bH.swap(b7,bd,function(){return u(b7,e,i)}):u(b7,e,i)}},set:function(b7,b8,i){var b6=i&&bp(b7);return aM(b7,b8,i?aw(b7,e,i,C.boxSizing&&bH.css(b7,"boxSizing",false,b6)==="border-box",b6):0)}}});if(!C.opacity){bH.cssHooks.opacity={get:function(i,e){return aT.test((e&&i.currentStyle?i.currentStyle.filter:i.style.filter)||"")?(0.01*parseFloat(RegExp.$1))+"":e?"1":""},set:function(b7,b8){var b6=b7.style,i=b7.currentStyle,e=bH.isNumeric(b8)?"alpha(opacity="+b8*100+")":"",b5=i&&i.filter||b6.filter||"";b6.zoom=1;if((b8>=1||b8==="")&&bH.trim(b5.replace(bi,""))===""&&b6.removeAttribute){b6.removeAttribute("filter");if(b8===""||i&&!i.filter){return}}b6.filter=bi.test(b5)?b5.replace(bi,e):b5+" "+e}}}bH.cssHooks.marginRight=a6(C.reliableMarginRight,function(i,e){if(e){return bH.swap(i,{display:"inline-block"},F,[i,"marginRight"])}});bH.each({margin:"",padding:"",border:"Width"},function(e,i){bH.cssHooks[e+i]={expand:function(b7){var b6=0,b5={},b8=typeof b7==="string"?b7.split(" "):[b7];for(;b6<4;b6++){b5[e+bS[b6]+i]=b8[b6]||b8[b6-2]||b8[0]}return b5}};if(!aY.test(e)){bH.cssHooks[e+i].set=aM}});bH.fn.extend({css:function(e,i){return aA(this,function(b9,b6,ca){var b8,b5,cb={},b7=0;if(bH.isArray(b6)){b8=bp(b9);b5=b6.length;for(;b7<b5;b7++){cb[b6[b7]]=bH.css(b9,b6[b7],false,b8)}return cb}return ca!==undefined?bH.style(b9,b6,ca):bH.css(b9,b6)},e,i,arguments.length>1)},show:function(){return r(this,true)},hide:function(){return r(this)},toggle:function(e){if(typeof e==="boolean"){return e?this.show():this.hide()}return this.each(function(){if(R(this)){bH(this).show()}else{bH(this).hide()}})}});function I(b5,i,b7,e,b6){return new I.prototype.init(b5,i,b7,e,b6)}bH.Tween=I;I.prototype={constructor:I,init:function(b6,i,b8,e,b7,b5){this.elem=b6;this.prop=b8;this.easing=b7||"swing";this.options=i;this.start=this.now=this.cur();this.end=e;this.unit=b5||(bH.cssNumber[b8]?"":"px")},cur:function(){var e=I.propHooks[this.prop];return e&&e.get?e.get(this):I.propHooks._default.get(this)},run:function(b5){var i,e=I.propHooks[this.prop];if(this.options.duration){this.pos=i=bH.easing[this.easing](b5,this.options.duration*b5,0,1,this.options.duration)}else{this.pos=i=b5}this.now=(this.end-this.start)*i+this.start;if(this.options.step){this.options.step.call(this.elem,this.now,this)}if(e&&e.set){e.set(this)}else{I.propHooks._default.set(this)}return this}};I.prototype.init.prototype=I.prototype;I.propHooks={_default:{get:function(i){var e;if(i.elem[i.prop]!=null&&(!i.elem.style||i.elem.style[i.prop]==null)){return i.elem[i.prop]}e=bH.css(i.elem,i.prop,"");return !e||e==="auto"?0:e},set:function(e){if(bH.fx.step[e.prop]){bH.fx.step[e.prop](e)}else{if(e.elem.style&&(e.elem.style[bH.cssProps[e.prop]]!=null||bH.cssHooks[e.prop])){bH.style(e.elem,e.prop,e.now+e.unit)}else{e.elem[e.prop]=e.now}}}}};I.propHooks.scrollTop=I.propHooks.scrollLeft={set:function(e){if(e.elem.nodeType&&e.elem.parentNode){e.elem[e.prop]=e.now}}};bH.easing={linear:function(e){return e},swing:function(e){return 0.5-Math.cos(e*Math.PI)/2}};bH.fx=I.prototype.init;bH.fx.step={};var M,ad,bQ=/^(?:toggle|show|hide)$/,bI=new RegExp("^(?:([+-])=|)("+aD+")([a-z%]*)$","i"),bO=/queueHooks$/,aF=[h],a1={"*":[function(e,b9){var cb=this.createTween(e,b9),b7=cb.cur(),b6=bI.exec(b9),ca=b6&&b6[3]||(bH.cssNumber[e]?"":"px"),i=(bH.cssNumber[e]||ca!=="px"&&+b7)&&bI.exec(bH.css(cb.elem,e)),b5=1,b8=20;if(i&&i[3]!==ca){ca=ca||i[3];b6=b6||[];i=+b7||1;do{b5=b5||".5";i=i/b5;bH.style(cb.elem,e,i+ca)}while(b5!==(b5=cb.cur()/b7)&&b5!==1&&--b8)}if(b6){i=cb.start=+i||+b7||0;cb.unit=ca;cb.end=b6[1]?i+(b6[1]+1)*b6[2]:+b6[2]}return cb}]};function bm(){setTimeout(function(){M=undefined});return(M=bH.now())}function bG(b6,b8){var b7,e={height:b6},b5=0;b8=b8?1:0;for(;b5<4;b5+=2-b8){b7=bS[b5];e["margin"+b7]=e["padding"+b7]=b6}if(b8){e.opacity=e.width=b6}return e}function bc(b7,b9,b6){var i,b8=(a1[b9]||[]).concat(a1["*"]),e=0,b5=b8.length;for(;e<b5;e++){if((i=b8[e].call(b6,b9,b7))){return i}}}function h(b6,cb,e){var b5,ce,b8,ch,ci,cf,ca,cd,b7=this,cc={},i=b6.style,b9=b6.nodeType&&R(b6),cg=bH._data(b6,"fxshow");if(!e.queue){ci=bH._queueHooks(b6,"fx");if(ci.unqueued==null){ci.unqueued=0;cf=ci.empty.fire;ci.empty.fire=function(){if(!ci.unqueued){cf()}}}ci.unqueued++;b7.always(function(){b7.always(function(){ci.unqueued--;if(!bH.queue(b6,"fx").length){ci.empty.fire()}})})}if(b6.nodeType===1&&("height" in cb||"width" in cb)){e.overflow=[i.overflow,i.overflowX,i.overflowY];ca=bH.css(b6,"display");cd=ca==="none"?bH._data(b6,"olddisplay")||aZ(b6.nodeName):ca;if(cd==="inline"&&bH.css(b6,"float")==="none"){if(!C.inlineBlockNeedsLayout||aZ(b6.nodeName)==="inline"){i.display="inline-block"}else{i.zoom=1}}}if(e.overflow){i.overflow="hidden";if(!C.shrinkWrapBlocks()){b7.always(function(){i.overflow=e.overflow[0];i.overflowX=e.overflow[1];i.overflowY=e.overflow[2]})}}for(b5 in cb){ce=cb[b5];if(bQ.exec(ce)){delete cb[b5];b8=b8||ce==="toggle";if(ce===(b9?"hide":"show")){if(ce==="show"&&cg&&cg[b5]!==undefined){b9=true}else{continue}}cc[b5]=cg&&cg[b5]||bH.style(b6,b5)}else{ca=undefined}}if(!bH.isEmptyObject(cc)){if(cg){if("hidden" in cg){b9=cg.hidden}}else{cg=bH._data(b6,"fxshow",{})}if(b8){cg.hidden=!b9}if(b9){bH(b6).show()}else{b7.done(function(){bH(b6).hide()})}b7.done(function(){var cj;bH._removeData(b6,"fxshow");for(cj in cc){bH.style(b6,cj,cc[cj])}});for(b5 in cc){ch=bc(b9?cg[b5]:0,b5,b7);if(!(b5 in cg)){cg[b5]=ch.start;if(b9){ch.end=ch.start;ch.start=b5==="width"||b5==="height"?1:0}}}}else{if((ca==="none"?aZ(b6.nodeName):ca)==="inline"){i.display=ca}}}function an(b6,b8){var b5,i,b9,b7,e;for(b5 in b6){i=bH.camelCase(b5);b9=b8[i];b7=b6[b5];if(bH.isArray(b7)){b9=b7[1];b7=b6[b5]=b7[0]}if(b5!==i){b6[i]=b7;delete b6[b5]}e=bH.cssHooks[i];if(e&&"expand" in e){b7=e.expand(b7);delete b6[i];for(b5 in b7){if(!(b5 in b6)){b6[b5]=b7[b5];b8[b5]=b9}}}else{b8[i]=b9}}}function f(b5,b9,cc){var cd,e,b8=0,i=aF.length,cb=bH.Deferred().always(function(){delete b7.elem}),b7=function(){if(e){return false}var cj=M||bm(),cg=Math.max(0,b6.startTime+b6.duration-cj),ce=cg/b6.duration||0,ci=1-ce,cf=0,ch=b6.tweens.length;for(;cf<ch;cf++){b6.tweens[cf].run(ci)}cb.notifyWith(b5,[b6,ci,cg]);if(ci<1&&ch){return cg}else{cb.resolveWith(b5,[b6]);return false}},b6=cb.promise({elem:b5,props:bH.extend({},b9),opts:bH.extend(true,{specialEasing:{}},cc),originalProperties:b9,originalOptions:cc,startTime:M||bm(),duration:cc.duration,tweens:[],createTween:function(cg,ce){var cf=bH.Tween(b5,b6.opts,cg,ce,b6.opts.specialEasing[cg]||b6.opts.easing);b6.tweens.push(cf);return cf},stop:function(cf){var ce=0,cg=cf?b6.tweens.length:0;if(e){return this}e=true;for(;ce<cg;ce++){b6.tweens[ce].run(1)}if(cf){cb.resolveWith(b5,[b6,cf])}else{cb.rejectWith(b5,[b6,cf])}return this}}),ca=b6.props;an(ca,b6.opts.specialEasing);for(;b8<i;b8++){cd=aF[b8].call(b6,b5,ca,b6.opts);if(cd){return cd}}bH.map(ca,bc,b6);if(bH.isFunction(b6.opts.start)){b6.opts.start.call(b5,b6)}bH.fx.timer(bH.extend(b7,{elem:b5,anim:b6,queue:b6.opts.queue}));return b6.progress(b6.opts.progress).done(b6.opts.done,b6.opts.complete).fail(b6.opts.fail).always(b6.opts.always)}bH.Animation=bH.extend(f,{tweener:function(i,b7){if(bH.isFunction(i)){b7=i;i=["*"]}else{i=i.split(" ")}var b6,e=0,b5=i.length;for(;e<b5;e++){b6=i[e];a1[b6]=a1[b6]||[];a1[b6].unshift(b7)}},prefilter:function(i,e){if(e){aF.unshift(i)}else{aF.push(i)}}});bH.speed=function(b5,b6,i){var e=b5&&typeof b5==="object"?bH.extend({},b5):{complete:i||!i&&b6||bH.isFunction(b5)&&b5,duration:b5,easing:i&&b6||b6&&!bH.isFunction(b6)&&b6};e.duration=bH.fx.off?0:typeof e.duration==="number"?e.duration:e.duration in bH.fx.speeds?bH.fx.speeds[e.duration]:bH.fx.speeds._default;if(e.queue==null||e.queue===true){e.queue="fx"}e.old=e.complete;e.complete=function(){if(bH.isFunction(e.old)){e.old.call(this)}if(e.queue){bH.dequeue(this,e.queue)}};return e};bH.fn.extend({fadeTo:function(e,b6,b5,i){return this.filter(R).css("opacity",0).show().end().animate({opacity:b6},e,b5,i)},animate:function(b9,b6,b8,b7){var b5=bH.isEmptyObject(b9),e=bH.speed(b6,b8,b7),i=function(){var ca=f(this,bH.extend({},b9),e);if(b5||bH._data(this,"finish")){ca.stop(true)}};i.finish=i;return b5||e.queue===false?this.each(i):this.queue(e.queue,i)},stop:function(b5,i,e){var b6=function(b7){var b8=b7.stop;delete b7.stop;b8(e)};if(typeof b5!=="string"){e=i;i=b5;b5=undefined}if(i&&b5!==false){this.queue(b5||"fx",[])}return this.each(function(){var ca=true,b7=b5!=null&&b5+"queueHooks",b9=bH.timers,b8=bH._data(this);if(b7){if(b8[b7]&&b8[b7].stop){b6(b8[b7])}}else{for(b7 in b8){if(b8[b7]&&b8[b7].stop&&bO.test(b7)){b6(b8[b7])}}}for(b7=b9.length;b7--;){if(b9[b7].elem===this&&(b5==null||b9[b7].queue===b5)){b9[b7].anim.stop(e);ca=false;b9.splice(b7,1)}}if(ca||!e){bH.dequeue(this,b5)}})},finish:function(e){if(e!==false){e=e||"fx"}return this.each(function(){var b6,b9=bH._data(this),b5=b9[e+"queue"],i=b9[e+"queueHooks"],b8=bH.timers,b7=b5?b5.length:0;b9.finish=true;bH.queue(this,e,[]);if(i&&i.stop){i.stop.call(this,true)}for(b6=b8.length;b6--;){if(b8[b6].elem===this&&b8[b6].queue===e){b8[b6].anim.stop(true);b8.splice(b6,1)}}for(b6=0;b6<b7;b6++){if(b5[b6]&&b5[b6].finish){b5[b6].finish.call(this)}}delete b9.finish})}});bH.each(["toggle","show","hide"],function(b5,e){var b6=bH.fn[e];bH.fn[e]=function(i,b8,b7){return i==null||typeof i==="boolean"?b6.apply(this,arguments):this.animate(bG(e,true),i,b8,b7)}});bH.each({slideDown:bG("show"),slideUp:bG("hide"),slideToggle:bG("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(e,i){bH.fn[e]=function(b5,b7,b6){return this.animate(i,b5,b7,b6)}});bH.timers=[];bH.fx.tick=function(){var b6,b5=bH.timers,e=0;M=bH.now();for(;e<b5.length;e++){b6=b5[e];if(!b6()&&b5[e]===b6){b5.splice(e--,1)}}if(!b5.length){bH.fx.stop()}M=undefined};bH.fx.timer=function(e){bH.timers.push(e);if(e()){bH.fx.start()}else{bH.timers.pop()}};bH.fx.interval=13;bH.fx.start=function(){if(!ad){ad=setInterval(bH.fx.tick,bH.fx.interval)}};bH.fx.stop=function(){clearInterval(ad);ad=null};bH.fx.speeds={slow:600,fast:200,_default:400};bH.fn.delay=function(i,e){i=bH.fx?bH.fx.speeds[i]||i:i;e=e||"fx";return this.queue(e,function(b6,b5){var b7=setTimeout(b6,i);b5.stop=function(){clearTimeout(b7)}})};(function(){var b5,b7,e,i,b6;b7=n.createElement("div");b7.setAttribute("className","t");b7.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>";i=b7.getElementsByTagName("a")[0];e=n.createElement("select");b6=e.appendChild(n.createElement("option"));b5=b7.getElementsByTagName("input")[0];i.style.cssText="top:1px";C.getSetAttribute=b7.className!=="t";C.style=/top/.test(i.getAttribute("style"));C.hrefNormalized=i.getAttribute("href")==="/a";C.checkOn=!!b5.value;C.optSelected=b6.selected;C.enctype=!!n.createElement("form").enctype;e.disabled=true;C.optDisabled=!b6.disabled;b5=n.createElement("input");b5.setAttribute("value","");C.input=b5.getAttribute("value")==="";b5.value="t";b5.setAttribute("type","radio");C.radioValue=b5.value==="t"})();var ak=/\r/g;bH.fn.extend({val:function(b6){var e,i,b7,b5=this[0];if(!arguments.length){if(b5){e=bH.valHooks[b5.type]||bH.valHooks[b5.nodeName.toLowerCase()];if(e&&"get" in e&&(i=e.get(b5,"value"))!==undefined){return i}i=b5.value;return typeof i==="string"?i.replace(ak,""):i==null?"":i}return}b7=bH.isFunction(b6);return this.each(function(b8){var b9;if(this.nodeType!==1){return}if(b7){b9=b6.call(this,b8,bH(this).val())}else{b9=b6}if(b9==null){b9=""}else{if(typeof b9==="number"){b9+=""}else{if(bH.isArray(b9)){b9=bH.map(b9,function(ca){return ca==null?"":ca+""})}}}e=bH.valHooks[this.type]||bH.valHooks[this.nodeName.toLowerCase()];if(!e||!("set" in e)||e.set(this,b9,"value")===undefined){this.value=b9}})}});bH.extend({valHooks:{option:{get:function(e){var i=bH.find.attr(e,"value");return i!=null?i:bH.trim(bH.text(e))}},select:{get:function(e){var ca,b6,cc=e.options,b8=e.selectedIndex,b7=e.type==="select-one"||b8<0,cb=b7?null:[],b9=b7?b8+1:cc.length,b5=b8<0?b9:b7?b8:0;for(;b5<b9;b5++){b6=cc[b5];if((b6.selected||b5===b8)&&(C.optDisabled?!b6.disabled:b6.getAttribute("disabled")===null)&&(!b6.parentNode.disabled||!bH.nodeName(b6.parentNode,"optgroup"))){ca=bH(b6).val();if(b7){return ca}cb.push(ca)}}return cb},set:function(b9,ca){var cb,b8,b6=b9.options,e=bH.makeArray(ca),b7=b6.length;while(b7--){b8=b6[b7];if(bH.inArray(bH.valHooks.option.get(b8),e)>=0){try{b8.selected=cb=true}catch(b5){b8.scrollHeight}}else{b8.selected=false}}if(!cb){b9.selectedIndex=-1}return b6}}}});bH.each(["radio","checkbox"],function(){bH.valHooks[this]={set:function(e,i){if(bH.isArray(i)){return(e.checked=bH.inArray(bH(e).val(),i)>=0)}}};if(!C.checkOn){bH.valHooks[this].get=function(e){return e.getAttribute("value")===null?"on":e.value}}});var a9,b2,bN=bH.expr.attrHandle,ap=/^(?:checked|selected)$/i,bM=C.getSetAttribute,bE=C.input;bH.fn.extend({attr:function(e,i){return aA(this,bH.attr,e,i,arguments.length>1)},removeAttr:function(e){return this.each(function(){bH.removeAttr(this,e)})}});bH.extend({attr:function(b7,b6,b8){var e,b5,i=b7.nodeType;if(!b7||i===3||i===8||i===2){return}if(typeof b7.getAttribute===aB){return bH.prop(b7,b6,b8)}if(i!==1||!bH.isXMLDoc(b7)){b6=b6.toLowerCase();e=bH.attrHooks[b6]||(bH.expr.match.bool.test(b6)?b2:a9)}if(b8!==undefined){if(b8===null){bH.removeAttr(b7,b6)}else{if(e&&"set" in e&&(b5=e.set(b7,b8,b6))!==undefined){return b5}else{b7.setAttribute(b6,b8+"");return b8}}}else{if(e&&"get" in e&&(b5=e.get(b7,b6))!==null){return b5}else{b5=bH.find.attr(b7,b6);return b5==null?undefined:b5}}},removeAttr:function(b6,b8){var e,b7,b5=0,b9=b8&&b8.match(aE);if(b9&&b6.nodeType===1){while((e=b9[b5++])){b7=bH.propFix[e]||e;if(bH.expr.match.bool.test(e)){if(bE&&bM||!ap.test(e)){b6[b7]=false}else{b6[bH.camelCase("default-"+e)]=b6[b7]=false}}else{bH.attr(b6,e,"")}b6.removeAttribute(bM?e:b7)}}},attrHooks:{type:{set:function(e,i){if(!C.radioValue&&i==="radio"&&bH.nodeName(e,"input")){var b5=e.value;e.setAttribute("type",i);if(b5){e.value=b5}return i}}}}});b2={set:function(i,b5,e){if(b5===false){bH.removeAttr(i,e)}else{if(bE&&bM||!ap.test(e)){i.setAttribute(!bM&&bH.propFix[e]||e,e)}else{i[bH.camelCase("default-"+e)]=i[e]=true}}return e}};bH.each(bH.expr.match.bool.source.match(/\w+/g),function(b6,b5){var e=bN[b5]||bH.find.attr;bN[b5]=bE&&bM||!ap.test(b5)?function(b8,b7,ca){var i,b9;if(!ca){b9=bN[b7];bN[b7]=i;i=e(b8,b7,ca)!=null?b7.toLowerCase():null;bN[b7]=b9}return i}:function(b7,i,b8){if(!b8){return b7[bH.camelCase("default-"+i)]?i.toLowerCase():null}}});if(!bE||!bM){bH.attrHooks.value={set:function(i,b5,e){if(bH.nodeName(i,"input")){i.defaultValue=b5}else{return a9&&a9.set(i,b5,e)}}}}if(!bM){a9={set:function(b5,b6,i){var e=b5.getAttributeNode(i);if(!e){b5.setAttributeNode((e=b5.ownerDocument.createAttribute(i)))}e.value=b6+="";if(i==="value"||b6===b5.getAttribute(i)){return b6}}};bN.id=bN.name=bN.coords=function(b5,i,b6){var e;if(!b6){return(e=b5.getAttributeNode(i))&&e.value!==""?e.value:null}};bH.valHooks.button={get:function(b5,i){var e=b5.getAttributeNode(i);if(e&&e.specified){return e.value}},set:a9.set};bH.attrHooks.contenteditable={set:function(i,b5,e){a9.set(i,b5===""?false:b5,e)}};bH.each(["width","height"],function(b5,e){bH.attrHooks[e]={set:function(i,b6){if(b6===""){i.setAttribute(e,"auto");return b6}}}})}if(!C.style){bH.attrHooks.style={get:function(e){return e.style.cssText||undefined},set:function(e,i){return(e.style.cssText=i+"")}}}var aI=/^(?:input|select|textarea|button|object)$/i,E=/^(?:a|area)$/i;bH.fn.extend({prop:function(e,i){return aA(this,bH.prop,e,i,arguments.length>1)},removeProp:function(e){e=bH.propFix[e]||e;return this.each(function(){try{this[e]=undefined;delete this[e]}catch(i){}})}});bH.extend({propFix:{"for":"htmlFor","class":"className"},prop:function(b8,b6,b9){var b5,e,b7,i=b8.nodeType;if(!b8||i===3||i===8||i===2){return}b7=i!==1||!bH.isXMLDoc(b8);if(b7){b6=bH.propFix[b6]||b6;e=bH.propHooks[b6]}if(b9!==undefined){return e&&"set" in e&&(b5=e.set(b8,b9,b6))!==undefined?b5:(b8[b6]=b9)}else{return e&&"get" in e&&(b5=e.get(b8,b6))!==null?b5:b8[b6]}},propHooks:{tabIndex:{get:function(i){var e=bH.find.attr(i,"tabindex");return e?parseInt(e,10):aI.test(i.nodeName)||E.test(i.nodeName)&&i.href?0:-1}}}});if(!C.hrefNormalized){bH.each(["href","src"],function(b5,e){bH.propHooks[e]={get:function(i){return i.getAttribute(e,4)}}})}if(!C.optSelected){bH.propHooks.selected={get:function(i){var e=i.parentNode;if(e){e.selectedIndex;if(e.parentNode){e.parentNode.selectedIndex}}return null}}}bH.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){bH.propFix[this.toLowerCase()]=this});if(!C.enctype){bH.propFix.enctype="encoding"}var bK=/[\t\r\n\f]/g;bH.fn.extend({addClass:function(cc){var b6,b5,cd,ca,b7,e,b8=0,b9=this.length,cb=typeof cc==="string"&&cc;if(bH.isFunction(cc)){return this.each(function(i){bH(this).addClass(cc.call(this,i,this.className))})}if(cb){b6=(cc||"").match(aE)||[];for(;b8<b9;b8++){b5=this[b8];cd=b5.nodeType===1&&(b5.className?(" "+b5.className+" ").replace(bK," "):" ");if(cd){b7=0;while((ca=b6[b7++])){if(cd.indexOf(" "+ca+" ")<0){cd+=ca+" "}}e=bH.trim(cd);if(b5.className!==e){b5.className=e}}}}return this},removeClass:function(cc){var b6,b5,cd,ca,b7,e,b8=0,b9=this.length,cb=arguments.length===0||typeof cc==="string"&&cc;if(bH.isFunction(cc)){return this.each(function(i){bH(this).removeClass(cc.call(this,i,this.className))})}if(cb){b6=(cc||"").match(aE)||[];for(;b8<b9;b8++){b5=this[b8];cd=b5.nodeType===1&&(b5.className?(" "+b5.className+" ").replace(bK," "):"");if(cd){b7=0;while((ca=b6[b7++])){while(cd.indexOf(" "+ca+" ")>=0){cd=cd.replace(" "+ca+" "," ")}}e=cc?bH.trim(cd):"";if(b5.className!==e){b5.className=e}}}}return this},toggleClass:function(b5,e){var i=typeof b5;if(typeof e==="boolean"&&i==="string"){return e?this.addClass(b5):this.removeClass(b5)}if(bH.isFunction(b5)){return this.each(function(b6){bH(this).toggleClass(b5.call(this,b6,this.className,e),e)})}return this.each(function(){if(i==="string"){var b8,b7=0,b6=bH(this),b9=b5.match(aE)||[];while((b8=b9[b7++])){if(b6.hasClass(b8)){b6.removeClass(b8)}else{b6.addClass(b8)}}}else{if(i===aB||i==="boolean"){if(this.className){bH._data(this,"__className__",this.className)}this.className=this.className||b5===false?"":bH._data(this,"__className__")||""}}})},hasClass:function(e){var b7=" "+e+" ",b6=0,b5=this.length;for(;b6<b5;b6++){if(this[b6].nodeType===1&&(" "+this[b6].className+" ").replace(bK," ").indexOf(b7)>=0){return true}}return false}});bH.each(("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu").split(" "),function(b5,e){bH.fn[e]=function(b6,i){return arguments.length>0?this.on(e,null,b6,i):this.trigger(e)}});bH.fn.extend({hover:function(e,i){return this.mouseenter(e).mouseleave(i||e)},bind:function(e,b5,i){return this.on(e,null,b5,i)},unbind:function(e,i){return this.off(e,null,i)},delegate:function(e,i,b6,b5){return this.on(i,e,b6,b5)},undelegate:function(e,i,b5){return arguments.length===1?this.off(e,"**"):this.off(i,e||"**",b5)}});var bo=bH.now();var bP=(/\?/);var a0=/(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;bH.parseJSON=function(e){if(a4.JSON&&a4.JSON.parse){return a4.JSON.parse(e+"")}var b6,b5=null,i=bH.trim(e+"");return i&&!bH.trim(i.replace(a0,function(b9,b7,b8,ca){if(b6&&b7){b5=0}if(b5===0){return b9}b6=b8||b7;b5+=!ca-!b8;return""}))?(Function("return "+i))():bH.error("Invalid JSON: "+e)};bH.parseXML=function(b6){var i,b5;if(!b6||typeof b6!=="string"){return null}try{if(a4.DOMParser){b5=new DOMParser();i=b5.parseFromString(b6,"text/xml")}else{i=new ActiveXObject("Microsoft.XMLDOM");i.async="false";i.loadXML(b6)}}catch(b7){i=undefined}if(!i||!i.documentElement||i.getElementsByTagName("parsererror").length){bH.error("Invalid XML: "+b6)}return i};var b3,Z,ao=/#.*$/,Q=/([?&])_=[^&]*/,ag=/^(.*?):[ \t]*([^\r\n]*)\r?$/mg,B=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,q=/^(?:GET|HEAD)$/,aJ=/^\/\//,aU=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,v={},a8={},aW="*/".concat("*");try{Z=location.href}catch(bh){Z=n.createElement("a");Z.href="";Z=Z.href}b3=aU.exec(Z.toLowerCase())||[];function bJ(e){return function(b8,b9){if(typeof b8!=="string"){b9=b8;b8="*"}var b5,b6=0,b7=b8.toLowerCase().match(aE)||[];if(bH.isFunction(b9)){while((b5=b7[b6++])){if(b5.charAt(0)==="+"){b5=b5.slice(1)||"*";(e[b5]=e[b5]||[]).unshift(b9)}else{(e[b5]=e[b5]||[]).push(b9)}}}}}function p(e,b5,b9,b6){var i={},b7=(e===a8);function b8(ca){var cb;i[ca]=true;bH.each(e[ca]||[],function(cd,cc){var ce=cc(b5,b9,b6);if(typeof ce==="string"&&!b7&&!i[ce]){b5.dataTypes.unshift(ce);b8(ce);return false}else{if(b7){return !(cb=ce)}}});return cb}return b8(b5.dataTypes[0])||!i["*"]&&b8("*")}function s(b5,b6){var e,i,b7=bH.ajaxSettings.flatOptions||{};for(i in b6){if(b6[i]!==undefined){(b7[i]?b5:(e||(e={})))[i]=b6[i]}}if(e){bH.extend(true,b5,e)}return b5}function g(cb,ca,b7){var e,b6,b5,b8,i=cb.contents,b9=cb.dataTypes;while(b9[0]==="*"){b9.shift();if(b6===undefined){b6=cb.mimeType||ca.getResponseHeader("Content-Type")}}if(b6){for(b8 in i){if(i[b8]&&i[b8].test(b6)){b9.unshift(b8);break}}}if(b9[0] in b7){b5=b9[0]}else{for(b8 in b7){if(!b9[0]||cb.converters[b8+" "+b9[0]]){b5=b8;break}if(!e){e=b8}}b5=b5||e}if(b5){if(b5!==b9[0]){b9.unshift(b5)}return b7[b5]}}function af(cf,b7,cc,b5){var i,ca,cd,b8,b6,ce={},cb=cf.dataTypes.slice();if(cb[1]){for(cd in cf.converters){ce[cd.toLowerCase()]=cf.converters[cd]}}ca=cb.shift();while(ca){if(cf.responseFields[ca]){cc[cf.responseFields[ca]]=b7}if(!b6&&b5&&cf.dataFilter){b7=cf.dataFilter(b7,cf.dataType)}b6=ca;ca=cb.shift();if(ca){if(ca==="*"){ca=b6}else{if(b6!=="*"&&b6!==ca){cd=ce[b6+" "+ca]||ce["* "+ca];if(!cd){for(i in ce){b8=i.split(" ");if(b8[1]===ca){cd=ce[b6+" "+b8[0]]||ce["* "+b8[0]];if(cd){if(cd===true){cd=ce[i]}else{if(ce[i]!==true){ca=b8[0];cb.unshift(b8[1])}}break}}}}if(cd!==true){if(cd&&cf["throws"]){b7=cd(b7)}else{try{b7=cd(b7)}catch(b9){return{state:"parsererror",error:cd?b9:"No conversion from "+b6+" to "+ca}}}}}}}}return{state:"success",data:b7}}bH.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:Z,type:"GET",isLocal:B.test(b3[1]),global:true,processData:true,async:true,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":aW,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":true,"text json":bH.parseJSON,"text xml":bH.parseXML},flatOptions:{url:true,context:true}},ajaxSetup:function(i,e){return e?s(s(i,bH.ajaxSettings),e):s(bH.ajaxSettings,i)},ajaxPrefilter:bJ(v),ajaxTransport:bJ(a8),ajax:function(b9,b6){if(typeof b9==="object"){b6=b9;b9=undefined}b6=b6||{};var ci,ck,ca,cp,ce,b5,cl,b7,cd=bH.ajaxSetup({},b6),cr=cd.context||cd,cg=cd.context&&(cr.nodeType||cr.jquery)?bH(cr):bH.event,cq=bH.Deferred(),cn=bH.Callbacks("once memory"),cb=cd.statusCode||{},ch={},co={},b8=0,cc="canceled",cj={readyState:0,getResponseHeader:function(i){var e;if(b8===2){if(!b7){b7={};while((e=ag.exec(cp))){b7[e[1].toLowerCase()]=e[2]}}e=b7[i.toLowerCase()]}return e==null?null:e},getAllResponseHeaders:function(){return b8===2?cp:null},setRequestHeader:function(i,cs){var e=i.toLowerCase();if(!b8){i=co[e]=co[e]||i;ch[i]=cs}return this},overrideMimeType:function(e){if(!b8){cd.mimeType=e}return this},statusCode:function(i){var e;if(i){if(b8<2){for(e in i){cb[e]=[cb[e],i[e]]}}else{cj.always(i[cj.status])}}return this},abort:function(i){var e=i||cc;if(cl){cl.abort(e)}cf(0,e);return this}};cq.promise(cj).complete=cn.add;cj.success=cj.done;cj.error=cj.fail;cd.url=((b9||cd.url||Z)+"").replace(ao,"").replace(aJ,b3[1]+"//");cd.type=b6.method||b6.type||cd.method||cd.type;cd.dataTypes=bH.trim(cd.dataType||"*").toLowerCase().match(aE)||[""];if(cd.crossDomain==null){ci=aU.exec(cd.url.toLowerCase());cd.crossDomain=!!(ci&&(ci[1]!==b3[1]||ci[2]!==b3[2]||(ci[3]||(ci[1]==="http:"?"80":"443"))!==(b3[3]||(b3[1]==="http:"?"80":"443"))))}if(cd.data&&cd.processData&&typeof cd.data!=="string"){cd.data=bH.param(cd.data,cd.traditional)}p(v,cd,b6,cj);if(b8===2){return cj}b5=cd.global;if(b5&&bH.active++===0){bH.event.trigger("ajaxStart")}cd.type=cd.type.toUpperCase();cd.hasContent=!q.test(cd.type);ca=cd.url;if(!cd.hasContent){if(cd.data){ca=(cd.url+=(bP.test(ca)?"&":"?")+cd.data);delete cd.data}if(cd.cache===false){cd.url=Q.test(ca)?ca.replace(Q,"$1_="+bo++):ca+(bP.test(ca)?"&":"?")+"_="+bo++}}if(cd.ifModified){if(bH.lastModified[ca]){cj.setRequestHeader("If-Modified-Since",bH.lastModified[ca])}if(bH.etag[ca]){cj.setRequestHeader("If-None-Match",bH.etag[ca])}}if(cd.data&&cd.hasContent&&cd.contentType!==false||b6.contentType){cj.setRequestHeader("Content-Type",cd.contentType)}cj.setRequestHeader("Accept",cd.dataTypes[0]&&cd.accepts[cd.dataTypes[0]]?cd.accepts[cd.dataTypes[0]]+(cd.dataTypes[0]!=="*"?", "+aW+"; q=0.01":""):cd.accepts["*"]);for(ck in cd.headers){cj.setRequestHeader(ck,cd.headers[ck])}if(cd.beforeSend&&(cd.beforeSend.call(cr,cj,cd)===false||b8===2)){return cj.abort()}cc="abort";for(ck in {success:1,error:1,complete:1}){cj[ck](cd[ck])}cl=p(a8,cd,b6,cj);if(!cl){cf(-1,"No Transport")}else{cj.readyState=1;if(b5){cg.trigger("ajaxSend",[cj,cd])}if(cd.async&&cd.timeout>0){ce=setTimeout(function(){cj.abort("timeout")},cd.timeout)}try{b8=1;cl.send(ch,cf)}catch(cm){if(b8<2){cf(-1,cm)}else{throw cm}}}function cf(cv,i,cw,ct){var e,cz,cx,cu,cy,cs=i;if(b8===2){return}b8=2;if(ce){clearTimeout(ce)}cl=undefined;cp=ct||"";cj.readyState=cv>0?4:0;e=cv>=200&&cv<300||cv===304;if(cw){cu=g(cd,cj,cw)}cu=af(cd,cu,cj,e);if(e){if(cd.ifModified){cy=cj.getResponseHeader("Last-Modified");if(cy){bH.lastModified[ca]=cy}cy=cj.getResponseHeader("etag");if(cy){bH.etag[ca]=cy}}if(cv===204||cd.type==="HEAD"){cs="nocontent"}else{if(cv===304){cs="notmodified"}else{cs=cu.state;cz=cu.data;cx=cu.error;e=!cx}}}else{cx=cs;if(cv||!cs){cs="error";if(cv<0){cv=0}}}cj.status=cv;cj.statusText=(i||cs)+"";if(e){cq.resolveWith(cr,[cz,cs,cj])}else{cq.rejectWith(cr,[cj,cs,cx])}cj.statusCode(cb);cb=undefined;if(b5){cg.trigger(e?"ajaxSuccess":"ajaxError",[cj,cd,e?cz:cx])}cn.fireWith(cr,[cj,cs]);if(b5){cg.trigger("ajaxComplete",[cj,cd]);if(!(--bH.active)){bH.event.trigger("ajaxStop")}}}return cj},getJSON:function(e,i,b5){return bH.get(e,i,b5,"json")},getScript:function(e,i){return bH.get(e,undefined,i,"script")}});bH.each(["get","post"],function(e,b5){bH[b5]=function(i,b7,b8,b6){if(bH.isFunction(b7)){b6=b6||b8;b8=b7;b7=undefined}return bH.ajax({url:i,type:b5,dataType:b6,data:b7,success:b8})}});bH.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(e,b5){bH.fn[b5]=function(i){return this.on(b5,i)}});bH._evalUrl=function(e){return bH.ajax({url:e,type:"GET",dataType:"script",async:false,global:false,"throws":true})};bH.fn.extend({wrapAll:function(e){if(bH.isFunction(e)){return this.each(function(b5){bH(this).wrapAll(e.call(this,b5))})}if(this[0]){var i=bH(e,this[0].ownerDocument).eq(0).clone(true);if(this[0].parentNode){i.insertBefore(this[0])}i.map(function(){var b5=this;while(b5.firstChild&&b5.firstChild.nodeType===1){b5=b5.firstChild}return b5}).append(this)}return this},wrapInner:function(e){if(bH.isFunction(e)){return this.each(function(b5){bH(this).wrapInner(e.call(this,b5))})}return this.each(function(){var i=bH(this),b5=i.contents();if(b5.length){b5.wrapAll(e)}else{i.append(e)}})},wrap:function(e){var i=bH.isFunction(e);return this.each(function(b5){bH(this).wrapAll(i?e.call(this,b5):e)})},unwrap:function(){return this.parent().each(function(){if(!bH.nodeName(this,"body")){bH(this).replaceWith(this.childNodes)}}).end()}});bH.expr.filters.hidden=function(e){return e.offsetWidth<=0&&e.offsetHeight<=0||(!C.reliableHiddenOffsets()&&((e.style&&e.style.display)||bH.css(e,"display"))==="none")};bH.expr.filters.visible=function(e){return !bH.expr.filters.hidden(e)};var bv=/%20/g,aR=/\[\]$/,W=/\r?\n/g,b=/^(?:submit|button|image|reset|file)$/i,at=/^(?:input|select|textarea|keygen)/i;function j(b5,b7,i,b6){var e;if(bH.isArray(b7)){bH.each(b7,function(b9,b8){if(i||aR.test(b5)){b6(b5,b8)}else{j(b5+"["+(typeof b8==="object"?b9:"")+"]",b8,i,b6)}})}else{if(!i&&bH.type(b7)==="object"){for(e in b7){j(b5+"["+e+"]",b7[e],i,b6)}}else{b6(b5,b7)}}}bH.param=function(e,b5){var b6,i=[],b7=function(b8,b9){b9=bH.isFunction(b9)?b9():(b9==null?"":b9);i[i.length]=encodeURIComponent(b8)+"="+encodeURIComponent(b9)};if(b5===undefined){b5=bH.ajaxSettings&&bH.ajaxSettings.traditional}if(bH.isArray(e)||(e.jquery&&!bH.isPlainObject(e))){bH.each(e,function(){b7(this.name,this.value)})}else{for(b6 in e){j(b6,e[b6],b5,b7)}}return i.join("&").replace(bv,"+")};bH.fn.extend({serialize:function(){return bH.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var e=bH.prop(this,"elements");return e?bH.makeArray(e):this}).filter(function(){var e=this.type;return this.name&&!bH(this).is(":disabled")&&at.test(this.nodeName)&&!b.test(e)&&(this.checked||!aL.test(e))}).map(function(e,b5){var b6=bH(this).val();return b6==null?null:bH.isArray(b6)?bH.map(b6,function(i){return{name:b5.name,value:i.replace(W,"\r\n")}}):{name:b5.name,value:b6.replace(W,"\r\n")}}).get()}});bH.ajaxSettings.xhr=a4.ActiveXObject!==undefined?function(){return !this.isLocal&&/^(get|post|head|put|delete|options)$/i.test(this.type)&&bD()||bf()}:bD;var az=0,ai={},ax=bH.ajaxSettings.xhr();if(a4.ActiveXObject){bH(a4).on("unload",function(){for(var e in ai){ai[e](undefined,true)}})}C.cors=!!ax&&("withCredentials" in ax);ax=C.ajax=!!ax;if(ax){bH.ajaxTransport(function(e){if(!e.crossDomain||C.cors){var i;return{send:function(b8,b5){var b6,b7=e.xhr(),b9=++az;b7.open(e.type,e.url,e.async,e.username,e.password);if(e.xhrFields){for(b6 in e.xhrFields){b7[b6]=e.xhrFields[b6]}}if(e.mimeType&&b7.overrideMimeType){b7.overrideMimeType(e.mimeType)}if(!e.crossDomain&&!b8["X-Requested-With"]){b8["X-Requested-With"]="XMLHttpRequest"}for(b6 in b8){if(b8[b6]!==undefined){b7.setRequestHeader(b6,b8[b6]+"")}}b7.send((e.hasContent&&e.data)||null);i=function(cc,cb){var ca,cf,cd;if(i&&(cb||b7.readyState===4)){delete ai[b9];i=undefined;b7.onreadystatechange=bH.noop;if(cb){if(b7.readyState!==4){b7.abort()}}else{cd={};ca=b7.status;if(typeof b7.responseText==="string"){cd.text=b7.responseText}try{cf=b7.statusText}catch(ce){cf=""}if(!ca&&e.isLocal&&!e.crossDomain){ca=cd.text?200:404}else{if(ca===1223){ca=204}}}}if(cd){b5(ca,cf,cd,b7.getAllResponseHeaders())}};if(!e.async){i()}else{if(b7.readyState===4){setTimeout(i)}else{b7.onreadystatechange=ai[b9]=i}}},abort:function(){if(i){i(undefined,true)}}}}})}function bD(){try{return new a4.XMLHttpRequest()}catch(i){}}function bf(){try{return new a4.ActiveXObject("Microsoft.XMLHTTP")}catch(i){}}bH.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(e){bH.globalEval(e);return e}}});bH.ajaxPrefilter("script",function(e){if(e.cache===undefined){e.cache=false}if(e.crossDomain){e.type="GET";e.global=false}});bH.ajaxTransport("script",function(b5){if(b5.crossDomain){var e,i=n.head||bH("head")[0]||n.documentElement;return{send:function(b6,b7){e=n.createElement("script");e.async=true;if(b5.scriptCharset){e.charset=b5.scriptCharset}e.src=b5.url;e.onload=e.onreadystatechange=function(b9,b8){if(b8||!e.readyState||/loaded|complete/.test(e.readyState)){e.onload=e.onreadystatechange=null;if(e.parentNode){e.parentNode.removeChild(e)}e=null;if(!b8){b7(200,"success")}}};i.insertBefore(e,i.firstChild)},abort:function(){if(e){e.onload(undefined,true)}}}}});var br=[],a7=/(=)\?(?=&|$)|\?\?/;bH.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var e=br.pop()||(bH.expando+"_"+(bo++));this[e]=true;return e}});bH.ajaxPrefilter("json jsonp",function(b6,e,b7){var b9,i,b5,b8=b6.jsonp!==false&&(a7.test(b6.url)?"url":typeof b6.data==="string"&&!(b6.contentType||"").indexOf("application/x-www-form-urlencoded")&&a7.test(b6.data)&&"data");if(b8||b6.dataTypes[0]==="jsonp"){b9=b6.jsonpCallback=bH.isFunction(b6.jsonpCallback)?b6.jsonpCallback():b6.jsonpCallback;if(b8){b6[b8]=b6[b8].replace(a7,"$1"+b9)}else{if(b6.jsonp!==false){b6.url+=(bP.test(b6.url)?"&":"?")+b6.jsonp+"="+b9}}b6.converters["script json"]=function(){if(!b5){bH.error(b9+" was not called")}return b5[0]};b6.dataTypes[0]="json";i=a4[b9];a4[b9]=function(){b5=arguments};b7.always(function(){a4[b9]=i;if(b6[b9]){b6.jsonpCallback=e.jsonpCallback;br.push(b9)}if(b5&&bH.isFunction(i)){i(b5[0])}b5=i=undefined});return"script"}});bH.parseHTML=function(b7,b5,b6){if(!b7||typeof b7!=="string"){return null}if(typeof b5==="boolean"){b6=b5;b5=false}b5=b5||n;var i=a.exec(b7),e=!b6&&[];if(i){return[b5.createElement(i[1])]}i=bH.buildFragment([b7],b5,e);if(e&&e.length){bH(e).remove()}return bH.merge([],i.childNodes)};var b0=bH.fn.load;bH.fn.load=function(b6,b9,ca){if(typeof b6!=="string"&&b0){return b0.apply(this,arguments)}var e,b5,b7,i=this,b8=b6.indexOf(" ");if(b8>=0){e=bH.trim(b6.slice(b8,b6.length));b6=b6.slice(0,b8)}if(bH.isFunction(b9)){ca=b9;b9=undefined}else{if(b9&&typeof b9==="object"){b7="POST"}}if(i.length>0){bH.ajax({url:b6,type:b7,dataType:"html",data:b9}).done(function(cb){b5=arguments;i.html(e?bH("<div>").append(bH.parseHTML(cb)).find(e):cb)}).complete(ca&&function(cc,cb){i.each(ca,b5||[cc.responseText,cb,cc])})}return this};bH.expr.filters.animated=function(e){return bH.grep(bH.timers,function(i){return e===i.elem}).length};var bW=a4.document.documentElement;function bq(e){return bH.isWindow(e)?e:e.nodeType===9?e.defaultView||e.parentWindow:false}bH.offset={setOffset:function(b6,cg,ca){var cc,b9,e,b7,b5,ce,cf,cb=bH.css(b6,"position"),b8=bH(b6),cd={};if(cb==="static"){b6.style.position="relative"}b5=b8.offset();e=bH.css(b6,"top");ce=bH.css(b6,"left");cf=(cb==="absolute"||cb==="fixed")&&bH.inArray("auto",[e,ce])>-1;if(cf){cc=b8.position();b7=cc.top;b9=cc.left}else{b7=parseFloat(e)||0;b9=parseFloat(ce)||0}if(bH.isFunction(cg)){cg=cg.call(b6,ca,b5)}if(cg.top!=null){cd.top=(cg.top-b5.top)+b7}if(cg.left!=null){cd.left=(cg.left-b5.left)+b9}if("using" in cg){cg.using.call(b6,cd)}else{b8.css(cd)}}};bH.fn.extend({offset:function(i){if(arguments.length){return i===undefined?this:this.each(function(b9){bH.offset.setOffset(this,i,b9)})}var e,b8,b6={top:0,left:0},b5=this[0],b7=b5&&b5.ownerDocument;if(!b7){return}e=b7.documentElement;if(!bH.contains(e,b5)){return b6}if(typeof b5.getBoundingClientRect!==aB){b6=b5.getBoundingClientRect()}b8=bq(b7);return{top:b6.top+(b8.pageYOffset||e.scrollTop)-(e.clientTop||0),left:b6.left+(b8.pageXOffset||e.scrollLeft)-(e.clientLeft||0)}},position:function(){if(!this[0]){return}var b5,b6,e={top:0,left:0},i=this[0];if(bH.css(i,"position")==="fixed"){b6=i.getBoundingClientRect()}else{b5=this.offsetParent();b6=this.offset();if(!bH.nodeName(b5[0],"html")){e=b5.offset()}e.top+=bH.css(b5[0],"borderTopWidth",true);e.left+=bH.css(b5[0],"borderLeftWidth",true)}return{top:b6.top-e.top-bH.css(i,"marginTop",true),left:b6.left-e.left-bH.css(i,"marginLeft",true)}},offsetParent:function(){return this.map(function(){var e=this.offsetParent||bW;while(e&&(!bH.nodeName(e,"html")&&bH.css(e,"position")==="static")){e=e.offsetParent}return e||bW})}});bH.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(b5,i){var e=/Y/.test(i);bH.fn[b5]=function(b6){return aA(this,function(b7,ca,b9){var b8=bq(b7);if(b9===undefined){return b8?(i in b8)?b8[i]:b8.document.documentElement[ca]:b7[ca]}if(b8){b8.scrollTo(!e?b9:bH(b8).scrollLeft(),e?b9:bH(b8).scrollTop())}else{b7[ca]=b9}},b5,b6,arguments.length,null)}});bH.each(["top","left"],function(e,b5){bH.cssHooks[b5]=a6(C.pixelPosition,function(b6,i){if(i){i=F(b6,b5);return X.test(i)?bH(b6).position()[b5]+"px":i}})});bH.each({Height:"height",Width:"width"},function(e,i){bH.each({padding:"inner"+e,content:i,"":"outer"+e},function(b5,b6){bH.fn[b6]=function(ca,b9){var b8=arguments.length&&(b5||typeof ca!=="boolean"),b7=b5||(ca===true||b9===true?"margin":"border");return aA(this,function(cc,cb,cd){var ce;if(bH.isWindow(cc)){return cc.document.documentElement["client"+e]}if(cc.nodeType===9){ce=cc.documentElement;return Math.max(cc.body["scroll"+e],ce["scroll"+e],cc.body["offset"+e],ce["offset"+e],ce["client"+e])}return cd===undefined?bH.css(cc,cb,b7):bH.style(cc,cb,cd,b7)},i,b8?ca:undefined,b8,null)}})});bH.fn.size=function(){return this.length};bH.fn.andSelf=bH.fn.addBack;if(typeof define==="function"&&define.amd){define("jquery",[],function(){return bH})}var bj=a4.jQuery,H=a4.$;bH.noConflict=function(e){if(a4.$===bH){a4.$=H}if(e&&a4.jQuery===bH){a4.jQuery=bj}return bH};if(typeof au===aB){a4.jQuery=a4.$=bH}return bH}));(function(b){b.color={};b.color.make=function(f,e,c,d){var h={};h.r=f||0;h.g=e||0;h.b=c||0;h.a=d!=null?d:1;h.add=function(k,j){for(var g=0;g<k.length;++g){h[k.charAt(g)]+=j}return h.normalize()};h.scale=function(k,j){for(var g=0;g<k.length;++g){h[k.charAt(g)]*=j}return h.normalize()};h.toString=function(){if(h.a>=1){return"rgb("+[h.r,h.g,h.b].join(",")+")"}else{return"rgba("+[h.r,h.g,h.b,h.a].join(",")+")"}};h.normalize=function(){function g(j,k,i){return k<j?j:k>i?i:k}h.r=g(0,parseInt(h.r),255);h.g=g(0,parseInt(h.g),255);h.b=g(0,parseInt(h.b),255);h.a=g(0,h.a,1);return h};h.clone=function(){return b.color.make(h.r,h.b,h.g,h.a)};return h.normalize()};b.color.extract=function(e,d){var f;do{f=e.css(d).toLowerCase();if(f!=""&&f!="transparent"){break}e=e.parent()}while(e.length&&!b.nodeName(e.get(0),"body"));if(f=="rgba(0, 0, 0, 0)"){f="transparent"}return b.color.parse(f)};b.color.parse=function(f){var e,c=b.color.make;if(e=/rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(f)){return c(parseInt(e[1],10),parseInt(e[2],10),parseInt(e[3],10))}if(e=/rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(f)){return c(parseInt(e[1],10),parseInt(e[2],10),parseInt(e[3],10),parseFloat(e[4]))}if(e=/rgb\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*\)/.exec(f)){return c(parseFloat(e[1])*2.55,parseFloat(e[2])*2.55,parseFloat(e[3])*2.55)}if(e=/rgba\(\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\%\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(f)){return c(parseFloat(e[1])*2.55,parseFloat(e[2])*2.55,parseFloat(e[3])*2.55,parseFloat(e[4]))}if(e=/#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(f)){return c(parseInt(e[1],16),parseInt(e[2],16),parseInt(e[3],16))}if(e=/#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(f)){return c(parseInt(e[1]+e[1],16),parseInt(e[2]+e[2],16),parseInt(e[3]+e[3],16))}var d=b.trim(f).toLowerCase();if(d=="transparent"){return c(255,255,255,0)}else{e=a[d]||[0,0,0];return c(e[0],e[1],e[2])}};var a={aqua:[0,255,255],azure:[240,255,255],beige:[245,245,220],black:[0,0,0],blue:[0,0,255],brown:[165,42,42],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgrey:[169,169,169],darkgreen:[0,100,0],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkviolet:[148,0,211],fuchsia:[255,0,255],gold:[255,215,0],green:[0,128,0],indigo:[75,0,130],khaki:[240,230,140],lightblue:[173,216,230],lightcyan:[224,255,255],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightyellow:[255,255,224],lime:[0,255,0],magenta:[255,0,255],maroon:[128,0,0],navy:[0,0,128],olive:[128,128,0],orange:[255,165,0],pink:[255,192,203],purple:[128,0,128],violet:[128,0,128],red:[255,0,0],silver:[192,192,192],white:[255,255,255],yellow:[255,255,0]}})(jQuery);(function(e){var d=Object.prototype.hasOwnProperty;if(!e.fn.detach){e.fn.detach=function(){return this.each(function(){if(this.parentNode){this.parentNode.removeChild(this)}})}}function a(h,g){var j=g.children("."+h)[0];if(j==null){j=document.createElement("canvas");j.className=h;e(j).css({direction:"ltr",position:"absolute",left:0,top:0}).appendTo(g);if(!j.getContext){if(window.G_vmlCanvasManager){j=window.G_vmlCanvasManager.initElement(j)}else{throw new Error("Canvas is not available. If you're using IE with a fall-back such as Excanvas, then there's either a mistake in your conditional include, or the page has no DOCTYPE and is rendering in Quirks Mode.")}}}this.element=j;var i=this.context=j.getContext("2d");var f=window.devicePixelRatio||1,k=i.webkitBackingStorePixelRatio||i.mozBackingStorePixelRatio||i.msBackingStorePixelRatio||i.oBackingStorePixelRatio||i.backingStorePixelRatio||1;this.pixelRatio=f/k;this.resize(g.width(),g.height());this.textContainer=null;this.text={};this._textCache={}}a.prototype.resize=function(i,f){if(i<=0||f<=0){throw new Error("Invalid dimensions for plot, width = "+i+", height = "+f)}var h=this.element,g=this.context,j=this.pixelRatio;if(this.width!=i){h.width=i*j;h.style.width=i+"px";this.width=i}if(this.height!=f){h.height=f*j;h.style.height=f+"px";this.height=f}g.restore();g.save();g.scale(j,j)};a.prototype.clear=function(){this.context.clearRect(0,0,this.width,this.height)};a.prototype.render=function(){var f=this._textCache;for(var o in f){if(d.call(f,o)){var n=this.getTextLayer(o),g=f[o];n.hide();for(var m in g){if(d.call(g,m)){var h=g[m];for(var p in h){if(d.call(h,p)){var k=h[p].positions;for(var j=0,l;l=k[j];j++){if(l.active){if(!l.rendered){n.append(l.element);l.rendered=true}}else{k.splice(j--,1);if(l.rendered){l.element.detach()}}}if(k.length==0){delete h[p]}}}}}n.show()}}};a.prototype.getTextLayer=function(g){var f=this.text[g];if(f==null){if(this.textContainer==null){this.textContainer=e("<div class='flot-text'></div>").css({position:"absolute",top:0,left:0,bottom:0,right:0,"font-size":"smaller",color:"#545454"}).insertAfter(this.element)}f=this.text[g]=e("<div></div>").addClass(g).css({position:"absolute",top:0,left:0,bottom:0,right:0}).appendTo(this.textContainer)}return f};a.prototype.getTextInfo=function(m,o,j,k,g){var n,f,i,h;o=""+o;if(typeof j==="object"){n=j.style+" "+j.variant+" "+j.weight+" "+j.size+"px/"+j.lineHeight+"px "+j.family}else{n=j}f=this._textCache[m];if(f==null){f=this._textCache[m]={}}i=f[n];if(i==null){i=f[n]={}}h=i[o];if(h==null){var l=e("<div></div>").html(o).css({position:"absolute","max-width":g,top:-9999}).appendTo(this.getTextLayer(m));if(typeof j==="object"){l.css({font:n,color:j.color})}else{if(typeof j==="string"){l.addClass(j)}}h=i[o]={width:l.outerWidth(true),height:l.outerHeight(true),element:l,positions:[]};l.detach()}return h};a.prototype.addText=function(o,r,p,s,h,j,f,n,q){var g=this.getTextInfo(o,s,h,j,f),l=g.positions;if(n=="center"){r-=g.width/2}else{if(n=="right"){r-=g.width}}if(q=="middle"){p-=g.height/2}else{if(q=="bottom"){p-=g.height}}for(var k=0,m;m=l[k];k++){if(m.x==r&&m.y==p){m.active=true;return}}m={active:true,rendered:false,element:l.length?g.element.clone():g.element,x:r,y:p};l.push(m);m.element.css({top:Math.round(p),left:Math.round(r),"text-align":n})};a.prototype.removeText=function(o,q,p,s,h,j){if(s==null){var f=this._textCache[o];if(f!=null){for(var n in f){if(d.call(f,n)){var g=f[n];for(var r in g){if(d.call(g,r)){var l=g[r].positions;for(var k=0,m;m=l[k];k++){m.active=false}}}}}}}else{var l=this.getTextInfo(o,s,h,j).positions;for(var k=0,m;m=l[k];k++){if(m.x==q&&m.y==p){m.active=false}}}};function c(Q,A,C,g){var t=[],L={colors:["#edc240","#afd8f8","#cb4b4b","#4da74d","#9440ed"],legend:{show:true,noColumns:1,labelFormatter:null,labelBoxBorderColor:"#ccc",container:null,position:"ne",margin:5,backgroundColor:null,backgroundOpacity:0.85,sorted:null},xaxis:{show:null,position:"bottom",mode:null,font:null,color:null,tickColor:null,transform:null,inverseTransform:null,min:null,max:null,autoscaleMargin:null,ticks:null,tickFormatter:null,labelWidth:null,labelHeight:null,reserveSpace:null,tickLength:null,alignTicksWithAxis:null,tickDecimals:null,tickSize:null,minTickSize:null},yaxis:{autoscaleMargin:0.02,position:"left"},xaxes:[],yaxes:[],series:{points:{show:false,radius:3,lineWidth:2,fill:true,fillColor:"#ffffff",symbol:"circle"},lines:{lineWidth:2,fill:false,fillColor:null,steps:false},bars:{show:false,lineWidth:2,barWidth:1,fill:true,fillColor:null,align:"left",horizontal:false,zero:true},shadowSize:3,highlightColor:null},grid:{show:true,aboveData:false,color:"#545454",backgroundColor:null,borderColor:null,tickColor:null,margin:0,labelMargin:5,axisMargin:8,borderWidth:2,minBorderMargin:null,markings:null,markingsColor:"#f4f4f4",markingsLineWidth:2,clickable:false,hoverable:false,autoHighlight:true,mouseActiveRadius:10},interaction:{redrawOverlayInterval:1000/60},hooks:{}},ac=null,al=null,am=null,D=null,aw=null,ao=[],W=[],J={left:0,right:0,top:0,bottom:0},k=0,ad=0,p={processOptions:[],processRawData:[],processDatapoints:[],processOffset:[],drawBackground:[],drawSeries:[],draw:[],bindEvents:[],drawOverlay:[],shutdown:[]},h=this;h.setData=K;h.setupGrid=O;h.draw=au;h.getPlaceholder=function(){return Q};h.getCanvas=function(){return ac.element};h.getPlotOffset=function(){return J};h.width=function(){return k};h.height=function(){return ad};h.offset=function(){var ay=am.offset();ay.left+=J.left;ay.top+=J.top;return ay};h.getData=function(){return t};h.getAxes=function(){var az={},ay;e.each(ao.concat(W),function(aA,aB){if(aB){az[aB.direction+(aB.n!=1?aB.n:"")+"axis"]=aB}});return az};h.getXAxes=function(){return ao};h.getYAxes=function(){return W};h.c2p=Y;h.p2c=R;h.getOptions=function(){return L};h.highlight=an;h.unhighlight=ah;h.triggerRedrawOverlay=X;h.pointOffset=function(ay){return{left:parseInt(ao[x(ay,"x")-1].p2c(+ay.x)+J.left,10),top:parseInt(W[x(ay,"y")-1].p2c(+ay.y)+J.top,10)}};h.shutdown=o;h.destroy=function(){o();Q.removeData("plot").empty();t=[];L=null;ac=null;al=null;am=null;D=null;aw=null;ao=[];W=[];p=null;ag=[];h=null};h.resize=function(){var az=Q.width(),ay=Q.height();ac.resize(az,ay);al.resize(az,ay)};h.hooks=p;H(h);aa(C);ax();K(A);O();au();ar();function F(aA,ay){ay=[h].concat(ay);for(var az=0;az<aA.length;++az){aA[az].apply(this,ay)}}function H(){var az={Canvas:a};for(var ay=0;ay<g.length;++ay){var aA=g[ay];aA.init(h,az);if(aA.options){e.extend(true,L,aA.options)}}}function aa(aA){e.extend(true,L,aA);if(aA&&aA.colors){L.colors=aA.colors}if(L.xaxis.color==null){L.xaxis.color=e.color.parse(L.grid.color).scale("a",0.22).toString()}if(L.yaxis.color==null){L.yaxis.color=e.color.parse(L.grid.color).scale("a",0.22).toString()}if(L.xaxis.tickColor==null){L.xaxis.tickColor=L.grid.tickColor||L.xaxis.color}if(L.yaxis.tickColor==null){L.yaxis.tickColor=L.grid.tickColor||L.yaxis.color}if(L.grid.borderColor==null){L.grid.borderColor=L.grid.color}if(L.grid.tickColor==null){L.grid.tickColor=e.color.parse(L.grid.color).scale("a",0.22).toString()}var ay,aF,aD,aC=Q.css("font-size"),aB=aC?+aC.replace("px",""):13,az={style:Q.css("font-style"),size:Math.round(0.8*aB),variant:Q.css("font-variant"),weight:Q.css("font-weight"),family:Q.css("font-family")};aD=L.xaxes.length||1;for(ay=0;ay<aD;++ay){aF=L.xaxes[ay];if(aF&&!aF.tickColor){aF.tickColor=aF.color}aF=e.extend(true,{},L.xaxis,aF);L.xaxes[ay]=aF;if(aF.font){aF.font=e.extend({},az,aF.font);if(!aF.font.color){aF.font.color=aF.color}if(!aF.font.lineHeight){aF.font.lineHeight=Math.round(aF.font.size*1.15)}}}aD=L.yaxes.length||1;for(ay=0;ay<aD;++ay){aF=L.yaxes[ay];if(aF&&!aF.tickColor){aF.tickColor=aF.color}aF=e.extend(true,{},L.yaxis,aF);L.yaxes[ay]=aF;if(aF.font){aF.font=e.extend({},az,aF.font);if(!aF.font.color){aF.font.color=aF.color}if(!aF.font.lineHeight){aF.font.lineHeight=Math.round(aF.font.size*1.15)}}}if(L.xaxis.noTicks&&L.xaxis.ticks==null){L.xaxis.ticks=L.xaxis.noTicks}if(L.yaxis.noTicks&&L.yaxis.ticks==null){L.yaxis.ticks=L.yaxis.noTicks}if(L.x2axis){L.xaxes[1]=e.extend(true,{},L.xaxis,L.x2axis);L.xaxes[1].position="top";if(L.x2axis.min==null){L.xaxes[1].min=null}if(L.x2axis.max==null){L.xaxes[1].max=null}}if(L.y2axis){L.yaxes[1]=e.extend(true,{},L.yaxis,L.y2axis);L.yaxes[1].position="right";if(L.y2axis.min==null){L.yaxes[1].min=null}if(L.y2axis.max==null){L.yaxes[1].max=null}}if(L.grid.coloredAreas){L.grid.markings=L.grid.coloredAreas}if(L.grid.coloredAreasColor){L.grid.markingsColor=L.grid.coloredAreasColor}if(L.lines){e.extend(true,L.series.lines,L.lines)}if(L.points){e.extend(true,L.series.points,L.points)}if(L.bars){e.extend(true,L.series.bars,L.bars)}if(L.shadowSize!=null){L.series.shadowSize=L.shadowSize}if(L.highlightColor!=null){L.series.highlightColor=L.highlightColor}for(ay=0;ay<L.xaxes.length;++ay){M(ao,ay+1).options=L.xaxes[ay]}for(ay=0;ay<L.yaxes.length;++ay){M(W,ay+1).options=L.yaxes[ay]}for(var aE in p){if(L.hooks[aE]&&L.hooks[aE].length){p[aE]=p[aE].concat(L.hooks[aE])}}F(p.processOptions,[L])}function K(ay){t=q(ay);y();S()}function q(aB){var az=[];for(var ay=0;ay<aB.length;++ay){var aA=e.extend(true,{},L.series);if(aB[ay].data!=null){aA.data=aB[ay].data;delete aB[ay].data;e.extend(true,aA,aB[ay]);aB[ay].data=aA.data}else{aA.data=aB[ay]}az.push(aA)}return az}function x(az,aA){var ay=az[aA+"axis"];if(typeof ay=="object"){ay=ay.n}if(typeof ay!="number"){ay=1}return ay}function j(){return e.grep(ao.concat(W),function(ay){return ay})}function Y(aB){var az={},ay,aA;for(ay=0;ay<ao.length;++ay){aA=ao[ay];if(aA&&aA.used){az["x"+aA.n]=aA.c2p(aB.left)}}for(ay=0;ay<W.length;++ay){aA=W[ay];if(aA&&aA.used){az["y"+aA.n]=aA.c2p(aB.top)}}if(az.x1!==undefined){az.x=az.x1}if(az.y1!==undefined){az.y=az.y1}return az}function R(aC){var aA={},az,aB,ay;for(az=0;az<ao.length;++az){aB=ao[az];if(aB&&aB.used){ay="x"+aB.n;if(aC[ay]==null&&aB.n==1){ay="x"}if(aC[ay]!=null){aA.left=aB.p2c(aC[ay]);break}}}for(az=0;az<W.length;++az){aB=W[az];if(aB&&aB.used){ay="y"+aB.n;if(aC[ay]==null&&aB.n==1){ay="y"}if(aC[ay]!=null){aA.top=aB.p2c(aC[ay]);break}}}return aA}function M(az,ay){if(!az[ay-1]){az[ay-1]={n:ay,direction:az==ao?"x":"y",options:e.extend(true,{},az==ao?L.xaxis:L.yaxis)}}return az[ay-1]}function y(){var aJ=t.length,aA=-1,aB;for(aB=0;aB<t.length;++aB){var aG=t[aB].color;if(aG!=null){aJ--;if(typeof aG=="number"&&aG>aA){aA=aG}}}if(aJ<=aA){aJ=aA+1}var aF,ay=[],aE=L.colors,aD=aE.length,az=0;for(aB=0;aB<aJ;aB++){aF=e.color.parse(aE[aB%aD]||"#666");if(aB%aD==0&&aB){if(az>=0){if(az<0.5){az=-az-0.2}else{az=0}}else{az=-az}}ay[aB]=aF.scale("rgb",1+az)}var aC=0,aK;for(aB=0;aB<t.length;++aB){aK=t[aB];if(aK.color==null){aK.color=ay[aC].toString();++aC}else{if(typeof aK.color=="number"){aK.color=ay[aK.color].toString()}}if(aK.lines.show==null){var aI,aH=true;for(aI in aK){if(aK[aI]&&aK[aI].show){aH=false;break}}if(aH){aK.lines.show=true}}if(aK.lines.zero==null){aK.lines.zero=!!aK.lines.fill}aK.xaxis=M(ao,x(aK,"x"));aK.yaxis=M(W,x(aK,"y"))}}function S(){var aM=Number.POSITIVE_INFINITY,aG=Number.NEGATIVE_INFINITY,ay=Number.MAX_VALUE,aT,aR,aQ,aL,aA,aH,aS,aN,aF,aE,az,aZ,aW,aJ,aY,aV;function aC(a2,a1,a0){if(a1<a2.datamin&&a1!=-ay){a2.datamin=a1}if(a0>a2.datamax&&a0!=ay){a2.datamax=a0}}e.each(j(),function(a0,a1){a1.datamin=aM;a1.datamax=aG;a1.used=false});for(aT=0;aT<t.length;++aT){aH=t[aT];aH.datapoints={points:[]};F(p.processRawData,[aH,aH.data,aH.datapoints])}for(aT=0;aT<t.length;++aT){aH=t[aT];aY=aH.data;aV=aH.datapoints.format;if(!aV){aV=[];aV.push({x:true,number:true,required:true});aV.push({y:true,number:true,required:true});if(aH.bars.show||(aH.lines.show&&aH.lines.fill)){var aO=!!((aH.bars.show&&aH.bars.zero)||(aH.lines.show&&aH.lines.zero));aV.push({y:true,number:true,required:false,defaultValue:0,autoscale:aO});if(aH.bars.horizontal){delete aV[aV.length-1].y;aV[aV.length-1].x=true}}aH.datapoints.format=aV}if(aH.datapoints.pointsize!=null){continue}aH.datapoints.pointsize=aV.length;aN=aH.datapoints.pointsize;aS=aH.datapoints.points;var aD=aH.lines.show&&aH.lines.steps;aH.xaxis.used=aH.yaxis.used=true;for(aR=aQ=0;aR<aY.length;++aR,aQ+=aN){aJ=aY[aR];var aB=aJ==null;if(!aB){for(aL=0;aL<aN;++aL){aZ=aJ[aL];aW=aV[aL];if(aW){if(aW.number&&aZ!=null){aZ=+aZ;if(isNaN(aZ)){aZ=null}else{if(aZ==Infinity){aZ=ay}else{if(aZ==-Infinity){aZ=-ay}}}}if(aZ==null){if(aW.required){aB=true}if(aW.defaultValue!=null){aZ=aW.defaultValue}}}aS[aQ+aL]=aZ}}if(aB){for(aL=0;aL<aN;++aL){aZ=aS[aQ+aL];if(aZ!=null){aW=aV[aL];if(aW.autoscale!==false){if(aW.x){aC(aH.xaxis,aZ,aZ)}if(aW.y){aC(aH.yaxis,aZ,aZ)}}}aS[aQ+aL]=null}}else{if(aD&&aQ>0&&aS[aQ-aN]!=null&&aS[aQ-aN]!=aS[aQ]&&aS[aQ-aN+1]!=aS[aQ+1]){for(aL=0;aL<aN;++aL){aS[aQ+aN+aL]=aS[aQ+aL]}aS[aQ+1]=aS[aQ-aN+1];aQ+=aN}}}}for(aT=0;aT<t.length;++aT){aH=t[aT];F(p.processDatapoints,[aH,aH.datapoints])}for(aT=0;aT<t.length;++aT){aH=t[aT];aS=aH.datapoints.points;aN=aH.datapoints.pointsize;aV=aH.datapoints.format;var aI=aM,aP=aM,aK=aG,aU=aG;for(aR=0;aR<aS.length;aR+=aN){if(aS[aR]==null){continue}for(aL=0;aL<aN;++aL){aZ=aS[aR+aL];aW=aV[aL];if(!aW||aW.autoscale===false||aZ==ay||aZ==-ay){continue}if(aW.x){if(aZ<aI){aI=aZ}if(aZ>aK){aK=aZ}}if(aW.y){if(aZ<aP){aP=aZ}if(aZ>aU){aU=aZ}}}}if(aH.bars.show){var aX;switch(aH.bars.align){case"left":aX=0;break;case"right":aX=-aH.bars.barWidth;break;default:aX=-aH.bars.barWidth/2}if(aH.bars.horizontal){aP+=aX;aU+=aX+aH.bars.barWidth}else{aI+=aX;aK+=aX+aH.bars.barWidth}}aC(aH.xaxis,aI,aK);aC(aH.yaxis,aP,aU)}e.each(j(),function(a0,a1){if(a1.datamin==aM){a1.datamin=null}if(a1.datamax==aG){a1.datamax=null}})}function ax(){Q.css("padding",0).children().filter(function(){return !e(this).hasClass("flot-overlay")&&!e(this).hasClass("flot-base")}).remove();if(Q.css("position")=="static"){Q.css("position","relative")}ac=new a("flot-base",Q);al=new a("flot-overlay",Q);D=ac.context;aw=al.context;am=e(al.element).unbind();var ay=Q.data("plot");if(ay){ay.shutdown();al.clear()}Q.data("plot",h)}function ar(){if(L.grid.hoverable){am.mousemove(f);am.bind("mouseleave",P)}if(L.grid.clickable){am.click(I)}F(p.bindEvents,[am])}function o(){if(l){clearTimeout(l)}am.unbind("mousemove",f);am.unbind("mouseleave",P);am.unbind("click",I);F(p.shutdown,[am])}function n(aD){function az(aE){return aE}var aC,ay,aA=aD.options.transform||az,aB=aD.options.inverseTransform;if(aD.direction=="x"){aC=aD.scale=k/Math.abs(aA(aD.max)-aA(aD.min));ay=Math.min(aA(aD.max),aA(aD.min))}else{aC=aD.scale=ad/Math.abs(aA(aD.max)-aA(aD.min));aC=-aC;ay=Math.max(aA(aD.max),aA(aD.min))}if(aA==az){aD.p2c=function(aE){return(aE-ay)*aC}}else{aD.p2c=function(aE){return(aA(aE)-ay)*aC}}if(!aB){aD.c2p=function(aE){return ay+aE/aC}}else{aD.c2p=function(aE){return aB(ay+aE/aC)}}}function Z(aB){var ay=aB.options,aH=aB.ticks||[],aG=ay.labelWidth||0,aC=ay.labelHeight||0,aI=aG||(aB.direction=="x"?Math.floor(ac.width/(aH.length||1)):null),aE=aB.direction+"Axis "+aB.direction+aB.n+"Axis",aF="flot-"+aB.direction+"-axis flot-"+aB.direction+aB.n+"-axis "+aE,aA=ay.font||"flot-tick-label tickLabel";for(var aD=0;aD<aH.length;++aD){var aJ=aH[aD];if(!aJ.label){continue}var az=ac.getTextInfo(aF,aJ.label,aA,null,aI);aG=Math.max(aG,az.width);aC=Math.max(aC,az.height)}aB.labelWidth=ay.labelWidth||aG;aB.labelHeight=ay.labelHeight||aC}function E(aA){var az=aA.labelWidth,aH=aA.labelHeight,aF=aA.options.position,ay=aA.direction==="x",aD=aA.options.tickLength,aE=L.grid.axisMargin,aG=L.grid.labelMargin,aJ=true,aC=true,aB=true,aI=false;e.each(ay?ao:W,function(aL,aK){if(aK&&(aK.show||aK.reserveSpace)){if(aK===aA){aI=true}else{if(aK.options.position===aF){if(aI){aC=false}else{aJ=false}}}if(!aI){aB=false}}});if(aC){aE=0}if(aD==null){aD=aB?"full":5}if(!isNaN(+aD)){aG+=+aD}if(ay){aH+=aG;if(aF=="bottom"){J.bottom+=aH+aE;aA.box={top:ac.height-J.bottom,height:aH}}else{aA.box={top:J.top+aE,height:aH};J.top+=aH+aE}}else{az+=aG;if(aF=="left"){aA.box={left:J.left+aE,width:az};J.left+=az+aE}else{J.right+=az+aE;aA.box={left:ac.width-J.right,width:az}}}aA.position=aF;aA.tickLength=aD;aA.box.padding=aG;aA.innermost=aJ}function ab(ay){if(ay.direction=="x"){ay.box.left=J.left-ay.labelWidth/2;ay.box.width=ac.width-J.left-J.right+ay.labelWidth}else{ay.box.top=J.top-ay.labelHeight/2;ay.box.height=ac.height-J.bottom-J.top+ay.labelHeight}}function B(){var aA=L.grid.minBorderMargin,az,ay;if(aA==null){aA=0;for(ay=0;ay<t.length;++ay){aA=Math.max(aA,2*(t[ay].points.radius+t[ay].points.lineWidth/2))}}var aB={left:aA,right:aA,top:aA,bottom:aA};e.each(j(),function(aC,aD){if(aD.reserveSpace&&aD.ticks&&aD.ticks.length){if(aD.direction==="x"){aB.left=Math.max(aB.left,aD.labelWidth/2);aB.right=Math.max(aB.right,aD.labelWidth/2)}else{aB.bottom=Math.max(aB.bottom,aD.labelHeight/2);aB.top=Math.max(aB.top,aD.labelHeight/2)}}});J.left=Math.ceil(Math.max(aB.left,J.left));J.right=Math.ceil(Math.max(aB.right,J.right));J.top=Math.ceil(Math.max(aB.top,J.top));J.bottom=Math.ceil(Math.max(aB.bottom,J.bottom))}function O(){var aA,aC=j(),aD=L.grid.show;for(var az in J){var aB=L.grid.margin||0;J[az]=typeof aB=="number"?aB:aB[az]||0}F(p.processOffset,[J]);for(var az in J){if(typeof(L.grid.borderWidth)=="object"){J[az]+=aD?L.grid.borderWidth[az]:0}else{J[az]+=aD?L.grid.borderWidth:0}}e.each(aC,function(aF,aG){var aE=aG.options;aG.show=aE.show==null?aG.used:aE.show;aG.reserveSpace=aE.reserveSpace==null?aG.show:aE.reserveSpace;m(aG)});if(aD){var ay=e.grep(aC,function(aE){return aE.show||aE.reserveSpace});e.each(ay,function(aE,aF){aq(aF);V(aF);u(aF,aF.ticks);Z(aF)});for(aA=ay.length-1;aA>=0;--aA){E(ay[aA])}B();e.each(ay,function(aE,aF){ab(aF)})}k=ac.width-J.left-J.right;ad=ac.height-J.bottom-J.top;e.each(aC,function(aE,aF){n(aF)});if(aD){at()}av()}function m(aB){var aC=aB.options,aA=+(aC.min!=null?aC.min:aB.datamin),ay=+(aC.max!=null?aC.max:aB.datamax),aE=ay-aA;if(aE==0){var az=ay==0?1:0.01;if(aC.min==null){aA-=az}if(aC.max==null||aC.min!=null){ay+=az}}else{var aD=aC.autoscaleMargin;if(aD!=null){if(aC.min==null){aA-=aE*aD;if(aA<0&&aB.datamin!=null&&aB.datamin>=0){aA=0}}if(aC.max==null){ay+=aE*aD;if(ay>0&&aB.datamax!=null&&aB.datamax<=0){ay=0}}}}aB.min=aA;aB.max=ay}function aq(aD){var az=aD.options;var aC;if(typeof az.ticks=="number"&&az.ticks>0){aC=az.ticks}else{aC=0.3*Math.sqrt(aD.direction=="x"?ac.width:ac.height)}var aI=(aD.max-aD.min)/aC,aE=-Math.floor(Math.log(aI)/Math.LN10),aB=az.tickDecimals;if(aB!=null&&aE>aB){aE=aB}var ay=Math.pow(10,-aE),aA=aI/ay,aK;if(aA<1.5){aK=1}else{if(aA<3){aK=2;if(aA>2.25&&(aB==null||aE+1<=aB)){aK=2.5;++aE}}else{if(aA<7.5){aK=5}else{aK=10}}}aK*=ay;if(az.minTickSize!=null&&aK<az.minTickSize){aK=az.minTickSize}aD.delta=aI;aD.tickDecimals=Math.max(0,aB!=null?aB:aE);aD.tickSize=az.tickSize||aK;if(az.mode=="time"&&!aD.tickGenerator){throw new Error("Time mode requires the flot.time plugin.")}if(!aD.tickGenerator){aD.tickGenerator=function(aN){var aP=[],aQ=b(aN.min,aN.tickSize),aM=0,aL=Number.NaN,aO;do{aO=aL;aL=aQ+aM*aN.tickSize;aP.push(aL);++aM}while(aL<aN.max&&aL!=aO);return aP};aD.tickFormatter=function(aQ,aO){var aN=aO.tickDecimals?Math.pow(10,aO.tickDecimals):1;var aP=""+Math.round(aQ*aN)/aN;if(aO.tickDecimals!=null){var aM=aP.indexOf(".");var aL=aM==-1?0:aP.length-aM-1;if(aL<aO.tickDecimals){return(aL?aP:aP+".")+(""+aN).substr(1,aO.tickDecimals-aL)}}return aP}}if(e.isFunction(az.tickFormatter)){aD.tickFormatter=function(aL,aM){return""+az.tickFormatter(aL,aM)}}if(az.alignTicksWithAxis!=null){var aF=(aD.direction=="x"?ao:W)[az.alignTicksWithAxis-1];if(aF&&aF.used&&aF!=aD){var aJ=aD.tickGenerator(aD);if(aJ.length>0){if(az.min==null){aD.min=Math.min(aD.min,aJ[0])}if(az.max==null&&aJ.length>1){aD.max=Math.max(aD.max,aJ[aJ.length-1])}}aD.tickGenerator=function(aN){var aO=[],aL,aM;for(aM=0;aM<aF.ticks.length;++aM){aL=(aF.ticks[aM].v-aF.min)/(aF.max-aF.min);aL=aN.min+aL*(aN.max-aN.min);aO.push(aL)}return aO};if(!aD.mode&&az.tickDecimals==null){var aH=Math.max(0,-Math.floor(Math.log(aD.delta)/Math.LN10)+1),aG=aD.tickGenerator(aD);if(!(aG.length>1&&/\..*0$/.test((aG[1]-aG[0]).toFixed(aH)))){aD.tickDecimals=aH}}}}}function V(aC){var aE=aC.options.ticks,aD=[];if(aE==null||(typeof aE=="number"&&aE>0)){aD=aC.tickGenerator(aC)}else{if(aE){if(e.isFunction(aE)){aD=aE(aC)}else{aD=aE}}}var aB,ay;aC.ticks=[];for(aB=0;aB<aD.length;++aB){var az=null;var aA=aD[aB];if(typeof aA=="object"){ay=+aA[0];if(aA.length>1){az=aA[1]}}else{ay=+aA}if(az==null){az=aC.tickFormatter(ay,aC)}if(!isNaN(ay)){aC.ticks.push({v:ay,label:az})}}}function u(ay,az){if(ay.options.autoscaleMargin&&az.length>0){if(ay.options.min==null){ay.min=Math.min(ay.min,az[0].v)}if(ay.options.max==null&&az.length>1){ay.max=Math.max(ay.max,az[az.length-1].v)}}}function au(){ac.clear();F(p.drawBackground,[D]);var az=L.grid;if(az.show&&az.backgroundColor){r()}if(az.show&&!az.aboveData){w()}for(var ay=0;ay<t.length;++ay){F(p.drawSeries,[D,t[ay]]);aj(t[ay])}F(p.draw,[D]);if(az.show&&az.aboveData){w()}ac.render();X()}function s(ay,aC){var az,aE,aF,aG,aD=j();for(var aB=0;aB<aD.length;++aB){az=aD[aB];if(az.direction==aC){aG=aC+az.n+"axis";if(!ay[aG]&&az.n==1){aG=aC+"axis"}if(ay[aG]){aE=ay[aG].from;aF=ay[aG].to;break}}}if(!ay[aG]){az=aC=="x"?ao[0]:W[0];aE=ay[aC+"1"];aF=ay[aC+"2"]}if(aE!=null&&aF!=null&&aE>aF){var aA=aE;aE=aF;aF=aA}return{from:aE,to:aF,axis:az}}function r(){D.save();D.translate(J.left,J.top);D.fillStyle=v(L.grid.backgroundColor,ad,0,"rgba(255, 255, 255, 0)");D.fillRect(0,0,k,ad);D.restore()}function w(){var aO,aN,aR,aA;D.save();D.translate(J.left,J.top);var aB=L.grid.markings;if(aB){if(e.isFunction(aB)){aN=h.getAxes();aN.xmin=aN.xaxis.min;aN.xmax=aN.xaxis.max;aN.ymin=aN.yaxis.min;aN.ymax=aN.yaxis.max;aB=aB(aN)}for(aO=0;aO<aB.length;++aO){var aL=aB[aO],aC=s(aL,"x"),aG=s(aL,"y");if(aC.from==null){aC.from=aC.axis.min}if(aC.to==null){aC.to=aC.axis.max}if(aG.from==null){aG.from=aG.axis.min}if(aG.to==null){aG.to=aG.axis.max}if(aC.to<aC.axis.min||aC.from>aC.axis.max||aG.to<aG.axis.min||aG.from>aG.axis.max){continue}aC.from=Math.max(aC.from,aC.axis.min);aC.to=Math.min(aC.to,aC.axis.max);aG.from=Math.max(aG.from,aG.axis.min);aG.to=Math.min(aG.to,aG.axis.max);var aD=aC.from===aC.to,aJ=aG.from===aG.to;if(aD&&aJ){continue}aC.from=Math.floor(aC.axis.p2c(aC.from));aC.to=Math.floor(aC.axis.p2c(aC.to));aG.from=Math.floor(aG.axis.p2c(aG.from));aG.to=Math.floor(aG.axis.p2c(aG.to));if(aD||aJ){var ay=aL.lineWidth||L.grid.markingsLineWidth,aP=ay%2?0.5:0;D.beginPath();D.strokeStyle=aL.color||L.grid.markingsColor;D.lineWidth=ay;if(aD){D.moveTo(aC.to+aP,aG.from);D.lineTo(aC.to+aP,aG.to)}else{D.moveTo(aC.from,aG.to+aP);D.lineTo(aC.to,aG.to+aP)}D.stroke()}else{D.fillStyle=aL.color||L.grid.markingsColor;D.fillRect(aC.from,aG.to,aC.to-aC.from,aG.from-aG.to)}}}aN=j();aR=L.grid.borderWidth;for(var aM=0;aM<aN.length;++aM){var az=aN[aM],aH=az.box,aK=az.tickLength,aF,aE,aQ,aS;if(!az.show||az.ticks.length==0){continue}D.lineWidth=1;if(az.direction=="x"){aF=0;if(aK=="full"){aE=(az.position=="top"?0:ad)}else{aE=aH.top-J.top+(az.position=="top"?aH.height:0)}}else{aE=0;if(aK=="full"){aF=(az.position=="left"?0:k)}else{aF=aH.left-J.left+(az.position=="left"?aH.width:0)}}if(!az.innermost){D.strokeStyle=az.options.color;D.beginPath();aQ=aS=0;if(az.direction=="x"){aQ=k+1}else{aS=ad+1}if(D.lineWidth==1){if(az.direction=="x"){aE=Math.floor(aE)+0.5}else{aF=Math.floor(aF)+0.5}}D.moveTo(aF,aE);D.lineTo(aF+aQ,aE+aS);D.stroke()}D.strokeStyle=az.options.tickColor;D.beginPath();for(aO=0;aO<az.ticks.length;++aO){var aI=az.ticks[aO].v;aQ=aS=0;if(isNaN(aI)||aI<az.min||aI>az.max||(aK=="full"&&((typeof aR=="object"&&aR[az.position]>0)||aR>0)&&(aI==az.min||aI==az.max))){continue}if(az.direction=="x"){aF=az.p2c(aI);aS=aK=="full"?-ad:aK;if(az.position=="top"){aS=-aS}}else{aE=az.p2c(aI);aQ=aK=="full"?-k:aK;if(az.position=="left"){aQ=-aQ}}if(D.lineWidth==1){if(az.direction=="x"){aF=Math.floor(aF)+0.5}else{aE=Math.floor(aE)+0.5}}D.moveTo(aF,aE);D.lineTo(aF+aQ,aE+aS)}D.stroke()}if(aR){aA=L.grid.borderColor;if(typeof aR=="object"||typeof aA=="object"){if(typeof aR!=="object"){aR={top:aR,right:aR,bottom:aR,left:aR}}if(typeof aA!=="object"){aA={top:aA,right:aA,bottom:aA,left:aA}}if(aR.top>0){D.strokeStyle=aA.top;D.lineWidth=aR.top;D.beginPath();D.moveTo(0-aR.left,0-aR.top/2);D.lineTo(k,0-aR.top/2);D.stroke()}if(aR.right>0){D.strokeStyle=aA.right;D.lineWidth=aR.right;D.beginPath();D.moveTo(k+aR.right/2,0-aR.top);D.lineTo(k+aR.right/2,ad);D.stroke()}if(aR.bottom>0){D.strokeStyle=aA.bottom;D.lineWidth=aR.bottom;D.beginPath();D.moveTo(k+aR.right,ad+aR.bottom/2);D.lineTo(0,ad+aR.bottom/2);D.stroke()}if(aR.left>0){D.strokeStyle=aA.left;D.lineWidth=aR.left;D.beginPath();D.moveTo(0-aR.left/2,ad+aR.bottom);D.lineTo(0-aR.left/2,0);D.stroke()}}else{D.lineWidth=aR;D.strokeStyle=L.grid.borderColor;D.strokeRect(-aR/2,-aR/2,k+aR,ad+aR)}}D.restore()}function at(){e.each(j(),function(aJ,az){var aC=az.box,aB=az.direction+"Axis "+az.direction+az.n+"Axis",aF="flot-"+az.direction+"-axis flot-"+az.direction+az.n+"-axis "+aB,ay=az.options.font||"flot-tick-label tickLabel",aD,aI,aG,aE,aH;ac.removeText(aF);if(!az.show||az.ticks.length==0){return}for(var aA=0;aA<az.ticks.length;++aA){aD=az.ticks[aA];if(!aD.label||aD.v<az.min||aD.v>az.max){continue}if(az.direction=="x"){aE="center";aI=J.left+az.p2c(aD.v);if(az.position=="bottom"){aG=aC.top+aC.padding}else{aG=aC.top+aC.height-aC.padding;aH="bottom"}}else{aH="middle";aG=J.top+az.p2c(aD.v);if(az.position=="left"){aI=aC.left+aC.width-aC.padding;aE="right"}else{aI=aC.left+aC.padding}}ac.addText(aF,aI,aG,aD.label,ay,null,null,aE,aH)}})}function aj(ay){if(ay.lines.show){G(ay)}if(ay.bars.show){T(ay)}if(ay.points.show){U(ay)}}function G(aB){function aA(aM,aN,aF,aR,aQ){var aS=aM.points,aG=aM.pointsize,aK=null,aJ=null;D.beginPath();for(var aL=aG;aL<aS.length;aL+=aG){var aI=aS[aL-aG],aP=aS[aL-aG+1],aH=aS[aL],aO=aS[aL+1];if(aI==null||aH==null){continue}if(aP<=aO&&aP<aQ.min){if(aO<aQ.min){continue}aI=(aQ.min-aP)/(aO-aP)*(aH-aI)+aI;aP=aQ.min}else{if(aO<=aP&&aO<aQ.min){if(aP<aQ.min){continue}aH=(aQ.min-aP)/(aO-aP)*(aH-aI)+aI;aO=aQ.min}}if(aP>=aO&&aP>aQ.max){if(aO>aQ.max){continue}aI=(aQ.max-aP)/(aO-aP)*(aH-aI)+aI;aP=aQ.max}else{if(aO>=aP&&aO>aQ.max){if(aP>aQ.max){continue}aH=(aQ.max-aP)/(aO-aP)*(aH-aI)+aI;aO=aQ.max}}if(aI<=aH&&aI<aR.min){if(aH<aR.min){continue}aP=(aR.min-aI)/(aH-aI)*(aO-aP)+aP;aI=aR.min}else{if(aH<=aI&&aH<aR.min){if(aI<aR.min){continue}aO=(aR.min-aI)/(aH-aI)*(aO-aP)+aP;aH=aR.min}}if(aI>=aH&&aI>aR.max){if(aH>aR.max){continue}aP=(aR.max-aI)/(aH-aI)*(aO-aP)+aP;aI=aR.max}else{if(aH>=aI&&aH>aR.max){if(aI>aR.max){continue}aO=(aR.max-aI)/(aH-aI)*(aO-aP)+aP;aH=aR.max}}if(aI!=aK||aP!=aJ){D.moveTo(aR.p2c(aI)+aN,aQ.p2c(aP)+aF)}aK=aH;aJ=aO;D.lineTo(aR.p2c(aH)+aN,aQ.p2c(aO)+aF)}D.stroke()}function aC(aF,aN,aM){var aT=aF.points,aS=aF.pointsize,aK=Math.min(Math.max(0,aM.min),aM.max),aU=0,aR,aQ=false,aJ=1,aI=0,aO=0;while(true){if(aS>0&&aU>aT.length+aS){break}aU+=aS;var aW=aT[aU-aS],aH=aT[aU-aS+aJ],aV=aT[aU],aG=aT[aU+aJ];if(aQ){if(aS>0&&aW!=null&&aV==null){aO=aU;aS=-aS;aJ=2;continue}if(aS<0&&aU==aI+aS){D.fill();aQ=false;aS=-aS;aJ=1;aU=aI=aO+aS;continue}}if(aW==null||aV==null){continue}if(aW<=aV&&aW<aN.min){if(aV<aN.min){continue}aH=(aN.min-aW)/(aV-aW)*(aG-aH)+aH;aW=aN.min}else{if(aV<=aW&&aV<aN.min){if(aW<aN.min){continue}aG=(aN.min-aW)/(aV-aW)*(aG-aH)+aH;aV=aN.min}}if(aW>=aV&&aW>aN.max){if(aV>aN.max){continue}aH=(aN.max-aW)/(aV-aW)*(aG-aH)+aH;aW=aN.max}else{if(aV>=aW&&aV>aN.max){if(aW>aN.max){continue}aG=(aN.max-aW)/(aV-aW)*(aG-aH)+aH;aV=aN.max}}if(!aQ){D.beginPath();D.moveTo(aN.p2c(aW),aM.p2c(aK));aQ=true}if(aH>=aM.max&&aG>=aM.max){D.lineTo(aN.p2c(aW),aM.p2c(aM.max));D.lineTo(aN.p2c(aV),aM.p2c(aM.max));continue}else{if(aH<=aM.min&&aG<=aM.min){D.lineTo(aN.p2c(aW),aM.p2c(aM.min));D.lineTo(aN.p2c(aV),aM.p2c(aM.min));continue}}var aL=aW,aP=aV;if(aH<=aG&&aH<aM.min&&aG>=aM.min){aW=(aM.min-aH)/(aG-aH)*(aV-aW)+aW;aH=aM.min}else{if(aG<=aH&&aG<aM.min&&aH>=aM.min){aV=(aM.min-aH)/(aG-aH)*(aV-aW)+aW;aG=aM.min}}if(aH>=aG&&aH>aM.max&&aG<=aM.max){aW=(aM.max-aH)/(aG-aH)*(aV-aW)+aW;aH=aM.max}else{if(aG>=aH&&aG>aM.max&&aH<=aM.max){aV=(aM.max-aH)/(aG-aH)*(aV-aW)+aW;aG=aM.max}}if(aW!=aL){D.lineTo(aN.p2c(aL),aM.p2c(aH))}D.lineTo(aN.p2c(aW),aM.p2c(aH));D.lineTo(aN.p2c(aV),aM.p2c(aG));if(aV!=aP){D.lineTo(aN.p2c(aV),aM.p2c(aG));D.lineTo(aN.p2c(aP),aM.p2c(aG))}}}D.save();D.translate(J.left,J.top);D.lineJoin="round";var aD=aB.lines.lineWidth,ay=aB.shadowSize;if(aD>0&&ay>0){D.lineWidth=ay;D.strokeStyle="rgba(0,0,0,0.1)";var aE=Math.PI/18;aA(aB.datapoints,Math.sin(aE)*(aD/2+ay/2),Math.cos(aE)*(aD/2+ay/2),aB.xaxis,aB.yaxis);D.lineWidth=ay/2;aA(aB.datapoints,Math.sin(aE)*(aD/2+ay/4),Math.cos(aE)*(aD/2+ay/4),aB.xaxis,aB.yaxis)}D.lineWidth=aD;D.strokeStyle=aB.color;var az=z(aB.lines,aB.color,0,ad);if(az){D.fillStyle=az;aC(aB.datapoints,aB.xaxis,aB.yaxis)}if(aD>0){aA(aB.datapoints,0,0,aB.xaxis,aB.yaxis)}D.restore()}function U(aB){function aE(aK,aJ,aR,aH,aP,aQ,aN,aG){var aO=aK.points,aF=aK.pointsize;for(var aI=0;aI<aO.length;aI+=aF){var aM=aO[aI],aL=aO[aI+1];if(aM==null||aM<aQ.min||aM>aQ.max||aL<aN.min||aL>aN.max){continue}D.beginPath();aM=aQ.p2c(aM);aL=aN.p2c(aL)+aH;if(aG=="circle"){D.arc(aM,aL,aJ,0,aP?Math.PI:Math.PI*2,false)}else{aG(D,aM,aL,aJ,aP)}D.closePath();if(aR){D.fillStyle=aR;D.fill()}D.stroke()}}D.save();D.translate(J.left,J.top);var aD=aB.points.lineWidth,az=aB.shadowSize,ay=aB.points.radius,aC=aB.points.symbol;if(aD==0){aD=0.0001}if(aD>0&&az>0){var aA=az/2;D.lineWidth=aA;D.strokeStyle="rgba(0,0,0,0.1)";aE(aB.datapoints,ay,null,aA+aA/2,true,aB.xaxis,aB.yaxis,aC);D.strokeStyle="rgba(0,0,0,0.2)";aE(aB.datapoints,ay,null,aA/2,true,aB.xaxis,aB.yaxis,aC)}D.lineWidth=aD;D.strokeStyle=aB.color;aE(aB.datapoints,ay,z(aB.points,aB.color),0,false,aB.xaxis,aB.yaxis,aC);D.restore()}function ak(aJ,aI,aR,aE,aM,aA,aH,aG,aQ,aN,az){var aB,aP,aF,aL,aC,ay,aK,aD,aO;if(aN){aD=ay=aK=true;aC=false;aB=aR;aP=aJ;aL=aI+aE;aF=aI+aM;if(aP<aB){aO=aP;aP=aB;aB=aO;aC=true;ay=false}}else{aC=ay=aK=true;aD=false;aB=aJ+aE;aP=aJ+aM;aF=aR;aL=aI;if(aL<aF){aO=aL;aL=aF;aF=aO;aD=true;aK=false}}if(aP<aH.min||aB>aH.max||aL<aG.min||aF>aG.max){return}if(aB<aH.min){aB=aH.min;aC=false}if(aP>aH.max){aP=aH.max;ay=false}if(aF<aG.min){aF=aG.min;aD=false}if(aL>aG.max){aL=aG.max;aK=false}aB=aH.p2c(aB);aF=aG.p2c(aF);aP=aH.p2c(aP);aL=aG.p2c(aL);if(aA){aQ.fillStyle=aA(aF,aL);aQ.fillRect(aB,aL,aP-aB,aF-aL)}if(az>0&&(aC||ay||aK||aD)){aQ.beginPath();aQ.moveTo(aB,aF);if(aC){aQ.lineTo(aB,aL)}else{aQ.moveTo(aB,aL)}if(aK){aQ.lineTo(aP,aL)}else{aQ.moveTo(aP,aL)}if(ay){aQ.lineTo(aP,aF)}else{aQ.moveTo(aP,aF)}if(aD){aQ.lineTo(aB,aF)}else{aQ.moveTo(aB,aF)}aQ.stroke()}}function T(aA){function az(aF,aE,aH,aG,aJ,aI){var aK=aF.points,aC=aF.pointsize;for(var aD=0;aD<aK.length;aD+=aC){if(aK[aD]==null){continue}ak(aK[aD],aK[aD+1],aK[aD+2],aE,aH,aG,aJ,aI,D,aA.bars.horizontal,aA.bars.lineWidth)}}D.save();D.translate(J.left,J.top);D.lineWidth=aA.bars.lineWidth;D.strokeStyle=aA.color;var ay;switch(aA.bars.align){case"left":ay=0;break;case"right":ay=-aA.bars.barWidth;break;default:ay=-aA.bars.barWidth/2}var aB=aA.bars.fill?function(aC,aD){return z(aA.bars,aA.color,aC,aD)}:null;az(aA.datapoints,ay,ay+aA.bars.barWidth,aB,aA.xaxis,aA.yaxis);D.restore()}function z(aA,ay,az,aC){var aB=aA.fill;if(!aB){return null}if(aA.fillColor){return v(aA.fillColor,az,aC,ay)}var aD=e.color.parse(ay);aD.a=typeof aB=="number"?aB:0.4;aD.normalize();return aD.toString()}function av(){if(L.legend.container!=null){e(L.legend.container).html("")}else{Q.find(".legend").remove()}if(!L.legend.show){return}var aG=[],aD=[],aE=false,aN=L.legend.labelFormatter,aM,aI;for(var aC=0;aC<t.length;++aC){aM=t[aC];if(aM.label){aI=aN?aN(aM.label,aM):aM.label;if(aI){aD.push({label:aI,color:aM.color})}}}if(L.legend.sorted){if(e.isFunction(L.legend.sorted)){aD.sort(L.legend.sorted)}else{if(L.legend.sorted=="reverse"){aD.reverse()}else{var aB=L.legend.sorted!="descending";aD.sort(function(aP,aO){return aP.label==aO.label?0:((aP.label<aO.label)!=aB?1:-1)})}}}for(var aC=0;aC<aD.length;++aC){var aK=aD[aC];if(aC%L.legend.noColumns==0){if(aE){aG.push("</tr>")}aG.push("<tr>");aE=true}aG.push('<td class="legendColorBox"><div style="border:1px solid '+L.legend.labelBoxBorderColor+';padding:1px"><div style="width:4px;height:0;border:5px solid '+aK.color+';overflow:hidden"></div></div></td><td class="legendLabel">'+aK.label+"</td>")}if(aE){aG.push("</tr>")}if(aG.length==0){return}var aL='<table style="font-size:smaller;color:'+L.grid.color+'">'+aG.join("")+"</table>";if(L.legend.container!=null){e(L.legend.container).html(aL)}else{var aH="",az=L.legend.position,aA=L.legend.margin;if(aA[0]==null){aA=[aA,aA]}if(az.charAt(0)=="n"){aH+="top:"+(aA[1]+J.top)+"px;"}else{if(az.charAt(0)=="s"){aH+="bottom:"+(aA[1]+J.bottom)+"px;"}}if(az.charAt(1)=="e"){aH+="right:"+(aA[0]+J.right)+"px;"}else{if(az.charAt(1)=="w"){aH+="left:"+(aA[0]+J.left)+"px;"}}var aJ=e('<div class="legend">'+aL.replace('style="','style="position:absolute;'+aH+";")+"</div>").appendTo(Q);if(L.legend.backgroundOpacity!=0){var aF=L.legend.backgroundColor;if(aF==null){aF=L.grid.backgroundColor;if(aF&&typeof aF=="string"){aF=e.color.parse(aF)}else{aF=e.color.extract(aJ,"background-color")}aF.a=1;aF=aF.toString()}var ay=aJ.children();e('<div style="position:absolute;width:'+ay.width()+"px;height:"+ay.height()+"px;"+aH+"background-color:"+aF+';"> </div>').prependTo(aJ).css("opacity",L.legend.backgroundOpacity)}}}var ag=[],l=null;function ap(aF,aD,aA){var aL=L.grid.mouseActiveRadius,aX=aL*aL+1,aV=null,aO=false,aT,aR,aQ;for(aT=t.length-1;aT>=0;--aT){if(!aA(t[aT])){continue}var aM=t[aT],aE=aM.xaxis,aC=aM.yaxis,aS=aM.datapoints.points,aN=aE.c2p(aF),aK=aC.c2p(aD),az=aL/aE.scale,ay=aL/aC.scale;aQ=aM.datapoints.pointsize;if(aE.options.inverseTransform){az=Number.MAX_VALUE}if(aC.options.inverseTransform){ay=Number.MAX_VALUE}if(aM.lines.show||aM.points.show){for(aR=0;aR<aS.length;aR+=aQ){var aH=aS[aR],aG=aS[aR+1];if(aH==null){continue}if(aH-aN>az||aH-aN<-az||aG-aK>ay||aG-aK<-ay){continue}var aJ=Math.abs(aE.p2c(aH)-aF),aI=Math.abs(aC.p2c(aG)-aD),aP=aJ*aJ+aI*aI;if(aP<aX){aX=aP;aV=[aT,aR/aQ]}}}if(aM.bars.show&&!aV){var aB,aU;switch(aM.bars.align){case"left":aB=0;break;case"right":aB=-aM.bars.barWidth;break;default:aB=-aM.bars.barWidth/2}aU=aB+aM.bars.barWidth;for(aR=0;aR<aS.length;aR+=aQ){var aH=aS[aR],aG=aS[aR+1],aW=aS[aR+2];if(aH==null){continue}if(t[aT].bars.horizontal?(aN<=Math.max(aW,aH)&&aN>=Math.min(aW,aH)&&aK>=aG+aB&&aK<=aG+aU):(aN>=aH+aB&&aN<=aH+aU&&aK>=Math.min(aW,aG)&&aK<=Math.max(aW,aG))){aV=[aT,aR/aQ]}}}}if(aV){aT=aV[0];aR=aV[1];aQ=t[aT].datapoints.pointsize;return{datapoint:t[aT].datapoints.points.slice(aR*aQ,(aR+1)*aQ),dataIndex:aR,series:t[aT],seriesIndex:aT}}return null}function f(ay){if(L.grid.hoverable){i("plothover",ay,function(az){return az.hoverable!=false})}}function P(ay){if(L.grid.hoverable){i("plothover",ay,function(az){return false})}}function I(ay){i("plotclick",ay,function(az){return az.clickable!=false})}function i(az,ay,aA){var aB=am.offset(),aE=ay.pageX-aB.left-J.left,aC=ay.pageY-aB.top-J.top,aG=Y({left:aE,top:aC});aG.pageX=ay.pageX;aG.pageY=ay.pageY;var aH=ap(aE,aC,aA);if(aH){aH.pageX=parseInt(aH.series.xaxis.p2c(aH.datapoint[0])+aB.left+J.left,10);aH.pageY=parseInt(aH.series.yaxis.p2c(aH.datapoint[1])+aB.top+J.top,10)}if(L.grid.autoHighlight){for(var aD=0;aD<ag.length;++aD){var aF=ag[aD];if(aF.auto==az&&!(aH&&aF.series==aH.series&&aF.point[0]==aH.datapoint[0]&&aF.point[1]==aH.datapoint[1])){ah(aF.series,aF.point)}}if(aH){an(aH.series,aH.datapoint,az)}}Q.trigger(az,[aG,aH])}function X(){var ay=L.interaction.redrawOverlayInterval;if(ay==-1){af();return}if(!l){l=setTimeout(af,ay)}}function af(){l=null;aw.save();al.clear();aw.translate(J.left,J.top);var az,ay;for(az=0;az<ag.length;++az){ay=ag[az];if(ay.series.bars.show){ai(ay.series,ay.point)}else{ae(ay.series,ay.point)}}aw.restore();F(p.drawOverlay,[aw])}function an(aA,ay,aC){if(typeof aA=="number"){aA=t[aA]}if(typeof ay=="number"){var aB=aA.datapoints.pointsize;ay=aA.datapoints.points.slice(aB*ay,aB*(ay+1))}var az=N(aA,ay);if(az==-1){ag.push({series:aA,point:ay,auto:aC});X()}else{if(!aC){ag[az].auto=false}}}function ah(aA,ay){if(aA==null&&ay==null){ag=[];X();return}if(typeof aA=="number"){aA=t[aA]}if(typeof ay=="number"){var aB=aA.datapoints.pointsize;ay=aA.datapoints.points.slice(aB*ay,aB*(ay+1))}var az=N(aA,ay);if(az!=-1){ag.splice(az,1);X()}}function N(aA,aB){for(var ay=0;ay<ag.length;++ay){var az=ag[ay];if(az.series==aA&&az.point[0]==aB[0]&&az.point[1]==aB[1]){return ay}}return -1}function ae(ay,aE){var aC=aE[0],aA=aE[1],aF=ay.xaxis,aD=ay.yaxis,aG=(typeof ay.highlightColor==="string")?ay.highlightColor:e.color.parse(ay.color).scale("a",0.5).toString();if(aC<aF.min||aC>aF.max||aA<aD.min||aA>aD.max){return}var aB=ay.points.radius+ay.points.lineWidth/2;aw.lineWidth=aB;aw.strokeStyle=aG;var az=1.5*aB;aC=aF.p2c(aC);aA=aD.p2c(aA);aw.beginPath();if(ay.points.symbol=="circle"){aw.arc(aC,aA,az,0,2*Math.PI,false)}else{ay.points.symbol(aw,aC,aA,az,false)}aw.closePath();aw.stroke()}function ai(aB,ay){var aC=(typeof aB.highlightColor==="string")?aB.highlightColor:e.color.parse(aB.color).scale("a",0.5).toString(),aA=aC,az;switch(aB.bars.align){case"left":az=0;break;case"right":az=-aB.bars.barWidth;break;default:az=-aB.bars.barWidth/2}aw.lineWidth=aB.bars.lineWidth;aw.strokeStyle=aC;ak(ay[0],ay[1],ay[2]||0,az,az+aB.bars.barWidth,function(){return aA},aB.xaxis,aB.yaxis,aw,aB.bars.horizontal,aB.bars.lineWidth)}function v(aG,ay,aE,az){if(typeof aG=="string"){return aG}else{var aF=D.createLinearGradient(0,aE,0,ay);for(var aB=0,aA=aG.colors.length;aB<aA;++aB){var aC=aG.colors[aB];if(typeof aC!="string"){var aD=e.color.parse(az);if(aC.brightness!=null){aD=aD.scale("rgb",aC.brightness)}if(aC.opacity!=null){aD.a*=aC.opacity}aC=aD.toString()}aF.addColorStop(aB/(aA-1),aC)}return aF}}}e.plot=function(i,g,f){var h=new c(e(i),g,f,e.plot.plugins);return h};e.plot.version="0.8.3";e.plot.plugins=[];e.fn.plot=function(g,f){return this.each(function(){e.plot(this,g,f)})};function b(g,f){return f*Math.floor(g/f)}})(jQuery);(function(a){var k={xaxis:{timezone:null,timeformat:null,twelveHourClock:false,monthNames:null}};function g(m,l){return l*Math.floor(m/l)}function j(t,n,q,m){if(typeof t.strftime=="function"){return t.strftime(n)}var w=function(y,r){y=""+y;r=""+(r==null?"0":r);return y.length==1?r+y:y};var l=[];var x=false;var v=t.getHours();var s=v<12;if(q==null){q=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]}if(m==null){m=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]}var o;if(v>12){o=v-12}else{if(v==0){o=12}else{o=v}}for(var p=0;p<n.length;++p){var u=n.charAt(p);if(x){switch(u){case"a":u=""+m[t.getDay()];break;case"b":u=""+q[t.getMonth()];break;case"d":u=w(t.getDate());break;case"e":u=w(t.getDate()," ");break;case"h":case"H":u=w(v);break;case"I":u=w(o);break;case"l":u=w(o," ");break;case"m":u=w(t.getMonth()+1);break;case"M":u=w(t.getMinutes());break;case"q":u=""+(Math.floor(t.getMonth()/3)+1);break;case"S":u=w(t.getSeconds());break;case"y":u=w(t.getFullYear()%100);break;case"Y":u=""+t.getFullYear();break;case"p":u=(s)?("am"):("pm");break;case"P":u=(s)?("AM"):("PM");break;case"w":u=""+t.getDay();break}l.push(u);x=false}else{if(u=="%"){x=true}else{l.push(u)}}}return l.join("")}function i(q){function l(s,r,p,t){s[r]=function(){return p[t].apply(p,arguments)}}var n={date:q};if(q.strftime!=undefined){l(n,"strftime",q,"strftime")}l(n,"getTime",q,"getTime");l(n,"setTime",q,"setTime");var m=["Date","Day","FullYear","Hours","Milliseconds","Minutes","Month","Seconds"];for(var o=0;o<m.length;o++){l(n,"get"+m[o],q,"getUTC"+m[o]);l(n,"set"+m[o],q,"setUTC"+m[o])}return n}function e(m,l){if(l.timezone=="browser"){return new Date(m)}else{if(!l.timezone||l.timezone=="utc"){return i(new Date(m))}else{if(typeof timezoneJS!="undefined"&&typeof timezoneJS.Date!="undefined"){var n=new timezoneJS.Date();n.setTimezone(l.timezone);n.setTime(m);return n}else{return i(new Date(m))}}}}var c={second:1000,minute:60*1000,hour:60*60*1000,day:24*60*60*1000,month:30*24*60*60*1000,quarter:3*30*24*60*60*1000,year:365.2425*24*60*60*1000};var f=[[1,"second"],[2,"second"],[5,"second"],[10,"second"],[30,"second"],[1,"minute"],[2,"minute"],[5,"minute"],[10,"minute"],[30,"minute"],[1,"hour"],[2,"hour"],[4,"hour"],[8,"hour"],[12,"hour"],[1,"day"],[2,"day"],[3,"day"],[0.25,"month"],[0.5,"month"],[1,"month"],[2,"month"]];var b=f.concat([[3,"month"],[6,"month"],[1,"year"]]);var d=f.concat([[1,"quarter"],[2,"quarter"],[1,"year"]]);function h(l){l.hooks.processOptions.push(function(n,m){a.each(n.getAxes(),function(q,o){var p=o.options;if(p.mode=="time"){o.tickGenerator=function(x){var D=[];var C=e(x.min,p);var u=0;var G=(p.tickSize&&p.tickSize[1]==="quarter")||(p.minTickSize&&p.minTickSize[1]==="quarter")?d:b;if(p.minTickSize!=null){if(typeof p.tickSize=="number"){u=p.tickSize}else{u=p.minTickSize[0]*c[p.minTickSize[1]]}}for(var B=0;B<G.length-1;++B){if(x.delta<(G[B][0]*c[G[B][1]]+G[B+1][0]*c[G[B+1][1]])/2&&G[B][0]*c[G[B][1]]>=u){break}}var I=G[B][0];var E=G[B][1];if(E=="year"){if(p.minTickSize!=null&&p.minTickSize[1]=="year"){I=Math.floor(p.minTickSize[0])}else{var s=Math.pow(10,Math.floor(Math.log(x.delta/c.year)/Math.LN10));var r=(x.delta/c.year)/s;if(r<1.5){I=1}else{if(r<3){I=2}else{if(r<7.5){I=5}else{I=10}}}I*=s}if(I<1){I=1}}x.tickSize=p.tickSize||[I,E];var A=x.tickSize[0];E=x.tickSize[1];var w=A*c[E];if(E=="second"){C.setSeconds(g(C.getSeconds(),A))}else{if(E=="minute"){C.setMinutes(g(C.getMinutes(),A))}else{if(E=="hour"){C.setHours(g(C.getHours(),A))}else{if(E=="month"){C.setMonth(g(C.getMonth(),A))}else{if(E=="quarter"){C.setMonth(3*g(C.getMonth()/3,A))}else{if(E=="year"){C.setFullYear(g(C.getFullYear(),A))}}}}}}C.setMilliseconds(0);if(w>=c.minute){C.setSeconds(0)}if(w>=c.hour){C.setMinutes(0)}if(w>=c.day){C.setHours(0)}if(w>=c.day*4){C.setDate(1)}if(w>=c.month*2){C.setMonth(g(C.getMonth(),3))}if(w>=c.quarter*2){C.setMonth(g(C.getMonth(),6))}if(w>=c.year){C.setMonth(0)}var H=0;var F=Number.NaN;var y;do{y=F;F=C.getTime();D.push(F);if(E=="month"||E=="quarter"){if(A<1){C.setDate(1);var t=C.getTime();C.setMonth(C.getMonth()+(E=="quarter"?3:1));var z=C.getTime();C.setTime(F+H*c.hour+(z-t)*A);H=C.getHours();C.setHours(0)}else{C.setMonth(C.getMonth()+A*(E=="quarter"?3:1))}}else{if(E=="year"){C.setFullYear(C.getFullYear()+A)}else{C.setTime(F+w)}}}while(F<x.max&&F!=y);return D};o.tickFormatter=function(y,s){var w=e(y,s.options);if(p.timeformat!=null){return j(w,p.timeformat,p.monthNames,p.dayNames)}var C=(s.options.tickSize&&s.options.tickSize[1]=="quarter")||(s.options.minTickSize&&s.options.minTickSize[1]=="quarter");var B=s.tickSize[0]*c[s.tickSize[1]];var x=s.max-s.min;var A=(p.twelveHourClock)?" %p":"";var z=(p.twelveHourClock)?"%I":"%H";var r;if(B<c.minute){r=z+":%M:%S"+A}else{if(B<c.day){if(x<2*c.day){r=z+":%M"+A}else{r="%b %d "+z+":%M"+A}}else{if(B<c.month){r="%b %d"}else{if((C&&B<c.quarter)||(!C&&B<c.year)){if(x<c.year){r="%b"}else{r="%b %Y"}}else{if(C&&B<c.year){if(x<c.year){r="Q%q"}else{r="Q%q %Y"}}else{r="%Y"}}}}}var u=j(w,r,p.monthNames,p.dayNames);return u}}})})}a.plot.plugins.push({init:h,options:k,name:"time",version:"1.0"});a.plot.formatDate=j;a.plot.dateGenerator=e})(jQuery);(function(a){function b(k){var p={first:{x:-1,y:-1},second:{x:-1,y:-1},show:false,active:false};var m={};var r=null;function e(s){if(p.active){l(s);k.getPlaceholder().trigger("plotselecting",[g()])}}function n(s){if(s.which!=1){return}document.body.focus();if(document.onselectstart!==undefined&&m.onselectstart==null){m.onselectstart=document.onselectstart;document.onselectstart=function(){return false}}if(document.ondrag!==undefined&&m.ondrag==null){m.ondrag=document.ondrag;document.ondrag=function(){return false}}d(p.first,s);p.active=true;r=function(t){j(t)};a(document).one("mouseup",r)}function j(s){r=null;if(document.onselectstart!==undefined){document.onselectstart=m.onselectstart}if(document.ondrag!==undefined){document.ondrag=m.ondrag}p.active=false;l(s);if(f()){i()}else{k.getPlaceholder().trigger("plotunselected",[]);k.getPlaceholder().trigger("plotselecting",[null])}return false}function g(){if(!f()){return null}if(!p.show){return null}var u={},t=p.first,s=p.second;a.each(k.getAxes(),function(v,w){if(w.used){var y=w.c2p(t[w.direction]),x=w.c2p(s[w.direction]);u[v]={from:Math.min(y,x),to:Math.max(y,x)}}});return u}function i(){var s=g();k.getPlaceholder().trigger("plotselected",[s]);if(s.xaxis&&s.yaxis){k.getPlaceholder().trigger("selected",[{x1:s.xaxis.from,y1:s.yaxis.from,x2:s.xaxis.to,y2:s.yaxis.to}])}}function h(t,u,s){return u<t?t:(u>s?s:u)}function d(w,t){var v=k.getOptions();var u=k.getPlaceholder().offset();var s=k.getPlotOffset();w.x=h(0,t.pageX-u.left-s.left,k.width());w.y=h(0,t.pageY-u.top-s.top,k.height());if(v.selection.mode=="y"){w.x=w==p.first?0:k.width()}if(v.selection.mode=="x"){w.y=w==p.first?0:k.height()}}function l(s){if(s.pageX==null){return}d(p.second,s);if(f()){p.show=true;k.triggerRedrawOverlay()}else{q(true)}}function q(s){if(p.show){p.show=false;k.triggerRedrawOverlay();if(!s){k.getPlaceholder().trigger("plotunselected",[])}}}function c(s,w){var t,y,z,A,x=k.getAxes();for(var u in x){t=x[u];if(t.direction==w){A=w+t.n+"axis";if(!s[A]&&t.n==1){A=w+"axis"}if(s[A]){y=s[A].from;z=s[A].to;break}}}if(!s[A]){t=w=="x"?k.getXAxes()[0]:k.getYAxes()[0];y=s[w+"1"];z=s[w+"2"]}if(y!=null&&z!=null&&y>z){var v=y;y=z;z=v}return{from:y,to:z,axis:t}}function o(t,s){var v,u,w=k.getOptions();if(w.selection.mode=="y"){p.first.x=0;p.second.x=k.width()}else{u=c(t,"x");p.first.x=u.axis.p2c(u.from);p.second.x=u.axis.p2c(u.to)}if(w.selection.mode=="x"){p.first.y=0;p.second.y=k.height()}else{u=c(t,"y");p.first.y=u.axis.p2c(u.from);p.second.y=u.axis.p2c(u.to)}p.show=true;k.triggerRedrawOverlay();if(!s&&f()){i()}}function f(){var s=k.getOptions().selection.minSize;return Math.abs(p.second.x-p.first.x)>=s&&Math.abs(p.second.y-p.first.y)>=s}k.clearSelection=q;k.setSelection=o;k.getSelection=g;k.hooks.bindEvents.push(function(t,s){var u=t.getOptions();if(u.selection.mode!=null){s.mousemove(e);s.mousedown(n)}});k.hooks.drawOverlay.push(function(v,D){if(p.show&&f()){var t=v.getPlotOffset();var s=v.getOptions();D.save();D.translate(t.left,t.top);var z=a.color.parse(s.selection.color);D.strokeStyle=z.scale("a",0.8).toString();D.lineWidth=1;D.lineJoin=s.selection.shape;D.fillStyle=z.scale("a",0.4).toString();var B=Math.min(p.first.x,p.second.x)+0.5,A=Math.min(p.first.y,p.second.y)+0.5,C=Math.abs(p.second.x-p.first.x)-1,u=Math.abs(p.second.y-p.first.y)-1;D.fillRect(B,A,C,u);D.strokeRect(B,A,C,u);D.restore()}});k.hooks.shutdown.push(function(t,s){s.unbind("mousemove",e);s.unbind("mousedown",n);if(r){a(document).unbind("mouseup",r)}})}a.plot.plugins.push({init:b,options:{selection:{mode:null,color:"#e8cfac",shape:"round",minSize:5}},name:"selection",version:"1.1"})})(jQuery);/*
 * jquery.flot.tooltip
 * 
 * description: easy-to-use tooltips for Flot charts
 * version: 0.8.4
 * authors: Krzysztof Urbas @krzysu [myviews.pl],Evan Steinkerchner @Roundaround
 * website: https://github.com/krzysu/flot.tooltip
 * 
 * build on 2014-08-06
 * released under MIT License, 2012
*/ 
(function ($) {
    // plugin options, default values
    var defaultOptions = {
        tooltip: false,
        tooltipOpts: {
            id: "flotTip",
            content: "%s | X: %x | Y: %y",
            // allowed templates are:
            // %s -> series label,
            // %lx -> x axis label (requires flot-axislabels plugin https://github.com/markrcote/flot-axislabels),
            // %ly -> y axis label (requires flot-axislabels plugin https://github.com/markrcote/flot-axislabels),
            // %x -> X value,
            // %y -> Y value,
            // %x.2 -> precision of X value,
            // %p -> percent
            xDateFormat: null,
            yDateFormat: null,
            monthNames: null,
            dayNames: null,
            shifts: {
                x: 10,
                y: 20
            },
            defaultTheme: true,
            lines: false,

            // callbacks
            onHover: function (flotItem, $tooltipEl) {},

            $compat: false
        }
    };

    // object
    var FlotTooltip = function (plot) {
        // variables
        this.tipPosition = {x: 0, y: 0};

        this.init(plot);
    };

    // main plugin function
    FlotTooltip.prototype.init = function (plot) {
        var that = this;

        // detect other flot plugins
        var plotPluginsLength = $.plot.plugins.length;
        this.plotPlugins = [];

        if (plotPluginsLength) {
            for (var p = 0; p < plotPluginsLength; p++) {
                this.plotPlugins.push($.plot.plugins[p].name);
            }
        }

        plot.hooks.bindEvents.push(function (plot, eventHolder) {

            // get plot options
            that.plotOptions = plot.getOptions();

            // if not enabled return
            if (that.plotOptions.tooltip === false || typeof that.plotOptions.tooltip === 'undefined') return;

            // shortcut to access tooltip options
            that.tooltipOptions = that.plotOptions.tooltipOpts;

            if (that.tooltipOptions.$compat) {
                that.wfunc = 'width';
                that.hfunc = 'height';
            } else {
                that.wfunc = 'innerWidth';
                that.hfunc = 'innerHeight';
            }

            // create tooltip DOM element
            var $tip = that.getDomElement();

            // bind event
            $( plot.getPlaceholder() ).bind("plothover", plothover);

            $(eventHolder).bind('mousemove', mouseMove);
        });

        plot.hooks.shutdown.push(function (plot, eventHolder){
            $(plot.getPlaceholder()).unbind("plothover", plothover);
            $(eventHolder).unbind("mousemove", mouseMove);
        });

        function mouseMove(e){
            var pos = {};
            pos.x = e.pageX;
            pos.y = e.pageY;
            plot.setTooltipPosition(pos);
        }

        function plothover(event, pos, item) {
            // Simple distance formula.
            var lineDistance = function (p1x, p1y, p2x, p2y) {
                return Math.sqrt((p2x - p1x) * (p2x - p1x) + (p2y - p1y) * (p2y - p1y));
            };

            // Here is some voodoo magic for determining the distance to a line form a given point {x, y}.
            var dotLineLength = function (x, y, x0, y0, x1, y1, o) {
                if (o && !(o =
                    function (x, y, x0, y0, x1, y1) {
                        if (typeof x0 !== 'undefined') return { x: x0, y: y };
                        else if (typeof y0 !== 'undefined') return { x: x, y: y0 };

                        var left,
                            tg = -1 / ((y1 - y0) / (x1 - x0));

                        return {
                            x: left = (x1 * (x * tg - y + y0) + x0 * (x * -tg + y - y1)) / (tg * (x1 - x0) + y0 - y1),
                            y: tg * left - tg * x + y
                        };
                    } (x, y, x0, y0, x1, y1),
                    o.x >= Math.min(x0, x1) && o.x <= Math.max(x0, x1) && o.y >= Math.min(y0, y1) && o.y <= Math.max(y0, y1))
                ) {
                    var l1 = lineDistance(x, y, x0, y0), l2 = lineDistance(x, y, x1, y1);
                    return l1 > l2 ? l2 : l1;
                } else {
                    var a = y0 - y1, b = x1 - x0, c = x0 * y1 - y0 * x1;
                    return Math.abs(a * x + b * y + c) / Math.sqrt(a * a + b * b);
                }
            };

            if (item) {
                plot.showTooltip(item, pos);
            } else if (that.plotOptions.series.lines.show && that.tooltipOptions.lines === true) {
                var maxDistance = that.plotOptions.grid.mouseActiveRadius;

                var closestTrace = {
                    distance: maxDistance + 1
                };

                $.each(plot.getData(), function (i, series) {
                    var xBeforeIndex = 0,
                        xAfterIndex = -1;

                    // Our search here assumes our data is sorted via the x-axis.
                    // TODO: Improve efficiency somehow - search smaller sets of data.
                    for (var j = 1; j < series.data.length; j++) {
                        if (series.data[j - 1][0] <= pos.x && series.data[j][0] >= pos.x) {
                            xBeforeIndex = j - 1;
                            xAfterIndex = j;
                        }
                    }

                    if (xAfterIndex === -1) {
                        plot.hideTooltip();
                        return;
                    }

                    var pointPrev = { x: series.data[xBeforeIndex][0], y: series.data[xBeforeIndex][1] },
                        pointNext = { x: series.data[xAfterIndex][0], y: series.data[xAfterIndex][1] };

                    var distToLine = dotLineLength(series.xaxis.p2c(pos.x), series.yaxis.p2c(pos.y), series.xaxis.p2c(pointPrev.x),
                        series.yaxis.p2c(pointPrev.y), series.xaxis.p2c(pointNext.x), series.yaxis.p2c(pointNext.y), false);

                    if (distToLine < closestTrace.distance) {

                        var closestIndex = lineDistance(pointPrev.x, pointPrev.y, pos.x, pos.y) <
                            lineDistance(pos.x, pos.y, pointNext.x, pointNext.y) ? xBeforeIndex : xAfterIndex;

                        var pointSize = series.datapoints.pointsize;

                        // Calculate the point on the line vertically closest to our cursor.
                        var pointOnLine = [
                            pos.x,
                            pointPrev.y + ((pointNext.y - pointPrev.y) * ((pos.x - pointPrev.x) / (pointNext.x - pointPrev.x)))
                        ];

                        var item = {
                            datapoint: pointOnLine,
                            dataIndex: closestIndex,
                            series: series,
                            seriesIndex: i
                        };

                        closestTrace = {
                            distance: distToLine,
                            item: item
                        };
                    }
                });

                if (closestTrace.distance < maxDistance + 1)
                    plot.showTooltip(closestTrace.item, pos);
                else
                    plot.hideTooltip();
            } else {
                plot.hideTooltip();
            }
        }

	    // Quick little function for setting the tooltip position.
	    plot.setTooltipPosition = function (pos) {
	        var $tip = that.getDomElement();

	        var totalTipWidth = $tip.outerWidth() + that.tooltipOptions.shifts.x;
	        var totalTipHeight = $tip.outerHeight() + that.tooltipOptions.shifts.y;
	        if ((pos.x - $(window).scrollLeft()) > ($(window)[that.wfunc]() - totalTipWidth)) {
	            pos.x -= totalTipWidth;
	        }
	        if ((pos.y - $(window).scrollTop()) > ($(window)[that.hfunc]() - totalTipHeight)) {
	            pos.y -= totalTipHeight;
	        }
	        that.tipPosition.x = pos.x;
	        that.tipPosition.y = pos.y;
	    };

	    // Quick little function for showing the tooltip.
	    plot.showTooltip = function (target, position) {
	        var $tip = that.getDomElement();

	        // convert tooltip content template to real tipText
	        var tipText = that.stringFormat(that.tooltipOptions.content, target);

	        $tip.html(tipText);
	        plot.setTooltipPosition({ x: position.pageX, y: position.pageY });
	        $tip.css({
	            left: that.tipPosition.x + that.tooltipOptions.shifts.x,
	            top: that.tipPosition.y + that.tooltipOptions.shifts.y
	        }).show();

	        // run callback
	        if (typeof that.tooltipOptions.onHover === 'function') {
	            that.tooltipOptions.onHover(target, $tip);
	        }
	    };

	    // Quick little function for hiding the tooltip.
	    plot.hideTooltip = function () {
	        that.getDomElement().hide().html('');
	    };
    };

    /**
     * get or create tooltip DOM element
     * @return jQuery object
     */
    FlotTooltip.prototype.getDomElement = function () {
        var $tip = $('#' + this.tooltipOptions.id);

        if( $tip.length === 0 ){
            $tip = $('<div />').attr('id', this.tooltipOptions.id);
            $tip.appendTo('body').hide().css({position: 'absolute'});

            if(this.tooltipOptions.defaultTheme) {
                $tip.css({
                    'background': '#fff',
                    'z-index': '1040',
                    'padding': '0.4em 0.6em',
                    'border-radius': '0.5em',
                    'font-size': '0.8em',
                    'border': '1px solid #111',
                    'display': 'none',
                    'white-space': 'nowrap'
                });
            }
        }

        return $tip;
    };

    /**
     * core function, create tooltip content
     * @param  {string} content - template with tooltip content
     * @param  {object} item - Flot item
     * @return {string} real tooltip content for current item
     */
    FlotTooltip.prototype.stringFormat = function (content, item) {

        var percentPattern = /%p\.{0,1}(\d{0,})/;
        var seriesPattern = /%s/;
        var xLabelPattern = /%lx/; // requires flot-axislabels plugin https://github.com/markrcote/flot-axislabels, will be ignored if plugin isn't loaded
        var yLabelPattern = /%ly/; // requires flot-axislabels plugin https://github.com/markrcote/flot-axislabels, will be ignored if plugin isn't loaded
        var xPattern = /%x\.{0,1}(\d{0,})/;
        var yPattern = /%y\.{0,1}(\d{0,})/;
        var xPatternWithoutPrecision = "%x";
        var yPatternWithoutPrecision = "%y";
        var customTextPattern = "%ct";

        var x, y, customText, p;

        // for threshold plugin we need to read data from different place
        if (typeof item.series.threshold !== "undefined") {
            x = item.datapoint[0];
            y = item.datapoint[1];
            customText = item.datapoint[2];
        } else if (typeof item.series.lines !== "undefined" && item.series.lines.steps) {
            x = item.series.datapoints.points[item.dataIndex * 2];
            y = item.series.datapoints.points[item.dataIndex * 2 + 1];
            // TODO: where to find custom text in this variant?
            customText = "";
        } else {
            x = item.series.data[item.dataIndex][0];
            y = item.series.data[item.dataIndex][1];
            customText = item.series.data[item.dataIndex][2];
        }

        // I think this is only in case of threshold plugin
        if (item.series.label === null && item.series.originSeries) {
            item.series.label = item.series.originSeries.label;
        }

        // if it is a function callback get the content string
        if (typeof(content) === 'function') {
            content = content(item.series.label, x, y, item);
        }

        // percent match for pie charts and stacked percent
        if (typeof (item.series.percent) !== 'undefined') {
            p = item.series.percent;
        } else if (typeof (item.series.percents) !== 'undefined') {
            p = item.series.percents[item.dataIndex];
        }        
        if (typeof p === 'number') {
            content = this.adjustValPrecision(percentPattern, content, p);
        }

        // series match
        if (typeof(item.series.label) !== 'undefined') {
            content = content.replace(seriesPattern, item.series.label);
        } else {
            //remove %s if label is undefined
            content = content.replace(seriesPattern, "");
        }

        // x axis label match
        if (this.hasAxisLabel('xaxis', item)) {
            content = content.replace(xLabelPattern, item.series.xaxis.options.axisLabel);
        } else {
            //remove %lx if axis label is undefined or axislabels plugin not present
            content = content.replace(xLabelPattern, "");
        }

        // y axis label match
        if (this.hasAxisLabel('yaxis', item)) {
            content = content.replace(yLabelPattern, item.series.yaxis.options.axisLabel);
        } else {
            //remove %ly if axis label is undefined or axislabels plugin not present
            content = content.replace(yLabelPattern, "");
        }

        // time mode axes with custom dateFormat
        if (this.isTimeMode('xaxis', item) && this.isXDateFormat(item)) {
            content = content.replace(xPattern, this.timestampToDate(x, this.tooltipOptions.xDateFormat, item.series.xaxis.options));
        }
		if (this.isTimeMode('yaxis', item) && this.isYDateFormat(item)) {
            content = content.replace(yPattern, this.timestampToDate(y, this.tooltipOptions.yDateFormat, item.series.yaxis.options));
        }

        // set precision if defined
        if (typeof x === 'number') {
            content = this.adjustValPrecision(xPattern, content, x);
        }
        if (typeof y === 'number') {
            content = this.adjustValPrecision(yPattern, content, y);
        }

        // change x from number to given label, if given
        if (typeof item.series.xaxis.ticks !== 'undefined') {

            var ticks;
            if (this.hasRotatedXAxisTicks(item)) {
                // xaxis.ticks will be an empty array if tickRotor is being used, but the values are available in rotatedTicks
                ticks = 'rotatedTicks';
            } else {
                ticks = 'ticks';
            }

            // see https://github.com/krzysu/flot.tooltip/issues/65
            var tickIndex = item.dataIndex + item.seriesIndex;

            if (item.series.xaxis[ticks].length > tickIndex && !this.isTimeMode('xaxis', item)) {
                var valueX = (this.isCategoriesMode('xaxis', item)) ? item.series.xaxis[ticks][tickIndex].label : item.series.xaxis[ticks][tickIndex].v;
                if (valueX === x) {
                    content = content.replace(xPattern, item.series.xaxis[ticks][tickIndex].label);
                }
            }
        }

        // change y from number to given label, if given
        if (typeof item.series.yaxis.ticks !== 'undefined') {
            for (var index in item.series.yaxis.ticks) {
                if (item.series.yaxis.ticks.hasOwnProperty(index)) {
                    var valueY = (this.isCategoriesMode('yaxis', item)) ? item.series.yaxis.ticks[index].label : item.series.yaxis.ticks[index].v;
                    if (valueY === y) {
                        content = content.replace(yPattern, item.series.yaxis.ticks[index].label);
                    }
                }
            }
        }

        // if no value customization, use tickFormatter by default
        if (typeof item.series.xaxis.tickFormatter !== 'undefined') {
            //escape dollar
            content = content.replace(xPatternWithoutPrecision, item.series.xaxis.tickFormatter(x, item.series.xaxis).replace(/\$/g, '$$'));
        }
        if (typeof item.series.yaxis.tickFormatter !== 'undefined') {
            //escape dollar
            content = content.replace(yPatternWithoutPrecision, item.series.yaxis.tickFormatter(y, item.series.yaxis).replace(/\$/g, '$$'));
        }

        if (customText)
            content = content.replace(customTextPattern, customText);

        return content;
    };

    // helpers just for readability
    FlotTooltip.prototype.isTimeMode = function (axisName, item) {
        return (typeof item.series[axisName].options.mode !== 'undefined' && item.series[axisName].options.mode === 'time');
    };

    FlotTooltip.prototype.isXDateFormat = function (item) {
        return (typeof this.tooltipOptions.xDateFormat !== 'undefined' && this.tooltipOptions.xDateFormat !== null);
    };

    FlotTooltip.prototype.isYDateFormat = function (item) {
        return (typeof this.tooltipOptions.yDateFormat !== 'undefined' && this.tooltipOptions.yDateFormat !== null);
    };

    FlotTooltip.prototype.isCategoriesMode = function (axisName, item) {
        return (typeof item.series[axisName].options.mode !== 'undefined' && item.series[axisName].options.mode === 'categories');
    };

    //
    FlotTooltip.prototype.timestampToDate = function (tmst, dateFormat, options) {
        var theDate = $.plot.dateGenerator(tmst, options);
        return $.plot.formatDate(theDate, dateFormat, this.tooltipOptions.monthNames, this.tooltipOptions.dayNames);
    };

    //
    FlotTooltip.prototype.adjustValPrecision = function (pattern, content, value) {

        var precision;
        var matchResult = content.match(pattern);
        if( matchResult !== null ) {
            if(RegExp.$1 !== '') {
                precision = RegExp.$1;
                value = value.toFixed(precision);

                // only replace content if precision exists, in other case use thickformater
                content = content.replace(pattern, value);
            }
        }
        return content;
    };

    // other plugins detection below

    // check if flot-axislabels plugin (https://github.com/markrcote/flot-axislabels) is used and that an axis label is given
    FlotTooltip.prototype.hasAxisLabel = function (axisName, item) {
        return ($.inArray(this.plotPlugins, 'axisLabels') !== -1 && typeof item.series[axisName].options.axisLabel !== 'undefined' && item.series[axisName].options.axisLabel.length > 0);
    };

    // check whether flot-tickRotor, a plugin which allows rotation of X-axis ticks, is being used
    FlotTooltip.prototype.hasRotatedXAxisTicks = function (item) {
        return ($.inArray(this.plotPlugins, 'tickRotor') !== -1 && typeof item.series.xaxis.rotatedTicks !== 'undefined');
    };

    //
    var init = function (plot) {
      new FlotTooltip(plot);
    };

    // define Flot plugin
    $.plot.plugins.push({
        init: init,
        options: defaultOptions,
        name: 'tooltip',
        version: '0.8.4'
    });

})(jQuery);
