(function(){
	//Default position values for the margin
	var margin = {
		top : 20,
		right : 0,
		bottom : 20,
		left : 0
	}, width = 700, height = 500, transitioning;
	
	//Calculates the color of the node.
	color = d3.scale.linear()
    	.domain([0, 1000])
    	.range(["#009A9A", "#1B1BB3"]);
	
	//Duration of the zoom transition
	var transitionDuration = 400;

	//This method sets the properties of the text
	var text = function(text) {
		//Position in x
		text.attr("x", function(d) {
			return x(d.x) + 6;
		})
		//Position in y
		.attr("y", function(d) {
			return y(d.y) + 25;
		});
	};
		
	// This method sets the properties of the rectangle(node)
	var rect = function(rect) {
		//Position in x
		rect.attr("x", function(d) {
			return x(d.x);
		})
		//Position in y
		.attr("y", function(d) {
			return y(d.y);
		})
		//Width of the node
		.attr("width", function(d) {
			return x(d.x + d.dx) - x(d.x);
		})
		//Height of the node
		.attr("height", function(d) {
			return y(d.y + d.dy) - y(d.y);
		});
	};
	
	// This method returns the name of the actual node
	var name = function(d) {
		return d.parent ? name(d.parent) + "." + d.name : d.name;
	};

	var x = d3.scale.linear().domain([ 0, width ]).range([ 0, width ]);
	var y = d3.scale.linear().domain([ 0, height ]).range([ 0, height ]);

	//Create the Treemap to store the hierarchy
	var treemap = d3.layout.treemap()
		//Select all the parents to display
		.children(function(d, depth) {
			return depth ? null : d.children;
		})
		//Organize automatically the nodes depending the size
		.sort(function(a, b) {
			return a.value - b.value;
		}).ratio(height / width * 0.5 * (1 + Math.sqrt(5))).round(false);

	//Create the SVG with its properties. Create the hierarchical elements
	var svg = d3.select("#chart")
		.attr("class", "blues")
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
		.attr("y", 10 - margin.top)
		.attr("dy",".90em");

	//D3 JSON reader, it returns an array of objects. In this case is called root
	d3.json("test2.json", function(root) {	
			    
		//Initial values for the chart
		var initialize = function(root) {
			root.x = root.y = 0;
			root.dx = width;
			root.dy = height;
			root.depth = 0;
		};

		//This computes the values of all the children
		var accumulate = function(d) {
			return d.children ? d.value = d.children.reduce(function(p, v) {
				return p + accumulate(v);
			}, 0) : d.value;
		};
		
		// Compute the tree map layout recursively such that each group of siblings
		// uses the same size rather than the dimensions of the parent cell.
		var layout = function(d) {
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
		};
		
		// Display the tree map
		var display = function(d) {
			//This method is in charge of the zoom transition
			var transition = function(d) {
				if (transitioning || !d){
					return;
				}else{
					transitioning = true;
				}
				
				var g2 = display(d);
				var t1 = g1.transition().duration(transitionDuration);
				var t2 = g2.transition().duration(transitionDuration);

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
			};		
			
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
				.call(rect)
				.attr("fill", "red");
		
			g.append("rect")
				.attr("class", "parent")
				.call(rect)
				.on("click", function(d){
					console.log(d.value);
				});
						
			//Create the text of each node, setting the height and the name that
			// will be displayed on it
			g.append("text")
			.attr("dy", ".75em")
			.text(function(d) {
				return "name: " + d.name + " - value:" + d.value;
			}).call(text);
			
			d3.selectAll("rect.parent").style("fill", function(d){
				var blue = parseInt((d.value / 39000) * 255, 10);
				return "rgb(0,"+ blue +",255)";
			});
			
			d3.selectAll("rect.child").style("fill", function(d){
				var blue = parseInt((d.value / 39000) * 255, 10);
				return "rgb(0,"+ blue +",255)";
			});
			return g;
		};
		
		initialize(root);
		accumulate(root);
		layout(root);
		display(root);
		
	});
})();