// see https://www.youtube.com/watch?v=1hqt8JkYRdI

import { setPolyData }  from "./all3d.js";

var data = {
	"circles": [],
	"triangles": []
};
var spacing = 25;
var width = jQuery('canvas').attr('width');
var height = jQuery('canvas').attr('height');
var errno = 0;

function det2D(p1, p2, p3) {
	return p1.x * (p2.y - p3.y)
	+ p2.x * (p3.y - p1.y)
	+ p3.x * (p1.y - p2.y);
}

function checkTriWinding(p1, p2, p3, allowReversed) {
	var detTri = det2D(p1, p2, p3);
	if (detTri < 0.0) {
		if (allowReversed) {
			var t = p3.x;
			p3.x = p2.x;
			p2.x = t;
			
			t = p3.y;
			p3.y = p2.y;
			p2.y = t;
		} else {
			errno = 1;
		}
	}
}

function boundaryCollideChk(p1, p2, p3, eps) {
	return det2D(p1, p2, p3) < eps;
}

function boundaryDoesntCollideChk(p1, p2, p3, eps) {
	return det2D(p1, p2, p3) <= eps;
}

function triTri2D(t1, t2, eps, allowReversed, onBoundary) {
	//bool(*chkEdge)(Point*, Point*, Point*, double);
	var i;
	
	// Triangles must be expressed anti-clockwise
	checkTriWinding(t1[0], t1[1], t1[2], allowReversed);
	if (errno != 0) {
		return false;
	}
	checkTriWinding(t2[0], t2[1], t2[2], allowReversed);
	if (errno != 0) {
		return false;
	}
	var chkEdge = null;

	if (onBoundary) {
		// Points on the boundary are considered as colliding
		chkEdge = boundaryCollideChk;
	} else {
		// Points on the boundary are not considered as colliding
		chkEdge = boundaryDoesntCollideChk;
	}
	
	//For edge E of trangle 1,
	for (var i = 0; i < 3; ++i) {
		var j = (i + 1) % 3;
		
		//Check all points of trangle 2 lay on the external side of the edge E. If
		//they do, the triangles do not collide.
		if (chkEdge(t1[i], t1[j], t2[0], eps) &&
		chkEdge(t1[i], t1[j], t2[1], eps) &&
		chkEdge(t1[i], t1[j], t2[2], eps)) {
			return false;
		}
	}
	
	//For edge E of trangle 2,
	for (var i = 0; i < 3; i++) {
		var j = (i + 1) % 3;
		
		//Check all points of trangle 1 lay on the external side of the edge E. If
		//they do, the triangles do not collide.
		if (chkEdge(t2[i], t2[j], t1[0], eps) &&
		chkEdge(t2[i], t2[j], t1[1], eps) &&
		chkEdge(t2[i], t2[j], t1[2], eps))
		return false;
	}
	
	//The triangles collide
	return true;
}


function getKey(x, y, i) {
	return { x: x, y: y, k: x + "_" + y, i: i };
}

function getUniqueTriKey(x, y, z) {
	// sort by size
	var ar = [x,y,z];
	ar.sort();
	return ar[0] + "_" + ar[1] + "_" + ar[2];
}

function createTriangles(circles) {
	var triangles = [];
	var cachePoints = {};
	var cacheTris = {};
	// fill the cache
	for (var i = 0; i < circles.length; i++) {
		var kk = getKey(circles[i].x, circles[i].y, i);
		cachePoints[kk.k] = kk;
	}
	for (var i = 0; i < circles.length; i++) {
		var pp = [];
		var c = circles[i];
		var nk1 = getKey(c.x + spacing, c.y, i);             // 
		var nk2 = getKey(c.x - spacing, c.y, i);             // 
		var nk3 = getKey(c.x, c.y + spacing, i);             //   8 4 6
		var nk4 = getKey(c.x, c.y - spacing, i);             //   2 X 1
		var nk5 = getKey(c.x + spacing, c.y + spacing, i);   //   7 3 5
		var nk6 = getKey(c.x + spacing, c.y - spacing, i);	  // triangles:
		var nk7 = getKey(c.x - spacing, c.y + spacing, i);   //   x, 1, 5; x, 5, 3; x, 3, 7; x, 7, 2; x, 2, 8; x, 8, 4; x, 5, 6; x, 6, 1
		var nk8 = getKey(c.x - spacing, c.y - spacing, i);   //
		
		var triangles_to_remove = {};
		if (typeof cachePoints[nk1.k] != "undefined") {
			// get the correct index for each point nk
			nk1.i = cachePoints[nk1.k].i;
			pp.push(nk1);
		} else {
			triangles_to_remove[0] = 1;
			triangles_to_remove[7] = 1;	    
		}
		if (typeof cachePoints[nk2.k] != "undefined") {
			nk2.i = cachePoints[nk2.k].i;
			pp.push(nk2);
		} else {
			triangles_to_remove[3] = 1;
			triangles_to_remove[4] = 1;	    
		}
		if (typeof cachePoints[nk3.k] != "undefined") {
			nk3.i = cachePoints[nk3.k].i;
			pp.push(nk3);
		} else {
			triangles_to_remove[2] = 1;
			triangles_to_remove[1] = 1;	    
		}
		if (typeof cachePoints[nk4.k] != "undefined") {
			nk4.i = cachePoints[nk4.k].i;
			pp.push(nk4);
		} else {
			triangles_to_remove[5] = 1;
			triangles_to_remove[6] = 1;	    
		}
		if (typeof cachePoints[nk5.k] != "undefined") {
			nk5.i = cachePoints[nk5.k].i;
			pp.push(nk5);
		} else {
			triangles_to_remove[0] = 1;
			triangles_to_remove[1] = 1;	    
		}
		if (typeof cachePoints[nk6.k] != "undefined") {
			nk6.i = cachePoints[nk6.k].i;
			pp.push(nk6);
		} else {
			triangles_to_remove[6] = 1;
			triangles_to_remove[7] = 1;	    
		}
		if (typeof cachePoints[nk7.k] != "undefined") {
			nk7.i = cachePoints[nk7.k].i;
			pp.push(nk7);
		} else {
			triangles_to_remove[2] = 1;
			triangles_to_remove[3] = 1;	    
		}
		if (typeof cachePoints[nk8.k] != "undefined") {
			nk8.i = cachePoints[nk8.k].i;
			pp.push(nk8);
		} else {
			triangles_to_remove[4] = 1;
			triangles_to_remove[5] = 1;	    
		}
		// what are the potential triangles?
		var possibleTriangles = [ [c, nk1, nk5], [c, nk5, nk3], [c, nk3, nk7],
		[c, nk7, nk2], [c, nk2, nk8], [c, nk8, nk4],
		[c, nk4, nk6], [c, nk6, nk1] ];
		var rem = Object.keys(triangles_to_remove);
		var tris = possibleTriangles.filter(function(a, idx) {
			if (rem.indexOf(idx) == -1) {
				// we have a triangle that does not yet exist, add to our output
				// if we have not done so
				
				var triKey = getUniqueTriKey(i, a[1].i, a[2].i);
				if (typeof cacheTris[triKey] == "undefined") {
					// check if this triangle intersects with any other existing triangle
					var thisTriangle = [ {x: c.x, y: c.y}, {x: a[1].x, y: a[1].y}, {x: a[2].x, y: a[2].y} ]; // as array of array of coordinates
					var overlaps = false;
					for (var j = 0; j < triangles.length; j++) {
						var p1 = data.circles[triangles[j][0]];
						var p2 = data.circles[triangles[j][1]];
						var p3 = data.circles[triangles[j][2]];
						var thatTriangle = [{x: p1.x, y: p1.y}, {x: p2.x, y: p2.y}, {x: p3.x, y: p3.y}];
						if (triTri2D(thisTriangle, thatTriangle, 0.0, true, false)) {
							overlaps = true;
							break;
						}
					}
					if (!overlaps) {
						// add to the cache and add the triangle
						cacheTris[triKey] = 1;
						triangles.push([i, a[1].i, a[2].i]);
					}
				}
			}
		});
	}
	
	return triangles;    
}

function createPlacement(x, y) {
	// create a placement centered at x, y
	var circles = [ {x: x, y: y}];
	var k = x + "_" + y;
	var cache = { k: 1 };
	var numPoints = 200;
	var freePoint = 0;
	while (circles.length < numPoints) {
		// check if we have a free point
		var c = circles[freePoint];
		var nk1 = (c.x + spacing) + "_" + (c.y);
		if (typeof cache[nk1] == 'undefined') {
			circles.push({ x: c.x + spacing, y: c.y });
			cache[nk1] = 1;
			continue;
		}
		var nk3 = (c.x) + "_" + (c.y + spacing);
		if (typeof cache[nk3] == 'undefined') {
			circles.push({ x: c.x, y: c.y + spacing});
			cache[nk3] = 1;
			continue;
		}
		var nk2 = (c.x - spacing) + "_" + (c.y);
		if (typeof cache[nk2] == 'undefined') {
			circles.push({ x: c.x - spacing, y: c.y });
			cache[nk2] = 1;
			continue;
		}
		var nk4 = (c.x) + "_" + (c.y - spacing);
		if (typeof cache[nk4] == 'undefined') {
			circles.push({ x: c.x, y: c.y - spacing});
			cache[nk4] = 1;
			continue;
		}
		/*	var nk5 = (c.x + spacing) + "_" + (c.y + spacing);
		if (typeof cache[nk5] == 'undefined') {
			circles.push({ x: c.x + spacing, y: c.y + spacing});
			cache[nk5] = 1;
			continue;
		}
		var nk6 = (c.x + spacing) + "_" + (c.y - spacing);
		if (typeof cache[nk6] == 'undefined') {
			circles.push({ x: c.x + spacing, y: c.y - spacing});
			cache[nk6] = 1;
			continue;
		}
		var nk7 = (c.x - spacing) + "_" + (c.y + spacing);
		if (typeof cache[nk7] == 'undefined') {
			circles.push({ x: c.x - spacing, y: c.y + spacing});
			cache[nk7] = 1;
			continue;
		}
		var nk8 = (c.x - spacing) + "_" + (c.y - spacing);
		if (typeof cache[nk8] == 'undefined') {
			circles.push({ x: c.x - spacing, y: c.y - spacing});
			cache[nk8] = 1;
			continue;
		} */
		if (freePoint < circles.length) {
			freePoint++; // try with the next point
		}
	}
	
	return circles;
}


function draw(data) {
	const canvas = document.getElementById("canvas");
	if (canvas.getContext) {
		const ctx = canvas.getContext("2d");
		var radius = 2;
		
		ctx.lineWidth = 0.2;
		ctx.beginPath();
		for (var i = 0; i < data.circles.length; i++) {
			ctx.moveTo(data.circles[i].x + radius, data.circles[i].y);
			ctx.arc(data.circles[i].x, data.circles[i].y, radius, 0, Math.PI * 2, true);
		}
		ctx.stroke();
		
		// drawing triangles
		ctx.strokeStyle = "rgba(166,189,219,0.7)";
		ctx.lineWidth = 0.5;
		ctx.beginPath();
		for (var i = 0; i < data.triangles.length; i++) {
			var pos1 = data.circles[data.triangles[i][0]];
			var pos2 = data.circles[data.triangles[i][1]];
			var pos3 = data.circles[data.triangles[i][2]];
			ctx.moveTo(pos1.x, pos1.y);
			ctx.lineTo(pos2.x, pos2.y);
			ctx.lineTo(pos3.x, pos3.y);
		}
		ctx.stroke();
		
		// draw the voronoi tessalation
		ctx.strokeStyle = "rgba(44,127,184,0.7)";
		ctx.lineWidth = 0.5;
		ctx.beginPath();
		var iter = data.voronoi.cellPolygons();
		var poly = null;
		while ( !(poly = iter.next()).done ) {
			//console.log(JSON.stringify(poly.value));
			if (calcPolygonArea(poly.value) > 800)
				continue;
			for (var point = 0; point < poly.value.length; point++) {
				if (point == 0)
					ctx.moveTo(poly.value[point][0], poly.value[point][1]);
				else
					ctx.lineTo(poly.value[point][0], poly.value[point][1]);
			}			
		}
		ctx.stroke();
	}
}

function computeVoronoi(data) {
	// we should also draw the voronoi diagram, just to see what that looks like
	var bounds = [0, 0, 100, 100]; // min-x, min-y, max-x, max-y
	var ps = [];
	for (var i = 0; i < data.circles.length; i++) {
		if (i == 0) {
			bounds[0] = data.circles[i].x;
			bounds[1] = data.circles[i].y;
			bounds[2] = data.circles[i].x;
			bounds[3] = data.circles[i].y;
			continue;
		}
		if (bounds[0] > data.circles[i].x)
			bounds[0] = data.circles[i].x;
		if (bounds[1] > data.circles[i].y)
			bounds[1] = data.circles[i].y;
		if (bounds[2] < data.circles[i].x)
			bounds[2] = data.circles[i].x;
		if (bounds[3] < data.circles[i].y)
			bounds[3] = data.circles[i].y;
		ps.push([data.circles[i].x, data.circles[i].y])
	}
	const delaunay = d3.Delaunay.from(ps);
	const voronoi = delaunay.voronoi(bounds);
	return voronoi;
}


function jitter(data, noise=10.0) {
	for (var i = 1; i < data.length; i++) {
		data[i].x += (Math.random()-0.5)*noise;
		data[i].y += (Math.random()-0.5)*noise;
	}
	return data;
}

function rotatePattern(data, rad=-0.001) {
	var accelerator = 2.0;
	// assume that we rotate around the first circle (should be in the center)
	for (var i = 1; i < data.length; i++) {
		var r = Math.sqrt((data[i].x - data[0].x)*(data[i].x - data[0].x) + (data[i].y - data[0].y)*(data[i].y - data[0].y));
		var theta = Math.atan2(data[i].y-data[0].y, data[i].x-data[0].x);
		// make rotation bigger based on r
		var theta_new = theta + (r*accelerator * rad);
		data[i].x = data[0].x + (r * Math.cos(theta_new));
		data[i].y = data[0].y + (r * Math.sin(theta_new));
	}
	return data;
}

function calcPolygonArea(vertices) {
    var total = 0;

    for (var i = 0, l = vertices.length; i < l; i++) {
      var addX = vertices[i][0];
      var addY = vertices[i == vertices.length - 1 ? 0 : i + 1][1];
      var subX = vertices[i == vertices.length - 1 ? 0 : i + 1][0];
      var subY = vertices[i][1];

      total += (addX * addY * 0.5);
      total -= (subX * subY * 0.5);
    }

    return Math.abs(total);
}

function computePolygons(data) {
	var polyList = [];
	var iter = data.voronoi.cellPolygons();
	var poly = null;
	while ( !(poly = iter.next()).done ) {
		//console.log(JSON.stringify(poly.value));
		if (calcPolygonArea(poly.value) > 800)
			continue;
		polyList.push(poly.value.slice()); // shallow copy one level down
	}
	return polyList;
}

jQuery(document).ready(function() {	
	data.circles = createPlacement(width/2, height/2);
	data.triangles = createTriangles(data.circles); // has to be done after createPlacement (can be removed as well)
	data.circles = rotatePattern(data.circles);
	data.circles = jitter(data.circles, 4.0);
	data.voronoi = computeVoronoi(data);
	data.polyList = computePolygons(data);
	draw(data);

	// announce data to the 3D section
	setPolyData(data);
});
