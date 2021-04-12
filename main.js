var BitField = function(n){
    var floats = Math.ceil(n/64)+1;//extra bits reserved for rng
    var buff = new ArrayBuffer(floats*8);
    var floatView = new Float64Array(buff);
    var int8View = new Uint8Array(buff);
    var intView = new Int32Array(buff);
    this.uint8 = int8View;
    var that = this;
    
    var rule = [
        0,1,1,1,1,0,0,0
    ];
    
    this.setRandomBits = function(){
        for(var i = 0; i < (floats-1)*2; i++){//x2 because float is twice as long as int
            floatView[floats-1] = Math.random();
            int8View[(floats-1)*8] = int8View[(floats-1)*8+4];
            intView[i] = intView[(floats-1)*2];
        }
    };
    this.fill0 = function(){
        for(var i = 0; i < (floats-1)*2; i++){
            intView[i] = 0;
        }
    };
    this.fill1 = function(){
        for(var i = 0; i < (floats-1)*2; i++){
            intView[i] = -1;//2's complement
        }
    };
    this.get = function(idx){
        var i = idx>>5;//divide by 32
        var j = idx%32;
        return (intView[i]>>j)&1;
        //return Math.random()>0.5?0:1;
    };
    this.set = function(idx){
        var i = idx>>5;//divide by 32
        var j = idx%32;
        intView[i] |= (1<<j);
    };
    this.clear = function(idx){
        var i = idx>>5;//divide by 32
        var j = idx%32;
        intView[i] &= ~(1<<j);
    };
    this.getBitList = function(){
        var arr = [];
        for(var idx = 0; idx < n; idx++){
            var i = idx>>5;//divide by 32
            var j = idx%32;
            arr[idx] = (intView[i]>>j)&1;
        }
        return arr;
    };
    this.get2bits = function(idx){
        var i = idx>>3;//divide by 8
        var j = idx%8;
        var val = (int8View[i]|(int8View[i+1]<<8));
        return (val>>j)&3;//7 because 3 bits
    };
    this.stepCellAuto = function(){
        var first = that.get(0);
        var second = that.get(1);
        var secondLast = that.get(n-2);
        var last = that.get(n-1);
        var lastBit = first;//first bit
        for(var i = 1; i < n-1; i++){
            var thisbits = lastBit|(that.get2bits(i)<<1);
            lastBit = (thisbits>>1)&1;
            if(rule[thisbits]){
                that.set(i);
            }else{
                that.clear(i);
            }
        }
        
        //first bit
        if(rule[(last|(first<<1))|second<<2]){
            that.set(0);
        }else{
            that.clear(0);
        }
        //last bit
        if(rule[(secondLast|(last<<1))|first<<2]){
            that.set(n-1);
        }else{
            that.clear(n-1);
        }
    };
};

var calcpi = function(data){
    var sum = 0;
    var n = 0;
    for(var i = 0; i < data.length; i++){
        n += data[i];
        sum += i*data[i];
    }
    var avg = sum/n;
    
    var sdsum = 0;
    for(var i = 0; i < data.length; i++){
        sdsum += data[i]*((i-avg)**2);
    }
    var sd = Math.sqrt(sdsum/n);
    
    var entropy = 0;
    for(var i = 0; i < data.length; i++){
        var p = (data[i]/n);
        if(p !== 0)entropy -= p*Math.log(p);
    }
    
    document.getElementById("sd").innerHTML = "standard deviation: "+sd;
    document.getElementById("et").innerHTML = "entropy: "+entropy;
    
    
    return (Math.E**(2*entropy))/(2*Math.E*sd*sd);
    
    //var pd = (data[Math.floor(avg)-2]+data[Math.floor(avg)-1]+data[Math.floor(avg)])/n/3;
    //return 1/sd/sd/2/pd/pd;
    
    //console.log(sd);
};



var width = 500;//window.innerWidth-30;
var height = 200;
var canvas = document.getElementById("canvas");
canvas.width = width;
canvas.height = height;
var ctx = canvas.getContext("2d");
//var bitfield = new BitField(width);
var bitfield = new BitField(width);
bitfield.set(Math.floor(width/2));
//bitfield.setRandomBits();
var width2 = 5000;
var bitfield2 = new BitField(width2);
bitfield2.set(Math.floor(width/2));
for(var i = 0; i < width2*2; i++){
    bitfield2.stepCellAuto();
}

var canvas2 = document.getElementById("canvas2");
var height2 = 200;
canvas2.width = width;
canvas2.height = height2;
var ctx2 = canvas2.getContext("2d");

var tally = [];
for(var i = 0; i < width2; i++){
    tally[i] = 0;
}

var start = 0;
var animate = function(t){
    if(start === 0)start = t;
    var dt = t-start;
    start = t;
    
    //not using this code overcomplicated as well as notoriously slow
    /*
    for(var i = 0; i < height-1; i++){
        for(var j = 0; j < width; j++){
            var idx = (i*width+j)*4;
            var idx0 = ((i+1)*width+j)*4;
            data[idx+0] = data[idx0+0];
            data[idx+1] = data[idx0+1];
            data[idx+2] = data[idx0+2];
            data[idx+3] = data[idx0+3];
        }
    }//now all graphical data is shifted up
    */
    for(var ii = 0; ii < 1; ii++){
        ctx.putImageData(ctx.getImageData(0,1,width,height),0,0);
        var imgdata = ctx.getImageData(0,0,width,height);
        var data = imgdata.data;
        for(var i = 0; i < width; i++){
            var idx = ((height-1)*width+i)*4;
            var val = 1-bitfield.get(i);
            data[idx+0] = val*255;
            data[idx+1] = val*255;
            data[idx+2] = val*255;
            data[idx+3] = 255;
        }
        bitfield.stepCellAuto();
        ctx.putImageData(imgdata,0,0);
    }
    
    for(var ii = 0; ii < 100; ii++){
        bitfield2.stepCellAuto();
        var count = 0;
        for(var i = 0; i < width2; i++){
            count += bitfield2.get(i);
        }
        tally[count]++;
    }
    
    //rendering the tally
    var maxTally = 0;
    for(var i = 0; i < tally.length; i++){
        if(tally[i] > maxTally)maxTally = tally[i];
    }
    
    
    ctx2.clearRect(0,0,width,height2);
    var imgdata = ctx2.getImageData(0,0,width,height2);
    var data = imgdata.data;
    for(var i = 0; i < width; i++){
        var hhh = tally[i+Math.floor(width2/(2.22))];
        if(maxTally > height2)hhh = hhh*height2/maxTally;
        for(var j = 0; j < hhh; j++){
            var y = height2-1-j;
            if(y < 0)break;
            var idx = (y*width+i)*4;
            data[idx+0] = 0;
            data[idx+1] = 0;
            data[idx+2] = 0;
            data[idx+3] = 255;
        }
    }
    ctx2.putImageData(imgdata,0,0);
    
    var pi = calcpi(tally);
    document.getElementById("display").innerHTML = "π = "+pi;
    
    requestAnimationFrame(animate);
};
requestAnimationFrame(animate);


