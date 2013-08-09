//Default position values for the 
var margin = {
	top : 20,
	right : 0,
	bottom : 20,
	left : 0
}, width = 700, height = 400, formatNumber = d3.format(",d"), transitioning;


var x = d3.scale.linear().domain([ 0, width ]).range([ 0, width ]);
var y = d3.scale.linear().domain([ 0, height ]).range([ 0, height ]);

//Create the treemap to store the hierarchy
var treemap = d3.layout
	.treemap()
	//Select all the parents to display
	.children(function(d, depth) {
		return depth ? null : d.children;
	})
	//Organize automatically the nodes 
	.sort(function(a, b) {
		return a.value - b.value;
	}).ratio(height / width * 0.5 * (1 + Math.sqrt(5))).round(false);

//Create the svg with its properties. Create the hierarchical elements
var svg = d3.select("#chart")
	.append("svg")
	.attr("width", width)
	.attr("height",	height)
	.style("margin-left", -margin.left + "px")
	.style("margin.right", -margin.right + "px")
	.append("g")
	.attr("transform","translate(" + margin.left + "," + margin.top + ")")
	.style("shape-rendering", "crispEdges");

//This is the text that will show the hierarchy filled with orange color
var grandparent = svg.append("g")
	.attr("class", "grandparent");

grandparent.append("rect")
	.attr("y", -margin.top)
	.attr("width", width)
	.attr("height", margin.top + 20);

grandparent.append("text")
	.attr("x", 6)
	.attr("y", 6 - margin.top)
	.attr("dy",".75em");

//D3 JSON reader, it returns an array of objects. In this case is called root
d3.json("test2.json", function(root) {
	initialize(root);
	accumulate(root);
	layout(root);
	display(root);
	
	//Initial values for the chart
	function initialize(root) {
		root.x = root.y = 0;
		root.dx = width;
		root.dy = height;
		root.depth = 0;
	}

	// This computes the values of all the children
	function accumulate(d) {
		return d.children ? d.value = d.children.reduce(function(p, v) {
			return p + accumulate(v);
		}, 0) : d.value;
	}

	// Compute the treemap layout recursively such that each group of siblings
	// uses the same size rather than the dimensions of the parent cell.
	function layout(d) {
		if (d.children) {
			treemap.nodes({
				children : d.children
			});
			d.children.forEach(function(c) {
				c.x = d.x + c.x * d.dx;
				c.y = d.y + c.y * d.dy;
				c.dx *= d.dx;
				c.dy *= d.dy;
				c.parent = d;
				layout(c);
			});
		}
	}
	
	// Display the tree map
	function display(d) {
		grandparent.datum(d.parent)
			.on("click", transition)
			.select("text")
			.text(name(d));
		
		//Append grandparent
		var g1 = svg.insert("g", ".grandparent")
			.datum(d)
			.attr("class", "depth");
		
		//Append Children
		var g = g1.selectAll("g")
			.data(d.children)
			.enter()
			.append("g");
		
		//Filter the displaying nodes
		g.filter(function(d) {
			return d.children;
			}).classed("children", true)
			.on("click", transition);

		g.selectAll(".child")
			.data(function(d) {
				return d.children || [ d ];
			}).enter()
			.append("rect")
			.attr("class", "child")
			.call(rect);

		g.append("rect")
			.attr("class", "parent")
			.call(rect);
		
		g.append("text")
		.attr("dy", ".75em")
		.text(function(d) {
			return d.name + " - Value:" + d.value;
		}).call(text)
		.append("img")
		.attr("src", 'http://www.seonightmares.com/images/good.png');
		
		//This method is in charge of the zoom transition
		function transition(d) {
			if (transitioning || !d){
				return;
			}else{
				transitioning = true;
			}
			
			var g2 = display(d);
			var t1 = g1.transition().duration(500);
			var t2 = g2.transition().duration(500);

			// Update the domain only after entering new elements.
			x.domain([ d.x, d.x + d.dx ]);
			y.domain([ d.y, d.y + d.dy ]);

			// Enable anti-aliasing during the transition.
			svg.style("shape-rendering", null);

			// Draw child nodes on top of parent nodes.
			svg.selectAll(".depth").sort(function(a, b) {
				return a.depth - b.depth;
			});

			// Fade-in entering text.
			g2.selectAll("text").style("fill-opacity", 0);

			// Transition to the new view.
			t1.selectAll("text").call(text).style("fill-opacity", 0);
			t2.selectAll("text").call(text).style("fill-opacity", 1);
			t1.selectAll("rect").call(rect);
			t2.selectAll("rect").call(rect);

			// Remove the old node when the transition is finished.
			t1.remove().each("end", function() {
				svg.style("shape-rendering", "crispEdges");
				transitioning = false;
			});
		}

		return g;
	}
	
	//This method sets the properties of the text
	function text(text) {
		text.attr("x", function(d) {
			return x(d.x) + 6;
		}).attr("y", function(d) {
			return y(d.y) + 25;
		});
	}

	// This method sets the properties of the rectangle
	function rect(rect) {
		rect.attr("x", function(d) {
			return x(d.x);
		}).attr("y", function(d) {
			return y(d.y);
		}).attr("width", function(d) {
			return x(d.x + d.dx) - x(d.x);
		}).attr("height", function(d) {
			return y(d.y + d.dy) - y(d.y);
		});
	}
	
	// This method returns the name of the actual node
	function name(d) {
		return d.parent ? name(d.parent) + "." + d.name : d.name;
	}
});