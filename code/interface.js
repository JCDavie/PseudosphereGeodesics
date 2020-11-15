/*  PseudosphereGeodesics - Visualising the geodesics of the pseudosphere
    Copyright (C) 2020 Tim J. Hutton

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

var canvas;
var ctx;
var range;
var vertical_vertical_view_angle;
var horizontal_vertical_view_angle;

class Geodesic {
    constructor(peak, color) {
        this.peak = peak;
        this.color = color;
    }
}

class Graph {
    constructor(screen_rect, transform, top_text, left_text, bottom_text) {
        this.screen_rect = screen_rect;
        this.transform = transform;
        this.top_text = top_text;
        this.left_text = left_text;
        this.bottom_text = bottom_text;
    }
}

function init() {
    canvas = document.getElementById('canvas');
    ctx = canvas.getContext('2d');

    range = new Rect( new P(-10, -10), new P(20, 20));

    /*var heightRangeSlider = document.getElementById("heightRangeSlider");
    spacetime_range.size.y = lowest_allowed_top + (highest_allowed_top-lowest_allowed_top) * Math.pow(heightRangeSlider.value / 100.0, 3) - lowest_height;
    heightRangeSlider.oninput = function() {
        spacetime_range.size.y = lowest_allowed_top + (highest_allowed_top-lowest_allowed_top) * Math.pow(heightRangeSlider.value / 100.0, 3) - lowest_height;
        console.log("spacetime_range.size.y: ",spacetime_range.size.y);
        fitTimeRange(time_range_offset);
        draw();
    }*/

    var verticalViewAngleSlider = document.getElementById("verticalViewAngleSlider");
    vertical_view_angle = 20 - 40 * verticalViewAngleSlider.value / 100.0;
    verticalViewAngleSlider.oninput = function() {
        vertical_view_angle = 20 - 40 * verticalViewAngleSlider.value / 100.0;
        draw();
    }

    var horizontalViewAngleSlider = document.getElementById("horizontalViewAngleSlider");
    horizontal_view_angle = Math.PI + 2 * Math.PI * horizontalViewAngleSlider.value / 100.0;
    horizontalViewAngleSlider.oninput = function() {
        horizontal_view_angle = Math.PI + 2 * Math.PI * horizontalViewAngleSlider.value / 100.0;
        draw();
    }

    draw();
}

function draw() {

    // fill canvas with light gray
    ctx.fillStyle = 'rgb(240,240,240)';
    ctx.beginPath();
    ctx.rect(0,0,canvas.width, canvas.height);
    ctx.fill();

    var x_axis = getLinePoints(range.min, new P(range.xmax, range.ymin), 200);
    var y_axis = getLinePoints(new P(0, range.ymin), new P(0, range.ymax), 200);
    var minor_axes = [];
    var y_step = divideNicely(range.size.y, 7);
    for(var y = range.ymin; y<=range.ymax; y+= y_step) {
        minor_axes.push(getLinePoints(new P(range.xmin, y), new P(range.xmax, y), 200));
    }

    var x_step = divideNicely(range.size.x, 7);
    for(var x = x_step; x<=range.xmax; x+= x_step) {
        minor_axes.push(getLinePoints(new P(x, range.ymin), new P(x, range.ymax), 200));
    }
    for(var x = -x_step; x>=range.xmin; x-= x_step) {
        minor_axes.push(getLinePoints(new P(x, range.ymin), new P(x, range.ymax), 200));
    }
    /*var geodesics = [new Geodesic(new P(0, range.ymax), 'rgb(100,100,200)'), // blue\
                     new Geodesic(new P(0, spacetime_range.ymin + spacetime_range.size.y * 0.5), 'rgb(200,100,100)'), // red
                     new Geodesic(new P(0, spacetime_range.ymin + spacetime_range.size.y * 0.25), 'rgb(200,100,200)'), // purple
                     new Geodesic(new P(0, spacetime_range.ymin + spacetime_range.size.y * 0.125), 'rgb(100,200,100)')]; // green
    for(var i=0;i<=10;i++) {
        geodesics.push( new Geodesic(new P(0, spacetime_range.ymin+i*spacetime_range.size.y/10.0), 'rgb(150,150,150)') );
    }*/

    var n_graphs = 4;
    var margin = 40;
    var size = Math.min(canvas.height-margin*2, (canvas.width-margin*(n_graphs+1)) / n_graphs);
    var rect1 = new Rect( new P(margin+(margin+size)*0,50), new P(size,size));
    var rect2 = new Rect( new P(margin+(margin+size)*1,50), new P(size,size));
    var rect3 = new Rect( new P(margin+(margin+size)*2,50), new P(size,size));
    var rect4 = new Rect( new P(margin+(margin+size)*3,50), new P(size,size));
    
    var graphs = []
    
    {
        const flipY = p => new P(p.x, range.ymax - p.y + range.ymin);
        const flipYTransform = new Transform( flipY, flipY );
        const standardAxes = new Graph( rect1, new ComposedTransform( flipYTransform, new LinearTransform2D(range, rect1) ),
                                      "Upper half-plane",
                                      "", "" );
        graphs.push(standardAxes);
    }

    // define the Poincare disk transforms
    {
        const circle = new Circle(new P(rect2.center.x, rect2.ymin), rect2.size.x); // TODO: make own space
        const invert = p => circle.invert(p);
        const inversionTransform = new Transform( invert, invert );
        const x_extent = 1;
        const y_extent = 1;
        const spacing = 100;
        const kp_input_rect = new Rect(new P(circle.p.x - circle.r * x_extent, circle.p.y + circle.r),
                                     new P(2 * circle.r * x_extent, circle.r * y_extent));
        const circle2 = new Circle(rect2.center, rect2.size.x / 2); // the half-plane (~kp_input_rect) transformed into this circle
        const PoincareAxes = new Graph( rect2, new ComposedTransform( new LinearTransform2D(range, kp_input_rect),
                            inversionTransform ), "Poincare disk model", "", "" ); // TODO add transform to rect2
        graphs.push(PoincareAxes);
    }

    // define the 3D pseudosphere transforms
    {
        const toPseudosphereCoords = new LinearTransform2D(range, new Rect(new P(-2,0), new P(4,1.5)));
        const identityTransform = p => new P(p.x, p.y, p.z);
        const pseudosphereTransform = new Transform(pseudosphere, identityTransform); // TODO: need camera ray intersection for the reverse
        const camera = new Camera(new P(10*Math.cos(-horizontal_view_angle),10*Math.sin(-horizontal_view_angle), -vertical_view_angle), new P(0,0,-0.5), new P(0,0,-1), 1500, rect3.center);
        const cameraTransform = new Transform( p => camera.project(p), identityTransform );
        const pseudosphereAxes = new Graph( rect3, new ComposedTransform( toPseudosphereCoords, pseudosphereTransform, cameraTransform), "Pseudosphere", "", "" );
        graphs.push(pseudosphereAxes);
    }

    // define the Klein pseudosphere transforms
    {
        const circle = new Circle(new P(rect4.center.x, rect4.ymin), rect4.size.x); // TODO: make own space
        const invert = p => circle.invert(p);
        const inversionTransform = new Transform( invert, invert );
        const x_extent = 1;
        const y_extent = 1;
        const spacing = 100;
        const kp_input_rect = new Rect(new P(circle.p.x - circle.r * x_extent, circle.p.y + circle.r), new P(2 * circle.r * x_extent, circle.r * y_extent));
        const circle2 = new Circle(rect4.center, rect4.size.x / 2); // the half-plane (~kp_input_rect) transformed into this circle
        const poincareToKleinTransform = new Transform( p => poincareToKlein(p, circle2), p => kleinToPoincare(p, circle2) ); // TODO: doesn't work as expected
        const KleinAxes = new Graph( rect4, new ComposedTransform( new LinearTransform2D(range, kp_input_rect),
                            inversionTransform, poincareToKleinTransform ), "Klein disk model", "", "" ); // TODO add transform to rect4
        graphs.push(KleinAxes);
    }

    // define the Jonsson embedding transforms
    /*var identityTransform = p => new P(p.x, p.y, p.z);
    var JonssonEmbeddingTransform = new Transform( p => Jonsson_embedding.getEmbeddingPointFromSpacetime(p), identityTransform );
    var camera = new Camera(new P(10*Math.cos(-horizontal_view_angle),10*Math.sin(-horizontal_view_angle), -vertical_view_angle),
                            new P(0,0,0.5), new P(0,0,1), 2000, rect2.center);
    var cameraTransform = new Transform( p => camera.project(p), identityTransform );
    var JonssonEmbeddingAxes = new Graph( rect2, new ComposedTransform( JonssonEmbeddingTransform, cameraTransform),
                                          "Jonsson embedding", "", "");*/

    // draw the graphs
    graphs.forEach(graph => {
        ctx.save(); // save the original clip for now

        // fill background with white
        ctx.fillStyle = 'rgb(255,255,255)';
        ctx.beginPath();
        ctx.rect(graph.screen_rect.xmin, graph.screen_rect.ymin, graph.screen_rect.size.x, graph.screen_rect.size.y);
        ctx.fill();
        ctx.clip(); // clip to this rect until restored

        // draw axes
        var axes_color = 'rgb(210,210,210)';
        minor_axes.forEach( axes => { drawLine(axes.map(graph.transform.forwards), axes_color); } );
        var axes_color = 'rgb(50,50,50)';
        drawLine(x_axis.map(graph.transform.forwards), axes_color);
        drawLine(y_axis.map(graph.transform.forwards), axes_color);

        // draw some geodesics
        /*geodesics.forEach(geodesic => {
            var pts = getFreeFallPoints(geodesic.peak.x, geodesic.peak.y, spacetime_range.p.y, earth_mass, 500);
            pts = pts.map(graph.transform.forwards);
            drawLine(pts, geodesic.color);
            fillSpacedCircles(pts, 1.5, geodesic.color);
        });*/

        ctx.restore(); // restore the original clip

        // show the graph labels
        ctx.fillStyle = 'rgb(0,0,0)';
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(graph.bottom_text, graph.screen_rect.center.x, graph.screen_rect.ymax + 15);
        ctx.fillText(graph.top_text,    graph.screen_rect.center.x, graph.screen_rect.ymin - 15);
        ctx.save();
        ctx.translate(graph.screen_rect.xmin - 15, graph.screen_rect.center.y);
        ctx.rotate(-Math.PI/2);
        ctx.textAlign = "center";
        ctx.fillText(graph.left_text, 0, 0);
        ctx.restore();
    });
}

window.onload = init;