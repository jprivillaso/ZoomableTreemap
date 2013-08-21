(function(){
	
	// CONSTANTS
	var TOOLTIP_NUMBER_FORMAT = ",d";	
	var CHART_ELEMENTS_MARGIN = {
<<<<<<< HEAD
		top: 45,
		right: 0,
		bottom: 0,
		left: 0
	};
	/*
	 * You can change any time to reorder as you want the position of the text
	 * in each node
	 */
=======
	top: 45,
	right: 0,
	bottom: 0,
	left: 0
	};	
>>>>>>> 4f55186cef4c464ecefb81a9a70603b901dd5c76
	var TEXT_MARGIN = {
	top: 10,
	right: 0,
	bottom: 0,
	left : 6
	};	
<<<<<<< HEAD
    var CHART_ANCHOR = 980;
    var CHART_HEIGHT = 500 - CHART_ELEMENTS_MARGIN.top;
    var ZOOM_TRANSITION_DURATION = 350;
    
    // VARIABLES    
    var maxShownValue = 0;
    var colorCalculationFlag = 0;
    var formatTooltipNumber = d3.format(TOOLTIP_NUMBER_FORMAT);
    var transitioning = false;
	
=======
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
	
>>>>>>> 4f55186cef4c464ecefb81a9a70603b901dd5c76
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
	    maxShownValue = _.max(array);
		return _.max(array);
	};	
	
	/*
	 * This is the formula to calculate the proper color of the chart node. 
	 * It is calculated based on the color property that is stored in the
	 * JSON file, divided into the maximum value of the visible nodes and
	 * then multiplied by 8 that is the mayor number in the COLORBREWER.JS
	 * You can check the COLORBREWER.CSS file in order to get it. The number
	 * 10 is because we need it the number in 10th base.
	 */
	var colorNumberGenerator = function(node) {
		if (colorCalculationFlag > 1) {
			return parseInt((node.color/maxShownValue) * 8 , 10);
    	}else{
    		return parseInt((node.color/getMaxShownValue()) * 8 , 10);
    	}
    };
	
	//This method sets the properties of each text element
	var text = function(text) {
		//Position in x
		text.attr("x", function(node) {
			return x(node.x) + TEXT_MARGIN.left; 
		})
		//Position in y
		.attr("y", function(node) {
			return y(node.y) + TEXT_MARGIN.top; 
		});
	};
	
	// This method sets the properties of each rectangle(node) element
	var rect = function(rect) {
		rect.attr("x", function(node) {
			return x(node.x); 
		}).attr("y", function(node) {
			return y(node.y); 
		}).attr("width", function(node) {
			return x(node.x + node.dx) - x(node.x);
		}).attr("height", function(node) {
			return y(node.y + node.dy) - y(node.y); 
		});
	};
	
	// This method returns the name of the actual node
	var name = function(node) {
		return node.parent 
			? name(node.parent) + " - " + node.name
			: node.name;
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
		.attr("width", CHART_ANCHOR + "px")
		.attr("height", CHART_HEIGHT + CHART_ELEMENTS_MARGIN.top + "px")
	    .style("margin-left", -CHART_ELEMENTS_MARGIN.left + "px")
	    .style("margin.right", -CHART_ELEMENTS_MARGIN.right + "px")
	    .append("g")
	    .attr("transform", "translate(" + CHART_ELEMENTS_MARGIN.left + "," + CHART_ELEMENTS_MARGIN.top + ")")
	    .style("shape-rendering", "crispEdges");
	
	var createGandparent = function(){		
		// Remove the older grandparent and updates the new one
		$(".grandparent").remove();
			
		// This is the field that will contain the hierarchy route
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
		
		this.getGrandParent = function(){
			return grandparent;
		};
	};
	
	// Initial values for the chart
	var initializeNode = function(root) {
		root.x = root.y = 0;
		root.dx = CHART_ANCHOR;
		root.dy = CHART_HEIGHT;
		root.depth = 0;
	};
	
	/*
	 * This computes the values of all the children and show it as
	 * the "value" label in each node
	 */ 
	var accumulateNodeValue = function(node) {
		return node.children
		? node.value = node.children.reduce(function(parentValue, value) {
			return parentValue + accumulateNodeValue(value); 
		}, 0)
		: node.value;
	};
	
	/*
	 * Compute the tree map layout recursively such that each group of 
	 * siblings uses the same size rather than the dimensions of the 
	 * parent cell.
	 */ 
	var calculateLayout = function(node) {
		if (node.children) {
			treemap.nodes({children: node.children});
			node.children.forEach(function(child) {
				child.x = node.x + child.x * node.dx;
				child.y = node.y + child.y * node.dy;
				child.dx *= node.dx;
				child.dy *= node.dy;
				child.parent = node;
				calculateLayout(child);
			});
		}
	};
		
	// Display the tree map
	var updateChart = function(node) {
		
		// Append Grandparent
	    var g1 = svg.insert("g", " .grandparent")
	        .datum(node)
	        .attr("class", "depth");
		
		var createEachNode = function(node){
	    	// Append Children
		    var nodeChildren = g1.selectAll("g")
		        .data(node.children)
		        .enter().append("g")
		        .attr("class", "shown");
		   		    
		    // Filter the displaying nodes just the node that has children
		    nodeChildren.filter(function(node) {
		    	return node.children; 
		    }).classed("children", true)
		    .on("click", function(actualNode){
		    	colorCalculationFlag = 0;
				transition(actualNode);
			});
		
		    nodeChildren.selectAll(".child")
		    	.data(function(node) {
		        	return node.children || [node]; 
		        })
		        .enter().append("rect")
		        .attr("class", function(node){
		        	return "child";
		        })
		        .call(rect);
		    
		    nodeChildren.append("rect")
		    	/*
		    	 * The class that is given is to assign the proper color
		    	 * depending on the color property of each node. 
		    	 * Check the COLORBREWER.CSS file to check the values that
		    	 * it can take
		    	 */  
		        .attr("class", function(node){
		        	colorCalculationFlag ++;
		        	return "q" + colorNumberGenerator(node) + "-9 parent";
		        })
		        .call(rect)
		        .append("title")
		        .text(function(node) {
		        	return formatTooltipNumber(node.value);
		        });
		    
		    /*
	         *  Change the 'd y' attribute to change the position in Y axis
	         *  of the text
	         */ 
		    nodeChildren.append("text")
		    	.attr("class", "bigger")
		        .attr("dy", ".75em")
		        .text(function(node) {
		        	return "Name: " + node.name; 
		        })
		        .call(text);
		
	        nodeChildren.append("text")
		        .attr("class", "normalSize")
		        .attr("dy", "2.5em")
		        .text(function(node) {
		        	return "Value: "  + node.value + " Area (km2)"; 
		        }).call(text);
		        
	        nodeChildren.append("text")
		        .attr("class", "normalSize")
		        .attr("dy", "3.7em")
		        .text(function(node) {
		        	return "Color: " + node.color; 
		        }).call(text);
		    
		    this.getChildNode = function(){
		    	return nodeChildren;
		    };
		    
	    };
	    	    	    
		var transition = function(node) {
			if (transitioning || !node){
				return;
			}else{
				transitioning = true;
			}
		    	
	    	var chartUpdate = updateChart(node);
	    	var grandpTransition = g1.transition().duration(ZOOM_TRANSITION_DURATION);
	        var parentTransition = chartUpdate.transition().duration(ZOOM_TRANSITION_DURATION);
	    		
		    // Update the domain only after entering new elements.
	    	x.domain([node.x, node.x + node.dx]);
		    y.domain([node.y, node.y + node.dy]);
		
		    // Enable anti-aliasing during the transition.
		    svg.style("shape-rendering", null);
		
		    // Draw child nodes on top of parent nodes.
		    svg.selectAll(".depth").sort(function(a, b) { return a.depth - b.depth; });
		
		    // Fade-in entering text.
		    chartUpdate.selectAll("text").style("fill-opacity", 0);
		
		    // Transition to the new view.
		    grandpTransition.selectAll("text").call(text).style("fill-opacity", 0);
		    parentTransition.selectAll("text").call(text).style("fill-opacity", 1);
		    grandpTransition.selectAll("rect").call(rect);
		    parentTransition.selectAll("rect").call(rect);
		
		    // Remove the old node when the transition is finished.
		    grandpTransition.remove().each("end", function() {
		    	svg.style("shape-rendering", "crispEdges");
		        transitioning = false;
		    });
		};
					
		var grandparent = new createGandparent();			
		grandparent.getGrandParent().datum(node.parent)
			.on("click", function(actualNode){
				colorCalculationFlag = 0;
				transition(actualNode);
			})
		    .select("text")
		    .text(name(node));
				
	    var g = new createEachNode(node);
	    
	    return g.getChildNode();
		
	};	
	
	/*
	 *  D3 JSON reader. It is in charge of preprocessing the chart and then
	 *  display it
	 */ 
	d3.json("util/sample.json", function(root) {
		initializeNode(root);
		accumulateNodeValue(root);
		calculateLayout(root);
		updateChart(root);
	});
})();
