var Module;
if (!Module) Module = (typeof RapidLib !== "undefined" ? RapidLib : null) || {};
var moduleOverrides = {};
for (var key in Module) {
 if (Module.hasOwnProperty(key)) {
  moduleOverrides[key] = Module[key];
 }
}
var ENVIRONMENT_IS_WEB = typeof window === "object";
var ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
var ENVIRONMENT_IS_NODE = typeof process === "object" && typeof require === "function" && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
 if (!Module["print"]) Module["print"] = function print(x) {
  process["stdout"].write(x + "\n");
 };
 if (!Module["printErr"]) Module["printErr"] = function printErr(x) {
  process["stderr"].write(x + "\n");
 };
 var nodeFS = require("fs");
 var nodePath = require("path");
 Module["read"] = function read(filename, binary) {
  filename = nodePath["normalize"](filename);
  var ret = nodeFS["readFileSync"](filename);
  if (!ret && filename != nodePath["resolve"](filename)) {
   filename = path.join(__dirname, "..", "src", filename);
   ret = nodeFS["readFileSync"](filename);
  }
  if (ret && !binary) ret = ret.toString();
  return ret;
 };
 Module["readBinary"] = function readBinary(filename) {
  var ret = Module["read"](filename, true);
  if (!ret.buffer) {
   ret = new Uint8Array(ret);
  }
  assert(ret.buffer);
  return ret;
 };
 Module["load"] = function load(f) {
  globalEval(read(f));
 };
 if (!Module["thisProgram"]) {
  if (process["argv"].length > 1) {
   Module["thisProgram"] = process["argv"][1].replace(/\\/g, "/");
  } else {
   Module["thisProgram"] = "unknown-program";
  }
 }
 Module["arguments"] = process["argv"].slice(2);
 if (typeof module !== "undefined") {
  module["exports"] = Module;
 }
 process["on"]("uncaughtException", (function(ex) {
  if (!(ex instanceof ExitStatus)) {
   throw ex;
  }
 }));
 Module["inspect"] = (function() {
  return "[Emscripten Module object]";
 });
} else if (ENVIRONMENT_IS_SHELL) {
 if (!Module["print"]) Module["print"] = print;
 if (typeof printErr != "undefined") Module["printErr"] = printErr;
 if (typeof read != "undefined") {
  Module["read"] = read;
 } else {
  Module["read"] = function read() {
   throw "no read() available (jsc?)";
  };
 }
 Module["readBinary"] = function readBinary(f) {
  if (typeof readbuffer === "function") {
   return new Uint8Array(readbuffer(f));
  }
  var data = read(f, "binary");
  assert(typeof data === "object");
  return data;
 };
 if (typeof scriptArgs != "undefined") {
  Module["arguments"] = scriptArgs;
 } else if (typeof arguments != "undefined") {
  Module["arguments"] = arguments;
 }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
 Module["read"] = function read(url) {
  var xhr = new XMLHttpRequest;
  xhr.open("GET", url, false);
  xhr.send(null);
  return xhr.responseText;
 };
 if (typeof arguments != "undefined") {
  Module["arguments"] = arguments;
 }
 if (typeof console !== "undefined") {
  if (!Module["print"]) Module["print"] = function print(x) {
   console.log(x);
  };
  if (!Module["printErr"]) Module["printErr"] = function printErr(x) {
   console.log(x);
  };
 } else {
  var TRY_USE_DUMP = false;
  if (!Module["print"]) Module["print"] = TRY_USE_DUMP && typeof dump !== "undefined" ? (function(x) {
   dump(x);
  }) : (function(x) {});
 }
 if (ENVIRONMENT_IS_WORKER) {
  Module["load"] = importScripts;
 }
 if (typeof Module["setWindowTitle"] === "undefined") {
  Module["setWindowTitle"] = (function(title) {
   document.title = title;
  });
 }
} else {
 throw "Unknown runtime environment. Where are we?";
}
function globalEval(x) {
 eval.call(null, x);
}
if (!Module["load"] && Module["read"]) {
 Module["load"] = function load(f) {
  globalEval(Module["read"](f));
 };
}
if (!Module["print"]) {
 Module["print"] = (function() {});
}
if (!Module["printErr"]) {
 Module["printErr"] = Module["print"];
}
if (!Module["arguments"]) {
 Module["arguments"] = [];
}
if (!Module["thisProgram"]) {
 Module["thisProgram"] = "./this.program";
}
Module.print = Module["print"];
Module.printErr = Module["printErr"];
Module["preRun"] = [];
Module["postRun"] = [];
for (var key in moduleOverrides) {
 if (moduleOverrides.hasOwnProperty(key)) {
  Module[key] = moduleOverrides[key];
 }
}
var Runtime = {
 setTempRet0: (function(value) {
  tempRet0 = value;
 }),
 getTempRet0: (function() {
  return tempRet0;
 }),
 stackSave: (function() {
  return STACKTOP;
 }),
 stackRestore: (function(stackTop) {
  STACKTOP = stackTop;
 }),
 getNativeTypeSize: (function(type) {
  switch (type) {
  case "i1":
  case "i8":
   return 1;
  case "i16":
   return 2;
  case "i32":
   return 4;
  case "i64":
   return 8;
  case "float":
   return 4;
  case "double":
   return 8;
  default:
   {
    if (type[type.length - 1] === "*") {
     return Runtime.QUANTUM_SIZE;
    } else if (type[0] === "i") {
     var bits = parseInt(type.substr(1));
     assert(bits % 8 === 0);
     return bits / 8;
    } else {
     return 0;
    }
   }
  }
 }),
 getNativeFieldSize: (function(type) {
  return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
 }),
 STACK_ALIGN: 16,
 prepVararg: (function(ptr, type) {
  if (type === "double" || type === "i64") {
   if (ptr & 7) {
    assert((ptr & 7) === 4);
    ptr += 4;
   }
  } else {
   assert((ptr & 3) === 0);
  }
  return ptr;
 }),
 getAlignSize: (function(type, size, vararg) {
  if (!vararg && (type == "i64" || type == "double")) return 8;
  if (!type) return Math.min(size, 8);
  return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
 }),
 dynCall: (function(sig, ptr, args) {
  if (args && args.length) {
   assert(args.length == sig.length - 1);
   if (!args.splice) args = Array.prototype.slice.call(args);
   args.splice(0, 0, ptr);
   assert("dynCall_" + sig in Module, "bad function pointer type - no table for sig '" + sig + "'");
   return Module["dynCall_" + sig].apply(null, args);
  } else {
   assert(sig.length == 1);
   assert("dynCall_" + sig in Module, "bad function pointer type - no table for sig '" + sig + "'");
   return Module["dynCall_" + sig].call(null, ptr);
  }
 }),
 functionPointers: [],
 addFunction: (function(func) {
  for (var i = 0; i < Runtime.functionPointers.length; i++) {
   if (!Runtime.functionPointers[i]) {
    Runtime.functionPointers[i] = func;
    return 2 * (1 + i);
   }
  }
  throw "Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.";
 }),
 removeFunction: (function(index) {
  Runtime.functionPointers[(index - 2) / 2] = null;
 }),
 warnOnce: (function(text) {
  if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
  if (!Runtime.warnOnce.shown[text]) {
   Runtime.warnOnce.shown[text] = 1;
   Module.printErr(text);
  }
 }),
 funcWrappers: {},
 getFuncWrapper: (function(func, sig) {
  assert(sig);
  if (!Runtime.funcWrappers[sig]) {
   Runtime.funcWrappers[sig] = {};
  }
  var sigCache = Runtime.funcWrappers[sig];
  if (!sigCache[func]) {
   sigCache[func] = function dynCall_wrapper() {
    return Runtime.dynCall(sig, func, arguments);
   };
  }
  return sigCache[func];
 }),
 getCompilerSetting: (function(name) {
  throw "You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work";
 }),
 stackAlloc: (function(size) {
  var ret = STACKTOP;
  STACKTOP = STACKTOP + size | 0;
  STACKTOP = STACKTOP + 15 & -16;
  assert((STACKTOP | 0) < (STACK_MAX | 0) | 0) | 0;
  return ret;
 }),
 staticAlloc: (function(size) {
  var ret = STATICTOP;
  STATICTOP = STATICTOP + (assert(!staticSealed), size) | 0;
  STATICTOP = STATICTOP + 15 & -16;
  return ret;
 }),
 dynamicAlloc: (function(size) {
  var ret = DYNAMICTOP;
  DYNAMICTOP = DYNAMICTOP + (assert(DYNAMICTOP > 0), size) | 0;
  DYNAMICTOP = DYNAMICTOP + 15 & -16;
  if (DYNAMICTOP >= TOTAL_MEMORY) {
   var success = enlargeMemory();
   if (!success) {
    DYNAMICTOP = ret;
    return 0;
   }
  }
  return ret;
 }),
 alignMemory: (function(size, quantum) {
  var ret = size = Math.ceil(size / (quantum ? quantum : 16)) * (quantum ? quantum : 16);
  return ret;
 }),
 makeBigInt: (function(low, high, unsigned) {
  var ret = unsigned ? +(low >>> 0) + +(high >>> 0) * +4294967296 : +(low >>> 0) + +(high | 0) * +4294967296;
  return ret;
 }),
 GLOBAL_BASE: 8,
 QUANTUM_SIZE: 4,
 __dummy__: 0
};
Module["Runtime"] = Runtime;
var __THREW__ = 0;
var ABORT = false;
var EXITSTATUS = 0;
var undef = 0;
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
 if (!condition) {
  abort("Assertion failed: " + text);
 }
}
var globalScope = this;
function getCFunc(ident) {
 var func = Module["_" + ident];
 if (!func) {
  try {
   func = eval("_" + ident);
  } catch (e) {}
 }
 assert(func, "Cannot call unknown function " + ident + " (perhaps LLVM optimizations or closure removed it?)");
 return func;
}
var cwrap, ccall;
((function() {
 var JSfuncs = {
  "stackSave": (function() {
   Runtime.stackSave();
  }),
  "stackRestore": (function() {
   Runtime.stackRestore();
  }),
  "arrayToC": (function(arr) {
   var ret = Runtime.stackAlloc(arr.length);
   writeArrayToMemory(arr, ret);
   return ret;
  }),
  "stringToC": (function(str) {
   var ret = 0;
   if (str !== null && str !== undefined && str !== 0) {
    ret = Runtime.stackAlloc((str.length << 2) + 1);
    writeStringToMemory(str, ret);
   }
   return ret;
  })
 };
 var toC = {
  "string": JSfuncs["stringToC"],
  "array": JSfuncs["arrayToC"]
 };
 ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
  var func = getCFunc(ident);
  var cArgs = [];
  var stack = 0;
  assert(returnType !== "array", 'Return type should not be "array".');
  if (args) {
   for (var i = 0; i < args.length; i++) {
    var converter = toC[argTypes[i]];
    if (converter) {
     if (stack === 0) stack = Runtime.stackSave();
     cArgs[i] = converter(args[i]);
    } else {
     cArgs[i] = args[i];
    }
   }
  }
  var ret = func.apply(null, cArgs);
  if ((!opts || !opts.async) && typeof EmterpreterAsync === "object") {
   assert(!EmterpreterAsync.state, "cannot start async op with normal JS calling ccall");
  }
  if (opts && opts.async) assert(!returnType, "async ccalls cannot return values");
  if (returnType === "string") ret = Pointer_stringify(ret);
  if (stack !== 0) {
   if (opts && opts.async) {
    EmterpreterAsync.asyncFinalizers.push((function() {
     Runtime.stackRestore(stack);
    }));
    return;
   }
   Runtime.stackRestore(stack);
  }
  return ret;
 };
 var sourceRegex = /^function\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
 function parseJSFunc(jsfunc) {
  var parsed = jsfunc.toString().match(sourceRegex).slice(1);
  return {
   arguments: parsed[0],
   body: parsed[1],
   returnValue: parsed[2]
  };
 }
 var JSsource = {};
 for (var fun in JSfuncs) {
  if (JSfuncs.hasOwnProperty(fun)) {
   JSsource[fun] = parseJSFunc(JSfuncs[fun]);
  }
 }
 cwrap = function cwrap(ident, returnType, argTypes) {
  argTypes = argTypes || [];
  var cfunc = getCFunc(ident);
  var numericArgs = argTypes.every((function(type) {
   return type === "number";
  }));
  var numericRet = returnType !== "string";
  if (numericRet && numericArgs) {
   return cfunc;
  }
  var argNames = argTypes.map((function(x, i) {
   return "$" + i;
  }));
  var funcstr = "(function(" + argNames.join(",") + ") {";
  var nargs = argTypes.length;
  if (!numericArgs) {
   funcstr += "var stack = " + JSsource["stackSave"].body + ";";
   for (var i = 0; i < nargs; i++) {
    var arg = argNames[i], type = argTypes[i];
    if (type === "number") continue;
    var convertCode = JSsource[type + "ToC"];
    funcstr += "var " + convertCode.arguments + " = " + arg + ";";
    funcstr += convertCode.body + ";";
    funcstr += arg + "=" + convertCode.returnValue + ";";
   }
  }
  var cfuncname = parseJSFunc((function() {
   return cfunc;
  })).returnValue;
  funcstr += "var ret = " + cfuncname + "(" + argNames.join(",") + ");";
  if (!numericRet) {
   var strgfy = parseJSFunc((function() {
    return Pointer_stringify;
   })).returnValue;
   funcstr += "ret = " + strgfy + "(ret);";
  }
  funcstr += "if (typeof EmterpreterAsync === 'object') { assert(!EmterpreterAsync.state, 'cannot start async op with normal JS calling cwrap') }";
  if (!numericArgs) {
   funcstr += JSsource["stackRestore"].body.replace("()", "(stack)") + ";";
  }
  funcstr += "return ret})";
  return eval(funcstr);
 };
}))();
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;
function setValue(ptr, value, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  HEAP8[ptr >> 0] = value;
  break;
 case "i8":
  HEAP8[ptr >> 0] = value;
  break;
 case "i16":
  HEAP16[ptr >> 1] = value;
  break;
 case "i32":
  HEAP32[ptr >> 2] = value;
  break;
 case "i64":
  tempI64 = [ value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= +1 ? tempDouble > +0 ? (Math_min(+Math_floor(tempDouble / +4294967296), +4294967295) | 0) >>> 0 : ~~+Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / +4294967296) >>> 0 : 0) ], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
  break;
 case "float":
  HEAPF32[ptr >> 2] = value;
  break;
 case "double":
  HEAPF64[ptr >> 3] = value;
  break;
 default:
  abort("invalid type for setValue: " + type);
 }
}
Module["setValue"] = setValue;
function getValue(ptr, type, noSafe) {
 type = type || "i8";
 if (type.charAt(type.length - 1) === "*") type = "i32";
 switch (type) {
 case "i1":
  return HEAP8[ptr >> 0];
 case "i8":
  return HEAP8[ptr >> 0];
 case "i16":
  return HEAP16[ptr >> 1];
 case "i32":
  return HEAP32[ptr >> 2];
 case "i64":
  return HEAP32[ptr >> 2];
 case "float":
  return HEAPF32[ptr >> 2];
 case "double":
  return HEAPF64[ptr >> 3];
 default:
  abort("invalid type for setValue: " + type);
 }
 return null;
}
Module["getValue"] = getValue;
var ALLOC_NORMAL = 0;
var ALLOC_STACK = 1;
var ALLOC_STATIC = 2;
var ALLOC_DYNAMIC = 3;
var ALLOC_NONE = 4;
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;
function allocate(slab, types, allocator, ptr) {
 var zeroinit, size;
 if (typeof slab === "number") {
  zeroinit = true;
  size = slab;
 } else {
  zeroinit = false;
  size = slab.length;
 }
 var singleType = typeof types === "string" ? types : null;
 var ret;
 if (allocator == ALLOC_NONE) {
  ret = ptr;
 } else {
  ret = [ _malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc ][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
 }
 if (zeroinit) {
  var ptr = ret, stop;
  assert((ret & 3) == 0);
  stop = ret + (size & ~3);
  for (; ptr < stop; ptr += 4) {
   HEAP32[ptr >> 2] = 0;
  }
  stop = ret + size;
  while (ptr < stop) {
   HEAP8[ptr++ >> 0] = 0;
  }
  return ret;
 }
 if (singleType === "i8") {
  if (slab.subarray || slab.slice) {
   HEAPU8.set(slab, ret);
  } else {
   HEAPU8.set(new Uint8Array(slab), ret);
  }
  return ret;
 }
 var i = 0, type, typeSize, previousType;
 while (i < size) {
  var curr = slab[i];
  if (typeof curr === "function") {
   curr = Runtime.getFunctionIndex(curr);
  }
  type = singleType || types[i];
  if (type === 0) {
   i++;
   continue;
  }
  assert(type, "Must know what type to store in allocate!");
  if (type == "i64") type = "i32";
  setValue(ret + i, curr, type);
  if (previousType !== type) {
   typeSize = Runtime.getNativeTypeSize(type);
   previousType = type;
  }
  i += typeSize;
 }
 return ret;
}
Module["allocate"] = allocate;
function getMemory(size) {
 if (!staticSealed) return Runtime.staticAlloc(size);
 if (typeof _sbrk !== "undefined" && !_sbrk.called || !runtimeInitialized) return Runtime.dynamicAlloc(size);
 return _malloc(size);
}
Module["getMemory"] = getMemory;
function Pointer_stringify(ptr, length) {
 if (length === 0 || !ptr) return "";
 var hasUtf = 0;
 var t;
 var i = 0;
 while (1) {
  assert(ptr + i < TOTAL_MEMORY);
  t = HEAPU8[ptr + i >> 0];
  hasUtf |= t;
  if (t == 0 && !length) break;
  i++;
  if (length && i == length) break;
 }
 if (!length) length = i;
 var ret = "";
 if (hasUtf < 128) {
  var MAX_CHUNK = 1024;
  var curr;
  while (length > 0) {
   curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
   ret = ret ? ret + curr : curr;
   ptr += MAX_CHUNK;
   length -= MAX_CHUNK;
  }
  return ret;
 }
 return Module["UTF8ToString"](ptr);
}
Module["Pointer_stringify"] = Pointer_stringify;
function AsciiToString(ptr) {
 var str = "";
 while (1) {
  var ch = HEAP8[ptr++ >> 0];
  if (!ch) return str;
  str += String.fromCharCode(ch);
 }
}
Module["AsciiToString"] = AsciiToString;
function stringToAscii(str, outPtr) {
 return writeAsciiToMemory(str, outPtr, false);
}
Module["stringToAscii"] = stringToAscii;
function UTF8ArrayToString(u8Array, idx) {
 var u0, u1, u2, u3, u4, u5;
 var str = "";
 while (1) {
  u0 = u8Array[idx++];
  if (!u0) return str;
  if (!(u0 & 128)) {
   str += String.fromCharCode(u0);
   continue;
  }
  u1 = u8Array[idx++] & 63;
  if ((u0 & 224) == 192) {
   str += String.fromCharCode((u0 & 31) << 6 | u1);
   continue;
  }
  u2 = u8Array[idx++] & 63;
  if ((u0 & 240) == 224) {
   u0 = (u0 & 15) << 12 | u1 << 6 | u2;
  } else {
   u3 = u8Array[idx++] & 63;
   if ((u0 & 248) == 240) {
    u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u3;
   } else {
    u4 = u8Array[idx++] & 63;
    if ((u0 & 252) == 248) {
     u0 = (u0 & 3) << 24 | u1 << 18 | u2 << 12 | u3 << 6 | u4;
    } else {
     u5 = u8Array[idx++] & 63;
     u0 = (u0 & 1) << 30 | u1 << 24 | u2 << 18 | u3 << 12 | u4 << 6 | u5;
    }
   }
  }
  if (u0 < 65536) {
   str += String.fromCharCode(u0);
  } else {
   var ch = u0 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  }
 }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;
function UTF8ToString(ptr) {
 return UTF8ArrayToString(HEAPU8, ptr);
}
Module["UTF8ToString"] = UTF8ToString;
function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
 if (!(maxBytesToWrite > 0)) return 0;
 var startIdx = outIdx;
 var endIdx = outIdx + maxBytesToWrite - 1;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
  if (u <= 127) {
   if (outIdx >= endIdx) break;
   outU8Array[outIdx++] = u;
  } else if (u <= 2047) {
   if (outIdx + 1 >= endIdx) break;
   outU8Array[outIdx++] = 192 | u >> 6;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 65535) {
   if (outIdx + 2 >= endIdx) break;
   outU8Array[outIdx++] = 224 | u >> 12;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 2097151) {
   if (outIdx + 3 >= endIdx) break;
   outU8Array[outIdx++] = 240 | u >> 18;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else if (u <= 67108863) {
   if (outIdx + 4 >= endIdx) break;
   outU8Array[outIdx++] = 248 | u >> 24;
   outU8Array[outIdx++] = 128 | u >> 18 & 63;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  } else {
   if (outIdx + 5 >= endIdx) break;
   outU8Array[outIdx++] = 252 | u >> 30;
   outU8Array[outIdx++] = 128 | u >> 24 & 63;
   outU8Array[outIdx++] = 128 | u >> 18 & 63;
   outU8Array[outIdx++] = 128 | u >> 12 & 63;
   outU8Array[outIdx++] = 128 | u >> 6 & 63;
   outU8Array[outIdx++] = 128 | u & 63;
  }
 }
 outU8Array[outIdx] = 0;
 return outIdx - startIdx;
}
Module["stringToUTF8Array"] = stringToUTF8Array;
function stringToUTF8(str, outPtr, maxBytesToWrite) {
 assert(typeof maxBytesToWrite == "number", "stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
 return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
Module["stringToUTF8"] = stringToUTF8;
function lengthBytesUTF8(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var u = str.charCodeAt(i);
  if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
  if (u <= 127) {
   ++len;
  } else if (u <= 2047) {
   len += 2;
  } else if (u <= 65535) {
   len += 3;
  } else if (u <= 2097151) {
   len += 4;
  } else if (u <= 67108863) {
   len += 5;
  } else {
   len += 6;
  }
 }
 return len;
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;
function UTF16ToString(ptr) {
 var i = 0;
 var str = "";
 while (1) {
  var codeUnit = HEAP16[ptr + i * 2 >> 1];
  if (codeUnit == 0) return str;
  ++i;
  str += String.fromCharCode(codeUnit);
 }
}
Module["UTF16ToString"] = UTF16ToString;
function stringToUTF16(str, outPtr, maxBytesToWrite) {
 assert(typeof maxBytesToWrite == "number", "stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 2) return 0;
 maxBytesToWrite -= 2;
 var startPtr = outPtr;
 var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
 for (var i = 0; i < numCharsToWrite; ++i) {
  var codeUnit = str.charCodeAt(i);
  HEAP16[outPtr >> 1] = codeUnit;
  outPtr += 2;
 }
 HEAP16[outPtr >> 1] = 0;
 return outPtr - startPtr;
}
Module["stringToUTF16"] = stringToUTF16;
function lengthBytesUTF16(str) {
 return str.length * 2;
}
Module["lengthBytesUTF16"] = lengthBytesUTF16;
function UTF32ToString(ptr) {
 var i = 0;
 var str = "";
 while (1) {
  var utf32 = HEAP32[ptr + i * 4 >> 2];
  if (utf32 == 0) return str;
  ++i;
  if (utf32 >= 65536) {
   var ch = utf32 - 65536;
   str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023);
  } else {
   str += String.fromCharCode(utf32);
  }
 }
}
Module["UTF32ToString"] = UTF32ToString;
function stringToUTF32(str, outPtr, maxBytesToWrite) {
 assert(typeof maxBytesToWrite == "number", "stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!");
 if (maxBytesToWrite === undefined) {
  maxBytesToWrite = 2147483647;
 }
 if (maxBytesToWrite < 4) return 0;
 var startPtr = outPtr;
 var endPtr = startPtr + maxBytesToWrite - 4;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) {
   var trailSurrogate = str.charCodeAt(++i);
   codeUnit = 65536 + ((codeUnit & 1023) << 10) | trailSurrogate & 1023;
  }
  HEAP32[outPtr >> 2] = codeUnit;
  outPtr += 4;
  if (outPtr + 4 > endPtr) break;
 }
 HEAP32[outPtr >> 2] = 0;
 return outPtr - startPtr;
}
Module["stringToUTF32"] = stringToUTF32;
function lengthBytesUTF32(str) {
 var len = 0;
 for (var i = 0; i < str.length; ++i) {
  var codeUnit = str.charCodeAt(i);
  if (codeUnit >= 55296 && codeUnit <= 57343) ++i;
  len += 4;
 }
 return len;
}
Module["lengthBytesUTF32"] = lengthBytesUTF32;
function demangle(func) {
 var hasLibcxxabi = !!Module["___cxa_demangle"];
 if (hasLibcxxabi) {
  try {
   var buf = _malloc(func.length);
   writeStringToMemory(func.substr(1), buf);
   var status = _malloc(4);
   var ret = Module["___cxa_demangle"](buf, 0, 0, status);
   if (getValue(status, "i32") === 0 && ret) {
    return Pointer_stringify(ret);
   }
  } catch (e) {} finally {
   if (buf) _free(buf);
   if (status) _free(status);
   if (ret) _free(ret);
  }
 }
 var i = 3;
 var basicTypes = {
  "v": "void",
  "b": "bool",
  "c": "char",
  "s": "short",
  "i": "int",
  "l": "long",
  "f": "float",
  "d": "double",
  "w": "wchar_t",
  "a": "signed char",
  "h": "unsigned char",
  "t": "unsigned short",
  "j": "unsigned int",
  "m": "unsigned long",
  "x": "long long",
  "y": "unsigned long long",
  "z": "..."
 };
 var subs = [];
 var first = true;
 function dump(x) {
  if (x) Module.print(x);
  Module.print(func);
  var pre = "";
  for (var a = 0; a < i; a++) pre += " ";
  Module.print(pre + "^");
 }
 function parseNested() {
  i++;
  if (func[i] === "K") i++;
  var parts = [];
  while (func[i] !== "E") {
   if (func[i] === "S") {
    i++;
    var next = func.indexOf("_", i);
    var num = func.substring(i, next) || 0;
    parts.push(subs[num] || "?");
    i = next + 1;
    continue;
   }
   if (func[i] === "C") {
    parts.push(parts[parts.length - 1]);
    i += 2;
    continue;
   }
   var size = parseInt(func.substr(i));
   var pre = size.toString().length;
   if (!size || !pre) {
    i--;
    break;
   }
   var curr = func.substr(i + pre, size);
   parts.push(curr);
   subs.push(curr);
   i += pre + size;
  }
  i++;
  return parts;
 }
 function parse(rawList, limit, allowVoid) {
  limit = limit || Infinity;
  var ret = "", list = [];
  function flushList() {
   return "(" + list.join(", ") + ")";
  }
  var name;
  if (func[i] === "N") {
   name = parseNested().join("::");
   limit--;
   if (limit === 0) return rawList ? [ name ] : name;
  } else {
   if (func[i] === "K" || first && func[i] === "L") i++;
   var size = parseInt(func.substr(i));
   if (size) {
    var pre = size.toString().length;
    name = func.substr(i + pre, size);
    i += pre + size;
   }
  }
  first = false;
  if (func[i] === "I") {
   i++;
   var iList = parse(true);
   var iRet = parse(true, 1, true);
   ret += iRet[0] + " " + name + "<" + iList.join(", ") + ">";
  } else {
   ret = name;
  }
  paramLoop : while (i < func.length && limit-- > 0) {
   var c = func[i++];
   if (c in basicTypes) {
    list.push(basicTypes[c]);
   } else {
    switch (c) {
    case "P":
     list.push(parse(true, 1, true)[0] + "*");
     break;
    case "R":
     list.push(parse(true, 1, true)[0] + "&");
     break;
    case "L":
     {
      i++;
      var end = func.indexOf("E", i);
      var size = end - i;
      list.push(func.substr(i, size));
      i += size + 2;
      break;
     }
    case "A":
     {
      var size = parseInt(func.substr(i));
      i += size.toString().length;
      if (func[i] !== "_") throw "?";
      i++;
      list.push(parse(true, 1, true)[0] + " [" + size + "]");
      break;
     }
    case "E":
     break paramLoop;
    default:
     ret += "?" + c;
     break paramLoop;
    }
   }
  }
  if (!allowVoid && list.length === 1 && list[0] === "void") list = [];
  if (rawList) {
   if (ret) {
    list.push(ret + "?");
   }
   return list;
  } else {
   return ret + flushList();
  }
 }
 var parsed = func;
 try {
  if (func == "Object._main" || func == "_main") {
   return "main()";
  }
  if (typeof func === "number") func = Pointer_stringify(func);
  if (func[0] !== "_") return func;
  if (func[1] !== "_") return func;
  if (func[2] !== "Z") return func;
  switch (func[3]) {
  case "n":
   return "operator new()";
  case "d":
   return "operator delete()";
  }
  parsed = parse();
 } catch (e) {
  parsed += "?";
 }
 if (parsed.indexOf("?") >= 0 && !hasLibcxxabi) {
  Runtime.warnOnce("warning: a problem occurred in builtin C++ name demangling; build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling");
 }
 return parsed;
}
function demangleAll(text) {
 return text.replace(/__Z[\w\d_]+/g, (function(x) {
  var y = demangle(x);
  return x === y ? x : x + " [" + y + "]";
 }));
}
function jsStackTrace() {
 var err = new Error;
 if (!err.stack) {
  try {
   throw new Error(0);
  } catch (e) {
   err = e;
  }
  if (!err.stack) {
   return "(no stack trace available)";
  }
 }
 return err.stack.toString();
}
function stackTrace() {
 return demangleAll(jsStackTrace());
}
Module["stackTrace"] = stackTrace;
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
 if (x % 4096 > 0) {
  x += 4096 - x % 4096;
 }
 return x;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false;
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0;
var DYNAMIC_BASE = 0, DYNAMICTOP = 0;
function enlargeMemory() {
 assert(DYNAMICTOP >= TOTAL_MEMORY);
 assert(TOTAL_MEMORY > 4);
 var OLD_TOTAL_MEMORY = TOTAL_MEMORY;
 var LIMIT = Math.pow(2, 31);
 if (DYNAMICTOP >= LIMIT) return false;
 while (TOTAL_MEMORY <= DYNAMICTOP) {
  if (TOTAL_MEMORY < LIMIT / 2) {
   TOTAL_MEMORY = alignMemoryPage(2 * TOTAL_MEMORY);
  } else {
   var last = TOTAL_MEMORY;
   TOTAL_MEMORY = alignMemoryPage((3 * TOTAL_MEMORY + LIMIT) / 4);
   if (TOTAL_MEMORY <= last) return false;
  }
 }
 TOTAL_MEMORY = Math.max(TOTAL_MEMORY, 16 * 1024 * 1024);
 if (TOTAL_MEMORY >= LIMIT) return false;
 Module.printErr("Warning: Enlarging memory arrays, this is not fast! " + [ OLD_TOTAL_MEMORY, TOTAL_MEMORY ]);
 var start = Date.now();
 try {
  if (ArrayBuffer.transfer) {
   buffer = ArrayBuffer.transfer(buffer, TOTAL_MEMORY);
  } else {
   var oldHEAP8 = HEAP8;
   buffer = new ArrayBuffer(TOTAL_MEMORY);
  }
 } catch (e) {
  return false;
 }
 var success = _emscripten_replace_memory(buffer);
 if (!success) return false;
 Module["buffer"] = buffer;
 Module["HEAP8"] = HEAP8 = new Int8Array(buffer);
 Module["HEAP16"] = HEAP16 = new Int16Array(buffer);
 Module["HEAP32"] = HEAP32 = new Int32Array(buffer);
 Module["HEAPU8"] = HEAPU8 = new Uint8Array(buffer);
 Module["HEAPU16"] = HEAPU16 = new Uint16Array(buffer);
 Module["HEAPU32"] = HEAPU32 = new Uint32Array(buffer);
 Module["HEAPF32"] = HEAPF32 = new Float32Array(buffer);
 Module["HEAPF64"] = HEAPF64 = new Float64Array(buffer);
 if (!ArrayBuffer.transfer) {
  HEAP8.set(oldHEAP8);
 }
 Module.printErr("enlarged memory arrays from " + OLD_TOTAL_MEMORY + " to " + TOTAL_MEMORY + ", took " + (Date.now() - start) + " ms (has ArrayBuffer.transfer? " + !!ArrayBuffer.transfer + ")");
 return true;
}
var byteLength;
try {
 byteLength = Function.prototype.call.bind(Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength").get);
 byteLength(new ArrayBuffer(4));
} catch (e) {
 byteLength = (function(buffer) {
  return buffer.byteLength;
 });
}
var TOTAL_STACK = Module["TOTAL_STACK"] || 5242880;
var TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;
var totalMemory = 64 * 1024;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2 * TOTAL_STACK) {
 if (totalMemory < 16 * 1024 * 1024) {
  totalMemory *= 2;
 } else {
  totalMemory += 16 * 1024 * 1024;
 }
}
totalMemory = Math.max(totalMemory, 16 * 1024 * 1024);
if (totalMemory !== TOTAL_MEMORY) {
 Module.printErr("increasing TOTAL_MEMORY to " + totalMemory + " to be compliant with the asm.js spec (and given that TOTAL_STACK=" + TOTAL_STACK + ")");
 TOTAL_MEMORY = totalMemory;
}
assert(typeof Int32Array !== "undefined" && typeof Float64Array !== "undefined" && !!(new Int32Array(1))["subarray"] && !!(new Int32Array(1))["set"], "JS engine does not provide full typed array support");
var buffer;
buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, "Typed arrays 2 must be run on a little-endian system");
Module["HEAP"] = HEAP;
Module["buffer"] = buffer;
Module["HEAP8"] = HEAP8;
Module["HEAP16"] = HEAP16;
Module["HEAP32"] = HEAP32;
Module["HEAPU8"] = HEAPU8;
Module["HEAPU16"] = HEAPU16;
Module["HEAPU32"] = HEAPU32;
Module["HEAPF32"] = HEAPF32;
Module["HEAPF64"] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
 while (callbacks.length > 0) {
  var callback = callbacks.shift();
  if (typeof callback == "function") {
   callback();
   continue;
  }
  var func = callback.func;
  if (typeof func === "number") {
   if (callback.arg === undefined) {
    Runtime.dynCall("v", func);
   } else {
    Runtime.dynCall("vi", func, [ callback.arg ]);
   }
  } else {
   func(callback.arg === undefined ? null : callback.arg);
  }
 }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;
function preRun() {
 if (Module["preRun"]) {
  if (typeof Module["preRun"] == "function") Module["preRun"] = [ Module["preRun"] ];
  while (Module["preRun"].length) {
   addOnPreRun(Module["preRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
 if (runtimeInitialized) return;
 runtimeInitialized = true;
 callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
 callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
 callRuntimeCallbacks(__ATEXIT__);
 runtimeExited = true;
}
function postRun() {
 if (Module["postRun"]) {
  if (typeof Module["postRun"] == "function") Module["postRun"] = [ Module["postRun"] ];
  while (Module["postRun"].length) {
   addOnPostRun(Module["postRun"].shift());
  }
 }
 callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
 __ATPRERUN__.unshift(cb);
}
Module["addOnPreRun"] = addOnPreRun;
function addOnInit(cb) {
 __ATINIT__.unshift(cb);
}
Module["addOnInit"] = addOnInit;
function addOnPreMain(cb) {
 __ATMAIN__.unshift(cb);
}
Module["addOnPreMain"] = addOnPreMain;
function addOnExit(cb) {
 __ATEXIT__.unshift(cb);
}
Module["addOnExit"] = addOnExit;
function addOnPostRun(cb) {
 __ATPOSTRUN__.unshift(cb);
}
Module["addOnPostRun"] = addOnPostRun;
function intArrayFromString(stringy, dontAddNull, length) {
 var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
 var u8array = new Array(len);
 var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
 if (dontAddNull) u8array.length = numBytesWritten;
 return u8array;
}
Module["intArrayFromString"] = intArrayFromString;
function intArrayToString(array) {
 var ret = [];
 for (var i = 0; i < array.length; i++) {
  var chr = array[i];
  if (chr > 255) {
   assert(false, "Character code " + chr + " (" + String.fromCharCode(chr) + ")  at offset " + i + " not in 0x00-0xFF.");
   chr &= 255;
  }
  ret.push(String.fromCharCode(chr));
 }
 return ret.join("");
}
Module["intArrayToString"] = intArrayToString;
function writeStringToMemory(string, buffer, dontAddNull) {
 var array = intArrayFromString(string, dontAddNull);
 var i = 0;
 while (i < array.length) {
  var chr = array[i];
  HEAP8[buffer + i >> 0] = chr;
  i = i + 1;
 }
}
Module["writeStringToMemory"] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
 for (var i = 0; i < array.length; i++) {
  HEAP8[buffer++ >> 0] = array[i];
 }
}
Module["writeArrayToMemory"] = writeArrayToMemory;
function writeAsciiToMemory(str, buffer, dontAddNull) {
 for (var i = 0; i < str.length; ++i) {
  assert(str.charCodeAt(i) === str.charCodeAt(i) & 255);
  HEAP8[buffer++ >> 0] = str.charCodeAt(i);
 }
 if (!dontAddNull) HEAP8[buffer >> 0] = 0;
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;
function unSign(value, bits, ignore) {
 if (value >= 0) {
  return value;
 }
 return bits <= 32 ? 2 * Math.abs(1 << bits - 1) + value : Math.pow(2, bits) + value;
}
function reSign(value, bits, ignore) {
 if (value <= 0) {
  return value;
 }
 var half = bits <= 32 ? Math.abs(1 << bits - 1) : Math.pow(2, bits - 1);
 if (value >= half && (bits <= 32 || value > half)) {
  value = -2 * half + value;
 }
 return value;
}
if (!Math["imul"] || Math["imul"](4294967295, 5) !== -5) Math["imul"] = function imul(a, b) {
 var ah = a >>> 16;
 var al = a & 65535;
 var bh = b >>> 16;
 var bl = b & 65535;
 return al * bl + (ah * bl + al * bh << 16) | 0;
};
Math.imul = Math["imul"];
if (!Math["clz32"]) Math["clz32"] = (function(x) {
 x = x >>> 0;
 for (var i = 0; i < 32; i++) {
  if (x & 1 << 31 - i) return i;
 }
 return 32;
});
Math.clz32 = Math["clz32"];
var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
var runDependencyTracking = {};
function getUniqueRunDependency(id) {
 var orig = id;
 while (1) {
  if (!runDependencyTracking[id]) return id;
  id = orig + Math.random();
 }
 return id;
}
function addRunDependency(id) {
 runDependencies++;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (id) {
  assert(!runDependencyTracking[id]);
  runDependencyTracking[id] = 1;
  if (runDependencyWatcher === null && typeof setInterval !== "undefined") {
   runDependencyWatcher = setInterval((function() {
    if (ABORT) {
     clearInterval(runDependencyWatcher);
     runDependencyWatcher = null;
     return;
    }
    var shown = false;
    for (var dep in runDependencyTracking) {
     if (!shown) {
      shown = true;
      Module.printErr("still waiting on run dependencies:");
     }
     Module.printErr("dependency: " + dep);
    }
    if (shown) {
     Module.printErr("(end of list)");
    }
   }), 1e4);
  }
 } else {
  Module.printErr("warning: run dependency added without ID");
 }
}
Module["addRunDependency"] = addRunDependency;
function removeRunDependency(id) {
 runDependencies--;
 if (Module["monitorRunDependencies"]) {
  Module["monitorRunDependencies"](runDependencies);
 }
 if (id) {
  assert(runDependencyTracking[id]);
  delete runDependencyTracking[id];
 } else {
  Module.printErr("warning: run dependency removed without ID");
 }
 if (runDependencies == 0) {
  if (runDependencyWatcher !== null) {
   clearInterval(runDependencyWatcher);
   runDependencyWatcher = null;
  }
  if (dependenciesFulfilled) {
   var callback = dependenciesFulfilled;
   dependenciesFulfilled = null;
   callback();
  }
 }
}
Module["removeRunDependency"] = removeRunDependency;
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
var memoryInitializer = null;
var ASM_CONSTS = [];
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 11872;
__ATINIT__.push({
 func: (function() {
  __GLOBAL__sub_I_modelSet_cpp();
 })
}, {
 func: (function() {
  __GLOBAL__sub_I_neuralNetwork_cpp();
 })
}, {
 func: (function() {
  __GLOBAL__sub_I_regression_cpp();
 })
}, {
 func: (function() {
  __GLOBAL__sub_I_knnClassification_cpp();
 })
}, {
 func: (function() {
  __GLOBAL__sub_I_classification_cpp();
 })
}, {
 func: (function() {
  __GLOBAL__sub_I_svmClassification_cpp();
 })
}, {
 func: (function() {
  __GLOBAL__sub_I_seriesClassification_cpp();
 })
}, {
 func: (function() {
  __GLOBAL__sub_I_rapidStream_cpp();
 })
}, {
 func: (function() {
  __GLOBAL__sub_I_bind_cpp();
 })
});
allocate([ 232, 8, 0, 0, 8, 13, 0, 0, 96, 9, 0, 0, 18, 13, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 96, 9, 0, 0, 29, 13, 0, 0, 1, 0, 0, 0, 8, 0, 0, 0, 232, 8, 0, 0, 165, 13, 0, 0, 56, 9, 0, 0, 103, 13, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 48, 0, 0, 0, 0, 0, 0, 0, 56, 9, 0, 0, 49, 13, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 56, 0, 0, 0, 0, 0, 0, 0, 56, 9, 0, 0, 247, 13, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 48, 0, 0, 0, 0, 0, 0, 0, 56, 9, 0, 0, 211, 13, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 104, 0, 0, 0, 0, 0, 0, 0, 16, 9, 0, 0, 35, 14, 0, 0, 200, 0, 0, 0, 0, 0, 0, 0, 96, 9, 0, 0, 204, 14, 0, 0, 0, 0, 0, 0, 152, 0, 0, 0, 96, 9, 0, 0, 186, 14, 0, 0, 1, 0, 0, 0, 152, 0, 0, 0, 232, 8, 0, 0, 95, 14, 0, 0, 56, 9, 0, 0, 106, 14, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 232, 0, 0, 0, 0, 0, 0, 0, 56, 9, 0, 0, 142, 14, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 48, 0, 0, 0, 0, 0, 0, 0, 16, 9, 0, 0, 221, 14, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 96, 9, 0, 0, 7, 15, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 96, 9, 0, 0, 248, 14, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 16, 9, 0, 0, 21, 15, 0, 0, 200, 0, 0, 0, 0, 0, 0, 0, 232, 8, 0, 0, 187, 15, 0, 0, 96, 9, 0, 0, 166, 15, 0, 0, 0, 0, 0, 0, 48, 1, 0, 0, 96, 9, 0, 0, 144, 15, 0, 0, 1, 0, 0, 0, 48, 1, 0, 0, 96, 9, 0, 0, 60, 16, 0, 0, 0, 0, 0, 0, 80, 0, 0, 0, 96, 9, 0, 0, 4, 16, 0, 0, 1, 0, 0, 0, 80, 0, 0, 0, 232, 8, 0, 0, 241, 15, 0, 0, 96, 9, 0, 0, 170, 16, 0, 0, 0, 0, 0, 0, 128, 0, 0, 0, 96, 9, 0, 0, 132, 16, 0, 0, 1, 0, 0, 0, 128, 0, 0, 0, 96, 9, 0, 0, 245, 16, 0, 0, 0, 0, 0, 0, 208, 0, 0, 0, 96, 9, 0, 0, 207, 16, 0, 0, 1, 0, 0, 0, 208, 0, 0, 0, 16, 9, 0, 0, 26, 17, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 96, 9, 0, 0, 166, 17, 0, 0, 0, 0, 0, 0, 208, 1, 0, 0, 96, 9, 0, 0, 147, 17, 0, 0, 1, 0, 0, 0, 208, 1, 0, 0, 204, 8, 0, 0, 107, 17, 0, 0, 16, 9, 0, 0, 184, 17, 0, 0, 200, 0, 0, 0, 0, 0, 0, 0, 96, 9, 0, 0, 251, 17, 0, 0, 0, 0, 0, 0, 8, 2, 0, 0, 96, 9, 0, 0, 229, 17, 0, 0, 1, 0, 0, 0, 8, 2, 0, 0, 16, 9, 0, 0, 16, 18, 0, 0, 96, 2, 0, 0, 0, 0, 0, 0, 232, 8, 0, 0, 33, 18, 0, 0, 16, 9, 0, 0, 50, 18, 0, 0, 72, 2, 0, 0, 0, 0, 0, 0, 232, 8, 0, 0, 196, 20, 0, 0, 16, 9, 0, 0, 30, 21, 0, 0, 56, 2, 0, 0, 0, 0, 0, 0, 16, 9, 0, 0, 46, 21, 0, 0, 56, 2, 0, 0, 0, 0, 0, 0, 16, 9, 0, 0, 69, 21, 0, 0, 56, 2, 0, 0, 0, 0, 0, 0, 232, 8, 0, 0, 111, 22, 0, 0, 96, 9, 0, 0, 87, 22, 0, 0, 0, 0, 0, 0, 152, 2, 0, 0, 96, 9, 0, 0, 62, 22, 0, 0, 1, 0, 0, 0, 152, 2, 0, 0, 56, 9, 0, 0, 164, 21, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 216, 2, 0, 0, 0, 0, 0, 0, 56, 9, 0, 0, 234, 21, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 48, 0, 0, 0, 0, 0, 0, 0, 232, 8, 0, 0, 72, 23, 0, 0, 96, 9, 0, 0, 57, 23, 0, 0, 0, 0, 0, 0, 240, 2, 0, 0, 96, 9, 0, 0, 41, 23, 0, 0, 1, 0, 0, 0, 240, 2, 0, 0, 56, 9, 0, 0, 139, 28, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 192, 3, 0, 0, 0, 0, 0, 0, 56, 9, 0, 0, 76, 28, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 192, 3, 0, 0, 0, 0, 0, 0, 56, 9, 0, 0, 231, 27, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 192, 3, 0, 0, 0, 0, 0, 0, 232, 8, 0, 0, 200, 27, 0, 0, 232, 8, 0, 0, 169, 27, 0, 0, 232, 8, 0, 0, 138, 27, 0, 0, 232, 8, 0, 0, 107, 27, 0, 0, 232, 8, 0, 0, 76, 27, 0, 0, 232, 8, 0, 0, 45, 27, 0, 0, 232, 8, 0, 0, 14, 27, 0, 0, 232, 8, 0, 0, 239, 26, 0, 0, 232, 8, 0, 0, 208, 26, 0, 0, 232, 8, 0, 0, 177, 26, 0, 0, 232, 8, 0, 0, 146, 26, 0, 0, 232, 8, 0, 0, 115, 26, 0, 0, 232, 8, 0, 0, 38, 28, 0, 0, 16, 9, 0, 0, 202, 28, 0, 0, 216, 3, 0, 0, 0, 0, 0, 0, 232, 8, 0, 0, 215, 28, 0, 0, 232, 8, 0, 0, 228, 28, 0, 0, 16, 9, 0, 0, 241, 28, 0, 0, 224, 3, 0, 0, 0, 0, 0, 0, 16, 9, 0, 0, 18, 29, 0, 0, 232, 3, 0, 0, 0, 0, 0, 0, 16, 9, 0, 0, 88, 29, 0, 0, 232, 3, 0, 0, 0, 0, 0, 0, 16, 9, 0, 0, 52, 29, 0, 0, 8, 4, 0, 0, 0, 0, 0, 0, 16, 9, 0, 0, 122, 29, 0, 0, 232, 3, 0, 0, 0, 0, 0, 0, 176, 8, 0, 0, 162, 29, 0, 0, 176, 8, 0, 0, 164, 29, 0, 0, 176, 8, 0, 0, 167, 29, 0, 0, 176, 8, 0, 0, 169, 29, 0, 0, 176, 8, 0, 0, 171, 29, 0, 0, 176, 8, 0, 0, 173, 29, 0, 0, 176, 8, 0, 0, 175, 29, 0, 0, 176, 8, 0, 0, 177, 29, 0, 0, 176, 8, 0, 0, 179, 29, 0, 0, 176, 8, 0, 0, 181, 29, 0, 0, 176, 8, 0, 0, 183, 29, 0, 0, 176, 8, 0, 0, 185, 29, 0, 0, 176, 8, 0, 0, 187, 29, 0, 0, 176, 8, 0, 0, 189, 29, 0, 0, 16, 9, 0, 0, 191, 29, 0, 0, 232, 3, 0, 0, 0, 0, 0, 0, 16, 9, 0, 0, 224, 29, 0, 0, 248, 3, 0, 0, 0, 0, 0, 0, 16, 9, 0, 0, 5, 30, 0, 0, 248, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 1, 0, 0, 0, 16, 0, 0, 0, 72, 4, 0, 0, 16, 0, 0, 0, 80, 0, 0, 0, 72, 4, 0, 0, 16, 0, 0, 0, 128, 0, 0, 0, 16, 0, 0, 0, 128, 0, 0, 0, 0, 0, 0, 0, 152, 0, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 5, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 168, 0, 0, 0, 120, 4, 0, 0, 208, 0, 0, 0, 120, 4, 0, 0, 120, 4, 0, 0, 168, 0, 0, 0, 120, 4, 0, 0, 208, 0, 0, 0, 120, 4, 0, 0, 120, 4, 0, 0, 128, 0, 0, 0, 128, 0, 0, 0, 128, 0, 0, 0, 128, 0, 0, 0, 160, 4, 0, 0, 160, 4, 0, 0, 160, 4, 0, 0, 168, 0, 0, 0, 128, 0, 0, 0, 56, 4, 0, 0, 168, 0, 0, 0, 80, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 6, 0, 0, 0, 2, 0, 0, 0, 16, 1, 0, 0, 16, 1, 0, 0, 80, 0, 0, 0, 16, 1, 0, 0, 120, 4, 0, 0, 120, 4, 0, 0, 72, 4, 0, 0, 16, 1, 0, 0, 80, 0, 0, 0, 0, 0, 0, 0, 48, 1, 0, 0, 7, 0, 0, 0, 8, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 0, 9, 0, 0, 0, 2, 0, 0, 0, 4, 0, 0, 0, 72, 1, 0, 0, 120, 4, 0, 0, 208, 0, 0, 0, 80, 0, 0, 0, 120, 4, 0, 0, 56, 4, 0, 0, 72, 1, 0, 0, 120, 4, 0, 0, 128, 0, 0, 0, 160, 4, 0, 0, 72, 1, 0, 0, 128, 0, 0, 0, 104, 1, 0, 0, 56, 4, 0, 0, 104, 1, 0, 0, 64, 1, 0, 0, 56, 4, 0, 0, 104, 1, 0, 0, 128, 4, 0, 0, 64, 1, 0, 0, 128, 4, 0, 0, 120, 1, 0, 0, 136, 1, 0, 0, 80, 0, 0, 0, 128, 4, 0, 0, 72, 4, 0, 0, 80, 0, 0, 0, 128, 4, 0, 0, 64, 1, 0, 0, 144, 1, 0, 0, 56, 4, 0, 0, 144, 1, 0, 0, 160, 4, 0, 0, 56, 4, 0, 0, 144, 1, 0, 0, 128, 4, 0, 0, 160, 4, 0, 0, 128, 4, 0, 0, 160, 1, 0, 0, 136, 1, 0, 0, 128, 0, 0, 0, 128, 4, 0, 0, 72, 4, 0, 0, 128, 0, 0, 0, 128, 4, 0, 0, 160, 4, 0, 0, 176, 1, 0, 0, 56, 4, 0, 0, 176, 1, 0, 0, 120, 4, 0, 0, 56, 4, 0, 0, 176, 1, 0, 0, 128, 4, 0, 0, 120, 4, 0, 0, 128, 4, 0, 0, 192, 1, 0, 0, 136, 1, 0, 0, 208, 0, 0, 0, 128, 4, 0, 0, 72, 4, 0, 0, 208, 0, 0, 0, 128, 4, 0, 0, 120, 4, 0, 0, 0, 0, 0, 0, 208, 1, 0, 0, 1, 0, 0, 0, 10, 0, 0, 0, 3, 0, 0, 0, 224, 1, 0, 0, 224, 1, 0, 0, 0, 2, 0, 0, 224, 1, 0, 0, 120, 4, 0, 0, 120, 4, 0, 0, 72, 4, 0, 0, 224, 1, 0, 0, 80, 0, 0, 0, 208, 0, 0, 0, 224, 1, 0, 0, 56, 4, 0, 0, 224, 1, 0, 0, 120, 4, 0, 0, 120, 4, 0, 0, 0, 0, 0, 0, 8, 2, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 3, 0, 0, 0, 5, 0, 0, 0, 13, 0, 0, 0, 3, 0, 0, 0, 6, 0, 0, 0, 24, 2, 0, 0, 120, 4, 0, 0, 56, 4, 0, 0, 24, 2, 0, 0, 80, 0, 0, 0, 160, 4, 0, 0, 24, 2, 0, 0, 128, 0, 0, 0, 0, 0, 0, 0, 56, 2, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 14, 0, 0, 0, 15, 0, 0, 0, 0, 0, 0, 0, 72, 2, 0, 0, 16, 0, 0, 0, 17, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 18, 0, 0, 0, 0, 0, 0, 0, 80, 2, 0, 0, 16, 0, 0, 0, 19, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 20, 0, 0, 0, 21, 0, 0, 0, 0, 0, 0, 0, 104, 2, 0, 0, 3, 0, 0, 0, 4, 0, 0, 0, 2, 0, 0, 0, 22, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 120, 2, 0, 0, 4, 0, 0, 0, 5, 0, 0, 0, 3, 0, 0, 0, 24, 0, 0, 0, 25, 0, 0, 0, 0, 0, 0, 0, 136, 2, 0, 0, 5, 0, 0, 0, 6, 0, 0, 0, 4, 0, 0, 0, 26, 0, 0, 0, 27, 0, 0, 0, 160, 2, 0, 0, 72, 4, 0, 0, 160, 2, 0, 0, 80, 0, 0, 0, 72, 4, 0, 0, 160, 2, 0, 0, 192, 2, 0, 0, 56, 4, 0, 0, 160, 2, 0, 0, 120, 4, 0, 0, 160, 2, 0, 0, 80, 0, 0, 0, 128, 0, 0, 0, 160, 2, 0, 0, 248, 2, 0, 0, 248, 2, 0, 0, 120, 4, 0, 0, 56, 4, 0, 0, 248, 2, 0, 0, 56, 4, 0, 0, 248, 2, 0, 0, 160, 4, 0, 0, 160, 4, 0, 0, 248, 2, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 200, 3, 0, 0, 28, 0, 0, 0, 29, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 40, 4, 0, 0, 30, 0, 0, 0, 31, 0, 0, 0, 32, 0, 0, 0, 33, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 168, 4, 0, 0, 30, 0, 0, 0, 34, 0, 0, 0, 32, 0, 0, 0, 33, 0, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 248, 3, 0, 0, 30, 0, 0, 0, 35, 0, 0, 0, 32, 0, 0, 0, 33, 0, 0, 0, 8, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 184, 4, 0, 0, 30, 0, 0, 0, 36, 0, 0, 0, 32, 0, 0, 0, 33, 0, 0, 0, 8, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 200, 4, 0, 0, 30, 0, 0, 0, 37, 0, 0, 0, 32, 0, 0, 0, 33, 0, 0, 0, 8, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 24, 4, 0, 0, 30, 0, 0, 0, 38, 0, 0, 0, 32, 0, 0, 0, 33, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 195, 32, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 44, 10, 0, 0, 156, 10, 0, 0, 156, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 12, 0, 0, 0, 64, 44, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 255, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 12, 0, 0, 0, 56, 40, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 255, 255, 255, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 77, 111, 100, 101, 108, 83, 101, 116, 67, 112, 112, 0, 56, 109, 111, 100, 101, 108, 83, 101, 116, 0, 80, 56, 109, 111, 100, 101, 108, 83, 101, 116, 0, 80, 75, 56, 109, 111, 100, 101, 108, 83, 101, 116, 0, 105, 105, 0, 118, 0, 118, 105, 0, 78, 83, 116, 51, 95, 95, 49, 54, 118, 101, 99, 116, 111, 114, 73, 49, 53, 116, 114, 97, 105, 110, 105, 110, 103, 69, 120, 97, 109, 112, 108, 101, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 83, 49, 95, 69, 69, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 49, 51, 95, 95, 118, 101, 99, 116, 111, 114, 95, 98, 97, 115, 101, 73, 49, 53, 116, 114, 97, 105, 110, 105, 110, 103, 69, 120, 97, 109, 112, 108, 101, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 83, 49, 95, 69, 69, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 50, 48, 95, 95, 118, 101, 99, 116, 111, 114, 95, 98, 97, 115, 101, 95, 99, 111, 109, 109, 111, 110, 73, 76, 98, 49, 69, 69, 69, 0, 105, 105, 105, 105, 0, 105, 105, 105, 0, 78, 83, 116, 51, 95, 95, 49, 54, 118, 101, 99, 116, 111, 114, 73, 100, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 100, 69, 69, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 49, 51, 95, 95, 118, 101, 99, 116, 111, 114, 95, 98, 97, 115, 101, 73, 100, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 100, 69, 69, 69, 69, 0, 49, 51, 110, 101, 117, 114, 97, 108, 78, 101, 116, 119, 111, 114, 107, 0, 78, 101, 117, 114, 97, 108, 78, 101, 116, 119, 111, 114, 107, 0, 105, 105, 105, 105, 105, 105, 0, 105, 105, 105, 105, 105, 105, 105, 105, 105, 105, 100, 100, 0, 100, 105, 105, 105, 0, 118, 105, 105, 105, 0, 57, 98, 97, 115, 101, 77, 111, 100, 101, 108, 0, 78, 83, 116, 51, 95, 95, 49, 54, 118, 101, 99, 116, 111, 114, 73, 105, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 105, 69, 69, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 49, 51, 95, 95, 118, 101, 99, 116, 111, 114, 95, 98, 97, 115, 101, 73, 105, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 105, 69, 69, 69, 69, 0, 80, 75, 49, 51, 110, 101, 117, 114, 97, 108, 78, 101, 116, 119, 111, 114, 107, 0, 80, 49, 51, 110, 101, 117, 114, 97, 108, 78, 101, 116, 119, 111, 114, 107, 0, 49, 48, 114, 101, 103, 114, 101, 115, 115, 105, 111, 110, 0, 82, 101, 103, 114, 101, 115, 115, 105, 111, 110, 67, 112, 112, 0, 80, 75, 49, 48, 114, 101, 103, 114, 101, 115, 115, 105, 111, 110, 0, 80, 49, 48, 114, 101, 103, 114, 101, 115, 115, 105, 111, 110, 0, 49, 55, 107, 110, 110, 67, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 0, 86, 101, 99, 116, 111, 114, 73, 110, 116, 0, 86, 101, 99, 116, 111, 114, 68, 111, 117, 98, 108, 101, 0, 84, 114, 97, 105, 110, 105, 110, 103, 83, 101, 116, 0, 116, 114, 97, 105, 110, 105, 110, 103, 69, 120, 97, 109, 112, 108, 101, 0, 105, 0, 105, 110, 112, 117, 116, 0, 111, 117, 116, 112, 117, 116, 0, 75, 110, 110, 67, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 0, 97, 100, 100, 78, 101, 105, 103, 104, 98, 111, 117, 114, 0, 118, 105, 105, 105, 105, 0, 80, 75, 49, 55, 107, 110, 110, 67, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 0, 80, 49, 55, 107, 110, 110, 67, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 0, 49, 53, 116, 114, 97, 105, 110, 105, 110, 103, 69, 120, 97, 109, 112, 108, 101, 0, 112, 117, 115, 104, 95, 98, 97, 99, 107, 0, 114, 101, 115, 105, 122, 101, 0, 115, 105, 122, 101, 0, 103, 101, 116, 0, 115, 101, 116, 0, 105, 105, 105, 105, 105, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 51, 118, 97, 108, 69, 0, 80, 75, 78, 83, 116, 51, 95, 95, 49, 54, 118, 101, 99, 116, 111, 114, 73, 49, 53, 116, 114, 97, 105, 110, 105, 110, 103, 69, 120, 97, 109, 112, 108, 101, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 83, 49, 95, 69, 69, 69, 69, 0, 80, 78, 83, 116, 51, 95, 95, 49, 54, 118, 101, 99, 116, 111, 114, 73, 49, 53, 116, 114, 97, 105, 110, 105, 110, 103, 69, 120, 97, 109, 112, 108, 101, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 83, 49, 95, 69, 69, 69, 69, 0, 118, 105, 105, 100, 0, 118, 105, 105, 105, 100, 0, 105, 105, 105, 105, 100, 0, 80, 75, 78, 83, 116, 51, 95, 95, 49, 54, 118, 101, 99, 116, 111, 114, 73, 100, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 100, 69, 69, 69, 69, 0, 80, 78, 83, 116, 51, 95, 95, 49, 54, 118, 101, 99, 116, 111, 114, 73, 100, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 100, 69, 69, 69, 69, 0, 80, 75, 78, 83, 116, 51, 95, 95, 49, 54, 118, 101, 99, 116, 111, 114, 73, 105, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 105, 69, 69, 69, 69, 0, 80, 78, 83, 116, 51, 95, 95, 49, 54, 118, 101, 99, 116, 111, 114, 73, 105, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 105, 69, 69, 69, 69, 0, 49, 52, 99, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 0, 67, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 67, 112, 112, 0, 103, 101, 116, 75, 0, 115, 101, 116, 75, 0, 67, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 84, 121, 112, 101, 115, 0, 75, 78, 78, 0, 83, 86, 77, 0, 105, 110, 112, 117, 116, 115, 45, 0, 78, 49, 52, 99, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 49, 57, 99, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 84, 121, 112, 101, 115, 69, 0, 80, 75, 49, 52, 99, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 0, 80, 49, 52, 99, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 0, 49, 55, 115, 118, 109, 67, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 0, 115, 118, 109, 67, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 67, 80, 80, 0, 114, 117, 110, 0, 80, 75, 49, 55, 115, 118, 109, 67, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 0, 80, 49, 55, 115, 118, 109, 67, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 0, 78, 54, 76, 73, 66, 83, 86, 77, 54, 75, 101, 114, 110, 101, 108, 69, 0, 78, 54, 76, 73, 66, 83, 86, 77, 54, 83, 111, 108, 118, 101, 114, 69, 0, 78, 54, 76, 73, 66, 83, 86, 77, 57, 83, 111, 108, 118, 101, 114, 95, 78, 85, 69, 0, 10, 87, 65, 82, 78, 73, 78, 71, 58, 32, 117, 115, 105, 110, 103, 32, 45, 104, 32, 48, 32, 109, 97, 121, 32, 98, 101, 32, 102, 97, 115, 116, 101, 114, 10, 0, 42, 0, 10, 87, 65, 82, 78, 73, 78, 71, 58, 32, 114, 101, 97, 99, 104, 105, 110, 103, 32, 109, 97, 120, 32, 110, 117, 109, 98, 101, 114, 32, 111, 102, 32, 105, 116, 101, 114, 97, 116, 105, 111, 110, 115, 10, 0, 10, 111, 112, 116, 105, 109, 105, 122, 97, 116, 105, 111, 110, 32, 102, 105, 110, 105, 115, 104, 101, 100, 44, 32, 35, 105, 116, 101, 114, 32, 61, 32, 37, 100, 10, 0, 80, 114, 111, 98, 46, 32, 109, 111, 100, 101, 108, 32, 102, 111, 114, 32, 116, 101, 115, 116, 32, 100, 97, 116, 97, 58, 32, 116, 97, 114, 103, 101, 116, 32, 118, 97, 108, 117, 101, 32, 61, 32, 112, 114, 101, 100, 105, 99, 116, 101, 100, 32, 118, 97, 108, 117, 101, 32, 43, 32, 122, 44, 10, 122, 58, 32, 76, 97, 112, 108, 97, 99, 101, 32, 100, 105, 115, 116, 114, 105, 98, 117, 116, 105, 111, 110, 32, 101, 94, 40, 45, 124, 122, 124, 47, 115, 105, 103, 109, 97, 41, 47, 40, 50, 115, 105, 103, 109, 97, 41, 44, 115, 105, 103, 109, 97, 61, 32, 37, 103, 10, 0, 87, 65, 82, 78, 73, 78, 71, 58, 32, 116, 114, 97, 105, 110, 105, 110, 103, 32, 100, 97, 116, 97, 32, 105, 110, 32, 111, 110, 108, 121, 32, 111, 110, 101, 32, 99, 108, 97, 115, 115, 46, 32, 83, 101, 101, 32, 82, 69, 65, 68, 77, 69, 32, 102, 111, 114, 32, 100, 101, 116, 97, 105, 108, 115, 46, 10, 0, 87, 65, 82, 78, 73, 78, 71, 58, 32, 99, 108, 97, 115, 115, 32, 108, 97, 98, 101, 108, 32, 37, 100, 32, 115, 112, 101, 99, 105, 102, 105, 101, 100, 32, 105, 110, 32, 119, 101, 105, 103, 104, 116, 32, 105, 115, 32, 110, 111, 116, 32, 102, 111, 117, 110, 100, 10, 0, 76, 105, 110, 101, 32, 115, 101, 97, 114, 99, 104, 32, 102, 97, 105, 108, 115, 32, 105, 110, 32, 116, 119, 111, 45, 99, 108, 97, 115, 115, 32, 112, 114, 111, 98, 97, 98, 105, 108, 105, 116, 121, 32, 101, 115, 116, 105, 109, 97, 116, 101, 115, 10, 0, 82, 101, 97, 99, 104, 105, 110, 103, 32, 109, 97, 120, 105, 109, 97, 108, 32, 105, 116, 101, 114, 97, 116, 105, 111, 110, 115, 32, 105, 110, 32, 116, 119, 111, 45, 99, 108, 97, 115, 115, 32, 112, 114, 111, 98, 97, 98, 105, 108, 105, 116, 121, 32, 101, 115, 116, 105, 109, 97, 116, 101, 115, 10, 0, 84, 111, 116, 97, 108, 32, 110, 83, 86, 32, 61, 32, 37, 100, 10, 0, 87, 65, 82, 78, 73, 78, 71, 58, 32, 35, 32, 102, 111, 108, 100, 115, 32, 62, 32, 35, 32, 100, 97, 116, 97, 46, 32, 87, 105, 108, 108, 32, 117, 115, 101, 32, 35, 32, 102, 111, 108, 100, 115, 32, 61, 32, 35, 32, 100, 97, 116, 97, 32, 105, 110, 115, 116, 101, 97, 100, 32, 40, 105, 46, 101, 46, 44, 32, 108, 101, 97, 118, 101, 45, 111, 110, 101, 45, 111, 117, 116, 32, 99, 114, 111, 115, 115, 32, 118, 97, 108, 105, 100, 97, 116, 105, 111, 110, 41, 10, 0, 69, 120, 99, 101, 101, 100, 115, 32, 109, 97, 120, 95, 105, 116, 101, 114, 32, 105, 110, 32, 109, 117, 108, 116, 105, 99, 108, 97, 115, 115, 95, 112, 114, 111, 98, 10, 0, 78, 54, 76, 73, 66, 83, 86, 77, 55, 81, 77, 97, 116, 114, 105, 120, 69, 0, 110, 117, 32, 61, 32, 37, 102, 10, 0, 67, 32, 61, 32, 37, 102, 10, 0, 101, 112, 115, 105, 108, 111, 110, 32, 61, 32, 37, 102, 10, 0, 111, 98, 106, 32, 61, 32, 37, 102, 44, 32, 114, 104, 111, 32, 61, 32, 37, 102, 10, 0, 110, 83, 86, 32, 61, 32, 37, 100, 44, 32, 110, 66, 83, 86, 32, 61, 32, 37, 100, 10, 0, 78, 54, 76, 73, 66, 83, 86, 77, 53, 83, 86, 82, 95, 81, 69, 0, 78, 54, 76, 73, 66, 83, 86, 77, 49, 49, 79, 78, 69, 95, 67, 76, 65, 83, 83, 95, 81, 69, 0, 78, 54, 76, 73, 66, 83, 86, 77, 53, 83, 86, 67, 95, 81, 69, 0, 83, 101, 114, 105, 101, 115, 67, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 67, 112, 112, 0, 97, 100, 100, 84, 114, 97, 105, 110, 105, 110, 103, 83, 101, 116, 0, 116, 114, 97, 105, 110, 0, 114, 101, 115, 101, 116, 0, 118, 105, 105, 0, 114, 117, 110, 84, 114, 97, 105, 110, 105, 110, 103, 83, 101, 116, 0, 103, 101, 116, 67, 111, 115, 116, 115, 0, 78, 83, 116, 51, 95, 95, 49, 54, 118, 101, 99, 116, 111, 114, 73, 78, 83, 48, 95, 73, 78, 83, 48, 95, 73, 100, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 100, 69, 69, 69, 69, 78, 83, 49, 95, 73, 83, 51, 95, 69, 69, 69, 69, 78, 83, 49, 95, 73, 83, 53, 95, 69, 69, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 49, 51, 95, 95, 118, 101, 99, 116, 111, 114, 95, 98, 97, 115, 101, 73, 78, 83, 95, 54, 118, 101, 99, 116, 111, 114, 73, 78, 83, 49, 95, 73, 100, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 100, 69, 69, 69, 69, 78, 83, 50, 95, 73, 83, 52, 95, 69, 69, 69, 69, 78, 83, 50, 95, 73, 83, 54, 95, 69, 69, 69, 69, 0, 80, 75, 50, 48, 115, 101, 114, 105, 101, 115, 67, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 0, 80, 50, 48, 115, 101, 114, 105, 101, 115, 67, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 0, 50, 48, 115, 101, 114, 105, 101, 115, 67, 108, 97, 115, 115, 105, 102, 105, 99, 97, 116, 105, 111, 110, 0, 82, 97, 112, 105, 100, 83, 116, 114, 101, 97, 109, 67, 112, 112, 0, 99, 108, 101, 97, 114, 0, 112, 117, 115, 104, 84, 111, 87, 105, 110, 100, 111, 119, 0, 118, 101, 108, 111, 99, 105, 116, 121, 0, 100, 105, 105, 0, 97, 99, 99, 101, 108, 101, 114, 97, 116, 105, 111, 110, 0, 109, 105, 110, 105, 109, 117, 109, 0, 109, 97, 120, 105, 109, 117, 109, 0, 115, 117, 109, 0, 109, 101, 97, 110, 0, 115, 116, 97, 110, 100, 97, 114, 100, 68, 101, 118, 105, 97, 116, 105, 111, 110, 0, 114, 109, 115, 0, 109, 105, 110, 86, 101, 108, 111, 99, 105, 116, 121, 0, 109, 97, 120, 86, 101, 108, 111, 99, 105, 116, 121, 0, 109, 105, 110, 65, 99, 99, 101, 108, 101, 114, 97, 116, 105, 111, 110, 0, 109, 97, 120, 65, 99, 99, 101, 108, 101, 114, 97, 116, 105, 111, 110, 0, 80, 75, 49, 49, 114, 97, 112, 105, 100, 83, 116, 114, 101, 97, 109, 0, 80, 49, 49, 114, 97, 112, 105, 100, 83, 116, 114, 101, 97, 109, 0, 49, 49, 114, 97, 112, 105, 100, 83, 116, 114, 101, 97, 109, 0, 118, 111, 105, 100, 0, 98, 111, 111, 108, 0, 99, 104, 97, 114, 0, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 0, 115, 104, 111, 114, 116, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 115, 104, 111, 114, 116, 0, 105, 110, 116, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 105, 110, 116, 0, 108, 111, 110, 103, 0, 117, 110, 115, 105, 103, 110, 101, 100, 32, 108, 111, 110, 103, 0, 102, 108, 111, 97, 116, 0, 100, 111, 117, 98, 108, 101, 0, 115, 116, 100, 58, 58, 115, 116, 114, 105, 110, 103, 0, 115, 116, 100, 58, 58, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 62, 0, 115, 116, 100, 58, 58, 119, 115, 116, 114, 105, 110, 103, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 118, 97, 108, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 99, 104, 97, 114, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 99, 104, 97, 114, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 115, 104, 111, 114, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 115, 104, 111, 114, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 105, 110, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 108, 111, 110, 103, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 110, 115, 105, 103, 110, 101, 100, 32, 108, 111, 110, 103, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 56, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 105, 110, 116, 56, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 49, 54, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 105, 110, 116, 49, 54, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 105, 110, 116, 51, 50, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 117, 105, 110, 116, 51, 50, 95, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 102, 108, 111, 97, 116, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 100, 111, 117, 98, 108, 101, 62, 0, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 58, 58, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 60, 108, 111, 110, 103, 32, 100, 111, 117, 98, 108, 101, 62, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 101, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 100, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 102, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 109, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 108, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 106, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 105, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 116, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 115, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 104, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 97, 69, 69, 0, 78, 49, 48, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 49, 49, 109, 101, 109, 111, 114, 121, 95, 118, 105, 101, 119, 73, 99, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 49, 50, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 73, 119, 78, 83, 95, 49, 49, 99, 104, 97, 114, 95, 116, 114, 97, 105, 116, 115, 73, 119, 69, 69, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 119, 69, 69, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 50, 49, 95, 95, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 95, 99, 111, 109, 109, 111, 110, 73, 76, 98, 49, 69, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 49, 50, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 73, 104, 78, 83, 95, 49, 49, 99, 104, 97, 114, 95, 116, 114, 97, 105, 116, 115, 73, 104, 69, 69, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 104, 69, 69, 69, 69, 0, 78, 83, 116, 51, 95, 95, 49, 49, 50, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 73, 99, 78, 83, 95, 49, 49, 99, 104, 97, 114, 95, 116, 114, 97, 105, 116, 115, 73, 99, 69, 69, 78, 83, 95, 57, 97, 108, 108, 111, 99, 97, 116, 111, 114, 73, 99, 69, 69, 69, 69, 0, 83, 116, 57, 98, 97, 100, 95, 97, 108, 108, 111, 99, 0, 83, 116, 57, 101, 120, 99, 101, 112, 116, 105, 111, 110, 0, 83, 116, 57, 116, 121, 112, 101, 95, 105, 110, 102, 111, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 54, 95, 95, 115, 104, 105, 109, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 55, 95, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 57, 95, 95, 112, 111, 105, 110, 116, 101, 114, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 55, 95, 95, 112, 98, 97, 115, 101, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 50, 51, 95, 95, 102, 117, 110, 100, 97, 109, 101, 110, 116, 97, 108, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 118, 0, 68, 110, 0, 98, 0, 99, 0, 104, 0, 97, 0, 115, 0, 116, 0, 105, 0, 106, 0, 108, 0, 109, 0, 102, 0, 100, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 49, 54, 95, 95, 101, 110, 117, 109, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 50, 48, 95, 95, 115, 105, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 78, 49, 48, 95, 95, 99, 120, 120, 97, 98, 105, 118, 49, 50, 49, 95, 95, 118, 109, 105, 95, 99, 108, 97, 115, 115, 95, 116, 121, 112, 101, 95, 105, 110, 102, 111, 69, 0, 33, 34, 118, 101, 99, 116, 111, 114, 32, 108, 101, 110, 103, 116, 104, 95, 101, 114, 114, 111, 114, 34, 0, 47, 85, 115, 101, 114, 115, 47, 109, 122, 101, 100, 47, 101, 109, 115, 100, 107, 95, 112, 111, 114, 116, 97, 98, 108, 101, 47, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 47, 49, 46, 51, 53, 46, 48, 47, 115, 121, 115, 116, 101, 109, 47, 105, 110, 99, 108, 117, 100, 101, 47, 108, 105, 98, 99, 120, 120, 47, 118, 101, 99, 116, 111, 114, 0, 95, 95, 116, 104, 114, 111, 119, 95, 108, 101, 110, 103, 116, 104, 95, 101, 114, 114, 111, 114, 0, 112, 116, 104, 114, 101, 97, 100, 95, 111, 110, 99, 101, 32, 102, 97, 105, 108, 117, 114, 101, 32, 105, 110, 32, 95, 95, 99, 120, 97, 95, 103, 101, 116, 95, 103, 108, 111, 98, 97, 108, 115, 95, 102, 97, 115, 116, 40, 41, 0, 115, 116, 100, 58, 58, 98, 97, 100, 95, 97, 108, 108, 111, 99, 0, 116, 101, 114, 109, 105, 110, 97, 116, 101, 95, 104, 97, 110, 100, 108, 101, 114, 32, 117, 110, 101, 120, 112, 101, 99, 116, 101, 100, 108, 121, 32, 114, 101, 116, 117, 114, 110, 101, 100, 0, 116, 101, 114, 109, 105, 110, 97, 116, 101, 95, 104, 97, 110, 100, 108, 101, 114, 32, 117, 110, 101, 120, 112, 101, 99, 116, 101, 100, 108, 121, 32, 116, 104, 114, 101, 119, 32, 97, 110, 32, 101, 120, 99, 101, 112, 116, 105, 111, 110, 0, 99, 97, 110, 110, 111, 116, 32, 99, 114, 101, 97, 116, 101, 32, 112, 116, 104, 114, 101, 97, 100, 32, 107, 101, 121, 32, 102, 111, 114, 32, 95, 95, 99, 120, 97, 95, 103, 101, 116, 95, 103, 108, 111, 98, 97, 108, 115, 40, 41, 0, 99, 97, 110, 110, 111, 116, 32, 122, 101, 114, 111, 32, 111, 117, 116, 32, 116, 104, 114, 101, 97, 100, 32, 118, 97, 108, 117, 101, 32, 102, 111, 114, 32, 95, 95, 99, 120, 97, 95, 103, 101, 116, 95, 103, 108, 111, 98, 97, 108, 115, 40, 41, 0, 33, 34, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 32, 108, 101, 110, 103, 116, 104, 95, 101, 114, 114, 111, 114, 34, 0, 47, 85, 115, 101, 114, 115, 47, 109, 122, 101, 100, 47, 101, 109, 115, 100, 107, 95, 112, 111, 114, 116, 97, 98, 108, 101, 47, 101, 109, 115, 99, 114, 105, 112, 116, 101, 110, 47, 49, 46, 51, 53, 46, 48, 47, 115, 121, 115, 116, 101, 109, 47, 105, 110, 99, 108, 117, 100, 101, 47, 108, 105, 98, 99, 120, 120, 47, 115, 116, 114, 105, 110, 103, 0, 33, 34, 98, 97, 115, 105, 99, 95, 115, 116, 114, 105, 110, 103, 32, 111, 117, 116, 95, 111, 102, 95, 114, 97, 110, 103, 101, 34, 0, 95, 95, 116, 104, 114, 111, 119, 95, 111, 117, 116, 95, 111, 102, 95, 114, 97, 110, 103, 101, 0, 116, 101, 114, 109, 105, 110, 97, 116, 105, 110, 103, 32, 119, 105, 116, 104, 32, 37, 115, 32, 101, 120, 99, 101, 112, 116, 105, 111, 110, 32, 111, 102, 32, 116, 121, 112, 101, 32, 37, 115, 58, 32, 37, 115, 0, 116, 101, 114, 109, 105, 110, 97, 116, 105, 110, 103, 32, 119, 105, 116, 104, 32, 37, 115, 32, 101, 120, 99, 101, 112, 116, 105, 111, 110, 32, 111, 102, 32, 116, 121, 112, 101, 32, 37, 115, 0, 116, 101, 114, 109, 105, 110, 97, 116, 105, 110, 103, 32, 119, 105, 116, 104, 32, 37, 115, 32, 102, 111, 114, 101, 105, 103, 110, 32, 101, 120, 99, 101, 112, 116, 105, 111, 110, 0, 116, 101, 114, 109, 105, 110, 97, 116, 105, 110, 103, 0, 117, 110, 99, 97, 117, 103, 104, 116, 0, 84, 33, 34, 25, 13, 1, 2, 3, 17, 75, 28, 12, 16, 4, 11, 29, 18, 30, 39, 104, 110, 111, 112, 113, 98, 32, 5, 6, 15, 19, 20, 21, 26, 8, 22, 7, 40, 36, 23, 24, 9, 10, 14, 27, 31, 37, 35, 131, 130, 125, 38, 42, 43, 60, 61, 62, 63, 67, 71, 74, 77, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 99, 100, 101, 102, 103, 105, 106, 107, 108, 114, 115, 116, 121, 122, 123, 124, 0, 73, 108, 108, 101, 103, 97, 108, 32, 98, 121, 116, 101, 32, 115, 101, 113, 117, 101, 110, 99, 101, 0, 68, 111, 109, 97, 105, 110, 32, 101, 114, 114, 111, 114, 0, 82, 101, 115, 117, 108, 116, 32, 110, 111, 116, 32, 114, 101, 112, 114, 101, 115, 101, 110, 116, 97, 98, 108, 101, 0, 78, 111, 116, 32, 97, 32, 116, 116, 121, 0, 80, 101, 114, 109, 105, 115, 115, 105, 111, 110, 32, 100, 101, 110, 105, 101, 100, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 110, 111, 116, 32, 112, 101, 114, 109, 105, 116, 116, 101, 100, 0, 78, 111, 32, 115, 117, 99, 104, 32, 102, 105, 108, 101, 32, 111, 114, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 0, 78, 111, 32, 115, 117, 99, 104, 32, 112, 114, 111, 99, 101, 115, 115, 0, 70, 105, 108, 101, 32, 101, 120, 105, 115, 116, 115, 0, 86, 97, 108, 117, 101, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 32, 102, 111, 114, 32, 100, 97, 116, 97, 32, 116, 121, 112, 101, 0, 78, 111, 32, 115, 112, 97, 99, 101, 32, 108, 101, 102, 116, 32, 111, 110, 32, 100, 101, 118, 105, 99, 101, 0, 79, 117, 116, 32, 111, 102, 32, 109, 101, 109, 111, 114, 121, 0, 82, 101, 115, 111, 117, 114, 99, 101, 32, 98, 117, 115, 121, 0, 73, 110, 116, 101, 114, 114, 117, 112, 116, 101, 100, 32, 115, 121, 115, 116, 101, 109, 32, 99, 97, 108, 108, 0, 82, 101, 115, 111, 117, 114, 99, 101, 32, 116, 101, 109, 112, 111, 114, 97, 114, 105, 108, 121, 32, 117, 110, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 73, 110, 118, 97, 108, 105, 100, 32, 115, 101, 101, 107, 0, 67, 114, 111, 115, 115, 45, 100, 101, 118, 105, 99, 101, 32, 108, 105, 110, 107, 0, 82, 101, 97, 100, 45, 111, 110, 108, 121, 32, 102, 105, 108, 101, 32, 115, 121, 115, 116, 101, 109, 0, 68, 105, 114, 101, 99, 116, 111, 114, 121, 32, 110, 111, 116, 32, 101, 109, 112, 116, 121, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 114, 101, 115, 101, 116, 32, 98, 121, 32, 112, 101, 101, 114, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 116, 105, 109, 101, 100, 32, 111, 117, 116, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 114, 101, 102, 117, 115, 101, 100, 0, 72, 111, 115, 116, 32, 105, 115, 32, 100, 111, 119, 110, 0, 72, 111, 115, 116, 32, 105, 115, 32, 117, 110, 114, 101, 97, 99, 104, 97, 98, 108, 101, 0, 65, 100, 100, 114, 101, 115, 115, 32, 105, 110, 32, 117, 115, 101, 0, 66, 114, 111, 107, 101, 110, 32, 112, 105, 112, 101, 0, 73, 47, 79, 32, 101, 114, 114, 111, 114, 0, 78, 111, 32, 115, 117, 99, 104, 32, 100, 101, 118, 105, 99, 101, 32, 111, 114, 32, 97, 100, 100, 114, 101, 115, 115, 0, 66, 108, 111, 99, 107, 32, 100, 101, 118, 105, 99, 101, 32, 114, 101, 113, 117, 105, 114, 101, 100, 0, 78, 111, 32, 115, 117, 99, 104, 32, 100, 101, 118, 105, 99, 101, 0, 78, 111, 116, 32, 97, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 0, 73, 115, 32, 97, 32, 100, 105, 114, 101, 99, 116, 111, 114, 121, 0, 84, 101, 120, 116, 32, 102, 105, 108, 101, 32, 98, 117, 115, 121, 0, 69, 120, 101, 99, 32, 102, 111, 114, 109, 97, 116, 32, 101, 114, 114, 111, 114, 0, 73, 110, 118, 97, 108, 105, 100, 32, 97, 114, 103, 117, 109, 101, 110, 116, 0, 65, 114, 103, 117, 109, 101, 110, 116, 32, 108, 105, 115, 116, 32, 116, 111, 111, 32, 108, 111, 110, 103, 0, 83, 121, 109, 98, 111, 108, 105, 99, 32, 108, 105, 110, 107, 32, 108, 111, 111, 112, 0, 70, 105, 108, 101, 110, 97, 109, 101, 32, 116, 111, 111, 32, 108, 111, 110, 103, 0, 84, 111, 111, 32, 109, 97, 110, 121, 32, 111, 112, 101, 110, 32, 102, 105, 108, 101, 115, 32, 105, 110, 32, 115, 121, 115, 116, 101, 109, 0, 78, 111, 32, 102, 105, 108, 101, 32, 100, 101, 115, 99, 114, 105, 112, 116, 111, 114, 115, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 66, 97, 100, 32, 102, 105, 108, 101, 32, 100, 101, 115, 99, 114, 105, 112, 116, 111, 114, 0, 78, 111, 32, 99, 104, 105, 108, 100, 32, 112, 114, 111, 99, 101, 115, 115, 0, 66, 97, 100, 32, 97, 100, 100, 114, 101, 115, 115, 0, 70, 105, 108, 101, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 0, 84, 111, 111, 32, 109, 97, 110, 121, 32, 108, 105, 110, 107, 115, 0, 78, 111, 32, 108, 111, 99, 107, 115, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 82, 101, 115, 111, 117, 114, 99, 101, 32, 100, 101, 97, 100, 108, 111, 99, 107, 32, 119, 111, 117, 108, 100, 32, 111, 99, 99, 117, 114, 0, 83, 116, 97, 116, 101, 32, 110, 111, 116, 32, 114, 101, 99, 111, 118, 101, 114, 97, 98, 108, 101, 0, 80, 114, 101, 118, 105, 111, 117, 115, 32, 111, 119, 110, 101, 114, 32, 100, 105, 101, 100, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 99, 97, 110, 99, 101, 108, 101, 100, 0, 70, 117, 110, 99, 116, 105, 111, 110, 32, 110, 111, 116, 32, 105, 109, 112, 108, 101, 109, 101, 110, 116, 101, 100, 0, 78, 111, 32, 109, 101, 115, 115, 97, 103, 101, 32, 111, 102, 32, 100, 101, 115, 105, 114, 101, 100, 32, 116, 121, 112, 101, 0, 73, 100, 101, 110, 116, 105, 102, 105, 101, 114, 32, 114, 101, 109, 111, 118, 101, 100, 0, 68, 101, 118, 105, 99, 101, 32, 110, 111, 116, 32, 97, 32, 115, 116, 114, 101, 97, 109, 0, 78, 111, 32, 100, 97, 116, 97, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 68, 101, 118, 105, 99, 101, 32, 116, 105, 109, 101, 111, 117, 116, 0, 79, 117, 116, 32, 111, 102, 32, 115, 116, 114, 101, 97, 109, 115, 32, 114, 101, 115, 111, 117, 114, 99, 101, 115, 0, 76, 105, 110, 107, 32, 104, 97, 115, 32, 98, 101, 101, 110, 32, 115, 101, 118, 101, 114, 101, 100, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 101, 114, 114, 111, 114, 0, 66, 97, 100, 32, 109, 101, 115, 115, 97, 103, 101, 0, 70, 105, 108, 101, 32, 100, 101, 115, 99, 114, 105, 112, 116, 111, 114, 32, 105, 110, 32, 98, 97, 100, 32, 115, 116, 97, 116, 101, 0, 78, 111, 116, 32, 97, 32, 115, 111, 99, 107, 101, 116, 0, 68, 101, 115, 116, 105, 110, 97, 116, 105, 111, 110, 32, 97, 100, 100, 114, 101, 115, 115, 32, 114, 101, 113, 117, 105, 114, 101, 100, 0, 77, 101, 115, 115, 97, 103, 101, 32, 116, 111, 111, 32, 108, 97, 114, 103, 101, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 119, 114, 111, 110, 103, 32, 116, 121, 112, 101, 32, 102, 111, 114, 32, 115, 111, 99, 107, 101, 116, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 110, 111, 116, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 83, 111, 99, 107, 101, 116, 32, 116, 121, 112, 101, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 78, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 80, 114, 111, 116, 111, 99, 111, 108, 32, 102, 97, 109, 105, 108, 121, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 0, 65, 100, 100, 114, 101, 115, 115, 32, 102, 97, 109, 105, 108, 121, 32, 110, 111, 116, 32, 115, 117, 112, 112, 111, 114, 116, 101, 100, 32, 98, 121, 32, 112, 114, 111, 116, 111, 99, 111, 108, 0, 65, 100, 100, 114, 101, 115, 115, 32, 110, 111, 116, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 78, 101, 116, 119, 111, 114, 107, 32, 105, 115, 32, 100, 111, 119, 110, 0, 78, 101, 116, 119, 111, 114, 107, 32, 117, 110, 114, 101, 97, 99, 104, 97, 98, 108, 101, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 114, 101, 115, 101, 116, 32, 98, 121, 32, 110, 101, 116, 119, 111, 114, 107, 0, 67, 111, 110, 110, 101, 99, 116, 105, 111, 110, 32, 97, 98, 111, 114, 116, 101, 100, 0, 78, 111, 32, 98, 117, 102, 102, 101, 114, 32, 115, 112, 97, 99, 101, 32, 97, 118, 97, 105, 108, 97, 98, 108, 101, 0, 83, 111, 99, 107, 101, 116, 32, 105, 115, 32, 99, 111, 110, 110, 101, 99, 116, 101, 100, 0, 83, 111, 99, 107, 101, 116, 32, 110, 111, 116, 32, 99, 111, 110, 110, 101, 99, 116, 101, 100, 0, 67, 97, 110, 110, 111, 116, 32, 115, 101, 110, 100, 32, 97, 102, 116, 101, 114, 32, 115, 111, 99, 107, 101, 116, 32, 115, 104, 117, 116, 100, 111, 119, 110, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 97, 108, 114, 101, 97, 100, 121, 32, 105, 110, 32, 112, 114, 111, 103, 114, 101, 115, 115, 0, 79, 112, 101, 114, 97, 116, 105, 111, 110, 32, 105, 110, 32, 112, 114, 111, 103, 114, 101, 115, 115, 0, 83, 116, 97, 108, 101, 32, 102, 105, 108, 101, 32, 104, 97, 110, 100, 108, 101, 0, 82, 101, 109, 111, 116, 101, 32, 73, 47, 79, 32, 101, 114, 114, 111, 114, 0, 81, 117, 111, 116, 97, 32, 101, 120, 99, 101, 101, 100, 101, 100, 0, 78, 111, 32, 109, 101, 100, 105, 117, 109, 32, 102, 111, 117, 110, 100 ], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
allocate([ 87, 114, 111, 110, 103, 32, 109, 101, 100, 105, 117, 109, 32, 116, 121, 112, 101, 0, 78, 111, 32, 101, 114, 114, 111, 114, 32, 105, 110, 102, 111, 114, 109, 97, 116, 105, 111, 110 ], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE + 10240);
allocate([ 17, 0, 10, 0, 17, 17, 17, 0, 0, 0, 0, 5, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 15, 10, 17, 17, 17, 3, 10, 7, 0, 1, 19, 9, 11, 11, 0, 0, 9, 6, 11, 0, 0, 11, 0, 6, 17, 0, 0, 0, 17, 17, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 17, 0, 10, 10, 17, 17, 17, 0, 10, 0, 0, 2, 0, 9, 11, 0, 0, 0, 9, 0, 11, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 9, 12, 0, 0, 0, 0, 0, 12, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 13, 0, 0, 0, 4, 13, 0, 0, 0, 0, 9, 14, 0, 0, 0, 0, 0, 14, 0, 0, 14, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 15, 0, 0, 0, 0, 15, 0, 0, 0, 0, 9, 16, 0, 0, 0, 0, 0, 16, 0, 0, 16, 0, 0, 18, 0, 0, 0, 18, 18, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 18, 0, 0, 0, 18, 18, 18, 0, 0, 0, 0, 0, 0, 9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0, 0, 10, 0, 0, 0, 0, 9, 11, 0, 0, 0, 0, 0, 11, 0, 0, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 12, 0, 0, 0, 0, 12, 0, 0, 0, 0, 9, 12, 0, 0, 0, 0, 0, 12, 0, 0, 12, 0, 0, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 65, 66, 67, 68, 69, 70, 45, 43, 32, 32, 32, 48, 88, 48, 120, 0, 40, 110, 117, 108, 108, 41, 0, 45, 48, 88, 43, 48, 88, 32, 48, 88, 45, 48, 120, 43, 48, 120, 32, 48, 120, 0, 105, 110, 102, 0, 73, 78, 70, 0, 110, 97, 110, 0, 78, 65, 78, 0, 46, 0, 37, 100, 0 ], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE + 11320);
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) {
 HEAP8[tempDoublePtr] = HEAP8[ptr];
 HEAP8[tempDoublePtr + 1] = HEAP8[ptr + 1];
 HEAP8[tempDoublePtr + 2] = HEAP8[ptr + 2];
 HEAP8[tempDoublePtr + 3] = HEAP8[ptr + 3];
}
function copyTempDouble(ptr) {
 HEAP8[tempDoublePtr] = HEAP8[ptr];
 HEAP8[tempDoublePtr + 1] = HEAP8[ptr + 1];
 HEAP8[tempDoublePtr + 2] = HEAP8[ptr + 2];
 HEAP8[tempDoublePtr + 3] = HEAP8[ptr + 3];
 HEAP8[tempDoublePtr + 4] = HEAP8[ptr + 4];
 HEAP8[tempDoublePtr + 5] = HEAP8[ptr + 5];
 HEAP8[tempDoublePtr + 6] = HEAP8[ptr + 6];
 HEAP8[tempDoublePtr + 7] = HEAP8[ptr + 7];
}
Module["_i64Add"] = _i64Add;
Module["_i64Subtract"] = _i64Subtract;
function ___setErrNo(value) {
 if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value; else Module.printErr("failed to set errno from JS");
 return value;
}
var ERRNO_CODES = {
 EPERM: 1,
 ENOENT: 2,
 ESRCH: 3,
 EINTR: 4,
 EIO: 5,
 ENXIO: 6,
 E2BIG: 7,
 ENOEXEC: 8,
 EBADF: 9,
 ECHILD: 10,
 EAGAIN: 11,
 EWOULDBLOCK: 11,
 ENOMEM: 12,
 EACCES: 13,
 EFAULT: 14,
 ENOTBLK: 15,
 EBUSY: 16,
 EEXIST: 17,
 EXDEV: 18,
 ENODEV: 19,
 ENOTDIR: 20,
 EISDIR: 21,
 EINVAL: 22,
 ENFILE: 23,
 EMFILE: 24,
 ENOTTY: 25,
 ETXTBSY: 26,
 EFBIG: 27,
 ENOSPC: 28,
 ESPIPE: 29,
 EROFS: 30,
 EMLINK: 31,
 EPIPE: 32,
 EDOM: 33,
 ERANGE: 34,
 ENOMSG: 42,
 EIDRM: 43,
 ECHRNG: 44,
 EL2NSYNC: 45,
 EL3HLT: 46,
 EL3RST: 47,
 ELNRNG: 48,
 EUNATCH: 49,
 ENOCSI: 50,
 EL2HLT: 51,
 EDEADLK: 35,
 ENOLCK: 37,
 EBADE: 52,
 EBADR: 53,
 EXFULL: 54,
 ENOANO: 55,
 EBADRQC: 56,
 EBADSLT: 57,
 EDEADLOCK: 35,
 EBFONT: 59,
 ENOSTR: 60,
 ENODATA: 61,
 ETIME: 62,
 ENOSR: 63,
 ENONET: 64,
 ENOPKG: 65,
 EREMOTE: 66,
 ENOLINK: 67,
 EADV: 68,
 ESRMNT: 69,
 ECOMM: 70,
 EPROTO: 71,
 EMULTIHOP: 72,
 EDOTDOT: 73,
 EBADMSG: 74,
 ENOTUNIQ: 76,
 EBADFD: 77,
 EREMCHG: 78,
 ELIBACC: 79,
 ELIBBAD: 80,
 ELIBSCN: 81,
 ELIBMAX: 82,
 ELIBEXEC: 83,
 ENOSYS: 38,
 ENOTEMPTY: 39,
 ENAMETOOLONG: 36,
 ELOOP: 40,
 EOPNOTSUPP: 95,
 EPFNOSUPPORT: 96,
 ECONNRESET: 104,
 ENOBUFS: 105,
 EAFNOSUPPORT: 97,
 EPROTOTYPE: 91,
 ENOTSOCK: 88,
 ENOPROTOOPT: 92,
 ESHUTDOWN: 108,
 ECONNREFUSED: 111,
 EADDRINUSE: 98,
 ECONNABORTED: 103,
 ENETUNREACH: 101,
 ENETDOWN: 100,
 ETIMEDOUT: 110,
 EHOSTDOWN: 112,
 EHOSTUNREACH: 113,
 EINPROGRESS: 115,
 EALREADY: 114,
 EDESTADDRREQ: 89,
 EMSGSIZE: 90,
 EPROTONOSUPPORT: 93,
 ESOCKTNOSUPPORT: 94,
 EADDRNOTAVAIL: 99,
 ENETRESET: 102,
 EISCONN: 106,
 ENOTCONN: 107,
 ETOOMANYREFS: 109,
 EUSERS: 87,
 EDQUOT: 122,
 ESTALE: 116,
 ENOTSUP: 95,
 ENOMEDIUM: 123,
 EILSEQ: 84,
 EOVERFLOW: 75,
 ECANCELED: 125,
 ENOTRECOVERABLE: 131,
 EOWNERDEAD: 130,
 ESTRPIPE: 86
};
function _sysconf(name) {
 switch (name) {
 case 30:
  return PAGE_SIZE;
 case 85:
  return totalMemory / PAGE_SIZE;
 case 132:
 case 133:
 case 12:
 case 137:
 case 138:
 case 15:
 case 235:
 case 16:
 case 17:
 case 18:
 case 19:
 case 20:
 case 149:
 case 13:
 case 10:
 case 236:
 case 153:
 case 9:
 case 21:
 case 22:
 case 159:
 case 154:
 case 14:
 case 77:
 case 78:
 case 139:
 case 80:
 case 81:
 case 82:
 case 68:
 case 67:
 case 164:
 case 11:
 case 29:
 case 47:
 case 48:
 case 95:
 case 52:
 case 51:
 case 46:
  return 200809;
 case 79:
  return 0;
 case 27:
 case 246:
 case 127:
 case 128:
 case 23:
 case 24:
 case 160:
 case 161:
 case 181:
 case 182:
 case 242:
 case 183:
 case 184:
 case 243:
 case 244:
 case 245:
 case 165:
 case 178:
 case 179:
 case 49:
 case 50:
 case 168:
 case 169:
 case 175:
 case 170:
 case 171:
 case 172:
 case 97:
 case 76:
 case 32:
 case 173:
 case 35:
  return -1;
 case 176:
 case 177:
 case 7:
 case 155:
 case 8:
 case 157:
 case 125:
 case 126:
 case 92:
 case 93:
 case 129:
 case 130:
 case 131:
 case 94:
 case 91:
  return 1;
 case 74:
 case 60:
 case 69:
 case 70:
 case 4:
  return 1024;
 case 31:
 case 42:
 case 72:
  return 32;
 case 87:
 case 26:
 case 33:
  return 2147483647;
 case 34:
 case 1:
  return 47839;
 case 38:
 case 36:
  return 99;
 case 43:
 case 37:
  return 2048;
 case 0:
  return 2097152;
 case 3:
  return 65536;
 case 28:
  return 32768;
 case 44:
  return 32767;
 case 75:
  return 16384;
 case 39:
  return 1e3;
 case 89:
  return 700;
 case 71:
  return 256;
 case 40:
  return 255;
 case 2:
  return 100;
 case 180:
  return 64;
 case 25:
  return 20;
 case 5:
  return 16;
 case 6:
  return 6;
 case 73:
  return 4;
 case 84:
  {
   if (typeof navigator === "object") return navigator["hardwareConcurrency"] || 1;
   return 1;
  }
 }
 ___setErrNo(ERRNO_CODES.EINVAL);
 return -1;
}
function __ZSt18uncaught_exceptionv() {
 return !!__ZSt18uncaught_exceptionv.uncaught_exception;
}
var EXCEPTIONS = {
 last: 0,
 caught: [],
 infos: {},
 deAdjust: (function(adjusted) {
  if (!adjusted || EXCEPTIONS.infos[adjusted]) return adjusted;
  for (var ptr in EXCEPTIONS.infos) {
   var info = EXCEPTIONS.infos[ptr];
   if (info.adjusted === adjusted) {
    return ptr;
   }
  }
  return adjusted;
 }),
 addRef: (function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  info.refcount++;
 }),
 decRef: (function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  assert(info.refcount > 0);
  info.refcount--;
  if (info.refcount === 0) {
   if (info.destructor) {
    Runtime.dynCall("vi", info.destructor, [ ptr ]);
   }
   delete EXCEPTIONS.infos[ptr];
   ___cxa_free_exception(ptr);
  }
 }),
 clearRef: (function(ptr) {
  if (!ptr) return;
  var info = EXCEPTIONS.infos[ptr];
  info.refcount = 0;
 })
};
function ___resumeException(ptr) {
 if (!EXCEPTIONS.last) {
  EXCEPTIONS.last = ptr;
 }
 EXCEPTIONS.clearRef(EXCEPTIONS.deAdjust(ptr));
 throw ptr;
}
function ___cxa_find_matching_catch() {
 var thrown = EXCEPTIONS.last;
 if (!thrown) {
  return (asm["setTempRet0"](0), 0) | 0;
 }
 var info = EXCEPTIONS.infos[thrown];
 var throwntype = info.type;
 if (!throwntype) {
  return (asm["setTempRet0"](0), thrown) | 0;
 }
 var typeArray = Array.prototype.slice.call(arguments);
 var pointer = Module["___cxa_is_pointer_type"](throwntype);
 if (!___cxa_find_matching_catch.buffer) ___cxa_find_matching_catch.buffer = _malloc(4);
 HEAP32[___cxa_find_matching_catch.buffer >> 2] = thrown;
 thrown = ___cxa_find_matching_catch.buffer;
 for (var i = 0; i < typeArray.length; i++) {
  if (typeArray[i] && Module["___cxa_can_catch"](typeArray[i], throwntype, thrown)) {
   thrown = HEAP32[thrown >> 2];
   info.adjusted = thrown;
   return (asm["setTempRet0"](typeArray[i]), thrown) | 0;
  }
 }
 thrown = HEAP32[thrown >> 2];
 return (asm["setTempRet0"](throwntype), thrown) | 0;
}
function ___cxa_throw(ptr, type, destructor) {
 EXCEPTIONS.infos[ptr] = {
  ptr: ptr,
  adjusted: ptr,
  type: type,
  destructor: destructor,
  refcount: 0
 };
 EXCEPTIONS.last = ptr;
 if (!("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
  __ZSt18uncaught_exceptionv.uncaught_exception = 1;
 } else {
  __ZSt18uncaught_exceptionv.uncaught_exception++;
 }
 throw ptr;
}
function getShiftFromSize(size) {
 switch (size) {
 case 1:
  return 0;
 case 2:
  return 1;
 case 4:
  return 2;
 case 8:
  return 3;
 default:
  throw new TypeError("Unknown type size: " + size);
 }
}
function embind_init_charCodes() {
 var codes = new Array(256);
 for (var i = 0; i < 256; ++i) {
  codes[i] = String.fromCharCode(i);
 }
 embind_charCodes = codes;
}
var embind_charCodes = undefined;
function readLatin1String(ptr) {
 var ret = "";
 var c = ptr;
 while (HEAPU8[c]) {
  ret += embind_charCodes[HEAPU8[c++]];
 }
 return ret;
}
var awaitingDependencies = {};
var registeredTypes = {};
var typeDependencies = {};
var char_0 = 48;
var char_9 = 57;
function makeLegalFunctionName(name) {
 if (undefined === name) {
  return "_unknown";
 }
 name = name.replace(/[^a-zA-Z0-9_]/g, "$");
 var f = name.charCodeAt(0);
 if (f >= char_0 && f <= char_9) {
  return "_" + name;
 } else {
  return name;
 }
}
function createNamedFunction(name, body) {
 name = makeLegalFunctionName(name);
 return (new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n"))(body);
}
function extendError(baseErrorType, errorName) {
 var errorClass = createNamedFunction(errorName, (function(message) {
  this.name = errorName;
  this.message = message;
  var stack = (new Error(message)).stack;
  if (stack !== undefined) {
   this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "");
  }
 }));
 errorClass.prototype = Object.create(baseErrorType.prototype);
 errorClass.prototype.constructor = errorClass;
 errorClass.prototype.toString = (function() {
  if (this.message === undefined) {
   return this.name;
  } else {
   return this.name + ": " + this.message;
  }
 });
 return errorClass;
}
var BindingError = undefined;
function throwBindingError(message) {
 throw new BindingError(message);
}
var InternalError = undefined;
function throwInternalError(message) {
 throw new InternalError(message);
}
function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
 myTypes.forEach((function(type) {
  typeDependencies[type] = dependentTypes;
 }));
 function onComplete(typeConverters) {
  var myTypeConverters = getTypeConverters(typeConverters);
  if (myTypeConverters.length !== myTypes.length) {
   throwInternalError("Mismatched type converter count");
  }
  for (var i = 0; i < myTypes.length; ++i) {
   registerType(myTypes[i], myTypeConverters[i]);
  }
 }
 var typeConverters = new Array(dependentTypes.length);
 var unregisteredTypes = [];
 var registered = 0;
 dependentTypes.forEach((function(dt, i) {
  if (registeredTypes.hasOwnProperty(dt)) {
   typeConverters[i] = registeredTypes[dt];
  } else {
   unregisteredTypes.push(dt);
   if (!awaitingDependencies.hasOwnProperty(dt)) {
    awaitingDependencies[dt] = [];
   }
   awaitingDependencies[dt].push((function() {
    typeConverters[i] = registeredTypes[dt];
    ++registered;
    if (registered === unregisteredTypes.length) {
     onComplete(typeConverters);
    }
   }));
  }
 }));
 if (0 === unregisteredTypes.length) {
  onComplete(typeConverters);
 }
}
function registerType(rawType, registeredInstance, options) {
 options = options || {};
 if (!("argPackAdvance" in registeredInstance)) {
  throw new TypeError("registerType registeredInstance requires argPackAdvance");
 }
 var name = registeredInstance.name;
 if (!rawType) {
  throwBindingError('type "' + name + '" must have a positive integer typeid pointer');
 }
 if (registeredTypes.hasOwnProperty(rawType)) {
  if (options.ignoreDuplicateRegistrations) {
   return;
  } else {
   throwBindingError("Cannot register type '" + name + "' twice");
  }
 }
 registeredTypes[rawType] = registeredInstance;
 delete typeDependencies[rawType];
 if (awaitingDependencies.hasOwnProperty(rawType)) {
  var callbacks = awaitingDependencies[rawType];
  delete awaitingDependencies[rawType];
  callbacks.forEach((function(cb) {
   cb();
  }));
 }
}
function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": (function(wt) {
   return !!wt;
  }),
  "toWireType": (function(destructors, o) {
   return o ? trueValue : falseValue;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": (function(pointer) {
   var heap;
   if (size === 1) {
    heap = HEAP8;
   } else if (size === 2) {
    heap = HEAP16;
   } else if (size === 4) {
    heap = HEAP32;
   } else {
    throw new TypeError("Unknown boolean type size: " + name);
   }
   return this["fromWireType"](heap[pointer >> shift]);
  }),
  destructorFunction: null
 });
}
var _emscripten_landingpad = true;
function _free() {}
Module["_free"] = _free;
function _malloc(bytes) {
 var ptr = Runtime.dynamicAlloc(bytes + 8);
 return ptr + 8 & 4294967288;
}
Module["_malloc"] = _malloc;
function simpleReadValueFromPointer(pointer) {
 return this["fromWireType"](HEAPU32[pointer >> 2]);
}
function __embind_register_std_string(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": (function(value) {
   var length = HEAPU32[value >> 2];
   var a = new Array(length);
   for (var i = 0; i < length; ++i) {
    a[i] = String.fromCharCode(HEAPU8[value + 4 + i]);
   }
   _free(value);
   return a.join("");
  }),
  "toWireType": (function(destructors, value) {
   if (value instanceof ArrayBuffer) {
    value = new Uint8Array(value);
   }
   function getTAElement(ta, index) {
    return ta[index];
   }
   function getStringElement(string, index) {
    return string.charCodeAt(index);
   }
   var getElement;
   if (value instanceof Uint8Array) {
    getElement = getTAElement;
   } else if (value instanceof Int8Array) {
    getElement = getTAElement;
   } else if (typeof value === "string") {
    getElement = getStringElement;
   } else {
    throwBindingError("Cannot pass non-string to std::string");
   }
   var length = value.length;
   var ptr = _malloc(4 + length);
   HEAPU32[ptr >> 2] = length;
   for (var i = 0; i < length; ++i) {
    var charCode = getElement(value, i);
    if (charCode > 255) {
     _free(ptr);
     throwBindingError("String has UTF-16 code units that do not fit in 8 bits");
    }
    HEAPU8[ptr + 4 + i] = charCode;
   }
   if (destructors !== null) {
    destructors.push(_free, ptr);
   }
   return ptr;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: (function(ptr) {
   _free(ptr);
  })
 });
}
function __embind_register_std_wstring(rawType, charSize, name) {
 name = readLatin1String(name);
 var getHeap, shift;
 if (charSize === 2) {
  getHeap = (function() {
   return HEAPU16;
  });
  shift = 1;
 } else if (charSize === 4) {
  getHeap = (function() {
   return HEAPU32;
  });
  shift = 2;
 }
 registerType(rawType, {
  name: name,
  "fromWireType": (function(value) {
   var HEAP = getHeap();
   var length = HEAPU32[value >> 2];
   var a = new Array(length);
   var start = value + 4 >> shift;
   for (var i = 0; i < length; ++i) {
    a[i] = String.fromCharCode(HEAP[start + i]);
   }
   _free(value);
   return a.join("");
  }),
  "toWireType": (function(destructors, value) {
   var HEAP = getHeap();
   var length = value.length;
   var ptr = _malloc(4 + length * charSize);
   HEAPU32[ptr >> 2] = length;
   var start = ptr + 4 >> shift;
   for (var i = 0; i < length; ++i) {
    HEAP[start + i] = value.charCodeAt(i);
   }
   if (destructors !== null) {
    destructors.push(_free, ptr);
   }
   return ptr;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: (function(ptr) {
   _free(ptr);
  })
 });
}
var emval_free_list = [];
var emval_handle_array = [ {}, {
 value: undefined
}, {
 value: null
}, {
 value: true
}, {
 value: false
} ];
function __emval_decref(handle) {
 if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
  emval_handle_array[handle] = undefined;
  emval_free_list.push(handle);
 }
}
var _log = Math_log;
var _emscripten_postinvoke = true;
var PTHREAD_SPECIFIC = {};
var PTHREAD_SPECIFIC_NEXT_KEY = 1;
function _pthread_key_create(key, destructor) {
 if (key == 0) {
  return ERRNO_CODES.EINVAL;
 }
 HEAP32[key >> 2] = PTHREAD_SPECIFIC_NEXT_KEY;
 PTHREAD_SPECIFIC[PTHREAD_SPECIFIC_NEXT_KEY] = 0;
 PTHREAD_SPECIFIC_NEXT_KEY++;
 return 0;
}
function count_emval_handles() {
 var count = 0;
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   ++count;
  }
 }
 return count;
}
function get_first_emval() {
 for (var i = 5; i < emval_handle_array.length; ++i) {
  if (emval_handle_array[i] !== undefined) {
   return emval_handle_array[i];
  }
 }
 return null;
}
function init_emval() {
 Module["count_emval_handles"] = count_emval_handles;
 Module["get_first_emval"] = get_first_emval;
}
function __emval_register(value) {
 switch (value) {
 case undefined:
  {
   return 1;
  }
 case null:
  {
   return 2;
  }
 case true:
  {
   return 3;
  }
 case false:
  {
   return 4;
  }
 default:
  {
   var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
   emval_handle_array[handle] = {
    refcount: 1,
    value: value
   };
   return handle;
  }
 }
}
function getTypeName(type) {
 var ptr = ___getTypeName(type);
 var rv = readLatin1String(ptr);
 _free(ptr);
 return rv;
}
function requireRegisteredType(rawType, humanName) {
 var impl = registeredTypes[rawType];
 if (undefined === impl) {
  throwBindingError(humanName + " has unknown type " + getTypeName(rawType));
 }
 return impl;
}
function __emval_take_value(type, argv) {
 type = requireRegisteredType(type, "_emval_take_value");
 var v = type["readValueFromPointer"](argv);
 return __emval_register(v);
}
function __embind_register_emval(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": (function(handle) {
   var rv = emval_handle_array[handle].value;
   __emval_decref(handle);
   return rv;
  }),
  "toWireType": (function(destructors, value) {
   return __emval_register(value);
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": simpleReadValueFromPointer,
  destructorFunction: null
 });
}
var ERRNO_MESSAGES = {
 0: "Success",
 1: "Not super-user",
 2: "No such file or directory",
 3: "No such process",
 4: "Interrupted system call",
 5: "I/O error",
 6: "No such device or address",
 7: "Arg list too long",
 8: "Exec format error",
 9: "Bad file number",
 10: "No children",
 11: "No more processes",
 12: "Not enough core",
 13: "Permission denied",
 14: "Bad address",
 15: "Block device required",
 16: "Mount device busy",
 17: "File exists",
 18: "Cross-device link",
 19: "No such device",
 20: "Not a directory",
 21: "Is a directory",
 22: "Invalid argument",
 23: "Too many open files in system",
 24: "Too many open files",
 25: "Not a typewriter",
 26: "Text file busy",
 27: "File too large",
 28: "No space left on device",
 29: "Illegal seek",
 30: "Read only file system",
 31: "Too many links",
 32: "Broken pipe",
 33: "Math arg out of domain of func",
 34: "Math result not representable",
 35: "File locking deadlock error",
 36: "File or path name too long",
 37: "No record locks available",
 38: "Function not implemented",
 39: "Directory not empty",
 40: "Too many symbolic links",
 42: "No message of desired type",
 43: "Identifier removed",
 44: "Channel number out of range",
 45: "Level 2 not synchronized",
 46: "Level 3 halted",
 47: "Level 3 reset",
 48: "Link number out of range",
 49: "Protocol driver not attached",
 50: "No CSI structure available",
 51: "Level 2 halted",
 52: "Invalid exchange",
 53: "Invalid request descriptor",
 54: "Exchange full",
 55: "No anode",
 56: "Invalid request code",
 57: "Invalid slot",
 59: "Bad font file fmt",
 60: "Device not a stream",
 61: "No data (for no delay io)",
 62: "Timer expired",
 63: "Out of streams resources",
 64: "Machine is not on the network",
 65: "Package not installed",
 66: "The object is remote",
 67: "The link has been severed",
 68: "Advertise error",
 69: "Srmount error",
 70: "Communication error on send",
 71: "Protocol error",
 72: "Multihop attempted",
 73: "Cross mount point (not really error)",
 74: "Trying to read unreadable message",
 75: "Value too large for defined data type",
 76: "Given log. name not unique",
 77: "f.d. invalid for this operation",
 78: "Remote address changed",
 79: "Can   access a needed shared lib",
 80: "Accessing a corrupted shared lib",
 81: ".lib section in a.out corrupted",
 82: "Attempting to link in too many libs",
 83: "Attempting to exec a shared library",
 84: "Illegal byte sequence",
 86: "Streams pipe error",
 87: "Too many users",
 88: "Socket operation on non-socket",
 89: "Destination address required",
 90: "Message too long",
 91: "Protocol wrong type for socket",
 92: "Protocol not available",
 93: "Unknown protocol",
 94: "Socket type not supported",
 95: "Not supported",
 96: "Protocol family not supported",
 97: "Address family not supported by protocol family",
 98: "Address already in use",
 99: "Address not available",
 100: "Network interface is not configured",
 101: "Network is unreachable",
 102: "Connection reset by network",
 103: "Connection aborted",
 104: "Connection reset by peer",
 105: "No buffer space available",
 106: "Socket is already connected",
 107: "Socket is not connected",
 108: "Can't send after socket shutdown",
 109: "Too many references",
 110: "Connection timed out",
 111: "Connection refused",
 112: "Host is down",
 113: "Host is unreachable",
 114: "Socket already connected",
 115: "Connection already in progress",
 116: "Stale file handle",
 122: "Quota exceeded",
 123: "No medium (in tape drive)",
 125: "Operation canceled",
 130: "Previous owner died",
 131: "State not recoverable"
};
var PATH = {
 splitPath: (function(filename) {
  var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
  return splitPathRe.exec(filename).slice(1);
 }),
 normalizeArray: (function(parts, allowAboveRoot) {
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
   var last = parts[i];
   if (last === ".") {
    parts.splice(i, 1);
   } else if (last === "..") {
    parts.splice(i, 1);
    up++;
   } else if (up) {
    parts.splice(i, 1);
    up--;
   }
  }
  if (allowAboveRoot) {
   for (; up--; up) {
    parts.unshift("..");
   }
  }
  return parts;
 }),
 normalize: (function(path) {
  var isAbsolute = path.charAt(0) === "/", trailingSlash = path.substr(-1) === "/";
  path = PATH.normalizeArray(path.split("/").filter((function(p) {
   return !!p;
  })), !isAbsolute).join("/");
  if (!path && !isAbsolute) {
   path = ".";
  }
  if (path && trailingSlash) {
   path += "/";
  }
  return (isAbsolute ? "/" : "") + path;
 }),
 dirname: (function(path) {
  var result = PATH.splitPath(path), root = result[0], dir = result[1];
  if (!root && !dir) {
   return ".";
  }
  if (dir) {
   dir = dir.substr(0, dir.length - 1);
  }
  return root + dir;
 }),
 basename: (function(path) {
  if (path === "/") return "/";
  var lastSlash = path.lastIndexOf("/");
  if (lastSlash === -1) return path;
  return path.substr(lastSlash + 1);
 }),
 extname: (function(path) {
  return PATH.splitPath(path)[3];
 }),
 join: (function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return PATH.normalize(paths.join("/"));
 }),
 join2: (function(l, r) {
  return PATH.normalize(l + "/" + r);
 }),
 resolve: (function() {
  var resolvedPath = "", resolvedAbsolute = false;
  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
   var path = i >= 0 ? arguments[i] : FS.cwd();
   if (typeof path !== "string") {
    throw new TypeError("Arguments to path.resolve must be strings");
   } else if (!path) {
    return "";
   }
   resolvedPath = path + "/" + resolvedPath;
   resolvedAbsolute = path.charAt(0) === "/";
  }
  resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter((function(p) {
   return !!p;
  })), !resolvedAbsolute).join("/");
  return (resolvedAbsolute ? "/" : "") + resolvedPath || ".";
 }),
 relative: (function(from, to) {
  from = PATH.resolve(from).substr(1);
  to = PATH.resolve(to).substr(1);
  function trim(arr) {
   var start = 0;
   for (; start < arr.length; start++) {
    if (arr[start] !== "") break;
   }
   var end = arr.length - 1;
   for (; end >= 0; end--) {
    if (arr[end] !== "") break;
   }
   if (start > end) return [];
   return arr.slice(start, end - start + 1);
  }
  var fromParts = trim(from.split("/"));
  var toParts = trim(to.split("/"));
  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
   if (fromParts[i] !== toParts[i]) {
    samePartsLength = i;
    break;
   }
  }
  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
   outputParts.push("..");
  }
  outputParts = outputParts.concat(toParts.slice(samePartsLength));
  return outputParts.join("/");
 })
};
var TTY = {
 ttys: [],
 init: (function() {}),
 shutdown: (function() {}),
 register: (function(dev, ops) {
  TTY.ttys[dev] = {
   input: [],
   output: [],
   ops: ops
  };
  FS.registerDevice(dev, TTY.stream_ops);
 }),
 stream_ops: {
  open: (function(stream) {
   var tty = TTY.ttys[stream.node.rdev];
   if (!tty) {
    throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
   }
   stream.tty = tty;
   stream.seekable = false;
  }),
  close: (function(stream) {
   stream.tty.ops.flush(stream.tty);
  }),
  flush: (function(stream) {
   stream.tty.ops.flush(stream.tty);
  }),
  read: (function(stream, buffer, offset, length, pos) {
   if (!stream.tty || !stream.tty.ops.get_char) {
    throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
   }
   var bytesRead = 0;
   for (var i = 0; i < length; i++) {
    var result;
    try {
     result = stream.tty.ops.get_char(stream.tty);
    } catch (e) {
     throw new FS.ErrnoError(ERRNO_CODES.EIO);
    }
    if (result === undefined && bytesRead === 0) {
     throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
    }
    if (result === null || result === undefined) break;
    bytesRead++;
    buffer[offset + i] = result;
   }
   if (bytesRead) {
    stream.node.timestamp = Date.now();
   }
   return bytesRead;
  }),
  write: (function(stream, buffer, offset, length, pos) {
   if (!stream.tty || !stream.tty.ops.put_char) {
    throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
   }
   for (var i = 0; i < length; i++) {
    try {
     stream.tty.ops.put_char(stream.tty, buffer[offset + i]);
    } catch (e) {
     throw new FS.ErrnoError(ERRNO_CODES.EIO);
    }
   }
   if (length) {
    stream.node.timestamp = Date.now();
   }
   return i;
  })
 },
 default_tty_ops: {
  get_char: (function(tty) {
   if (!tty.input.length) {
    var result = null;
    if (ENVIRONMENT_IS_NODE) {
     var BUFSIZE = 256;
     var buf = new Buffer(BUFSIZE);
     var bytesRead = 0;
     var fd = process.stdin.fd;
     var usingDevice = false;
     try {
      fd = fs.openSync("/dev/stdin", "r");
      usingDevice = true;
     } catch (e) {}
     bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
     if (usingDevice) {
      fs.closeSync(fd);
     }
     if (bytesRead > 0) {
      result = buf.slice(0, bytesRead).toString("utf-8");
     } else {
      result = null;
     }
    } else if (typeof window != "undefined" && typeof window.prompt == "function") {
     result = window.prompt("Input: ");
     if (result !== null) {
      result += "\n";
     }
    } else if (typeof readline == "function") {
     result = readline();
     if (result !== null) {
      result += "\n";
     }
    }
    if (!result) {
     return null;
    }
    tty.input = intArrayFromString(result, true);
   }
   return tty.input.shift();
  }),
  put_char: (function(tty, val) {
   if (val === null || val === 10) {
    Module["print"](UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   } else {
    if (val != 0) tty.output.push(val);
   }
  }),
  flush: (function(tty) {
   if (tty.output && tty.output.length > 0) {
    Module["print"](UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   }
  })
 },
 default_tty1_ops: {
  put_char: (function(tty, val) {
   if (val === null || val === 10) {
    Module["printErr"](UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   } else {
    if (val != 0) tty.output.push(val);
   }
  }),
  flush: (function(tty) {
   if (tty.output && tty.output.length > 0) {
    Module["printErr"](UTF8ArrayToString(tty.output, 0));
    tty.output = [];
   }
  })
 }
};
var MEMFS = {
 ops_table: null,
 mount: (function(mount) {
  return MEMFS.createNode(null, "/", 16384 | 511, 0);
 }),
 createNode: (function(parent, name, mode, dev) {
  if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (!MEMFS.ops_table) {
   MEMFS.ops_table = {
    dir: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr,
      lookup: MEMFS.node_ops.lookup,
      mknod: MEMFS.node_ops.mknod,
      rename: MEMFS.node_ops.rename,
      unlink: MEMFS.node_ops.unlink,
      rmdir: MEMFS.node_ops.rmdir,
      readdir: MEMFS.node_ops.readdir,
      symlink: MEMFS.node_ops.symlink
     },
     stream: {
      llseek: MEMFS.stream_ops.llseek
     }
    },
    file: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr
     },
     stream: {
      llseek: MEMFS.stream_ops.llseek,
      read: MEMFS.stream_ops.read,
      write: MEMFS.stream_ops.write,
      allocate: MEMFS.stream_ops.allocate,
      mmap: MEMFS.stream_ops.mmap,
      msync: MEMFS.stream_ops.msync
     }
    },
    link: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr,
      readlink: MEMFS.node_ops.readlink
     },
     stream: {}
    },
    chrdev: {
     node: {
      getattr: MEMFS.node_ops.getattr,
      setattr: MEMFS.node_ops.setattr
     },
     stream: FS.chrdev_stream_ops
    }
   };
  }
  var node = FS.createNode(parent, name, mode, dev);
  if (FS.isDir(node.mode)) {
   node.node_ops = MEMFS.ops_table.dir.node;
   node.stream_ops = MEMFS.ops_table.dir.stream;
   node.contents = {};
  } else if (FS.isFile(node.mode)) {
   node.node_ops = MEMFS.ops_table.file.node;
   node.stream_ops = MEMFS.ops_table.file.stream;
   node.usedBytes = 0;
   node.contents = null;
  } else if (FS.isLink(node.mode)) {
   node.node_ops = MEMFS.ops_table.link.node;
   node.stream_ops = MEMFS.ops_table.link.stream;
  } else if (FS.isChrdev(node.mode)) {
   node.node_ops = MEMFS.ops_table.chrdev.node;
   node.stream_ops = MEMFS.ops_table.chrdev.stream;
  }
  node.timestamp = Date.now();
  if (parent) {
   parent.contents[name] = node;
  }
  return node;
 }),
 getFileDataAsRegularArray: (function(node) {
  if (node.contents && node.contents.subarray) {
   var arr = [];
   for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
   return arr;
  }
  return node.contents;
 }),
 getFileDataAsTypedArray: (function(node) {
  if (!node.contents) return new Uint8Array;
  if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
  return new Uint8Array(node.contents);
 }),
 expandFileStorage: (function(node, newCapacity) {
  if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
   node.contents = MEMFS.getFileDataAsRegularArray(node);
   node.usedBytes = node.contents.length;
  }
  if (!node.contents || node.contents.subarray) {
   var prevCapacity = node.contents ? node.contents.buffer.byteLength : 0;
   if (prevCapacity >= newCapacity) return;
   var CAPACITY_DOUBLING_MAX = 1024 * 1024;
   newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
   if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
   var oldContents = node.contents;
   node.contents = new Uint8Array(newCapacity);
   if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
   return;
  }
  if (!node.contents && newCapacity > 0) node.contents = [];
  while (node.contents.length < newCapacity) node.contents.push(0);
 }),
 resizeFileStorage: (function(node, newSize) {
  if (node.usedBytes == newSize) return;
  if (newSize == 0) {
   node.contents = null;
   node.usedBytes = 0;
   return;
  }
  if (!node.contents || node.contents.subarray) {
   var oldContents = node.contents;
   node.contents = new Uint8Array(new ArrayBuffer(newSize));
   if (oldContents) {
    node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)));
   }
   node.usedBytes = newSize;
   return;
  }
  if (!node.contents) node.contents = [];
  if (node.contents.length > newSize) node.contents.length = newSize; else while (node.contents.length < newSize) node.contents.push(0);
  node.usedBytes = newSize;
 }),
 node_ops: {
  getattr: (function(node) {
   var attr = {};
   attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
   attr.ino = node.id;
   attr.mode = node.mode;
   attr.nlink = 1;
   attr.uid = 0;
   attr.gid = 0;
   attr.rdev = node.rdev;
   if (FS.isDir(node.mode)) {
    attr.size = 4096;
   } else if (FS.isFile(node.mode)) {
    attr.size = node.usedBytes;
   } else if (FS.isLink(node.mode)) {
    attr.size = node.link.length;
   } else {
    attr.size = 0;
   }
   attr.atime = new Date(node.timestamp);
   attr.mtime = new Date(node.timestamp);
   attr.ctime = new Date(node.timestamp);
   attr.blksize = 4096;
   attr.blocks = Math.ceil(attr.size / attr.blksize);
   return attr;
  }),
  setattr: (function(node, attr) {
   if (attr.mode !== undefined) {
    node.mode = attr.mode;
   }
   if (attr.timestamp !== undefined) {
    node.timestamp = attr.timestamp;
   }
   if (attr.size !== undefined) {
    MEMFS.resizeFileStorage(node, attr.size);
   }
  }),
  lookup: (function(parent, name) {
   throw FS.genericErrors[ERRNO_CODES.ENOENT];
  }),
  mknod: (function(parent, name, mode, dev) {
   return MEMFS.createNode(parent, name, mode, dev);
  }),
  rename: (function(old_node, new_dir, new_name) {
   if (FS.isDir(old_node.mode)) {
    var new_node;
    try {
     new_node = FS.lookupNode(new_dir, new_name);
    } catch (e) {}
    if (new_node) {
     for (var i in new_node.contents) {
      throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
     }
    }
   }
   delete old_node.parent.contents[old_node.name];
   old_node.name = new_name;
   new_dir.contents[new_name] = old_node;
   old_node.parent = new_dir;
  }),
  unlink: (function(parent, name) {
   delete parent.contents[name];
  }),
  rmdir: (function(parent, name) {
   var node = FS.lookupNode(parent, name);
   for (var i in node.contents) {
    throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
   }
   delete parent.contents[name];
  }),
  readdir: (function(node) {
   var entries = [ ".", ".." ];
   for (var key in node.contents) {
    if (!node.contents.hasOwnProperty(key)) {
     continue;
    }
    entries.push(key);
   }
   return entries;
  }),
  symlink: (function(parent, newname, oldpath) {
   var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
   node.link = oldpath;
   return node;
  }),
  readlink: (function(node) {
   if (!FS.isLink(node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return node.link;
  })
 },
 stream_ops: {
  read: (function(stream, buffer, offset, length, position) {
   var contents = stream.node.contents;
   if (position >= stream.node.usedBytes) return 0;
   var size = Math.min(stream.node.usedBytes - position, length);
   assert(size >= 0);
   if (size > 8 && contents.subarray) {
    buffer.set(contents.subarray(position, position + size), offset);
   } else {
    for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
   }
   return size;
  }),
  write: (function(stream, buffer, offset, length, position, canOwn) {
   if (!length) return 0;
   var node = stream.node;
   node.timestamp = Date.now();
   if (buffer.subarray && (!node.contents || node.contents.subarray)) {
    if (canOwn) {
     assert(position === 0, "canOwn must imply no weird position inside the file");
     node.contents = buffer.subarray(offset, offset + length);
     node.usedBytes = length;
     return length;
    } else if (node.usedBytes === 0 && position === 0) {
     node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
     node.usedBytes = length;
     return length;
    } else if (position + length <= node.usedBytes) {
     node.contents.set(buffer.subarray(offset, offset + length), position);
     return length;
    }
   }
   MEMFS.expandFileStorage(node, position + length);
   if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); else {
    for (var i = 0; i < length; i++) {
     node.contents[position + i] = buffer[offset + i];
    }
   }
   node.usedBytes = Math.max(node.usedBytes, position + length);
   return length;
  }),
  llseek: (function(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     position += stream.node.usedBytes;
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return position;
  }),
  allocate: (function(stream, offset, length) {
   MEMFS.expandFileStorage(stream.node, offset + length);
   stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
  }),
  mmap: (function(stream, buffer, offset, length, position, prot, flags) {
   if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
   }
   var ptr;
   var allocated;
   var contents = stream.node.contents;
   if (!(flags & 2) && (contents.buffer === buffer || contents.buffer === buffer.buffer)) {
    allocated = false;
    ptr = contents.byteOffset;
   } else {
    if (position > 0 || position + length < stream.node.usedBytes) {
     if (contents.subarray) {
      contents = contents.subarray(position, position + length);
     } else {
      contents = Array.prototype.slice.call(contents, position, position + length);
     }
    }
    allocated = true;
    ptr = _malloc(length);
    if (!ptr) {
     throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
    }
    buffer.set(contents, ptr);
   }
   return {
    ptr: ptr,
    allocated: allocated
   };
  }),
  msync: (function(stream, buffer, offset, length, mmapFlags) {
   if (!FS.isFile(stream.node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
   }
   if (mmapFlags & 2) {
    return 0;
   }
   var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
   return 0;
  })
 }
};
var IDBFS = {
 dbs: {},
 indexedDB: (function() {
  if (typeof indexedDB !== "undefined") return indexedDB;
  var ret = null;
  if (typeof window === "object") ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
  assert(ret, "IDBFS used, but indexedDB not supported");
  return ret;
 }),
 DB_VERSION: 21,
 DB_STORE_NAME: "FILE_DATA",
 mount: (function(mount) {
  return MEMFS.mount.apply(null, arguments);
 }),
 syncfs: (function(mount, populate, callback) {
  IDBFS.getLocalSet(mount, (function(err, local) {
   if (err) return callback(err);
   IDBFS.getRemoteSet(mount, (function(err, remote) {
    if (err) return callback(err);
    var src = populate ? remote : local;
    var dst = populate ? local : remote;
    IDBFS.reconcile(src, dst, callback);
   }));
  }));
 }),
 getDB: (function(name, callback) {
  var db = IDBFS.dbs[name];
  if (db) {
   return callback(null, db);
  }
  var req;
  try {
   req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
  } catch (e) {
   return callback(e);
  }
  req.onupgradeneeded = (function(e) {
   var db = e.target.result;
   var transaction = e.target.transaction;
   var fileStore;
   if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
    fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
   } else {
    fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
   }
   if (!fileStore.indexNames.contains("timestamp")) {
    fileStore.createIndex("timestamp", "timestamp", {
     unique: false
    });
   }
  });
  req.onsuccess = (function() {
   db = req.result;
   IDBFS.dbs[name] = db;
   callback(null, db);
  });
  req.onerror = (function(e) {
   callback(this.error);
   e.preventDefault();
  });
 }),
 getLocalSet: (function(mount, callback) {
  var entries = {};
  function isRealDir(p) {
   return p !== "." && p !== "..";
  }
  function toAbsolute(root) {
   return (function(p) {
    return PATH.join2(root, p);
   });
  }
  var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  while (check.length) {
   var path = check.pop();
   var stat;
   try {
    stat = FS.stat(path);
   } catch (e) {
    return callback(e);
   }
   if (FS.isDir(stat.mode)) {
    check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
   }
   entries[path] = {
    timestamp: stat.mtime
   };
  }
  return callback(null, {
   type: "local",
   entries: entries
  });
 }),
 getRemoteSet: (function(mount, callback) {
  var entries = {};
  IDBFS.getDB(mount.mountpoint, (function(err, db) {
   if (err) return callback(err);
   var transaction = db.transaction([ IDBFS.DB_STORE_NAME ], "readonly");
   transaction.onerror = (function(e) {
    callback(this.error);
    e.preventDefault();
   });
   var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
   var index = store.index("timestamp");
   index.openKeyCursor().onsuccess = (function(event) {
    var cursor = event.target.result;
    if (!cursor) {
     return callback(null, {
      type: "remote",
      db: db,
      entries: entries
     });
    }
    entries[cursor.primaryKey] = {
     timestamp: cursor.key
    };
    cursor.continue();
   });
  }));
 }),
 loadLocalEntry: (function(path, callback) {
  var stat, node;
  try {
   var lookup = FS.lookupPath(path);
   node = lookup.node;
   stat = FS.stat(path);
  } catch (e) {
   return callback(e);
  }
  if (FS.isDir(stat.mode)) {
   return callback(null, {
    timestamp: stat.mtime,
    mode: stat.mode
   });
  } else if (FS.isFile(stat.mode)) {
   node.contents = MEMFS.getFileDataAsTypedArray(node);
   return callback(null, {
    timestamp: stat.mtime,
    mode: stat.mode,
    contents: node.contents
   });
  } else {
   return callback(new Error("node type not supported"));
  }
 }),
 storeLocalEntry: (function(path, entry, callback) {
  try {
   if (FS.isDir(entry.mode)) {
    FS.mkdir(path, entry.mode);
   } else if (FS.isFile(entry.mode)) {
    FS.writeFile(path, entry.contents, {
     encoding: "binary",
     canOwn: true
    });
   } else {
    return callback(new Error("node type not supported"));
   }
   FS.chmod(path, entry.mode);
   FS.utime(path, entry.timestamp, entry.timestamp);
  } catch (e) {
   return callback(e);
  }
  callback(null);
 }),
 removeLocalEntry: (function(path, callback) {
  try {
   var lookup = FS.lookupPath(path);
   var stat = FS.stat(path);
   if (FS.isDir(stat.mode)) {
    FS.rmdir(path);
   } else if (FS.isFile(stat.mode)) {
    FS.unlink(path);
   }
  } catch (e) {
   return callback(e);
  }
  callback(null);
 }),
 loadRemoteEntry: (function(store, path, callback) {
  var req = store.get(path);
  req.onsuccess = (function(event) {
   callback(null, event.target.result);
  });
  req.onerror = (function(e) {
   callback(this.error);
   e.preventDefault();
  });
 }),
 storeRemoteEntry: (function(store, path, entry, callback) {
  var req = store.put(entry, path);
  req.onsuccess = (function() {
   callback(null);
  });
  req.onerror = (function(e) {
   callback(this.error);
   e.preventDefault();
  });
 }),
 removeRemoteEntry: (function(store, path, callback) {
  var req = store.delete(path);
  req.onsuccess = (function() {
   callback(null);
  });
  req.onerror = (function(e) {
   callback(this.error);
   e.preventDefault();
  });
 }),
 reconcile: (function(src, dst, callback) {
  var total = 0;
  var create = [];
  Object.keys(src.entries).forEach((function(key) {
   var e = src.entries[key];
   var e2 = dst.entries[key];
   if (!e2 || e.timestamp > e2.timestamp) {
    create.push(key);
    total++;
   }
  }));
  var remove = [];
  Object.keys(dst.entries).forEach((function(key) {
   var e = dst.entries[key];
   var e2 = src.entries[key];
   if (!e2) {
    remove.push(key);
    total++;
   }
  }));
  if (!total) {
   return callback(null);
  }
  var errored = false;
  var completed = 0;
  var db = src.type === "remote" ? src.db : dst.db;
  var transaction = db.transaction([ IDBFS.DB_STORE_NAME ], "readwrite");
  var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  function done(err) {
   if (err) {
    if (!done.errored) {
     done.errored = true;
     return callback(err);
    }
    return;
   }
   if (++completed >= total) {
    return callback(null);
   }
  }
  transaction.onerror = (function(e) {
   done(this.error);
   e.preventDefault();
  });
  create.sort().forEach((function(path) {
   if (dst.type === "local") {
    IDBFS.loadRemoteEntry(store, path, (function(err, entry) {
     if (err) return done(err);
     IDBFS.storeLocalEntry(path, entry, done);
    }));
   } else {
    IDBFS.loadLocalEntry(path, (function(err, entry) {
     if (err) return done(err);
     IDBFS.storeRemoteEntry(store, path, entry, done);
    }));
   }
  }));
  remove.sort().reverse().forEach((function(path) {
   if (dst.type === "local") {
    IDBFS.removeLocalEntry(path, done);
   } else {
    IDBFS.removeRemoteEntry(store, path, done);
   }
  }));
 })
};
var NODEFS = {
 isWindows: false,
 staticInit: (function() {
  NODEFS.isWindows = !!process.platform.match(/^win/);
 }),
 mount: (function(mount) {
  assert(ENVIRONMENT_IS_NODE);
  return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0);
 }),
 createNode: (function(parent, name, mode, dev) {
  if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var node = FS.createNode(parent, name, mode);
  node.node_ops = NODEFS.node_ops;
  node.stream_ops = NODEFS.stream_ops;
  return node;
 }),
 getMode: (function(path) {
  var stat;
  try {
   stat = fs.lstatSync(path);
   if (NODEFS.isWindows) {
    stat.mode = stat.mode | (stat.mode & 146) >> 1;
   }
  } catch (e) {
   if (!e.code) throw e;
   throw new FS.ErrnoError(ERRNO_CODES[e.code]);
  }
  return stat.mode;
 }),
 realPath: (function(node) {
  var parts = [];
  while (node.parent !== node) {
   parts.push(node.name);
   node = node.parent;
  }
  parts.push(node.mount.opts.root);
  parts.reverse();
  return PATH.join.apply(null, parts);
 }),
 flagsToPermissionStringMap: {
  0: "r",
  1: "r+",
  2: "r+",
  64: "r",
  65: "r+",
  66: "r+",
  129: "rx+",
  193: "rx+",
  514: "w+",
  577: "w",
  578: "w+",
  705: "wx",
  706: "wx+",
  1024: "a",
  1025: "a",
  1026: "a+",
  1089: "a",
  1090: "a+",
  1153: "ax",
  1154: "ax+",
  1217: "ax",
  1218: "ax+",
  4096: "rs",
  4098: "rs+"
 },
 flagsToPermissionString: (function(flags) {
  flags &= ~32768;
  if (flags in NODEFS.flagsToPermissionStringMap) {
   return NODEFS.flagsToPermissionStringMap[flags];
  } else {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
 }),
 node_ops: {
  getattr: (function(node) {
   var path = NODEFS.realPath(node);
   var stat;
   try {
    stat = fs.lstatSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
   if (NODEFS.isWindows && !stat.blksize) {
    stat.blksize = 4096;
   }
   if (NODEFS.isWindows && !stat.blocks) {
    stat.blocks = (stat.size + stat.blksize - 1) / stat.blksize | 0;
   }
   return {
    dev: stat.dev,
    ino: stat.ino,
    mode: stat.mode,
    nlink: stat.nlink,
    uid: stat.uid,
    gid: stat.gid,
    rdev: stat.rdev,
    size: stat.size,
    atime: stat.atime,
    mtime: stat.mtime,
    ctime: stat.ctime,
    blksize: stat.blksize,
    blocks: stat.blocks
   };
  }),
  setattr: (function(node, attr) {
   var path = NODEFS.realPath(node);
   try {
    if (attr.mode !== undefined) {
     fs.chmodSync(path, attr.mode);
     node.mode = attr.mode;
    }
    if (attr.timestamp !== undefined) {
     var date = new Date(attr.timestamp);
     fs.utimesSync(path, date, date);
    }
    if (attr.size !== undefined) {
     fs.truncateSync(path, attr.size);
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  lookup: (function(parent, name) {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   var mode = NODEFS.getMode(path);
   return NODEFS.createNode(parent, name, mode);
  }),
  mknod: (function(parent, name, mode, dev) {
   var node = NODEFS.createNode(parent, name, mode, dev);
   var path = NODEFS.realPath(node);
   try {
    if (FS.isDir(node.mode)) {
     fs.mkdirSync(path, node.mode);
    } else {
     fs.writeFileSync(path, "", {
      mode: node.mode
     });
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
   return node;
  }),
  rename: (function(oldNode, newDir, newName) {
   var oldPath = NODEFS.realPath(oldNode);
   var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
   try {
    fs.renameSync(oldPath, newPath);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  unlink: (function(parent, name) {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   try {
    fs.unlinkSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  rmdir: (function(parent, name) {
   var path = PATH.join2(NODEFS.realPath(parent), name);
   try {
    fs.rmdirSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  readdir: (function(node) {
   var path = NODEFS.realPath(node);
   try {
    return fs.readdirSync(path);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  symlink: (function(parent, newName, oldPath) {
   var newPath = PATH.join2(NODEFS.realPath(parent), newName);
   try {
    fs.symlinkSync(oldPath, newPath);
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  readlink: (function(node) {
   var path = NODEFS.realPath(node);
   try {
    path = fs.readlinkSync(path);
    path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
    return path;
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  })
 },
 stream_ops: {
  open: (function(stream) {
   var path = NODEFS.realPath(stream.node);
   try {
    if (FS.isFile(stream.node.mode)) {
     stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  close: (function(stream) {
   try {
    if (FS.isFile(stream.node.mode) && stream.nfd) {
     fs.closeSync(stream.nfd);
    }
   } catch (e) {
    if (!e.code) throw e;
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
  }),
  read: (function(stream, buffer, offset, length, position) {
   if (length === 0) return 0;
   var nbuffer = new Buffer(length);
   var res;
   try {
    res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
   } catch (e) {
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
   if (res > 0) {
    for (var i = 0; i < res; i++) {
     buffer[offset + i] = nbuffer[i];
    }
   }
   return res;
  }),
  write: (function(stream, buffer, offset, length, position) {
   var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
   var res;
   try {
    res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
   } catch (e) {
    throw new FS.ErrnoError(ERRNO_CODES[e.code]);
   }
   return res;
  }),
  llseek: (function(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     try {
      var stat = fs.fstatSync(stream.nfd);
      position += stat.size;
     } catch (e) {
      throw new FS.ErrnoError(ERRNO_CODES[e.code]);
     }
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return position;
  })
 }
};
var WORKERFS = {
 DIR_MODE: 16895,
 FILE_MODE: 33279,
 reader: null,
 mount: (function(mount) {
  assert(ENVIRONMENT_IS_WORKER);
  if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync;
  var root = WORKERFS.createNode(null, "/", WORKERFS.DIR_MODE, 0);
  var createdParents = {};
  function ensureParent(path) {
   var parts = path.split("/");
   var parent = root;
   for (var i = 0; i < parts.length - 1; i++) {
    var curr = parts.slice(0, i + 1).join("/");
    if (!createdParents[curr]) {
     createdParents[curr] = WORKERFS.createNode(parent, curr, WORKERFS.DIR_MODE, 0);
    }
    parent = createdParents[curr];
   }
   return parent;
  }
  function base(path) {
   var parts = path.split("/");
   return parts[parts.length - 1];
  }
  Array.prototype.forEach.call(mount.opts["files"] || [], (function(file) {
   WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate);
  }));
  (mount.opts["blobs"] || []).forEach((function(obj) {
   WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"]);
  }));
  (mount.opts["packages"] || []).forEach((function(pack) {
   pack["metadata"].files.forEach((function(file) {
    var name = file.filename.substr(1);
    WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack["blob"].slice(file.start, file.end));
   }));
  }));
  return root;
 }),
 createNode: (function(parent, name, mode, dev, contents, mtime) {
  var node = FS.createNode(parent, name, mode);
  node.mode = mode;
  node.node_ops = WORKERFS.node_ops;
  node.stream_ops = WORKERFS.stream_ops;
  node.timestamp = (mtime || new Date).getTime();
  assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
  if (mode === WORKERFS.FILE_MODE) {
   node.size = contents.size;
   node.contents = contents;
  } else {
   node.size = 4096;
   node.contents = {};
  }
  if (parent) {
   parent.contents[name] = node;
  }
  return node;
 }),
 node_ops: {
  getattr: (function(node) {
   return {
    dev: 1,
    ino: undefined,
    mode: node.mode,
    nlink: 1,
    uid: 0,
    gid: 0,
    rdev: undefined,
    size: node.size,
    atime: new Date(node.timestamp),
    mtime: new Date(node.timestamp),
    ctime: new Date(node.timestamp),
    blksize: 4096,
    blocks: Math.ceil(node.size / 4096)
   };
  }),
  setattr: (function(node, attr) {
   if (attr.mode !== undefined) {
    node.mode = attr.mode;
   }
   if (attr.timestamp !== undefined) {
    node.timestamp = attr.timestamp;
   }
  }),
  lookup: (function(parent, name) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }),
  mknod: (function(parent, name, mode, dev) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  rename: (function(oldNode, newDir, newName) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  unlink: (function(parent, name) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  rmdir: (function(parent, name) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  readdir: (function(node) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  symlink: (function(parent, newName, oldPath) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }),
  readlink: (function(node) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  })
 },
 stream_ops: {
  read: (function(stream, buffer, offset, length, position) {
   if (position >= stream.node.size) return 0;
   var chunk = stream.node.contents.slice(position, position + length);
   var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
   buffer.set(new Uint8Array(ab), offset);
   return chunk.size;
  }),
  write: (function(stream, buffer, offset, length, position) {
   throw new FS.ErrnoError(ERRNO_CODES.EIO);
  }),
  llseek: (function(stream, offset, whence) {
   var position = offset;
   if (whence === 1) {
    position += stream.position;
   } else if (whence === 2) {
    if (FS.isFile(stream.node.mode)) {
     position += stream.node.size;
    }
   }
   if (position < 0) {
    throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
   }
   return position;
  })
 }
};
var _stdin = allocate(1, "i32*", ALLOC_STATIC);
var _stdout = allocate(1, "i32*", ALLOC_STATIC);
var _stderr = allocate(1, "i32*", ALLOC_STATIC);
var FS = {
 root: null,
 mounts: [],
 devices: [ null ],
 streams: [],
 nextInode: 1,
 nameTable: null,
 currentPath: "/",
 initialized: false,
 ignorePermissions: true,
 trackingDelegate: {},
 tracking: {
  openFlags: {
   READ: 1,
   WRITE: 2
  }
 },
 ErrnoError: null,
 genericErrors: {},
 filesystems: null,
 handleFSError: (function(e) {
  if (!(e instanceof FS.ErrnoError)) throw e + " : " + stackTrace();
  return ___setErrNo(e.errno);
 }),
 lookupPath: (function(path, opts) {
  path = PATH.resolve(FS.cwd(), path);
  opts = opts || {};
  if (!path) return {
   path: "",
   node: null
  };
  var defaults = {
   follow_mount: true,
   recurse_count: 0
  };
  for (var key in defaults) {
   if (opts[key] === undefined) {
    opts[key] = defaults[key];
   }
  }
  if (opts.recurse_count > 8) {
   throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
  }
  var parts = PATH.normalizeArray(path.split("/").filter((function(p) {
   return !!p;
  })), false);
  var current = FS.root;
  var current_path = "/";
  for (var i = 0; i < parts.length; i++) {
   var islast = i === parts.length - 1;
   if (islast && opts.parent) {
    break;
   }
   current = FS.lookupNode(current, parts[i]);
   current_path = PATH.join2(current_path, parts[i]);
   if (FS.isMountpoint(current)) {
    if (!islast || islast && opts.follow_mount) {
     current = current.mounted.root;
    }
   }
   if (!islast || opts.follow) {
    var count = 0;
    while (FS.isLink(current.mode)) {
     var link = FS.readlink(current_path);
     current_path = PATH.resolve(PATH.dirname(current_path), link);
     var lookup = FS.lookupPath(current_path, {
      recurse_count: opts.recurse_count
     });
     current = lookup.node;
     if (count++ > 40) {
      throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
     }
    }
   }
  }
  return {
   path: current_path,
   node: current
  };
 }),
 getPath: (function(node) {
  var path;
  while (true) {
   if (FS.isRoot(node)) {
    var mount = node.mount.mountpoint;
    if (!path) return mount;
    return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path;
   }
   path = path ? node.name + "/" + path : node.name;
   node = node.parent;
  }
 }),
 hashName: (function(parentid, name) {
  var hash = 0;
  for (var i = 0; i < name.length; i++) {
   hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
  }
  return (parentid + hash >>> 0) % FS.nameTable.length;
 }),
 hashAddNode: (function(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  node.name_next = FS.nameTable[hash];
  FS.nameTable[hash] = node;
 }),
 hashRemoveNode: (function(node) {
  var hash = FS.hashName(node.parent.id, node.name);
  if (FS.nameTable[hash] === node) {
   FS.nameTable[hash] = node.name_next;
  } else {
   var current = FS.nameTable[hash];
   while (current) {
    if (current.name_next === node) {
     current.name_next = node.name_next;
     break;
    }
    current = current.name_next;
   }
  }
 }),
 lookupNode: (function(parent, name) {
  var err = FS.mayLookup(parent);
  if (err) {
   throw new FS.ErrnoError(err, parent);
  }
  var hash = FS.hashName(parent.id, name);
  for (var node = FS.nameTable[hash]; node; node = node.name_next) {
   var nodeName = node.name;
   if (node.parent.id === parent.id && nodeName === name) {
    return node;
   }
  }
  return FS.lookup(parent, name);
 }),
 createNode: (function(parent, name, mode, rdev) {
  if (!FS.FSNode) {
   FS.FSNode = (function(parent, name, mode, rdev) {
    if (!parent) {
     parent = this;
    }
    this.parent = parent;
    this.mount = parent.mount;
    this.mounted = null;
    this.id = FS.nextInode++;
    this.name = name;
    this.mode = mode;
    this.node_ops = {};
    this.stream_ops = {};
    this.rdev = rdev;
   });
   FS.FSNode.prototype = {};
   var readMode = 292 | 73;
   var writeMode = 146;
   Object.defineProperties(FS.FSNode.prototype, {
    read: {
     get: (function() {
      return (this.mode & readMode) === readMode;
     }),
     set: (function(val) {
      val ? this.mode |= readMode : this.mode &= ~readMode;
     })
    },
    write: {
     get: (function() {
      return (this.mode & writeMode) === writeMode;
     }),
     set: (function(val) {
      val ? this.mode |= writeMode : this.mode &= ~writeMode;
     })
    },
    isFolder: {
     get: (function() {
      return FS.isDir(this.mode);
     })
    },
    isDevice: {
     get: (function() {
      return FS.isChrdev(this.mode);
     })
    }
   });
  }
  var node = new FS.FSNode(parent, name, mode, rdev);
  FS.hashAddNode(node);
  return node;
 }),
 destroyNode: (function(node) {
  FS.hashRemoveNode(node);
 }),
 isRoot: (function(node) {
  return node === node.parent;
 }),
 isMountpoint: (function(node) {
  return !!node.mounted;
 }),
 isFile: (function(mode) {
  return (mode & 61440) === 32768;
 }),
 isDir: (function(mode) {
  return (mode & 61440) === 16384;
 }),
 isLink: (function(mode) {
  return (mode & 61440) === 40960;
 }),
 isChrdev: (function(mode) {
  return (mode & 61440) === 8192;
 }),
 isBlkdev: (function(mode) {
  return (mode & 61440) === 24576;
 }),
 isFIFO: (function(mode) {
  return (mode & 61440) === 4096;
 }),
 isSocket: (function(mode) {
  return (mode & 49152) === 49152;
 }),
 flagModes: {
  "r": 0,
  "rs": 1052672,
  "r+": 2,
  "w": 577,
  "wx": 705,
  "xw": 705,
  "w+": 578,
  "wx+": 706,
  "xw+": 706,
  "a": 1089,
  "ax": 1217,
  "xa": 1217,
  "a+": 1090,
  "ax+": 1218,
  "xa+": 1218
 },
 modeStringToFlags: (function(str) {
  var flags = FS.flagModes[str];
  if (typeof flags === "undefined") {
   throw new Error("Unknown file open mode: " + str);
  }
  return flags;
 }),
 flagsToPermissionString: (function(flag) {
  var perms = [ "r", "w", "rw" ][flag & 3];
  if (flag & 512) {
   perms += "w";
  }
  return perms;
 }),
 nodePermissions: (function(node, perms) {
  if (FS.ignorePermissions) {
   return 0;
  }
  if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
   return ERRNO_CODES.EACCES;
  } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
   return ERRNO_CODES.EACCES;
  } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
   return ERRNO_CODES.EACCES;
  }
  return 0;
 }),
 mayLookup: (function(dir) {
  var err = FS.nodePermissions(dir, "x");
  if (err) return err;
  if (!dir.node_ops.lookup) return ERRNO_CODES.EACCES;
  return 0;
 }),
 mayCreate: (function(dir, name) {
  try {
   var node = FS.lookupNode(dir, name);
   return ERRNO_CODES.EEXIST;
  } catch (e) {}
  return FS.nodePermissions(dir, "wx");
 }),
 mayDelete: (function(dir, name, isdir) {
  var node;
  try {
   node = FS.lookupNode(dir, name);
  } catch (e) {
   return e.errno;
  }
  var err = FS.nodePermissions(dir, "wx");
  if (err) {
   return err;
  }
  if (isdir) {
   if (!FS.isDir(node.mode)) {
    return ERRNO_CODES.ENOTDIR;
   }
   if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
    return ERRNO_CODES.EBUSY;
   }
  } else {
   if (FS.isDir(node.mode)) {
    return ERRNO_CODES.EISDIR;
   }
  }
  return 0;
 }),
 mayOpen: (function(node, flags) {
  if (!node) {
   return ERRNO_CODES.ENOENT;
  }
  if (FS.isLink(node.mode)) {
   return ERRNO_CODES.ELOOP;
  } else if (FS.isDir(node.mode)) {
   if ((flags & 2097155) !== 0 || flags & 512) {
    return ERRNO_CODES.EISDIR;
   }
  }
  return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
 }),
 MAX_OPEN_FDS: 4096,
 nextfd: (function(fd_start, fd_end) {
  fd_start = fd_start || 0;
  fd_end = fd_end || FS.MAX_OPEN_FDS;
  for (var fd = fd_start; fd <= fd_end; fd++) {
   if (!FS.streams[fd]) {
    return fd;
   }
  }
  throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
 }),
 getStream: (function(fd) {
  return FS.streams[fd];
 }),
 createStream: (function(stream, fd_start, fd_end) {
  if (!FS.FSStream) {
   FS.FSStream = (function() {});
   FS.FSStream.prototype = {};
   Object.defineProperties(FS.FSStream.prototype, {
    object: {
     get: (function() {
      return this.node;
     }),
     set: (function(val) {
      this.node = val;
     })
    },
    isRead: {
     get: (function() {
      return (this.flags & 2097155) !== 1;
     })
    },
    isWrite: {
     get: (function() {
      return (this.flags & 2097155) !== 0;
     })
    },
    isAppend: {
     get: (function() {
      return this.flags & 1024;
     })
    }
   });
  }
  var newStream = new FS.FSStream;
  for (var p in stream) {
   newStream[p] = stream[p];
  }
  stream = newStream;
  var fd = FS.nextfd(fd_start, fd_end);
  stream.fd = fd;
  FS.streams[fd] = stream;
  return stream;
 }),
 closeStream: (function(fd) {
  FS.streams[fd] = null;
 }),
 chrdev_stream_ops: {
  open: (function(stream) {
   var device = FS.getDevice(stream.node.rdev);
   stream.stream_ops = device.stream_ops;
   if (stream.stream_ops.open) {
    stream.stream_ops.open(stream);
   }
  }),
  llseek: (function() {
   throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
  })
 },
 major: (function(dev) {
  return dev >> 8;
 }),
 minor: (function(dev) {
  return dev & 255;
 }),
 makedev: (function(ma, mi) {
  return ma << 8 | mi;
 }),
 registerDevice: (function(dev, ops) {
  FS.devices[dev] = {
   stream_ops: ops
  };
 }),
 getDevice: (function(dev) {
  return FS.devices[dev];
 }),
 getMounts: (function(mount) {
  var mounts = [];
  var check = [ mount ];
  while (check.length) {
   var m = check.pop();
   mounts.push(m);
   check.push.apply(check, m.mounts);
  }
  return mounts;
 }),
 syncfs: (function(populate, callback) {
  if (typeof populate === "function") {
   callback = populate;
   populate = false;
  }
  var mounts = FS.getMounts(FS.root.mount);
  var completed = 0;
  function done(err) {
   if (err) {
    if (!done.errored) {
     done.errored = true;
     return callback(err);
    }
    return;
   }
   if (++completed >= mounts.length) {
    callback(null);
   }
  }
  mounts.forEach((function(mount) {
   if (!mount.type.syncfs) {
    return done(null);
   }
   mount.type.syncfs(mount, populate, done);
  }));
 }),
 mount: (function(type, opts, mountpoint) {
  var root = mountpoint === "/";
  var pseudo = !mountpoint;
  var node;
  if (root && FS.root) {
   throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
  } else if (!root && !pseudo) {
   var lookup = FS.lookupPath(mountpoint, {
    follow_mount: false
   });
   mountpoint = lookup.path;
   node = lookup.node;
   if (FS.isMountpoint(node)) {
    throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
   }
   if (!FS.isDir(node.mode)) {
    throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
   }
  }
  var mount = {
   type: type,
   opts: opts,
   mountpoint: mountpoint,
   mounts: []
  };
  var mountRoot = type.mount(mount);
  mountRoot.mount = mount;
  mount.root = mountRoot;
  if (root) {
   FS.root = mountRoot;
  } else if (node) {
   node.mounted = mount;
   if (node.mount) {
    node.mount.mounts.push(mount);
   }
  }
  return mountRoot;
 }),
 unmount: (function(mountpoint) {
  var lookup = FS.lookupPath(mountpoint, {
   follow_mount: false
  });
  if (!FS.isMountpoint(lookup.node)) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var node = lookup.node;
  var mount = node.mounted;
  var mounts = FS.getMounts(mount);
  Object.keys(FS.nameTable).forEach((function(hash) {
   var current = FS.nameTable[hash];
   while (current) {
    var next = current.name_next;
    if (mounts.indexOf(current.mount) !== -1) {
     FS.destroyNode(current);
    }
    current = next;
   }
  }));
  node.mounted = null;
  var idx = node.mount.mounts.indexOf(mount);
  assert(idx !== -1);
  node.mount.mounts.splice(idx, 1);
 }),
 lookup: (function(parent, name) {
  return parent.node_ops.lookup(parent, name);
 }),
 mknod: (function(path, mode, dev) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  if (!name || name === "." || name === "..") {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var err = FS.mayCreate(parent, name);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.mknod) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  return parent.node_ops.mknod(parent, name, mode, dev);
 }),
 create: (function(path, mode) {
  mode = mode !== undefined ? mode : 438;
  mode &= 4095;
  mode |= 32768;
  return FS.mknod(path, mode, 0);
 }),
 mkdir: (function(path, mode) {
  mode = mode !== undefined ? mode : 511;
  mode &= 511 | 512;
  mode |= 16384;
  return FS.mknod(path, mode, 0);
 }),
 mkdev: (function(path, mode, dev) {
  if (typeof dev === "undefined") {
   dev = mode;
   mode = 438;
  }
  mode |= 8192;
  return FS.mknod(path, mode, dev);
 }),
 symlink: (function(oldpath, newpath) {
  if (!PATH.resolve(oldpath)) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }
  var lookup = FS.lookupPath(newpath, {
   parent: true
  });
  var parent = lookup.node;
  if (!parent) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }
  var newname = PATH.basename(newpath);
  var err = FS.mayCreate(parent, newname);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.symlink) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  return parent.node_ops.symlink(parent, newname, oldpath);
 }),
 rename: (function(old_path, new_path) {
  var old_dirname = PATH.dirname(old_path);
  var new_dirname = PATH.dirname(new_path);
  var old_name = PATH.basename(old_path);
  var new_name = PATH.basename(new_path);
  var lookup, old_dir, new_dir;
  try {
   lookup = FS.lookupPath(old_path, {
    parent: true
   });
   old_dir = lookup.node;
   lookup = FS.lookupPath(new_path, {
    parent: true
   });
   new_dir = lookup.node;
  } catch (e) {
   throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
  }
  if (!old_dir || !new_dir) throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  if (old_dir.mount !== new_dir.mount) {
   throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
  }
  var old_node = FS.lookupNode(old_dir, old_name);
  var relative = PATH.relative(old_path, new_dirname);
  if (relative.charAt(0) !== ".") {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  relative = PATH.relative(new_path, old_dirname);
  if (relative.charAt(0) !== ".") {
   throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
  }
  var new_node;
  try {
   new_node = FS.lookupNode(new_dir, new_name);
  } catch (e) {}
  if (old_node === new_node) {
   return;
  }
  var isdir = FS.isDir(old_node.mode);
  var err = FS.mayDelete(old_dir, old_name, isdir);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  err = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!old_dir.node_ops.rename) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
   throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
  }
  if (new_dir !== old_dir) {
   err = FS.nodePermissions(old_dir, "w");
   if (err) {
    throw new FS.ErrnoError(err);
   }
  }
  try {
   if (FS.trackingDelegate["willMovePath"]) {
    FS.trackingDelegate["willMovePath"](old_path, new_path);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
  }
  FS.hashRemoveNode(old_node);
  try {
   old_dir.node_ops.rename(old_node, new_dir, new_name);
  } catch (e) {
   throw e;
  } finally {
   FS.hashAddNode(old_node);
  }
  try {
   if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path);
  } catch (e) {
   console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message);
  }
 }),
 rmdir: (function(path) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var err = FS.mayDelete(parent, name, true);
  if (err) {
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.rmdir) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (FS.isMountpoint(node)) {
   throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
  }
  try {
   if (FS.trackingDelegate["willDeletePath"]) {
    FS.trackingDelegate["willDeletePath"](path);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
  }
  parent.node_ops.rmdir(parent, name);
  FS.destroyNode(node);
  try {
   if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path);
  } catch (e) {
   console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
  }
 }),
 readdir: (function(path) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  if (!node.node_ops.readdir) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
  }
  return node.node_ops.readdir(node);
 }),
 unlink: (function(path) {
  var lookup = FS.lookupPath(path, {
   parent: true
  });
  var parent = lookup.node;
  var name = PATH.basename(path);
  var node = FS.lookupNode(parent, name);
  var err = FS.mayDelete(parent, name, false);
  if (err) {
   if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
   throw new FS.ErrnoError(err);
  }
  if (!parent.node_ops.unlink) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (FS.isMountpoint(node)) {
   throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
  }
  try {
   if (FS.trackingDelegate["willDeletePath"]) {
    FS.trackingDelegate["willDeletePath"](path);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message);
  }
  parent.node_ops.unlink(parent, name);
  FS.destroyNode(node);
  try {
   if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path);
  } catch (e) {
   console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message);
  }
 }),
 readlink: (function(path) {
  var lookup = FS.lookupPath(path);
  var link = lookup.node;
  if (!link) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }
  if (!link.node_ops.readlink) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
 }),
 stat: (function(path, dontFollow) {
  var lookup = FS.lookupPath(path, {
   follow: !dontFollow
  });
  var node = lookup.node;
  if (!node) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }
  if (!node.node_ops.getattr) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  return node.node_ops.getattr(node);
 }),
 lstat: (function(path) {
  return FS.stat(path, true);
 }),
 chmod: (function(path, mode, dontFollow) {
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: !dontFollow
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  node.node_ops.setattr(node, {
   mode: mode & 4095 | node.mode & ~4095,
   timestamp: Date.now()
  });
 }),
 lchmod: (function(path, mode) {
  FS.chmod(path, mode, true);
 }),
 fchmod: (function(fd, mode) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  FS.chmod(stream.node, mode);
 }),
 chown: (function(path, uid, gid, dontFollow) {
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: !dontFollow
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  node.node_ops.setattr(node, {
   timestamp: Date.now()
  });
 }),
 lchown: (function(path, uid, gid) {
  FS.chown(path, uid, gid, true);
 }),
 fchown: (function(fd, uid, gid) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  FS.chown(stream.node, uid, gid);
 }),
 truncate: (function(path, len) {
  if (len < 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var node;
  if (typeof path === "string") {
   var lookup = FS.lookupPath(path, {
    follow: true
   });
   node = lookup.node;
  } else {
   node = path;
  }
  if (!node.node_ops.setattr) {
   throw new FS.ErrnoError(ERRNO_CODES.EPERM);
  }
  if (FS.isDir(node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
  }
  if (!FS.isFile(node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var err = FS.nodePermissions(node, "w");
  if (err) {
   throw new FS.ErrnoError(err);
  }
  node.node_ops.setattr(node, {
   size: len,
   timestamp: Date.now()
  });
 }),
 ftruncate: (function(fd, len) {
  var stream = FS.getStream(fd);
  if (!stream) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  FS.truncate(stream.node, len);
 }),
 utime: (function(path, atime, mtime) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  var node = lookup.node;
  node.node_ops.setattr(node, {
   timestamp: Math.max(atime, mtime)
  });
 }),
 open: (function(path, flags, mode, fd_start, fd_end) {
  if (path === "") {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }
  flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
  mode = typeof mode === "undefined" ? 438 : mode;
  if (flags & 64) {
   mode = mode & 4095 | 32768;
  } else {
   mode = 0;
  }
  var node;
  if (typeof path === "object") {
   node = path;
  } else {
   path = PATH.normalize(path);
   try {
    var lookup = FS.lookupPath(path, {
     follow: !(flags & 131072)
    });
    node = lookup.node;
   } catch (e) {}
  }
  var created = false;
  if (flags & 64) {
   if (node) {
    if (flags & 128) {
     throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
    }
   } else {
    node = FS.mknod(path, mode, 0);
    created = true;
   }
  }
  if (!node) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
  }
  if (FS.isChrdev(node.mode)) {
   flags &= ~512;
  }
  if (flags & 65536 && !FS.isDir(node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
  }
  if (!created) {
   var err = FS.mayOpen(node, flags);
   if (err) {
    throw new FS.ErrnoError(err);
   }
  }
  if (flags & 512) {
   FS.truncate(node, 0);
  }
  flags &= ~(128 | 512);
  var stream = FS.createStream({
   node: node,
   path: FS.getPath(node),
   flags: flags,
   seekable: true,
   position: 0,
   stream_ops: node.stream_ops,
   ungotten: [],
   error: false
  }, fd_start, fd_end);
  if (stream.stream_ops.open) {
   stream.stream_ops.open(stream);
  }
  if (Module["logReadFiles"] && !(flags & 1)) {
   if (!FS.readFiles) FS.readFiles = {};
   if (!(path in FS.readFiles)) {
    FS.readFiles[path] = 1;
    Module["printErr"]("read file: " + path);
   }
  }
  try {
   if (FS.trackingDelegate["onOpenFile"]) {
    var trackingFlags = 0;
    if ((flags & 2097155) !== 1) {
     trackingFlags |= FS.tracking.openFlags.READ;
    }
    if ((flags & 2097155) !== 0) {
     trackingFlags |= FS.tracking.openFlags.WRITE;
    }
    FS.trackingDelegate["onOpenFile"](path, trackingFlags);
   }
  } catch (e) {
   console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message);
  }
  return stream;
 }),
 close: (function(stream) {
  if (stream.getdents) stream.getdents = null;
  try {
   if (stream.stream_ops.close) {
    stream.stream_ops.close(stream);
   }
  } catch (e) {
   throw e;
  } finally {
   FS.closeStream(stream.fd);
  }
 }),
 llseek: (function(stream, offset, whence) {
  if (!stream.seekable || !stream.stream_ops.llseek) {
   throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
  }
  stream.position = stream.stream_ops.llseek(stream, offset, whence);
  stream.ungotten = [];
  return stream.position;
 }),
 read: (function(stream, buffer, offset, length, position) {
  if (length < 0 || position < 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  if ((stream.flags & 2097155) === 1) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  if (FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
  }
  if (!stream.stream_ops.read) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  var seeking = true;
  if (typeof position === "undefined") {
   position = stream.position;
   seeking = false;
  } else if (!stream.seekable) {
   throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
  }
  var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
  if (!seeking) stream.position += bytesRead;
  return bytesRead;
 }),
 write: (function(stream, buffer, offset, length, position, canOwn) {
  if (length < 0 || position < 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  if (FS.isDir(stream.node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
  }
  if (!stream.stream_ops.write) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  if (stream.flags & 1024) {
   FS.llseek(stream, 0, 2);
  }
  var seeking = true;
  if (typeof position === "undefined") {
   position = stream.position;
   seeking = false;
  } else if (!stream.seekable) {
   throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
  }
  var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
  if (!seeking) stream.position += bytesWritten;
  try {
   if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path);
  } catch (e) {
   console.log("FS.trackingDelegate['onWriteToFile']('" + path + "') threw an exception: " + e.message);
  }
  return bytesWritten;
 }),
 allocate: (function(stream, offset, length) {
  if (offset < 0 || length <= 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
  }
  if ((stream.flags & 2097155) === 0) {
   throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  }
  if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
  }
  if (!stream.stream_ops.allocate) {
   throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
  }
  stream.stream_ops.allocate(stream, offset, length);
 }),
 mmap: (function(stream, buffer, offset, length, position, prot, flags) {
  if ((stream.flags & 2097155) === 1) {
   throw new FS.ErrnoError(ERRNO_CODES.EACCES);
  }
  if (!stream.stream_ops.mmap) {
   throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
  }
  return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
 }),
 msync: (function(stream, buffer, offset, length, mmapFlags) {
  if (!stream || !stream.stream_ops.msync) {
   return 0;
  }
  return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
 }),
 munmap: (function(stream) {
  return 0;
 }),
 ioctl: (function(stream, cmd, arg) {
  if (!stream.stream_ops.ioctl) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
  }
  return stream.stream_ops.ioctl(stream, cmd, arg);
 }),
 readFile: (function(path, opts) {
  opts = opts || {};
  opts.flags = opts.flags || "r";
  opts.encoding = opts.encoding || "binary";
  if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
   throw new Error('Invalid encoding type "' + opts.encoding + '"');
  }
  var ret;
  var stream = FS.open(path, opts.flags);
  var stat = FS.stat(path);
  var length = stat.size;
  var buf = new Uint8Array(length);
  FS.read(stream, buf, 0, length, 0);
  if (opts.encoding === "utf8") {
   ret = UTF8ArrayToString(buf, 0);
  } else if (opts.encoding === "binary") {
   ret = buf;
  }
  FS.close(stream);
  return ret;
 }),
 writeFile: (function(path, data, opts) {
  opts = opts || {};
  opts.flags = opts.flags || "w";
  opts.encoding = opts.encoding || "utf8";
  if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
   throw new Error('Invalid encoding type "' + opts.encoding + '"');
  }
  var stream = FS.open(path, opts.flags, opts.mode);
  if (opts.encoding === "utf8") {
   var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
   var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
   FS.write(stream, buf, 0, actualNumBytes, 0, opts.canOwn);
  } else if (opts.encoding === "binary") {
   FS.write(stream, data, 0, data.length, 0, opts.canOwn);
  }
  FS.close(stream);
 }),
 cwd: (function() {
  return FS.currentPath;
 }),
 chdir: (function(path) {
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  if (!FS.isDir(lookup.node.mode)) {
   throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
  }
  var err = FS.nodePermissions(lookup.node, "x");
  if (err) {
   throw new FS.ErrnoError(err);
  }
  FS.currentPath = lookup.path;
 }),
 createDefaultDirectories: (function() {
  FS.mkdir("/tmp");
  FS.mkdir("/home");
  FS.mkdir("/home/web_user");
 }),
 createDefaultDevices: (function() {
  FS.mkdir("/dev");
  FS.registerDevice(FS.makedev(1, 3), {
   read: (function() {
    return 0;
   }),
   write: (function(stream, buffer, offset, length, pos) {
    return length;
   })
  });
  FS.mkdev("/dev/null", FS.makedev(1, 3));
  TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
  TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
  FS.mkdev("/dev/tty", FS.makedev(5, 0));
  FS.mkdev("/dev/tty1", FS.makedev(6, 0));
  var random_device;
  if (typeof crypto !== "undefined") {
   var randomBuffer = new Uint8Array(1);
   random_device = (function() {
    crypto.getRandomValues(randomBuffer);
    return randomBuffer[0];
   });
  } else if (ENVIRONMENT_IS_NODE) {
   random_device = (function() {
    return require("crypto").randomBytes(1)[0];
   });
  } else {
   random_device = (function() {
    return Math.random() * 256 | 0;
   });
  }
  FS.createDevice("/dev", "random", random_device);
  FS.createDevice("/dev", "urandom", random_device);
  FS.mkdir("/dev/shm");
  FS.mkdir("/dev/shm/tmp");
 }),
 createSpecialDirectories: (function() {
  FS.mkdir("/proc");
  FS.mkdir("/proc/self");
  FS.mkdir("/proc/self/fd");
  FS.mount({
   mount: (function() {
    var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
    node.node_ops = {
     lookup: (function(parent, name) {
      var fd = +name;
      var stream = FS.getStream(fd);
      if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
      var ret = {
       parent: null,
       mount: {
        mountpoint: "fake"
       },
       node_ops: {
        readlink: (function() {
         return stream.path;
        })
       }
      };
      ret.parent = ret;
      return ret;
     })
    };
    return node;
   })
  }, {}, "/proc/self/fd");
 }),
 createStandardStreams: (function() {
  if (Module["stdin"]) {
   FS.createDevice("/dev", "stdin", Module["stdin"]);
  } else {
   FS.symlink("/dev/tty", "/dev/stdin");
  }
  if (Module["stdout"]) {
   FS.createDevice("/dev", "stdout", null, Module["stdout"]);
  } else {
   FS.symlink("/dev/tty", "/dev/stdout");
  }
  if (Module["stderr"]) {
   FS.createDevice("/dev", "stderr", null, Module["stderr"]);
  } else {
   FS.symlink("/dev/tty1", "/dev/stderr");
  }
  var stdin = FS.open("/dev/stdin", "r");
  assert(stdin.fd === 0, "invalid handle for stdin (" + stdin.fd + ")");
  var stdout = FS.open("/dev/stdout", "w");
  assert(stdout.fd === 1, "invalid handle for stdout (" + stdout.fd + ")");
  var stderr = FS.open("/dev/stderr", "w");
  assert(stderr.fd === 2, "invalid handle for stderr (" + stderr.fd + ")");
 }),
 ensureErrnoError: (function() {
  if (FS.ErrnoError) return;
  FS.ErrnoError = function ErrnoError(errno, node) {
   this.node = node;
   this.setErrno = (function(errno) {
    this.errno = errno;
    for (var key in ERRNO_CODES) {
     if (ERRNO_CODES[key] === errno) {
      this.code = key;
      break;
     }
    }
   });
   this.setErrno(errno);
   this.message = ERRNO_MESSAGES[errno];
   if (this.stack) this.stack = demangleAll(this.stack);
  };
  FS.ErrnoError.prototype = new Error;
  FS.ErrnoError.prototype.constructor = FS.ErrnoError;
  [ ERRNO_CODES.ENOENT ].forEach((function(code) {
   FS.genericErrors[code] = new FS.ErrnoError(code);
   FS.genericErrors[code].stack = "<generic error, no stack>";
  }));
 }),
 staticInit: (function() {
  FS.ensureErrnoError();
  FS.nameTable = new Array(4096);
  FS.mount(MEMFS, {}, "/");
  FS.createDefaultDirectories();
  FS.createDefaultDevices();
  FS.createSpecialDirectories();
  FS.filesystems = {
   "MEMFS": MEMFS,
   "IDBFS": IDBFS,
   "NODEFS": NODEFS,
   "WORKERFS": WORKERFS
  };
 }),
 init: (function(input, output, error) {
  assert(!FS.init.initialized, "FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)");
  FS.init.initialized = true;
  FS.ensureErrnoError();
  Module["stdin"] = input || Module["stdin"];
  Module["stdout"] = output || Module["stdout"];
  Module["stderr"] = error || Module["stderr"];
  FS.createStandardStreams();
 }),
 quit: (function() {
  FS.init.initialized = false;
  var fflush = Module["_fflush"];
  if (fflush) fflush(0);
  for (var i = 0; i < FS.streams.length; i++) {
   var stream = FS.streams[i];
   if (!stream) {
    continue;
   }
   FS.close(stream);
  }
 }),
 getMode: (function(canRead, canWrite) {
  var mode = 0;
  if (canRead) mode |= 292 | 73;
  if (canWrite) mode |= 146;
  return mode;
 }),
 joinPath: (function(parts, forceRelative) {
  var path = PATH.join.apply(null, parts);
  if (forceRelative && path[0] == "/") path = path.substr(1);
  return path;
 }),
 absolutePath: (function(relative, base) {
  return PATH.resolve(base, relative);
 }),
 standardizePath: (function(path) {
  return PATH.normalize(path);
 }),
 findObject: (function(path, dontResolveLastLink) {
  var ret = FS.analyzePath(path, dontResolveLastLink);
  if (ret.exists) {
   return ret.object;
  } else {
   ___setErrNo(ret.error);
   return null;
  }
 }),
 analyzePath: (function(path, dontResolveLastLink) {
  try {
   var lookup = FS.lookupPath(path, {
    follow: !dontResolveLastLink
   });
   path = lookup.path;
  } catch (e) {}
  var ret = {
   isRoot: false,
   exists: false,
   error: 0,
   name: null,
   path: null,
   object: null,
   parentExists: false,
   parentPath: null,
   parentObject: null
  };
  try {
   var lookup = FS.lookupPath(path, {
    parent: true
   });
   ret.parentExists = true;
   ret.parentPath = lookup.path;
   ret.parentObject = lookup.node;
   ret.name = PATH.basename(path);
   lookup = FS.lookupPath(path, {
    follow: !dontResolveLastLink
   });
   ret.exists = true;
   ret.path = lookup.path;
   ret.object = lookup.node;
   ret.name = lookup.node.name;
   ret.isRoot = lookup.path === "/";
  } catch (e) {
   ret.error = e.errno;
  }
  return ret;
 }),
 createFolder: (function(parent, name, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(canRead, canWrite);
  return FS.mkdir(path, mode);
 }),
 createPath: (function(parent, path, canRead, canWrite) {
  parent = typeof parent === "string" ? parent : FS.getPath(parent);
  var parts = path.split("/").reverse();
  while (parts.length) {
   var part = parts.pop();
   if (!part) continue;
   var current = PATH.join2(parent, part);
   try {
    FS.mkdir(current);
   } catch (e) {}
   parent = current;
  }
  return current;
 }),
 createFile: (function(parent, name, properties, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(canRead, canWrite);
  return FS.create(path, mode);
 }),
 createDataFile: (function(parent, name, data, canRead, canWrite, canOwn) {
  var path = name ? PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name) : parent;
  var mode = FS.getMode(canRead, canWrite);
  var node = FS.create(path, mode);
  if (data) {
   if (typeof data === "string") {
    var arr = new Array(data.length);
    for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
    data = arr;
   }
   FS.chmod(node, mode | 146);
   var stream = FS.open(node, "w");
   FS.write(stream, data, 0, data.length, 0, canOwn);
   FS.close(stream);
   FS.chmod(node, mode);
  }
  return node;
 }),
 createDevice: (function(parent, name, input, output) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  var mode = FS.getMode(!!input, !!output);
  if (!FS.createDevice.major) FS.createDevice.major = 64;
  var dev = FS.makedev(FS.createDevice.major++, 0);
  FS.registerDevice(dev, {
   open: (function(stream) {
    stream.seekable = false;
   }),
   close: (function(stream) {
    if (output && output.buffer && output.buffer.length) {
     output(10);
    }
   }),
   read: (function(stream, buffer, offset, length, pos) {
    var bytesRead = 0;
    for (var i = 0; i < length; i++) {
     var result;
     try {
      result = input();
     } catch (e) {
      throw new FS.ErrnoError(ERRNO_CODES.EIO);
     }
     if (result === undefined && bytesRead === 0) {
      throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
     }
     if (result === null || result === undefined) break;
     bytesRead++;
     buffer[offset + i] = result;
    }
    if (bytesRead) {
     stream.node.timestamp = Date.now();
    }
    return bytesRead;
   }),
   write: (function(stream, buffer, offset, length, pos) {
    for (var i = 0; i < length; i++) {
     try {
      output(buffer[offset + i]);
     } catch (e) {
      throw new FS.ErrnoError(ERRNO_CODES.EIO);
     }
    }
    if (length) {
     stream.node.timestamp = Date.now();
    }
    return i;
   })
  });
  return FS.mkdev(path, mode, dev);
 }),
 createLink: (function(parent, name, target, canRead, canWrite) {
  var path = PATH.join2(typeof parent === "string" ? parent : FS.getPath(parent), name);
  return FS.symlink(target, path);
 }),
 forceLoadFile: (function(obj) {
  if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
  var success = true;
  if (typeof XMLHttpRequest !== "undefined") {
   throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
  } else if (Module["read"]) {
   try {
    obj.contents = intArrayFromString(Module["read"](obj.url), true);
    obj.usedBytes = obj.contents.length;
   } catch (e) {
    success = false;
   }
  } else {
   throw new Error("Cannot load without read() or XMLHttpRequest.");
  }
  if (!success) ___setErrNo(ERRNO_CODES.EIO);
  return success;
 }),
 createLazyFile: (function(parent, name, url, canRead, canWrite) {
  function LazyUint8Array() {
   this.lengthKnown = false;
   this.chunks = [];
  }
  LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
   if (idx > this.length - 1 || idx < 0) {
    return undefined;
   }
   var chunkOffset = idx % this.chunkSize;
   var chunkNum = idx / this.chunkSize | 0;
   return this.getter(chunkNum)[chunkOffset];
  };
  LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
   this.getter = getter;
  };
  LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
   var xhr = new XMLHttpRequest;
   xhr.open("HEAD", url, false);
   xhr.send(null);
   if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
   var datalength = Number(xhr.getResponseHeader("Content-length"));
   var header;
   var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
   var chunkSize = 1024 * 1024;
   if (!hasByteServing) chunkSize = datalength;
   var doXHR = (function(from, to) {
    if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
    if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
    var xhr = new XMLHttpRequest;
    xhr.open("GET", url, false);
    if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
    if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
    if (xhr.overrideMimeType) {
     xhr.overrideMimeType("text/plain; charset=x-user-defined");
    }
    xhr.send(null);
    if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
    if (xhr.response !== undefined) {
     return new Uint8Array(xhr.response || []);
    } else {
     return intArrayFromString(xhr.responseText || "", true);
    }
   });
   var lazyArray = this;
   lazyArray.setDataGetter((function(chunkNum) {
    var start = chunkNum * chunkSize;
    var end = (chunkNum + 1) * chunkSize - 1;
    end = Math.min(end, datalength - 1);
    if (typeof lazyArray.chunks[chunkNum] === "undefined") {
     lazyArray.chunks[chunkNum] = doXHR(start, end);
    }
    if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
    return lazyArray.chunks[chunkNum];
   }));
   this._length = datalength;
   this._chunkSize = chunkSize;
   this.lengthKnown = true;
  };
  if (typeof XMLHttpRequest !== "undefined") {
   if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
   var lazyArray = new LazyUint8Array;
   Object.defineProperty(lazyArray, "length", {
    get: (function() {
     if (!this.lengthKnown) {
      this.cacheLength();
     }
     return this._length;
    })
   });
   Object.defineProperty(lazyArray, "chunkSize", {
    get: (function() {
     if (!this.lengthKnown) {
      this.cacheLength();
     }
     return this._chunkSize;
    })
   });
   var properties = {
    isDevice: false,
    contents: lazyArray
   };
  } else {
   var properties = {
    isDevice: false,
    url: url
   };
  }
  var node = FS.createFile(parent, name, properties, canRead, canWrite);
  if (properties.contents) {
   node.contents = properties.contents;
  } else if (properties.url) {
   node.contents = null;
   node.url = properties.url;
  }
  Object.defineProperty(node, "usedBytes", {
   get: (function() {
    return this.contents.length;
   })
  });
  var stream_ops = {};
  var keys = Object.keys(node.stream_ops);
  keys.forEach((function(key) {
   var fn = node.stream_ops[key];
   stream_ops[key] = function forceLoadLazyFile() {
    if (!FS.forceLoadFile(node)) {
     throw new FS.ErrnoError(ERRNO_CODES.EIO);
    }
    return fn.apply(null, arguments);
   };
  }));
  stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
   if (!FS.forceLoadFile(node)) {
    throw new FS.ErrnoError(ERRNO_CODES.EIO);
   }
   var contents = stream.node.contents;
   if (position >= contents.length) return 0;
   var size = Math.min(contents.length - position, length);
   assert(size >= 0);
   if (contents.slice) {
    for (var i = 0; i < size; i++) {
     buffer[offset + i] = contents[position + i];
    }
   } else {
    for (var i = 0; i < size; i++) {
     buffer[offset + i] = contents.get(position + i);
    }
   }
   return size;
  };
  node.stream_ops = stream_ops;
  return node;
 }),
 createPreloadedFile: (function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
  Browser.init();
  var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
  var dep = getUniqueRunDependency("cp " + fullname);
  function processData(byteArray) {
   function finish(byteArray) {
    if (preFinish) preFinish();
    if (!dontCreateFile) {
     FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
    }
    if (onload) onload();
    removeRunDependency(dep);
   }
   var handled = false;
   Module["preloadPlugins"].forEach((function(plugin) {
    if (handled) return;
    if (plugin["canHandle"](fullname)) {
     plugin["handle"](byteArray, fullname, finish, (function() {
      if (onerror) onerror();
      removeRunDependency(dep);
     }));
     handled = true;
    }
   }));
   if (!handled) finish(byteArray);
  }
  addRunDependency(dep);
  if (typeof url == "string") {
   Browser.asyncLoad(url, (function(byteArray) {
    processData(byteArray);
   }), onerror);
  } else {
   processData(url);
  }
 }),
 indexedDB: (function() {
  return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
 }),
 DB_NAME: (function() {
  return "EM_FS_" + window.location.pathname;
 }),
 DB_VERSION: 20,
 DB_STORE_NAME: "FILE_DATA",
 saveFilesToDB: (function(paths, onload, onerror) {
  onload = onload || (function() {});
  onerror = onerror || (function() {});
  var indexedDB = FS.indexedDB();
  try {
   var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
   return onerror(e);
  }
  openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
   console.log("creating db");
   var db = openRequest.result;
   db.createObjectStore(FS.DB_STORE_NAME);
  };
  openRequest.onsuccess = function openRequest_onsuccess() {
   var db = openRequest.result;
   var transaction = db.transaction([ FS.DB_STORE_NAME ], "readwrite");
   var files = transaction.objectStore(FS.DB_STORE_NAME);
   var ok = 0, fail = 0, total = paths.length;
   function finish() {
    if (fail == 0) onload(); else onerror();
   }
   paths.forEach((function(path) {
    var putRequest = files.put(FS.analyzePath(path).object.contents, path);
    putRequest.onsuccess = function putRequest_onsuccess() {
     ok++;
     if (ok + fail == total) finish();
    };
    putRequest.onerror = function putRequest_onerror() {
     fail++;
     if (ok + fail == total) finish();
    };
   }));
   transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
 }),
 loadFilesFromDB: (function(paths, onload, onerror) {
  onload = onload || (function() {});
  onerror = onerror || (function() {});
  var indexedDB = FS.indexedDB();
  try {
   var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
  } catch (e) {
   return onerror(e);
  }
  openRequest.onupgradeneeded = onerror;
  openRequest.onsuccess = function openRequest_onsuccess() {
   var db = openRequest.result;
   try {
    var transaction = db.transaction([ FS.DB_STORE_NAME ], "readonly");
   } catch (e) {
    onerror(e);
    return;
   }
   var files = transaction.objectStore(FS.DB_STORE_NAME);
   var ok = 0, fail = 0, total = paths.length;
   function finish() {
    if (fail == 0) onload(); else onerror();
   }
   paths.forEach((function(path) {
    var getRequest = files.get(path);
    getRequest.onsuccess = function getRequest_onsuccess() {
     if (FS.analyzePath(path).exists) {
      FS.unlink(path);
     }
     FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
     ok++;
     if (ok + fail == total) finish();
    };
    getRequest.onerror = function getRequest_onerror() {
     fail++;
     if (ok + fail == total) finish();
    };
   }));
   transaction.onerror = onerror;
  };
  openRequest.onerror = onerror;
 })
};
var SYSCALLS = {
 DEFAULT_POLLMASK: 5,
 mappings: {},
 umask: 511,
 calculateAt: (function(dirfd, path) {
  if (path[0] !== "/") {
   var dir;
   if (dirfd === -100) {
    dir = FS.cwd();
   } else {
    var dirstream = FS.getStream(dirfd);
    if (!dirstream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
    dir = dirstream.path;
   }
   path = PATH.join2(dir, path);
  }
  return path;
 }),
 doStat: (function(func, path, buf) {
  try {
   var stat = func(path);
  } catch (e) {
   if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
    return -ERRNO_CODES.ENOTDIR;
   }
   throw e;
  }
  HEAP32[buf >> 2] = stat.dev;
  HEAP32[buf + 4 >> 2] = 0;
  HEAP32[buf + 8 >> 2] = stat.ino;
  HEAP32[buf + 12 >> 2] = stat.mode;
  HEAP32[buf + 16 >> 2] = stat.nlink;
  HEAP32[buf + 20 >> 2] = stat.uid;
  HEAP32[buf + 24 >> 2] = stat.gid;
  HEAP32[buf + 28 >> 2] = stat.rdev;
  HEAP32[buf + 32 >> 2] = 0;
  HEAP32[buf + 36 >> 2] = stat.size;
  HEAP32[buf + 40 >> 2] = 4096;
  HEAP32[buf + 44 >> 2] = stat.blocks;
  HEAP32[buf + 48 >> 2] = stat.atime.getTime() / 1e3 | 0;
  HEAP32[buf + 52 >> 2] = 0;
  HEAP32[buf + 56 >> 2] = stat.mtime.getTime() / 1e3 | 0;
  HEAP32[buf + 60 >> 2] = 0;
  HEAP32[buf + 64 >> 2] = stat.ctime.getTime() / 1e3 | 0;
  HEAP32[buf + 68 >> 2] = 0;
  HEAP32[buf + 72 >> 2] = stat.ino;
  return 0;
 }),
 doMsync: (function(addr, stream, len, flags) {
  var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
  FS.msync(stream, buffer, 0, len, flags);
 }),
 doMkdir: (function(path, mode) {
  path = PATH.normalize(path);
  if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
  FS.mkdir(path, mode, 0);
  return 0;
 }),
 doMknod: (function(path, mode, dev) {
  switch (mode & 61440) {
  case 32768:
  case 8192:
  case 24576:
  case 4096:
  case 49152:
   break;
  default:
   return -ERRNO_CODES.EINVAL;
  }
  FS.mknod(path, mode, dev);
  return 0;
 }),
 doReadlink: (function(path, buf, bufsize) {
  if (bufsize <= 0) return -ERRNO_CODES.EINVAL;
  var ret = FS.readlink(path);
  ret = ret.slice(0, Math.max(0, bufsize));
  writeStringToMemory(ret, buf, true);
  return ret.length;
 }),
 doAccess: (function(path, amode) {
  if (amode & ~7) {
   return -ERRNO_CODES.EINVAL;
  }
  var node;
  var lookup = FS.lookupPath(path, {
   follow: true
  });
  node = lookup.node;
  var perms = "";
  if (amode & 4) perms += "r";
  if (amode & 2) perms += "w";
  if (amode & 1) perms += "x";
  if (perms && FS.nodePermissions(node, perms)) {
   return -ERRNO_CODES.EACCES;
  }
  return 0;
 }),
 doDup: (function(path, flags, suggestFD) {
  var suggest = FS.getStream(suggestFD);
  if (suggest) FS.close(suggest);
  return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
 }),
 doReadv: (function(stream, iov, iovcnt, offset) {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
   var ptr = HEAP32[iov + i * 8 >> 2];
   var len = HEAP32[iov + (i * 8 + 4) >> 2];
   var curr = FS.read(stream, HEAP8, ptr, len, offset);
   if (curr < 0) return -1;
   ret += curr;
   if (curr < len) break;
  }
  return ret;
 }),
 doWritev: (function(stream, iov, iovcnt, offset) {
  var ret = 0;
  for (var i = 0; i < iovcnt; i++) {
   var ptr = HEAP32[iov + i * 8 >> 2];
   var len = HEAP32[iov + (i * 8 + 4) >> 2];
   var curr = FS.write(stream, HEAP8, ptr, len, offset);
   if (curr < 0) return -1;
   ret += curr;
  }
  return ret;
 }),
 varargs: 0,
 get: (function(varargs) {
  SYSCALLS.varargs += 4;
  var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
  return ret;
 }),
 getStr: (function() {
  var ret = Pointer_stringify(SYSCALLS.get());
  return ret;
 }),
 getStreamFromFD: (function() {
  var stream = FS.getStream(SYSCALLS.get());
  if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  return stream;
 }),
 getSocketFromFD: (function() {
  var socket = SOCKFS.getSocket(SYSCALLS.get());
  if (!socket) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
  return socket;
 }),
 getSocketAddress: (function(allowNull) {
  var addrp = SYSCALLS.get(), addrlen = SYSCALLS.get();
  if (allowNull && addrp === 0) return null;
  var info = __read_sockaddr(addrp, addrlen);
  if (info.errno) throw new FS.ErrnoError(info.errno);
  info.addr = DNS.lookup_addr(info.addr) || info.addr;
  return info;
 }),
 get64: (function() {
  var low = SYSCALLS.get(), high = SYSCALLS.get();
  if (low >= 0) assert(high === 0); else assert(high === -1);
  return low;
 }),
 getZero: (function() {
  assert(SYSCALLS.get() === 0);
 })
};
function ___syscall54(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), op = SYSCALLS.get();
  switch (op) {
  case 21505:
   {
    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
    return 0;
   }
  case 21506:
   {
    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
    return 0;
   }
  case 21519:
   {
    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
    var argp = SYSCALLS.get();
    HEAP32[argp >> 2] = 0;
    return 0;
   }
  case 21520:
   {
    if (!stream.tty) return -ERRNO_CODES.ENOTTY;
    return -ERRNO_CODES.EINVAL;
   }
  case 21531:
   {
    var argp = SYSCALLS.get();
    return FS.ioctl(stream, op, argp);
   }
  default:
   abort("bad ioctl syscall " + op);
  }
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
Module["_bitshift64Lshr"] = _bitshift64Lshr;
var _BDtoIHigh = true;
function _pthread_cleanup_push(routine, arg) {
 __ATEXIT__.push((function() {
  Runtime.dynCall("vi", routine, [ arg ]);
 }));
 _pthread_cleanup_push.level = __ATEXIT__.length;
}
var _emscripten_resume = true;
function _pthread_cleanup_pop() {
 assert(_pthread_cleanup_push.level == __ATEXIT__.length, "cannot pop if something else added meanwhile!");
 __ATEXIT__.pop();
 _pthread_cleanup_push.level = __ATEXIT__.length;
}
function _emscripten_memcpy_big(dest, src, num) {
 HEAPU8.set(HEAPU8.subarray(src, src + num), dest);
 return dest;
}
Module["_memcpy"] = _memcpy;
function __embind_register_enum_value(rawEnumType, name, enumValue) {
 var enumType = requireRegisteredType(rawEnumType, "enum");
 name = readLatin1String(name);
 var Enum = enumType.constructor;
 var Value = Object.create(enumType.constructor.prototype, {
  value: {
   value: enumValue
  },
  constructor: {
   value: createNamedFunction(enumType.name + "_" + name, (function() {}))
  }
 });
 Enum.values[enumValue] = Value;
 Enum[name] = Value;
}
function _sbrk(bytes) {
 var self = _sbrk;
 if (!self.called) {
  DYNAMICTOP = alignMemoryPage(DYNAMICTOP);
  self.called = true;
  assert(Runtime.dynamicAlloc);
  self.alloc = Runtime.dynamicAlloc;
  Runtime.dynamicAlloc = (function() {
   abort("cannot dynamically allocate, sbrk now has control");
  });
 }
 var ret = DYNAMICTOP;
 if (bytes != 0) {
  var success = self.alloc(bytes);
  if (!success) return -1 >>> 0;
 }
 return ret;
}
Module["_memmove"] = _memmove;
var _emscripten_preinvoke = true;
var _BItoD = true;
function __embind_register_memory_view(rawType, dataTypeIndex, name) {
 var typeMapping = [ Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array ];
 var TA = typeMapping[dataTypeIndex];
 function decodeMemoryView(handle) {
  handle = handle >> 2;
  var heap = HEAPU32;
  var size = heap[handle];
  var data = heap[handle + 1];
  return new TA(heap["buffer"], data, size);
 }
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": decodeMemoryView,
  "argPackAdvance": 8,
  "readValueFromPointer": decodeMemoryView
 }, {
  ignoreDuplicateRegistrations: true
 });
}
function ensureOverloadTable(proto, methodName, humanName) {
 if (undefined === proto[methodName].overloadTable) {
  var prevFunc = proto[methodName];
  proto[methodName] = (function() {
   if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
    throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!");
   }
   return proto[methodName].overloadTable[arguments.length].apply(this, arguments);
  });
  proto[methodName].overloadTable = [];
  proto[methodName].overloadTable[prevFunc.argCount] = prevFunc;
 }
}
function exposePublicSymbol(name, value, numArguments) {
 if (Module.hasOwnProperty(name)) {
  if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
   throwBindingError("Cannot register public name '" + name + "' twice");
  }
  ensureOverloadTable(Module, name, name);
  if (Module.hasOwnProperty(numArguments)) {
   throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!");
  }
  Module[name].overloadTable[numArguments] = value;
 } else {
  Module[name] = value;
  if (undefined !== numArguments) {
   Module[name].numArguments = numArguments;
  }
 }
}
function enumReadValueFromPointer(name, shift, signed) {
 switch (shift) {
 case 0:
  return (function(pointer) {
   var heap = signed ? HEAP8 : HEAPU8;
   return this["fromWireType"](heap[pointer]);
  });
 case 1:
  return (function(pointer) {
   var heap = signed ? HEAP16 : HEAPU16;
   return this["fromWireType"](heap[pointer >> 1]);
  });
 case 2:
  return (function(pointer) {
   var heap = signed ? HEAP32 : HEAPU32;
   return this["fromWireType"](heap[pointer >> 2]);
  });
 default:
  throw new TypeError("Unknown integer type: " + name);
 }
}
function __embind_register_enum(rawType, name, size, isSigned) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 function constructor() {}
 constructor.values = {};
 registerType(rawType, {
  name: name,
  constructor: constructor,
  "fromWireType": (function(c) {
   return this.constructor.values[c];
  }),
  "toWireType": (function(destructors, c) {
   return c.value;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": enumReadValueFromPointer(name, shift, isSigned),
  destructorFunction: null
 });
 exposePublicSymbol(name, constructor);
}
function ___cxa_free_exception(ptr) {
 try {
  return _free(ptr);
 } catch (e) {
  Module.printErr("exception during cxa_free_exception: " + e);
 }
}
function ___cxa_end_catch() {
 if (___cxa_end_catch.rethrown) {
  ___cxa_end_catch.rethrown = false;
  return;
 }
 asm["setThrew"](0);
 var ptr = EXCEPTIONS.caught.pop();
 if (ptr) {
  EXCEPTIONS.decRef(EXCEPTIONS.deAdjust(ptr));
  EXCEPTIONS.last = 0;
 }
}
var structRegistrations = {};
function requireFunction(signature, rawFunction) {
 signature = readLatin1String(signature);
 function makeDynCaller(dynCall) {
  var args = [];
  for (var i = 1; i < signature.length; ++i) {
   args.push("a" + i);
  }
  var name = "dynCall_" + signature + "_" + rawFunction;
  var body = "return function " + name + "(" + args.join(", ") + ") {\n";
  body += "    return dynCall(rawFunction" + (args.length ? ", " : "") + args.join(", ") + ");\n";
  body += "};\n";
  return (new Function("dynCall", "rawFunction", body))(dynCall, rawFunction);
 }
 var fp;
 if (Module["FUNCTION_TABLE_" + signature] !== undefined) {
  fp = Module["FUNCTION_TABLE_" + signature][rawFunction];
 } else if (typeof FUNCTION_TABLE !== "undefined") {
  fp = FUNCTION_TABLE[rawFunction];
 } else {
  var dc = asm["dynCall_" + signature];
  if (dc === undefined) {
   dc = asm["dynCall_" + signature.replace(/f/g, "d")];
   if (dc === undefined) {
    throwBindingError("No dynCall invoker for signature: " + signature);
   }
  }
  fp = makeDynCaller(dc);
 }
 if (typeof fp !== "function") {
  throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction);
 }
 return fp;
}
function __embind_register_value_object(rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) {
 structRegistrations[rawType] = {
  name: readLatin1String(name),
  rawConstructor: requireFunction(constructorSignature, rawConstructor),
  rawDestructor: requireFunction(destructorSignature, rawDestructor),
  fields: []
 };
}
function ___assert_fail(condition, filename, line, func) {
 ABORT = true;
 throw "Assertion failed: " + Pointer_stringify(condition) + ", at: " + [ filename ? Pointer_stringify(filename) : "unknown filename", line, func ? Pointer_stringify(func) : "unknown function" ] + " at " + stackTrace();
}
function __embind_register_void(rawType, name) {
 name = readLatin1String(name);
 registerType(rawType, {
  isVoid: true,
  name: name,
  "argPackAdvance": 0,
  "fromWireType": (function() {
   return undefined;
  }),
  "toWireType": (function(destructors, o) {
   return undefined;
  })
 });
}
Module["_memset"] = _memset;
var _BDtoILow = true;
function ___gxx_personality_v0() {}
Module["_bitshift64Shl"] = _bitshift64Shl;
function _abort() {
 Module["abort"]();
}
function _pthread_once(ptr, func) {
 if (!_pthread_once.seen) _pthread_once.seen = {};
 if (ptr in _pthread_once.seen) return;
 Runtime.dynCall("v", func);
 _pthread_once.seen[ptr] = 1;
}
function __embind_register_value_object_field(structType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
 structRegistrations[structType].fields.push({
  fieldName: readLatin1String(fieldName),
  getterReturnType: getterReturnType,
  getter: requireFunction(getterSignature, getter),
  getterContext: getterContext,
  setterArgumentType: setterArgumentType,
  setter: requireFunction(setterSignature, setter),
  setterContext: setterContext
 });
}
function ClassHandle_isAliasOf(other) {
 if (!(this instanceof ClassHandle)) {
  return false;
 }
 if (!(other instanceof ClassHandle)) {
  return false;
 }
 var leftClass = this.$$.ptrType.registeredClass;
 var left = this.$$.ptr;
 var rightClass = other.$$.ptrType.registeredClass;
 var right = other.$$.ptr;
 while (leftClass.baseClass) {
  left = leftClass.upcast(left);
  leftClass = leftClass.baseClass;
 }
 while (rightClass.baseClass) {
  right = rightClass.upcast(right);
  rightClass = rightClass.baseClass;
 }
 return leftClass === rightClass && left === right;
}
function shallowCopyInternalPointer(o) {
 return {
  count: o.count,
  deleteScheduled: o.deleteScheduled,
  preservePointerOnDelete: o.preservePointerOnDelete,
  ptr: o.ptr,
  ptrType: o.ptrType,
  smartPtr: o.smartPtr,
  smartPtrType: o.smartPtrType
 };
}
function throwInstanceAlreadyDeleted(obj) {
 function getInstanceTypeName(handle) {
  return handle.$$.ptrType.registeredClass.name;
 }
 throwBindingError(getInstanceTypeName(obj) + " instance already deleted");
}
function ClassHandle_clone() {
 if (!this.$$.ptr) {
  throwInstanceAlreadyDeleted(this);
 }
 if (this.$$.preservePointerOnDelete) {
  this.$$.count.value += 1;
  return this;
 } else {
  var clone = Object.create(Object.getPrototypeOf(this), {
   $$: {
    value: shallowCopyInternalPointer(this.$$)
   }
  });
  clone.$$.count.value += 1;
  clone.$$.deleteScheduled = false;
  return clone;
 }
}
function runDestructor(handle) {
 var $$ = handle.$$;
 if ($$.smartPtr) {
  $$.smartPtrType.rawDestructor($$.smartPtr);
 } else {
  $$.ptrType.registeredClass.rawDestructor($$.ptr);
 }
}
function ClassHandle_delete() {
 if (!this.$$.ptr) {
  throwInstanceAlreadyDeleted(this);
 }
 if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
  throwBindingError("Object already scheduled for deletion");
 }
 this.$$.count.value -= 1;
 var toDelete = 0 === this.$$.count.value;
 if (toDelete) {
  runDestructor(this);
 }
 if (!this.$$.preservePointerOnDelete) {
  this.$$.smartPtr = undefined;
  this.$$.ptr = undefined;
 }
}
function ClassHandle_isDeleted() {
 return !this.$$.ptr;
}
var delayFunction = undefined;
var deletionQueue = [];
function flushPendingDeletes() {
 while (deletionQueue.length) {
  var obj = deletionQueue.pop();
  obj.$$.deleteScheduled = false;
  obj["delete"]();
 }
}
function ClassHandle_deleteLater() {
 if (!this.$$.ptr) {
  throwInstanceAlreadyDeleted(this);
 }
 if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
  throwBindingError("Object already scheduled for deletion");
 }
 deletionQueue.push(this);
 if (deletionQueue.length === 1 && delayFunction) {
  delayFunction(flushPendingDeletes);
 }
 this.$$.deleteScheduled = true;
 return this;
}
function init_ClassHandle() {
 ClassHandle.prototype["isAliasOf"] = ClassHandle_isAliasOf;
 ClassHandle.prototype["clone"] = ClassHandle_clone;
 ClassHandle.prototype["delete"] = ClassHandle_delete;
 ClassHandle.prototype["isDeleted"] = ClassHandle_isDeleted;
 ClassHandle.prototype["deleteLater"] = ClassHandle_deleteLater;
}
function ClassHandle() {}
var registeredPointers = {};
function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
 this.name = name;
 this.constructor = constructor;
 this.instancePrototype = instancePrototype;
 this.rawDestructor = rawDestructor;
 this.baseClass = baseClass;
 this.getActualType = getActualType;
 this.upcast = upcast;
 this.downcast = downcast;
 this.pureVirtualFunctions = [];
}
function upcastPointer(ptr, ptrClass, desiredClass) {
 while (ptrClass !== desiredClass) {
  if (!ptrClass.upcast) {
   throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name);
  }
  ptr = ptrClass.upcast(ptr);
  ptrClass = ptrClass.baseClass;
 }
 return ptr;
}
function constNoSmartPtrRawPointerToWireType(destructors, handle) {
 if (handle === null) {
  if (this.isReference) {
   throwBindingError("null is not a valid " + this.name);
  }
  return 0;
 }
 if (!handle.$$) {
  throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
 }
 if (!handle.$$.ptr) {
  throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
 }
 var handleClass = handle.$$.ptrType.registeredClass;
 var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
 return ptr;
}
function genericPointerToWireType(destructors, handle) {
 if (handle === null) {
  if (this.isReference) {
   throwBindingError("null is not a valid " + this.name);
  }
  if (this.isSmartPointer) {
   var ptr = this.rawConstructor();
   if (destructors !== null) {
    destructors.push(this.rawDestructor, ptr);
   }
   return ptr;
  } else {
   return 0;
  }
 }
 if (!handle.$$) {
  throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
 }
 if (!handle.$$.ptr) {
  throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
 }
 if (!this.isConst && handle.$$.ptrType.isConst) {
  throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name);
 }
 var handleClass = handle.$$.ptrType.registeredClass;
 var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
 if (this.isSmartPointer) {
  if (undefined === handle.$$.smartPtr) {
   throwBindingError("Passing raw pointer to smart pointer is illegal");
  }
  switch (this.sharingPolicy) {
  case 0:
   if (handle.$$.smartPtrType === this) {
    ptr = handle.$$.smartPtr;
   } else {
    throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name : handle.$$.ptrType.name) + " to parameter type " + this.name);
   }
   break;
  case 1:
   ptr = handle.$$.smartPtr;
   break;
  case 2:
   if (handle.$$.smartPtrType === this) {
    ptr = handle.$$.smartPtr;
   } else {
    var clonedHandle = handle["clone"]();
    ptr = this.rawShare(ptr, __emval_register((function() {
     clonedHandle["delete"]();
    })));
    if (destructors !== null) {
     destructors.push(this.rawDestructor, ptr);
    }
   }
   break;
  default:
   throwBindingError("Unsupporting sharing policy");
  }
 }
 return ptr;
}
function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
 if (handle === null) {
  if (this.isReference) {
   throwBindingError("null is not a valid " + this.name);
  }
  return 0;
 }
 if (!handle.$$) {
  throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name);
 }
 if (!handle.$$.ptr) {
  throwBindingError("Cannot pass deleted object as a pointer of type " + this.name);
 }
 if (handle.$$.ptrType.isConst) {
  throwBindingError("Cannot convert argument of type " + handle.$$.ptrType.name + " to parameter type " + this.name);
 }
 var handleClass = handle.$$.ptrType.registeredClass;
 var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
 return ptr;
}
function RegisteredPointer_getPointee(ptr) {
 if (this.rawGetPointee) {
  ptr = this.rawGetPointee(ptr);
 }
 return ptr;
}
function RegisteredPointer_destructor(ptr) {
 if (this.rawDestructor) {
  this.rawDestructor(ptr);
 }
}
function RegisteredPointer_deleteObject(handle) {
 if (handle !== null) {
  handle["delete"]();
 }
}
function downcastPointer(ptr, ptrClass, desiredClass) {
 if (ptrClass === desiredClass) {
  return ptr;
 }
 if (undefined === desiredClass.baseClass) {
  return null;
 }
 var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
 if (rv === null) {
  return null;
 }
 return desiredClass.downcast(rv);
}
function getInheritedInstanceCount() {
 return Object.keys(registeredInstances).length;
}
function getLiveInheritedInstances() {
 var rv = [];
 for (var k in registeredInstances) {
  if (registeredInstances.hasOwnProperty(k)) {
   rv.push(registeredInstances[k]);
  }
 }
 return rv;
}
function setDelayFunction(fn) {
 delayFunction = fn;
 if (deletionQueue.length && delayFunction) {
  delayFunction(flushPendingDeletes);
 }
}
function init_embind() {
 Module["getInheritedInstanceCount"] = getInheritedInstanceCount;
 Module["getLiveInheritedInstances"] = getLiveInheritedInstances;
 Module["flushPendingDeletes"] = flushPendingDeletes;
 Module["setDelayFunction"] = setDelayFunction;
}
var registeredInstances = {};
function getBasestPointer(class_, ptr) {
 if (ptr === undefined) {
  throwBindingError("ptr should not be undefined");
 }
 while (class_.baseClass) {
  ptr = class_.upcast(ptr);
  class_ = class_.baseClass;
 }
 return ptr;
}
function getInheritedInstance(class_, ptr) {
 ptr = getBasestPointer(class_, ptr);
 return registeredInstances[ptr];
}
var _throwInternalError = undefined;
function makeClassHandle(prototype, record) {
 if (!record.ptrType || !record.ptr) {
  throwInternalError("makeClassHandle requires ptr and ptrType");
 }
 var hasSmartPtrType = !!record.smartPtrType;
 var hasSmartPtr = !!record.smartPtr;
 if (hasSmartPtrType !== hasSmartPtr) {
  throwInternalError("Both smartPtrType and smartPtr must be specified");
 }
 record.count = {
  value: 1
 };
 return Object.create(prototype, {
  $$: {
   value: record
  }
 });
}
function RegisteredPointer_fromWireType(ptr) {
 var rawPointer = this.getPointee(ptr);
 if (!rawPointer) {
  this.destructor(ptr);
  return null;
 }
 var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
 if (undefined !== registeredInstance) {
  if (0 === registeredInstance.$$.count.value) {
   registeredInstance.$$.ptr = rawPointer;
   registeredInstance.$$.smartPtr = ptr;
   return registeredInstance["clone"]();
  } else {
   var rv = registeredInstance["clone"]();
   this.destructor(ptr);
   return rv;
  }
 }
 function makeDefaultHandle() {
  if (this.isSmartPointer) {
   return makeClassHandle(this.registeredClass.instancePrototype, {
    ptrType: this.pointeeType,
    ptr: rawPointer,
    smartPtrType: this,
    smartPtr: ptr
   });
  } else {
   return makeClassHandle(this.registeredClass.instancePrototype, {
    ptrType: this,
    ptr: ptr
   });
  }
 }
 var actualType = this.registeredClass.getActualType(rawPointer);
 var registeredPointerRecord = registeredPointers[actualType];
 if (!registeredPointerRecord) {
  return makeDefaultHandle.call(this);
 }
 var toType;
 if (this.isConst) {
  toType = registeredPointerRecord.constPointerType;
 } else {
  toType = registeredPointerRecord.pointerType;
 }
 var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
 if (dp === null) {
  return makeDefaultHandle.call(this);
 }
 if (this.isSmartPointer) {
  return makeClassHandle(toType.registeredClass.instancePrototype, {
   ptrType: toType,
   ptr: dp,
   smartPtrType: this,
   smartPtr: ptr
  });
 } else {
  return makeClassHandle(toType.registeredClass.instancePrototype, {
   ptrType: toType,
   ptr: dp
  });
 }
}
function init_RegisteredPointer() {
 RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
 RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
 RegisteredPointer.prototype["argPackAdvance"] = 8;
 RegisteredPointer.prototype["readValueFromPointer"] = simpleReadValueFromPointer;
 RegisteredPointer.prototype["deleteObject"] = RegisteredPointer_deleteObject;
 RegisteredPointer.prototype["fromWireType"] = RegisteredPointer_fromWireType;
}
function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
 this.name = name;
 this.registeredClass = registeredClass;
 this.isReference = isReference;
 this.isConst = isConst;
 this.isSmartPointer = isSmartPointer;
 this.pointeeType = pointeeType;
 this.sharingPolicy = sharingPolicy;
 this.rawGetPointee = rawGetPointee;
 this.rawConstructor = rawConstructor;
 this.rawShare = rawShare;
 this.rawDestructor = rawDestructor;
 if (!isSmartPointer && registeredClass.baseClass === undefined) {
  if (isConst) {
   this["toWireType"] = constNoSmartPtrRawPointerToWireType;
   this.destructorFunction = null;
  } else {
   this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
   this.destructorFunction = null;
  }
 } else {
  this["toWireType"] = genericPointerToWireType;
 }
}
function replacePublicSymbol(name, value, numArguments) {
 if (!Module.hasOwnProperty(name)) {
  throwInternalError("Replacing nonexistant public symbol");
 }
 if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
  Module[name].overloadTable[numArguments] = value;
 } else {
  Module[name] = value;
 }
}
var UnboundTypeError = undefined;
function throwUnboundTypeError(message, types) {
 var unboundTypes = [];
 var seen = {};
 function visit(type) {
  if (seen[type]) {
   return;
  }
  if (registeredTypes[type]) {
   return;
  }
  if (typeDependencies[type]) {
   typeDependencies[type].forEach(visit);
   return;
  }
  unboundTypes.push(type);
  seen[type] = true;
 }
 types.forEach(visit);
 throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([ ", " ]));
}
function __embind_register_class(rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) {
 name = readLatin1String(name);
 getActualType = requireFunction(getActualTypeSignature, getActualType);
 if (upcast) {
  upcast = requireFunction(upcastSignature, upcast);
 }
 if (downcast) {
  downcast = requireFunction(downcastSignature, downcast);
 }
 rawDestructor = requireFunction(destructorSignature, rawDestructor);
 var legalFunctionName = makeLegalFunctionName(name);
 exposePublicSymbol(legalFunctionName, (function() {
  throwUnboundTypeError("Cannot construct " + name + " due to unbound types", [ baseClassRawType ]);
 }));
 whenDependentTypesAreResolved([ rawType, rawPointerType, rawConstPointerType ], baseClassRawType ? [ baseClassRawType ] : [], (function(base) {
  base = base[0];
  var baseClass;
  var basePrototype;
  if (baseClassRawType) {
   baseClass = base.registeredClass;
   basePrototype = baseClass.instancePrototype;
  } else {
   basePrototype = ClassHandle.prototype;
  }
  var constructor = createNamedFunction(legalFunctionName, (function() {
   if (Object.getPrototypeOf(this) !== instancePrototype) {
    throw new BindingError("Use 'new' to construct " + name);
   }
   if (undefined === registeredClass.constructor_body) {
    throw new BindingError(name + " has no accessible constructor");
   }
   var body = registeredClass.constructor_body[arguments.length];
   if (undefined === body) {
    throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!");
   }
   return body.apply(this, arguments);
  }));
  var instancePrototype = Object.create(basePrototype, {
   constructor: {
    value: constructor
   }
  });
  constructor.prototype = instancePrototype;
  var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
  var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
  var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
  var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
  registeredPointers[rawType] = {
   pointerType: pointerConverter,
   constPointerType: constPointerConverter
  };
  replacePublicSymbol(legalFunctionName, constructor);
  return [ referenceConverter, pointerConverter, constPointerConverter ];
 }));
}
function ___lock() {}
function ___unlock() {}
function _pthread_getspecific(key) {
 return PTHREAD_SPECIFIC[key] || 0;
}
var _fabs = Math_abs;
var _sqrt = Math_sqrt;
function _embind_repr(v) {
 if (v === null) {
  return "null";
 }
 var t = typeof v;
 if (t === "object" || t === "array" || t === "function") {
  return v.toString();
 } else {
  return "" + v;
 }
}
function integerReadValueFromPointer(name, shift, signed) {
 switch (shift) {
 case 0:
  return signed ? function readS8FromPointer(pointer) {
   return HEAP8[pointer];
  } : function readU8FromPointer(pointer) {
   return HEAPU8[pointer];
  };
 case 1:
  return signed ? function readS16FromPointer(pointer) {
   return HEAP16[pointer >> 1];
  } : function readU16FromPointer(pointer) {
   return HEAPU16[pointer >> 1];
  };
 case 2:
  return signed ? function readS32FromPointer(pointer) {
   return HEAP32[pointer >> 2];
  } : function readU32FromPointer(pointer) {
   return HEAPU32[pointer >> 2];
  };
 default:
  throw new TypeError("Unknown integer type: " + name);
 }
}
function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
 name = readLatin1String(name);
 if (maxRange === -1) {
  maxRange = 4294967295;
 }
 var shift = getShiftFromSize(size);
 var fromWireType = (function(value) {
  return value;
 });
 if (minRange === 0) {
  var bitshift = 32 - 8 * size;
  fromWireType = (function(value) {
   return value << bitshift >>> bitshift;
  });
 }
 registerType(primitiveType, {
  name: name,
  "fromWireType": fromWireType,
  "toWireType": (function(destructors, value) {
   if (typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
   }
   if (value < minRange || value > maxRange) {
    throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!");
   }
   return value | 0;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
  destructorFunction: null
 });
}
function _emscripten_set_main_loop_timing(mode, value) {
 Browser.mainLoop.timingMode = mode;
 Browser.mainLoop.timingValue = value;
 if (!Browser.mainLoop.func) {
  console.error("emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist! Call emscripten_set_main_loop first to set one up.");
  return 1;
 }
 if (mode == 0) {
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
   setTimeout(Browser.mainLoop.runner, value);
  };
  Browser.mainLoop.method = "timeout";
 } else if (mode == 1) {
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
   Browser.requestAnimationFrame(Browser.mainLoop.runner);
  };
  Browser.mainLoop.method = "rAF";
 } else if (mode == 2) {
  if (!window["setImmediate"]) {
   var setImmediates = [];
   var emscriptenMainLoopMessageId = "__emcc";
   function Browser_setImmediate_messageHandler(event) {
    if (event.source === window && event.data === emscriptenMainLoopMessageId) {
     event.stopPropagation();
     setImmediates.shift()();
    }
   }
   window.addEventListener("message", Browser_setImmediate_messageHandler, true);
   window["setImmediate"] = function Browser_emulated_setImmediate(func) {
    setImmediates.push(func);
    window.postMessage(emscriptenMainLoopMessageId, "*");
   };
  }
  Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
   window["setImmediate"](Browser.mainLoop.runner);
  };
  Browser.mainLoop.method = "immediate";
 }
 return 0;
}
function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
 Module["noExitRuntime"] = true;
 assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
 Browser.mainLoop.func = func;
 Browser.mainLoop.arg = arg;
 var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
 Browser.mainLoop.runner = function Browser_mainLoop_runner() {
  if (ABORT) return;
  if (Browser.mainLoop.queue.length > 0) {
   var start = Date.now();
   var blocker = Browser.mainLoop.queue.shift();
   blocker.func(blocker.arg);
   if (Browser.mainLoop.remainingBlockers) {
    var remaining = Browser.mainLoop.remainingBlockers;
    var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
    if (blocker.counted) {
     Browser.mainLoop.remainingBlockers = next;
    } else {
     next = next + .5;
     Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9;
    }
   }
   console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
   Browser.mainLoop.updateStatus();
   setTimeout(Browser.mainLoop.runner, 0);
   return;
  }
  if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
  if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
   Browser.mainLoop.scheduler();
   return;
  }
  if (Browser.mainLoop.method === "timeout" && Module.ctx) {
   Module.printErr("Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!");
   Browser.mainLoop.method = "";
  }
  Browser.mainLoop.runIter((function() {
   if (typeof arg !== "undefined") {
    Runtime.dynCall("vi", func, [ arg ]);
   } else {
    Runtime.dynCall("v", func);
   }
  }));
  if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  if (typeof SDL === "object" && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  Browser.mainLoop.scheduler();
 };
 if (!noSetTiming) {
  if (fps && fps > 0) _emscripten_set_main_loop_timing(0, 1e3 / fps); else _emscripten_set_main_loop_timing(1, 1);
  Browser.mainLoop.scheduler();
 }
 if (simulateInfiniteLoop) {
  throw "SimulateInfiniteLoop";
 }
}
var Browser = {
 mainLoop: {
  scheduler: null,
  method: "",
  currentlyRunningMainloop: 0,
  func: null,
  arg: 0,
  timingMode: 0,
  timingValue: 0,
  currentFrameNumber: 0,
  queue: [],
  pause: (function() {
   Browser.mainLoop.scheduler = null;
   Browser.mainLoop.currentlyRunningMainloop++;
  }),
  resume: (function() {
   Browser.mainLoop.currentlyRunningMainloop++;
   var timingMode = Browser.mainLoop.timingMode;
   var timingValue = Browser.mainLoop.timingValue;
   var func = Browser.mainLoop.func;
   Browser.mainLoop.func = null;
   _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true);
   _emscripten_set_main_loop_timing(timingMode, timingValue);
   Browser.mainLoop.scheduler();
  }),
  updateStatus: (function() {
   if (Module["setStatus"]) {
    var message = Module["statusMessage"] || "Please wait...";
    var remaining = Browser.mainLoop.remainingBlockers;
    var expected = Browser.mainLoop.expectedBlockers;
    if (remaining) {
     if (remaining < expected) {
      Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")");
     } else {
      Module["setStatus"](message);
     }
    } else {
     Module["setStatus"]("");
    }
   }
  }),
  runIter: (function(func) {
   if (ABORT) return;
   if (Module["preMainLoop"]) {
    var preRet = Module["preMainLoop"]();
    if (preRet === false) {
     return;
    }
   }
   try {
    func();
   } catch (e) {
    if (e instanceof ExitStatus) {
     return;
    } else {
     if (e && typeof e === "object" && e.stack) Module.printErr("exception thrown: " + [ e, e.stack ]);
     throw e;
    }
   }
   if (Module["postMainLoop"]) Module["postMainLoop"]();
  })
 },
 isFullScreen: false,
 pointerLock: false,
 moduleContextCreatedCallbacks: [],
 workers: [],
 init: (function() {
  if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
  if (Browser.initted) return;
  Browser.initted = true;
  try {
   new Blob;
   Browser.hasBlobConstructor = true;
  } catch (e) {
   Browser.hasBlobConstructor = false;
   console.log("warning: no blob constructor, cannot create blobs with mimetypes");
  }
  Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : !Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null;
  Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL : window.webkitURL : undefined;
  if (!Module.noImageDecoding && typeof Browser.URLObject === "undefined") {
   console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
   Module.noImageDecoding = true;
  }
  var imagePlugin = {};
  imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
   return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
  };
  imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
   var b = null;
   if (Browser.hasBlobConstructor) {
    try {
     b = new Blob([ byteArray ], {
      type: Browser.getMimetype(name)
     });
     if (b.size !== byteArray.length) {
      b = new Blob([ (new Uint8Array(byteArray)).buffer ], {
       type: Browser.getMimetype(name)
      });
     }
    } catch (e) {
     Runtime.warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder");
    }
   }
   if (!b) {
    var bb = new Browser.BlobBuilder;
    bb.append((new Uint8Array(byteArray)).buffer);
    b = bb.getBlob();
   }
   var url = Browser.URLObject.createObjectURL(b);
   assert(typeof url == "string", "createObjectURL must return a url as a string");
   var img = new Image;
   img.onload = function img_onload() {
    assert(img.complete, "Image " + name + " could not be decoded");
    var canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    Module["preloadedImages"][name] = canvas;
    Browser.URLObject.revokeObjectURL(url);
    if (onload) onload(byteArray);
   };
   img.onerror = function img_onerror(event) {
    console.log("Image " + url + " could not be decoded");
    if (onerror) onerror();
   };
   img.src = url;
  };
  Module["preloadPlugins"].push(imagePlugin);
  var audioPlugin = {};
  audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
   return !Module.noAudioDecoding && name.substr(-4) in {
    ".ogg": 1,
    ".wav": 1,
    ".mp3": 1
   };
  };
  audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
   var done = false;
   function finish(audio) {
    if (done) return;
    done = true;
    Module["preloadedAudios"][name] = audio;
    if (onload) onload(byteArray);
   }
   function fail() {
    if (done) return;
    done = true;
    Module["preloadedAudios"][name] = new Audio;
    if (onerror) onerror();
   }
   if (Browser.hasBlobConstructor) {
    try {
     var b = new Blob([ byteArray ], {
      type: Browser.getMimetype(name)
     });
    } catch (e) {
     return fail();
    }
    var url = Browser.URLObject.createObjectURL(b);
    assert(typeof url == "string", "createObjectURL must return a url as a string");
    var audio = new Audio;
    audio.addEventListener("canplaythrough", (function() {
     finish(audio);
    }), false);
    audio.onerror = function audio_onerror(event) {
     if (done) return;
     console.log("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");
     function encode64(data) {
      var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
      var PAD = "=";
      var ret = "";
      var leftchar = 0;
      var leftbits = 0;
      for (var i = 0; i < data.length; i++) {
       leftchar = leftchar << 8 | data[i];
       leftbits += 8;
       while (leftbits >= 6) {
        var curr = leftchar >> leftbits - 6 & 63;
        leftbits -= 6;
        ret += BASE[curr];
       }
      }
      if (leftbits == 2) {
       ret += BASE[(leftchar & 3) << 4];
       ret += PAD + PAD;
      } else if (leftbits == 4) {
       ret += BASE[(leftchar & 15) << 2];
       ret += PAD;
      }
      return ret;
     }
     audio.src = "data:audio/x-" + name.substr(-3) + ";base64," + encode64(byteArray);
     finish(audio);
    };
    audio.src = url;
    Browser.safeSetTimeout((function() {
     finish(audio);
    }), 1e4);
   } else {
    return fail();
   }
  };
  Module["preloadPlugins"].push(audioPlugin);
  var canvas = Module["canvas"];
  function pointerLockChange() {
   Browser.pointerLock = document["pointerLockElement"] === canvas || document["mozPointerLockElement"] === canvas || document["webkitPointerLockElement"] === canvas || document["msPointerLockElement"] === canvas;
  }
  if (canvas) {
   canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] || (function() {});
   canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] || (function() {});
   canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
   document.addEventListener("pointerlockchange", pointerLockChange, false);
   document.addEventListener("mozpointerlockchange", pointerLockChange, false);
   document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
   document.addEventListener("mspointerlockchange", pointerLockChange, false);
   if (Module["elementPointerLock"]) {
    canvas.addEventListener("click", (function(ev) {
     if (!Browser.pointerLock && canvas.requestPointerLock) {
      canvas.requestPointerLock();
      ev.preventDefault();
     }
    }), false);
   }
  }
 }),
 createContext: (function(canvas, useWebGL, setInModule, webGLContextAttributes) {
  if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
  var ctx;
  var contextHandle;
  if (useWebGL) {
   var contextAttributes = {
    antialias: false,
    alpha: false
   };
   if (webGLContextAttributes) {
    for (var attribute in webGLContextAttributes) {
     contextAttributes[attribute] = webGLContextAttributes[attribute];
    }
   }
   contextHandle = GL.createContext(canvas, contextAttributes);
   if (contextHandle) {
    ctx = GL.getContext(contextHandle).GLctx;
   }
   canvas.style.backgroundColor = "black";
  } else {
   ctx = canvas.getContext("2d");
  }
  if (!ctx) return null;
  if (setInModule) {
   if (!useWebGL) assert(typeof GLctx === "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
   Module.ctx = ctx;
   if (useWebGL) GL.makeContextCurrent(contextHandle);
   Module.useWebGL = useWebGL;
   Browser.moduleContextCreatedCallbacks.forEach((function(callback) {
    callback();
   }));
   Browser.init();
  }
  return ctx;
 }),
 destroyContext: (function(canvas, useWebGL, setInModule) {}),
 fullScreenHandlersInstalled: false,
 lockPointer: undefined,
 resizeCanvas: undefined,
 requestFullScreen: (function(lockPointer, resizeCanvas, vrDevice) {
  Browser.lockPointer = lockPointer;
  Browser.resizeCanvas = resizeCanvas;
  Browser.vrDevice = vrDevice;
  if (typeof Browser.lockPointer === "undefined") Browser.lockPointer = true;
  if (typeof Browser.resizeCanvas === "undefined") Browser.resizeCanvas = false;
  if (typeof Browser.vrDevice === "undefined") Browser.vrDevice = null;
  var canvas = Module["canvas"];
  function fullScreenChange() {
   Browser.isFullScreen = false;
   var canvasContainer = canvas.parentNode;
   if ((document["webkitFullScreenElement"] || document["webkitFullscreenElement"] || document["mozFullScreenElement"] || document["mozFullscreenElement"] || document["fullScreenElement"] || document["fullscreenElement"] || document["msFullScreenElement"] || document["msFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
    canvas.cancelFullScreen = document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["webkitCancelFullScreen"] || document["msExitFullscreen"] || document["exitFullscreen"] || (function() {});
    canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
    if (Browser.lockPointer) canvas.requestPointerLock();
    Browser.isFullScreen = true;
    if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
   } else {
    canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
    canvasContainer.parentNode.removeChild(canvasContainer);
    if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
   }
   if (Module["onFullScreen"]) Module["onFullScreen"](Browser.isFullScreen);
   Browser.updateCanvasDimensions(canvas);
  }
  if (!Browser.fullScreenHandlersInstalled) {
   Browser.fullScreenHandlersInstalled = true;
   document.addEventListener("fullscreenchange", fullScreenChange, false);
   document.addEventListener("mozfullscreenchange", fullScreenChange, false);
   document.addEventListener("webkitfullscreenchange", fullScreenChange, false);
   document.addEventListener("MSFullscreenChange", fullScreenChange, false);
  }
  var canvasContainer = document.createElement("div");
  canvas.parentNode.insertBefore(canvasContainer, canvas);
  canvasContainer.appendChild(canvas);
  canvasContainer.requestFullScreen = canvasContainer["requestFullScreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullScreen"] ? (function() {
   canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"]);
  }) : null);
  if (vrDevice) {
   canvasContainer.requestFullScreen({
    vrDisplay: vrDevice
   });
  } else {
   canvasContainer.requestFullScreen();
  }
 }),
 nextRAF: 0,
 fakeRequestAnimationFrame: (function(func) {
  var now = Date.now();
  if (Browser.nextRAF === 0) {
   Browser.nextRAF = now + 1e3 / 60;
  } else {
   while (now + 2 >= Browser.nextRAF) {
    Browser.nextRAF += 1e3 / 60;
   }
  }
  var delay = Math.max(Browser.nextRAF - now, 0);
  setTimeout(func, delay);
 }),
 requestAnimationFrame: function requestAnimationFrame(func) {
  if (typeof window === "undefined") {
   Browser.fakeRequestAnimationFrame(func);
  } else {
   if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = window["requestAnimationFrame"] || window["mozRequestAnimationFrame"] || window["webkitRequestAnimationFrame"] || window["msRequestAnimationFrame"] || window["oRequestAnimationFrame"] || Browser.fakeRequestAnimationFrame;
   }
   window.requestAnimationFrame(func);
  }
 },
 safeCallback: (function(func) {
  return (function() {
   if (!ABORT) return func.apply(null, arguments);
  });
 }),
 allowAsyncCallbacks: true,
 queuedAsyncCallbacks: [],
 pauseAsyncCallbacks: (function() {
  Browser.allowAsyncCallbacks = false;
 }),
 resumeAsyncCallbacks: (function() {
  Browser.allowAsyncCallbacks = true;
  if (Browser.queuedAsyncCallbacks.length > 0) {
   var callbacks = Browser.queuedAsyncCallbacks;
   Browser.queuedAsyncCallbacks = [];
   callbacks.forEach((function(func) {
    func();
   }));
  }
 }),
 safeRequestAnimationFrame: (function(func) {
  return Browser.requestAnimationFrame((function() {
   if (ABORT) return;
   if (Browser.allowAsyncCallbacks) {
    func();
   } else {
    Browser.queuedAsyncCallbacks.push(func);
   }
  }));
 }),
 safeSetTimeout: (function(func, timeout) {
  Module["noExitRuntime"] = true;
  return setTimeout((function() {
   if (ABORT) return;
   if (Browser.allowAsyncCallbacks) {
    func();
   } else {
    Browser.queuedAsyncCallbacks.push(func);
   }
  }), timeout);
 }),
 safeSetInterval: (function(func, timeout) {
  Module["noExitRuntime"] = true;
  return setInterval((function() {
   if (ABORT) return;
   if (Browser.allowAsyncCallbacks) {
    func();
   }
  }), timeout);
 }),
 getMimetype: (function(name) {
  return {
   "jpg": "image/jpeg",
   "jpeg": "image/jpeg",
   "png": "image/png",
   "bmp": "image/bmp",
   "ogg": "audio/ogg",
   "wav": "audio/wav",
   "mp3": "audio/mpeg"
  }[name.substr(name.lastIndexOf(".") + 1)];
 }),
 getUserMedia: (function(func) {
  if (!window.getUserMedia) {
   window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"];
  }
  window.getUserMedia(func);
 }),
 getMovementX: (function(event) {
  return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0;
 }),
 getMovementY: (function(event) {
  return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0;
 }),
 getMouseWheelDelta: (function(event) {
  var delta = 0;
  switch (event.type) {
  case "DOMMouseScroll":
   delta = event.detail;
   break;
  case "mousewheel":
   delta = event.wheelDelta;
   break;
  case "wheel":
   delta = event["deltaY"];
   break;
  default:
   throw "unrecognized mouse wheel event: " + event.type;
  }
  return delta;
 }),
 mouseX: 0,
 mouseY: 0,
 mouseMovementX: 0,
 mouseMovementY: 0,
 touches: {},
 lastTouches: {},
 calculateMouseEvent: (function(event) {
  if (Browser.pointerLock) {
   if (event.type != "mousemove" && "mozMovementX" in event) {
    Browser.mouseMovementX = Browser.mouseMovementY = 0;
   } else {
    Browser.mouseMovementX = Browser.getMovementX(event);
    Browser.mouseMovementY = Browser.getMovementY(event);
   }
   if (typeof SDL != "undefined") {
    Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
    Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
   } else {
    Browser.mouseX += Browser.mouseMovementX;
    Browser.mouseY += Browser.mouseMovementY;
   }
  } else {
   var rect = Module["canvas"].getBoundingClientRect();
   var cw = Module["canvas"].width;
   var ch = Module["canvas"].height;
   var scrollX = typeof window.scrollX !== "undefined" ? window.scrollX : window.pageXOffset;
   var scrollY = typeof window.scrollY !== "undefined" ? window.scrollY : window.pageYOffset;
   assert(typeof scrollX !== "undefined" && typeof scrollY !== "undefined", "Unable to retrieve scroll position, mouse positions likely broken.");
   if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
    var touch = event.touch;
    if (touch === undefined) {
     return;
    }
    var adjustedX = touch.pageX - (scrollX + rect.left);
    var adjustedY = touch.pageY - (scrollY + rect.top);
    adjustedX = adjustedX * (cw / rect.width);
    adjustedY = adjustedY * (ch / rect.height);
    var coords = {
     x: adjustedX,
     y: adjustedY
    };
    if (event.type === "touchstart") {
     Browser.lastTouches[touch.identifier] = coords;
     Browser.touches[touch.identifier] = coords;
    } else if (event.type === "touchend" || event.type === "touchmove") {
     var last = Browser.touches[touch.identifier];
     if (!last) last = coords;
     Browser.lastTouches[touch.identifier] = last;
     Browser.touches[touch.identifier] = coords;
    }
    return;
   }
   var x = event.pageX - (scrollX + rect.left);
   var y = event.pageY - (scrollY + rect.top);
   x = x * (cw / rect.width);
   y = y * (ch / rect.height);
   Browser.mouseMovementX = x - Browser.mouseX;
   Browser.mouseMovementY = y - Browser.mouseY;
   Browser.mouseX = x;
   Browser.mouseY = y;
  }
 }),
 xhrLoad: (function(url, onload, onerror) {
  var xhr = new XMLHttpRequest;
  xhr.open("GET", url, true);
  xhr.responseType = "arraybuffer";
  xhr.onload = function xhr_onload() {
   if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
    onload(xhr.response);
   } else {
    onerror();
   }
  };
  xhr.onerror = onerror;
  xhr.send(null);
 }),
 asyncLoad: (function(url, onload, onerror, noRunDep) {
  Browser.xhrLoad(url, (function(arrayBuffer) {
   assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
   onload(new Uint8Array(arrayBuffer));
   if (!noRunDep) removeRunDependency("al " + url);
  }), (function(event) {
   if (onerror) {
    onerror();
   } else {
    throw 'Loading data file "' + url + '" failed.';
   }
  }));
  if (!noRunDep) addRunDependency("al " + url);
 }),
 resizeListeners: [],
 updateResizeListeners: (function() {
  var canvas = Module["canvas"];
  Browser.resizeListeners.forEach((function(listener) {
   listener(canvas.width, canvas.height);
  }));
 }),
 setCanvasSize: (function(width, height, noUpdates) {
  var canvas = Module["canvas"];
  Browser.updateCanvasDimensions(canvas, width, height);
  if (!noUpdates) Browser.updateResizeListeners();
 }),
 windowedWidth: 0,
 windowedHeight: 0,
 setFullScreenCanvasSize: (function() {
  if (typeof SDL != "undefined") {
   var flags = HEAPU32[SDL.screen + Runtime.QUANTUM_SIZE * 0 >> 2];
   flags = flags | 8388608;
   HEAP32[SDL.screen + Runtime.QUANTUM_SIZE * 0 >> 2] = flags;
  }
  Browser.updateResizeListeners();
 }),
 setWindowedCanvasSize: (function() {
  if (typeof SDL != "undefined") {
   var flags = HEAPU32[SDL.screen + Runtime.QUANTUM_SIZE * 0 >> 2];
   flags = flags & ~8388608;
   HEAP32[SDL.screen + Runtime.QUANTUM_SIZE * 0 >> 2] = flags;
  }
  Browser.updateResizeListeners();
 }),
 updateCanvasDimensions: (function(canvas, wNative, hNative) {
  if (wNative && hNative) {
   canvas.widthNative = wNative;
   canvas.heightNative = hNative;
  } else {
   wNative = canvas.widthNative;
   hNative = canvas.heightNative;
  }
  var w = wNative;
  var h = hNative;
  if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
   if (w / h < Module["forcedAspectRatio"]) {
    w = Math.round(h * Module["forcedAspectRatio"]);
   } else {
    h = Math.round(w / Module["forcedAspectRatio"]);
   }
  }
  if ((document["webkitFullScreenElement"] || document["webkitFullscreenElement"] || document["mozFullScreenElement"] || document["mozFullscreenElement"] || document["fullScreenElement"] || document["fullscreenElement"] || document["msFullScreenElement"] || document["msFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
   var factor = Math.min(screen.width / w, screen.height / h);
   w = Math.round(w * factor);
   h = Math.round(h * factor);
  }
  if (Browser.resizeCanvas) {
   if (canvas.width != w) canvas.width = w;
   if (canvas.height != h) canvas.height = h;
   if (typeof canvas.style != "undefined") {
    canvas.style.removeProperty("width");
    canvas.style.removeProperty("height");
   }
  } else {
   if (canvas.width != wNative) canvas.width = wNative;
   if (canvas.height != hNative) canvas.height = hNative;
   if (typeof canvas.style != "undefined") {
    if (w != wNative || h != hNative) {
     canvas.style.setProperty("width", w + "px", "important");
     canvas.style.setProperty("height", h + "px", "important");
    } else {
     canvas.style.removeProperty("width");
     canvas.style.removeProperty("height");
    }
   }
  }
 }),
 wgetRequests: {},
 nextWgetRequestHandle: 0,
 getNextWgetRequestHandle: (function() {
  var handle = Browser.nextWgetRequestHandle;
  Browser.nextWgetRequestHandle++;
  return handle;
 })
};
function _pthread_setspecific(key, value) {
 if (!(key in PTHREAD_SPECIFIC)) {
  return ERRNO_CODES.EINVAL;
 }
 PTHREAD_SPECIFIC[key] = value;
 return 0;
}
function ___cxa_allocate_exception(size) {
 return _malloc(size);
}
function ___cxa_pure_virtual() {
 ABORT = true;
 throw "Pure virtual function called!";
}
var _exp = Math_exp;
function floatReadValueFromPointer(name, shift) {
 switch (shift) {
 case 2:
  return (function(pointer) {
   return this["fromWireType"](HEAPF32[pointer >> 2]);
  });
 case 3:
  return (function(pointer) {
   return this["fromWireType"](HEAPF64[pointer >> 3]);
  });
 default:
  throw new TypeError("Unknown float type: " + name);
 }
}
function __embind_register_float(rawType, name, size) {
 var shift = getShiftFromSize(size);
 name = readLatin1String(name);
 registerType(rawType, {
  name: name,
  "fromWireType": (function(value) {
   return value;
  }),
  "toWireType": (function(destructors, value) {
   if (typeof value !== "number" && typeof value !== "boolean") {
    throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name);
   }
   return value;
  }),
  "argPackAdvance": 8,
  "readValueFromPointer": floatReadValueFromPointer(name, shift),
  destructorFunction: null
 });
}
function ___cxa_begin_catch(ptr) {
 __ZSt18uncaught_exceptionv.uncaught_exception--;
 EXCEPTIONS.caught.push(ptr);
 EXCEPTIONS.addRef(EXCEPTIONS.deAdjust(ptr));
 return ptr;
}
function ___syscall6(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD();
  FS.close(stream);
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function runDestructors(destructors) {
 while (destructors.length) {
  var ptr = destructors.pop();
  var del = destructors.pop();
  del(ptr);
 }
}
function __embind_finalize_value_object(structType) {
 var reg = structRegistrations[structType];
 delete structRegistrations[structType];
 var rawConstructor = reg.rawConstructor;
 var rawDestructor = reg.rawDestructor;
 var fieldRecords = reg.fields;
 var fieldTypes = fieldRecords.map((function(field) {
  return field.getterReturnType;
 })).concat(fieldRecords.map((function(field) {
  return field.setterArgumentType;
 })));
 whenDependentTypesAreResolved([ structType ], fieldTypes, (function(fieldTypes) {
  var fields = {};
  fieldRecords.forEach((function(field, i) {
   var fieldName = field.fieldName;
   var getterReturnType = fieldTypes[i];
   var getter = field.getter;
   var getterContext = field.getterContext;
   var setterArgumentType = fieldTypes[i + fieldRecords.length];
   var setter = field.setter;
   var setterContext = field.setterContext;
   fields[fieldName] = {
    read: (function(ptr) {
     return getterReturnType["fromWireType"](getter(getterContext, ptr));
    }),
    write: (function(ptr, o) {
     var destructors = [];
     setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
     runDestructors(destructors);
    })
   };
  }));
  return [ {
   name: reg.name,
   "fromWireType": (function(ptr) {
    var rv = {};
    for (var i in fields) {
     rv[i] = fields[i].read(ptr);
    }
    rawDestructor(ptr);
    return rv;
   }),
   "toWireType": (function(destructors, o) {
    for (var fieldName in fields) {
     if (!(fieldName in o)) {
      throw new TypeError("Missing field");
     }
    }
    var ptr = rawConstructor();
    for (fieldName in fields) {
     fields[fieldName].write(ptr, o[fieldName]);
    }
    if (destructors !== null) {
     destructors.push(rawDestructor, ptr);
    }
    return ptr;
   }),
   "argPackAdvance": 8,
   "readValueFromPointer": simpleReadValueFromPointer,
   destructorFunction: rawDestructor
  } ];
 }));
}
function heap32VectorToArray(count, firstElement) {
 var array = [];
 for (var i = 0; i < count; i++) {
  array.push(HEAP32[(firstElement >> 2) + i]);
 }
 return array;
}
function __embind_register_class_constructor(rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) {
 var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
 invoker = requireFunction(invokerSignature, invoker);
 whenDependentTypesAreResolved([], [ rawClassType ], (function(classType) {
  classType = classType[0];
  var humanName = "constructor " + classType.name;
  if (undefined === classType.registeredClass.constructor_body) {
   classType.registeredClass.constructor_body = [];
  }
  if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
   throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount - 1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!");
  }
  classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
   throwUnboundTypeError("Cannot construct " + classType.name + " due to unbound types", rawArgTypes);
  };
  whenDependentTypesAreResolved([], rawArgTypes, (function(argTypes) {
   classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
    if (arguments.length !== argCount - 1) {
     throwBindingError(humanName + " called with " + arguments.length + " arguments, expected " + (argCount - 1));
    }
    var destructors = [];
    var args = new Array(argCount);
    args[0] = rawConstructor;
    for (var i = 1; i < argCount; ++i) {
     args[i] = argTypes[i]["toWireType"](destructors, arguments[i - 1]);
    }
    var ptr = invoker.apply(null, args);
    runDestructors(destructors);
    return argTypes[0]["fromWireType"](ptr);
   };
   return [];
  }));
  return [];
 }));
}
function _time(ptr) {
 var ret = Date.now() / 1e3 | 0;
 if (ptr) {
  HEAP32[ptr >> 2] = ret;
 }
 return ret;
}
function _pthread_self() {
 return 0;
}
function ___syscall140(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
  var offset = offset_low;
  assert(offset_high === 0);
  FS.llseek(stream, offset, whence);
  HEAP32[result >> 2] = stream.position;
  if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
  return 0;
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function __emval_incref(handle) {
 if (handle > 4) {
  emval_handle_array[handle].refcount += 1;
 }
}
function ___syscall146(which, varargs) {
 SYSCALLS.varargs = varargs;
 try {
  var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
  return SYSCALLS.doWritev(stream, iov, iovcnt);
 } catch (e) {
  if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
  return -e.errno;
 }
}
function new_(constructor, argumentList) {
 if (!(constructor instanceof Function)) {
  throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function");
 }
 var dummy = createNamedFunction(constructor.name || "unknownFunctionName", (function() {}));
 dummy.prototype = constructor.prototype;
 var obj = new dummy;
 var r = constructor.apply(obj, argumentList);
 return r instanceof Object ? r : obj;
}
function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
 var argCount = argTypes.length;
 if (argCount < 2) {
  throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!");
 }
 var isClassMethodFunc = argTypes[1] !== null && classType !== null;
 var argsList = "";
 var argsListWired = "";
 for (var i = 0; i < argCount - 2; ++i) {
  argsList += (i !== 0 ? ", " : "") + "arg" + i;
  argsListWired += (i !== 0 ? ", " : "") + "arg" + i + "Wired";
 }
 var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";
 var needsDestructorStack = false;
 for (var i = 1; i < argTypes.length; ++i) {
  if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
   needsDestructorStack = true;
   break;
  }
 }
 if (needsDestructorStack) {
  invokerFnBody += "var destructors = [];\n";
 }
 var dtorStack = needsDestructorStack ? "destructors" : "null";
 var args1 = [ "throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam" ];
 var args2 = [ throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1] ];
 if (isClassMethodFunc) {
  invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n";
 }
 for (var i = 0; i < argCount - 2; ++i) {
  invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
  args1.push("argType" + i);
  args2.push(argTypes[i + 2]);
 }
 if (isClassMethodFunc) {
  argsListWired = "thisWired" + (argsListWired.length > 0 ? ", " : "") + argsListWired;
 }
 var returns = argTypes[0].name !== "void";
 invokerFnBody += (returns ? "var rv = " : "") + "invoker(fn" + (argsListWired.length > 0 ? ", " : "") + argsListWired + ");\n";
 if (needsDestructorStack) {
  invokerFnBody += "runDestructors(destructors);\n";
 } else {
  for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
   var paramName = i === 1 ? "thisWired" : "arg" + (i - 2) + "Wired";
   if (argTypes[i].destructorFunction !== null) {
    invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
    args1.push(paramName + "_dtor");
    args2.push(argTypes[i].destructorFunction);
   }
  }
 }
 if (returns) {
  invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n";
 } else {}
 invokerFnBody += "}\n";
 args1.push(invokerFnBody);
 var invokerFunction = new_(Function, args1).apply(null, args2);
 return invokerFunction;
}
function __embind_register_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual) {
 var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
 methodName = readLatin1String(methodName);
 rawInvoker = requireFunction(invokerSignature, rawInvoker);
 whenDependentTypesAreResolved([], [ rawClassType ], (function(classType) {
  classType = classType[0];
  var humanName = classType.name + "." + methodName;
  if (isPureVirtual) {
   classType.registeredClass.pureVirtualFunctions.push(methodName);
  }
  function unboundTypesHandler() {
   throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes);
  }
  var proto = classType.registeredClass.instancePrototype;
  var method = proto[methodName];
  if (undefined === method || undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
   unboundTypesHandler.argCount = argCount - 2;
   unboundTypesHandler.className = classType.name;
   proto[methodName] = unboundTypesHandler;
  } else {
   ensureOverloadTable(proto, methodName, humanName);
   proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler;
  }
  whenDependentTypesAreResolved([], rawArgTypes, (function(argTypes) {
   var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
   if (undefined === proto[methodName].overloadTable) {
    proto[methodName] = memberFunction;
   } else {
    proto[methodName].overloadTable[argCount - 2] = memberFunction;
   }
   return [];
  }));
  return [];
 }));
}
embind_init_charCodes();
BindingError = Module["BindingError"] = extendError(Error, "BindingError");
InternalError = Module["InternalError"] = extendError(Error, "InternalError");
init_emval();
FS.staticInit();
__ATINIT__.unshift((function() {
 if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
}));
__ATMAIN__.push((function() {
 FS.ignorePermissions = false;
}));
__ATEXIT__.push((function() {
 FS.quit();
}));
Module["FS_createFolder"] = FS.createFolder;
Module["FS_createPath"] = FS.createPath;
Module["FS_createDataFile"] = FS.createDataFile;
Module["FS_createPreloadedFile"] = FS.createPreloadedFile;
Module["FS_createLazyFile"] = FS.createLazyFile;
Module["FS_createLink"] = FS.createLink;
Module["FS_createDevice"] = FS.createDevice;
Module["FS_unlink"] = FS.unlink;
__ATINIT__.unshift((function() {
 TTY.init();
}));
__ATEXIT__.push((function() {
 TTY.shutdown();
}));
if (ENVIRONMENT_IS_NODE) {
 var fs = require("fs");
 var NODEJS_PATH = require("path");
 NODEFS.staticInit();
}
init_ClassHandle();
init_RegisteredPointer();
init_embind();
UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas, vrDevice) {
 Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice);
};
Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
 Browser.requestAnimationFrame(func);
};
Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
 Browser.setCanvasSize(width, height, noUpdates);
};
Module["pauseMainLoop"] = function Module_pauseMainLoop() {
 Browser.mainLoop.pause();
};
Module["resumeMainLoop"] = function Module_resumeMainLoop() {
 Browser.mainLoop.resume();
};
Module["getUserMedia"] = function Module_getUserMedia() {
 Browser.getUserMedia();
};
Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
 return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes);
};
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true;
STACK_MAX = STACK_BASE + TOTAL_STACK;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");
var cttz_i8 = allocate([ 8, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 6, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 7, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 6, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0, 4, 0, 1, 0, 2, 0, 1, 0, 3, 0, 1, 0, 2, 0, 1, 0 ], "i8", ALLOC_DYNAMIC);
function nullFunc_viiiii(x) {
 Module["printErr"]("Invalid function pointer called with signature 'viiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_vid(x) {
 Module["printErr"]("Invalid function pointer called with signature 'vid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_vi(x) {
 Module["printErr"]("Invalid function pointer called with signature 'vi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_vii(x) {
 Module["printErr"]("Invalid function pointer called with signature 'vii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_iiiiiiiiiii(x) {
 Module["printErr"]("Invalid function pointer called with signature 'iiiiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_ii(x) {
 Module["printErr"]("Invalid function pointer called with signature 'ii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_viiiiiiiiiii(x) {
 Module["printErr"]("Invalid function pointer called with signature 'viiiiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_iiiiii(x) {
 Module["printErr"]("Invalid function pointer called with signature 'iiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_viiiiiidddii(x) {
 Module["printErr"]("Invalid function pointer called with signature 'viiiiiidddii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_iiii(x) {
 Module["printErr"]("Invalid function pointer called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_viiiiii(x) {
 Module["printErr"]("Invalid function pointer called with signature 'viiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_di(x) {
 Module["printErr"]("Invalid function pointer called with signature 'di'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_viiiiiiiiii(x) {
 Module["printErr"]("Invalid function pointer called with signature 'viiiiiiiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_iii(x) {
 Module["printErr"]("Invalid function pointer called with signature 'iii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_diii(x) {
 Module["printErr"]("Invalid function pointer called with signature 'diii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_dii(x) {
 Module["printErr"]("Invalid function pointer called with signature 'dii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_i(x) {
 Module["printErr"]("Invalid function pointer called with signature 'i'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_iiiii(x) {
 Module["printErr"]("Invalid function pointer called with signature 'iiiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_viiid(x) {
 Module["printErr"]("Invalid function pointer called with signature 'viiid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_viii(x) {
 Module["printErr"]("Invalid function pointer called with signature 'viii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_iiiiiiiiiidd(x) {
 Module["printErr"]("Invalid function pointer called with signature 'iiiiiiiiiidd'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_v(x) {
 Module["printErr"]("Invalid function pointer called with signature 'v'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_viid(x) {
 Module["printErr"]("Invalid function pointer called with signature 'viid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_iiiid(x) {
 Module["printErr"]("Invalid function pointer called with signature 'iiiid'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function nullFunc_viiii(x) {
 Module["printErr"]("Invalid function pointer called with signature 'viiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");
 Module["printErr"]("Build with ASSERTIONS=2 for more info.");
 abort(x);
}
function invoke_viiiii(index, a1, a2, a3, a4, a5) {
 try {
  Module["dynCall_viiiii"](index, a1, a2, a3, a4, a5);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_vid(index, a1, a2) {
 try {
  Module["dynCall_vid"](index, a1, a2);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_vi(index, a1) {
 try {
  Module["dynCall_vi"](index, a1);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_vii(index, a1, a2) {
 try {
  Module["dynCall_vii"](index, a1, a2);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_iiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
 try {
  return Module["dynCall_iiiiiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_ii(index, a1) {
 try {
  return Module["dynCall_ii"](index, a1);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
 try {
  Module["dynCall_viiiiiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
 try {
  return Module["dynCall_iiiiii"](index, a1, a2, a3, a4, a5);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viiiiiidddii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
 try {
  Module["dynCall_viiiiiidddii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_iiii(index, a1, a2, a3) {
 try {
  return Module["dynCall_iiii"](index, a1, a2, a3);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
 try {
  Module["dynCall_viiiiii"](index, a1, a2, a3, a4, a5, a6);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_di(index, a1) {
 try {
  return Module["dynCall_di"](index, a1);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
 try {
  Module["dynCall_viiiiiiiiii"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_iii(index, a1, a2) {
 try {
  return Module["dynCall_iii"](index, a1, a2);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_diii(index, a1, a2, a3) {
 try {
  return Module["dynCall_diii"](index, a1, a2, a3);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_dii(index, a1, a2) {
 try {
  return Module["dynCall_dii"](index, a1, a2);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_i(index) {
 try {
  return Module["dynCall_i"](index);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_iiiii(index, a1, a2, a3, a4) {
 try {
  return Module["dynCall_iiiii"](index, a1, a2, a3, a4);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viiid(index, a1, a2, a3, a4) {
 try {
  Module["dynCall_viiid"](index, a1, a2, a3, a4);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viii(index, a1, a2, a3) {
 try {
  Module["dynCall_viii"](index, a1, a2, a3);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_iiiiiiiiiidd(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
 try {
  return Module["dynCall_iiiiiiiiiidd"](index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_v(index) {
 try {
  Module["dynCall_v"](index);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viid(index, a1, a2, a3) {
 try {
  Module["dynCall_viid"](index, a1, a2, a3);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_iiiid(index, a1, a2, a3, a4) {
 try {
  return Module["dynCall_iiiid"](index, a1, a2, a3, a4);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
function invoke_viiii(index, a1, a2, a3, a4) {
 try {
  Module["dynCall_viiii"](index, a1, a2, a3, a4);
 } catch (e) {
  if (typeof e !== "number" && e !== "longjmp") throw e;
  asm["setThrew"](1, 0);
 }
}
Module.asmGlobalArg = {
 "Math": Math,
 "Int8Array": Int8Array,
 "Int16Array": Int16Array,
 "Int32Array": Int32Array,
 "Uint8Array": Uint8Array,
 "Uint16Array": Uint16Array,
 "Uint32Array": Uint32Array,
 "Float32Array": Float32Array,
 "Float64Array": Float64Array,
 "NaN": NaN,
 "Infinity": Infinity,
 "byteLength": byteLength
};
Module.asmLibraryArg = {
 "abort": abort,
 "assert": assert,
 "nullFunc_viiiii": nullFunc_viiiii,
 "nullFunc_vid": nullFunc_vid,
 "nullFunc_vi": nullFunc_vi,
 "nullFunc_vii": nullFunc_vii,
 "nullFunc_iiiiiiiiiii": nullFunc_iiiiiiiiiii,
 "nullFunc_ii": nullFunc_ii,
 "nullFunc_viiiiiiiiiii": nullFunc_viiiiiiiiiii,
 "nullFunc_iiiiii": nullFunc_iiiiii,
 "nullFunc_viiiiiidddii": nullFunc_viiiiiidddii,
 "nullFunc_iiii": nullFunc_iiii,
 "nullFunc_viiiiii": nullFunc_viiiiii,
 "nullFunc_di": nullFunc_di,
 "nullFunc_viiiiiiiiii": nullFunc_viiiiiiiiii,
 "nullFunc_iii": nullFunc_iii,
 "nullFunc_diii": nullFunc_diii,
 "nullFunc_dii": nullFunc_dii,
 "nullFunc_i": nullFunc_i,
 "nullFunc_iiiii": nullFunc_iiiii,
 "nullFunc_viiid": nullFunc_viiid,
 "nullFunc_viii": nullFunc_viii,
 "nullFunc_iiiiiiiiiidd": nullFunc_iiiiiiiiiidd,
 "nullFunc_v": nullFunc_v,
 "nullFunc_viid": nullFunc_viid,
 "nullFunc_iiiid": nullFunc_iiiid,
 "nullFunc_viiii": nullFunc_viiii,
 "invoke_viiiii": invoke_viiiii,
 "invoke_vid": invoke_vid,
 "invoke_vi": invoke_vi,
 "invoke_vii": invoke_vii,
 "invoke_iiiiiiiiiii": invoke_iiiiiiiiiii,
 "invoke_ii": invoke_ii,
 "invoke_viiiiiiiiiii": invoke_viiiiiiiiiii,
 "invoke_iiiiii": invoke_iiiiii,
 "invoke_viiiiiidddii": invoke_viiiiiidddii,
 "invoke_iiii": invoke_iiii,
 "invoke_viiiiii": invoke_viiiiii,
 "invoke_di": invoke_di,
 "invoke_viiiiiiiiii": invoke_viiiiiiiiii,
 "invoke_iii": invoke_iii,
 "invoke_diii": invoke_diii,
 "invoke_dii": invoke_dii,
 "invoke_i": invoke_i,
 "invoke_iiiii": invoke_iiiii,
 "invoke_viiid": invoke_viiid,
 "invoke_viii": invoke_viii,
 "invoke_iiiiiiiiiidd": invoke_iiiiiiiiiidd,
 "invoke_v": invoke_v,
 "invoke_viid": invoke_viid,
 "invoke_iiiid": invoke_iiiid,
 "invoke_viiii": invoke_viiii,
 "_fabs": _fabs,
 "_exp": _exp,
 "floatReadValueFromPointer": floatReadValueFromPointer,
 "simpleReadValueFromPointer": simpleReadValueFromPointer,
 "_log": _log,
 "throwInternalError": throwInternalError,
 "get_first_emval": get_first_emval,
 "getLiveInheritedInstances": getLiveInheritedInstances,
 "___assert_fail": ___assert_fail,
 "__ZSt18uncaught_exceptionv": __ZSt18uncaught_exceptionv,
 "ClassHandle": ClassHandle,
 "getShiftFromSize": getShiftFromSize,
 "_emscripten_set_main_loop_timing": _emscripten_set_main_loop_timing,
 "_sbrk": _sbrk,
 "___cxa_begin_catch": ___cxa_begin_catch,
 "_emscripten_memcpy_big": _emscripten_memcpy_big,
 "runDestructor": runDestructor,
 "_sysconf": _sysconf,
 "throwInstanceAlreadyDeleted": throwInstanceAlreadyDeleted,
 "__embind_register_std_string": __embind_register_std_string,
 "init_RegisteredPointer": init_RegisteredPointer,
 "ClassHandle_isAliasOf": ClassHandle_isAliasOf,
 "flushPendingDeletes": flushPendingDeletes,
 "__embind_register_enum_value": __embind_register_enum_value,
 "makeClassHandle": makeClassHandle,
 "whenDependentTypesAreResolved": whenDependentTypesAreResolved,
 "__embind_register_class_constructor": __embind_register_class_constructor,
 "init_ClassHandle": init_ClassHandle,
 "_pthread_cleanup_push": _pthread_cleanup_push,
 "___syscall140": ___syscall140,
 "ClassHandle_clone": ClassHandle_clone,
 "___syscall146": ___syscall146,
 "_pthread_cleanup_pop": _pthread_cleanup_pop,
 "RegisteredClass": RegisteredClass,
 "___cxa_free_exception": ___cxa_free_exception,
 "___cxa_find_matching_catch": ___cxa_find_matching_catch,
 "__embind_register_value_object_field": __embind_register_value_object_field,
 "__embind_register_emval": __embind_register_emval,
 "___setErrNo": ___setErrNo,
 "__embind_register_bool": __embind_register_bool,
 "___resumeException": ___resumeException,
 "createNamedFunction": createNamedFunction,
 "embind_init_charCodes": embind_init_charCodes,
 "__embind_finalize_value_object": __embind_finalize_value_object,
 "__emval_decref": __emval_decref,
 "_pthread_once": _pthread_once,
 "init_embind": init_embind,
 "constNoSmartPtrRawPointerToWireType": constNoSmartPtrRawPointerToWireType,
 "heap32VectorToArray": heap32VectorToArray,
 "ClassHandle_delete": ClassHandle_delete,
 "RegisteredPointer_destructor": RegisteredPointer_destructor,
 "___syscall6": ___syscall6,
 "ensureOverloadTable": ensureOverloadTable,
 "_time": _time,
 "new_": new_,
 "downcastPointer": downcastPointer,
 "replacePublicSymbol": replacePublicSymbol,
 "__embind_register_class": __embind_register_class,
 "ClassHandle_deleteLater": ClassHandle_deleteLater,
 "___syscall54": ___syscall54,
 "RegisteredPointer_deleteObject": RegisteredPointer_deleteObject,
 "ClassHandle_isDeleted": ClassHandle_isDeleted,
 "__embind_register_integer": __embind_register_integer,
 "___cxa_allocate_exception": ___cxa_allocate_exception,
 "__emval_take_value": __emval_take_value,
 "___cxa_end_catch": ___cxa_end_catch,
 "__embind_register_value_object": __embind_register_value_object,
 "enumReadValueFromPointer": enumReadValueFromPointer,
 "_embind_repr": _embind_repr,
 "_pthread_getspecific": _pthread_getspecific,
 "RegisteredPointer": RegisteredPointer,
 "craftInvokerFunction": craftInvokerFunction,
 "runDestructors": runDestructors,
 "requireRegisteredType": requireRegisteredType,
 "makeLegalFunctionName": makeLegalFunctionName,
 "_pthread_key_create": _pthread_key_create,
 "upcastPointer": upcastPointer,
 "init_emval": init_emval,
 "shallowCopyInternalPointer": shallowCopyInternalPointer,
 "nonConstNoSmartPtrRawPointerToWireType": nonConstNoSmartPtrRawPointerToWireType,
 "_abort": _abort,
 "throwBindingError": throwBindingError,
 "getTypeName": getTypeName,
 "exposePublicSymbol": exposePublicSymbol,
 "RegisteredPointer_fromWireType": RegisteredPointer_fromWireType,
 "___cxa_pure_virtual": ___cxa_pure_virtual,
 "___lock": ___lock,
 "__embind_register_memory_view": __embind_register_memory_view,
 "getInheritedInstance": getInheritedInstance,
 "setDelayFunction": setDelayFunction,
 "___gxx_personality_v0": ___gxx_personality_v0,
 "extendError": extendError,
 "__embind_register_void": __embind_register_void,
 "RegisteredPointer_getPointee": RegisteredPointer_getPointee,
 "__emval_register": __emval_register,
 "__embind_register_std_wstring": __embind_register_std_wstring,
 "__embind_register_class_function": __embind_register_class_function,
 "__emval_incref": __emval_incref,
 "throwUnboundTypeError": throwUnboundTypeError,
 "readLatin1String": readLatin1String,
 "_pthread_self": _pthread_self,
 "getBasestPointer": getBasestPointer,
 "getInheritedInstanceCount": getInheritedInstanceCount,
 "__embind_register_float": __embind_register_float,
 "integerReadValueFromPointer": integerReadValueFromPointer,
 "___unlock": ___unlock,
 "_emscripten_set_main_loop": _emscripten_set_main_loop,
 "_pthread_setspecific": _pthread_setspecific,
 "genericPointerToWireType": genericPointerToWireType,
 "registerType": registerType,
 "___cxa_throw": ___cxa_throw,
 "__embind_register_enum": __embind_register_enum,
 "count_emval_handles": count_emval_handles,
 "requireFunction": requireFunction,
 "_sqrt": _sqrt,
 "STACKTOP": STACKTOP,
 "STACK_MAX": STACK_MAX,
 "tempDoublePtr": tempDoublePtr,
 "ABORT": ABORT,
 "cttz_i8": cttz_i8
};
// EMSCRIPTEN_START_ASM

var asm = (function(global,env,buffer) {

  'use asm';


  var Int8View = global.Int8Array;
  var Int16View = global.Int16Array;
  var Int32View = global.Int32Array;
  var Uint8View = global.Uint8Array;
  var Uint16View = global.Uint16Array;
  var Uint32View = global.Uint32Array;
  var Float32View = global.Float32Array;
  var Float64View = global.Float64Array;
  var HEAP8 = new Int8View(buffer);
  var HEAP16 = new Int16View(buffer);
  var HEAP32 = new Int32View(buffer);
  var HEAPU8 = new Uint8View(buffer);
  var HEAPU16 = new Uint16View(buffer);
  var HEAPU32 = new Uint32View(buffer);
  var HEAPF32 = new Float32View(buffer);
  var HEAPF64 = new Float64View(buffer);
  var byteLength = global.byteLength;


  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var cttz_i8=env.cttz_i8|0;

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var nan = global.NaN, inf = global.Infinity;
  var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;

  var tempRet0 = 0;
  var tempRet1 = 0;
  var tempRet2 = 0;
  var tempRet3 = 0;
  var tempRet4 = 0;
  var tempRet5 = 0;
  var tempRet6 = 0;
  var tempRet7 = 0;
  var tempRet8 = 0;
  var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var Math_min=global.Math.min;
  var Math_clz32=global.Math.clz32;
  var abort=env.abort;
  var assert=env.assert;
  var nullFunc_viiiii=env.nullFunc_viiiii;
  var nullFunc_vid=env.nullFunc_vid;
  var nullFunc_vi=env.nullFunc_vi;
  var nullFunc_vii=env.nullFunc_vii;
  var nullFunc_iiiiiiiiiii=env.nullFunc_iiiiiiiiiii;
  var nullFunc_ii=env.nullFunc_ii;
  var nullFunc_viiiiiiiiiii=env.nullFunc_viiiiiiiiiii;
  var nullFunc_iiiiii=env.nullFunc_iiiiii;
  var nullFunc_viiiiiidddii=env.nullFunc_viiiiiidddii;
  var nullFunc_iiii=env.nullFunc_iiii;
  var nullFunc_viiiiii=env.nullFunc_viiiiii;
  var nullFunc_di=env.nullFunc_di;
  var nullFunc_viiiiiiiiii=env.nullFunc_viiiiiiiiii;
  var nullFunc_iii=env.nullFunc_iii;
  var nullFunc_diii=env.nullFunc_diii;
  var nullFunc_dii=env.nullFunc_dii;
  var nullFunc_i=env.nullFunc_i;
  var nullFunc_iiiii=env.nullFunc_iiiii;
  var nullFunc_viiid=env.nullFunc_viiid;
  var nullFunc_viii=env.nullFunc_viii;
  var nullFunc_iiiiiiiiiidd=env.nullFunc_iiiiiiiiiidd;
  var nullFunc_v=env.nullFunc_v;
  var nullFunc_viid=env.nullFunc_viid;
  var nullFunc_iiiid=env.nullFunc_iiiid;
  var nullFunc_viiii=env.nullFunc_viiii;
  var invoke_viiiii=env.invoke_viiiii;
  var invoke_vid=env.invoke_vid;
  var invoke_vi=env.invoke_vi;
  var invoke_vii=env.invoke_vii;
  var invoke_iiiiiiiiiii=env.invoke_iiiiiiiiiii;
  var invoke_ii=env.invoke_ii;
  var invoke_viiiiiiiiiii=env.invoke_viiiiiiiiiii;
  var invoke_iiiiii=env.invoke_iiiiii;
  var invoke_viiiiiidddii=env.invoke_viiiiiidddii;
  var invoke_iiii=env.invoke_iiii;
  var invoke_viiiiii=env.invoke_viiiiii;
  var invoke_di=env.invoke_di;
  var invoke_viiiiiiiiii=env.invoke_viiiiiiiiii;
  var invoke_iii=env.invoke_iii;
  var invoke_diii=env.invoke_diii;
  var invoke_dii=env.invoke_dii;
  var invoke_i=env.invoke_i;
  var invoke_iiiii=env.invoke_iiiii;
  var invoke_viiid=env.invoke_viiid;
  var invoke_viii=env.invoke_viii;
  var invoke_iiiiiiiiiidd=env.invoke_iiiiiiiiiidd;
  var invoke_v=env.invoke_v;
  var invoke_viid=env.invoke_viid;
  var invoke_iiiid=env.invoke_iiiid;
  var invoke_viiii=env.invoke_viiii;
  var _fabs=env._fabs;
  var _exp=env._exp;
  var floatReadValueFromPointer=env.floatReadValueFromPointer;
  var simpleReadValueFromPointer=env.simpleReadValueFromPointer;
  var _log=env._log;
  var throwInternalError=env.throwInternalError;
  var get_first_emval=env.get_first_emval;
  var getLiveInheritedInstances=env.getLiveInheritedInstances;
  var ___assert_fail=env.___assert_fail;
  var __ZSt18uncaught_exceptionv=env.__ZSt18uncaught_exceptionv;
  var ClassHandle=env.ClassHandle;
  var getShiftFromSize=env.getShiftFromSize;
  var _emscripten_set_main_loop_timing=env._emscripten_set_main_loop_timing;
  var _sbrk=env._sbrk;
  var ___cxa_begin_catch=env.___cxa_begin_catch;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var runDestructor=env.runDestructor;
  var _sysconf=env._sysconf;
  var throwInstanceAlreadyDeleted=env.throwInstanceAlreadyDeleted;
  var __embind_register_std_string=env.__embind_register_std_string;
  var init_RegisteredPointer=env.init_RegisteredPointer;
  var ClassHandle_isAliasOf=env.ClassHandle_isAliasOf;
  var flushPendingDeletes=env.flushPendingDeletes;
  var __embind_register_enum_value=env.__embind_register_enum_value;
  var makeClassHandle=env.makeClassHandle;
  var whenDependentTypesAreResolved=env.whenDependentTypesAreResolved;
  var __embind_register_class_constructor=env.__embind_register_class_constructor;
  var init_ClassHandle=env.init_ClassHandle;
  var _pthread_cleanup_push=env._pthread_cleanup_push;
  var ___syscall140=env.___syscall140;
  var ClassHandle_clone=env.ClassHandle_clone;
  var ___syscall146=env.___syscall146;
  var _pthread_cleanup_pop=env._pthread_cleanup_pop;
  var RegisteredClass=env.RegisteredClass;
  var ___cxa_free_exception=env.___cxa_free_exception;
  var ___cxa_find_matching_catch=env.___cxa_find_matching_catch;
  var __embind_register_value_object_field=env.__embind_register_value_object_field;
  var __embind_register_emval=env.__embind_register_emval;
  var ___setErrNo=env.___setErrNo;
  var __embind_register_bool=env.__embind_register_bool;
  var ___resumeException=env.___resumeException;
  var createNamedFunction=env.createNamedFunction;
  var embind_init_charCodes=env.embind_init_charCodes;
  var __embind_finalize_value_object=env.__embind_finalize_value_object;
  var __emval_decref=env.__emval_decref;
  var _pthread_once=env._pthread_once;
  var init_embind=env.init_embind;
  var constNoSmartPtrRawPointerToWireType=env.constNoSmartPtrRawPointerToWireType;
  var heap32VectorToArray=env.heap32VectorToArray;
  var ClassHandle_delete=env.ClassHandle_delete;
  var RegisteredPointer_destructor=env.RegisteredPointer_destructor;
  var ___syscall6=env.___syscall6;
  var ensureOverloadTable=env.ensureOverloadTable;
  var _time=env._time;
  var new_=env.new_;
  var downcastPointer=env.downcastPointer;
  var replacePublicSymbol=env.replacePublicSymbol;
  var __embind_register_class=env.__embind_register_class;
  var ClassHandle_deleteLater=env.ClassHandle_deleteLater;
  var ___syscall54=env.___syscall54;
  var RegisteredPointer_deleteObject=env.RegisteredPointer_deleteObject;
  var ClassHandle_isDeleted=env.ClassHandle_isDeleted;
  var __embind_register_integer=env.__embind_register_integer;
  var ___cxa_allocate_exception=env.___cxa_allocate_exception;
  var __emval_take_value=env.__emval_take_value;
  var ___cxa_end_catch=env.___cxa_end_catch;
  var __embind_register_value_object=env.__embind_register_value_object;
  var enumReadValueFromPointer=env.enumReadValueFromPointer;
  var _embind_repr=env._embind_repr;
  var _pthread_getspecific=env._pthread_getspecific;
  var RegisteredPointer=env.RegisteredPointer;
  var craftInvokerFunction=env.craftInvokerFunction;
  var runDestructors=env.runDestructors;
  var requireRegisteredType=env.requireRegisteredType;
  var makeLegalFunctionName=env.makeLegalFunctionName;
  var _pthread_key_create=env._pthread_key_create;
  var upcastPointer=env.upcastPointer;
  var init_emval=env.init_emval;
  var shallowCopyInternalPointer=env.shallowCopyInternalPointer;
  var nonConstNoSmartPtrRawPointerToWireType=env.nonConstNoSmartPtrRawPointerToWireType;
  var _abort=env._abort;
  var throwBindingError=env.throwBindingError;
  var getTypeName=env.getTypeName;
  var exposePublicSymbol=env.exposePublicSymbol;
  var RegisteredPointer_fromWireType=env.RegisteredPointer_fromWireType;
  var ___cxa_pure_virtual=env.___cxa_pure_virtual;
  var ___lock=env.___lock;
  var __embind_register_memory_view=env.__embind_register_memory_view;
  var getInheritedInstance=env.getInheritedInstance;
  var setDelayFunction=env.setDelayFunction;
  var ___gxx_personality_v0=env.___gxx_personality_v0;
  var extendError=env.extendError;
  var __embind_register_void=env.__embind_register_void;
  var RegisteredPointer_getPointee=env.RegisteredPointer_getPointee;
  var __emval_register=env.__emval_register;
  var __embind_register_std_wstring=env.__embind_register_std_wstring;
  var __embind_register_class_function=env.__embind_register_class_function;
  var __emval_incref=env.__emval_incref;
  var throwUnboundTypeError=env.throwUnboundTypeError;
  var readLatin1String=env.readLatin1String;
  var _pthread_self=env._pthread_self;
  var getBasestPointer=env.getBasestPointer;
  var getInheritedInstanceCount=env.getInheritedInstanceCount;
  var __embind_register_float=env.__embind_register_float;
  var integerReadValueFromPointer=env.integerReadValueFromPointer;
  var ___unlock=env.___unlock;
  var _emscripten_set_main_loop=env._emscripten_set_main_loop;
  var _pthread_setspecific=env._pthread_setspecific;
  var genericPointerToWireType=env.genericPointerToWireType;
  var registerType=env.registerType;
  var ___cxa_throw=env.___cxa_throw;
  var __embind_register_enum=env.__embind_register_enum;
  var count_emval_handles=env.count_emval_handles;
  var requireFunction=env.requireFunction;
  var _sqrt=env._sqrt;
  var tempFloat = 0.0;

function _emscripten_replace_memory(newBuffer) {
  if ((byteLength(newBuffer) & 0xffffff || byteLength(newBuffer) <= 0xffffff) || byteLength(newBuffer) > 0x80000000) return false;
  HEAP8 = new Int8View(newBuffer);
  HEAP16 = new Int16View(newBuffer);
  HEAP32 = new Int32View(newBuffer);
  HEAPU8 = new Uint8View(newBuffer);
  HEAPU16 = new Uint16View(newBuffer);
  HEAPU32 = new Uint32View(newBuffer);
  HEAPF32 = new Float32View(newBuffer);
  HEAPF64 = new Float64View(newBuffer);
  buffer = newBuffer;
  return true;
}

// EMSCRIPTEN_START_FUNCS
function _malloc(i2) {
 i2 = i2 | 0;
 var i1 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0;
 do if (i2 >>> 0 < 245) {
  i14 = i2 >>> 0 < 11 ? 16 : i2 + 11 & -8;
  i2 = i14 >>> 3;
  i8 = HEAP32[707] | 0;
  i3 = i8 >>> i2;
  if (i3 & 3) {
   i2 = (i3 & 1 ^ 1) + i2 | 0;
   i4 = i2 << 1;
   i3 = 2868 + (i4 << 2) | 0;
   i4 = 2868 + (i4 + 2 << 2) | 0;
   i5 = HEAP32[i4 >> 2] | 0;
   i6 = i5 + 8 | 0;
   i7 = HEAP32[i6 >> 2] | 0;
   do if ((i3 | 0) != (i7 | 0)) {
    if (i7 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort();
    i1 = i7 + 12 | 0;
    if ((HEAP32[i1 >> 2] | 0) == (i5 | 0)) {
     HEAP32[i1 >> 2] = i3;
     HEAP32[i4 >> 2] = i7;
     break;
    } else _abort();
   } else HEAP32[707] = i8 & ~(1 << i2); while (0);
   i38 = i2 << 3;
   HEAP32[i5 + 4 >> 2] = i38 | 3;
   i38 = i5 + (i38 | 4) | 0;
   HEAP32[i38 >> 2] = HEAP32[i38 >> 2] | 1;
   i38 = i6;
   return i38 | 0;
  }
  i7 = HEAP32[709] | 0;
  if (i14 >>> 0 > i7 >>> 0) {
   if (i3) {
    i4 = 2 << i2;
    i4 = i3 << i2 & (i4 | 0 - i4);
    i4 = (i4 & 0 - i4) + -1 | 0;
    i9 = i4 >>> 12 & 16;
    i4 = i4 >>> i9;
    i5 = i4 >>> 5 & 8;
    i4 = i4 >>> i5;
    i6 = i4 >>> 2 & 4;
    i4 = i4 >>> i6;
    i3 = i4 >>> 1 & 2;
    i4 = i4 >>> i3;
    i2 = i4 >>> 1 & 1;
    i2 = (i5 | i9 | i6 | i3 | i2) + (i4 >>> i2) | 0;
    i4 = i2 << 1;
    i3 = 2868 + (i4 << 2) | 0;
    i4 = 2868 + (i4 + 2 << 2) | 0;
    i6 = HEAP32[i4 >> 2] | 0;
    i9 = i6 + 8 | 0;
    i5 = HEAP32[i9 >> 2] | 0;
    do if ((i3 | 0) != (i5 | 0)) {
     if (i5 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort();
     i1 = i5 + 12 | 0;
     if ((HEAP32[i1 >> 2] | 0) == (i6 | 0)) {
      HEAP32[i1 >> 2] = i3;
      HEAP32[i4 >> 2] = i5;
      i10 = HEAP32[709] | 0;
      break;
     } else _abort();
    } else {
     HEAP32[707] = i8 & ~(1 << i2);
     i10 = i7;
    } while (0);
    i38 = i2 << 3;
    i7 = i38 - i14 | 0;
    HEAP32[i6 + 4 >> 2] = i14 | 3;
    i8 = i6 + i14 | 0;
    HEAP32[i6 + (i14 | 4) >> 2] = i7 | 1;
    HEAP32[i6 + i38 >> 2] = i7;
    if (i10) {
     i5 = HEAP32[712] | 0;
     i3 = i10 >>> 3;
     i1 = i3 << 1;
     i4 = 2868 + (i1 << 2) | 0;
     i2 = HEAP32[707] | 0;
     i3 = 1 << i3;
     if (i2 & i3) {
      i2 = 2868 + (i1 + 2 << 2) | 0;
      i1 = HEAP32[i2 >> 2] | 0;
      if (i1 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
       i11 = i2;
       i12 = i1;
      }
     } else {
      HEAP32[707] = i2 | i3;
      i11 = 2868 + (i1 + 2 << 2) | 0;
      i12 = i4;
     }
     HEAP32[i11 >> 2] = i5;
     HEAP32[i12 + 12 >> 2] = i5;
     HEAP32[i5 + 8 >> 2] = i12;
     HEAP32[i5 + 12 >> 2] = i4;
    }
    HEAP32[709] = i7;
    HEAP32[712] = i8;
    i38 = i9;
    return i38 | 0;
   }
   i2 = HEAP32[708] | 0;
   if (i2) {
    i3 = (i2 & 0 - i2) + -1 | 0;
    i37 = i3 >>> 12 & 16;
    i3 = i3 >>> i37;
    i36 = i3 >>> 5 & 8;
    i3 = i3 >>> i36;
    i38 = i3 >>> 2 & 4;
    i3 = i3 >>> i38;
    i2 = i3 >>> 1 & 2;
    i3 = i3 >>> i2;
    i4 = i3 >>> 1 & 1;
    i4 = HEAP32[3132 + ((i36 | i37 | i38 | i2 | i4) + (i3 >>> i4) << 2) >> 2] | 0;
    i3 = (HEAP32[i4 + 4 >> 2] & -8) - i14 | 0;
    i2 = i4;
    while (1) {
     i1 = HEAP32[i2 + 16 >> 2] | 0;
     if (!i1) {
      i1 = HEAP32[i2 + 20 >> 2] | 0;
      if (!i1) {
       i9 = i3;
       break;
      }
     }
     i2 = (HEAP32[i1 + 4 >> 2] & -8) - i14 | 0;
     i38 = i2 >>> 0 < i3 >>> 0;
     i3 = i38 ? i2 : i3;
     i2 = i1;
     i4 = i38 ? i1 : i4;
    }
    i6 = HEAP32[711] | 0;
    if (i4 >>> 0 < i6 >>> 0) _abort();
    i8 = i4 + i14 | 0;
    if (i4 >>> 0 >= i8 >>> 0) _abort();
    i7 = HEAP32[i4 + 24 >> 2] | 0;
    i3 = HEAP32[i4 + 12 >> 2] | 0;
    do if ((i3 | 0) == (i4 | 0)) {
     i2 = i4 + 20 | 0;
     i1 = HEAP32[i2 >> 2] | 0;
     if (!i1) {
      i2 = i4 + 16 | 0;
      i1 = HEAP32[i2 >> 2] | 0;
      if (!i1) {
       i13 = 0;
       break;
      }
     }
     while (1) {
      i3 = i1 + 20 | 0;
      i5 = HEAP32[i3 >> 2] | 0;
      if (i5) {
       i1 = i5;
       i2 = i3;
       continue;
      }
      i3 = i1 + 16 | 0;
      i5 = HEAP32[i3 >> 2] | 0;
      if (!i5) break; else {
       i1 = i5;
       i2 = i3;
      }
     }
     if (i2 >>> 0 < i6 >>> 0) _abort(); else {
      HEAP32[i2 >> 2] = 0;
      i13 = i1;
      break;
     }
    } else {
     i5 = HEAP32[i4 + 8 >> 2] | 0;
     if (i5 >>> 0 < i6 >>> 0) _abort();
     i1 = i5 + 12 | 0;
     if ((HEAP32[i1 >> 2] | 0) != (i4 | 0)) _abort();
     i2 = i3 + 8 | 0;
     if ((HEAP32[i2 >> 2] | 0) == (i4 | 0)) {
      HEAP32[i1 >> 2] = i3;
      HEAP32[i2 >> 2] = i5;
      i13 = i3;
      break;
     } else _abort();
    } while (0);
    do if (i7) {
     i1 = HEAP32[i4 + 28 >> 2] | 0;
     i2 = 3132 + (i1 << 2) | 0;
     if ((i4 | 0) == (HEAP32[i2 >> 2] | 0)) {
      HEAP32[i2 >> 2] = i13;
      if (!i13) {
       HEAP32[708] = HEAP32[708] & ~(1 << i1);
       break;
      }
     } else {
      if (i7 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort();
      i1 = i7 + 16 | 0;
      if ((HEAP32[i1 >> 2] | 0) == (i4 | 0)) HEAP32[i1 >> 2] = i13; else HEAP32[i7 + 20 >> 2] = i13;
      if (!i13) break;
     }
     i2 = HEAP32[711] | 0;
     if (i13 >>> 0 < i2 >>> 0) _abort();
     HEAP32[i13 + 24 >> 2] = i7;
     i1 = HEAP32[i4 + 16 >> 2] | 0;
     do if (i1) if (i1 >>> 0 < i2 >>> 0) _abort(); else {
      HEAP32[i13 + 16 >> 2] = i1;
      HEAP32[i1 + 24 >> 2] = i13;
      break;
     } while (0);
     i1 = HEAP32[i4 + 20 >> 2] | 0;
     if (i1) if (i1 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
      HEAP32[i13 + 20 >> 2] = i1;
      HEAP32[i1 + 24 >> 2] = i13;
      break;
     }
    } while (0);
    if (i9 >>> 0 < 16) {
     i38 = i9 + i14 | 0;
     HEAP32[i4 + 4 >> 2] = i38 | 3;
     i38 = i4 + (i38 + 4) | 0;
     HEAP32[i38 >> 2] = HEAP32[i38 >> 2] | 1;
    } else {
     HEAP32[i4 + 4 >> 2] = i14 | 3;
     HEAP32[i4 + (i14 | 4) >> 2] = i9 | 1;
     HEAP32[i4 + (i9 + i14) >> 2] = i9;
     i1 = HEAP32[709] | 0;
     if (i1) {
      i6 = HEAP32[712] | 0;
      i3 = i1 >>> 3;
      i1 = i3 << 1;
      i5 = 2868 + (i1 << 2) | 0;
      i2 = HEAP32[707] | 0;
      i3 = 1 << i3;
      if (i2 & i3) {
       i1 = 2868 + (i1 + 2 << 2) | 0;
       i2 = HEAP32[i1 >> 2] | 0;
       if (i2 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
        i15 = i1;
        i16 = i2;
       }
      } else {
       HEAP32[707] = i2 | i3;
       i15 = 2868 + (i1 + 2 << 2) | 0;
       i16 = i5;
      }
      HEAP32[i15 >> 2] = i6;
      HEAP32[i16 + 12 >> 2] = i6;
      HEAP32[i6 + 8 >> 2] = i16;
      HEAP32[i6 + 12 >> 2] = i5;
     }
     HEAP32[709] = i9;
     HEAP32[712] = i8;
    }
    i38 = i4 + 8 | 0;
    return i38 | 0;
   } else i16 = i14;
  } else i16 = i14;
 } else if (i2 >>> 0 <= 4294967231) {
  i2 = i2 + 11 | 0;
  i12 = i2 & -8;
  i11 = HEAP32[708] | 0;
  if (i11) {
   i3 = 0 - i12 | 0;
   i2 = i2 >>> 8;
   if (i2) if (i12 >>> 0 > 16777215) i10 = 31; else {
    i16 = (i2 + 1048320 | 0) >>> 16 & 8;
    i21 = i2 << i16;
    i15 = (i21 + 520192 | 0) >>> 16 & 4;
    i21 = i21 << i15;
    i10 = (i21 + 245760 | 0) >>> 16 & 2;
    i10 = 14 - (i15 | i16 | i10) + (i21 << i10 >>> 15) | 0;
    i10 = i12 >>> (i10 + 7 | 0) & 1 | i10 << 1;
   } else i10 = 0;
   i2 = HEAP32[3132 + (i10 << 2) >> 2] | 0;
   L123 : do if (!i2) {
    i5 = 0;
    i2 = 0;
    i21 = 86;
   } else {
    i7 = i3;
    i5 = 0;
    i8 = i12 << ((i10 | 0) == 31 ? 0 : 25 - (i10 >>> 1) | 0);
    i9 = i2;
    i2 = 0;
    while (1) {
     i6 = HEAP32[i9 + 4 >> 2] & -8;
     i3 = i6 - i12 | 0;
     if (i3 >>> 0 < i7 >>> 0) if ((i6 | 0) == (i12 | 0)) {
      i6 = i9;
      i2 = i9;
      i21 = 90;
      break L123;
     } else i2 = i9; else i3 = i7;
     i21 = HEAP32[i9 + 20 >> 2] | 0;
     i9 = HEAP32[i9 + 16 + (i8 >>> 31 << 2) >> 2] | 0;
     i5 = (i21 | 0) == 0 | (i21 | 0) == (i9 | 0) ? i5 : i21;
     if (!i9) {
      i21 = 86;
      break;
     } else {
      i7 = i3;
      i8 = i8 << 1;
     }
    }
   } while (0);
   if ((i21 | 0) == 86) {
    if ((i5 | 0) == 0 & (i2 | 0) == 0) {
     i2 = 2 << i10;
     i2 = i11 & (i2 | 0 - i2);
     if (!i2) {
      i16 = i12;
      break;
     }
     i2 = (i2 & 0 - i2) + -1 | 0;
     i13 = i2 >>> 12 & 16;
     i2 = i2 >>> i13;
     i11 = i2 >>> 5 & 8;
     i2 = i2 >>> i11;
     i15 = i2 >>> 2 & 4;
     i2 = i2 >>> i15;
     i16 = i2 >>> 1 & 2;
     i2 = i2 >>> i16;
     i5 = i2 >>> 1 & 1;
     i5 = HEAP32[3132 + ((i11 | i13 | i15 | i16 | i5) + (i2 >>> i5) << 2) >> 2] | 0;
     i2 = 0;
    }
    if (!i5) {
     i8 = i3;
     i9 = i2;
    } else {
     i6 = i5;
     i21 = 90;
    }
   }
   if ((i21 | 0) == 90) while (1) {
    i21 = 0;
    i16 = (HEAP32[i6 + 4 >> 2] & -8) - i12 | 0;
    i5 = i16 >>> 0 < i3 >>> 0;
    i3 = i5 ? i16 : i3;
    i2 = i5 ? i6 : i2;
    i5 = HEAP32[i6 + 16 >> 2] | 0;
    if (i5) {
     i6 = i5;
     i21 = 90;
     continue;
    }
    i6 = HEAP32[i6 + 20 >> 2] | 0;
    if (!i6) {
     i8 = i3;
     i9 = i2;
     break;
    } else i21 = 90;
   }
   if ((i9 | 0) != 0 ? i8 >>> 0 < ((HEAP32[709] | 0) - i12 | 0) >>> 0 : 0) {
    i5 = HEAP32[711] | 0;
    if (i9 >>> 0 < i5 >>> 0) _abort();
    i7 = i9 + i12 | 0;
    if (i9 >>> 0 >= i7 >>> 0) _abort();
    i6 = HEAP32[i9 + 24 >> 2] | 0;
    i3 = HEAP32[i9 + 12 >> 2] | 0;
    do if ((i3 | 0) == (i9 | 0)) {
     i2 = i9 + 20 | 0;
     i1 = HEAP32[i2 >> 2] | 0;
     if (!i1) {
      i2 = i9 + 16 | 0;
      i1 = HEAP32[i2 >> 2] | 0;
      if (!i1) {
       i14 = 0;
       break;
      }
     }
     while (1) {
      i3 = i1 + 20 | 0;
      i4 = HEAP32[i3 >> 2] | 0;
      if (i4) {
       i1 = i4;
       i2 = i3;
       continue;
      }
      i3 = i1 + 16 | 0;
      i4 = HEAP32[i3 >> 2] | 0;
      if (!i4) break; else {
       i1 = i4;
       i2 = i3;
      }
     }
     if (i2 >>> 0 < i5 >>> 0) _abort(); else {
      HEAP32[i2 >> 2] = 0;
      i14 = i1;
      break;
     }
    } else {
     i4 = HEAP32[i9 + 8 >> 2] | 0;
     if (i4 >>> 0 < i5 >>> 0) _abort();
     i1 = i4 + 12 | 0;
     if ((HEAP32[i1 >> 2] | 0) != (i9 | 0)) _abort();
     i2 = i3 + 8 | 0;
     if ((HEAP32[i2 >> 2] | 0) == (i9 | 0)) {
      HEAP32[i1 >> 2] = i3;
      HEAP32[i2 >> 2] = i4;
      i14 = i3;
      break;
     } else _abort();
    } while (0);
    do if (i6) {
     i1 = HEAP32[i9 + 28 >> 2] | 0;
     i2 = 3132 + (i1 << 2) | 0;
     if ((i9 | 0) == (HEAP32[i2 >> 2] | 0)) {
      HEAP32[i2 >> 2] = i14;
      if (!i14) {
       HEAP32[708] = HEAP32[708] & ~(1 << i1);
       break;
      }
     } else {
      if (i6 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort();
      i1 = i6 + 16 | 0;
      if ((HEAP32[i1 >> 2] | 0) == (i9 | 0)) HEAP32[i1 >> 2] = i14; else HEAP32[i6 + 20 >> 2] = i14;
      if (!i14) break;
     }
     i2 = HEAP32[711] | 0;
     if (i14 >>> 0 < i2 >>> 0) _abort();
     HEAP32[i14 + 24 >> 2] = i6;
     i1 = HEAP32[i9 + 16 >> 2] | 0;
     do if (i1) if (i1 >>> 0 < i2 >>> 0) _abort(); else {
      HEAP32[i14 + 16 >> 2] = i1;
      HEAP32[i1 + 24 >> 2] = i14;
      break;
     } while (0);
     i1 = HEAP32[i9 + 20 >> 2] | 0;
     if (i1) if (i1 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
      HEAP32[i14 + 20 >> 2] = i1;
      HEAP32[i1 + 24 >> 2] = i14;
      break;
     }
    } while (0);
    L199 : do if (i8 >>> 0 >= 16) {
     HEAP32[i9 + 4 >> 2] = i12 | 3;
     HEAP32[i9 + (i12 | 4) >> 2] = i8 | 1;
     HEAP32[i9 + (i8 + i12) >> 2] = i8;
     i1 = i8 >>> 3;
     if (i8 >>> 0 < 256) {
      i2 = i1 << 1;
      i4 = 2868 + (i2 << 2) | 0;
      i3 = HEAP32[707] | 0;
      i1 = 1 << i1;
      if (i3 & i1) {
       i1 = 2868 + (i2 + 2 << 2) | 0;
       i2 = HEAP32[i1 >> 2] | 0;
       if (i2 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
        i18 = i1;
        i19 = i2;
       }
      } else {
       HEAP32[707] = i3 | i1;
       i18 = 2868 + (i2 + 2 << 2) | 0;
       i19 = i4;
      }
      HEAP32[i18 >> 2] = i7;
      HEAP32[i19 + 12 >> 2] = i7;
      HEAP32[i9 + (i12 + 8) >> 2] = i19;
      HEAP32[i9 + (i12 + 12) >> 2] = i4;
      break;
     }
     i1 = i8 >>> 8;
     if (i1) if (i8 >>> 0 > 16777215) i4 = 31; else {
      i37 = (i1 + 1048320 | 0) >>> 16 & 8;
      i38 = i1 << i37;
      i36 = (i38 + 520192 | 0) >>> 16 & 4;
      i38 = i38 << i36;
      i4 = (i38 + 245760 | 0) >>> 16 & 2;
      i4 = 14 - (i36 | i37 | i4) + (i38 << i4 >>> 15) | 0;
      i4 = i8 >>> (i4 + 7 | 0) & 1 | i4 << 1;
     } else i4 = 0;
     i1 = 3132 + (i4 << 2) | 0;
     HEAP32[i9 + (i12 + 28) >> 2] = i4;
     HEAP32[i9 + (i12 + 20) >> 2] = 0;
     HEAP32[i9 + (i12 + 16) >> 2] = 0;
     i2 = HEAP32[708] | 0;
     i3 = 1 << i4;
     if (!(i2 & i3)) {
      HEAP32[708] = i2 | i3;
      HEAP32[i1 >> 2] = i7;
      HEAP32[i9 + (i12 + 24) >> 2] = i1;
      HEAP32[i9 + (i12 + 12) >> 2] = i7;
      HEAP32[i9 + (i12 + 8) >> 2] = i7;
      break;
     }
     i1 = HEAP32[i1 >> 2] | 0;
     L217 : do if ((HEAP32[i1 + 4 >> 2] & -8 | 0) != (i8 | 0)) {
      i4 = i8 << ((i4 | 0) == 31 ? 0 : 25 - (i4 >>> 1) | 0);
      while (1) {
       i2 = i1 + 16 + (i4 >>> 31 << 2) | 0;
       i3 = HEAP32[i2 >> 2] | 0;
       if (!i3) break;
       if ((HEAP32[i3 + 4 >> 2] & -8 | 0) == (i8 | 0)) {
        i24 = i3;
        break L217;
       } else {
        i4 = i4 << 1;
        i1 = i3;
       }
      }
      if (i2 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
       HEAP32[i2 >> 2] = i7;
       HEAP32[i9 + (i12 + 24) >> 2] = i1;
       HEAP32[i9 + (i12 + 12) >> 2] = i7;
       HEAP32[i9 + (i12 + 8) >> 2] = i7;
       break L199;
      }
     } else i24 = i1; while (0);
     i1 = i24 + 8 | 0;
     i2 = HEAP32[i1 >> 2] | 0;
     i38 = HEAP32[711] | 0;
     if (i2 >>> 0 >= i38 >>> 0 & i24 >>> 0 >= i38 >>> 0) {
      HEAP32[i2 + 12 >> 2] = i7;
      HEAP32[i1 >> 2] = i7;
      HEAP32[i9 + (i12 + 8) >> 2] = i2;
      HEAP32[i9 + (i12 + 12) >> 2] = i24;
      HEAP32[i9 + (i12 + 24) >> 2] = 0;
      break;
     } else _abort();
    } else {
     i38 = i8 + i12 | 0;
     HEAP32[i9 + 4 >> 2] = i38 | 3;
     i38 = i9 + (i38 + 4) | 0;
     HEAP32[i38 >> 2] = HEAP32[i38 >> 2] | 1;
    } while (0);
    i38 = i9 + 8 | 0;
    return i38 | 0;
   } else i16 = i12;
  } else i16 = i12;
 } else i16 = -1; while (0);
 i3 = HEAP32[709] | 0;
 if (i3 >>> 0 >= i16 >>> 0) {
  i1 = i3 - i16 | 0;
  i2 = HEAP32[712] | 0;
  if (i1 >>> 0 > 15) {
   HEAP32[712] = i2 + i16;
   HEAP32[709] = i1;
   HEAP32[i2 + (i16 + 4) >> 2] = i1 | 1;
   HEAP32[i2 + i3 >> 2] = i1;
   HEAP32[i2 + 4 >> 2] = i16 | 3;
  } else {
   HEAP32[709] = 0;
   HEAP32[712] = 0;
   HEAP32[i2 + 4 >> 2] = i3 | 3;
   i38 = i2 + (i3 + 4) | 0;
   HEAP32[i38 >> 2] = HEAP32[i38 >> 2] | 1;
  }
  i38 = i2 + 8 | 0;
  return i38 | 0;
 }
 i2 = HEAP32[710] | 0;
 if (i2 >>> 0 > i16 >>> 0) {
  i37 = i2 - i16 | 0;
  HEAP32[710] = i37;
  i38 = HEAP32[713] | 0;
  HEAP32[713] = i38 + i16;
  HEAP32[i38 + (i16 + 4) >> 2] = i37 | 1;
  HEAP32[i38 + 4 >> 2] = i16 | 3;
  i38 = i38 + 8 | 0;
  return i38 | 0;
 }
 do if (!(HEAP32[825] | 0)) {
  i2 = _sysconf(30) | 0;
  if (!(i2 + -1 & i2)) {
   HEAP32[827] = i2;
   HEAP32[826] = i2;
   HEAP32[828] = -1;
   HEAP32[829] = -1;
   HEAP32[830] = 0;
   HEAP32[818] = 0;
   i24 = (_time(0) | 0) & -16 ^ 1431655768;
   HEAP32[825] = i24;
   break;
  } else _abort();
 } while (0);
 i9 = i16 + 48 | 0;
 i8 = HEAP32[827] | 0;
 i10 = i16 + 47 | 0;
 i7 = i8 + i10 | 0;
 i8 = 0 - i8 | 0;
 i11 = i7 & i8;
 if (i11 >>> 0 <= i16 >>> 0) {
  i38 = 0;
  return i38 | 0;
 }
 i2 = HEAP32[817] | 0;
 if ((i2 | 0) != 0 ? (i19 = HEAP32[815] | 0, i24 = i19 + i11 | 0, i24 >>> 0 <= i19 >>> 0 | i24 >>> 0 > i2 >>> 0) : 0) {
  i38 = 0;
  return i38 | 0;
 }
 L258 : do if (!(HEAP32[818] & 4)) {
  i2 = HEAP32[713] | 0;
  L260 : do if (i2) {
   i5 = 3276;
   while (1) {
    i3 = HEAP32[i5 >> 2] | 0;
    if (i3 >>> 0 <= i2 >>> 0 ? (i17 = i5 + 4 | 0, (i3 + (HEAP32[i17 >> 2] | 0) | 0) >>> 0 > i2 >>> 0) : 0) {
     i6 = i5;
     i2 = i17;
     break;
    }
    i5 = HEAP32[i5 + 8 >> 2] | 0;
    if (!i5) {
     i21 = 174;
     break L260;
    }
   }
   i3 = i7 - (HEAP32[710] | 0) & i8;
   if (i3 >>> 0 < 2147483647) {
    i5 = _sbrk(i3 | 0) | 0;
    i24 = (i5 | 0) == ((HEAP32[i6 >> 2] | 0) + (HEAP32[i2 >> 2] | 0) | 0);
    i2 = i24 ? i3 : 0;
    if (i24) {
     if ((i5 | 0) != (-1 | 0)) {
      i22 = i5;
      i15 = i2;
      i21 = 194;
      break L258;
     }
    } else i21 = 184;
   } else i2 = 0;
  } else i21 = 174; while (0);
  do if ((i21 | 0) == 174) {
   i6 = _sbrk(0) | 0;
   if ((i6 | 0) != (-1 | 0)) {
    i2 = i6;
    i3 = HEAP32[826] | 0;
    i5 = i3 + -1 | 0;
    if (!(i5 & i2)) i3 = i11; else i3 = i11 - i2 + (i5 + i2 & 0 - i3) | 0;
    i2 = HEAP32[815] | 0;
    i5 = i2 + i3 | 0;
    if (i3 >>> 0 > i16 >>> 0 & i3 >>> 0 < 2147483647) {
     i24 = HEAP32[817] | 0;
     if ((i24 | 0) != 0 ? i5 >>> 0 <= i2 >>> 0 | i5 >>> 0 > i24 >>> 0 : 0) {
      i2 = 0;
      break;
     }
     i5 = _sbrk(i3 | 0) | 0;
     i24 = (i5 | 0) == (i6 | 0);
     i2 = i24 ? i3 : 0;
     if (i24) {
      i22 = i6;
      i15 = i2;
      i21 = 194;
      break L258;
     } else i21 = 184;
    } else i2 = 0;
   } else i2 = 0;
  } while (0);
  L280 : do if ((i21 | 0) == 184) {
   i6 = 0 - i3 | 0;
   do if (i9 >>> 0 > i3 >>> 0 & (i3 >>> 0 < 2147483647 & (i5 | 0) != (-1 | 0)) ? (i20 = HEAP32[827] | 0, i20 = i10 - i3 + i20 & 0 - i20, i20 >>> 0 < 2147483647) : 0) if ((_sbrk(i20 | 0) | 0) == (-1 | 0)) {
    _sbrk(i6 | 0) | 0;
    break L280;
   } else {
    i3 = i20 + i3 | 0;
    break;
   } while (0);
   if ((i5 | 0) != (-1 | 0)) {
    i22 = i5;
    i15 = i3;
    i21 = 194;
    break L258;
   }
  } while (0);
  HEAP32[818] = HEAP32[818] | 4;
  i21 = 191;
 } else {
  i2 = 0;
  i21 = 191;
 } while (0);
 if ((((i21 | 0) == 191 ? i11 >>> 0 < 2147483647 : 0) ? (i22 = _sbrk(i11 | 0) | 0, i23 = _sbrk(0) | 0, i22 >>> 0 < i23 >>> 0 & ((i22 | 0) != (-1 | 0) & (i23 | 0) != (-1 | 0))) : 0) ? (i25 = i23 - i22 | 0, i26 = i25 >>> 0 > (i16 + 40 | 0) >>> 0, i26) : 0) {
  i15 = i26 ? i25 : i2;
  i21 = 194;
 }
 if ((i21 | 0) == 194) {
  i2 = (HEAP32[815] | 0) + i15 | 0;
  HEAP32[815] = i2;
  if (i2 >>> 0 > (HEAP32[816] | 0) >>> 0) HEAP32[816] = i2;
  i7 = HEAP32[713] | 0;
  L299 : do if (i7) {
   i6 = 3276;
   do {
    i2 = HEAP32[i6 >> 2] | 0;
    i3 = i6 + 4 | 0;
    i5 = HEAP32[i3 >> 2] | 0;
    if ((i22 | 0) == (i2 + i5 | 0)) {
     i27 = i2;
     i28 = i3;
     i29 = i5;
     i30 = i6;
     i21 = 204;
     break;
    }
    i6 = HEAP32[i6 + 8 >> 2] | 0;
   } while ((i6 | 0) != 0);
   if (((i21 | 0) == 204 ? (HEAP32[i30 + 12 >> 2] & 8 | 0) == 0 : 0) ? i7 >>> 0 < i22 >>> 0 & i7 >>> 0 >= i27 >>> 0 : 0) {
    HEAP32[i28 >> 2] = i29 + i15;
    i38 = (HEAP32[710] | 0) + i15 | 0;
    i37 = i7 + 8 | 0;
    i37 = (i37 & 7 | 0) == 0 ? 0 : 0 - i37 & 7;
    i36 = i38 - i37 | 0;
    HEAP32[713] = i7 + i37;
    HEAP32[710] = i36;
    HEAP32[i7 + (i37 + 4) >> 2] = i36 | 1;
    HEAP32[i7 + (i38 + 4) >> 2] = 40;
    HEAP32[714] = HEAP32[829];
    break;
   }
   i2 = HEAP32[711] | 0;
   if (i22 >>> 0 < i2 >>> 0) {
    HEAP32[711] = i22;
    i2 = i22;
   }
   i3 = i22 + i15 | 0;
   i6 = 3276;
   while (1) {
    if ((HEAP32[i6 >> 2] | 0) == (i3 | 0)) {
     i5 = i6;
     i3 = i6;
     i21 = 212;
     break;
    }
    i6 = HEAP32[i6 + 8 >> 2] | 0;
    if (!i6) {
     i3 = 3276;
     break;
    }
   }
   if ((i21 | 0) == 212) if (!(HEAP32[i3 + 12 >> 2] & 8)) {
    HEAP32[i5 >> 2] = i22;
    i13 = i3 + 4 | 0;
    HEAP32[i13 >> 2] = (HEAP32[i13 >> 2] | 0) + i15;
    i13 = i22 + 8 | 0;
    i13 = (i13 & 7 | 0) == 0 ? 0 : 0 - i13 & 7;
    i10 = i22 + (i15 + 8) | 0;
    i10 = (i10 & 7 | 0) == 0 ? 0 : 0 - i10 & 7;
    i1 = i22 + (i10 + i15) | 0;
    i12 = i13 + i16 | 0;
    i14 = i22 + i12 | 0;
    i11 = i1 - (i22 + i13) - i16 | 0;
    HEAP32[i22 + (i13 + 4) >> 2] = i16 | 3;
    L324 : do if ((i1 | 0) != (i7 | 0)) {
     if ((i1 | 0) == (HEAP32[712] | 0)) {
      i38 = (HEAP32[709] | 0) + i11 | 0;
      HEAP32[709] = i38;
      HEAP32[712] = i14;
      HEAP32[i22 + (i12 + 4) >> 2] = i38 | 1;
      HEAP32[i22 + (i38 + i12) >> 2] = i38;
      break;
     }
     i8 = i15 + 4 | 0;
     i3 = HEAP32[i22 + (i8 + i10) >> 2] | 0;
     if ((i3 & 3 | 0) == 1) {
      i9 = i3 & -8;
      i6 = i3 >>> 3;
      L332 : do if (i3 >>> 0 >= 256) {
       i7 = HEAP32[i22 + ((i10 | 24) + i15) >> 2] | 0;
       i4 = HEAP32[i22 + (i15 + 12 + i10) >> 2] | 0;
       do if ((i4 | 0) == (i1 | 0)) {
        i5 = i10 | 16;
        i4 = i22 + (i8 + i5) | 0;
        i3 = HEAP32[i4 >> 2] | 0;
        if (!i3) {
         i4 = i22 + (i5 + i15) | 0;
         i3 = HEAP32[i4 >> 2] | 0;
         if (!i3) {
          i35 = 0;
          break;
         }
        }
        while (1) {
         i5 = i3 + 20 | 0;
         i6 = HEAP32[i5 >> 2] | 0;
         if (i6) {
          i3 = i6;
          i4 = i5;
          continue;
         }
         i5 = i3 + 16 | 0;
         i6 = HEAP32[i5 >> 2] | 0;
         if (!i6) break; else {
          i3 = i6;
          i4 = i5;
         }
        }
        if (i4 >>> 0 < i2 >>> 0) _abort(); else {
         HEAP32[i4 >> 2] = 0;
         i35 = i3;
         break;
        }
       } else {
        i5 = HEAP32[i22 + ((i10 | 8) + i15) >> 2] | 0;
        if (i5 >>> 0 < i2 >>> 0) _abort();
        i2 = i5 + 12 | 0;
        if ((HEAP32[i2 >> 2] | 0) != (i1 | 0)) _abort();
        i3 = i4 + 8 | 0;
        if ((HEAP32[i3 >> 2] | 0) == (i1 | 0)) {
         HEAP32[i2 >> 2] = i4;
         HEAP32[i3 >> 2] = i5;
         i35 = i4;
         break;
        } else _abort();
       } while (0);
       if (!i7) break;
       i2 = HEAP32[i22 + (i15 + 28 + i10) >> 2] | 0;
       i3 = 3132 + (i2 << 2) | 0;
       do if ((i1 | 0) != (HEAP32[i3 >> 2] | 0)) {
        if (i7 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort();
        i2 = i7 + 16 | 0;
        if ((HEAP32[i2 >> 2] | 0) == (i1 | 0)) HEAP32[i2 >> 2] = i35; else HEAP32[i7 + 20 >> 2] = i35;
        if (!i35) break L332;
       } else {
        HEAP32[i3 >> 2] = i35;
        if (i35) break;
        HEAP32[708] = HEAP32[708] & ~(1 << i2);
        break L332;
       } while (0);
       i3 = HEAP32[711] | 0;
       if (i35 >>> 0 < i3 >>> 0) _abort();
       HEAP32[i35 + 24 >> 2] = i7;
       i1 = i10 | 16;
       i2 = HEAP32[i22 + (i1 + i15) >> 2] | 0;
       do if (i2) if (i2 >>> 0 < i3 >>> 0) _abort(); else {
        HEAP32[i35 + 16 >> 2] = i2;
        HEAP32[i2 + 24 >> 2] = i35;
        break;
       } while (0);
       i1 = HEAP32[i22 + (i8 + i1) >> 2] | 0;
       if (!i1) break;
       if (i1 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
        HEAP32[i35 + 20 >> 2] = i1;
        HEAP32[i1 + 24 >> 2] = i35;
        break;
       }
      } else {
       i4 = HEAP32[i22 + ((i10 | 8) + i15) >> 2] | 0;
       i5 = HEAP32[i22 + (i15 + 12 + i10) >> 2] | 0;
       i3 = 2868 + (i6 << 1 << 2) | 0;
       do if ((i4 | 0) != (i3 | 0)) {
        if (i4 >>> 0 < i2 >>> 0) _abort();
        if ((HEAP32[i4 + 12 >> 2] | 0) == (i1 | 0)) break;
        _abort();
       } while (0);
       if ((i5 | 0) == (i4 | 0)) {
        HEAP32[707] = HEAP32[707] & ~(1 << i6);
        break;
       }
       do if ((i5 | 0) == (i3 | 0)) i31 = i5 + 8 | 0; else {
        if (i5 >>> 0 < i2 >>> 0) _abort();
        i2 = i5 + 8 | 0;
        if ((HEAP32[i2 >> 2] | 0) == (i1 | 0)) {
         i31 = i2;
         break;
        }
        _abort();
       } while (0);
       HEAP32[i4 + 12 >> 2] = i5;
       HEAP32[i31 >> 2] = i4;
      } while (0);
      i1 = i22 + ((i9 | i10) + i15) | 0;
      i5 = i9 + i11 | 0;
     } else i5 = i11;
     i1 = i1 + 4 | 0;
     HEAP32[i1 >> 2] = HEAP32[i1 >> 2] & -2;
     HEAP32[i22 + (i12 + 4) >> 2] = i5 | 1;
     HEAP32[i22 + (i5 + i12) >> 2] = i5;
     i1 = i5 >>> 3;
     if (i5 >>> 0 < 256) {
      i2 = i1 << 1;
      i4 = 2868 + (i2 << 2) | 0;
      i3 = HEAP32[707] | 0;
      i1 = 1 << i1;
      do if (!(i3 & i1)) {
       HEAP32[707] = i3 | i1;
       i36 = 2868 + (i2 + 2 << 2) | 0;
       i37 = i4;
      } else {
       i1 = 2868 + (i2 + 2 << 2) | 0;
       i2 = HEAP32[i1 >> 2] | 0;
       if (i2 >>> 0 >= (HEAP32[711] | 0) >>> 0) {
        i36 = i1;
        i37 = i2;
        break;
       }
       _abort();
      } while (0);
      HEAP32[i36 >> 2] = i14;
      HEAP32[i37 + 12 >> 2] = i14;
      HEAP32[i22 + (i12 + 8) >> 2] = i37;
      HEAP32[i22 + (i12 + 12) >> 2] = i4;
      break;
     }
     i1 = i5 >>> 8;
     do if (!i1) i4 = 0; else {
      if (i5 >>> 0 > 16777215) {
       i4 = 31;
       break;
      }
      i36 = (i1 + 1048320 | 0) >>> 16 & 8;
      i37 = i1 << i36;
      i35 = (i37 + 520192 | 0) >>> 16 & 4;
      i37 = i37 << i35;
      i4 = (i37 + 245760 | 0) >>> 16 & 2;
      i4 = 14 - (i35 | i36 | i4) + (i37 << i4 >>> 15) | 0;
      i4 = i5 >>> (i4 + 7 | 0) & 1 | i4 << 1;
     } while (0);
     i1 = 3132 + (i4 << 2) | 0;
     HEAP32[i22 + (i12 + 28) >> 2] = i4;
     HEAP32[i22 + (i12 + 20) >> 2] = 0;
     HEAP32[i22 + (i12 + 16) >> 2] = 0;
     i2 = HEAP32[708] | 0;
     i3 = 1 << i4;
     if (!(i2 & i3)) {
      HEAP32[708] = i2 | i3;
      HEAP32[i1 >> 2] = i14;
      HEAP32[i22 + (i12 + 24) >> 2] = i1;
      HEAP32[i22 + (i12 + 12) >> 2] = i14;
      HEAP32[i22 + (i12 + 8) >> 2] = i14;
      break;
     }
     i1 = HEAP32[i1 >> 2] | 0;
     L418 : do if ((HEAP32[i1 + 4 >> 2] & -8 | 0) != (i5 | 0)) {
      i4 = i5 << ((i4 | 0) == 31 ? 0 : 25 - (i4 >>> 1) | 0);
      while (1) {
       i2 = i1 + 16 + (i4 >>> 31 << 2) | 0;
       i3 = HEAP32[i2 >> 2] | 0;
       if (!i3) break;
       if ((HEAP32[i3 + 4 >> 2] & -8 | 0) == (i5 | 0)) {
        i38 = i3;
        break L418;
       } else {
        i4 = i4 << 1;
        i1 = i3;
       }
      }
      if (i2 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
       HEAP32[i2 >> 2] = i14;
       HEAP32[i22 + (i12 + 24) >> 2] = i1;
       HEAP32[i22 + (i12 + 12) >> 2] = i14;
       HEAP32[i22 + (i12 + 8) >> 2] = i14;
       break L324;
      }
     } else i38 = i1; while (0);
     i1 = i38 + 8 | 0;
     i2 = HEAP32[i1 >> 2] | 0;
     i37 = HEAP32[711] | 0;
     if (i2 >>> 0 >= i37 >>> 0 & i38 >>> 0 >= i37 >>> 0) {
      HEAP32[i2 + 12 >> 2] = i14;
      HEAP32[i1 >> 2] = i14;
      HEAP32[i22 + (i12 + 8) >> 2] = i2;
      HEAP32[i22 + (i12 + 12) >> 2] = i38;
      HEAP32[i22 + (i12 + 24) >> 2] = 0;
      break;
     } else _abort();
    } else {
     i38 = (HEAP32[710] | 0) + i11 | 0;
     HEAP32[710] = i38;
     HEAP32[713] = i14;
     HEAP32[i22 + (i12 + 4) >> 2] = i38 | 1;
    } while (0);
    i38 = i22 + (i13 | 8) | 0;
    return i38 | 0;
   } else i3 = 3276;
   while (1) {
    i2 = HEAP32[i3 >> 2] | 0;
    if (i2 >>> 0 <= i7 >>> 0 ? (i1 = HEAP32[i3 + 4 >> 2] | 0, i4 = i2 + i1 | 0, i4 >>> 0 > i7 >>> 0) : 0) break;
    i3 = HEAP32[i3 + 8 >> 2] | 0;
   }
   i5 = i2 + (i1 + -39) | 0;
   i2 = i2 + (i1 + -47 + ((i5 & 7 | 0) == 0 ? 0 : 0 - i5 & 7)) | 0;
   i5 = i7 + 16 | 0;
   i2 = i2 >>> 0 < i5 >>> 0 ? i7 : i2;
   i1 = i2 + 8 | 0;
   i3 = i22 + 8 | 0;
   i3 = (i3 & 7 | 0) == 0 ? 0 : 0 - i3 & 7;
   i38 = i15 + -40 - i3 | 0;
   HEAP32[713] = i22 + i3;
   HEAP32[710] = i38;
   HEAP32[i22 + (i3 + 4) >> 2] = i38 | 1;
   HEAP32[i22 + (i15 + -36) >> 2] = 40;
   HEAP32[714] = HEAP32[829];
   i3 = i2 + 4 | 0;
   HEAP32[i3 >> 2] = 27;
   HEAP32[i1 >> 2] = HEAP32[819];
   HEAP32[i1 + 4 >> 2] = HEAP32[820];
   HEAP32[i1 + 8 >> 2] = HEAP32[821];
   HEAP32[i1 + 12 >> 2] = HEAP32[822];
   HEAP32[819] = i22;
   HEAP32[820] = i15;
   HEAP32[822] = 0;
   HEAP32[821] = i1;
   i1 = i2 + 28 | 0;
   HEAP32[i1 >> 2] = 7;
   if ((i2 + 32 | 0) >>> 0 < i4 >>> 0) do {
    i38 = i1;
    i1 = i1 + 4 | 0;
    HEAP32[i1 >> 2] = 7;
   } while ((i38 + 8 | 0) >>> 0 < i4 >>> 0);
   if ((i2 | 0) != (i7 | 0)) {
    i6 = i2 - i7 | 0;
    HEAP32[i3 >> 2] = HEAP32[i3 >> 2] & -2;
    HEAP32[i7 + 4 >> 2] = i6 | 1;
    HEAP32[i2 >> 2] = i6;
    i1 = i6 >>> 3;
    if (i6 >>> 0 < 256) {
     i2 = i1 << 1;
     i4 = 2868 + (i2 << 2) | 0;
     i3 = HEAP32[707] | 0;
     i1 = 1 << i1;
     if (i3 & i1) {
      i1 = 2868 + (i2 + 2 << 2) | 0;
      i2 = HEAP32[i1 >> 2] | 0;
      if (i2 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
       i32 = i1;
       i33 = i2;
      }
     } else {
      HEAP32[707] = i3 | i1;
      i32 = 2868 + (i2 + 2 << 2) | 0;
      i33 = i4;
     }
     HEAP32[i32 >> 2] = i7;
     HEAP32[i33 + 12 >> 2] = i7;
     HEAP32[i7 + 8 >> 2] = i33;
     HEAP32[i7 + 12 >> 2] = i4;
     break;
    }
    i1 = i6 >>> 8;
    if (i1) if (i6 >>> 0 > 16777215) i4 = 31; else {
     i37 = (i1 + 1048320 | 0) >>> 16 & 8;
     i38 = i1 << i37;
     i36 = (i38 + 520192 | 0) >>> 16 & 4;
     i38 = i38 << i36;
     i4 = (i38 + 245760 | 0) >>> 16 & 2;
     i4 = 14 - (i36 | i37 | i4) + (i38 << i4 >>> 15) | 0;
     i4 = i6 >>> (i4 + 7 | 0) & 1 | i4 << 1;
    } else i4 = 0;
    i3 = 3132 + (i4 << 2) | 0;
    HEAP32[i7 + 28 >> 2] = i4;
    HEAP32[i7 + 20 >> 2] = 0;
    HEAP32[i5 >> 2] = 0;
    i1 = HEAP32[708] | 0;
    i2 = 1 << i4;
    if (!(i1 & i2)) {
     HEAP32[708] = i1 | i2;
     HEAP32[i3 >> 2] = i7;
     HEAP32[i7 + 24 >> 2] = i3;
     HEAP32[i7 + 12 >> 2] = i7;
     HEAP32[i7 + 8 >> 2] = i7;
     break;
    }
    i1 = HEAP32[i3 >> 2] | 0;
    L459 : do if ((HEAP32[i1 + 4 >> 2] & -8 | 0) != (i6 | 0)) {
     i4 = i6 << ((i4 | 0) == 31 ? 0 : 25 - (i4 >>> 1) | 0);
     while (1) {
      i2 = i1 + 16 + (i4 >>> 31 << 2) | 0;
      i3 = HEAP32[i2 >> 2] | 0;
      if (!i3) break;
      if ((HEAP32[i3 + 4 >> 2] & -8 | 0) == (i6 | 0)) {
       i34 = i3;
       break L459;
      } else {
       i4 = i4 << 1;
       i1 = i3;
      }
     }
     if (i2 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
      HEAP32[i2 >> 2] = i7;
      HEAP32[i7 + 24 >> 2] = i1;
      HEAP32[i7 + 12 >> 2] = i7;
      HEAP32[i7 + 8 >> 2] = i7;
      break L299;
     }
    } else i34 = i1; while (0);
    i1 = i34 + 8 | 0;
    i2 = HEAP32[i1 >> 2] | 0;
    i38 = HEAP32[711] | 0;
    if (i2 >>> 0 >= i38 >>> 0 & i34 >>> 0 >= i38 >>> 0) {
     HEAP32[i2 + 12 >> 2] = i7;
     HEAP32[i1 >> 2] = i7;
     HEAP32[i7 + 8 >> 2] = i2;
     HEAP32[i7 + 12 >> 2] = i34;
     HEAP32[i7 + 24 >> 2] = 0;
     break;
    } else _abort();
   }
  } else {
   i38 = HEAP32[711] | 0;
   if ((i38 | 0) == 0 | i22 >>> 0 < i38 >>> 0) HEAP32[711] = i22;
   HEAP32[819] = i22;
   HEAP32[820] = i15;
   HEAP32[822] = 0;
   HEAP32[716] = HEAP32[825];
   HEAP32[715] = -1;
   i1 = 0;
   do {
    i38 = i1 << 1;
    i37 = 2868 + (i38 << 2) | 0;
    HEAP32[2868 + (i38 + 3 << 2) >> 2] = i37;
    HEAP32[2868 + (i38 + 2 << 2) >> 2] = i37;
    i1 = i1 + 1 | 0;
   } while ((i1 | 0) != 32);
   i38 = i22 + 8 | 0;
   i38 = (i38 & 7 | 0) == 0 ? 0 : 0 - i38 & 7;
   i37 = i15 + -40 - i38 | 0;
   HEAP32[713] = i22 + i38;
   HEAP32[710] = i37;
   HEAP32[i22 + (i38 + 4) >> 2] = i37 | 1;
   HEAP32[i22 + (i15 + -36) >> 2] = 40;
   HEAP32[714] = HEAP32[829];
  } while (0);
  i1 = HEAP32[710] | 0;
  if (i1 >>> 0 > i16 >>> 0) {
   i37 = i1 - i16 | 0;
   HEAP32[710] = i37;
   i38 = HEAP32[713] | 0;
   HEAP32[713] = i38 + i16;
   HEAP32[i38 + (i16 + 4) >> 2] = i37 | 1;
   HEAP32[i38 + 4 >> 2] = i16 | 3;
   i38 = i38 + 8 | 0;
   return i38 | 0;
  }
 }
 i38 = ___errno_location() | 0;
 HEAP32[i38 >> 2] = 12;
 i38 = 0;
 return i38 | 0;
}

function _printf_core(i49, i2, i50, i51, i52) {
 i49 = i49 | 0;
 i2 = i2 | 0;
 i50 = i50 | 0;
 i51 = i51 | 0;
 i52 = i52 | 0;
 var i1 = 0, i3 = 0, i4 = 0, i5 = 0, d6 = 0.0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, d11 = 0.0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i53 = 0;
 i53 = STACKTOP;
 STACKTOP = STACKTOP + 624 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i44 = i53 + 24 | 0;
 i46 = i53 + 16 | 0;
 i45 = i53 + 588 | 0;
 i39 = i53 + 576 | 0;
 i43 = i53;
 i36 = i53 + 536 | 0;
 i48 = i53 + 8 | 0;
 i47 = i53 + 528 | 0;
 i27 = (i49 | 0) != 0;
 i28 = i36 + 40 | 0;
 i35 = i28;
 i36 = i36 + 39 | 0;
 i37 = i48 + 4 | 0;
 i38 = i39 + 12 | 0;
 i39 = i39 + 11 | 0;
 i40 = i45;
 i41 = i38;
 i42 = i41 - i40 | 0;
 i29 = -2 - i40 | 0;
 i30 = i41 + 2 | 0;
 i31 = i44 + 288 | 0;
 i32 = i45 + 9 | 0;
 i33 = i32;
 i34 = i45 + 8 | 0;
 i1 = 0;
 i12 = i2;
 i3 = 0;
 i2 = 0;
 L1 : while (1) {
  do if ((i1 | 0) > -1) if ((i3 | 0) > (2147483647 - i1 | 0)) {
   i1 = ___errno_location() | 0;
   HEAP32[i1 >> 2] = 75;
   i1 = -1;
   break;
  } else {
   i1 = i3 + i1 | 0;
   break;
  } while (0);
  i3 = HEAP8[i12 >> 0] | 0;
  if (!(i3 << 24 >> 24)) {
   i26 = 245;
   break;
  } else i4 = i12;
  L9 : while (1) {
   switch (i3 << 24 >> 24) {
   case 37:
    {
     i3 = i4;
     i26 = 9;
     break L9;
    }
   case 0:
    {
     i3 = i4;
     break L9;
    }
   default:
    {}
   }
   i25 = i4 + 1 | 0;
   i3 = HEAP8[i25 >> 0] | 0;
   i4 = i25;
  }
  L12 : do if ((i26 | 0) == 9) while (1) {
   i26 = 0;
   if ((HEAP8[i3 + 1 >> 0] | 0) != 37) break L12;
   i4 = i4 + 1 | 0;
   i3 = i3 + 2 | 0;
   if ((HEAP8[i3 >> 0] | 0) == 37) i26 = 9; else break;
  } while (0);
  i14 = i4 - i12 | 0;
  if (i27 ? (HEAP32[i49 >> 2] & 32 | 0) == 0 : 0) ___fwritex(i12, i14, i49) | 0;
  if ((i4 | 0) != (i12 | 0)) {
   i12 = i3;
   i3 = i14;
   continue;
  }
  i7 = i3 + 1 | 0;
  i4 = HEAP8[i7 >> 0] | 0;
  i5 = (i4 << 24 >> 24) + -48 | 0;
  if (i5 >>> 0 < 10) {
   i25 = (HEAP8[i3 + 2 >> 0] | 0) == 36;
   i7 = i25 ? i3 + 3 | 0 : i7;
   i4 = HEAP8[i7 >> 0] | 0;
   i10 = i25 ? i5 : -1;
   i2 = i25 ? 1 : i2;
  } else i10 = -1;
  i3 = i4 << 24 >> 24;
  L25 : do if ((i3 & -32 | 0) == 32) {
   i5 = 0;
   while (1) {
    if (!(1 << i3 + -32 & 75913)) {
     i8 = i5;
     i3 = i7;
     break L25;
    }
    i5 = 1 << (i4 << 24 >> 24) + -32 | i5;
    i7 = i7 + 1 | 0;
    i4 = HEAP8[i7 >> 0] | 0;
    i3 = i4 << 24 >> 24;
    if ((i3 & -32 | 0) != 32) {
     i8 = i5;
     i3 = i7;
     break;
    }
   }
  } else {
   i8 = 0;
   i3 = i7;
  } while (0);
  do if (i4 << 24 >> 24 == 42) {
   i5 = i3 + 1 | 0;
   i4 = (HEAP8[i5 >> 0] | 0) + -48 | 0;
   if (i4 >>> 0 < 10 ? (HEAP8[i3 + 2 >> 0] | 0) == 36 : 0) {
    HEAP32[i52 + (i4 << 2) >> 2] = 10;
    i2 = 1;
    i3 = i3 + 3 | 0;
    i4 = HEAP32[i51 + ((HEAP8[i5 >> 0] | 0) + -48 << 3) >> 2] | 0;
   } else {
    if (i2) {
     i1 = -1;
     break L1;
    }
    if (!i27) {
     i13 = i8;
     i3 = i5;
     i2 = 0;
     i25 = 0;
     break;
    }
    i2 = (HEAP32[i50 >> 2] | 0) + (4 - 1) & ~(4 - 1);
    i4 = HEAP32[i2 >> 2] | 0;
    HEAP32[i50 >> 2] = i2 + 4;
    i2 = 0;
    i3 = i5;
   }
   if ((i4 | 0) < 0) {
    i13 = i8 | 8192;
    i25 = 0 - i4 | 0;
   } else {
    i13 = i8;
    i25 = i4;
   }
  } else {
   i5 = (i4 << 24 >> 24) + -48 | 0;
   if (i5 >>> 0 < 10) {
    i4 = 0;
    do {
     i4 = (i4 * 10 | 0) + i5 | 0;
     i3 = i3 + 1 | 0;
     i5 = (HEAP8[i3 >> 0] | 0) + -48 | 0;
    } while (i5 >>> 0 < 10);
    if ((i4 | 0) < 0) {
     i1 = -1;
     break L1;
    } else {
     i13 = i8;
     i25 = i4;
    }
   } else {
    i13 = i8;
    i25 = 0;
   }
  } while (0);
  L46 : do if ((HEAP8[i3 >> 0] | 0) == 46) {
   i5 = i3 + 1 | 0;
   i4 = HEAP8[i5 >> 0] | 0;
   if (i4 << 24 >> 24 != 42) {
    i7 = (i4 << 24 >> 24) + -48 | 0;
    if (i7 >>> 0 < 10) {
     i3 = i5;
     i4 = 0;
    } else {
     i3 = i5;
     i7 = 0;
     break;
    }
    while (1) {
     i4 = (i4 * 10 | 0) + i7 | 0;
     i3 = i3 + 1 | 0;
     i7 = (HEAP8[i3 >> 0] | 0) + -48 | 0;
     if (i7 >>> 0 >= 10) {
      i7 = i4;
      break L46;
     }
    }
   }
   i5 = i3 + 2 | 0;
   i4 = (HEAP8[i5 >> 0] | 0) + -48 | 0;
   if (i4 >>> 0 < 10 ? (HEAP8[i3 + 3 >> 0] | 0) == 36 : 0) {
    HEAP32[i52 + (i4 << 2) >> 2] = 10;
    i3 = i3 + 4 | 0;
    i7 = HEAP32[i51 + ((HEAP8[i5 >> 0] | 0) + -48 << 3) >> 2] | 0;
    break;
   }
   if (i2) {
    i1 = -1;
    break L1;
   }
   if (i27) {
    i3 = (HEAP32[i50 >> 2] | 0) + (4 - 1) & ~(4 - 1);
    i7 = HEAP32[i3 >> 2] | 0;
    HEAP32[i50 >> 2] = i3 + 4;
    i3 = i5;
   } else {
    i3 = i5;
    i7 = 0;
   }
  } else i7 = -1; while (0);
  i9 = 0;
  while (1) {
   i4 = (HEAP8[i3 >> 0] | 0) + -65 | 0;
   if (i4 >>> 0 > 57) {
    i1 = -1;
    break L1;
   }
   i5 = i3 + 1 | 0;
   i4 = HEAP8[11328 + (i9 * 58 | 0) + i4 >> 0] | 0;
   i8 = i4 & 255;
   if ((i8 + -1 | 0) >>> 0 < 8) {
    i3 = i5;
    i9 = i8;
   } else {
    i24 = i5;
    break;
   }
  }
  if (!(i4 << 24 >> 24)) {
   i1 = -1;
   break;
  }
  i5 = (i10 | 0) > -1;
  do if (i4 << 24 >> 24 == 19) if (i5) {
   i1 = -1;
   break L1;
  } else i26 = 52; else {
   if (i5) {
    HEAP32[i52 + (i10 << 2) >> 2] = i8;
    i22 = i51 + (i10 << 3) | 0;
    i23 = HEAP32[i22 + 4 >> 2] | 0;
    i26 = i43;
    HEAP32[i26 >> 2] = HEAP32[i22 >> 2];
    HEAP32[i26 + 4 >> 2] = i23;
    i26 = 52;
    break;
   }
   if (!i27) {
    i1 = 0;
    break L1;
   }
   _pop_arg(i43, i8, i50);
  } while (0);
  if ((i26 | 0) == 52 ? (i26 = 0, !i27) : 0) {
   i12 = i24;
   i3 = i14;
   continue;
  }
  i10 = HEAP8[i3 >> 0] | 0;
  i10 = (i9 | 0) != 0 & (i10 & 15 | 0) == 3 ? i10 & -33 : i10;
  i5 = i13 & -65537;
  i23 = (i13 & 8192 | 0) == 0 ? i13 : i5;
  L75 : do switch (i10 | 0) {
  case 110:
   switch (i9 | 0) {
   case 0:
    {
     HEAP32[HEAP32[i43 >> 2] >> 2] = i1;
     i12 = i24;
     i3 = i14;
     continue L1;
    }
   case 1:
    {
     HEAP32[HEAP32[i43 >> 2] >> 2] = i1;
     i12 = i24;
     i3 = i14;
     continue L1;
    }
   case 2:
    {
     i12 = HEAP32[i43 >> 2] | 0;
     HEAP32[i12 >> 2] = i1;
     HEAP32[i12 + 4 >> 2] = ((i1 | 0) < 0) << 31 >> 31;
     i12 = i24;
     i3 = i14;
     continue L1;
    }
   case 3:
    {
     HEAP16[HEAP32[i43 >> 2] >> 1] = i1;
     i12 = i24;
     i3 = i14;
     continue L1;
    }
   case 4:
    {
     HEAP8[HEAP32[i43 >> 2] >> 0] = i1;
     i12 = i24;
     i3 = i14;
     continue L1;
    }
   case 6:
    {
     HEAP32[HEAP32[i43 >> 2] >> 2] = i1;
     i12 = i24;
     i3 = i14;
     continue L1;
    }
   case 7:
    {
     i12 = HEAP32[i43 >> 2] | 0;
     HEAP32[i12 >> 2] = i1;
     HEAP32[i12 + 4 >> 2] = ((i1 | 0) < 0) << 31 >> 31;
     i12 = i24;
     i3 = i14;
     continue L1;
    }
   default:
    {
     i12 = i24;
     i3 = i14;
     continue L1;
    }
   }
  case 112:
   {
    i9 = i23 | 8;
    i7 = i7 >>> 0 > 8 ? i7 : 8;
    i10 = 120;
    i26 = 64;
    break;
   }
  case 88:
  case 120:
   {
    i9 = i23;
    i26 = 64;
    break;
   }
  case 111:
   {
    i5 = i43;
    i4 = HEAP32[i5 >> 2] | 0;
    i5 = HEAP32[i5 + 4 >> 2] | 0;
    if ((i4 | 0) == 0 & (i5 | 0) == 0) i3 = i28; else {
     i3 = i28;
     do {
      i3 = i3 + -1 | 0;
      HEAP8[i3 >> 0] = i4 & 7 | 48;
      i4 = _bitshift64Lshr(i4 | 0, i5 | 0, 3) | 0;
      i5 = tempRet0;
     } while (!((i4 | 0) == 0 & (i5 | 0) == 0));
    }
    if (!(i23 & 8)) {
     i4 = i23;
     i9 = 0;
     i8 = 11808;
     i26 = 77;
    } else {
     i9 = i35 - i3 + 1 | 0;
     i4 = i23;
     i7 = (i7 | 0) < (i9 | 0) ? i9 : i7;
     i9 = 0;
     i8 = 11808;
     i26 = 77;
    }
    break;
   }
  case 105:
  case 100:
   {
    i4 = i43;
    i3 = HEAP32[i4 >> 2] | 0;
    i4 = HEAP32[i4 + 4 >> 2] | 0;
    if ((i4 | 0) < 0) {
     i3 = _i64Subtract(0, 0, i3 | 0, i4 | 0) | 0;
     i4 = tempRet0;
     i5 = i43;
     HEAP32[i5 >> 2] = i3;
     HEAP32[i5 + 4 >> 2] = i4;
     i5 = 1;
     i8 = 11808;
     i26 = 76;
     break L75;
    }
    if (!(i23 & 2048)) {
     i8 = i23 & 1;
     i5 = i8;
     i8 = (i8 | 0) == 0 ? 11808 : 11810;
     i26 = 76;
    } else {
     i5 = 1;
     i8 = 11809;
     i26 = 76;
    }
    break;
   }
  case 117:
   {
    i4 = i43;
    i3 = HEAP32[i4 >> 2] | 0;
    i4 = HEAP32[i4 + 4 >> 2] | 0;
    i5 = 0;
    i8 = 11808;
    i26 = 76;
    break;
   }
  case 99:
   {
    HEAP8[i36 >> 0] = HEAP32[i43 >> 2];
    i12 = i36;
    i4 = 1;
    i9 = 0;
    i10 = 11808;
    i3 = i28;
    break;
   }
  case 109:
   {
    i3 = ___errno_location() | 0;
    i3 = _strerror(HEAP32[i3 >> 2] | 0) | 0;
    i26 = 82;
    break;
   }
  case 115:
   {
    i3 = HEAP32[i43 >> 2] | 0;
    i3 = (i3 | 0) != 0 ? i3 : 11818;
    i26 = 82;
    break;
   }
  case 67:
   {
    HEAP32[i48 >> 2] = HEAP32[i43 >> 2];
    HEAP32[i37 >> 2] = 0;
    HEAP32[i43 >> 2] = i48;
    i7 = -1;
    i26 = 86;
    break;
   }
  case 83:
   {
    if (!i7) {
     _pad(i49, 32, i25, 0, i23);
     i3 = 0;
     i26 = 98;
    } else i26 = 86;
    break;
   }
  case 65:
  case 71:
  case 70:
  case 69:
  case 97:
  case 103:
  case 102:
  case 101:
   {
    d6 = +HEAPF64[i43 >> 3];
    HEAP32[i46 >> 2] = 0;
    HEAPF64[tempDoublePtr >> 3] = d6;
    if ((HEAP32[tempDoublePtr + 4 >> 2] | 0) >= 0) if (!(i23 & 2048)) {
     i22 = i23 & 1;
     i21 = i22;
     i22 = (i22 | 0) == 0 ? 11826 : 11831;
    } else {
     i21 = 1;
     i22 = 11828;
    } else {
     d6 = -d6;
     i21 = 1;
     i22 = 11825;
    }
    HEAPF64[tempDoublePtr >> 3] = d6;
    i20 = HEAP32[tempDoublePtr + 4 >> 2] & 2146435072;
    do if (i20 >>> 0 < 2146435072 | (i20 | 0) == 2146435072 & 0 < 0) {
     d11 = +_frexpl(d6, i46) * 2.0;
     i4 = d11 != 0.0;
     if (i4) HEAP32[i46 >> 2] = (HEAP32[i46 >> 2] | 0) + -1;
     i18 = i10 | 32;
     if ((i18 | 0) == 97) {
      i12 = i10 & 32;
      i14 = (i12 | 0) == 0 ? i22 : i22 + 9 | 0;
      i13 = i21 | 2;
      i3 = 12 - i7 | 0;
      do if (!(i7 >>> 0 > 11 | (i3 | 0) == 0)) {
       d6 = 8.0;
       do {
        i3 = i3 + -1 | 0;
        d6 = d6 * 16.0;
       } while ((i3 | 0) != 0);
       if ((HEAP8[i14 >> 0] | 0) == 45) {
        d6 = -(d6 + (-d11 - d6));
        break;
       } else {
        d6 = d11 + d6 - d6;
        break;
       }
      } else d6 = d11; while (0);
      i4 = HEAP32[i46 >> 2] | 0;
      i3 = (i4 | 0) < 0 ? 0 - i4 | 0 : i4;
      i3 = _fmt_u(i3, ((i3 | 0) < 0) << 31 >> 31, i38) | 0;
      if ((i3 | 0) == (i38 | 0)) {
       HEAP8[i39 >> 0] = 48;
       i3 = i39;
      }
      HEAP8[i3 + -1 >> 0] = (i4 >> 31 & 2) + 43;
      i9 = i3 + -2 | 0;
      HEAP8[i9 >> 0] = i10 + 15;
      i8 = (i7 | 0) < 1;
      i5 = (i23 & 8 | 0) == 0;
      i4 = i45;
      while (1) {
       i22 = ~~d6;
       i3 = i4 + 1 | 0;
       HEAP8[i4 >> 0] = HEAPU8[11792 + i22 >> 0] | i12;
       d6 = (d6 - +(i22 | 0)) * 16.0;
       do if ((i3 - i40 | 0) == 1) {
        if (i5 & (i8 & d6 == 0.0)) break;
        HEAP8[i3 >> 0] = 46;
        i3 = i4 + 2 | 0;
       } while (0);
       if (!(d6 != 0.0)) break; else i4 = i3;
      }
      i7 = (i7 | 0) != 0 & (i29 + i3 | 0) < (i7 | 0) ? i30 + i7 - i9 | 0 : i42 - i9 + i3 | 0;
      i5 = i7 + i13 | 0;
      _pad(i49, 32, i25, i5, i23);
      if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i14, i13, i49) | 0;
      _pad(i49, 48, i25, i5, i23 ^ 65536);
      i3 = i3 - i40 | 0;
      if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i45, i3, i49) | 0;
      i4 = i41 - i9 | 0;
      _pad(i49, 48, i7 - (i3 + i4) | 0, 0, 0);
      if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i9, i4, i49) | 0;
      _pad(i49, 32, i25, i5, i23 ^ 8192);
      i3 = (i5 | 0) < (i25 | 0) ? i25 : i5;
      break;
     }
     i3 = (i7 | 0) < 0 ? 6 : i7;
     if (i4) {
      i4 = (HEAP32[i46 >> 2] | 0) + -28 | 0;
      HEAP32[i46 >> 2] = i4;
      d6 = d11 * 268435456.0;
     } else {
      d6 = d11;
      i4 = HEAP32[i46 >> 2] | 0;
     }
     i20 = (i4 | 0) < 0 ? i44 : i31;
     i19 = i20;
     i4 = i20;
     do {
      i17 = ~~d6 >>> 0;
      HEAP32[i4 >> 2] = i17;
      i4 = i4 + 4 | 0;
      d6 = (d6 - +(i17 >>> 0)) * 1.0e9;
     } while (d6 != 0.0);
     i5 = i4;
     i4 = HEAP32[i46 >> 2] | 0;
     if ((i4 | 0) > 0) {
      i8 = i20;
      while (1) {
       i9 = (i4 | 0) > 29 ? 29 : i4;
       i7 = i5 + -4 | 0;
       do if (i7 >>> 0 < i8 >>> 0) i7 = i8; else {
        i4 = 0;
        do {
         i17 = _bitshift64Shl(HEAP32[i7 >> 2] | 0, 0, i9 | 0) | 0;
         i17 = _i64Add(i17 | 0, tempRet0 | 0, i4 | 0, 0) | 0;
         i4 = tempRet0;
         i16 = ___uremdi3(i17 | 0, i4 | 0, 1e9, 0) | 0;
         HEAP32[i7 >> 2] = i16;
         i4 = ___udivdi3(i17 | 0, i4 | 0, 1e9, 0) | 0;
         i7 = i7 + -4 | 0;
        } while (i7 >>> 0 >= i8 >>> 0);
        if (!i4) {
         i7 = i8;
         break;
        }
        i7 = i8 + -4 | 0;
        HEAP32[i7 >> 2] = i4;
       } while (0);
       while (1) {
        if (i5 >>> 0 <= i7 >>> 0) break;
        i4 = i5 + -4 | 0;
        if (!(HEAP32[i4 >> 2] | 0)) i5 = i4; else break;
       }
       i4 = (HEAP32[i46 >> 2] | 0) - i9 | 0;
       HEAP32[i46 >> 2] = i4;
       if ((i4 | 0) > 0) i8 = i7; else break;
      }
     } else i7 = i20;
     if ((i4 | 0) < 0) {
      i14 = ((i3 + 25 | 0) / 9 | 0) + 1 | 0;
      i15 = (i18 | 0) == 102;
      i12 = i7;
      while (1) {
       i13 = 0 - i4 | 0;
       i13 = (i13 | 0) > 9 ? 9 : i13;
       do if (i12 >>> 0 < i5 >>> 0) {
        i4 = (1 << i13) + -1 | 0;
        i8 = 1e9 >>> i13;
        i7 = 0;
        i9 = i12;
        do {
         i17 = HEAP32[i9 >> 2] | 0;
         HEAP32[i9 >> 2] = (i17 >>> i13) + i7;
         i7 = Math_imul(i17 & i4, i8) | 0;
         i9 = i9 + 4 | 0;
        } while (i9 >>> 0 < i5 >>> 0);
        i4 = (HEAP32[i12 >> 2] | 0) == 0 ? i12 + 4 | 0 : i12;
        if (!i7) {
         i7 = i4;
         break;
        }
        HEAP32[i5 >> 2] = i7;
        i7 = i4;
        i5 = i5 + 4 | 0;
       } else i7 = (HEAP32[i12 >> 2] | 0) == 0 ? i12 + 4 | 0 : i12; while (0);
       i4 = i15 ? i20 : i7;
       i5 = (i5 - i4 >> 2 | 0) > (i14 | 0) ? i4 + (i14 << 2) | 0 : i5;
       i4 = (HEAP32[i46 >> 2] | 0) + i13 | 0;
       HEAP32[i46 >> 2] = i4;
       if ((i4 | 0) >= 0) {
        i12 = i7;
        break;
       } else i12 = i7;
      }
     } else i12 = i7;
     do if (i12 >>> 0 < i5 >>> 0) {
      i4 = (i19 - i12 >> 2) * 9 | 0;
      i8 = HEAP32[i12 >> 2] | 0;
      if (i8 >>> 0 < 10) break; else i7 = 10;
      do {
       i7 = i7 * 10 | 0;
       i4 = i4 + 1 | 0;
      } while (i8 >>> 0 >= i7 >>> 0);
     } else i4 = 0; while (0);
     i16 = (i18 | 0) == 103;
     i17 = (i3 | 0) != 0;
     i7 = i3 - ((i18 | 0) != 102 ? i4 : 0) + ((i17 & i16) << 31 >> 31) | 0;
     if ((i7 | 0) < (((i5 - i19 >> 2) * 9 | 0) + -9 | 0)) {
      i9 = i7 + 9216 | 0;
      i15 = (i9 | 0) / 9 | 0;
      i7 = i20 + (i15 + -1023 << 2) | 0;
      i9 = ((i9 | 0) % 9 | 0) + 1 | 0;
      if ((i9 | 0) < 9) {
       i8 = 10;
       do {
        i8 = i8 * 10 | 0;
        i9 = i9 + 1 | 0;
       } while ((i9 | 0) != 9);
      } else i8 = 10;
      i13 = HEAP32[i7 >> 2] | 0;
      i14 = (i13 >>> 0) % (i8 >>> 0) | 0;
      if ((i14 | 0) == 0 ? (i20 + (i15 + -1022 << 2) | 0) == (i5 | 0) : 0) i8 = i12; else i26 = 163;
      do if ((i26 | 0) == 163) {
       i26 = 0;
       d11 = (((i13 >>> 0) / (i8 >>> 0) | 0) & 1 | 0) == 0 ? 9007199254740992.0 : 9007199254740994.0;
       i9 = (i8 | 0) / 2 | 0;
       do if (i14 >>> 0 < i9 >>> 0) d6 = .5; else {
        if ((i14 | 0) == (i9 | 0) ? (i20 + (i15 + -1022 << 2) | 0) == (i5 | 0) : 0) {
         d6 = 1.0;
         break;
        }
        d6 = 1.5;
       } while (0);
       do if (i21) {
        if ((HEAP8[i22 >> 0] | 0) != 45) break;
        d11 = -d11;
        d6 = -d6;
       } while (0);
       i9 = i13 - i14 | 0;
       HEAP32[i7 >> 2] = i9;
       if (!(d11 + d6 != d11)) {
        i8 = i12;
        break;
       }
       i18 = i9 + i8 | 0;
       HEAP32[i7 >> 2] = i18;
       if (i18 >>> 0 > 999999999) {
        i4 = i12;
        while (1) {
         i8 = i7 + -4 | 0;
         HEAP32[i7 >> 2] = 0;
         if (i8 >>> 0 < i4 >>> 0) {
          i4 = i4 + -4 | 0;
          HEAP32[i4 >> 2] = 0;
         }
         i18 = (HEAP32[i8 >> 2] | 0) + 1 | 0;
         HEAP32[i8 >> 2] = i18;
         if (i18 >>> 0 > 999999999) i7 = i8; else {
          i12 = i4;
          i7 = i8;
          break;
         }
        }
       }
       i4 = (i19 - i12 >> 2) * 9 | 0;
       i9 = HEAP32[i12 >> 2] | 0;
       if (i9 >>> 0 < 10) {
        i8 = i12;
        break;
       } else i8 = 10;
       do {
        i8 = i8 * 10 | 0;
        i4 = i4 + 1 | 0;
       } while (i9 >>> 0 >= i8 >>> 0);
       i8 = i12;
      } while (0);
      i18 = i7 + 4 | 0;
      i12 = i8;
      i5 = i5 >>> 0 > i18 >>> 0 ? i18 : i5;
     }
     i14 = 0 - i4 | 0;
     while (1) {
      if (i5 >>> 0 <= i12 >>> 0) {
       i15 = 0;
       i18 = i5;
       break;
      }
      i7 = i5 + -4 | 0;
      if (!(HEAP32[i7 >> 2] | 0)) i5 = i7; else {
       i15 = 1;
       i18 = i5;
       break;
      }
     }
     do if (i16) {
      i3 = (i17 & 1 ^ 1) + i3 | 0;
      if ((i3 | 0) > (i4 | 0) & (i4 | 0) > -5) {
       i10 = i10 + -1 | 0;
       i3 = i3 + -1 - i4 | 0;
      } else {
       i10 = i10 + -2 | 0;
       i3 = i3 + -1 | 0;
      }
      i5 = i23 & 8;
      if (i5) break;
      do if (i15) {
       i5 = HEAP32[i18 + -4 >> 2] | 0;
       if (!i5) {
        i7 = 9;
        break;
       }
       if (!((i5 >>> 0) % 10 | 0)) {
        i8 = 10;
        i7 = 0;
       } else {
        i7 = 0;
        break;
       }
       do {
        i8 = i8 * 10 | 0;
        i7 = i7 + 1 | 0;
       } while (((i5 >>> 0) % (i8 >>> 0) | 0 | 0) == 0);
      } else i7 = 9; while (0);
      i5 = ((i18 - i19 >> 2) * 9 | 0) + -9 | 0;
      if ((i10 | 32 | 0) == 102) {
       i5 = i5 - i7 | 0;
       i5 = (i5 | 0) < 0 ? 0 : i5;
       i3 = (i3 | 0) < (i5 | 0) ? i3 : i5;
       i5 = 0;
       break;
      } else {
       i5 = i5 + i4 - i7 | 0;
       i5 = (i5 | 0) < 0 ? 0 : i5;
       i3 = (i3 | 0) < (i5 | 0) ? i3 : i5;
       i5 = 0;
       break;
      }
     } else i5 = i23 & 8; while (0);
     i13 = i3 | i5;
     i8 = (i13 | 0) != 0 & 1;
     i9 = (i10 | 32 | 0) == 102;
     if (i9) {
      i4 = (i4 | 0) > 0 ? i4 : 0;
      i10 = 0;
     } else {
      i7 = (i4 | 0) < 0 ? i14 : i4;
      i7 = _fmt_u(i7, ((i7 | 0) < 0) << 31 >> 31, i38) | 0;
      if ((i41 - i7 | 0) < 2) do {
       i7 = i7 + -1 | 0;
       HEAP8[i7 >> 0] = 48;
      } while ((i41 - i7 | 0) < 2);
      HEAP8[i7 + -1 >> 0] = (i4 >> 31 & 2) + 43;
      i19 = i7 + -2 | 0;
      HEAP8[i19 >> 0] = i10;
      i4 = i41 - i19 | 0;
      i10 = i19;
     }
     i14 = i21 + 1 + i3 + i8 + i4 | 0;
     _pad(i49, 32, i25, i14, i23);
     if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i22, i21, i49) | 0;
     _pad(i49, 48, i25, i14, i23 ^ 65536);
     do if (i9) {
      i7 = i12 >>> 0 > i20 >>> 0 ? i20 : i12;
      i4 = i7;
      do {
       i5 = _fmt_u(HEAP32[i4 >> 2] | 0, 0, i32) | 0;
       do if ((i4 | 0) == (i7 | 0)) {
        if ((i5 | 0) != (i32 | 0)) break;
        HEAP8[i34 >> 0] = 48;
        i5 = i34;
       } else {
        if (i5 >>> 0 <= i45 >>> 0) break;
        do {
         i5 = i5 + -1 | 0;
         HEAP8[i5 >> 0] = 48;
        } while (i5 >>> 0 > i45 >>> 0);
       } while (0);
       if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i5, i33 - i5 | 0, i49) | 0;
       i4 = i4 + 4 | 0;
      } while (i4 >>> 0 <= i20 >>> 0);
      do if (i13) {
       if (HEAP32[i49 >> 2] & 32) break;
       ___fwritex(11860, 1, i49) | 0;
      } while (0);
      if ((i3 | 0) > 0 & i4 >>> 0 < i18 >>> 0) {
       i5 = i4;
       while (1) {
        i4 = _fmt_u(HEAP32[i5 >> 2] | 0, 0, i32) | 0;
        if (i4 >>> 0 > i45 >>> 0) do {
         i4 = i4 + -1 | 0;
         HEAP8[i4 >> 0] = 48;
        } while (i4 >>> 0 > i45 >>> 0);
        if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i4, (i3 | 0) > 9 ? 9 : i3, i49) | 0;
        i5 = i5 + 4 | 0;
        i4 = i3 + -9 | 0;
        if (!((i3 | 0) > 9 & i5 >>> 0 < i18 >>> 0)) {
         i3 = i4;
         break;
        } else i3 = i4;
       }
      }
      _pad(i49, 48, i3 + 9 | 0, 9, 0);
     } else {
      i9 = i15 ? i18 : i12 + 4 | 0;
      if ((i3 | 0) > -1) {
       i8 = (i5 | 0) == 0;
       i7 = i12;
       do {
        i4 = _fmt_u(HEAP32[i7 >> 2] | 0, 0, i32) | 0;
        if ((i4 | 0) == (i32 | 0)) {
         HEAP8[i34 >> 0] = 48;
         i4 = i34;
        }
        do if ((i7 | 0) == (i12 | 0)) {
         i5 = i4 + 1 | 0;
         if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i4, 1, i49) | 0;
         if (i8 & (i3 | 0) < 1) {
          i4 = i5;
          break;
         }
         if (HEAP32[i49 >> 2] & 32) {
          i4 = i5;
          break;
         }
         ___fwritex(11860, 1, i49) | 0;
         i4 = i5;
        } else {
         if (i4 >>> 0 <= i45 >>> 0) break;
         do {
          i4 = i4 + -1 | 0;
          HEAP8[i4 >> 0] = 48;
         } while (i4 >>> 0 > i45 >>> 0);
        } while (0);
        i5 = i33 - i4 | 0;
        if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i4, (i3 | 0) > (i5 | 0) ? i5 : i3, i49) | 0;
        i3 = i3 - i5 | 0;
        i7 = i7 + 4 | 0;
       } while (i7 >>> 0 < i9 >>> 0 & (i3 | 0) > -1);
      }
      _pad(i49, 48, i3 + 18 | 0, 18, 0);
      if (HEAP32[i49 >> 2] & 32) break;
      ___fwritex(i10, i41 - i10 | 0, i49) | 0;
     } while (0);
     _pad(i49, 32, i25, i14, i23 ^ 8192);
     i3 = (i14 | 0) < (i25 | 0) ? i25 : i14;
    } else {
     i9 = (i10 & 32 | 0) != 0;
     i8 = d6 != d6 | 0.0 != 0.0;
     i4 = i8 ? 0 : i21;
     i7 = i4 + 3 | 0;
     _pad(i49, 32, i25, i7, i5);
     i3 = HEAP32[i49 >> 2] | 0;
     if (!(i3 & 32)) {
      ___fwritex(i22, i4, i49) | 0;
      i3 = HEAP32[i49 >> 2] | 0;
     }
     if (!(i3 & 32)) ___fwritex(i8 ? (i9 ? 11852 : 11856) : i9 ? 11844 : 11848, 3, i49) | 0;
     _pad(i49, 32, i25, i7, i23 ^ 8192);
     i3 = (i7 | 0) < (i25 | 0) ? i25 : i7;
    } while (0);
    i12 = i24;
    continue L1;
   }
  default:
   {
    i5 = i23;
    i4 = i7;
    i9 = 0;
    i10 = 11808;
    i3 = i28;
   }
  } while (0);
  L313 : do if ((i26 | 0) == 64) {
   i5 = i43;
   i4 = HEAP32[i5 >> 2] | 0;
   i5 = HEAP32[i5 + 4 >> 2] | 0;
   i8 = i10 & 32;
   if (!((i4 | 0) == 0 & (i5 | 0) == 0)) {
    i3 = i28;
    do {
     i3 = i3 + -1 | 0;
     HEAP8[i3 >> 0] = HEAPU8[11792 + (i4 & 15) >> 0] | i8;
     i4 = _bitshift64Lshr(i4 | 0, i5 | 0, 4) | 0;
     i5 = tempRet0;
    } while (!((i4 | 0) == 0 & (i5 | 0) == 0));
    i26 = i43;
    if ((i9 & 8 | 0) == 0 | (HEAP32[i26 >> 2] | 0) == 0 & (HEAP32[i26 + 4 >> 2] | 0) == 0) {
     i4 = i9;
     i9 = 0;
     i8 = 11808;
     i26 = 77;
    } else {
     i4 = i9;
     i9 = 2;
     i8 = 11808 + (i10 >> 4) | 0;
     i26 = 77;
    }
   } else {
    i3 = i28;
    i4 = i9;
    i9 = 0;
    i8 = 11808;
    i26 = 77;
   }
  } else if ((i26 | 0) == 76) {
   i3 = _fmt_u(i3, i4, i28) | 0;
   i4 = i23;
   i9 = i5;
   i26 = 77;
  } else if ((i26 | 0) == 82) {
   i26 = 0;
   i23 = _memchr(i3, 0, i7) | 0;
   i22 = (i23 | 0) == 0;
   i12 = i3;
   i4 = i22 ? i7 : i23 - i3 | 0;
   i9 = 0;
   i10 = 11808;
   i3 = i22 ? i3 + i7 | 0 : i23;
  } else if ((i26 | 0) == 86) {
   i26 = 0;
   i4 = 0;
   i3 = 0;
   i8 = HEAP32[i43 >> 2] | 0;
   while (1) {
    i5 = HEAP32[i8 >> 2] | 0;
    if (!i5) break;
    i3 = _wctomb(i47, i5) | 0;
    if ((i3 | 0) < 0 | i3 >>> 0 > (i7 - i4 | 0) >>> 0) break;
    i4 = i3 + i4 | 0;
    if (i7 >>> 0 > i4 >>> 0) i8 = i8 + 4 | 0; else break;
   }
   if ((i3 | 0) < 0) {
    i1 = -1;
    break L1;
   }
   _pad(i49, 32, i25, i4, i23);
   if (!i4) {
    i3 = 0;
    i26 = 98;
   } else {
    i5 = 0;
    i7 = HEAP32[i43 >> 2] | 0;
    while (1) {
     i3 = HEAP32[i7 >> 2] | 0;
     if (!i3) {
      i3 = i4;
      i26 = 98;
      break L313;
     }
     i3 = _wctomb(i47, i3) | 0;
     i5 = i3 + i5 | 0;
     if ((i5 | 0) > (i4 | 0)) {
      i3 = i4;
      i26 = 98;
      break L313;
     }
     if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i47, i3, i49) | 0;
     if (i5 >>> 0 >= i4 >>> 0) {
      i3 = i4;
      i26 = 98;
      break;
     } else i7 = i7 + 4 | 0;
    }
   }
  } while (0);
  if ((i26 | 0) == 98) {
   i26 = 0;
   _pad(i49, 32, i25, i3, i23 ^ 8192);
   i12 = i24;
   i3 = (i25 | 0) > (i3 | 0) ? i25 : i3;
   continue;
  }
  if ((i26 | 0) == 77) {
   i26 = 0;
   i5 = (i7 | 0) > -1 ? i4 & -65537 : i4;
   i4 = i43;
   i4 = (HEAP32[i4 >> 2] | 0) != 0 | (HEAP32[i4 + 4 >> 2] | 0) != 0;
   if ((i7 | 0) != 0 | i4) {
    i4 = (i4 & 1 ^ 1) + (i35 - i3) | 0;
    i12 = i3;
    i4 = (i7 | 0) > (i4 | 0) ? i7 : i4;
    i10 = i8;
    i3 = i28;
   } else {
    i12 = i28;
    i4 = 0;
    i10 = i8;
    i3 = i28;
   }
  }
  i8 = i3 - i12 | 0;
  i4 = (i4 | 0) < (i8 | 0) ? i8 : i4;
  i7 = i9 + i4 | 0;
  i3 = (i25 | 0) < (i7 | 0) ? i7 : i25;
  _pad(i49, 32, i3, i7, i5);
  if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i10, i9, i49) | 0;
  _pad(i49, 48, i3, i7, i5 ^ 65536);
  _pad(i49, 48, i4, i8, 0);
  if (!(HEAP32[i49 >> 2] & 32)) ___fwritex(i12, i8, i49) | 0;
  _pad(i49, 32, i3, i7, i5 ^ 8192);
  i12 = i24;
 }
 L348 : do if ((i26 | 0) == 245) if (!i49) if (i2) {
  i1 = 1;
  while (1) {
   i2 = HEAP32[i52 + (i1 << 2) >> 2] | 0;
   if (!i2) break;
   _pop_arg(i51 + (i1 << 3) | 0, i2, i50);
   i1 = i1 + 1 | 0;
   if ((i1 | 0) >= 10) {
    i1 = 1;
    break L348;
   }
  }
  if ((i1 | 0) < 10) while (1) {
   if (HEAP32[i52 + (i1 << 2) >> 2] | 0) {
    i1 = -1;
    break L348;
   }
   i1 = i1 + 1 | 0;
   if ((i1 | 0) >= 10) {
    i1 = 1;
    break;
   }
  } else i1 = 1;
 } else i1 = 0; while (0);
 STACKTOP = i53;
 return i1 | 0;
}

function _svm_train(i13, i64) {
 i13 = i13 | 0;
 i64 = i64 | 0;
 var i1 = 0, i2 = 0, i3 = 0, d4 = 0.0, i5 = 0, d6 = 0.0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, d25 = 0.0, d26 = 0.0, d27 = 0.0, d28 = 0.0, d29 = 0.0, d30 = 0.0, d31 = 0.0, d32 = 0.0, i33 = 0, d34 = 0.0, d35 = 0.0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0, i49 = 0, i50 = 0, i51 = 0, i52 = 0, i53 = 0, i54 = 0, i55 = 0, i56 = 0, i57 = 0, i58 = 0, i59 = 0, i60 = 0, i61 = 0, i62 = 0, i63 = 0, i65 = 0, i66 = 0, i67 = 0, i68 = 0, i69 = 0, i70 = 0, i71 = 0, i72 = 0, i73 = 0, i74 = 0, i75 = 0, i76 = 0, i77 = 0, i78 = 0, i79 = 0, i80 = 0, i81 = 0, i82 = 0;
 i82 = STACKTOP;
 STACKTOP = STACKTOP + 304 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i66 = i82 + 264 | 0;
 i62 = i82 + 256 | 0;
 i61 = i82 + 248 | 0;
 i14 = i82 + 240 | 0;
 i3 = i82 + 232 | 0;
 i9 = i82 + 224 | 0;
 i63 = i82 + 128 | 0;
 i60 = i82 + 32 | 0;
 i12 = i82 + 16 | 0;
 i79 = i82 + 292 | 0;
 i78 = i82 + 288 | 0;
 i80 = i82 + 284 | 0;
 i70 = i82 + 280 | 0;
 i59 = i82 + 268 | 0;
 i58 = i82;
 i81 = _malloc(144) | 0;
 i5 = i81;
 i10 = i64;
 i15 = i5 + 96 | 0;
 do {
  HEAP32[i5 >> 2] = HEAP32[i10 >> 2];
  i5 = i5 + 4 | 0;
  i10 = i10 + 4 | 0;
 } while ((i5 | 0) < (i15 | 0));
 HEAP32[i81 + 136 >> 2] = 0;
 i1 = HEAP32[i64 >> 2] | 0;
 if ((i1 + -2 | 0) >>> 0 < 3) {
  HEAP32[i81 + 96 >> 2] = 2;
  HEAP32[i81 + 128 >> 2] = 0;
  HEAP32[i81 + 132 >> 2] = 0;
  i8 = i81 + 116 | 0;
  HEAP32[i8 >> 2] = 0;
  HEAP32[i81 + 120 >> 2] = 0;
  i80 = _malloc(4) | 0;
  i11 = i81 + 108 | 0;
  HEAP32[i11 >> 2] = i80;
  if ((HEAP32[i64 + 92 >> 2] | 0) != 0 & (i1 + -3 | 0) >>> 0 < 2) {
   i7 = _malloc(8) | 0;
   HEAP32[i8 >> 2] = i7;
   i7 = _malloc(HEAP32[i13 >> 2] << 3) | 0;
   i5 = i63;
   i10 = i64;
   i15 = i5 + 96 | 0;
   do {
    HEAP32[i5 >> 2] = HEAP32[i10 >> 2];
    i5 = i5 + 4 | 0;
    i10 = i10 + 4 | 0;
   } while ((i5 | 0) < (i15 | 0));
   HEAP32[i63 + 92 >> 2] = 0;
   _svm_cross_validation(i13, i63, 5, i7);
   i5 = HEAP32[i13 >> 2] | 0;
   i3 = (i5 | 0) > 0;
   if (i3) {
    i1 = HEAP32[i13 + 4 >> 2] | 0;
    i2 = 0;
    d4 = 0.0;
    do {
     i80 = i7 + (i2 << 3) | 0;
     d35 = +HEAPF64[i1 + (i2 << 3) >> 3] - +HEAPF64[i80 >> 3];
     HEAPF64[i80 >> 3] = d35;
     d4 = d4 + +Math_abs(+d35);
     i2 = i2 + 1 | 0;
    } while ((i2 | 0) < (i5 | 0));
    d4 = d4 / +(i5 | 0);
    if (i3) {
     d6 = +Math_sqrt(+(d4 * (d4 * 2.0))) * 5.0;
     i1 = 0;
     i2 = 0;
     d4 = 0.0;
     do {
      d35 = +Math_abs(+(+HEAPF64[i7 + (i2 << 3) >> 3]));
      i80 = d35 > d6;
      d4 = i80 ? d4 : d4 + d35;
      i1 = (i80 & 1) + i1 | 0;
      i2 = i2 + 1 | 0;
     } while ((i2 | 0) < (i5 | 0));
    } else {
     i1 = 0;
     d4 = 0.0;
    }
   } else {
    i1 = 0;
    d4 = 0.0;
   }
   d35 = d4 / +(i5 - i1 | 0);
   HEAPF64[i9 >> 3] = d35;
   __ZN6LIBSVML4infoEPKcz(4797, i9);
   _free(i7);
   HEAPF64[HEAP32[i8 >> 2] >> 3] = d35;
  }
  __ZN6LIBSVML13svm_train_oneEPKNS_11svm_problemEPKNS_13svm_parameterEdd(i12, i13, i64, 0.0, 0.0);
  i7 = _malloc(8) | 0;
  HEAP32[i81 + 112 >> 2] = i7;
  HEAPF64[i7 >> 3] = +HEAPF64[i12 + 8 >> 3];
  i7 = HEAP32[i13 >> 2] | 0;
  i5 = (i7 | 0) > 0;
  if (i5) {
   i2 = HEAP32[i12 >> 2] | 0;
   i3 = 0;
   i1 = 0;
   do {
    d35 = +HEAPF64[i2 + (i3 << 3) >> 3];
    i1 = (d35 == d35 & 0.0 == 0.0 & d35 != 0.0 & 1) + i1 | 0;
    i3 = i3 + 1 | 0;
   } while ((i3 | 0) < (i7 | 0));
  } else i1 = 0;
  HEAP32[i81 + 100 >> 2] = i1;
  i80 = i1 << 2;
  i9 = _malloc(i80) | 0;
  i10 = i81 + 104 | 0;
  HEAP32[i10 >> 2] = i9;
  i9 = _malloc(i1 << 3) | 0;
  HEAP32[HEAP32[i11 >> 2] >> 2] = i9;
  i80 = _malloc(i80) | 0;
  i9 = i81 + 124 | 0;
  HEAP32[i9 >> 2] = i80;
  if (i5) {
   i1 = HEAP32[i12 >> 2] | 0;
   i8 = i13 + 8 | 0;
   i2 = i7;
   i3 = 0;
   i5 = 0;
   do {
    d4 = +HEAPF64[i1 + (i3 << 3) >> 3];
    if (d4 != d4 | 0.0 != 0.0 | d4 == 0.0) i3 = i3 + 1 | 0; else {
     HEAP32[(HEAP32[i10 >> 2] | 0) + (i5 << 2) >> 2] = HEAP32[(HEAP32[i8 >> 2] | 0) + (i3 << 2) >> 2];
     HEAPF64[(HEAP32[HEAP32[i11 >> 2] >> 2] | 0) + (i5 << 3) >> 3] = d4;
     i3 = i3 + 1 | 0;
     HEAP32[(HEAP32[i9 >> 2] | 0) + (i5 << 2) >> 2] = i3;
     i2 = HEAP32[i13 >> 2] | 0;
     i5 = i5 + 1 | 0;
    }
   } while ((i3 | 0) < (i2 | 0));
  } else i1 = HEAP32[i12 >> 2] | 0;
  _free(i1);
  STACKTOP = i82;
  return i81 | 0;
 }
 i67 = HEAP32[i13 >> 2] | 0;
 HEAP32[i78 >> 2] = 0;
 HEAP32[i80 >> 2] = 0;
 HEAP32[i70 >> 2] = 0;
 i2 = i67 << 2;
 i77 = _malloc(i2) | 0;
 __ZN6LIBSVML17svm_group_classesEPKNS_11svm_problemEPiPS3_S4_S4_S3_(i13, i79, i78, i80, i70, i77);
 i1 = HEAP32[i79 >> 2] | 0;
 if ((i1 | 0) == 1) __ZN6LIBSVML4infoEPKcz(4919, i3);
 i76 = _malloc(i2) | 0;
 i65 = (i67 | 0) > 0;
 if (i65) {
  i2 = HEAP32[i13 + 8 >> 2] | 0;
  i3 = 0;
  do {
   HEAP32[i76 + (i3 << 2) >> 2] = HEAP32[i2 + (HEAP32[i77 + (i3 << 2) >> 2] << 2) >> 2];
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) != (i67 | 0));
 }
 i75 = _malloc(i1 << 3) | 0;
 i13 = (i1 | 0) > 0;
 if (i13) {
  d4 = +HEAPF64[i64 + 48 >> 3];
  i2 = 0;
  do {
   HEAPF64[i75 + (i2 << 3) >> 3] = d4;
   i2 = i2 + 1 | 0;
  } while ((i2 | 0) < (i1 | 0));
 }
 i8 = i64 + 56 | 0;
 i2 = HEAP32[i8 >> 2] | 0;
 if ((i2 | 0) > 0) {
  i9 = i64 + 60 | 0;
  i10 = HEAP32[619] | 0;
  i11 = i64 + 64 | 0;
  i12 = HEAP32[i78 >> 2] | 0;
  i7 = 0;
  do {
   L49 : do if (i13) {
    i5 = HEAP32[(HEAP32[i9 >> 2] | 0) + (i7 << 2) >> 2] | 0;
    i3 = 0;
    do {
     if ((i5 | 0) == (HEAP32[i12 + (i3 << 2) >> 2] | 0)) break L49;
     i3 = i3 + 1 | 0;
    } while ((i3 | 0) < (i1 | 0));
   } else i3 = 0; while (0);
   if ((i3 | 0) == (i1 | 0)) {
    HEAP32[i14 >> 2] = HEAP32[(HEAP32[i9 >> 2] | 0) + (i7 << 2) >> 2];
    _fprintf(i10, 4986, i14) | 0;
    i2 = HEAP32[i8 >> 2] | 0;
   } else {
    i74 = i75 + (i3 << 3) | 0;
    HEAPF64[i74 >> 3] = +HEAPF64[(HEAP32[i11 >> 2] | 0) + (i7 << 3) >> 3] * +HEAPF64[i74 >> 3];
   }
   i7 = i7 + 1 | 0;
  } while ((i7 | 0) < (i2 | 0));
 }
 i73 = _malloc(i67) | 0;
 if (i65) _memset(i73 | 0, 0, i67 | 0) | 0;
 i2 = (Math_imul(i1 + -1 | 0, i1) | 0) / 2 | 0;
 i74 = _malloc(i2 << 4) | 0;
 i56 = i64 + 92 | 0;
 if (!(HEAP32[i56 >> 2] | 0)) {
  i71 = 0;
  i72 = 0;
 } else {
  i72 = i2 << 3;
  i71 = _malloc(i72) | 0;
  i72 = _malloc(i72) | 0;
 }
 if (i13) {
  i44 = HEAP32[i80 >> 2] | 0;
  i45 = HEAP32[i70 >> 2] | 0;
  i46 = i59 + 8 | 0;
  i47 = i59 + 4 | 0;
  i48 = i63 + 8 | 0;
  i49 = i63 + 4 | 0;
  i50 = i60 + 92 | 0;
  i51 = i60 + 48 | 0;
  i52 = i60 + 56 | 0;
  i53 = i60 + 60 | 0;
  i54 = i60 + 64 | 0;
  i55 = HEAP32[i79 >> 2] | 0;
  i43 = 0;
  i2 = 0;
  do {
   i3 = i43;
   i43 = i43 + 1 | 0;
   if ((i43 | 0) < (i1 | 0)) {
    i41 = i44 + (i3 << 2) | 0;
    i42 = i45 + (i3 << 2) | 0;
    i39 = i75 + (i3 << 3) | 0;
    i40 = i43;
    while (1) {
     i33 = HEAP32[i41 >> 2] | 0;
     i36 = HEAP32[i44 + (i40 << 2) >> 2] | 0;
     i37 = HEAP32[i42 >> 2] | 0;
     i38 = HEAP32[i45 + (i40 << 2) >> 2] | 0;
     i22 = i38 + i37 | 0;
     HEAP32[i59 >> 2] = i22;
     i7 = i22 << 2;
     i1 = _malloc(i7) | 0;
     HEAP32[i46 >> 2] = i1;
     i16 = i22 << 3;
     i3 = _malloc(i16) | 0;
     HEAP32[i47 >> 2] = i3;
     i24 = (i37 | 0) > 0;
     if (i24) {
      i5 = 0;
      do {
       HEAP32[i1 + (i5 << 2) >> 2] = HEAP32[i76 + (i5 + i33 << 2) >> 2];
       HEAPF64[i3 + (i5 << 3) >> 3] = 1.0;
       i5 = i5 + 1 | 0;
      } while ((i5 | 0) != (i37 | 0));
     }
     i23 = (i38 | 0) > 0;
     if (i23) {
      i1 = HEAP32[i46 >> 2] | 0;
      i3 = HEAP32[i47 >> 2] | 0;
      i5 = 0;
      do {
       i21 = i5 + i37 | 0;
       HEAP32[i1 + (i21 << 2) >> 2] = HEAP32[i76 + (i5 + i36 << 2) >> 2];
       HEAPF64[i3 + (i21 << 3) >> 3] = -1.0;
       i5 = i5 + 1 | 0;
      } while ((i5 | 0) != (i38 | 0));
     }
     if (!(HEAP32[i56 >> 2] | 0)) i1 = i75 + (i40 << 3) | 0; else {
      d4 = +HEAPF64[i39 >> 3];
      i1 = i75 + (i40 << 3) | 0;
      d6 = +HEAPF64[i1 >> 3];
      i18 = i71 + (i2 << 3) | 0;
      i19 = i72 + (i2 << 3) | 0;
      i20 = _malloc(i7) | 0;
      i21 = _malloc(i16) | 0;
      i17 = (i22 | 0) > 0;
      if (i17) {
       i3 = 0;
       do {
        HEAP32[i20 + (i3 << 2) >> 2] = i3;
        i3 = i3 + 1 | 0;
       } while ((i3 | 0) < (i22 | 0));
       if (i17) {
        i3 = 0;
        do {
         i13 = i20 + (i3 << 2) | 0;
         i15 = i20 + (((_rand() | 0) % (i22 - i3 | 0) | 0) + i3 << 2) | 0;
         i14 = HEAP32[i13 >> 2] | 0;
         HEAP32[i13 >> 2] = HEAP32[i15 >> 2];
         HEAP32[i15 >> 2] = i14;
         i3 = i3 + 1 | 0;
        } while ((i3 | 0) < (i22 | 0));
       }
      }
      i11 = HEAP32[i46 >> 2] | 0;
      i12 = HEAP32[i47 >> 2] | 0;
      i14 = 0;
      do {
       i15 = Math_imul(i14, i22) | 0;
       i3 = (i15 | 0) / 5 | 0;
       i14 = i14 + 1 | 0;
       i13 = (Math_imul(i14, i22) | 0) / 5 | 0;
       i7 = i3 - i13 + i22 | 0;
       HEAP32[i63 >> 2] = i7;
       i5 = _malloc(i7 << 2) | 0;
       HEAP32[i48 >> 2] = i5;
       i7 = _malloc(i7 << 3) | 0;
       HEAP32[i49 >> 2] = i7;
       if ((i15 | 0) > 4) {
        i8 = (i3 | 0) > 1;
        i9 = 0;
        do {
         i15 = HEAP32[i20 + (i9 << 2) >> 2] | 0;
         HEAP32[i5 + (i9 << 2) >> 2] = HEAP32[i11 + (i15 << 2) >> 2];
         HEAPF64[i7 + (i9 << 3) >> 3] = +HEAPF64[i12 + (i15 << 3) >> 3];
         i9 = i9 + 1 | 0;
        } while ((i9 | 0) < (i3 | 0));
        i5 = i8 ? i3 : 1;
       } else i5 = 0;
       if ((i13 | 0) < (i22 | 0)) {
        i7 = HEAP32[i48 >> 2] | 0;
        i8 = HEAP32[i49 >> 2] | 0;
        i9 = i22 + i5 | 0;
        i10 = i13;
        while (1) {
         i15 = HEAP32[i20 + (i10 << 2) >> 2] | 0;
         HEAP32[i7 + (i5 << 2) >> 2] = HEAP32[i11 + (i15 << 2) >> 2];
         HEAPF64[i8 + (i5 << 3) >> 3] = +HEAPF64[i12 + (i15 << 3) >> 3];
         i10 = i10 + 1 | 0;
         if ((i10 | 0) == (i22 | 0)) break; else i5 = i5 + 1 | 0;
        }
        i5 = i9 - i13 | 0;
       }
       if ((i5 | 0) > 0) {
        i9 = HEAP32[i49 >> 2] | 0;
        i10 = 0;
        i8 = 0;
        i7 = 0;
        do {
         i15 = +HEAPF64[i9 + (i10 << 3) >> 3] > 0.0 & 1;
         i7 = i15 + i7 | 0;
         i8 = (i15 ^ 1) + i8 | 0;
         i10 = i10 + 1 | 0;
        } while ((i10 | 0) != (i5 | 0));
       } else {
        i8 = 0;
        i7 = 0;
       }
       i5 = (i7 | 0) == 0;
       L112 : do if (!(i8 | i7)) {
        if ((i3 | 0) >= (i13 | 0)) break;
        do {
         HEAPF64[i21 + (HEAP32[i20 + (i3 << 2) >> 2] << 3) >> 3] = 0.0;
         i3 = i3 + 1 | 0;
        } while ((i3 | 0) != (i13 | 0));
       } else {
        if ((i7 | 0) > 0 & (i8 | 0) == 0) {
         if ((i3 | 0) >= (i13 | 0)) break;
         while (1) {
          HEAPF64[i21 + (HEAP32[i20 + (i3 << 2) >> 2] << 3) >> 3] = 1.0;
          i3 = i3 + 1 | 0;
          if ((i3 | 0) == (i13 | 0)) break L112;
         }
        }
        if (i5 & (i8 | 0) > 0) {
         if ((i3 | 0) >= (i13 | 0)) break;
         while (1) {
          HEAPF64[i21 + (HEAP32[i20 + (i3 << 2) >> 2] << 3) >> 3] = -1.0;
          i3 = i3 + 1 | 0;
          if ((i3 | 0) == (i13 | 0)) break L112;
         }
        }
        i5 = i60;
        i10 = i64;
        i15 = i5 + 96 | 0;
        do {
         HEAP32[i5 >> 2] = HEAP32[i10 >> 2];
         i5 = i5 + 4 | 0;
         i10 = i10 + 4 | 0;
        } while ((i5 | 0) < (i15 | 0));
        HEAP32[i50 >> 2] = 0;
        HEAPF64[i51 >> 3] = 1.0;
        HEAP32[i52 >> 2] = 2;
        i15 = _malloc(8) | 0;
        HEAP32[i53 >> 2] = i15;
        i7 = _malloc(16) | 0;
        HEAP32[i54 >> 2] = i7;
        HEAP32[i15 >> 2] = 1;
        HEAP32[i15 + 4 >> 2] = -1;
        HEAPF64[i7 >> 3] = d4;
        HEAPF64[i7 + 8 >> 3] = d6;
        i7 = _svm_train(i63, i60) | 0;
        if ((i3 | 0) >= (i13 | 0)) {
         if (i7) i57 = 84;
        } else {
         i5 = i7 + 128 | 0;
         do {
          i15 = HEAP32[i20 + (i3 << 2) >> 2] | 0;
          i57 = i21 + (i15 << 3) | 0;
          +_svm_predict_values(i7, HEAP32[i11 + (i15 << 2) >> 2] | 0, i57);
          HEAPF64[i57 >> 3] = +(HEAP32[HEAP32[i5 >> 2] >> 2] | 0) * +HEAPF64[i57 >> 3];
          i3 = i3 + 1 | 0;
         } while ((i3 | 0) != (i13 | 0));
         i57 = 84;
        }
        if ((i57 | 0) == 84) {
         i57 = 0;
         _svm_free_model_content(i7);
         _free(i7);
        }
        _free(HEAP32[i53 >> 2] | 0);
        _free(HEAP32[i54 >> 2] | 0);
       } while (0);
       _free(HEAP32[i48 >> 2] | 0);
       _free(HEAP32[i49 >> 2] | 0);
      } while ((i14 | 0) != 5);
      i5 = HEAP32[i47 >> 2] | 0;
      if (i17) {
       i3 = 0;
       d6 = 0.0;
       d4 = 0.0;
       do {
        i15 = +HEAPF64[i5 + (i3 << 3) >> 3] > 0.0;
        d6 = i15 ? d6 : d6 + 1.0;
        d4 = i15 ? d4 + 1.0 : d4;
        i3 = i3 + 1 | 0;
       } while ((i3 | 0) != (i22 | 0));
      } else {
       d6 = 0.0;
       d4 = 0.0;
      }
      d26 = d4 + 1.0;
      d28 = d26 / (d4 + 2.0);
      d29 = 1.0 / (d6 + 2.0);
      i7 = _malloc(i16) | 0;
      HEAPF64[i18 >> 3] = 0.0;
      d26 = +Math_log(+((d6 + 1.0) / d26));
      HEAPF64[i19 >> 3] = d26;
      if (i17) {
       d27 = +HEAPF64[i18 >> 3];
       d25 = 0.0;
       i3 = 0;
       do {
        d4 = +HEAPF64[i5 + (i3 << 3) >> 3] > 0.0 ? d28 : d29;
        HEAPF64[i7 + (i3 << 3) >> 3] = d4;
        d6 = d26 + d27 * +HEAPF64[i21 + (i3 << 3) >> 3];
        if (!(d6 >= 0.0)) d4 = d6 * (d4 + -1.0) + +Math_log(+(+Math_exp(+d6) + 1.0)); else d4 = d4 * d6 + +Math_log(+(+Math_exp(+-d6) + 1.0));
        d25 = d25 + d4;
        i3 = i3 + 1 | 0;
       } while ((i3 | 0) != (i22 | 0));
       d35 = d26;
       i3 = 0;
      } else {
       d35 = d26;
       d25 = 0.0;
       i3 = 0;
      }
      while (1) {
       if (i17) {
        d32 = +HEAPF64[i18 >> 3];
        d26 = 0.0;
        d31 = 0.0;
        d27 = 1.0e-12;
        d6 = 0.0;
        d4 = 1.0e-12;
        i5 = 0;
        while (1) {
         d30 = +HEAPF64[i21 + (i5 << 3) >> 3];
         d28 = d35 + d32 * d30;
         if (!(d28 >= 0.0)) {
          d34 = +Math_exp(+d28);
          d28 = d34 + 1.0;
          d29 = 1.0 / d28;
          d28 = d34 / d28;
         } else {
          d29 = +Math_exp(+-d28);
          d28 = d29 + 1.0;
          d29 = d29 / d28;
          d28 = 1.0 / d28;
         }
         d28 = d28 * d29;
         d27 = d27 + d30 * d30 * d28;
         d4 = d4 + d28;
         d6 = d6 + d30 * d28;
         d28 = +HEAPF64[i7 + (i5 << 3) >> 3] - d29;
         d26 = d26 + d30 * d28;
         d28 = d31 + d28;
         i5 = i5 + 1 | 0;
         if ((i5 | 0) == (i22 | 0)) break; else d31 = d28;
        }
       } else {
        d26 = 0.0;
        d28 = 0.0;
        d27 = 1.0e-12;
        d6 = 0.0;
        d4 = 1.0e-12;
       }
       if (+Math_abs(+d26) < 1.0e-05 ? +Math_abs(+d28) < 1.0e-05 : 0) {
        i57 = 115;
        break;
       }
       d32 = d27 * d4 - d6 * d6;
       d34 = -(d4 * d26 - d28 * d6) / d32;
       d32 = -(d27 * d28 - d26 * d6) / d32;
       d30 = d26 * d34 + d28 * d32;
       d31 = +HEAPF64[i18 >> 3];
       d4 = 1.0;
       while (1) {
        d26 = d31 + d34 * d4;
        d6 = d35 + d32 * d4;
        if (i17) {
         i5 = 0;
         d27 = 0.0;
         do {
          d28 = d6 + d26 * +HEAPF64[i21 + (i5 << 3) >> 3];
          d29 = +HEAPF64[i7 + (i5 << 3) >> 3];
          if (!(d28 >= 0.0)) d28 = (d29 + -1.0) * d28 + +Math_log(+(+Math_exp(+d28) + 1.0)); else d28 = d29 * d28 + +Math_log(+(+Math_exp(+-d28) + 1.0));
          d27 = d27 + d28;
          i5 = i5 + 1 | 0;
         } while ((i5 | 0) != (i22 | 0));
        } else d27 = 0.0;
        if (d27 < d25 + d30 * (d4 * .0001)) {
         d25 = d27;
         i57 = 110;
         break;
        }
        d4 = d4 * .5;
        if (!(d4 >= 1.0e-10)) {
         d6 = d35;
         break;
        }
       }
       if ((i57 | 0) == 110) {
        i57 = 0;
        HEAPF64[i18 >> 3] = d26;
        HEAPF64[i19 >> 3] = d6;
       }
       if (d4 < 1.0e-10) {
        i57 = 113;
        break;
       }
       i3 = i3 + 1 | 0;
       if ((i3 | 0) >= 100) {
        i57 = 116;
        break;
       } else d35 = d6;
      }
      if ((i57 | 0) == 113) {
       __ZN6LIBSVML4infoEPKcz(5044, i61);
       i57 = 115;
      }
      if ((i57 | 0) == 115 ? (i57 = 0, (i3 | 0) > 99) : 0) i57 = 116;
      if ((i57 | 0) == 116) {
       i57 = 0;
       __ZN6LIBSVML4infoEPKcz(5098, i62);
      }
      _free(i7);
      _free(i21);
      _free(i20);
     }
     i5 = i74 + (i2 << 4) | 0;
     __ZN6LIBSVML13svm_train_oneEPKNS_11svm_problemEPKNS_13svm_parameterEdd(i58, i59, i64, +HEAPF64[i39 >> 3], +HEAPF64[i1 >> 3]);
     HEAP32[i5 >> 2] = HEAP32[i58 >> 2];
     HEAP32[i5 + 4 >> 2] = HEAP32[i58 + 4 >> 2];
     HEAP32[i5 + 8 >> 2] = HEAP32[i58 + 8 >> 2];
     HEAP32[i5 + 12 >> 2] = HEAP32[i58 + 12 >> 2];
     if (i24) {
      i3 = 0;
      do {
       i1 = i73 + (i3 + i33) | 0;
       do if (!(HEAP8[i1 >> 0] | 0)) {
        d35 = +HEAPF64[(HEAP32[i5 >> 2] | 0) + (i3 << 3) >> 3];
        if (d35 != d35 | 0.0 != 0.0 | d35 == 0.0) break;
        HEAP8[i1 >> 0] = 1;
       } while (0);
       i3 = i3 + 1 | 0;
      } while ((i3 | 0) != (i37 | 0));
     }
     if (i23) {
      i3 = 0;
      do {
       i1 = i73 + (i3 + i36) | 0;
       do if (!(HEAP8[i1 >> 0] | 0)) {
        d35 = +HEAPF64[(HEAP32[i5 >> 2] | 0) + (i3 + i37 << 3) >> 3];
        if (d35 != d35 | 0.0 != 0.0 | d35 == 0.0) break;
        HEAP8[i1 >> 0] = 1;
       } while (0);
       i3 = i3 + 1 | 0;
      } while ((i3 | 0) != (i38 | 0));
     }
     _free(HEAP32[i46 >> 2] | 0);
     _free(HEAP32[i47 >> 2] | 0);
     i2 = i2 + 1 | 0;
     i40 = i40 + 1 | 0;
     if ((i40 | 0) >= (i55 | 0)) {
      i1 = i55;
      break;
     }
    }
   }
  } while ((i43 | 0) < (i1 | 0));
 }
 HEAP32[i81 + 96 >> 2] = i1;
 i5 = _malloc(i1 << 2) | 0;
 HEAP32[i81 + 128 >> 2] = i5;
 if ((i1 | 0) > 0) {
  i2 = HEAP32[i78 >> 2] | 0;
  i1 = HEAP32[i79 >> 2] | 0;
  i3 = 0;
  do {
   HEAP32[i5 + (i3 << 2) >> 2] = HEAP32[i2 + (i3 << 2) >> 2];
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) < (i1 | 0));
 }
 i8 = Math_imul(i1 + -1 | 0, i1) | 0;
 i9 = (i8 | 0) / 2 | 0;
 i7 = i9 << 3;
 i2 = _malloc(i7) | 0;
 HEAP32[i81 + 112 >> 2] = i2;
 i8 = (i8 | 0) > 1;
 if (i8) {
  i3 = 0;
  do {
   HEAPF64[i2 + (i3 << 3) >> 3] = +HEAPF64[i74 + (i3 << 4) + 8 >> 3];
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) < (i9 | 0));
 }
 if (HEAP32[i56 >> 2] | 0) {
  i5 = _malloc(i7) | 0;
  HEAP32[i81 + 116 >> 2] = i5;
  i3 = _malloc(i7) | 0;
  HEAP32[i81 + 120 >> 2] = i3;
  if (i8) {
   i2 = 0;
   do {
    HEAPF64[i5 + (i2 << 3) >> 3] = +HEAPF64[i71 + (i2 << 3) >> 3];
    HEAPF64[i3 + (i2 << 3) >> 3] = +HEAPF64[i72 + (i2 << 3) >> 3];
    i2 = i2 + 1 | 0;
   } while ((i2 | 0) < (i9 | 0));
  }
 } else {
  HEAP32[i81 + 116 >> 2] = 0;
  HEAP32[i81 + 120 >> 2] = 0;
 }
 i12 = i1 << 2;
 i33 = _malloc(i12) | 0;
 i12 = _malloc(i12) | 0;
 HEAP32[i81 + 132 >> 2] = i12;
 if ((i1 | 0) > 0) {
  i8 = HEAP32[i70 >> 2] | 0;
  i9 = HEAP32[i80 >> 2] | 0;
  i10 = HEAP32[i79 >> 2] | 0;
  i11 = 0;
  i1 = 0;
  do {
   i3 = HEAP32[i8 + (i11 << 2) >> 2] | 0;
   if ((i3 | 0) > 0) {
    i5 = HEAP32[i9 + (i11 << 2) >> 2] | 0;
    i7 = 0;
    i2 = 0;
    do {
     i64 = HEAP8[i73 + (i5 + i7) >> 0] | 0;
     i1 = ((i64 ^ 1) & 255 ^ 1) + i1 | 0;
     i2 = (i64 & 255) + i2 | 0;
     i7 = i7 + 1 | 0;
    } while ((i7 | 0) < (i3 | 0));
   } else i2 = 0;
   HEAP32[i12 + (i11 << 2) >> 2] = i2;
   HEAP32[i33 + (i11 << 2) >> 2] = i2;
   i11 = i11 + 1 | 0;
  } while ((i11 | 0) < (i10 | 0));
  i7 = i1;
 } else {
  i10 = i1;
  i7 = 0;
 }
 HEAP32[i66 >> 2] = i7;
 __ZN6LIBSVML4infoEPKcz(5162, i66);
 HEAP32[i81 + 100 >> 2] = i7;
 i66 = i7 << 2;
 i5 = _malloc(i66) | 0;
 i3 = i81 + 104 | 0;
 HEAP32[i3 >> 2] = i5;
 i66 = _malloc(i66) | 0;
 i5 = i81 + 124 | 0;
 HEAP32[i5 >> 2] = i66;
 if (i65) {
  i2 = 0;
  i1 = 0;
  do {
   if (HEAP8[i73 + i2 >> 0] | 0) {
    HEAP32[(HEAP32[i3 >> 2] | 0) + (i1 << 2) >> 2] = HEAP32[i76 + (i2 << 2) >> 2];
    HEAP32[(HEAP32[i5 >> 2] | 0) + (i1 << 2) >> 2] = (HEAP32[i77 + (i2 << 2) >> 2] | 0) + 1;
    i1 = i1 + 1 | 0;
   }
   i2 = i2 + 1 | 0;
  } while ((i2 | 0) != (i67 | 0));
 }
 i1 = i10 << 2;
 i24 = _malloc(i1) | 0;
 HEAP32[i24 >> 2] = 0;
 i5 = (i10 | 0) > 1;
 if (i5) {
  i2 = 0;
  i3 = 1;
  do {
   i2 = (HEAP32[i33 + (i3 + -1 << 2) >> 2] | 0) + i2 | 0;
   HEAP32[i24 + (i3 << 2) >> 2] = i2;
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) < (i10 | 0));
 }
 i1 = _malloc(i1 + -4 | 0) | 0;
 i23 = i81 + 108 | 0;
 HEAP32[i23 >> 2] = i1;
 if (i5 ? (i68 = i7 << 3, i69 = i10 + -1 | 0, i67 = _malloc(i68) | 0, HEAP32[i1 >> 2] = i67, (i69 | 0) > 1) : 0) {
  i1 = 1;
  do {
   i67 = HEAP32[i23 >> 2] | 0;
   i66 = _malloc(i68) | 0;
   HEAP32[i67 + (i1 << 2) >> 2] = i66;
   i1 = i1 + 1 | 0;
  } while ((i1 | 0) < (i69 | 0));
 }
 L247 : do if ((i10 | 0) > 0) {
  i22 = HEAP32[i80 >> 2] | 0;
  i1 = HEAP32[i70 >> 2] | 0;
  i19 = 0;
  i2 = i10;
  i21 = 0;
  while (1) {
   i20 = i2 + -1 | 0;
   i16 = i19;
   i19 = i19 + 1 | 0;
   i8 = (i19 | 0) < (i10 | 0);
   if (!i8) break L247;
   i9 = HEAP32[i22 + (i16 << 2) >> 2] | 0;
   i11 = HEAP32[i1 + (i16 << 2) >> 2] | 0;
   i12 = HEAP32[i24 + (i16 << 2) >> 2] | 0;
   i13 = (i11 | 0) > 0;
   i17 = i19;
   i18 = i21;
   while (1) {
    i14 = HEAP32[i22 + (i17 << 2) >> 2] | 0;
    i15 = HEAP32[i1 + (i17 << 2) >> 2] | 0;
    if (i13) {
     i3 = i74 + (i18 << 4) | 0;
     i5 = i17 + -1 | 0;
     i7 = 0;
     i2 = i12;
     do {
      if (HEAP8[i73 + (i7 + i9) >> 0] | 0) {
       HEAPF64[(HEAP32[(HEAP32[i23 >> 2] | 0) + (i5 << 2) >> 2] | 0) + (i2 << 3) >> 3] = +HEAPF64[(HEAP32[i3 >> 2] | 0) + (i7 << 3) >> 3];
       i2 = i2 + 1 | 0;
      }
      i7 = i7 + 1 | 0;
     } while ((i7 | 0) != (i11 | 0));
    }
    if ((i15 | 0) > 0) {
     i3 = i74 + (i18 << 4) | 0;
     i5 = 0;
     i2 = HEAP32[i24 + (i17 << 2) >> 2] | 0;
     do {
      if (HEAP8[i73 + (i5 + i14) >> 0] | 0) {
       HEAPF64[(HEAP32[(HEAP32[i23 >> 2] | 0) + (i16 << 2) >> 2] | 0) + (i2 << 3) >> 3] = +HEAPF64[(HEAP32[i3 >> 2] | 0) + (i5 + i11 << 3) >> 3];
       i2 = i2 + 1 | 0;
      }
      i5 = i5 + 1 | 0;
     } while ((i5 | 0) != (i15 | 0));
    }
    i17 = i17 + 1 | 0;
    if ((i17 | 0) == (i10 | 0)) break; else i18 = i18 + 1 | 0;
   }
   if (!i8) break; else {
    i2 = i20;
    i21 = i21 + i20 | 0;
   }
  }
 } else i1 = HEAP32[i70 >> 2] | 0; while (0);
 _free(HEAP32[i78 >> 2] | 0);
 _free(i71);
 _free(i72);
 _free(i1);
 _free(i77);
 _free(HEAP32[i80 >> 2] | 0);
 _free(i76);
 _free(i75);
 _free(i73);
 i1 = HEAP32[i79 >> 2] | 0;
 i1 = Math_imul(i1 + -1 | 0, i1) | 0;
 if ((i1 | 0) > 1) {
  i1 = (i1 | 0) / 2 | 0;
  i2 = 0;
  do {
   _free(HEAP32[i74 + (i2 << 4) >> 2] | 0);
   i2 = i2 + 1 | 0;
  } while ((i2 | 0) < (i1 | 0));
 }
 _free(i74);
 _free(i33);
 _free(i24);
 STACKTOP = i82;
 return i81 | 0;
}

function __ZN13neuralNetworkC2ERKiRKNSt3__16vectorIiNS2_9allocatorIiEEEES1_S1_RKNS3_IdNS4_IdEEEESC_SC_SC_RKdSE_(i49, i1, i2, i3, i4, i18, i5, i6, i7, i9, i8) {
 i49 = i49 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i18 = i18 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 i9 = i9 | 0;
 i8 = i8 | 0;
 var i10 = 0, d11 = 0.0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i48 = 0;
 i31 = STACKTOP;
 STACKTOP = STACKTOP + 96 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i23 = i31 + 76 | 0;
 i19 = i31 + 64 | 0;
 i17 = i31 + 32 | 0;
 i22 = i31 + 24 | 0;
 i32 = i31 + 52 | 0;
 i27 = i31 + 40 | 0;
 i25 = i31 + 16 | 0;
 i28 = i31 + 8 | 0;
 i30 = i31;
 HEAP32[i49 >> 2] = 1312;
 i26 = i49 + 4 | 0;
 HEAP32[i26 >> 2] = HEAP32[i1 >> 2];
 i48 = i49 + 8 | 0;
 __THREW__ = 0;
 invoke_vii(11, i48 | 0, i2 | 0);
 i47 = __THREW__;
 __THREW__ = 0;
 if (i47 & 1) {
  i49 = ___cxa_find_matching_catch() | 0;
  ___resumeException(i49 | 0);
 }
 i24 = i49 + 20 | 0;
 HEAP32[i24 >> 2] = HEAP32[i3 >> 2];
 i29 = i49 + 24 | 0;
 HEAP32[i29 >> 2] = HEAP32[i4 >> 2];
 i46 = i49 + 28 | 0;
 i47 = i49 + 32 | 0;
 i44 = i49 + 40 | 0;
 i45 = i49 + 44 | 0;
 i42 = i49 + 64 | 0;
 HEAP32[i42 >> 2] = 0;
 i43 = i49 + 68 | 0;
 HEAP32[i43 >> 2] = 0;
 HEAP32[i49 + 72 >> 2] = 0;
 i41 = i49 + 76 | 0;
 HEAP32[i46 >> 2] = 0;
 HEAP32[i46 + 4 >> 2] = 0;
 HEAP32[i46 + 8 >> 2] = 0;
 HEAP32[i46 + 12 >> 2] = 0;
 HEAP32[i46 + 16 >> 2] = 0;
 HEAP32[i46 + 20 >> 2] = 0;
 __THREW__ = 0;
 invoke_vii(8, i41 | 0, i5 | 0);
 i40 = __THREW__;
 __THREW__ = 0;
 if (!(i40 & 1)) {
  i40 = i49 + 88 | 0;
  __THREW__ = 0;
  invoke_vii(8, i40 | 0, i6 | 0);
  i39 = __THREW__;
  __THREW__ = 0;
  if (!(i39 & 1)) {
   i39 = i49 + 100 | 0;
   __THREW__ = 0;
   invoke_vii(8, i39 | 0, i7 | 0);
   i38 = __THREW__;
   __THREW__ = 0;
   if (!(i38 & 1)) {
    HEAPF64[i49 + 112 >> 3] = +HEAPF64[i9 >> 3];
    HEAPF64[i49 + 120 >> 3] = +HEAPF64[i8 >> 3];
    HEAPF64[i49 + 128 >> 3] = .3;
    HEAPF64[i49 + 136 >> 3] = .2;
    HEAP32[i49 + 144 >> 2] = 500;
    i37 = i49 + 148 | 0;
    i38 = i49 + 152 | 0;
    i34 = i49 + 160 | 0;
    i36 = i49 + 164 | 0;
    i33 = i49 + 172 | 0;
    i35 = i49 + 176 | 0;
    i1 = i18 + 4 | 0;
    i2 = i37;
    i3 = i2 + 44 | 0;
    do {
     HEAP32[i2 >> 2] = 0;
     i2 = i2 + 4 | 0;
    } while ((i2 | 0) < (i3 | 0));
    i15 = (HEAP32[i1 >> 2] | 0) == (HEAP32[i18 >> 2] | 0);
    L14 : do if ((HEAP32[i24 >> 2] | 0) > 0) {
     i21 = i23 + 4 | 0;
     i8 = i23 + 8 | 0;
     i9 = i49 + 72 | 0;
     i16 = i19 + 4 | 0;
     i10 = i19 + 8 | 0;
     i12 = i23 + 8 | 0;
     i13 = i19 + 8 | 0;
     i1 = 1;
     i2 = 0;
     i14 = 0;
     L16 : while (1) {
      HEAP32[i23 >> 2] = 0;
      HEAP32[i21 >> 2] = 0;
      HEAP32[i8 >> 2] = 0;
      if ((HEAP32[i29 >> 2] | 0) > 0) {
       i3 = i2;
       i7 = 0;
       while (1) {
        HEAP32[i19 >> 2] = 0;
        HEAP32[i16 >> 2] = 0;
        HEAP32[i10 >> 2] = 0;
        i2 = HEAP32[i26 >> 2] | 0;
        if ((i2 | 0) >= 0) if (i15) {
         i4 = i3;
         i5 = 0;
         while (1) {
          i6 = ((i1 >>> 0) % 44488 | 0) * 48271 | 0;
          i3 = ((i1 >>> 0) / 44488 | 0) * 3399 | 0;
          i3 = (i6 >>> 0 < i3 >>> 0 ? 2147483647 : 0) + (i6 - i3) | 0;
          i6 = ((i3 >>> 0) % 44488 | 0) * 48271 | 0;
          i1 = ((i3 >>> 0) / 44488 | 0) * 3399 | 0;
          i1 = (i6 >>> 0 < i1 >>> 0 ? 2147483647 : 0) + (i6 - i1) | 0;
          d11 = (+((i3 + -1 | 0) >>> 0) + +((i1 + -1 | 0) >>> 0) * 2147483646.0) / 4611686009837453312.0 + -.5;
          HEAPF64[i17 >> 3] = d11;
          i3 = HEAP32[i16 >> 2] | 0;
          if (i3 >>> 0 < (HEAP32[i13 >> 2] | 0) >>> 0) {
           HEAPF64[i3 >> 3] = d11;
           HEAP32[i16 >> 2] = i3 + 8;
          } else {
           __THREW__ = 0;
           invoke_vii(7, i19 | 0, i17 | 0);
           i6 = __THREW__;
           __THREW__ = 0;
           if (i6 & 1) {
            i17 = 15;
            break L16;
           }
           i2 = HEAP32[i26 >> 2] | 0;
          }
          i3 = i4 + 1 | 0;
          if ((i5 | 0) < (i2 | 0)) {
           i4 = i3;
           i5 = i5 + 1 | 0;
          } else {
           i5 = i3;
           break;
          }
         }
        } else {
         i5 = i3;
         i6 = 0;
         while (1) {
          i3 = (HEAP32[i18 >> 2] | 0) + (i5 << 3) | 0;
          i4 = HEAP32[i16 >> 2] | 0;
          if ((i4 | 0) == (HEAP32[i13 >> 2] | 0)) {
           __THREW__ = 0;
           invoke_vii(9, i19 | 0, i3 | 0);
           i4 = __THREW__;
           __THREW__ = 0;
           if (i4 & 1) {
            i17 = 24;
            break L16;
           }
           i2 = HEAP32[i26 >> 2] | 0;
          } else {
           HEAPF64[i4 >> 3] = +HEAPF64[i3 >> 3];
           HEAP32[i16 >> 2] = i4 + 8;
          }
          i3 = i5 + 1 | 0;
          if ((i6 | 0) < (i2 | 0)) {
           i5 = i3;
           i6 = i6 + 1 | 0;
          } else {
           i5 = i3;
           break;
          }
         }
        } else i5 = i3;
        i2 = HEAP32[i21 >> 2] | 0;
        __THREW__ = 0;
        if ((i2 | 0) == (HEAP32[i12 >> 2] | 0)) {
         __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEE21__push_back_slow_pathIRKS3_EEvOT_(i23, i19);
         i6 = __THREW__;
         __THREW__ = 0;
         if (i6 & 1) {
          i17 = 25;
          break L16;
         }
        } else {
         __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i2, i19);
         i6 = __THREW__;
         __THREW__ = 0;
         if (i6 & 1) {
          i17 = 25;
          break L16;
         }
         HEAP32[i21 >> 2] = (HEAP32[i21 >> 2] | 0) + 12;
        }
        i2 = HEAP32[i19 >> 2] | 0;
        i3 = i2;
        if (i2) {
         i4 = HEAP32[i16 >> 2] | 0;
         if ((i4 | 0) != (i2 | 0)) HEAP32[i16 >> 2] = i4 + (~((i4 + -8 - i3 | 0) >>> 3) << 3);
         __ZdlPv(i2);
        }
        i7 = i7 + 1 | 0;
        if ((i7 | 0) >= (HEAP32[i29 >> 2] | 0)) {
         i7 = i5;
         break;
        } else i3 = i5;
       }
      } else i7 = i2;
      i2 = HEAP32[i43 >> 2] | 0;
      __THREW__ = 0;
      if ((i2 | 0) == (HEAP32[i9 >> 2] | 0)) {
       __ZNSt3__16vectorINS0_INS0_IdNS_9allocatorIdEEEENS1_IS3_EEEENS1_IS5_EEE21__push_back_slow_pathIRKS5_EEvOT_(i42, i23);
       i6 = __THREW__;
       __THREW__ = 0;
       if (i6 & 1) {
        i17 = 58;
        break;
       }
      } else {
       __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEEC2ERKS5_(i2, i23);
       i6 = __THREW__;
       __THREW__ = 0;
       if (i6 & 1) {
        i17 = 58;
        break;
       }
       HEAP32[i43 >> 2] = (HEAP32[i43 >> 2] | 0) + 12;
      }
      i2 = HEAP32[i23 >> 2] | 0;
      if (i2) {
       i3 = HEAP32[i21 >> 2] | 0;
       if ((i3 | 0) != (i2 | 0)) {
        do {
         i4 = i3 + -12 | 0;
         HEAP32[i21 >> 2] = i4;
         i5 = HEAP32[i4 >> 2] | 0;
         i6 = i5;
         if (!i5) i3 = i4; else {
          i3 = i3 + -8 | 0;
          i4 = HEAP32[i3 >> 2] | 0;
          if ((i4 | 0) != (i5 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i6 | 0) >>> 3) << 3);
          __ZdlPv(i5);
          i3 = HEAP32[i21 >> 2] | 0;
         }
        } while ((i3 | 0) != (i2 | 0));
        i2 = HEAP32[i23 >> 2] | 0;
       }
       __ZdlPv(i2);
      }
      i14 = i14 + 1 | 0;
      if ((i14 | 0) >= (HEAP32[i24 >> 2] | 0)) {
       i17 = 68;
       break L14;
      } else i2 = i7;
     }
     if ((i17 | 0) == 15) {
      i5 = ___cxa_find_matching_catch() | 0;
      i6 = tempRet0;
      i17 = 26;
     } else if ((i17 | 0) == 24) {
      i5 = ___cxa_find_matching_catch() | 0;
      i6 = tempRet0;
      i17 = 26;
     } else if ((i17 | 0) == 25) {
      i5 = ___cxa_find_matching_catch() | 0;
      i6 = tempRet0;
      i17 = 26;
     } else if ((i17 | 0) == 58) {
      i5 = ___cxa_find_matching_catch() | 0;
      i6 = tempRet0;
     }
     if ((i17 | 0) == 26) {
      i1 = HEAP32[i19 >> 2] | 0;
      i2 = i1;
      if (i1) {
       i3 = HEAP32[i16 >> 2] | 0;
       if ((i3 | 0) != (i1 | 0)) HEAP32[i16 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
       __ZdlPv(i1);
      }
     }
     i1 = HEAP32[i23 >> 2] | 0;
     if (i1) {
      i2 = HEAP32[i21 >> 2] | 0;
      if ((i2 | 0) != (i1 | 0)) {
       do {
        i3 = i2 + -12 | 0;
        HEAP32[i21 >> 2] = i3;
        i4 = HEAP32[i3 >> 2] | 0;
        i7 = i4;
        if (!i4) i2 = i3; else {
         i2 = i2 + -8 | 0;
         i3 = HEAP32[i2 >> 2] | 0;
         if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i7 | 0) >>> 3) << 3);
         __ZdlPv(i4);
         i2 = HEAP32[i21 >> 2] | 0;
        }
       } while ((i2 | 0) != (i1 | 0));
       i1 = HEAP32[i23 >> 2] | 0;
      }
      __ZdlPv(i1);
     }
    } else {
     i1 = 1;
     i17 = 68;
    } while (0);
    L94 : do if ((i17 | 0) == 68) {
     L96 : do if (i15 ? (i20 = HEAP32[i29 >> 2] | 0, (i20 | 0) >= 0) : 0) {
      i5 = i49 + 80 | 0;
      i6 = i49 + 84 | 0;
      i2 = i20;
      i4 = 0;
      while (1) {
       i21 = ((i1 >>> 0) % 44488 | 0) * 48271 | 0;
       i3 = ((i1 >>> 0) / 44488 | 0) * 3399 | 0;
       i3 = (i21 >>> 0 < i3 >>> 0 ? 2147483647 : 0) + (i21 - i3) | 0;
       i21 = ((i3 >>> 0) % 44488 | 0) * 48271 | 0;
       i23 = ((i3 >>> 0) / 44488 | 0) * 3399 | 0;
       i1 = (i21 >>> 0 < i23 >>> 0 ? 2147483647 : 0) + (i21 - i23) | 0;
       d11 = (+((i3 + -1 | 0) >>> 0) + +((i1 + -1 | 0) >>> 0) * 2147483646.0) / 4611686009837453312.0 + -.5;
       HEAPF64[i22 >> 3] = d11;
       i3 = HEAP32[i5 >> 2] | 0;
       if (i3 >>> 0 < (HEAP32[i6 >> 2] | 0) >>> 0) {
        HEAPF64[i3 >> 3] = d11;
        HEAP32[i5 >> 2] = i3 + 8;
       } else {
        __THREW__ = 0;
        invoke_vii(7, i41 | 0, i22 | 0);
        i23 = __THREW__;
        __THREW__ = 0;
        if (i23 & 1) break;
        i2 = HEAP32[i29 >> 2] | 0;
       }
       if ((i4 | 0) >= (i2 | 0)) {
        i17 = 71;
        break L96;
       } else i4 = i4 + 1 | 0;
      }
      i5 = ___cxa_find_matching_catch() | 0;
      i6 = tempRet0;
     } else i17 = 71; while (0);
     do if ((i17 | 0) == 71) {
      i1 = HEAP32[i49 + 92 >> 2] | 0;
      i4 = HEAP32[i40 >> 2] | 0;
      if ((i1 | 0) != (i4 | 0)) {
       i1 = i1 - i4 >> 3;
       i3 = 0;
       do {
        i2 = i4 + (i3 << 3) | 0;
        if (+HEAPF64[i2 >> 3] == 0.0) HEAPF64[i2 >> 3] = 1.0;
        i3 = i3 + 1 | 0;
       } while (i3 >>> 0 < i1 >>> 0);
      }
      L117 : do if ((HEAP32[i24 >> 2] | 0) > 0) {
       i14 = i32 + 4 | 0;
       i6 = i32 + 8 | 0;
       i7 = i49 + 156 | 0;
       i13 = i27 + 4 | 0;
       i8 = i27 + 8 | 0;
       i9 = i32 + 8 | 0;
       i10 = i27 + 8 | 0;
       i12 = 0;
       L119 : while (1) {
        HEAP32[i32 >> 2] = 0;
        HEAP32[i14 >> 2] = 0;
        HEAP32[i6 >> 2] = 0;
        if ((HEAP32[i29 >> 2] | 0) > 0) {
         i5 = 0;
         do {
          HEAP32[i27 >> 2] = 0;
          HEAP32[i13 >> 2] = 0;
          HEAP32[i8 >> 2] = 0;
          i1 = HEAP32[i26 >> 2] | 0;
          L124 : do if ((i1 | 0) >= 0) {
           i3 = 0;
           i4 = 0;
           i2 = 0;
           while (1) {
            HEAPF64[i25 >> 3] = 0.0;
            if (i3 >>> 0 < i4 >>> 0) {
             HEAPF64[i3 >> 3] = 0.0;
             HEAP32[i13 >> 2] = i3 + 8;
            } else {
             __THREW__ = 0;
             invoke_vii(7, i27 | 0, i25 | 0);
             i23 = __THREW__;
             __THREW__ = 0;
             if (i23 & 1) {
              i17 = 93;
              break L119;
             }
             i1 = HEAP32[i26 >> 2] | 0;
            }
            if ((i2 | 0) >= (i1 | 0)) break L124;
            i3 = HEAP32[i13 >> 2] | 0;
            i4 = HEAP32[i10 >> 2] | 0;
            i2 = i2 + 1 | 0;
           }
          } while (0);
          i1 = HEAP32[i14 >> 2] | 0;
          __THREW__ = 0;
          if ((i1 | 0) == (HEAP32[i9 >> 2] | 0)) {
           __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEE21__push_back_slow_pathIRKS3_EEvOT_(i32, i27);
           i23 = __THREW__;
           __THREW__ = 0;
           if (i23 & 1) {
            i17 = 94;
            break L119;
           }
          } else {
           __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i1, i27);
           i23 = __THREW__;
           __THREW__ = 0;
           if (i23 & 1) {
            i17 = 94;
            break L119;
           }
           HEAP32[i14 >> 2] = (HEAP32[i14 >> 2] | 0) + 12;
          }
          i1 = HEAP32[i27 >> 2] | 0;
          i2 = i1;
          if (i1) {
           i3 = HEAP32[i13 >> 2] | 0;
           if ((i3 | 0) != (i1 | 0)) HEAP32[i13 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
           __ZdlPv(i1);
          }
          i5 = i5 + 1 | 0;
         } while ((i5 | 0) < (HEAP32[i29 >> 2] | 0));
        }
        i1 = HEAP32[i38 >> 2] | 0;
        __THREW__ = 0;
        if ((i1 | 0) == (HEAP32[i7 >> 2] | 0)) {
         __ZNSt3__16vectorINS0_INS0_IdNS_9allocatorIdEEEENS1_IS3_EEEENS1_IS5_EEE21__push_back_slow_pathIRKS5_EEvOT_(i37, i32);
         i23 = __THREW__;
         __THREW__ = 0;
         if (i23 & 1) {
          i17 = 122;
          break;
         }
        } else {
         __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEEC2ERKS5_(i1, i32);
         i23 = __THREW__;
         __THREW__ = 0;
         if (i23 & 1) {
          i17 = 122;
          break;
         }
         HEAP32[i38 >> 2] = (HEAP32[i38 >> 2] | 0) + 12;
        }
        i1 = HEAP32[i32 >> 2] | 0;
        if (i1) {
         i2 = HEAP32[i14 >> 2] | 0;
         if ((i2 | 0) != (i1 | 0)) {
          do {
           i3 = i2 + -12 | 0;
           HEAP32[i14 >> 2] = i3;
           i4 = HEAP32[i3 >> 2] | 0;
           i5 = i4;
           if (!i4) i2 = i3; else {
            i2 = i2 + -8 | 0;
            i3 = HEAP32[i2 >> 2] | 0;
            if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
            __ZdlPv(i4);
            i2 = HEAP32[i14 >> 2] | 0;
           }
          } while ((i2 | 0) != (i1 | 0));
          i1 = HEAP32[i32 >> 2] | 0;
         }
         __ZdlPv(i1);
        }
        i12 = i12 + 1 | 0;
        if ((i12 | 0) >= (HEAP32[i24 >> 2] | 0)) break L117;
       }
       if ((i17 | 0) == 93) {
        i5 = ___cxa_find_matching_catch() | 0;
        i6 = tempRet0;
        i17 = 95;
       } else if ((i17 | 0) == 94) {
        i5 = ___cxa_find_matching_catch() | 0;
        i6 = tempRet0;
        i17 = 95;
       } else if ((i17 | 0) == 122) {
        i5 = ___cxa_find_matching_catch() | 0;
        i6 = tempRet0;
       }
       if ((i17 | 0) == 95) {
        i1 = HEAP32[i27 >> 2] | 0;
        i2 = i1;
        if (i1) {
         i3 = HEAP32[i13 >> 2] | 0;
         if ((i3 | 0) != (i1 | 0)) HEAP32[i13 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
         __ZdlPv(i1);
        }
       }
       i1 = HEAP32[i32 >> 2] | 0;
       if (!i1) break L94;
       i2 = HEAP32[i14 >> 2] | 0;
       if ((i2 | 0) != (i1 | 0)) {
        do {
         i3 = i2 + -12 | 0;
         HEAP32[i14 >> 2] = i3;
         i4 = HEAP32[i3 >> 2] | 0;
         i7 = i4;
         if (!i4) i2 = i3; else {
          i2 = i2 + -8 | 0;
          i3 = HEAP32[i2 >> 2] | 0;
          if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i7 | 0) >>> 3) << 3);
          __ZdlPv(i4);
          i2 = HEAP32[i14 >> 2] | 0;
         }
        } while ((i2 | 0) != (i1 | 0));
        i1 = HEAP32[i32 >> 2] | 0;
       }
       __ZdlPv(i1);
       break L94;
      } while (0);
      i1 = HEAP32[i29 >> 2] | 0;
      if ((i1 | 0) < 0) {
       STACKTOP = i31;
       return;
      }
      i4 = i49 + 168 | 0;
      i3 = 0;
      while (1) {
       HEAPF64[i28 >> 3] = 0.0;
       i2 = HEAP32[i36 >> 2] | 0;
       if (i2 >>> 0 < (HEAP32[i4 >> 2] | 0) >>> 0) {
        HEAPF64[i2 >> 3] = 0.0;
        HEAP32[i36 >> 2] = i2 + 8;
       } else {
        __THREW__ = 0;
        invoke_vii(7, i34 | 0, i28 | 0);
        i32 = __THREW__;
        __THREW__ = 0;
        if (i32 & 1) {
         i17 = 21;
         break;
        }
        i1 = HEAP32[i29 >> 2] | 0;
       }
       if ((i3 | 0) < (i1 | 0)) i3 = i3 + 1 | 0; else break;
      }
      if ((i17 | 0) == 21) {
       i5 = ___cxa_find_matching_catch() | 0;
       i6 = tempRet0;
       break;
      }
      if ((i1 | 0) < 0) {
       STACKTOP = i31;
       return;
      }
      i4 = i49 + 180 | 0;
      i3 = 0;
      while (1) {
       HEAPF64[i30 >> 3] = 0.0;
       i2 = HEAP32[i35 >> 2] | 0;
       if (i2 >>> 0 < (HEAP32[i4 >> 2] | 0) >>> 0) {
        HEAPF64[i2 >> 3] = 0.0;
        HEAP32[i35 >> 2] = i2 + 8;
       } else {
        __THREW__ = 0;
        invoke_vii(7, i33 | 0, i30 | 0);
        i32 = __THREW__;
        __THREW__ = 0;
        if (i32 & 1) {
         i17 = 20;
         break;
        }
        i1 = HEAP32[i29 >> 2] | 0;
       }
       if ((i3 | 0) < (i1 | 0)) i3 = i3 + 1 | 0; else {
        i17 = 144;
        break;
       }
      }
      if ((i17 | 0) == 20) {
       i5 = ___cxa_find_matching_catch() | 0;
       i6 = tempRet0;
       break;
      } else if ((i17 | 0) == 144) {
       STACKTOP = i31;
       return;
      }
     } while (0);
    } while (0);
    i1 = HEAP32[i33 >> 2] | 0;
    i2 = i1;
    if (i1) {
     i3 = HEAP32[i35 >> 2] | 0;
     if ((i3 | 0) != (i1 | 0)) HEAP32[i35 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
     __ZdlPv(i1);
    }
    i1 = HEAP32[i34 >> 2] | 0;
    i2 = i1;
    if (i1) {
     i3 = HEAP32[i36 >> 2] | 0;
     if ((i3 | 0) != (i1 | 0)) HEAP32[i36 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
     __ZdlPv(i1);
    }
    i1 = HEAP32[i37 >> 2] | 0;
    if (i1) {
     i2 = HEAP32[i38 >> 2] | 0;
     if ((i2 | 0) != (i1 | 0)) {
      do {
       i9 = i2 + -12 | 0;
       HEAP32[i38 >> 2] = i9;
       i10 = HEAP32[i9 >> 2] | 0;
       if (!i10) i2 = i9; else {
        i8 = i2 + -8 | 0;
        i2 = HEAP32[i8 >> 2] | 0;
        if ((i2 | 0) == (i10 | 0)) i2 = i10; else {
         do {
          i3 = i2 + -12 | 0;
          HEAP32[i8 >> 2] = i3;
          i4 = HEAP32[i3 >> 2] | 0;
          i7 = i4;
          if (!i4) i2 = i3; else {
           i2 = i2 + -8 | 0;
           i3 = HEAP32[i2 >> 2] | 0;
           if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i7 | 0) >>> 3) << 3);
           __ZdlPv(i4);
           i2 = HEAP32[i8 >> 2] | 0;
          }
         } while ((i2 | 0) != (i10 | 0));
         i2 = HEAP32[i9 >> 2] | 0;
        }
        __ZdlPv(i2);
        i2 = HEAP32[i38 >> 2] | 0;
       }
      } while ((i2 | 0) != (i1 | 0));
      i1 = HEAP32[i37 >> 2] | 0;
     }
     __ZdlPv(i1);
    }
    i1 = HEAP32[i39 >> 2] | 0;
    i2 = i1;
    if (i1) {
     i3 = i49 + 104 | 0;
     i4 = HEAP32[i3 >> 2] | 0;
     if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
     __ZdlPv(i1);
    }
   } else {
    i5 = ___cxa_find_matching_catch() | 0;
    i6 = tempRet0;
   }
   i1 = HEAP32[i40 >> 2] | 0;
   i2 = i1;
   if (i1) {
    i3 = i49 + 92 | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
    __ZdlPv(i1);
   }
  } else {
   i5 = ___cxa_find_matching_catch() | 0;
   i6 = tempRet0;
  }
  i1 = HEAP32[i41 >> 2] | 0;
  i2 = i1;
  if (!i1) i10 = i5; else {
   i3 = i49 + 80 | 0;
   i4 = HEAP32[i3 >> 2] | 0;
   if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
   __ZdlPv(i1);
   i10 = i5;
  }
 } else {
  i10 = ___cxa_find_matching_catch() | 0;
  i6 = tempRet0;
 }
 i1 = HEAP32[i42 >> 2] | 0;
 if (i1) {
  i2 = HEAP32[i43 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i8 = i2 + -12 | 0;
    HEAP32[i43 >> 2] = i8;
    i9 = HEAP32[i8 >> 2] | 0;
    if (!i9) i2 = i8; else {
     i7 = i2 + -8 | 0;
     i2 = HEAP32[i7 >> 2] | 0;
     if ((i2 | 0) == (i9 | 0)) i2 = i9; else {
      do {
       i3 = i2 + -12 | 0;
       HEAP32[i7 >> 2] = i3;
       i4 = HEAP32[i3 >> 2] | 0;
       i5 = i4;
       if (!i4) i2 = i3; else {
        i2 = i2 + -8 | 0;
        i3 = HEAP32[i2 >> 2] | 0;
        if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
        __ZdlPv(i4);
        i2 = HEAP32[i7 >> 2] | 0;
       }
      } while ((i2 | 0) != (i9 | 0));
      i2 = HEAP32[i8 >> 2] | 0;
     }
     __ZdlPv(i2);
     i2 = HEAP32[i43 >> 2] | 0;
    }
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i42 >> 2] | 0;
  }
  __ZdlPv(i1);
 }
 i1 = HEAP32[i44 >> 2] | 0;
 if (i1) {
  i2 = HEAP32[i45 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i3 = i2 + -12 | 0;
    HEAP32[i45 >> 2] = i3;
    i4 = HEAP32[i3 >> 2] | 0;
    i5 = i4;
    if (!i4) i2 = i3; else {
     i2 = i2 + -8 | 0;
     i3 = HEAP32[i2 >> 2] | 0;
     if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
     __ZdlPv(i4);
     i2 = HEAP32[i45 >> 2] | 0;
    }
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i44 >> 2] | 0;
  }
  __ZdlPv(i1);
 }
 i1 = HEAP32[i46 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = HEAP32[i47 >> 2] | 0;
  if ((i3 | 0) != (i1 | 0)) HEAP32[i47 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i3 = HEAP32[i48 >> 2] | 0;
 if (!i3) {
  i49 = i10;
  ___resumeException(i49 | 0);
 }
 i1 = i49 + 12 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -4 - i3 | 0) >>> 2) << 2);
 __ZdlPv(i3);
 i49 = i10;
 ___resumeException(i49 | 0);
}

function __ZN13neuralNetworkC2ERKiRKNSt3__16vectorIiNS2_9allocatorIiEEEES1_S1_(i48, i1, i2, i3, i4) {
 i48 = i48 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0, i7 = 0, i8 = 0, d9 = 0.0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i41 = 0, i42 = 0, i43 = 0, i44 = 0, i45 = 0, i46 = 0, i47 = 0, i49 = 0, i50 = 0;
 i27 = STACKTOP;
 STACKTOP = STACKTOP + 96 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i19 = i27 + 76 | 0;
 i16 = i27 + 64 | 0;
 i15 = i27 + 32 | 0;
 i18 = i27 + 24 | 0;
 i28 = i27 + 52 | 0;
 i23 = i27 + 40 | 0;
 i21 = i27 + 16 | 0;
 i24 = i27 + 8 | 0;
 i26 = i27;
 HEAP32[i48 >> 2] = 1312;
 i22 = i48 + 4 | 0;
 HEAP32[i22 >> 2] = HEAP32[i1 >> 2];
 i47 = i48 + 8 | 0;
 __THREW__ = 0;
 invoke_vii(11, i47 | 0, i2 | 0);
 i46 = __THREW__;
 __THREW__ = 0;
 if (i46 & 1) {
  i48 = ___cxa_find_matching_catch() | 0;
  ___resumeException(i48 | 0);
 }
 i20 = i48 + 20 | 0;
 i5 = HEAP32[i3 >> 2] | 0;
 HEAP32[i20 >> 2] = i5;
 i25 = i48 + 24 | 0;
 i1 = HEAP32[i4 >> 2] | 0;
 HEAP32[i25 >> 2] = i1;
 i45 = i48 + 28 | 0;
 i46 = i48 + 32 | 0;
 i43 = i48 + 40 | 0;
 i44 = i48 + 44 | 0;
 i41 = i48 + 64 | 0;
 i42 = i48 + 68 | 0;
 i38 = i48 + 76 | 0;
 i40 = i48 + 80 | 0;
 i36 = i48 + 88 | 0;
 i39 = i48 + 92 | 0;
 i35 = i48 + 100 | 0;
 i37 = i48 + 104 | 0;
 i2 = i48 + 128 | 0;
 HEAP32[i45 >> 2] = 0;
 HEAP32[i45 + 4 >> 2] = 0;
 HEAP32[i45 + 8 >> 2] = 0;
 HEAP32[i45 + 12 >> 2] = 0;
 HEAP32[i45 + 16 >> 2] = 0;
 HEAP32[i45 + 20 >> 2] = 0;
 i3 = i41;
 i4 = i3 + 48 | 0;
 do {
  HEAP32[i3 >> 2] = 0;
  i3 = i3 + 4 | 0;
 } while ((i3 | 0) < (i4 | 0));
 HEAPF64[i2 >> 3] = .3;
 HEAPF64[i48 + 136 >> 3] = .2;
 HEAP32[i48 + 144 >> 2] = 500;
 i33 = i48 + 148 | 0;
 i34 = i48 + 152 | 0;
 i30 = i48 + 160 | 0;
 i32 = i48 + 164 | 0;
 i29 = i48 + 172 | 0;
 i31 = i48 + 176 | 0;
 i2 = (i5 | 0) > 0;
 i3 = i33;
 i4 = i3 + 44 | 0;
 do {
  HEAP32[i3 >> 2] = 0;
  i3 = i3 + 4 | 0;
 } while ((i3 | 0) < (i4 | 0));
 L5 : do if (i2) {
  i17 = i19 + 4 | 0;
  i8 = i19 + 8 | 0;
  i10 = i48 + 72 | 0;
  i14 = i16 + 4 | 0;
  i11 = i16 + 8 | 0;
  i12 = i19 + 8 | 0;
  i13 = i16 + 8 | 0;
  i4 = 1;
  i7 = 0;
  L7 : while (1) {
   HEAP32[i19 >> 2] = 0;
   HEAP32[i17 >> 2] = 0;
   HEAP32[i8 >> 2] = 0;
   if ((i1 | 0) > 0) {
    i6 = 0;
    do {
     HEAP32[i16 >> 2] = 0;
     HEAP32[i14 >> 2] = 0;
     HEAP32[i11 >> 2] = 0;
     i1 = HEAP32[i22 >> 2] | 0;
     L12 : do if ((i1 | 0) >= 0) {
      i2 = 0;
      i3 = 0;
      i5 = 0;
      while (1) {
       i50 = ((i4 >>> 0) % 44488 | 0) * 48271 | 0;
       i49 = ((i4 >>> 0) / 44488 | 0) * 3399 | 0;
       i49 = (i50 >>> 0 < i49 >>> 0 ? 2147483647 : 0) + (i50 - i49) | 0;
       i50 = ((i49 >>> 0) % 44488 | 0) * 48271 | 0;
       i4 = ((i49 >>> 0) / 44488 | 0) * 3399 | 0;
       i4 = (i50 >>> 0 < i4 >>> 0 ? 2147483647 : 0) + (i50 - i4) | 0;
       d9 = (+((i49 + -1 | 0) >>> 0) + +((i4 + -1 | 0) >>> 0) * 2147483646.0) / 4611686009837453312.0 + -.5;
       HEAPF64[i15 >> 3] = d9;
       if (i2 >>> 0 < i3 >>> 0) {
        HEAPF64[i2 >> 3] = d9;
        HEAP32[i14 >> 2] = i2 + 8;
       } else {
        __THREW__ = 0;
        invoke_vii(7, i16 | 0, i15 | 0);
        i50 = __THREW__;
        __THREW__ = 0;
        if (i50 & 1) {
         i15 = 19;
         break L7;
        }
        i1 = HEAP32[i22 >> 2] | 0;
       }
       if ((i5 | 0) >= (i1 | 0)) break L12;
       i2 = HEAP32[i14 >> 2] | 0;
       i3 = HEAP32[i13 >> 2] | 0;
       i5 = i5 + 1 | 0;
      }
     } while (0);
     i1 = HEAP32[i17 >> 2] | 0;
     __THREW__ = 0;
     if ((i1 | 0) == (HEAP32[i12 >> 2] | 0)) {
      __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEE21__push_back_slow_pathIRKS3_EEvOT_(i19, i16);
      i50 = __THREW__;
      __THREW__ = 0;
      if (i50 & 1) {
       i15 = 20;
       break L7;
      }
     } else {
      __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i1, i16);
      i50 = __THREW__;
      __THREW__ = 0;
      if (i50 & 1) {
       i15 = 20;
       break L7;
      }
      HEAP32[i17 >> 2] = (HEAP32[i17 >> 2] | 0) + 12;
     }
     i1 = HEAP32[i16 >> 2] | 0;
     i2 = i1;
     if (i1) {
      i3 = HEAP32[i14 >> 2] | 0;
      if ((i3 | 0) != (i1 | 0)) HEAP32[i14 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
      __ZdlPv(i1);
     }
     i6 = i6 + 1 | 0;
    } while ((i6 | 0) < (HEAP32[i25 >> 2] | 0));
   }
   i1 = HEAP32[i42 >> 2] | 0;
   __THREW__ = 0;
   if ((i1 | 0) == (HEAP32[i10 >> 2] | 0)) {
    __ZNSt3__16vectorINS0_INS0_IdNS_9allocatorIdEEEENS1_IS3_EEEENS1_IS5_EEE21__push_back_slow_pathIRKS5_EEvOT_(i41, i19);
    i50 = __THREW__;
    __THREW__ = 0;
    if (i50 & 1) {
     i15 = 48;
     break;
    }
   } else {
    __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEEC2ERKS5_(i1, i19);
    i50 = __THREW__;
    __THREW__ = 0;
    if (i50 & 1) {
     i15 = 48;
     break;
    }
    HEAP32[i42 >> 2] = (HEAP32[i42 >> 2] | 0) + 12;
   }
   i1 = HEAP32[i19 >> 2] | 0;
   if (i1) {
    i2 = HEAP32[i17 >> 2] | 0;
    if ((i2 | 0) != (i1 | 0)) {
     do {
      i3 = i2 + -12 | 0;
      HEAP32[i17 >> 2] = i3;
      i5 = HEAP32[i3 >> 2] | 0;
      i6 = i5;
      if (!i5) i2 = i3; else {
       i2 = i2 + -8 | 0;
       i3 = HEAP32[i2 >> 2] | 0;
       if ((i3 | 0) != (i5 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i6 | 0) >>> 3) << 3);
       __ZdlPv(i5);
       i2 = HEAP32[i17 >> 2] | 0;
      }
     } while ((i2 | 0) != (i1 | 0));
     i1 = HEAP32[i19 >> 2] | 0;
    }
    __ZdlPv(i1);
   }
   i7 = i7 + 1 | 0;
   i2 = HEAP32[i20 >> 2] | 0;
   i1 = HEAP32[i25 >> 2] | 0;
   if ((i7 | 0) >= (i2 | 0)) {
    i15 = 4;
    break L5;
   }
  }
  if ((i15 | 0) == 19) {
   i5 = ___cxa_find_matching_catch() | 0;
   i4 = tempRet0;
   i15 = 21;
  } else if ((i15 | 0) == 20) {
   i5 = ___cxa_find_matching_catch() | 0;
   i4 = tempRet0;
   i15 = 21;
  } else if ((i15 | 0) == 48) {
   i5 = ___cxa_find_matching_catch() | 0;
   i4 = tempRet0;
  }
  if ((i15 | 0) == 21) {
   i1 = HEAP32[i16 >> 2] | 0;
   i2 = i1;
   if (i1) {
    i3 = HEAP32[i14 >> 2] | 0;
    if ((i3 | 0) != (i1 | 0)) HEAP32[i14 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
    __ZdlPv(i1);
   }
  }
  i1 = HEAP32[i19 >> 2] | 0;
  if (!i1) {
   i10 = i4;
   i11 = i5;
  } else {
   i2 = HEAP32[i17 >> 2] | 0;
   if ((i2 | 0) != (i1 | 0)) {
    do {
     i3 = i2 + -12 | 0;
     HEAP32[i17 >> 2] = i3;
     i6 = HEAP32[i3 >> 2] | 0;
     i7 = i6;
     if (!i6) i2 = i3; else {
      i2 = i2 + -8 | 0;
      i3 = HEAP32[i2 >> 2] | 0;
      if ((i3 | 0) != (i6 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i7 | 0) >>> 3) << 3);
      __ZdlPv(i6);
      i2 = HEAP32[i17 >> 2] | 0;
     }
    } while ((i2 | 0) != (i1 | 0));
    i1 = HEAP32[i19 >> 2] | 0;
   }
   __ZdlPv(i1);
   i10 = i4;
   i11 = i5;
  }
 } else {
  i4 = 1;
  i2 = i5;
  i15 = 4;
 } while (0);
 L76 : do if ((i15 | 0) == 4) {
  do if ((i1 | 0) >= 0) {
   i5 = i48 + 84 | 0;
   i3 = 0;
   while (1) {
    i49 = ((i4 >>> 0) % 44488 | 0) * 48271 | 0;
    i2 = ((i4 >>> 0) / 44488 | 0) * 3399 | 0;
    i2 = (i49 >>> 0 < i2 >>> 0 ? 2147483647 : 0) + (i49 - i2) | 0;
    i49 = ((i2 >>> 0) % 44488 | 0) * 48271 | 0;
    i50 = ((i2 >>> 0) / 44488 | 0) * 3399 | 0;
    i4 = (i49 >>> 0 < i50 >>> 0 ? 2147483647 : 0) + (i49 - i50) | 0;
    d9 = (+((i2 + -1 | 0) >>> 0) + +((i4 + -1 | 0) >>> 0) * 2147483646.0) / 4611686009837453312.0 + -.5;
    HEAPF64[i18 >> 3] = d9;
    i2 = HEAP32[i40 >> 2] | 0;
    if (i2 >>> 0 < (HEAP32[i5 >> 2] | 0) >>> 0) {
     HEAPF64[i2 >> 3] = d9;
     HEAP32[i40 >> 2] = i2 + 8;
    } else {
     __THREW__ = 0;
     invoke_vii(7, i38 | 0, i18 | 0);
     i50 = __THREW__;
     __THREW__ = 0;
     if (i50 & 1) {
      i15 = 17;
      break;
     }
     i1 = HEAP32[i25 >> 2] | 0;
    }
    if ((i3 | 0) >= (i1 | 0)) {
     i15 = 58;
     break;
    } else i3 = i3 + 1 | 0;
   }
   if ((i15 | 0) == 17) {
    i2 = ___cxa_find_matching_catch() | 0;
    i1 = tempRet0;
    break;
   } else if ((i15 | 0) == 58) {
    i2 = HEAP32[i20 >> 2] | 0;
    i15 = 59;
    break;
   }
  } else i15 = 59; while (0);
  do if ((i15 | 0) == 59) {
   L92 : do if ((i2 | 0) > 0) {
    i14 = i28 + 4 | 0;
    i7 = i28 + 8 | 0;
    i8 = i48 + 156 | 0;
    i13 = i23 + 4 | 0;
    i10 = i23 + 8 | 0;
    i11 = i28 + 8 | 0;
    i12 = i23 + 8 | 0;
    i6 = 0;
    L94 : while (1) {
     HEAP32[i28 >> 2] = 0;
     HEAP32[i14 >> 2] = 0;
     HEAP32[i7 >> 2] = 0;
     if ((i1 | 0) > 0) {
      i5 = 0;
      do {
       HEAP32[i23 >> 2] = 0;
       HEAP32[i13 >> 2] = 0;
       HEAP32[i10 >> 2] = 0;
       i1 = HEAP32[i22 >> 2] | 0;
       L99 : do if ((i1 | 0) >= 0) {
        i3 = 0;
        i4 = 0;
        i2 = 0;
        while (1) {
         HEAPF64[i21 >> 3] = 0.0;
         if (i3 >>> 0 < i4 >>> 0) {
          HEAPF64[i3 >> 3] = 0.0;
          HEAP32[i13 >> 2] = i3 + 8;
         } else {
          __THREW__ = 0;
          invoke_vii(7, i23 | 0, i21 | 0);
          i50 = __THREW__;
          __THREW__ = 0;
          if (i50 & 1) {
           i15 = 76;
           break L94;
          }
          i1 = HEAP32[i22 >> 2] | 0;
         }
         if ((i2 | 0) >= (i1 | 0)) break L99;
         i3 = HEAP32[i13 >> 2] | 0;
         i4 = HEAP32[i12 >> 2] | 0;
         i2 = i2 + 1 | 0;
        }
       } while (0);
       i1 = HEAP32[i14 >> 2] | 0;
       __THREW__ = 0;
       if ((i1 | 0) == (HEAP32[i11 >> 2] | 0)) {
        __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEE21__push_back_slow_pathIRKS3_EEvOT_(i28, i23);
        i50 = __THREW__;
        __THREW__ = 0;
        if (i50 & 1) {
         i15 = 77;
         break L94;
        }
       } else {
        __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i1, i23);
        i50 = __THREW__;
        __THREW__ = 0;
        if (i50 & 1) {
         i15 = 77;
         break L94;
        }
        HEAP32[i14 >> 2] = (HEAP32[i14 >> 2] | 0) + 12;
       }
       i1 = HEAP32[i23 >> 2] | 0;
       i2 = i1;
       if (i1) {
        i3 = HEAP32[i13 >> 2] | 0;
        if ((i3 | 0) != (i1 | 0)) HEAP32[i13 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
        __ZdlPv(i1);
       }
       i5 = i5 + 1 | 0;
      } while ((i5 | 0) < (HEAP32[i25 >> 2] | 0));
     }
     i1 = HEAP32[i34 >> 2] | 0;
     __THREW__ = 0;
     if ((i1 | 0) == (HEAP32[i8 >> 2] | 0)) {
      __ZNSt3__16vectorINS0_INS0_IdNS_9allocatorIdEEEENS1_IS3_EEEENS1_IS5_EEE21__push_back_slow_pathIRKS5_EEvOT_(i33, i28);
      i50 = __THREW__;
      __THREW__ = 0;
      if (i50 & 1) {
       i15 = 105;
       break;
      }
     } else {
      __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEEC2ERKS5_(i1, i28);
      i50 = __THREW__;
      __THREW__ = 0;
      if (i50 & 1) {
       i15 = 105;
       break;
      }
      HEAP32[i34 >> 2] = (HEAP32[i34 >> 2] | 0) + 12;
     }
     i1 = HEAP32[i28 >> 2] | 0;
     if (i1) {
      i2 = HEAP32[i14 >> 2] | 0;
      if ((i2 | 0) != (i1 | 0)) {
       do {
        i3 = i2 + -12 | 0;
        HEAP32[i14 >> 2] = i3;
        i4 = HEAP32[i3 >> 2] | 0;
        i5 = i4;
        if (!i4) i2 = i3; else {
         i2 = i2 + -8 | 0;
         i3 = HEAP32[i2 >> 2] | 0;
         if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
         __ZdlPv(i4);
         i2 = HEAP32[i14 >> 2] | 0;
        }
       } while ((i2 | 0) != (i1 | 0));
       i1 = HEAP32[i28 >> 2] | 0;
      }
      __ZdlPv(i1);
     }
     i6 = i6 + 1 | 0;
     i1 = HEAP32[i25 >> 2] | 0;
     if ((i6 | 0) >= (HEAP32[i20 >> 2] | 0)) break L92;
    }
    if ((i15 | 0) == 76) {
     i5 = ___cxa_find_matching_catch() | 0;
     i4 = tempRet0;
     i15 = 78;
    } else if ((i15 | 0) == 77) {
     i5 = ___cxa_find_matching_catch() | 0;
     i4 = tempRet0;
     i15 = 78;
    } else if ((i15 | 0) == 105) {
     i7 = ___cxa_find_matching_catch() | 0;
     i4 = tempRet0;
    }
    if ((i15 | 0) == 78) {
     i1 = HEAP32[i23 >> 2] | 0;
     i2 = i1;
     if (!i1) i7 = i5; else {
      i3 = HEAP32[i13 >> 2] | 0;
      if ((i3 | 0) != (i1 | 0)) HEAP32[i13 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
      __ZdlPv(i1);
      i7 = i5;
     }
    }
    i1 = HEAP32[i28 >> 2] | 0;
    if (!i1) {
     i10 = i4;
     i11 = i7;
     break L76;
    }
    i2 = HEAP32[i14 >> 2] | 0;
    if ((i2 | 0) != (i1 | 0)) {
     do {
      i3 = i2 + -12 | 0;
      HEAP32[i14 >> 2] = i3;
      i5 = HEAP32[i3 >> 2] | 0;
      i6 = i5;
      if (!i5) i2 = i3; else {
       i2 = i2 + -8 | 0;
       i3 = HEAP32[i2 >> 2] | 0;
       if ((i3 | 0) != (i5 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i6 | 0) >>> 3) << 3);
       __ZdlPv(i5);
       i2 = HEAP32[i14 >> 2] | 0;
      }
     } while ((i2 | 0) != (i1 | 0));
     i1 = HEAP32[i28 >> 2] | 0;
    }
    __ZdlPv(i1);
    i10 = i4;
    i11 = i7;
    break L76;
   } while (0);
   if ((i1 | 0) < 0) {
    STACKTOP = i27;
    return;
   }
   i4 = i48 + 168 | 0;
   i3 = 0;
   while (1) {
    HEAPF64[i24 >> 3] = 0.0;
    i2 = HEAP32[i32 >> 2] | 0;
    if (i2 >>> 0 < (HEAP32[i4 >> 2] | 0) >>> 0) {
     HEAPF64[i2 >> 3] = 0.0;
     HEAP32[i32 >> 2] = i2 + 8;
    } else {
     __THREW__ = 0;
     invoke_vii(7, i30 | 0, i24 | 0);
     i50 = __THREW__;
     __THREW__ = 0;
     if (i50 & 1) {
      i15 = 16;
      break;
     }
     i1 = HEAP32[i25 >> 2] | 0;
    }
    if ((i3 | 0) < (i1 | 0)) i3 = i3 + 1 | 0; else break;
   }
   if ((i15 | 0) == 16) {
    i2 = ___cxa_find_matching_catch() | 0;
    i1 = tempRet0;
    break;
   }
   if ((i1 | 0) < 0) {
    STACKTOP = i27;
    return;
   }
   i4 = i48 + 180 | 0;
   i3 = 0;
   while (1) {
    HEAPF64[i26 >> 3] = 0.0;
    i2 = HEAP32[i31 >> 2] | 0;
    if (i2 >>> 0 < (HEAP32[i4 >> 2] | 0) >>> 0) {
     HEAPF64[i2 >> 3] = 0.0;
     HEAP32[i31 >> 2] = i2 + 8;
    } else {
     __THREW__ = 0;
     invoke_vii(7, i29 | 0, i26 | 0);
     i50 = __THREW__;
     __THREW__ = 0;
     if (i50 & 1) {
      i15 = 15;
      break;
     }
     i1 = HEAP32[i25 >> 2] | 0;
    }
    if ((i3 | 0) < (i1 | 0)) i3 = i3 + 1 | 0; else {
     i15 = 127;
     break;
    }
   }
   if ((i15 | 0) == 15) {
    i2 = ___cxa_find_matching_catch() | 0;
    i1 = tempRet0;
    break;
   } else if ((i15 | 0) == 127) {
    STACKTOP = i27;
    return;
   }
  } while (0);
  i10 = i1;
  i11 = i2;
 } while (0);
 i1 = HEAP32[i29 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = HEAP32[i31 >> 2] | 0;
  if ((i3 | 0) != (i1 | 0)) HEAP32[i31 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i1 = HEAP32[i30 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = HEAP32[i32 >> 2] | 0;
  if ((i3 | 0) != (i1 | 0)) HEAP32[i32 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i1 = HEAP32[i33 >> 2] | 0;
 if (i1) {
  i2 = HEAP32[i34 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i7 = i2 + -12 | 0;
    HEAP32[i34 >> 2] = i7;
    i8 = HEAP32[i7 >> 2] | 0;
    if (!i8) i2 = i7; else {
     i6 = i2 + -8 | 0;
     i2 = HEAP32[i6 >> 2] | 0;
     if ((i2 | 0) == (i8 | 0)) i2 = i8; else {
      do {
       i3 = i2 + -12 | 0;
       HEAP32[i6 >> 2] = i3;
       i4 = HEAP32[i3 >> 2] | 0;
       i5 = i4;
       if (!i4) i2 = i3; else {
        i2 = i2 + -8 | 0;
        i3 = HEAP32[i2 >> 2] | 0;
        if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
        __ZdlPv(i4);
        i2 = HEAP32[i6 >> 2] | 0;
       }
      } while ((i2 | 0) != (i8 | 0));
      i2 = HEAP32[i7 >> 2] | 0;
     }
     __ZdlPv(i2);
     i2 = HEAP32[i34 >> 2] | 0;
    }
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i33 >> 2] | 0;
  }
  __ZdlPv(i1);
 }
 i1 = HEAP32[i35 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = HEAP32[i37 >> 2] | 0;
  if ((i3 | 0) != (i1 | 0)) HEAP32[i37 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i1 = HEAP32[i36 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = HEAP32[i39 >> 2] | 0;
  if ((i3 | 0) != (i1 | 0)) HEAP32[i39 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i1 = HEAP32[i38 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = HEAP32[i40 >> 2] | 0;
  if ((i3 | 0) != (i1 | 0)) HEAP32[i40 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i1 = HEAP32[i41 >> 2] | 0;
 if (i1) {
  i2 = HEAP32[i42 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i7 = i2 + -12 | 0;
    HEAP32[i42 >> 2] = i7;
    i8 = HEAP32[i7 >> 2] | 0;
    if (!i8) i2 = i7; else {
     i6 = i2 + -8 | 0;
     i2 = HEAP32[i6 >> 2] | 0;
     if ((i2 | 0) == (i8 | 0)) i2 = i8; else {
      do {
       i3 = i2 + -12 | 0;
       HEAP32[i6 >> 2] = i3;
       i4 = HEAP32[i3 >> 2] | 0;
       i5 = i4;
       if (!i4) i2 = i3; else {
        i2 = i2 + -8 | 0;
        i3 = HEAP32[i2 >> 2] | 0;
        if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
        __ZdlPv(i4);
        i2 = HEAP32[i6 >> 2] | 0;
       }
      } while ((i2 | 0) != (i8 | 0));
      i2 = HEAP32[i7 >> 2] | 0;
     }
     __ZdlPv(i2);
     i2 = HEAP32[i42 >> 2] | 0;
    }
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i41 >> 2] | 0;
  }
  __ZdlPv(i1);
 }
 i1 = HEAP32[i43 >> 2] | 0;
 if (i1) {
  i2 = HEAP32[i44 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i3 = i2 + -12 | 0;
    HEAP32[i44 >> 2] = i3;
    i4 = HEAP32[i3 >> 2] | 0;
    i5 = i4;
    if (!i4) i2 = i3; else {
     i2 = i2 + -8 | 0;
     i3 = HEAP32[i2 >> 2] | 0;
     if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
     __ZdlPv(i4);
     i2 = HEAP32[i44 >> 2] | 0;
    }
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i43 >> 2] | 0;
  }
  __ZdlPv(i1);
 }
 i1 = HEAP32[i45 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = HEAP32[i46 >> 2] | 0;
  if ((i3 | 0) != (i1 | 0)) HEAP32[i46 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i3 = HEAP32[i47 >> 2] | 0;
 if (!i3) {
  i50 = i11;
  ___resumeException(i50 | 0);
 }
 i1 = i48 + 12 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -4 - i3 | 0) >>> 2) << 2);
 __ZdlPv(i3);
 i50 = i11;
 ___resumeException(i50 | 0);
}

function __ZN6LIBSVM6Solver5SolveEiRKNS_7QMatrixEPKdPKaPddddPNS0_12SolutionInfoEi(i31, i44, i25, i1, i3, i43, d42, d41, d2, i45, i11) {
 i31 = i31 | 0;
 i44 = i44 | 0;
 i25 = i25 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 i43 = i43 | 0;
 d42 = +d42;
 d41 = +d41;
 d2 = +d2;
 i45 = i45 | 0;
 i11 = i11 | 0;
 var i4 = 0, i5 = 0, i6 = 0, i7 = 0, d8 = 0.0, d9 = 0.0, d10 = 0.0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, d16 = 0.0, d17 = 0.0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0, i37 = 0, i38 = 0, i39 = 0, i40 = 0, i46 = 0, i47 = 0, i48 = 0;
 i47 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i46 = i47 + 24 | 0;
 i30 = i47 + 16 | 0;
 i29 = i47 + 8 | 0;
 i28 = i47;
 i26 = i47 + 32 | 0;
 i27 = i47 + 28 | 0;
 HEAP32[i31 + 68 >> 2] = i44;
 HEAP32[i31 + 24 >> 2] = i25;
 i40 = FUNCTION_TABLE_ii[HEAP32[(HEAP32[i25 >> 2] | 0) + 4 >> 2] & 63](i25) | 0;
 i24 = i31 + 28 | 0;
 HEAP32[i24 >> 2] = i40;
 i40 = i31 + 56 | 0;
 i6 = i44 >>> 0 > 536870911 ? -1 : i44 << 3;
 i37 = __Znaj(i6) | 0;
 HEAP32[i40 >> 2] = i37;
 i22 = i44 << 3;
 _memcpy(i37 | 0, i1 | 0, i22 | 0) | 0;
 i37 = i31 + 8 | 0;
 i36 = (i44 | 0) > -1 ? i44 : -1;
 i4 = __Znaj(i36) | 0;
 HEAP32[i37 >> 2] = i4;
 _memcpy(i4 | 0, i3 | 0, i44 | 0) | 0;
 i38 = i31 + 20 | 0;
 i1 = __Znaj(i6) | 0;
 HEAP32[i38 >> 2] = i1;
 _memcpy(i1 | 0, i43 | 0, i22 | 0) | 0;
 i22 = i31 + 40 | 0;
 HEAPF64[i22 >> 3] = d42;
 i23 = i31 + 48 | 0;
 HEAPF64[i23 >> 3] = d41;
 HEAPF64[i31 + 32 >> 3] = d2;
 HEAP8[i31 + 72 >> 0] = 0;
 i36 = __Znaj(i36) | 0;
 i39 = i31 + 16 | 0;
 HEAP32[i39 >> 2] = i36;
 i36 = (i44 | 0) > 0;
 L1 : do if (i36) {
  i3 = 0;
  while (1) {
   d2 = +HEAPF64[i1 + (i3 << 3) >> 3];
   do if (!(d2 >= +HEAPF64[((HEAP8[i4 + i3 >> 0] | 0) > 0 ? i22 : i23) >> 3])) {
    i1 = (HEAP32[i39 >> 2] | 0) + i3 | 0;
    if (!(d2 <= 0.0)) {
     HEAP8[i1 >> 0] = 2;
     break;
    } else {
     HEAP8[i1 >> 0] = 0;
     break;
    }
   } else HEAP8[(HEAP32[i39 >> 2] | 0) + i3 >> 0] = 1; while (0);
   i3 = i3 + 1 | 0;
   if ((i3 | 0) == (i44 | 0)) break L1;
   i1 = HEAP32[i38 >> 2] | 0;
   i4 = HEAP32[i37 >> 2] | 0;
  }
 } while (0);
 i1 = __Znaj(i44 >>> 0 > 1073741823 ? -1 : i44 << 2) | 0;
 i35 = i31 + 60 | 0;
 HEAP32[i35 >> 2] = i1;
 if (i36) {
  i3 = 0;
  do {
   HEAP32[i1 + (i3 << 2) >> 2] = i3;
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) != (i44 | 0));
 }
 i21 = i31 + 4 | 0;
 HEAP32[i21 >> 2] = i44;
 i5 = __Znaj(i6) | 0;
 i33 = i31 + 12 | 0;
 HEAP32[i33 >> 2] = i5;
 i1 = __Znaj(i6) | 0;
 i34 = i31 + 64 | 0;
 HEAP32[i34 >> 2] = i1;
 if (i36) {
  i3 = HEAP32[i40 >> 2] | 0;
  i4 = 0;
  do {
   HEAPF64[i5 + (i4 << 3) >> 3] = +HEAPF64[i3 + (i4 << 3) >> 3];
   HEAPF64[i1 + (i4 << 3) >> 3] = 0.0;
   i4 = i4 + 1 | 0;
  } while ((i4 | 0) != (i44 | 0));
  if (i36) {
   i1 = HEAP32[i39 >> 2] | 0;
   i7 = 0;
   do {
    if (HEAP8[i1 + i7 >> 0] | 0) {
     i6 = FUNCTION_TABLE_iiii[HEAP32[HEAP32[i25 >> 2] >> 2] & 31](i25, i7, i44) | 0;
     d2 = +HEAPF64[(HEAP32[i38 >> 2] | 0) + (i7 << 3) >> 3];
     i1 = HEAP32[i33 >> 2] | 0;
     i3 = 0;
     do {
      i20 = i1 + (i3 << 3) | 0;
      HEAPF64[i20 >> 3] = +HEAPF64[i20 >> 3] + d2 * +HEAPF32[i6 + (i3 << 2) >> 2];
      i3 = i3 + 1 | 0;
     } while ((i3 | 0) != (i44 | 0));
     i1 = HEAP32[i39 >> 2] | 0;
     if ((HEAP8[i1 + i7 >> 0] | 0) == 1) {
      i3 = HEAP32[i34 >> 2] | 0;
      i4 = (HEAP32[i37 >> 2] | 0) + i7 | 0;
      i5 = 0;
      do {
       i20 = i3 + (i5 << 3) | 0;
       HEAPF64[i20 >> 3] = +HEAPF64[i20 >> 3] + +HEAPF64[((HEAP8[i4 >> 0] | 0) > 0 ? i22 : i23) >> 3] * +HEAPF32[i6 + (i5 << 2) >> 2];
       i5 = i5 + 1 | 0;
      } while ((i5 | 0) != (i44 | 0));
     }
    }
    i7 = i7 + 1 | 0;
   } while ((i7 | 0) != (i44 | 0));
  }
 }
 i19 = (i44 | 0) > 21474836 ? 2147483647 : i44 * 100 | 0;
 i19 = (i19 | 0) < 1e7 ? 1e7 : i19;
 i20 = (i44 | 0) < 1e3 ? i44 : 1e3;
 L36 : do if ((i19 | 0) > 0) {
  i18 = (i11 | 0) == 0;
  i3 = i20 + 1 | 0;
  i1 = 0;
  while (1) {
   i3 = i3 + -1 | 0;
   if (!i3) {
    if (!i18) FUNCTION_TABLE_vi[HEAP32[(HEAP32[i31 >> 2] | 0) + 16 >> 2] & 63](i31);
    __ZN6LIBSVML4infoEPKcz(11860, i28);
    i3 = i20;
   }
   if (FUNCTION_TABLE_iiii[HEAP32[(HEAP32[i31 >> 2] | 0) + 8 >> 2] & 31](i31, i26, i27) | 0) {
    __ZN6LIBSVM6Solver20reconstruct_gradientEv(i31);
    HEAP32[i21 >> 2] = i44;
    __ZN6LIBSVML4infoEPKcz(4714, i29);
    if (!(FUNCTION_TABLE_iiii[HEAP32[(HEAP32[i31 >> 2] | 0) + 8 >> 2] & 31](i31, i26, i27) | 0)) i3 = 1; else {
     i6 = i1;
     break L36;
    }
   }
   i1 = i1 + 1 | 0;
   i7 = FUNCTION_TABLE_iiii[HEAP32[HEAP32[i25 >> 2] >> 2] & 31](i25, HEAP32[i26 >> 2] | 0, HEAP32[i21 >> 2] | 0) | 0;
   i11 = FUNCTION_TABLE_iiii[HEAP32[HEAP32[i25 >> 2] >> 2] & 31](i25, HEAP32[i27 >> 2] | 0, HEAP32[i21 >> 2] | 0) | 0;
   i13 = HEAP32[i26 >> 2] | 0;
   i6 = HEAP32[i37 >> 2] | 0;
   i15 = i6 + i13 | 0;
   i4 = HEAP8[i15 >> 0] | 0;
   d16 = +HEAPF64[(i4 << 24 >> 24 > 0 ? i22 : i23) >> 3];
   i14 = HEAP32[i27 >> 2] | 0;
   i6 = HEAP8[i6 + i14 >> 0] | 0;
   d17 = +HEAPF64[(i6 << 24 >> 24 > 0 ? i22 : i23) >> 3];
   i5 = HEAP32[i38 >> 2] | 0;
   i12 = i5 + (i13 << 3) | 0;
   d9 = +HEAPF64[i12 >> 3];
   i5 = i5 + (i14 << 3) | 0;
   d10 = +HEAPF64[i5 >> 3];
   i48 = HEAP32[i24 >> 2] | 0;
   d2 = +HEAPF64[i48 + (i13 << 3) >> 3] + +HEAPF64[i48 + (i14 << 3) >> 3];
   d8 = +HEAPF32[i7 + (i14 << 2) >> 2] * 2.0;
   do if (i4 << 24 >> 24 == i6 << 24 >> 24) {
    d8 = d2 - d8;
    i4 = HEAP32[i33 >> 2] | 0;
    d8 = (+HEAPF64[i4 + (i13 << 3) >> 3] - +HEAPF64[i4 + (i14 << 3) >> 3]) / (!(d8 <= 0.0) ? d8 : 1.0e-12);
    d2 = d9 + d10;
    HEAPF64[i12 >> 3] = d9 - d8;
    d8 = d8 + +HEAPF64[i5 >> 3];
    HEAPF64[i5 >> 3] = d8;
    if (d2 > d16) {
     if (+HEAPF64[i12 >> 3] > d16) {
      HEAPF64[i12 >> 3] = d16;
      HEAPF64[i5 >> 3] = d2 - d16;
     }
    } else if (d8 < 0.0) {
     HEAPF64[i5 >> 3] = 0.0;
     HEAPF64[i12 >> 3] = d2;
    }
    if (d2 > d17) {
     if (!(+HEAPF64[i5 >> 3] > d17)) {
      i6 = i4;
      break;
     }
     HEAPF64[i5 >> 3] = d17;
     HEAPF64[i12 >> 3] = d2 - d17;
     i6 = i4;
     break;
    } else {
     if (!(+HEAPF64[i12 >> 3] < 0.0)) {
      i6 = i4;
      break;
     }
     HEAPF64[i12 >> 3] = 0.0;
     HEAPF64[i5 >> 3] = d2;
     i6 = i4;
     break;
    }
   } else {
    d8 = d2 + d8;
    i4 = HEAP32[i33 >> 2] | 0;
    d8 = (-+HEAPF64[i4 + (i13 << 3) >> 3] - +HEAPF64[i4 + (i14 << 3) >> 3]) / (!(d8 <= 0.0) ? d8 : 1.0e-12);
    d2 = d9 - d10;
    HEAPF64[i12 >> 3] = d9 + d8;
    d8 = d8 + +HEAPF64[i5 >> 3];
    HEAPF64[i5 >> 3] = d8;
    if (d2 > 0.0) {
     if (d8 < 0.0) {
      HEAPF64[i5 >> 3] = 0.0;
      HEAPF64[i12 >> 3] = d2;
     }
    } else if (+HEAPF64[i12 >> 3] < 0.0) {
     HEAPF64[i12 >> 3] = 0.0;
     HEAPF64[i5 >> 3] = -d2;
    }
    if (d2 > d16 - d17) {
     if (!(+HEAPF64[i12 >> 3] > d16)) {
      i6 = i4;
      break;
     }
     HEAPF64[i12 >> 3] = d16;
     HEAPF64[i5 >> 3] = d16 - d2;
     i6 = i4;
     break;
    } else {
     if (!(+HEAPF64[i5 >> 3] > d17)) {
      i6 = i4;
      break;
     }
     HEAPF64[i5 >> 3] = d17;
     HEAPF64[i12 >> 3] = d17 + d2;
     i6 = i4;
     break;
    }
   } while (0);
   d2 = +HEAPF64[i12 >> 3];
   d9 = d2 - d9;
   d8 = +HEAPF64[i5 >> 3] - d10;
   i5 = HEAP32[i21 >> 2] | 0;
   if ((i5 | 0) > 0) {
    i4 = 0;
    do {
     i48 = i6 + (i4 << 3) | 0;
     HEAPF64[i48 >> 3] = +HEAPF64[i48 >> 3] + (d9 * +HEAPF32[i7 + (i4 << 2) >> 2] + d8 * +HEAPF32[i11 + (i4 << 2) >> 2]);
     i4 = i4 + 1 | 0;
    } while ((i4 | 0) < (i5 | 0));
    d2 = +HEAPF64[i12 >> 3];
   }
   i7 = HEAP32[i39 >> 2] | 0;
   i4 = i7 + i13 | 0;
   i5 = (HEAP8[i4 >> 0] | 0) == 1;
   i7 = (HEAP8[i7 + i14 >> 0] | 0) == 1;
   do if (!(d2 >= +HEAPF64[((HEAP8[i15 >> 0] | 0) > 0 ? i22 : i23) >> 3])) if (!(d2 <= 0.0)) {
    HEAP8[i4 >> 0] = 2;
    break;
   } else {
    HEAP8[i4 >> 0] = 0;
    break;
   } else HEAP8[i4 >> 0] = 1; while (0);
   i4 = HEAP32[i27 >> 2] | 0;
   d2 = +HEAPF64[(HEAP32[i38 >> 2] | 0) + (i4 << 3) >> 3];
   do if (!(d2 >= +HEAPF64[((HEAP8[(HEAP32[i37 >> 2] | 0) + i4 >> 0] | 0) > 0 ? i22 : i23) >> 3])) {
    i4 = (HEAP32[i39 >> 2] | 0) + i4 | 0;
    if (!(d2 <= 0.0)) {
     HEAP8[i4 >> 0] = 2;
     break;
    } else {
     HEAP8[i4 >> 0] = 0;
     break;
    }
   } else HEAP8[(HEAP32[i39 >> 2] | 0) + i4 >> 0] = 1; while (0);
   i4 = HEAP32[i26 >> 2] | 0;
   do if (i5 ^ (HEAP8[(HEAP32[i39 >> 2] | 0) + i4 >> 0] | 0) == 1) {
    i6 = FUNCTION_TABLE_iiii[HEAP32[HEAP32[i25 >> 2] >> 2] & 31](i25, i4, i44) | 0;
    if (i5) {
     if (!i36) break;
     i4 = HEAP32[i34 >> 2] | 0;
     i5 = 0;
     do {
      i48 = i4 + (i5 << 3) | 0;
      HEAPF64[i48 >> 3] = +HEAPF64[i48 >> 3] - d16 * +HEAPF32[i6 + (i5 << 2) >> 2];
      i5 = i5 + 1 | 0;
     } while ((i5 | 0) != (i44 | 0));
    } else {
     if (!i36) break;
     i4 = HEAP32[i34 >> 2] | 0;
     i5 = 0;
     do {
      i48 = i4 + (i5 << 3) | 0;
      HEAPF64[i48 >> 3] = +HEAPF64[i48 >> 3] + d16 * +HEAPF32[i6 + (i5 << 2) >> 2];
      i5 = i5 + 1 | 0;
     } while ((i5 | 0) != (i44 | 0));
    }
   } while (0);
   i4 = HEAP32[i27 >> 2] | 0;
   do if (i7 ^ (HEAP8[(HEAP32[i39 >> 2] | 0) + i4 >> 0] | 0) == 1) {
    i6 = FUNCTION_TABLE_iiii[HEAP32[HEAP32[i25 >> 2] >> 2] & 31](i25, i4, i44) | 0;
    if (i7) {
     if (!i36) break;
     i4 = HEAP32[i34 >> 2] | 0;
     i5 = 0;
     do {
      i48 = i4 + (i5 << 3) | 0;
      HEAPF64[i48 >> 3] = +HEAPF64[i48 >> 3] - d17 * +HEAPF32[i6 + (i5 << 2) >> 2];
      i5 = i5 + 1 | 0;
     } while ((i5 | 0) != (i44 | 0));
    } else {
     if (!i36) break;
     i4 = HEAP32[i34 >> 2] | 0;
     i5 = 0;
     do {
      i48 = i4 + (i5 << 3) | 0;
      HEAPF64[i48 >> 3] = +HEAPF64[i48 >> 3] + d17 * +HEAPF32[i6 + (i5 << 2) >> 2];
      i5 = i5 + 1 | 0;
     } while ((i5 | 0) != (i44 | 0));
    }
   } while (0);
   if ((i1 | 0) >= (i19 | 0)) {
    i32 = 83;
    break;
   }
  }
 } else {
  i1 = 0;
  i32 = 83;
 } while (0);
 if ((i32 | 0) == 83) {
  if ((HEAP32[i21 >> 2] | 0) < (i44 | 0)) {
   __ZN6LIBSVM6Solver20reconstruct_gradientEv(i31);
   HEAP32[i21 >> 2] = i44;
   __ZN6LIBSVML4infoEPKcz(4714, i30);
  }
  _fwrite(4716, 44, 1, HEAP32[619] | 0) | 0;
  i6 = i1;
 }
 d17 = +FUNCTION_TABLE_di[HEAP32[(HEAP32[i31 >> 2] | 0) + 12 >> 2] & 15](i31);
 HEAPF64[i45 + 8 >> 3] = d17;
 if (i36) {
  i1 = HEAP32[i38 >> 2] | 0;
  i3 = HEAP32[i33 >> 2] | 0;
  i4 = HEAP32[i40 >> 2] | 0;
  i5 = 0;
  d2 = 0.0;
  do {
   d2 = d2 + +HEAPF64[i1 + (i5 << 3) >> 3] * (+HEAPF64[i3 + (i5 << 3) >> 3] + +HEAPF64[i4 + (i5 << 3) >> 3]);
   i5 = i5 + 1 | 0;
  } while ((i5 | 0) != (i44 | 0));
  HEAPF64[i45 >> 3] = d2 * .5;
  if (i36) {
   i1 = HEAP32[i38 >> 2] | 0;
   i3 = HEAP32[i35 >> 2] | 0;
   i4 = 0;
   do {
    HEAPF64[i43 + (HEAP32[i3 + (i4 << 2) >> 2] << 3) >> 3] = +HEAPF64[i1 + (i4 << 3) >> 3];
    i4 = i4 + 1 | 0;
   } while ((i4 | 0) != (i44 | 0));
  }
 } else HEAPF64[i45 >> 3] = 0.0;
 HEAPF64[i45 + 16 >> 3] = d42;
 HEAPF64[i45 + 24 >> 3] = d41;
 HEAP32[i46 >> 2] = i6;
 __ZN6LIBSVML4infoEPKcz(4761, i46);
 i1 = HEAP32[i40 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i37 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i38 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i39 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i35 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i33 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i34 >> 2] | 0;
 if (!i1) {
  STACKTOP = i47;
  return;
 }
 __ZdaPv(i1);
 STACKTOP = i47;
 return;
}

function __ZN8modelSet5trainERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE(i25, i26) {
 i25 = i25 | 0;
 i26 = i26 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, d13 = 0.0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i27 = 0, i28 = 0, i29 = 0, i30 = 0, i31 = 0, i32 = 0, i33 = 0, i34 = 0, i35 = 0, i36 = 0;
 i30 = STACKTOP;
 STACKTOP = STACKTOP + 112 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i14 = i30 + 80 | 0;
 i36 = i30 + 64 | 0;
 i34 = i30 + 40 | 0;
 i33 = i30 + 24 | 0;
 i31 = i30;
 i1 = HEAP32[i26 >> 2] | 0;
 i24 = i26 + 4 | 0;
 i7 = HEAP32[i24 >> 2] | 0;
 L1 : do if ((i1 | 0) != (i7 | 0)) {
  i8 = i14 + 12 | 0;
  i15 = i14 + 4 | 0;
  i9 = i25 + 16 | 0;
  i12 = i14 + 16 | 0;
  i10 = i25 + 32 | 0;
  i11 = i14 + 12 | 0;
  i5 = i1;
  while (1) {
   __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i14, i5);
   __THREW__ = 0;
   invoke_vii(8, i8 | 0, i5 + 12 | 0);
   i35 = __THREW__;
   __THREW__ = 0;
   if (i35 & 1) {
    i2 = 7;
    break;
   }
   i1 = HEAP32[i14 >> 2] | 0;
   if (((HEAP32[i15 >> 2] | 0) - i1 >> 3 | 0) != (HEAP32[i9 >> 2] | 0)) {
    i2 = 130;
    break;
   }
   i2 = HEAP32[i12 >> 2] | 0;
   i3 = HEAP32[i8 >> 2] | 0;
   i4 = i3;
   i6 = (i2 - i4 >> 3 | 0) == (HEAP32[i10 >> 2] | 0);
   if (i3) {
    if ((i2 | 0) != (i3 | 0)) HEAP32[i12 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
    __ZdlPv(i3);
    i1 = HEAP32[i14 >> 2] | 0;
   }
   i2 = i1;
   if (i1) {
    i3 = HEAP32[i15 >> 2] | 0;
    if ((i3 | 0) != (i1 | 0)) HEAP32[i15 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
    __ZdlPv(i1);
   }
   i5 = i5 + 24 | 0;
   if (!i6) {
    i1 = 0;
    i2 = 138;
    break;
   }
   if ((i5 | 0) == (i7 | 0)) break L1;
  }
  if ((i2 | 0) == 7) {
   i3 = ___cxa_find_matching_catch() | 0;
   i1 = HEAP32[i14 >> 2] | 0;
   if (!i1) ___resumeException(i3 | 0);
   i2 = HEAP32[i15 >> 2] | 0;
   if ((i2 | 0) != (i1 | 0)) HEAP32[i15 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
   __ZdlPv(i1);
   ___resumeException(i3 | 0);
  } else if ((i2 | 0) == 130) {
   i2 = HEAP32[i11 >> 2] | 0;
   i3 = i2;
   if (i2) {
    i1 = HEAP32[i12 >> 2] | 0;
    if ((i1 | 0) != (i2 | 0)) HEAP32[i12 >> 2] = i1 + (~((i1 + -8 - i3 | 0) >>> 3) << 3);
    __ZdlPv(i2);
    i1 = HEAP32[i14 >> 2] | 0;
   }
   if (!i1) {
    i36 = 0;
    STACKTOP = i30;
    return i36 | 0;
   }
   i2 = HEAP32[i15 >> 2] | 0;
   if ((i2 | 0) != (i1 | 0)) HEAP32[i15 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
   __ZdlPv(i1);
   i36 = 0;
   STACKTOP = i30;
   return i36 | 0;
  } else if ((i2 | 0) == 138) {
   STACKTOP = i30;
   return i1 | 0;
  }
 } while (0);
 i9 = i25 + 8 | 0;
 i10 = i25 + 4 | 0;
 i1 = HEAP32[i10 >> 2] | 0;
 L45 : do if ((HEAP32[i9 >> 2] | 0) != (i1 | 0)) {
  i35 = i36 + 4 | 0;
  i11 = i36 + 8 | 0;
  i12 = i34 + 12 | 0;
  i27 = i33 + 4 | 0;
  i14 = i33 + 8 | 0;
  i15 = i25 + 16 | 0;
  i16 = i31 + 12 | 0;
  i22 = i31 + 16 | 0;
  i17 = i31 + 20 | 0;
  i18 = i31 + 20 | 0;
  i19 = i36 + 8 | 0;
  i21 = i31 + 12 | 0;
  i28 = i34 + 12 | 0;
  i32 = i34 + 4 | 0;
  i29 = i34 + 16 | 0;
  i23 = i31 + 4 | 0;
  i20 = i33 + 8 | 0;
  i8 = 0;
  L47 : while (1) {
   HEAP32[i36 >> 2] = 0;
   HEAP32[i35 >> 2] = 0;
   HEAP32[i11 >> 2] = 0;
   i2 = HEAP32[i26 >> 2] | 0;
   i7 = HEAP32[i24 >> 2] | 0;
   if ((i2 | 0) != (i7 | 0)) {
    do {
     __THREW__ = 0;
     invoke_vii(8, i34 | 0, i2 | 0);
     i6 = __THREW__;
     __THREW__ = 0;
     if (i6 & 1) {
      i2 = 36;
      break L47;
     }
     __THREW__ = 0;
     invoke_vii(8, i12 | 0, i2 + 12 | 0);
     i6 = __THREW__;
     __THREW__ = 0;
     if (i6 & 1) {
      i2 = 25;
      break L47;
     }
     HEAP32[i33 >> 2] = 0;
     HEAP32[i27 >> 2] = 0;
     HEAP32[i14 >> 2] = 0;
     i1 = HEAP32[i15 >> 2] | 0;
     L54 : do if ((i1 | 0) > 0) {
      i5 = 0;
      i6 = 0;
      i4 = 0;
      while (1) {
       i3 = (HEAP32[i34 >> 2] | 0) + (i4 << 3) | 0;
       if ((i5 | 0) == (i6 | 0)) {
        __THREW__ = 0;
        invoke_vii(9, i33 | 0, i3 | 0);
        i6 = __THREW__;
        __THREW__ = 0;
        if (i6 & 1) {
         i2 = 39;
         break L47;
        }
        i1 = HEAP32[i15 >> 2] | 0;
       } else {
        HEAPF64[i5 >> 3] = +HEAPF64[i3 >> 3];
        HEAP32[i27 >> 2] = i5 + 8;
       }
       i3 = i4 + 1 | 0;
       if ((i3 | 0) >= (i1 | 0)) break L54;
       i5 = HEAP32[i27 >> 2] | 0;
       i6 = HEAP32[i20 >> 2] | 0;
       i4 = i3;
      }
     } while (0);
     __THREW__ = 0;
     invoke_vii(8, i31 | 0, i33 | 0);
     i6 = __THREW__;
     __THREW__ = 0;
     if (i6 & 1) {
      i2 = 40;
      break L47;
     }
     d13 = +HEAPF64[(HEAP32[i12 >> 2] | 0) + (i8 << 3) >> 3];
     HEAP32[i16 >> 2] = 0;
     HEAP32[i22 >> 2] = 0;
     HEAP32[i17 >> 2] = 0;
     __THREW__ = 0;
     i1 = invoke_ii(12, 8) | 0;
     i6 = __THREW__;
     __THREW__ = 0;
     if (i6 & 1) {
      i2 = 74;
      break L47;
     }
     HEAP32[i16 >> 2] = i1;
     i6 = i1 + 8 | 0;
     HEAP32[i18 >> 2] = i6;
     HEAPF64[i1 >> 3] = d13;
     HEAP32[i22 >> 2] = i6;
     i1 = HEAP32[i35 >> 2] | 0;
     if ((i1 | 0) == (HEAP32[i19 >> 2] | 0)) {
      __THREW__ = 0;
      invoke_vii(10, i36 | 0, i31 | 0);
      i6 = __THREW__;
      __THREW__ = 0;
      if (i6 & 1) {
       i2 = 78;
       break L47;
      }
     } else {
      __THREW__ = 0;
      invoke_vii(8, i1 | 0, i31 | 0);
      i6 = __THREW__;
      __THREW__ = 0;
      if (i6 & 1) {
       i2 = 78;
       break L47;
      }
      __THREW__ = 0;
      invoke_vii(8, i1 + 12 | 0, i16 | 0);
      i6 = __THREW__;
      __THREW__ = 0;
      if (i6 & 1) {
       i2 = 47;
       break L47;
      }
      HEAP32[i35 >> 2] = (HEAP32[i35 >> 2] | 0) + 24;
     }
     i1 = HEAP32[i21 >> 2] | 0;
     i3 = i1;
     if (i1) {
      i4 = HEAP32[i22 >> 2] | 0;
      if ((i4 | 0) != (i1 | 0)) HEAP32[i22 >> 2] = i4 + (~((i4 + -8 - i3 | 0) >>> 3) << 3);
      __ZdlPv(i1);
     }
     i1 = HEAP32[i31 >> 2] | 0;
     i3 = i1;
     if (i1) {
      i4 = HEAP32[i23 >> 2] | 0;
      if ((i4 | 0) != (i1 | 0)) HEAP32[i23 >> 2] = i4 + (~((i4 + -8 - i3 | 0) >>> 3) << 3);
      __ZdlPv(i1);
     }
     i1 = HEAP32[i33 >> 2] | 0;
     i3 = i1;
     if (i1) {
      i4 = HEAP32[i27 >> 2] | 0;
      if ((i4 | 0) != (i1 | 0)) HEAP32[i27 >> 2] = i4 + (~((i4 + -8 - i3 | 0) >>> 3) << 3);
      __ZdlPv(i1);
     }
     i1 = HEAP32[i28 >> 2] | 0;
     i3 = i1;
     if (i1) {
      i4 = HEAP32[i29 >> 2] | 0;
      if ((i4 | 0) != (i1 | 0)) HEAP32[i29 >> 2] = i4 + (~((i4 + -8 - i3 | 0) >>> 3) << 3);
      __ZdlPv(i1);
     }
     i1 = HEAP32[i34 >> 2] | 0;
     i3 = i1;
     if (i1) {
      i4 = HEAP32[i32 >> 2] | 0;
      if ((i4 | 0) != (i1 | 0)) HEAP32[i32 >> 2] = i4 + (~((i4 + -8 - i3 | 0) >>> 3) << 3);
      __ZdlPv(i1);
     }
     i2 = i2 + 24 | 0;
    } while ((i2 | 0) != (i7 | 0));
    i1 = HEAP32[i10 >> 2] | 0;
   }
   i7 = HEAP32[i1 + (i8 << 2) >> 2] | 0;
   __THREW__ = 0;
   invoke_vii(HEAP32[(HEAP32[i7 >> 2] | 0) + 12 >> 2] | 0, i7 | 0, i36 | 0);
   i7 = __THREW__;
   __THREW__ = 0;
   if (i7 & 1) {
    i2 = 37;
    break;
   }
   i1 = HEAP32[i36 >> 2] | 0;
   if (i1) {
    i2 = HEAP32[i35 >> 2] | 0;
    if ((i2 | 0) != (i1 | 0)) {
     do {
      i3 = i2 + -24 | 0;
      HEAP32[i35 >> 2] = i3;
      i4 = HEAP32[i2 + -12 >> 2] | 0;
      i5 = i4;
      if (i4) {
       i6 = i2 + -8 | 0;
       i7 = HEAP32[i6 >> 2] | 0;
       if ((i7 | 0) != (i4 | 0)) HEAP32[i6 >> 2] = i7 + (~((i7 + -8 - i5 | 0) >>> 3) << 3);
       __ZdlPv(i4);
      }
      i4 = HEAP32[i3 >> 2] | 0;
      i5 = i4;
      if (i4) {
       i2 = i2 + -20 | 0;
       i3 = HEAP32[i2 >> 2] | 0;
       if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
       __ZdlPv(i4);
      }
      i2 = HEAP32[i35 >> 2] | 0;
     } while ((i2 | 0) != (i1 | 0));
     i1 = HEAP32[i36 >> 2] | 0;
    }
    __ZdlPv(i1);
   }
   i8 = i8 + 1 | 0;
   i1 = HEAP32[i10 >> 2] | 0;
   if (i8 >>> 0 >= (HEAP32[i9 >> 2] | 0) - i1 >> 2 >>> 0) break L45;
  }
  if ((i2 | 0) == 25) {
   i1 = ___cxa_find_matching_catch() | 0;
   i2 = HEAP32[i34 >> 2] | 0;
   i3 = i2;
   if (!i2) i2 = 38; else {
    i4 = HEAP32[i32 >> 2] | 0;
    if ((i4 | 0) != (i2 | 0)) HEAP32[i32 >> 2] = i4 + (~((i4 + -8 - i3 | 0) >>> 3) << 3);
    __ZdlPv(i2);
    i2 = 38;
   }
  } else if ((i2 | 0) == 36) {
   i1 = ___cxa_find_matching_catch() | 0;
   i2 = 38;
  } else if ((i2 | 0) == 37) {
   i1 = ___cxa_find_matching_catch() | 0;
   i2 = 38;
  } else if ((i2 | 0) == 39) {
   i1 = ___cxa_find_matching_catch() | 0;
   i2 = 41;
  } else if ((i2 | 0) == 40) {
   i1 = ___cxa_find_matching_catch() | 0;
   i2 = 41;
  } else if ((i2 | 0) == 47) {
   i4 = ___cxa_find_matching_catch() | 0;
   i3 = HEAP32[i1 >> 2] | 0;
   i5 = i3;
   if (!i3) i2 = 79; else {
    i1 = i1 + 4 | 0;
    i2 = HEAP32[i1 >> 2] | 0;
    if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i5 | 0) >>> 3) << 3);
    __ZdlPv(i3);
    i2 = 79;
   }
  } else if ((i2 | 0) == 74) {
   i4 = ___cxa_find_matching_catch() | 0;
   i1 = HEAP32[i31 >> 2] | 0;
   i2 = i1;
   if (!i1) i2 = 87; else {
    i3 = HEAP32[i23 >> 2] | 0;
    if ((i3 | 0) != (i1 | 0)) HEAP32[i23 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
    __ZdlPv(i1);
    i2 = 87;
   }
  } else if ((i2 | 0) == 78) {
   i4 = ___cxa_find_matching_catch() | 0;
   i2 = 79;
  }
  if ((i2 | 0) == 38) i8 = i1; else if ((i2 | 0) == 41) {
   i4 = i1;
   i2 = 87;
  } else if ((i2 | 0) == 79) {
   i1 = HEAP32[i21 >> 2] | 0;
   i2 = i1;
   if (i1) {
    i3 = HEAP32[i22 >> 2] | 0;
    if ((i3 | 0) != (i1 | 0)) HEAP32[i22 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
    __ZdlPv(i1);
   }
   i1 = HEAP32[i31 >> 2] | 0;
   i2 = i1;
   if (!i1) i2 = 87; else {
    i3 = HEAP32[i23 >> 2] | 0;
    if ((i3 | 0) != (i1 | 0)) HEAP32[i23 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
    __ZdlPv(i1);
    i2 = 87;
   }
  }
  if ((i2 | 0) == 87) {
   i1 = HEAP32[i33 >> 2] | 0;
   i2 = i1;
   if (i1) {
    i3 = HEAP32[i27 >> 2] | 0;
    if ((i3 | 0) != (i1 | 0)) HEAP32[i27 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
    __ZdlPv(i1);
   }
   i1 = HEAP32[i28 >> 2] | 0;
   i2 = i1;
   if (i1) {
    i3 = HEAP32[i29 >> 2] | 0;
    if ((i3 | 0) != (i1 | 0)) HEAP32[i29 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
    __ZdlPv(i1);
   }
   i1 = HEAP32[i34 >> 2] | 0;
   i2 = i1;
   if (!i1) i8 = i4; else {
    i3 = HEAP32[i32 >> 2] | 0;
    if ((i3 | 0) != (i1 | 0)) HEAP32[i32 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
    __ZdlPv(i1);
    i8 = i4;
   }
  }
  i1 = HEAP32[i36 >> 2] | 0;
  if (!i1) ___resumeException(i8 | 0);
  i2 = HEAP32[i35 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i3 = i2 + -24 | 0;
    HEAP32[i35 >> 2] = i3;
    i4 = HEAP32[i2 + -12 >> 2] | 0;
    i5 = i4;
    if (i4) {
     i6 = i2 + -8 | 0;
     i7 = HEAP32[i6 >> 2] | 0;
     if ((i7 | 0) != (i4 | 0)) HEAP32[i6 >> 2] = i7 + (~((i7 + -8 - i5 | 0) >>> 3) << 3);
     __ZdlPv(i4);
    }
    i4 = HEAP32[i3 >> 2] | 0;
    i5 = i4;
    if (i4) {
     i2 = i2 + -20 | 0;
     i3 = HEAP32[i2 >> 2] | 0;
     if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
     __ZdlPv(i4);
    }
    i2 = HEAP32[i35 >> 2] | 0;
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i36 >> 2] | 0;
  }
  __ZdlPv(i1);
  ___resumeException(i8 | 0);
 } while (0);
 HEAP8[i25 + 36 >> 0] = 1;
 i36 = 1;
 STACKTOP = i30;
 return i36 | 0;
}

function __ZN6LIBSVML13svm_train_oneEPKNS_11svm_problemEPKNS_13svm_parameterEdd(i21, i18, i14, d7, d4) {
 i21 = i21 | 0;
 i18 = i18 | 0;
 i14 = i14 | 0;
 d7 = +d7;
 d4 = +d4;
 var i1 = 0, i2 = 0, d3 = 0.0, i5 = 0, i6 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i15 = 0, i16 = 0, i17 = 0, i19 = 0, i20 = 0, i22 = 0, i23 = 0, d24 = 0.0, i25 = 0;
 i23 = STACKTOP;
 STACKTOP = STACKTOP + 256 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i22 = i23 + 248 | 0;
 i17 = i23 + 232 | 0;
 i11 = i23 + 224 | 0;
 i12 = i23 + 216 | 0;
 i8 = i23 + 208 | 0;
 i9 = i23 + 200 | 0;
 i15 = i23 + 120 | 0;
 i13 = i23 + 40 | 0;
 i19 = i23;
 i16 = HEAP32[i18 >> 2] | 0;
 i20 = _malloc(i16 << 3) | 0;
 L1 : do switch (HEAP32[i14 >> 2] | 0) {
 case 0:
  {
   i6 = __Znaj(i16 >>> 0 > 536870911 ? -1 : i16 << 3) | 0;
   i8 = __Znaj((i16 | 0) > -1 ? i16 : -1) | 0;
   i5 = (i16 | 0) > 0;
   if (i5) {
    i1 = HEAP32[i18 + 4 >> 2] | 0;
    i2 = 0;
    do {
     HEAPF64[i20 + (i2 << 3) >> 3] = 0.0;
     HEAPF64[i6 + (i2 << 3) >> 3] = -1.0;
     HEAP8[i8 + i2 >> 0] = +HEAPF64[i1 + (i2 << 3) >> 3] > 0.0 ? 1 : -1;
     i2 = i2 + 1 | 0;
    } while ((i2 | 0) != (i16 | 0));
   }
   HEAP32[i15 >> 2] = 1956;
   __THREW__ = 0;
   invoke_viiii(8, i13 | 0, i18 | 0, i14 | 0, i8 | 0);
   i12 = __THREW__;
   __THREW__ = 0;
   do if (!(i12 & 1)) {
    __THREW__ = 0;
    invoke_viiiiiidddii(1, i15 | 0, i16 | 0, i13 | 0, i6 | 0, i8 | 0, i20 | 0, +d7, +d4, +(+HEAPF64[i14 + 40 >> 3]), i19 | 0, HEAP32[i14 + 88 >> 2] | 0);
    i15 = __THREW__;
    __THREW__ = 0;
    if (i15 & 1) {
     i23 = ___cxa_find_matching_catch() | 0;
     __ZN6LIBSVM5SVC_QD2Ev(i13);
     ___resumeException(i23 | 0);
    }
    __ZN6LIBSVM5SVC_QD2Ev(i13);
    if (i5) {
     i1 = 0;
     d3 = 0.0;
     do {
      d3 = d3 + +HEAPF64[i20 + (i1 << 3) >> 3];
      i1 = i1 + 1 | 0;
     } while ((i1 | 0) != (i16 | 0));
    } else d3 = 0.0;
    if (d7 == d4 ? (__THREW__ = 0, HEAPF64[i9 >> 3] = d3 / (+(HEAP32[i18 >> 2] | 0) * d7), invoke_vii(23, 5334, i9 | 0), i15 = __THREW__, __THREW__ = 0, i15 & 1) : 0) break;
    if (i5) {
     i1 = 0;
     do {
      i15 = i20 + (i1 << 3) | 0;
      HEAPF64[i15 >> 3] = +HEAPF64[i15 >> 3] * +(HEAP8[i8 + i1 >> 0] | 0);
      i1 = i1 + 1 | 0;
     } while ((i1 | 0) != (i16 | 0));
    }
    __ZdaPv(i6);
    __ZdaPv(i8);
    break L1;
   } while (0);
   i23 = ___cxa_find_matching_catch() | 0;
   ___resumeException(i23 | 0);
  }
 case 1:
  {
   d3 = +HEAPF64[i14 + 72 >> 3];
   i6 = __Znaj((i16 | 0) > -1 ? i16 : -1) | 0;
   i5 = (i16 | 0) > 0;
   if (i5) {
    i1 = HEAP32[i18 + 4 >> 2] | 0;
    i2 = 0;
    do {
     HEAP8[i6 + i2 >> 0] = +HEAPF64[i1 + (i2 << 3) >> 3] > 0.0 ? 1 : -1;
     i2 = i2 + 1 | 0;
    } while ((i2 | 0) != (i16 | 0));
    d4 = d3 * +(i16 | 0) * .5;
    i1 = 0;
    d3 = d4;
    do {
     if ((HEAP8[i6 + i1 >> 0] | 0) == 1) {
      d24 = d4 > 1.0 ? 1.0 : d4;
      d7 = d24;
      d4 = d4 - d24;
     } else {
      d24 = d3 > 1.0 ? 1.0 : d3;
      d7 = d24;
      d3 = d3 - d24;
     }
     HEAPF64[i20 + (i1 << 3) >> 3] = d7;
     i1 = i1 + 1 | 0;
    } while ((i1 | 0) != (i16 | 0));
   }
   i1 = i16 << 3;
   i2 = __Znaj(i16 >>> 0 > 536870911 ? -1 : i1) | 0;
   if (i5) _memset(i2 | 0, 0, i1 | 0) | 0;
   HEAP32[i15 >> 2] = 1984;
   __THREW__ = 0;
   invoke_viiii(8, i13 | 0, i18 | 0, i14 | 0, i6 | 0);
   i12 = __THREW__;
   __THREW__ = 0;
   if (!(i12 & 1)) {
    d24 = +HEAPF64[i14 + 40 >> 3];
    i14 = HEAP32[i14 + 88 >> 2] | 0;
    HEAP32[i15 + 76 >> 2] = i19;
    __THREW__ = 0;
    invoke_viiiiiidddii(1, i15 | 0, i16 | 0, i13 | 0, i2 | 0, i6 | 0, i20 | 0, 1.0, 1.0, +d24, i19 | 0, i14 | 0);
    i15 = __THREW__;
    __THREW__ = 0;
    if (i15 & 1) {
     i23 = ___cxa_find_matching_catch() | 0;
     __ZN6LIBSVM5SVC_QD2Ev(i13);
     ___resumeException(i23 | 0);
    }
    __ZN6LIBSVM5SVC_QD2Ev(i13);
    d3 = +HEAPF64[i19 + 32 >> 3];
    d4 = 1.0 / d3;
    __THREW__ = 0;
    HEAPF64[i8 >> 3] = d4;
    invoke_vii(23, 5343, i8 | 0);
    i15 = __THREW__;
    __THREW__ = 0;
    if (!(i15 & 1)) {
     if (i5) {
      i1 = 0;
      do {
       i15 = i20 + (i1 << 3) | 0;
       HEAPF64[i15 >> 3] = +(HEAP8[i6 + i1 >> 0] | 0) / d3 * +HEAPF64[i15 >> 3];
       i1 = i1 + 1 | 0;
      } while ((i1 | 0) != (i16 | 0));
     }
     i16 = i19 + 8 | 0;
     HEAPF64[i16 >> 3] = +HEAPF64[i16 >> 3] / d3;
     HEAPF64[i19 >> 3] = +HEAPF64[i19 >> 3] / (d3 * d3);
     HEAPF64[i19 + 16 >> 3] = d4;
     HEAPF64[i19 + 24 >> 3] = d4;
     __ZdaPv(i6);
     __ZdaPv(i2);
     break L1;
    }
   }
   i23 = ___cxa_find_matching_catch() | 0;
   ___resumeException(i23 | 0);
  }
 case 2:
  {
   i2 = i16 << 3;
   i5 = __Znaj(i16 >>> 0 > 536870911 ? -1 : i2) | 0;
   i6 = __Znaj((i16 | 0) > -1 ? i16 : -1) | 0;
   d3 = +(i16 | 0) * +HEAPF64[i14 + 72 >> 3];
   i8 = ~~d3;
   if ((i8 | 0) > 0) {
    i1 = 0;
    do {
     HEAPF64[i20 + (i1 << 3) >> 3] = 1.0;
     i1 = i1 + 1 | 0;
    } while ((i1 | 0) != (i8 | 0));
   }
   if ((i8 | 0) < (i16 | 0)) HEAPF64[i20 + (i8 << 3) >> 3] = d3 - +(i8 | 0);
   i1 = i8 + 1 | 0;
   if ((i1 | 0) < (i16 | 0)) _memset(i20 + (i1 << 3) | 0, 0, i16 + 536870911 - i8 << 3 | 0) | 0;
   if ((i16 | 0) > 0) {
    _memset(i5 | 0, 0, i2 | 0) | 0;
    _memset(i6 | 0, 1, i16 | 0) | 0;
   }
   HEAP32[i15 >> 2] = 1956;
   __THREW__ = 0;
   invoke_viii(18, i13 | 0, i18 | 0, i14 | 0);
   i12 = __THREW__;
   __THREW__ = 0;
   if (i12 & 1) {
    i23 = ___cxa_find_matching_catch() | 0;
    ___resumeException(i23 | 0);
   }
   __THREW__ = 0;
   invoke_viiiiiidddii(1, i15 | 0, i16 | 0, i13 | 0, i5 | 0, i6 | 0, i20 | 0, 1.0, 1.0, +(+HEAPF64[i14 + 40 >> 3]), i19 | 0, HEAP32[i14 + 88 >> 2] | 0);
   i16 = __THREW__;
   __THREW__ = 0;
   if (!(i16 & 1)) {
    __ZN6LIBSVM11ONE_CLASS_QD2Ev(i13);
    __ZdaPv(i5);
    __ZdaPv(i6);
    break L1;
   }
   i23 = ___cxa_find_matching_catch() | 0;
   __ZN6LIBSVM11ONE_CLASS_QD2Ev(i13);
   ___resumeException(i23 | 0);
  }
 case 3:
  {
   i5 = i16 << 1;
   i9 = i5 >>> 0 > 536870911 ? -1 : i5 << 3;
   i8 = __Znaj(i9) | 0;
   i9 = __Znaj(i9) | 0;
   i10 = __Znaj((i16 | 0) < 0 ? -1 : i5) | 0;
   i6 = (i16 | 0) > 0;
   if (i6) {
    i1 = HEAP32[i18 + 4 >> 2] | 0;
    d3 = +HEAPF64[i14 + 80 >> 3];
    i2 = 0;
    do {
     HEAPF64[i8 + (i2 << 3) >> 3] = 0.0;
     i25 = i1 + (i2 << 3) | 0;
     HEAPF64[i9 + (i2 << 3) >> 3] = d3 - +HEAPF64[i25 >> 3];
     HEAP8[i10 + i2 >> 0] = 1;
     i11 = i2 + i16 | 0;
     HEAPF64[i8 + (i11 << 3) >> 3] = 0.0;
     HEAPF64[i9 + (i11 << 3) >> 3] = d3 + +HEAPF64[i25 >> 3];
     HEAP8[i10 + i11 >> 0] = -1;
     i2 = i2 + 1 | 0;
    } while ((i2 | 0) != (i16 | 0));
   }
   HEAP32[i15 >> 2] = 1956;
   __THREW__ = 0;
   invoke_viii(19, i13 | 0, i18 | 0, i14 | 0);
   i25 = __THREW__;
   __THREW__ = 0;
   if (!(i25 & 1)) {
    i2 = i14 + 48 | 0;
    d24 = +HEAPF64[i2 >> 3];
    __THREW__ = 0;
    invoke_viiiiiidddii(1, i15 | 0, i5 | 0, i13 | 0, i9 | 0, i10 | 0, i8 | 0, +d24, +d24, +(+HEAPF64[i14 + 40 >> 3]), i19 | 0, HEAP32[i14 + 88 >> 2] | 0);
    i25 = __THREW__;
    __THREW__ = 0;
    if (i25 & 1) {
     i25 = ___cxa_find_matching_catch() | 0;
     __ZN6LIBSVM5SVR_QD2Ev(i13);
     ___resumeException(i25 | 0);
    }
    __ZN6LIBSVM5SVR_QD2Ev(i13);
    if (i6) {
     i1 = 0;
     d3 = 0.0;
     do {
      d24 = +HEAPF64[i8 + (i1 << 3) >> 3] - +HEAPF64[i8 + (i1 + i16 << 3) >> 3];
      HEAPF64[i20 + (i1 << 3) >> 3] = d24;
      d3 = d3 + +Math_abs(+d24);
      i1 = i1 + 1 | 0;
     } while ((i1 | 0) != (i16 | 0));
    } else d3 = 0.0;
    __THREW__ = 0;
    HEAPF64[i12 >> 3] = d3 / (+(i16 | 0) * +HEAPF64[i2 >> 3]);
    invoke_vii(23, 5334, i12 | 0);
    i25 = __THREW__;
    __THREW__ = 0;
    if (!(i25 & 1)) {
     __ZdaPv(i8);
     __ZdaPv(i9);
     __ZdaPv(i10);
     break L1;
    }
   }
   i25 = ___cxa_find_matching_catch() | 0;
   ___resumeException(i25 | 0);
  }
 case 4:
  {
   d3 = +HEAPF64[i14 + 48 >> 3];
   i1 = i16 << 1;
   i9 = i1 >>> 0 > 536870911 ? -1 : i1 << 3;
   i8 = __Znaj(i9) | 0;
   i9 = __Znaj(i9) | 0;
   i10 = __Znaj((i16 | 0) < 0 ? -1 : i1) | 0;
   i2 = (i16 | 0) > 0;
   if (i2) {
    i5 = HEAP32[i18 + 4 >> 2] | 0;
    i6 = 0;
    d7 = +(i16 | 0) * (d3 * +HEAPF64[i14 + 72 >> 3]) * .5;
    while (1) {
     d4 = d7 < d3 ? d7 : d3;
     i25 = i6 + i16 | 0;
     HEAPF64[i8 + (i25 << 3) >> 3] = d4;
     HEAPF64[i8 + (i6 << 3) >> 3] = d4;
     i12 = i5 + (i6 << 3) | 0;
     HEAPF64[i9 + (i6 << 3) >> 3] = -+HEAPF64[i12 >> 3];
     HEAP8[i10 + i6 >> 0] = 1;
     HEAPF64[i9 + (i25 << 3) >> 3] = +HEAPF64[i12 >> 3];
     HEAP8[i10 + i25 >> 0] = -1;
     i6 = i6 + 1 | 0;
     if ((i6 | 0) == (i16 | 0)) break; else d7 = d7 - d4;
    }
   }
   HEAP32[i15 >> 2] = 1984;
   __THREW__ = 0;
   invoke_viii(19, i13 | 0, i18 | 0, i14 | 0);
   i25 = __THREW__;
   __THREW__ = 0;
   if (!(i25 & 1)) {
    d24 = +HEAPF64[i14 + 40 >> 3];
    i25 = HEAP32[i14 + 88 >> 2] | 0;
    HEAP32[i15 + 76 >> 2] = i19;
    __THREW__ = 0;
    invoke_viiiiiidddii(1, i15 | 0, i1 | 0, i13 | 0, i9 | 0, i10 | 0, i8 | 0, +d3, +d3, +d24, i19 | 0, i25 | 0);
    i25 = __THREW__;
    __THREW__ = 0;
    if (i25 & 1) {
     i25 = ___cxa_find_matching_catch() | 0;
     __ZN6LIBSVM5SVR_QD2Ev(i13);
     ___resumeException(i25 | 0);
    }
    __ZN6LIBSVM5SVR_QD2Ev(i13);
    __THREW__ = 0;
    HEAPF64[i11 >> 3] = -+HEAPF64[i19 + 32 >> 3];
    invoke_vii(23, 5351, i11 | 0);
    i25 = __THREW__;
    __THREW__ = 0;
    if (!(i25 & 1)) {
     if (i2) {
      i1 = 0;
      do {
       HEAPF64[i20 + (i1 << 3) >> 3] = +HEAPF64[i8 + (i1 << 3) >> 3] - +HEAPF64[i8 + (i1 + i16 << 3) >> 3];
       i1 = i1 + 1 | 0;
      } while ((i1 | 0) != (i16 | 0));
     }
     __ZdaPv(i8);
     __ZdaPv(i9);
     __ZdaPv(i10);
     break L1;
    }
   }
   i25 = ___cxa_find_matching_catch() | 0;
   ___resumeException(i25 | 0);
  }
 default:
  {}
 } while (0);
 i9 = i19 + 8 | 0;
 d24 = +HEAPF64[i9 >> 3];
 HEAPF64[i17 >> 3] = +HEAPF64[i19 >> 3];
 HEAPF64[i17 + 8 >> 3] = d24;
 __ZN6LIBSVML4infoEPKcz(5365, i17);
 i8 = HEAP32[i18 >> 2] | 0;
 if ((i8 | 0) <= 0) {
  i19 = 0;
  i25 = 0;
  HEAP32[i22 >> 2] = i25;
  i25 = i22 + 4 | 0;
  HEAP32[i25 >> 2] = i19;
  __ZN6LIBSVML4infoEPKcz(5385, i22);
  HEAP32[i21 >> 2] = i20;
  d24 = +HEAPF64[i9 >> 3];
  i25 = i21 + 8 | 0;
  HEAPF64[i25 >> 3] = d24;
  STACKTOP = i23;
  return;
 }
 i6 = i18 + 4 | 0;
 d7 = +HEAPF64[i19 + 16 >> 3];
 d4 = +HEAPF64[i19 + 24 >> 3];
 i5 = 0;
 i2 = 0;
 i1 = 0;
 do {
  d24 = +HEAPF64[i20 + (i5 << 3) >> 3];
  d3 = +Math_abs(+d24);
  do if (!(d24 != d24 | 0.0 != 0.0 | d24 == 0.0)) {
   i1 = i1 + 1 | 0;
   if (+HEAPF64[(HEAP32[i6 >> 2] | 0) + (i5 << 3) >> 3] > 0.0) {
    if (!(d3 >= d7)) break;
    i2 = i2 + 1 | 0;
    break;
   } else {
    if (!(d3 >= d4)) break;
    i2 = i2 + 1 | 0;
    break;
   }
  } while (0);
  i5 = i5 + 1 | 0;
 } while ((i5 | 0) < (i8 | 0));
 HEAP32[i22 >> 2] = i1;
 i25 = i22 + 4 | 0;
 HEAP32[i25 >> 2] = i2;
 __ZN6LIBSVML4infoEPKcz(5385, i22);
 HEAP32[i21 >> 2] = i20;
 d24 = +HEAPF64[i9 >> 3];
 i25 = i21 + 8 | 0;
 HEAPF64[i25 >> 3] = d24;
 STACKTOP = i23;
 return;
}

function _free(i15) {
 i15 = i15 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0;
 if (!i15) return;
 i1 = i15 + -8 | 0;
 i7 = HEAP32[711] | 0;
 if (i1 >>> 0 < i7 >>> 0) _abort();
 i2 = HEAP32[i15 + -4 >> 2] | 0;
 i3 = i2 & 3;
 if ((i3 | 0) == 1) _abort();
 i13 = i2 & -8;
 i16 = i15 + (i13 + -8) | 0;
 do if (!(i2 & 1)) {
  i1 = HEAP32[i1 >> 2] | 0;
  if (!i3) return;
  i8 = -8 - i1 | 0;
  i10 = i15 + i8 | 0;
  i11 = i1 + i13 | 0;
  if (i10 >>> 0 < i7 >>> 0) _abort();
  if ((i10 | 0) == (HEAP32[712] | 0)) {
   i1 = i15 + (i13 + -4) | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if ((i2 & 3 | 0) != 3) {
    i20 = i10;
    i5 = i11;
    break;
   }
   HEAP32[709] = i11;
   HEAP32[i1 >> 2] = i2 & -2;
   HEAP32[i15 + (i8 + 4) >> 2] = i11 | 1;
   HEAP32[i16 >> 2] = i11;
   return;
  }
  i4 = i1 >>> 3;
  if (i1 >>> 0 < 256) {
   i3 = HEAP32[i15 + (i8 + 8) >> 2] | 0;
   i2 = HEAP32[i15 + (i8 + 12) >> 2] | 0;
   i1 = 2868 + (i4 << 1 << 2) | 0;
   if ((i3 | 0) != (i1 | 0)) {
    if (i3 >>> 0 < i7 >>> 0) _abort();
    if ((HEAP32[i3 + 12 >> 2] | 0) != (i10 | 0)) _abort();
   }
   if ((i2 | 0) == (i3 | 0)) {
    HEAP32[707] = HEAP32[707] & ~(1 << i4);
    i20 = i10;
    i5 = i11;
    break;
   }
   if ((i2 | 0) != (i1 | 0)) {
    if (i2 >>> 0 < i7 >>> 0) _abort();
    i1 = i2 + 8 | 0;
    if ((HEAP32[i1 >> 2] | 0) == (i10 | 0)) i6 = i1; else _abort();
   } else i6 = i2 + 8 | 0;
   HEAP32[i3 + 12 >> 2] = i2;
   HEAP32[i6 >> 2] = i3;
   i20 = i10;
   i5 = i11;
   break;
  }
  i6 = HEAP32[i15 + (i8 + 24) >> 2] | 0;
  i3 = HEAP32[i15 + (i8 + 12) >> 2] | 0;
  do if ((i3 | 0) == (i10 | 0)) {
   i2 = i15 + (i8 + 20) | 0;
   i1 = HEAP32[i2 >> 2] | 0;
   if (!i1) {
    i2 = i15 + (i8 + 16) | 0;
    i1 = HEAP32[i2 >> 2] | 0;
    if (!i1) {
     i9 = 0;
     break;
    }
   }
   while (1) {
    i3 = i1 + 20 | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if (i4) {
     i1 = i4;
     i2 = i3;
     continue;
    }
    i3 = i1 + 16 | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if (!i4) break; else {
     i1 = i4;
     i2 = i3;
    }
   }
   if (i2 >>> 0 < i7 >>> 0) _abort(); else {
    HEAP32[i2 >> 2] = 0;
    i9 = i1;
    break;
   }
  } else {
   i4 = HEAP32[i15 + (i8 + 8) >> 2] | 0;
   if (i4 >>> 0 < i7 >>> 0) _abort();
   i1 = i4 + 12 | 0;
   if ((HEAP32[i1 >> 2] | 0) != (i10 | 0)) _abort();
   i2 = i3 + 8 | 0;
   if ((HEAP32[i2 >> 2] | 0) == (i10 | 0)) {
    HEAP32[i1 >> 2] = i3;
    HEAP32[i2 >> 2] = i4;
    i9 = i3;
    break;
   } else _abort();
  } while (0);
  if (i6) {
   i1 = HEAP32[i15 + (i8 + 28) >> 2] | 0;
   i2 = 3132 + (i1 << 2) | 0;
   if ((i10 | 0) == (HEAP32[i2 >> 2] | 0)) {
    HEAP32[i2 >> 2] = i9;
    if (!i9) {
     HEAP32[708] = HEAP32[708] & ~(1 << i1);
     i20 = i10;
     i5 = i11;
     break;
    }
   } else {
    if (i6 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort();
    i1 = i6 + 16 | 0;
    if ((HEAP32[i1 >> 2] | 0) == (i10 | 0)) HEAP32[i1 >> 2] = i9; else HEAP32[i6 + 20 >> 2] = i9;
    if (!i9) {
     i20 = i10;
     i5 = i11;
     break;
    }
   }
   i2 = HEAP32[711] | 0;
   if (i9 >>> 0 < i2 >>> 0) _abort();
   HEAP32[i9 + 24 >> 2] = i6;
   i1 = HEAP32[i15 + (i8 + 16) >> 2] | 0;
   do if (i1) if (i1 >>> 0 < i2 >>> 0) _abort(); else {
    HEAP32[i9 + 16 >> 2] = i1;
    HEAP32[i1 + 24 >> 2] = i9;
    break;
   } while (0);
   i1 = HEAP32[i15 + (i8 + 20) >> 2] | 0;
   if (i1) if (i1 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
    HEAP32[i9 + 20 >> 2] = i1;
    HEAP32[i1 + 24 >> 2] = i9;
    i20 = i10;
    i5 = i11;
    break;
   } else {
    i20 = i10;
    i5 = i11;
   }
  } else {
   i20 = i10;
   i5 = i11;
  }
 } else {
  i20 = i1;
  i5 = i13;
 } while (0);
 if (i20 >>> 0 >= i16 >>> 0) _abort();
 i1 = i15 + (i13 + -4) | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if (!(i2 & 1)) _abort();
 if (!(i2 & 2)) {
  if ((i16 | 0) == (HEAP32[713] | 0)) {
   i19 = (HEAP32[710] | 0) + i5 | 0;
   HEAP32[710] = i19;
   HEAP32[713] = i20;
   HEAP32[i20 + 4 >> 2] = i19 | 1;
   if ((i20 | 0) != (HEAP32[712] | 0)) return;
   HEAP32[712] = 0;
   HEAP32[709] = 0;
   return;
  }
  if ((i16 | 0) == (HEAP32[712] | 0)) {
   i19 = (HEAP32[709] | 0) + i5 | 0;
   HEAP32[709] = i19;
   HEAP32[712] = i20;
   HEAP32[i20 + 4 >> 2] = i19 | 1;
   HEAP32[i20 + i19 >> 2] = i19;
   return;
  }
  i5 = (i2 & -8) + i5 | 0;
  i4 = i2 >>> 3;
  do if (i2 >>> 0 >= 256) {
   i6 = HEAP32[i15 + (i13 + 16) >> 2] | 0;
   i1 = HEAP32[i15 + (i13 | 4) >> 2] | 0;
   do if ((i1 | 0) == (i16 | 0)) {
    i2 = i15 + (i13 + 12) | 0;
    i1 = HEAP32[i2 >> 2] | 0;
    if (!i1) {
     i2 = i15 + (i13 + 8) | 0;
     i1 = HEAP32[i2 >> 2] | 0;
     if (!i1) {
      i14 = 0;
      break;
     }
    }
    while (1) {
     i3 = i1 + 20 | 0;
     i4 = HEAP32[i3 >> 2] | 0;
     if (i4) {
      i1 = i4;
      i2 = i3;
      continue;
     }
     i3 = i1 + 16 | 0;
     i4 = HEAP32[i3 >> 2] | 0;
     if (!i4) break; else {
      i1 = i4;
      i2 = i3;
     }
    }
    if (i2 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
     HEAP32[i2 >> 2] = 0;
     i14 = i1;
     break;
    }
   } else {
    i2 = HEAP32[i15 + i13 >> 2] | 0;
    if (i2 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort();
    i3 = i2 + 12 | 0;
    if ((HEAP32[i3 >> 2] | 0) != (i16 | 0)) _abort();
    i4 = i1 + 8 | 0;
    if ((HEAP32[i4 >> 2] | 0) == (i16 | 0)) {
     HEAP32[i3 >> 2] = i1;
     HEAP32[i4 >> 2] = i2;
     i14 = i1;
     break;
    } else _abort();
   } while (0);
   if (i6) {
    i1 = HEAP32[i15 + (i13 + 20) >> 2] | 0;
    i2 = 3132 + (i1 << 2) | 0;
    if ((i16 | 0) == (HEAP32[i2 >> 2] | 0)) {
     HEAP32[i2 >> 2] = i14;
     if (!i14) {
      HEAP32[708] = HEAP32[708] & ~(1 << i1);
      break;
     }
    } else {
     if (i6 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort();
     i1 = i6 + 16 | 0;
     if ((HEAP32[i1 >> 2] | 0) == (i16 | 0)) HEAP32[i1 >> 2] = i14; else HEAP32[i6 + 20 >> 2] = i14;
     if (!i14) break;
    }
    i2 = HEAP32[711] | 0;
    if (i14 >>> 0 < i2 >>> 0) _abort();
    HEAP32[i14 + 24 >> 2] = i6;
    i1 = HEAP32[i15 + (i13 + 8) >> 2] | 0;
    do if (i1) if (i1 >>> 0 < i2 >>> 0) _abort(); else {
     HEAP32[i14 + 16 >> 2] = i1;
     HEAP32[i1 + 24 >> 2] = i14;
     break;
    } while (0);
    i1 = HEAP32[i15 + (i13 + 12) >> 2] | 0;
    if (i1) if (i1 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
     HEAP32[i14 + 20 >> 2] = i1;
     HEAP32[i1 + 24 >> 2] = i14;
     break;
    }
   }
  } else {
   i3 = HEAP32[i15 + i13 >> 2] | 0;
   i2 = HEAP32[i15 + (i13 | 4) >> 2] | 0;
   i1 = 2868 + (i4 << 1 << 2) | 0;
   if ((i3 | 0) != (i1 | 0)) {
    if (i3 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort();
    if ((HEAP32[i3 + 12 >> 2] | 0) != (i16 | 0)) _abort();
   }
   if ((i2 | 0) == (i3 | 0)) {
    HEAP32[707] = HEAP32[707] & ~(1 << i4);
    break;
   }
   if ((i2 | 0) != (i1 | 0)) {
    if (i2 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort();
    i1 = i2 + 8 | 0;
    if ((HEAP32[i1 >> 2] | 0) == (i16 | 0)) i12 = i1; else _abort();
   } else i12 = i2 + 8 | 0;
   HEAP32[i3 + 12 >> 2] = i2;
   HEAP32[i12 >> 2] = i3;
  } while (0);
  HEAP32[i20 + 4 >> 2] = i5 | 1;
  HEAP32[i20 + i5 >> 2] = i5;
  if ((i20 | 0) == (HEAP32[712] | 0)) {
   HEAP32[709] = i5;
   return;
  }
 } else {
  HEAP32[i1 >> 2] = i2 & -2;
  HEAP32[i20 + 4 >> 2] = i5 | 1;
  HEAP32[i20 + i5 >> 2] = i5;
 }
 i1 = i5 >>> 3;
 if (i5 >>> 0 < 256) {
  i2 = i1 << 1;
  i4 = 2868 + (i2 << 2) | 0;
  i3 = HEAP32[707] | 0;
  i1 = 1 << i1;
  if (i3 & i1) {
   i1 = 2868 + (i2 + 2 << 2) | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if (i2 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
    i17 = i1;
    i18 = i2;
   }
  } else {
   HEAP32[707] = i3 | i1;
   i17 = 2868 + (i2 + 2 << 2) | 0;
   i18 = i4;
  }
  HEAP32[i17 >> 2] = i20;
  HEAP32[i18 + 12 >> 2] = i20;
  HEAP32[i20 + 8 >> 2] = i18;
  HEAP32[i20 + 12 >> 2] = i4;
  return;
 }
 i1 = i5 >>> 8;
 if (i1) if (i5 >>> 0 > 16777215) i4 = 31; else {
  i17 = (i1 + 1048320 | 0) >>> 16 & 8;
  i18 = i1 << i17;
  i16 = (i18 + 520192 | 0) >>> 16 & 4;
  i18 = i18 << i16;
  i4 = (i18 + 245760 | 0) >>> 16 & 2;
  i4 = 14 - (i16 | i17 | i4) + (i18 << i4 >>> 15) | 0;
  i4 = i5 >>> (i4 + 7 | 0) & 1 | i4 << 1;
 } else i4 = 0;
 i1 = 3132 + (i4 << 2) | 0;
 HEAP32[i20 + 28 >> 2] = i4;
 HEAP32[i20 + 20 >> 2] = 0;
 HEAP32[i20 + 16 >> 2] = 0;
 i2 = HEAP32[708] | 0;
 i3 = 1 << i4;
 L199 : do if (i2 & i3) {
  i1 = HEAP32[i1 >> 2] | 0;
  L202 : do if ((HEAP32[i1 + 4 >> 2] & -8 | 0) != (i5 | 0)) {
   i4 = i5 << ((i4 | 0) == 31 ? 0 : 25 - (i4 >>> 1) | 0);
   while (1) {
    i2 = i1 + 16 + (i4 >>> 31 << 2) | 0;
    i3 = HEAP32[i2 >> 2] | 0;
    if (!i3) break;
    if ((HEAP32[i3 + 4 >> 2] & -8 | 0) == (i5 | 0)) {
     i19 = i3;
     break L202;
    } else {
     i4 = i4 << 1;
     i1 = i3;
    }
   }
   if (i2 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
    HEAP32[i2 >> 2] = i20;
    HEAP32[i20 + 24 >> 2] = i1;
    HEAP32[i20 + 12 >> 2] = i20;
    HEAP32[i20 + 8 >> 2] = i20;
    break L199;
   }
  } else i19 = i1; while (0);
  i1 = i19 + 8 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  i18 = HEAP32[711] | 0;
  if (i2 >>> 0 >= i18 >>> 0 & i19 >>> 0 >= i18 >>> 0) {
   HEAP32[i2 + 12 >> 2] = i20;
   HEAP32[i1 >> 2] = i20;
   HEAP32[i20 + 8 >> 2] = i2;
   HEAP32[i20 + 12 >> 2] = i19;
   HEAP32[i20 + 24 >> 2] = 0;
   break;
  } else _abort();
 } else {
  HEAP32[708] = i2 | i3;
  HEAP32[i1 >> 2] = i20;
  HEAP32[i20 + 24 >> 2] = i1;
  HEAP32[i20 + 12 >> 2] = i20;
  HEAP32[i20 + 8 >> 2] = i20;
 } while (0);
 i20 = (HEAP32[715] | 0) + -1 | 0;
 HEAP32[715] = i20;
 if (!i20) i1 = 3284; else return;
 while (1) {
  i1 = HEAP32[i1 >> 2] | 0;
  if (!i1) break; else i1 = i1 + 8 | 0;
 }
 HEAP32[715] = -1;
 return;
}

function __ZN17knnClassification3runERKNSt3__16vectorIdNS0_9allocatorIdEEEE(i15, i10) {
 i15 = i15 | 0;
 i10 = i10 | 0;
 var i1 = 0, i2 = 0, i3 = 0, d4 = 0.0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, d11 = 0.0, i12 = 0, i13 = 0, i14 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, d24 = 0.0;
 i22 = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i19 = i22 + 24 | 0;
 i21 = i22 + 12 | 0;
 i20 = i22;
 i18 = i15 + 36 | 0;
 i1 = HEAP32[i18 >> 2] | 0;
 if ((i1 | 0) > 0) {
  i2 = HEAP32[i15 + 40 >> 2] | 0;
  i3 = 0;
  do {
   HEAP32[i2 + (i3 << 4) >> 2] = 0;
   HEAPF64[i2 + (i3 << 4) + 8 >> 3] = 0.0;
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) < (i1 | 0));
 }
 HEAP32[i21 >> 2] = 0;
 i23 = i21 + 4 | 0;
 HEAP32[i23 >> 2] = 0;
 HEAP32[i21 + 8 >> 2] = 0;
 i6 = i15 + 4 | 0;
 i1 = HEAP32[i6 >> 2] | 0;
 L6 : do if ((i1 | 0) > 0) {
  i7 = i15 + 8 | 0;
  i8 = i21 + 8 | 0;
  i9 = 0;
  i3 = 0;
  i5 = 0;
  while (1) {
   i2 = (HEAP32[i10 >> 2] | 0) + (HEAP32[(HEAP32[i7 >> 2] | 0) + (i5 << 2) >> 2] << 3) | 0;
   if ((i9 | 0) == (i3 | 0)) {
    __THREW__ = 0;
    invoke_vii(9, i21 | 0, i2 | 0);
    i17 = __THREW__;
    __THREW__ = 0;
    if (i17 & 1) break;
    i1 = HEAP32[i6 >> 2] | 0;
   } else {
    HEAPF64[i9 >> 3] = +HEAPF64[i2 >> 3];
    HEAP32[i23 >> 2] = i9 + 8;
   }
   i2 = i5 + 1 | 0;
   if ((i2 | 0) >= (i1 | 0)) {
    i12 = 13;
    break L6;
   }
   i9 = HEAP32[i23 >> 2] | 0;
   i3 = HEAP32[i8 >> 2] | 0;
   i5 = i2;
  }
  i3 = ___cxa_find_matching_catch() | 0;
 } else i12 = 13; while (0);
 do if ((i12 | 0) == 13) {
  i17 = i15 + 20 | 0;
  i14 = HEAP32[i17 >> 2] | 0;
  i10 = HEAP32[i15 + 24 >> 2] | 0;
  L19 : do if ((i14 | 0) == (i10 | 0)) i1 = HEAP32[i18 >> 2] | 0; else {
   i12 = HEAP32[i18 >> 2] | 0;
   i13 = i15 + 40 | 0;
   i6 = HEAP32[i21 >> 2] | 0;
   if ((i1 | 0) <= 0) {
    i1 = 0;
    i2 = i14;
    while (1) {
     if ((i1 | 0) < (i12 | 0)) {
      i16 = HEAP32[i13 >> 2] | 0;
      HEAP32[i16 + (i1 << 4) >> 2] = i1;
      HEAPF64[i16 + (i1 << 4) + 8 >> 3] = 0.0;
     }
     i2 = i2 + 24 | 0;
     if ((i2 | 0) == (i10 | 0)) {
      i1 = i12;
      break L19;
     } else i1 = i1 + 1 | 0;
    }
   }
   i7 = (i12 | 0) > 0;
   i8 = 0;
   d11 = 0.0;
   i2 = 0;
   i9 = i14;
   while (1) {
    i3 = HEAP32[i9 >> 2] | 0;
    d4 = 0.0;
    i5 = 0;
    do {
     d24 = +HEAPF64[i6 + (i5 << 3) >> 3] - +HEAPF64[i3 + (i5 << 3) >> 3];
     d4 = d4 + d24 * d24;
     i5 = i5 + 1 | 0;
    } while ((i5 | 0) < (i1 | 0));
    d4 = +Math_sqrt(+d4);
    if ((i8 | 0) < (i12 | 0)) {
     i16 = HEAP32[i13 >> 2] | 0;
     HEAP32[i16 + (i8 << 4) >> 2] = i8;
     HEAPF64[i16 + (i8 << 4) + 8 >> 3] = d4;
     if (d4 > d11) i2 = i8; else d4 = d11;
    } else if (d4 < d11) {
     i5 = HEAP32[i13 >> 2] | 0;
     HEAP32[i5 + (i2 << 4) >> 2] = i8;
     HEAPF64[i5 + (i2 << 4) + 8 >> 3] = d4;
     if (i7) {
      d4 = 0.0;
      i2 = 0;
      i3 = 0;
      do {
       d24 = +HEAPF64[i5 + (i3 << 4) + 8 >> 3];
       i16 = d24 > d4;
       i2 = i16 ? i3 : i2;
       d4 = i16 ? d24 : d4;
       i3 = i3 + 1 | 0;
      } while ((i3 | 0) < (i12 | 0));
     } else {
      d4 = 0.0;
      i2 = 0;
     }
    } else d4 = d11;
    i9 = i9 + 24 | 0;
    if ((i9 | 0) == (i10 | 0)) {
     i1 = i12;
     break;
    } else {
     i8 = i8 + 1 | 0;
     d11 = d4;
    }
   }
  } while (0);
  i9 = i20 + 4 | 0;
  HEAP32[i9 >> 2] = 0;
  i10 = i20 + 8 | 0;
  HEAP32[i10 >> 2] = 0;
  i16 = i20 + 4 | 0;
  HEAP32[i20 >> 2] = i16;
  i13 = i16;
  if ((i1 | 0) > 0) {
   i8 = i15 + 40 | 0;
   i2 = i14;
   i1 = 0;
   i3 = 0;
   L45 : while (1) {
    i7 = ~~+_round(+HEAPF64[HEAP32[i2 + ((HEAP32[(HEAP32[i8 >> 2] | 0) + (i3 << 4) >> 2] | 0) * 24 | 0) + 12 >> 2] >> 3]);
    if (i1) {
     i2 = i16;
     i5 = i1;
     L48 : do {
      while (1) {
       if ((HEAP32[i5 + 16 >> 2] | 0) >= (i7 | 0)) {
        i2 = i5;
        break;
       }
       i5 = HEAP32[i5 + 4 >> 2] | 0;
       if (!i5) break L48;
      }
      i5 = HEAP32[i2 >> 2] | 0;
     } while ((i5 | 0) != 0);
     if ((i2 | 0) != (i16 | 0) ? (i7 | 0) >= (HEAP32[i2 + 16 >> 2] | 0) : 0) {
      do if (i1) {
       i6 = i1;
       while (1) {
        i2 = HEAP32[i6 + 16 >> 2] | 0;
        if ((i7 | 0) < (i2 | 0)) {
         i2 = HEAP32[i6 >> 2] | 0;
         if (!i2) {
          i5 = i6;
          i2 = i6;
          i12 = 58;
          break;
         }
        } else {
         if ((i2 | 0) >= (i7 | 0)) {
          i2 = i6;
          i12 = 64;
          break;
         }
         i5 = i6 + 4 | 0;
         i2 = HEAP32[i5 >> 2] | 0;
         if (!i2) {
          i2 = i6;
          i12 = 62;
          break;
         }
        }
        i6 = i2;
       }
       if ((i12 | 0) == 58) {
        HEAP32[i19 >> 2] = i2;
        i12 = 65;
        break;
       } else if ((i12 | 0) == 62) {
        HEAP32[i19 >> 2] = i2;
        i12 = 65;
        break;
       } else if ((i12 | 0) == 64) {
        i12 = 0;
        HEAP32[i19 >> 2] = i2;
        if (!i2) {
         i5 = i19;
         i12 = 65;
         break;
        } else {
         i1 = i2;
         break;
        }
       }
      } else {
       HEAP32[i19 >> 2] = i16;
       i5 = i16;
       i2 = i13;
       i12 = 65;
      } while (0);
      if ((i12 | 0) == 65) {
       i12 = 0;
       __THREW__ = 0;
       i6 = invoke_ii(12, 24) | 0;
       i15 = __THREW__;
       __THREW__ = 0;
       if (i15 & 1) {
        i12 = 54;
        break;
       }
       HEAP32[i6 + 16 >> 2] = i7;
       HEAP32[i6 + 20 >> 2] = 0;
       HEAP32[i6 >> 2] = 0;
       HEAP32[i6 + 4 >> 2] = 0;
       HEAP32[i6 + 8 >> 2] = i2;
       HEAP32[i5 >> 2] = i6;
       i1 = HEAP32[HEAP32[i20 >> 2] >> 2] | 0;
       if (!i1) i1 = i6; else {
        HEAP32[i20 >> 2] = i1;
        i1 = HEAP32[i5 >> 2] | 0;
       }
       __ZNSt3__127__tree_balance_after_insertIPNS_16__tree_node_baseIPvEEEEvT_S5_(HEAP32[i9 >> 2] | 0, i1);
       HEAP32[i10 >> 2] = (HEAP32[i10 >> 2] | 0) + 1;
       i1 = i6;
      }
      i15 = i1 + 20 | 0;
      HEAP32[i15 >> 2] = (HEAP32[i15 >> 2] | 0) + 1;
     } else i12 = 38;
    } else i12 = 38;
    do if ((i12 | 0) == 38) {
     i12 = 0;
     __THREW__ = 0;
     i6 = invoke_ii(12, 24) | 0;
     i15 = __THREW__;
     __THREW__ = 0;
     if (i15 & 1) {
      i12 = 54;
      break L45;
     }
     HEAP32[i6 + 16 >> 2] = i7;
     HEAP32[i6 + 20 >> 2] = 1;
     do if (i1) {
      while (1) {
       i2 = HEAP32[i1 + 16 >> 2] | 0;
       if ((i7 | 0) < (i2 | 0)) {
        i2 = HEAP32[i1 >> 2] | 0;
        if (!i2) {
         i2 = i1;
         i12 = 42;
         break;
        } else i1 = i2;
       } else {
        if ((i2 | 0) >= (i7 | 0)) {
         i12 = 47;
         break;
        }
        i2 = i1 + 4 | 0;
        i5 = HEAP32[i2 >> 2] | 0;
        if (!i5) {
         i12 = 46;
         break;
        } else i1 = i5;
       }
      }
      if ((i12 | 0) == 42) {
       i12 = 0;
       HEAP32[i19 >> 2] = i1;
       break;
      } else if ((i12 | 0) == 46) {
       i12 = 0;
       HEAP32[i19 >> 2] = i1;
       break;
      } else if ((i12 | 0) == 47) {
       i12 = 0;
       HEAP32[i19 >> 2] = i1;
       i2 = i19;
       break;
      }
     } else {
      HEAP32[i19 >> 2] = i16;
      i2 = i16;
      i1 = i13;
     } while (0);
     if (HEAP32[i2 >> 2] | 0) {
      __ZdlPv(i6);
      break;
     }
     HEAP32[i6 >> 2] = 0;
     HEAP32[i6 + 4 >> 2] = 0;
     HEAP32[i6 + 8 >> 2] = i1;
     HEAP32[i2 >> 2] = i6;
     i1 = HEAP32[HEAP32[i20 >> 2] >> 2] | 0;
     if (!i1) i1 = i6; else {
      HEAP32[i20 >> 2] = i1;
      i1 = HEAP32[i2 >> 2] | 0;
     }
     __ZNSt3__127__tree_balance_after_insertIPNS_16__tree_node_baseIPvEEEEvT_S5_(HEAP32[i9 >> 2] | 0, i1);
     HEAP32[i10 >> 2] = (HEAP32[i10 >> 2] | 0) + 1;
    } while (0);
    i3 = i3 + 1 | 0;
    if ((i3 | 0) >= (HEAP32[i18 >> 2] | 0)) break;
    i2 = HEAP32[i17 >> 2] | 0;
    i1 = HEAP32[i16 >> 2] | 0;
   }
   if ((i12 | 0) == 54) {
    i3 = ___cxa_find_matching_catch() | 0;
    __ZNSt3__16__treeINS_12__value_typeIiiEENS_19__map_value_compareIiS2_NS_4lessIiEELb1EEENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(i20, i1);
    break;
   }
   i1 = HEAP32[i20 >> 2] | 0;
   if ((i1 | 0) != (i16 | 0)) {
    d4 = 0.0;
    i3 = 0;
    do {
     i2 = HEAP32[i1 + 20 >> 2] | 0;
     if ((i2 | 0) > (i3 | 0)) {
      d4 = +(HEAP32[i1 + 16 >> 2] | 0);
      i3 = i2;
     }
     i2 = HEAP32[i1 + 4 >> 2] | 0;
     if (!i2) while (1) {
      i2 = HEAP32[i1 + 8 >> 2] | 0;
      if ((HEAP32[i2 >> 2] | 0) == (i1 | 0)) {
       i1 = i2;
       break;
      } else i1 = i2;
     } else {
      i1 = i2;
      while (1) {
       i2 = HEAP32[i1 >> 2] | 0;
       if (!i2) break; else i1 = i2;
      }
     }
    } while ((i1 | 0) != (i16 | 0));
   } else d4 = 0.0;
  } else d4 = 0.0;
  __ZNSt3__16__treeINS_12__value_typeIiiEENS_19__map_value_compareIiS2_NS_4lessIiEELb1EEENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(i20, HEAP32[i16 >> 2] | 0);
  i1 = HEAP32[i21 >> 2] | 0;
  if (!i1) {
   STACKTOP = i22;
   return +d4;
  }
  i2 = HEAP32[i23 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) HEAP32[i23 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
  __ZdlPv(i1);
  STACKTOP = i22;
  return +d4;
 } while (0);
 i1 = HEAP32[i21 >> 2] | 0;
 if (!i1) ___resumeException(i3 | 0);
 i2 = HEAP32[i23 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) HEAP32[i23 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
 __ZdlPv(i1);
 ___resumeException(i3 | 0);
 return 0.0;
}

function _dispose_chunk(i14, i15) {
 i14 = i14 | 0;
 i15 = i15 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0;
 i16 = i14 + i15 | 0;
 i1 = HEAP32[i14 + 4 >> 2] | 0;
 do if (!(i1 & 1)) {
  i8 = HEAP32[i14 >> 2] | 0;
  if (!(i1 & 3)) return;
  i11 = i14 + (0 - i8) | 0;
  i10 = i8 + i15 | 0;
  i7 = HEAP32[711] | 0;
  if (i11 >>> 0 < i7 >>> 0) _abort();
  if ((i11 | 0) == (HEAP32[712] | 0)) {
   i2 = i14 + (i15 + 4) | 0;
   i1 = HEAP32[i2 >> 2] | 0;
   if ((i1 & 3 | 0) != 3) {
    i19 = i11;
    i5 = i10;
    break;
   }
   HEAP32[709] = i10;
   HEAP32[i2 >> 2] = i1 & -2;
   HEAP32[i14 + (4 - i8) >> 2] = i10 | 1;
   HEAP32[i16 >> 2] = i10;
   return;
  }
  i4 = i8 >>> 3;
  if (i8 >>> 0 < 256) {
   i3 = HEAP32[i14 + (8 - i8) >> 2] | 0;
   i2 = HEAP32[i14 + (12 - i8) >> 2] | 0;
   i1 = 2868 + (i4 << 1 << 2) | 0;
   if ((i3 | 0) != (i1 | 0)) {
    if (i3 >>> 0 < i7 >>> 0) _abort();
    if ((HEAP32[i3 + 12 >> 2] | 0) != (i11 | 0)) _abort();
   }
   if ((i2 | 0) == (i3 | 0)) {
    HEAP32[707] = HEAP32[707] & ~(1 << i4);
    i19 = i11;
    i5 = i10;
    break;
   }
   if ((i2 | 0) != (i1 | 0)) {
    if (i2 >>> 0 < i7 >>> 0) _abort();
    i1 = i2 + 8 | 0;
    if ((HEAP32[i1 >> 2] | 0) == (i11 | 0)) i6 = i1; else _abort();
   } else i6 = i2 + 8 | 0;
   HEAP32[i3 + 12 >> 2] = i2;
   HEAP32[i6 >> 2] = i3;
   i19 = i11;
   i5 = i10;
   break;
  }
  i6 = HEAP32[i14 + (24 - i8) >> 2] | 0;
  i3 = HEAP32[i14 + (12 - i8) >> 2] | 0;
  do if ((i3 | 0) == (i11 | 0)) {
   i3 = 16 - i8 | 0;
   i2 = i14 + (i3 + 4) | 0;
   i1 = HEAP32[i2 >> 2] | 0;
   if (!i1) {
    i2 = i14 + i3 | 0;
    i1 = HEAP32[i2 >> 2] | 0;
    if (!i1) {
     i9 = 0;
     break;
    }
   }
   while (1) {
    i3 = i1 + 20 | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if (i4) {
     i1 = i4;
     i2 = i3;
     continue;
    }
    i3 = i1 + 16 | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if (!i4) break; else {
     i1 = i4;
     i2 = i3;
    }
   }
   if (i2 >>> 0 < i7 >>> 0) _abort(); else {
    HEAP32[i2 >> 2] = 0;
    i9 = i1;
    break;
   }
  } else {
   i4 = HEAP32[i14 + (8 - i8) >> 2] | 0;
   if (i4 >>> 0 < i7 >>> 0) _abort();
   i1 = i4 + 12 | 0;
   if ((HEAP32[i1 >> 2] | 0) != (i11 | 0)) _abort();
   i2 = i3 + 8 | 0;
   if ((HEAP32[i2 >> 2] | 0) == (i11 | 0)) {
    HEAP32[i1 >> 2] = i3;
    HEAP32[i2 >> 2] = i4;
    i9 = i3;
    break;
   } else _abort();
  } while (0);
  if (i6) {
   i1 = HEAP32[i14 + (28 - i8) >> 2] | 0;
   i2 = 3132 + (i1 << 2) | 0;
   if ((i11 | 0) == (HEAP32[i2 >> 2] | 0)) {
    HEAP32[i2 >> 2] = i9;
    if (!i9) {
     HEAP32[708] = HEAP32[708] & ~(1 << i1);
     i19 = i11;
     i5 = i10;
     break;
    }
   } else {
    if (i6 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort();
    i1 = i6 + 16 | 0;
    if ((HEAP32[i1 >> 2] | 0) == (i11 | 0)) HEAP32[i1 >> 2] = i9; else HEAP32[i6 + 20 >> 2] = i9;
    if (!i9) {
     i19 = i11;
     i5 = i10;
     break;
    }
   }
   i3 = HEAP32[711] | 0;
   if (i9 >>> 0 < i3 >>> 0) _abort();
   HEAP32[i9 + 24 >> 2] = i6;
   i1 = 16 - i8 | 0;
   i2 = HEAP32[i14 + i1 >> 2] | 0;
   do if (i2) if (i2 >>> 0 < i3 >>> 0) _abort(); else {
    HEAP32[i9 + 16 >> 2] = i2;
    HEAP32[i2 + 24 >> 2] = i9;
    break;
   } while (0);
   i1 = HEAP32[i14 + (i1 + 4) >> 2] | 0;
   if (i1) if (i1 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
    HEAP32[i9 + 20 >> 2] = i1;
    HEAP32[i1 + 24 >> 2] = i9;
    i19 = i11;
    i5 = i10;
    break;
   } else {
    i19 = i11;
    i5 = i10;
   }
  } else {
   i19 = i11;
   i5 = i10;
  }
 } else {
  i19 = i14;
  i5 = i15;
 } while (0);
 i7 = HEAP32[711] | 0;
 if (i16 >>> 0 < i7 >>> 0) _abort();
 i1 = i14 + (i15 + 4) | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if (!(i2 & 2)) {
  if ((i16 | 0) == (HEAP32[713] | 0)) {
   i18 = (HEAP32[710] | 0) + i5 | 0;
   HEAP32[710] = i18;
   HEAP32[713] = i19;
   HEAP32[i19 + 4 >> 2] = i18 | 1;
   if ((i19 | 0) != (HEAP32[712] | 0)) return;
   HEAP32[712] = 0;
   HEAP32[709] = 0;
   return;
  }
  if ((i16 | 0) == (HEAP32[712] | 0)) {
   i18 = (HEAP32[709] | 0) + i5 | 0;
   HEAP32[709] = i18;
   HEAP32[712] = i19;
   HEAP32[i19 + 4 >> 2] = i18 | 1;
   HEAP32[i19 + i18 >> 2] = i18;
   return;
  }
  i5 = (i2 & -8) + i5 | 0;
  i4 = i2 >>> 3;
  do if (i2 >>> 0 >= 256) {
   i6 = HEAP32[i14 + (i15 + 24) >> 2] | 0;
   i3 = HEAP32[i14 + (i15 + 12) >> 2] | 0;
   do if ((i3 | 0) == (i16 | 0)) {
    i2 = i14 + (i15 + 20) | 0;
    i1 = HEAP32[i2 >> 2] | 0;
    if (!i1) {
     i2 = i14 + (i15 + 16) | 0;
     i1 = HEAP32[i2 >> 2] | 0;
     if (!i1) {
      i13 = 0;
      break;
     }
    }
    while (1) {
     i3 = i1 + 20 | 0;
     i4 = HEAP32[i3 >> 2] | 0;
     if (i4) {
      i1 = i4;
      i2 = i3;
      continue;
     }
     i3 = i1 + 16 | 0;
     i4 = HEAP32[i3 >> 2] | 0;
     if (!i4) break; else {
      i1 = i4;
      i2 = i3;
     }
    }
    if (i2 >>> 0 < i7 >>> 0) _abort(); else {
     HEAP32[i2 >> 2] = 0;
     i13 = i1;
     break;
    }
   } else {
    i4 = HEAP32[i14 + (i15 + 8) >> 2] | 0;
    if (i4 >>> 0 < i7 >>> 0) _abort();
    i1 = i4 + 12 | 0;
    if ((HEAP32[i1 >> 2] | 0) != (i16 | 0)) _abort();
    i2 = i3 + 8 | 0;
    if ((HEAP32[i2 >> 2] | 0) == (i16 | 0)) {
     HEAP32[i1 >> 2] = i3;
     HEAP32[i2 >> 2] = i4;
     i13 = i3;
     break;
    } else _abort();
   } while (0);
   if (i6) {
    i1 = HEAP32[i14 + (i15 + 28) >> 2] | 0;
    i2 = 3132 + (i1 << 2) | 0;
    if ((i16 | 0) == (HEAP32[i2 >> 2] | 0)) {
     HEAP32[i2 >> 2] = i13;
     if (!i13) {
      HEAP32[708] = HEAP32[708] & ~(1 << i1);
      break;
     }
    } else {
     if (i6 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort();
     i1 = i6 + 16 | 0;
     if ((HEAP32[i1 >> 2] | 0) == (i16 | 0)) HEAP32[i1 >> 2] = i13; else HEAP32[i6 + 20 >> 2] = i13;
     if (!i13) break;
    }
    i2 = HEAP32[711] | 0;
    if (i13 >>> 0 < i2 >>> 0) _abort();
    HEAP32[i13 + 24 >> 2] = i6;
    i1 = HEAP32[i14 + (i15 + 16) >> 2] | 0;
    do if (i1) if (i1 >>> 0 < i2 >>> 0) _abort(); else {
     HEAP32[i13 + 16 >> 2] = i1;
     HEAP32[i1 + 24 >> 2] = i13;
     break;
    } while (0);
    i1 = HEAP32[i14 + (i15 + 20) >> 2] | 0;
    if (i1) if (i1 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
     HEAP32[i13 + 20 >> 2] = i1;
     HEAP32[i1 + 24 >> 2] = i13;
     break;
    }
   }
  } else {
   i3 = HEAP32[i14 + (i15 + 8) >> 2] | 0;
   i2 = HEAP32[i14 + (i15 + 12) >> 2] | 0;
   i1 = 2868 + (i4 << 1 << 2) | 0;
   if ((i3 | 0) != (i1 | 0)) {
    if (i3 >>> 0 < i7 >>> 0) _abort();
    if ((HEAP32[i3 + 12 >> 2] | 0) != (i16 | 0)) _abort();
   }
   if ((i2 | 0) == (i3 | 0)) {
    HEAP32[707] = HEAP32[707] & ~(1 << i4);
    break;
   }
   if ((i2 | 0) != (i1 | 0)) {
    if (i2 >>> 0 < i7 >>> 0) _abort();
    i1 = i2 + 8 | 0;
    if ((HEAP32[i1 >> 2] | 0) == (i16 | 0)) i12 = i1; else _abort();
   } else i12 = i2 + 8 | 0;
   HEAP32[i3 + 12 >> 2] = i2;
   HEAP32[i12 >> 2] = i3;
  } while (0);
  HEAP32[i19 + 4 >> 2] = i5 | 1;
  HEAP32[i19 + i5 >> 2] = i5;
  if ((i19 | 0) == (HEAP32[712] | 0)) {
   HEAP32[709] = i5;
   return;
  }
 } else {
  HEAP32[i1 >> 2] = i2 & -2;
  HEAP32[i19 + 4 >> 2] = i5 | 1;
  HEAP32[i19 + i5 >> 2] = i5;
 }
 i1 = i5 >>> 3;
 if (i5 >>> 0 < 256) {
  i2 = i1 << 1;
  i4 = 2868 + (i2 << 2) | 0;
  i3 = HEAP32[707] | 0;
  i1 = 1 << i1;
  if (i3 & i1) {
   i1 = 2868 + (i2 + 2 << 2) | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if (i2 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
    i17 = i1;
    i18 = i2;
   }
  } else {
   HEAP32[707] = i3 | i1;
   i17 = 2868 + (i2 + 2 << 2) | 0;
   i18 = i4;
  }
  HEAP32[i17 >> 2] = i19;
  HEAP32[i18 + 12 >> 2] = i19;
  HEAP32[i19 + 8 >> 2] = i18;
  HEAP32[i19 + 12 >> 2] = i4;
  return;
 }
 i1 = i5 >>> 8;
 if (i1) if (i5 >>> 0 > 16777215) i4 = 31; else {
  i17 = (i1 + 1048320 | 0) >>> 16 & 8;
  i18 = i1 << i17;
  i16 = (i18 + 520192 | 0) >>> 16 & 4;
  i18 = i18 << i16;
  i4 = (i18 + 245760 | 0) >>> 16 & 2;
  i4 = 14 - (i16 | i17 | i4) + (i18 << i4 >>> 15) | 0;
  i4 = i5 >>> (i4 + 7 | 0) & 1 | i4 << 1;
 } else i4 = 0;
 i1 = 3132 + (i4 << 2) | 0;
 HEAP32[i19 + 28 >> 2] = i4;
 HEAP32[i19 + 20 >> 2] = 0;
 HEAP32[i19 + 16 >> 2] = 0;
 i2 = HEAP32[708] | 0;
 i3 = 1 << i4;
 if (!(i2 & i3)) {
  HEAP32[708] = i2 | i3;
  HEAP32[i1 >> 2] = i19;
  HEAP32[i19 + 24 >> 2] = i1;
  HEAP32[i19 + 12 >> 2] = i19;
  HEAP32[i19 + 8 >> 2] = i19;
  return;
 }
 i1 = HEAP32[i1 >> 2] | 0;
 L191 : do if ((HEAP32[i1 + 4 >> 2] & -8 | 0) != (i5 | 0)) {
  i4 = i5 << ((i4 | 0) == 31 ? 0 : 25 - (i4 >>> 1) | 0);
  while (1) {
   i2 = i1 + 16 + (i4 >>> 31 << 2) | 0;
   i3 = HEAP32[i2 >> 2] | 0;
   if (!i3) break;
   if ((HEAP32[i3 + 4 >> 2] & -8 | 0) == (i5 | 0)) {
    i1 = i3;
    break L191;
   } else {
    i4 = i4 << 1;
    i1 = i3;
   }
  }
  if (i2 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort();
  HEAP32[i2 >> 2] = i19;
  HEAP32[i19 + 24 >> 2] = i1;
  HEAP32[i19 + 12 >> 2] = i19;
  HEAP32[i19 + 8 >> 2] = i19;
  return;
 } while (0);
 i2 = i1 + 8 | 0;
 i3 = HEAP32[i2 >> 2] | 0;
 i18 = HEAP32[711] | 0;
 if (!(i3 >>> 0 >= i18 >>> 0 & i1 >>> 0 >= i18 >>> 0)) _abort();
 HEAP32[i3 + 12 >> 2] = i19;
 HEAP32[i2 >> 2] = i19;
 HEAP32[i19 + 8 >> 2] = i3;
 HEAP32[i19 + 12 >> 2] = i1;
 HEAP32[i19 + 24 >> 2] = 0;
 return;
}

function __ZN14classification5trainERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE(i19, i20) {
 i19 = i19 | 0;
 i20 = i20 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i21 = 0, i22 = 0;
 i22 = STACKTOP;
 STACKTOP = STACKTOP + 80 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i6 = i22 + 60 | 0;
 i7 = i22 + 48 | 0;
 i13 = i22 + 24 | 0;
 i21 = i22 + 12 | 0;
 i14 = i22 + 8 | 0;
 i16 = i22 + 4 | 0;
 i17 = i22;
 i18 = i19 + 36 | 0;
 if (HEAP8[i18 >> 0] | 0) {
  i21 = __ZN8modelSet5trainERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE(i19, i20) | 0;
  STACKTOP = i22;
  return i21 | 0;
 }
 i2 = HEAP32[i20 >> 2] | 0;
 i12 = (HEAP32[i2 + 4 >> 2] | 0) - (HEAP32[i2 >> 2] | 0) | 0;
 i1 = i12 >> 3;
 i15 = i19 + 16 | 0;
 HEAP32[i15 >> 2] = i1;
 do if ((i12 | 0) > 0) {
  i2 = i19 + 24 | 0;
  i3 = i19 + 28 | 0;
  i4 = i19 + 20 | 0;
  i5 = 0;
  while (1) {
   i5 = i5 + 1 | 0;
   __ZNSt3__19to_stringEi(i7, i5);
   __THREW__ = 0;
   i1 = invoke_iiii(16, i7 | 0, 0, 4451) | 0;
   i12 = __THREW__;
   __THREW__ = 0;
   if (i12 & 1) {
    i2 = 10;
    break;
   };
   HEAP32[i6 >> 2] = HEAP32[i1 >> 2];
   HEAP32[i6 + 4 >> 2] = HEAP32[i1 + 4 >> 2];
   HEAP32[i6 + 8 >> 2] = HEAP32[i1 + 8 >> 2];
   HEAP32[i1 >> 2] = 0;
   HEAP32[i1 + 4 >> 2] = 0;
   HEAP32[i1 + 8 >> 2] = 0;
   i1 = HEAP32[i2 >> 2] | 0;
   if (i1 >>> 0 >= (HEAP32[i3 >> 2] | 0) >>> 0) {
    __THREW__ = 0;
    invoke_vii(15, i4 | 0, i6 | 0);
    i12 = __THREW__;
    __THREW__ = 0;
    if (i12 & 1) {
     i2 = 11;
     break;
    }
   } else {
    HEAP32[i1 >> 2] = HEAP32[i6 >> 2];
    HEAP32[i1 + 4 >> 2] = HEAP32[i6 + 4 >> 2];
    HEAP32[i1 + 8 >> 2] = HEAP32[i6 + 8 >> 2];
    HEAP32[i6 >> 2] = 0;
    HEAP32[i6 + 4 >> 2] = 0;
    HEAP32[i6 + 8 >> 2] = 0;
    HEAP32[i2 >> 2] = (HEAP32[i2 >> 2] | 0) + 12;
   }
   __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i6);
   __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i7);
   i1 = HEAP32[i15 >> 2] | 0;
   if ((i5 | 0) >= (i1 | 0)) {
    i2 = 13;
    break;
   }
  }
  if ((i2 | 0) == 10) i1 = ___cxa_find_matching_catch() | 0; else if ((i2 | 0) == 11) {
   i1 = ___cxa_find_matching_catch() | 0;
   __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i6);
  } else if ((i2 | 0) == 13) {
   i2 = HEAP32[i20 >> 2] | 0;
   break;
  }
  __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i7);
  i22 = i1;
  ___resumeException(i22 | 0);
 } while (0);
 i12 = i19 + 32 | 0;
 HEAP32[i12 >> 2] = (HEAP32[i2 + 16 >> 2] | 0) - (HEAP32[i2 + 12 >> 2] | 0) >> 3;
 i8 = HEAP32[i20 + 4 >> 2] | 0;
 do if ((i2 | 0) != (i8 | 0)) {
  i7 = i13 + 12 | 0;
  i11 = i13 + 4 | 0;
  i10 = i13 + 16 | 0;
  i9 = i13 + 12 | 0;
  while (1) {
   __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i13, i2);
   __THREW__ = 0;
   invoke_vii(8, i7 | 0, i2 + 12 | 0);
   i6 = __THREW__;
   __THREW__ = 0;
   if (i6 & 1) {
    i2 = 18;
    break;
   }
   i1 = HEAP32[i13 >> 2] | 0;
   if (((HEAP32[i11 >> 2] | 0) - i1 >> 3 | 0) != (HEAP32[i15 >> 2] | 0)) {
    i2 = 70;
    break;
   }
   i3 = HEAP32[i10 >> 2] | 0;
   i4 = HEAP32[i7 >> 2] | 0;
   i5 = i4;
   i6 = (i3 - i5 >> 3 | 0) == (HEAP32[i12 >> 2] | 0);
   if (i4) {
    if ((i3 | 0) != (i4 | 0)) HEAP32[i10 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
    __ZdlPv(i4);
    i1 = HEAP32[i13 >> 2] | 0;
   }
   i3 = i1;
   if (i1) {
    i4 = HEAP32[i11 >> 2] | 0;
    if ((i4 | 0) != (i1 | 0)) HEAP32[i11 >> 2] = i4 + (~((i4 + -8 - i3 | 0) >>> 3) << 3);
    __ZdlPv(i1);
   }
   i2 = i2 + 24 | 0;
   if (!i6) {
    i1 = 0;
    i2 = 78;
    break;
   }
   if ((i2 | 0) == (i8 | 0)) {
    i2 = 33;
    break;
   }
  }
  if ((i2 | 0) == 18) {
   i3 = ___cxa_find_matching_catch() | 0;
   i1 = HEAP32[i13 >> 2] | 0;
   if (!i1) ___resumeException(i3 | 0);
   i2 = HEAP32[i11 >> 2] | 0;
   if ((i2 | 0) != (i1 | 0)) HEAP32[i11 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
   __ZdlPv(i1);
   ___resumeException(i3 | 0);
  } else if ((i2 | 0) == 33) {
   i1 = HEAP32[i15 >> 2] | 0;
   break;
  } else if ((i2 | 0) == 70) {
   i2 = HEAP32[i9 >> 2] | 0;
   i3 = i2;
   if (i2) {
    i1 = HEAP32[i10 >> 2] | 0;
    if ((i1 | 0) != (i2 | 0)) HEAP32[i10 >> 2] = i1 + (~((i1 + -8 - i3 | 0) >>> 3) << 3);
    __ZdlPv(i2);
    i1 = HEAP32[i13 >> 2] | 0;
   }
   if (!i1) {
    i21 = 0;
    STACKTOP = i22;
    return i21 | 0;
   }
   i2 = HEAP32[i11 >> 2] | 0;
   if ((i2 | 0) != (i1 | 0)) HEAP32[i11 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
   __ZdlPv(i1);
   i21 = 0;
   STACKTOP = i22;
   return i21 | 0;
  } else if ((i2 | 0) == 78) {
   STACKTOP = i22;
   return i1 | 0;
  }
 } while (0);
 HEAP32[i21 >> 2] = 0;
 i8 = i21 + 4 | 0;
 HEAP32[i8 >> 2] = 0;
 HEAP32[i21 + 8 >> 2] = 0;
 HEAP32[i14 >> 2] = 0;
 L66 : do if ((i1 | 0) > 0) {
  i2 = i21 + 8 | 0;
  i3 = 0;
  i4 = 0;
  i1 = 0;
  while (1) {
   if ((i3 | 0) == (i4 | 0)) {
    __THREW__ = 0;
    invoke_vii(13, i21 | 0, i14 | 0);
    i13 = __THREW__;
    __THREW__ = 0;
    if (i13 & 1) break;
   } else {
    HEAP32[i3 >> 2] = i1;
    HEAP32[i8 >> 2] = i3 + 4;
   }
   i1 = i1 + 1 | 0;
   HEAP32[i14 >> 2] = i1;
   if ((i1 | 0) >= (HEAP32[i15 >> 2] | 0)) {
    i2 = 36;
    break L66;
   }
   i3 = HEAP32[i8 >> 2] | 0;
   i4 = HEAP32[i2 >> 2] | 0;
  }
  i1 = ___cxa_find_matching_catch() | 0;
  i2 = 46;
 } else i2 = 36; while (0);
 L76 : do if ((i2 | 0) == 36) {
  L78 : do if ((HEAP32[i12 >> 2] | 0) > 0) {
   i3 = i19 + 40 | 0;
   i4 = i19 + 4 | 0;
   i5 = i19 + 8 | 0;
   i6 = i19 + 12 | 0;
   i7 = 0;
   L80 : while (1) {
    __THREW__ = 0;
    do if ((HEAP32[i3 >> 2] | 0) == 1) {
     i1 = __Znwj(160) | 0;
     i14 = __THREW__;
     __THREW__ = 0;
     if (i14 & 1) {
      i2 = 43;
      break L80;
     }
     __THREW__ = 0;
     invoke_vii(22, i1 | 0, HEAP32[i15 >> 2] | 0);
     i14 = __THREW__;
     __THREW__ = 0;
     if (i14 & 1) {
      i2 = 53;
      break L80;
     }
     HEAP32[i16 >> 2] = i1;
     i2 = HEAP32[i5 >> 2] | 0;
     if (i2 >>> 0 >= (HEAP32[i6 >> 2] | 0) >>> 0) {
      __THREW__ = 0;
      invoke_vii(14, i4 | 0, i16 | 0);
      i14 = __THREW__;
      __THREW__ = 0;
      if (i14 & 1) {
       i2 = 43;
       break L80;
      } else break;
     } else {
      HEAP32[i2 >> 2] = i1;
      HEAP32[i5 >> 2] = (HEAP32[i5 >> 2] | 0) + 4;
      break;
     }
    } else {
     i1 = __Znwj(44) | 0;
     i14 = __THREW__;
     __THREW__ = 0;
     if (i14 & 1) {
      i2 = 43;
      break L80;
     }
     __THREW__ = 0;
     invoke_viiiii(5, i1 | 0, i15 | 0, i21 | 0, i20 | 0, 1);
     i14 = __THREW__;
     __THREW__ = 0;
     if (i14 & 1) {
      i2 = 59;
      break L80;
     }
     HEAP32[i17 >> 2] = i1;
     i2 = HEAP32[i5 >> 2] | 0;
     if (i2 >>> 0 >= (HEAP32[i6 >> 2] | 0) >>> 0) {
      __THREW__ = 0;
      invoke_vii(14, i4 | 0, i17 | 0);
      i14 = __THREW__;
      __THREW__ = 0;
      if (i14 & 1) {
       i2 = 43;
       break L80;
      } else break;
     } else {
      HEAP32[i2 >> 2] = i1;
      HEAP32[i5 >> 2] = (HEAP32[i5 >> 2] | 0) + 4;
      break;
     }
    } while (0);
    i7 = i7 + 1 | 0;
    if ((i7 | 0) >= (HEAP32[i12 >> 2] | 0)) break L78;
   }
   if ((i2 | 0) == 43) {
    i1 = ___cxa_find_matching_catch() | 0;
    i2 = 46;
    break L76;
   } else if ((i2 | 0) == 53) {
    i3 = ___cxa_find_matching_catch() | 0;
    __ZdlPv(i1);
    break L76;
   } else if ((i2 | 0) == 59) {
    i3 = ___cxa_find_matching_catch() | 0;
    __ZdlPv(i1);
    break L76;
   }
  } while (0);
  HEAP8[i18 >> 0] = 1;
  __THREW__ = 0;
  i3 = invoke_iii(1, i19 | 0, i20 | 0) | 0;
  i20 = __THREW__;
  __THREW__ = 0;
  if (i20 & 1) {
   i1 = ___cxa_find_matching_catch() | 0;
   i2 = 46;
   break;
  }
  i1 = HEAP32[i21 >> 2] | 0;
  if (!i1) {
   i21 = i3;
   STACKTOP = i22;
   return i21 | 0;
  }
  i2 = HEAP32[i8 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) HEAP32[i8 >> 2] = i2 + (~((i2 + -4 - i1 | 0) >>> 2) << 2);
  __ZdlPv(i1);
  i21 = i3;
  STACKTOP = i22;
  return i21 | 0;
 } while (0);
 if ((i2 | 0) == 46) i3 = i1;
 i1 = HEAP32[i21 >> 2] | 0;
 if (!i1) {
  i22 = i3;
  ___resumeException(i22 | 0);
 }
 i2 = HEAP32[i8 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) HEAP32[i8 >> 2] = i2 + (~((i2 + -4 - i1 | 0) >>> 2) << 2);
 __ZdlPv(i1);
 i22 = i3;
 ___resumeException(i22 | 0);
 return 0;
}

function __ZN13neuralNetwork3runERKNSt3__16vectorIdNS0_9allocatorIdEEEE(i26, i9) {
 i26 = i26 | 0;
 i9 = i9 | 0;
 var i1 = 0, i2 = 0, i3 = 0, d4 = 0.0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i27 = 0, i28 = 0, i29 = 0;
 i27 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i28 = i27 + 44 | 0;
 i10 = i27 + 24 | 0;
 i11 = i27 + 16 | 0;
 i25 = i27 + 32 | 0;
 i22 = i27 + 8 | 0;
 i23 = i27;
 HEAP32[i28 >> 2] = 0;
 i29 = i28 + 4 | 0;
 HEAP32[i29 >> 2] = 0;
 HEAP32[i28 + 8 >> 2] = 0;
 i24 = i26 + 4 | 0;
 i1 = HEAP32[i24 >> 2] | 0;
 L1 : do if ((i1 | 0) > 0) {
  i8 = i26 + 8 | 0;
  i5 = i28 + 8 | 0;
  i6 = 0;
  i7 = 0;
  i3 = 0;
  while (1) {
   i2 = (HEAP32[i9 >> 2] | 0) + (HEAP32[(HEAP32[i8 >> 2] | 0) + (i3 << 2) >> 2] << 3) | 0;
   if ((i6 | 0) == (i7 | 0)) {
    __THREW__ = 0;
    invoke_vii(9, i28 | 0, i2 | 0);
    i21 = __THREW__;
    __THREW__ = 0;
    if (i21 & 1) break;
    i1 = HEAP32[i24 >> 2] | 0;
   } else {
    HEAPF64[i6 >> 3] = +HEAPF64[i2 >> 3];
    HEAP32[i29 >> 2] = i6 + 8;
   }
   i2 = i3 + 1 | 0;
   if ((i2 | 0) >= (i1 | 0)) {
    i3 = i1;
    i21 = 13;
    break L1;
   }
   i6 = HEAP32[i29 >> 2] | 0;
   i7 = HEAP32[i5 >> 2] | 0;
   i3 = i2;
  }
  i1 = ___cxa_find_matching_catch() | 0;
  i21 = 12;
 } else {
  i3 = i1;
  i21 = 13;
 } while (0);
 L12 : do if ((i21 | 0) == 13) {
  i20 = i26 + 28 | 0;
  i1 = HEAP32[i20 >> 2] | 0;
  i8 = i26 + 32 | 0;
  i2 = HEAP32[i8 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   i1 = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3) | 0;
   HEAP32[i8 >> 2] = i1;
  }
  L17 : do if ((i3 | 0) > 0) {
   i6 = i26 + 100 | 0;
   i7 = i26 + 88 | 0;
   i2 = i26 + 36 | 0;
   i5 = 0;
   while (1) {
    d4 = (+HEAPF64[(HEAP32[i28 >> 2] | 0) + (i5 << 3) >> 3] - +HEAPF64[(HEAP32[i6 >> 2] | 0) + (i5 << 3) >> 3]) / +HEAPF64[(HEAP32[i7 >> 2] | 0) + (i5 << 3) >> 3];
    HEAPF64[i10 >> 3] = d4;
    if (i1 >>> 0 < (HEAP32[i2 >> 2] | 0) >>> 0) {
     HEAPF64[i1 >> 3] = d4;
     HEAP32[i8 >> 2] = i1 + 8;
    } else {
     __THREW__ = 0;
     invoke_vii(7, i20 | 0, i10 | 0);
     i19 = __THREW__;
     __THREW__ = 0;
     if (i19 & 1) break;
     i3 = HEAP32[i24 >> 2] | 0;
    }
    i5 = i5 + 1 | 0;
    i1 = HEAP32[i8 >> 2] | 0;
    if ((i5 | 0) >= (i3 | 0)) break L17;
   }
   i1 = ___cxa_find_matching_catch() | 0;
   i21 = 12;
   break L12;
  } else i2 = i26 + 36 | 0; while (0);
  HEAPF64[i11 >> 3] = 1.0;
  if (i1 >>> 0 >= (HEAP32[i2 >> 2] | 0) >>> 0) {
   __THREW__ = 0;
   invoke_vii(7, i20 | 0, i11 | 0);
   i19 = __THREW__;
   __THREW__ = 0;
   if (i19 & 1) {
    i1 = ___cxa_find_matching_catch() | 0;
    i21 = 12;
    break;
   }
  } else {
   HEAPF64[i1 >> 3] = 1.0;
   HEAP32[i8 >> 2] = i1 + 8;
  }
  i19 = i26 + 40 | 0;
  i6 = HEAP32[i19 >> 2] | 0;
  i18 = i26 + 44 | 0;
  i1 = HEAP32[i18 >> 2] | 0;
  if ((i1 | 0) != (i6 | 0)) do {
   i2 = i1 + -12 | 0;
   HEAP32[i18 >> 2] = i2;
   i3 = HEAP32[i2 >> 2] | 0;
   i5 = i3;
   if (!i3) i1 = i2; else {
    i1 = i1 + -8 | 0;
    i2 = HEAP32[i1 >> 2] | 0;
    if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i5 | 0) >>> 3) << 3);
    __ZdlPv(i3);
    i1 = HEAP32[i18 >> 2] | 0;
   }
  } while ((i1 | 0) != (i6 | 0));
  i16 = i26 + 20 | 0;
  i2 = HEAP32[i16 >> 2] | 0;
  L44 : do if ((i2 | 0) > 0) {
   i17 = i25 + 4 | 0;
   i11 = i25 + 8 | 0;
   i1 = i26 + 24 | 0;
   i12 = i25 + 8 | 0;
   i13 = i26 + 48 | 0;
   i14 = i26 + 64 | 0;
   i15 = 0;
   L46 : while (1) {
    HEAP32[i25 >> 2] = 0;
    HEAP32[i17 >> 2] = 0;
    HEAP32[i11 >> 2] = 0;
    if ((HEAP32[i1 >> 2] | 0) > 0) {
     i8 = (i15 | 0) == 0;
     i9 = i15 + -1 | 0;
     i3 = 0;
     i2 = 0;
     i10 = 0;
     do {
      HEAPF64[i22 >> 3] = 0.0;
      if (i3 >>> 0 >= i2 >>> 0) {
       __THREW__ = 0;
       invoke_vii(7, i25 | 0, i22 | 0);
       i7 = __THREW__;
       __THREW__ = 0;
       if (i7 & 1) {
        i21 = 47;
        break L46;
       }
      } else {
       HEAPF64[i3 >> 3] = 0.0;
       HEAP32[i17 >> 2] = i3 + 8;
      }
      if (i8) {
       i2 = HEAP32[i24 >> 2] | 0;
       if ((i2 | 0) >= 0) {
        i3 = HEAP32[i20 >> 2] | 0;
        i5 = HEAP32[(HEAP32[HEAP32[i14 >> 2] >> 2] | 0) + (i10 * 12 | 0) >> 2] | 0;
        i6 = (HEAP32[i25 >> 2] | 0) + (i10 << 3) | 0;
        d4 = +HEAPF64[i6 >> 3];
        i7 = 0;
        while (1) {
         d4 = +HEAPF64[i3 + (i7 << 3) >> 3] * +HEAPF64[i5 + (i7 << 3) >> 3] + d4;
         HEAPF64[i6 >> 3] = d4;
         if ((i7 | 0) >= (i2 | 0)) break; else i7 = i7 + 1 | 0;
        }
       }
      } else {
       i2 = HEAP32[i1 >> 2] | 0;
       if ((i2 | 0) >= 0) {
        i3 = HEAP32[(HEAP32[i19 >> 2] | 0) + (i9 * 12 | 0) >> 2] | 0;
        i5 = HEAP32[(HEAP32[(HEAP32[i14 >> 2] | 0) + (i15 * 12 | 0) >> 2] | 0) + (i10 * 12 | 0) >> 2] | 0;
        i6 = (HEAP32[i25 >> 2] | 0) + (i10 << 3) | 0;
        i7 = 0;
        while (1) {
         HEAPF64[i6 >> 3] = +HEAPF64[i3 + (i7 << 3) >> 3] * +HEAPF64[i5 + (i7 << 3) >> 3];
         if ((i7 | 0) < (i2 | 0)) i7 = i7 + 1 | 0; else break;
        }
       }
      }
      i2 = (HEAP32[i25 >> 2] | 0) + (i10 << 3) | 0;
      d4 = +HEAPF64[i2 >> 3];
      if (!(d4 < -45.0)) if (d4 > 45.0) d4 = 1.0; else d4 = 1.0 / (+Math_exp(+-d4) + 1.0); else d4 = 0.0;
      HEAPF64[i2 >> 3] = d4;
      i10 = i10 + 1 | 0;
      i3 = HEAP32[i17 >> 2] | 0;
      i2 = HEAP32[i12 >> 2] | 0;
     } while ((i10 | 0) < (HEAP32[i1 >> 2] | 0));
     HEAPF64[i23 >> 3] = 1.0;
     if (i3 >>> 0 < i2 >>> 0) {
      HEAPF64[i3 >> 3] = 1.0;
      HEAP32[i17 >> 2] = i3 + 8;
     } else i21 = 60;
    } else {
     HEAPF64[i23 >> 3] = 1.0;
     i21 = 60;
    }
    if ((i21 | 0) == 60 ? (i21 = 0, __THREW__ = 0, invoke_vii(7, i25 | 0, i23 | 0), i10 = __THREW__, __THREW__ = 0, i10 & 1) : 0) {
     i21 = 48;
     break;
    }
    i2 = HEAP32[i18 >> 2] | 0;
    __THREW__ = 0;
    if ((i2 | 0) == (HEAP32[i13 >> 2] | 0)) {
     __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEE21__push_back_slow_pathIRKS3_EEvOT_(i19, i25);
     i10 = __THREW__;
     __THREW__ = 0;
     if (i10 & 1) {
      i21 = 48;
      break;
     }
    } else {
     __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i2, i25);
     i10 = __THREW__;
     __THREW__ = 0;
     if (i10 & 1) {
      i21 = 48;
      break;
     }
     HEAP32[i18 >> 2] = (HEAP32[i18 >> 2] | 0) + 12;
    }
    i2 = HEAP32[i25 >> 2] | 0;
    i3 = i2;
    if (i2) {
     i5 = HEAP32[i17 >> 2] | 0;
     if ((i5 | 0) != (i2 | 0)) HEAP32[i17 >> 2] = i5 + (~((i5 + -8 - i3 | 0) >>> 3) << 3);
     __ZdlPv(i2);
    }
    i15 = i15 + 1 | 0;
    i2 = HEAP32[i16 >> 2] | 0;
    if ((i15 | 0) >= (i2 | 0)) break L44;
   }
   if ((i21 | 0) == 47) i3 = ___cxa_find_matching_catch() | 0; else if ((i21 | 0) == 48) i3 = ___cxa_find_matching_catch() | 0;
   i1 = HEAP32[i25 >> 2] | 0;
   if (!i1) break L12;
   i2 = HEAP32[i17 >> 2] | 0;
   if ((i2 | 0) != (i1 | 0)) HEAP32[i17 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
   __ZdlPv(i1);
   break L12;
  } else i1 = i26 + 24 | 0; while (0);
  i6 = i26 + 56 | 0;
  HEAPF64[i6 >> 3] = 0.0;
  i5 = HEAP32[i1 >> 2] | 0;
  if ((i5 | 0) < 0) d4 = 0.0; else {
   i3 = HEAP32[i26 + 76 >> 2] | 0;
   i1 = HEAP32[(HEAP32[i19 >> 2] | 0) + ((i2 + -1 | 0) * 12 | 0) >> 2] | 0;
   d4 = 0.0;
   i2 = 0;
   while (1) {
    d4 = d4 + +HEAPF64[i1 + (i2 << 3) >> 3] * +HEAPF64[i3 + (i2 << 3) >> 3];
    HEAPF64[i6 >> 3] = d4;
    if ((i2 | 0) < (i5 | 0)) i2 = i2 + 1 | 0; else break;
   }
  }
  d4 = d4 * +HEAPF64[i26 + 112 >> 3] + +HEAPF64[i26 + 120 >> 3];
  HEAPF64[i6 >> 3] = d4;
  i1 = HEAP32[i28 >> 2] | 0;
  if (!i1) {
   STACKTOP = i27;
   return +d4;
  }
  i2 = HEAP32[i29 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) HEAP32[i29 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
  __ZdlPv(i1);
  STACKTOP = i27;
  return +d4;
 } while (0);
 if ((i21 | 0) == 12) i3 = i1;
 i1 = HEAP32[i28 >> 2] | 0;
 if (!i1) ___resumeException(i3 | 0);
 i2 = HEAP32[i29 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) HEAP32[i29 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
 __ZdlPv(i1);
 ___resumeException(i3 | 0);
 return 0.0;
}

function __ZN3dtw3runENSt3__16vectorINS1_IdNS0_9allocatorIdEEEENS2_IS4_EEEE(i22, i21) {
 i22 = i22 | 0;
 i21 = i21 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, d5 = 0.0, d6 = 0.0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, d28 = 0.0;
 i25 = STACKTOP;
 STACKTOP = STACKTOP + 96 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i8 = i25 + 84 | 0;
 i7 = i25 + 72 | 0;
 i12 = i25 + 60 | 0;
 i11 = i25 + 48 | 0;
 i26 = i25 + 36 | 0;
 i19 = i25 + 24 | 0;
 i27 = i25 + 12 | 0;
 i20 = i25;
 i2 = HEAP32[i21 >> 2] | 0;
 i10 = (HEAP32[i21 + 4 >> 2] | 0) - i2 | 0;
 i1 = (i10 | 0) / 12 | 0;
 i9 = (HEAP32[i22 + 4 >> 2] | 0) - (HEAP32[i22 >> 2] | 0) | 0;
 i23 = (i9 | 0) / 12 | 0;
 i18 = (Math_imul(i23, i1) | 0) << 3;
 i24 = STACKTOP;
 STACKTOP = STACKTOP + ((1 * i18 | 0) + 15 & -16) | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i17 = i1 + -1 | 0;
 i18 = i23 + -1 | 0;
 __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i8, i2);
 __THREW__ = 0;
 invoke_vii(8, i7 | 0, HEAP32[i22 >> 2] | 0);
 i16 = __THREW__;
 __THREW__ = 0;
 if (i16 & 1) {
  i3 = ___cxa_find_matching_catch() | 0;
  i4 = HEAP32[i8 >> 2] | 0;
  if (!i4) {
   i27 = i3;
   ___resumeException(i27 | 0);
  }
  i1 = i8 + 4 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
  __ZdlPv(i4);
  i27 = i3;
  ___resumeException(i27 | 0);
 }
 i16 = i22 + 12 | 0;
 i1 = HEAP32[i16 >> 2] | 0;
 if ((i1 | 0) > 0) {
  i2 = HEAP32[i8 >> 2] | 0;
  i3 = HEAP32[i7 >> 2] | 0;
  d5 = 0.0;
  i4 = 0;
  do {
   d6 = +HEAPF64[i2 + (i4 << 3) >> 3] - +HEAPF64[i3 + (i4 << 3) >> 3];
   d5 = d5 + d6 * d6;
   i4 = i4 + 1 | 0;
  } while ((i4 | 0) != (i1 | 0));
  i4 = i3;
 } else {
  i4 = HEAP32[i7 >> 2] | 0;
  d5 = 0.0;
 }
 d5 = +Math_sqrt(+d5);
 HEAPF64[i24 >> 3] = d5;
 i3 = i4;
 if (i4) {
  i1 = i7 + 4 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i3 | 0) >>> 3) << 3);
  __ZdlPv(i4);
 }
 i3 = HEAP32[i8 >> 2] | 0;
 i4 = i3;
 if (i3) {
  i1 = i8 + 4 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
  __ZdlPv(i3);
 }
 i15 = (i9 | 0) < 24;
 L29 : do if (!i15) {
  i9 = i12 + 4 | 0;
  i8 = i11 + 4 | 0;
  d6 = d5;
  i7 = 1;
  while (1) {
   __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i12, HEAP32[i21 >> 2] | 0);
   __THREW__ = 0;
   invoke_vii(8, i11 | 0, (HEAP32[i22 >> 2] | 0) + (i7 * 12 | 0) | 0);
   i14 = __THREW__;
   __THREW__ = 0;
   if (i14 & 1) break;
   i1 = HEAP32[i16 >> 2] | 0;
   if ((i1 | 0) > 0) {
    i2 = HEAP32[i12 >> 2] | 0;
    i3 = HEAP32[i11 >> 2] | 0;
    d5 = 0.0;
    i4 = 0;
    do {
     d28 = +HEAPF64[i2 + (i4 << 3) >> 3] - +HEAPF64[i3 + (i4 << 3) >> 3];
     d5 = d5 + d28 * d28;
     i4 = i4 + 1 | 0;
    } while ((i4 | 0) != (i1 | 0));
   } else {
    i3 = HEAP32[i11 >> 2] | 0;
    d5 = 0.0;
   }
   d6 = d6 + +Math_sqrt(+d5);
   HEAPF64[i24 + (i7 << 3) >> 3] = d6;
   i1 = i3;
   if (i3) {
    i2 = HEAP32[i8 >> 2] | 0;
    if ((i2 | 0) != (i3 | 0)) HEAP32[i8 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
    __ZdlPv(i3);
   }
   i3 = HEAP32[i12 >> 2] | 0;
   i1 = i3;
   if (i3) {
    i2 = HEAP32[i9 >> 2] | 0;
    if ((i2 | 0) != (i3 | 0)) HEAP32[i9 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
    __ZdlPv(i3);
   }
   if ((i7 | 0) >= (i18 | 0)) break L29; else i7 = i7 + 1 | 0;
  }
  i3 = ___cxa_find_matching_catch() | 0;
  i1 = HEAP32[i12 >> 2] | 0;
  if (!i1) {
   i27 = i3;
   ___resumeException(i27 | 0);
  }
  i2 = HEAP32[i9 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) HEAP32[i9 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
  __ZdlPv(i1);
  i27 = i3;
  ___resumeException(i27 | 0);
 } while (0);
 if ((i10 | 0) < 24) {
  i27 = Math_imul(i23, i17) | 0;
  i27 = i27 + i18 | 0;
  i27 = i24 + (i27 << 3) | 0;
  d28 = +HEAPF64[i27 >> 3];
  STACKTOP = i25;
  return +d28;
 }
 i13 = i26 + 4 | 0;
 i14 = i27 + 4 | 0;
 i10 = i20 + 4 | 0;
 i11 = i19 + 4 | 0;
 i12 = 1;
 L64 : while (1) {
  i9 = Math_imul(i12 + -1 | 0, i23) | 0;
  d6 = +HEAPF64[i24 + (i9 << 3) >> 3];
  __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i26, (HEAP32[i21 >> 2] | 0) + (i12 * 12 | 0) | 0);
  __THREW__ = 0;
  invoke_vii(8, i19 | 0, HEAP32[i22 >> 2] | 0);
  i8 = __THREW__;
  __THREW__ = 0;
  if (i8 & 1) {
   i1 = 68;
   break;
  }
  i1 = HEAP32[i16 >> 2] | 0;
  if ((i1 | 0) > 0) {
   i2 = HEAP32[i26 >> 2] | 0;
   i3 = HEAP32[i19 >> 2] | 0;
   d5 = 0.0;
   i4 = 0;
   do {
    d28 = +HEAPF64[i2 + (i4 << 3) >> 3] - +HEAPF64[i3 + (i4 << 3) >> 3];
    d5 = d5 + d28 * d28;
    i4 = i4 + 1 | 0;
   } while ((i4 | 0) != (i1 | 0));
  } else {
   i3 = HEAP32[i19 >> 2] | 0;
   d5 = 0.0;
  }
  d28 = d6 + +Math_sqrt(+d5);
  i8 = Math_imul(i12, i23) | 0;
  HEAPF64[i24 + (i8 << 3) >> 3] = d28;
  i1 = i3;
  if (i3) {
   i2 = HEAP32[i11 >> 2] | 0;
   if ((i2 | 0) != (i3 | 0)) HEAP32[i11 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
   __ZdlPv(i3);
  }
  i1 = HEAP32[i26 >> 2] | 0;
  i2 = i1;
  if (i1) {
   i3 = HEAP32[i13 >> 2] | 0;
   if ((i3 | 0) != (i1 | 0)) HEAP32[i13 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
   __ZdlPv(i1);
  }
  if (!i15) {
   i7 = 1;
   while (1) {
    i4 = i7 + -1 | 0;
    d6 = +_fmin(+HEAPF64[i24 + (i4 + i9 << 3) >> 3], +HEAPF64[i24 + (i4 + i8 << 3) >> 3]);
    __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i27, (HEAP32[i21 >> 2] | 0) + (i12 * 12 | 0) | 0);
    __THREW__ = 0;
    invoke_vii(8, i20 | 0, (HEAP32[i22 >> 2] | 0) + (i7 * 12 | 0) | 0);
    i4 = __THREW__;
    __THREW__ = 0;
    if (i4 & 1) {
     i1 = 72;
     break L64;
    }
    i1 = HEAP32[i16 >> 2] | 0;
    if ((i1 | 0) > 0) {
     i2 = HEAP32[i27 >> 2] | 0;
     i3 = HEAP32[i20 >> 2] | 0;
     d5 = 0.0;
     i4 = 0;
     do {
      d28 = +HEAPF64[i2 + (i4 << 3) >> 3] - +HEAPF64[i3 + (i4 << 3) >> 3];
      d5 = d5 + d28 * d28;
      i4 = i4 + 1 | 0;
     } while ((i4 | 0) != (i1 | 0));
    } else {
     i3 = HEAP32[i20 >> 2] | 0;
     d5 = 0.0;
    }
    d28 = d6 + +Math_sqrt(+d5);
    HEAPF64[i24 + (i7 + i8 << 3) >> 3] = d28;
    i1 = i3;
    if (i3) {
     i2 = HEAP32[i10 >> 2] | 0;
     if ((i2 | 0) != (i3 | 0)) HEAP32[i10 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
     __ZdlPv(i3);
    }
    i1 = HEAP32[i27 >> 2] | 0;
    i2 = i1;
    if (i1) {
     i3 = HEAP32[i14 >> 2] | 0;
     if ((i3 | 0) != (i1 | 0)) HEAP32[i14 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
     __ZdlPv(i1);
    }
    if ((i7 | 0) < (i18 | 0)) i7 = i7 + 1 | 0; else break;
   }
  }
  if ((i12 | 0) < (i17 | 0)) i12 = i12 + 1 | 0; else {
   i1 = 77;
   break;
  }
 }
 if ((i1 | 0) == 68) {
  i3 = ___cxa_find_matching_catch() | 0;
  i1 = HEAP32[i26 >> 2] | 0;
  if (!i1) {
   i27 = i3;
   ___resumeException(i27 | 0);
  }
  i2 = HEAP32[i13 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) HEAP32[i13 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
  __ZdlPv(i1);
  i27 = i3;
  ___resumeException(i27 | 0);
 } else if ((i1 | 0) == 72) {
  i3 = ___cxa_find_matching_catch() | 0;
  i1 = HEAP32[i27 >> 2] | 0;
  if (!i1) {
   i27 = i3;
   ___resumeException(i27 | 0);
  }
  i2 = HEAP32[i14 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) HEAP32[i14 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
  __ZdlPv(i1);
  i27 = i3;
  ___resumeException(i27 | 0);
 } else if ((i1 | 0) == 77) {
  i27 = Math_imul(i23, i17) | 0;
  i27 = i27 + i18 | 0;
  i27 = i24 + (i27 << 3) | 0;
  d28 = +HEAPF64[i27 >> 3];
  STACKTOP = i25;
  return +d28;
 }
 return +(0.0);
}

function __ZN17svmClassification5trainERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE(i20, i19) {
 i20 = i20 | 0;
 i19 = i19 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, d6 = 0.0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i21 = 0, i22 = 0, i23 = 0;
 i22 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i23 = i22 + 28 | 0;
 i21 = i22 + 16 | 0;
 i12 = i22 + 8 | 0;
 i13 = i22;
 __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i23, HEAP32[i19 >> 2] | 0);
 __THREW__ = 0;
 invoke_vii(8, i21 | 0, HEAP32[i19 >> 2] | 0);
 i17 = __THREW__;
 __THREW__ = 0;
 if (!(i17 & 1)) {
  i15 = i19 + 4 | 0;
  i11 = HEAP32[i19 >> 2] | 0;
  i1 = (HEAP32[i15 >> 2] | 0) - i11 | 0;
  if ((i1 | 0) > 24 ? (i7 = HEAP32[i20 + 124 >> 2] | 0, i8 = (i1 | 0) / 24 | 0, i9 = HEAP32[i23 >> 2] | 0, i10 = HEAP32[i21 >> 2] | 0, (i7 | 0) > 0) : 0) {
   i5 = 1;
   do {
    i3 = HEAP32[i11 + (i5 * 24 | 0) >> 2] | 0;
    i4 = 0;
    do {
     i1 = i3 + (i4 << 3) | 0;
     d6 = +HEAPF64[i1 >> 3];
     i2 = i9 + (i4 << 3) | 0;
     if (d6 > +HEAPF64[i2 >> 3]) {
      HEAPF64[i2 >> 3] = d6;
      d6 = +HEAPF64[i1 >> 3];
     }
     i1 = i10 + (i4 << 3) | 0;
     if (d6 < +HEAPF64[i1 >> 3]) HEAPF64[i1 >> 3] = d6;
     i4 = i4 + 1 | 0;
    } while ((i4 | 0) < (i7 | 0));
    i5 = i5 + 1 | 0;
   } while ((i5 | 0) < (i8 | 0));
  }
  i17 = i20 + 128 | 0;
  i4 = HEAP32[i17 >> 2] | 0;
  i10 = i20 + 132 | 0;
  i1 = HEAP32[i10 >> 2] | 0;
  if ((i1 | 0) == (i4 | 0)) i1 = i4; else {
   i1 = i1 + (~((i1 + -8 - i4 | 0) >>> 3) << 3) | 0;
   HEAP32[i10 >> 2] = i1;
  }
  i16 = i20 + 140 | 0;
  i2 = HEAP32[i16 >> 2] | 0;
  i9 = i20 + 144 | 0;
  i3 = HEAP32[i9 >> 2] | 0;
  if ((i3 | 0) != (i2 | 0)) HEAP32[i9 >> 2] = i3 + (~((i3 + -8 - i2 | 0) >>> 3) << 3);
  i8 = i20 + 124 | 0;
  do if ((HEAP32[i8 >> 2] | 0) > 0) {
   i5 = i20 + 136 | 0;
   i7 = i20 + 148 | 0;
   i4 = 0;
   while (1) {
    i3 = HEAP32[i23 >> 2] | 0;
    i2 = HEAP32[i21 >> 2] | 0;
    d6 = (+HEAPF64[i3 + (i4 << 3) >> 3] - +HEAPF64[i2 + (i4 << 3) >> 3]) * .5;
    HEAPF64[i12 >> 3] = d6;
    if (i1 >>> 0 < (HEAP32[i5 >> 2] | 0) >>> 0) {
     HEAPF64[i1 >> 3] = d6;
     HEAP32[i10 >> 2] = i1 + 8;
     i1 = i3;
    } else {
     __THREW__ = 0;
     invoke_vii(7, i17 | 0, i12 | 0);
     i14 = __THREW__;
     __THREW__ = 0;
     if (i14 & 1) {
      i2 = 13;
      break;
     }
     i2 = HEAP32[i21 >> 2] | 0;
     i1 = HEAP32[i23 >> 2] | 0;
    }
    d6 = (+HEAPF64[i1 + (i4 << 3) >> 3] + +HEAPF64[i2 + (i4 << 3) >> 3]) * .5;
    HEAPF64[i13 >> 3] = d6;
    i1 = HEAP32[i9 >> 2] | 0;
    if (i1 >>> 0 >= (HEAP32[i7 >> 2] | 0) >>> 0) {
     __THREW__ = 0;
     invoke_vii(7, i16 | 0, i13 | 0);
     i14 = __THREW__;
     __THREW__ = 0;
     if (i14 & 1) {
      i2 = 13;
      break;
     }
    } else {
     HEAPF64[i1 >> 3] = d6;
     HEAP32[i9 >> 2] = i1 + 8;
    }
    i4 = i4 + 1 | 0;
    i1 = HEAP32[i10 >> 2] | 0;
    if ((i4 | 0) >= (HEAP32[i8 >> 2] | 0)) {
     i2 = 25;
     break;
    }
   }
   if ((i2 | 0) == 13) {
    i3 = ___cxa_find_matching_catch() | 0;
    break;
   } else if ((i2 | 0) == 25) {
    i4 = HEAP32[i17 >> 2] | 0;
    i2 = 26;
    break;
   }
  } else i2 = 26; while (0);
  L40 : do if ((i2 | 0) == 26) {
   if ((i1 | 0) != (i4 | 0)) {
    i2 = i1 - i4 >> 3;
    i3 = 0;
    do {
     i1 = i4 + (i3 << 3) | 0;
     if (+HEAPF64[i1 >> 3] == 0.0) HEAPF64[i1 >> 3] = 1.0;
     i3 = i3 + 1 | 0;
    } while (i3 >>> 0 < i2 >>> 0);
   }
   i12 = i20 + 112 | 0;
   i13 = i20 + 120 | 0;
   HEAP32[i13 >> 2] = 0;
   i14 = i20 + 116 | 0;
   HEAP32[i14 >> 2] = 0;
   i4 = HEAP32[i19 >> 2] | 0;
   i1 = (HEAP32[i15 >> 2] | 0) - i4 | 0;
   i10 = (i1 | 0) / 24 | 0;
   i2 = (HEAP32[i4 + 4 >> 2] | 0) - (HEAP32[i4 >> 2] | 0) | 0;
   i11 = i2 >> 3;
   HEAP32[i12 >> 2] = i10;
   __THREW__ = 0;
   i3 = invoke_ii(19, (i10 >>> 0 > 1073741823 ? -1 : i10 << 2) | 0) | 0;
   i15 = __THREW__;
   __THREW__ = 0;
   if (!(i15 & 1) ? (HEAP32[i13 >> 2] = i3, __THREW__ = 0, i18 = invoke_ii(19, (i10 >>> 0 > 536870911 ? -1 : i10 << 3) | 0) | 0, i15 = __THREW__, __THREW__ = 0, !(i15 & 1)) : 0) {
    HEAP32[i14 >> 2] = i18;
    L53 : do if ((i1 | 0) > 0) {
     i9 = i11 + 1 | 0;
     i9 = i9 >>> 0 > 268435455 ? -1 : i9 << 4;
     if ((i2 | 0) > 0) {
      i2 = i18;
      i8 = 0;
     } else {
      i5 = i4;
      i4 = i18;
      i2 = 0;
      while (1) {
       HEAPF64[i4 + (i2 << 3) >> 3] = +HEAPF64[HEAP32[i5 + (i2 * 24 | 0) + 12 >> 2] >> 3];
       __THREW__ = 0;
       i1 = invoke_ii(19, i9 | 0) | 0;
       i18 = __THREW__;
       __THREW__ = 0;
       if (i18 & 1) break;
       HEAP32[i3 + (i2 << 2) >> 2] = i1;
       i1 = HEAP32[i13 >> 2] | 0;
       i18 = HEAP32[i1 + (i2 << 2) >> 2] | 0;
       HEAP32[i18 + (i11 << 4) >> 2] = -1;
       HEAPF64[i18 + (i11 << 4) + 8 >> 3] = 0.0;
       i2 = i2 + 1 | 0;
       if ((i2 | 0) >= (i10 | 0)) break L53;
       i5 = HEAP32[i19 >> 2] | 0;
       i4 = HEAP32[i14 >> 2] | 0;
       i3 = i1;
      }
      i3 = ___cxa_find_matching_catch() | 0;
      break L40;
     }
     while (1) {
      HEAPF64[i2 + (i8 << 3) >> 3] = +HEAPF64[HEAP32[i4 + (i8 * 24 | 0) + 12 >> 2] >> 3];
      __THREW__ = 0;
      i1 = invoke_ii(19, i9 | 0) | 0;
      i18 = __THREW__;
      __THREW__ = 0;
      if (i18 & 1) break;
      HEAP32[i3 + (i8 << 2) >> 2] = i1;
      i3 = HEAP32[i13 >> 2] | 0;
      i1 = HEAP32[i3 + (i8 << 2) >> 2] | 0;
      i2 = HEAP32[(HEAP32[i19 >> 2] | 0) + (i8 * 24 | 0) >> 2] | 0;
      i4 = HEAP32[i16 >> 2] | 0;
      i5 = HEAP32[i17 >> 2] | 0;
      i7 = 0;
      do {
       i18 = i7;
       i7 = i7 + 1 | 0;
       HEAP32[i1 + (i18 << 4) >> 2] = i7;
       HEAPF64[i1 + (i18 << 4) + 8 >> 3] = (+HEAPF64[i2 + (i18 << 3) >> 3] - +HEAPF64[i4 + (i18 << 3) >> 3]) / +HEAPF64[i5 + (i18 << 3) >> 3];
      } while ((i7 | 0) < (i11 | 0));
      HEAP32[i1 + (i11 << 4) >> 2] = -1;
      HEAPF64[i1 + (i11 << 4) + 8 >> 3] = 0.0;
      i1 = i8 + 1 | 0;
      if ((i1 | 0) >= (i10 | 0)) break L53;
      i4 = HEAP32[i19 >> 2] | 0;
      i2 = HEAP32[i14 >> 2] | 0;
      i8 = i1;
     }
     i3 = ___cxa_find_matching_catch() | 0;
     break L40;
    } while (0);
    __THREW__ = 0;
    i1 = invoke_iii(17, i12 | 0, i20 + 16 | 0) | 0;
    i19 = __THREW__;
    __THREW__ = 0;
    if (!(i19 & 1)) {
     HEAP32[i20 + 8 >> 2] = i1;
     HEAP8[i20 + 152 >> 0] = 1;
     i3 = HEAP32[i21 >> 2] | 0;
     i4 = i3;
     if (i3) {
      i1 = i21 + 4 | 0;
      i2 = HEAP32[i1 >> 2] | 0;
      if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
      __ZdlPv(i3);
     }
     i3 = HEAP32[i23 >> 2] | 0;
     if (!i3) {
      STACKTOP = i22;
      return;
     }
     i1 = i23 + 4 | 0;
     i2 = HEAP32[i1 >> 2] | 0;
     if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i3 | 0) >>> 3) << 3);
     __ZdlPv(i3);
     STACKTOP = i22;
     return;
    }
   }
   i3 = ___cxa_find_matching_catch() | 0;
  } while (0);
  i4 = HEAP32[i21 >> 2] | 0;
  i5 = i4;
  if (i4) {
   i1 = i21 + 4 | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i5 | 0) >>> 3) << 3);
   __ZdlPv(i4);
  }
 } else i3 = ___cxa_find_matching_catch() | 0;
 i4 = HEAP32[i23 >> 2] | 0;
 if (!i4) ___resumeException(i3 | 0);
 i1 = i23 + 4 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
 __ZdlPv(i4);
 ___resumeException(i3 | 0);
}

function __ZN10regression5trainERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE(i19, i20) {
 i19 = i19 | 0;
 i20 = i20 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i21 = 0, i22 = 0;
 i22 = STACKTOP;
 STACKTOP = STACKTOP + 80 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i6 = i22 + 60 | 0;
 i7 = i22 + 48 | 0;
 i13 = i22 + 24 | 0;
 i21 = i22 + 12 | 0;
 i14 = i22 + 8 | 0;
 i16 = i22 + 4 | 0;
 i17 = i22;
 i18 = i19 + 36 | 0;
 if (HEAP8[i18 >> 0] | 0) {
  i21 = __ZN8modelSet5trainERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE(i19, i20) | 0;
  STACKTOP = i22;
  return i21 | 0;
 }
 i2 = HEAP32[i20 >> 2] | 0;
 i12 = (HEAP32[i2 + 4 >> 2] | 0) - (HEAP32[i2 >> 2] | 0) | 0;
 i1 = i12 >> 3;
 i15 = i19 + 16 | 0;
 HEAP32[i15 >> 2] = i1;
 do if ((i12 | 0) > 0) {
  i2 = i19 + 24 | 0;
  i3 = i19 + 28 | 0;
  i4 = i19 + 20 | 0;
  i5 = 0;
  while (1) {
   i5 = i5 + 1 | 0;
   __ZNSt3__19to_stringEi(i7, i5);
   __THREW__ = 0;
   i1 = invoke_iiii(16, i7 | 0, 0, 4451) | 0;
   i12 = __THREW__;
   __THREW__ = 0;
   if (i12 & 1) {
    i2 = 10;
    break;
   };
   HEAP32[i6 >> 2] = HEAP32[i1 >> 2];
   HEAP32[i6 + 4 >> 2] = HEAP32[i1 + 4 >> 2];
   HEAP32[i6 + 8 >> 2] = HEAP32[i1 + 8 >> 2];
   HEAP32[i1 >> 2] = 0;
   HEAP32[i1 + 4 >> 2] = 0;
   HEAP32[i1 + 8 >> 2] = 0;
   i1 = HEAP32[i2 >> 2] | 0;
   if (i1 >>> 0 >= (HEAP32[i3 >> 2] | 0) >>> 0) {
    __THREW__ = 0;
    invoke_vii(15, i4 | 0, i6 | 0);
    i12 = __THREW__;
    __THREW__ = 0;
    if (i12 & 1) {
     i2 = 11;
     break;
    }
   } else {
    HEAP32[i1 >> 2] = HEAP32[i6 >> 2];
    HEAP32[i1 + 4 >> 2] = HEAP32[i6 + 4 >> 2];
    HEAP32[i1 + 8 >> 2] = HEAP32[i6 + 8 >> 2];
    HEAP32[i6 >> 2] = 0;
    HEAP32[i6 + 4 >> 2] = 0;
    HEAP32[i6 + 8 >> 2] = 0;
    HEAP32[i2 >> 2] = (HEAP32[i2 >> 2] | 0) + 12;
   }
   __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i6);
   __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i7);
   i1 = HEAP32[i15 >> 2] | 0;
   if ((i5 | 0) >= (i1 | 0)) {
    i2 = 13;
    break;
   }
  }
  if ((i2 | 0) == 10) i1 = ___cxa_find_matching_catch() | 0; else if ((i2 | 0) == 11) {
   i1 = ___cxa_find_matching_catch() | 0;
   __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i6);
  } else if ((i2 | 0) == 13) {
   i2 = HEAP32[i20 >> 2] | 0;
   break;
  }
  __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i7);
  i22 = i1;
  ___resumeException(i22 | 0);
 } while (0);
 i12 = i19 + 32 | 0;
 HEAP32[i12 >> 2] = (HEAP32[i2 + 16 >> 2] | 0) - (HEAP32[i2 + 12 >> 2] | 0) >> 3;
 i8 = HEAP32[i20 + 4 >> 2] | 0;
 do if ((i2 | 0) != (i8 | 0)) {
  i7 = i13 + 12 | 0;
  i11 = i13 + 4 | 0;
  i10 = i13 + 16 | 0;
  i9 = i13 + 12 | 0;
  while (1) {
   __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i13, i2);
   __THREW__ = 0;
   invoke_vii(8, i7 | 0, i2 + 12 | 0);
   i6 = __THREW__;
   __THREW__ = 0;
   if (i6 & 1) {
    i2 = 18;
    break;
   }
   i1 = HEAP32[i13 >> 2] | 0;
   if (((HEAP32[i11 >> 2] | 0) - i1 >> 3 | 0) != (HEAP32[i15 >> 2] | 0)) {
    i2 = 63;
    break;
   }
   i3 = HEAP32[i10 >> 2] | 0;
   i4 = HEAP32[i7 >> 2] | 0;
   i5 = i4;
   i6 = (i3 - i5 >> 3 | 0) == (HEAP32[i12 >> 2] | 0);
   if (i4) {
    if ((i3 | 0) != (i4 | 0)) HEAP32[i10 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
    __ZdlPv(i4);
    i1 = HEAP32[i13 >> 2] | 0;
   }
   i3 = i1;
   if (i1) {
    i4 = HEAP32[i11 >> 2] | 0;
    if ((i4 | 0) != (i1 | 0)) HEAP32[i11 >> 2] = i4 + (~((i4 + -8 - i3 | 0) >>> 3) << 3);
    __ZdlPv(i1);
   }
   i2 = i2 + 24 | 0;
   if (!i6) {
    i1 = 0;
    i2 = 71;
    break;
   }
   if ((i2 | 0) == (i8 | 0)) {
    i2 = 33;
    break;
   }
  }
  if ((i2 | 0) == 18) {
   i3 = ___cxa_find_matching_catch() | 0;
   i1 = HEAP32[i13 >> 2] | 0;
   if (!i1) ___resumeException(i3 | 0);
   i2 = HEAP32[i11 >> 2] | 0;
   if ((i2 | 0) != (i1 | 0)) HEAP32[i11 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
   __ZdlPv(i1);
   ___resumeException(i3 | 0);
  } else if ((i2 | 0) == 33) {
   i1 = HEAP32[i15 >> 2] | 0;
   break;
  } else if ((i2 | 0) == 63) {
   i2 = HEAP32[i9 >> 2] | 0;
   i3 = i2;
   if (i2) {
    i1 = HEAP32[i10 >> 2] | 0;
    if ((i1 | 0) != (i2 | 0)) HEAP32[i10 >> 2] = i1 + (~((i1 + -8 - i3 | 0) >>> 3) << 3);
    __ZdlPv(i2);
    i1 = HEAP32[i13 >> 2] | 0;
   }
   if (!i1) {
    i21 = 0;
    STACKTOP = i22;
    return i21 | 0;
   }
   i2 = HEAP32[i11 >> 2] | 0;
   if ((i2 | 0) != (i1 | 0)) HEAP32[i11 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
   __ZdlPv(i1);
   i21 = 0;
   STACKTOP = i22;
   return i21 | 0;
  } else if ((i2 | 0) == 71) {
   STACKTOP = i22;
   return i1 | 0;
  }
 } while (0);
 HEAP32[i21 >> 2] = 0;
 i7 = i21 + 4 | 0;
 HEAP32[i7 >> 2] = 0;
 HEAP32[i21 + 8 >> 2] = 0;
 HEAP32[i14 >> 2] = 0;
 L66 : do if ((i1 | 0) > 0) {
  i2 = i21 + 8 | 0;
  i3 = 0;
  i4 = 0;
  i1 = 0;
  while (1) {
   if ((i3 | 0) == (i4 | 0)) {
    __THREW__ = 0;
    invoke_vii(13, i21 | 0, i14 | 0);
    i13 = __THREW__;
    __THREW__ = 0;
    if (i13 & 1) break;
   } else {
    HEAP32[i3 >> 2] = i1;
    HEAP32[i7 >> 2] = i3 + 4;
   }
   i1 = i1 + 1 | 0;
   HEAP32[i14 >> 2] = i1;
   if ((i1 | 0) >= (HEAP32[i15 >> 2] | 0)) {
    i2 = 36;
    break L66;
   }
   i3 = HEAP32[i7 >> 2] | 0;
   i4 = HEAP32[i2 >> 2] | 0;
  }
  i1 = ___cxa_find_matching_catch() | 0;
  i2 = 46;
 } else i2 = 36; while (0);
 L76 : do if ((i2 | 0) == 36) {
  L78 : do if ((HEAP32[i12 >> 2] | 0) > 0) {
   i2 = i19 + 4 | 0;
   i3 = i19 + 8 | 0;
   i4 = i19 + 12 | 0;
   i6 = 0;
   while (1) {
    __THREW__ = 0;
    i1 = invoke_ii(12, 192) | 0;
    i14 = __THREW__;
    __THREW__ = 0;
    if (i14 & 1) {
     i2 = 43;
     break;
    }
    HEAP32[i17 >> 2] = 1;
    __THREW__ = 0;
    invoke_viiiii(4, i1 | 0, i15 | 0, i21 | 0, i17 | 0, i15 | 0);
    i14 = __THREW__;
    __THREW__ = 0;
    if (i14 & 1) {
     i2 = 53;
     break;
    }
    HEAP32[i16 >> 2] = i1;
    i5 = HEAP32[i3 >> 2] | 0;
    if (i5 >>> 0 >= (HEAP32[i4 >> 2] | 0) >>> 0) {
     __THREW__ = 0;
     invoke_vii(14, i2 | 0, i16 | 0);
     i14 = __THREW__;
     __THREW__ = 0;
     if (i14 & 1) {
      i2 = 43;
      break;
     }
    } else {
     HEAP32[i5 >> 2] = i1;
     HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) + 4;
    }
    i6 = i6 + 1 | 0;
    if ((i6 | 0) >= (HEAP32[i12 >> 2] | 0)) break L78;
   }
   if ((i2 | 0) == 43) {
    i1 = ___cxa_find_matching_catch() | 0;
    i2 = 46;
    break L76;
   } else if ((i2 | 0) == 53) {
    i3 = ___cxa_find_matching_catch() | 0;
    __ZdlPv(i1);
    break L76;
   }
  } while (0);
  HEAP8[i18 >> 0] = 1;
  __THREW__ = 0;
  i3 = invoke_iii(1, i19 | 0, i20 | 0) | 0;
  i20 = __THREW__;
  __THREW__ = 0;
  if (i20 & 1) {
   i1 = ___cxa_find_matching_catch() | 0;
   i2 = 46;
   break;
  }
  i1 = HEAP32[i21 >> 2] | 0;
  if (!i1) {
   i21 = i3;
   STACKTOP = i22;
   return i21 | 0;
  }
  i2 = HEAP32[i7 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) HEAP32[i7 >> 2] = i2 + (~((i2 + -4 - i1 | 0) >>> 2) << 2);
  __ZdlPv(i1);
  i21 = i3;
  STACKTOP = i22;
  return i21 | 0;
 } while (0);
 if ((i2 | 0) == 46) i3 = i1;
 i1 = HEAP32[i21 >> 2] | 0;
 if (!i1) {
  i22 = i3;
  ___resumeException(i22 | 0);
 }
 i2 = HEAP32[i7 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) HEAP32[i7 >> 2] = i2 + (~((i2 + -4 - i1 | 0) >>> 2) << 2);
 __ZdlPv(i1);
 i22 = i3;
 ___resumeException(i22 | 0);
 return 0;
}

function _svm_cross_validation(i19, i24, i1, i26) {
 i19 = i19 | 0;
 i24 = i24 | 0;
 i1 = i1 | 0;
 i26 = i26 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i25 = 0, i27 = 0, i28 = 0, d29 = 0.0;
 i27 = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i3 = i27 + 24 | 0;
 i18 = i27 + 20 | 0;
 i17 = i27 + 16 | 0;
 i16 = i27 + 12 | 0;
 i25 = i27;
 i22 = HEAP32[i19 >> 2] | 0;
 i2 = i22 << 2;
 i23 = _malloc(i2) | 0;
 if ((i22 | 0) < (i1 | 0)) {
  _fwrite(5178, 100, 1, HEAP32[619] | 0) | 0;
  i20 = i22;
 } else i20 = i1;
 i1 = i20 << 2;
 i21 = _malloc(i1 + 4 | 0) | 0;
 if (!((i20 | 0) < (i22 | 0) & (HEAP32[i24 >> 2] | 0) >>> 0 < 2)) {
  i1 = (i22 | 0) > 0;
  if (i1) {
   i2 = 0;
   do {
    HEAP32[i23 + (i2 << 2) >> 2] = i2;
    i2 = i2 + 1 | 0;
   } while ((i2 | 0) != (i22 | 0));
   if (i1) {
    i1 = 0;
    do {
     i16 = i23 + (i1 << 2) | 0;
     i18 = i23 + (((_rand() | 0) % (i22 - i1 | 0) | 0) + i1 << 2) | 0;
     i17 = HEAP32[i16 >> 2] | 0;
     HEAP32[i16 >> 2] = HEAP32[i18 >> 2];
     HEAP32[i18 >> 2] = i17;
     i1 = i1 + 1 | 0;
    } while ((i1 | 0) != (i22 | 0));
   }
  }
  if ((i20 | 0) < 0) {
   _free(i21);
   _free(i23);
   STACKTOP = i27;
   return;
  } else {
   i1 = 0;
   while (1) {
    i18 = (Math_imul(i1, i22) | 0) / (i20 | 0) | 0;
    HEAP32[i21 + (i1 << 2) >> 2] = i18;
    if ((i1 | 0) == (i20 | 0)) break; else i1 = i1 + 1 | 0;
   }
  }
 } else {
  HEAP32[i18 >> 2] = 0;
  HEAP32[i17 >> 2] = 0;
  HEAP32[i16 >> 2] = 0;
  __ZN6LIBSVML17svm_group_classesEPKNS_11svm_problemEPiPS3_S4_S4_S3_(i19, i3, i17, i18, i16, i23);
  i15 = _malloc(i1) | 0;
  i14 = _malloc(i2) | 0;
  if ((i22 | 0) > 0) _memcpy(i14 | 0, i23 | 0, i22 << 2 | 0) | 0;
  i13 = HEAP32[i3 >> 2] | 0;
  i7 = (i13 | 0) > 0;
  if (i7) {
   i1 = HEAP32[i16 >> 2] | 0;
   i2 = HEAP32[i18 >> 2] | 0;
   i5 = 0;
   do {
    i3 = i1 + (i5 << 2) | 0;
    if ((HEAP32[i3 >> 2] | 0) > 0) {
     i4 = i2 + (i5 << 2) | 0;
     i6 = 0;
     do {
      i9 = _rand() | 0;
      i12 = HEAP32[i3 >> 2] | 0;
      i11 = HEAP32[i4 >> 2] | 0;
      i9 = i14 + (((i9 | 0) % (i12 - i6 | 0) | 0) + i6 + i11 << 2) | 0;
      i11 = i14 + (i11 + i6 << 2) | 0;
      i10 = HEAP32[i9 >> 2] | 0;
      HEAP32[i9 >> 2] = HEAP32[i11 >> 2];
      HEAP32[i11 >> 2] = i10;
      i6 = i6 + 1 | 0;
     } while ((i6 | 0) < (i12 | 0));
    }
    i5 = i5 + 1 | 0;
   } while ((i5 | 0) < (i13 | 0));
  }
  i12 = (i20 | 0) > 0;
  if (i12) {
   i4 = HEAP32[i16 >> 2] | 0;
   i6 = 0;
   do {
    i5 = i15 + (i6 << 2) | 0;
    HEAP32[i5 >> 2] = 0;
    i3 = i6;
    i6 = i6 + 1 | 0;
    if (i7) {
     i1 = 0;
     i2 = 0;
     do {
      i11 = HEAP32[i4 + (i2 << 2) >> 2] | 0;
      i1 = ((Math_imul(i11, i6) | 0) / (i20 | 0) | 0) - ((Math_imul(i11, i3) | 0) / (i20 | 0) | 0) + i1 | 0;
      i2 = i2 + 1 | 0;
     } while ((i2 | 0) != (i13 | 0));
     HEAP32[i5 >> 2] = i1;
    }
   } while ((i6 | 0) != (i20 | 0));
   HEAP32[i21 >> 2] = 0;
   i1 = (i20 | 0) < 1;
   if (i1) i1 = 1; else {
    i2 = 0;
    i3 = 1;
    while (1) {
     i2 = (HEAP32[i15 + (i3 + -1 << 2) >> 2] | 0) + i2 | 0;
     HEAP32[i21 + (i3 << 2) >> 2] = i2;
     if ((i3 | 0) == (i20 | 0)) break; else i3 = i3 + 1 | 0;
    }
   }
  } else {
   HEAP32[i21 >> 2] = 0;
   i1 = 1;
  }
  if (i7) {
   i2 = HEAP32[i18 >> 2] | 0;
   i3 = HEAP32[i16 >> 2] | 0;
   i9 = 0;
   do {
    if (i12) {
     i4 = HEAP32[i2 + (i9 << 2) >> 2] | 0;
     i5 = HEAP32[i3 + (i9 << 2) >> 2] | 0;
     i10 = 0;
     do {
      i6 = (Math_imul(i5, i10) | 0) / (i20 | 0) | 0;
      i7 = i6 + i4 | 0;
      i11 = i10;
      i10 = i10 + 1 | 0;
      i8 = (Math_imul(i5, i10) | 0) / (i20 | 0) | 0;
      if ((i7 | 0) < (i8 + i4 | 0)) {
       i11 = i21 + (i11 << 2) | 0;
       i28 = HEAP32[i11 >> 2] | 0;
       _memcpy(i23 + (i28 << 2) | 0, i14 + (i7 << 2) | 0, i8 - i6 << 2 | 0) | 0;
       HEAP32[i11 >> 2] = i28 + i8 - i6;
      }
     } while ((i10 | 0) != (i20 | 0));
    }
    i9 = i9 + 1 | 0;
   } while ((i9 | 0) < (i13 | 0));
  }
  HEAP32[i21 >> 2] = 0;
  if (!i1) {
   i1 = 0;
   i2 = 1;
   while (1) {
    i1 = (HEAP32[i15 + (i2 + -1 << 2) >> 2] | 0) + i1 | 0;
    HEAP32[i21 + (i2 << 2) >> 2] = i1;
    if ((i2 | 0) == (i20 | 0)) break; else i2 = i2 + 1 | 0;
   }
  }
  _free(HEAP32[i18 >> 2] | 0);
  _free(HEAP32[i17 >> 2] | 0);
  _free(HEAP32[i16 >> 2] | 0);
  _free(i14);
  _free(i15);
 }
 if ((i20 | 0) <= 0) {
  _free(i21);
  _free(i23);
  STACKTOP = i27;
  return;
 }
 i10 = i25 + 8 | 0;
 i11 = i25 + 4 | 0;
 i12 = i24 + 92 | 0;
 i13 = i19 + 8 | 0;
 i8 = i19 + 4 | 0;
 i7 = HEAP32[i21 >> 2] | 0;
 i9 = 0;
 do {
  i9 = i9 + 1 | 0;
  i1 = i7;
  i7 = HEAP32[i21 + (i9 << 2) >> 2] | 0;
  i3 = i1 - i7 + i22 | 0;
  HEAP32[i25 >> 2] = i3;
  i2 = _malloc(i3 << 2) | 0;
  HEAP32[i10 >> 2] = i2;
  i3 = _malloc(i3 << 3) | 0;
  HEAP32[i11 >> 2] = i3;
  if ((i1 | 0) > 0) {
   i4 = 0;
   do {
    i28 = HEAP32[i23 + (i4 << 2) >> 2] | 0;
    HEAP32[i2 + (i4 << 2) >> 2] = HEAP32[(HEAP32[i13 >> 2] | 0) + (i28 << 2) >> 2];
    HEAPF64[i3 + (i4 << 3) >> 3] = +HEAPF64[(HEAP32[i8 >> 2] | 0) + (i28 << 3) >> 3];
    i4 = i4 + 1 | 0;
   } while ((i4 | 0) != (i1 | 0));
   i2 = i1;
  } else i2 = 0;
  if ((i7 | 0) < (i22 | 0)) {
   i3 = HEAP32[i10 >> 2] | 0;
   i4 = HEAP32[i11 >> 2] | 0;
   i5 = i7;
   while (1) {
    i28 = HEAP32[i23 + (i5 << 2) >> 2] | 0;
    HEAP32[i3 + (i2 << 2) >> 2] = HEAP32[(HEAP32[i13 >> 2] | 0) + (i28 << 2) >> 2];
    HEAPF64[i4 + (i2 << 3) >> 3] = +HEAPF64[(HEAP32[i8 >> 2] | 0) + (i28 << 3) >> 3];
    i5 = i5 + 1 | 0;
    if ((i5 | 0) == (i22 | 0)) break; else i2 = i2 + 1 | 0;
   }
  }
  i6 = _svm_train(i25, i24) | 0;
  if ((HEAP32[i12 >> 2] | 0) != 0 ? (HEAP32[i24 >> 2] | 0) >>> 0 < 2 : 0) {
   i2 = _malloc(HEAP32[i6 + 96 >> 2] << 3) | 0;
   if ((i1 | 0) < (i7 | 0)) do {
    i28 = HEAP32[i23 + (i1 << 2) >> 2] | 0;
    d29 = +_svm_predict_probability(i6, HEAP32[(HEAP32[i13 >> 2] | 0) + (i28 << 2) >> 2] | 0, i2);
    HEAPF64[i26 + (i28 << 3) >> 3] = d29;
    i1 = i1 + 1 | 0;
   } while ((i1 | 0) != (i7 | 0));
   _free(i2);
   i1 = 56;
  } else if ((i1 | 0) < (i7 | 0)) {
   i5 = i6 + 96 | 0;
   do {
    i3 = HEAP32[i23 + (i1 << 2) >> 2] | 0;
    i4 = HEAP32[(HEAP32[i13 >> 2] | 0) + (i3 << 2) >> 2] | 0;
    i2 = HEAP32[i5 >> 2] | 0;
    if (((HEAP32[i6 >> 2] | 0) + -2 | 0) >>> 0 < 3) i2 = _malloc(8) | 0; else i2 = _malloc(((Math_imul(i2 + -1 | 0, i2) | 0) / 2 | 0) << 3) | 0;
    d29 = +_svm_predict_values(i6, i4, i2);
    _free(i2);
    HEAPF64[i26 + (i3 << 3) >> 3] = d29;
    i1 = i1 + 1 | 0;
   } while ((i1 | 0) != (i7 | 0));
   i1 = 57;
  } else i1 = 56;
  if ((i1 | 0) == 56 ? (i1 = 0, (i6 | 0) != 0) : 0) i1 = 57;
  if ((i1 | 0) == 57) {
   _svm_free_model_content(i6);
   _free(i6);
  }
  _free(HEAP32[i10 >> 2] | 0);
  _free(HEAP32[i11 >> 2] | 0);
 } while ((i9 | 0) != (i20 | 0));
 _free(i21);
 _free(i23);
 STACKTOP = i27;
 return;
}

function _svm_predict_probability(i23, i3, i20) {
 i23 = i23 | 0;
 i3 = i3 | 0;
 i20 = i20 | 0;
 var i1 = 0, i2 = 0, d4 = 0.0, i5 = 0, d6 = 0.0, d7 = 0.0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, d16 = 0.0, i17 = 0, i18 = 0, i19 = 0, i21 = 0, i22 = 0, i24 = 0, d25 = 0.0;
 i24 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i17 = i24;
 i2 = HEAP32[i23 >> 2] | 0;
 if ((i2 >>> 0 < 2 ? (i13 = i23 + 116 | 0, (HEAP32[i13 >> 2] | 0) != 0) : 0) ? (i15 = i23 + 120 | 0, (HEAP32[i15 >> 2] | 0) != 0) : 0) {
  i22 = HEAP32[i23 + 96 >> 2] | 0;
  i5 = i22 + -1 | 0;
  i21 = _malloc(((Math_imul(i5, i22) | 0) / 2 | 0) << 3) | 0;
  +_svm_predict_values(i23, i3, i21);
  i14 = i22 << 2;
  i19 = _malloc(i14) | 0;
  i18 = (i22 | 0) > 0;
  if (i18) {
   i1 = i22 << 3;
   i2 = 0;
   do {
    i12 = _malloc(i1) | 0;
    HEAP32[i19 + (i2 << 2) >> 2] = i12;
    i2 = i2 + 1 | 0;
   } while ((i2 | 0) != (i22 | 0));
   if (i18) {
    i12 = 0;
    i1 = 0;
    while (1) {
     i9 = i12;
     i12 = i12 + 1 | 0;
     if ((i12 | 0) < (i22 | 0)) {
      i2 = HEAP32[i13 >> 2] | 0;
      i3 = HEAP32[i15 >> 2] | 0;
      i8 = HEAP32[i19 + (i9 << 2) >> 2] | 0;
      i10 = i12;
      i11 = i1;
      while (1) {
       d4 = +HEAPF64[i21 + (i11 << 3) >> 3] * +HEAPF64[i2 + (i11 << 3) >> 3] + +HEAPF64[i3 + (i11 << 3) >> 3];
       if (!(d4 >= 0.0)) d4 = 1.0 / (+Math_exp(+d4) + 1.0); else {
        d4 = +Math_exp(+-d4);
        d4 = d4 / (d4 + 1.0);
       }
       d16 = d4 > 1.0e-07 ? d4 : 1.0e-07;
       d16 = d16 < .9999999 ? d16 : .9999999;
       HEAPF64[i8 + (i10 << 3) >> 3] = d16;
       HEAPF64[(HEAP32[i19 + (i10 << 2) >> 2] | 0) + (i9 << 3) >> 3] = 1.0 - d16;
       i10 = i10 + 1 | 0;
       if ((i10 | 0) == (i22 | 0)) break; else i11 = i11 + 1 | 0;
      }
      i1 = i1 + i5 | 0;
     }
     if ((i12 | 0) == (i22 | 0)) break; else i5 = i5 + -1 | 0;
    }
    if ((i22 | 0) == 2) {
     HEAPF64[i20 >> 3] = +HEAPF64[(HEAP32[i19 >> 2] | 0) + 8 >> 3];
     HEAPF64[i20 + 8 >> 3] = +HEAPF64[HEAP32[i19 + 4 >> 2] >> 3];
     i1 = 1;
     i2 = 0;
     i15 = 45;
    } else i15 = 18;
   } else i15 = 18;
  } else i15 = 18;
  if ((i15 | 0) == 18) {
   i11 = (i22 | 0) < 100 ? 100 : i22;
   i12 = _malloc(i14) | 0;
   i10 = i22 << 3;
   i13 = _malloc(i10) | 0;
   d4 = +(i22 | 0);
   d16 = .005 / d4;
   if (i18) {
    d4 = 1.0 / d4;
    i9 = 0;
    do {
     HEAPF64[i20 + (i9 << 3) >> 3] = d4;
     i5 = _malloc(i10) | 0;
     HEAP32[i12 + (i9 << 2) >> 2] = i5;
     i8 = i5 + (i9 << 3) | 0;
     HEAPF64[i8 >> 3] = 0.0;
     if ((i9 | 0) > 0 ? (d7 = +HEAPF64[(HEAP32[i19 >> 2] | 0) + (i9 << 3) >> 3], HEAPF64[i8 >> 3] = d7 * d7 + 0.0, HEAPF64[i5 >> 3] = +HEAPF64[(HEAP32[i12 >> 2] | 0) + (i9 << 3) >> 3], (i9 | 0) != 1) : 0) {
      i1 = 1;
      do {
       d7 = +HEAPF64[(HEAP32[i19 + (i1 << 2) >> 2] | 0) + (i9 << 3) >> 3];
       HEAPF64[i8 >> 3] = d7 * d7 + +HEAPF64[i8 >> 3];
       HEAPF64[i5 + (i1 << 3) >> 3] = +HEAPF64[(HEAP32[i12 + (i1 << 2) >> 2] | 0) + (i9 << 3) >> 3];
       i1 = i1 + 1 | 0;
      } while ((i1 | 0) != (i9 | 0));
     }
     i2 = i9;
     i9 = i9 + 1 | 0;
     if ((i9 | 0) < (i22 | 0)) {
      i1 = HEAP32[i19 + (i2 << 2) >> 2] | 0;
      i3 = i9;
      do {
       i14 = (HEAP32[i19 + (i3 << 2) >> 2] | 0) + (i2 << 3) | 0;
       d7 = +HEAPF64[i14 >> 3];
       HEAPF64[i8 >> 3] = d7 * d7 + +HEAPF64[i8 >> 3];
       HEAPF64[i5 + (i3 << 3) >> 3] = -(+HEAPF64[i14 >> 3] * +HEAPF64[i1 + (i3 << 3) >> 3]);
       i3 = i3 + 1 | 0;
      } while ((i3 | 0) != (i22 | 0));
     }
    } while ((i9 | 0) != (i22 | 0));
   }
   L41 : do if ((i11 | 0) > 0) {
    i8 = 0;
    while (1) {
     if (i18) {
      d4 = 0.0;
      i5 = 0;
      do {
       i3 = i13 + (i5 << 3) | 0;
       HEAPF64[i3 >> 3] = 0.0;
       i1 = HEAP32[i12 + (i5 << 2) >> 2] | 0;
       d6 = 0.0;
       i2 = 0;
       do {
        d6 = d6 + +HEAPF64[i1 + (i2 << 3) >> 3] * +HEAPF64[i20 + (i2 << 3) >> 3];
        i2 = i2 + 1 | 0;
       } while ((i2 | 0) != (i22 | 0));
       HEAPF64[i3 >> 3] = d6;
       d4 = d4 + d6 * +HEAPF64[i20 + (i5 << 3) >> 3];
       i5 = i5 + 1 | 0;
      } while ((i5 | 0) != (i22 | 0));
      d6 = 0.0;
      i1 = 0;
      do {
       d7 = +Math_abs(+(+HEAPF64[i13 + (i1 << 3) >> 3] - d4));
       d6 = d7 > d6 ? d7 : d6;
       i1 = i1 + 1 | 0;
      } while ((i1 | 0) != (i22 | 0));
     } else {
      d6 = 0.0;
      d4 = 0.0;
     }
     if (d6 < d16) break L41;
     if (i18) {
      i3 = 0;
      while (1) {
       d25 = +HEAPF64[i13 + (i3 << 3) >> 3];
       i2 = HEAP32[i12 + (i3 << 2) >> 2] | 0;
       i1 = i2 + (i3 << 3) | 0;
       d6 = (d4 - d25) / +HEAPF64[i1 >> 3];
       i14 = i20 + (i3 << 3) | 0;
       HEAPF64[i14 >> 3] = d6 + +HEAPF64[i14 >> 3];
       d7 = d6 + 1.0;
       d4 = (d4 + d6 * (d25 * 2.0 + d6 * +HEAPF64[i1 >> 3])) / d7;
       i1 = 0;
       do {
        i14 = i13 + (i1 << 3) | 0;
        HEAPF64[i14 >> 3] = (+HEAPF64[i14 >> 3] + d6 * +HEAPF64[i2 + (i1 << 3) >> 3]) / d7;
        i14 = i20 + (i1 << 3) | 0;
        HEAPF64[i14 >> 3] = +HEAPF64[i14 >> 3] / d7;
        i1 = i1 + 1 | 0;
       } while ((i1 | 0) != (i22 | 0));
       i3 = i3 + 1 | 0;
       if ((i3 | 0) == (i22 | 0)) break; else d4 = d4 / d7;
      }
     }
     i8 = i8 + 1 | 0;
     if ((i8 | 0) >= (i11 | 0)) {
      i15 = 40;
      break;
     }
    }
   } else i15 = 40; while (0);
   if ((i15 | 0) == 40) __ZN6LIBSVML4infoEPKcz(5279, i17);
   if (i18) {
    i1 = 0;
    do {
     _free(HEAP32[i12 + (i1 << 2) >> 2] | 0);
     i1 = i1 + 1 | 0;
    } while ((i1 | 0) != (i22 | 0));
   }
   _free(i12);
   _free(i13);
   if ((i22 | 0) > 1) {
    i1 = 1;
    i2 = 0;
    i15 = 45;
   } else i2 = 0;
  }
  if ((i15 | 0) == 45) while (1) {
   i2 = +HEAPF64[i20 + (i1 << 3) >> 3] > +HEAPF64[i20 + (i2 << 3) >> 3] ? i1 : i2;
   i1 = i1 + 1 | 0;
   if ((i1 | 0) == (i22 | 0)) break; else i15 = 45;
  }
  if (i18) {
   i1 = 0;
   do {
    _free(HEAP32[i19 + (i1 << 2) >> 2] | 0);
    i1 = i1 + 1 | 0;
   } while ((i1 | 0) != (i22 | 0));
  }
  _free(i21);
  _free(i19);
  d25 = +(HEAP32[(HEAP32[i23 + 128 >> 2] | 0) + (i2 << 2) >> 2] | 0);
  STACKTOP = i24;
  return +d25;
 }
 i1 = HEAP32[i23 + 96 >> 2] | 0;
 if ((i2 + -2 | 0) >>> 0 < 3) i1 = _malloc(8) | 0; else i1 = _malloc(((Math_imul(i1 + -1 | 0, i1) | 0) / 2 | 0) << 3) | 0;
 d25 = +_svm_predict_values(i23, i3, i1);
 _free(i1);
 STACKTOP = i24;
 return +d25;
}

function __ZN13neuralNetwork5trainERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE(i21, i22) {
 i21 = i21 | 0;
 i22 = i22 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, d6 = 0.0, d7 = 0.0, d8 = 0.0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i23 = 0, i24 = 0, i25 = 0;
 i24 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i25 = i24 + 28 | 0;
 i23 = i24 + 16 | 0;
 i17 = i24 + 8 | 0;
 i18 = i24;
 __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i25, HEAP32[i22 >> 2] | 0);
 __THREW__ = 0;
 invoke_vii(8, i23 | 0, HEAP32[i22 >> 2] | 0);
 i19 = __THREW__;
 __THREW__ = 0;
 if (!(i19 & 1)) {
  i16 = HEAP32[i22 >> 2] | 0;
  d6 = +HEAPF64[HEAP32[i16 + 12 >> 2] >> 3];
  i19 = i22 + 4 | 0;
  i1 = (HEAP32[i19 >> 2] | 0) - i16 | 0;
  if ((i1 | 0) > 24) {
   i14 = HEAP32[i21 + 4 >> 2] | 0;
   i15 = (i14 | 0) > 0;
   i11 = (i1 | 0) / 24 | 0;
   i12 = HEAP32[i25 >> 2] | 0;
   i13 = HEAP32[i23 >> 2] | 0;
   d8 = d6;
   d7 = d6;
   i10 = 1;
   while (1) {
    if (i15) {
     i4 = HEAP32[i16 + (i10 * 24 | 0) >> 2] | 0;
     i5 = HEAP32[i16 + (i10 * 24 | 0) + 12 >> 2] | 0;
     i9 = 0;
     d6 = d8;
     do {
      i1 = i4 + (i9 << 3) | 0;
      d8 = +HEAPF64[i1 >> 3];
      i2 = i12 + (i9 << 3) | 0;
      if (d8 > +HEAPF64[i2 >> 3]) {
       HEAPF64[i2 >> 3] = d8;
       d8 = +HEAPF64[i1 >> 3];
      }
      i1 = i13 + (i9 << 3) | 0;
      if (d8 < +HEAPF64[i1 >> 3]) HEAPF64[i1 >> 3] = d8;
      d8 = +HEAPF64[i5 >> 3];
      d6 = d8 > d6 ? d8 : d6;
      d7 = d8 < d7 ? d8 : d7;
      i9 = i9 + 1 | 0;
     } while ((i9 | 0) < (i14 | 0));
    } else d6 = d8;
    i10 = i10 + 1 | 0;
    if ((i10 | 0) >= (i11 | 0)) {
     d8 = d6;
     break;
    } else d8 = d6;
   }
  } else {
   d8 = d6;
   d7 = d6;
  }
  i15 = i21 + 88 | 0;
  i5 = HEAP32[i15 >> 2] | 0;
  i14 = i21 + 92 | 0;
  i1 = HEAP32[i14 >> 2] | 0;
  if ((i1 | 0) == (i5 | 0)) i1 = i5; else {
   i1 = i1 + (~((i1 + -8 - i5 | 0) >>> 3) << 3) | 0;
   HEAP32[i14 >> 2] = i1;
  }
  i12 = i21 + 100 | 0;
  i2 = HEAP32[i12 >> 2] | 0;
  i13 = i21 + 104 | 0;
  i4 = HEAP32[i13 >> 2] | 0;
  if ((i4 | 0) != (i2 | 0)) HEAP32[i13 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
  i11 = i21 + 4 | 0;
  do if ((HEAP32[i11 >> 2] | 0) > 0) {
   i9 = i21 + 96 | 0;
   i10 = i21 + 108 | 0;
   i5 = 0;
   while (1) {
    i2 = HEAP32[i25 >> 2] | 0;
    i4 = HEAP32[i23 >> 2] | 0;
    d6 = (+HEAPF64[i2 + (i5 << 3) >> 3] - +HEAPF64[i4 + (i5 << 3) >> 3]) * .5;
    HEAPF64[i17 >> 3] = d6;
    if (i1 >>> 0 < (HEAP32[i9 >> 2] | 0) >>> 0) {
     HEAPF64[i1 >> 3] = d6;
     HEAP32[i14 >> 2] = i1 + 8;
     i1 = i4;
    } else {
     __THREW__ = 0;
     invoke_vii(7, i15 | 0, i17 | 0);
     i16 = __THREW__;
     __THREW__ = 0;
     if (i16 & 1) {
      i2 = 10;
      break;
     }
     i2 = HEAP32[i25 >> 2] | 0;
     i1 = HEAP32[i23 >> 2] | 0;
    }
    d6 = (+HEAPF64[i2 + (i5 << 3) >> 3] + +HEAPF64[i1 + (i5 << 3) >> 3]) * .5;
    HEAPF64[i18 >> 3] = d6;
    i1 = HEAP32[i13 >> 2] | 0;
    if (i1 >>> 0 >= (HEAP32[i10 >> 2] | 0) >>> 0) {
     __THREW__ = 0;
     invoke_vii(7, i12 | 0, i18 | 0);
     i16 = __THREW__;
     __THREW__ = 0;
     if (i16 & 1) {
      i2 = 10;
      break;
     }
    } else {
     HEAPF64[i1 >> 3] = d6;
     HEAP32[i13 >> 2] = i1 + 8;
    }
    i5 = i5 + 1 | 0;
    i1 = HEAP32[i14 >> 2] | 0;
    if ((i5 | 0) >= (HEAP32[i11 >> 2] | 0)) {
     i2 = 25;
     break;
    }
   }
   if ((i2 | 0) == 10) {
    i3 = ___cxa_find_matching_catch() | 0;
    i1 = i23;
    break;
   } else if ((i2 | 0) == 25) {
    i5 = HEAP32[i15 >> 2] | 0;
    i2 = 26;
    break;
   }
  } else i2 = 26; while (0);
  L42 : do if ((i2 | 0) == 26) {
   if ((i1 | 0) != (i5 | 0)) {
    i2 = i1 - i5 >> 3;
    i4 = 0;
    do {
     i1 = i5 + (i4 << 3) | 0;
     if (+HEAPF64[i1 >> 3] == 0.0) HEAPF64[i1 >> 3] = 1.0;
     i4 = i4 + 1 | 0;
    } while (i4 >>> 0 < i2 >>> 0);
   }
   d6 = (d8 - d7) * .5;
   HEAPF64[i21 + 112 >> 3] = d6;
   HEAPF64[i21 + 120 >> 3] = (d7 + d8) * .5;
   L52 : do if (d6 != 0.0 ? (i20 = i21 + 144 | 0, i3 = HEAP32[i20 >> 2] | 0, (i3 | 0) > 0) : 0) {
    i2 = HEAP32[i19 >> 2] | 0;
    i1 = HEAP32[i22 >> 2] | 0;
    i4 = 0;
    L55 : while (1) {
     if ((i2 - i1 | 0) > 0) {
      i3 = 0;
      do {
       __THREW__ = 0;
       +invoke_dii(HEAP32[(HEAP32[i21 >> 2] | 0) + 8 >> 2] | 0, i21 | 0, i1 + (i3 * 24 | 0) | 0);
       i18 = __THREW__;
       __THREW__ = 0;
       if (i18 & 1) break L55;
       __ZN13neuralNetwork13backpropagateERKd(i21, HEAP32[(HEAP32[i22 >> 2] | 0) + (i3 * 24 | 0) + 12 >> 2] | 0);
       i3 = i3 + 1 | 0;
       i2 = HEAP32[i19 >> 2] | 0;
       i1 = HEAP32[i22 >> 2] | 0;
      } while ((i3 | 0) < ((i2 - i1 | 0) / 24 | 0 | 0));
      i3 = HEAP32[i20 >> 2] | 0;
     }
     i4 = i4 + 1 | 0;
     if ((i4 | 0) >= (i3 | 0)) break L52;
    }
    i3 = ___cxa_find_matching_catch() | 0;
    i1 = i23;
    break L42;
   } while (0);
   i3 = HEAP32[i23 >> 2] | 0;
   i4 = i3;
   if (i3) {
    i1 = i23 + 4 | 0;
    i2 = HEAP32[i1 >> 2] | 0;
    if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
    __ZdlPv(i3);
   }
   i3 = HEAP32[i25 >> 2] | 0;
   if (!i3) {
    STACKTOP = i24;
    return;
   }
   i1 = i25 + 4 | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i3 | 0) >>> 3) << 3);
   __ZdlPv(i3);
   STACKTOP = i24;
   return;
  } while (0);
  i4 = HEAP32[i1 >> 2] | 0;
  i5 = i4;
  if (i4) {
   i1 = i23 + 4 | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i5 | 0) >>> 3) << 3);
   __ZdlPv(i4);
  }
 } else i3 = ___cxa_find_matching_catch() | 0;
 i4 = HEAP32[i25 >> 2] | 0;
 if (!i4) ___resumeException(i3 | 0);
 i1 = i25 + 4 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
 __ZdlPv(i4);
 ___resumeException(i3 | 0);
}

function __ZN6LIBSVM9Solver_NU12do_shrinkingEv(i20) {
 i20 = i20 | 0;
 var i1 = 0, d2 = 0.0, d3 = 0.0, d4 = 0.0, d5 = 0.0, i6 = 0, d7 = 0.0, i8 = 0, d9 = 0.0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i21 = 0, i22 = 0;
 i21 = i20 + 4 | 0;
 i12 = HEAP32[i21 >> 2] | 0;
 if ((i12 | 0) > 0) {
  i6 = HEAP32[i20 + 16 >> 2] | 0;
  i8 = i20 + 8 | 0;
  i10 = i20 + 12 | 0;
  d4 = -inf;
  d7 = -inf;
  d9 = -inf;
  d5 = -inf;
  i11 = 0;
  while (1) {
   i1 = HEAP8[i6 + i11 >> 0] | 0;
   if (i1 << 24 >> 24 != 1) {
    d2 = -+HEAPF64[(HEAP32[i10 >> 2] | 0) + (i11 << 3) >> 3];
    if ((HEAP8[(HEAP32[i8 >> 2] | 0) + i11 >> 0] | 0) == 1) if (d4 < d2) {
     d3 = d2;
     d2 = d5;
    } else {
     d3 = d4;
     d2 = d5;
    } else if (d5 < d2) d3 = d4; else {
     d3 = d4;
     d2 = d5;
    }
    if (!(i1 << 24 >> 24)) {
     d4 = d3;
     d5 = d7;
     d3 = d9;
    } else {
     d4 = d3;
     i22 = 10;
    }
   } else {
    d2 = d5;
    i22 = 10;
   }
   do if ((i22 | 0) == 10) {
    i22 = 0;
    d3 = +HEAPF64[(HEAP32[i10 >> 2] | 0) + (i11 << 3) >> 3];
    if ((HEAP8[(HEAP32[i8 >> 2] | 0) + i11 >> 0] | 0) == 1) {
     if (!(d3 > d7)) {
      d5 = d7;
      d3 = d9;
      break;
     }
     d5 = d3;
     d3 = d9;
     break;
    } else {
     if (!(d3 > d9)) {
      d5 = d7;
      d3 = d9;
      break;
     }
     d5 = d7;
     break;
    }
   } while (0);
   i11 = i11 + 1 | 0;
   if ((i11 | 0) >= (i12 | 0)) break; else {
    d7 = d5;
    d9 = d3;
    d5 = d2;
   }
  }
 } else {
  d4 = -inf;
  d5 = -inf;
  d3 = -inf;
  d2 = -inf;
 }
 i1 = i20 + 72 | 0;
 if ((HEAP8[i1 >> 0] | 0) == 0 ? (d7 = d4 + d5, d9 = d3 + d2, (d7 > d9 ? d7 : d9) <= +HEAPF64[i20 + 32 >> 3] * 10.0) : 0) {
  HEAP8[i1 >> 0] = 1;
  __ZN6LIBSVM6Solver20reconstruct_gradientEv(i20);
  i1 = HEAP32[i20 + 68 >> 2] | 0;
  HEAP32[i21 >> 2] = i1;
 } else i1 = i12;
 if ((i1 | 0) <= 0) return;
 i13 = i20 + 16 | 0;
 i14 = i20 + 8 | 0;
 i15 = i20 + 12 | 0;
 i16 = i20 + 24 | 0;
 i17 = i20 + 20 | 0;
 i18 = i20 + 56 | 0;
 i19 = i20 + 60 | 0;
 i11 = i20 + 64 | 0;
 i12 = 0;
 do {
  i10 = HEAP32[i13 >> 2] | 0;
  L31 : do switch (HEAP8[i10 + i12 >> 0] | 0) {
  case 1:
   {
    i6 = HEAP32[i14 >> 2] | 0;
    i8 = HEAP32[i15 >> 2] | 0;
    d7 = -+HEAPF64[i8 + (i12 << 3) >> 3];
    if ((HEAP8[i6 + i12 >> 0] | 0) == 1) if (d4 < d7) {
     i22 = 28;
     break L31;
    } else break L31; else if (d2 < d7) {
     i22 = 28;
     break L31;
    } else break L31;
   }
  case 0:
   {
    i6 = HEAP32[i14 >> 2] | 0;
    i8 = HEAP32[i15 >> 2] | 0;
    d7 = +HEAPF64[i8 + (i12 << 3) >> 3];
    if ((HEAP8[i6 + i12 >> 0] | 0) == 1) if (d7 > d5) {
     i22 = 28;
     break L31;
    } else break L31; else if (d7 > d3) {
     i22 = 28;
     break L31;
    } else break L31;
   }
  default:
   {}
  } while (0);
  L40 : do if ((i22 | 0) == 28) {
   i22 = 0;
   i1 = i1 + -1 | 0;
   HEAP32[i21 >> 2] = i1;
   if ((i1 | 0) > (i12 | 0)) {
    L42 : while (1) {
     L44 : do switch (HEAP8[i10 + i1 >> 0] | 0) {
     case 1:
      {
       d7 = -+HEAPF64[i8 + (i1 << 3) >> 3];
       if ((HEAP8[i6 + i1 >> 0] | 0) == 1) if (d4 < d7) break L44; else break L42; else if (d2 < d7) break L44; else break L42;
      }
     case 0:
      {
       d7 = +HEAPF64[i8 + (i1 << 3) >> 3];
       if ((HEAP8[i6 + i1 >> 0] | 0) == 1) if (d7 > d5) break L44; else break L42; else if (d7 > d3) break L44; else break L42;
      }
     default:
      break L42;
     } while (0);
     i1 = i1 + -1 | 0;
     HEAP32[i21 >> 2] = i1;
     if ((i1 | 0) <= (i12 | 0)) break L40;
    }
    i10 = HEAP32[i16 >> 2] | 0;
    FUNCTION_TABLE_viii[HEAP32[(HEAP32[i10 >> 2] | 0) + 8 >> 2] & 31](i10, i12, i1);
    i10 = HEAP32[i14 >> 2] | 0;
    i8 = i10 + i12 | 0;
    i10 = i10 + i1 | 0;
    i20 = HEAP8[i8 >> 0] | 0;
    HEAP8[i8 >> 0] = HEAP8[i10 >> 0] | 0;
    HEAP8[i10 >> 0] = i20;
    i10 = HEAP32[i15 >> 2] | 0;
    i20 = i10 + (i12 << 3) | 0;
    i10 = i10 + (i1 << 3) | 0;
    d9 = +HEAPF64[i20 >> 3];
    HEAPF64[i20 >> 3] = +HEAPF64[i10 >> 3];
    HEAPF64[i10 >> 3] = d9;
    i10 = HEAP32[i13 >> 2] | 0;
    i20 = i10 + i12 | 0;
    i10 = i10 + i1 | 0;
    i8 = HEAP8[i20 >> 0] | 0;
    HEAP8[i20 >> 0] = HEAP8[i10 >> 0] | 0;
    HEAP8[i10 >> 0] = i8;
    i10 = HEAP32[i17 >> 2] | 0;
    i8 = i10 + (i12 << 3) | 0;
    i10 = i10 + (i1 << 3) | 0;
    d9 = +HEAPF64[i8 >> 3];
    HEAPF64[i8 >> 3] = +HEAPF64[i10 >> 3];
    HEAPF64[i10 >> 3] = d9;
    i10 = HEAP32[i18 >> 2] | 0;
    i8 = i10 + (i12 << 3) | 0;
    i10 = i10 + (i1 << 3) | 0;
    d9 = +HEAPF64[i8 >> 3];
    HEAPF64[i8 >> 3] = +HEAPF64[i10 >> 3];
    HEAPF64[i10 >> 3] = d9;
    i10 = HEAP32[i19 >> 2] | 0;
    i8 = i10 + (i12 << 2) | 0;
    i10 = i10 + (i1 << 2) | 0;
    i20 = HEAP32[i8 >> 2] | 0;
    HEAP32[i8 >> 2] = HEAP32[i10 >> 2];
    HEAP32[i10 >> 2] = i20;
    i10 = HEAP32[i11 >> 2] | 0;
    i20 = i10 + (i12 << 3) | 0;
    i1 = i10 + (i1 << 3) | 0;
    d9 = +HEAPF64[i20 >> 3];
    HEAPF64[i20 >> 3] = +HEAPF64[i1 >> 3];
    HEAPF64[i1 >> 3] = d9;
    i1 = HEAP32[i21 >> 2] | 0;
   }
  } while (0);
  i12 = i12 + 1 | 0;
 } while ((i12 | 0) < (i1 | 0));
 return;
}

function __ZNSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEE8__appendEjRKS1_(i11, i2, i6) {
 i11 = i11 | 0;
 i2 = i2 | 0;
 i6 = i6 | 0;
 var i1 = 0, i3 = 0, i4 = 0, i5 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i12 = 0, i13 = 0, i14 = 0;
 i13 = i11 + 8 | 0;
 i4 = HEAP32[i13 >> 2] | 0;
 i14 = i11 + 4 | 0;
 i1 = HEAP32[i14 >> 2] | 0;
 i3 = i1;
 if (((i4 - i3 | 0) / 24 | 0) >>> 0 >= i2 >>> 0) {
  i3 = i6 + 12 | 0;
  while (1) {
   __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i1, i6);
   __THREW__ = 0;
   invoke_vii(8, i1 + 12 | 0, i3 | 0);
   i13 = __THREW__;
   __THREW__ = 0;
   if (i13 & 1) break;
   i1 = (HEAP32[i14 >> 2] | 0) + 24 | 0;
   HEAP32[i14 >> 2] = i1;
   i2 = i2 + -1 | 0;
   if (!i2) {
    i8 = 54;
    break;
   }
  }
  if ((i8 | 0) == 54) return;
  i3 = ___cxa_find_matching_catch() | 0;
  i4 = HEAP32[i1 >> 2] | 0;
  if (!i4) ___resumeException(i3 | 0);
  i1 = i1 + 4 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
  __ZdlPv(i4);
  ___resumeException(i3 | 0);
 }
 i1 = HEAP32[i11 >> 2] | 0;
 i5 = ((i3 - i1 | 0) / 24 | 0) + i2 | 0;
 if (i5 >>> 0 > 178956970) {
  __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i11);
  i4 = HEAP32[i13 >> 2] | 0;
  i1 = HEAP32[i11 >> 2] | 0;
 }
 i3 = (i4 - i1 | 0) / 24 | 0;
 if (i3 >>> 0 < 89478485) {
  i3 = i3 << 1;
  i3 = i3 >>> 0 < i5 >>> 0 ? i5 : i3;
  i1 = ((HEAP32[i14 >> 2] | 0) - i1 | 0) / 24 | 0;
  if (!i3) {
   i4 = 0;
   i10 = 0;
  } else i8 = 15;
 } else {
  i3 = 178956970;
  i1 = ((HEAP32[i14 >> 2] | 0) - i1 | 0) / 24 | 0;
  i8 = 15;
 }
 if ((i8 | 0) == 15) {
  i4 = i3;
  i10 = __Znwj(i3 * 24 | 0) | 0;
 }
 i12 = i10 + (i1 * 24 | 0) | 0;
 i7 = i12;
 i9 = i10 + (i4 * 24 | 0) | 0;
 i3 = i6 + 12 | 0;
 i4 = i12;
 i1 = i7;
 while (1) {
  __THREW__ = 0;
  invoke_vii(8, i4 | 0, i6 | 0);
  i8 = __THREW__;
  __THREW__ = 0;
  if (i8 & 1) {
   i8 = 40;
   break;
  }
  __THREW__ = 0;
  invoke_vii(8, i4 + 12 | 0, i3 | 0);
  i8 = __THREW__;
  __THREW__ = 0;
  if (i8 & 1) {
   i2 = i4;
   i8 = 19;
   break;
  }
  i4 = i1 + 24 | 0;
  i1 = i4;
  i2 = i2 + -1 | 0;
  if (!i2) {
   i6 = i1;
   i8 = 24;
   break;
  }
 }
 if ((i8 | 0) == 19) {
  i6 = ___cxa_find_matching_catch() | 0;
  i4 = HEAP32[i2 >> 2] | 0;
  i5 = i4;
  if (i4) {
   i2 = i2 + 4 | 0;
   i3 = HEAP32[i2 >> 2] | 0;
   if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
   __ZdlPv(i4);
  }
 } else if ((i8 | 0) == 24) {
  i5 = HEAP32[i11 >> 2] | 0;
  i1 = HEAP32[i14 >> 2] | 0;
  if ((i1 | 0) == (i5 | 0)) {
   i3 = i11;
   i4 = i14;
   i2 = i7;
   i8 = i5;
  } else {
   i2 = i7;
   i3 = i12;
   do {
    i10 = i3 + -24 | 0;
    i8 = i1;
    i1 = i1 + -24 | 0;
    HEAP32[i10 >> 2] = 0;
    i12 = i3 + -20 | 0;
    HEAP32[i12 >> 2] = 0;
    HEAP32[i3 + -16 >> 2] = 0;
    HEAP32[i10 >> 2] = HEAP32[i1 >> 2];
    i10 = i8 + -20 | 0;
    HEAP32[i12 >> 2] = HEAP32[i10 >> 2];
    i12 = i8 + -16 | 0;
    HEAP32[i3 + -16 >> 2] = HEAP32[i12 >> 2];
    HEAP32[i12 >> 2] = 0;
    HEAP32[i10 >> 2] = 0;
    HEAP32[i1 >> 2] = 0;
    i10 = i3 + -12 | 0;
    i12 = i8 + -12 | 0;
    HEAP32[i10 >> 2] = 0;
    i7 = i3 + -8 | 0;
    HEAP32[i7 >> 2] = 0;
    HEAP32[i3 + -4 >> 2] = 0;
    HEAP32[i10 >> 2] = HEAP32[i12 >> 2];
    i10 = i8 + -8 | 0;
    HEAP32[i7 >> 2] = HEAP32[i10 >> 2];
    i8 = i8 + -4 | 0;
    HEAP32[i3 + -4 >> 2] = HEAP32[i8 >> 2];
    HEAP32[i8 >> 2] = 0;
    HEAP32[i10 >> 2] = 0;
    HEAP32[i12 >> 2] = 0;
    i3 = i2 + -24 | 0;
    i2 = i3;
   } while ((i1 | 0) != (i5 | 0));
   i1 = i2;
   i3 = i11;
   i4 = i14;
   i2 = i1;
   i8 = HEAP32[i11 >> 2] | 0;
   i1 = HEAP32[i14 >> 2] | 0;
  }
  HEAP32[i3 >> 2] = i2;
  HEAP32[i4 >> 2] = i6;
  HEAP32[i13 >> 2] = i9;
  i7 = i8;
  if ((i1 | 0) != (i7 | 0)) do {
   i6 = i1;
   i1 = i1 + -24 | 0;
   i2 = HEAP32[i6 + -12 >> 2] | 0;
   i3 = i2;
   if (i2) {
    i4 = i6 + -8 | 0;
    i5 = HEAP32[i4 >> 2] | 0;
    if ((i5 | 0) != (i2 | 0)) HEAP32[i4 >> 2] = i5 + (~((i5 + -8 - i3 | 0) >>> 3) << 3);
    __ZdlPv(i2);
   }
   i4 = HEAP32[i1 >> 2] | 0;
   i5 = i4;
   if (i4) {
    i2 = i6 + -20 | 0;
    i3 = HEAP32[i2 >> 2] | 0;
    if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
    __ZdlPv(i4);
   }
  } while ((i1 | 0) != (i7 | 0));
  if (!i8) return;
  __ZdlPv(i8);
  return;
 } else if ((i8 | 0) == 40) i6 = ___cxa_find_matching_catch() | 0;
 if ((i1 | 0) != (i12 | 0)) do {
  i7 = i1;
  i1 = i1 + -24 | 0;
  i2 = HEAP32[i7 + -12 >> 2] | 0;
  i3 = i2;
  if (i2) {
   i4 = i7 + -8 | 0;
   i5 = HEAP32[i4 >> 2] | 0;
   if ((i5 | 0) != (i2 | 0)) HEAP32[i4 >> 2] = i5 + (~((i5 + -8 - i3 | 0) >>> 3) << 3);
   __ZdlPv(i2);
  }
  i4 = HEAP32[i1 >> 2] | 0;
  i5 = i4;
  if (i4) {
   i2 = i7 + -20 | 0;
   i3 = HEAP32[i2 >> 2] | 0;
   if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
   __ZdlPv(i4);
  }
 } while ((i1 | 0) != (i12 | 0));
 if (!i10) ___resumeException(i6 | 0);
 __ZdlPv(i10);
 ___resumeException(i6 | 0);
}

function __ZN6LIBSVM6Solver12do_shrinkingEv(i18) {
 i18 = i18 | 0;
 var i1 = 0, d2 = 0.0, d3 = 0.0, i4 = 0, d5 = 0.0, d6 = 0.0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i19 = 0, i20 = 0, i21 = 0;
 i21 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i12 = i21;
 i19 = i18 + 4 | 0;
 i11 = HEAP32[i19 >> 2] | 0;
 if ((i11 | 0) > 0) {
  i7 = HEAP32[i18 + 8 >> 2] | 0;
  i8 = HEAP32[i18 + 16 >> 2] | 0;
  i9 = i18 + 12 | 0;
  d5 = -inf;
  d6 = -inf;
  i10 = 0;
  while (1) {
   i4 = HEAP8[i8 + i10 >> 0] | 0;
   i1 = i4 << 24 >> 24 == 1;
   do if ((HEAP8[i7 + i10 >> 0] | 0) == 1) {
    if (!i1) {
     d2 = -+HEAPF64[(HEAP32[i9 >> 2] | 0) + (i10 << 3) >> 3];
     d2 = d5 <= d2 ? d2 : d5;
     if (!(i4 << 24 >> 24)) {
      d3 = d6;
      break;
     }
    } else d2 = d5;
    d3 = +HEAPF64[(HEAP32[i9 >> 2] | 0) + (i10 << 3) >> 3];
    if (!(d3 >= d6)) d3 = d6;
   } else {
    if (!i1) {
     d3 = -+HEAPF64[(HEAP32[i9 >> 2] | 0) + (i10 << 3) >> 3];
     d3 = d6 <= d3 ? d3 : d6;
     if (!(i4 << 24 >> 24)) {
      d2 = d5;
      break;
     }
    } else d3 = d6;
    d2 = +HEAPF64[(HEAP32[i9 >> 2] | 0) + (i10 << 3) >> 3];
    if (!(d2 >= d5)) d2 = d5;
   } while (0);
   i10 = i10 + 1 | 0;
   if ((i10 | 0) >= (i11 | 0)) break; else {
    d5 = d2;
    d6 = d3;
   }
  }
 } else {
  d2 = -inf;
  d3 = -inf;
 }
 i1 = i18 + 72 | 0;
 if ((HEAP8[i1 >> 0] | 0) == 0 ? d2 + d3 <= +HEAPF64[i18 + 32 >> 3] * 10.0 : 0) {
  HEAP8[i1 >> 0] = 1;
  __ZN6LIBSVM6Solver20reconstruct_gradientEv(i18);
  HEAP32[i19 >> 2] = HEAP32[i18 + 68 >> 2];
  __ZN6LIBSVML4infoEPKcz(4714, i12);
  i1 = HEAP32[i19 >> 2] | 0;
 } else i1 = i11;
 if ((i1 | 0) <= 0) {
  STACKTOP = i21;
  return;
 }
 i11 = i18 + 16 | 0;
 i12 = i18 + 8 | 0;
 i13 = i18 + 12 | 0;
 i14 = i18 + 24 | 0;
 i15 = i18 + 20 | 0;
 i16 = i18 + 56 | 0;
 i17 = i18 + 60 | 0;
 i9 = i18 + 64 | 0;
 i10 = 0;
 do {
  i8 = HEAP32[i11 >> 2] | 0;
  L27 : do switch (HEAP8[i8 + i10 >> 0] | 0) {
  case 1:
   {
    i4 = HEAP32[i12 >> 2] | 0;
    i7 = HEAP32[i13 >> 2] | 0;
    d5 = -+HEAPF64[i7 + (i10 << 3) >> 3];
    if ((HEAP8[i4 + i10 >> 0] | 0) == 1) if (d2 < d5) {
     i20 = 25;
     break L27;
    } else break L27; else if (d3 < d5) {
     i20 = 25;
     break L27;
    } else break L27;
   }
  case 0:
   {
    i4 = HEAP32[i12 >> 2] | 0;
    i7 = HEAP32[i13 >> 2] | 0;
    d5 = +HEAPF64[i7 + (i10 << 3) >> 3];
    if ((HEAP8[i4 + i10 >> 0] | 0) == 1) if (d5 > d3) {
     i20 = 25;
     break L27;
    } else break L27; else if (d5 > d2) {
     i20 = 25;
     break L27;
    } else break L27;
   }
  default:
   {}
  } while (0);
  L36 : do if ((i20 | 0) == 25) {
   i20 = 0;
   i1 = i1 + -1 | 0;
   HEAP32[i19 >> 2] = i1;
   if ((i1 | 0) > (i10 | 0)) {
    L38 : while (1) {
     L40 : do switch (HEAP8[i8 + i1 >> 0] | 0) {
     case 1:
      {
       d5 = -+HEAPF64[i7 + (i1 << 3) >> 3];
       if ((HEAP8[i4 + i1 >> 0] | 0) == 1) if (d2 < d5) break L40; else break L38; else if (d3 < d5) break L40; else break L38;
      }
     case 0:
      {
       d5 = +HEAPF64[i7 + (i1 << 3) >> 3];
       if ((HEAP8[i4 + i1 >> 0] | 0) == 1) if (d5 > d3) break L40; else break L38; else if (d5 > d2) break L40; else break L38;
      }
     default:
      break L38;
     } while (0);
     i1 = i1 + -1 | 0;
     HEAP32[i19 >> 2] = i1;
     if ((i1 | 0) <= (i10 | 0)) break L36;
    }
    i8 = HEAP32[i14 >> 2] | 0;
    FUNCTION_TABLE_viii[HEAP32[(HEAP32[i8 >> 2] | 0) + 8 >> 2] & 31](i8, i10, i1);
    i8 = HEAP32[i12 >> 2] | 0;
    i7 = i8 + i10 | 0;
    i8 = i8 + i1 | 0;
    i18 = HEAP8[i7 >> 0] | 0;
    HEAP8[i7 >> 0] = HEAP8[i8 >> 0] | 0;
    HEAP8[i8 >> 0] = i18;
    i8 = HEAP32[i13 >> 2] | 0;
    i18 = i8 + (i10 << 3) | 0;
    i8 = i8 + (i1 << 3) | 0;
    d6 = +HEAPF64[i18 >> 3];
    HEAPF64[i18 >> 3] = +HEAPF64[i8 >> 3];
    HEAPF64[i8 >> 3] = d6;
    i8 = HEAP32[i11 >> 2] | 0;
    i18 = i8 + i10 | 0;
    i8 = i8 + i1 | 0;
    i7 = HEAP8[i18 >> 0] | 0;
    HEAP8[i18 >> 0] = HEAP8[i8 >> 0] | 0;
    HEAP8[i8 >> 0] = i7;
    i8 = HEAP32[i15 >> 2] | 0;
    i7 = i8 + (i10 << 3) | 0;
    i8 = i8 + (i1 << 3) | 0;
    d6 = +HEAPF64[i7 >> 3];
    HEAPF64[i7 >> 3] = +HEAPF64[i8 >> 3];
    HEAPF64[i8 >> 3] = d6;
    i8 = HEAP32[i16 >> 2] | 0;
    i7 = i8 + (i10 << 3) | 0;
    i8 = i8 + (i1 << 3) | 0;
    d6 = +HEAPF64[i7 >> 3];
    HEAPF64[i7 >> 3] = +HEAPF64[i8 >> 3];
    HEAPF64[i8 >> 3] = d6;
    i8 = HEAP32[i17 >> 2] | 0;
    i7 = i8 + (i10 << 2) | 0;
    i8 = i8 + (i1 << 2) | 0;
    i18 = HEAP32[i7 >> 2] | 0;
    HEAP32[i7 >> 2] = HEAP32[i8 >> 2];
    HEAP32[i8 >> 2] = i18;
    i8 = HEAP32[i9 >> 2] | 0;
    i18 = i8 + (i10 << 3) | 0;
    i1 = i8 + (i1 << 3) | 0;
    d6 = +HEAPF64[i18 >> 3];
    HEAPF64[i18 >> 3] = +HEAPF64[i1 >> 3];
    HEAPF64[i1 >> 3] = d6;
    i1 = HEAP32[i19 >> 2] | 0;
   }
  } while (0);
  i10 = i10 + 1 | 0;
 } while ((i10 | 0) < (i1 | 0));
 STACKTOP = i21;
 return;
}

function _try_realloc_chunk(i15, i14) {
 i15 = i15 | 0;
 i14 = i14 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0;
 i12 = i15 + 4 | 0;
 i13 = HEAP32[i12 >> 2] | 0;
 i7 = i13 & -8;
 i9 = i15 + i7 | 0;
 i6 = HEAP32[711] | 0;
 i1 = i13 & 3;
 if (!((i1 | 0) != 1 & i15 >>> 0 >= i6 >>> 0 & i15 >>> 0 < i9 >>> 0)) _abort();
 i2 = i15 + (i7 | 4) | 0;
 i3 = HEAP32[i2 >> 2] | 0;
 if (!(i3 & 1)) _abort();
 if (!i1) {
  if (i14 >>> 0 < 256) {
   i15 = 0;
   return i15 | 0;
  }
  if (i7 >>> 0 >= (i14 + 4 | 0) >>> 0 ? (i7 - i14 | 0) >>> 0 <= HEAP32[827] << 1 >>> 0 : 0) return i15 | 0;
  i15 = 0;
  return i15 | 0;
 }
 if (i7 >>> 0 >= i14 >>> 0) {
  i1 = i7 - i14 | 0;
  if (i1 >>> 0 <= 15) return i15 | 0;
  HEAP32[i12 >> 2] = i13 & 1 | i14 | 2;
  HEAP32[i15 + (i14 + 4) >> 2] = i1 | 3;
  HEAP32[i2 >> 2] = HEAP32[i2 >> 2] | 1;
  _dispose_chunk(i15 + i14 | 0, i1);
  return i15 | 0;
 }
 if ((i9 | 0) == (HEAP32[713] | 0)) {
  i1 = (HEAP32[710] | 0) + i7 | 0;
  if (i1 >>> 0 <= i14 >>> 0) {
   i15 = 0;
   return i15 | 0;
  }
  i11 = i1 - i14 | 0;
  HEAP32[i12 >> 2] = i13 & 1 | i14 | 2;
  HEAP32[i15 + (i14 + 4) >> 2] = i11 | 1;
  HEAP32[713] = i15 + i14;
  HEAP32[710] = i11;
  return i15 | 0;
 }
 if ((i9 | 0) == (HEAP32[712] | 0)) {
  i2 = (HEAP32[709] | 0) + i7 | 0;
  if (i2 >>> 0 < i14 >>> 0) {
   i15 = 0;
   return i15 | 0;
  }
  i1 = i2 - i14 | 0;
  if (i1 >>> 0 > 15) {
   HEAP32[i12 >> 2] = i13 & 1 | i14 | 2;
   HEAP32[i15 + (i14 + 4) >> 2] = i1 | 1;
   HEAP32[i15 + i2 >> 2] = i1;
   i2 = i15 + (i2 + 4) | 0;
   HEAP32[i2 >> 2] = HEAP32[i2 >> 2] & -2;
   i2 = i15 + i14 | 0;
  } else {
   HEAP32[i12 >> 2] = i13 & 1 | i2 | 2;
   i2 = i15 + (i2 + 4) | 0;
   HEAP32[i2 >> 2] = HEAP32[i2 >> 2] | 1;
   i2 = 0;
   i1 = 0;
  }
  HEAP32[709] = i1;
  HEAP32[712] = i2;
  return i15 | 0;
 }
 if (i3 & 2) {
  i15 = 0;
  return i15 | 0;
 }
 i10 = (i3 & -8) + i7 | 0;
 if (i10 >>> 0 < i14 >>> 0) {
  i15 = 0;
  return i15 | 0;
 }
 i11 = i10 - i14 | 0;
 i4 = i3 >>> 3;
 do if (i3 >>> 0 >= 256) {
  i5 = HEAP32[i15 + (i7 + 24) >> 2] | 0;
  i4 = HEAP32[i15 + (i7 + 12) >> 2] | 0;
  do if ((i4 | 0) == (i9 | 0)) {
   i2 = i15 + (i7 + 20) | 0;
   i1 = HEAP32[i2 >> 2] | 0;
   if (!i1) {
    i2 = i15 + (i7 + 16) | 0;
    i1 = HEAP32[i2 >> 2] | 0;
    if (!i1) {
     i8 = 0;
     break;
    }
   }
   while (1) {
    i3 = i1 + 20 | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if (i4) {
     i1 = i4;
     i2 = i3;
     continue;
    }
    i3 = i1 + 16 | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if (!i4) break; else {
     i1 = i4;
     i2 = i3;
    }
   }
   if (i2 >>> 0 < i6 >>> 0) _abort(); else {
    HEAP32[i2 >> 2] = 0;
    i8 = i1;
    break;
   }
  } else {
   i3 = HEAP32[i15 + (i7 + 8) >> 2] | 0;
   if (i3 >>> 0 < i6 >>> 0) _abort();
   i1 = i3 + 12 | 0;
   if ((HEAP32[i1 >> 2] | 0) != (i9 | 0)) _abort();
   i2 = i4 + 8 | 0;
   if ((HEAP32[i2 >> 2] | 0) == (i9 | 0)) {
    HEAP32[i1 >> 2] = i4;
    HEAP32[i2 >> 2] = i3;
    i8 = i4;
    break;
   } else _abort();
  } while (0);
  if (i5) {
   i1 = HEAP32[i15 + (i7 + 28) >> 2] | 0;
   i2 = 3132 + (i1 << 2) | 0;
   if ((i9 | 0) == (HEAP32[i2 >> 2] | 0)) {
    HEAP32[i2 >> 2] = i8;
    if (!i8) {
     HEAP32[708] = HEAP32[708] & ~(1 << i1);
     break;
    }
   } else {
    if (i5 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort();
    i1 = i5 + 16 | 0;
    if ((HEAP32[i1 >> 2] | 0) == (i9 | 0)) HEAP32[i1 >> 2] = i8; else HEAP32[i5 + 20 >> 2] = i8;
    if (!i8) break;
   }
   i2 = HEAP32[711] | 0;
   if (i8 >>> 0 < i2 >>> 0) _abort();
   HEAP32[i8 + 24 >> 2] = i5;
   i1 = HEAP32[i15 + (i7 + 16) >> 2] | 0;
   do if (i1) if (i1 >>> 0 < i2 >>> 0) _abort(); else {
    HEAP32[i8 + 16 >> 2] = i1;
    HEAP32[i1 + 24 >> 2] = i8;
    break;
   } while (0);
   i1 = HEAP32[i15 + (i7 + 20) >> 2] | 0;
   if (i1) if (i1 >>> 0 < (HEAP32[711] | 0) >>> 0) _abort(); else {
    HEAP32[i8 + 20 >> 2] = i1;
    HEAP32[i1 + 24 >> 2] = i8;
    break;
   }
  }
 } else {
  i3 = HEAP32[i15 + (i7 + 8) >> 2] | 0;
  i2 = HEAP32[i15 + (i7 + 12) >> 2] | 0;
  i1 = 2868 + (i4 << 1 << 2) | 0;
  if ((i3 | 0) != (i1 | 0)) {
   if (i3 >>> 0 < i6 >>> 0) _abort();
   if ((HEAP32[i3 + 12 >> 2] | 0) != (i9 | 0)) _abort();
  }
  if ((i2 | 0) == (i3 | 0)) {
   HEAP32[707] = HEAP32[707] & ~(1 << i4);
   break;
  }
  if ((i2 | 0) != (i1 | 0)) {
   if (i2 >>> 0 < i6 >>> 0) _abort();
   i1 = i2 + 8 | 0;
   if ((HEAP32[i1 >> 2] | 0) == (i9 | 0)) i5 = i1; else _abort();
  } else i5 = i2 + 8 | 0;
  HEAP32[i3 + 12 >> 2] = i2;
  HEAP32[i5 >> 2] = i3;
 } while (0);
 if (i11 >>> 0 < 16) {
  HEAP32[i12 >> 2] = i10 | i13 & 1 | 2;
  i14 = i15 + (i10 | 4) | 0;
  HEAP32[i14 >> 2] = HEAP32[i14 >> 2] | 1;
  return i15 | 0;
 } else {
  HEAP32[i12 >> 2] = i13 & 1 | i14 | 2;
  HEAP32[i15 + (i14 + 4) >> 2] = i11 | 3;
  i13 = i15 + (i10 | 4) | 0;
  HEAP32[i13 >> 2] = HEAP32[i13 >> 2] | 1;
  _dispose_chunk(i15 + i14 | 0, i11);
  return i15 | 0;
 }
 return 0;
}

function __ZN14classificationC2ERKiS1_(i13, i1, i2) {
 i13 = i13 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i14 = 0, i15 = 0, i16 = 0;
 i11 = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i15 = i11 + 20 | 0;
 i5 = i11 + 16 | 0;
 i14 = i11 + 4 | 0;
 i10 = i11;
 __ZN8modelSetC2Ev(i13);
 HEAP32[i13 >> 2] = 1780;
 i12 = HEAP32[i1 >> 2] | 0;
 i8 = i13 + 16 | 0;
 HEAP32[i8 >> 2] = i12;
 i1 = HEAP32[i2 >> 2] | 0;
 i7 = i13 + 32 | 0;
 HEAP32[i7 >> 2] = i1;
 i9 = i13 + 36 | 0;
 HEAP8[i9 >> 0] = 0;
 HEAP32[i15 >> 2] = 0;
 i16 = i15 + 4 | 0;
 HEAP32[i16 >> 2] = 0;
 HEAP32[i15 + 8 >> 2] = 0;
 HEAP32[i5 >> 2] = 0;
 do if ((i12 | 0) > 0) {
  i4 = i15 + 8 | 0;
  i2 = 0;
  i3 = 0;
  i1 = 0;
  while (1) {
   if ((i2 | 0) == (i3 | 0)) {
    __THREW__ = 0;
    invoke_vii(13, i15 | 0, i5 | 0);
    i12 = __THREW__;
    __THREW__ = 0;
    if (i12 & 1) {
     i2 = 8;
     break;
    }
   } else {
    HEAP32[i2 >> 2] = i1;
    HEAP32[i16 >> 2] = i2 + 4;
   }
   i1 = i1 + 1 | 0;
   HEAP32[i5 >> 2] = i1;
   if ((i1 | 0) >= (HEAP32[i8 >> 2] | 0)) {
    i2 = 9;
    break;
   }
   i2 = HEAP32[i16 >> 2] | 0;
   i3 = HEAP32[i4 >> 2] | 0;
  }
  if ((i2 | 0) == 8) {
   i3 = ___cxa_find_matching_catch() | 0;
   break;
  } else if ((i2 | 0) == 9) {
   i1 = HEAP32[i7 >> 2] | 0;
   i2 = 10;
   break;
  }
 } else i2 = 10; while (0);
 L13 : do if ((i2 | 0) == 10) {
  HEAP32[i14 >> 2] = 0;
  i12 = i14 + 4 | 0;
  HEAP32[i12 >> 2] = 0;
  HEAP32[i14 + 8 >> 2] = 0;
  do if ((i1 | 0) > 0) {
   i2 = i13 + 4 | 0;
   i3 = i13 + 8 | 0;
   i4 = i13 + 12 | 0;
   i6 = 0;
   while (1) {
    __THREW__ = 0;
    i1 = invoke_ii(12, 44) | 0;
    i5 = __THREW__;
    __THREW__ = 0;
    if (i5 & 1) {
     i2 = 19;
     break;
    }
    __THREW__ = 0;
    invoke_viiiii(5, i1 | 0, i8 | 0, i15 | 0, i14 | 0, 1);
    i5 = __THREW__;
    __THREW__ = 0;
    if (i5 & 1) {
     i2 = 20;
     break;
    }
    HEAP32[i10 >> 2] = i1;
    i5 = HEAP32[i3 >> 2] | 0;
    if (i5 >>> 0 >= (HEAP32[i4 >> 2] | 0) >>> 0) {
     __THREW__ = 0;
     invoke_vii(14, i2 | 0, i10 | 0);
     i5 = __THREW__;
     __THREW__ = 0;
     if (i5 & 1) {
      i2 = 19;
      break;
     }
    } else {
     HEAP32[i5 >> 2] = i1;
     HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) + 4;
    }
    i6 = i6 + 1 | 0;
    if ((i6 | 0) >= (HEAP32[i7 >> 2] | 0)) {
     i2 = 21;
     break;
    }
   }
   if ((i2 | 0) == 19) {
    i3 = ___cxa_find_matching_catch() | 0;
    i9 = tempRet0;
   } else if ((i2 | 0) == 20) {
    i3 = ___cxa_find_matching_catch() | 0;
    i9 = tempRet0;
    __ZdlPv(i1);
   } else if ((i2 | 0) == 21) {
    i1 = HEAP32[i14 >> 2] | 0;
    HEAP8[i9 >> 0] = 1;
    if (!i1) break;
    i2 = HEAP32[i12 >> 2] | 0;
    if ((i2 | 0) != (i1 | 0)) {
     do {
      i3 = i2 + -24 | 0;
      HEAP32[i12 >> 2] = i3;
      i4 = HEAP32[i2 + -12 >> 2] | 0;
      i5 = i4;
      if (i4) {
       i6 = i2 + -8 | 0;
       i7 = HEAP32[i6 >> 2] | 0;
       if ((i7 | 0) != (i4 | 0)) HEAP32[i6 >> 2] = i7 + (~((i7 + -8 - i5 | 0) >>> 3) << 3);
       __ZdlPv(i4);
      }
      i4 = HEAP32[i3 >> 2] | 0;
      i5 = i4;
      if (i4) {
       i2 = i2 + -20 | 0;
       i3 = HEAP32[i2 >> 2] | 0;
       if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
       __ZdlPv(i4);
      }
      i2 = HEAP32[i12 >> 2] | 0;
     } while ((i2 | 0) != (i1 | 0));
     i1 = HEAP32[i14 >> 2] | 0;
    }
    __ZdlPv(i1);
    break;
   }
   i1 = HEAP32[i14 >> 2] | 0;
   if (!i1) break L13;
   i2 = HEAP32[i12 >> 2] | 0;
   if ((i2 | 0) != (i1 | 0)) {
    do {
     i4 = i2 + -24 | 0;
     HEAP32[i12 >> 2] = i4;
     i5 = HEAP32[i2 + -12 >> 2] | 0;
     i6 = i5;
     if (i5) {
      i7 = i2 + -8 | 0;
      i8 = HEAP32[i7 >> 2] | 0;
      if ((i8 | 0) != (i5 | 0)) HEAP32[i7 >> 2] = i8 + (~((i8 + -8 - i6 | 0) >>> 3) << 3);
      __ZdlPv(i5);
     }
     i5 = HEAP32[i4 >> 2] | 0;
     i6 = i5;
     if (i5) {
      i2 = i2 + -20 | 0;
      i4 = HEAP32[i2 >> 2] | 0;
      if ((i4 | 0) != (i5 | 0)) HEAP32[i2 >> 2] = i4 + (~((i4 + -8 - i6 | 0) >>> 3) << 3);
      __ZdlPv(i5);
     }
     i2 = HEAP32[i12 >> 2] | 0;
    } while ((i2 | 0) != (i1 | 0));
    i1 = HEAP32[i14 >> 2] | 0;
   }
   __ZdlPv(i1);
   break L13;
  } else HEAP8[i9 >> 0] = 1; while (0);
  i1 = HEAP32[i15 >> 2] | 0;
  if (!i1) {
   STACKTOP = i11;
   return;
  }
  i2 = HEAP32[i16 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) HEAP32[i16 >> 2] = i2 + (~((i2 + -4 - i1 | 0) >>> 2) << 2);
  __ZdlPv(i1);
  STACKTOP = i11;
  return;
 } while (0);
 i1 = HEAP32[i15 >> 2] | 0;
 if (!i1) {
  __ZN8modelSetD2Ev(i13);
  ___resumeException(i3 | 0);
 }
 i2 = HEAP32[i16 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) HEAP32[i16 >> 2] = i2 + (~((i2 + -4 - i1 | 0) >>> 2) << 2);
 __ZdlPv(i1);
 __ZN8modelSetD2Ev(i13);
 ___resumeException(i3 | 0);
}

function __ZN20seriesClassification3runERKNSt3__16vectorINS1_IdNS0_9allocatorIdEEEENS2_IS4_EEEE(i18, i16) {
 i18 = i18 | 0;
 i16 = i16 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, d9 = 0.0, d10 = 0.0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i17 = 0, i19 = 0, i20 = 0, i21 = 0;
 i20 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i17 = i20 + 8 | 0;
 i11 = i20 + 28 | 0;
 i15 = i20;
 i21 = i20 + 16 | 0;
 i13 = i18 + 12 | 0;
 i1 = HEAP32[i13 >> 2] | 0;
 i14 = i18 + 16 | 0;
 i2 = HEAP32[i14 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) HEAP32[i14 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
 i12 = HEAP32[i18 >> 2] | 0;
 __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEEC2ERKS5_(i11, i16);
 __THREW__ = 0;
 d9 = +invoke_dii(4, i12 | 0, i11 | 0);
 i12 = __THREW__;
 __THREW__ = 0;
 if (i12 & 1) {
  i8 = ___cxa_find_matching_catch() | 0;
  i6 = tempRet0;
  i1 = HEAP32[i11 >> 2] | 0;
  if (!i1) {
   i21 = i8;
   ___resumeException(i21 | 0);
  }
  i7 = i11 + 4 | 0;
  i2 = HEAP32[i7 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i3 = i2 + -12 | 0;
    HEAP32[i7 >> 2] = i3;
    i4 = HEAP32[i3 >> 2] | 0;
    i5 = i4;
    if (!i4) i2 = i3; else {
     i2 = i2 + -8 | 0;
     i3 = HEAP32[i2 >> 2] | 0;
     if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
     __ZdlPv(i4);
     i2 = HEAP32[i7 >> 2] | 0;
    }
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i11 >> 2] | 0;
  }
  __ZdlPv(i1);
  i21 = i8;
  ___resumeException(i21 | 0);
 }
 i1 = HEAP32[i11 >> 2] | 0;
 if (i1) {
  i6 = i11 + 4 | 0;
  i2 = HEAP32[i6 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i3 = i2 + -12 | 0;
    HEAP32[i6 >> 2] = i3;
    i4 = HEAP32[i3 >> 2] | 0;
    i5 = i4;
    if (!i4) i2 = i3; else {
     i2 = i2 + -8 | 0;
     i3 = HEAP32[i2 >> 2] | 0;
     if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
     __ZdlPv(i4);
     i2 = HEAP32[i6 >> 2] | 0;
    }
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i11 >> 2] | 0;
  }
  __ZdlPv(i1);
 }
 HEAPF64[i17 >> 3] = d9;
 i1 = HEAP32[i14 >> 2] | 0;
 i11 = i18 + 20 | 0;
 if ((i1 | 0) == (HEAP32[i11 >> 2] | 0)) __ZNSt3__16vectorIdNS_9allocatorIdEEE21__push_back_slow_pathIRKdEEvOT_(i13, i17); else {
  HEAPF64[i1 >> 3] = d9;
  HEAP32[i14 >> 2] = i1 + 8;
 }
 i8 = i18 + 4 | 0;
 i1 = HEAP32[i18 >> 2] | 0;
 if ((HEAP32[i8 >> 2] | 0) - i1 >> 4 >>> 0 <= 1) {
  i21 = 0;
  STACKTOP = i20;
  return i21 | 0;
 }
 i12 = i21 + 4 | 0;
 i2 = i1;
 d10 = d9;
 i1 = 0;
 i7 = 1;
 while (1) {
  __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEEC2ERKS5_(i21, i16);
  __THREW__ = 0;
  d9 = +invoke_dii(4, i2 + (i7 << 4) | 0, i21 | 0);
  i6 = __THREW__;
  __THREW__ = 0;
  if (i6 & 1) break;
  i2 = HEAP32[i21 >> 2] | 0;
  if (i2) {
   i3 = HEAP32[i12 >> 2] | 0;
   if ((i3 | 0) != (i2 | 0)) {
    do {
     i4 = i3 + -12 | 0;
     HEAP32[i12 >> 2] = i4;
     i5 = HEAP32[i4 >> 2] | 0;
     i6 = i5;
     if (!i5) i3 = i4; else {
      i3 = i3 + -8 | 0;
      i4 = HEAP32[i3 >> 2] | 0;
      if ((i4 | 0) != (i5 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i6 | 0) >>> 3) << 3);
      __ZdlPv(i5);
      i3 = HEAP32[i12 >> 2] | 0;
     }
    } while ((i3 | 0) != (i2 | 0));
    i2 = HEAP32[i21 >> 2] | 0;
   }
   __ZdlPv(i2);
  }
  HEAPF64[i15 >> 3] = d9;
  i2 = HEAP32[i14 >> 2] | 0;
  if ((i2 | 0) == (HEAP32[i11 >> 2] | 0)) __ZNSt3__16vectorIdNS_9allocatorIdEEE21__push_back_slow_pathIRKdEEvOT_(i13, i15); else {
   HEAPF64[i2 >> 3] = d9;
   HEAP32[i14 >> 2] = i2 + 8;
  }
  if (d9 < d10) {
   HEAPF64[i17 >> 3] = d9;
   i1 = i7;
  } else d9 = d10;
  i7 = i7 + 1 | 0;
  i2 = HEAP32[i18 >> 2] | 0;
  if (i7 >>> 0 >= (HEAP32[i8 >> 2] | 0) - i2 >> 4 >>> 0) {
   i19 = 52;
   break;
  } else d10 = d9;
 }
 if ((i19 | 0) == 52) {
  STACKTOP = i20;
  return i1 | 0;
 }
 i7 = ___cxa_find_matching_catch() | 0;
 i6 = tempRet0;
 i1 = HEAP32[i21 >> 2] | 0;
 if (!i1) {
  i21 = i7;
  ___resumeException(i21 | 0);
 }
 i2 = HEAP32[i12 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) {
  do {
   i3 = i2 + -12 | 0;
   HEAP32[i12 >> 2] = i3;
   i4 = HEAP32[i3 >> 2] | 0;
   i5 = i4;
   if (!i4) i2 = i3; else {
    i2 = i2 + -8 | 0;
    i3 = HEAP32[i2 >> 2] | 0;
    if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
    __ZdlPv(i4);
    i2 = HEAP32[i12 >> 2] | 0;
   }
  } while ((i2 | 0) != (i1 | 0));
  i1 = HEAP32[i21 >> 2] | 0;
 }
 __ZdlPv(i1);
 i21 = i7;
 ___resumeException(i21 | 0);
 return 0;
}

function __ZN6LIBSVM6Kernel10k_functionEPKNS_8svm_nodeES3_RKNS_13svm_parameterE(i3, i4, i8) {
 i3 = i3 | 0;
 i4 = i4 | 0;
 i8 = i8 | 0;
 var d1 = 0.0, d2 = 0.0, i5 = 0, i6 = 0, d7 = 0.0;
 switch (HEAP32[i8 + 4 >> 2] | 0) {
 case 0:
  {
   i5 = HEAP32[i3 >> 2] | 0;
   if ((i5 | 0) == -1) {
    d7 = 0.0;
    return +d7;
   } else d1 = 0.0;
   L5 : while (1) {
    i6 = i5;
    L7 : while (1) {
     i5 = HEAP32[i4 >> 2] | 0;
     if ((i5 | 0) == -1) {
      i5 = 44;
      break L5;
     }
     while (1) {
      if ((i6 | 0) == (i5 | 0)) break L7;
      if ((i6 | 0) <= (i5 | 0)) break;
      i4 = i4 + 16 | 0;
      i5 = HEAP32[i4 >> 2] | 0;
      if ((i5 | 0) == -1) {
       i5 = 44;
       break L5;
      }
     }
     i3 = i3 + 16 | 0;
     i5 = HEAP32[i3 >> 2] | 0;
     if ((i5 | 0) == -1) {
      i5 = 44;
      break L5;
     } else i6 = i5;
    }
    d1 = d1 + +HEAPF64[i3 + 8 >> 3] * +HEAPF64[i4 + 8 >> 3];
    i3 = i3 + 16 | 0;
    i5 = HEAP32[i3 >> 2] | 0;
    if ((i5 | 0) == -1) {
     i5 = 44;
     break;
    } else i4 = i4 + 16 | 0;
   }
   if ((i5 | 0) == 44) return +d1;
   break;
  }
 case 1:
  {
   d7 = +HEAPF64[i8 + 16 >> 3];
   i5 = HEAP32[i3 >> 2] | 0;
   L21 : do if ((i5 | 0) == -1) d2 = 0.0; else {
    d2 = 0.0;
    while (1) {
     L24 : while (1) {
      i6 = HEAP32[i4 >> 2] | 0;
      if ((i6 | 0) == -1) break L21;
      while (1) {
       if ((i5 | 0) == (i6 | 0)) break L24;
       if ((i5 | 0) <= (i6 | 0)) break;
       i4 = i4 + 16 | 0;
       i6 = HEAP32[i4 >> 2] | 0;
       if ((i6 | 0) == -1) break L21;
      }
      i3 = i3 + 16 | 0;
      i5 = HEAP32[i3 >> 2] | 0;
      if ((i5 | 0) == -1) break L21;
     }
     d2 = d2 + +HEAPF64[i3 + 8 >> 3] * +HEAPF64[i4 + 8 >> 3];
     i3 = i3 + 16 | 0;
     i5 = HEAP32[i3 >> 2] | 0;
     if ((i5 | 0) == -1) break; else i4 = i4 + 16 | 0;
    }
   } while (0);
   i3 = HEAP32[i8 + 8 >> 2] | 0;
   if ((i3 | 0) <= 0) {
    d7 = 1.0;
    return +d7;
   }
   d1 = 1.0;
   d2 = d7 * d2 + +HEAPF64[i8 + 24 >> 3];
   while (1) {
    d1 = ((i3 | 0) % 2 | 0 | 0) == 1 ? d1 * d2 : d1;
    if ((i3 | 0) > 1) {
     i3 = (i3 | 0) / 2 | 0;
     d2 = d2 * d2;
    } else break;
   }
   return +d1;
  }
 case 2:
  {
   i5 = HEAP32[i3 >> 2] | 0;
   L40 : do if ((i5 | 0) == -1) d1 = 0.0; else {
    d1 = 0.0;
    do {
     i6 = HEAP32[i4 >> 2] | 0;
     if ((i6 | 0) == -1) break L40;
     while (1) {
      if ((i5 | 0) == (i6 | 0)) {
       i5 = 24;
       break;
      }
      if ((i5 | 0) > (i6 | 0)) {
       i5 = 28;
       break;
      }
      d7 = +HEAPF64[i3 + 8 >> 3];
      d1 = d1 + d7 * d7;
      i3 = i3 + 16 | 0;
      i5 = HEAP32[i3 >> 2] | 0;
      if ((i5 | 0) == -1) break L40;
     }
     if ((i5 | 0) == 24) {
      d2 = +HEAPF64[i3 + 8 >> 3] - +HEAPF64[i4 + 8 >> 3];
      i3 = i3 + 16 | 0;
      d2 = d2 * d2;
     } else if ((i5 | 0) == 28) {
      d2 = +HEAPF64[i4 + 8 >> 3];
      d2 = d2 * d2;
     }
     d1 = d1 + d2;
     i4 = i4 + 16 | 0;
     i5 = HEAP32[i3 >> 2] | 0;
    } while ((i5 | 0) != -1);
   } while (0);
   if ((HEAP32[i3 >> 2] | 0) != -1) do {
    d7 = +HEAPF64[i3 + 8 >> 3];
    d1 = d1 + d7 * d7;
    i3 = i3 + 16 | 0;
   } while ((HEAP32[i3 >> 2] | 0) != -1);
   if ((HEAP32[i4 >> 2] | 0) != -1) do {
    d7 = +HEAPF64[i4 + 8 >> 3];
    d1 = d1 + d7 * d7;
    i4 = i4 + 16 | 0;
   } while ((HEAP32[i4 >> 2] | 0) != -1);
   d7 = +Math_exp(+-(d1 * +HEAPF64[i8 + 16 >> 3]));
   return +d7;
  }
 case 3:
  {
   d2 = +HEAPF64[i8 + 16 >> 3];
   i5 = HEAP32[i3 >> 2] | 0;
   L62 : do if ((i5 | 0) == -1) d1 = 0.0; else {
    d1 = 0.0;
    while (1) {
     L65 : while (1) {
      i6 = HEAP32[i4 >> 2] | 0;
      if ((i6 | 0) == -1) break L62;
      while (1) {
       if ((i5 | 0) == (i6 | 0)) break L65;
       if ((i5 | 0) <= (i6 | 0)) break;
       i4 = i4 + 16 | 0;
       i6 = HEAP32[i4 >> 2] | 0;
       if ((i6 | 0) == -1) break L62;
      }
      i3 = i3 + 16 | 0;
      i5 = HEAP32[i3 >> 2] | 0;
      if ((i5 | 0) == -1) break L62;
     }
     d1 = d1 + +HEAPF64[i3 + 8 >> 3] * +HEAPF64[i4 + 8 >> 3];
     i3 = i3 + 16 | 0;
     i5 = HEAP32[i3 >> 2] | 0;
     if ((i5 | 0) == -1) break; else i4 = i4 + 16 | 0;
    }
   } while (0);
   d7 = +_tanh(d2 * d1 + +HEAPF64[i8 + 24 >> 3]);
   return +d7;
  }
 case 4:
  {
   d7 = +HEAPF64[i3 + (~~+HEAPF64[i4 + 8 >> 3] << 4) + 8 >> 3];
   return +d7;
  }
 default:
  {
   d7 = 0.0;
   return +d7;
  }
 }
 return +(0.0);
}

function __ZN10emscripten8internal7InvokerIP13neuralNetworkJOiONSt3__16vectorIiNS5_9allocatorIiEEEES4_S4_ONS6_IdNS7_IdEEEESD_SD_SD_OdSE_EE6invokeEPFS3_S4_SA_S4_S4_SD_SD_SD_SD_SE_SE_EiPS9_iiPSC_SJ_SJ_SJ_dd(i16, i6, i7, i8, i9, i10, i11, i12, i13, d14, d15) {
 i16 = i16 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 i8 = i8 | 0;
 i9 = i9 | 0;
 i10 = i10 | 0;
 i11 = i11 | 0;
 i12 = i12 | 0;
 i13 = i13 | 0;
 d14 = +d14;
 d15 = +d15;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0;
 i19 = STACKTOP;
 STACKTOP = STACKTOP + 96 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i1 = i19 + 84 | 0;
 i22 = i19 + 72 | 0;
 i2 = i19 + 68 | 0;
 i3 = i19 + 64 | 0;
 i21 = i19 + 52 | 0;
 i20 = i19 + 40 | 0;
 i18 = i19 + 28 | 0;
 i17 = i19 + 16 | 0;
 i4 = i19 + 8 | 0;
 i5 = i19;
 HEAP32[i1 >> 2] = i6;
 __ZNSt3__16vectorIiNS_9allocatorIiEEEC2ERKS3_(i22, i7);
 HEAP32[i2 >> 2] = i8;
 HEAP32[i3 >> 2] = i9;
 __THREW__ = 0;
 invoke_vii(8, i21 | 0, i10 | 0);
 i10 = __THREW__;
 __THREW__ = 0;
 if (!(i10 & 1)) {
  __THREW__ = 0;
  invoke_vii(8, i20 | 0, i11 | 0);
  i11 = __THREW__;
  __THREW__ = 0;
  if (!(i11 & 1)) {
   __THREW__ = 0;
   invoke_vii(8, i18 | 0, i12 | 0);
   i12 = __THREW__;
   __THREW__ = 0;
   if (!(i12 & 1)) {
    __THREW__ = 0;
    invoke_vii(8, i17 | 0, i13 | 0);
    i13 = __THREW__;
    __THREW__ = 0;
    do if (i13 & 1) i3 = ___cxa_find_matching_catch() | 0; else {
     HEAPF64[i4 >> 3] = d14;
     HEAPF64[i5 >> 3] = d15;
     __THREW__ = 0;
     i5 = invoke_iiiiiiiiiii(i16 | 0, i1 | 0, i22 | 0, i2 | 0, i3 | 0, i21 | 0, i20 | 0, i18 | 0, i17 | 0, i4 | 0, i5 | 0) | 0;
     i16 = __THREW__;
     __THREW__ = 0;
     if (i16 & 1) {
      i3 = ___cxa_find_matching_catch() | 0;
      i4 = HEAP32[i17 >> 2] | 0;
      if (!i4) break;
      i1 = i17 + 4 | 0;
      i2 = HEAP32[i1 >> 2] | 0;
      if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
      __ZdlPv(i4);
      break;
     }
     i3 = HEAP32[i17 >> 2] | 0;
     i4 = i3;
     if (i3) {
      i1 = i17 + 4 | 0;
      i2 = HEAP32[i1 >> 2] | 0;
      if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
      __ZdlPv(i3);
     }
     i3 = HEAP32[i18 >> 2] | 0;
     i4 = i3;
     if (i3) {
      i1 = i18 + 4 | 0;
      i2 = HEAP32[i1 >> 2] | 0;
      if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
      __ZdlPv(i3);
     }
     i3 = HEAP32[i20 >> 2] | 0;
     i4 = i3;
     if (i3) {
      i1 = i20 + 4 | 0;
      i2 = HEAP32[i1 >> 2] | 0;
      if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
      __ZdlPv(i3);
     }
     i3 = HEAP32[i21 >> 2] | 0;
     i4 = i3;
     if (i3) {
      i1 = i21 + 4 | 0;
      i2 = HEAP32[i1 >> 2] | 0;
      if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
      __ZdlPv(i3);
     }
     i3 = HEAP32[i22 >> 2] | 0;
     if (!i3) {
      STACKTOP = i19;
      return i5 | 0;
     }
     i1 = i22 + 4 | 0;
     i2 = HEAP32[i1 >> 2] | 0;
     if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -4 - i3 | 0) >>> 2) << 2);
     __ZdlPv(i3);
     STACKTOP = i19;
     return i5 | 0;
    } while (0);
    i4 = HEAP32[i18 >> 2] | 0;
    i5 = i4;
    if (i4) {
     i1 = i18 + 4 | 0;
     i2 = HEAP32[i1 >> 2] | 0;
     if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i5 | 0) >>> 3) << 3);
     __ZdlPv(i4);
    }
   } else i3 = ___cxa_find_matching_catch() | 0;
   i4 = HEAP32[i20 >> 2] | 0;
   i5 = i4;
   if (i4) {
    i1 = i20 + 4 | 0;
    i2 = HEAP32[i1 >> 2] | 0;
    if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i5 | 0) >>> 3) << 3);
    __ZdlPv(i4);
   }
  } else i3 = ___cxa_find_matching_catch() | 0;
  i4 = HEAP32[i21 >> 2] | 0;
  i5 = i4;
  if (i4) {
   i1 = i21 + 4 | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i5 | 0) >>> 3) << 3);
   __ZdlPv(i4);
  }
 } else i3 = ___cxa_find_matching_catch() | 0;
 i4 = HEAP32[i22 >> 2] | 0;
 if (!i4) ___resumeException(i3 | 0);
 i1 = i22 + 4 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -4 - i4 | 0) >>> 2) << 2);
 __ZdlPv(i4);
 ___resumeException(i3 | 0);
 return 0;
}

function __ZNSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEE6assignIPS1_EENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIS1_NS_15iterator_traitsIS8_E9referenceEEE5valueEvE4typeES8_S8_(i8, i2, i11) {
 i8 = i8 | 0;
 i2 = i2 | 0;
 i11 = i11 | 0;
 var i1 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i9 = 0, i10 = 0, i12 = 0;
 i4 = i2;
 i3 = (i11 - i4 | 0) / 24 | 0;
 i7 = i8 + 8 | 0;
 i6 = HEAP32[i8 >> 2] | 0;
 i1 = i6;
 if (i3 >>> 0 > (((HEAP32[i7 >> 2] | 0) - i1 | 0) / 24 | 0) >>> 0) {
  __ZNSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEE10deallocateEv(i8);
  i5 = i3 >>> 0 > 178956970;
  if (i5) __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i8);
  i1 = ((HEAP32[i7 >> 2] | 0) - (HEAP32[i8 >> 2] | 0) | 0) / 24 | 0;
  if (i1 >>> 0 < 89478485) {
   i4 = i1 << 1;
   i1 = i4 >>> 0 >= i3 >>> 0;
   if (i1 | i5 ^ 1) i3 = i1 ? i4 : i3; else __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i8);
  } else i3 = 178956970;
  i1 = __Znwj(i3 * 24 | 0) | 0;
  i4 = i8 + 4 | 0;
  HEAP32[i4 >> 2] = i1;
  HEAP32[i8 >> 2] = i1;
  HEAP32[i7 >> 2] = i1 + (i3 * 24 | 0);
  if ((i2 | 0) == (i11 | 0)) return;
  while (1) {
   __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i1, i2);
   __THREW__ = 0;
   invoke_vii(8, i1 + 12 | 0, i2 + 12 | 0);
   i10 = __THREW__;
   __THREW__ = 0;
   if (i10 & 1) {
    i9 = i1;
    break;
   }
   i1 = (HEAP32[i4 >> 2] | 0) + 24 | 0;
   HEAP32[i4 >> 2] = i1;
   i2 = i2 + 24 | 0;
   if ((i2 | 0) == (i11 | 0)) {
    i12 = 42;
    break;
   }
  }
  if ((i12 | 0) == 42) return;
  i3 = ___cxa_find_matching_catch() | 0;
  i4 = HEAP32[i9 >> 2] | 0;
  if (!i4) ___resumeException(i3 | 0);
  i1 = i9 + 4 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
  __ZdlPv(i4);
  ___resumeException(i3 | 0);
 }
 i8 = i8 + 4 | 0;
 i1 = ((HEAP32[i8 >> 2] | 0) - i1 | 0) / 24 | 0;
 i5 = i3 >>> 0 > i1 >>> 0;
 i1 = i5 ? i2 + (i1 * 24 | 0) | 0 : i11;
 if ((i1 | 0) == (i2 | 0)) i7 = i6; else {
  i4 = i1 + -24 - i4 | 0;
  i3 = i6;
  while (1) {
   if ((i3 | 0) != (i2 | 0)) {
    __ZNSt3__16vectorIdNS_9allocatorIdEEE6assignIPdEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIdNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(i3, HEAP32[i2 >> 2] | 0, HEAP32[i2 + 4 >> 2] | 0);
    __ZNSt3__16vectorIdNS_9allocatorIdEEE6assignIPdEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIdNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(i3 + 12 | 0, HEAP32[i2 + 12 >> 2] | 0, HEAP32[i2 + 16 >> 2] | 0);
   }
   i2 = i2 + 24 | 0;
   if ((i2 | 0) == (i1 | 0)) break; else i3 = i3 + 24 | 0;
  }
  i7 = i6 + ((((i4 >>> 0) / 24 | 0) + 1 | 0) * 24 | 0) | 0;
 }
 if (i5) {
  if ((i1 | 0) == (i11 | 0)) return;
  i2 = HEAP32[i8 >> 2] | 0;
  while (1) {
   __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i2, i1);
   __THREW__ = 0;
   invoke_vii(8, i2 + 12 | 0, i1 + 12 | 0);
   i9 = __THREW__;
   __THREW__ = 0;
   if (i9 & 1) {
    i10 = i2;
    break;
   }
   i2 = (HEAP32[i8 >> 2] | 0) + 24 | 0;
   HEAP32[i8 >> 2] = i2;
   i1 = i1 + 24 | 0;
   if ((i1 | 0) == (i11 | 0)) {
    i12 = 42;
    break;
   }
  }
  if ((i12 | 0) == 42) return;
  i3 = ___cxa_find_matching_catch() | 0;
  i4 = HEAP32[i10 >> 2] | 0;
  if (!i4) ___resumeException(i3 | 0);
  i1 = i10 + 4 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
  __ZdlPv(i4);
  ___resumeException(i3 | 0);
 } else {
  i1 = HEAP32[i8 >> 2] | 0;
  if ((i1 | 0) == (i7 | 0)) return;
  do {
   i2 = i1 + -24 | 0;
   HEAP32[i8 >> 2] = i2;
   i3 = HEAP32[i1 + -12 >> 2] | 0;
   i4 = i3;
   if (i3) {
    i5 = i1 + -8 | 0;
    i6 = HEAP32[i5 >> 2] | 0;
    if ((i6 | 0) != (i3 | 0)) HEAP32[i5 >> 2] = i6 + (~((i6 + -8 - i4 | 0) >>> 3) << 3);
    __ZdlPv(i3);
   }
   i3 = HEAP32[i2 >> 2] | 0;
   i4 = i3;
   if (i3) {
    i1 = i1 + -20 | 0;
    i2 = HEAP32[i1 >> 2] | 0;
    if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
    __ZdlPv(i3);
   }
   i1 = HEAP32[i8 >> 2] | 0;
  } while ((i1 | 0) != (i7 | 0));
  return;
 }
}

function __ZN13neuralNetworkD2Ev(i11) {
 i11 = i11 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0;
 HEAP32[i11 >> 2] = 1312;
 i1 = HEAP32[i11 + 172 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = i11 + 176 | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i1 = HEAP32[i11 + 160 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = i11 + 164 | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i9 = i11 + 148 | 0;
 i1 = HEAP32[i9 >> 2] | 0;
 if (i1) {
  i10 = i11 + 152 | 0;
  i2 = HEAP32[i10 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i7 = i2 + -12 | 0;
    HEAP32[i10 >> 2] = i7;
    i8 = HEAP32[i7 >> 2] | 0;
    if (!i8) i2 = i7; else {
     i6 = i2 + -8 | 0;
     i2 = HEAP32[i6 >> 2] | 0;
     if ((i2 | 0) == (i8 | 0)) i2 = i8; else {
      do {
       i3 = i2 + -12 | 0;
       HEAP32[i6 >> 2] = i3;
       i4 = HEAP32[i3 >> 2] | 0;
       i5 = i4;
       if (!i4) i2 = i3; else {
        i2 = i2 + -8 | 0;
        i3 = HEAP32[i2 >> 2] | 0;
        if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
        __ZdlPv(i4);
        i2 = HEAP32[i6 >> 2] | 0;
       }
      } while ((i2 | 0) != (i8 | 0));
      i2 = HEAP32[i7 >> 2] | 0;
     }
     __ZdlPv(i2);
     i2 = HEAP32[i10 >> 2] | 0;
    }
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i9 >> 2] | 0;
  }
  __ZdlPv(i1);
 }
 i1 = HEAP32[i11 + 100 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = i11 + 104 | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i1 = HEAP32[i11 + 88 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = i11 + 92 | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i1 = HEAP32[i11 + 76 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = i11 + 80 | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i9 = i11 + 64 | 0;
 i1 = HEAP32[i9 >> 2] | 0;
 if (i1) {
  i10 = i11 + 68 | 0;
  i2 = HEAP32[i10 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   i3 = i2;
   while (1) {
    i8 = i3 + -12 | 0;
    HEAP32[i10 >> 2] = i8;
    i2 = HEAP32[i8 >> 2] | 0;
    if (!i2) i2 = i8; else {
     i7 = i3 + -8 | 0;
     i3 = HEAP32[i7 >> 2] | 0;
     if ((i3 | 0) != (i2 | 0)) {
      i4 = i3;
      while (1) {
       i3 = i4 + -12 | 0;
       HEAP32[i7 >> 2] = i3;
       i5 = HEAP32[i3 >> 2] | 0;
       i6 = i5;
       if (i5) {
        i3 = i4 + -8 | 0;
        i4 = HEAP32[i3 >> 2] | 0;
        if ((i4 | 0) != (i5 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i6 | 0) >>> 3) << 3);
        __ZdlPv(i5);
        i3 = HEAP32[i7 >> 2] | 0;
       }
       if ((i3 | 0) == (i2 | 0)) break; else i4 = i3;
      }
      i2 = HEAP32[i8 >> 2] | 0;
     }
     __ZdlPv(i2);
     i2 = HEAP32[i10 >> 2] | 0;
    }
    if ((i2 | 0) == (i1 | 0)) break; else i3 = i2;
   }
   i1 = HEAP32[i9 >> 2] | 0;
  }
  __ZdlPv(i1);
 }
 i6 = i11 + 40 | 0;
 i1 = HEAP32[i6 >> 2] | 0;
 if (i1) {
  i7 = i11 + 44 | 0;
  i2 = HEAP32[i7 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i3 = i2 + -12 | 0;
    HEAP32[i7 >> 2] = i3;
    i4 = HEAP32[i3 >> 2] | 0;
    i5 = i4;
    if (!i4) i2 = i3; else {
     i2 = i2 + -8 | 0;
     i3 = HEAP32[i2 >> 2] | 0;
     if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
     __ZdlPv(i4);
     i2 = HEAP32[i7 >> 2] | 0;
    }
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i6 >> 2] | 0;
  }
  __ZdlPv(i1);
 }
 i1 = HEAP32[i11 + 28 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = i11 + 32 | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i3 = HEAP32[i11 + 8 >> 2] | 0;
 if (!i3) return;
 i1 = i11 + 12 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -4 - i3 | 0) >>> 2) << 2);
 __ZdlPv(i3);
 return;
}

function ___udivmoddi4(i5, i6, i8, i11, i13) {
 i5 = i5 | 0;
 i6 = i6 | 0;
 i8 = i8 | 0;
 i11 = i11 | 0;
 i13 = i13 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i7 = 0, i9 = 0, i10 = 0, i12 = 0, i14 = 0, i15 = 0;
 i9 = i5;
 i4 = i6;
 i7 = i4;
 i2 = i8;
 i12 = i11;
 i3 = i12;
 if (!i7) {
  i1 = (i13 | 0) != 0;
  if (!i3) {
   if (i1) {
    HEAP32[i13 >> 2] = (i9 >>> 0) % (i2 >>> 0);
    HEAP32[i13 + 4 >> 2] = 0;
   }
   i12 = 0;
   i13 = (i9 >>> 0) / (i2 >>> 0) >>> 0;
   return (tempRet0 = i12, i13) | 0;
  } else {
   if (!i1) {
    i12 = 0;
    i13 = 0;
    return (tempRet0 = i12, i13) | 0;
   }
   HEAP32[i13 >> 2] = i5 | 0;
   HEAP32[i13 + 4 >> 2] = i6 & 0;
   i12 = 0;
   i13 = 0;
   return (tempRet0 = i12, i13) | 0;
  }
 }
 i1 = (i3 | 0) == 0;
 do if (i2) {
  if (!i1) {
   i1 = (Math_clz32(i3 | 0) | 0) - (Math_clz32(i7 | 0) | 0) | 0;
   if (i1 >>> 0 <= 31) {
    i10 = i1 + 1 | 0;
    i3 = 31 - i1 | 0;
    i6 = i1 - 31 >> 31;
    i2 = i10;
    i5 = i9 >>> (i10 >>> 0) & i6 | i7 << i3;
    i6 = i7 >>> (i10 >>> 0) & i6;
    i1 = 0;
    i3 = i9 << i3;
    break;
   }
   if (!i13) {
    i12 = 0;
    i13 = 0;
    return (tempRet0 = i12, i13) | 0;
   }
   HEAP32[i13 >> 2] = i5 | 0;
   HEAP32[i13 + 4 >> 2] = i4 | i6 & 0;
   i12 = 0;
   i13 = 0;
   return (tempRet0 = i12, i13) | 0;
  }
  i1 = i2 - 1 | 0;
  if (i1 & i2) {
   i3 = (Math_clz32(i2 | 0) | 0) + 33 - (Math_clz32(i7 | 0) | 0) | 0;
   i15 = 64 - i3 | 0;
   i10 = 32 - i3 | 0;
   i4 = i10 >> 31;
   i14 = i3 - 32 | 0;
   i6 = i14 >> 31;
   i2 = i3;
   i5 = i10 - 1 >> 31 & i7 >>> (i14 >>> 0) | (i7 << i10 | i9 >>> (i3 >>> 0)) & i6;
   i6 = i6 & i7 >>> (i3 >>> 0);
   i1 = i9 << i15 & i4;
   i3 = (i7 << i15 | i9 >>> (i14 >>> 0)) & i4 | i9 << i10 & i3 - 33 >> 31;
   break;
  }
  if (i13) {
   HEAP32[i13 >> 2] = i1 & i9;
   HEAP32[i13 + 4 >> 2] = 0;
  }
  if ((i2 | 0) == 1) {
   i14 = i4 | i6 & 0;
   i15 = i5 | 0 | 0;
   return (tempRet0 = i14, i15) | 0;
  } else {
   i15 = _llvm_cttz_i32(i2 | 0) | 0;
   i14 = i7 >>> (i15 >>> 0) | 0;
   i15 = i7 << 32 - i15 | i9 >>> (i15 >>> 0) | 0;
   return (tempRet0 = i14, i15) | 0;
  }
 } else {
  if (i1) {
   if (i13) {
    HEAP32[i13 >> 2] = (i7 >>> 0) % (i2 >>> 0);
    HEAP32[i13 + 4 >> 2] = 0;
   }
   i14 = 0;
   i15 = (i7 >>> 0) / (i2 >>> 0) >>> 0;
   return (tempRet0 = i14, i15) | 0;
  }
  if (!i9) {
   if (i13) {
    HEAP32[i13 >> 2] = 0;
    HEAP32[i13 + 4 >> 2] = (i7 >>> 0) % (i3 >>> 0);
   }
   i14 = 0;
   i15 = (i7 >>> 0) / (i3 >>> 0) >>> 0;
   return (tempRet0 = i14, i15) | 0;
  }
  i1 = i3 - 1 | 0;
  if (!(i1 & i3)) {
   if (i13) {
    HEAP32[i13 >> 2] = i5 | 0;
    HEAP32[i13 + 4 >> 2] = i1 & i7 | i6 & 0;
   }
   i14 = 0;
   i15 = i7 >>> ((_llvm_cttz_i32(i3 | 0) | 0) >>> 0);
   return (tempRet0 = i14, i15) | 0;
  }
  i1 = (Math_clz32(i3 | 0) | 0) - (Math_clz32(i7 | 0) | 0) | 0;
  if (i1 >>> 0 <= 30) {
   i6 = i1 + 1 | 0;
   i3 = 31 - i1 | 0;
   i2 = i6;
   i5 = i7 << i3 | i9 >>> (i6 >>> 0);
   i6 = i7 >>> (i6 >>> 0);
   i1 = 0;
   i3 = i9 << i3;
   break;
  }
  if (!i13) {
   i14 = 0;
   i15 = 0;
   return (tempRet0 = i14, i15) | 0;
  }
  HEAP32[i13 >> 2] = i5 | 0;
  HEAP32[i13 + 4 >> 2] = i4 | i6 & 0;
  i14 = 0;
  i15 = 0;
  return (tempRet0 = i14, i15) | 0;
 } while (0);
 if (!i2) {
  i7 = i3;
  i4 = 0;
  i3 = 0;
 } else {
  i10 = i8 | 0 | 0;
  i9 = i12 | i11 & 0;
  i7 = _i64Add(i10 | 0, i9 | 0, -1, -1) | 0;
  i8 = tempRet0;
  i4 = i3;
  i3 = 0;
  do {
   i11 = i4;
   i4 = i1 >>> 31 | i4 << 1;
   i1 = i3 | i1 << 1;
   i11 = i5 << 1 | i11 >>> 31 | 0;
   i12 = i5 >>> 31 | i6 << 1 | 0;
   _i64Subtract(i7, i8, i11, i12) | 0;
   i15 = tempRet0;
   i14 = i15 >> 31 | ((i15 | 0) < 0 ? -1 : 0) << 1;
   i3 = i14 & 1;
   i5 = _i64Subtract(i11, i12, i14 & i10, (((i15 | 0) < 0 ? -1 : 0) >> 31 | ((i15 | 0) < 0 ? -1 : 0) << 1) & i9) | 0;
   i6 = tempRet0;
   i2 = i2 - 1 | 0;
  } while ((i2 | 0) != 0);
  i7 = i4;
  i4 = 0;
 }
 i2 = 0;
 if (i13) {
  HEAP32[i13 >> 2] = i5;
  HEAP32[i13 + 4 >> 2] = i6;
 }
 i14 = (i1 | 0) >>> 31 | (i7 | i2) << 1 | (i2 << 1 | i1 >>> 31) & 0 | i4;
 i15 = (i1 << 1 | 0 >>> 31) & -2 | i3;
 return (tempRet0 = i14, i15) | 0;
}

function __ZN13neuralNetwork13backpropagateERKd(i30, i1) {
 i30 = i30 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, d4 = 0.0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, d11 = 0.0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, i27 = 0, i28 = 0, i29 = 0, i31 = 0, d32 = 0.0, i33 = 0;
 d11 = (+HEAPF64[i1 >> 3] - +HEAPF64[i30 + 56 >> 3]) / +HEAPF64[i30 + 112 >> 3];
 i23 = i30 + 184 | 0;
 HEAPF64[i23 >> 3] = d11;
 i24 = i30 + 24 | 0;
 i31 = HEAP32[i24 >> 2] | 0;
 i22 = (i31 | 0) > 0;
 if (i22) {
  i1 = HEAP32[(HEAP32[i30 + 40 >> 2] | 0) + (((HEAP32[i30 + 20 >> 2] | 0) + -1 | 0) * 12 | 0) >> 2] | 0;
  i2 = 0;
  d4 = 0.0;
  do {
   d32 = +HEAPF64[i1 + (i2 << 3) >> 3];
   d4 = d4 + d32 * d32;
   i2 = i2 + 1 | 0;
  } while ((i2 | 0) < (i31 | 0));
 } else d4 = 0.0;
 d4 = d4 <= 2.0 ? 1.0 : d4;
 i27 = (i31 | 0) < 0;
 if (!i27) {
  i5 = i30 + 128 | 0;
  i6 = i30 + 136 | 0;
  i2 = HEAP32[i30 + 20 >> 2] | 0;
  i3 = HEAP32[i30 + 160 >> 2] | 0;
  i7 = HEAP32[(HEAP32[i30 + 40 >> 2] | 0) + ((i2 + -1 | 0) * 12 | 0) >> 2] | 0;
  HEAPF64[i3 >> 3] = +HEAPF64[i5 >> 3] * (+HEAPF64[i7 >> 3] / d4) * d11 + +HEAPF64[i6 >> 3] * +HEAPF64[i3 >> 3];
  if ((i31 | 0) > 0) {
   i1 = 0;
   do {
    i1 = i1 + 1 | 0;
    i21 = i3 + (i1 << 3) | 0;
    HEAPF64[i21 >> 3] = +HEAPF64[i5 >> 3] * (+HEAPF64[i7 + (i1 << 3) >> 3] / d4) * +HEAPF64[i23 >> 3] + +HEAPF64[i6 >> 3] * +HEAPF64[i21 >> 3];
   } while ((i1 | 0) < (i31 | 0));
   i21 = i2;
  } else i21 = i2;
 } else i21 = HEAP32[i30 + 20 >> 2] | 0;
 i7 = (i21 | 0) > 0;
 if (i7) {
  i8 = i30 + 76 | 0;
  i9 = i30 + 40 | 0;
  i10 = i30 + 172 | 0;
  i12 = i30 + 4 | 0;
  i13 = i30 + 128 | 0;
  i14 = i30 + 28 | 0;
  i15 = i30 + 136 | 0;
  i16 = i30 + 148 | 0;
  i19 = 0;
  do {
   if (i22) {
    i2 = (i19 | 0) == 0 ? i12 : i24;
    i3 = HEAP32[i8 >> 2] | 0;
    i5 = HEAP32[HEAP32[i9 >> 2] >> 2] | 0;
    i6 = HEAP32[i10 >> 2] | 0;
    i20 = 0;
    do {
     d4 = +HEAPF64[i5 + (i20 << 3) >> 3];
     d4 = +HEAPF64[i3 + (i20 << 3) >> 3] * +HEAPF64[i23 >> 3] * (d4 * (1.0 - d4));
     i17 = i6 + (i20 << 3) | 0;
     HEAPF64[i17 >> 3] = d4;
     i18 = HEAP32[i2 >> 2] | 0;
     if ((i18 | 0) >= 0 ? (i25 = HEAP32[i14 >> 2] | 0, i26 = HEAP32[(HEAP32[(HEAP32[i16 >> 2] | 0) + (i19 * 12 | 0) >> 2] | 0) + (i20 * 12 | 0) >> 2] | 0, HEAPF64[i26 >> 3] = +HEAPF64[i13 >> 3] * +HEAPF64[i25 >> 3] * d4 + +HEAPF64[i15 >> 3] * +HEAPF64[i26 >> 3], (i18 | 0) != 0) : 0) {
      i1 = 0;
      do {
       i1 = i1 + 1 | 0;
       i33 = i26 + (i1 << 3) | 0;
       HEAPF64[i33 >> 3] = +HEAPF64[i13 >> 3] * +HEAPF64[i25 + (i1 << 3) >> 3] * +HEAPF64[i17 >> 3] + +HEAPF64[i15 >> 3] * +HEAPF64[i33 >> 3];
      } while ((i1 | 0) != (i18 | 0));
     }
     i20 = i20 + 1 | 0;
    } while ((i20 | 0) < (i31 | 0));
   }
   i19 = i19 + 1 | 0;
  } while ((i19 | 0) < (i21 | 0));
  if (i7 ? (i28 = i30 + 148 | 0, i29 = i30 + 64 | 0, i22) : 0) {
   i1 = HEAP32[i30 + 4 >> 2] | 0;
   i2 = (i1 | 0) < 0;
   i8 = 0;
   do {
    if (!i2) {
     i3 = HEAP32[(HEAP32[i28 >> 2] | 0) + (i8 * 12 | 0) >> 2] | 0;
     i5 = HEAP32[(HEAP32[i29 >> 2] | 0) + (i8 * 12 | 0) >> 2] | 0;
     i9 = 0;
     do {
      i6 = HEAP32[i3 + (i9 * 12 | 0) >> 2] | 0;
      i7 = HEAP32[i5 + (i9 * 12 | 0) >> 2] | 0;
      i10 = 0;
      while (1) {
       i33 = i7 + (i10 << 3) | 0;
       HEAPF64[i33 >> 3] = +HEAPF64[i6 + (i10 << 3) >> 3] + +HEAPF64[i33 >> 3];
       if ((i10 | 0) == (i1 | 0)) break; else i10 = i10 + 1 | 0;
      }
      i9 = i9 + 1 | 0;
     } while ((i9 | 0) != (i31 | 0));
    }
    i8 = i8 + 1 | 0;
   } while ((i8 | 0) != (i21 | 0));
  }
 }
 if (i27) return;
 i3 = HEAP32[i30 + 160 >> 2] | 0;
 i1 = HEAP32[i30 + 76 >> 2] | 0;
 i2 = 0;
 while (1) {
  i33 = i1 + (i2 << 3) | 0;
  HEAPF64[i33 >> 3] = +HEAPF64[i3 + (i2 << 3) >> 3] + +HEAPF64[i33 >> 3];
  if ((i2 | 0) == (i31 | 0)) break; else i2 = i2 + 1 | 0;
 }
 return;
}

function _svm_predict_values(i28, i7, i27) {
 i28 = i28 | 0;
 i7 = i7 | 0;
 i27 = i27 | 0;
 var d1 = 0.0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, i16 = 0, i17 = 0, i18 = 0, i19 = 0, i20 = 0, i21 = 0, i22 = 0, i23 = 0, i24 = 0, i25 = 0, i26 = 0, d29 = 0.0, i30 = 0;
 i6 = HEAP32[i28 >> 2] | 0;
 if ((i6 + -2 | 0) >>> 0 < 3) {
  i2 = HEAP32[HEAP32[i28 + 108 >> 2] >> 2] | 0;
  i3 = HEAP32[i28 + 100 >> 2] | 0;
  if ((i3 | 0) > 0) {
   i4 = HEAP32[i28 + 104 >> 2] | 0;
   i5 = 0;
   d1 = 0.0;
   do {
    d29 = +HEAPF64[i2 + (i5 << 3) >> 3];
    d1 = d1 + d29 * +__ZN6LIBSVM6Kernel10k_functionEPKNS_8svm_nodeES3_RKNS_13svm_parameterE(i7, HEAP32[i4 + (i5 << 2) >> 2] | 0, i28);
    i5 = i5 + 1 | 0;
   } while ((i5 | 0) < (i3 | 0));
  } else d1 = 0.0;
  d1 = d1 - +HEAPF64[HEAP32[i28 + 112 >> 2] >> 3];
  HEAPF64[i27 >> 3] = d1;
  if ((i6 | 0) != 2) {
   d29 = d1;
   return +d29;
  }
  d29 = d1 > 0.0 ? 1.0 : -1.0;
  return +d29;
 }
 i25 = HEAP32[i28 + 96 >> 2] | 0;
 i2 = HEAP32[i28 + 100 >> 2] | 0;
 i26 = _malloc(i2 << 3) | 0;
 if ((i2 | 0) > 0) {
  i3 = HEAP32[i28 + 104 >> 2] | 0;
  i4 = 0;
  do {
   d29 = +__ZN6LIBSVM6Kernel10k_functionEPKNS_8svm_nodeES3_RKNS_13svm_parameterE(i7, HEAP32[i3 + (i4 << 2) >> 2] | 0, i28);
   HEAPF64[i26 + (i4 << 3) >> 3] = d29;
   i4 = i4 + 1 | 0;
  } while ((i4 | 0) != (i2 | 0));
 }
 i2 = i25 << 2;
 i24 = _malloc(i2) | 0;
 HEAP32[i24 >> 2] = 0;
 i22 = (i25 | 0) > 1;
 if (i22) {
  i3 = HEAP32[i28 + 132 >> 2] | 0;
  i4 = 0;
  i5 = 1;
  do {
   i4 = (HEAP32[i3 + (i5 + -1 << 2) >> 2] | 0) + i4 | 0;
   HEAP32[i24 + (i5 << 2) >> 2] = i4;
   i5 = i5 + 1 | 0;
  } while ((i5 | 0) != (i25 | 0));
 }
 i23 = _malloc(i2) | 0;
 if ((i25 | 0) > 0) {
  _memset(i23 | 0, 0, i25 << 2 | 0) | 0;
  i17 = i28 + 132 | 0;
  i18 = i28 + 108 | 0;
  i19 = i28 + 112 | 0;
  i20 = 0;
  i21 = i25;
  i2 = 0;
  do {
   i21 = i21 + -1 | 0;
   i3 = i20;
   i20 = i20 + 1 | 0;
   if ((i20 | 0) < (i25 | 0)) {
    i10 = HEAP32[i24 + (i3 << 2) >> 2] | 0;
    i11 = HEAP32[i17 >> 2] | 0;
    i12 = HEAP32[i11 + (i3 << 2) >> 2] | 0;
    i13 = HEAP32[i18 >> 2] | 0;
    i14 = HEAP32[i13 + (i3 << 2) >> 2] | 0;
    i15 = (i12 | 0) > 0;
    i16 = HEAP32[i19 >> 2] | 0;
    i7 = i23 + (i3 << 2) | 0;
    i4 = i14;
    i8 = i20;
    i9 = i2;
    while (1) {
     i5 = HEAP32[i24 + (i8 << 2) >> 2] | 0;
     i6 = HEAP32[i11 + (i8 << 2) >> 2] | 0;
     if (i15) {
      i3 = 0;
      d1 = 0.0;
      do {
       i30 = i3 + i10 | 0;
       d1 = d1 + +HEAPF64[i4 + (i30 << 3) >> 3] * +HEAPF64[i26 + (i30 << 3) >> 3];
       i3 = i3 + 1 | 0;
      } while ((i3 | 0) != (i12 | 0));
     } else d1 = 0.0;
     if ((i6 | 0) > 0) {
      i3 = 0;
      do {
       i30 = i3 + i5 | 0;
       d1 = d1 + +HEAPF64[i14 + (i30 << 3) >> 3] * +HEAPF64[i26 + (i30 << 3) >> 3];
       i3 = i3 + 1 | 0;
      } while ((i3 | 0) != (i6 | 0));
     }
     d29 = d1 - +HEAPF64[i16 + (i9 << 3) >> 3];
     HEAPF64[i27 + (i9 << 3) >> 3] = d29;
     if (d29 > 0.0) HEAP32[i7 >> 2] = (HEAP32[i7 >> 2] | 0) + 1; else {
      i30 = i23 + (i8 << 2) | 0;
      HEAP32[i30 >> 2] = (HEAP32[i30 >> 2] | 0) + 1;
     }
     i3 = i8 + 1 | 0;
     if ((i3 | 0) == (i25 | 0)) break;
     i4 = HEAP32[i13 + (i8 << 2) >> 2] | 0;
     i8 = i3;
     i9 = i9 + 1 | 0;
    }
    i2 = i2 + i21 | 0;
   }
  } while ((i20 | 0) != (i25 | 0));
 }
 if (i22) {
  i3 = 1;
  i2 = 0;
  do {
   i2 = (HEAP32[i23 + (i3 << 2) >> 2] | 0) > (HEAP32[i23 + (i2 << 2) >> 2] | 0) ? i3 : i2;
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) != (i25 | 0));
 } else i2 = 0;
 _free(i26);
 _free(i24);
 _free(i23);
 d29 = +(HEAP32[(HEAP32[i28 + 128 >> 2] | 0) + (i2 << 2) >> 2] | 0);
 return +d29;
}

function __ZN17knnClassification12addNeighbourERKiRKNSt3__16vectorIdNS2_9allocatorIdEEEE(i4, i1, i2) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i8 = i5 + 32 | 0;
 i3 = i5;
 i7 = i5 + 8 | 0;
 HEAP32[i8 >> 2] = 0;
 i9 = i8 + 4 | 0;
 HEAP32[i9 >> 2] = 0;
 HEAP32[i8 + 8 >> 2] = 0;
 HEAPF64[i3 >> 3] = +(HEAP32[i1 >> 2] | 0);
 __THREW__ = 0;
 invoke_vii(7, i8 | 0, i3 | 0);
 i3 = __THREW__;
 __THREW__ = 0;
 do if (!(i3 & 1) ? (__THREW__ = 0, invoke_vii(8, i7 | 0, i2 | 0), i3 = __THREW__, __THREW__ = 0, !(i3 & 1)) : 0) {
  i1 = i7 + 12 | 0;
  __THREW__ = 0;
  invoke_vii(8, i1 | 0, i8 | 0);
  i3 = __THREW__;
  __THREW__ = 0;
  if (i3 & 1) {
   i3 = ___cxa_find_matching_catch() | 0;
   i4 = HEAP32[i7 >> 2] | 0;
   if (!i4) break;
   i1 = i7 + 4 | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
   __ZdlPv(i4);
   break;
  }
  i3 = i4 + 24 | 0;
  i2 = HEAP32[i3 >> 2] | 0;
  do if ((i2 | 0) == (HEAP32[i4 + 28 >> 2] | 0)) {
   __THREW__ = 0;
   invoke_vii(10, i4 + 20 | 0, i7 | 0);
   i6 = __THREW__;
   __THREW__ = 0;
   if (i6 & 1) i6 = 33; else i6 = 13;
  } else {
   __THREW__ = 0;
   invoke_vii(8, i2 | 0, i7 | 0);
   i10 = __THREW__;
   __THREW__ = 0;
   if (!(i10 & 1)) {
    __THREW__ = 0;
    invoke_vii(8, i2 + 12 | 0, i1 | 0);
    i10 = __THREW__;
    __THREW__ = 0;
    if (!(i10 & 1)) {
     HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) + 24;
     i6 = 13;
     break;
    }
    i3 = ___cxa_find_matching_catch() | 0;
    i4 = HEAP32[i2 >> 2] | 0;
    i5 = i4;
    if (i4) {
     i1 = i2 + 4 | 0;
     i2 = HEAP32[i1 >> 2] | 0;
     if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i5 | 0) >>> 3) << 3);
     __ZdlPv(i4);
    }
   } else i6 = 33;
  } while (0);
  if ((i6 | 0) == 13) {
   i1 = i4 + 36 | 0;
   i2 = HEAP32[i4 + 32 >> 2] | 0;
   if ((HEAP32[i1 >> 2] | 0) != (i2 | 0)) {
    i10 = ((HEAP32[i3 >> 2] | 0) - (HEAP32[i4 + 20 >> 2] | 0) | 0) / 24 | 0;
    HEAP32[i1 >> 2] = (i10 | 0) < (i2 | 0) ? i10 : i2;
   }
   i1 = HEAP32[i7 + 12 >> 2] | 0;
   i2 = i1;
   if (i1) {
    i3 = i7 + 16 | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
    __ZdlPv(i1);
   }
   i3 = HEAP32[i7 >> 2] | 0;
   i4 = i3;
   if (i3) {
    i1 = i7 + 4 | 0;
    i2 = HEAP32[i1 >> 2] | 0;
    if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
    __ZdlPv(i3);
   }
   i1 = HEAP32[i8 >> 2] | 0;
   if (!i1) {
    STACKTOP = i5;
    return;
   }
   i2 = HEAP32[i9 >> 2] | 0;
   if ((i2 | 0) != (i1 | 0)) HEAP32[i9 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
   __ZdlPv(i1);
   STACKTOP = i5;
   return;
  } else if ((i6 | 0) == 33) i3 = ___cxa_find_matching_catch() | 0;
  i1 = HEAP32[i7 + 12 >> 2] | 0;
  i2 = i1;
  if (i1) {
   i4 = i7 + 16 | 0;
   i5 = HEAP32[i4 >> 2] | 0;
   if ((i5 | 0) != (i1 | 0)) HEAP32[i4 >> 2] = i5 + (~((i5 + -8 - i2 | 0) >>> 3) << 3);
   __ZdlPv(i1);
  }
  i4 = HEAP32[i7 >> 2] | 0;
  i5 = i4;
  if (i4) {
   i1 = i7 + 4 | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i5 | 0) >>> 3) << 3);
   __ZdlPv(i4);
  }
 } else i6 = 28; while (0);
 if ((i6 | 0) == 28) i3 = ___cxa_find_matching_catch() | 0;
 i1 = HEAP32[i8 >> 2] | 0;
 if (!i1) ___resumeException(i3 | 0);
 i2 = HEAP32[i9 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) HEAP32[i9 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
 __ZdlPv(i1);
 ___resumeException(i3 | 0);
}

function __ZNK10__cxxabiv121__vmi_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i3, i15, i14, i6, i13) {
 i3 = i3 | 0;
 i15 = i15 | 0;
 i14 = i14 | 0;
 i6 = i6 | 0;
 i13 = i13 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0;
 L1 : do if ((i3 | 0) == (HEAP32[i15 + 8 >> 2] | 0)) {
  if ((HEAP32[i15 + 4 >> 2] | 0) == (i14 | 0) ? (i1 = i15 + 28 | 0, (HEAP32[i1 >> 2] | 0) != 1) : 0) HEAP32[i1 >> 2] = i6;
 } else {
  if ((i3 | 0) != (HEAP32[i15 >> 2] | 0)) {
   i12 = HEAP32[i3 + 12 >> 2] | 0;
   i4 = i3 + 16 + (i12 << 3) | 0;
   __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i3 + 16 | 0, i15, i14, i6, i13);
   i1 = i3 + 24 | 0;
   if ((i12 | 0) <= 1) break;
   i2 = HEAP32[i3 + 8 >> 2] | 0;
   if ((i2 & 2 | 0) == 0 ? (i5 = i15 + 36 | 0, (HEAP32[i5 >> 2] | 0) != 1) : 0) {
    if (!(i2 & 1)) {
     i2 = i15 + 54 | 0;
     while (1) {
      if (HEAP8[i2 >> 0] | 0) break L1;
      if ((HEAP32[i5 >> 2] | 0) == 1) break L1;
      __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i1, i15, i14, i6, i13);
      i1 = i1 + 8 | 0;
      if (i1 >>> 0 >= i4 >>> 0) break L1;
     }
    }
    i2 = i15 + 24 | 0;
    i3 = i15 + 54 | 0;
    while (1) {
     if (HEAP8[i3 >> 0] | 0) break L1;
     if ((HEAP32[i5 >> 2] | 0) == 1 ? (HEAP32[i2 >> 2] | 0) == 1 : 0) break L1;
     __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i1, i15, i14, i6, i13);
     i1 = i1 + 8 | 0;
     if (i1 >>> 0 >= i4 >>> 0) break L1;
    }
   }
   i2 = i15 + 54 | 0;
   while (1) {
    if (HEAP8[i2 >> 0] | 0) break L1;
    __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i1, i15, i14, i6, i13);
    i1 = i1 + 8 | 0;
    if (i1 >>> 0 >= i4 >>> 0) break L1;
   }
  }
  if ((HEAP32[i15 + 16 >> 2] | 0) != (i14 | 0) ? (i11 = i15 + 20 | 0, (HEAP32[i11 >> 2] | 0) != (i14 | 0)) : 0) {
   HEAP32[i15 + 32 >> 2] = i6;
   i8 = i15 + 44 | 0;
   if ((HEAP32[i8 >> 2] | 0) == 4) break;
   i2 = HEAP32[i3 + 12 >> 2] | 0;
   i4 = i3 + 16 + (i2 << 3) | 0;
   i5 = i15 + 52 | 0;
   i6 = i15 + 53 | 0;
   i9 = i15 + 54 | 0;
   i7 = i3 + 8 | 0;
   i10 = i15 + 24 | 0;
   L34 : do if ((i2 | 0) > 0) {
    i2 = 0;
    i1 = 0;
    i3 = i3 + 16 | 0;
    while (1) {
     HEAP8[i5 >> 0] = 0;
     HEAP8[i6 >> 0] = 0;
     __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i3, i15, i14, i14, 1, i13);
     if (HEAP8[i9 >> 0] | 0) {
      i12 = 20;
      break L34;
     }
     do if (HEAP8[i6 >> 0] | 0) {
      if (!(HEAP8[i5 >> 0] | 0)) if (!(HEAP32[i7 >> 2] & 1)) {
       i1 = 1;
       i12 = 20;
       break L34;
      } else {
       i1 = 1;
       break;
      }
      if ((HEAP32[i10 >> 2] | 0) == 1) break L34;
      if (!(HEAP32[i7 >> 2] & 2)) break L34; else {
       i2 = 1;
       i1 = 1;
      }
     } while (0);
     i3 = i3 + 8 | 0;
     if (i3 >>> 0 >= i4 >>> 0) {
      i12 = 20;
      break;
     }
    }
   } else {
    i2 = 0;
    i1 = 0;
    i12 = 20;
   } while (0);
   do if ((i12 | 0) == 20) {
    if ((!i2 ? (HEAP32[i11 >> 2] = i14, i14 = i15 + 40 | 0, HEAP32[i14 >> 2] = (HEAP32[i14 >> 2] | 0) + 1, (HEAP32[i15 + 36 >> 2] | 0) == 1) : 0) ? (HEAP32[i10 >> 2] | 0) == 2 : 0) {
     HEAP8[i9 >> 0] = 1;
     if (i1) break;
    } else i12 = 24;
    if ((i12 | 0) == 24 ? i1 : 0) break;
    HEAP32[i8 >> 2] = 4;
    break L1;
   } while (0);
   HEAP32[i8 >> 2] = 3;
   break;
  }
  if ((i6 | 0) == 1) HEAP32[i15 + 32 >> 2] = 1;
 } while (0);
 return;
}

function __ZNSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEE21__push_back_slow_pathIRKS1_EEvOT_(i10, i8) {
 i10 = i10 | 0;
 i8 = i8 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i9 = 0, i11 = 0, i12 = 0, i13 = 0;
 i11 = i10 + 4 | 0;
 i1 = HEAP32[i10 >> 2] | 0;
 i3 = (((HEAP32[i11 >> 2] | 0) - i1 | 0) / 24 | 0) + 1 | 0;
 if (i3 >>> 0 > 178956970) {
  __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i10);
  i1 = HEAP32[i10 >> 2] | 0;
 }
 i12 = i10 + 8 | 0;
 i2 = ((HEAP32[i12 >> 2] | 0) - i1 | 0) / 24 | 0;
 if (i2 >>> 0 < 89478485) {
  i2 = i2 << 1;
  i2 = i2 >>> 0 < i3 >>> 0 ? i3 : i2;
  i1 = ((HEAP32[i11 >> 2] | 0) - i1 | 0) / 24 | 0;
  if (!i2) {
   i4 = 0;
   i7 = 0;
   i5 = i1;
  } else i6 = 6;
 } else {
  i2 = 178956970;
  i1 = ((HEAP32[i11 >> 2] | 0) - i1 | 0) / 24 | 0;
  i6 = 6;
 }
 if ((i6 | 0) == 6) {
  i4 = i2;
  i7 = __Znwj(i2 * 24 | 0) | 0;
  i5 = i1;
 }
 i3 = i7 + (i5 * 24 | 0) | 0;
 i2 = i3;
 i9 = i7 + (i4 * 24 | 0) | 0;
 __THREW__ = 0;
 invoke_vii(8, i3 | 0, i8 | 0);
 i6 = __THREW__;
 __THREW__ = 0;
 do if (i6 & 1) {
  i1 = ___cxa_find_matching_catch() | 0;
  if (!i7) {
   i12 = i1;
   ___resumeException(i12 | 0);
  }
 } else {
  __THREW__ = 0;
  invoke_vii(8, i7 + (i5 * 24 | 0) + 12 | 0, i8 + 12 | 0);
  i8 = __THREW__;
  __THREW__ = 0;
  if (i8 & 1) {
   i1 = ___cxa_find_matching_catch() | 0;
   i4 = HEAP32[i3 >> 2] | 0;
   if (!i4) break;
   i2 = i7 + (i5 * 24 | 0) + 4 | 0;
   i3 = HEAP32[i2 >> 2] | 0;
   if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i4 | 0) >>> 3) << 3);
   __ZdlPv(i4);
   break;
  }
  i6 = i7 + ((i5 + 1 | 0) * 24 | 0) | 0;
  i5 = HEAP32[i10 >> 2] | 0;
  i1 = HEAP32[i11 >> 2] | 0;
  if ((i1 | 0) == (i5 | 0)) {
   i3 = i10;
   i4 = i11;
   i8 = i5;
  } else {
   do {
    i7 = i3 + -24 | 0;
    i4 = i1;
    i1 = i1 + -24 | 0;
    HEAP32[i7 >> 2] = 0;
    i8 = i3 + -20 | 0;
    HEAP32[i8 >> 2] = 0;
    HEAP32[i3 + -16 >> 2] = 0;
    HEAP32[i7 >> 2] = HEAP32[i1 >> 2];
    i7 = i4 + -20 | 0;
    HEAP32[i8 >> 2] = HEAP32[i7 >> 2];
    i8 = i4 + -16 | 0;
    HEAP32[i3 + -16 >> 2] = HEAP32[i8 >> 2];
    HEAP32[i8 >> 2] = 0;
    HEAP32[i7 >> 2] = 0;
    HEAP32[i1 >> 2] = 0;
    i7 = i3 + -12 | 0;
    i8 = i4 + -12 | 0;
    HEAP32[i7 >> 2] = 0;
    i13 = i3 + -8 | 0;
    HEAP32[i13 >> 2] = 0;
    HEAP32[i3 + -4 >> 2] = 0;
    HEAP32[i7 >> 2] = HEAP32[i8 >> 2];
    i7 = i4 + -8 | 0;
    HEAP32[i13 >> 2] = HEAP32[i7 >> 2];
    i4 = i4 + -4 | 0;
    HEAP32[i3 + -4 >> 2] = HEAP32[i4 >> 2];
    HEAP32[i4 >> 2] = 0;
    HEAP32[i7 >> 2] = 0;
    HEAP32[i8 >> 2] = 0;
    i3 = i2 + -24 | 0;
    i2 = i3;
   } while ((i1 | 0) != (i5 | 0));
   i1 = i2;
   i3 = i10;
   i4 = i11;
   i2 = i1;
   i8 = HEAP32[i10 >> 2] | 0;
   i1 = HEAP32[i11 >> 2] | 0;
  }
  HEAP32[i3 >> 2] = i2;
  HEAP32[i4 >> 2] = i6;
  HEAP32[i12 >> 2] = i9;
  i7 = i8;
  if ((i1 | 0) != (i7 | 0)) do {
   i6 = i1;
   i1 = i1 + -24 | 0;
   i4 = HEAP32[i6 + -12 >> 2] | 0;
   i5 = i4;
   if (i4) {
    i2 = i6 + -8 | 0;
    i3 = HEAP32[i2 >> 2] | 0;
    if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
    __ZdlPv(i4);
   }
   i4 = HEAP32[i1 >> 2] | 0;
   i5 = i4;
   if (i4) {
    i2 = i6 + -20 | 0;
    i3 = HEAP32[i2 >> 2] | 0;
    if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
    __ZdlPv(i4);
   }
  } while ((i1 | 0) != (i7 | 0));
  if (!i8) return;
  __ZdlPv(i8);
  return;
 } while (0);
 __ZdlPv(i7);
 i13 = i1;
 ___resumeException(i13 | 0);
}

function __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEE6assignIPS3_EENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIS3_NS_15iterator_traitsIS9_E9referenceEEE5valueEvE4typeES9_S9_(i10, i2, i11) {
 i10 = i10 | 0;
 i2 = i2 | 0;
 i11 = i11 | 0;
 var i1 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0;
 i6 = i2;
 i3 = (i11 - i6 | 0) / 12 | 0;
 i9 = i10 + 8 | 0;
 i1 = HEAP32[i9 >> 2] | 0;
 i8 = HEAP32[i10 >> 2] | 0;
 i4 = i8;
 if (i3 >>> 0 > ((i1 - i4 | 0) / 12 | 0) >>> 0) {
  if (i8) {
   i7 = i10 + 4 | 0;
   i1 = HEAP32[i7 >> 2] | 0;
   if ((i1 | 0) == (i8 | 0)) i1 = i8; else {
    do {
     i4 = i1 + -12 | 0;
     HEAP32[i7 >> 2] = i4;
     i5 = HEAP32[i4 >> 2] | 0;
     i6 = i5;
     if (!i5) i1 = i4; else {
      i1 = i1 + -8 | 0;
      i4 = HEAP32[i1 >> 2] | 0;
      if ((i4 | 0) != (i5 | 0)) HEAP32[i1 >> 2] = i4 + (~((i4 + -8 - i6 | 0) >>> 3) << 3);
      __ZdlPv(i5);
      i1 = HEAP32[i7 >> 2] | 0;
     }
    } while ((i1 | 0) != (i8 | 0));
    i1 = HEAP32[i10 >> 2] | 0;
   }
   __ZdlPv(i1);
   HEAP32[i9 >> 2] = 0;
   HEAP32[i7 >> 2] = 0;
   HEAP32[i10 >> 2] = 0;
   i1 = 0;
  }
  i5 = i3 >>> 0 > 357913941;
  if (i5) {
   __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i10);
   i1 = HEAP32[i9 >> 2] | 0;
   i4 = HEAP32[i10 >> 2] | 0;
  } else i4 = 0;
  i1 = (i1 - i4 | 0) / 12 | 0;
  if (i1 >>> 0 < 178956970) {
   i4 = i1 << 1;
   i1 = i4 >>> 0 >= i3 >>> 0;
   if (i1 | i5 ^ 1) i3 = i1 ? i4 : i3; else __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i10);
  } else i3 = 357913941;
  i1 = __Znwj(i3 * 12 | 0) | 0;
  i4 = i10 + 4 | 0;
  HEAP32[i4 >> 2] = i1;
  HEAP32[i10 >> 2] = i1;
  HEAP32[i9 >> 2] = i1 + (i3 * 12 | 0);
  if ((i2 | 0) == (i11 | 0)) return;
  do {
   __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i1, i2);
   i1 = (HEAP32[i4 >> 2] | 0) + 12 | 0;
   HEAP32[i4 >> 2] = i1;
   i2 = i2 + 12 | 0;
  } while ((i2 | 0) != (i11 | 0));
  return;
 }
 i7 = i10 + 4 | 0;
 i1 = ((HEAP32[i7 >> 2] | 0) - i4 | 0) / 12 | 0;
 i5 = i3 >>> 0 > i1 >>> 0;
 i1 = i5 ? i2 + (i1 * 12 | 0) | 0 : i11;
 if ((i1 | 0) == (i2 | 0)) i6 = i8; else {
  i4 = i1 + -12 - i6 | 0;
  i3 = i8;
  while (1) {
   if ((i3 | 0) != (i2 | 0)) __ZNSt3__16vectorIdNS_9allocatorIdEEE6assignIPdEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIdNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(i3, HEAP32[i2 >> 2] | 0, HEAP32[i2 + 4 >> 2] | 0);
   i2 = i2 + 12 | 0;
   if ((i2 | 0) == (i1 | 0)) break; else i3 = i3 + 12 | 0;
  }
  i6 = i8 + ((((i4 >>> 0) / 12 | 0) + 1 | 0) * 12 | 0) | 0;
 }
 if (i5) {
  if ((i1 | 0) == (i11 | 0)) return;
  i2 = HEAP32[i7 >> 2] | 0;
  do {
   __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i2, i1);
   i2 = (HEAP32[i7 >> 2] | 0) + 12 | 0;
   HEAP32[i7 >> 2] = i2;
   i1 = i1 + 12 | 0;
  } while ((i1 | 0) != (i11 | 0));
  return;
 }
 i1 = HEAP32[i7 >> 2] | 0;
 if ((i1 | 0) == (i6 | 0)) return;
 do {
  i2 = i1 + -12 | 0;
  HEAP32[i7 >> 2] = i2;
  i3 = HEAP32[i2 >> 2] | 0;
  i4 = i3;
  if (!i3) i1 = i2; else {
   i1 = i1 + -8 | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
   __ZdlPv(i3);
   i1 = HEAP32[i7 >> 2] | 0;
  }
 } while ((i1 | 0) != (i6 | 0));
 return;
}

function __ZNSt3__127__tree_balance_after_insertIPNS_16__tree_node_baseIPvEEEEvT_S5_(i5, i1) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i6 = 0, i7 = 0, i8 = 0;
 i8 = (i1 | 0) == (i5 | 0);
 HEAP8[i1 + 12 >> 0] = i8 & 1;
 if (i8) return;
 while (1) {
  i6 = HEAP32[i1 + 8 >> 2] | 0;
  i4 = i6 + 12 | 0;
  if (HEAP8[i4 >> 0] | 0) {
   i1 = 37;
   break;
  }
  i8 = i6 + 8 | 0;
  i3 = i1;
  i1 = HEAP32[i8 >> 2] | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  if ((i2 | 0) == (i6 | 0)) {
   i2 = HEAP32[i1 + 4 >> 2] | 0;
   if (!i2) {
    i2 = i3;
    i7 = i8;
    i4 = i8;
    i3 = i1;
    i5 = i1;
    i1 = 7;
    break;
   }
   i2 = i2 + 12 | 0;
   if (HEAP8[i2 >> 0] | 0) {
    i2 = i3;
    i7 = i8;
    i4 = i8;
    i3 = i1;
    i5 = i1;
    i1 = 7;
    break;
   }
   HEAP8[i4 >> 0] = 1;
   HEAP8[i1 + 12 >> 0] = (i1 | 0) == (i5 | 0) & 1;
   HEAP8[i2 >> 0] = 1;
  } else {
   if (!i2) {
    i2 = i3;
    i7 = i8;
    i5 = i8;
    i3 = i1;
    i4 = i1;
    i1 = 24;
    break;
   }
   i2 = i2 + 12 | 0;
   if (HEAP8[i2 >> 0] | 0) {
    i2 = i3;
    i7 = i8;
    i5 = i8;
    i3 = i1;
    i4 = i1;
    i1 = 24;
    break;
   }
   HEAP8[i4 >> 0] = 1;
   HEAP8[i1 + 12 >> 0] = (i1 | 0) == (i5 | 0) & 1;
   HEAP8[i2 >> 0] = 1;
  }
  if ((i1 | 0) == (i5 | 0)) {
   i1 = 37;
   break;
  }
 }
 if ((i1 | 0) == 7) {
  if ((HEAP32[i6 >> 2] | 0) == (i2 | 0)) i1 = i6; else {
   i8 = i6 + 4 | 0;
   i1 = HEAP32[i8 >> 2] | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   HEAP32[i8 >> 2] = i2;
   if (!i2) i2 = i3; else {
    HEAP32[i2 + 8 >> 2] = i6;
    i2 = HEAP32[i7 >> 2] | 0;
   }
   i3 = i1 + 8 | 0;
   HEAP32[i3 >> 2] = i2;
   i2 = HEAP32[i4 >> 2] | 0;
   if ((HEAP32[i2 >> 2] | 0) == (i6 | 0)) HEAP32[i2 >> 2] = i1; else HEAP32[i2 + 4 >> 2] = i1;
   HEAP32[i1 >> 2] = i6;
   HEAP32[i7 >> 2] = i1;
   i5 = HEAP32[i3 >> 2] | 0;
  }
  HEAP8[i1 + 12 >> 0] = 1;
  HEAP8[i5 + 12 >> 0] = 0;
  i3 = HEAP32[i5 >> 2] | 0;
  i4 = i3 + 4 | 0;
  i1 = HEAP32[i4 >> 2] | 0;
  HEAP32[i5 >> 2] = i1;
  if (i1) HEAP32[i1 + 8 >> 2] = i5;
  i1 = i5 + 8 | 0;
  HEAP32[i3 + 8 >> 2] = HEAP32[i1 >> 2];
  i2 = HEAP32[i1 >> 2] | 0;
  if ((HEAP32[i2 >> 2] | 0) == (i5 | 0)) HEAP32[i2 >> 2] = i3; else HEAP32[i2 + 4 >> 2] = i3;
  HEAP32[i4 >> 2] = i5;
  HEAP32[i1 >> 2] = i3;
  return;
 } else if ((i1 | 0) == 24) {
  if ((HEAP32[i6 >> 2] | 0) == (i2 | 0)) {
   i1 = HEAP32[i6 >> 2] | 0;
   i4 = i1 + 4 | 0;
   i2 = HEAP32[i4 >> 2] | 0;
   HEAP32[i6 >> 2] = i2;
   if (!i2) i2 = i3; else {
    HEAP32[i2 + 8 >> 2] = i6;
    i2 = HEAP32[i7 >> 2] | 0;
   }
   i3 = i1 + 8 | 0;
   HEAP32[i3 >> 2] = i2;
   i2 = HEAP32[i5 >> 2] | 0;
   if ((HEAP32[i2 >> 2] | 0) == (i6 | 0)) HEAP32[i2 >> 2] = i1; else HEAP32[i2 + 4 >> 2] = i1;
   HEAP32[i4 >> 2] = i6;
   HEAP32[i7 >> 2] = i1;
   i4 = HEAP32[i3 >> 2] | 0;
  } else i1 = i6;
  HEAP8[i1 + 12 >> 0] = 1;
  HEAP8[i4 + 12 >> 0] = 0;
  i8 = i4 + 4 | 0;
  i3 = HEAP32[i8 >> 2] | 0;
  i1 = HEAP32[i3 >> 2] | 0;
  HEAP32[i8 >> 2] = i1;
  if (i1) HEAP32[i1 + 8 >> 2] = i4;
  i1 = i4 + 8 | 0;
  HEAP32[i3 + 8 >> 2] = HEAP32[i1 >> 2];
  i2 = HEAP32[i1 >> 2] | 0;
  if ((HEAP32[i2 >> 2] | 0) == (i4 | 0)) HEAP32[i2 >> 2] = i3; else HEAP32[i2 + 4 >> 2] = i3;
  HEAP32[i3 >> 2] = i4;
  HEAP32[i1 >> 2] = i3;
  return;
 } else if ((i1 | 0) == 37) return;
}

function __ZN10regressionC2ERKiS1_(i15, i1, i2) {
 i15 = i15 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0;
 i12 = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i13 = i12 + 12 | 0;
 i5 = i12 + 8 | 0;
 i10 = i12 + 4 | 0;
 i11 = i12;
 __ZN8modelSetC2Ev(i15);
 HEAP32[i15 >> 2] = 1436;
 i6 = HEAP32[i1 >> 2] | 0;
 i9 = i15 + 16 | 0;
 HEAP32[i9 >> 2] = i6;
 i1 = HEAP32[i2 >> 2] | 0;
 i7 = i15 + 32 | 0;
 HEAP32[i7 >> 2] = i1;
 i8 = i15 + 36 | 0;
 HEAP8[i8 >> 0] = 0;
 HEAP32[i13 >> 2] = 0;
 i14 = i13 + 4 | 0;
 HEAP32[i14 >> 2] = 0;
 HEAP32[i13 + 8 >> 2] = 0;
 HEAP32[i5 >> 2] = 0;
 do if ((i6 | 0) > 0) {
  i2 = i13 + 8 | 0;
  i3 = 0;
  i4 = 0;
  i1 = 0;
  while (1) {
   if ((i3 | 0) == (i4 | 0)) {
    __THREW__ = 0;
    invoke_vii(13, i13 | 0, i5 | 0);
    i6 = __THREW__;
    __THREW__ = 0;
    if (i6 & 1) {
     i2 = 12;
     break;
    }
   } else {
    HEAP32[i3 >> 2] = i1;
    HEAP32[i14 >> 2] = i3 + 4;
   }
   i1 = i1 + 1 | 0;
   HEAP32[i5 >> 2] = i1;
   if ((i1 | 0) >= (HEAP32[i9 >> 2] | 0)) {
    i2 = 3;
    break;
   }
   i3 = HEAP32[i14 >> 2] | 0;
   i4 = HEAP32[i2 >> 2] | 0;
  }
  if ((i2 | 0) == 3) {
   i1 = HEAP32[i7 >> 2] | 0;
   i2 = 4;
   break;
  } else if ((i2 | 0) == 12) {
   i1 = ___cxa_find_matching_catch() | 0;
   i2 = 13;
   break;
  }
 } else i2 = 4; while (0);
 L13 : do if ((i2 | 0) == 4) {
  L15 : do if ((i1 | 0) > 0) {
   i2 = i15 + 4 | 0;
   i3 = i15 + 8 | 0;
   i4 = i15 + 12 | 0;
   i6 = 0;
   while (1) {
    __THREW__ = 0;
    i1 = invoke_ii(12, 192) | 0;
    i5 = __THREW__;
    __THREW__ = 0;
    if (i5 & 1) {
     i2 = 11;
     break;
    }
    HEAP32[i11 >> 2] = 1;
    __THREW__ = 0;
    invoke_viiiii(4, i1 | 0, i9 | 0, i13 | 0, i11 | 0, i9 | 0);
    i5 = __THREW__;
    __THREW__ = 0;
    if (i5 & 1) {
     i2 = 20;
     break;
    }
    HEAP32[i10 >> 2] = i1;
    i5 = HEAP32[i3 >> 2] | 0;
    if (i5 >>> 0 >= (HEAP32[i4 >> 2] | 0) >>> 0) {
     __THREW__ = 0;
     invoke_vii(14, i2 | 0, i10 | 0);
     i5 = __THREW__;
     __THREW__ = 0;
     if (i5 & 1) {
      i2 = 11;
      break;
     }
    } else {
     HEAP32[i5 >> 2] = i1;
     HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) + 4;
    }
    i6 = i6 + 1 | 0;
    if ((i6 | 0) >= (HEAP32[i7 >> 2] | 0)) break L15;
   }
   if ((i2 | 0) == 11) {
    i1 = ___cxa_find_matching_catch() | 0;
    i2 = 13;
    break L13;
   } else if ((i2 | 0) == 20) {
    i3 = ___cxa_find_matching_catch() | 0;
    __ZdlPv(i1);
    break L13;
   }
  } while (0);
  HEAP8[i8 >> 0] = 1;
  i1 = HEAP32[i13 >> 2] | 0;
  if (!i1) {
   STACKTOP = i12;
   return;
  }
  i2 = HEAP32[i14 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) HEAP32[i14 >> 2] = i2 + (~((i2 + -4 - i1 | 0) >>> 2) << 2);
  __ZdlPv(i1);
  STACKTOP = i12;
  return;
 } while (0);
 if ((i2 | 0) == 13) i3 = i1;
 i1 = HEAP32[i13 >> 2] | 0;
 if (!i1) {
  __ZN8modelSetD2Ev(i15);
  ___resumeException(i3 | 0);
 }
 i2 = HEAP32[i14 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) HEAP32[i14 >> 2] = i2 + (~((i2 + -4 - i1 | 0) >>> 2) << 2);
 __ZdlPv(i1);
 __ZN8modelSetD2Ev(i15);
 ___resumeException(i3 | 0);
}

function __ZN6LIBSVM9Solver_NU18select_working_setERiS1_(i23, i21, i22) {
 i23 = i23 | 0;
 i21 = i21 | 0;
 i22 = i22 | 0;
 var i1 = 0, i2 = 0, d3 = 0.0, d4 = 0.0, i5 = 0, d6 = 0.0, d7 = 0.0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, d12 = 0.0, i13 = 0, i14 = 0, d15 = 0.0, i16 = 0, i17 = 0, i18 = 0, d19 = 0.0, d20 = 0.0, d24 = 0.0;
 i14 = i23 + 4 | 0;
 i13 = HEAP32[i14 >> 2] | 0;
 if ((i13 | 0) > 0) {
  i8 = HEAP32[i23 + 8 >> 2] | 0;
  i9 = HEAP32[i23 + 16 >> 2] | 0;
  i10 = i23 + 12 | 0;
  d7 = -inf;
  i5 = -1;
  d4 = -inf;
  i1 = -1;
  i11 = 0;
  do {
   i2 = HEAP8[i9 + i11 >> 0] | 0;
   if ((HEAP8[i8 + i11 >> 0] | 0) == 1) {
    if (i2 << 24 >> 24 != 1 ? (d3 = -+HEAPF64[(HEAP32[i10 >> 2] | 0) + (i11 << 3) >> 3], d4 <= d3) : 0) {
     d4 = d3;
     i1 = i11;
    }
   } else if (i2 << 24 >> 24 != 0 ? (d6 = +HEAPF64[(HEAP32[i10 >> 2] | 0) + (i11 << 3) >> 3], d6 >= d7) : 0) {
    d7 = d6;
    i5 = i11;
   }
   i11 = i11 + 1 | 0;
  } while ((i11 | 0) < (i13 | 0));
  if ((i1 | 0) == -1) {
   i2 = -1;
   i18 = 0;
  } else {
   i18 = HEAP32[i23 + 24 >> 2] | 0;
   i2 = i1;
   i18 = FUNCTION_TABLE_iiii[HEAP32[HEAP32[i18 >> 2] >> 2] & 31](i18, i1, i13) | 0;
  }
  if ((i5 | 0) == -1) i17 = 0; else {
   i17 = HEAP32[i23 + 24 >> 2] | 0;
   i17 = FUNCTION_TABLE_iiii[HEAP32[HEAP32[i17 >> 2] >> 2] & 31](i17, i5, HEAP32[i14 >> 2] | 0) | 0;
  }
  i9 = HEAP32[i14 >> 2] | 0;
  if ((i9 | 0) > 0) {
   i10 = HEAP32[i23 + 8 >> 2] | 0;
   i11 = HEAP32[i23 + 16 >> 2] | 0;
   i13 = i23 + 12 | 0;
   i14 = i23 + 28 | 0;
   d6 = -inf;
   d3 = -inf;
   i1 = -1;
   i16 = 0;
   d15 = inf;
   while (1) {
    i8 = HEAP8[i11 + i16 >> 0] | 0;
    if ((HEAP8[i10 + i16 >> 0] | 0) == 1) if (i8 << 24 >> 24) {
     d24 = +HEAPF64[(HEAP32[i13 >> 2] | 0) + (i16 << 3) >> 3];
     d12 = d4 + d24;
     d3 = d24 >= d3 ? d24 : d3;
     if (d12 > 0.0 ? (i8 = HEAP32[i14 >> 2] | 0, d19 = +HEAPF64[i8 + (i2 << 3) >> 3] + +HEAPF64[i8 + (i16 << 3) >> 3] - +HEAPF32[i18 + (i16 << 2) >> 2] * 2.0, d19 = -(d12 * d12) / (d19 > 0.0 ? d19 : 1.0e-12), d19 <= d15) : 0) {
      i1 = i16;
      d12 = d19;
     } else d12 = d15;
    } else d12 = d15; else if (i8 << 24 >> 24 != 1) {
     d24 = +HEAPF64[(HEAP32[i13 >> 2] | 0) + (i16 << 3) >> 3];
     d12 = d7 - d24;
     d24 = -d24;
     d6 = d6 <= d24 ? d24 : d6;
     if (d12 > 0.0 ? (i8 = HEAP32[i14 >> 2] | 0, d20 = +HEAPF64[i8 + (i5 << 3) >> 3] + +HEAPF64[i8 + (i16 << 3) >> 3] - +HEAPF32[i17 + (i16 << 2) >> 2] * 2.0, d20 = -(d12 * d12) / (d20 > 0.0 ? d20 : 1.0e-12), d20 <= d15) : 0) {
      i1 = i16;
      d12 = d20;
     } else d12 = d15;
    } else d12 = d15;
    i16 = i16 + 1 | 0;
    if ((i16 | 0) >= (i9 | 0)) break; else d15 = d12;
   }
  } else {
   d6 = -inf;
   d3 = -inf;
   i1 = -1;
  }
 } else {
  d7 = -inf;
  d6 = -inf;
  i5 = -1;
  d4 = -inf;
  d3 = -inf;
  i2 = -1;
  i1 = -1;
 }
 d20 = d4 + d3;
 d24 = d7 + d6;
 if ((i1 | 0) == -1 ? 1 : (d20 > d24 ? d20 : d24) < +HEAPF64[i23 + 32 >> 3]) {
  i23 = 1;
  return i23 | 0;
 }
 HEAP32[i21 >> 2] = (HEAP8[(HEAP32[i23 + 8 >> 2] | 0) + i1 >> 0] | 0) == 1 ? i2 : i5;
 HEAP32[i22 >> 2] = i1;
 i23 = 0;
 return i23 | 0;
}

function __ZN10emscripten8internal7InvokerIP17knnClassificationJOiONSt3__16vectorIiNS5_9allocatorIiEEEEONS6_I15trainingExampleNS7_ISB_EEEES4_EE6invokeEPFS3_S4_SA_SE_S4_EiPS9_PSD_i(i7, i3, i4, i5, i6) {
 i7 = i7 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0;
 i10 = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i1 = i10 + 28 | 0;
 i12 = i10 + 16 | 0;
 i11 = i10 + 4 | 0;
 i2 = i10;
 HEAP32[i1 >> 2] = i3;
 __ZNSt3__16vectorIiNS_9allocatorIiEEEC2ERKS3_(i12, i4);
 __THREW__ = 0;
 invoke_vii(16, i11 | 0, i5 | 0);
 i9 = __THREW__;
 __THREW__ = 0;
 do if (i9 & 1) i3 = ___cxa_find_matching_catch() | 0; else {
  HEAP32[i2 >> 2] = i6;
  __THREW__ = 0;
  i9 = invoke_iiiii(i7 | 0, i1 | 0, i12 | 0, i11 | 0, i2 | 0) | 0;
  i8 = __THREW__;
  __THREW__ = 0;
  if (i8 & 1) {
   i3 = ___cxa_find_matching_catch() | 0;
   i9 = tempRet0;
   i1 = HEAP32[i11 >> 2] | 0;
   if (!i1) break;
   i10 = i11 + 4 | 0;
   i2 = HEAP32[i10 >> 2] | 0;
   if ((i2 | 0) != (i1 | 0)) {
    do {
     i4 = i2 + -24 | 0;
     HEAP32[i10 >> 2] = i4;
     i5 = HEAP32[i2 + -12 >> 2] | 0;
     i6 = i5;
     if (i5) {
      i7 = i2 + -8 | 0;
      i8 = HEAP32[i7 >> 2] | 0;
      if ((i8 | 0) != (i5 | 0)) HEAP32[i7 >> 2] = i8 + (~((i8 + -8 - i6 | 0) >>> 3) << 3);
      __ZdlPv(i5);
     }
     i5 = HEAP32[i4 >> 2] | 0;
     i6 = i5;
     if (i5) {
      i2 = i2 + -20 | 0;
      i4 = HEAP32[i2 >> 2] | 0;
      if ((i4 | 0) != (i5 | 0)) HEAP32[i2 >> 2] = i4 + (~((i4 + -8 - i6 | 0) >>> 3) << 3);
      __ZdlPv(i5);
     }
     i2 = HEAP32[i10 >> 2] | 0;
    } while ((i2 | 0) != (i1 | 0));
    i1 = HEAP32[i11 >> 2] | 0;
   }
   __ZdlPv(i1);
   break;
  }
  i1 = HEAP32[i11 >> 2] | 0;
  if (i1) {
   i8 = i11 + 4 | 0;
   i2 = HEAP32[i8 >> 2] | 0;
   if ((i2 | 0) != (i1 | 0)) {
    do {
     i3 = i2 + -24 | 0;
     HEAP32[i8 >> 2] = i3;
     i4 = HEAP32[i2 + -12 >> 2] | 0;
     i5 = i4;
     if (i4) {
      i6 = i2 + -8 | 0;
      i7 = HEAP32[i6 >> 2] | 0;
      if ((i7 | 0) != (i4 | 0)) HEAP32[i6 >> 2] = i7 + (~((i7 + -8 - i5 | 0) >>> 3) << 3);
      __ZdlPv(i4);
     }
     i4 = HEAP32[i3 >> 2] | 0;
     i5 = i4;
     if (i4) {
      i2 = i2 + -20 | 0;
      i3 = HEAP32[i2 >> 2] | 0;
      if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
      __ZdlPv(i4);
     }
     i2 = HEAP32[i8 >> 2] | 0;
    } while ((i2 | 0) != (i1 | 0));
    i1 = HEAP32[i11 >> 2] | 0;
   }
   __ZdlPv(i1);
  }
  i3 = HEAP32[i12 >> 2] | 0;
  if (!i3) {
   STACKTOP = i10;
   return i9 | 0;
  }
  i1 = i12 + 4 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -4 - i3 | 0) >>> 2) << 2);
  __ZdlPv(i3);
  STACKTOP = i10;
  return i9 | 0;
 } while (0);
 i4 = HEAP32[i12 >> 2] | 0;
 if (!i4) ___resumeException(i3 | 0);
 i1 = i12 + 4 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -4 - i4 | 0) >>> 2) << 2);
 __ZdlPv(i4);
 ___resumeException(i3 | 0);
 return 0;
}

function __ZN6LIBSVM5SVR_QC2ERKNS_11svm_problemERKNS_13svm_parameterE(i14, i1, i6) {
 i14 = i14 | 0;
 i1 = i1 | 0;
 i6 = i6 | 0;
 var i2 = 0, d3 = 0.0, i4 = 0, i5 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i15 = 0;
 __ZN6LIBSVM6KernelC2EiPKPNS_8svm_nodeERKNS_13svm_parameterE(i14, HEAP32[i1 >> 2] | 0, HEAP32[i1 + 8 >> 2] | 0, i6);
 HEAP32[i14 >> 2] = 2016;
 i1 = HEAP32[i1 >> 2] | 0;
 i9 = i14 + 48 | 0;
 HEAP32[i9 >> 2] = i1;
 __THREW__ = 0;
 i2 = invoke_ii(12, 28) | 0;
 i15 = __THREW__;
 __THREW__ = 0;
 L1 : do if (((!(i15 & 1) ? (i5 = ~~(+HEAPF64[i6 + 32 >> 3] * 1048576.0), HEAP32[i2 >> 2] = i1, i4 = _calloc(i1, 16) | 0, HEAP32[i2 + 8 >> 2] = i4, i5 = (i5 >>> 2) - (i1 << 2 & 1073741820) | 0, i4 = i1 << 1, HEAP32[i2 + 4 >> 2] = (i5 | 0) > (i4 | 0) ? i5 : i4, i5 = i2 + 12 | 0, HEAP32[i5 >> 2] = i5, HEAP32[i2 + 16 >> 2] = i5, HEAP32[i14 + 52 >> 2] = i2, __THREW__ = 0, i5 = invoke_ii(19, (i4 >>> 0 > 536870911 ? -1 : i4 << 3) | 0) | 0, i15 = __THREW__, __THREW__ = 0, !(i15 & 1)) : 0) ? (i10 = i14 + 76 | 0, HEAP32[i10 >> 2] = i5, __THREW__ = 0, i8 = invoke_ii(19, ((i1 | 0) < 0 ? -1 : i4) | 0) | 0, i15 = __THREW__, __THREW__ = 0, !(i15 & 1)) : 0) ? (i11 = i14 + 56 | 0, HEAP32[i11 >> 2] = i8, __THREW__ = 0, i7 = invoke_ii(19, (i4 >>> 0 > 1073741823 ? -1 : i4 << 2) | 0) | 0, i15 = __THREW__, __THREW__ = 0, !(i15 & 1)) : 0) {
  i6 = i14 + 60 | 0;
  HEAP32[i6 >> 2] = i7;
  L6 : do if ((i1 | 0) > 0) {
   i5 = i14 + 4 | 0;
   i1 = i8;
   i2 = 0;
   while (1) {
    HEAP8[i1 + i2 >> 0] = 1;
    HEAP8[(HEAP32[i11 >> 2] | 0) + ((HEAP32[i9 >> 2] | 0) + i2) >> 0] = -1;
    i1 = HEAP32[i6 >> 2] | 0;
    HEAP32[i1 + (i2 << 2) >> 2] = i2;
    HEAP32[i1 + ((HEAP32[i9 >> 2] | 0) + i2 << 2) >> 2] = i2;
    i1 = HEAP32[i5 >> 2] | 0;
    i15 = HEAP32[i5 + 4 >> 2] | 0;
    i4 = i14 + (i15 >> 1) | 0;
    if (i15 & 1) i1 = HEAP32[(HEAP32[i4 >> 2] | 0) + i1 >> 2] | 0;
    __THREW__ = 0;
    d3 = +invoke_diii(i1 | 0, i4 | 0, i2 | 0, i2 | 0);
    i15 = __THREW__;
    __THREW__ = 0;
    if (i15 & 1) break;
    i15 = HEAP32[i10 >> 2] | 0;
    HEAPF64[i15 + (i2 << 3) >> 3] = d3;
    i1 = HEAP32[i9 >> 2] | 0;
    HEAPF64[i15 + (i1 + i2 << 3) >> 3] = d3;
    i2 = i2 + 1 | 0;
    if ((i2 | 0) >= (i1 | 0)) break L6;
    i1 = HEAP32[i11 >> 2] | 0;
   }
   i2 = ___cxa_find_matching_catch() | 0;
   break L1;
  } while (0);
  i1 = i1 << 1;
  i1 = i1 >>> 0 > 1073741823 ? -1 : i1 << 2;
  __THREW__ = 0;
  i2 = invoke_ii(19, i1 | 0) | 0;
  i15 = __THREW__;
  __THREW__ = 0;
  if (!(i15 & 1) ? (HEAP32[i14 + 68 >> 2] = i2, __THREW__ = 0, i13 = invoke_ii(19, i1 | 0) | 0, i15 = __THREW__, __THREW__ = 0, !(i15 & 1)) : 0) {
   HEAP32[i14 + 72 >> 2] = i13;
   HEAP32[i14 + 64 >> 2] = 0;
   return;
  } else i12 = 17;
 } else i12 = 17; while (0);
 if ((i12 | 0) == 17) i2 = ___cxa_find_matching_catch() | 0;
 HEAP32[i14 >> 2] = 1928;
 i1 = HEAP32[i14 + 12 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i14 + 16 >> 2] | 0;
 if (!i1) ___resumeException(i2 | 0);
 __ZdaPv(i1);
 ___resumeException(i2 | 0);
}

function __ZN6LIBSVM6Solver20reconstruct_gradientEv(i12) {
 i12 = i12 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, d10 = 0.0, i11 = 0, i13 = 0, i14 = 0, i15 = 0;
 i15 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i6 = i15;
 i13 = i12 + 4 | 0;
 i7 = HEAP32[i13 >> 2] | 0;
 i14 = i12 + 68 | 0;
 i5 = HEAP32[i14 >> 2] | 0;
 if ((i7 | 0) == (i5 | 0)) {
  STACKTOP = i15;
  return;
 }
 if ((i7 | 0) < (i5 | 0)) {
  i2 = HEAP32[i12 + 64 >> 2] | 0;
  i3 = HEAP32[i12 + 56 >> 2] | 0;
  i1 = HEAP32[i12 + 12 >> 2] | 0;
  i4 = i7;
  do {
   HEAPF64[i1 + (i4 << 3) >> 3] = +HEAPF64[i2 + (i4 << 3) >> 3] + +HEAPF64[i3 + (i4 << 3) >> 3];
   i4 = i4 + 1 | 0;
  } while ((i4 | 0) < (i5 | 0));
 }
 if ((i7 | 0) > 0) {
  i2 = HEAP32[i12 + 16 >> 2] | 0;
  i3 = 0;
  i1 = 0;
  do {
   i1 = ((HEAP8[i2 + i3 >> 0] | 0) == 2 & 1) + i1 | 0;
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) < (i7 | 0));
 } else i1 = 0;
 if ((i1 << 1 | 0) < (i7 | 0)) {
  __ZN6LIBSVML4infoEPKcz(4678, i6);
  i3 = HEAP32[i14 >> 2] | 0;
  i2 = HEAP32[i13 >> 2] | 0;
 } else {
  i3 = i5;
  i2 = i7;
 }
 if ((Math_imul(i3, i1) | 0) <= (Math_imul(i2 << 1, i3 - i2 | 0) | 0)) {
  if ((i2 | 0) <= 0) {
   STACKTOP = i15;
   return;
  }
  i8 = i12 + 16 | 0;
  i9 = i12 + 24 | 0;
  i11 = i12 + 20 | 0;
  i7 = i12 + 12 | 0;
  i1 = i3;
  i6 = 0;
  do {
   if ((HEAP8[(HEAP32[i8 >> 2] | 0) + i6 >> 0] | 0) == 2) {
    i3 = HEAP32[i9 >> 2] | 0;
    i3 = FUNCTION_TABLE_iiii[HEAP32[HEAP32[i3 >> 2] >> 2] & 31](i3, i6, i1) | 0;
    d10 = +HEAPF64[(HEAP32[i11 >> 2] | 0) + (i6 << 3) >> 3];
    i2 = HEAP32[i13 >> 2] | 0;
    i1 = HEAP32[i14 >> 2] | 0;
    if ((i2 | 0) < (i1 | 0)) {
     i4 = HEAP32[i7 >> 2] | 0;
     i5 = i2;
     do {
      i12 = i4 + (i5 << 3) | 0;
      HEAPF64[i12 >> 3] = +HEAPF64[i12 >> 3] + d10 * +HEAPF32[i3 + (i5 << 2) >> 2];
      i5 = i5 + 1 | 0;
     } while ((i5 | 0) < (i1 | 0));
    }
   }
   i6 = i6 + 1 | 0;
  } while ((i6 | 0) < (i2 | 0));
  STACKTOP = i15;
  return;
 }
 if ((i3 | 0) <= (i2 | 0)) {
  STACKTOP = i15;
  return;
 }
 i7 = i12 + 24 | 0;
 i8 = i12 + 16 | 0;
 i9 = i12 + 20 | 0;
 i5 = i12 + 12 | 0;
 i6 = i2;
 i3 = i2;
 do {
  i2 = HEAP32[i7 >> 2] | 0;
  i2 = FUNCTION_TABLE_iiii[HEAP32[HEAP32[i2 >> 2] >> 2] & 31](i2, i3, i6) | 0;
  i6 = HEAP32[i13 >> 2] | 0;
  if ((i6 | 0) > 0) {
   i1 = HEAP32[i8 >> 2] | 0;
   i4 = 0;
   do {
    if ((HEAP8[i1 + i4 >> 0] | 0) == 2) {
     i12 = (HEAP32[i5 >> 2] | 0) + (i3 << 3) | 0;
     HEAPF64[i12 >> 3] = +HEAPF64[i12 >> 3] + +HEAPF64[(HEAP32[i9 >> 2] | 0) + (i4 << 3) >> 3] * +HEAPF32[i2 + (i4 << 2) >> 2];
    }
    i4 = i4 + 1 | 0;
   } while ((i4 | 0) < (i6 | 0));
  }
  i3 = i3 + 1 | 0;
 } while ((i3 | 0) < (HEAP32[i14 >> 2] | 0));
 STACKTOP = i15;
 return;
}

function __ZN6LIBSVML17svm_group_classesEPKNS_11svm_problemEPiPS3_S4_S4_S3_(i1, i16, i15, i17, i14, i12) {
 i1 = i1 | 0;
 i16 = i16 | 0;
 i15 = i15 | 0;
 i17 = i17 | 0;
 i14 = i14 | 0;
 i12 = i12 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i13 = 0, i18 = 0;
 i11 = HEAP32[i1 >> 2] | 0;
 i3 = _malloc(64) | 0;
 i2 = _malloc(64) | 0;
 i13 = _malloc(i11 << 2) | 0;
 i10 = (i11 | 0) > 0;
 if (i10) {
  i8 = i1 + 4 | 0;
  i7 = 0;
  i6 = 16;
  i4 = 0;
  while (1) {
   i5 = ~~+HEAPF64[(HEAP32[i8 >> 2] | 0) + (i7 << 3) >> 3];
   L5 : do if ((i4 | 0) > 0) {
    i1 = 0;
    while (1) {
     if ((i5 | 0) == (HEAP32[i3 + (i1 << 2) >> 2] | 0)) break;
     i1 = i1 + 1 | 0;
     if ((i1 | 0) >= (i4 | 0)) break L5;
    }
    i18 = i2 + (i1 << 2) | 0;
    HEAP32[i18 >> 2] = (HEAP32[i18 >> 2] | 0) + 1;
   } else i1 = 0; while (0);
   HEAP32[i13 + (i7 << 2) >> 2] = i1;
   if ((i1 | 0) == (i4 | 0)) {
    if ((i4 | 0) == (i6 | 0)) {
     i1 = i6 << 3;
     i3 = _realloc(i3, i1) | 0;
     i2 = _realloc(i2, i1) | 0;
     i1 = i6 << 1;
    } else i1 = i6;
    HEAP32[i3 + (i4 << 2) >> 2] = i5;
    HEAP32[i2 + (i4 << 2) >> 2] = 1;
    i4 = i4 + 1 | 0;
   } else i1 = i6;
   i7 = i7 + 1 | 0;
   if ((i7 | 0) == (i11 | 0)) break; else i6 = i1;
  }
  if ((i4 | 0) == 2) if (((HEAP32[i3 >> 2] | 0) == -1 ? (i9 = i3 + 4 | 0, (HEAP32[i9 >> 2] | 0) == 1) : 0) ? (HEAP32[i3 >> 2] = 1, HEAP32[i9 >> 2] = -1, i18 = i2 + 4 | 0, i9 = HEAP32[i2 >> 2] | 0, HEAP32[i2 >> 2] = HEAP32[i18 >> 2], HEAP32[i18 >> 2] = i9, i10) : 0) {
   i1 = 0;
   do {
    i18 = i13 + (i1 << 2) | 0;
    HEAP32[i18 >> 2] = (HEAP32[i18 >> 2] | 0) == 0 & 1;
    i1 = i1 + 1 | 0;
   } while ((i1 | 0) != (i11 | 0));
   i7 = i2;
  } else {
   i7 = i2;
   i4 = 2;
  } else i7 = i2;
 } else {
  i7 = i2;
  i4 = 0;
 }
 i6 = _malloc(i4 << 2) | 0;
 HEAP32[i6 >> 2] = 0;
 i5 = (i4 | 0) > 1;
 if (i5) {
  i1 = 0;
  i2 = 1;
  do {
   i1 = (HEAP32[i7 + (i2 + -1 << 2) >> 2] | 0) + i1 | 0;
   HEAP32[i6 + (i2 << 2) >> 2] = i1;
   i2 = i2 + 1 | 0;
  } while ((i2 | 0) != (i4 | 0));
 }
 if (i10) {
  i1 = 0;
  do {
   i18 = i6 + (HEAP32[i13 + (i1 << 2) >> 2] << 2) | 0;
   i10 = HEAP32[i18 >> 2] | 0;
   HEAP32[i12 + (i10 << 2) >> 2] = i1;
   HEAP32[i18 >> 2] = i10 + 1;
   i1 = i1 + 1 | 0;
  } while ((i1 | 0) != (i11 | 0));
 }
 HEAP32[i6 >> 2] = 0;
 if (i5) {
  i1 = 0;
  i2 = 1;
 } else {
  HEAP32[i16 >> 2] = i4;
  HEAP32[i15 >> 2] = i3;
  HEAP32[i17 >> 2] = i6;
  HEAP32[i14 >> 2] = i7;
  _free(i13);
  return;
 }
 do {
  i1 = (HEAP32[i7 + (i2 + -1 << 2) >> 2] | 0) + i1 | 0;
  HEAP32[i6 + (i2 << 2) >> 2] = i1;
  i2 = i2 + 1 | 0;
 } while ((i2 | 0) != (i4 | 0));
 HEAP32[i16 >> 2] = i4;
 HEAP32[i15 >> 2] = i3;
 HEAP32[i17 >> 2] = i6;
 HEAP32[i14 >> 2] = i7;
 _free(i13);
 return;
}

function __ZNSt3__16vectorINS0_INS0_IdNS_9allocatorIdEEEENS1_IS3_EEEENS1_IS5_EEE21__push_back_slow_pathIRKS5_EEvOT_(i9, i7) {
 i9 = i9 | 0;
 i7 = i7 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i8 = 0, i10 = 0, i11 = 0, i12 = 0;
 i10 = i9 + 4 | 0;
 i1 = HEAP32[i9 >> 2] | 0;
 i3 = (((HEAP32[i10 >> 2] | 0) - i1 | 0) / 12 | 0) + 1 | 0;
 if (i3 >>> 0 > 357913941) {
  __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i9);
  i1 = HEAP32[i9 >> 2] | 0;
 }
 i11 = i9 + 8 | 0;
 i2 = ((HEAP32[i11 >> 2] | 0) - i1 | 0) / 12 | 0;
 if (i2 >>> 0 < 178956970) {
  i2 = i2 << 1;
  i2 = i2 >>> 0 < i3 >>> 0 ? i3 : i2;
  i1 = ((HEAP32[i10 >> 2] | 0) - i1 | 0) / 12 | 0;
  if (!i2) {
   i4 = 0;
   i5 = 0;
  } else i6 = 6;
 } else {
  i2 = 357913941;
  i1 = ((HEAP32[i10 >> 2] | 0) - i1 | 0) / 12 | 0;
  i6 = 6;
 }
 if ((i6 | 0) == 6) {
  i4 = i2;
  i5 = __Znwj(i2 * 12 | 0) | 0;
 }
 i3 = i5 + (i1 * 12 | 0) | 0;
 i2 = i3;
 i8 = i5 + (i4 * 12 | 0) | 0;
 __THREW__ = 0;
 invoke_vii(12, i3 | 0, i7 | 0);
 i7 = __THREW__;
 __THREW__ = 0;
 if (i7 & 1) {
  i1 = ___cxa_find_matching_catch() | 0;
  if (!i5) ___resumeException(i1 | 0);
  __ZdlPv(i5);
  ___resumeException(i1 | 0);
 }
 i6 = i5 + ((i1 + 1 | 0) * 12 | 0) | 0;
 i5 = HEAP32[i9 >> 2] | 0;
 i1 = HEAP32[i10 >> 2] | 0;
 if ((i1 | 0) == (i5 | 0)) {
  i3 = i9;
  i4 = i10;
  i9 = i5;
 } else {
  do {
   i7 = i3 + -12 | 0;
   i4 = i1;
   i1 = i1 + -12 | 0;
   HEAP32[i7 >> 2] = 0;
   i12 = i3 + -8 | 0;
   HEAP32[i12 >> 2] = 0;
   HEAP32[i3 + -4 >> 2] = 0;
   HEAP32[i7 >> 2] = HEAP32[i1 >> 2];
   i7 = i4 + -8 | 0;
   HEAP32[i12 >> 2] = HEAP32[i7 >> 2];
   i4 = i4 + -4 | 0;
   HEAP32[i3 + -4 >> 2] = HEAP32[i4 >> 2];
   HEAP32[i4 >> 2] = 0;
   HEAP32[i7 >> 2] = 0;
   HEAP32[i1 >> 2] = 0;
   i3 = i2 + -12 | 0;
   i2 = i3;
  } while ((i1 | 0) != (i5 | 0));
  i1 = i2;
  i3 = i9;
  i4 = i10;
  i2 = i1;
  i9 = HEAP32[i9 >> 2] | 0;
  i1 = HEAP32[i10 >> 2] | 0;
 }
 HEAP32[i3 >> 2] = i2;
 HEAP32[i4 >> 2] = i6;
 HEAP32[i11 >> 2] = i8;
 i8 = i9;
 if ((i1 | 0) != (i8 | 0)) do {
  i3 = i1;
  i1 = i1 + -12 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  if (i2) {
   i7 = i3 + -8 | 0;
   i3 = HEAP32[i7 >> 2] | 0;
   if ((i3 | 0) != (i2 | 0)) {
    do {
     i4 = i3 + -12 | 0;
     HEAP32[i7 >> 2] = i4;
     i5 = HEAP32[i4 >> 2] | 0;
     i6 = i5;
     if (!i5) i3 = i4; else {
      i3 = i3 + -8 | 0;
      i4 = HEAP32[i3 >> 2] | 0;
      if ((i4 | 0) != (i5 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i6 | 0) >>> 3) << 3);
      __ZdlPv(i5);
      i3 = HEAP32[i7 >> 2] | 0;
     }
    } while ((i3 | 0) != (i2 | 0));
    i2 = HEAP32[i1 >> 2] | 0;
   }
   __ZdlPv(i2);
  }
 } while ((i1 | 0) != (i8 | 0));
 if (!i9) return;
 __ZdlPv(i9);
 return;
}

function _expm1(d1) {
 d1 = +d1;
 var d2 = 0.0, d3 = 0.0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, d8 = 0.0, i9 = 0, d10 = 0.0;
 HEAPF64[tempDoublePtr >> 3] = d1;
 i4 = HEAP32[tempDoublePtr >> 2] | 0;
 i5 = HEAP32[tempDoublePtr + 4 >> 2] | 0;
 i6 = i5 & 2147483647;
 i7 = _bitshift64Lshr(i4 | 0, i5 | 0, 63) | 0;
 do if (i6 >>> 0 > 1078159481) {
  i6 = i5 & 2147483647;
  if (!(i6 >>> 0 > 2146435072 | (i6 | 0) == 2146435072 & i4 >>> 0 > 0)) if (!i7) if (d1 > 709.782712893384) d1 = d1 * 8988465674311579538646525.0e283; else i9 = 11; else d1 = -1.0;
 } else {
  if (i6 >>> 0 <= 1071001154) if (i6 >>> 0 < 1016070144) break; else {
   d8 = 0.0;
   i6 = 0;
   i9 = 14;
   break;
  }
  if (i6 >>> 0 < 1072734898) if (!i7) {
   d2 = d1 + -.6931471803691238;
   i4 = 1;
   d3 = 1.9082149292705877e-10;
   i9 = 12;
   break;
  } else {
   d2 = d1 + .6931471803691238;
   i4 = -1;
   d3 = -1.9082149292705877e-10;
   i9 = 12;
   break;
  } else i9 = 11;
 } while (0);
 if ((i9 | 0) == 11) {
  i4 = ~~(d1 * 1.4426950408889634 + ((i7 | 0) != 0 ? -.5 : .5));
  d3 = +(i4 | 0);
  d2 = d1 - d3 * .6931471803691238;
  d3 = d3 * 1.9082149292705877e-10;
  i9 = 12;
 }
 if ((i9 | 0) == 12) {
  d8 = d2 - d3;
  d1 = d8;
  d8 = d2 - d8 - d3;
  i6 = i4;
  i9 = 14;
 }
 L18 : do if ((i9 | 0) == 14) {
  d3 = d1 * .5;
  d2 = d1 * d3;
  d10 = d2 * (d2 * (d2 * (d2 * (4.008217827329362e-06 - d2 * 2.0109921818362437e-07) + -7.93650757867488e-05) + 1.5873015872548146e-03) + -.03333333333333313) + 1.0;
  d3 = 3.0 - d3 * d10;
  d3 = d2 * ((d10 - d3) / (6.0 - d1 * d3));
  if (!i6) {
   d1 = d1 - (d1 * d3 - d2);
   break;
  }
  d2 = d1 * (d3 - d8) - d8 - d2;
  switch (i6 | 0) {
  case -1:
   {
    d1 = (d1 - d2) * .5 + -.5;
    break L18;
   }
  case 1:
   if (d1 < -.25) {
    d1 = (d2 - (d1 + .5)) * -2.0;
    break L18;
   } else {
    d1 = (d1 - d2) * 2.0 + 1.0;
    break L18;
   }
  default:
   {
    i7 = _bitshift64Shl(i6 + 1023 | 0, 0, 52) | 0;
    i9 = tempRet0;
    HEAP32[tempDoublePtr >> 2] = i7;
    HEAP32[tempDoublePtr + 4 >> 2] = i9;
    d3 = +HEAPF64[tempDoublePtr >> 3];
    if (i6 >>> 0 > 56) {
     d1 = d1 - d2 + 1.0;
     d1 = ((i6 | 0) == 1024 ? d1 * 2.0 * 8988465674311579538646525.0e283 : d3 * d1) + -1.0;
     break L18;
    }
    i4 = _bitshift64Shl(1023 - i6 | 0, 0, 52) | 0;
    i5 = tempRet0;
    if ((i6 | 0) < 20) {
     HEAP32[tempDoublePtr >> 2] = i4;
     HEAP32[tempDoublePtr + 4 >> 2] = i5;
     d1 = 1.0 - +HEAPF64[tempDoublePtr >> 3] + (d1 - d2);
    } else {
     HEAP32[tempDoublePtr >> 2] = i4;
     HEAP32[tempDoublePtr + 4 >> 2] = i5;
     d1 = d1 - (+HEAPF64[tempDoublePtr >> 3] + d2) + 1.0;
    }
    d1 = d3 * d1;
    break L18;
   }
  }
 } while (0);
 return +d1;
}

function __ZN20seriesClassification14runTrainingSetERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE(i7, i8) {
 i7 = i7 | 0;
 i8 = i8 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0;
 i10 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i12 = i10;
 HEAP32[i12 >> 2] = 0;
 i11 = i12 + 4 | 0;
 HEAP32[i11 >> 2] = 0;
 HEAP32[i12 + 8 >> 2] = 0;
 i5 = i8 + 4 | 0;
 i1 = HEAP32[i8 >> 2] | 0;
 L1 : do if ((HEAP32[i5 >> 2] | 0) == (i1 | 0)) i9 = 21; else {
  i6 = i12 + 8 | 0;
  i3 = 0;
  i4 = 0;
  i2 = 0;
  while (1) {
   i1 = i1 + (i2 * 24 | 0) | 0;
   __THREW__ = 0;
   if ((i3 | 0) == (i4 | 0)) {
    __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEE21__push_back_slow_pathIRKS3_EEvOT_(i12, i1);
    i4 = __THREW__;
    __THREW__ = 0;
    if (i4 & 1) break;
   } else {
    __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i3, i1);
    i4 = __THREW__;
    __THREW__ = 0;
    if (i4 & 1) break;
    HEAP32[i11 >> 2] = (HEAP32[i11 >> 2] | 0) + 12;
   }
   i2 = i2 + 1 | 0;
   i1 = HEAP32[i8 >> 2] | 0;
   if (i2 >>> 0 >= (((HEAP32[i5 >> 2] | 0) - i1 | 0) / 24 | 0) >>> 0) {
    i9 = 21;
    break L1;
   }
   i3 = HEAP32[i11 >> 2] | 0;
   i4 = HEAP32[i6 >> 2] | 0;
  }
  i6 = ___cxa_find_matching_catch() | 0;
 } while (0);
 do if ((i9 | 0) == 21) {
  __THREW__ = 0;
  i6 = invoke_iii(24, i7 | 0, i12 | 0) | 0;
  i9 = __THREW__;
  __THREW__ = 0;
  if (i9 & 1) {
   i6 = ___cxa_find_matching_catch() | 0;
   break;
  }
  i1 = HEAP32[i12 >> 2] | 0;
  if (!i1) {
   STACKTOP = i10;
   return i6 | 0;
  }
  i2 = HEAP32[i11 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i3 = i2 + -12 | 0;
    HEAP32[i11 >> 2] = i3;
    i4 = HEAP32[i3 >> 2] | 0;
    i5 = i4;
    if (!i4) i2 = i3; else {
     i2 = i2 + -8 | 0;
     i3 = HEAP32[i2 >> 2] | 0;
     if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
     __ZdlPv(i4);
     i2 = HEAP32[i11 >> 2] | 0;
    }
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i12 >> 2] | 0;
  }
  __ZdlPv(i1);
  STACKTOP = i10;
  return i6 | 0;
 } while (0);
 i1 = HEAP32[i12 >> 2] | 0;
 if (!i1) ___resumeException(i6 | 0);
 i2 = HEAP32[i11 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) {
  do {
   i3 = i2 + -12 | 0;
   HEAP32[i11 >> 2] = i3;
   i4 = HEAP32[i3 >> 2] | 0;
   i5 = i4;
   if (!i4) i2 = i3; else {
    i2 = i2 + -8 | 0;
    i3 = HEAP32[i2 >> 2] | 0;
    if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
    __ZdlPv(i4);
    i2 = HEAP32[i11 >> 2] | 0;
   }
  } while ((i2 | 0) != (i1 | 0));
  i1 = HEAP32[i12 >> 2] | 0;
 }
 __ZdlPv(i1);
 ___resumeException(i6 | 0);
 return 0;
}

function __ZN20seriesClassification14addTrainingSetERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE(i7, i8) {
 i7 = i7 | 0;
 i8 = i8 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0;
 i10 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i12 = i10;
 HEAP32[i12 >> 2] = 0;
 i11 = i12 + 4 | 0;
 HEAP32[i11 >> 2] = 0;
 HEAP32[i12 + 8 >> 2] = 0;
 i5 = i8 + 4 | 0;
 i1 = HEAP32[i8 >> 2] | 0;
 L1 : do if ((HEAP32[i5 >> 2] | 0) == (i1 | 0)) i9 = 21; else {
  i6 = i12 + 8 | 0;
  i3 = 0;
  i4 = 0;
  i2 = 0;
  while (1) {
   i1 = i1 + (i2 * 24 | 0) | 0;
   __THREW__ = 0;
   if ((i3 | 0) == (i4 | 0)) {
    __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEE21__push_back_slow_pathIRKS3_EEvOT_(i12, i1);
    i4 = __THREW__;
    __THREW__ = 0;
    if (i4 & 1) break;
   } else {
    __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i3, i1);
    i4 = __THREW__;
    __THREW__ = 0;
    if (i4 & 1) break;
    HEAP32[i11 >> 2] = (HEAP32[i11 >> 2] | 0) + 12;
   }
   i2 = i2 + 1 | 0;
   i1 = HEAP32[i8 >> 2] | 0;
   if (i2 >>> 0 >= (((HEAP32[i5 >> 2] | 0) - i1 | 0) / 24 | 0) >>> 0) {
    i9 = 21;
    break L1;
   }
   i3 = HEAP32[i11 >> 2] | 0;
   i4 = HEAP32[i6 >> 2] | 0;
  }
  i6 = ___cxa_find_matching_catch() | 0;
 } while (0);
 do if ((i9 | 0) == 21) {
  __THREW__ = 0;
  invoke_iii(23, i7 | 0, i12 | 0) | 0;
  i9 = __THREW__;
  __THREW__ = 0;
  if (i9 & 1) {
   i6 = ___cxa_find_matching_catch() | 0;
   break;
  }
  i1 = HEAP32[i12 >> 2] | 0;
  if (!i1) {
   STACKTOP = i10;
   return 1;
  }
  i2 = HEAP32[i11 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i3 = i2 + -12 | 0;
    HEAP32[i11 >> 2] = i3;
    i4 = HEAP32[i3 >> 2] | 0;
    i5 = i4;
    if (!i4) i2 = i3; else {
     i2 = i2 + -8 | 0;
     i3 = HEAP32[i2 >> 2] | 0;
     if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
     __ZdlPv(i4);
     i2 = HEAP32[i11 >> 2] | 0;
    }
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i12 >> 2] | 0;
  }
  __ZdlPv(i1);
  STACKTOP = i10;
  return 1;
 } while (0);
 i1 = HEAP32[i12 >> 2] | 0;
 if (!i1) ___resumeException(i6 | 0);
 i2 = HEAP32[i11 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) {
  do {
   i3 = i2 + -12 | 0;
   HEAP32[i11 >> 2] = i3;
   i4 = HEAP32[i3 >> 2] | 0;
   i5 = i4;
   if (!i4) i2 = i3; else {
    i2 = i2 + -8 | 0;
    i3 = HEAP32[i2 >> 2] | 0;
    if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
    __ZdlPv(i4);
    i2 = HEAP32[i11 >> 2] | 0;
   }
  } while ((i2 | 0) != (i1 | 0));
  i1 = HEAP32[i12 >> 2] | 0;
 }
 __ZdlPv(i1);
 ___resumeException(i6 | 0);
 return 0;
}
function __ZN6LIBSVM6Solver18select_working_setERiS1_(i20, i18, i19) {
 i20 = i20 | 0;
 i18 = i18 | 0;
 i19 = i19 | 0;
 var i1 = 0, d2 = 0.0, i3 = 0, d4 = 0.0, d5 = 0.0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, d15 = 0.0, d16 = 0.0, d17 = 0.0, d21 = 0.0;
 i10 = i20 + 4 | 0;
 i11 = HEAP32[i10 >> 2] | 0;
 if ((i11 | 0) <= 0) {
  i20 = 1;
  return i20 | 0;
 }
 i6 = HEAP32[i20 + 8 >> 2] | 0;
 i7 = HEAP32[i20 + 16 >> 2] | 0;
 i8 = i20 + 12 | 0;
 d2 = -inf;
 i1 = -1;
 i9 = 0;
 do {
  i3 = HEAP8[i7 + i9 >> 0] | 0;
  if ((HEAP8[i6 + i9 >> 0] | 0) == 1) {
   if (i3 << 24 >> 24 != 1 ? (d4 = -+HEAPF64[(HEAP32[i8 >> 2] | 0) + (i9 << 3) >> 3], d2 <= d4) : 0) {
    d2 = d4;
    i1 = i9;
   }
  } else if (i3 << 24 >> 24 != 0 ? (d5 = +HEAPF64[(HEAP32[i8 >> 2] | 0) + (i9 << 3) >> 3], d5 >= d2) : 0) {
   d2 = d5;
   i1 = i9;
  }
  i9 = i9 + 1 | 0;
 } while ((i9 | 0) < (i11 | 0));
 d15 = d2;
 if ((i1 | 0) == -1) {
  i14 = -1;
  i12 = 0;
 } else {
  i12 = HEAP32[i20 + 24 >> 2] | 0;
  i12 = FUNCTION_TABLE_iiii[HEAP32[HEAP32[i12 >> 2] >> 2] & 31](i12, i1, i11) | 0;
  i11 = HEAP32[i10 >> 2] | 0;
  i14 = i1;
 }
 if ((i11 | 0) <= 0) {
  i20 = 1;
  return i20 | 0;
 }
 i6 = HEAP32[i20 + 8 >> 2] | 0;
 i7 = HEAP32[i20 + 16 >> 2] | 0;
 i8 = i20 + 12 | 0;
 i9 = i20 + 28 | 0;
 i10 = i6 + i14 | 0;
 d2 = -inf;
 i1 = -1;
 i13 = 0;
 d5 = inf;
 while (1) {
  i3 = HEAP8[i7 + i13 >> 0] | 0;
  if ((HEAP8[i6 + i13 >> 0] | 0) == 1) if (i3 << 24 >> 24) {
   d21 = +HEAPF64[(HEAP32[i8 >> 2] | 0) + (i13 << 3) >> 3];
   d4 = d15 + d21;
   d2 = d21 >= d2 ? d21 : d2;
   if (d4 > 0.0 ? (i3 = HEAP32[i9 >> 2] | 0, d16 = +HEAPF64[i3 + (i14 << 3) >> 3] + +HEAPF64[i3 + (i13 << 3) >> 3] - +(HEAP8[i10 >> 0] | 0) * 2.0 * +HEAPF32[i12 + (i13 << 2) >> 2], d16 = -(d4 * d4) / (d16 > 0.0 ? d16 : 1.0e-12), d16 <= d5) : 0) {
    i1 = i13;
    d4 = d16;
   } else d4 = d5;
  } else d4 = d5; else if (i3 << 24 >> 24 != 1) {
   d21 = +HEAPF64[(HEAP32[i8 >> 2] | 0) + (i13 << 3) >> 3];
   d4 = d15 - d21;
   d21 = -d21;
   d2 = d2 <= d21 ? d21 : d2;
   if (d4 > 0.0 ? (i3 = HEAP32[i9 >> 2] | 0, d17 = +HEAPF64[i3 + (i14 << 3) >> 3] + +HEAPF64[i3 + (i13 << 3) >> 3] + +(HEAP8[i10 >> 0] | 0) * 2.0 * +HEAPF32[i12 + (i13 << 2) >> 2], d17 = -(d4 * d4) / (d17 > 0.0 ? d17 : 1.0e-12), d17 <= d5) : 0) {
    i1 = i13;
    d4 = d17;
   } else d4 = d5;
  } else d4 = d5;
  i13 = i13 + 1 | 0;
  if ((i13 | 0) >= (i11 | 0)) break; else d5 = d4;
 }
 if ((i1 | 0) == -1 ? 1 : d15 + d2 < +HEAPF64[i20 + 32 >> 3]) {
  i20 = 1;
  return i20 | 0;
 }
 HEAP32[i18 >> 2] = i14;
 HEAP32[i19 >> 2] = i1;
 i20 = 0;
 return i20 | 0;
}

function __ZNSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEEC2ERKS4_(i10, i3) {
 i10 = i10 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0;
 HEAP32[i10 >> 2] = 0;
 i9 = i10 + 4 | 0;
 HEAP32[i9 >> 2] = 0;
 HEAP32[i10 + 8 >> 2] = 0;
 i4 = i3 + 4 | 0;
 i7 = HEAP32[i4 >> 2] | 0;
 i8 = HEAP32[i3 >> 2] | 0;
 i1 = i7 - i8 | 0;
 i2 = (i1 | 0) / 24 | 0;
 if ((i7 | 0) == (i8 | 0)) return;
 if (i2 >>> 0 > 178956970 ? (__THREW__ = 0, invoke_vi(40, i10 | 0), i8 = __THREW__, __THREW__ = 0, i8 & 1) : 0) i5 = 15; else i5 = 4;
 do if ((i5 | 0) == 4) {
  __THREW__ = 0;
  i1 = invoke_ii(12, i1 | 0) | 0;
  i8 = __THREW__;
  __THREW__ = 0;
  if (!(i8 & 1)) {
   HEAP32[i9 >> 2] = i1;
   HEAP32[i10 >> 2] = i1;
   HEAP32[i10 + 8 >> 2] = i1 + (i2 * 24 | 0);
   i2 = HEAP32[i3 >> 2] | 0;
   i3 = HEAP32[i4 >> 2] | 0;
   if ((i2 | 0) == (i3 | 0)) return;
   while (1) {
    __THREW__ = 0;
    invoke_vii(8, i1 | 0, i2 | 0);
    i8 = __THREW__;
    __THREW__ = 0;
    if (i8 & 1) {
     i5 = 14;
     break;
    }
    __THREW__ = 0;
    invoke_vii(8, i1 + 12 | 0, i2 + 12 | 0);
    i8 = __THREW__;
    __THREW__ = 0;
    if (i8 & 1) {
     i5 = 9;
     break;
    }
    i1 = (HEAP32[i9 >> 2] | 0) + 24 | 0;
    HEAP32[i9 >> 2] = i1;
    i2 = i2 + 24 | 0;
    if ((i2 | 0) == (i3 | 0)) {
     i5 = 30;
     break;
    }
   }
   if ((i5 | 0) == 9) {
    i3 = ___cxa_find_matching_catch() | 0;
    i4 = HEAP32[i1 >> 2] | 0;
    if (!i4) break;
    i1 = i1 + 4 | 0;
    i2 = HEAP32[i1 >> 2] | 0;
    if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
    __ZdlPv(i4);
    break;
   } else if ((i5 | 0) == 14) {
    i3 = ___cxa_find_matching_catch() | 0;
    break;
   } else if ((i5 | 0) == 30) return;
  } else i5 = 15;
 } while (0);
 if ((i5 | 0) == 15) i3 = ___cxa_find_matching_catch() | 0;
 i1 = HEAP32[i10 >> 2] | 0;
 if (!i1) ___resumeException(i3 | 0);
 i2 = HEAP32[i9 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) {
  do {
   i4 = i2 + -24 | 0;
   HEAP32[i9 >> 2] = i4;
   i5 = HEAP32[i2 + -12 >> 2] | 0;
   i6 = i5;
   if (i5) {
    i7 = i2 + -8 | 0;
    i8 = HEAP32[i7 >> 2] | 0;
    if ((i8 | 0) != (i5 | 0)) HEAP32[i7 >> 2] = i8 + (~((i8 + -8 - i6 | 0) >>> 3) << 3);
    __ZdlPv(i5);
   }
   i5 = HEAP32[i4 >> 2] | 0;
   i6 = i5;
   if (i5) {
    i2 = i2 + -20 | 0;
    i4 = HEAP32[i2 >> 2] | 0;
    if ((i4 | 0) != (i5 | 0)) HEAP32[i2 >> 2] = i4 + (~((i4 + -8 - i6 | 0) >>> 3) << 3);
    __ZdlPv(i5);
   }
   i2 = HEAP32[i9 >> 2] | 0;
  } while ((i2 | 0) != (i1 | 0));
  i1 = HEAP32[i10 >> 2] | 0;
 }
 __ZdlPv(i1);
 ___resumeException(i3 | 0);
}

function __ZN20seriesClassification9addSeriesERKNSt3__16vectorINS1_IdNS0_9allocatorIdEEEENS2_IS4_EEEE(i7, i1) {
 i7 = i7 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i8 = 0, i9 = 0, i10 = 0;
 i8 = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i10 = i8 + 16 | 0;
 i9 = i8;
 __ZN3dtwC2Ev(i10);
 __THREW__ = 0;
 invoke_vii(12, i9 | 0, i1 | 0);
 i6 = __THREW__;
 __THREW__ = 0;
 do if (!(i6 & 1)) {
  __THREW__ = 0;
  invoke_vii(26, i10 | 0, i9 | 0);
  i6 = __THREW__;
  __THREW__ = 0;
  if (i6 & 1) {
   i8 = ___cxa_find_matching_catch() | 0;
   i6 = tempRet0;
   i1 = HEAP32[i9 >> 2] | 0;
   if (!i1) {
    i9 = i8;
    __ZN3dtwD2Ev(i10);
    ___resumeException(i9 | 0);
   }
   i7 = i9 + 4 | 0;
   i2 = HEAP32[i7 >> 2] | 0;
   if ((i2 | 0) != (i1 | 0)) {
    do {
     i3 = i2 + -12 | 0;
     HEAP32[i7 >> 2] = i3;
     i4 = HEAP32[i3 >> 2] | 0;
     i5 = i4;
     if (!i4) i2 = i3; else {
      i2 = i2 + -8 | 0;
      i3 = HEAP32[i2 >> 2] | 0;
      if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
      __ZdlPv(i4);
      i2 = HEAP32[i7 >> 2] | 0;
     }
    } while ((i2 | 0) != (i1 | 0));
    i1 = HEAP32[i9 >> 2] | 0;
   }
   __ZdlPv(i1);
   i9 = i8;
   __ZN3dtwD2Ev(i10);
   ___resumeException(i9 | 0);
  }
  i1 = HEAP32[i9 >> 2] | 0;
  if (i1) {
   i6 = i9 + 4 | 0;
   i2 = HEAP32[i6 >> 2] | 0;
   if ((i2 | 0) != (i1 | 0)) {
    i3 = i2;
    while (1) {
     i2 = i3 + -12 | 0;
     HEAP32[i6 >> 2] = i2;
     i4 = HEAP32[i2 >> 2] | 0;
     i5 = i4;
     if (i4) {
      i2 = i3 + -8 | 0;
      i3 = HEAP32[i2 >> 2] | 0;
      if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
      __ZdlPv(i4);
      i2 = HEAP32[i6 >> 2] | 0;
     }
     if ((i2 | 0) == (i1 | 0)) break; else i3 = i2;
    }
    i1 = HEAP32[i9 >> 2] | 0;
   }
   __ZdlPv(i1);
  }
  i1 = i7 + 4 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  if ((i2 | 0) == (HEAP32[i7 + 8 >> 2] | 0)) {
   __THREW__ = 0;
   invoke_vii(27, i7 | 0, i10 | 0);
   i9 = __THREW__;
   __THREW__ = 0;
   if (i9 & 1) break;
   __ZN3dtwD2Ev(i10);
   STACKTOP = i8;
   return 1;
  }
  __THREW__ = 0;
  invoke_vii(12, i2 | 0, i10 | 0);
  i9 = __THREW__;
  __THREW__ = 0;
  if (!(i9 & 1)) {
   HEAP32[i2 + 12 >> 2] = HEAP32[i10 + 12 >> 2];
   HEAP32[i1 >> 2] = (HEAP32[i1 >> 2] | 0) + 16;
   __ZN3dtwD2Ev(i10);
   STACKTOP = i8;
   return 1;
  }
 } while (0);
 i9 = ___cxa_find_matching_catch() | 0;
 __ZN3dtwD2Ev(i10);
 ___resumeException(i9 | 0);
 return 0;
}

function __ZNSt3__16vectorI3dtwNS_9allocatorIS1_EEE21__push_back_slow_pathIRKS1_EEvOT_(i10, i6) {
 i10 = i10 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i7 = 0, i8 = 0, i9 = 0, i11 = 0, i12 = 0;
 i11 = i10 + 4 | 0;
 i1 = HEAP32[i10 >> 2] | 0;
 i3 = ((HEAP32[i11 >> 2] | 0) - i1 >> 4) + 1 | 0;
 if (i3 >>> 0 > 268435455) {
  __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i10);
  i1 = HEAP32[i10 >> 2] | 0;
 }
 i12 = i10 + 8 | 0;
 i2 = (HEAP32[i12 >> 2] | 0) - i1 | 0;
 if (i2 >> 4 >>> 0 < 134217727) {
  i2 = i2 >> 3;
  i2 = i2 >>> 0 < i3 >>> 0 ? i3 : i2;
  i1 = (HEAP32[i11 >> 2] | 0) - i1 >> 4;
  if (!i2) {
   i4 = 0;
   i9 = 0;
  } else i7 = 6;
 } else {
  i2 = 268435455;
  i1 = (HEAP32[i11 >> 2] | 0) - i1 >> 4;
  i7 = 6;
 }
 if ((i7 | 0) == 6) {
  i4 = i2;
  i9 = __Znwj(i2 << 4) | 0;
 }
 i5 = i9 + (i1 << 4) | 0;
 i3 = i5;
 i8 = i9 + (i4 << 4) | 0;
 __THREW__ = 0;
 invoke_vii(12, i5 | 0, i6 | 0);
 i7 = __THREW__;
 __THREW__ = 0;
 L10 : do if (i7 & 1) {
  i12 = ___cxa_find_matching_catch() | 0;
  i1 = i3;
  i2 = i3;
  i3 = i12;
 } else {
  HEAP32[i9 + (i1 << 4) + 12 >> 2] = HEAP32[i6 + 12 >> 2];
  i2 = i9 + (i1 + 1 << 4) | 0;
  i7 = HEAP32[i10 >> 2] | 0;
  i1 = HEAP32[i11 >> 2] | 0;
  do if ((i1 | 0) != (i7 | 0)) {
   while (1) {
    i4 = i1;
    i1 = i1 + -16 | 0;
    __THREW__ = 0;
    invoke_vii(12, i5 + -16 | 0, i1 | 0);
    i6 = __THREW__;
    __THREW__ = 0;
    if (i6 & 1) {
     i1 = i3;
     i7 = 18;
     break;
    }
    HEAP32[i5 + -4 >> 2] = HEAP32[i4 + -4 >> 2];
    i5 = i3 + -16 | 0;
    i3 = i5;
    if ((i1 | 0) == (i7 | 0)) {
     i1 = i3;
     i7 = 12;
     break;
    }
   }
   if ((i7 | 0) == 12) {
    i5 = i10;
    i6 = i11;
    i3 = i1;
    i4 = HEAP32[i10 >> 2] | 0;
    i1 = HEAP32[i11 >> 2] | 0;
    break;
   } else if ((i7 | 0) == 18) {
    i3 = ___cxa_find_matching_catch() | 0;
    break L10;
   }
  } else {
   i5 = i10;
   i6 = i11;
   i4 = i7;
  } while (0);
  HEAP32[i5 >> 2] = i3;
  HEAP32[i6 >> 2] = i2;
  HEAP32[i12 >> 2] = i8;
  i2 = i4;
  if ((i1 | 0) != (i2 | 0)) do {
   i1 = i1 + -16 | 0;
   __ZN3dtwD2Ev(i1);
  } while ((i1 | 0) != (i2 | 0));
  if (!i4) return;
  __ZdlPv(i4);
  return;
 } while (0);
 if ((i2 | 0) != (i1 | 0)) do {
  i2 = i2 + -16 | 0;
  __ZN3dtwD2Ev(i2);
 } while ((i2 | 0) != (i1 | 0));
 if (!i9) ___resumeException(i3 | 0);
 __ZdlPv(i9);
 ___resumeException(i3 | 0);
}

function _pop_arg(i2, i3, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 var i4 = 0, i5 = 0, d6 = 0.0;
 L1 : do if (i3 >>> 0 <= 20) do switch (i3 | 0) {
 case 9:
  {
   i4 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i3 = HEAP32[i4 >> 2] | 0;
   HEAP32[i1 >> 2] = i4 + 4;
   HEAP32[i2 >> 2] = i3;
   break L1;
  }
 case 10:
  {
   i4 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i3 = HEAP32[i4 >> 2] | 0;
   HEAP32[i1 >> 2] = i4 + 4;
   i4 = i2;
   HEAP32[i4 >> 2] = i3;
   HEAP32[i4 + 4 >> 2] = ((i3 | 0) < 0) << 31 >> 31;
   break L1;
  }
 case 11:
  {
   i4 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i3 = HEAP32[i4 >> 2] | 0;
   HEAP32[i1 >> 2] = i4 + 4;
   i4 = i2;
   HEAP32[i4 >> 2] = i3;
   HEAP32[i4 + 4 >> 2] = 0;
   break L1;
  }
 case 12:
  {
   i4 = (HEAP32[i1 >> 2] | 0) + (8 - 1) & ~(8 - 1);
   i3 = i4;
   i5 = HEAP32[i3 >> 2] | 0;
   i3 = HEAP32[i3 + 4 >> 2] | 0;
   HEAP32[i1 >> 2] = i4 + 8;
   i4 = i2;
   HEAP32[i4 >> 2] = i5;
   HEAP32[i4 + 4 >> 2] = i3;
   break L1;
  }
 case 13:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i4 = HEAP32[i5 >> 2] | 0;
   HEAP32[i1 >> 2] = i5 + 4;
   i4 = (i4 & 65535) << 16 >> 16;
   i5 = i2;
   HEAP32[i5 >> 2] = i4;
   HEAP32[i5 + 4 >> 2] = ((i4 | 0) < 0) << 31 >> 31;
   break L1;
  }
 case 14:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i4 = HEAP32[i5 >> 2] | 0;
   HEAP32[i1 >> 2] = i5 + 4;
   i5 = i2;
   HEAP32[i5 >> 2] = i4 & 65535;
   HEAP32[i5 + 4 >> 2] = 0;
   break L1;
  }
 case 15:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i4 = HEAP32[i5 >> 2] | 0;
   HEAP32[i1 >> 2] = i5 + 4;
   i4 = (i4 & 255) << 24 >> 24;
   i5 = i2;
   HEAP32[i5 >> 2] = i4;
   HEAP32[i5 + 4 >> 2] = ((i4 | 0) < 0) << 31 >> 31;
   break L1;
  }
 case 16:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (4 - 1) & ~(4 - 1);
   i4 = HEAP32[i5 >> 2] | 0;
   HEAP32[i1 >> 2] = i5 + 4;
   i5 = i2;
   HEAP32[i5 >> 2] = i4 & 255;
   HEAP32[i5 + 4 >> 2] = 0;
   break L1;
  }
 case 17:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (8 - 1) & ~(8 - 1);
   d6 = +HEAPF64[i5 >> 3];
   HEAP32[i1 >> 2] = i5 + 8;
   HEAPF64[i2 >> 3] = d6;
   break L1;
  }
 case 18:
  {
   i5 = (HEAP32[i1 >> 2] | 0) + (8 - 1) & ~(8 - 1);
   d6 = +HEAPF64[i5 >> 3];
   HEAP32[i1 >> 2] = i5 + 8;
   HEAPF64[i2 >> 3] = d6;
   break L1;
  }
 default:
  break L1;
 } while (0); while (0);
 return;
}

function __ZN17knnClassificationC2ERKiRKNSt3__16vectorIiNS2_9allocatorIiEEEERKNS3_I15trainingExampleNS4_IS9_EEEEi(i13, i1, i2, i3, i4) {
 i13 = i13 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0;
 HEAP32[i13 >> 2] = 1492;
 HEAP32[i13 + 4 >> 2] = HEAP32[i1 >> 2];
 i12 = i13 + 8 | 0;
 __THREW__ = 0;
 invoke_vii(11, i12 | 0, i2 | 0);
 i11 = __THREW__;
 __THREW__ = 0;
 if (i11 & 1) {
  i13 = ___cxa_find_matching_catch() | 0;
  ___resumeException(i13 | 0);
 }
 i11 = i13 + 20 | 0;
 __THREW__ = 0;
 invoke_vii(16, i11 | 0, i3 | 0);
 i10 = __THREW__;
 __THREW__ = 0;
 if (!(i10 & 1)) {
  HEAP32[i13 + 32 >> 2] = i4;
  HEAP32[i13 + 36 >> 2] = i4;
  __THREW__ = 0;
  i3 = invoke_ii(19, (i4 >>> 0 > 268435455 ? -1 : i4 << 4) | 0) | 0;
  i10 = __THREW__;
  __THREW__ = 0;
  if (!(i10 & 1)) {
   if (!i4) {
    i13 = i13 + 40 | 0;
    HEAP32[i13 >> 2] = i3;
    return;
   }
   i1 = i3 + (i4 << 4) | 0;
   i2 = i3;
   do {
    HEAP32[i2 >> 2] = 0;
    HEAPF64[i2 + 8 >> 3] = 0.0;
    i2 = i2 + 16 | 0;
   } while ((i2 | 0) != (i1 | 0));
   i13 = i13 + 40 | 0;
   HEAP32[i13 >> 2] = i3;
   return;
  }
  i4 = ___cxa_find_matching_catch() | 0;
  i9 = tempRet0;
  i1 = HEAP32[i11 >> 2] | 0;
  if (i1) {
   i10 = i13 + 24 | 0;
   i2 = HEAP32[i10 >> 2] | 0;
   if ((i2 | 0) != (i1 | 0)) {
    do {
     i3 = i2 + -24 | 0;
     HEAP32[i10 >> 2] = i3;
     i5 = HEAP32[i2 + -12 >> 2] | 0;
     i6 = i5;
     if (i5) {
      i7 = i2 + -8 | 0;
      i8 = HEAP32[i7 >> 2] | 0;
      if ((i8 | 0) != (i5 | 0)) HEAP32[i7 >> 2] = i8 + (~((i8 + -8 - i6 | 0) >>> 3) << 3);
      __ZdlPv(i5);
     }
     i5 = HEAP32[i3 >> 2] | 0;
     i6 = i5;
     if (i5) {
      i2 = i2 + -20 | 0;
      i3 = HEAP32[i2 >> 2] | 0;
      if ((i3 | 0) != (i5 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i6 | 0) >>> 3) << 3);
      __ZdlPv(i5);
     }
     i2 = HEAP32[i10 >> 2] | 0;
    } while ((i2 | 0) != (i1 | 0));
    i1 = HEAP32[i11 >> 2] | 0;
   }
   __ZdlPv(i1);
  }
 } else i4 = ___cxa_find_matching_catch() | 0;
 i3 = HEAP32[i12 >> 2] | 0;
 if (!i3) {
  i13 = i4;
  ___resumeException(i13 | 0);
 }
 i1 = i13 + 12 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -4 - i3 | 0) >>> 2) << 2);
 __ZdlPv(i3);
 i13 = i4;
 ___resumeException(i13 | 0);
}

function __ZN47EmscriptenBindingInitializer_rapidStream_moduleC2Ev(i1) {
 i1 = i1 | 0;
 __embind_register_class(752, 760, 776, 0, 3369, 40, 3372, 0, 3372, 0, 5766, 3374, 56);
 __embind_register_class_constructor(752, 1, 2148, 3369, 41, 9);
 __embind_register_class_constructor(752, 2, 2152, 3535, 25, 42);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 57;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(752, 5781, 2, 2160, 5512, 28, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 1;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(752, 5787, 3, 2168, 4211, 2, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 3;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(752, 5800, 2, 2180, 5809, 5, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 4;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(752, 5813, 2, 2180, 5809, 5, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 5;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(752, 5826, 2, 2180, 5809, 5, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 6;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(752, 5834, 2, 2180, 5809, 5, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 7;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(752, 5842, 2, 2180, 5809, 5, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 8;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(752, 5846, 2, 2180, 5809, 5, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 9;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(752, 5851, 2, 2180, 5809, 5, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 10;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(752, 5869, 2, 2180, 5809, 5, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 11;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(752, 5873, 2, 2180, 5809, 5, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 12;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(752, 5885, 2, 2180, 5809, 5, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 13;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(752, 5897, 2, 2180, 5809, 5, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 14;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(752, 5913, 2, 2180, 5809, 5, i1 | 0, 0);
 return;
}

function __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEE21__push_back_slow_pathIRKS3_EEvOT_(i9, i7) {
 i9 = i9 | 0;
 i7 = i7 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i8 = 0, i10 = 0, i11 = 0, i12 = 0;
 i10 = i9 + 4 | 0;
 i1 = HEAP32[i9 >> 2] | 0;
 i3 = (((HEAP32[i10 >> 2] | 0) - i1 | 0) / 12 | 0) + 1 | 0;
 if (i3 >>> 0 > 357913941) {
  __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i9);
  i1 = HEAP32[i9 >> 2] | 0;
 }
 i11 = i9 + 8 | 0;
 i2 = ((HEAP32[i11 >> 2] | 0) - i1 | 0) / 12 | 0;
 if (i2 >>> 0 < 178956970) {
  i2 = i2 << 1;
  i2 = i2 >>> 0 < i3 >>> 0 ? i3 : i2;
  i1 = ((HEAP32[i10 >> 2] | 0) - i1 | 0) / 12 | 0;
  if (!i2) {
   i4 = 0;
   i5 = 0;
  } else i6 = 6;
 } else {
  i2 = 357913941;
  i1 = ((HEAP32[i10 >> 2] | 0) - i1 | 0) / 12 | 0;
  i6 = 6;
 }
 if ((i6 | 0) == 6) {
  i4 = i2;
  i5 = __Znwj(i2 * 12 | 0) | 0;
 }
 i3 = i5 + (i1 * 12 | 0) | 0;
 i2 = i3;
 i8 = i5 + (i4 * 12 | 0) | 0;
 __THREW__ = 0;
 invoke_vii(8, i3 | 0, i7 | 0);
 i7 = __THREW__;
 __THREW__ = 0;
 if (i7 & 1) {
  i1 = ___cxa_find_matching_catch() | 0;
  if (!i5) ___resumeException(i1 | 0);
  __ZdlPv(i5);
  ___resumeException(i1 | 0);
 }
 i6 = i5 + ((i1 + 1 | 0) * 12 | 0) | 0;
 i5 = HEAP32[i9 >> 2] | 0;
 i1 = HEAP32[i10 >> 2] | 0;
 if ((i1 | 0) == (i5 | 0)) {
  i3 = i9;
  i4 = i10;
  i7 = i5;
 } else {
  do {
   i7 = i3 + -12 | 0;
   i4 = i1;
   i1 = i1 + -12 | 0;
   HEAP32[i7 >> 2] = 0;
   i12 = i3 + -8 | 0;
   HEAP32[i12 >> 2] = 0;
   HEAP32[i3 + -4 >> 2] = 0;
   HEAP32[i7 >> 2] = HEAP32[i1 >> 2];
   i7 = i4 + -8 | 0;
   HEAP32[i12 >> 2] = HEAP32[i7 >> 2];
   i4 = i4 + -4 | 0;
   HEAP32[i3 + -4 >> 2] = HEAP32[i4 >> 2];
   HEAP32[i4 >> 2] = 0;
   HEAP32[i7 >> 2] = 0;
   HEAP32[i1 >> 2] = 0;
   i3 = i2 + -12 | 0;
   i2 = i3;
  } while ((i1 | 0) != (i5 | 0));
  i1 = i2;
  i3 = i9;
  i4 = i10;
  i2 = i1;
  i7 = HEAP32[i9 >> 2] | 0;
  i1 = HEAP32[i10 >> 2] | 0;
 }
 HEAP32[i3 >> 2] = i2;
 HEAP32[i4 >> 2] = i6;
 HEAP32[i11 >> 2] = i8;
 i6 = i7;
 if ((i1 | 0) != (i6 | 0)) do {
  i2 = i1;
  i1 = i1 + -12 | 0;
  i4 = HEAP32[i1 >> 2] | 0;
  i5 = i4;
  if (i4) {
   i2 = i2 + -8 | 0;
   i3 = HEAP32[i2 >> 2] | 0;
   if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
   __ZdlPv(i4);
  }
 } while ((i1 | 0) != (i6 | 0));
 if (!i7) return;
 __ZdlPv(i7);
 return;
}

function __ZN6LIBSVM5Cache10swap_indexEii(i8, i3, i4) {
 i8 = i8 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i5 = 0, i6 = 0, i7 = 0;
 if ((i3 | 0) == (i4 | 0)) return;
 i1 = i8 + 8 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if (HEAP32[i2 + (i3 << 4) + 12 >> 2] | 0) {
  i7 = i2 + (i3 << 4) + 4 | 0;
  i6 = HEAP32[i2 + (i3 << 4) >> 2] | 0;
  HEAP32[i6 + 4 >> 2] = HEAP32[i7 >> 2];
  HEAP32[HEAP32[i7 >> 2] >> 2] = i6;
 }
 if (HEAP32[i2 + (i4 << 4) + 12 >> 2] | 0) {
  i7 = i2 + (i4 << 4) + 4 | 0;
  i6 = HEAP32[i2 + (i4 << 4) >> 2] | 0;
  HEAP32[i6 + 4 >> 2] = HEAP32[i7 >> 2];
  HEAP32[HEAP32[i7 >> 2] >> 2] = i6;
 }
 i5 = i2 + (i3 << 4) + 8 | 0;
 i7 = i2 + (i4 << 4) + 8 | 0;
 i6 = HEAP32[i5 >> 2] | 0;
 HEAP32[i5 >> 2] = HEAP32[i7 >> 2];
 HEAP32[i7 >> 2] = i6;
 i1 = HEAP32[i1 >> 2] | 0;
 i7 = i1 + (i3 << 4) + 12 | 0;
 i6 = i1 + (i4 << 4) + 12 | 0;
 i2 = HEAP32[i7 >> 2] | 0;
 HEAP32[i7 >> 2] = HEAP32[i6 >> 2];
 HEAP32[i6 >> 2] = i2;
 if (HEAP32[i7 >> 2] | 0) {
  i6 = i1 + (i3 << 4) | 0;
  i5 = i8 + 12 | 0;
  i7 = i1 + (i3 << 4) + 4 | 0;
  HEAP32[i7 >> 2] = i5;
  i5 = HEAP32[i5 >> 2] | 0;
  HEAP32[i6 >> 2] = i5;
  HEAP32[i5 + 4 >> 2] = i6;
  HEAP32[HEAP32[i7 >> 2] >> 2] = i6;
 }
 if (!i2) i6 = i8 + 12 | 0; else {
  i5 = i1 + (i4 << 4) | 0;
  i6 = i8 + 12 | 0;
  i7 = i1 + (i4 << 4) + 4 | 0;
  HEAP32[i7 >> 2] = i6;
  i2 = HEAP32[i6 >> 2] | 0;
  HEAP32[i5 >> 2] = i2;
  HEAP32[i2 + 4 >> 2] = i5;
  HEAP32[HEAP32[i7 >> 2] >> 2] = i5;
 }
 i5 = (i3 | 0) > (i4 | 0);
 i7 = i5 ? i4 : i3;
 i5 = i5 ? i3 : i4;
 i1 = HEAP32[i8 + 16 >> 2] | 0;
 if ((i1 | 0) == (i6 | 0)) return;
 i4 = i8 + 4 | 0;
 do {
  i2 = i1 + 12 | 0;
  i3 = HEAP32[i2 >> 2] | 0;
  do if ((i3 | 0) > (i7 | 0)) if ((i3 | 0) > (i5 | 0)) {
   i8 = HEAP32[i1 + 8 >> 2] | 0;
   i2 = i8 + (i7 << 2) | 0;
   i8 = i8 + (i5 << 2) | 0;
   i3 = HEAP32[i2 >> 2] | 0;
   HEAP32[i2 >> 2] = HEAP32[i8 >> 2];
   HEAP32[i8 >> 2] = i3;
   break;
  } else {
   i8 = i1 + 4 | 0;
   i3 = HEAP32[i1 >> 2] | 0;
   HEAP32[i3 + 4 >> 2] = HEAP32[i8 >> 2];
   HEAP32[HEAP32[i8 >> 2] >> 2] = i3;
   i8 = i1 + 8 | 0;
   _free(HEAP32[i8 >> 2] | 0);
   HEAP32[i4 >> 2] = (HEAP32[i4 >> 2] | 0) + (HEAP32[i2 >> 2] | 0);
   HEAP32[i8 >> 2] = 0;
   HEAP32[i2 >> 2] = 0;
   break;
  } while (0);
  i1 = HEAP32[i1 + 4 >> 2] | 0;
 } while ((i1 | 0) != (i6 | 0));
 return;
}

function __ZN10emscripten8internal7InvokerIP10regressionJONSt3__16vectorI15trainingExampleNS4_9allocatorIS6_EEEEEE6invokeEPFS3_SA_EPS9_(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0;
 i10 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i11 = i10;
 __ZNSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEEC2ERKS4_(i11, i1);
 __THREW__ = 0;
 i9 = invoke_ii(i2 | 0, i11 | 0) | 0;
 i8 = __THREW__;
 __THREW__ = 0;
 if (i8 & 1) {
  i9 = ___cxa_find_matching_catch() | 0;
  i1 = HEAP32[i11 >> 2] | 0;
  if (!i1) ___resumeException(i9 | 0);
  i8 = i11 + 4 | 0;
  i2 = HEAP32[i8 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i3 = i2 + -24 | 0;
    HEAP32[i8 >> 2] = i3;
    i4 = HEAP32[i2 + -12 >> 2] | 0;
    i5 = i4;
    if (i4) {
     i6 = i2 + -8 | 0;
     i7 = HEAP32[i6 >> 2] | 0;
     if ((i7 | 0) != (i4 | 0)) HEAP32[i6 >> 2] = i7 + (~((i7 + -8 - i5 | 0) >>> 3) << 3);
     __ZdlPv(i4);
    }
    i4 = HEAP32[i3 >> 2] | 0;
    i5 = i4;
    if (i4) {
     i2 = i2 + -20 | 0;
     i3 = HEAP32[i2 >> 2] | 0;
     if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
     __ZdlPv(i4);
    }
    i2 = HEAP32[i8 >> 2] | 0;
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i11 >> 2] | 0;
  }
  __ZdlPv(i1);
  ___resumeException(i9 | 0);
 } else {
  i1 = HEAP32[i11 >> 2] | 0;
  if (!i1) {
   STACKTOP = i10;
   return i9 | 0;
  }
  i8 = i11 + 4 | 0;
  i2 = HEAP32[i8 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i7 = i2 + -24 | 0;
    HEAP32[i8 >> 2] = i7;
    i3 = HEAP32[i2 + -12 >> 2] | 0;
    i4 = i3;
    if (i3) {
     i5 = i2 + -8 | 0;
     i6 = HEAP32[i5 >> 2] | 0;
     if ((i6 | 0) != (i3 | 0)) HEAP32[i5 >> 2] = i6 + (~((i6 + -8 - i4 | 0) >>> 3) << 3);
     __ZdlPv(i3);
    }
    i4 = HEAP32[i7 >> 2] | 0;
    i5 = i4;
    if (i4) {
     i2 = i2 + -20 | 0;
     i3 = HEAP32[i2 >> 2] | 0;
     if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
     __ZdlPv(i4);
    }
    i2 = HEAP32[i8 >> 2] | 0;
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i11 >> 2] | 0;
  }
  __ZdlPv(i1);
  STACKTOP = i10;
  return i9 | 0;
 }
 return 0;
}

function __ZNSt3__16vectorIdNS_9allocatorIdEEE6assignIPdEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIdNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(i8, i1, i10) {
 i8 = i8 | 0;
 i1 = i1 | 0;
 i10 = i10 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i9 = 0;
 i9 = i1;
 i5 = i10 - i9 >> 3;
 i7 = i8 + 8 | 0;
 i2 = HEAP32[i7 >> 2] | 0;
 i6 = HEAP32[i8 >> 2] | 0;
 i4 = i6;
 if (i5 >>> 0 <= i2 - i4 >> 3 >>> 0) {
  i7 = i8 + 4 | 0;
  i3 = (HEAP32[i7 >> 2] | 0) - i4 >> 3;
  i8 = i5 >>> 0 > i3 >>> 0;
  i5 = i8 ? i1 + (i3 << 3) | 0 : i10;
  i3 = i5;
  i2 = i3 - i9 | 0;
  _memmove(i6 | 0, i1 | 0, i2 | 0) | 0;
  i2 = i6 + (i2 >> 3 << 3) | 0;
  if (!i8) {
   i1 = HEAP32[i7 >> 2] | 0;
   if ((i1 | 0) == (i2 | 0)) return;
   HEAP32[i7 >> 2] = i1 + (~((i1 + -8 - i2 | 0) >>> 3) << 3);
   return;
  }
  if ((i5 | 0) == (i10 | 0)) return;
  i4 = HEAP32[i7 >> 2] | 0;
  i3 = (i10 + -8 - i3 | 0) >>> 3;
  i1 = i5;
  i2 = i4;
  while (1) {
   HEAPF64[i2 >> 3] = +HEAPF64[i1 >> 3];
   i1 = i1 + 8 | 0;
   if ((i1 | 0) == (i10 | 0)) break; else i2 = i2 + 8 | 0;
  }
  HEAP32[i7 >> 2] = i4 + (i3 + 1 << 3);
  return;
 }
 if (i6) {
  i2 = i8 + 4 | 0;
  i3 = HEAP32[i2 >> 2] | 0;
  if ((i3 | 0) != (i6 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i4 | 0) >>> 3) << 3);
  __ZdlPv(i6);
  HEAP32[i7 >> 2] = 0;
  HEAP32[i2 >> 2] = 0;
  HEAP32[i8 >> 2] = 0;
  i2 = 0;
 }
 if (i5 >>> 0 > 536870911) {
  __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i8);
  i2 = HEAP32[i7 >> 2] | 0;
  i3 = HEAP32[i8 >> 2] | 0;
 } else i3 = 0;
 i2 = i2 - i3 | 0;
 if (i2 >> 3 >>> 0 < 268435455) {
  i2 = i2 >> 2;
  i2 = i2 >>> 0 < i5 >>> 0 ? i5 : i2;
  if (i2 >>> 0 > 536870911) __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i8);
 } else i2 = 536870911;
 i4 = __Znwj(i2 << 3) | 0;
 i5 = i8 + 4 | 0;
 HEAP32[i5 >> 2] = i4;
 HEAP32[i8 >> 2] = i4;
 HEAP32[i7 >> 2] = i4 + (i2 << 3);
 if ((i1 | 0) == (i10 | 0)) return;
 i3 = (i10 + -8 - i9 | 0) >>> 3;
 i2 = i4;
 while (1) {
  HEAPF64[i2 >> 3] = +HEAPF64[i1 >> 3];
  i1 = i1 + 8 | 0;
  if ((i1 | 0) == (i10 | 0)) break; else i2 = i2 + 8 | 0;
 }
 HEAP32[i5 >> 2] = i4 + (i3 + 1 << 3);
 return;
}

function __ZN6LIBSVM5SVC_QC2ERKNS_11svm_problemERKNS_13svm_parameterEPKa(i10, i9, i4, i5) {
 i10 = i10 | 0;
 i9 = i9 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 var i1 = 0, i2 = 0, d3 = 0.0, i6 = 0, i7 = 0, i8 = 0;
 __ZN6LIBSVM6KernelC2EiPKPNS_8svm_nodeERKNS_13svm_parameterE(i10, HEAP32[i9 >> 2] | 0, HEAP32[i9 + 8 >> 2] | 0, i4);
 HEAP32[i10 >> 2] = 2072;
 i6 = HEAP32[i9 >> 2] | 0;
 __THREW__ = 0;
 i2 = invoke_ii(19, ((i6 | 0) > -1 ? i6 : -1) | 0) | 0;
 i8 = __THREW__;
 __THREW__ = 0;
 do if ((!(i8 & 1) ? (HEAP32[i10 + 48 >> 2] = i2, _memcpy(i2 | 0, i5 | 0, i6 | 0) | 0, __THREW__ = 0, i1 = invoke_ii(12, 28) | 0, i8 = __THREW__, __THREW__ = 0, !(i8 & 1)) : 0) ? (i8 = ~~(+HEAPF64[i4 + 32 >> 3] * 1048576.0), HEAP32[i1 >> 2] = i6, i7 = _calloc(i6, 16) | 0, HEAP32[i1 + 8 >> 2] = i7, i8 = (i8 >>> 2) - (i6 << 2 & 1073741820) | 0, i7 = i6 << 1, HEAP32[i1 + 4 >> 2] = (i8 | 0) > (i7 | 0) ? i8 : i7, i7 = i1 + 12 | 0, HEAP32[i7 >> 2] = i7, HEAP32[i1 + 16 >> 2] = i7, HEAP32[i10 + 52 >> 2] = i1, __THREW__ = 0, i7 = invoke_ii(19, (i6 >>> 0 > 536870911 ? -1 : i6 << 3) | 0) | 0, i8 = __THREW__, __THREW__ = 0, !(i8 & 1)) : 0) {
  i8 = i10 + 56 | 0;
  HEAP32[i8 >> 2] = i7;
  if ((i6 | 0) <= 0) return;
  i4 = i10 + 4 | 0;
  i5 = 0;
  while (1) {
   i1 = HEAP32[i4 >> 2] | 0;
   i7 = HEAP32[i4 + 4 >> 2] | 0;
   i2 = i10 + (i7 >> 1) | 0;
   if (i7 & 1) i1 = HEAP32[(HEAP32[i2 >> 2] | 0) + i1 >> 2] | 0;
   __THREW__ = 0;
   d3 = +invoke_diii(i1 | 0, i2 | 0, i5 | 0, i5 | 0);
   i7 = __THREW__;
   __THREW__ = 0;
   if (i7 & 1) {
    i1 = 12;
    break;
   }
   HEAPF64[(HEAP32[i8 >> 2] | 0) + (i5 << 3) >> 3] = d3;
   i5 = i5 + 1 | 0;
   if ((i5 | 0) >= (HEAP32[i9 >> 2] | 0)) {
    i1 = 11;
    break;
   }
  }
  if ((i1 | 0) == 11) return; else if ((i1 | 0) == 12) {
   i2 = ___cxa_find_matching_catch() | 0;
   break;
  }
 } else i1 = 13; while (0);
 if ((i1 | 0) == 13) i2 = ___cxa_find_matching_catch() | 0;
 HEAP32[i10 >> 2] = 1928;
 i1 = HEAP32[i10 + 12 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i10 + 16 >> 2] | 0;
 if (!i1) ___resumeException(i2 | 0);
 __ZdaPv(i1);
 ___resumeException(i2 | 0);
}

function __ZN6LIBSVM6KernelC2EiPKPNS_8svm_nodeERKNS_13svm_parameterE(i5, i9, i4, i1) {
 i5 = i5 | 0;
 i9 = i9 | 0;
 i4 = i4 | 0;
 i1 = i1 | 0;
 var d2 = 0.0, i3 = 0, i6 = 0, i7 = 0, i8 = 0;
 HEAP32[i5 >> 2] = 1928;
 i3 = HEAP32[i1 + 4 >> 2] | 0;
 HEAP32[i5 + 20 >> 2] = i3;
 HEAP32[i5 + 24 >> 2] = HEAP32[i1 + 8 >> 2];
 HEAPF64[i5 + 32 >> 3] = +HEAPF64[i1 + 16 >> 3];
 HEAPF64[i5 + 40 >> 3] = +HEAPF64[i1 + 24 >> 3];
 switch (i3 | 0) {
 case 0:
  {
   i8 = i5 + 4 | 0;
   HEAP32[i8 >> 2] = 4;
   HEAP32[i8 + 4 >> 2] = 0;
   break;
  }
 case 1:
  {
   i8 = i5 + 4 | 0;
   HEAP32[i8 >> 2] = 5;
   HEAP32[i8 + 4 >> 2] = 0;
   break;
  }
 case 2:
  {
   i8 = i5 + 4 | 0;
   HEAP32[i8 >> 2] = 6;
   HEAP32[i8 + 4 >> 2] = 0;
   break;
  }
 case 3:
  {
   i8 = i5 + 4 | 0;
   HEAP32[i8 >> 2] = 7;
   HEAP32[i8 + 4 >> 2] = 0;
   break;
  }
 case 4:
  {
   i8 = i5 + 4 | 0;
   HEAP32[i8 >> 2] = 8;
   HEAP32[i8 + 4 >> 2] = 0;
   break;
  }
 default:
  {}
 }
 i8 = __Znaj(i9 >>> 0 > 1073741823 ? -1 : i9 << 2) | 0;
 HEAP32[i5 + 12 >> 2] = i8;
 _memcpy(i8 | 0, i4 | 0, i9 << 2 | 0) | 0;
 if ((i3 | 0) != 2) {
  HEAP32[i5 + 16 >> 2] = 0;
  return;
 }
 i7 = __Znaj(i9 >>> 0 > 536870911 ? -1 : i9 << 3) | 0;
 HEAP32[i5 + 16 >> 2] = i7;
 if ((i9 | 0) > 0) i6 = 0; else return;
 do {
  i1 = HEAP32[i8 + (i6 << 2) >> 2] | 0;
  i3 = HEAP32[i1 >> 2] | 0;
  L16 : do if ((i3 | 0) == -1) d2 = 0.0; else {
   i4 = i1;
   d2 = 0.0;
   while (1) {
    L19 : while (1) {
     i5 = HEAP32[i4 >> 2] | 0;
     if ((i5 | 0) == -1) break L16;
     while (1) {
      if ((i3 | 0) == (i5 | 0)) break L19;
      if ((i3 | 0) <= (i5 | 0)) break;
      i4 = i4 + 16 | 0;
      i5 = HEAP32[i4 >> 2] | 0;
      if ((i5 | 0) == -1) break L16;
     }
     i1 = i1 + 16 | 0;
     i3 = HEAP32[i1 >> 2] | 0;
     if ((i3 | 0) == -1) break L16;
    }
    d2 = d2 + +HEAPF64[i1 + 8 >> 3] * +HEAPF64[i4 + 8 >> 3];
    i1 = i1 + 16 | 0;
    i3 = HEAP32[i1 >> 2] | 0;
    if ((i3 | 0) == -1) break; else i4 = i4 + 16 | 0;
   }
  } while (0);
  HEAPF64[i7 + (i6 << 3) >> 3] = d2;
  i6 = i6 + 1 | 0;
 } while ((i6 | 0) != (i9 | 0));
 return;
}

function ___stdio_write(i14, i2, i1) {
 i14 = i14 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i12 = 0, i13 = 0, i15 = 0;
 i15 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i11 = i15 + 16 | 0;
 i10 = i15;
 i3 = i15 + 32 | 0;
 i12 = i14 + 28 | 0;
 i4 = HEAP32[i12 >> 2] | 0;
 HEAP32[i3 >> 2] = i4;
 i13 = i14 + 20 | 0;
 i4 = (HEAP32[i13 >> 2] | 0) - i4 | 0;
 HEAP32[i3 + 4 >> 2] = i4;
 HEAP32[i3 + 8 >> 2] = i2;
 HEAP32[i3 + 12 >> 2] = i1;
 i8 = i14 + 60 | 0;
 i9 = i14 + 44 | 0;
 i2 = 2;
 i4 = i4 + i1 | 0;
 while (1) {
  if (!(HEAP32[608] | 0)) {
   HEAP32[i11 >> 2] = HEAP32[i8 >> 2];
   HEAP32[i11 + 4 >> 2] = i3;
   HEAP32[i11 + 8 >> 2] = i2;
   i6 = ___syscall_ret(___syscall146(146, i11 | 0) | 0) | 0;
  } else {
   _pthread_cleanup_push(59, i14 | 0);
   HEAP32[i10 >> 2] = HEAP32[i8 >> 2];
   HEAP32[i10 + 4 >> 2] = i3;
   HEAP32[i10 + 8 >> 2] = i2;
   i6 = ___syscall_ret(___syscall146(146, i10 | 0) | 0) | 0;
   _pthread_cleanup_pop(0);
  }
  if ((i4 | 0) == (i6 | 0)) {
   i4 = 6;
   break;
  }
  if ((i6 | 0) < 0) {
   i4 = 8;
   break;
  }
  i4 = i4 - i6 | 0;
  i5 = HEAP32[i3 + 4 >> 2] | 0;
  if (i6 >>> 0 <= i5 >>> 0) if ((i2 | 0) == 2) {
   HEAP32[i12 >> 2] = (HEAP32[i12 >> 2] | 0) + i6;
   i7 = i5;
   i2 = 2;
  } else i7 = i5; else {
   i7 = HEAP32[i9 >> 2] | 0;
   HEAP32[i12 >> 2] = i7;
   HEAP32[i13 >> 2] = i7;
   i7 = HEAP32[i3 + 12 >> 2] | 0;
   i6 = i6 - i5 | 0;
   i3 = i3 + 8 | 0;
   i2 = i2 + -1 | 0;
  }
  HEAP32[i3 >> 2] = (HEAP32[i3 >> 2] | 0) + i6;
  HEAP32[i3 + 4 >> 2] = i7 - i6;
 }
 if ((i4 | 0) == 6) {
  i11 = HEAP32[i9 >> 2] | 0;
  HEAP32[i14 + 16 >> 2] = i11 + (HEAP32[i14 + 48 >> 2] | 0);
  i14 = i11;
  HEAP32[i12 >> 2] = i14;
  HEAP32[i13 >> 2] = i14;
 } else if ((i4 | 0) == 8) {
  HEAP32[i14 + 16 >> 2] = 0;
  HEAP32[i12 >> 2] = 0;
  HEAP32[i13 >> 2] = 0;
  HEAP32[i14 >> 2] = HEAP32[i14 >> 2] | 32;
  if ((i2 | 0) == 2) i1 = 0; else i1 = i1 - (HEAP32[i3 + 4 >> 2] | 0) | 0;
 }
 STACKTOP = i15;
 return i1 | 0;
}

function __ZNSt3__16vectorINS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEENS4_IS6_EEE21__push_back_slow_pathIS6_EEvOT_(i9, i7) {
 i9 = i9 | 0;
 i7 = i7 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i8 = 0, i10 = 0, i11 = 0;
 i10 = i9 + 4 | 0;
 i1 = HEAP32[i9 >> 2] | 0;
 i3 = (((HEAP32[i10 >> 2] | 0) - i1 | 0) / 12 | 0) + 1 | 0;
 if (i3 >>> 0 > 357913941) {
  __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i9);
  i1 = HEAP32[i9 >> 2] | 0;
 }
 i11 = i9 + 8 | 0;
 i2 = ((HEAP32[i11 >> 2] | 0) - i1 | 0) / 12 | 0;
 if (i2 >>> 0 < 178956970) {
  i2 = i2 << 1;
  i2 = i2 >>> 0 < i3 >>> 0 ? i3 : i2;
  i1 = ((HEAP32[i10 >> 2] | 0) - i1 | 0) / 12 | 0;
  if (!i2) {
   i4 = 0;
   i5 = 0;
  } else i6 = 6;
 } else {
  i2 = 357913941;
  i1 = ((HEAP32[i10 >> 2] | 0) - i1 | 0) / 12 | 0;
  i6 = 6;
 }
 if ((i6 | 0) == 6) {
  i4 = i2;
  i5 = __Znwj(i2 * 12 | 0) | 0;
 }
 i3 = i5 + (i1 * 12 | 0) | 0;
 i2 = i3;
 i8 = i5 + (i4 * 12 | 0) | 0;
 HEAP32[i3 >> 2] = HEAP32[i7 >> 2];
 HEAP32[i3 + 4 >> 2] = HEAP32[i7 + 4 >> 2];
 HEAP32[i3 + 8 >> 2] = HEAP32[i7 + 8 >> 2];
 HEAP32[i7 >> 2] = 0;
 HEAP32[i7 + 4 >> 2] = 0;
 HEAP32[i7 + 8 >> 2] = 0;
 i7 = i5 + ((i1 + 1 | 0) * 12 | 0) | 0;
 i6 = HEAP32[i9 >> 2] | 0;
 i1 = HEAP32[i10 >> 2] | 0;
 if ((i1 | 0) == (i6 | 0)) {
  i4 = i9;
  i5 = i10;
  i3 = i6;
 } else {
  do {
   i5 = i3 + -12 | 0;
   i1 = i1 + -12 | 0;
   HEAP32[i5 >> 2] = HEAP32[i1 >> 2];
   HEAP32[i5 + 4 >> 2] = HEAP32[i1 + 4 >> 2];
   HEAP32[i5 + 8 >> 2] = HEAP32[i1 + 8 >> 2];
   HEAP32[i1 >> 2] = 0;
   HEAP32[i1 + 4 >> 2] = 0;
   HEAP32[i1 + 8 >> 2] = 0;
   i3 = i2 + -12 | 0;
   i2 = i3;
  } while ((i1 | 0) != (i6 | 0));
  i1 = i2;
  i4 = i9;
  i5 = i10;
  i2 = i1;
  i3 = HEAP32[i9 >> 2] | 0;
  i1 = HEAP32[i10 >> 2] | 0;
 }
 HEAP32[i4 >> 2] = i2;
 HEAP32[i5 >> 2] = i7;
 HEAP32[i11 >> 2] = i8;
 i2 = i3;
 if ((i1 | 0) != (i2 | 0)) do {
  i1 = i1 + -12 | 0;
  __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i1);
 } while ((i1 | 0) != (i2 | 0));
 if (!i3) return;
 __ZdlPv(i3);
 return;
}

function __ZN8modelSet3runERKNSt3__16vectorIdNS0_9allocatorIdEEEE(i9, i1, i7) {
 i9 = i9 | 0;
 i1 = i1 | 0;
 i7 = i7 | 0;
 var i2 = 0, i3 = 0, d4 = 0.0, i5 = 0, i6 = 0, i8 = 0, i10 = 0;
 i8 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i6 = i8 + 8 | 0;
 i2 = i8;
 HEAP32[i9 >> 2] = 0;
 i10 = i9 + 4 | 0;
 HEAP32[i10 >> 2] = 0;
 HEAP32[i9 + 8 >> 2] = 0;
 do if ((HEAP8[i1 + 36 >> 0] | 0) != 0 ? ((HEAP32[i7 + 4 >> 2] | 0) - (HEAP32[i7 >> 2] | 0) >> 3 | 0) == (HEAP32[i1 + 16 >> 2] | 0) : 0) {
  i2 = HEAP32[i1 + 4 >> 2] | 0;
  i3 = HEAP32[i1 + 8 >> 2] | 0;
  if ((i2 | 0) == (i3 | 0)) {
   STACKTOP = i8;
   return;
  }
  i5 = i9 + 8 | 0;
  while (1) {
   i1 = HEAP32[i2 >> 2] | 0;
   __THREW__ = 0;
   d4 = +invoke_dii(HEAP32[(HEAP32[i1 >> 2] | 0) + 8 >> 2] | 0, i1 | 0, i7 | 0);
   i1 = __THREW__;
   __THREW__ = 0;
   if (i1 & 1) {
    i1 = 10;
    break;
   }
   HEAPF64[i6 >> 3] = d4;
   i1 = HEAP32[i10 >> 2] | 0;
   if (i1 >>> 0 >= (HEAP32[i5 >> 2] | 0) >>> 0) {
    __THREW__ = 0;
    invoke_vii(7, i9 | 0, i6 | 0);
    i1 = __THREW__;
    __THREW__ = 0;
    if (i1 & 1) {
     i1 = 10;
     break;
    }
   } else {
    HEAPF64[i1 >> 3] = d4;
    HEAP32[i10 >> 2] = i1 + 8;
   }
   i2 = i2 + 4 | 0;
   if ((i2 | 0) == (i3 | 0)) {
    i1 = 18;
    break;
   }
  }
  if ((i1 | 0) == 10) {
   i3 = ___cxa_find_matching_catch() | 0;
   break;
  } else if ((i1 | 0) == 18) {
   STACKTOP = i8;
   return;
  }
 } else i1 = 17; while (0);
 do if ((i1 | 0) == 17) {
  HEAPF64[i2 >> 3] = 0.0;
  __THREW__ = 0;
  invoke_vii(7, i9 | 0, i2 | 0);
  i7 = __THREW__;
  __THREW__ = 0;
  if (i7 & 1) {
   i3 = ___cxa_find_matching_catch() | 0;
   break;
  } else {
   STACKTOP = i8;
   return;
  }
 } while (0);
 i1 = HEAP32[i9 >> 2] | 0;
 if (!i1) ___resumeException(i3 | 0);
 i2 = HEAP32[i10 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) HEAP32[i10 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
 __ZdlPv(i1);
 ___resumeException(i3 | 0);
}

function __ZNSt3__19to_stringEi(i8, i6) {
 i8 = i8 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i7 = 0, i9 = 0, i10 = 0;
 i9 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i7 = i9;
 i10 = i9 + 4 | 0;
 HEAP32[i10 >> 2] = 0;
 HEAP32[i10 + 4 >> 2] = 0;
 HEAP32[i10 + 8 >> 2] = 0;
 if (!(HEAP8[i10 >> 0] & 1)) i1 = 10; else i1 = (HEAP32[i10 >> 2] & -2) + -1 | 0;
 __THREW__ = 0;
 invoke_viii(20, i10 | 0, i1 | 0, 0);
 i5 = __THREW__;
 __THREW__ = 0;
 if (i5 & 1) {
  i9 = ___cxa_find_matching_catch() | 0;
  __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i10);
  ___resumeException(i9 | 0);
 }
 i3 = HEAP8[i10 >> 0] | 0;
 i4 = i10 + 1 | 0;
 i5 = i10 + 8 | 0;
 i2 = i3;
 i3 = (i3 & 1) == 0 ? (i3 & 255) >>> 1 : HEAP32[i10 + 4 >> 2] | 0;
 while (1) {
  i1 = (i2 & 1) == 0 ? i4 : HEAP32[i5 >> 2] | 0;
  HEAP32[i7 >> 2] = i6;
  i1 = _snprintf(i1, i3 + 1 | 0, 11862, i7) | 0;
  if ((i1 | 0) > -1) {
   if (i1 >>> 0 <= i3 >>> 0) {
    i2 = 8;
    break;
   }
  } else i1 = i3 << 1 | 1;
  __THREW__ = 0;
  invoke_viii(20, i10 | 0, i1 | 0, 0);
  i3 = __THREW__;
  __THREW__ = 0;
  if (i3 & 1) {
   i2 = 13;
   break;
  }
  i2 = HEAP8[i10 >> 0] | 0;
  i3 = i1;
 }
 do if ((i2 | 0) == 8) {
  __THREW__ = 0;
  invoke_viii(20, i10 | 0, i1 | 0, 0);
  i7 = __THREW__;
  __THREW__ = 0;
  if (i7 & 1) {
   i1 = ___cxa_find_matching_catch() | 0;
   break;
  } else {
   HEAP32[i8 >> 2] = HEAP32[i10 >> 2];
   HEAP32[i8 + 4 >> 2] = HEAP32[i10 + 4 >> 2];
   HEAP32[i8 + 8 >> 2] = HEAP32[i10 + 8 >> 2];
   HEAP32[i10 >> 2] = 0;
   HEAP32[i10 + 4 >> 2] = 0;
   HEAP32[i10 + 8 >> 2] = 0;
   __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i10);
   STACKTOP = i9;
   return;
  }
 } else if ((i2 | 0) == 13) i1 = ___cxa_find_matching_catch() | 0; while (0);
 __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i10);
 ___resumeException(i1 | 0);
}

function __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEEC2ERKS5_(i8, i3) {
 i8 = i8 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0;
 HEAP32[i8 >> 2] = 0;
 i7 = i8 + 4 | 0;
 HEAP32[i7 >> 2] = 0;
 HEAP32[i8 + 8 >> 2] = 0;
 i5 = i3 + 4 | 0;
 i4 = HEAP32[i5 >> 2] | 0;
 i6 = HEAP32[i3 >> 2] | 0;
 i1 = i4 - i6 | 0;
 i2 = (i1 | 0) / 12 | 0;
 if ((i4 | 0) == (i6 | 0)) return;
 if (i2 >>> 0 > 357913941 ? (__THREW__ = 0, invoke_vi(40, i8 | 0), i6 = __THREW__, __THREW__ = 0, i6 & 1) : 0) i4 = 10; else i4 = 4;
 do if ((i4 | 0) == 4) {
  __THREW__ = 0;
  i1 = invoke_ii(12, i1 | 0) | 0;
  i6 = __THREW__;
  __THREW__ = 0;
  if (!(i6 & 1)) {
   HEAP32[i7 >> 2] = i1;
   HEAP32[i8 >> 2] = i1;
   HEAP32[i8 + 8 >> 2] = i1 + (i2 * 12 | 0);
   i2 = HEAP32[i3 >> 2] | 0;
   i3 = HEAP32[i5 >> 2] | 0;
   if ((i2 | 0) == (i3 | 0)) return;
   while (1) {
    __THREW__ = 0;
    invoke_vii(8, i1 | 0, i2 | 0);
    i6 = __THREW__;
    __THREW__ = 0;
    if (i6 & 1) {
     i4 = 9;
     break;
    }
    i1 = (HEAP32[i7 >> 2] | 0) + 12 | 0;
    HEAP32[i7 >> 2] = i1;
    i2 = i2 + 12 | 0;
    if ((i2 | 0) == (i3 | 0)) {
     i4 = 21;
     break;
    }
   }
   if ((i4 | 0) == 9) {
    i6 = ___cxa_find_matching_catch() | 0;
    break;
   } else if ((i4 | 0) == 21) return;
  } else i4 = 10;
 } while (0);
 if ((i4 | 0) == 10) i6 = ___cxa_find_matching_catch() | 0;
 i1 = HEAP32[i8 >> 2] | 0;
 if (!i1) ___resumeException(i6 | 0);
 i2 = HEAP32[i7 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) {
  do {
   i3 = i2 + -12 | 0;
   HEAP32[i7 >> 2] = i3;
   i4 = HEAP32[i3 >> 2] | 0;
   i5 = i4;
   if (!i4) i2 = i3; else {
    i2 = i2 + -8 | 0;
    i3 = HEAP32[i2 >> 2] | 0;
    if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
    __ZdlPv(i4);
    i2 = HEAP32[i7 >> 2] | 0;
   }
  } while ((i2 | 0) != (i1 | 0));
  i1 = HEAP32[i8 >> 2] | 0;
 }
 __ZdlPv(i1);
 ___resumeException(i6 | 0);
}

function __ZN41EmscriptenBindingInitializer_stl_wrappersC2Ev(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 __ZN10emscripten15register_vectorIiEENS_6class_INSt3__16vectorIT_NS2_9allocatorIS4_EEEENS_8internal11NoBaseClassEEEPKc(i2 + 2 | 0, 3881);
 __ZN10emscripten15register_vectorIdEENS_6class_INSt3__16vectorIT_NS2_9allocatorIS4_EEEENS_8internal11NoBaseClassEEEPKc(i2 + 1 | 0, 3891);
 __ZN10emscripten15register_vectorI15trainingExampleEENS_6class_INSt3__16vectorIT_NS3_9allocatorIS5_EEEENS_8internal11NoBaseClassEEEPKc(i2, 3904);
 __embind_register_value_object(320, 3916, 3932, 3, 3374, 44);
 __THREW__ = 0;
 i1 = invoke_ii(12, 4) | 0;
 i6 = __THREW__;
 __THREW__ = 0;
 if (((((!(i6 & 1) ? (HEAP32[i1 >> 2] = 0, __THREW__ = 0, i5 = invoke_ii(12, 4) | 0, i6 = __THREW__, __THREW__ = 0, !(i6 & 1)) : 0) ? (HEAP32[i5 >> 2] = 0, __THREW__ = 0, invoke_viiiiiiiiii(1, 320, 3934, 128, 3535, 7, i1 | 0, 128, 3674, 8, i5 | 0), i6 = __THREW__, __THREW__ = 0, !(i6 & 1)) : 0) ? (__THREW__ = 0, i3 = invoke_ii(12, 4) | 0, i6 = __THREW__, __THREW__ = 0, !(i6 & 1)) : 0) ? (HEAP32[i3 >> 2] = 12, __THREW__ = 0, i4 = invoke_ii(12, 4) | 0, i6 = __THREW__, __THREW__ = 0, !(i6 & 1)) : 0) ? (HEAP32[i4 >> 2] = 12, __THREW__ = 0, invoke_viiiiiiiiii(1, 320, 3940, 128, 3535, 7, i3 | 0, 128, 3674, 8, i4 | 0), i6 = __THREW__, __THREW__ = 0, !(i6 & 1)) : 0) {
  __THREW__ = 0;
  invoke_vi(45, 320);
  i6 = __THREW__;
  __THREW__ = 0;
  if (i6 & 1) {
   i6 = ___cxa_find_matching_catch(0) | 0;
   ___clang_call_terminate(i6);
  } else {
   STACKTOP = i2;
   return;
  }
 }
 i1 = ___cxa_find_matching_catch() | 0;
 __THREW__ = 0;
 invoke_vi(45, 320);
 i6 = __THREW__;
 __THREW__ = 0;
 if (i6 & 1) {
  i6 = ___cxa_find_matching_catch(0) | 0;
  ___clang_call_terminate(i6);
 } else ___resumeException(i1 | 0);
}

function __ZN6LIBSVM11ONE_CLASS_QC2ERKNS_11svm_problemERKNS_13svm_parameterE(i8, i7, i2) {
 i8 = i8 | 0;
 i7 = i7 | 0;
 i2 = i2 | 0;
 var i1 = 0, d3 = 0.0, i4 = 0, i5 = 0, i6 = 0, i9 = 0;
 __ZN6LIBSVM6KernelC2EiPKPNS_8svm_nodeERKNS_13svm_parameterE(i8, HEAP32[i7 >> 2] | 0, HEAP32[i7 + 8 >> 2] | 0, i2);
 HEAP32[i8 >> 2] = 2044;
 __THREW__ = 0;
 i1 = invoke_ii(12, 28) | 0;
 i6 = __THREW__;
 __THREW__ = 0;
 do if (!(i6 & 1) ? (i5 = HEAP32[i7 >> 2] | 0, i6 = ~~(+HEAPF64[i2 + 32 >> 3] * 1048576.0), HEAP32[i1 >> 2] = i5, i4 = _calloc(i5, 16) | 0, HEAP32[i1 + 8 >> 2] = i4, i6 = (i6 >>> 2) - (i5 << 2 & 1073741820) | 0, i4 = i5 << 1, HEAP32[i1 + 4 >> 2] = (i6 | 0) > (i4 | 0) ? i6 : i4, i4 = i1 + 12 | 0, HEAP32[i4 >> 2] = i4, HEAP32[i1 + 16 >> 2] = i4, HEAP32[i8 + 48 >> 2] = i1, __THREW__ = 0, i4 = invoke_ii(19, (i5 >>> 0 > 536870911 ? -1 : i5 << 3) | 0) | 0, i6 = __THREW__, __THREW__ = 0, !(i6 & 1)) : 0) {
  i6 = i8 + 52 | 0;
  HEAP32[i6 >> 2] = i4;
  if ((i5 | 0) <= 0) return;
  i4 = i8 + 4 | 0;
  i5 = 0;
  while (1) {
   i1 = HEAP32[i4 >> 2] | 0;
   i9 = HEAP32[i4 + 4 >> 2] | 0;
   i2 = i8 + (i9 >> 1) | 0;
   if (i9 & 1) i1 = HEAP32[(HEAP32[i2 >> 2] | 0) + i1 >> 2] | 0;
   __THREW__ = 0;
   d3 = +invoke_diii(i1 | 0, i2 | 0, i5 | 0, i5 | 0);
   i9 = __THREW__;
   __THREW__ = 0;
   if (i9 & 1) {
    i1 = 11;
    break;
   }
   HEAPF64[(HEAP32[i6 >> 2] | 0) + (i5 << 3) >> 3] = d3;
   i5 = i5 + 1 | 0;
   if ((i5 | 0) >= (HEAP32[i7 >> 2] | 0)) {
    i1 = 10;
    break;
   }
  }
  if ((i1 | 0) == 10) return; else if ((i1 | 0) == 11) {
   i2 = ___cxa_find_matching_catch() | 0;
   break;
  }
 } else i1 = 12; while (0);
 if ((i1 | 0) == 12) i2 = ___cxa_find_matching_catch() | 0;
 HEAP32[i8 >> 2] = 1928;
 i1 = HEAP32[i8 + 12 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i8 + 16 >> 2] | 0;
 if (!i1) ___resumeException(i2 | 0);
 __ZdaPv(i1);
 ___resumeException(i2 | 0);
}

function __ZN6LIBSVM5Cache8get_dataEiPPfi(i10, i8, i7, i9) {
 i10 = i10 | 0;
 i8 = i8 | 0;
 i7 = i7 | 0;
 i9 = i9 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i11 = 0, i12 = 0, i13 = 0;
 i4 = HEAP32[i10 + 8 >> 2] | 0;
 i5 = i4 + (i8 << 4) | 0;
 i6 = i4 + (i8 << 4) + 12 | 0;
 i1 = HEAP32[i6 >> 2] | 0;
 if (i1) {
  i3 = i4 + (i8 << 4) + 4 | 0;
  i2 = HEAP32[i5 >> 2] | 0;
  HEAP32[i2 + 4 >> 2] = HEAP32[i3 >> 2];
  HEAP32[HEAP32[i3 >> 2] >> 2] = i2;
 }
 i1 = i9 - i1 | 0;
 if ((i1 | 0) <= 0) {
  i6 = HEAP32[i4 + (i8 << 4) + 8 >> 2] | 0;
  i3 = i10 + 12 | 0;
  i10 = i4 + (i8 << 4) + 4 | 0;
  HEAP32[i10 >> 2] = i3;
  i8 = HEAP32[i3 >> 2] | 0;
  HEAP32[i5 >> 2] = i8;
  i8 = i8 + 4 | 0;
  HEAP32[i8 >> 2] = i5;
  i10 = HEAP32[i10 >> 2] | 0;
  HEAP32[i10 >> 2] = i5;
  HEAP32[i7 >> 2] = i6;
  return i9 | 0;
 }
 i2 = i10 + 4 | 0;
 if ((HEAP32[i2 >> 2] | 0) < (i1 | 0)) {
  i3 = i10 + 16 | 0;
  do {
   i12 = HEAP32[i3 >> 2] | 0;
   i13 = i12 + 4 | 0;
   i11 = HEAP32[i12 >> 2] | 0;
   HEAP32[i11 + 4 >> 2] = HEAP32[i13 >> 2];
   HEAP32[HEAP32[i13 >> 2] >> 2] = i11;
   i13 = i12 + 8 | 0;
   _free(HEAP32[i13 >> 2] | 0);
   i12 = i12 + 12 | 0;
   i11 = (HEAP32[i2 >> 2] | 0) + (HEAP32[i12 >> 2] | 0) | 0;
   HEAP32[i2 >> 2] = i11;
   HEAP32[i13 >> 2] = 0;
   HEAP32[i12 >> 2] = 0;
  } while ((i11 | 0) < (i1 | 0));
 }
 i13 = i4 + (i8 << 4) + 8 | 0;
 i12 = _realloc(HEAP32[i13 >> 2] | 0, i9 << 2) | 0;
 HEAP32[i13 >> 2] = i12;
 HEAP32[i2 >> 2] = (HEAP32[i2 >> 2] | 0) - i1;
 i13 = HEAP32[i6 >> 2] | 0;
 HEAP32[i6 >> 2] = i9;
 i10 = i10 + 12 | 0;
 i11 = i4 + (i8 << 4) + 4 | 0;
 HEAP32[i11 >> 2] = i10;
 i10 = HEAP32[i10 >> 2] | 0;
 HEAP32[i5 >> 2] = i10;
 i10 = i10 + 4 | 0;
 HEAP32[i10 >> 2] = i5;
 i11 = HEAP32[i11 >> 2] | 0;
 HEAP32[i11 >> 2] = i5;
 HEAP32[i7 >> 2] = i12;
 return i13 | 0;
}

function __ZN53EmscriptenBindingInitializer_native_and_builtin_typesC2Ev(i1) {
 i1 = i1 | 0;
 __embind_register_void(1080, 5974);
 __embind_register_bool(1096, 5979, 1, 1, 0);
 __embind_register_integer(1104, 5984, 1, -128, 127);
 __embind_register_integer(1120, 5989, 1, -128, 127);
 __embind_register_integer(1112, 6001, 1, 0, 255);
 __embind_register_integer(1128, 6015, 2, -32768, 32767);
 __embind_register_integer(1136, 6021, 2, 0, 65535);
 __embind_register_integer(1144, 6036, 4, -2147483648, 2147483647);
 __embind_register_integer(1152, 6040, 4, 0, -1);
 __embind_register_integer(1160, 6053, 4, -2147483648, 2147483647);
 __embind_register_integer(1168, 6058, 4, 0, -1);
 __embind_register_float(1176, 6072, 4);
 __embind_register_float(1184, 6078, 8);
 __embind_register_std_string(792, 6085);
 __embind_register_std_string(816, 6097);
 __embind_register_std_wstring(840, 4, 6130);
 __embind_register_emval(392, 6143);
 __embind_register_memory_view(864, 0, 6159);
 __embind_register_memory_view(872, 0, 6189);
 __embind_register_memory_view(880, 1, 6226);
 __embind_register_memory_view(888, 2, 6265);
 __embind_register_memory_view(896, 3, 6296);
 __embind_register_memory_view(904, 4, 6336);
 __embind_register_memory_view(912, 5, 6365);
 __embind_register_memory_view(920, 4, 6403);
 __embind_register_memory_view(928, 5, 6433);
 __embind_register_memory_view(872, 0, 6472);
 __embind_register_memory_view(880, 1, 6504);
 __embind_register_memory_view(888, 2, 6537);
 __embind_register_memory_view(896, 3, 6570);
 __embind_register_memory_view(904, 4, 6604);
 __embind_register_memory_view(912, 5, 6637);
 __embind_register_memory_view(936, 6, 6671);
 __embind_register_memory_view(944, 7, 6702);
 __embind_register_memory_view(952, 7, 6734);
 return;
}

function __ZN6LIBSVM9Solver_NU13calculate_rhoEv(i16) {
 i16 = i16 | 0;
 var d1 = 0.0, d2 = 0.0, d3 = 0.0, d4 = 0.0, i5 = 0, i6 = 0, d7 = 0.0, i8 = 0, i9 = 0, d10 = 0.0, i11 = 0, i12 = 0, i13 = 0, i14 = 0, i15 = 0, d17 = 0.0;
 i11 = HEAP32[i16 + 4 >> 2] | 0;
 if ((i11 | 0) > 0) {
  i12 = HEAP32[i16 + 8 >> 2] | 0;
  i13 = HEAP32[i16 + 16 >> 2] | 0;
  i14 = i16 + 12 | 0;
  i15 = 0;
  d10 = -inf;
  d7 = -inf;
  i6 = 0;
  i5 = 0;
  d4 = 0.0;
  d3 = 0.0;
  d2 = inf;
  d1 = inf;
  do {
   i8 = HEAP8[i13 + i15 >> 0] | 0;
   i9 = i8 << 24 >> 24 == 1;
   do if ((HEAP8[i12 + i15 >> 0] | 0) == 1) {
    if (i9) {
     d17 = +HEAPF64[(HEAP32[i14 >> 2] | 0) + (i15 << 3) >> 3];
     d10 = d10 > d17 ? d10 : d17;
     break;
    }
    if (!(i8 << 24 >> 24)) {
     d17 = +HEAPF64[(HEAP32[i14 >> 2] | 0) + (i15 << 3) >> 3];
     d2 = d2 < d17 ? d2 : d17;
     break;
    } else {
     i6 = i6 + 1 | 0;
     d4 = d4 + +HEAPF64[(HEAP32[i14 >> 2] | 0) + (i15 << 3) >> 3];
     break;
    }
   } else {
    if (i9) {
     d17 = +HEAPF64[(HEAP32[i14 >> 2] | 0) + (i15 << 3) >> 3];
     d7 = d7 > d17 ? d7 : d17;
     break;
    }
    if (!(i8 << 24 >> 24)) {
     d17 = +HEAPF64[(HEAP32[i14 >> 2] | 0) + (i15 << 3) >> 3];
     d1 = d1 < d17 ? d1 : d17;
     break;
    } else {
     i5 = i5 + 1 | 0;
     d3 = d3 + +HEAPF64[(HEAP32[i14 >> 2] | 0) + (i15 << 3) >> 3];
     break;
    }
   } while (0);
   i15 = i15 + 1 | 0;
  } while ((i15 | 0) < (i11 | 0));
 } else {
  d10 = -inf;
  d7 = -inf;
  i6 = 0;
  i5 = 0;
  d4 = 0.0;
  d3 = 0.0;
  d2 = inf;
  d1 = inf;
 }
 d10 = (i6 | 0) > 0 ? d4 / +(i6 | 0) : (d2 + d10) * .5;
 d17 = (i5 | 0) > 0 ? d3 / +(i5 | 0) : (d1 + d7) * .5;
 HEAPF64[(HEAP32[i16 + 76 >> 2] | 0) + 32 >> 3] = (d10 + d17) * .5;
 return +((d10 - d17) * .5);
}

function __ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i3, i7, i6, i2, i4) {
 i3 = i3 | 0;
 i7 = i7 | 0;
 i6 = i6 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i1 = 0, i5 = 0, i8 = 0, i9 = 0;
 L1 : do if ((i3 | 0) == (HEAP32[i7 + 8 >> 2] | 0)) {
  if ((HEAP32[i7 + 4 >> 2] | 0) == (i6 | 0) ? (i1 = i7 + 28 | 0, (HEAP32[i1 >> 2] | 0) != 1) : 0) HEAP32[i1 >> 2] = i2;
 } else {
  if ((i3 | 0) != (HEAP32[i7 >> 2] | 0)) {
   i8 = HEAP32[i3 + 8 >> 2] | 0;
   FUNCTION_TABLE_viiiii[HEAP32[(HEAP32[i8 >> 2] | 0) + 24 >> 2] & 7](i8, i7, i6, i2, i4);
   break;
  }
  if ((HEAP32[i7 + 16 >> 2] | 0) != (i6 | 0) ? (i5 = i7 + 20 | 0, (HEAP32[i5 >> 2] | 0) != (i6 | 0)) : 0) {
   HEAP32[i7 + 32 >> 2] = i2;
   i2 = i7 + 44 | 0;
   if ((HEAP32[i2 >> 2] | 0) == 4) break;
   i1 = i7 + 52 | 0;
   HEAP8[i1 >> 0] = 0;
   i9 = i7 + 53 | 0;
   HEAP8[i9 >> 0] = 0;
   i3 = HEAP32[i3 + 8 >> 2] | 0;
   FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[i3 >> 2] | 0) + 20 >> 2] & 3](i3, i7, i6, i6, 1, i4);
   if (HEAP8[i9 >> 0] | 0) {
    if (!(HEAP8[i1 >> 0] | 0)) {
     i1 = 1;
     i8 = 13;
    }
   } else {
    i1 = 0;
    i8 = 13;
   }
   do if ((i8 | 0) == 13) {
    HEAP32[i5 >> 2] = i6;
    i9 = i7 + 40 | 0;
    HEAP32[i9 >> 2] = (HEAP32[i9 >> 2] | 0) + 1;
    if ((HEAP32[i7 + 36 >> 2] | 0) == 1 ? (HEAP32[i7 + 24 >> 2] | 0) == 2 : 0) {
     HEAP8[i7 + 54 >> 0] = 1;
     if (i1) break;
    } else i8 = 16;
    if ((i8 | 0) == 16 ? i1 : 0) break;
    HEAP32[i2 >> 2] = 4;
    break L1;
   } while (0);
   HEAP32[i2 >> 2] = 3;
   break;
  }
  if ((i2 | 0) == 1) HEAP32[i7 + 32 >> 2] = 1;
 } while (0);
 return;
}

function ___dynamic_cast(i2, i3, i12, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i12 = i12 | 0;
 i1 = i1 | 0;
 var i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i13 = 0, i14 = 0;
 i14 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i13 = i14;
 i11 = HEAP32[i2 >> 2] | 0;
 i10 = i2 + (HEAP32[i11 + -8 >> 2] | 0) | 0;
 i11 = HEAP32[i11 + -4 >> 2] | 0;
 HEAP32[i13 >> 2] = i12;
 HEAP32[i13 + 4 >> 2] = i2;
 HEAP32[i13 + 8 >> 2] = i3;
 HEAP32[i13 + 12 >> 2] = i1;
 i1 = i13 + 16 | 0;
 i2 = i13 + 20 | 0;
 i3 = i13 + 24 | 0;
 i4 = i13 + 28 | 0;
 i5 = i13 + 32 | 0;
 i6 = i13 + 40 | 0;
 i7 = (i11 | 0) == (i12 | 0);
 i8 = i1;
 i9 = i8 + 36 | 0;
 do {
  HEAP32[i8 >> 2] = 0;
  i8 = i8 + 4 | 0;
 } while ((i8 | 0) < (i9 | 0));
 HEAP16[i1 + 36 >> 1] = 0;
 HEAP8[i1 + 38 >> 0] = 0;
 L1 : do if (i7) {
  HEAP32[i13 + 48 >> 2] = 1;
  FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[i12 >> 2] | 0) + 20 >> 2] & 3](i12, i13, i10, i10, 1, 0);
  i1 = (HEAP32[i3 >> 2] | 0) == 1 ? i10 : 0;
 } else {
  FUNCTION_TABLE_viiiii[HEAP32[(HEAP32[i11 >> 2] | 0) + 24 >> 2] & 7](i11, i13, i10, 1, 0);
  switch (HEAP32[i13 + 36 >> 2] | 0) {
  case 0:
   {
    i1 = (HEAP32[i6 >> 2] | 0) == 1 & (HEAP32[i4 >> 2] | 0) == 1 & (HEAP32[i5 >> 2] | 0) == 1 ? HEAP32[i2 >> 2] | 0 : 0;
    break L1;
   }
  case 1:
   break;
  default:
   {
    i1 = 0;
    break L1;
   }
  }
  if ((HEAP32[i3 >> 2] | 0) != 1 ? !((HEAP32[i6 >> 2] | 0) == 0 & (HEAP32[i4 >> 2] | 0) == 1 & (HEAP32[i5 >> 2] | 0) == 1) : 0) {
   i1 = 0;
   break;
  }
  i1 = HEAP32[i1 >> 2] | 0;
 } while (0);
 STACKTOP = i14;
 return i1 | 0;
}

function _vfprintf(i15, i11, i1) {
 i15 = i15 | 0;
 i11 = i11 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i12 = 0, i13 = 0, i14 = 0, i16 = 0;
 i16 = STACKTOP;
 STACKTOP = STACKTOP + 224 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i10 = i16 + 80 | 0;
 i14 = i16 + 96 | 0;
 i13 = i16;
 i12 = i16 + 136 | 0;
 i2 = i14;
 i3 = i2 + 40 | 0;
 do {
  HEAP32[i2 >> 2] = 0;
  i2 = i2 + 4 | 0;
 } while ((i2 | 0) < (i3 | 0));
 HEAP32[i10 >> 2] = HEAP32[i1 >> 2];
 if ((_printf_core(0, i11, i10, i13, i14) | 0) < 0) i1 = -1; else {
  if ((HEAP32[i15 + 76 >> 2] | 0) > -1) i8 = ___lockfile(i15) | 0; else i8 = 0;
  i1 = HEAP32[i15 >> 2] | 0;
  i9 = i1 & 32;
  if ((HEAP8[i15 + 74 >> 0] | 0) < 1) HEAP32[i15 >> 2] = i1 & -33;
  i1 = i15 + 48 | 0;
  if (!(HEAP32[i1 >> 2] | 0)) {
   i3 = i15 + 44 | 0;
   i4 = HEAP32[i3 >> 2] | 0;
   HEAP32[i3 >> 2] = i12;
   i5 = i15 + 28 | 0;
   HEAP32[i5 >> 2] = i12;
   i6 = i15 + 20 | 0;
   HEAP32[i6 >> 2] = i12;
   HEAP32[i1 >> 2] = 80;
   i7 = i15 + 16 | 0;
   HEAP32[i7 >> 2] = i12 + 80;
   i2 = _printf_core(i15, i11, i10, i13, i14) | 0;
   if (i4) {
    FUNCTION_TABLE_iiii[HEAP32[i15 + 36 >> 2] & 31](i15, 0, 0) | 0;
    i2 = (HEAP32[i6 >> 2] | 0) == 0 ? -1 : i2;
    HEAP32[i3 >> 2] = i4;
    HEAP32[i1 >> 2] = 0;
    HEAP32[i7 >> 2] = 0;
    HEAP32[i5 >> 2] = 0;
    HEAP32[i6 >> 2] = 0;
   }
  } else i2 = _printf_core(i15, i11, i10, i13, i14) | 0;
  i1 = HEAP32[i15 >> 2] | 0;
  HEAP32[i15 >> 2] = i1 | i9;
  if (i8) ___unlockfile(i15);
  i1 = (i1 & 32 | 0) == 0 ? i2 : -1;
 }
 STACKTOP = i16;
 return i1 | 0;
}

function __ZNSt3__16vectorIdNS_9allocatorIdEEE8__appendEjRKd(i12, i14, i15) {
 i12 = i12 | 0;
 i14 = i14 | 0;
 i15 = i15 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i13 = 0;
 i11 = i12 + 8 | 0;
 i2 = HEAP32[i11 >> 2] | 0;
 i13 = i12 + 4 | 0;
 i3 = HEAP32[i13 >> 2] | 0;
 i1 = i3;
 if (i2 - i1 >> 3 >>> 0 >= i14 >>> 0) {
  i1 = i14;
  i2 = i3;
  while (1) {
   HEAPF64[i2 >> 3] = +HEAPF64[i15 >> 3];
   i1 = i1 + -1 | 0;
   if (!i1) break; else i2 = i2 + 8 | 0;
  }
  HEAP32[i13 >> 2] = i3 + (i14 << 3);
  return;
 }
 i3 = HEAP32[i12 >> 2] | 0;
 i4 = i3;
 i6 = (i1 - i4 >> 3) + i14 | 0;
 if (i6 >>> 0 > 536870911) {
  __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i12);
  i4 = HEAP32[i12 >> 2] | 0;
  i2 = HEAP32[i11 >> 2] | 0;
  i3 = i4;
 }
 i5 = i3;
 i1 = i2 - i5 | 0;
 if (i1 >> 3 >>> 0 < 268435455) {
  i1 = i1 >> 2;
  i1 = i1 >>> 0 < i6 >>> 0 ? i6 : i1;
  i5 = (HEAP32[i13 >> 2] | 0) - i5 | 0;
  i2 = i5 >> 3;
  if (!i1) {
   i7 = 0;
   i9 = 0;
   i8 = i2;
   i6 = i5;
  } else i10 = 9;
 } else {
  i5 = (HEAP32[i13 >> 2] | 0) - i5 | 0;
  i1 = 536870911;
  i2 = i5 >> 3;
  i10 = 9;
 }
 if ((i10 | 0) == 9) {
  i7 = i1;
  i9 = __Znwj(i1 << 3) | 0;
  i8 = i2;
  i6 = i5;
 }
 i2 = i9 + (i7 << 3) | 0;
 i1 = i14;
 i5 = i9 + (i8 << 3) | 0;
 while (1) {
  HEAPF64[i5 >> 3] = +HEAPF64[i15 >> 3];
  i1 = i1 + -1 | 0;
  if (!i1) break; else i5 = i5 + 8 | 0;
 }
 _memcpy(i9 | 0, i3 | 0, i6 | 0) | 0;
 HEAP32[i12 >> 2] = i9;
 HEAP32[i13 >> 2] = i9 + (i8 + i14 << 3);
 HEAP32[i11 >> 2] = i2;
 if (!i4) return;
 __ZdlPv(i4);
 return;
}

function __ZNSt3__16vectorIiNS_9allocatorIiEEE8__appendEjRKi(i12, i14, i15) {
 i12 = i12 | 0;
 i14 = i14 | 0;
 i15 = i15 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0, i13 = 0;
 i11 = i12 + 8 | 0;
 i2 = HEAP32[i11 >> 2] | 0;
 i13 = i12 + 4 | 0;
 i3 = HEAP32[i13 >> 2] | 0;
 i1 = i3;
 if (i2 - i1 >> 2 >>> 0 >= i14 >>> 0) {
  i1 = i14;
  i2 = i3;
  while (1) {
   HEAP32[i2 >> 2] = HEAP32[i15 >> 2];
   i1 = i1 + -1 | 0;
   if (!i1) break; else i2 = i2 + 4 | 0;
  }
  HEAP32[i13 >> 2] = i3 + (i14 << 2);
  return;
 }
 i3 = HEAP32[i12 >> 2] | 0;
 i4 = i3;
 i6 = (i1 - i4 >> 2) + i14 | 0;
 if (i6 >>> 0 > 1073741823) {
  __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i12);
  i4 = HEAP32[i12 >> 2] | 0;
  i2 = HEAP32[i11 >> 2] | 0;
  i3 = i4;
 }
 i5 = i3;
 i1 = i2 - i5 | 0;
 if (i1 >> 2 >>> 0 < 536870911) {
  i1 = i1 >> 1;
  i1 = i1 >>> 0 < i6 >>> 0 ? i6 : i1;
  i5 = (HEAP32[i13 >> 2] | 0) - i5 | 0;
  i2 = i5 >> 2;
  if (!i1) {
   i7 = 0;
   i9 = 0;
   i8 = i2;
   i6 = i5;
  } else i10 = 9;
 } else {
  i5 = (HEAP32[i13 >> 2] | 0) - i5 | 0;
  i1 = 1073741823;
  i2 = i5 >> 2;
  i10 = 9;
 }
 if ((i10 | 0) == 9) {
  i7 = i1;
  i9 = __Znwj(i1 << 2) | 0;
  i8 = i2;
  i6 = i5;
 }
 i2 = i9 + (i7 << 2) | 0;
 i1 = i14;
 i5 = i9 + (i8 << 2) | 0;
 while (1) {
  HEAP32[i5 >> 2] = HEAP32[i15 >> 2];
  i1 = i1 + -1 | 0;
  if (!i1) break; else i5 = i5 + 4 | 0;
 }
 _memcpy(i9 | 0, i3 | 0, i6 | 0) | 0;
 HEAP32[i12 >> 2] = i9;
 HEAP32[i13 >> 2] = i9 + (i8 + i14 << 2);
 HEAP32[i11 >> 2] = i2;
 if (!i4) return;
 __ZdlPv(i4);
 return;
}

function __ZNK10__cxxabiv121__vmi_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i1, i12, i11, i10, i13, i14) {
 i1 = i1 | 0;
 i12 = i12 | 0;
 i11 = i11 | 0;
 i10 = i10 | 0;
 i13 = i13 | 0;
 i14 = i14 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0;
 if ((i1 | 0) == (HEAP32[i12 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0, i12, i11, i10, i13); else {
  i6 = i12 + 52 | 0;
  i7 = HEAP8[i6 >> 0] | 0;
  i8 = i12 + 53 | 0;
  i9 = HEAP8[i8 >> 0] | 0;
  i5 = HEAP32[i1 + 12 >> 2] | 0;
  i2 = i1 + 16 + (i5 << 3) | 0;
  HEAP8[i6 >> 0] = 0;
  HEAP8[i8 >> 0] = 0;
  __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i1 + 16 | 0, i12, i11, i10, i13, i14);
  L4 : do if ((i5 | 0) > 1) {
   i3 = i12 + 24 | 0;
   i4 = i1 + 8 | 0;
   i5 = i12 + 54 | 0;
   i1 = i1 + 24 | 0;
   do {
    if (HEAP8[i5 >> 0] | 0) break L4;
    if (!(HEAP8[i6 >> 0] | 0)) {
     if ((HEAP8[i8 >> 0] | 0) != 0 ? (HEAP32[i4 >> 2] & 1 | 0) == 0 : 0) break L4;
    } else {
     if ((HEAP32[i3 >> 2] | 0) == 1) break L4;
     if (!(HEAP32[i4 >> 2] & 2)) break L4;
    }
    HEAP8[i6 >> 0] = 0;
    HEAP8[i8 >> 0] = 0;
    __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i1, i12, i11, i10, i13, i14);
    i1 = i1 + 8 | 0;
   } while (i1 >>> 0 < i2 >>> 0);
  } while (0);
  HEAP8[i6 >> 0] = i7;
  HEAP8[i8 >> 0] = i9;
 }
 return;
}

function __ZNK6LIBSVM5SVR_Q5get_QEii(i9, i10, i13) {
 i9 = i9 | 0;
 i10 = i10 | 0;
 i13 = i13 | 0;
 var i1 = 0, i2 = 0, i3 = 0, d4 = 0.0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i11 = 0, i12 = 0, i14 = 0, i15 = 0;
 i14 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i11 = i14;
 i12 = i9 + 60 | 0;
 i6 = HEAP32[(HEAP32[i12 >> 2] | 0) + (i10 << 2) >> 2] | 0;
 i7 = i9 + 48 | 0;
 i5 = __ZN6LIBSVM5Cache8get_dataEiPPfi(HEAP32[i9 + 52 >> 2] | 0, i6, i11, HEAP32[i7 >> 2] | 0) | 0;
 i8 = HEAP32[i7 >> 2] | 0;
 if ((i5 | 0) < (i8 | 0) & (i8 | 0) > 0) {
  i2 = i9 + 4 | 0;
  i3 = HEAP32[i11 >> 2] | 0;
  i8 = 0;
  do {
   i1 = HEAP32[i2 >> 2] | 0;
   i15 = HEAP32[i2 + 4 >> 2] | 0;
   i5 = i9 + (i15 >> 1) | 0;
   if (i15 & 1) i1 = HEAP32[(HEAP32[i5 >> 2] | 0) + i1 >> 2] | 0;
   d4 = +FUNCTION_TABLE_diii[i1 & 15](i5, i6, i8);
   HEAPF32[i3 + (i8 << 2) >> 2] = d4;
   i8 = i8 + 1 | 0;
  } while ((i8 | 0) < (HEAP32[i7 >> 2] | 0));
 }
 i15 = i9 + 64 | 0;
 i8 = HEAP32[i15 >> 2] | 0;
 i6 = HEAP32[i9 + 68 + (i8 << 2) >> 2] | 0;
 HEAP32[i15 >> 2] = 1 - i8;
 if ((i13 | 0) <= 0) {
  STACKTOP = i14;
  return i6 | 0;
 }
 i5 = HEAP32[i9 + 56 >> 2] | 0;
 d4 = +(HEAP8[i5 + i10 >> 0] | 0);
 i3 = HEAP32[i11 >> 2] | 0;
 i1 = HEAP32[i12 >> 2] | 0;
 i2 = 0;
 do {
  HEAPF32[i6 + (i2 << 2) >> 2] = d4 * +(HEAP8[i5 + i2 >> 0] | 0) * +HEAPF32[i3 + (HEAP32[i1 + (i2 << 2) >> 2] << 2) >> 2];
  i2 = i2 + 1 | 0;
 } while ((i2 | 0) != (i13 | 0));
 STACKTOP = i14;
 return i6 | 0;
}

function __ZNK10__cxxabiv119__pointer_type_info9can_catchEPKNS_16__shim_type_infoERPv(i1, i2, i7) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i7 = i7 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0, i8 = 0, i9 = 0;
 i9 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i8 = i9;
 HEAP32[i7 >> 2] = HEAP32[HEAP32[i7 >> 2] >> 2];
 if (!((i1 | 0) == (i2 | 0) | (i2 | 0) == 1088)) if (((i2 | 0) != 0 ? (i3 = ___dynamic_cast(i2, 1e3, 1048, 0) | 0, (i3 | 0) != 0) : 0) ? (HEAP32[i3 + 8 >> 2] & ~HEAP32[i1 + 8 >> 2] | 0) == 0 : 0) {
  i2 = HEAP32[i1 + 12 >> 2] | 0;
  i1 = i3 + 12 | 0;
  if (!((i2 | 0) == 1080 ? 1 : (i2 | 0) == (HEAP32[i1 >> 2] | 0))) if ((((i2 | 0) != 0 ? (i5 = ___dynamic_cast(i2, 1e3, 1016, 0) | 0, (i5 | 0) != 0) : 0) ? (i4 = HEAP32[i1 >> 2] | 0, (i4 | 0) != 0) : 0) ? (i6 = ___dynamic_cast(i4, 1e3, 1016, 0) | 0, (i6 | 0) != 0) : 0) {
   i1 = i8;
   i2 = i1 + 56 | 0;
   do {
    HEAP32[i1 >> 2] = 0;
    i1 = i1 + 4 | 0;
   } while ((i1 | 0) < (i2 | 0));
   HEAP32[i8 >> 2] = i6;
   HEAP32[i8 + 8 >> 2] = i5;
   HEAP32[i8 + 12 >> 2] = -1;
   HEAP32[i8 + 48 >> 2] = 1;
   FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i6 >> 2] | 0) + 28 >> 2] & 15](i6, i8, HEAP32[i7 >> 2] | 0, 1);
   if ((HEAP32[i8 + 24 >> 2] | 0) == 1) {
    HEAP32[i7 >> 2] = HEAP32[i8 + 16 >> 2];
    i1 = 1;
   } else i1 = 0;
  } else i1 = 0; else i1 = 1;
 } else i1 = 0; else i1 = 1;
 STACKTOP = i9;
 return i1 | 0;
}

function __ZN17knnClassification5trainERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE(i11, i9) {
 i11 = i11 | 0;
 i9 = i9 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i10 = 0;
 i7 = i11 + 20 | 0;
 i8 = HEAP32[i7 >> 2] | 0;
 i10 = i11 + 24 | 0;
 i1 = HEAP32[i10 >> 2] | 0;
 if ((i1 | 0) != (i8 | 0)) do {
  i5 = i1 + -24 | 0;
  HEAP32[i10 >> 2] = i5;
  i6 = HEAP32[i1 + -12 >> 2] | 0;
  i2 = i6;
  if (i6) {
   i3 = i1 + -8 | 0;
   i4 = HEAP32[i3 >> 2] | 0;
   if ((i4 | 0) != (i6 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
   __ZdlPv(i6);
  }
  i3 = HEAP32[i5 >> 2] | 0;
  i4 = i3;
  if (i3) {
   i1 = i1 + -20 | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
   __ZdlPv(i3);
  }
  i1 = HEAP32[i10 >> 2] | 0;
 } while ((i1 | 0) != (i8 | 0));
 if ((i7 | 0) != (i9 | 0)) __ZNSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEE6assignIPS1_EENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIS1_NS_15iterator_traitsIS8_E9referenceEEE5valueEvE4typeES8_S8_(i7, HEAP32[i9 >> 2] | 0, HEAP32[i9 + 4 >> 2] | 0);
 i1 = i11 + 36 | 0;
 i2 = HEAP32[i11 + 32 >> 2] | 0;
 if ((HEAP32[i1 >> 2] | 0) == (i2 | 0)) return;
 i11 = ((HEAP32[i10 >> 2] | 0) - (HEAP32[i11 + 20 >> 2] | 0) | 0) / 24 | 0;
 HEAP32[i1 >> 2] = (i11 | 0) < (i2 | 0) ? i11 : i2;
 return;
}

function __ZN14classification4getKEv(i9, i1) {
 i9 = i9 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i10 = 0;
 i8 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i6 = i8;
 HEAP32[i9 >> 2] = 0;
 i10 = i9 + 4 | 0;
 HEAP32[i10 >> 2] = 0;
 HEAP32[i9 + 8 >> 2] = 0;
 i2 = HEAP32[i1 + 4 >> 2] | 0;
 i4 = HEAP32[i1 + 8 >> 2] | 0;
 if ((i2 | 0) == (i4 | 0)) {
  STACKTOP = i8;
  return;
 }
 i5 = i9 + 8 | 0;
 while (1) {
  i1 = HEAP32[i2 >> 2] | 0;
  if (!i1) i1 = 0; else i1 = ___dynamic_cast(i1, 200, 304, 0) | 0;
  __THREW__ = 0;
  i1 = invoke_ii(35, i1 | 0) | 0;
  i3 = __THREW__;
  __THREW__ = 0;
  if (i3 & 1) break;
  HEAP32[i6 >> 2] = i1;
  i3 = HEAP32[i10 >> 2] | 0;
  if (i3 >>> 0 >= (HEAP32[i5 >> 2] | 0) >>> 0) {
   __THREW__ = 0;
   invoke_vii(21, i9 | 0, i6 | 0);
   i3 = __THREW__;
   __THREW__ = 0;
   if (i3 & 1) break;
  } else {
   HEAP32[i3 >> 2] = i1;
   HEAP32[i10 >> 2] = i3 + 4;
  }
  i2 = i2 + 4 | 0;
  if ((i2 | 0) == (i4 | 0)) {
   i7 = 15;
   break;
  }
 }
 if ((i7 | 0) == 15) {
  STACKTOP = i8;
  return;
 }
 i3 = ___cxa_find_matching_catch() | 0;
 i1 = HEAP32[i9 >> 2] | 0;
 if (!i1) ___resumeException(i3 | 0);
 i2 = HEAP32[i10 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) HEAP32[i10 >> 2] = i2 + (~((i2 + -4 - i1 | 0) >>> 2) << 2);
 __ZdlPv(i1);
 ___resumeException(i3 | 0);
}

function __ZL25default_terminate_handlerv() {
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0;
 i1 = STACKTOP;
 STACKTOP = STACKTOP + 48 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i7 = i1 + 32 | 0;
 i3 = i1 + 24 | 0;
 i8 = i1 + 16 | 0;
 i6 = i1;
 i5 = i1 + 36 | 0;
 i1 = ___cxa_get_globals_fast() | 0;
 if ((i1 | 0) != 0 ? (i4 = HEAP32[i1 >> 2] | 0, (i4 | 0) != 0) : 0) {
  i1 = i4 + 48 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  i1 = HEAP32[i1 + 4 >> 2] | 0;
  if (!((i2 & -256 | 0) == 1126902528 & (i1 | 0) == 1129074247)) {
   HEAP32[i3 >> 2] = HEAP32[607];
   _abort_message(8337, i3);
  }
  if ((i2 | 0) == 1126902529 & (i1 | 0) == 1129074247) i1 = HEAP32[i4 + 44 >> 2] | 0; else i1 = i4 + 80 | 0;
  HEAP32[i5 >> 2] = i1;
  i4 = HEAP32[i4 >> 2] | 0;
  i1 = HEAP32[i4 + 4 >> 2] | 0;
  if (FUNCTION_TABLE_iiii[HEAP32[(HEAP32[984 >> 2] | 0) + 16 >> 2] & 31](984, i4, i5) | 0) {
   i8 = HEAP32[i5 >> 2] | 0;
   i5 = HEAP32[607] | 0;
   i8 = FUNCTION_TABLE_ii[HEAP32[(HEAP32[i8 >> 2] | 0) + 8 >> 2] & 63](i8) | 0;
   HEAP32[i6 >> 2] = i5;
   HEAP32[i6 + 4 >> 2] = i1;
   HEAP32[i6 + 8 >> 2] = i8;
   _abort_message(8251, i6);
  } else {
   HEAP32[i8 >> 2] = HEAP32[607];
   HEAP32[i8 + 4 >> 2] = i1;
   _abort_message(8296, i8);
  }
 }
 _abort_message(8375, i7);
}

function __ZN10emscripten8internal7InvokerIP13neuralNetworkJOiONSt3__16vectorIiNS5_9allocatorIiEEEES4_S4_EE6invokeEPFS3_S4_SA_S4_S4_EiPS9_ii(i5, i1, i2, i3, i4) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0;
 i7 = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i10 = i7 + 20 | 0;
 i6 = i7 + 8 | 0;
 i9 = i7 + 4 | 0;
 i8 = i7;
 HEAP32[i10 >> 2] = i1;
 __ZNSt3__16vectorIiNS_9allocatorIiEEEC2ERKS3_(i6, i2);
 HEAP32[i9 >> 2] = i3;
 HEAP32[i8 >> 2] = i4;
 __THREW__ = 0;
 i3 = invoke_iiiii(i5 | 0, i10 | 0, i6 | 0, i9 | 0, i8 | 0) | 0;
 i5 = __THREW__;
 __THREW__ = 0;
 if (i5 & 1) {
  i3 = ___cxa_find_matching_catch() | 0;
  i4 = HEAP32[i6 >> 2] | 0;
  if (!i4) ___resumeException(i3 | 0);
  i1 = i6 + 4 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -4 - i4 | 0) >>> 2) << 2);
  __ZdlPv(i4);
  ___resumeException(i3 | 0);
 } else {
  i4 = HEAP32[i6 >> 2] | 0;
  if (!i4) {
   STACKTOP = i7;
   return i3 | 0;
  }
  i1 = i6 + 4 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -4 - i4 | 0) >>> 2) << 2);
  __ZdlPv(i4);
  STACKTOP = i7;
  return i3 | 0;
 }
 return 0;
}

function __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i6, i3) {
 i6 = i6 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0, i7 = 0, i8 = 0, i9 = 0;
 HEAP32[i6 >> 2] = 0;
 i8 = i6 + 4 | 0;
 HEAP32[i8 >> 2] = 0;
 HEAP32[i6 + 8 >> 2] = 0;
 i5 = i3 + 4 | 0;
 i1 = (HEAP32[i5 >> 2] | 0) - (HEAP32[i3 >> 2] | 0) | 0;
 i2 = i1 >> 3;
 if (!i2) return;
 if (!(i2 >>> 0 > 536870911 ? (__THREW__ = 0, invoke_vi(40, i6 | 0), i9 = __THREW__, __THREW__ = 0, i9 & 1) : 0)) i4 = 4;
 if ((i4 | 0) == 4 ? (__THREW__ = 0, i7 = invoke_ii(12, i1 | 0) | 0, i9 = __THREW__, __THREW__ = 0, !(i9 & 1)) : 0) {
  HEAP32[i8 >> 2] = i7;
  HEAP32[i6 >> 2] = i7;
  HEAP32[i6 + 8 >> 2] = i7 + (i2 << 3);
  i1 = HEAP32[i3 >> 2] | 0;
  i3 = HEAP32[i5 >> 2] | 0;
  if ((i1 | 0) == (i3 | 0)) return;
  i4 = (i3 + -8 - i1 | 0) >>> 3;
  i2 = i7;
  while (1) {
   HEAPF64[i2 >> 3] = +HEAPF64[i1 >> 3];
   i1 = i1 + 8 | 0;
   if ((i1 | 0) == (i3 | 0)) break; else i2 = i2 + 8 | 0;
  }
  HEAP32[i8 >> 2] = i7 + (i4 + 1 << 3);
  return;
 }
 i3 = ___cxa_find_matching_catch() | 0;
 i1 = HEAP32[i6 >> 2] | 0;
 if (!i1) ___resumeException(i3 | 0);
 i2 = HEAP32[i8 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) HEAP32[i8 >> 2] = i2 + (~((i2 + -8 - i1 | 0) >>> 3) << 3);
 __ZdlPv(i1);
 ___resumeException(i3 | 0);
}

function __ZNSt3__16vectorIiNS_9allocatorIiEEEC2ERKS3_(i6, i3) {
 i6 = i6 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i4 = 0, i5 = 0, i7 = 0, i8 = 0, i9 = 0;
 HEAP32[i6 >> 2] = 0;
 i8 = i6 + 4 | 0;
 HEAP32[i8 >> 2] = 0;
 HEAP32[i6 + 8 >> 2] = 0;
 i5 = i3 + 4 | 0;
 i1 = (HEAP32[i5 >> 2] | 0) - (HEAP32[i3 >> 2] | 0) | 0;
 i2 = i1 >> 2;
 if (!i2) return;
 if (!(i2 >>> 0 > 1073741823 ? (__THREW__ = 0, invoke_vi(40, i6 | 0), i9 = __THREW__, __THREW__ = 0, i9 & 1) : 0)) i4 = 4;
 if ((i4 | 0) == 4 ? (__THREW__ = 0, i7 = invoke_ii(12, i1 | 0) | 0, i9 = __THREW__, __THREW__ = 0, !(i9 & 1)) : 0) {
  HEAP32[i8 >> 2] = i7;
  HEAP32[i6 >> 2] = i7;
  HEAP32[i6 + 8 >> 2] = i7 + (i2 << 2);
  i1 = HEAP32[i3 >> 2] | 0;
  i3 = HEAP32[i5 >> 2] | 0;
  if ((i1 | 0) == (i3 | 0)) return;
  i4 = (i3 + -4 - i1 | 0) >>> 2;
  i2 = i7;
  while (1) {
   HEAP32[i2 >> 2] = HEAP32[i1 >> 2];
   i1 = i1 + 4 | 0;
   if ((i1 | 0) == (i3 | 0)) break; else i2 = i2 + 4 | 0;
  }
  HEAP32[i8 >> 2] = i7 + (i4 + 1 << 2);
  return;
 }
 i3 = ___cxa_find_matching_catch() | 0;
 i1 = HEAP32[i6 >> 2] | 0;
 if (!i1) ___resumeException(i3 | 0);
 i2 = HEAP32[i8 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) HEAP32[i8 >> 2] = i2 + (~((i2 + -4 - i1 | 0) >>> 2) << 2);
 __ZdlPv(i1);
 ___resumeException(i3 | 0);
}

function __ZNK6LIBSVM6Kernel11kernel_polyEii(i8, i3, i5) {
 i8 = i8 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 var d1 = 0.0, d2 = 0.0, i4 = 0, i6 = 0, d7 = 0.0;
 d7 = +HEAPF64[i8 + 32 >> 3];
 i4 = HEAP32[i8 + 12 >> 2] | 0;
 i3 = HEAP32[i4 + (i3 << 2) >> 2] | 0;
 i6 = HEAP32[i3 >> 2] | 0;
 L1 : do if ((i6 | 0) == -1) d2 = 0.0; else {
  i4 = HEAP32[i4 + (i5 << 2) >> 2] | 0;
  d2 = 0.0;
  while (1) {
   L5 : while (1) {
    i5 = HEAP32[i4 >> 2] | 0;
    if ((i5 | 0) == -1) break L1;
    while (1) {
     if ((i6 | 0) == (i5 | 0)) break L5;
     if ((i6 | 0) <= (i5 | 0)) break;
     i4 = i4 + 16 | 0;
     i5 = HEAP32[i4 >> 2] | 0;
     if ((i5 | 0) == -1) break L1;
    }
    i3 = i3 + 16 | 0;
    i5 = HEAP32[i3 >> 2] | 0;
    if ((i5 | 0) == -1) break L1; else i6 = i5;
   }
   d2 = d2 + +HEAPF64[i3 + 8 >> 3] * +HEAPF64[i4 + 8 >> 3];
   i3 = i3 + 16 | 0;
   i6 = HEAP32[i3 >> 2] | 0;
   if ((i6 | 0) == -1) break; else i4 = i4 + 16 | 0;
  }
 } while (0);
 i3 = HEAP32[i8 + 24 >> 2] | 0;
 if ((i3 | 0) <= 0) {
  d7 = 1.0;
  return +d7;
 }
 d1 = 1.0;
 d2 = d7 * d2 + +HEAPF64[i8 + 40 >> 3];
 while (1) {
  d1 = ((i3 | 0) % 2 | 0 | 0) == 1 ? d1 * d2 : d1;
  if ((i3 | 0) > 1) {
   i3 = (i3 | 0) / 2 | 0;
   d2 = d2 * d2;
  } else break;
 }
 return +d1;
}

function _memchr(i1, i5, i2) {
 i1 = i1 | 0;
 i5 = i5 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i6 = 0, i7 = 0;
 i6 = i5 & 255;
 i3 = (i2 | 0) != 0;
 L1 : do if (i3 & (i1 & 3 | 0) != 0) {
  i4 = i5 & 255;
  while (1) {
   if ((HEAP8[i1 >> 0] | 0) == i4 << 24 >> 24) {
    i7 = 6;
    break L1;
   }
   i1 = i1 + 1 | 0;
   i2 = i2 + -1 | 0;
   i3 = (i2 | 0) != 0;
   if (!(i3 & (i1 & 3 | 0) != 0)) {
    i7 = 5;
    break;
   }
  }
 } else i7 = 5; while (0);
 if ((i7 | 0) == 5) if (i3) i7 = 6; else i2 = 0;
 L8 : do if ((i7 | 0) == 6) {
  i4 = i5 & 255;
  if ((HEAP8[i1 >> 0] | 0) != i4 << 24 >> 24) {
   i3 = Math_imul(i6, 16843009) | 0;
   L11 : do if (i2 >>> 0 > 3) while (1) {
    i6 = HEAP32[i1 >> 2] ^ i3;
    if ((i6 & -2139062144 ^ -2139062144) & i6 + -16843009) break;
    i1 = i1 + 4 | 0;
    i2 = i2 + -4 | 0;
    if (i2 >>> 0 <= 3) {
     i7 = 11;
     break L11;
    }
   } else i7 = 11; while (0);
   if ((i7 | 0) == 11) if (!i2) {
    i2 = 0;
    break;
   }
   while (1) {
    if ((HEAP8[i1 >> 0] | 0) == i4 << 24 >> 24) break L8;
    i1 = i1 + 1 | 0;
    i2 = i2 + -1 | 0;
    if (!i2) {
     i2 = 0;
     break;
    }
   }
  }
 } while (0);
 return ((i2 | 0) != 0 ? i1 : 0) | 0;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6insertEjPKcj(i7, i4, i2, i6) {
 i7 = i7 | 0;
 i4 = i4 | 0;
 i2 = i2 | 0;
 i6 = i6 | 0;
 var i1 = 0, i3 = 0, i5 = 0;
 i1 = HEAP8[i7 >> 0] | 0;
 i3 = (i1 & 1) == 0;
 if (i3) i5 = (i1 & 255) >>> 1; else i5 = HEAP32[i7 + 4 >> 2] | 0;
 if (i5 >>> 0 < i4 >>> 0) __ZNKSt3__121__basic_string_commonILb1EE20__throw_out_of_rangeEv(i7);
 if (i3) i3 = 10; else {
  i1 = HEAP32[i7 >> 2] | 0;
  i3 = (i1 & -2) + -1 | 0;
  i1 = i1 & 255;
 }
 if ((i3 - i5 | 0) >>> 0 >= i6 >>> 0) {
  if (i6) {
   if (!(i1 & 1)) i3 = i7 + 1 | 0; else i3 = HEAP32[i7 + 8 >> 2] | 0;
   if ((i5 | 0) == (i4 | 0)) i1 = i3 + i4 | 0; else {
    i1 = i3 + i4 | 0;
    _memmove(i3 + (i6 + i4) | 0, i1 | 0, i5 - i4 | 0) | 0;
    i2 = i1 >>> 0 <= i2 >>> 0 & (i3 + i5 | 0) >>> 0 > i2 >>> 0 ? i2 + i6 | 0 : i2;
   }
   _memmove(i1 | 0, i2 | 0, i6 | 0) | 0;
   i1 = i5 + i6 | 0;
   if (!(HEAP8[i7 >> 0] & 1)) HEAP8[i7 >> 0] = i1 << 1; else HEAP32[i7 + 4 >> 2] = i1;
   HEAP8[i3 + i1 >> 0] = 0;
  }
 } else __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE21__grow_by_and_replaceEjjjjjjPKc(i7, i3, i5 + i6 - i3 | 0, i5, i4, 0, i6, i2);
 return i7 | 0;
}

function __ZN17knnClassificationD2Ev(i10) {
 i10 = i10 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0;
 HEAP32[i10 >> 2] = 1492;
 i1 = HEAP32[i10 + 40 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i8 = i10 + 20 | 0;
 i1 = HEAP32[i8 >> 2] | 0;
 if (i1) {
  i9 = i10 + 24 | 0;
  i2 = HEAP32[i9 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i7 = i2 + -24 | 0;
    HEAP32[i9 >> 2] = i7;
    i3 = HEAP32[i2 + -12 >> 2] | 0;
    i4 = i3;
    if (i3) {
     i5 = i2 + -8 | 0;
     i6 = HEAP32[i5 >> 2] | 0;
     if ((i6 | 0) != (i3 | 0)) HEAP32[i5 >> 2] = i6 + (~((i6 + -8 - i4 | 0) >>> 3) << 3);
     __ZdlPv(i3);
    }
    i4 = HEAP32[i7 >> 2] | 0;
    i5 = i4;
    if (i4) {
     i2 = i2 + -20 | 0;
     i3 = HEAP32[i2 >> 2] | 0;
     if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
     __ZdlPv(i4);
    }
    i2 = HEAP32[i9 >> 2] | 0;
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i8 >> 2] | 0;
  }
  __ZdlPv(i1);
 }
 i3 = HEAP32[i10 + 8 >> 2] | 0;
 if (!i3) return;
 i1 = i10 + 12 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -4 - i3 | 0) >>> 2) << 2);
 __ZdlPv(i3);
 return;
}

function _svm_free_model_content(i4) {
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i3 = 0;
 if (((HEAP32[i4 + 136 >> 2] | 0) != 0 ? (HEAP32[i4 + 100 >> 2] | 0) > 0 : 0) ? (i1 = HEAP32[i4 + 104 >> 2] | 0, (i1 | 0) != 0) : 0) _free(HEAP32[i1 >> 2] | 0);
 i2 = i4 + 108 | 0;
 i1 = HEAP32[i2 >> 2] | 0;
 if (((i1 | 0) != 0 ? (i3 = i4 + 96 | 0, (HEAP32[i3 >> 2] | 0) > 1) : 0) ? (_free(HEAP32[i1 >> 2] | 0), ((HEAP32[i3 >> 2] | 0) + -1 | 0) > 1) : 0) {
  i1 = 1;
  do {
   _free(HEAP32[(HEAP32[i2 >> 2] | 0) + (i1 << 2) >> 2] | 0);
   i1 = i1 + 1 | 0;
  } while ((i1 | 0) < ((HEAP32[i3 >> 2] | 0) + -1 | 0));
 }
 i3 = i4 + 104 | 0;
 _free(HEAP32[i3 >> 2] | 0);
 HEAP32[i3 >> 2] = 0;
 _free(HEAP32[i2 >> 2] | 0);
 HEAP32[i2 >> 2] = 0;
 i3 = i4 + 112 | 0;
 _free(HEAP32[i3 >> 2] | 0);
 HEAP32[i3 >> 2] = 0;
 i3 = i4 + 128 | 0;
 _free(HEAP32[i3 >> 2] | 0);
 HEAP32[i3 >> 2] = 0;
 i3 = i4 + 116 | 0;
 _free(HEAP32[i3 >> 2] | 0);
 HEAP32[i3 >> 2] = 0;
 i3 = i4 + 120 | 0;
 _free(HEAP32[i3 >> 2] | 0);
 HEAP32[i3 >> 2] = 0;
 i3 = i4 + 124 | 0;
 _free(HEAP32[i3 >> 2] | 0);
 HEAP32[i3 >> 2] = 0;
 i4 = i4 + 132 | 0;
 _free(HEAP32[i4 >> 2] | 0);
 HEAP32[i4 >> 2] = 0;
 return;
}

function __ZNSt3__16vectorIP9baseModelNS_9allocatorIS2_EEE21__push_back_slow_pathIS2_EEvOT_(i11, i10) {
 i11 = i11 | 0;
 i10 = i10 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i12 = 0;
 i9 = i11 + 4 | 0;
 i1 = HEAP32[i11 >> 2] | 0;
 i2 = i1;
 i5 = ((HEAP32[i9 >> 2] | 0) - i2 >> 2) + 1 | 0;
 if (i5 >>> 0 > 1073741823) {
  __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i11);
  i2 = HEAP32[i11 >> 2] | 0;
  i1 = i2;
 }
 i8 = i11 + 8 | 0;
 i4 = i1;
 i3 = (HEAP32[i8 >> 2] | 0) - i4 | 0;
 if (i3 >> 2 >>> 0 < 536870911) {
  i3 = i3 >> 1;
  i3 = i3 >>> 0 < i5 >>> 0 ? i5 : i3;
  i5 = (HEAP32[i9 >> 2] | 0) - i4 | 0;
  i4 = i5 >> 2;
  if (!i3) {
   i7 = 0;
   i6 = 0;
   i3 = i5;
  } else i12 = 6;
 } else {
  i5 = (HEAP32[i9 >> 2] | 0) - i4 | 0;
  i3 = 1073741823;
  i4 = i5 >> 2;
  i12 = 6;
 }
 if ((i12 | 0) == 6) {
  i7 = i3;
  i6 = __Znwj(i3 << 2) | 0;
  i3 = i5;
 }
 HEAP32[i6 + (i4 << 2) >> 2] = HEAP32[i10 >> 2];
 _memcpy(i6 | 0, i1 | 0, i3 | 0) | 0;
 HEAP32[i11 >> 2] = i6;
 HEAP32[i9 >> 2] = i6 + (i4 + 1 << 2);
 HEAP32[i8 >> 2] = i6 + (i7 << 2);
 if (!i2) return;
 __ZdlPv(i2);
 return;
}

function __ZNSt3__16vectorIdNS_9allocatorIdEEE21__push_back_slow_pathIRKdEEvOT_(i11, i10) {
 i11 = i11 | 0;
 i10 = i10 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i12 = 0;
 i9 = i11 + 4 | 0;
 i1 = HEAP32[i11 >> 2] | 0;
 i2 = i1;
 i5 = ((HEAP32[i9 >> 2] | 0) - i2 >> 3) + 1 | 0;
 if (i5 >>> 0 > 536870911) {
  __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i11);
  i2 = HEAP32[i11 >> 2] | 0;
  i1 = i2;
 }
 i8 = i11 + 8 | 0;
 i4 = i1;
 i3 = (HEAP32[i8 >> 2] | 0) - i4 | 0;
 if (i3 >> 3 >>> 0 < 268435455) {
  i3 = i3 >> 2;
  i3 = i3 >>> 0 < i5 >>> 0 ? i5 : i3;
  i5 = (HEAP32[i9 >> 2] | 0) - i4 | 0;
  i4 = i5 >> 3;
  if (!i3) {
   i7 = 0;
   i6 = 0;
   i3 = i5;
  } else i12 = 6;
 } else {
  i5 = (HEAP32[i9 >> 2] | 0) - i4 | 0;
  i3 = 536870911;
  i4 = i5 >> 3;
  i12 = 6;
 }
 if ((i12 | 0) == 6) {
  i7 = i3;
  i6 = __Znwj(i3 << 3) | 0;
  i3 = i5;
 }
 HEAPF64[i6 + (i4 << 3) >> 3] = +HEAPF64[i10 >> 3];
 _memcpy(i6 | 0, i1 | 0, i3 | 0) | 0;
 HEAP32[i11 >> 2] = i6;
 HEAP32[i9 >> 2] = i6 + (i4 + 1 << 3);
 HEAP32[i8 >> 2] = i6 + (i7 << 3);
 if (!i2) return;
 __ZdlPv(i2);
 return;
}

function __ZNSt3__16vectorIiNS_9allocatorIiEEE21__push_back_slow_pathIRKiEEvOT_(i11, i10) {
 i11 = i11 | 0;
 i10 = i10 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i12 = 0;
 i9 = i11 + 4 | 0;
 i1 = HEAP32[i11 >> 2] | 0;
 i2 = i1;
 i5 = ((HEAP32[i9 >> 2] | 0) - i2 >> 2) + 1 | 0;
 if (i5 >>> 0 > 1073741823) {
  __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i11);
  i2 = HEAP32[i11 >> 2] | 0;
  i1 = i2;
 }
 i8 = i11 + 8 | 0;
 i4 = i1;
 i3 = (HEAP32[i8 >> 2] | 0) - i4 | 0;
 if (i3 >> 2 >>> 0 < 536870911) {
  i3 = i3 >> 1;
  i3 = i3 >>> 0 < i5 >>> 0 ? i5 : i3;
  i5 = (HEAP32[i9 >> 2] | 0) - i4 | 0;
  i4 = i5 >> 2;
  if (!i3) {
   i7 = 0;
   i6 = 0;
   i3 = i5;
  } else i12 = 6;
 } else {
  i5 = (HEAP32[i9 >> 2] | 0) - i4 | 0;
  i3 = 1073741823;
  i4 = i5 >> 2;
  i12 = 6;
 }
 if ((i12 | 0) == 6) {
  i7 = i3;
  i6 = __Znwj(i3 << 2) | 0;
  i3 = i5;
 }
 HEAP32[i6 + (i4 << 2) >> 2] = HEAP32[i10 >> 2];
 _memcpy(i6 | 0, i1 | 0, i3 | 0) | 0;
 HEAP32[i11 >> 2] = i6;
 HEAP32[i9 >> 2] = i6 + (i4 + 1 << 2);
 HEAP32[i8 >> 2] = i6 + (i7 << 2);
 if (!i2) return;
 __ZdlPv(i2);
 return;
}

function __ZNSt3__16vectorIdNS_9allocatorIdEEE21__push_back_slow_pathIdEEvOT_(i11, i10) {
 i11 = i11 | 0;
 i10 = i10 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i12 = 0;
 i9 = i11 + 4 | 0;
 i1 = HEAP32[i11 >> 2] | 0;
 i2 = i1;
 i5 = ((HEAP32[i9 >> 2] | 0) - i2 >> 3) + 1 | 0;
 if (i5 >>> 0 > 536870911) {
  __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i11);
  i2 = HEAP32[i11 >> 2] | 0;
  i1 = i2;
 }
 i8 = i11 + 8 | 0;
 i4 = i1;
 i3 = (HEAP32[i8 >> 2] | 0) - i4 | 0;
 if (i3 >> 3 >>> 0 < 268435455) {
  i3 = i3 >> 2;
  i3 = i3 >>> 0 < i5 >>> 0 ? i5 : i3;
  i5 = (HEAP32[i9 >> 2] | 0) - i4 | 0;
  i4 = i5 >> 3;
  if (!i3) {
   i7 = 0;
   i6 = 0;
   i3 = i5;
  } else i12 = 6;
 } else {
  i5 = (HEAP32[i9 >> 2] | 0) - i4 | 0;
  i3 = 536870911;
  i4 = i5 >> 3;
  i12 = 6;
 }
 if ((i12 | 0) == 6) {
  i7 = i3;
  i6 = __Znwj(i3 << 3) | 0;
  i3 = i5;
 }
 HEAPF64[i6 + (i4 << 3) >> 3] = +HEAPF64[i10 >> 3];
 _memcpy(i6 | 0, i1 | 0, i3 | 0) | 0;
 HEAP32[i11 >> 2] = i6;
 HEAP32[i9 >> 2] = i6 + (i4 + 1 << 3);
 HEAP32[i8 >> 2] = i6 + (i7 << 3);
 if (!i2) return;
 __ZdlPv(i2);
 return;
}

function __ZNSt3__16vectorIiNS_9allocatorIiEEE21__push_back_slow_pathIiEEvOT_(i11, i10) {
 i11 = i11 | 0;
 i10 = i10 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i12 = 0;
 i9 = i11 + 4 | 0;
 i1 = HEAP32[i11 >> 2] | 0;
 i2 = i1;
 i5 = ((HEAP32[i9 >> 2] | 0) - i2 >> 2) + 1 | 0;
 if (i5 >>> 0 > 1073741823) {
  __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i11);
  i2 = HEAP32[i11 >> 2] | 0;
  i1 = i2;
 }
 i8 = i11 + 8 | 0;
 i4 = i1;
 i3 = (HEAP32[i8 >> 2] | 0) - i4 | 0;
 if (i3 >> 2 >>> 0 < 536870911) {
  i3 = i3 >> 1;
  i3 = i3 >>> 0 < i5 >>> 0 ? i5 : i3;
  i5 = (HEAP32[i9 >> 2] | 0) - i4 | 0;
  i4 = i5 >> 2;
  if (!i3) {
   i7 = 0;
   i6 = 0;
   i3 = i5;
  } else i12 = 6;
 } else {
  i5 = (HEAP32[i9 >> 2] | 0) - i4 | 0;
  i3 = 1073741823;
  i4 = i5 >> 2;
  i12 = 6;
 }
 if ((i12 | 0) == 6) {
  i7 = i3;
  i6 = __Znwj(i3 << 2) | 0;
  i3 = i5;
 }
 HEAP32[i6 + (i4 << 2) >> 2] = HEAP32[i10 >> 2];
 _memcpy(i6 | 0, i1 | 0, i3 | 0) | 0;
 HEAP32[i11 >> 2] = i6;
 HEAP32[i9 >> 2] = i6 + (i4 + 1 << 2);
 HEAP32[i8 >> 2] = i6 + (i7 << 2);
 if (!i2) return;
 __ZdlPv(i2);
 return;
}

function __ZN6LIBSVM6Solver13calculate_rhoEv(i1) {
 i1 = i1 | 0;
 var d2 = 0.0, d3 = 0.0, d4 = 0.0, i5 = 0, d6 = 0.0, i7 = 0, i8 = 0, i9 = 0, i10 = 0, i11 = 0;
 i9 = HEAP32[i1 + 4 >> 2] | 0;
 L1 : do if ((i9 | 0) > 0) {
  i10 = HEAP32[i1 + 8 >> 2] | 0;
  i11 = HEAP32[i1 + 12 >> 2] | 0;
  i7 = HEAP32[i1 + 16 >> 2] | 0;
  i8 = 0;
  d4 = -inf;
  i1 = 0;
  d3 = 0.0;
  d2 = inf;
  while (1) {
   i5 = HEAP8[i10 + i8 >> 0] | 0;
   d6 = +(i5 << 24 >> 24) * +HEAPF64[i11 + (i8 << 3) >> 3];
   L5 : do switch (HEAP8[i7 + i8 >> 0] | 0) {
   case 1:
    if (i5 << 24 >> 24 == -1) {
     d2 = d2 < d6 ? d2 : d6;
     break L5;
    } else {
     d4 = d4 > d6 ? d4 : d6;
     break L5;
    }
   case 0:
    if (i5 << 24 >> 24 == 1) {
     d2 = d2 < d6 ? d2 : d6;
     break L5;
    } else {
     d4 = d4 > d6 ? d4 : d6;
     break L5;
    }
   default:
    {
     i1 = i1 + 1 | 0;
     d3 = d3 + d6;
    }
   } while (0);
   i8 = i8 + 1 | 0;
   if ((i8 | 0) >= (i9 | 0)) break L1;
  }
 } else {
  d4 = -inf;
  i1 = 0;
  d3 = 0.0;
  d2 = inf;
 } while (0);
 return +((i1 | 0) > 0 ? d3 / +(i1 | 0) : (d2 + d4) * .5);
}

function _vsnprintf(i3, i1, i10, i8) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i10 = i10 | 0;
 i8 = i8 | 0;
 var i2 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i9 = 0, i11 = 0;
 i11 = STACKTOP;
 STACKTOP = STACKTOP + 128 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i2 = i11 + 112 | 0;
 i9 = i11;
 i4 = i9;
 i5 = 2492;
 i6 = i4 + 112 | 0;
 do {
  HEAP32[i4 >> 2] = HEAP32[i5 >> 2];
  i4 = i4 + 4 | 0;
  i5 = i5 + 4 | 0;
 } while ((i4 | 0) < (i6 | 0));
 if ((i1 + -1 | 0) >>> 0 > 2147483646) if (!i1) {
  i1 = 1;
  i7 = 4;
 } else {
  i1 = ___errno_location() | 0;
  HEAP32[i1 >> 2] = 75;
  i1 = -1;
 } else {
  i2 = i3;
  i7 = 4;
 }
 if ((i7 | 0) == 4) {
  i7 = -2 - i2 | 0;
  i7 = i1 >>> 0 > i7 >>> 0 ? i7 : i1;
  HEAP32[i9 + 48 >> 2] = i7;
  i3 = i9 + 20 | 0;
  HEAP32[i3 >> 2] = i2;
  HEAP32[i9 + 44 >> 2] = i2;
  i1 = i2 + i7 | 0;
  i2 = i9 + 16 | 0;
  HEAP32[i2 >> 2] = i1;
  HEAP32[i9 + 28 >> 2] = i1;
  i1 = _vfprintf(i9, i10, i8) | 0;
  if (i7) {
   i10 = HEAP32[i3 >> 2] | 0;
   HEAP8[i10 + (((i10 | 0) == (HEAP32[i2 >> 2] | 0)) << 31 >> 31) >> 0] = 0;
  }
 }
 STACKTOP = i11;
 return i1 | 0;
}

function __ZNK6LIBSVM6Kernel10kernel_rbfEii(i2, i3, i6) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i6 = i6 | 0;
 var d1 = 0.0, i4 = 0, i5 = 0, d7 = 0.0, d8 = 0.0;
 d7 = +HEAPF64[i2 + 32 >> 3];
 i4 = HEAP32[i2 + 16 >> 2] | 0;
 d8 = +HEAPF64[i4 + (i3 << 3) >> 3] + +HEAPF64[i4 + (i6 << 3) >> 3];
 i4 = HEAP32[i2 + 12 >> 2] | 0;
 i2 = HEAP32[i4 + (i3 << 2) >> 2] | 0;
 i5 = HEAP32[i2 >> 2] | 0;
 L1 : do if ((i5 | 0) == -1) d1 = 0.0; else {
  i3 = HEAP32[i4 + (i6 << 2) >> 2] | 0;
  d1 = 0.0;
  while (1) {
   L5 : while (1) {
    i4 = HEAP32[i3 >> 2] | 0;
    if ((i4 | 0) == -1) break L1;
    while (1) {
     if ((i5 | 0) == (i4 | 0)) break L5;
     if ((i5 | 0) <= (i4 | 0)) break;
     i3 = i3 + 16 | 0;
     i4 = HEAP32[i3 >> 2] | 0;
     if ((i4 | 0) == -1) break L1;
    }
    i2 = i2 + 16 | 0;
    i5 = HEAP32[i2 >> 2] | 0;
    if ((i5 | 0) == -1) break L1;
   }
   d1 = d1 + +HEAPF64[i2 + 8 >> 3] * +HEAPF64[i3 + 8 >> 3];
   i2 = i2 + 16 | 0;
   i5 = HEAP32[i2 >> 2] | 0;
   if ((i5 | 0) == -1) break; else i3 = i3 + 16 | 0;
  }
 } while (0);
 return +(+Math_exp(+-(d7 * (d8 - d1 * 2.0))));
}

function __ZN10emscripten8internal13MethodInvokerIM8modelSetFNSt3__16vectorIdNS3_9allocatorIdEEEERKS7_ES7_PS2_JS9_EE6invokeERKSB_SC_PS7_(i2, i3, i4) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i1 = 0, i5 = 0, i6 = 0, i7 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i6 = i5;
 i1 = HEAP32[i2 >> 2] | 0;
 i7 = HEAP32[i2 + 4 >> 2] | 0;
 i2 = i3 + (i7 >> 1) | 0;
 if (i7 & 1) i1 = HEAP32[(HEAP32[i2 >> 2] | 0) + i1 >> 2] | 0;
 FUNCTION_TABLE_viii[i1 & 31](i6, i2, i4);
 __THREW__ = 0;
 i1 = invoke_ii(12, 12) | 0;
 i7 = __THREW__;
 __THREW__ = 0;
 if (!(i7 & 1)) {
  HEAP32[i1 >> 2] = HEAP32[i6 >> 2];
  HEAP32[i1 + 4 >> 2] = HEAP32[i6 + 4 >> 2];
  HEAP32[i1 + 8 >> 2] = HEAP32[i6 + 8 >> 2];
  STACKTOP = i5;
  return i1 | 0;
 }
 i3 = ___cxa_find_matching_catch() | 0;
 i4 = HEAP32[i6 >> 2] | 0;
 if (!i4) ___resumeException(i3 | 0);
 i1 = i6 + 4 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
 __ZdlPv(i4);
 ___resumeException(i3 | 0);
 return 0;
}

function __ZN10emscripten8internal12operator_newI17svmClassificationJiEEEPT_DpOT0_(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 i2 = __Znwj(160) | 0;
 i1 = HEAP32[i1 >> 2] | 0;
 HEAP32[i2 >> 2] = 1860;
 i3 = i2 + 128 | 0;
 HEAP32[i3 >> 2] = 0;
 HEAP32[i3 + 4 >> 2] = 0;
 HEAP32[i3 + 8 >> 2] = 0;
 HEAP32[i3 + 12 >> 2] = 0;
 HEAP32[i3 + 16 >> 2] = 0;
 HEAP32[i3 + 20 >> 2] = 0;
 HEAP32[i2 + 124 >> 2] = i1;
 HEAP32[i2 + 8 >> 2] = 0;
 HEAP32[i2 + 112 >> 2] = 0;
 HEAP32[i2 + 120 >> 2] = 0;
 HEAP32[i2 + 116 >> 2] = 0;
 HEAP8[i2 + 152 >> 0] = 0;
 HEAP8[i2 + 4 >> 0] = 0;
 HEAP32[i2 + 16 >> 2] = 0;
 HEAP32[i2 + 20 >> 2] = 1;
 HEAP32[i2 + 24 >> 2] = 3;
 i1 = i2 + 32 | 0;
 HEAP32[i1 >> 2] = 0;
 HEAP32[i1 + 4 >> 2] = 0;
 HEAP32[i1 + 8 >> 2] = 0;
 HEAP32[i1 + 12 >> 2] = 0;
 HEAPF64[i2 + 88 >> 3] = .5;
 HEAPF64[i2 + 48 >> 3] = 100.0;
 HEAPF64[i2 + 64 >> 3] = 1.0;
 HEAPF64[i2 + 56 >> 3] = .001;
 HEAPF64[i2 + 96 >> 3] = .1;
 HEAP32[i2 + 104 >> 2] = 1;
 HEAP32[i2 + 108 >> 2] = 1;
 HEAP32[i2 + 72 >> 2] = 0;
 HEAP32[i2 + 76 >> 2] = 0;
 HEAP32[i2 + 80 >> 2] = 0;
 return i2 | 0;
}

function __ZNSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEE6resizeEjRKS1_(i5, i3, i4) {
 i5 = i5 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i6 = 0, i7 = 0, i8 = 0;
 i8 = i5 + 4 | 0;
 i6 = HEAP32[i8 >> 2] | 0;
 i1 = HEAP32[i5 >> 2] | 0;
 i2 = (i6 - i1 | 0) / 24 | 0;
 if (i2 >>> 0 < i3 >>> 0) {
  __ZNSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEE8__appendEjRKS1_(i5, i3 - i2 | 0, i4);
  return;
 }
 if (i2 >>> 0 <= i3 >>> 0) return;
 i7 = i1 + (i3 * 24 | 0) | 0;
 if ((i6 | 0) == (i7 | 0)) return;
 do {
  i1 = i6 + -24 | 0;
  HEAP32[i8 >> 2] = i1;
  i2 = HEAP32[i6 + -12 >> 2] | 0;
  i3 = i2;
  if (i2) {
   i4 = i6 + -8 | 0;
   i5 = HEAP32[i4 >> 2] | 0;
   if ((i5 | 0) != (i2 | 0)) HEAP32[i4 >> 2] = i5 + (~((i5 + -8 - i3 | 0) >>> 3) << 3);
   __ZdlPv(i2);
  }
  i3 = HEAP32[i1 >> 2] | 0;
  i4 = i3;
  if (i3) {
   i1 = i6 + -20 | 0;
   i2 = HEAP32[i1 >> 2] | 0;
   if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
   __ZdlPv(i3);
  }
  i6 = HEAP32[i8 >> 2] | 0;
 } while ((i6 | 0) != (i7 | 0));
 return;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE21__grow_by_and_replaceEjjjjjjPKc(i11, i10, i1, i4, i8, i9, i7, i5) {
 i11 = i11 | 0;
 i10 = i10 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 i8 = i8 | 0;
 i9 = i9 | 0;
 i7 = i7 | 0;
 i5 = i5 | 0;
 var i2 = 0, i3 = 0, i6 = 0;
 if ((-18 - i10 | 0) >>> 0 < i1 >>> 0) __ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv(i11);
 if (!(HEAP8[i11 >> 0] & 1)) i6 = i11 + 1 | 0; else i6 = HEAP32[i11 + 8 >> 2] | 0;
 if (i10 >>> 0 < 2147483623) {
  i2 = i1 + i10 | 0;
  i3 = i10 << 1;
  i2 = i2 >>> 0 < i3 >>> 0 ? i3 : i2;
  i2 = i2 >>> 0 < 11 ? 11 : i2 + 16 & -16;
 } else i2 = -17;
 i3 = __Znwj(i2) | 0;
 if (i8) _memcpy(i3 | 0, i6 | 0, i8 | 0) | 0;
 if (i7) _memcpy(i3 + i8 | 0, i5 | 0, i7 | 0) | 0;
 i1 = i4 - i9 | 0;
 if ((i1 | 0) != (i8 | 0)) _memcpy(i3 + (i7 + i8) | 0, i6 + (i9 + i8) | 0, i1 - i8 | 0) | 0;
 if ((i10 | 0) != 10) __ZdlPv(i6);
 HEAP32[i11 + 8 >> 2] = i3;
 HEAP32[i11 >> 2] = i2 | 1;
 i10 = i1 + i7 | 0;
 HEAP32[i11 + 4 >> 2] = i10;
 HEAP8[i3 + i10 >> 0] = 0;
 return;
}

function __ZN10emscripten8internal13MethodInvokerIM20seriesClassificationFNSt3__16vectorIdNS3_9allocatorIdEEEEvES7_PS2_JEE6invokeERKS9_SA_(i2, i3) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i1 = 0, i4 = 0, i5 = 0, i6 = 0;
 i4 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i5 = i4;
 i1 = HEAP32[i2 >> 2] | 0;
 i6 = HEAP32[i2 + 4 >> 2] | 0;
 i2 = i3 + (i6 >> 1) | 0;
 if (i6 & 1) i1 = HEAP32[(HEAP32[i2 >> 2] | 0) + i1 >> 2] | 0;
 FUNCTION_TABLE_vii[i1 & 31](i5, i2);
 __THREW__ = 0;
 i1 = invoke_ii(12, 12) | 0;
 i6 = __THREW__;
 __THREW__ = 0;
 if (!(i6 & 1)) {
  HEAP32[i1 >> 2] = HEAP32[i5 >> 2];
  HEAP32[i1 + 4 >> 2] = HEAP32[i5 + 4 >> 2];
  HEAP32[i1 + 8 >> 2] = HEAP32[i5 + 8 >> 2];
  STACKTOP = i4;
  return i1 | 0;
 }
 i3 = ___cxa_find_matching_catch() | 0;
 i4 = HEAP32[i5 >> 2] | 0;
 if (!i4) ___resumeException(i3 | 0);
 i1 = i5 + 4 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
 __ZdlPv(i4);
 ___resumeException(i3 | 0);
 return 0;
}

function ___fwritex(i3, i4, i6) {
 i3 = i3 | 0;
 i4 = i4 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i5 = 0, i7 = 0;
 i1 = i6 + 16 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if (!i2) if (!(___towrite(i6) | 0)) {
  i2 = HEAP32[i1 >> 2] | 0;
  i5 = 4;
 } else i1 = 0; else i5 = 4;
 L4 : do if ((i5 | 0) == 4) {
  i7 = i6 + 20 | 0;
  i5 = HEAP32[i7 >> 2] | 0;
  if ((i2 - i5 | 0) >>> 0 < i4 >>> 0) {
   i1 = FUNCTION_TABLE_iiii[HEAP32[i6 + 36 >> 2] & 31](i6, i3, i4) | 0;
   break;
  }
  L9 : do if ((HEAP8[i6 + 75 >> 0] | 0) > -1) {
   i1 = i4;
   while (1) {
    if (!i1) {
     i2 = i5;
     i1 = 0;
     break L9;
    }
    i2 = i1 + -1 | 0;
    if ((HEAP8[i3 + i2 >> 0] | 0) == 10) break; else i1 = i2;
   }
   if ((FUNCTION_TABLE_iiii[HEAP32[i6 + 36 >> 2] & 31](i6, i3, i1) | 0) >>> 0 < i1 >>> 0) break L4;
   i4 = i4 - i1 | 0;
   i3 = i3 + i1 | 0;
   i2 = HEAP32[i7 >> 2] | 0;
  } else {
   i2 = i5;
   i1 = 0;
  } while (0);
  _memcpy(i2 | 0, i3 | 0, i4 | 0) | 0;
  HEAP32[i7 >> 2] = (HEAP32[i7 >> 2] | 0) + i4;
  i1 = i1 + i4 | 0;
 } while (0);
 return i1 | 0;
}

function __ZN10emscripten8internal13MethodInvokerIM14classificationFNSt3__16vectorIiNS3_9allocatorIiEEEEvES7_PS2_JEE6invokeERKS9_SA_(i2, i3) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i1 = 0, i4 = 0, i5 = 0, i6 = 0;
 i4 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i5 = i4;
 i1 = HEAP32[i2 >> 2] | 0;
 i6 = HEAP32[i2 + 4 >> 2] | 0;
 i2 = i3 + (i6 >> 1) | 0;
 if (i6 & 1) i1 = HEAP32[(HEAP32[i2 >> 2] | 0) + i1 >> 2] | 0;
 FUNCTION_TABLE_vii[i1 & 31](i5, i2);
 __THREW__ = 0;
 i1 = invoke_ii(12, 12) | 0;
 i6 = __THREW__;
 __THREW__ = 0;
 if (!(i6 & 1)) {
  HEAP32[i1 >> 2] = HEAP32[i5 >> 2];
  HEAP32[i1 + 4 >> 2] = HEAP32[i5 + 4 >> 2];
  HEAP32[i1 + 8 >> 2] = HEAP32[i5 + 8 >> 2];
  STACKTOP = i4;
  return i1 | 0;
 }
 i3 = ___cxa_find_matching_catch() | 0;
 i4 = HEAP32[i5 >> 2] | 0;
 if (!i4) ___resumeException(i3 | 0);
 i1 = i5 + 4 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -4 - i4 | 0) >>> 2) << 2);
 __ZdlPv(i4);
 ___resumeException(i3 | 0);
 return 0;
}

function __ZNK6LIBSVM6Kernel13kernel_linearEii(i2, i3, i6) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i6 = i6 | 0;
 var d1 = 0.0, i4 = 0, i5 = 0;
 i4 = HEAP32[i2 + 12 >> 2] | 0;
 i2 = HEAP32[i4 + (i3 << 2) >> 2] | 0;
 i5 = HEAP32[i2 >> 2] | 0;
 if ((i5 | 0) == -1) {
  d1 = 0.0;
  return +d1;
 }
 i3 = HEAP32[i4 + (i6 << 2) >> 2] | 0;
 d1 = 0.0;
 L4 : while (1) {
  L6 : while (1) {
   i4 = HEAP32[i3 >> 2] | 0;
   if ((i4 | 0) == -1) {
    i2 = 10;
    break L4;
   }
   while (1) {
    if ((i5 | 0) == (i4 | 0)) break L6;
    if ((i5 | 0) <= (i4 | 0)) break;
    i3 = i3 + 16 | 0;
    i4 = HEAP32[i3 >> 2] | 0;
    if ((i4 | 0) == -1) {
     i2 = 10;
     break L4;
    }
   }
   i2 = i2 + 16 | 0;
   i4 = HEAP32[i2 >> 2] | 0;
   if ((i4 | 0) == -1) {
    i2 = 10;
    break L4;
   } else i5 = i4;
  }
  d1 = d1 + +HEAPF64[i2 + 8 >> 3] * +HEAPF64[i3 + 8 >> 3];
  i2 = i2 + 16 | 0;
  i5 = HEAP32[i2 >> 2] | 0;
  if ((i5 | 0) == -1) {
   i2 = 10;
   break;
  } else i3 = i3 + 16 | 0;
 }
 if ((i2 | 0) == 10) return +d1;
 return +(0.0);
}

function __ZNK6LIBSVM5SVC_Q5get_QEii(i11, i9, i10) {
 i11 = i11 | 0;
 i9 = i9 | 0;
 i10 = i10 | 0;
 var i1 = 0, i2 = 0, d3 = 0.0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0, i12 = 0, i13 = 0;
 i12 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i8 = i12;
 i1 = __ZN6LIBSVM5Cache8get_dataEiPPfi(HEAP32[i11 + 52 >> 2] | 0, i9, i8, i10) | 0;
 if ((i1 | 0) >= (i10 | 0)) {
  i11 = HEAP32[i8 >> 2] | 0;
  STACKTOP = i12;
  return i11 | 0;
 }
 i5 = i11 + 48 | 0;
 i6 = i11 + 4 | 0;
 i7 = HEAP32[i8 >> 2] | 0;
 do {
  i2 = HEAP32[i5 >> 2] | 0;
  d3 = +(Math_imul(HEAP8[i2 + i1 >> 0] | 0, HEAP8[i2 + i9 >> 0] | 0) | 0);
  i2 = HEAP32[i6 >> 2] | 0;
  i13 = HEAP32[i6 + 4 >> 2] | 0;
  i4 = i11 + (i13 >> 1) | 0;
  if (i13 & 1) i2 = HEAP32[(HEAP32[i4 >> 2] | 0) + i2 >> 2] | 0;
  d3 = d3 * +FUNCTION_TABLE_diii[i2 & 15](i4, i9, i1);
  HEAPF32[i7 + (i1 << 2) >> 2] = d3;
  i1 = i1 + 1 | 0;
 } while ((i1 | 0) != (i10 | 0));
 i13 = HEAP32[i8 >> 2] | 0;
 STACKTOP = i12;
 return i13 | 0;
}

function __ZN10emscripten15register_vectorI15trainingExampleEENS_6class_INSt3__16vectorIT_NS3_9allocatorIS5_EEEENS_8internal11NoBaseClassEEEPKc(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 __embind_register_class(80, 360, 376, 0, 3369, 27, 3372, 0, 3372, 0, i2 | 0, 3374, 49);
 __embind_register_class_constructor(80, 1, 1568, 3369, 28, 6);
 i2 = __Znwj(8) | 0;
 HEAP32[i2 >> 2] = 19;
 HEAP32[i2 + 4 >> 2] = 0;
 __embind_register_class_function(80, 4045, 3, 1572, 3674, 13, i2 | 0, 0);
 i2 = __Znwj(8) | 0;
 HEAP32[i2 >> 2] = 14;
 HEAP32[i2 + 4 >> 2] = 0;
 __embind_register_class_function(80, 4055, 4, 1584, 3978, 6, i2 | 0, 0);
 i2 = __Znwj(8) | 0;
 HEAP32[i2 >> 2] = 29;
 HEAP32[i2 + 4 >> 2] = 0;
 __embind_register_class_function(80, 4062, 2, 1600, 3535, 12, i2 | 0, 0);
 i2 = __Znwj(4) | 0;
 HEAP32[i2 >> 2] = 13;
 __embind_register_class_function(80, 4067, 3, 1608, 3530, 23, i2 | 0, 0);
 i2 = __Znwj(4) | 0;
 HEAP32[i2 >> 2] = 24;
 __embind_register_class_function(80, 4071, 4, 1620, 4075, 4, i2 | 0, 0);
 return;
}

function __ZN10emscripten3valC2IRK15trainingExampleEEOT_(i2, i3) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i1 = 0, i4 = 0, i5 = 0, i6 = 0;
 i4 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i1 = i4;
 i5 = __Znwj(24) | 0;
 __THREW__ = 0;
 invoke_vii(8, i5 | 0, i3 | 0);
 i6 = __THREW__;
 __THREW__ = 0;
 if (i6 & 1) {
  i6 = ___cxa_find_matching_catch() | 0;
  __ZdlPv(i5);
  ___resumeException(i6 | 0);
 }
 __THREW__ = 0;
 invoke_vii(8, i5 + 12 | 0, i3 + 12 | 0);
 i6 = __THREW__;
 __THREW__ = 0;
 if (!(i6 & 1)) {
  HEAP32[i1 >> 2] = i5;
  i6 = __emval_take_value(320, i1 | 0) | 0;
  HEAP32[i2 >> 2] = i6;
  STACKTOP = i4;
  return;
 }
 i3 = ___cxa_find_matching_catch() | 0;
 i4 = HEAP32[i5 >> 2] | 0;
 if (!i4) {
  i6 = i3;
  __ZdlPv(i5);
  ___resumeException(i6 | 0);
 }
 i1 = i5 + 4 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) != (i4 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i4 | 0) >>> 3) << 3);
 __ZdlPv(i4);
 i6 = i3;
 __ZdlPv(i5);
 ___resumeException(i6 | 0);
}

function __ZN8modelSetD2Ev(i5) {
 i5 = i5 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i6 = 0, i7 = 0;
 HEAP32[i5 >> 2] = 1256;
 i6 = i5 + 4 | 0;
 i2 = HEAP32[i6 >> 2] | 0;
 i7 = i5 + 8 | 0;
 i1 = HEAP32[i7 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) do {
  i3 = HEAP32[i2 >> 2] | 0;
  if (i3) {
   FUNCTION_TABLE_vi[HEAP32[(HEAP32[i3 >> 2] | 0) + 4 >> 2] & 63](i3);
   i1 = HEAP32[i7 >> 2] | 0;
  }
  i2 = i2 + 4 | 0;
 } while ((i2 | 0) != (i1 | 0));
 i4 = i5 + 20 | 0;
 i1 = HEAP32[i4 >> 2] | 0;
 if (i1) {
  i3 = i5 + 24 | 0;
  i2 = HEAP32[i3 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i5 = i2 + -12 | 0;
    HEAP32[i3 >> 2] = i5;
    __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i5);
    i2 = HEAP32[i3 >> 2] | 0;
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i4 >> 2] | 0;
  }
  __ZdlPv(i1);
 }
 i1 = HEAP32[i6 >> 2] | 0;
 if (!i1) return;
 i2 = HEAP32[i7 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) HEAP32[i7 >> 2] = i2 + (~((i2 + -4 - i1 | 0) >>> 2) << 2);
 __ZdlPv(i1);
 return;
}

function __ZN10emscripten15register_vectorIdEENS_6class_INSt3__16vectorIT_NS2_9allocatorIS4_EEEENS_8internal11NoBaseClassEEEPKc(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 __embind_register_class(128, 400, 416, 0, 3369, 24, 3372, 0, 3372, 0, i2 | 0, 3374, 48);
 __embind_register_class_constructor(128, 1, 1636, 3369, 25, 5);
 i2 = __Znwj(8) | 0;
 HEAP32[i2 >> 2] = 18;
 HEAP32[i2 + 4 >> 2] = 0;
 __embind_register_class_function(128, 4045, 3, 1640, 4211, 1, i2 | 0, 0);
 i2 = __Znwj(8) | 0;
 HEAP32[i2 >> 2] = 12;
 HEAP32[i2 + 4 >> 2] = 0;
 __embind_register_class_function(128, 4055, 4, 1652, 4216, 1, i2 | 0, 0);
 i2 = __Znwj(8) | 0;
 HEAP32[i2 >> 2] = 26;
 HEAP32[i2 + 4 >> 2] = 0;
 __embind_register_class_function(128, 4062, 2, 1668, 3535, 10, i2 | 0, 0);
 i2 = __Znwj(4) | 0;
 HEAP32[i2 >> 2] = 11;
 __embind_register_class_function(128, 4067, 3, 1676, 3530, 21, i2 | 0, 0);
 i2 = __Znwj(4) | 0;
 HEAP32[i2 >> 2] = 22;
 __embind_register_class_function(128, 4071, 4, 1688, 4222, 1, i2 | 0, 0);
 return;
}

function __ZN10emscripten15register_vectorIiEENS_6class_INSt3__16vectorIT_NS2_9allocatorIS4_EEEENS_8internal11NoBaseClassEEEPKc(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 __embind_register_class(208, 432, 448, 0, 3369, 21, 3372, 0, 3372, 0, i2 | 0, 3374, 47);
 __embind_register_class_constructor(208, 1, 1704, 3369, 22, 4);
 i2 = __Znwj(8) | 0;
 HEAP32[i2 >> 2] = 17;
 HEAP32[i2 + 4 >> 2] = 0;
 __embind_register_class_function(208, 4045, 3, 1708, 3674, 10, i2 | 0, 0);
 i2 = __Znwj(8) | 0;
 HEAP32[i2 >> 2] = 11;
 HEAP32[i2 + 4 >> 2] = 0;
 __embind_register_class_function(208, 4055, 4, 1720, 3978, 5, i2 | 0, 0);
 i2 = __Znwj(8) | 0;
 HEAP32[i2 >> 2] = 23;
 HEAP32[i2 + 4 >> 2] = 0;
 __embind_register_class_function(208, 4062, 2, 1736, 3535, 8, i2 | 0, 0);
 i2 = __Znwj(4) | 0;
 HEAP32[i2 >> 2] = 9;
 __embind_register_class_function(208, 4067, 3, 1744, 3530, 19, i2 | 0, 0);
 i2 = __Znwj(4) | 0;
 HEAP32[i2 >> 2] = 20;
 __embind_register_class_function(208, 4071, 4, 1756, 4075, 3, i2 | 0, 0);
 return;
}

function __ZNK6LIBSVM6Kernel14kernel_sigmoidEii(i7, i2, i4) {
 i7 = i7 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var d1 = 0.0, i3 = 0, i5 = 0, d6 = 0.0;
 d6 = +HEAPF64[i7 + 32 >> 3];
 i3 = HEAP32[i7 + 12 >> 2] | 0;
 i2 = HEAP32[i3 + (i2 << 2) >> 2] | 0;
 i5 = HEAP32[i2 >> 2] | 0;
 L1 : do if ((i5 | 0) == -1) d1 = 0.0; else {
  i3 = HEAP32[i3 + (i4 << 2) >> 2] | 0;
  d1 = 0.0;
  while (1) {
   L5 : while (1) {
    i4 = HEAP32[i3 >> 2] | 0;
    if ((i4 | 0) == -1) break L1;
    while (1) {
     if ((i5 | 0) == (i4 | 0)) break L5;
     if ((i5 | 0) <= (i4 | 0)) break;
     i3 = i3 + 16 | 0;
     i4 = HEAP32[i3 >> 2] | 0;
     if ((i4 | 0) == -1) break L1;
    }
    i2 = i2 + 16 | 0;
    i4 = HEAP32[i2 >> 2] | 0;
    if ((i4 | 0) == -1) break L1; else i5 = i4;
   }
   d1 = d1 + +HEAPF64[i2 + 8 >> 3] * +HEAPF64[i3 + 8 >> 3];
   i2 = i2 + 16 | 0;
   i5 = HEAP32[i2 >> 2] | 0;
   if ((i5 | 0) == -1) break; else i3 = i3 + 16 | 0;
  }
 } while (0);
 return +(+_tanh(d6 * d1 + +HEAPF64[i7 + 40 >> 3]));
}

function __ZN56EmscriptenBindingInitializer_seriesClassification_moduleC2Ev(i1) {
 i1 = i1 | 0;
 __embind_register_class(664, 672, 688, 0, 3369, 38, 3372, 0, 3372, 0, 5461, 3374, 54);
 __embind_register_class_constructor(664, 1, 2092, 3369, 39, 8);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 19;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(664, 5485, 3, 2096, 3530, 27, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 20;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(664, 5500, 3, 2108, 3530, 28, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 55;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(664, 5506, 2, 2120, 5512, 24, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 21;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(664, 5516, 3, 2128, 3530, 29, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 25;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(664, 5531, 2, 2140, 3535, 22, i1 | 0, 0);
 return;
}

function __ZN10emscripten8internal14raw_destructorINSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEEEvPT_(i9) {
 i9 = i9 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0;
 if (!i9) return;
 i1 = HEAP32[i9 >> 2] | 0;
 if (i1) {
  i8 = i9 + 4 | 0;
  i2 = HEAP32[i8 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i6 = i2 + -24 | 0;
    HEAP32[i8 >> 2] = i6;
    i7 = HEAP32[i2 + -12 >> 2] | 0;
    i3 = i7;
    if (i7) {
     i4 = i2 + -8 | 0;
     i5 = HEAP32[i4 >> 2] | 0;
     if ((i5 | 0) != (i7 | 0)) HEAP32[i4 >> 2] = i5 + (~((i5 + -8 - i3 | 0) >>> 3) << 3);
     __ZdlPv(i7);
    }
    i4 = HEAP32[i6 >> 2] | 0;
    i5 = i4;
    if (i4) {
     i2 = i2 + -20 | 0;
     i3 = HEAP32[i2 >> 2] | 0;
     if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
     __ZdlPv(i4);
    }
    i2 = HEAP32[i8 >> 2] | 0;
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i9 >> 2] | 0;
  }
  __ZdlPv(i1);
 }
 __ZdlPv(i9);
 return;
}

function __ZN17svmClassificationC2Ei(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i3 = 0;
 HEAP32[i2 >> 2] = 1860;
 i3 = i2 + 128 | 0;
 HEAP32[i3 >> 2] = 0;
 HEAP32[i3 + 4 >> 2] = 0;
 HEAP32[i3 + 8 >> 2] = 0;
 HEAP32[i3 + 12 >> 2] = 0;
 HEAP32[i3 + 16 >> 2] = 0;
 HEAP32[i3 + 20 >> 2] = 0;
 HEAP32[i2 + 124 >> 2] = i1;
 HEAP32[i2 + 8 >> 2] = 0;
 HEAP32[i2 + 112 >> 2] = 0;
 HEAP32[i2 + 120 >> 2] = 0;
 HEAP32[i2 + 116 >> 2] = 0;
 HEAP8[i2 + 152 >> 0] = 0;
 HEAP8[i2 + 4 >> 0] = 0;
 HEAP32[i2 + 16 >> 2] = 0;
 HEAP32[i2 + 20 >> 2] = 1;
 HEAP32[i2 + 24 >> 2] = 3;
 i1 = i2 + 32 | 0;
 HEAP32[i1 >> 2] = 0;
 HEAP32[i1 + 4 >> 2] = 0;
 HEAP32[i1 + 8 >> 2] = 0;
 HEAP32[i1 + 12 >> 2] = 0;
 HEAPF64[i2 + 88 >> 3] = .5;
 HEAPF64[i2 + 48 >> 3] = 100.0;
 HEAPF64[i2 + 64 >> 3] = 1.0;
 HEAPF64[i2 + 56 >> 3] = .001;
 HEAPF64[i2 + 96 >> 3] = .1;
 HEAP32[i2 + 104 >> 2] = 1;
 HEAP32[i2 + 108 >> 2] = 1;
 HEAP32[i2 + 72 >> 2] = 0;
 HEAP32[i2 + 76 >> 2] = 0;
 HEAP32[i2 + 80 >> 2] = 0;
 return;
}

function __ZNSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEE10deallocateEv(i9) {
 i9 = i9 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i7 = 0, i8 = 0;
 i1 = HEAP32[i9 >> 2] | 0;
 if (!i1) return;
 i8 = i9 + 4 | 0;
 i2 = HEAP32[i8 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) {
  do {
   i6 = i2 + -24 | 0;
   HEAP32[i8 >> 2] = i6;
   i7 = HEAP32[i2 + -12 >> 2] | 0;
   i3 = i7;
   if (i7) {
    i4 = i2 + -8 | 0;
    i5 = HEAP32[i4 >> 2] | 0;
    if ((i5 | 0) != (i7 | 0)) HEAP32[i4 >> 2] = i5 + (~((i5 + -8 - i3 | 0) >>> 3) << 3);
    __ZdlPv(i7);
   }
   i4 = HEAP32[i6 >> 2] | 0;
   i5 = i4;
   if (i4) {
    i2 = i2 + -20 | 0;
    i3 = HEAP32[i2 >> 2] | 0;
    if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
    __ZdlPv(i4);
   }
   i2 = HEAP32[i8 >> 2] | 0;
  } while ((i2 | 0) != (i1 | 0));
  i1 = HEAP32[i9 >> 2] | 0;
 }
 __ZdlPv(i1);
 HEAP32[i9 + 8 >> 2] = 0;
 HEAP32[i8 >> 2] = 0;
 HEAP32[i9 >> 2] = 0;
 return;
}

function __ZN50EmscriptenBindingInitializer_classification_moduleC2Ev(i1) {
 i1 = i1 | 0;
 __embind_register_class(464, 480, 496, 8, 3369, 30, 3369, 31, 3369, 32, 4395, 3374, 52);
 __embind_register_class_constructor(464, 1, 1792, 3369, 33, 7);
 __embind_register_class_constructor(464, 2, 1796, 3535, 14, 34);
 __embind_register_class_constructor(464, 3, 1804, 3530, 25, 15);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 8;
 HEAP32[i1 + 4 >> 2] = 1;
 __embind_register_class_function(464, 5500, 3, 1816, 3530, 26, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 20;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(464, 4413, 2, 1828, 3535, 16, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 15;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(464, 4418, 4, 1836, 3978, 7, i1 | 0, 0);
 __embind_register_enum(512, 4423, 4, 0);
 __embind_register_enum_value(512, 4443, 0);
 __embind_register_enum_value(512, 4447, 1);
 return;
}

function __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(i2, i5, i3, i1, i4) {
 i2 = i2 | 0;
 i5 = i5 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 HEAP8[i5 + 53 >> 0] = 1;
 do if ((HEAP32[i5 + 4 >> 2] | 0) == (i1 | 0)) {
  HEAP8[i5 + 52 >> 0] = 1;
  i1 = i5 + 16 | 0;
  i2 = HEAP32[i1 >> 2] | 0;
  if (!i2) {
   HEAP32[i1 >> 2] = i3;
   HEAP32[i5 + 24 >> 2] = i4;
   HEAP32[i5 + 36 >> 2] = 1;
   if (!((i4 | 0) == 1 ? (HEAP32[i5 + 48 >> 2] | 0) == 1 : 0)) break;
   HEAP8[i5 + 54 >> 0] = 1;
   break;
  }
  if ((i2 | 0) != (i3 | 0)) {
   i4 = i5 + 36 | 0;
   HEAP32[i4 >> 2] = (HEAP32[i4 >> 2] | 0) + 1;
   HEAP8[i5 + 54 >> 0] = 1;
   break;
  }
  i2 = i5 + 24 | 0;
  i1 = HEAP32[i2 >> 2] | 0;
  if ((i1 | 0) == 2) {
   HEAP32[i2 >> 2] = i4;
   i1 = i4;
  }
  if ((i1 | 0) == 1 ? (HEAP32[i5 + 48 >> 2] | 0) == 1 : 0) HEAP8[i5 + 54 >> 0] = 1;
 } while (0);
 return;
}

function __ZNK6LIBSVM5SVC_Q10swap_indexEii(i4, i2, i3) {
 i4 = i4 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i1 = 0, i5 = 0, i6 = 0, d7 = 0.0;
 __ZN6LIBSVM5Cache10swap_indexEii(HEAP32[i4 + 52 >> 2] | 0, i2, i3);
 i1 = HEAP32[i4 + 12 >> 2] | 0;
 i6 = i1 + (i2 << 2) | 0;
 i1 = i1 + (i3 << 2) | 0;
 i5 = HEAP32[i6 >> 2] | 0;
 HEAP32[i6 >> 2] = HEAP32[i1 >> 2];
 HEAP32[i1 >> 2] = i5;
 i1 = HEAP32[i4 + 16 >> 2] | 0;
 if (i1) {
  i5 = i1 + (i2 << 3) | 0;
  i6 = i1 + (i3 << 3) | 0;
  d7 = +HEAPF64[i5 >> 3];
  HEAPF64[i5 >> 3] = +HEAPF64[i6 >> 3];
  HEAPF64[i6 >> 3] = d7;
 }
 i6 = HEAP32[i4 + 48 >> 2] | 0;
 i1 = i6 + i2 | 0;
 i6 = i6 + i3 | 0;
 i5 = HEAP8[i1 >> 0] | 0;
 HEAP8[i1 >> 0] = HEAP8[i6 >> 0] | 0;
 HEAP8[i6 >> 0] = i5;
 i6 = HEAP32[i4 + 56 >> 2] | 0;
 i5 = i6 + (i2 << 3) | 0;
 i6 = i6 + (i3 << 3) | 0;
 d7 = +HEAPF64[i5 >> 3];
 HEAPF64[i5 >> 3] = +HEAPF64[i6 >> 3];
 HEAPF64[i6 >> 3] = d7;
 return;
}

function __ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv(i6, i1, i4) {
 i6 = i6 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 var i2 = 0, i3 = 0, i5 = 0, i7 = 0;
 i7 = STACKTOP;
 STACKTOP = STACKTOP + 64 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i5 = i7;
 if ((i6 | 0) != (i1 | 0)) if ((i1 | 0) != 0 ? (i3 = ___dynamic_cast(i1, 1e3, 1016, 0) | 0, (i3 | 0) != 0) : 0) {
  i1 = i5;
  i2 = i1 + 56 | 0;
  do {
   HEAP32[i1 >> 2] = 0;
   i1 = i1 + 4 | 0;
  } while ((i1 | 0) < (i2 | 0));
  HEAP32[i5 >> 2] = i3;
  HEAP32[i5 + 8 >> 2] = i6;
  HEAP32[i5 + 12 >> 2] = -1;
  HEAP32[i5 + 48 >> 2] = 1;
  FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i3 >> 2] | 0) + 28 >> 2] & 15](i3, i5, HEAP32[i4 >> 2] | 0, 1);
  if ((HEAP32[i5 + 24 >> 2] | 0) == 1) {
   HEAP32[i4 >> 2] = HEAP32[i5 + 16 >> 2];
   i1 = 1;
  } else i1 = 0;
 } else i1 = 0; else i1 = 1;
 STACKTOP = i7;
 return i1 | 0;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEjjjjjj(i10, i9, i1, i4, i7, i8, i6) {
 i10 = i10 | 0;
 i9 = i9 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 i7 = i7 | 0;
 i8 = i8 | 0;
 i6 = i6 | 0;
 var i2 = 0, i3 = 0, i5 = 0;
 if ((-17 - i9 | 0) >>> 0 < i1 >>> 0) __ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv(i10);
 if (!(HEAP8[i10 >> 0] & 1)) i5 = i10 + 1 | 0; else i5 = HEAP32[i10 + 8 >> 2] | 0;
 if (i9 >>> 0 < 2147483623) {
  i2 = i1 + i9 | 0;
  i3 = i9 << 1;
  i2 = i2 >>> 0 < i3 >>> 0 ? i3 : i2;
  i2 = i2 >>> 0 < 11 ? 11 : i2 + 16 & -16;
 } else i2 = -17;
 i3 = __Znwj(i2) | 0;
 if (i7) _memcpy(i3 | 0, i5 | 0, i7 | 0) | 0;
 i1 = i4 - i8 | 0;
 if ((i1 | 0) != (i7 | 0)) _memcpy(i3 + (i6 + i7) | 0, i5 + (i8 + i7) | 0, i1 - i7 | 0) | 0;
 if ((i9 | 0) != 10) __ZdlPv(i5);
 HEAP32[i10 + 8 >> 2] = i3;
 HEAP32[i10 >> 2] = i2 | 1;
 return;
}

function __ZNK10__cxxabiv121__vmi_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i1, i5, i4, i6) {
 i1 = i1 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 i6 = i6 | 0;
 var i2 = 0, i3 = 0;
 L1 : do if ((i1 | 0) != (HEAP32[i5 + 8 >> 2] | 0)) {
  i3 = HEAP32[i1 + 12 >> 2] | 0;
  i2 = i1 + 16 + (i3 << 3) | 0;
  __ZNK10__cxxabiv122__base_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i1 + 16 | 0, i5, i4, i6);
  if ((i3 | 0) > 1) {
   i3 = i5 + 54 | 0;
   i1 = i1 + 24 | 0;
   do {
    __ZNK10__cxxabiv122__base_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i1, i5, i4, i6);
    if (HEAP8[i3 >> 0] | 0) break L1;
    i1 = i1 + 8 | 0;
   } while (i1 >>> 0 < i2 >>> 0);
  }
 } else __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0, i5, i4, i6); while (0);
 return;
}

function __ZNK6LIBSVM11ONE_CLASS_Q5get_QEii(i9, i7, i8) {
 i9 = i9 | 0;
 i7 = i7 | 0;
 i8 = i8 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, i10 = 0, i11 = 0, d12 = 0.0;
 i10 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i6 = i10;
 i1 = __ZN6LIBSVM5Cache8get_dataEiPPfi(HEAP32[i9 + 48 >> 2] | 0, i7, i6, i8) | 0;
 if ((i1 | 0) >= (i8 | 0)) {
  i9 = HEAP32[i6 >> 2] | 0;
  STACKTOP = i10;
  return i9 | 0;
 }
 i4 = i9 + 4 | 0;
 i5 = HEAP32[i6 >> 2] | 0;
 do {
  i2 = HEAP32[i4 >> 2] | 0;
  i11 = HEAP32[i4 + 4 >> 2] | 0;
  i3 = i9 + (i11 >> 1) | 0;
  if (i11 & 1) i2 = HEAP32[(HEAP32[i3 >> 2] | 0) + i2 >> 2] | 0;
  d12 = +FUNCTION_TABLE_diii[i2 & 15](i3, i7, i1);
  HEAPF32[i5 + (i1 << 2) >> 2] = d12;
  i1 = i1 + 1 | 0;
 } while ((i1 | 0) != (i8 | 0));
 i11 = HEAP32[i6 >> 2] | 0;
 STACKTOP = i10;
 return i11 | 0;
}

function __ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i6, i4, i3, i5, i7) {
 i6 = i6 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 i7 = i7 | 0;
 var i1 = 0, i2 = 0;
 do if ((i6 | 0) == (HEAP32[i4 + 8 >> 2] | 0)) {
  if ((HEAP32[i4 + 4 >> 2] | 0) == (i3 | 0) ? (i2 = i4 + 28 | 0, (HEAP32[i2 >> 2] | 0) != 1) : 0) HEAP32[i2 >> 2] = i5;
 } else if ((i6 | 0) == (HEAP32[i4 >> 2] | 0)) {
  if ((HEAP32[i4 + 16 >> 2] | 0) != (i3 | 0) ? (i1 = i4 + 20 | 0, (HEAP32[i1 >> 2] | 0) != (i3 | 0)) : 0) {
   HEAP32[i4 + 32 >> 2] = i5;
   HEAP32[i1 >> 2] = i3;
   i7 = i4 + 40 | 0;
   HEAP32[i7 >> 2] = (HEAP32[i7 >> 2] | 0) + 1;
   if ((HEAP32[i4 + 36 >> 2] | 0) == 1 ? (HEAP32[i4 + 24 >> 2] | 0) == 2 : 0) HEAP8[i4 + 54 >> 0] = 1;
   HEAP32[i4 + 44 >> 2] = 4;
   break;
  }
  if ((i5 | 0) == 1) HEAP32[i4 + 32 >> 2] = 1;
 } while (0);
 return;
}

function __ZN17svmClassification3runERKNSt3__16vectorIdNS0_9allocatorIdEEEE(i7, i1) {
 i7 = i7 | 0;
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0, d8 = 0.0, i9 = 0;
 if (!(HEAP8[i7 + 152 >> 0] | 0)) {
  d8 = 0.0;
  return +d8;
 }
 i5 = HEAP32[i7 + 124 >> 2] | 0;
 i6 = i5 + 1 | 0;
 i6 = __Znaj(i6 >>> 0 > 268435455 ? -1 : i6 << 4) | 0;
 if ((i5 | 0) > 0) {
  i3 = HEAP32[i1 >> 2] | 0;
  i1 = HEAP32[i7 + 140 >> 2] | 0;
  i2 = HEAP32[i7 + 128 >> 2] | 0;
  i4 = 0;
  do {
   i9 = i4;
   i4 = i4 + 1 | 0;
   HEAP32[i6 + (i9 << 4) >> 2] = i4;
   HEAPF64[i6 + (i9 << 4) + 8 >> 3] = (+HEAPF64[i3 + (i9 << 3) >> 3] - +HEAPF64[i1 + (i9 << 3) >> 3]) / +HEAPF64[i2 + (i9 << 3) >> 3];
  } while ((i4 | 0) < (i5 | 0));
 }
 HEAP32[i6 + (i5 << 4) >> 2] = -1;
 HEAPF64[i6 + (i5 << 4) + 8 >> 3] = 0.0;
 d8 = +_svm_predict(HEAP32[i7 + 8 >> 2] | 0, i6);
 __ZdaPv(i6);
 return +d8;
}

function __ZNSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEE9push_backERKS1_(i3, i2) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i1 = 0, i4 = 0, i5 = 0;
 i1 = i3 + 4 | 0;
 i5 = HEAP32[i1 >> 2] | 0;
 if ((i5 | 0) == (HEAP32[i3 + 8 >> 2] | 0)) {
  __ZNSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEE21__push_back_slow_pathIRKS1_EEvOT_(i3, i2);
  return;
 }
 __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i5, i2);
 __THREW__ = 0;
 invoke_vii(8, i5 + 12 | 0, i2 + 12 | 0);
 i4 = __THREW__;
 __THREW__ = 0;
 if (!(i4 & 1)) {
  HEAP32[i1 >> 2] = (HEAP32[i1 >> 2] | 0) + 24;
  return;
 }
 i4 = ___cxa_find_matching_catch() | 0;
 i3 = HEAP32[i5 >> 2] | 0;
 if (!i3) ___resumeException(i4 | 0);
 i1 = i5 + 4 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i3 | 0) >>> 3) << 3);
 __ZdlPv(i3);
 ___resumeException(i4 | 0);
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEjc(i6, i5, i4) {
 i6 = i6 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i3 = 0;
 if (i5) {
  i1 = HEAP8[i6 >> 0] | 0;
  if (!(i1 & 1)) i2 = 10; else {
   i1 = HEAP32[i6 >> 2] | 0;
   i2 = (i1 & -2) + -1 | 0;
   i1 = i1 & 255;
  }
  if (!(i1 & 1)) i3 = (i1 & 255) >>> 1; else i3 = HEAP32[i6 + 4 >> 2] | 0;
  if ((i2 - i3 | 0) >>> 0 < i5 >>> 0) {
   __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEjjjjjj(i6, i2, i5 - i2 + i3 | 0, i3, i3, 0, 0);
   i1 = HEAP8[i6 >> 0] | 0;
  }
  if (!(i1 & 1)) i2 = i6 + 1 | 0; else i2 = HEAP32[i6 + 8 >> 2] | 0;
  _memset(i2 + i3 | 0, i4 | 0, i5 | 0) | 0;
  i1 = i3 + i5 | 0;
  if (!(HEAP8[i6 >> 0] & 1)) HEAP8[i6 >> 0] = i1 << 1; else HEAP32[i6 + 4 >> 2] = i1;
  HEAP8[i2 + i1 >> 0] = 0;
 }
 return i6 | 0;
}

function _wcrtomb(i1, i3, i2) {
 i1 = i1 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 do if (i1) {
  if (i3 >>> 0 < 128) {
   HEAP8[i1 >> 0] = i3;
   i1 = 1;
   break;
  }
  if (i3 >>> 0 < 2048) {
   HEAP8[i1 >> 0] = i3 >>> 6 | 192;
   HEAP8[i1 + 1 >> 0] = i3 & 63 | 128;
   i1 = 2;
   break;
  }
  if (i3 >>> 0 < 55296 | (i3 & -8192 | 0) == 57344) {
   HEAP8[i1 >> 0] = i3 >>> 12 | 224;
   HEAP8[i1 + 1 >> 0] = i3 >>> 6 & 63 | 128;
   HEAP8[i1 + 2 >> 0] = i3 & 63 | 128;
   i1 = 3;
   break;
  }
  if ((i3 + -65536 | 0) >>> 0 < 1048576) {
   HEAP8[i1 >> 0] = i3 >>> 18 | 240;
   HEAP8[i1 + 1 >> 0] = i3 >>> 12 & 63 | 128;
   HEAP8[i1 + 2 >> 0] = i3 >>> 6 & 63 | 128;
   HEAP8[i1 + 3 >> 0] = i3 & 63 | 128;
   i1 = 4;
   break;
  } else {
   i1 = ___errno_location() | 0;
   HEAP32[i1 >> 2] = 84;
   i1 = -1;
   break;
  }
 } else i1 = 1; while (0);
 return i1 | 0;
}

function __ZN10emscripten8internal15FunctionInvokerIPFNS_3valERKNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEjES2_SA_JjEE6invokeEPSC_PS8_j(i2, i3, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 i1 = FUNCTION_TABLE_iii[HEAP32[i2 >> 2] & 31](i3, i1) | 0;
 __THREW__ = 0;
 invoke_vi(50, i1 | 0);
 i3 = __THREW__;
 __THREW__ = 0;
 if (i3 & 1) {
  i2 = ___cxa_find_matching_catch() | 0;
  __THREW__ = 0;
  invoke_vi(51, i1 | 0);
  i3 = __THREW__;
  __THREW__ = 0;
  if (i3 & 1) {
   i3 = ___cxa_find_matching_catch(0) | 0;
   ___clang_call_terminate(i3);
  } else ___resumeException(i2 | 0);
 } else {
  __THREW__ = 0;
  invoke_vi(51, i1 | 0);
  i3 = __THREW__;
  __THREW__ = 0;
  if (i3 & 1) {
   i3 = ___cxa_find_matching_catch(0) | 0;
   ___clang_call_terminate(i3);
  } else return i1 | 0;
 }
 return 0;
}

function __ZN6LIBSVM5SVR_QD2Ev(i4) {
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i3 = 0;
 HEAP32[i4 >> 2] = 2016;
 i2 = HEAP32[i4 + 52 >> 2] | 0;
 if (i2) {
  i3 = i2 + 12 | 0;
  i1 = HEAP32[i2 + 16 >> 2] | 0;
  if ((i1 | 0) != (i3 | 0)) do {
   _free(HEAP32[i1 + 8 >> 2] | 0);
   i1 = HEAP32[i1 + 4 >> 2] | 0;
  } while ((i1 | 0) != (i3 | 0));
  _free(HEAP32[i2 + 8 >> 2] | 0);
  __ZdlPv(i2);
 }
 i1 = HEAP32[i4 + 56 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i4 + 60 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i4 + 68 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i4 + 72 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i4 + 76 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 HEAP32[i4 >> 2] = 1928;
 i1 = HEAP32[i4 + 12 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i4 + 16 >> 2] | 0;
 if (!i1) return;
 __ZdaPv(i1);
 return;
}

function ___overflow(i8, i6) {
 i8 = i8 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i7 = 0, i9 = 0;
 i9 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i7 = i9;
 i5 = i6 & 255;
 HEAP8[i7 >> 0] = i5;
 i2 = i8 + 16 | 0;
 i3 = HEAP32[i2 >> 2] | 0;
 if (!i3) if (!(___towrite(i8) | 0)) {
  i3 = HEAP32[i2 >> 2] | 0;
  i4 = 4;
 } else i1 = -1; else i4 = 4;
 do if ((i4 | 0) == 4) {
  i2 = i8 + 20 | 0;
  i4 = HEAP32[i2 >> 2] | 0;
  if (i4 >>> 0 < i3 >>> 0 ? (i1 = i6 & 255, (i1 | 0) != (HEAP8[i8 + 75 >> 0] | 0)) : 0) {
   HEAP32[i2 >> 2] = i4 + 1;
   HEAP8[i4 >> 0] = i5;
   break;
  }
  if ((FUNCTION_TABLE_iiii[HEAP32[i8 + 36 >> 2] & 31](i8, i7, 1) | 0) == 1) i1 = HEAPU8[i7 >> 0] | 0; else i1 = -1;
 } while (0);
 STACKTOP = i9;
 return i1 | 0;
}

function __ZN10emscripten8internal12VectorAccessINSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEE3setERS7_jRKS4_(i1, i3, i4) {
 i1 = i1 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i2 = 0;
 i1 = HEAP32[i1 >> 2] | 0;
 i2 = i1 + (i3 * 24 | 0) | 0;
 if ((i2 | 0) == (i4 | 0)) return 1;
 __ZNSt3__16vectorIdNS_9allocatorIdEEE6assignIPdEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIdNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(i2, HEAP32[i4 >> 2] | 0, HEAP32[i4 + 4 >> 2] | 0);
 __ZNSt3__16vectorIdNS_9allocatorIdEEE6assignIPdEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIdNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(i1 + (i3 * 24 | 0) + 12 | 0, HEAP32[i4 + 12 >> 2] | 0, HEAP32[i4 + 16 >> 2] | 0);
 return 1;
}

function _fmin(d1, d6) {
 d1 = +d1;
 d6 = +d6;
 var i2 = 0, i3 = 0, i4 = 0, i5 = 0, i7 = 0;
 HEAPF64[tempDoublePtr >> 3] = d1;
 i2 = HEAP32[tempDoublePtr >> 2] | 0;
 i3 = HEAP32[tempDoublePtr + 4 >> 2] | 0;
 i5 = i3 & 2147483647;
 do if (!(i5 >>> 0 > 2146435072 | (i5 | 0) == 2146435072 & i2 >>> 0 > 0)) {
  HEAPF64[tempDoublePtr >> 3] = d6;
  i4 = HEAP32[tempDoublePtr >> 2] | 0;
  i5 = HEAP32[tempDoublePtr + 4 >> 2] | 0;
  i7 = i5 & 2147483647;
  if (!(i7 >>> 0 > 2146435072 | (i7 | 0) == 2146435072 & i4 >>> 0 > 0)) {
   i2 = _bitshift64Lshr(i2 | 0, i3 | 0, 63) | 0;
   i7 = _bitshift64Lshr(i4 | 0, i5 | 0, 63) | 0;
   if ((i2 | 0) == (i7 | 0)) {
    d1 = d1 < d6 ? d1 : d6;
    break;
   } else {
    d1 = (i3 | 0) < 0 ? d1 : d6;
    break;
   }
  }
 } else d1 = d6; while (0);
 return +d1;
}

function __ZN10emscripten8internal15FunctionInvokerIPFNS_3valERKNSt3__16vectorIiNS3_9allocatorIiEEEEjES2_S9_JjEE6invokeEPSB_PS7_j(i2, i3, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 i1 = FUNCTION_TABLE_iii[HEAP32[i2 >> 2] & 31](i3, i1) | 0;
 __THREW__ = 0;
 invoke_vi(50, i1 | 0);
 i3 = __THREW__;
 __THREW__ = 0;
 if (i3 & 1) {
  i2 = ___cxa_find_matching_catch() | 0;
  __THREW__ = 0;
  invoke_vi(51, i1 | 0);
  i3 = __THREW__;
  __THREW__ = 0;
  if (i3 & 1) {
   i3 = ___cxa_find_matching_catch(0) | 0;
   ___clang_call_terminate(i3);
  } else ___resumeException(i2 | 0);
 } else {
  __THREW__ = 0;
  invoke_vi(51, i1 | 0);
  i3 = __THREW__;
  __THREW__ = 0;
  if (i3 & 1) {
   i3 = ___cxa_find_matching_catch(0) | 0;
   ___clang_call_terminate(i3);
  } else return i1 | 0;
 }
 return 0;
}

function __ZN10emscripten8internal15FunctionInvokerIPFNS_3valERKNSt3__16vectorIdNS3_9allocatorIdEEEEjES2_S9_JjEE6invokeEPSB_PS7_j(i2, i3, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 i1 = FUNCTION_TABLE_iii[HEAP32[i2 >> 2] & 31](i3, i1) | 0;
 __THREW__ = 0;
 invoke_vi(50, i1 | 0);
 i3 = __THREW__;
 __THREW__ = 0;
 if (i3 & 1) {
  i2 = ___cxa_find_matching_catch() | 0;
  __THREW__ = 0;
  invoke_vi(51, i1 | 0);
  i3 = __THREW__;
  __THREW__ = 0;
  if (i3 & 1) {
   i3 = ___cxa_find_matching_catch(0) | 0;
   ___clang_call_terminate(i3);
  } else ___resumeException(i2 | 0);
 } else {
  __THREW__ = 0;
  invoke_vi(51, i1 | 0);
  i3 = __THREW__;
  __THREW__ = 0;
  if (i3 & 1) {
   i3 = ___cxa_find_matching_catch(0) | 0;
   ___clang_call_terminate(i3);
  } else return i1 | 0;
 }
 return 0;
}

function __ZN20seriesClassification5trainERKNSt3__16vectorINS1_INS1_IdNS0_9allocatorIdEEEENS2_IS4_EEEENS2_IS6_EEEE(i5, i4) {
 i5 = i5 | 0;
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i6 = 0;
 i2 = HEAP32[i5 >> 2] | 0;
 i3 = i5 + 4 | 0;
 i1 = HEAP32[i3 >> 2] | 0;
 if ((i1 | 0) != (i2 | 0)) do {
  i6 = i1 + -16 | 0;
  HEAP32[i3 >> 2] = i6;
  __ZN3dtwD2Ev(i6);
  i1 = HEAP32[i3 >> 2] | 0;
 } while ((i1 | 0) != (i2 | 0));
 i3 = i4 + 4 | 0;
 i1 = HEAP32[i4 >> 2] | 0;
 if ((HEAP32[i3 >> 2] | 0) == (i1 | 0)) return 1; else i2 = 0;
 do {
  __ZN20seriesClassification9addSeriesERKNSt3__16vectorINS1_IdNS0_9allocatorIdEEEENS2_IS4_EEEE(i5, i1 + (i2 * 12 | 0) | 0) | 0;
  i2 = i2 + 1 | 0;
  i1 = HEAP32[i4 >> 2] | 0;
 } while (i2 >>> 0 < (((HEAP32[i3 >> 2] | 0) - i1 | 0) / 12 | 0) >>> 0);
 return 1;
}

function _pad(i6, i2, i5, i4, i1) {
 i6 = i6 | 0;
 i2 = i2 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 i1 = i1 | 0;
 var i3 = 0, i7 = 0, i8 = 0;
 i8 = STACKTOP;
 STACKTOP = STACKTOP + 256 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i7 = i8;
 do if ((i5 | 0) > (i4 | 0) & (i1 & 73728 | 0) == 0) {
  i1 = i5 - i4 | 0;
  _memset(i7 | 0, i2 | 0, (i1 >>> 0 > 256 ? 256 : i1) | 0) | 0;
  i2 = HEAP32[i6 >> 2] | 0;
  i3 = (i2 & 32 | 0) == 0;
  if (i1 >>> 0 > 255) {
   i4 = i5 - i4 | 0;
   do {
    if (i3) {
     ___fwritex(i7, 256, i6) | 0;
     i2 = HEAP32[i6 >> 2] | 0;
    }
    i1 = i1 + -256 | 0;
    i3 = (i2 & 32 | 0) == 0;
   } while (i1 >>> 0 > 255);
   if (i3) i1 = i4 & 255; else break;
  } else if (!i3) break;
  ___fwritex(i7, i1, i6) | 0;
 } while (0);
 STACKTOP = i8;
 return;
}

function _fputc(i5, i6) {
 i5 = i5 | 0;
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i7 = 0;
 if ((HEAP32[i6 + 76 >> 2] | 0) >= 0 ? (___lockfile(i6) | 0) != 0 : 0) {
  if ((HEAP8[i6 + 75 >> 0] | 0) != (i5 | 0) ? (i2 = i6 + 20 | 0, i3 = HEAP32[i2 >> 2] | 0, i3 >>> 0 < (HEAP32[i6 + 16 >> 2] | 0) >>> 0) : 0) {
   HEAP32[i2 >> 2] = i3 + 1;
   HEAP8[i3 >> 0] = i5;
   i1 = i5 & 255;
  } else i1 = ___overflow(i6, i5) | 0;
  ___unlockfile(i6);
 } else i7 = 3;
 do if ((i7 | 0) == 3) {
  if ((HEAP8[i6 + 75 >> 0] | 0) != (i5 | 0) ? (i4 = i6 + 20 | 0, i1 = HEAP32[i4 >> 2] | 0, i1 >>> 0 < (HEAP32[i6 + 16 >> 2] | 0) >>> 0) : 0) {
   HEAP32[i4 >> 2] = i1 + 1;
   HEAP8[i1 >> 0] = i5;
   i1 = i5 & 255;
   break;
  }
  i1 = ___overflow(i6, i5) | 0;
 } while (0);
 return i1 | 0;
}

function __ZN11rapidStream15maxAccelerationEv(i2) {
 i2 = i2 | 0;
 var d1 = 0.0, i3 = 0, d4 = 0.0, i5 = 0, i6 = 0, d7 = 0.0, i8 = 0;
 i5 = HEAP32[i2 + 4 >> 2] | 0;
 i6 = HEAP32[i2 >> 2] | 0;
 i2 = HEAP32[i2 + 8 >> 2] | 0;
 if (i6 >>> 0 <= 2) {
  d4 = -1797693134862315708145274.0e284;
  return +d4;
 }
 i3 = 2;
 d4 = +HEAPF64[i2 + ((((i5 + 1 | 0) >>> 0) % (i6 >>> 0) | 0) << 3) >> 3] - +HEAPF64[i2 + (((i5 >>> 0) % (i6 >>> 0) | 0) << 3) >> 3];
 d1 = -1797693134862315708145274.0e284;
 do {
  i8 = i5 + i3 | 0;
  d7 = d4;
  d4 = +HEAPF64[i2 + (((i8 >>> 0) % (i6 >>> 0) | 0) << 3) >> 3] - +HEAPF64[i2 + ((((i8 + -1 | 0) >>> 0) % (i6 >>> 0) | 0) << 3) >> 3];
  d7 = d4 - d7;
  d1 = d7 > d1 ? d7 : d1;
  i3 = i3 + 1 | 0;
 } while (i3 >>> 0 < i6 >>> 0);
 return +d1;
}

function __ZNK6LIBSVM11ONE_CLASS_Q10swap_indexEii(i4, i2, i3) {
 i4 = i4 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i1 = 0, i5 = 0, i6 = 0, d7 = 0.0;
 __ZN6LIBSVM5Cache10swap_indexEii(HEAP32[i4 + 48 >> 2] | 0, i2, i3);
 i1 = HEAP32[i4 + 12 >> 2] | 0;
 i6 = i1 + (i2 << 2) | 0;
 i1 = i1 + (i3 << 2) | 0;
 i5 = HEAP32[i6 >> 2] | 0;
 HEAP32[i6 >> 2] = HEAP32[i1 >> 2];
 HEAP32[i1 >> 2] = i5;
 i1 = HEAP32[i4 + 16 >> 2] | 0;
 if (i1) {
  i5 = i1 + (i2 << 3) | 0;
  i6 = i1 + (i3 << 3) | 0;
  d7 = +HEAPF64[i5 >> 3];
  HEAPF64[i5 >> 3] = +HEAPF64[i6 >> 3];
  HEAPF64[i6 >> 3] = d7;
 }
 i6 = HEAP32[i4 + 52 >> 2] | 0;
 i5 = i6 + (i2 << 3) | 0;
 i6 = i6 + (i3 << 3) | 0;
 d7 = +HEAPF64[i5 >> 3];
 HEAPF64[i5 >> 3] = +HEAPF64[i6 >> 3];
 HEAPF64[i6 >> 3] = d7;
 return;
}

function ___remdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i8 = i5 | 0;
 i7 = i2 >> 31 | ((i2 | 0) < 0 ? -1 : 0) << 1;
 i6 = ((i2 | 0) < 0 ? -1 : 0) >> 31 | ((i2 | 0) < 0 ? -1 : 0) << 1;
 i10 = i4 >> 31 | ((i4 | 0) < 0 ? -1 : 0) << 1;
 i9 = ((i4 | 0) < 0 ? -1 : 0) >> 31 | ((i4 | 0) < 0 ? -1 : 0) << 1;
 i1 = _i64Subtract(i7 ^ i1, i6 ^ i2, i7, i6) | 0;
 i2 = tempRet0;
 ___udivmoddi4(i1, i2, _i64Subtract(i10 ^ i3, i9 ^ i4, i10, i9) | 0, tempRet0, i8) | 0;
 i4 = _i64Subtract(HEAP32[i8 >> 2] ^ i7, HEAP32[i8 + 4 >> 2] ^ i6, i7, i6) | 0;
 i3 = tempRet0;
 STACKTOP = i5;
 return (tempRet0 = i3, i4) | 0;
}

function _fflush(i2) {
 i2 = i2 | 0;
 var i1 = 0, i3 = 0;
 do if (i2) {
  if ((HEAP32[i2 + 76 >> 2] | 0) <= -1) {
   i1 = ___fflush_unlocked(i2) | 0;
   break;
  }
  i3 = (___lockfile(i2) | 0) == 0;
  i1 = ___fflush_unlocked(i2) | 0;
  if (!i3) ___unlockfile(i2);
 } else {
  if (!(HEAP32[621] | 0)) i1 = 0; else i1 = _fflush(HEAP32[621] | 0) | 0;
  ___lock(2460);
  i2 = HEAP32[614] | 0;
  if (i2) do {
   if ((HEAP32[i2 + 76 >> 2] | 0) > -1) i3 = ___lockfile(i2) | 0; else i3 = 0;
   if ((HEAP32[i2 + 20 >> 2] | 0) >>> 0 > (HEAP32[i2 + 28 >> 2] | 0) >>> 0) i1 = ___fflush_unlocked(i2) | 0 | i1;
   if (i3) ___unlockfile(i2);
   i2 = HEAP32[i2 + 56 >> 2] | 0;
  } while ((i2 | 0) != 0);
  ___unlock(2460);
 } while (0);
 return i1 | 0;
}

function __ZN11rapidStream17standardDeviationEv(i6) {
 i6 = i6 | 0;
 var d1 = 0.0, d2 = 0.0, i3 = 0, i4 = 0, i5 = 0, i7 = 0, d8 = 0.0;
 i7 = HEAP32[i6 >> 2] | 0;
 i5 = (i7 | 0) == 0;
 if (!i5) {
  i3 = HEAP32[i6 + 8 >> 2] | 0;
  i4 = 0;
  d1 = 0.0;
  do {
   d1 = d1 + +HEAPF64[i3 + (i4 << 3) >> 3];
   i4 = i4 + 1 | 0;
  } while ((i4 | 0) != (i7 | 0));
  d2 = d1 / +(i7 >>> 0);
  if (!i5) {
   i3 = HEAP32[i6 + 8 >> 2] | 0;
   i4 = 0;
   d1 = 0.0;
   do {
    d8 = +HEAPF64[i3 + (i4 << 3) >> 3] - d2;
    d1 = d1 + d8 * d8;
    i4 = i4 + 1 | 0;
   } while (i4 >>> 0 < i7 >>> 0);
   d2 = +(i7 >>> 0);
  } else {
   d2 = 0.0;
   d1 = 0.0;
  }
 } else {
  d2 = 0.0;
  d1 = 0.0;
 }
 return +(+Math_sqrt(+(d1 / d2)));
}

function __ZN10emscripten8internal12operator_newI10regressionJNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEEEEPT_DpOT0_(i2) {
 i2 = i2 | 0;
 var i1 = 0, i3 = 0;
 i1 = __Znwj(40) | 0;
 __THREW__ = 0;
 invoke_vi(43, i1 | 0);
 i3 = __THREW__;
 __THREW__ = 0;
 if (i3 & 1) {
  i3 = ___cxa_find_matching_catch() | 0;
  __ZdlPv(i1);
  ___resumeException(i3 | 0);
 }
 HEAP32[i1 >> 2] = 1436;
 HEAP32[i1 + 16 >> 2] = 0;
 HEAP32[i1 + 32 >> 2] = 0;
 HEAP8[i1 + 36 >> 0] = 0;
 __THREW__ = 0;
 invoke_iii(2, i1 | 0, i2 | 0) | 0;
 i3 = __THREW__;
 __THREW__ = 0;
 if (!(i3 & 1)) return i1 | 0;
 i3 = ___cxa_find_matching_catch() | 0;
 __ZN8modelSetD2Ev(i1);
 __ZdlPv(i1);
 ___resumeException(i3 | 0);
 return 0;
}

function __ZN11rapidStream15minAccelerationEv(i2) {
 i2 = i2 | 0;
 var d1 = 0.0, i3 = 0, d4 = 0.0, i5 = 0, i6 = 0, d7 = 0.0, i8 = 0;
 i5 = HEAP32[i2 + 4 >> 2] | 0;
 i6 = HEAP32[i2 >> 2] | 0;
 i2 = HEAP32[i2 + 8 >> 2] | 0;
 if (i6 >>> 0 <= 2) {
  d4 = inf;
  return +d4;
 }
 i3 = 2;
 d4 = +HEAPF64[i2 + ((((i5 + 1 | 0) >>> 0) % (i6 >>> 0) | 0) << 3) >> 3] - +HEAPF64[i2 + (((i5 >>> 0) % (i6 >>> 0) | 0) << 3) >> 3];
 d1 = inf;
 do {
  i8 = i5 + i3 | 0;
  d7 = d4;
  d4 = +HEAPF64[i2 + (((i8 >>> 0) % (i6 >>> 0) | 0) << 3) >> 3] - +HEAPF64[i2 + ((((i8 + -1 | 0) >>> 0) % (i6 >>> 0) | 0) << 3) >> 3];
  d7 = d4 - d7;
  d1 = d7 < d1 ? d7 : d1;
  i3 = i3 + 1 | 0;
 } while (i3 >>> 0 < i6 >>> 0);
 return +d1;
}

function __ZN10emscripten8internal14raw_destructorI20seriesClassificationEEvPT_(i5) {
 i5 = i5 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0;
 if (!i5) return;
 i1 = HEAP32[i5 + 12 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = i5 + 16 | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i1 = HEAP32[i5 >> 2] | 0;
 if (i1) {
  i3 = i5 + 4 | 0;
  i2 = HEAP32[i3 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) {
   do {
    i4 = i2 + -16 | 0;
    HEAP32[i3 >> 2] = i4;
    __ZN3dtwD2Ev(i4);
    i2 = HEAP32[i3 >> 2] | 0;
   } while ((i2 | 0) != (i1 | 0));
   i1 = HEAP32[i5 >> 2] | 0;
  }
  __ZdlPv(i1);
 }
 __ZdlPv(i5);
 return;
}

function _frexp(d1, i5) {
 d1 = +d1;
 i5 = i5 | 0;
 var i2 = 0, i3 = 0, i4 = 0;
 HEAPF64[tempDoublePtr >> 3] = d1;
 i2 = HEAP32[tempDoublePtr >> 2] | 0;
 i3 = HEAP32[tempDoublePtr + 4 >> 2] | 0;
 i4 = _bitshift64Lshr(i2 | 0, i3 | 0, 52) | 0;
 i4 = i4 & 2047;
 switch (i4 | 0) {
 case 0:
  {
   if (d1 != 0.0) {
    d1 = +_frexp(d1 * 18446744073709551616.0, i5);
    i2 = (HEAP32[i5 >> 2] | 0) + -64 | 0;
   } else i2 = 0;
   HEAP32[i5 >> 2] = i2;
   break;
  }
 case 2047:
  break;
 default:
  {
   HEAP32[i5 >> 2] = i4 + -1022;
   HEAP32[tempDoublePtr >> 2] = i2;
   HEAP32[tempDoublePtr + 4 >> 2] = i3 & -2146435073 | 1071644672;
   d1 = +HEAPF64[tempDoublePtr >> 3];
  }
 }
 return +d1;
}

function __ZSt11__terminatePFvvE(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 __THREW__ = 0;
 invoke_v(i1 | 0);
 i1 = __THREW__;
 __THREW__ = 0;
 if (!(i1 & 1)) {
  __THREW__ = 0;
  invoke_vii(29, 7905, i2 | 0);
  __THREW__ = 0;
 }
 i1 = ___cxa_find_matching_catch(0) | 0;
 ___cxa_begin_catch(i1 | 0) | 0;
 __THREW__ = 0;
 invoke_vii(29, 7945, i2 + 8 | 0);
 __THREW__ = 0;
 i1 = ___cxa_find_matching_catch(0) | 0;
 __THREW__ = 0;
 invoke_v(4);
 i2 = __THREW__;
 __THREW__ = 0;
 if (i2 & 1) {
  i2 = ___cxa_find_matching_catch(0) | 0;
  ___clang_call_terminate(i2);
 } else ___clang_call_terminate(i1);
}

function _tanh(d1) {
 d1 = +d1;
 var i2 = 0, i3 = 0;
 HEAPF64[tempDoublePtr >> 3] = d1;
 i3 = HEAP32[tempDoublePtr + 4 >> 2] | 0;
 i2 = i3 & 2147483647;
 HEAP32[tempDoublePtr >> 2] = HEAP32[tempDoublePtr >> 2];
 HEAP32[tempDoublePtr + 4 >> 2] = i2;
 d1 = +HEAPF64[tempDoublePtr >> 3];
 do if (i2 >>> 0 > 1071748074) if (i2 >>> 0 > 1077149696) {
  d1 = 1.0 - 0.0 / d1;
  break;
 } else {
  d1 = 1.0 - 2.0 / (+_expm1(d1 * 2.0) + 2.0);
  break;
 } else {
  if (i2 >>> 0 > 1070618798) {
   d1 = +_expm1(d1 * 2.0);
   d1 = d1 / (d1 + 2.0);
   break;
  }
  if (i2 >>> 0 > 1048575) {
   d1 = +_expm1(d1 * -2.0);
   d1 = -d1 / (d1 + 2.0);
  }
 } while (0);
 return +((i3 | 0) < 0 ? -d1 : d1);
}

function __ZN10emscripten8internal12operator_newI13neuralNetworkJiNSt3__16vectorIiNS3_9allocatorIiEEEEiiNS4_IdNS5_IdEEEES9_S9_S9_ddEEEPT_DpOT0_(i2, i3, i4, i5, i6, i7, i8, i9, i10, i11) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 i8 = i8 | 0;
 i9 = i9 | 0;
 i10 = i10 | 0;
 i11 = i11 | 0;
 var i1 = 0;
 i1 = __Znwj(192) | 0;
 __THREW__ = 0;
 invoke_viiiiiiiiiii(1, i1 | 0, i2 | 0, i3 | 0, i4 | 0, i5 | 0, i6 | 0, i7 | 0, i8 | 0, i9 | 0, i10 | 0, i11 | 0);
 i11 = __THREW__;
 __THREW__ = 0;
 if (i11 & 1) {
  i11 = ___cxa_find_matching_catch() | 0;
  __ZdlPv(i1);
  ___resumeException(i11 | 0);
 } else return i1 | 0;
 return 0;
}

function __ZN44EmscriptenBindingInitializer_modelSet_moduleC2Ev(i1) {
 i1 = i1 | 0;
 __embind_register_class(8, 16, 32, 0, 3369, 9, 3372, 0, 3372, 0, 3324, 3374, 39);
 __embind_register_class_constructor(8, 1, 1268, 3369, 10, 1);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 8;
 HEAP32[i1 + 4 >> 2] = 1;
 __embind_register_class_function(8, 5500, 3, 1272, 3530, 14, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 11;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(8, 5506, 2, 1284, 3535, 4, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 5;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(8, 4577, 3, 1292, 3530, 15, i1 | 0, 0);
 return;
}

function ___fflush_unlocked(i7) {
 i7 = i7 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0;
 i1 = i7 + 20 | 0;
 i5 = i7 + 28 | 0;
 if ((HEAP32[i1 >> 2] | 0) >>> 0 > (HEAP32[i5 >> 2] | 0) >>> 0 ? (FUNCTION_TABLE_iiii[HEAP32[i7 + 36 >> 2] & 31](i7, 0, 0) | 0, (HEAP32[i1 >> 2] | 0) == 0) : 0) i1 = -1; else {
  i6 = i7 + 4 | 0;
  i2 = HEAP32[i6 >> 2] | 0;
  i3 = i7 + 8 | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  if (i2 >>> 0 < i4 >>> 0) FUNCTION_TABLE_iiii[HEAP32[i7 + 40 >> 2] & 31](i7, i2 - i4 | 0, 1) | 0;
  HEAP32[i7 + 16 >> 2] = 0;
  HEAP32[i5 >> 2] = 0;
  HEAP32[i1 >> 2] = 0;
  HEAP32[i3 >> 2] = 0;
  HEAP32[i6 >> 2] = 0;
  i1 = 0;
 }
 return i1 | 0;
}

function __ZN6LIBSVM5SVC_QD2Ev(i4) {
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i3 = 0;
 HEAP32[i4 >> 2] = 2072;
 i1 = HEAP32[i4 + 48 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i2 = HEAP32[i4 + 52 >> 2] | 0;
 if (i2) {
  i3 = i2 + 12 | 0;
  i1 = HEAP32[i2 + 16 >> 2] | 0;
  if ((i1 | 0) != (i3 | 0)) do {
   _free(HEAP32[i1 + 8 >> 2] | 0);
   i1 = HEAP32[i1 + 4 >> 2] | 0;
  } while ((i1 | 0) != (i3 | 0));
  _free(HEAP32[i2 + 8 >> 2] | 0);
  __ZdlPv(i2);
 }
 i1 = HEAP32[i4 + 56 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 HEAP32[i4 >> 2] = 1928;
 i1 = HEAP32[i4 + 12 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i4 + 16 >> 2] | 0;
 if (!i1) return;
 __ZdaPv(i1);
 return;
}

function __ZNK6LIBSVM5SVR_Q10swap_indexEii(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 var d4 = 0.0, i5 = 0, i6 = 0, i7 = 0;
 i5 = HEAP32[i3 + 56 >> 2] | 0;
 i6 = i5 + i1 | 0;
 i5 = i5 + i2 | 0;
 i7 = HEAP8[i6 >> 0] | 0;
 HEAP8[i6 >> 0] = HEAP8[i5 >> 0] | 0;
 HEAP8[i5 >> 0] = i7;
 i5 = HEAP32[i3 + 60 >> 2] | 0;
 i7 = i5 + (i1 << 2) | 0;
 i5 = i5 + (i2 << 2) | 0;
 i6 = HEAP32[i7 >> 2] | 0;
 HEAP32[i7 >> 2] = HEAP32[i5 >> 2];
 HEAP32[i5 >> 2] = i6;
 i3 = HEAP32[i3 + 76 >> 2] | 0;
 i1 = i3 + (i1 << 3) | 0;
 i3 = i3 + (i2 << 3) | 0;
 d4 = +HEAPF64[i1 >> 3];
 HEAPF64[i1 >> 3] = +HEAPF64[i3 >> 3];
 HEAPF64[i3 >> 3] = d4;
 return;
}

function __ZN3dtwD2Ev(i7) {
 i7 = i7 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0, i6 = 0;
 i1 = HEAP32[i7 >> 2] | 0;
 if (!i1) return;
 i6 = i7 + 4 | 0;
 i2 = HEAP32[i6 >> 2] | 0;
 if ((i2 | 0) != (i1 | 0)) {
  i3 = i2;
  while (1) {
   i2 = i3 + -12 | 0;
   HEAP32[i6 >> 2] = i2;
   i4 = HEAP32[i2 >> 2] | 0;
   i5 = i4;
   if (i4) {
    i2 = i3 + -8 | 0;
    i3 = HEAP32[i2 >> 2] | 0;
    if ((i3 | 0) != (i4 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i5 | 0) >>> 3) << 3);
    __ZdlPv(i4);
    i2 = HEAP32[i6 >> 2] | 0;
   }
   if ((i2 | 0) == (i1 | 0)) break; else i3 = i2;
  }
  i1 = HEAP32[i7 >> 2] | 0;
 }
 __ZdlPv(i1);
 return;
}

function __ZN8modelSet5resetEv(i6) {
 i6 = i6 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0, i5 = 0;
 i4 = i6 + 4 | 0;
 i1 = HEAP32[i4 >> 2] | 0;
 i5 = i6 + 8 | 0;
 i2 = HEAP32[i5 >> 2] | 0;
 if ((i1 | 0) != (i2 | 0)) {
  do {
   i3 = HEAP32[i1 >> 2] | 0;
   if (i3) {
    FUNCTION_TABLE_vi[HEAP32[(HEAP32[i3 >> 2] | 0) + 4 >> 2] & 63](i3);
    i2 = HEAP32[i5 >> 2] | 0;
   }
   i1 = i1 + 4 | 0;
  } while ((i1 | 0) != (i2 | 0));
  i1 = HEAP32[i4 >> 2] | 0;
  if ((i2 | 0) != (i1 | 0)) HEAP32[i5 >> 2] = i2 + (~((i2 + -4 - i1 | 0) >>> 2) << 2);
 }
 HEAP32[i6 + 16 >> 2] = 0;
 HEAP32[i6 + 32 >> 2] = 0;
 HEAP8[i6 + 36 >> 0] = 0;
 return 1;
}

function _memcpy(i1, i4, i2) {
 i1 = i1 | 0;
 i4 = i4 | 0;
 i2 = i2 | 0;
 var i3 = 0;
 if ((i2 | 0) >= 4096) return _emscripten_memcpy_big(i1 | 0, i4 | 0, i2 | 0) | 0;
 i3 = i1 | 0;
 if ((i1 & 3) == (i4 & 3)) {
  while (i1 & 3) {
   if (!i2) return i3 | 0;
   HEAP8[i1 >> 0] = HEAP8[i4 >> 0] | 0;
   i1 = i1 + 1 | 0;
   i4 = i4 + 1 | 0;
   i2 = i2 - 1 | 0;
  }
  while ((i2 | 0) >= 4) {
   HEAP32[i1 >> 2] = HEAP32[i4 >> 2];
   i1 = i1 + 4 | 0;
   i4 = i4 + 4 | 0;
   i2 = i2 - 4 | 0;
  }
 }
 while ((i2 | 0) > 0) {
  HEAP8[i1 >> 0] = HEAP8[i4 >> 0] | 0;
  i1 = i1 + 1 | 0;
  i4 = i4 + 1 | 0;
  i2 = i2 - 1 | 0;
 }
 return i3 | 0;
}

function _realloc(i3, i2) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i1 = 0, i4 = 0;
 if (!i3) {
  i3 = _malloc(i2) | 0;
  return i3 | 0;
 }
 if (i2 >>> 0 > 4294967231) {
  i3 = ___errno_location() | 0;
  HEAP32[i3 >> 2] = 12;
  i3 = 0;
  return i3 | 0;
 }
 i1 = _try_realloc_chunk(i3 + -8 | 0, i2 >>> 0 < 11 ? 16 : i2 + 11 & -8) | 0;
 if (i1) {
  i3 = i1 + 8 | 0;
  return i3 | 0;
 }
 i1 = _malloc(i2) | 0;
 if (!i1) {
  i3 = 0;
  return i3 | 0;
 }
 i4 = HEAP32[i3 + -4 >> 2] | 0;
 i4 = (i4 & -8) - ((i4 & 3 | 0) == 0 ? 8 : 4) | 0;
 _memcpy(i1 | 0, i3 | 0, (i4 >>> 0 < i2 >>> 0 ? i4 : i2) | 0) | 0;
 _free(i3);
 i3 = i1;
 return i3 | 0;
}

function __ZN10emscripten8internal12VectorAccessINSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEE3getERKS7_j(i4, i3) {
 i4 = i4 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i5 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i1 = i5;
 i2 = HEAP32[i4 >> 2] | 0;
 if ((((HEAP32[i4 + 4 >> 2] | 0) - i2 | 0) / 24 | 0) >>> 0 > i3 >>> 0) {
  __ZN10emscripten3valC2IRK15trainingExampleEEOT_(i1, i2 + (i3 * 24 | 0) | 0);
  i4 = HEAP32[i1 >> 2] | 0;
  STACKTOP = i5;
  return i4 | 0;
 } else {
  HEAP32[i1 >> 2] = 1;
  i4 = 1;
  STACKTOP = i5;
  return i4 | 0;
 }
 return 0;
}

function ___divdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0, i7 = 0, i8 = 0, i9 = 0, i10 = 0;
 i10 = i2 >> 31 | ((i2 | 0) < 0 ? -1 : 0) << 1;
 i9 = ((i2 | 0) < 0 ? -1 : 0) >> 31 | ((i2 | 0) < 0 ? -1 : 0) << 1;
 i6 = i4 >> 31 | ((i4 | 0) < 0 ? -1 : 0) << 1;
 i5 = ((i4 | 0) < 0 ? -1 : 0) >> 31 | ((i4 | 0) < 0 ? -1 : 0) << 1;
 i8 = _i64Subtract(i10 ^ i1, i9 ^ i2, i10, i9) | 0;
 i7 = tempRet0;
 i1 = i6 ^ i10;
 i2 = i5 ^ i9;
 return _i64Subtract((___udivmoddi4(i8, i7, _i64Subtract(i6 ^ i3, i5 ^ i4, i6, i5) | 0, tempRet0, 0) | 0) ^ i1, tempRet0 ^ i2, i1, i2) | 0;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc(i5, i4, i3) {
 i5 = i5 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0;
 i1 = HEAP8[i5 >> 0] | 0;
 i2 = (i1 & 1) == 0;
 if (i2) i1 = (i1 & 255) >>> 1; else i1 = HEAP32[i5 + 4 >> 2] | 0;
 do if (i1 >>> 0 >= i4 >>> 0) if (i2) {
  HEAP8[i5 + 1 + i4 >> 0] = 0;
  HEAP8[i5 >> 0] = i4 << 1;
  break;
 } else {
  HEAP8[(HEAP32[i5 + 8 >> 2] | 0) + i4 >> 0] = 0;
  HEAP32[i5 + 4 >> 2] = i4;
  break;
 } else __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6appendEjc(i5, i4 - i1 | 0, i3) | 0; while (0);
 return;
}

function __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(i1, i4, i3, i5) {
 i1 = i1 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 var i2 = 0;
 i1 = i4 + 16 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 do if (i2) {
  if ((i2 | 0) != (i3 | 0)) {
   i5 = i4 + 36 | 0;
   HEAP32[i5 >> 2] = (HEAP32[i5 >> 2] | 0) + 1;
   HEAP32[i4 + 24 >> 2] = 2;
   HEAP8[i4 + 54 >> 0] = 1;
   break;
  }
  i1 = i4 + 24 | 0;
  if ((HEAP32[i1 >> 2] | 0) == 2) HEAP32[i1 >> 2] = i5;
 } else {
  HEAP32[i1 >> 2] = i3;
  HEAP32[i4 + 24 >> 2] = i5;
  HEAP32[i4 + 36 >> 2] = 1;
 } while (0);
 return;
}

function __ZN10emscripten8internal13MethodInvokerIM17knnClassificationFvRKiRKNSt3__16vectorIdNS5_9allocatorIdEEEEEvPS2_JS4_SB_EE6invokeERKSD_SE_iPS9_(i2, i3, i5, i6) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 var i1 = 0, i4 = 0, i7 = 0, i8 = 0;
 i7 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i4 = i7;
 i1 = HEAP32[i2 >> 2] | 0;
 i8 = HEAP32[i2 + 4 >> 2] | 0;
 i2 = i3 + (i8 >> 1) | 0;
 if (i8 & 1) i1 = HEAP32[(HEAP32[i2 >> 2] | 0) + i1 >> 2] | 0;
 HEAP32[i4 >> 2] = i5;
 FUNCTION_TABLE_viii[i1 & 31](i2, i4, i6);
 STACKTOP = i7;
 return;
}

function __ZN6LIBSVM11ONE_CLASS_QD2Ev(i4) {
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i3 = 0;
 HEAP32[i4 >> 2] = 2044;
 i2 = HEAP32[i4 + 48 >> 2] | 0;
 if (i2) {
  i3 = i2 + 12 | 0;
  i1 = HEAP32[i2 + 16 >> 2] | 0;
  if ((i1 | 0) != (i3 | 0)) do {
   _free(HEAP32[i1 + 8 >> 2] | 0);
   i1 = HEAP32[i1 + 4 >> 2] | 0;
  } while ((i1 | 0) != (i3 | 0));
  _free(HEAP32[i2 + 8 >> 2] | 0);
  __ZdlPv(i2);
 }
 i1 = HEAP32[i4 + 52 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 HEAP32[i4 >> 2] = 1928;
 i1 = HEAP32[i4 + 12 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i4 + 16 >> 2] | 0;
 if (!i1) return;
 __ZdaPv(i1);
 return;
}

function __ZN38EmscriptenBindingInitializer_nn_moduleC2Ev(i1) {
 i1 = i1 | 0;
 __embind_register_class(152, 168, 184, 0, 3369, 13, 3372, 0, 3372, 0, 3635, 3374, 41);
 __embind_register_class_constructor(152, 5, 1340, 3649, 1, 1);
 __embind_register_class_constructor(152, 11, 1360, 3656, 1, 1);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 8;
 HEAP32[i1 + 4 >> 2] = 1;
 __embind_register_class_function(152, 4577, 3, 1404, 3669, 1, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 12;
 HEAP32[i1 + 4 >> 2] = 1;
 __embind_register_class_function(152, 5500, 3, 1416, 3674, 6, i1 | 0, 0);
 return;
}

function _fmt_u(i2, i3, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 var i4 = 0;
 if (i3 >>> 0 > 0 | (i3 | 0) == 0 & i2 >>> 0 > 4294967295) while (1) {
  i4 = ___uremdi3(i2 | 0, i3 | 0, 10, 0) | 0;
  i1 = i1 + -1 | 0;
  HEAP8[i1 >> 0] = i4 | 48;
  i4 = ___udivdi3(i2 | 0, i3 | 0, 10, 0) | 0;
  if (i3 >>> 0 > 9 | (i3 | 0) == 9 & i2 >>> 0 > 4294967295) {
   i2 = i4;
   i3 = tempRet0;
  } else {
   i2 = i4;
   break;
  }
 }
 if (i2) while (1) {
  i1 = i1 + -1 | 0;
  HEAP8[i1 >> 0] = (i2 >>> 0) % 10 | 0 | 48;
  if (i2 >>> 0 < 10) break; else i2 = (i2 >>> 0) / 10 | 0;
 }
 return i1 | 0;
}

function __ZN10emscripten8internal12operator_newI11rapidStreamJEEEPT_DpOT0_() {
 var i1 = 0, i2 = 0, i3 = 0;
 i1 = __Znwj(12) | 0;
 HEAP32[i1 >> 2] = 3;
 HEAP32[i1 + 4 >> 2] = 0;
 __THREW__ = 0;
 i2 = invoke_ii(19, 24) | 0;
 i3 = __THREW__;
 __THREW__ = 0;
 if (i3 & 1) {
  i3 = ___cxa_find_matching_catch() | 0;
  __ZdlPv(i1);
  ___resumeException(i3 | 0);
 } else {
  HEAP32[i1 + 8 >> 2] = i2;
  HEAP32[i2 >> 2] = 0;
  HEAP32[i2 + 4 >> 2] = 0;
  HEAP32[i2 + 8 >> 2] = 0;
  HEAP32[i2 + 12 >> 2] = 0;
  HEAP32[i2 + 16 >> 2] = 0;
  HEAP32[i2 + 20 >> 2] = 0;
  return i1 | 0;
 }
 return 0;
}

function __ZNSt3__16__treeINS_12__value_typeIiiEENS_19__map_value_compareIiS2_NS_4lessIiEELb1EEENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 if (!i1) return; else {
  __ZNSt3__16__treeINS_12__value_typeIiiEENS_19__map_value_compareIiS2_NS_4lessIiEELb1EEENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(i2, HEAP32[i1 >> 2] | 0);
  __ZNSt3__16__treeINS_12__value_typeIiiEENS_19__map_value_compareIiS2_NS_4lessIiEELb1EEENS_9allocatorIS2_EEE7destroyEPNS_11__tree_nodeIS2_PvEE(i2, HEAP32[i1 + 4 >> 2] | 0);
  __ZdlPv(i1);
  return;
 }
}

function __ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorIiNS2_9allocatorIiEEEEFvjRKiEvPS6_JjS8_EE6invokeERKSA_SB_ji(i2, i3, i5, i6) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 var i1 = 0, i4 = 0, i7 = 0, i8 = 0;
 i7 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i4 = i7;
 i1 = HEAP32[i2 >> 2] | 0;
 i8 = HEAP32[i2 + 4 >> 2] | 0;
 i2 = i3 + (i8 >> 1) | 0;
 if (i8 & 1) i1 = HEAP32[(HEAP32[i2 >> 2] | 0) + i1 >> 2] | 0;
 HEAP32[i4 >> 2] = i6;
 FUNCTION_TABLE_viii[i1 & 31](i2, i5, i4);
 STACKTOP = i7;
 return;
}

function __ZN10emscripten8internal14raw_destructorI15trainingExampleEEvPT_(i5) {
 i5 = i5 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0;
 if (!i5) return;
 i1 = HEAP32[i5 + 12 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = i5 + 16 | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i1 = HEAP32[i5 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = i5 + 4 | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 __ZdlPv(i5);
 return;
}

function __ZN11rapidStream11maxVelocityEv(i2) {
 i2 = i2 | 0;
 var d1 = 0.0, i3 = 0, i4 = 0, i5 = 0, d6 = 0.0, i7 = 0;
 i4 = HEAP32[i2 >> 2] | 0;
 if (!i4) {
  d1 = -1797693134862315708145274.0e284;
  return +d1;
 }
 i5 = HEAP32[i2 + 4 >> 2] | 0;
 i2 = HEAP32[i2 + 8 >> 2] | 0;
 i3 = 0;
 d1 = -1797693134862315708145274.0e284;
 do {
  i7 = i5 + i3 | 0;
  d6 = +HEAPF64[i2 + (((i7 >>> 0) % (i4 >>> 0) | 0) << 3) >> 3] - +HEAPF64[i2 + ((((i7 + -1 | 0) >>> 0) % (i4 >>> 0) | 0) << 3) >> 3];
  d1 = d6 > d1 ? d6 : d1;
  i3 = i3 + 1 | 0;
 } while (i3 >>> 0 < i4 >>> 0);
 return +d1;
}

function __ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorIdNS2_9allocatorIdEEEEFvjRKdEvPS6_JjS8_EE6invokeERKSA_SB_jd(i2, i3, i5, d6) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 d6 = +d6;
 var i1 = 0, i4 = 0, i7 = 0, i8 = 0;
 i7 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i4 = i7;
 i1 = HEAP32[i2 >> 2] | 0;
 i8 = HEAP32[i2 + 4 >> 2] | 0;
 i2 = i3 + (i8 >> 1) | 0;
 if (i8 & 1) i1 = HEAP32[(HEAP32[i2 >> 2] | 0) + i1 >> 2] | 0;
 HEAPF64[i4 >> 3] = d6;
 FUNCTION_TABLE_viii[i1 & 31](i2, i5, i4);
 STACKTOP = i7;
 return;
}

function _round(d1) {
 d1 = +d1;
 var i2 = 0, d3 = 0.0, d4 = 0.0, i5 = 0;
 HEAPF64[tempDoublePtr >> 3] = d1;
 i2 = HEAP32[tempDoublePtr + 4 >> 2] | 0;
 i5 = _bitshift64Lshr(HEAP32[tempDoublePtr >> 2] | 0, i2 | 0, 52) | 0;
 i5 = i5 & 2047;
 do if (i5 >>> 0 <= 1074) {
  i2 = (i2 | 0) < 0;
  d4 = i2 ? -d1 : d1;
  if (i5 >>> 0 < 1022) {
   d1 = d1 * 0.0;
   break;
  }
  d3 = d4 + 4503599627370496.0 + -4503599627370496.0 - d4;
  if (!(d3 > .5)) {
   d1 = d4 + d3;
   if (d3 <= -.5) d1 = d1 + 1.0;
  } else d1 = d4 + d3 + -1.0;
  d1 = i2 ? -d1 : d1;
 } while (0);
 return +d1;
}

function __ZN10emscripten8internal12operator_newI11rapidStreamJiEEEPT_DpOT0_(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0;
 i3 = __Znwj(12) | 0;
 i1 = HEAP32[i1 >> 2] | 0;
 HEAP32[i3 >> 2] = i1;
 HEAP32[i3 + 4 >> 2] = 0;
 __THREW__ = 0;
 i2 = invoke_ii(19, (i1 >>> 0 > 536870911 ? -1 : i1 << 3) | 0) | 0;
 i4 = __THREW__;
 __THREW__ = 0;
 if (i4 & 1) {
  i4 = ___cxa_find_matching_catch() | 0;
  __ZdlPv(i3);
  ___resumeException(i4 | 0);
 }
 HEAP32[i3 + 8 >> 2] = i2;
 if (!i1) return i3 | 0;
 _memset(i2 | 0, 0, (i1 >>> 0 > 1 ? i1 << 3 : 8) | 0) | 0;
 return i3 | 0;
}

function _strlen(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0;
 i4 = i1;
 L1 : do if (!(i4 & 3)) i3 = 4; else {
  i2 = i1;
  i1 = i4;
  while (1) {
   if (!(HEAP8[i2 >> 0] | 0)) break L1;
   i2 = i2 + 1 | 0;
   i1 = i2;
   if (!(i1 & 3)) {
    i1 = i2;
    i3 = 4;
    break;
   }
  }
 } while (0);
 if ((i3 | 0) == 4) {
  while (1) {
   i2 = HEAP32[i1 >> 2] | 0;
   if (!((i2 & -2139062144 ^ -2139062144) & i2 + -16843009)) i1 = i1 + 4 | 0; else break;
  }
  if ((i2 & 255) << 24 >> 24) do i1 = i1 + 1 | 0; while ((HEAP8[i1 >> 0] | 0) != 0);
 }
 return i1 - i4 | 0;
}

function __ZN17svmClassificationD0Ev(i5) {
 i5 = i5 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0;
 HEAP32[i5 >> 2] = 1860;
 i1 = HEAP32[i5 + 140 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = i5 + 144 | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i1 = HEAP32[i5 + 128 >> 2] | 0;
 if (!i1) {
  __ZdlPv(i5);
  return;
 }
 i2 = i5 + 132 | 0;
 i3 = HEAP32[i2 >> 2] | 0;
 if ((i3 | 0) != (i1 | 0)) HEAP32[i2 >> 2] = i3 + (~((i3 + -8 - i1 | 0) >>> 3) << 3);
 __ZdlPv(i1);
 __ZdlPv(i5);
 return;
}

function __GLOBAL__sub_I_knnClassification_cpp() {
 var i1 = 0;
 __ZN41EmscriptenBindingInitializer_stl_wrappersC2Ev(0);
 __embind_register_class(304, 328, 344, 0, 3369, 20, 3372, 0, 3372, 0, 3947, 3374, 46);
 __embind_register_class_constructor(304, 5, 1520, 3649, 2, 2);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 9;
 HEAP32[i1 + 4 >> 2] = 0;
 __embind_register_class_function(304, 3965, 4, 1540, 3978, 4, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 8;
 HEAP32[i1 + 4 >> 2] = 1;
 __embind_register_class_function(304, 4577, 3, 1556, 3669, 2, i1 | 0, 0);
 return;
}

function __ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorIiNS2_9allocatorIiEEEEFvRKiEvPS6_JS8_EE6invokeERKSA_SB_i(i2, i3, i5) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 var i1 = 0, i4 = 0, i6 = 0, i7 = 0;
 i6 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i4 = i6;
 i1 = HEAP32[i2 >> 2] | 0;
 i7 = HEAP32[i2 + 4 >> 2] | 0;
 i2 = i3 + (i7 >> 1) | 0;
 if (i7 & 1) i1 = HEAP32[(HEAP32[i2 >> 2] | 0) + i1 >> 2] | 0;
 HEAP32[i4 >> 2] = i5;
 FUNCTION_TABLE_vii[i1 & 31](i2, i4);
 STACKTOP = i6;
 return;
}

function __ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorIdNS2_9allocatorIdEEEEFvRKdEvPS6_JS8_EE6invokeERKSA_SB_d(i2, i3, d5) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 d5 = +d5;
 var i1 = 0, i4 = 0, i6 = 0, i7 = 0;
 i6 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i4 = i6;
 i1 = HEAP32[i2 >> 2] | 0;
 i7 = HEAP32[i2 + 4 >> 2] | 0;
 i2 = i3 + (i7 >> 1) | 0;
 if (i7 & 1) i1 = HEAP32[(HEAP32[i2 >> 2] | 0) + i1 >> 2] | 0;
 HEAPF64[i4 >> 3] = d5;
 FUNCTION_TABLE_vii[i1 & 31](i2, i4);
 STACKTOP = i6;
 return;
}

function _memset(i2, i6, i1) {
 i2 = i2 | 0;
 i6 = i6 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i7 = 0;
 i3 = i2 + i1 | 0;
 if ((i1 | 0) >= 20) {
  i6 = i6 & 255;
  i5 = i2 & 3;
  i7 = i6 | i6 << 8 | i6 << 16 | i6 << 24;
  i4 = i3 & ~3;
  if (i5) {
   i5 = i2 + 4 - i5 | 0;
   while ((i2 | 0) < (i5 | 0)) {
    HEAP8[i2 >> 0] = i6;
    i2 = i2 + 1 | 0;
   }
  }
  while ((i2 | 0) < (i4 | 0)) {
   HEAP32[i2 >> 2] = i7;
   i2 = i2 + 4 | 0;
  }
 }
 while ((i2 | 0) < (i3 | 0)) {
  HEAP8[i2 >> 0] = i6;
  i2 = i2 + 1 | 0;
 }
 return i2 - i1 | 0;
}

function ___stdio_seek(i1, i2, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i3 = 0, i5 = 0, i6 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 32 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i6 = i5;
 i3 = i5 + 20 | 0;
 HEAP32[i6 >> 2] = HEAP32[i1 + 60 >> 2];
 HEAP32[i6 + 4 >> 2] = 0;
 HEAP32[i6 + 8 >> 2] = i2;
 HEAP32[i6 + 12 >> 2] = i3;
 HEAP32[i6 + 16 >> 2] = i4;
 if ((___syscall_ret(___syscall140(140, i6 | 0) | 0) | 0) < 0) {
  HEAP32[i3 >> 2] = -1;
  i1 = -1;
 } else i1 = HEAP32[i3 >> 2] | 0;
 STACKTOP = i5;
 return i1 | 0;
}

function __ZN10emscripten8internal12operator_newI14classificationJNS2_19classificationTypesEEEEPT_DpOT0_(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 i2 = __Znwj(44) | 0;
 i1 = HEAP32[i1 >> 2] | 0;
 __THREW__ = 0;
 invoke_vi(43, i2 | 0);
 i3 = __THREW__;
 __THREW__ = 0;
 if (i3 & 1) {
  i3 = ___cxa_find_matching_catch() | 0;
  __ZdlPv(i2);
  ___resumeException(i3 | 0);
 } else {
  HEAP32[i2 >> 2] = 1780;
  HEAP32[i2 + 16 >> 2] = 0;
  HEAP32[i2 + 32 >> 2] = 0;
  HEAP8[i2 + 36 >> 0] = 0;
  HEAP32[i2 + 40 >> 2] = i1;
  return i2 | 0;
 }
 return 0;
}

function __ZN10emscripten8internal13MethodInvokerIM17svmClassificationFdRKNSt3__16vectorIdNS3_9allocatorIdEEEEEdPS2_JS9_EE6invokeERKSB_SC_PS7_(i1, i2, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i3 = 0, i5 = 0, d6 = 0.0;
 i3 = HEAP32[i1 >> 2] | 0;
 i5 = HEAP32[i1 + 4 >> 2] | 0;
 i1 = i2 + (i5 >> 1) | 0;
 if (!(i5 & 1)) {
  i5 = i3;
  d6 = +FUNCTION_TABLE_dii[i5 & 7](i1, i4);
  return +d6;
 } else {
  i5 = HEAP32[(HEAP32[i1 >> 2] | 0) + i3 >> 2] | 0;
  d6 = +FUNCTION_TABLE_dii[i5 & 7](i1, i4);
  return +d6;
 }
 return 0.0;
}

function __ZN10emscripten8internal13MethodInvokerIM17knnClassificationFdRKNSt3__16vectorIdNS3_9allocatorIdEEEEEdPS2_JS9_EE6invokeERKSB_SC_PS7_(i1, i2, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i3 = 0, i5 = 0, d6 = 0.0;
 i3 = HEAP32[i1 >> 2] | 0;
 i5 = HEAP32[i1 + 4 >> 2] | 0;
 i1 = i2 + (i5 >> 1) | 0;
 if (!(i5 & 1)) {
  i5 = i3;
  d6 = +FUNCTION_TABLE_dii[i5 & 7](i1, i4);
  return +d6;
 } else {
  i5 = HEAP32[(HEAP32[i1 >> 2] | 0) + i3 >> 2] | 0;
  d6 = +FUNCTION_TABLE_dii[i5 & 7](i1, i4);
  return +d6;
 }
 return 0.0;
}

function __ZSt9terminatev() {
 var i1 = 0, i2 = 0, i3 = 0;
 __THREW__ = 0;
 i1 = invoke_i(10) | 0;
 i3 = __THREW__;
 __THREW__ = 0;
 if (i3 & 1) {
  i3 = ___cxa_find_matching_catch(0) | 0;
  ___clang_call_terminate(i3);
 }
 if (((i1 | 0) != 0 ? (i2 = HEAP32[i1 >> 2] | 0, (i2 | 0) != 0) : 0) ? (i3 = i2 + 48 | 0, (HEAP32[i3 >> 2] & -256 | 0) == 1126902528 ? (HEAP32[i3 + 4 >> 2] | 0) == 1129074247 : 0) : 0) __ZSt11__terminatePFvvE(HEAP32[i2 + 12 >> 2] | 0);
 i3 = HEAP32[547] | 0;
 HEAP32[547] = i3 + 0;
 __ZSt11__terminatePFvvE(i3);
}

function __ZN17svmClassificationD2Ev(i5) {
 i5 = i5 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0;
 HEAP32[i5 >> 2] = 1860;
 i1 = HEAP32[i5 + 140 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = i5 + 144 | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 i3 = HEAP32[i5 + 128 >> 2] | 0;
 if (!i3) return;
 i1 = i5 + 132 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) != (i3 | 0)) HEAP32[i1 >> 2] = i2 + (~((i2 + -8 - i3 | 0) >>> 3) << 3);
 __ZdlPv(i3);
 return;
}

function __ZN10emscripten8internal12VectorAccessINSt3__16vectorIdNS2_9allocatorIdEEEEE3getERKS6_j(i4, i3) {
 i4 = i4 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i5 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i2 = i5;
 i1 = HEAP32[i4 >> 2] | 0;
 if ((HEAP32[i4 + 4 >> 2] | 0) - i1 >> 3 >>> 0 <= i3 >>> 0) {
  i4 = 1;
  STACKTOP = i5;
  return i4 | 0;
 }
 HEAPF64[i2 >> 3] = +HEAPF64[i1 + (i3 << 3) >> 3];
 i4 = __emval_take_value(1184, i2 | 0) | 0;
 STACKTOP = i5;
 return i4 | 0;
}

function __ZN10emscripten8internal13MethodInvokerIM13neuralNetworkFdRKNSt3__16vectorIdNS3_9allocatorIdEEEEEdPS2_JS9_EE6invokeERKSB_SC_PS7_(i1, i2, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i3 = 0, i5 = 0, d6 = 0.0;
 i3 = HEAP32[i1 >> 2] | 0;
 i5 = HEAP32[i1 + 4 >> 2] | 0;
 i1 = i2 + (i5 >> 1) | 0;
 if (!(i5 & 1)) {
  i5 = i3;
  d6 = +FUNCTION_TABLE_dii[i5 & 7](i1, i4);
  return +d6;
 } else {
  i5 = HEAP32[(HEAP32[i1 >> 2] | 0) + i3 >> 2] | 0;
  d6 = +FUNCTION_TABLE_dii[i5 & 7](i1, i4);
  return +d6;
 }
 return 0.0;
}

function __ZN10emscripten8internal12VectorAccessINSt3__16vectorIiNS2_9allocatorIiEEEEE3getERKS6_j(i4, i3) {
 i4 = i4 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0, i5 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i2 = i5;
 i1 = HEAP32[i4 >> 2] | 0;
 if ((HEAP32[i4 + 4 >> 2] | 0) - i1 >> 2 >>> 0 <= i3 >>> 0) {
  i4 = 1;
  STACKTOP = i5;
  return i4 | 0;
 }
 HEAP32[i2 >> 2] = HEAP32[i1 + (i3 << 2) >> 2];
 i4 = __emval_take_value(1144, i2 | 0) | 0;
 STACKTOP = i5;
 return i4 | 0;
}

function _strerror(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 i2 = 0;
 while (1) {
  if ((HEAPU8[8396 + i2 >> 0] | 0) == (i1 | 0)) {
   i3 = 2;
   break;
  }
  i2 = i2 + 1 | 0;
  if ((i2 | 0) == 87) {
   i2 = 87;
   i1 = 8484;
   i3 = 5;
   break;
  }
 }
 if ((i3 | 0) == 2) if (!i2) i1 = 8484; else {
  i1 = 8484;
  i3 = 5;
 }
 if ((i3 | 0) == 5) while (1) {
  i3 = i1;
  while (1) {
   i1 = i3 + 1 | 0;
   if (!(HEAP8[i3 >> 0] | 0)) break; else i3 = i1;
  }
  i2 = i2 + -1 | 0;
  if (!i2) break; else i3 = 5;
 }
 return i1 | 0;
}

function __ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEFvjRKS4_EvPS7_JjS9_EE6invokeERKSB_SC_jPS4_(i1, i2, i4, i5) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 var i3 = 0, i6 = 0;
 i3 = HEAP32[i1 >> 2] | 0;
 i6 = HEAP32[i1 + 4 >> 2] | 0;
 i1 = i2 + (i6 >> 1) | 0;
 if (!(i6 & 1)) {
  i6 = i3;
  FUNCTION_TABLE_viii[i6 & 31](i1, i4, i5);
  return;
 } else {
  i6 = HEAP32[(HEAP32[i1 >> 2] | 0) + i3 >> 2] | 0;
  FUNCTION_TABLE_viii[i6 & 31](i1, i4, i5);
  return;
 }
}

function __ZNSt3__16vectorIiNS_9allocatorIiEEE6resizeEjRKi(i5, i3, i4) {
 i5 = i5 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i6 = 0, i7 = 0;
 i6 = i5 + 4 | 0;
 i7 = HEAP32[i6 >> 2] | 0;
 i1 = HEAP32[i5 >> 2] | 0;
 i2 = i7 - i1 >> 2;
 if (i2 >>> 0 < i3 >>> 0) {
  __ZNSt3__16vectorIiNS_9allocatorIiEEE8__appendEjRKi(i5, i3 - i2 | 0, i4);
  return;
 }
 if (i2 >>> 0 <= i3 >>> 0) return;
 i1 = i1 + (i3 << 2) | 0;
 if ((i7 | 0) == (i1 | 0)) return;
 HEAP32[i6 >> 2] = i7 + (~((i7 + -4 - i1 | 0) >>> 2) << 2);
 return;
}

function __ZNSt3__16vectorIdNS_9allocatorIdEEE6resizeEjRKd(i5, i3, i4) {
 i5 = i5 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i1 = 0, i2 = 0, i6 = 0, i7 = 0;
 i6 = i5 + 4 | 0;
 i7 = HEAP32[i6 >> 2] | 0;
 i1 = HEAP32[i5 >> 2] | 0;
 i2 = i7 - i1 >> 3;
 if (i2 >>> 0 < i3 >>> 0) {
  __ZNSt3__16vectorIdNS_9allocatorIdEEE8__appendEjRKd(i5, i3 - i2 | 0, i4);
  return;
 }
 if (i2 >>> 0 <= i3 >>> 0) return;
 i1 = i1 + (i3 << 3) | 0;
 if ((i7 | 0) == (i1 | 0)) return;
 HEAP32[i6 >> 2] = i7 + (~((i7 + -8 - i1 | 0) >>> 3) << 3);
 return;
}

function __ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i5, i3, i2, i1, i4, i6) {
 i5 = i5 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 i6 = i6 | 0;
 if ((i5 | 0) == (HEAP32[i3 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0, i3, i2, i1, i4); else {
  i5 = HEAP32[i5 + 8 >> 2] | 0;
  FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[i5 >> 2] | 0) + 20 >> 2] & 3](i5, i3, i2, i1, i4, i6);
 }
 return;
}

function __ZN11rapidStream11minVelocityEv(i2) {
 i2 = i2 | 0;
 var d1 = 0.0, i3 = 0, i4 = 0, i5 = 0, d6 = 0.0, i7 = 0;
 i4 = HEAP32[i2 >> 2] | 0;
 if (!i4) {
  d1 = inf;
  return +d1;
 }
 i5 = HEAP32[i2 + 4 >> 2] | 0;
 i2 = HEAP32[i2 + 8 >> 2] | 0;
 i3 = 0;
 d1 = inf;
 do {
  i7 = i5 + i3 | 0;
  d6 = +HEAPF64[i2 + (((i7 >>> 0) % (i4 >>> 0) | 0) << 3) >> 3] - +HEAPF64[i2 + ((((i7 + -1 | 0) >>> 0) % (i4 >>> 0) | 0) << 3) >> 3];
  d1 = d6 < d1 ? d6 : d1;
  i3 = i3 + 1 | 0;
 } while (i3 >>> 0 < i4 >>> 0);
 return +d1;
}

function __ZN3dtw9setSeriesENSt3__16vectorINS1_IdNS0_9allocatorIdEEEENS2_IS4_EEEE(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 if ((i2 | 0) != (i1 | 0)) __ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEE6assignIPS3_EENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIS3_NS_15iterator_traitsIS9_E9referenceEEE5valueEvE4typeES9_S9_(i2, HEAP32[i1 >> 2] | 0, HEAP32[i1 + 4 >> 2] | 0);
 i1 = HEAP32[i2 >> 2] | 0;
 HEAP32[i2 + 12 >> 2] = (HEAP32[i1 + 4 >> 2] | 0) - (HEAP32[i1 >> 2] | 0) >> 3;
 return;
}

function __ZN10emscripten8internal12operator_newI17knnClassificationJiNSt3__16vectorIiNS3_9allocatorIiEEEENS4_I15trainingExampleNS5_IS8_EEEEiEEEPT_DpOT0_(i2, i3, i4, i5) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 var i1 = 0;
 i1 = __Znwj(44) | 0;
 __THREW__ = 0;
 invoke_viiiii(5, i1 | 0, i2 | 0, i3 | 0, i4 | 0, HEAP32[i5 >> 2] | 0);
 i5 = __THREW__;
 __THREW__ = 0;
 if (i5 & 1) {
  i5 = ___cxa_find_matching_catch() | 0;
  __ZdlPv(i1);
  ___resumeException(i5 | 0);
 } else return i1 | 0;
 return 0;
}

function __GLOBAL__sub_I_svmClassification_cpp() {
 var i1 = 0;
 __embind_register_class(520, 536, 552, 0, 3369, 36, 3372, 0, 3372, 0, 4556, 3374, 53);
 __embind_register_class_constructor(520, 2, 1888, 3535, 18, 37);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 12;
 HEAP32[i1 + 4 >> 2] = 1;
 __embind_register_class_function(520, 5500, 3, 1896, 3674, 17, i1 | 0, 0);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 8;
 HEAP32[i1 + 4 >> 2] = 1;
 __embind_register_class_function(520, 4577, 3, 1908, 3669, 3, i1 | 0, 0);
 return;
}

function ___stdout_write(i2, i1, i3) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 80 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i4 = i5;
 HEAP32[i2 + 36 >> 2] = 11;
 if ((HEAP32[i2 >> 2] & 64 | 0) == 0 ? (HEAP32[i4 >> 2] = HEAP32[i2 + 60 >> 2], HEAP32[i4 + 4 >> 2] = 21505, HEAP32[i4 + 8 >> 2] = i5 + 12, (___syscall54(54, i4 | 0) | 0) != 0) : 0) HEAP8[i2 + 75 >> 0] = -1;
 i4 = ___stdio_write(i2, i1, i3) | 0;
 STACKTOP = i5;
 return i4 | 0;
}

function __ZN10emscripten8internal13MethodInvokerIM17svmClassificationFvRKNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEEvPS2_JSA_EE6invokeERKSC_SD_PS8_(i1, i2, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i3 = 0, i5 = 0;
 i3 = HEAP32[i1 >> 2] | 0;
 i5 = HEAP32[i1 + 4 >> 2] | 0;
 i1 = i2 + (i5 >> 1) | 0;
 if (!(i5 & 1)) {
  i5 = i3;
  FUNCTION_TABLE_vii[i5 & 31](i1, i4);
  return;
 } else {
  i5 = HEAP32[(HEAP32[i1 >> 2] | 0) + i3 >> 2] | 0;
  FUNCTION_TABLE_vii[i5 & 31](i1, i4);
  return;
 }
}

function __ZN10emscripten8internal13MethodInvokerIM13neuralNetworkFvRKNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEEvPS2_JSA_EE6invokeERKSC_SD_PS8_(i1, i2, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i3 = 0, i5 = 0;
 i3 = HEAP32[i1 >> 2] | 0;
 i5 = HEAP32[i1 + 4 >> 2] | 0;
 i1 = i2 + (i5 >> 1) | 0;
 if (!(i5 & 1)) {
  i5 = i3;
  FUNCTION_TABLE_vii[i5 & 31](i1, i4);
  return;
 } else {
  i5 = HEAP32[(HEAP32[i1 >> 2] | 0) + i3 >> 2] | 0;
  FUNCTION_TABLE_vii[i5 & 31](i1, i4);
  return;
 }
}

function __ZN10emscripten8internal12MemberAccessI15trainingExampleNSt3__16vectorIdNS3_9allocatorIdEEEEE7setWireIS2_EEvRKMS2_S7_RT_PS7_(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i2 + (HEAP32[i1 >> 2] | 0) | 0;
 if ((i1 | 0) == (i3 | 0)) return;
 __ZNSt3__16vectorIdNS_9allocatorIdEEE6assignIPdEENS_9enable_ifIXaasr21__is_forward_iteratorIT_EE5valuesr16is_constructibleIdNS_15iterator_traitsIS7_E9referenceEEE5valueEvE4typeES7_S7_(i1, HEAP32[i3 >> 2] | 0, HEAP32[i3 + 4 >> 2] | 0);
 return;
}

function __ZNK6LIBSVM6Kernel10swap_indexEii(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0, i6 = 0, d7 = 0.0;
 i4 = HEAP32[i1 + 12 >> 2] | 0;
 i6 = i4 + (i2 << 2) | 0;
 i4 = i4 + (i3 << 2) | 0;
 i5 = HEAP32[i6 >> 2] | 0;
 HEAP32[i6 >> 2] = HEAP32[i4 >> 2];
 HEAP32[i4 >> 2] = i5;
 i1 = HEAP32[i1 + 16 >> 2] | 0;
 if (!i1) return;
 i5 = i1 + (i2 << 3) | 0;
 i6 = i1 + (i3 << 3) | 0;
 d7 = +HEAPF64[i5 >> 3];
 HEAPF64[i5 >> 3] = +HEAPF64[i6 >> 3];
 HEAPF64[i6 >> 3] = d7;
 return;
}

function __ZNK10__cxxabiv122__base_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i7, i5, i4, i3, i6, i8) {
 i7 = i7 | 0;
 i5 = i5 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i6 = i6 | 0;
 i8 = i8 | 0;
 var i1 = 0, i2 = 0;
 i2 = HEAP32[i7 + 4 >> 2] | 0;
 i1 = i2 >> 8;
 if (i2 & 1) i1 = HEAP32[(HEAP32[i3 >> 2] | 0) + i1 >> 2] | 0;
 i7 = HEAP32[i7 >> 2] | 0;
 FUNCTION_TABLE_viiiiii[HEAP32[(HEAP32[i7 >> 2] | 0) + 20 >> 2] & 3](i7, i5, i4, i3 + i1 | 0, (i2 & 2 | 0) != 0 ? i6 : 2, i8);
 return;
}

function __ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEKFjvEjPKS7_JEE6invokeERKS9_SB_(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0;
 i3 = HEAP32[i1 >> 2] | 0;
 i4 = HEAP32[i1 + 4 >> 2] | 0;
 i1 = i2 + (i4 >> 1) | 0;
 if (!(i4 & 1)) {
  i4 = i3;
  i4 = FUNCTION_TABLE_ii[i4 & 63](i1) | 0;
  return i4 | 0;
 } else {
  i4 = HEAP32[(HEAP32[i1 >> 2] | 0) + i3 >> 2] | 0;
  i4 = FUNCTION_TABLE_ii[i4 & 63](i1) | 0;
  return i4 | 0;
 }
 return 0;
}

function __ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEFvRKS4_EvPS7_JS9_EE6invokeERKSB_SC_PS4_(i1, i2, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i3 = 0, i5 = 0;
 i3 = HEAP32[i1 >> 2] | 0;
 i5 = HEAP32[i1 + 4 >> 2] | 0;
 i1 = i2 + (i5 >> 1) | 0;
 if (!(i5 & 1)) {
  i5 = i3;
  FUNCTION_TABLE_vii[i5 & 31](i1, i4);
  return;
 } else {
  i5 = HEAP32[(HEAP32[i1 >> 2] | 0) + i3 >> 2] | 0;
  FUNCTION_TABLE_vii[i5 & 31](i1, i4);
  return;
 }
}

function __GLOBAL__sub_I_regression_cpp() {
 var i1 = 0;
 __embind_register_class(256, 272, 288, 8, 3369, 14, 3369, 15, 3369, 16, 3818, 3374, 42);
 __embind_register_class_constructor(256, 1, 1448, 3369, 17, 2);
 __embind_register_class_constructor(256, 2, 1452, 3535, 5, 18);
 __embind_register_class_constructor(256, 3, 1460, 3530, 17, 6);
 i1 = __Znwj(8) | 0;
 HEAP32[i1 >> 2] = 8;
 HEAP32[i1 + 4 >> 2] = 1;
 __embind_register_class_function(256, 5500, 3, 1472, 3530, 18, i1 | 0, 0);
 return;
}

function __ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorIiNS2_9allocatorIiEEEEKFjvEjPKS6_JEE6invokeERKS8_SA_(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0;
 i3 = HEAP32[i1 >> 2] | 0;
 i4 = HEAP32[i1 + 4 >> 2] | 0;
 i1 = i2 + (i4 >> 1) | 0;
 if (!(i4 & 1)) {
  i4 = i3;
  i4 = FUNCTION_TABLE_ii[i4 & 63](i1) | 0;
  return i4 | 0;
 } else {
  i4 = HEAP32[(HEAP32[i1 >> 2] | 0) + i3 >> 2] | 0;
  i4 = FUNCTION_TABLE_ii[i4 & 63](i1) | 0;
  return i4 | 0;
 }
 return 0;
}

function __ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorIdNS2_9allocatorIdEEEEKFjvEjPKS6_JEE6invokeERKS8_SA_(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0;
 i3 = HEAP32[i1 >> 2] | 0;
 i4 = HEAP32[i1 + 4 >> 2] | 0;
 i1 = i2 + (i4 >> 1) | 0;
 if (!(i4 & 1)) {
  i4 = i3;
  i4 = FUNCTION_TABLE_ii[i4 & 63](i1) | 0;
  return i4 | 0;
 } else {
  i4 = HEAP32[(HEAP32[i1 >> 2] | 0) + i3 >> 2] | 0;
  i4 = FUNCTION_TABLE_ii[i4 & 63](i1) | 0;
  return i4 | 0;
 }
 return 0;
}

function __ZN10emscripten8internal13MethodInvokerIM14classificationFviiEvPS2_JiiEE6invokeERKS4_S5_ii(i1, i2, i4, i5) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 var i3 = 0, i6 = 0;
 i3 = HEAP32[i1 >> 2] | 0;
 i6 = HEAP32[i1 + 4 >> 2] | 0;
 i1 = i2 + (i6 >> 1) | 0;
 if (!(i6 & 1)) {
  i6 = i3;
  FUNCTION_TABLE_viii[i6 & 31](i1, i4, i5);
  return;
 } else {
  i6 = HEAP32[(HEAP32[i1 >> 2] | 0) + i3 >> 2] | 0;
  FUNCTION_TABLE_viii[i6 & 31](i1, i4, i5);
  return;
 }
}

function __ZNK10__cxxabiv122__base_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib(i6, i4, i3, i5, i7) {
 i6 = i6 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 i7 = i7 | 0;
 var i1 = 0, i2 = 0;
 i2 = HEAP32[i6 + 4 >> 2] | 0;
 i1 = i2 >> 8;
 if (i2 & 1) i1 = HEAP32[(HEAP32[i3 >> 2] | 0) + i1 >> 2] | 0;
 i6 = HEAP32[i6 >> 2] | 0;
 FUNCTION_TABLE_viiiii[HEAP32[(HEAP32[i6 >> 2] | 0) + 24 >> 2] & 7](i6, i4, i3 + i1 | 0, (i2 & 2 | 0) != 0 ? i5 : 2, i7);
 return;
}

function __ZN10emscripten8internal12operator_newI14classificationJEEEPT_DpOT0_() {
 var i1 = 0, i2 = 0;
 i1 = __Znwj(44) | 0;
 __THREW__ = 0;
 invoke_vi(43, i1 | 0);
 i2 = __THREW__;
 __THREW__ = 0;
 if (i2 & 1) {
  i2 = ___cxa_find_matching_catch() | 0;
  __ZdlPv(i1);
  ___resumeException(i2 | 0);
 } else {
  HEAP32[i1 >> 2] = 1780;
  HEAP32[i1 + 16 >> 2] = 0;
  HEAP32[i1 + 32 >> 2] = 0;
  HEAP8[i1 + 36 >> 0] = 0;
  HEAP32[i1 + 40 >> 2] = 0;
  return i1 | 0;
 }
 return 0;
}

function __ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i4, i2, i1, i3) {
 i4 = i4 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 if ((i4 | 0) == (HEAP32[i2 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0, i2, i1, i3); else {
  i4 = HEAP32[i4 + 8 >> 2] | 0;
  FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i4 >> 2] | 0) + 28 >> 2] & 15](i4, i2, i1, i3);
 }
 return;
}

function __ZN10emscripten8internal12operator_newI13neuralNetworkJiNSt3__16vectorIiNS3_9allocatorIiEEEEiiEEEPT_DpOT0_(i2, i3, i4, i5) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 var i1 = 0;
 i1 = __Znwj(192) | 0;
 __THREW__ = 0;
 invoke_viiiii(4, i1 | 0, i2 | 0, i3 | 0, i4 | 0, i5 | 0);
 i5 = __THREW__;
 __THREW__ = 0;
 if (i5 & 1) {
  i5 = ___cxa_find_matching_catch() | 0;
  __ZdlPv(i1);
  ___resumeException(i5 | 0);
 } else return i1 | 0;
 return 0;
}

function __ZNK10__cxxabiv122__base_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i6, i4, i3, i5) {
 i6 = i6 | 0;
 i4 = i4 | 0;
 i3 = i3 | 0;
 i5 = i5 | 0;
 var i1 = 0, i2 = 0;
 i2 = HEAP32[i6 + 4 >> 2] | 0;
 i1 = i2 >> 8;
 if (i2 & 1) i1 = HEAP32[(HEAP32[i3 >> 2] | 0) + i1 >> 2] | 0;
 i6 = HEAP32[i6 >> 2] | 0;
 FUNCTION_TABLE_viiii[HEAP32[(HEAP32[i6 >> 2] | 0) + 28 >> 2] & 15](i6, i4, i3 + i1 | 0, (i2 & 2 | 0) != 0 ? i5 : 2);
 return;
}

function ___towrite(i2) {
 i2 = i2 | 0;
 var i1 = 0, i3 = 0;
 i1 = i2 + 74 | 0;
 i3 = HEAP8[i1 >> 0] | 0;
 HEAP8[i1 >> 0] = i3 + 255 | i3;
 i1 = HEAP32[i2 >> 2] | 0;
 if (!(i1 & 8)) {
  HEAP32[i2 + 8 >> 2] = 0;
  HEAP32[i2 + 4 >> 2] = 0;
  i1 = HEAP32[i2 + 44 >> 2] | 0;
  HEAP32[i2 + 28 >> 2] = i1;
  HEAP32[i2 + 20 >> 2] = i1;
  HEAP32[i2 + 16 >> 2] = i1 + (HEAP32[i2 + 48 >> 2] | 0);
  i1 = 0;
 } else {
  HEAP32[i2 >> 2] = i1 | 32;
  i1 = -1;
 }
 return i1 | 0;
}

function __ZN10emscripten8internal15FunctionInvokerIPFbRNSt3__16vectorIiNS2_9allocatorIiEEEEjRKiEbS7_JjS9_EE6invokeEPSB_PS6_ji(i3, i4, i1, i2) {
 i3 = i3 | 0;
 i4 = i4 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i5 = 0, i6 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i6 = i5;
 i3 = HEAP32[i3 >> 2] | 0;
 HEAP32[i6 >> 2] = i2;
 i4 = FUNCTION_TABLE_iiii[i3 & 31](i4, i1, i6) | 0;
 STACKTOP = i5;
 return i4 | 0;
}

function __ZN10emscripten8internal13MethodInvokerIM11rapidStreamFdvEdPS2_JEE6invokeERKS4_S5_(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, d5 = 0.0;
 i3 = HEAP32[i1 >> 2] | 0;
 i4 = HEAP32[i1 + 4 >> 2] | 0;
 i1 = i2 + (i4 >> 1) | 0;
 if (!(i4 & 1)) {
  i4 = i3;
  d5 = +FUNCTION_TABLE_di[i4 & 15](i1);
  return +d5;
 } else {
  i4 = HEAP32[(HEAP32[i1 >> 2] | 0) + i3 >> 2] | 0;
  d5 = +FUNCTION_TABLE_di[i4 & 15](i1);
  return +d5;
 }
 return 0.0;
}

function copyTempDouble(i1) {
 i1 = i1 | 0;
 HEAP8[tempDoublePtr >> 0] = HEAP8[i1 >> 0];
 HEAP8[tempDoublePtr + 1 >> 0] = HEAP8[i1 + 1 >> 0];
 HEAP8[tempDoublePtr + 2 >> 0] = HEAP8[i1 + 2 >> 0];
 HEAP8[tempDoublePtr + 3 >> 0] = HEAP8[i1 + 3 >> 0];
 HEAP8[tempDoublePtr + 4 >> 0] = HEAP8[i1 + 4 >> 0];
 HEAP8[tempDoublePtr + 5 >> 0] = HEAP8[i1 + 5 >> 0];
 HEAP8[tempDoublePtr + 6 >> 0] = HEAP8[i1 + 6 >> 0];
 HEAP8[tempDoublePtr + 7 >> 0] = HEAP8[i1 + 7 >> 0];
}

function __ZN10emscripten8internal15FunctionInvokerIPFbRNSt3__16vectorIdNS2_9allocatorIdEEEEjRKdEbS7_JjS9_EE6invokeEPSB_PS6_jd(i3, i4, i1, d2) {
 i3 = i3 | 0;
 i4 = i4 | 0;
 i1 = i1 | 0;
 d2 = +d2;
 var i5 = 0, i6 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i6 = i5;
 i3 = HEAP32[i3 >> 2] | 0;
 HEAPF64[i6 >> 3] = d2;
 i4 = FUNCTION_TABLE_iiii[i3 & 31](i4, i1, i6) | 0;
 STACKTOP = i5;
 return i4 | 0;
}

function __ZN10emscripten8internal13MethodInvokerIM8modelSetFbvEbPS2_JEE6invokeERKS4_S5_(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0;
 i3 = HEAP32[i1 >> 2] | 0;
 i4 = HEAP32[i1 + 4 >> 2] | 0;
 i1 = i2 + (i4 >> 1) | 0;
 if (!(i4 & 1)) {
  i4 = i3;
  i4 = FUNCTION_TABLE_ii[i4 & 63](i1) | 0;
  return i4 | 0;
 } else {
  i4 = HEAP32[(HEAP32[i1 >> 2] | 0) + i3 >> 2] | 0;
  i4 = FUNCTION_TABLE_ii[i4 & 63](i1) | 0;
  return i4 | 0;
 }
 return 0;
}

function __ZN10emscripten8internal13MethodInvokerIM20seriesClassificationFbRKNSt3__16vectorINS4_INS4_IdNS3_9allocatorIdEEEENS5_IS7_EEEENS5_IS9_EEEEEbPS2_JSD_EE6invokeERKSF_SG_PSB_(i2, i3, i4) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i1 = 0, i5 = 0;
 i1 = HEAP32[i2 >> 2] | 0;
 i5 = HEAP32[i2 + 4 >> 2] | 0;
 i2 = i3 + (i5 >> 1) | 0;
 if (i5 & 1) i1 = HEAP32[(HEAP32[i2 >> 2] | 0) + i1 >> 2] | 0;
 return FUNCTION_TABLE_iii[i1 & 31](i2, i4) | 0;
}

function __ZN10emscripten8internal12MemberAccessI15trainingExampleNSt3__16vectorIdNS3_9allocatorIdEEEEE7getWireIS2_EEPS7_RKMS2_S7_RKT_(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i2 = i2 + (HEAP32[i1 >> 2] | 0) | 0;
 i1 = __Znwj(12) | 0;
 __THREW__ = 0;
 invoke_vii(8, i1 | 0, i2 | 0);
 i2 = __THREW__;
 __THREW__ = 0;
 if (i2 & 1) {
  i2 = ___cxa_find_matching_catch() | 0;
  __ZdlPv(i1);
  ___resumeException(i2 | 0);
 } else return i1 | 0;
 return 0;
}

function __ZN10emscripten8internal12operator_newI10regressionJEEEPT_DpOT0_() {
 var i1 = 0, i2 = 0;
 i1 = __Znwj(40) | 0;
 __THREW__ = 0;
 invoke_vi(43, i1 | 0);
 i2 = __THREW__;
 __THREW__ = 0;
 if (i2 & 1) {
  i2 = ___cxa_find_matching_catch() | 0;
  __ZdlPv(i1);
  ___resumeException(i2 | 0);
 } else {
  HEAP32[i1 >> 2] = 1436;
  HEAP32[i1 + 16 >> 2] = 0;
  HEAP32[i1 + 32 >> 2] = 0;
  HEAP8[i1 + 36 >> 0] = 0;
  return i1 | 0;
 }
 return 0;
}

function __ZN10emscripten8internal13MethodInvokerIM11rapidStreamFvdEvPS2_JdEE6invokeERKS4_S5_d(i1, i2, d4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 d4 = +d4;
 var i3 = 0, i5 = 0;
 i3 = HEAP32[i1 >> 2] | 0;
 i5 = HEAP32[i1 + 4 >> 2] | 0;
 i1 = i2 + (i5 >> 1) | 0;
 if (!(i5 & 1)) {
  i5 = i3;
  FUNCTION_TABLE_vid[i5 & 1](i1, d4);
  return;
 } else {
  i5 = HEAP32[(HEAP32[i1 >> 2] | 0) + i3 >> 2] | 0;
  FUNCTION_TABLE_vid[i5 & 1](i1, d4);
  return;
 }
}

function __ZN10emscripten8internal13MethodInvokerIM20seriesClassificationFiRKNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEEiPS2_JSA_EE6invokeERKSC_SD_PS8_(i2, i3, i4) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i1 = 0, i5 = 0;
 i1 = HEAP32[i2 >> 2] | 0;
 i5 = HEAP32[i2 + 4 >> 2] | 0;
 i2 = i3 + (i5 >> 1) | 0;
 if (i5 & 1) i1 = HEAP32[(HEAP32[i2 >> 2] | 0) + i1 >> 2] | 0;
 return FUNCTION_TABLE_iii[i1 & 31](i2, i4) | 0;
}

function __ZN10emscripten8internal13MethodInvokerIM20seriesClassificationFbRKNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEEbPS2_JSA_EE6invokeERKSC_SD_PS8_(i2, i3, i4) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i1 = 0, i5 = 0;
 i1 = HEAP32[i2 >> 2] | 0;
 i5 = HEAP32[i2 + 4 >> 2] | 0;
 i2 = i3 + (i5 >> 1) | 0;
 if (i5 & 1) i1 = HEAP32[(HEAP32[i2 >> 2] | 0) + i1 >> 2] | 0;
 return FUNCTION_TABLE_iii[i1 & 31](i2, i4) | 0;
}

function __ZN10emscripten8internal13MethodInvokerIM14classificationFbRKNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEEbPS2_JSA_EE6invokeERKSC_SD_PS8_(i2, i3, i4) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i1 = 0, i5 = 0;
 i1 = HEAP32[i2 >> 2] | 0;
 i5 = HEAP32[i2 + 4 >> 2] | 0;
 i2 = i3 + (i5 >> 1) | 0;
 if (i5 & 1) i1 = HEAP32[(HEAP32[i2 >> 2] | 0) + i1 >> 2] | 0;
 return FUNCTION_TABLE_iii[i1 & 31](i2, i4) | 0;
}

function __ZN10emscripten8internal13MethodInvokerIM20seriesClassificationFvvEvPS2_JEE6invokeERKS4_S5_(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0;
 i3 = HEAP32[i1 >> 2] | 0;
 i4 = HEAP32[i1 + 4 >> 2] | 0;
 i1 = i2 + (i4 >> 1) | 0;
 if (!(i4 & 1)) {
  i4 = i3;
  FUNCTION_TABLE_vi[i4 & 63](i1);
  return;
 } else {
  i4 = HEAP32[(HEAP32[i1 >> 2] | 0) + i3 >> 2] | 0;
  FUNCTION_TABLE_vi[i4 & 63](i1);
  return;
 }
}

function __ZN10emscripten8internal13MethodInvokerIM10regressionFbRKNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEEbPS2_JSA_EE6invokeERKSC_SD_PS8_(i2, i3, i4) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i1 = 0, i5 = 0;
 i1 = HEAP32[i2 >> 2] | 0;
 i5 = HEAP32[i2 + 4 >> 2] | 0;
 i2 = i3 + (i5 >> 1) | 0;
 if (i5 & 1) i1 = HEAP32[(HEAP32[i2 >> 2] | 0) + i1 >> 2] | 0;
 return FUNCTION_TABLE_iii[i1 & 31](i2, i4) | 0;
}

function __ZN10emscripten8internal7InvokerIP14classificationJOiS4_EE6invokeEPFS3_S4_S4_Eii(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i4 = 0, i5 = 0, i6 = 0;
 i4 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i6 = i4 + 4 | 0;
 i5 = i4;
 HEAP32[i6 >> 2] = i1;
 HEAP32[i5 >> 2] = i2;
 i3 = FUNCTION_TABLE_iii[i3 & 31](i6, i5) | 0;
 STACKTOP = i4;
 return i3 | 0;
}

function __ZN10emscripten8internal13MethodInvokerIM8modelSetFbRKNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEEbPS2_JSA_EE6invokeERKSC_SD_PS8_(i2, i3, i4) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i1 = 0, i5 = 0;
 i1 = HEAP32[i2 >> 2] | 0;
 i5 = HEAP32[i2 + 4 >> 2] | 0;
 i2 = i3 + (i5 >> 1) | 0;
 if (i5 & 1) i1 = HEAP32[(HEAP32[i2 >> 2] | 0) + i1 >> 2] | 0;
 return FUNCTION_TABLE_iii[i1 & 31](i2, i4) | 0;
}

function __ZN10emscripten8internal7InvokerIP10regressionJOiS4_EE6invokeEPFS3_S4_S4_Eii(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i4 = 0, i5 = 0, i6 = 0;
 i4 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i6 = i4 + 4 | 0;
 i5 = i4;
 HEAP32[i6 >> 2] = i1;
 HEAP32[i5 >> 2] = i2;
 i3 = FUNCTION_TABLE_iii[i3 & 31](i6, i5) | 0;
 STACKTOP = i4;
 return i3 | 0;
}

function __ZN11rapidStream12accelerationEv(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, d4 = 0.0;
 i3 = HEAP32[i1 + 4 >> 2] | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 i1 = HEAP32[i1 + 8 >> 2] | 0;
 d4 = +HEAPF64[i1 + ((((i3 + -3 | 0) >>> 0) % (i2 >>> 0) | 0) << 3) >> 3];
 return +(+HEAPF64[i1 + ((((i3 + -2 | 0) >>> 0) % (i2 >>> 0) | 0) << 3) >> 3] - d4 - (d4 - +HEAPF64[i1 + ((((i3 + -4 | 0) >>> 0) % (i2 >>> 0) | 0) << 3) >> 3]));
}

function __ZN10emscripten8internal13MethodInvokerIM11rapidStreamFvvEvPS2_JEE6invokeERKS4_S5_(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0;
 i3 = HEAP32[i1 >> 2] | 0;
 i4 = HEAP32[i1 + 4 >> 2] | 0;
 i1 = i2 + (i4 >> 1) | 0;
 if (!(i4 & 1)) {
  i4 = i3;
  FUNCTION_TABLE_vi[i4 & 63](i1);
  return;
 } else {
  i4 = HEAP32[(HEAP32[i1 >> 2] | 0) + i3 >> 2] | 0;
  FUNCTION_TABLE_vi[i4 & 63](i1);
  return;
 }
}

function ___cxa_can_catch(i1, i2, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 var i3 = 0, i5 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i3 = i5;
 HEAP32[i3 >> 2] = HEAP32[i4 >> 2];
 i1 = FUNCTION_TABLE_iiii[HEAP32[(HEAP32[i1 >> 2] | 0) + 16 >> 2] & 31](i1, i2, i3) | 0;
 if (i1) HEAP32[i4 >> 2] = HEAP32[i3 >> 2];
 STACKTOP = i5;
 return i1 & 1 | 0;
}

function __ZN10emscripten8internal12operator_newI8modelSetJEEEPT_DpOT0_() {
 var i1 = 0, i2 = 0;
 i1 = __Znwj(40) | 0;
 HEAP32[i1 >> 2] = 1256;
 i2 = i1 + 4 | 0;
 HEAP32[i2 >> 2] = 0;
 HEAP32[i2 + 4 >> 2] = 0;
 HEAP32[i2 + 8 >> 2] = 0;
 HEAP32[i2 + 12 >> 2] = 0;
 HEAP32[i2 + 16 >> 2] = 0;
 HEAP32[i2 + 20 >> 2] = 0;
 HEAP32[i2 + 24 >> 2] = 0;
 HEAP32[i2 + 28 >> 2] = 0;
 HEAP8[i2 + 32 >> 0] = 0;
 return i1 | 0;
}

function ___muldsi3(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0, i6 = 0;
 i6 = i1 & 65535;
 i5 = i2 & 65535;
 i3 = Math_imul(i5, i6) | 0;
 i4 = i1 >>> 16;
 i1 = (i3 >>> 16) + (Math_imul(i5, i4) | 0) | 0;
 i5 = i2 >>> 16;
 i2 = Math_imul(i5, i6) | 0;
 return (tempRet0 = (i1 >>> 16) + (Math_imul(i5, i4) | 0) + (((i1 & 65535) + i2 | 0) >>> 16) | 0, i1 + i2 << 16 | i3 & 65535 | 0) | 0;
}

function __Znwj(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = (i1 | 0) == 0 ? 1 : i1;
 i1 = _malloc(i2) | 0;
 L1 : do if (!i1) {
  while (1) {
   i1 = __ZSt15get_new_handlerv() | 0;
   if (!i1) break;
   FUNCTION_TABLE_v[i1 & 7]();
   i1 = _malloc(i2) | 0;
   if (i1) break L1;
  }
  i2 = ___cxa_allocate_exception(4) | 0;
  HEAP32[i2 >> 2] = 2200;
  ___cxa_throw(i2 | 0, 968, 28);
 } while (0);
 return i1 | 0;
}

function __ZN11rapidStream3rmsEv(i2) {
 i2 = i2 | 0;
 var d1 = 0.0, d3 = 0.0, i4 = 0, i5 = 0;
 i5 = HEAP32[i2 >> 2] | 0;
 if (!i5) {
  d3 = 0.0;
  d1 = 0.0;
 } else {
  i2 = HEAP32[i2 + 8 >> 2] | 0;
  i4 = 0;
  d1 = 0.0;
  do {
   d3 = +HEAPF64[i2 + (i4 << 3) >> 3];
   d1 = d1 + d3 * d3;
   i4 = i4 + 1 | 0;
  } while (i4 >>> 0 < i5 >>> 0);
  d3 = +(i5 >>> 0);
 }
 return +(+Math_sqrt(+(d1 / d3)));
}

function _fwrite(i2, i5, i1, i3) {
 i2 = i2 | 0;
 i5 = i5 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 var i4 = 0, i6 = 0;
 i4 = Math_imul(i1, i5) | 0;
 if ((HEAP32[i3 + 76 >> 2] | 0) > -1) {
  i6 = (___lockfile(i3) | 0) == 0;
  i2 = ___fwritex(i2, i4, i3) | 0;
  if (!i6) ___unlockfile(i3);
 } else i2 = ___fwritex(i2, i4, i3) | 0;
 if ((i2 | 0) != (i4 | 0)) i1 = (i2 >>> 0) / (i5 >>> 0) | 0;
 return i1 | 0;
}

function __ZNSt3__16vectorIdNS_9allocatorIdEEE9push_backERKd(i4, i3) {
 i4 = i4 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0;
 i1 = i4 + 4 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) == (HEAP32[i4 + 8 >> 2] | 0)) {
  __ZNSt3__16vectorIdNS_9allocatorIdEEE21__push_back_slow_pathIRKdEEvOT_(i4, i3);
  return;
 } else {
  HEAPF64[i2 >> 3] = +HEAPF64[i3 >> 3];
  HEAP32[i1 >> 2] = i2 + 8;
  return;
 }
}

function __ZN10emscripten8internal14raw_destructorINSt3__16vectorIiNS2_9allocatorIiEEEEEEvPT_(i5) {
 i5 = i5 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0;
 if (!i5) return;
 i1 = HEAP32[i5 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = i5 + 4 | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -4 - i2 | 0) >>> 2) << 2);
  __ZdlPv(i1);
 }
 __ZdlPv(i5);
 return;
}

function __ZN10emscripten8internal14raw_destructorINSt3__16vectorIdNS2_9allocatorIdEEEEEEvPT_(i5) {
 i5 = i5 | 0;
 var i1 = 0, i2 = 0, i3 = 0, i4 = 0;
 if (!i5) return;
 i1 = HEAP32[i5 >> 2] | 0;
 i2 = i1;
 if (i1) {
  i3 = i5 + 4 | 0;
  i4 = HEAP32[i3 >> 2] | 0;
  if ((i4 | 0) != (i1 | 0)) HEAP32[i3 >> 2] = i4 + (~((i4 + -8 - i2 | 0) >>> 3) << 3);
  __ZdlPv(i1);
 }
 __ZdlPv(i5);
 return;
}

function __ZNSt3__16vectorIiNS_9allocatorIiEEE9push_backERKi(i4, i3) {
 i4 = i4 | 0;
 i3 = i3 | 0;
 var i1 = 0, i2 = 0;
 i1 = i4 + 4 | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 if ((i2 | 0) == (HEAP32[i4 + 8 >> 2] | 0)) {
  __ZNSt3__16vectorIiNS_9allocatorIiEEE21__push_back_slow_pathIRKiEEvOT_(i4, i3);
  return;
 } else {
  HEAP32[i2 >> 2] = HEAP32[i3 >> 2];
  HEAP32[i1 >> 2] = i2 + 4;
  return;
 }
}

function __ZN11rapidStream7maximumEv(i2) {
 i2 = i2 | 0;
 var d1 = 0.0, i3 = 0, i4 = 0, d5 = 0.0;
 i4 = HEAP32[i2 >> 2] | 0;
 if (!i4) {
  d1 = 2.2250738585072014e-308;
  return +d1;
 }
 i2 = HEAP32[i2 + 8 >> 2] | 0;
 i3 = 0;
 d1 = 2.2250738585072014e-308;
 do {
  d5 = +HEAPF64[i2 + (i3 << 3) >> 3];
  d1 = d5 > d1 ? d5 : d1;
  i3 = i3 + 1 | 0;
 } while (i3 >>> 0 < i4 >>> 0);
 return +d1;
}

function dynCall_viiiiiiiiiii(i12, i1, i4, i5, i6, i7, i8, i9, i10, i11, i2, i3) {
 i12 = i12 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 i8 = i8 | 0;
 i9 = i9 | 0;
 i10 = i10 | 0;
 i11 = i11 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 FUNCTION_TABLE_viiiiiiiiiii[i12 & 1](i1 | 0, i4 | 0, i5 | 0, i6 | 0, i7 | 0, i8 | 0, i9 | 0, i10 | 0, i11 | 0, i2 | 0, i3 | 0);
}

function dynCall_iiiiiiiiiidd(i12, i1, i4, i5, i6, i7, i8, i9, i10, i11, d2, d3) {
 i12 = i12 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 i8 = i8 | 0;
 i9 = i9 | 0;
 i10 = i10 | 0;
 i11 = i11 | 0;
 d2 = +d2;
 d3 = +d3;
 return FUNCTION_TABLE_iiiiiiiiiidd[i12 & 1](i1 | 0, i4 | 0, i5 | 0, i6 | 0, i7 | 0, i8 | 0, i9 | 0, i10 | 0, i11 | 0, +d2, +d3) | 0;
}

function __ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib(i5, i3, i2, i1, i4, i6) {
 i5 = i5 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 i6 = i6 | 0;
 if ((i5 | 0) == (HEAP32[i3 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info29process_static_type_above_dstEPNS_19__dynamic_cast_infoEPKvS4_i(0, i3, i2, i1, i4);
 return;
}

function _memmove(i1, i4, i2) {
 i1 = i1 | 0;
 i4 = i4 | 0;
 i2 = i2 | 0;
 var i3 = 0;
 if ((i4 | 0) < (i1 | 0) & (i1 | 0) < (i4 + i2 | 0)) {
  i3 = i1;
  i4 = i4 + i2 | 0;
  i1 = i1 + i2 | 0;
  while ((i2 | 0) > 0) {
   i1 = i1 - 1 | 0;
   i4 = i4 - 1 | 0;
   i2 = i2 - 1 | 0;
   HEAP8[i1 >> 0] = HEAP8[i4 >> 0] | 0;
  }
  i1 = i3;
 } else _memcpy(i1, i4, i2) | 0;
 return i1 | 0;
}

function __ZN10emscripten8internal12operator_newI14classificationJiiEEEPT_DpOT0_(i2, i3) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i1 = 0;
 i1 = __Znwj(44) | 0;
 __THREW__ = 0;
 invoke_viii(16, i1 | 0, i2 | 0, i3 | 0);
 i3 = __THREW__;
 __THREW__ = 0;
 if (i3 & 1) {
  i3 = ___cxa_find_matching_catch() | 0;
  __ZdlPv(i1);
  ___resumeException(i3 | 0);
 } else return i1 | 0;
 return 0;
}

function __ZN10emscripten8internal12operator_newI10regressionJiiEEEPT_DpOT0_(i2, i3) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i1 = 0;
 i1 = __Znwj(40) | 0;
 __THREW__ = 0;
 invoke_viii(7, i1 | 0, i2 | 0, i3 | 0);
 i3 = __THREW__;
 __THREW__ = 0;
 if (i3 & 1) {
  i3 = ___cxa_find_matching_catch() | 0;
  __ZdlPv(i1);
  ___resumeException(i3 | 0);
 } else return i1 | 0;
 return 0;
}

function __ZN10emscripten8internal7InvokerIP14classificationJONS2_19classificationTypesEEE6invokeEPFS3_S5_ES4_(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0;
 i3 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i4 = i3;
 HEAP32[i4 >> 2] = i1;
 i2 = FUNCTION_TABLE_ii[i2 & 63](i4) | 0;
 STACKTOP = i3;
 return i2 | 0;
}

function _llvm_cttz_i32(i2) {
 i2 = i2 | 0;
 var i1 = 0;
 i1 = HEAP8[cttz_i8 + (i2 & 255) >> 0] | 0;
 if ((i1 | 0) < 8) return i1 | 0;
 i1 = HEAP8[cttz_i8 + (i2 >> 8 & 255) >> 0] | 0;
 if ((i1 | 0) < 8) return i1 + 8 | 0;
 i1 = HEAP8[cttz_i8 + (i2 >> 16 & 255) >> 0] | 0;
 if ((i1 | 0) < 8) return i1 + 16 | 0;
 return (HEAP8[cttz_i8 + (i2 >>> 24) >> 0] | 0) + 24 | 0;
}

function dynCall_viiiiiidddii(i12, i1, i4, i5, i6, i7, i8, d9, d10, d11, i2, i3) {
 i12 = i12 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 i8 = i8 | 0;
 d9 = +d9;
 d10 = +d10;
 d11 = +d11;
 i2 = i2 | 0;
 i3 = i3 | 0;
 FUNCTION_TABLE_viiiiiidddii[i12 & 1](i1 | 0, i4 | 0, i5 | 0, i6 | 0, i7 | 0, i8 | 0, +d9, +d10, +d11, i2 | 0, i3 | 0);
}

function dynCall_iiiiiiiiiii(i11, i1, i3, i4, i5, i6, i7, i8, i9, i10, i2) {
 i11 = i11 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 i8 = i8 | 0;
 i9 = i9 | 0;
 i10 = i10 | 0;
 i2 = i2 | 0;
 return FUNCTION_TABLE_iiiiiiiiiii[i11 & 1](i1 | 0, i3 | 0, i4 | 0, i5 | 0, i6 | 0, i7 | 0, i8 | 0, i9 | 0, i10 | 0, i2 | 0) | 0;
}

function _calloc(i3, i1) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 var i2 = 0;
 if (i3) {
  i2 = Math_imul(i1, i3) | 0;
  if ((i1 | i3) >>> 0 > 65535) i2 = ((i2 >>> 0) / (i3 >>> 0) | 0 | 0) == (i1 | 0) ? i2 : -1;
 } else i2 = 0;
 i1 = _malloc(i2) | 0;
 if (!i1) return i1 | 0;
 if (!(HEAP32[i1 + -4 >> 2] & 3)) return i1 | 0;
 _memset(i1 | 0, 0, i2 | 0) | 0;
 return i1 | 0;
}

function __embind_register_value_object_field__wrapper(i1, i2, i3, i4, i5, i6, i7, i8, i9, i10) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 i8 = i8 | 0;
 i9 = i9 | 0;
 i10 = i10 | 0;
 __embind_register_value_object_field(i1 | 0, i2 | 0, i3 | 0, i4 | 0, i5 | 0, i6 | 0, i7 | 0, i8 | 0, i9 | 0, i10 | 0);
}

function dynCall_viiiiiiiiii(i11, i1, i3, i4, i5, i6, i7, i8, i9, i10, i2) {
 i11 = i11 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 i8 = i8 | 0;
 i9 = i9 | 0;
 i10 = i10 | 0;
 i2 = i2 | 0;
 FUNCTION_TABLE_viiiiiiiiii[i11 & 1](i1 | 0, i3 | 0, i4 | 0, i5 | 0, i6 | 0, i7 | 0, i8 | 0, i9 | 0, i10 | 0, i2 | 0);
}

function __ZN11rapidStream7minimumEv(i2) {
 i2 = i2 | 0;
 var d1 = 0.0, i3 = 0, i4 = 0, d5 = 0.0;
 i4 = HEAP32[i2 >> 2] | 0;
 if (!i4) {
  d1 = inf;
  return +d1;
 }
 i2 = HEAP32[i2 + 8 >> 2] | 0;
 i3 = 0;
 d1 = inf;
 do {
  d5 = +HEAPF64[i2 + (i3 << 3) >> 3];
  d1 = d5 < d1 ? d5 : d1;
  i3 = i3 + 1 | 0;
 } while (i3 >>> 0 < i4 >>> 0);
 return +d1;
}

function __ZN6LIBSVML4infoEPKcz(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0, i5 = 0;
 i3 = STACKTOP;
 STACKTOP = STACKTOP + 1040 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i4 = i3 + 16 | 0;
 i5 = i3;
 HEAP32[i5 >> 2] = i2;
 _vsprintf(i4, i1, i5) | 0;
 FUNCTION_TABLE_vi[HEAP32[2004 >> 2] & 63](i4);
 STACKTOP = i3;
 return;
}

function __ZN10emscripten8internal7InvokerIP17svmClassificationJOiEE6invokeEPFS3_S4_Ei(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0;
 i3 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i4 = i3;
 HEAP32[i4 >> 2] = i1;
 i2 = FUNCTION_TABLE_ii[i2 & 63](i4) | 0;
 STACKTOP = i3;
 return i2 | 0;
}

function __ZN10emscripten8internal7InvokerIP11rapidStreamJOiEE6invokeEPFS3_S4_Ei(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 var i3 = 0, i4 = 0;
 i3 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i4 = i3;
 HEAP32[i4 >> 2] = i1;
 i2 = FUNCTION_TABLE_ii[i2 & 63](i4) | 0;
 STACKTOP = i3;
 return i2 | 0;
}

function __ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi(i4, i2, i1, i3) {
 i4 = i4 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 if ((i4 | 0) == (HEAP32[i2 + 8 >> 2] | 0)) __ZNK10__cxxabiv117__class_type_info24process_found_base_classEPNS_19__dynamic_cast_infoEPvi(0, i2, i1, i3);
 return;
}

function __ZN20seriesClassification5resetEv(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0, i4 = 0;
 i3 = HEAP32[i1 >> 2] | 0;
 i2 = i1 + 4 | 0;
 i1 = HEAP32[i2 >> 2] | 0;
 if ((i1 | 0) == (i3 | 0)) return;
 do {
  i4 = i1 + -16 | 0;
  HEAP32[i2 >> 2] = i4;
  __ZN3dtwD2Ev(i4);
  i1 = HEAP32[i2 >> 2] | 0;
 } while ((i1 | 0) != (i3 | 0));
 return;
}

function _rand() {
 var i1 = 0, i2 = 0, i3 = 0;
 i2 = 1240;
 i2 = ___muldi3(HEAP32[i2 >> 2] | 0, HEAP32[i2 + 4 >> 2] | 0, 1284865837, 1481765933) | 0;
 i2 = _i64Add(i2 | 0, tempRet0 | 0, 1, 0) | 0;
 i1 = tempRet0;
 i3 = 1240;
 HEAP32[i3 >> 2] = i2;
 HEAP32[i3 + 4 >> 2] = i1;
 i1 = _bitshift64Lshr(i2 | 0, i1 | 0, 33) | 0;
 return i1 | 0;
}

function __ZN8modelSetC2Ev(i1) {
 i1 = i1 | 0;
 HEAP32[i1 >> 2] = 1256;
 i1 = i1 + 4 | 0;
 HEAP32[i1 >> 2] = 0;
 HEAP32[i1 + 4 >> 2] = 0;
 HEAP32[i1 + 8 >> 2] = 0;
 HEAP32[i1 + 12 >> 2] = 0;
 HEAP32[i1 + 16 >> 2] = 0;
 HEAP32[i1 + 20 >> 2] = 0;
 HEAP32[i1 + 24 >> 2] = 0;
 HEAP32[i1 + 28 >> 2] = 0;
 HEAP8[i1 + 32 >> 0] = 0;
 return;
}

function __ZN11rapidStream4meanEv(i2) {
 i2 = i2 | 0;
 var d1 = 0.0, i3 = 0, i4 = 0;
 i4 = HEAP32[i2 >> 2] | 0;
 if (!i4) d1 = 0.0; else {
  i2 = HEAP32[i2 + 8 >> 2] | 0;
  i3 = 0;
  d1 = 0.0;
  do {
   d1 = d1 + +HEAPF64[i2 + (i3 << 3) >> 3];
   i3 = i3 + 1 | 0;
  } while ((i3 | 0) != (i4 | 0));
 }
 return +(d1 / +(i4 >>> 0));
}

function _sn_write(i1, i3, i2) {
 i1 = i1 | 0;
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i4 = 0, i5 = 0;
 i4 = i1 + 20 | 0;
 i5 = HEAP32[i4 >> 2] | 0;
 i1 = (HEAP32[i1 + 16 >> 2] | 0) - i5 | 0;
 i1 = i1 >>> 0 > i2 >>> 0 ? i2 : i1;
 _memcpy(i5 | 0, i3 | 0, i1 | 0) | 0;
 HEAP32[i4 >> 2] = (HEAP32[i4 >> 2] | 0) + i1;
 return i2 | 0;
}

function __ZN17knnClassification4setKEi(i3, i2) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 var i1 = 0;
 HEAP32[i3 + 32 >> 2] = i2;
 i1 = i3 + 36 | 0;
 if ((HEAP32[i1 >> 2] | 0) == (i2 | 0)) return;
 i3 = ((HEAP32[i3 + 24 >> 2] | 0) - (HEAP32[i3 + 20 >> 2] | 0) | 0) / 24 | 0;
 HEAP32[i1 >> 2] = (i3 | 0) < (i2 | 0) ? i3 : i2;
 return;
}

function _svm_predict(i2, i3) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i1 = 0, d4 = 0.0;
 i1 = HEAP32[i2 + 96 >> 2] | 0;
 if (((HEAP32[i2 >> 2] | 0) + -2 | 0) >>> 0 < 3) i1 = _malloc(8) | 0; else i1 = _malloc(((Math_imul(i1 + -1 | 0, i1) | 0) / 2 | 0) << 3) | 0;
 d4 = +_svm_predict_values(i2, i3, i1);
 _free(i1);
 return +d4;
}

function ___cxa_get_globals_fast() {
 var i1 = 0, i2 = 0;
 i1 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 if (!(_pthread_once(2424, 3) | 0)) {
  i2 = _pthread_getspecific(HEAP32[605] | 0) | 0;
  STACKTOP = i1;
  return i2 | 0;
 } else _abort_message(7841, i1);
 return 0;
}

function __ZN10emscripten8internal15raw_constructorI15trainingExampleJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE() {
 var i1 = 0;
 i1 = __Znwj(24) | 0;
 HEAP32[i1 >> 2] = 0;
 HEAP32[i1 + 4 >> 2] = 0;
 HEAP32[i1 + 8 >> 2] = 0;
 HEAP32[i1 + 12 >> 2] = 0;
 HEAP32[i1 + 16 >> 2] = 0;
 HEAP32[i1 + 20 >> 2] = 0;
 return i1 | 0;
}

function __ZN11rapidStream8velocityEv(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 i3 = HEAP32[i1 + 4 >> 2] | 0;
 i2 = HEAP32[i1 >> 2] | 0;
 i1 = HEAP32[i1 + 8 >> 2] | 0;
 return +(+HEAPF64[i1 + ((((i3 + -1 | 0) >>> 0) % (i2 >>> 0) | 0) << 3) >> 3] - +HEAPF64[i1 + ((((i3 + -2 | 0) >>> 0) % (i2 >>> 0) | 0) << 3) >> 3]);
}

function __ZN11rapidStream3sumEv(i2) {
 i2 = i2 | 0;
 var d1 = 0.0, i3 = 0, i4 = 0;
 i4 = HEAP32[i2 >> 2] | 0;
 if (!i4) {
  d1 = 0.0;
  return +d1;
 }
 i2 = HEAP32[i2 + 8 >> 2] | 0;
 i3 = 0;
 d1 = 0.0;
 do {
  d1 = d1 + +HEAPF64[i2 + (i3 << 3) >> 3];
  i3 = i3 + 1 | 0;
 } while (i3 >>> 0 < i4 >>> 0);
 return +d1;
}

function _snprintf(i3, i2, i1, i4) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0;
 i5 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i6 = i5;
 HEAP32[i6 >> 2] = i4;
 i4 = _vsnprintf(i3, i2, i1, i6) | 0;
 STACKTOP = i5;
 return i4 | 0;
}

function __ZN10__cxxabiv112_GLOBAL__N_19destruct_EPv(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 _free(i1);
 if (!(_pthread_setspecific(HEAP32[605] | 0, 0) | 0)) {
  STACKTOP = i2;
  return;
 } else _abort_message(8045, i2);
}

function ___uremdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0;
 i6 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 i5 = i6 | 0;
 ___udivmoddi4(i1, i2, i3, i4, i5) | 0;
 STACKTOP = i6;
 return (tempRet0 = HEAP32[i5 + 4 >> 2] | 0, HEAP32[i5 >> 2] | 0) | 0;
}

function ___stdio_close(i1) {
 i1 = i1 | 0;
 var i2 = 0, i3 = 0;
 i2 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i3 = i2;
 HEAP32[i3 >> 2] = HEAP32[i1 + 60 >> 2];
 i1 = ___syscall_ret(___syscall6(6, i3 | 0) | 0) | 0;
 STACKTOP = i2;
 return i1 | 0;
}

function __ZN11rapidStream5clearEv(i3) {
 i3 = i3 | 0;
 var i1 = 0, i2 = 0;
 HEAP32[i3 + 4 >> 2] = 0;
 i1 = HEAP32[i3 >> 2] | 0;
 i2 = __Znaj(i1 >>> 0 > 536870911 ? -1 : i1 << 3) | 0;
 HEAP32[i3 + 8 >> 2] = i2;
 if (!i1) return;
 _memset(i2 | 0, 0, (i1 >>> 0 > 1 ? i1 << 3 : 8) | 0) | 0;
 return;
}

function _abort_message(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 var i3 = 0, i4 = 0;
 i3 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i4 = i3;
 HEAP32[i4 >> 2] = i2;
 i3 = HEAP32[619] | 0;
 _vfprintf(i3, i1, i4) | 0;
 _fputc(10, i3) | 0;
 _abort();
}

function __ZN10emscripten8internal12operator_newI20seriesClassificationJEEEPT_DpOT0_() {
 var i1 = 0;
 i1 = __Znwj(24) | 0;
 HEAP32[i1 >> 2] = 0;
 HEAP32[i1 + 4 >> 2] = 0;
 HEAP32[i1 + 8 >> 2] = 0;
 HEAP32[i1 + 12 >> 2] = 0;
 HEAP32[i1 + 16 >> 2] = 0;
 HEAP32[i1 + 20 >> 2] = 0;
 return i1 | 0;
}

function __ZN10emscripten8internal15FunctionInvokerIPFbRNSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEjRKS4_EbS8_JjSA_EE6invokeEPSC_PS7_jPS4_(i3, i4, i1, i2) {
 i3 = i3 | 0;
 i4 = i4 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 return FUNCTION_TABLE_iiii[HEAP32[i3 >> 2] & 31](i4, i1, i2) | 0;
}

function _fprintf(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 var i4 = 0, i5 = 0;
 i4 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 i5 = i4;
 HEAP32[i5 >> 2] = i3;
 i3 = _vfprintf(i1, i2, i5) | 0;
 STACKTOP = i4;
 return i3 | 0;
}

function __ZN11rapidStream12pushToWindowEd(i2, d1) {
 i2 = i2 | 0;
 d1 = +d1;
 var i3 = 0, i4 = 0;
 i3 = i2 + 4 | 0;
 i4 = HEAP32[i3 >> 2] | 0;
 HEAPF64[(HEAP32[i2 + 8 >> 2] | 0) + (i4 << 3) >> 3] = d1;
 HEAP32[i3 >> 2] = ((i4 + 1 | 0) >>> 0) % ((HEAP32[i2 >> 2] | 0) >>> 0) | 0;
 return;
}

function ___muldi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 var i5 = 0, i6 = 0;
 i5 = i1;
 i6 = i3;
 i3 = ___muldsi3(i5, i6) | 0;
 i1 = tempRet0;
 return (tempRet0 = (Math_imul(i2, i6) | 0) + (Math_imul(i4, i5) | 0) + i1 | i1 & 0, i3 | 0 | 0) | 0;
}

function __ZN10__cxxabiv112_GLOBAL__N_110construct_Ev() {
 var i1 = 0;
 i1 = STACKTOP;
 STACKTOP = STACKTOP + 16 | 0;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 if (!(_pthread_key_create(2420, 58) | 0)) {
  STACKTOP = i1;
  return;
 } else _abort_message(7995, i1);
}

function __ZN14classification4setKEii(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = HEAP32[(HEAP32[i1 + 4 >> 2] | 0) + (i2 << 2) >> 2] | 0;
 if (!i1) i1 = 0; else i1 = ___dynamic_cast(i1, 200, 304, 0) | 0;
 __ZN17knnClassification4setKEi(i1, i3);
 return;
}

function __ZNK6LIBSVM6Kernel18kernel_precomputedEii(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = HEAP32[i3 + 12 >> 2] | 0;
 return +(+HEAPF64[(HEAP32[i3 + (i1 << 2) >> 2] | 0) + (~~+HEAPF64[(HEAP32[i3 + (i2 << 2) >> 2] | 0) + 8 >> 3] << 4) + 8 >> 3]);
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6insertEjPKc(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 return __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6insertEjPKcj(i3, i1, i2, _strlen(i2) | 0) | 0;
}

function __ZN6LIBSVM6KernelD0Ev(i2) {
 i2 = i2 | 0;
 var i1 = 0;
 HEAP32[i2 >> 2] = 1928;
 i1 = HEAP32[i2 + 12 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i2 + 16 >> 2] | 0;
 if (!i1) {
  __ZdlPv(i2);
  return;
 }
 __ZdaPv(i1);
 __ZdlPv(i2);
 return;
}

function b20(i1, i2, i4, i5, i6, i7, i8, i9, i10, d11, d3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 i8 = i8 | 0;
 i9 = i9 | 0;
 i10 = i10 | 0;
 d11 = +d11;
 d3 = +d3;
 nullFunc_iiiiiiiiiidd(20);
 return 0;
}

function copyTempFloat(i1) {
 i1 = i1 | 0;
 HEAP8[tempDoublePtr >> 0] = HEAP8[i1 >> 0];
 HEAP8[tempDoublePtr + 1 >> 0] = HEAP8[i1 + 1 >> 0];
 HEAP8[tempDoublePtr + 2 >> 0] = HEAP8[i1 + 2 >> 0];
 HEAP8[tempDoublePtr + 3 >> 0] = HEAP8[i1 + 3 >> 0];
}

function __ZN10emscripten8internal12operator_newINSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEJEEEPT_DpOT0_() {
 var i1 = 0;
 i1 = __Znwj(12) | 0;
 HEAP32[i1 >> 2] = 0;
 HEAP32[i1 + 4 >> 2] = 0;
 HEAP32[i1 + 8 >> 2] = 0;
 return i1 | 0;
}

function b6(i1, i2, i4, i5, i6, i7, i8, i9, i10, i11, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 i8 = i8 | 0;
 i9 = i9 | 0;
 i10 = i10 | 0;
 i11 = i11 | 0;
 i3 = i3 | 0;
 nullFunc_viiiiiiiiiii(6);
}

function _bitshift64Ashr(i3, i2, i1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 if ((i1 | 0) < 32) {
  tempRet0 = i2 >> i1;
  return i3 >>> i1 | (i2 & (1 << i1) - 1) << 32 - i1;
 }
 tempRet0 = (i2 | 0) < 0 ? -1 : 0;
 return i2 >> i1 - 32 | 0;
}

function __ZN10emscripten8internal12VectorAccessINSt3__16vectorIdNS2_9allocatorIdEEEEE3setERS6_jRKd(i2, i1, i3) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 HEAPF64[(HEAP32[i2 >> 2] | 0) + (i1 << 3) >> 3] = +HEAPF64[i3 >> 3];
 return 1;
}

function b8(i1, i2, i4, i5, i6, i7, d8, d9, d10, i11, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 d8 = +d8;
 d9 = +d9;
 d10 = +d10;
 i11 = i11 | 0;
 i3 = i3 | 0;
 nullFunc_viiiiiidddii(8);
}

function dynCall_viiiiii(i7, i1, i2, i3, i4, i5, i6) {
 i7 = i7 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 FUNCTION_TABLE_viiiiii[i7 & 3](i1 | 0, i2 | 0, i3 | 0, i4 | 0, i5 | 0, i6 | 0);
}

function b4(i1, i2, i3, i4, i5, i6, i7, i8, i9, i10) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 i8 = i8 | 0;
 i9 = i9 | 0;
 i10 = i10 | 0;
 nullFunc_iiiiiiiiiii(4);
 return 0;
}

function __ZN10emscripten8internal12VectorAccessINSt3__16vectorIiNS2_9allocatorIiEEEEE3setERS6_jRKi(i2, i1, i3) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 i3 = i3 | 0;
 HEAP32[(HEAP32[i2 >> 2] | 0) + (i1 << 2) >> 2] = HEAP32[i3 >> 2];
 return 1;
}

function _bitshift64Shl(i3, i2, i1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 if ((i1 | 0) < 32) {
  tempRet0 = i2 << i1 | (i3 & (1 << i1) - 1 << 32 - i1) >>> 32 - i1;
  return i3 << i1;
 }
 tempRet0 = i3 << i1 - 32;
 return 0;
}

function __ZN10emscripten8internal12operator_newINSt3__16vectorIiNS2_9allocatorIiEEEEJEEEPT_DpOT0_() {
 var i1 = 0;
 i1 = __Znwj(12) | 0;
 HEAP32[i1 >> 2] = 0;
 HEAP32[i1 + 4 >> 2] = 0;
 HEAP32[i1 + 8 >> 2] = 0;
 return i1 | 0;
}

function __ZN10emscripten8internal12operator_newINSt3__16vectorIdNS2_9allocatorIdEEEEJEEEPT_DpOT0_() {
 var i1 = 0;
 i1 = __Znwj(12) | 0;
 HEAP32[i1 >> 2] = 0;
 HEAP32[i1 + 4 >> 2] = 0;
 HEAP32[i1 + 8 >> 2] = 0;
 return i1 | 0;
}

function _bitshift64Lshr(i3, i2, i1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 if ((i1 | 0) < 32) {
  tempRet0 = i2 >>> i1;
  return i3 >>> i1 | (i2 & (1 << i1) - 1) << 32 - i1;
 }
 tempRet0 = 0;
 return i2 >>> i1 - 32 | 0;
}

function b12(i1, i2, i3, i4, i5, i6, i7, i8, i9, i10) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 i7 = i7 | 0;
 i8 = i8 | 0;
 i9 = i9 | 0;
 i10 = i10 | 0;
 nullFunc_viiiiiiiiii(12);
}

function dynCall_iiiiii(i6, i1, i2, i3, i4, i5) {
 i6 = i6 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 return FUNCTION_TABLE_iiiiii[i6 & 3](i1 | 0, i2 | 0, i3 | 0, i4 | 0, i5 | 0) | 0;
}

function __ZN6LIBSVM6KernelD2Ev(i2) {
 i2 = i2 | 0;
 var i1 = 0;
 HEAP32[i2 >> 2] = 1928;
 i1 = HEAP32[i2 + 12 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 i1 = HEAP32[i2 + 16 >> 2] | 0;
 if (!i1) return;
 __ZdaPv(i1);
 return;
}

function runPostSets() {}
function _i64Add(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i3 = i1 + i3 >>> 0;
 return (tempRet0 = i2 + i4 + (i3 >>> 0 < i1 >>> 0 | 0) >>> 0, i3 | 0) | 0;
}

function dynCall_viiiii(i6, i1, i2, i3, i4, i5) {
 i6 = i6 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 FUNCTION_TABLE_viiiii[i6 & 7](i1 | 0, i2 | 0, i3 | 0, i4 | 0, i5 | 0);
}

function __ZN10emscripten8internal14raw_destructorI11rapidStreamEEvPT_(i2) {
 i2 = i2 | 0;
 var i1 = 0;
 if (!i2) return;
 i1 = HEAP32[i2 + 8 >> 2] | 0;
 if (i1) __ZdaPv(i1);
 __ZdlPv(i2);
 return;
}
function stackAlloc(i2) {
 i2 = i2 | 0;
 var i1 = 0;
 i1 = STACKTOP;
 STACKTOP = STACKTOP + i2 | 0;
 STACKTOP = STACKTOP + 15 & -16;
 if ((STACKTOP | 0) >= (STACK_MAX | 0)) abort();
 return i1 | 0;
}

function _i64Subtract(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i4 = i2 - i4 - (i3 >>> 0 > i1 >>> 0 | 0) >>> 0;
 return (tempRet0 = i4, i1 - i3 >>> 0 | 0) | 0;
}

function __ZN10emscripten8internal14raw_destructorI17svmClassificationEEvPT_(i1) {
 i1 = i1 | 0;
 if (!i1) return;
 FUNCTION_TABLE_vi[HEAP32[(HEAP32[i1 >> 2] | 0) + 4 >> 2] & 63](i1);
 return;
}

function __ZN10emscripten8internal14raw_destructorI17knnClassificationEEvPT_(i1) {
 i1 = i1 | 0;
 if (!i1) return;
 FUNCTION_TABLE_vi[HEAP32[(HEAP32[i1 >> 2] | 0) + 4 >> 2] & 63](i1);
 return;
}

function ___strdup(i3) {
 i3 = i3 | 0;
 var i1 = 0, i2 = 0;
 i2 = (_strlen(i3) | 0) + 1 | 0;
 i1 = _malloc(i2) | 0;
 if (!i1) i1 = 0; else _memcpy(i1 | 0, i3 | 0, i2 | 0) | 0;
 return i1 | 0;
}

function __ZN10emscripten8internal14raw_destructorI14classificationEEvPT_(i1) {
 i1 = i1 | 0;
 if (!i1) return;
 FUNCTION_TABLE_vi[HEAP32[(HEAP32[i1 >> 2] | 0) + 4 >> 2] & 63](i1);
 return;
}

function dynCall_iiiii(i5, i1, i2, i3, i4) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 return FUNCTION_TABLE_iiiii[i5 & 7](i1 | 0, i2 | 0, i3 | 0, i4 | 0) | 0;
}

function __ZN10emscripten8internal14raw_destructorI13neuralNetworkEEvPT_(i1) {
 i1 = i1 | 0;
 if (!i1) return;
 FUNCTION_TABLE_vi[HEAP32[(HEAP32[i1 >> 2] | 0) + 4 >> 2] & 63](i1);
 return;
}

function __ZN10emscripten8internal14raw_destructorI10regressionEEvPT_(i1) {
 i1 = i1 | 0;
 if (!i1) return;
 FUNCTION_TABLE_vi[HEAP32[(HEAP32[i1 >> 2] | 0) + 4 >> 2] & 63](i1);
 return;
}

function dynCall_iiiid(i5, i1, i2, i3, d4) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 d4 = +d4;
 return FUNCTION_TABLE_iiiid[i5 & 1](i1 | 0, i2 | 0, i3 | 0, +d4) | 0;
}

function __ZN10emscripten8internal14raw_destructorI8modelSetEEvPT_(i1) {
 i1 = i1 | 0;
 if (!i1) return;
 FUNCTION_TABLE_vi[HEAP32[(HEAP32[i1 >> 2] | 0) + 4 >> 2] & 63](i1);
 return;
}

function __ZNK10__cxxabiv123__fundamental_type_info9can_catchEPKNS_16__shim_type_infoERPv(i2, i3, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 return (i2 | 0) == (i3 | 0) | 0;
}

function dynCall_viiii(i5, i1, i2, i3, i4) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 FUNCTION_TABLE_viiii[i5 & 15](i1 | 0, i2 | 0, i3 | 0, i4 | 0);
}

function __ZN10emscripten8internal7InvokerIPNSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEJEE6invokeEPFS8_vE(i1) {
 i1 = i1 | 0;
 return FUNCTION_TABLE_i[i1 & 15]() | 0;
}

function ___syscall_ret(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 if (i1 >>> 0 > 4294963200) {
  i2 = ___errno_location() | 0;
  HEAP32[i2 >> 2] = 0 - i1;
  i1 = -1;
 }
 return i1 | 0;
}

function ___errno_location() {
 var i1 = 0;
 if (!(HEAP32[608] | 0)) i1 = 2488; else {
  i1 = (_pthread_self() | 0) + 60 | 0;
  i1 = HEAP32[i1 >> 2] | 0;
 }
 return i1 | 0;
}

function __ZNK17svmClassification14getWhichInputsEv(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 HEAP32[i1 >> 2] = 0;
 HEAP32[i1 + 4 >> 2] = 0;
 HEAP32[i1 + 8 >> 2] = 0;
 return;
}

function __ZNK10__cxxabiv116__enum_type_info9can_catchEPKNS_16__shim_type_infoERPv(i2, i3, i1) {
 i2 = i2 | 0;
 i3 = i3 | 0;
 i1 = i1 | 0;
 return (i2 | 0) == (i3 | 0) | 0;
}

function dynCall_viiid(i5, i1, i2, i3, d4) {
 i5 = i5 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 d4 = +d4;
 FUNCTION_TABLE_viiid[i5 & 1](i1 | 0, i2 | 0, i3 | 0, +d4);
}

function __ZNKSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEE4sizeEv(i1) {
 i1 = i1 | 0;
 return ((HEAP32[i1 + 4 >> 2] | 0) - (HEAP32[i1 >> 2] | 0) | 0) / 24 | 0 | 0;
}

function __ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev(i1) {
 i1 = i1 | 0;
 if (HEAP8[i1 >> 0] & 1) __ZdlPv(HEAP32[i1 + 8 >> 2] | 0);
 return;
}

function __ZNK17knnClassification14getWhichInputsEv(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 __ZNSt3__16vectorIiNS_9allocatorIiEEEC2ERKS3_(i1, i2 + 8 | 0);
 return;
}

function dynCall_iiii(i4, i1, i2, i3) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 return FUNCTION_TABLE_iiii[i4 & 31](i1 | 0, i2 | 0, i3 | 0) | 0;
}

function __ZN10emscripten8internal7InvokerIPNSt3__16vectorIiNS2_9allocatorIiEEEEJEE6invokeEPFS7_vE(i1) {
 i1 = i1 | 0;
 return FUNCTION_TABLE_i[i1 & 15]() | 0;
}

function __ZN10emscripten8internal7InvokerIPNSt3__16vectorIdNS2_9allocatorIdEEEEJEE6invokeEPFS7_vE(i1) {
 i1 = i1 | 0;
 return FUNCTION_TABLE_i[i1 & 15]() | 0;
}

function dynCall_diii(i4, i1, i2, i3) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 return +FUNCTION_TABLE_diii[i4 & 15](i1 | 0, i2 | 0, i3 | 0);
}

function __ZNK13neuralNetwork14getWhichInputsEv(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 __ZNSt3__16vectorIiNS_9allocatorIiEEEC2ERKS3_(i1, i2 + 8 | 0);
 return;
}

function __ZN20seriesClassification8getCostsEv(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 __ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_(i1, i2 + 12 | 0);
 return;
}

function dynCall_viii(i4, i1, i2, i3) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 FUNCTION_TABLE_viii[i4 & 31](i1 | 0, i2 | 0, i3 | 0);
}

function __ZN6LIBSVML19print_string_stdoutEPKc(i1) {
 i1 = i1 | 0;
 var i2 = 0;
 i2 = HEAP32[620] | 0;
 _fputs(i1, i2) | 0;
 _fflush(i2) | 0;
 return;
}

function __ZN10emscripten8internal13getActualTypeI17svmClassificationEEPKvPT_(i1) {
 i1 = i1 | 0;
 return HEAP32[(HEAP32[i1 >> 2] | 0) + -4 >> 2] | 0;
}

function __ZN10emscripten8internal13getActualTypeI17knnClassificationEEPKvPT_(i1) {
 i1 = i1 | 0;
 return HEAP32[(HEAP32[i1 >> 2] | 0) + -4 >> 2] | 0;
}

function __ZN10emscripten8internal13getActualTypeI14classificationEEPKvPT_(i1) {
 i1 = i1 | 0;
 return HEAP32[(HEAP32[i1 >> 2] | 0) + -4 >> 2] | 0;
}

function __ZN10emscripten8internal13getActualTypeI13neuralNetworkEEPKvPT_(i1) {
 i1 = i1 | 0;
 return HEAP32[(HEAP32[i1 >> 2] | 0) + -4 >> 2] | 0;
}

function b10(i1, i2, i3, i4, i5, i6) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 i6 = i6 | 0;
 nullFunc_viiiiii(10);
}

function ___cxa_is_pointer_type(i1) {
 i1 = i1 | 0;
 if (!i1) i1 = 0; else i1 = (___dynamic_cast(i1, 1e3, 1048, 0) | 0) != 0;
 return i1 & 1 | 0;
}

function __ZN10emscripten8internal7InvokerIP20seriesClassificationJEE6invokeEPFS3_vE(i1) {
 i1 = i1 | 0;
 return FUNCTION_TABLE_i[i1 & 15]() | 0;
}

function __ZN10emscripten8internal13getActualTypeINSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEEEPKvPT_(i1) {
 i1 = i1 | 0;
 return 80;
}

function dynCall_viid(i4, i1, i2, d3) {
 i4 = i4 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 d3 = +d3;
 FUNCTION_TABLE_viid[i4 & 3](i1 | 0, i2 | 0, +d3);
}

function __ZN10emscripten8internal13getActualTypeI10regressionEEPKvPT_(i1) {
 i1 = i1 | 0;
 return HEAP32[(HEAP32[i1 >> 2] | 0) + -4 >> 2] | 0;
}

function __ZNKSt3__16vectorIiNS_9allocatorIiEEE4sizeEv(i1) {
 i1 = i1 | 0;
 return (HEAP32[i1 + 4 >> 2] | 0) - (HEAP32[i1 >> 2] | 0) >> 2 | 0;
}

function __ZNKSt3__16vectorIdNS_9allocatorIdEEE4sizeEv(i1) {
 i1 = i1 | 0;
 return (HEAP32[i1 + 4 >> 2] | 0) - (HEAP32[i1 >> 2] | 0) >> 3 | 0;
}

function __ZN10emscripten8internal13getActualTypeI8modelSetEEPKvPT_(i1) {
 i1 = i1 | 0;
 return HEAP32[(HEAP32[i1 >> 2] | 0) + -4 >> 2] | 0;
}

function ___udivdi3(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 return ___udivmoddi4(i1, i2, i3, i4, 0) | 0;
}

function __ZN10emscripten8internal7InvokerIP14classificationJEE6invokeEPFS3_vE(i1) {
 i1 = i1 | 0;
 return FUNCTION_TABLE_i[i1 & 15]() | 0;
}

function __ZN10emscripten8internal7InvokerIP11rapidStreamJEE6invokeEPFS3_vE(i1) {
 i1 = i1 | 0;
 return FUNCTION_TABLE_i[i1 & 15]() | 0;
}

function b7(i1, i2, i3, i4, i5) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 nullFunc_iiiiii(7);
 return 0;
}

function __ZN10emscripten8internal7InvokerIP10regressionJEE6invokeEPFS3_vE(i1) {
 i1 = i1 | 0;
 return FUNCTION_TABLE_i[i1 & 15]() | 0;
}

function __ZNKSt3__121__basic_string_commonILb1EE20__throw_out_of_rangeEv(i1) {
 i1 = i1 | 0;
 ___assert_fail(8201, 8127, 1175, 8230);
}

function __ZNKSt3__121__basic_string_commonILb1EE20__throw_length_errorEv(i1) {
 i1 = i1 | 0;
 ___assert_fail(8098, 8127, 1164, 7820);
}

function __GLOBAL__sub_I_seriesClassification_cpp() {
 __ZN56EmscriptenBindingInitializer_seriesClassification_moduleC2Ev(0);
 return;
}

function dynCall_iii(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 return FUNCTION_TABLE_iii[i3 & 31](i1 | 0, i2 | 0) | 0;
}

function __ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv(i1) {
 i1 = i1 | 0;
 ___assert_fail(7723, 7746, 303, 7820);
}

function __ZN10emscripten8internal7InvokerIP8modelSetJEE6invokeEPFS3_vE(i1) {
 i1 = i1 | 0;
 return FUNCTION_TABLE_i[i1 & 15]() | 0;
}

function dynCall_dii(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 return +FUNCTION_TABLE_dii[i3 & 7](i1 | 0, i2 | 0);
}

function __ZN10emscripten8internal13getActualTypeINSt3__16vectorIiNS2_9allocatorIiEEEEEEPKvPT_(i1) {
 i1 = i1 | 0;
 return 208;
}

function __ZN10emscripten8internal13getActualTypeINSt3__16vectorIdNS2_9allocatorIdEEEEEEPKvPT_(i1) {
 i1 = i1 | 0;
 return 128;
}

function b0(i1, i2, i3, i4, i5) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 i5 = i5 | 0;
 nullFunc_viiiii(0);
}

function __ZN3dtwC2Ev(i1) {
 i1 = i1 | 0;
 HEAP32[i1 >> 2] = 0;
 HEAP32[i1 + 4 >> 2] = 0;
 HEAP32[i1 + 8 >> 2] = 0;
 return;
}

function _wctomb(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 if (!i1) i1 = 0; else i1 = _wcrtomb(i1, i2, 0) | 0;
 return i1 | 0;
}

function dynCall_vii(i3, i1, i2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 i2 = i2 | 0;
 FUNCTION_TABLE_vii[i3 & 31](i1 | 0, i2 | 0);
}

function _vsprintf(i3, i2, i1) {
 i3 = i3 | 0;
 i2 = i2 | 0;
 i1 = i1 | 0;
 return _vsnprintf(i3, 2147483647, i2, i1) | 0;
}

function __ZN10emscripten4baseI8modelSetE14convertPointerIS1_14classificationEEPT0_PT_(i1) {
 i1 = i1 | 0;
 return i1 | 0;
}

function __ZN10emscripten4baseI8modelSetE14convertPointerI14classificationS1_EEPT0_PT_(i1) {
 i1 = i1 | 0;
 return i1 | 0;
}

function __GLOBAL__sub_I_classification_cpp() {
 __ZN50EmscriptenBindingInitializer_classification_moduleC2Ev(0);
 return;
}

function b17(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 nullFunc_iiiii(17);
 return 0;
}

function __ZN10emscripten4baseI8modelSetE14convertPointerIS1_10regressionEEPT0_PT_(i1) {
 i1 = i1 | 0;
 return i1 | 0;
}

function __ZN10emscripten4baseI8modelSetE14convertPointerI10regressionS1_EEPT0_PT_(i1) {
 i1 = i1 | 0;
 return i1 | 0;
}

function __GLOBAL__sub_I_rapidStream_cpp() {
 __ZN47EmscriptenBindingInitializer_rapidStream_moduleC2Ev(0);
 return;
}

function dynCall_vid(i3, i1, d2) {
 i3 = i3 | 0;
 i1 = i1 | 0;
 d2 = +d2;
 FUNCTION_TABLE_vid[i3 & 1](i1 | 0, +d2);
}

function b23(i1, i2, i3, d4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 d4 = +d4;
 nullFunc_iiiid(23);
 return 0;
}

function __ZN6LIBSVM11ONE_CLASS_QD0Ev(i1) {
 i1 = i1 | 0;
 __ZN6LIBSVM11ONE_CLASS_QD2Ev(i1);
 __ZdlPv(i1);
 return;
}

function __GLOBAL__sub_I_bind_cpp() {
 __ZN53EmscriptenBindingInitializer_native_and_builtin_typesC2Ev(0);
 return;
}

function setThrew(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 if (!__THREW__) {
  __THREW__ = i1;
  threwValue = i2;
 }
}

function _fputs(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 return (_fwrite(i2, _strlen(i2) | 0, 1, i1) | 0) + -1 | 0;
}

function __ZN17knnClassificationD0Ev(i1) {
 i1 = i1 | 0;
 __ZN17knnClassificationD2Ev(i1);
 __ZdlPv(i1);
 return;
}

function __ZN10emscripten8internal13getActualTypeI20seriesClassificationEEPKvPT_(i1) {
 i1 = i1 | 0;
 return 664;
}

function __ZSt15get_new_handlerv() {
 var i1 = 0;
 i1 = HEAP32[553] | 0;
 HEAP32[553] = i1 + 0;
 return i1 | 0;
}

function __GLOBAL__sub_I_modelSet_cpp() {
 __ZN44EmscriptenBindingInitializer_modelSet_moduleC2Ev(0);
 return;
}

function __embind_finalize_value_object__wrapper(i1) {
 i1 = i1 | 0;
 __embind_finalize_value_object(i1 | 0);
}

function __GLOBAL__sub_I_neuralNetwork_cpp() {
 __ZN38EmscriptenBindingInitializer_nn_moduleC2Ev(0);
 return;
}

function b24(i1, i2, i3, i4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 i4 = i4 | 0;
 nullFunc_viiii(24);
}

function ___clang_call_terminate(i1) {
 i1 = i1 | 0;
 ___cxa_begin_catch(i1 | 0) | 0;
 __ZSt9terminatev();
}

function dynCall_ii(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 return FUNCTION_TABLE_ii[i2 & 63](i1 | 0) | 0;
}

function __ZN13neuralNetworkD0Ev(i1) {
 i1 = i1 | 0;
 __ZN13neuralNetworkD2Ev(i1);
 __ZdlPv(i1);
 return;
}

function b18(i1, i2, i3, d4) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 d4 = +d4;
 nullFunc_viiid(18);
}

function __ZN10emscripten8internal13getActualTypeI11rapidStreamEEPKvPT_(i1) {
 i1 = i1 | 0;
 return 752;
}

function dynCall_di(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 return +FUNCTION_TABLE_di[i2 & 15](i1 | 0);
}

function _cleanup392(i1) {
 i1 = i1 | 0;
 if (!(HEAP32[i1 + 68 >> 2] | 0)) ___unlockfile(i1);
 return;
}

function __ZNK17knnClassification12getNumInputsEv(i1) {
 i1 = i1 | 0;
 return HEAP32[i1 + 4 >> 2] | 0;
}

function b14(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 nullFunc_diii(14);
 return 0.0;
}

function __ZN6LIBSVM5SVR_QD0Ev(i1) {
 i1 = i1 | 0;
 __ZN6LIBSVM5SVR_QD2Ev(i1);
 __ZdlPv(i1);
 return;
}

function __ZN6LIBSVM5SVC_QD0Ev(i1) {
 i1 = i1 | 0;
 __ZN6LIBSVM5SVC_QD2Ev(i1);
 __ZdlPv(i1);
 return;
}

function __ZN14classificationD0Ev(i1) {
 i1 = i1 | 0;
 __ZN8modelSetD2Ev(i1);
 __ZdlPv(i1);
 return;
}

function establishStackSpace(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 STACKTOP = i1;
 STACK_MAX = i2;
}

function __ZNK13neuralNetwork12getNumInputsEv(i1) {
 i1 = i1 | 0;
 return HEAP32[i1 + 4 >> 2] | 0;
}

function b9(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 nullFunc_iiii(9);
 return 0;
}

function __ZNK6LIBSVM11ONE_CLASS_Q6get_QDEv(i1) {
 i1 = i1 | 0;
 return HEAP32[i1 + 52 >> 2] | 0;
}

function __ZN10__cxxabiv123__fundamental_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN10regressionD0Ev(i1) {
 i1 = i1 | 0;
 __ZN8modelSetD2Ev(i1);
 __ZdlPv(i1);
 return;
}

function __ZN10__cxxabiv121__vmi_class_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function dynCall_vi(i2, i1) {
 i2 = i2 | 0;
 i1 = i1 | 0;
 FUNCTION_TABLE_vi[i2 & 63](i1 | 0);
}

function __ZNK17knnClassification4getKEv(i1) {
 i1 = i1 | 0;
 return HEAP32[i1 + 36 >> 2] | 0;
}

function __ZN10__cxxabiv120__si_class_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN8modelSetD0Ev(i1) {
 i1 = i1 | 0;
 __ZN8modelSetD2Ev(i1);
 __ZdlPv(i1);
 return;
}

function __ZN10__cxxabiv119__pointer_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function ___getTypeName(i1) {
 i1 = i1 | 0;
 return ___strdup(HEAP32[i1 + 4 >> 2] | 0) | 0;
}

function __ZN10__cxxabiv117__class_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZNK6LIBSVM5SVR_Q6get_QDEv(i1) {
 i1 = i1 | 0;
 return HEAP32[i1 + 76 >> 2] | 0;
}

function __ZNK6LIBSVM5SVC_Q6get_QDEv(i1) {
 i1 = i1 | 0;
 return HEAP32[i1 + 56 >> 2] | 0;
}

function __ZN10__cxxabiv116__enum_type_infoD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function b19(i1, i2, i3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 i3 = i3 | 0;
 nullFunc_viii(19);
}

function b22(i1, i2, d3) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 d3 = +d3;
 nullFunc_viid(22);
}

function b15(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 nullFunc_dii(15);
 return 0.0;
}

function __ZNK10__cxxabiv116__shim_type_info5noop2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZNK10__cxxabiv116__shim_type_info5noop1Ev(i1) {
 i1 = i1 | 0;
 return;
}

function b13(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 nullFunc_iii(13);
 return 0;
}

function __ZNK17svmClassification12getNumInputsEv(i1) {
 i1 = i1 | 0;
 return 0;
}

function dynCall_i(i1) {
 i1 = i1 | 0;
 return FUNCTION_TABLE_i[i1 & 15]() | 0;
}

function _frexpl(d2, i1) {
 d2 = +d2;
 i1 = i1 | 0;
 return +(+_frexp(d2, i1));
}

function __emval_incref__wrapper(i1) {
 i1 = i1 | 0;
 __emval_incref(i1 | 0);
}

function __emval_decref__wrapper(i1) {
 i1 = i1 | 0;
 __emval_decref(i1 | 0);
}

function __ZN6LIBSVM9Solver_NUD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN10__cxxabiv116__shim_type_infoD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZN6LIBSVM6SolverD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZNSt9bad_allocD0Ev(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZN17svmClassification5resetEv(i1) {
 i1 = i1 | 0;
 return;
}

function __ZN17knnClassification5resetEv(i1) {
 i1 = i1 | 0;
 return;
}

function dynCall_v(i1) {
 i1 = i1 | 0;
 FUNCTION_TABLE_v[i1 & 7]();
}

function b3(i1, i2) {
 i1 = i1 | 0;
 i2 = i2 | 0;
 nullFunc_vii(3);
}

function __ZNKSt9bad_alloc4whatEv(i1) {
 i1 = i1 | 0;
 return 7890;
}

function ___cxa_pure_virtual__wrapper() {
 ___cxa_pure_virtual();
}

function __ZN13neuralNetwork5resetEv(i1) {
 i1 = i1 | 0;
 return;
}

function b1(i1, d2) {
 i1 = i1 | 0;
 d2 = +d2;
 nullFunc_vid(1);
}

function b11(i1) {
 i1 = i1 | 0;
 nullFunc_di(11);
 return 0.0;
}

function __ZN6LIBSVM6SolverD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function b5(i1) {
 i1 = i1 | 0;
 nullFunc_ii(5);
 return 0;
}

function ___cxa_end_catch__wrapper() {
 ___cxa_end_catch();
}

function __Znaj(i1) {
 i1 = i1 | 0;
 return __Znwj(i1) | 0;
}

function __ZdaPv(i1) {
 i1 = i1 | 0;
 __ZdlPv(i1);
 return;
}

function __ZNSt9type_infoD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZNSt9exceptionD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function __ZNSt9bad_allocD2Ev(i1) {
 i1 = i1 | 0;
 return;
}

function stackRestore(i1) {
 i1 = i1 | 0;
 STACKTOP = i1;
}

function __ZdlPv(i1) {
 i1 = i1 | 0;
 _free(i1);
 return;
}

function setTempRet0(i1) {
 i1 = i1 | 0;
 tempRet0 = i1;
}

function ___unlockfile(i1) {
 i1 = i1 | 0;
 return;
}

function ___lockfile(i1) {
 i1 = i1 | 0;
 return 0;
}

function b2(i1) {
 i1 = i1 | 0;
 nullFunc_vi(2);
}

function getTempRet0() {
 return tempRet0 | 0;
}

function stackSave() {
 return STACKTOP | 0;
}

function b16() {
 nullFunc_i(16);
 return 0;
}

function b21() {
 nullFunc_v(21);
}

// EMSCRIPTEN_END_FUNCS
var FUNCTION_TABLE_viiiii = [b0,__ZNK10__cxxabiv117__class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,__ZNK10__cxxabiv120__si_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,__ZNK10__cxxabiv121__vmi_class_type_info16search_below_dstEPNS_19__dynamic_cast_infoEPKvib,__ZN13neuralNetworkC2ERKiRKNSt3__16vectorIiNS2_9allocatorIiEEEES1_S1_,__ZN17knnClassificationC2ERKiRKNSt3__16vectorIiNS2_9allocatorIiEEEERKNS3_I15trainingExampleNS4_IS9_EEEEi,b0,b0];
var FUNCTION_TABLE_vid = [b1,__ZN11rapidStream12pushToWindowEd];
var FUNCTION_TABLE_vi = [b2,__ZN8modelSetD2Ev,__ZN8modelSetD0Ev,__ZN13neuralNetworkD2Ev,__ZN13neuralNetworkD0Ev,__ZN13neuralNetwork5resetEv,__ZN10regressionD0Ev,__ZN17knnClassificationD2Ev,__ZN17knnClassificationD0Ev,__ZN17knnClassification5resetEv,__ZN14classificationD0Ev,__ZN17svmClassificationD2Ev,__ZN17svmClassificationD0Ev,__ZN17svmClassification5resetEv,__ZN6LIBSVM6KernelD2Ev,__ZN6LIBSVM6KernelD0Ev,__ZN6LIBSVM6SolverD2Ev,__ZN6LIBSVM6SolverD0Ev,__ZN6LIBSVM6Solver12do_shrinkingEv,__ZN6LIBSVM9Solver_NUD0Ev,__ZN6LIBSVM9Solver_NU12do_shrinkingEv,__ZN6LIBSVML19print_string_stdoutEPKc,__ZN6LIBSVM5SVR_QD2Ev,__ZN6LIBSVM5SVR_QD0Ev,__ZN6LIBSVM11ONE_CLASS_QD2Ev,__ZN6LIBSVM11ONE_CLASS_QD0Ev,__ZN6LIBSVM5SVC_QD2Ev,__ZN6LIBSVM5SVC_QD0Ev,__ZNSt9bad_allocD2Ev
,__ZNSt9bad_allocD0Ev,__ZN10__cxxabiv116__shim_type_infoD2Ev,__ZN10__cxxabiv123__fundamental_type_infoD0Ev,__ZNK10__cxxabiv116__shim_type_info5noop1Ev,__ZNK10__cxxabiv116__shim_type_info5noop2Ev,__ZN10__cxxabiv116__enum_type_infoD0Ev,__ZN10__cxxabiv117__class_type_infoD0Ev,__ZN10__cxxabiv120__si_class_type_infoD0Ev,__ZN10__cxxabiv121__vmi_class_type_infoD0Ev,__ZN10__cxxabiv119__pointer_type_infoD0Ev,__ZN10emscripten8internal14raw_destructorI8modelSetEEvPT_,__ZNKSt3__120__vector_base_commonILb1EE20__throw_length_errorEv,__ZN10emscripten8internal14raw_destructorI13neuralNetworkEEvPT_,__ZN10emscripten8internal14raw_destructorI10regressionEEvPT_,__ZN8modelSetC2Ev,__ZN10emscripten8internal14raw_destructorI15trainingExampleEEvPT_,__embind_finalize_value_object__wrapper,__ZN10emscripten8internal14raw_destructorI17knnClassificationEEvPT_,__ZN10emscripten8internal14raw_destructorINSt3__16vectorIiNS2_9allocatorIiEEEEEEvPT_,__ZN10emscripten8internal14raw_destructorINSt3__16vectorIdNS2_9allocatorIdEEEEEEvPT_,__ZN10emscripten8internal14raw_destructorINSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEEEvPT_,__emval_incref__wrapper,__emval_decref__wrapper,__ZN10emscripten8internal14raw_destructorI14classificationEEvPT_,__ZN10emscripten8internal14raw_destructorI17svmClassificationEEvPT_,__ZN10emscripten8internal14raw_destructorI20seriesClassificationEEvPT_,__ZN20seriesClassification5resetEv,__ZN10emscripten8internal14raw_destructorI11rapidStreamEEvPT_,__ZN11rapidStream5clearEv,__ZN10__cxxabiv112_GLOBAL__N_19destruct_EPv
,_cleanup392,b2,b2,b2,b2];
var FUNCTION_TABLE_vii = [b3,__ZN13neuralNetwork5trainERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE,__ZNK13neuralNetwork14getWhichInputsEv,__ZN17knnClassification5trainERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE,__ZNK17knnClassification14getWhichInputsEv,__ZN17svmClassification5trainERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE,__ZNK17svmClassification14getWhichInputsEv,__ZNSt3__16vectorIdNS_9allocatorIdEEE21__push_back_slow_pathIdEEvOT_,__ZNSt3__16vectorIdNS_9allocatorIdEEEC2ERKS3_,__ZNSt3__16vectorIdNS_9allocatorIdEEE21__push_back_slow_pathIRKdEEvOT_,__ZNSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEE21__push_back_slow_pathIRKS1_EEvOT_,__ZNSt3__16vectorIiNS_9allocatorIiEEEC2ERKS3_,__ZNSt3__16vectorINS0_IdNS_9allocatorIdEEEENS1_IS3_EEEC2ERKS5_,__ZNSt3__16vectorIiNS_9allocatorIiEEE21__push_back_slow_pathIRKiEEvOT_,__ZNSt3__16vectorIP9baseModelNS_9allocatorIS2_EEE21__push_back_slow_pathIS2_EEvOT_,__ZNSt3__16vectorINS_12basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEENS4_IS6_EEE21__push_back_slow_pathIS6_EEvOT_,__ZNSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEEC2ERKS4_,__ZNSt3__16vectorIiNS_9allocatorIiEEE9push_backERKi,__ZNSt3__16vectorIdNS_9allocatorIdEEE9push_backERKd,__ZNSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEE9push_backERKS1_,__ZN14classification4getKEv,__ZNSt3__16vectorIiNS_9allocatorIiEEE21__push_back_slow_pathIiEEvOT_,__ZN17svmClassificationC2Ei,__ZN6LIBSVML4infoEPKcz,__ZN10emscripten8internal13MethodInvokerIM20seriesClassificationFvvEvPS2_JEE6invokeERKS4_S5_,__ZN20seriesClassification8getCostsEv,__ZN3dtw9setSeriesENSt3__16vectorINS1_IdNS0_9allocatorIdEEEENS2_IS4_EEEE,__ZNSt3__16vectorI3dtwNS_9allocatorIS1_EEE21__push_back_slow_pathIRKS1_EEvOT_,__ZN10emscripten8internal13MethodInvokerIM11rapidStreamFvvEvPS2_JEE6invokeERKS4_S5_
,_abort_message,b3,b3];
var FUNCTION_TABLE_iiiiiiiiiii = [b4,__ZN10emscripten8internal12operator_newI13neuralNetworkJiNSt3__16vectorIiNS3_9allocatorIiEEEEiiNS4_IdNS5_IdEEEES9_S9_S9_ddEEEPT_DpOT0_];
var FUNCTION_TABLE_ii = [b5,__ZNK13neuralNetwork12getNumInputsEv,__ZNK17knnClassification12getNumInputsEv,__ZNK17svmClassification12getNumInputsEv,__ZNK6LIBSVM5SVR_Q6get_QDEv,__ZNK6LIBSVM11ONE_CLASS_Q6get_QDEv,__ZNK6LIBSVM5SVC_Q6get_QDEv,__ZNKSt9bad_alloc4whatEv,___stdio_close,__ZN10emscripten8internal13getActualTypeI8modelSetEEPKvPT_,__ZN10emscripten8internal7InvokerIP8modelSetJEE6invokeEPFS3_vE,__ZN8modelSet5resetEv,__Znwj,__ZN10emscripten8internal13getActualTypeI13neuralNetworkEEPKvPT_,__ZN10emscripten8internal13getActualTypeI10regressionEEPKvPT_,__ZN10emscripten4baseI8modelSetE14convertPointerI10regressionS1_EEPT0_PT_,__ZN10emscripten4baseI8modelSetE14convertPointerIS1_10regressionEEPT0_PT_,__ZN10emscripten8internal7InvokerIP10regressionJEE6invokeEPFS3_vE,__ZN10emscripten8internal12operator_newI10regressionJNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEEEEPT_DpOT0_,__Znaj,__ZN10emscripten8internal13getActualTypeI17knnClassificationEEPKvPT_,__ZN10emscripten8internal13getActualTypeINSt3__16vectorIiNS2_9allocatorIiEEEEEEPKvPT_,__ZN10emscripten8internal7InvokerIPNSt3__16vectorIiNS2_9allocatorIiEEEEJEE6invokeEPFS7_vE,__ZNKSt3__16vectorIiNS_9allocatorIiEEE4sizeEv,__ZN10emscripten8internal13getActualTypeINSt3__16vectorIdNS2_9allocatorIdEEEEEEPKvPT_,__ZN10emscripten8internal7InvokerIPNSt3__16vectorIdNS2_9allocatorIdEEEEJEE6invokeEPFS7_vE,__ZNKSt3__16vectorIdNS_9allocatorIdEEE4sizeEv,__ZN10emscripten8internal13getActualTypeINSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEEEPKvPT_,__ZN10emscripten8internal7InvokerIPNSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEJEE6invokeEPFS8_vE
,__ZNKSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEE4sizeEv,__ZN10emscripten8internal13getActualTypeI14classificationEEPKvPT_,__ZN10emscripten4baseI8modelSetE14convertPointerI14classificationS1_EEPT0_PT_,__ZN10emscripten4baseI8modelSetE14convertPointerIS1_14classificationEEPT0_PT_,__ZN10emscripten8internal7InvokerIP14classificationJEE6invokeEPFS3_vE,__ZN10emscripten8internal12operator_newI14classificationJNS2_19classificationTypesEEEEPT_DpOT0_,__ZNK17knnClassification4getKEv,__ZN10emscripten8internal13getActualTypeI17svmClassificationEEPKvPT_,__ZN10emscripten8internal12operator_newI17svmClassificationJiEEEPT_DpOT0_,__ZN10emscripten8internal13getActualTypeI20seriesClassificationEEPKvPT_,__ZN10emscripten8internal7InvokerIP20seriesClassificationJEE6invokeEPFS3_vE,__ZN10emscripten8internal13getActualTypeI11rapidStreamEEPKvPT_,__ZN10emscripten8internal7InvokerIP11rapidStreamJEE6invokeEPFS3_vE,__ZN10emscripten8internal12operator_newI11rapidStreamJiEEEPT_DpOT0_,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5,b5
,b5,b5,b5,b5,b5];
var FUNCTION_TABLE_viiiiiiiiiii = [b6,__ZN13neuralNetworkC2ERKiRKNSt3__16vectorIiNS2_9allocatorIiEEEES1_S1_RKNS3_IdNS4_IdEEEESC_SC_SC_RKdSE_];
var FUNCTION_TABLE_iiiiii = [b7,__ZN10emscripten8internal7InvokerIP13neuralNetworkJOiONSt3__16vectorIiNS5_9allocatorIiEEEES4_S4_EE6invokeEPFS3_S4_SA_S4_S4_EiPS9_ii,__ZN10emscripten8internal7InvokerIP17knnClassificationJOiONSt3__16vectorIiNS5_9allocatorIiEEEEONS6_I15trainingExampleNS7_ISB_EEEES4_EE6invokeEPFS3_S4_SA_SE_S4_EiPS9_PSD_i,b7];
var FUNCTION_TABLE_viiiiiidddii = [b8,__ZN6LIBSVM6Solver5SolveEiRKNS_7QMatrixEPKdPKaPddddPNS0_12SolutionInfoEi];
var FUNCTION_TABLE_iiii = [b9,__ZN6LIBSVM6Solver18select_working_setERiS1_,__ZN6LIBSVM9Solver_NU18select_working_setERiS1_,__ZNK6LIBSVM5SVR_Q5get_QEii,__ZNK6LIBSVM11ONE_CLASS_Q5get_QEii,__ZNK6LIBSVM5SVC_Q5get_QEii,__ZNK10__cxxabiv123__fundamental_type_info9can_catchEPKNS_16__shim_type_infoERPv,__ZNK10__cxxabiv116__enum_type_info9can_catchEPKNS_16__shim_type_infoERPv,__ZNK10__cxxabiv117__class_type_info9can_catchEPKNS_16__shim_type_infoERPv,__ZNK10__cxxabiv119__pointer_type_info9can_catchEPKNS_16__shim_type_infoERPv,_sn_write,___stdio_write,___stdio_seek,___stdout_write,__ZN10emscripten8internal13MethodInvokerIM8modelSetFbRKNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEEbPS2_JSA_EE6invokeERKSC_SD_PS8_,__ZN10emscripten8internal13MethodInvokerIM8modelSetFNSt3__16vectorIdNS3_9allocatorIdEEEERKS7_ES7_PS2_JS9_EE6invokeERKSB_SC_PS7_,__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6insertEjPKc,__ZN10emscripten8internal7InvokerIP10regressionJOiS4_EE6invokeEPFS3_S4_S4_Eii,__ZN10emscripten8internal13MethodInvokerIM10regressionFbRKNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEEbPS2_JSA_EE6invokeERKSC_SD_PS8_,__ZN10emscripten8internal15FunctionInvokerIPFNS_3valERKNSt3__16vectorIiNS3_9allocatorIiEEEEjES2_S9_JjEE6invokeEPSB_PS7_j,__ZN10emscripten8internal12VectorAccessINSt3__16vectorIiNS2_9allocatorIiEEEEE3setERS6_jRKi,__ZN10emscripten8internal15FunctionInvokerIPFNS_3valERKNSt3__16vectorIdNS3_9allocatorIdEEEEjES2_S9_JjEE6invokeEPSB_PS7_j,__ZN10emscripten8internal12VectorAccessINSt3__16vectorIdNS2_9allocatorIdEEEEE3setERS6_jRKd,__ZN10emscripten8internal15FunctionInvokerIPFNS_3valERKNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEjES2_SA_JjEE6invokeEPSC_PS8_j,__ZN10emscripten8internal12VectorAccessINSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEE3setERS7_jRKS4_,__ZN10emscripten8internal7InvokerIP14classificationJOiS4_EE6invokeEPFS3_S4_S4_Eii,__ZN10emscripten8internal13MethodInvokerIM14classificationFbRKNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEEbPS2_JSA_EE6invokeERKSC_SD_PS8_,__ZN10emscripten8internal13MethodInvokerIM20seriesClassificationFbRKNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEEbPS2_JSA_EE6invokeERKSC_SD_PS8_,__ZN10emscripten8internal13MethodInvokerIM20seriesClassificationFbRKNSt3__16vectorINS4_INS4_IdNS3_9allocatorIdEEEENS5_IS7_EEEENS5_IS9_EEEEEbPS2_JSD_EE6invokeERKSF_SG_PSB_
,__ZN10emscripten8internal13MethodInvokerIM20seriesClassificationFiRKNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEEiPS2_JSA_EE6invokeERKSC_SD_PS8_,b9,b9];
var FUNCTION_TABLE_viiiiii = [b10,__ZNK10__cxxabiv117__class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,__ZNK10__cxxabiv120__si_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib,__ZNK10__cxxabiv121__vmi_class_type_info16search_above_dstEPNS_19__dynamic_cast_infoEPKvS4_ib];
var FUNCTION_TABLE_di = [b11,__ZN6LIBSVM6Solver13calculate_rhoEv,__ZN6LIBSVM9Solver_NU13calculate_rhoEv,__ZN11rapidStream8velocityEv,__ZN11rapidStream12accelerationEv,__ZN11rapidStream7minimumEv,__ZN11rapidStream7maximumEv,__ZN11rapidStream3sumEv,__ZN11rapidStream4meanEv,__ZN11rapidStream17standardDeviationEv,__ZN11rapidStream3rmsEv,__ZN11rapidStream11minVelocityEv,__ZN11rapidStream11maxVelocityEv,__ZN11rapidStream15minAccelerationEv,__ZN11rapidStream15maxAccelerationEv,b11];
var FUNCTION_TABLE_viiiiiiiiii = [b12,__embind_register_value_object_field__wrapper];
var FUNCTION_TABLE_iii = [b13,__ZN8modelSet5trainERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE,__ZN10regression5trainERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE,__ZN14classification5trainERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE,__ZN10emscripten8internal13MethodInvokerIM8modelSetFbvEbPS2_JEE6invokeERKS4_S5_,__ZN10emscripten8internal7InvokerIP10regressionJONSt3__16vectorI15trainingExampleNS4_9allocatorIS6_EEEEEE6invokeEPFS3_SA_EPS9_,__ZN10emscripten8internal12operator_newI10regressionJiiEEEPT_DpOT0_,__ZN10emscripten8internal12MemberAccessI15trainingExampleNSt3__16vectorIdNS3_9allocatorIdEEEEE7getWireIS2_EEPS7_RKMS2_S7_RKT_,__ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorIiNS2_9allocatorIiEEEEKFjvEjPKS6_JEE6invokeERKS8_SA_,__ZN10emscripten8internal12VectorAccessINSt3__16vectorIiNS2_9allocatorIiEEEEE3getERKS6_j,__ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorIdNS2_9allocatorIdEEEEKFjvEjPKS6_JEE6invokeERKS8_SA_,__ZN10emscripten8internal12VectorAccessINSt3__16vectorIdNS2_9allocatorIdEEEEE3getERKS6_j,__ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEKFjvEjPKS7_JEE6invokeERKS9_SB_,__ZN10emscripten8internal12VectorAccessINSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEE3getERKS7_j,__ZN10emscripten8internal7InvokerIP14classificationJONS2_19classificationTypesEEE6invokeEPFS3_S5_ES4_,__ZN10emscripten8internal12operator_newI14classificationJiiEEEPT_DpOT0_,__ZN10emscripten8internal13MethodInvokerIM14classificationFNSt3__16vectorIiNS3_9allocatorIiEEEEvES7_PS2_JEE6invokeERKS9_SA_,_svm_train,__ZN10emscripten8internal7InvokerIP17svmClassificationJOiEE6invokeEPFS3_S4_Ei,__ZN20seriesClassification14addTrainingSetERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE,__ZN20seriesClassification5trainERKNSt3__16vectorINS1_INS1_IdNS0_9allocatorIdEEEENS2_IS4_EEEENS2_IS6_EEEE,__ZN20seriesClassification14runTrainingSetERKNSt3__16vectorI15trainingExampleNS0_9allocatorIS2_EEEE,__ZN10emscripten8internal13MethodInvokerIM20seriesClassificationFNSt3__16vectorIdNS3_9allocatorIdEEEEvES7_PS2_JEE6invokeERKS9_SA_,__ZN20seriesClassification9addSeriesERKNSt3__16vectorINS1_IdNS0_9allocatorIdEEEENS2_IS4_EEEE,__ZN20seriesClassification3runERKNSt3__16vectorINS1_IdNS0_9allocatorIdEEEENS2_IS4_EEEE,__ZN10emscripten8internal7InvokerIP11rapidStreamJOiEE6invokeEPFS3_S4_Ei,b13,b13,b13
,b13,b13,b13];
var FUNCTION_TABLE_diii = [b14,__ZN10emscripten8internal13MethodInvokerIM13neuralNetworkFdRKNSt3__16vectorIdNS3_9allocatorIdEEEEEdPS2_JS9_EE6invokeERKSB_SC_PS7_,__ZN10emscripten8internal13MethodInvokerIM17knnClassificationFdRKNSt3__16vectorIdNS3_9allocatorIdEEEEEdPS2_JS9_EE6invokeERKSB_SC_PS7_,__ZN10emscripten8internal13MethodInvokerIM17svmClassificationFdRKNSt3__16vectorIdNS3_9allocatorIdEEEEEdPS2_JS9_EE6invokeERKSB_SC_PS7_,__ZNK6LIBSVM6Kernel13kernel_linearEii,__ZNK6LIBSVM6Kernel11kernel_polyEii,__ZNK6LIBSVM6Kernel10kernel_rbfEii,__ZNK6LIBSVM6Kernel14kernel_sigmoidEii,__ZNK6LIBSVM6Kernel18kernel_precomputedEii,b14,b14,b14,b14,b14,b14,b14];
var FUNCTION_TABLE_dii = [b15,__ZN13neuralNetwork3runERKNSt3__16vectorIdNS0_9allocatorIdEEEE,__ZN17knnClassification3runERKNSt3__16vectorIdNS0_9allocatorIdEEEE,__ZN17svmClassification3runERKNSt3__16vectorIdNS0_9allocatorIdEEEE,__ZN3dtw3runENSt3__16vectorINS1_IdNS0_9allocatorIdEEEENS2_IS4_EEEE,__ZN10emscripten8internal13MethodInvokerIM11rapidStreamFdvEdPS2_JEE6invokeERKS4_S5_,b15,b15];
var FUNCTION_TABLE_i = [b16,__ZN10emscripten8internal12operator_newI8modelSetJEEEPT_DpOT0_,__ZN10emscripten8internal12operator_newI10regressionJEEEPT_DpOT0_,__ZN10emscripten8internal15raw_constructorI15trainingExampleJEEEPT_DpNS0_11BindingTypeIT0_E8WireTypeE,__ZN10emscripten8internal12operator_newINSt3__16vectorIiNS2_9allocatorIiEEEEJEEEPT_DpOT0_,__ZN10emscripten8internal12operator_newINSt3__16vectorIdNS2_9allocatorIdEEEEJEEEPT_DpOT0_,__ZN10emscripten8internal12operator_newINSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEJEEEPT_DpOT0_,__ZN10emscripten8internal12operator_newI14classificationJEEEPT_DpOT0_,__ZN10emscripten8internal12operator_newI20seriesClassificationJEEEPT_DpOT0_,__ZN10emscripten8internal12operator_newI11rapidStreamJEEEPT_DpOT0_,___cxa_get_globals_fast,b16,b16,b16,b16,b16];
var FUNCTION_TABLE_iiiii = [b17,__ZN10emscripten8internal12operator_newI13neuralNetworkJiNSt3__16vectorIiNS3_9allocatorIiEEEEiiEEEPT_DpOT0_,__ZN10emscripten8internal12operator_newI17knnClassificationJiNSt3__16vectorIiNS3_9allocatorIiEEEENS4_I15trainingExampleNS5_IS8_EEEEiEEEPT_DpOT0_,__ZN10emscripten8internal15FunctionInvokerIPFbRNSt3__16vectorIiNS2_9allocatorIiEEEEjRKiEbS7_JjS9_EE6invokeEPSB_PS6_ji,__ZN10emscripten8internal15FunctionInvokerIPFbRNSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEjRKS4_EbS8_JjSA_EE6invokeEPSC_PS7_jPS4_,b17,b17,b17];
var FUNCTION_TABLE_viiid = [b18,__ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorIdNS2_9allocatorIdEEEEFvjRKdEvPS6_JjS8_EE6invokeERKSA_SB_jd];
var FUNCTION_TABLE_viii = [b19,__ZNK6LIBSVM6Kernel10swap_indexEii,__ZNK6LIBSVM5SVR_Q10swap_indexEii,__ZNK6LIBSVM11ONE_CLASS_Q10swap_indexEii,__ZNK6LIBSVM5SVC_Q10swap_indexEii,__ZN8modelSet3runERKNSt3__16vectorIdNS0_9allocatorIdEEEE,__ZN10emscripten8internal13MethodInvokerIM13neuralNetworkFvRKNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEEvPS2_JSA_EE6invokeERKSC_SD_PS8_,__ZN10regressionC2ERKiS1_,__ZN10emscripten8internal12MemberAccessI15trainingExampleNSt3__16vectorIdNS3_9allocatorIdEEEEE7setWireIS2_EEvRKMS2_S7_RT_PS7_,__ZN17knnClassification12addNeighbourERKiRKNSt3__16vectorIdNS2_9allocatorIdEEEE,__ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorIiNS2_9allocatorIiEEEEFvRKiEvPS6_JS8_EE6invokeERKSA_SB_i,__ZNSt3__16vectorIiNS_9allocatorIiEEE6resizeEjRKi,__ZNSt3__16vectorIdNS_9allocatorIdEEE6resizeEjRKd,__ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEFvRKS4_EvPS7_JS9_EE6invokeERKSB_SC_PS4_,__ZNSt3__16vectorI15trainingExampleNS_9allocatorIS1_EEE6resizeEjRKS1_,__ZN14classification4setKEii,__ZN14classificationC2ERKiS1_,__ZN10emscripten8internal13MethodInvokerIM17svmClassificationFvRKNSt3__16vectorI15trainingExampleNS3_9allocatorIS5_EEEEEvPS2_JSA_EE6invokeERKSC_SD_PS8_,__ZN6LIBSVM11ONE_CLASS_QC2ERKNS_11svm_problemERKNS_13svm_parameterE,__ZN6LIBSVM5SVR_QC2ERKNS_11svm_problemERKNS_13svm_parameterE,__ZNSt3__112basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6resizeEjc,b19,b19,b19,b19,b19,b19,b19,b19
,b19,b19,b19];
var FUNCTION_TABLE_iiiiiiiiiidd = [b20,__ZN10emscripten8internal7InvokerIP13neuralNetworkJOiONSt3__16vectorIiNS5_9allocatorIiEEEES4_S4_ONS6_IdNS7_IdEEEESD_SD_SD_OdSE_EE6invokeEPFS3_S4_SA_S4_S4_SD_SD_SD_SD_SE_SE_EiPS9_iiPSC_SJ_SJ_SJ_dd];
var FUNCTION_TABLE_v = [b21,___cxa_pure_virtual__wrapper,__ZL25default_terminate_handlerv,__ZN10__cxxabiv112_GLOBAL__N_110construct_Ev,___cxa_end_catch__wrapper,b21,b21,b21];
var FUNCTION_TABLE_viid = [b22,__ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorIdNS2_9allocatorIdEEEEFvRKdEvPS6_JS8_EE6invokeERKSA_SB_d,__ZN10emscripten8internal13MethodInvokerIM11rapidStreamFvdEvPS2_JdEE6invokeERKS4_S5_d,b22];
var FUNCTION_TABLE_iiiid = [b23,__ZN10emscripten8internal15FunctionInvokerIPFbRNSt3__16vectorIdNS2_9allocatorIdEEEEjRKdEbS7_JjS9_EE6invokeEPSB_PS6_jd];
var FUNCTION_TABLE_viiii = [b24,__ZNK10__cxxabiv117__class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,__ZNK10__cxxabiv120__si_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,__ZNK10__cxxabiv121__vmi_class_type_info27has_unambiguous_public_baseEPNS_19__dynamic_cast_infoEPvi,__ZN10emscripten8internal13MethodInvokerIM17knnClassificationFvRKiRKNSt3__16vectorIdNS5_9allocatorIdEEEEEvPS2_JS4_SB_EE6invokeERKSD_SE_iPS9_,__ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorIiNS2_9allocatorIiEEEEFvjRKiEvPS6_JjS8_EE6invokeERKSA_SB_ji,__ZN10emscripten8internal13MethodInvokerIMNSt3__16vectorI15trainingExampleNS2_9allocatorIS4_EEEEFvjRKS4_EvPS7_JjS9_EE6invokeERKSB_SC_jPS4_,__ZN10emscripten8internal13MethodInvokerIM14classificationFviiEvPS2_JiiEE6invokeERKS4_S5_ii,__ZN6LIBSVM5SVC_QC2ERKNS_11svm_problemERKNS_13svm_parameterEPKa,b24,b24,b24,b24,b24,b24,b24];

  return { ___cxa_can_catch: ___cxa_can_catch, _fflush: _fflush, ___cxa_is_pointer_type: ___cxa_is_pointer_type, _i64Add: _i64Add, _memmove: _memmove, _i64Subtract: _i64Subtract, _memset: _memset, _malloc: _malloc, _memcpy: _memcpy, ___getTypeName: ___getTypeName, _bitshift64Lshr: _bitshift64Lshr, _free: _free, ___errno_location: ___errno_location, _bitshift64Shl: _bitshift64Shl, __GLOBAL__sub_I_modelSet_cpp: __GLOBAL__sub_I_modelSet_cpp, __GLOBAL__sub_I_neuralNetwork_cpp: __GLOBAL__sub_I_neuralNetwork_cpp, __GLOBAL__sub_I_regression_cpp: __GLOBAL__sub_I_regression_cpp, __GLOBAL__sub_I_knnClassification_cpp: __GLOBAL__sub_I_knnClassification_cpp, __GLOBAL__sub_I_classification_cpp: __GLOBAL__sub_I_classification_cpp, __GLOBAL__sub_I_svmClassification_cpp: __GLOBAL__sub_I_svmClassification_cpp, __GLOBAL__sub_I_seriesClassification_cpp: __GLOBAL__sub_I_seriesClassification_cpp, __GLOBAL__sub_I_rapidStream_cpp: __GLOBAL__sub_I_rapidStream_cpp, __GLOBAL__sub_I_bind_cpp: __GLOBAL__sub_I_bind_cpp, runPostSets: runPostSets, _emscripten_replace_memory: _emscripten_replace_memory, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, establishStackSpace: establishStackSpace, setThrew: setThrew, setTempRet0: setTempRet0, getTempRet0: getTempRet0, dynCall_viiiii: dynCall_viiiii, dynCall_vid: dynCall_vid, dynCall_vi: dynCall_vi, dynCall_vii: dynCall_vii, dynCall_iiiiiiiiiii: dynCall_iiiiiiiiiii, dynCall_ii: dynCall_ii, dynCall_viiiiiiiiiii: dynCall_viiiiiiiiiii, dynCall_iiiiii: dynCall_iiiiii, dynCall_viiiiiidddii: dynCall_viiiiiidddii, dynCall_iiii: dynCall_iiii, dynCall_viiiiii: dynCall_viiiiii, dynCall_di: dynCall_di, dynCall_viiiiiiiiii: dynCall_viiiiiiiiii, dynCall_iii: dynCall_iii, dynCall_diii: dynCall_diii, dynCall_dii: dynCall_dii, dynCall_i: dynCall_i, dynCall_iiiii: dynCall_iiiii, dynCall_viiid: dynCall_viiid, dynCall_viii: dynCall_viii, dynCall_iiiiiiiiiidd: dynCall_iiiiiiiiiidd, dynCall_v: dynCall_v, dynCall_viid: dynCall_viid, dynCall_iiiid: dynCall_iiiid, dynCall_viiii: dynCall_viiii };
})
// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);
var real___GLOBAL__sub_I_bind_cpp = asm["__GLOBAL__sub_I_bind_cpp"];
asm["__GLOBAL__sub_I_bind_cpp"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real___GLOBAL__sub_I_bind_cpp.apply(null, arguments);
});
var real__bitshift64Lshr = asm["_bitshift64Lshr"];
asm["_bitshift64Lshr"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real__bitshift64Lshr.apply(null, arguments);
});
var real___GLOBAL__sub_I_rapidStream_cpp = asm["__GLOBAL__sub_I_rapidStream_cpp"];
asm["__GLOBAL__sub_I_rapidStream_cpp"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real___GLOBAL__sub_I_rapidStream_cpp.apply(null, arguments);
});
var real__bitshift64Shl = asm["_bitshift64Shl"];
asm["_bitshift64Shl"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real__bitshift64Shl.apply(null, arguments);
});
var real__fflush = asm["_fflush"];
asm["_fflush"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real__fflush.apply(null, arguments);
});
var real____cxa_is_pointer_type = asm["___cxa_is_pointer_type"];
asm["___cxa_is_pointer_type"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real____cxa_is_pointer_type.apply(null, arguments);
});
var real___GLOBAL__sub_I_seriesClassification_cpp = asm["__GLOBAL__sub_I_seriesClassification_cpp"];
asm["__GLOBAL__sub_I_seriesClassification_cpp"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real___GLOBAL__sub_I_seriesClassification_cpp.apply(null, arguments);
});
var real____errno_location = asm["___errno_location"];
asm["___errno_location"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real____errno_location.apply(null, arguments);
});
var real___GLOBAL__sub_I_knnClassification_cpp = asm["__GLOBAL__sub_I_knnClassification_cpp"];
asm["__GLOBAL__sub_I_knnClassification_cpp"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real___GLOBAL__sub_I_knnClassification_cpp.apply(null, arguments);
});
var real__i64Subtract = asm["_i64Subtract"];
asm["_i64Subtract"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real__i64Subtract.apply(null, arguments);
});
var real___GLOBAL__sub_I_regression_cpp = asm["__GLOBAL__sub_I_regression_cpp"];
asm["__GLOBAL__sub_I_regression_cpp"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real___GLOBAL__sub_I_regression_cpp.apply(null, arguments);
});
var real__i64Add = asm["_i64Add"];
asm["_i64Add"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real__i64Add.apply(null, arguments);
});
var real____getTypeName = asm["___getTypeName"];
asm["___getTypeName"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real____getTypeName.apply(null, arguments);
});
var real___GLOBAL__sub_I_classification_cpp = asm["__GLOBAL__sub_I_classification_cpp"];
asm["__GLOBAL__sub_I_classification_cpp"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real___GLOBAL__sub_I_classification_cpp.apply(null, arguments);
});
var real___GLOBAL__sub_I_neuralNetwork_cpp = asm["__GLOBAL__sub_I_neuralNetwork_cpp"];
asm["__GLOBAL__sub_I_neuralNetwork_cpp"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real___GLOBAL__sub_I_neuralNetwork_cpp.apply(null, arguments);
});
var real____cxa_can_catch = asm["___cxa_can_catch"];
asm["___cxa_can_catch"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real____cxa_can_catch.apply(null, arguments);
});
var real___GLOBAL__sub_I_modelSet_cpp = asm["__GLOBAL__sub_I_modelSet_cpp"];
asm["__GLOBAL__sub_I_modelSet_cpp"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real___GLOBAL__sub_I_modelSet_cpp.apply(null, arguments);
});
var real__free = asm["_free"];
asm["_free"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real__free.apply(null, arguments);
});
var real__memmove = asm["_memmove"];
asm["_memmove"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real__memmove.apply(null, arguments);
});
var real__malloc = asm["_malloc"];
asm["_malloc"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real__malloc.apply(null, arguments);
});
var real___GLOBAL__sub_I_svmClassification_cpp = asm["__GLOBAL__sub_I_svmClassification_cpp"];
asm["__GLOBAL__sub_I_svmClassification_cpp"] = (function() {
 assert(runtimeInitialized, "you need to wait for the runtime to be ready (e.g. wait for main() to be called)");
 assert(!runtimeExited, "the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)");
 return real___GLOBAL__sub_I_svmClassification_cpp.apply(null, arguments);
});
var __GLOBAL__sub_I_bind_cpp = Module["__GLOBAL__sub_I_bind_cpp"] = asm["__GLOBAL__sub_I_bind_cpp"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var __GLOBAL__sub_I_rapidStream_cpp = Module["__GLOBAL__sub_I_rapidStream_cpp"] = asm["__GLOBAL__sub_I_rapidStream_cpp"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var _fflush = Module["_fflush"] = asm["_fflush"];
var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = asm["___cxa_is_pointer_type"];
var __GLOBAL__sub_I_seriesClassification_cpp = Module["__GLOBAL__sub_I_seriesClassification_cpp"] = asm["__GLOBAL__sub_I_seriesClassification_cpp"];
var _memset = Module["_memset"] = asm["_memset"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var ___errno_location = Module["___errno_location"] = asm["___errno_location"];
var __GLOBAL__sub_I_knnClassification_cpp = Module["__GLOBAL__sub_I_knnClassification_cpp"] = asm["__GLOBAL__sub_I_knnClassification_cpp"];
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var __GLOBAL__sub_I_regression_cpp = Module["__GLOBAL__sub_I_regression_cpp"] = asm["__GLOBAL__sub_I_regression_cpp"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var ___getTypeName = Module["___getTypeName"] = asm["___getTypeName"];
var __GLOBAL__sub_I_classification_cpp = Module["__GLOBAL__sub_I_classification_cpp"] = asm["__GLOBAL__sub_I_classification_cpp"];
var __GLOBAL__sub_I_neuralNetwork_cpp = Module["__GLOBAL__sub_I_neuralNetwork_cpp"] = asm["__GLOBAL__sub_I_neuralNetwork_cpp"];
var ___cxa_can_catch = Module["___cxa_can_catch"] = asm["___cxa_can_catch"];
var __GLOBAL__sub_I_modelSet_cpp = Module["__GLOBAL__sub_I_modelSet_cpp"] = asm["__GLOBAL__sub_I_modelSet_cpp"];
var _free = Module["_free"] = asm["_free"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var _memmove = Module["_memmove"] = asm["_memmove"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _emscripten_replace_memory = Module["_emscripten_replace_memory"] = asm["_emscripten_replace_memory"];
var __GLOBAL__sub_I_svmClassification_cpp = Module["__GLOBAL__sub_I_svmClassification_cpp"] = asm["__GLOBAL__sub_I_svmClassification_cpp"];
var dynCall_viiiii = Module["dynCall_viiiii"] = asm["dynCall_viiiii"];
var dynCall_vid = Module["dynCall_vid"] = asm["dynCall_vid"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
var dynCall_vii = Module["dynCall_vii"] = asm["dynCall_vii"];
var dynCall_iiiiiiiiiii = Module["dynCall_iiiiiiiiiii"] = asm["dynCall_iiiiiiiiiii"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_viiiiiiiiiii = Module["dynCall_viiiiiiiiiii"] = asm["dynCall_viiiiiiiiiii"];
var dynCall_iiiiii = Module["dynCall_iiiiii"] = asm["dynCall_iiiiii"];
var dynCall_viiiiiidddii = Module["dynCall_viiiiiidddii"] = asm["dynCall_viiiiiidddii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_viiiiii = Module["dynCall_viiiiii"] = asm["dynCall_viiiiii"];
var dynCall_di = Module["dynCall_di"] = asm["dynCall_di"];
var dynCall_viiiiiiiiii = Module["dynCall_viiiiiiiiii"] = asm["dynCall_viiiiiiiiii"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_diii = Module["dynCall_diii"] = asm["dynCall_diii"];
var dynCall_dii = Module["dynCall_dii"] = asm["dynCall_dii"];
var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];
var dynCall_iiiii = Module["dynCall_iiiii"] = asm["dynCall_iiiii"];
var dynCall_viiid = Module["dynCall_viiid"] = asm["dynCall_viiid"];
var dynCall_viii = Module["dynCall_viii"] = asm["dynCall_viii"];
var dynCall_iiiiiiiiiidd = Module["dynCall_iiiiiiiiiidd"] = asm["dynCall_iiiiiiiiiidd"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_viid = Module["dynCall_viid"] = asm["dynCall_viid"];
var dynCall_iiiid = Module["dynCall_iiiid"] = asm["dynCall_iiiid"];
var dynCall_viiii = Module["dynCall_viiii"] = asm["dynCall_viiii"];
Runtime.stackAlloc = asm["stackAlloc"];
Runtime.stackSave = asm["stackSave"];
Runtime.stackRestore = asm["stackRestore"];
Runtime.establishStackSpace = asm["establishStackSpace"];
Runtime.setTempRet0 = asm["setTempRet0"];
Runtime.getTempRet0 = asm["getTempRet0"];
function ExitStatus(status) {
 this.name = "ExitStatus";
 this.message = "Program terminated with exit(" + status + ")";
 this.status = status;
}
ExitStatus.prototype = new Error;
ExitStatus.prototype.constructor = ExitStatus;
var initialStackTop;
var preloadStartTime = null;
var calledMain = false;
dependenciesFulfilled = function runCaller() {
 if (!Module["calledRun"]) run();
 if (!Module["calledRun"]) dependenciesFulfilled = runCaller;
};
Module["callMain"] = Module.callMain = function callMain(args) {
 assert(runDependencies == 0, "cannot call main when async dependencies remain! (listen on __ATMAIN__)");
 assert(__ATPRERUN__.length == 0, "cannot call main when preRun functions remain to be called");
 args = args || [];
 ensureInitRuntime();
 var argc = args.length + 1;
 function pad() {
  for (var i = 0; i < 4 - 1; i++) {
   argv.push(0);
  }
 }
 var argv = [ allocate(intArrayFromString(Module["thisProgram"]), "i8", ALLOC_NORMAL) ];
 pad();
 for (var i = 0; i < argc - 1; i = i + 1) {
  argv.push(allocate(intArrayFromString(args[i]), "i8", ALLOC_NORMAL));
  pad();
 }
 argv.push(0);
 argv = allocate(argv, "i32", ALLOC_NORMAL);
 try {
  var ret = Module["_main"](argc, argv, 0);
  exit(ret, true);
 } catch (e) {
  if (e instanceof ExitStatus) {
   return;
  } else if (e == "SimulateInfiniteLoop") {
   Module["noExitRuntime"] = true;
   return;
  } else {
   if (e && typeof e === "object" && e.stack) Module.printErr("exception thrown: " + [ e, e.stack ]);
   throw e;
  }
 } finally {
  calledMain = true;
 }
};
function run(args) {
 args = args || Module["arguments"];
 if (preloadStartTime === null) preloadStartTime = Date.now();
 if (runDependencies > 0) {
  Module.printErr("run() called, but dependencies remain, so not running");
  return;
 }
 preRun();
 if (runDependencies > 0) return;
 if (Module["calledRun"]) return;
 function doRun() {
  if (Module["calledRun"]) return;
  Module["calledRun"] = true;
  if (ABORT) return;
  ensureInitRuntime();
  preMain();
  if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
   Module.printErr("pre-main prep time: " + (Date.now() - preloadStartTime) + " ms");
  }
  if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
  if (Module["_main"] && shouldRunNow) Module["callMain"](args);
  postRun();
 }
 if (Module["setStatus"]) {
  Module["setStatus"]("Running...");
  setTimeout((function() {
   setTimeout((function() {
    Module["setStatus"]("");
   }), 1);
   doRun();
  }), 1);
 } else {
  doRun();
 }
}
Module["run"] = Module.run = run;
function exit(status, implicit) {
 if (implicit && Module["noExitRuntime"]) {
  Module.printErr("exit(" + status + ") implicitly called by end of main(), but noExitRuntime, so not exiting the runtime (you can use emscripten_force_exit, if you want to force a true shutdown)");
  return;
 }
 if (Module["noExitRuntime"]) {
  Module.printErr("exit(" + status + ") called, but noExitRuntime, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)");
 } else {
  ABORT = true;
  EXITSTATUS = status;
  STACKTOP = initialStackTop;
  exitRuntime();
  if (Module["onExit"]) Module["onExit"](status);
 }
 if (ENVIRONMENT_IS_NODE) {
  process["stdout"]["once"]("drain", (function() {
   process["exit"](status);
  }));
  console.log(" ");
  setTimeout((function() {
   process["exit"](status);
  }), 500);
 } else if (ENVIRONMENT_IS_SHELL && typeof quit === "function") {
  quit(status);
 }
 throw new ExitStatus(status);
}
Module["exit"] = Module.exit = exit;
var abortDecorators = [];
function abort(what) {
 if (what !== undefined) {
  Module.print(what);
  Module.printErr(what);
  what = JSON.stringify(what);
 } else {
  what = "";
 }
 ABORT = true;
 EXITSTATUS = 1;
 var extra = "";
 var output = "abort(" + what + ") at " + stackTrace() + extra;
 if (abortDecorators) {
  abortDecorators.forEach((function(decorator) {
   output = decorator(output, what);
  }));
 }
 throw output;
}
Module["abort"] = Module.abort = abort;
if (Module["preInit"]) {
 if (typeof Module["preInit"] == "function") Module["preInit"] = [ Module["preInit"] ];
 while (Module["preInit"].length > 0) {
  Module["preInit"].pop()();
 }
}
var shouldRunNow = true;
if (Module["noInitialRun"]) {
 shouldRunNow = false;
}
run();
"use strict";
console.log("RapidLib 13.6.2017 12:41");
Module.prepTrainingSet = (function(trainingSet) {
 var rmTrainingSet = new Module.TrainingSet;
 for (var i = 0; i < trainingSet.length; ++i) {
  var tempInput = new Module.VectorDouble;
  var tempOutput = new Module.VectorDouble;
  for (var j = 0; j < trainingSet[i].input.length; ++j) {
   tempInput.push_back(parseFloat(trainingSet[i].input[j]));
  }
  for (var j = 0; j < trainingSet[i].output.length; ++j) {
   tempOutput.push_back(parseFloat(trainingSet[i].output[j]));
  }
  var tempObj = {
   "input": tempInput,
   "output": tempOutput
  };
  rmTrainingSet.push_back(tempObj);
 }
 return rmTrainingSet;
});
Module.checkOutput = (function(jsInput) {
 for (var i = 0; i < jsInput.length; ++i) {
  if (typeof jsInput[i].output === "undefined") {
   jsInput[i].output = [];
  }
 }
 return jsInput;
});
Module.Regression = (function() {
 this.modelSet = new Module.RegressionCpp;
});
Module.Regression.prototype = {
 train: (function(trainingSet) {
  return this.modelSet.train(Module.prepTrainingSet(trainingSet));
 }),
 reset: (function() {
  return this.modelSet.reset();
 }),
 run: (function(input) {
  if (arguments.length > 1) {
   input = Array.from(arguments);
  }
  var inputVector = new Module.VectorDouble;
  for (var i = 0; i < input.length; ++i) {
   inputVector.push_back(input[i]);
  }
  var outputVector = new Module.VectorDouble;
  outputVector = this.modelSet.run(inputVector);
  var output = [];
  for (var i = 0; i < outputVector.size(); ++i) {
   output.push(outputVector.get(i));
  }
  return output;
 }),
 process: (function(input) {
  if (arguments.length > 1) {
   input = Array.from(arguments);
  }
  var inputVector = new Module.VectorDouble;
  for (var i = 0; i < input.length; ++i) {
   inputVector.push_back(input[i]);
  }
  var outputVector = new Module.VectorDouble;
  outputVector = this.modelSet.run(inputVector);
  var output = [];
  for (var i = 0; i < outputVector.size(); ++i) {
   output.push(outputVector.get(i));
  }
  return output;
 })
};
Module.Classification = (function(type) {
 if (type) {
  this.modelSet = new Module.ClassificationCpp(type);
 } else {
  this.modelSet = new Module.ClassificationCpp;
 }
});
Module.Classification.prototype = {
 train: (function(trainingSet) {
  return this.modelSet.train(Module.prepTrainingSet(trainingSet));
 }),
 getK: (function() {
  var outputVector = new Module.VectorInt;
  outputVector = this.modelSet.getK();
  var output = [];
  for (var i = 0; i < outputVector.size(); ++i) {
   output.push(outputVector.get(i));
  }
  return output;
 }),
 setK: (function(whichModel, newK) {
  this.modelSet.setK(whichModel, newK);
 }),
 reset: (function() {
  return this.modelSet.reset();
 }),
 run: (function(input) {
  if (arguments.length > 1) {
   input = Array.from(arguments);
  }
  var inputVector = new Module.VectorDouble;
  for (var i = 0; i < input.length; ++i) {
   inputVector.push_back(input[i]);
  }
  var outputVector = new Module.VectorDouble;
  outputVector = this.modelSet.run(inputVector);
  var output = [];
  for (var i = 0; i < outputVector.size(); ++i) {
   output.push(outputVector.get(i));
  }
  return output;
 }),
 process: (function(input) {
  if (arguments.length > 1) {
   input = Array.from(arguments);
  }
  var inputVector = new Module.VectorDouble;
  for (var i = 0; i < input.length; ++i) {
   inputVector.push_back(input[i]);
  }
  var outputVector = new Module.VectorDouble;
  outputVector = this.modelSet.run(inputVector);
  var output = [];
  for (var i = 0; i < outputVector.size(); ++i) {
   output.push(outputVector.get(i));
  }
  return output;
 })
};
Module.ModelSet = (function() {
 this.myModelSet = [];
 this.modelSet = new Module.ModelSetCpp;
});
Module.ModelSet.prototype.loadJSON = (function(url) {
 var that = this;
 console.log("url ", url);
 var request = new XMLHttpRequest;
 request.open("GET", url, true);
 request.responseType = "json";
 request.onload = (function() {
  var modelSet = this.response;
  console.log("loaded: ", modelSet);
  var allInputs = modelSet.metadata.inputNames;
  modelSet.modelSet.forEach((function(value) {
   var numInputs = value.numInputs;
   var whichInputs = new Module.VectorInt;
   switch (value.modelType) {
   case "kNN classification":
    var neighbours = new Module.TrainingSet;
    var k = value.k;
    for (var i = 0; i < allInputs.length; ++i) {
     if (value.inputNames.includes(allInputs[i])) {
      whichInputs.push_back(i);
     }
    }
    var myKnn = new Module.KnnClassification(numInputs, whichInputs, neighbours, k);
    value.examples.forEach((function(value) {
     var features = new Module.VectorDouble;
     for (var i = 0; i < numInputs; ++i) {
      features.push_back(parseFloat(value.features[i]));
     }
     myKnn.addNeighbour(parseInt(value.class), features);
    }));
    that.addkNNModel(myKnn);
    break;
   case "Neural Network":
    var numLayers = value.numHiddenLayers;
    var numNodes = value.numHiddenNodes;
    var weights = new Module.VectorDouble;
    var wHiddenOutput = new Module.VectorDouble;
    var inRanges = new Module.VectorDouble;
    var inBases = new Module.VectorDouble;
    var localWhichInputs = [];
    for (var i = 0; i < allInputs.length; ++i) {
     if (value.inputNames.includes(allInputs[i])) {
      whichInputs.push_back(i);
      localWhichInputs.push(i);
     }
    }
    var currentLayer = 0;
    value.nodes.forEach((function(value, i) {
     if (value.name === "Linear Node 0") {
      for (var j = 1; j <= numNodes; ++j) {
       var whichNode = "Node " + (j + numNodes * (numLayers - 1));
       wHiddenOutput.push_back(parseFloat(value[whichNode]));
      }
      wHiddenOutput.push_back(parseFloat(value.Threshold));
     } else {
      currentLayer = Math.floor((i - 1) / numNodes);
      if (currentLayer < 1) {
       for (var j = 0; j < numInputs; ++j) {
        weights.push_back(parseFloat(value["Attrib " + allInputs[localWhichInputs[j]]]));
       }
      } else {
       for (var j = 1; j <= numNodes; ++j) {
        weights.push_back(parseFloat(value["Node " + (j + numNodes * (currentLayer - 1))]));
       }
      }
      weights.push_back(parseFloat(value.Threshold));
     }
    }));
    for (var i = 0; i < numInputs; ++i) {
     inRanges.push_back(value.inRanges[i]);
     inBases.push_back(value.Bases[i]);
    }
    var outRange = value.outRange;
    var outBase = value.outBase;
    var myNN = new Module.NeuralNetwork(numInputs, whichInputs, numLayers, numNodes, weights, wHiddenOutput, inRanges, inBases, outRange, outBase);
    that.addNNModel(myNN);
    break;
   default:
    console.warn("unknown model type ", value.modelType);
    break;
   }
  }));
 });
 request.send(null);
 return true;
});
Module.ModelSet.prototype.addNNModel = (function(model) {
 console.log("Adding NN model");
 this.myModelSet.push(model);
});
Module.ModelSet.prototype.addkNNModel = (function(model) {
 console.log("Adding kNN model");
 this.myModelSet.push(model);
});
Module.ModelSet.prototype.run = (function(input) {
 var modelSetInput = new Module.VectorDouble;
 for (var i = 0; i < input.length; ++i) {
  modelSetInput.push_back(input[i]);
 }
 var output = [];
 for (var i = 0; i < this.myModelSet.length; ++i) {
  output.push(this.myModelSet[i].run(modelSetInput));
 }
 return output;
});
Module.ModelSet.prototype.process = (function(input) {
 return run(input);
});
Module.SeriesClassification = (function() {
 this.seriesClassification = new Module.SeriesClassificationCpp;
});
Module.SeriesClassification.prototype = {
 addSeries: (function(newSeries) {
  newSeries = Module.checkOutput(newSeries);
  return this.seriesClassification.addTrainingSet(Module.prepTrainingSet(newSeries));
 }),
 train: (function(newSeriesSet) {
  for (var i = 0; i < newSeriesSet.length; ++i) {
   newSeriesSet[i] = Module.checkOutput(newSeriesSet[i]);
   this.seriesClassification.addTrainingSet(Module.prepTrainingSet(newSeriesSet[i]));
  }
 }),
 reset: (function() {
  this.seriesClassification.reset();
 }),
 run: (function(inputSeries) {
  inputSeries = Module.checkOutput(inputSeries);
  return this.seriesClassification.runTrainingSet(Module.prepTrainingSet(inputSeries));
 }),
 process: (function(inputSeries) {
  inputSeries = Module.checkOutput(inputSeries);
  return this.seriesClassification.runTrainingSet(Module.prepTrainingSet(inputSeries));
 }),
 getCosts: (function(inputSeries) {
  if (inputSeries) {
   inputSeries = Module.checkOutput(inputSeries);
   this.seriesClassification.runTrainingSet(Module.prepTrainingSet(inputSeries));
  }
  var returnArray = [];
  var VecDouble = this.seriesClassification.getCosts();
  for (var i = 0; i < VecDouble.size(); ++i) {
   returnArray[i] = VecDouble.get(i);
  }
  return returnArray;
 })
};
Module.StreamProcess = (function(windowSize) {
 if (windowSize) {
  this.rapidStream = new Module.RapidStreamCpp(windowSize);
 } else {
  this.rapidStream = new Module.RapidStreamCpp;
 }
});
Module.StreamProcess.prototype = {
 push: (function(input) {
  this.rapidStream.pushToWindow(parseFloat(input));
 }),
 clear: (function() {
  this.rapidStream.clear();
 }),
 velocity: (function() {
  return this.rapidStream.velocity();
 }),
 acceleration: (function() {
  return this.rapidStream.acceleration();
 }),
 minimum: (function() {
  return this.rapidStream.minimum();
 }),
 maximum: (function() {
  return this.rapidStream.maximum();
 }),
 sum: (function() {
  return this.rapidStream.sum();
 }),
 mean: (function() {
  return this.rapidStream.mean();
 }),
 standardDeviation: (function() {
  return this.rapidStream.standardDeviation();
 }),
 rms: (function() {
  return this.rapidStream.rms();
 }),
 minVelocity: (function() {
  return this.rapidStream.minVelocity();
 }),
 maxVelocity: (function() {
  return this.rapidStream.maxVelocity();
 }),
 minAcceleration: (function() {
  return this.rapidStream.minAcceleration();
 }),
 maxAcceleration: (function() {
  return this.rapidStream.maxAcceleration();
 })
};
