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
var u_center;
var twistCenter = [0.0,0.0];

var geometry = 0; //0 for triangle
var mode = 0; //0 for gasket 1 for solid 2 for mesh
var animation = false;
var speed;
var theta;


function init()
{
    canvas = document.getElementById( "gl-canvas" );



    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    canvas.onmousedown = click;
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
    gl.bufferData( gl.ARRAY_BUFFER, 16*Math.pow(4, 11)*2, gl.STATIC_DRAW );


    // Associate out shader variables with our data buffer

    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );


    cbufferId = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,cbufferId);
    gl.bufferData(gl.ARRAY_BUFFER,24*Math.pow(4, 11)*2, gl.STATIC_DRAW);

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

        theta = Number(targ.value);
        document.getElementById("degrees").textContent = theta;
        gl.uniform1f(u_rotation,theta);
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
        document.getElementById("steps").textContent = numTimesToSubdivide;
        clearVertices();
        genVertices();
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
        document.getElementById("scale").textContent = scaleFactor;

        gl.uniform1f(u_scale,scaleFactor);
        refresh();
    };


    document.getElementById("appearance").onclick = function(event) {
        var targ;
        if (event.target) targ = event.target;
        else if (event.srcElement) targ = event.srcElement;
        if (targ.nodeType == 3) // defeat Safari bug
            targ = targ.parentNode;

        mode = Number(targ.index);
        clearVertices();
        genVertices();
        sendVertices();
        refresh();

    }

    document.getElementById("geometry").onclick = function(event) {
        var targ;
        if (event.target) targ = event.target;
        else if (event.srcElement) targ = event.srcElement;
        if (targ.nodeType == 3) // defeat Safari bug
            targ = targ.parentNode;

        geometry = Number(targ.index);
        clearVertices();
        genVertices();
        sendVertices();
        refresh();

    }

    document.getElementById("speedSlider").onchange = function(event) {

        var targ;
        if (event.target) targ = event.target;
        else if (event.srcElement) targ = event.srcElement;
        if (targ.nodeType == 3) // defeat Safari bug
            targ = targ.parentNode;

        //console.log(scaleFactor);
        speed = Number(targ.value);
        document.getElementById("speed").textContent = speed;

        //gl.uniform1f(u_scale,scaleFactor);
        //refresh();
    };


    numTimesToSubdivide = Number(document.getElementById("slider2").value);

    function genVertices() {
        var vertices;
        if (geometry == 0) {
            vertices = [(vec2(-1.0, 1.0 / Math.cos(radians(30)) - 2.0 * Math.sin(radians(60)))),
                (vec2(0.0, 1.0 / Math.cos(radians(30)))),
                (vec2(1.0, 1.0 / Math.cos(radians(30)) - 2.0 * Math.sin(radians(60))))];
            divideTriangle(vertices[0], vertices[1], vertices[2], numTimesToSubdivide);

        } else {
            vertices = [vec2(-1.0,1.0),vec2(-1.0,-1.0),vec2(1.0,-1.0),vec2(1.0,1.0)];
            divideTriangle(vertices[0], vertices[1], vertices[3], numTimesToSubdivide);
            divideTriangle(vertices[2], vertices[1], vertices[3], numTimesToSubdivide);
        }
    }



    clearVertices();
    genVertices();
    sendVertices();
    refresh();
    if (animation) render();
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

            if (mode > 0) {
                next.push(mix(v1,v2,0.5));
                next.push(mix(v3,v2,0.5));
                next.push(mix(v1,v3,0.5));
                nextColor.push(mix(c1,c2,0.5));
                nextColor.push(mix(c3,c2,0.5));
                nextColor.push(mix(c1,c3,0.5));

            }

        }
        swap();
    }


    //points = [];
    //colors = [];
    //console.log(curr);

    if (mode == 2) {
        for (idx = 0; idx < curr.length; idx += 3) {
            points.push(curr[idx]);
            colors.push(currColor[idx]);

            points.push(curr[idx+1]);
            colors.push(currColor[idx+1]);

            points.push(curr[idx+1]);
            colors.push(currColor[idx+1]);

            points.push(curr[idx+2]);
            colors.push(currColor[idx+2]);

            points.push(curr[idx+2]);
            colors.push(currColor[idx+2]);

            points.push(curr[idx]);
            colors.push(currColor[idx]);
        }

    }else {
        for (idx in curr) {
            points.push(curr[idx]);
            colors.push(currColor[idx]);
        }
    }


}




window.onload = init;

function clearVertices() {
    points = [];
    colors = [];
}

//send vertices to gpu
function sendVertices() {
    gl.bindBuffer( gl.ARRAY_BUFFER, bufferId );
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, flatten(points));

    gl.bindBuffer(gl.ARRAY_BUFFER,cbufferId);
    gl.bufferSubData(gl.ARRAY_BUFFER,0,flatten(colors));
}


var direction = 1;
function render()
{
    gl.clearColor(0.0,0.0,0.0,1.0);
    gl.clear( gl.COLOR_BUFFER_BIT );
    gl.drawArrays( mode == 2 ?gl.LINES:gl.TRIANGLES, 0, points.length );


    if (animation) {

        //theta = parseFloat(document.getElementById("slider1").value);

        var max = parseFloat(document.getElementById("slider1").max);
        var min = parseFloat(document.getElementById("slider1").min);

        var delta = speed/60;


        theta += (direction > 0?delta:-delta);
        //console.log(theta);

        if (theta > max) {
            direction = -1;
            theta = max;
        }else if (theta < min) {
            direction = 1;
            theta = min;
        }


        //console.log(theta);

        if (Math.abs(theta - parseFloat(document.getElementById("slider1").value)) >= 1.0) {
            if (direction > 0) {
                document.getElementById("slider1").value = Math.floor(theta);
                document.getElementById("degrees").textContent = Math.floor(theta);
            }else{
                document.getElementById("slider1").value = Math.ceil(theta);
                document.getElementById("degrees").textContent = Math.ceil(theta);
            }

        }
        gl.uniform1f(u_rotation,theta);
        requestAnimationFrame(render);
    }
}


function refresh(){

    /*
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
*/
    gl.uniform2f(u_center,twistCenter[0],twistCenter[1]);
    gl.uniform1f(u_rotation,Number(document.getElementById("slider1").value));
    gl.uniform1f(u_scale,Number(document.getElementById('scaleFactor').value));
    theta = parseFloat(document.getElementById("slider1").value);
    gl.uniform1f(u_rotation,theta);
    speed = parseFloat(document.getElementById("speedSlider").value);
    if (!animation) {render();}
}

function toggleAnimation() {
    animation = !animation;
    if (animation) render();
}

function click(ev) {
    var x = ev.clientX;
    var y = ev.clientY;
    var rect = ev.target.getBoundingClientRect();
    x = ((x-rect.left) - canvas.width/2)/(canvas.width/2);
    y = ((canvas.height/2)- (y-rect.top))/(canvas.width/2);

    twistCenter = [x,y];
    x = String(x);
    y = String(y);
    if (x.length > 4) x = x.slice(0,4);
    if (y.length > 4) y = y.slice(0,4);
    document.getElementById("twistX").textContent = x;
    document.getElementById("twistY").textContent = y;

    refresh();
}

function reCenter() {
    twistCenter = [0.0,0.0];
    document.getElementById("twistX").textContent = "0.0";
    document.getElementById("twistY").textContent = "0.0";
    refresh();
}