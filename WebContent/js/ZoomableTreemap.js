(function(){
	
	// CONSTANTS
	var TOOLTIP_NUMBER_FORMAT = ",d";	
	var CHART_ELEMENTS_MARGIN = {
		top: 45,
		right: 0,
		bottom: 0,
		left: 0
	};	
	var TEXT_MARGIN = {
		top: 10,
		right: 0,
		bottom: 0,
		left : 6
	};	
    var CHART_ANCHOR = 700;
    var CHART_HEIGHT = 500 - CHART_ELEMENTS_MARGIN.top;
    var ZOOM_TRANSITION_DURATION = 400;
    
    // VARIABLES
    
    var formatTooltipNumber = d3.format(TOOLTIP_NUMBER_FORMAT);
    var transitioning = false;
	
    /**
     * Return the max value of an array
     */
	var getArrayMaxValue = function(array){
		var position = array.length-1;
		
		for (var i=array.length-1; i--;) {
		   if (array[i] > array[position]) {
			   position = i;
		   }
		}
		return array[position];
	};
	
	/*
	 * Return the maximum value of the nodes that are displayed at the moment
	 * in the chart
	 */
	var getMaxShownValue = function(){
		var array = [];
		var elements = $(".depth:last .shown");
		
		for (var i = 0; i < elements.length; i++){
			array.push(elements[i].__data__.color);
		}				
		return getArrayMaxValue(array);
	};	
	
	//This method sets the properties of each text element
	var text = function(text) {
		//Position in x
		text.attr("x", function(d) {
			return x(d.x) + TEXT_MARGIN.left; 
		})
		//Position in y
		.attr("y", function(d) {
			return y(d.y) + TEXT_MARGIN.top; 
		});
	};
	
	// This method sets the properties of each rectangle(node) element
	var rect = function(rect) {
		rect.attr("x", function(d) {
			return x(d.x); 
		}).attr("y", function(d) {
			return y(d.y); 
		}).attr("width", function(d) {
			return x(d.x + d.dx) - x(d.x);
		}).attr("height", function(d) {
			return y(d.y + d.dy) - y(d.y); 
		});
	};
	
	// This method returns the name of the actual node
	var name = function(d) {
		return d.parent 
			? name(d.parent) + " - " + d.name
			: d.name;
	};
	
	var x = d3.scale.linear().domain([0, CHART_ANCHOR]).range([0, CHART_ANCHOR]);
	var y = d3.scale.linear().domain([0, CHART_HEIGHT]).range([0, CHART_HEIGHT]);
	
	// Create the Tree map to store the hierarchy
	var treemap = d3.layout.treemap()
	    .children(function(d, depth) { return depth ? null : d.children; })
	    .sort(function(a, b) { return a.value - b.value; })
	    .ratio(CHART_HEIGHT / CHART_ANCHOR * 0.5 * (1 + Math.sqrt(5)))
	    .round(false);
	
	/*
	 * Create the SVG with its properties. Create the hierarchical elements
	 * If you want to change the color of the nodes just change the class name
	 * and then check what color do you want in the COLORBREWER.CSS file
	 */ 
	var svg = d3.select("#chart").append("svg")
		.attr("class", "Blues")
	    .attr("width", CHART_ANCHOR + CHART_ELEMENTS_MARGIN.left + CHART_ELEMENTS_MARGIN.right)
	    .attr("height", CHART_HEIGHT + CHART_ELEMENTS_MARGIN.bottom + CHART_ELEMENTS_MARGIN.top)
	    .style("margin-left", -CHART_ELEMENTS_MARGIN.left + "px")
	    .style("margin.right", -CHART_ELEMENTS_MARGIN.right + "px")
	  .append("g")
	    .attr("transform", "translate(" + CHART_ELEMENTS_MARGIN.left + "," + CHART_ELEMENTS_MARGIN.top + ")")
	    .style("shape-rendering", "crispEdges");
	
	// This is the text that will show the hierarchy filled with orange color
	var grandparent = svg.append("g")
	    .attr("class", "grandparent");
	
	grandparent.append("rect")
	    .attr("y", -CHART_ELEMENTS_MARGIN.top)
	    .attr("width", CHART_ANCHOR)
	    .attr("height", CHART_ELEMENTS_MARGIN.top);
	
	grandparent.append("text")
	    .attr("font-size", "26px")
	    .attr("x", TEXT_MARGIN.left)
	    .attr("y", TEXT_MARGIN.top - CHART_ELEMENTS_MARGIN.top)
	    .attr("dy", ".90em");
	
	// D3 JSON reader, it returns an array of objects(root).
	d3.json("util/sample.json", function(root) {		
		/*
		 * This is the formula to calculate the proper color of the chart node. 
		 * It is calculated based on the color property that is stored in the
		 * JSON file, divided into the maximum value of the visible nodes and
		 * then multiplied by 8 that is the mayor number in the COLORBREWER.JS
		 * You can check the COLORBREWER.CSS file in order to get it.
		 */
		var colorNumberGenerator = function(d) {
	        return parseInt((d.color/getMaxShownValue()) * 8 , 10);
	    };
		
	    // Initial values for the chart
		var initialize = function(root) {
			root.x = root.y = 0;
			root.dx = CHART_ANCHOR;
			root.dy = CHART_HEIGHT;
			root.depth = 0;
		};
	
		/*
		 * This computes the values of all the children and show it as
		 * the "value" label in each node
		 */ 
		var accumulate = function(d) {
			return d.children
			? d.value = d.children.reduce(function(p, v) {
				return p + accumulate(v); 
			}, 0)
			: d.value;
		};
		
		/*
		 * Compute the tree map layout recursively such that each group of 
		 * siblings uses the same size rather than the dimensions of the 
		 * parent cell.
		 */ 
		var layout = function(d) {
			if (d.children) {
				treemap.nodes({children: d.children});
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
			var transition = function(d) {
				if (transitioning || !d) return;
			    	transitioning = true;
			    	
		    	var g2 = display(d),
		        	t1 = g1.transition().duration(ZOOM_TRANSITION_DURATION),
		        	t2 = g2.transition().duration(ZOOM_TRANSITION_DURATION);
		    		
			    // Update the domain only after entering new elements.
		    	x.domain([d.x, d.x + d.dx]);
			    y.domain([d.y, d.y + d.dy]);
			
			    // Enable anti-aliasing during the transition.
			    svg.style("shape-rendering", null);
			
			    // Draw child nodes on top of parent nodes.
			    svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });
			
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
			
			// Append Grandparent
		    var g1 = svg.insert("g", " .grandparent")
		        .datum(d)
		        .attr("class", "depth");
		
		    // Append Children
		    var g = g1.selectAll("g")
		        .data(d.children)
		        .enter().append("g")
		        .attr("class", "shown");
		   		    
		    // Filter the displaying nodes just the node that has children
		    g.filter(function(d) {
		    	return d.children; 
		    }).classed("children", true)
		    .on("click", transition);
		
		    g.selectAll(".child")
		    	.data(function(d) {
		        	return d.children || [d]; 
		        })
		        .enter().append("rect")
		        .attr("class", function(d){
		        	return "child";
		        })
		        .call(rect);
		    
		    g.append("rect")
		    	/*
		    	 * The class that is given is to assign the proper color
		    	 * depending on the color property of each node. 
		    	 * Check the COLORBREWER.CSS file to check the values that
		    	 * it can take
		    	 */  
		        .attr("class", function(d){
		        	return "q" + colorNumberGenerator(d) + "-9 parent";
		        })
		        .call(rect)
		        .append("title")
		        .text(function(d) {
		        	return formatTooltipNumber(d.value);
		        });
		    
		    /*
	         *  Change the 'd y' attribute to change the position in Y axis
	         *  of the text
	         */ 
		    g.append("text")
		    	.attr("class", "bigger")
		        .attr("dy", ".75em")
		        .text(function(d) {
		        	return "Name: " + d.name; 
		        })
		        .call(text);
		
	        g.append("text")
		        .attr("class", "normalSize")
		        .attr("dy", "2.5em")
		        .text(function(d) {
		        	return "Value: "  + d.value + " Area (km2)"; 
		        }).call(text);
		        
	        g.append("text")
		        .attr("class", "normalSize")
		        .attr("dy", "3.7em")
		        .text(function(d) {
		        	return "Color: " + d.color; 
		        }).call(text);
		        
		    return g;
		};
		initialize(root);
		accumulate(root);
		layout(root);
		display(root);
	});
})();
