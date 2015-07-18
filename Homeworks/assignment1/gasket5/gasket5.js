"use strict";

var canvas;
var gl;

var points = [];
var colors = [];

var numTimesToSubdivide;
var bufferId;
var cbufferId;
var u_rotation;
var u_scale;
var twistCenter = vec2(0.0,0.0);
var u_center;

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

    u_rotation = gl.getUniformLocation(program,'u_rotation');
    u_scale = gl.getUniformLocation(program,'u_scale');
    u_center = gl.getUniformLocation(program,'u_center');

    //rotation slider
    document.getElementById("slider1").onchange = function(event) {

        var targ;
        if (event.target) targ = event.target;
        else if (event.srcElement) targ = event.srcElement;
        if (targ.nodeType == 3) // defeat Safari bug
            targ = targ.parentNode;

        var rotation = Number(targ.value);
        document.getElementById("degrees").innerText = rotation;
        gl.uniform1f(u_rotation,rotation);
        refresh();
    };

    //subdivide level slider
    document.getElementById("slider2").onchange = function(event) {


        var targ;
        if (event.target) targ = event.target;
        else if (event.srcElement) targ = event.srcElement;
        if (targ.nodeType == 3) // defeat Safari bug
            targ = targ.parentNode;

        numTimesToSubdivide = Number(targ.value);
        document.getElementById("steps").innerText = numTimesToSubdivide;
        divideTriangle( vertices[0], vertices[1], vertices[2], numTimesToSubdivide);
        sendVertices();
        refresh();
    };


    document.getElementById("scaleFactor").onchange = function(event) {

        var targ;
        if (event.target) targ = event.target;
        else if (event.srcElement) targ = event.srcElement;
        if (targ.nodeType == 3) // defeat Safari bug
            targ = targ.parentNode;

        //console.log(scaleFactor);
        var scaleFactor = Number(targ.value);
        document.getElementById("scale").innerText = scaleFactor;

        gl.uniform1f(u_scale,scaleFactor);
        refresh();
    };





    numTimesToSubdivide = Number(document.getElementById("slider2").value);


    var vertices = genVertices();
    //console.log(vertices);
    function genVertices() {
        return [(vec2(-1.0,1.0/Math.cos(radians(30))-2.0*Math.sin(radians(60)))),
            (vec2(0.0,1.0/Math.cos(radians(30)))),
            (vec2(1.0,1.0/Math.cos(radians(30))-2.0*Math.sin(radians(60))))];

    }

    divideTriangle( vertices[0], vertices[1], vertices[2], numTimesToSubdivide);
    sendVertices();

    refresh();
}


var colorBase = [
    vec3(1.0,0.0,0.0),
    vec3(0.0,1.0,0.0),
    vec3(0.0,0.0,1.0),
    //vec3(1.0,1.0,1.0)
];

function divideTriangle( a, b, c, count )
{

   // points = [];

    //use iteration
    var queue1 = [a,b,c], queue2 = [], curr = queue1, next = queue2;

    var queue1Color = colorBase, queue2Color = [], currColor = queue1Color, nextColor = queue2Color;


    function swap() {
        if (curr === queue1) {
            curr = queue2;
            queue1 = [];
            next = queue1;

            currColor = queue2Color;
            queue1Color = [];
            nextColor = queue1Color;

        }else{
            curr = queue1;
            queue2 = [];
            next = queue2;

            currColor = queue1Color;
            queue2Color = [];
            nextColor = queue2Color;
        }

        --count;
    };


    var idx,v1,v2,v3,c1,c2,c3;
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

            c1 = currColor[idx];
            c2 = currColor[idx+1];
            c3 = currColor[idx+2];

            nextColor.push(c1);
            nextColor.push(mix(c1,c2,0.5));
            nextColor.push(mix(c1,c3,0.5));

            nextColor.push(mix(c1,c2,0.5));
            nextColor.push(c2);
            nextColor.push(mix(c2,c3,0.5));

            nextColor.push(mix(c1,c3,0.5));
            nextColor.push(mix(c3,c2,0.5));
            nextColor.push(c3);

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

    for (idx in curr) {
        points.push(curr[idx]);
        colors.push(currColor[idx]);
    }

}




window.onload = init;


//send vertices to gpu
function sendVertices() {
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));

    gl.bindBuffer(gl.ARRAY_BUFFER,cbufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,flatten(colors));
}

function render()
{
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( gl.TRIANGLES, 0, points.length );
}


function refresh(){

    var twistCenter = [0.0,0.0];
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

    gl.uniform2f(u_center,twistCenter[0],twistCenter[1]);
    gl.uniform1f(u_rotation,Number(document.getElementById("slider1").value));
    gl.uniform1f(u_scale,Number(document.getElementById('scaleFactor').value));

    render();
}