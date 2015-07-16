"use strict";

var canvas;
var gl;

var points = [];
var colors = [];
var numTimesToSubdivide = 5;

var bufferId;
var cbufferId;
var rotation = 0.0;
var scaleFactor = 0.75;

var twistCenter = vec2(0.0,0.0);

function init()
{
    canvas = document.getElementById( "gl-canvas" );

    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Initialize our data for the Sierpinski Gasket
    //

    // First, initialize the corners of our gasket with three points.


    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );

    //  Load shaders and initialize attribute buffers

    var program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );

    // Load the data into the GPU

    bufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferData( gl.ARRAY_BUFFER, 8*Math.pow(4, 11), gl.STATIC_DRAW );


    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );


    cbufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,cbufferId);
    gl.bufferData(gl.ARRAY_BUFFER,16*Math.pow(4, 11),gl.STATIC_DRAW);

    var vColor = gl.getAttribLocation( program, "vColor" );
    gl.vertexAttribPointer( vColor, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vColor );


    var vertices = genVertices();

    function genVertices() {
        return [scale(scaleFactor,vec2(-1.0,1.0/Math.cos(radians(30))-2.0*Math.sin(radians(60)))),
            scale(scaleFactor,vec2(0.0,1.0/Math.cos(radians(30)))),
            scale(scaleFactor,vec2(1.0,1.0/Math.cos(radians(30))-2.0*Math.sin(radians(60))))];

    }



    //points = [];
    divideTriangle( vertices[0], vertices[1], vertices[2],
        numTimesToSubdivide);



    document.getElementById("slider1").onchange = function(event) {

        var targ;
        if (event.target) targ = event.target;
        else if (event.srcElement) targ = event.srcElement;
        if (targ.nodeType == 3) // defeat Safari bug
            targ = targ.parentNode;

        rotation = Number(targ.value);
        document.getElementById("degrees").innerText = rotation;
        refresh();
    };

    document.getElementById("slider2").onchange = function(event) {


        var targ;
        if (event.target) targ = event.target;
        else if (event.srcElement) targ = event.srcElement;
        if (targ.nodeType == 3) // defeat Safari bug
            targ = targ.parentNode;

        numTimesToSubdivide = Number(targ.value);
        document.getElementById("steps").innerText = numTimesToSubdivide;


        //points = [];
        //colors = []
        divideTriangle( vertices[0], vertices[1], vertices[2], numTimesToSubdivide);
        refresh();
    };


    document.getElementById("scaleFactor").onchange = function(event) {

        var targ;
        if (event.target) targ = event.target;
        else if (event.srcElement) targ = event.srcElement;
        if (targ.nodeType == 3) // defeat Safari bug
            targ = targ.parentNode;

        //console.log(scaleFactor);
        scaleFactor = Number(targ.value);
        document.getElementById("scale").innerText = scaleFactor;

        vertices = genVertices();
        divideTriangle( vertices[0], vertices[1], vertices[2], numTimesToSubdivide);
        refresh();
    };


    render();
}

/*
function triangle( a, b, c )
{
    points.push( a, b, c);

}
*/

function divideTriangle( a, b, c, count )
{

   // points = [];

    //use iteration
    var queue1 = [a,b,c], queue2 = [], curr = queue1, next = queue2;

    function swap() {
        if (curr === queue1) {
            curr = queue2;
            queue1 = [];
            next = queue1;
        }else{
            curr = queue1;
            queue2 = [];
            next = queue2;
        }

        --count;
    };


    var idx,v1,v2,v3;
    while (count > 0 ) {
        for (idx = 0; idx < curr.length; idx += 3) {
            v1 = curr[idx];
            v2 = curr[idx+1];
            v3 = curr[idx+2];

            next.push(v1);
            next.push(mix(v1,v2,0.5));
            next.push(mix(v1,v3,0.5));



            next.push(mix(v1,v2,0.5));
            next.push(v2);
            next.push(mix(v2,v3,0.5));


            next.push(mix(v1,v3,0.5));
            next.push(mix(v3,v2,0.5));
            next.push(v3);

            /*
            next.push(mix(v1,v2,0.5));
            next.push(mix(v3,v2,0.5));
            next.push(mix(v1,v3,0.5));
            */
        }
        swap();
    }


    points = [];
    colors = [];
    //console.log(curr);


    //generating lines
    //curr = trianglesToLines(curr);



    var colorBase = [
        vec3(1.0,0.0,0.0),
        vec3(0.0,1.0,0.0),
        vec3(0.0,0.0,1.0),
        //vec3(1.0,1.0,1.0)
    ];


    for (idx in curr) {
        points.push(curr[idx]);
        colors.push(colorBase[idx%3]);
    }



}

function trianglesToLines(pts) {
    var a, b, c,tmp = [];
    for (var idx=0; idx < pts.length; idx += 3) {
        a = pts[idx];
        b = pts[idx+1];
        c = pts[idx+2];
        tmp.push(a,b,b,c,c,a);
    }
    return tmp;
}


window.onload = init;

function render()
{



    var pts = rotate2(rotation,points);


    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(pts));

    gl.bindBuffer(gl.ARRAY_BUFFER,cbufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,flatten(colors));
    //gl.drawArrays( gl.TRIANGLES, 0, points.length );
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, pts.length );
    //requestAnimFrame(render);
}

//return the rotated vertices
function rotate2 (degree, pts)
{
    if (!Array.isArray(pts)) {
        throw "not a points array";
    }
    var theta,v1,v2;
    var ret = [];
    for (var idx in pts) {

        //console.log(twistCenter);
        ret[idx] = vec2(pts[idx][0]-twistCenter[0],pts[idx][1]-twistCenter[1]);
        theta =radians(degree)
            *Math.sqrt (ret[idx][0]* ret[idx][0]+ ret[idx][1]* ret[idx][1])
            *Math.sqrt(3.0)*0.5;

        v1 = vec2(Math.cos(theta),-Math.sin(theta));
        v2 = vec2(Math.sin(theta),Math.cos(theta));
        ret[idx]=  vec2(dot(v1,ret[idx])+twistCenter[0],dot(v2,ret[idx])+twistCenter[1]);
    }
    return ret;
}

function refresh(){
    twistCenter[0] = Number(document.getElementById('twistX').value);
    twistCenter[1] = Number(document.getElementById('twistY').value);

    if (twistCenter[0] < -1.0 || twistCenter[0] >1.0) {
        twistCenter[0] = 0.0;
        document.getElementById('twistX').value = '0.0';

    }
    if (twistCenter[1] < -1.0 || twistCenter[1] >1.0) {
        twistCenter[1] = 0.0;
        document.getElementById('twistY').value = '0.0';

    }

    console.log(twistCenter);
    //console.log(twistCenter);
    render();

}