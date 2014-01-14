var EventEmitter = require('events').EventEmitter;

function processArgs(args){
    var result = {};
    if(typeof args[args.length-1] == 'function'){
        result.callback = args[args.length-1];
    }
    args = Array.prototype.slice.call(args);
    result.name = args.shift();
    result.conditions = args[0] || {};
    return result;
}

function meetsCriteria(name, object, testName, testObject){
    if(name != testName) return false;
    var result = true;
    Object.keys(testObject).forEach(function(key){
        result = result && object[key] === testObject[key];
    });
    return result;
}

function ExtendedEmitter(){
    return EventEmitter.apply(this, arguments);
}

//ExtendedEmitter.prototype = EventEmitter.prototype;
ExtendedEmitter.prototype = {};
for(var key in EventEmitter.prototype){
    ExtendedEmitter.prototype[key] = EventEmitter.prototype[key];
}

ExtendedEmitter.prototype.off = function(event, fn){
    return this.removeListener.apply(this, arguments)
};

var on = ExtendedEmitter.prototype.on;

ExtendedEmitter.prototype.on = function(name){
    var args = processArgs(arguments);
    on.apply(this, [args.name, function(data){
        if(meetsCriteria(name, data, args.name, args.conditions)){
            args.callback();
        }
    }]);
}

var emit = ExtendedEmitter.prototype.emit;

ExtendedEmitter.prototype.emit = function(){
    emit.apply(this, arguments);
}

ExtendedEmitter.prototype.once = function(name){
    var args = processArgs(arguments);
    var ob = this;
    on.apply(this, [args.name, function cb(data){
        if(meetsCriteria(name, data, args.name, args.conditions)){
            args.callback();
            ob.off.apply(ob, [args.name, cb]);
        }
    }]);
}

ExtendedEmitter.prototype.when = function(events, callback){
    var count = 0;
    var returns = [];
    var ob = this;
    events.forEach(function(event, index){
        var respond = function(emission){
            count++;
            returns[index] = emission;
            if(count == events.length) callback.apply(callback, returns);
        }
        if(typeof event == 'function') event(respond);
        else ob.once(event, respond);
    });
};

module.exports = ExtendedEmitter;