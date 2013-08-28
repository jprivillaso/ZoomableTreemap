(function(){

	// CONSTANTS
	var CHART_ELEMENTS_MARGIN = {
		top: 45,
		right: 0,
		bottom: 0,
		left: 0
	};
	/*
	 * You can change any time to reorder as you want the position of the text
	 * in each node
	 */
	var TEXT_MARGIN = {
		top: 10,
		right: 0,
		bottom: 0,
		left : 6
	};
	
	var FIRST_NODE_NAME_MARGIN_TOP = 0.75;
	var CHART_ANCHOR = 600;
	var CHART_HEIGHT = 400;
    var ZOOM_TRANSITION_DURATION = 350;
    
    // VARIABLES    
    var maxShownValue = 0;
    var colorCalculationFlag = 0;
    var transitioning = false;
    var tooltipProperties = [];
    var propertiesToShow = [];
    
    /*
	 * Return the maximum value of the nodes that are displayed at the moment
	 * in the chart
	 */
	var getMaxShownValue = function(property){
		var colorArray = [];
		var elements = $(".depth:last .shown");

		for (var i = 0; i < elements.length; i++){
			colorArray.push(elements[i].__data__[property]);
		}		
	    maxShownValue = _.max(colorArray);
		return {
			max: _.max(colorArray)
		};
	};	

	/*
	 * This is the formula to calculate the proper color of the chart node. 
	 * It is calculated based on the color property that is stored in the
	 * JSON file, divided into the maximum value of the visible nodes and
	 * then multiplied by 8 that is the mayor number in the COLORBREWER.JS
	 * scale.
	 * You can check the COLORBREWER.CSS file in order to get it. The number
	 * 10 is because we need it the number in 10th base.
	 * The colorCalculationFlag is used to check whether the function is 
	 * accessed once or not, so after the first calculation, there will just
	 *  read the maxShownValue attribute
	 */
	var colorNumberGenerator = function(node) {
		if (colorCalculationFlag > 1) {
			return parseInt((node.color/maxShownValue) * 8 , 10);
    	}else{
    		return parseInt((node.color/getMaxShownValue("color").max) * 8 , 10);
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

	var x = d3.scale.linear()
				.domain([0, CHART_ANCHOR]).range([0, CHART_ANCHOR]);
	var y = d3.scale.linear()
				.domain([0, CHART_HEIGHT]).range([0, CHART_HEIGHT]);

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
		.attr("class", "YlOrRd")
		.attr("width", CHART_ANCHOR + "px")
		.attr("height", CHART_HEIGHT + CHART_ELEMENTS_MARGIN.top + "px")
	    .style("margin-left", -CHART_ELEMENTS_MARGIN.left + "px")
	    .style("margin.right", -CHART_ELEMENTS_MARGIN.right + "px")
	    .append("g")
	    .attr("transform", "translate(" + CHART_ELEMENTS_MARGIN.left 
	    		+ "," + CHART_ELEMENTS_MARGIN.top + ")")
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
	
	/*
	 * This will append the text to each node depending on an array that is
	 * received as a parameter. The name don´t need to be included as it is 
	 * added by default 
	 */
	var appendChildren = function(nodeChildren) {
		if (propertiesToShow.length > 0){
			for (var iter = 0; iter < propertiesToShow.length; iter++) {
				nodeChildren.append("text")
	       		.attr("class", function(node){
	       			return "txt" + propertiesToShow[iter] + " " +
	       				node.name
	       				.replace(/ /g,'')
	       				.replace('(', '')
	       				.replace(')', '');
	       		})
	       		.attr("dy",(FIRST_NODE_NAME_MARGIN_TOP * ((iter) * 1.5) + 2) + "em")
		        .text(function(node) {
		        	return propertiesToShow[iter] + ": " 
		        		+ node[propertiesToShow[iter]];
		        }).call(text);
			}
		}
	};
	
	/*
	 * Resize automatically the font-size of each node depending on the
	 *  length of each text
	 */
	var setFontSize = function(){	
		var namesArray = $(".depth:last .shown .txtName");
		
		/*
		 * Return the max length of each text present in 
		 * each node
		 */
		var getMaxTextLength = function(element){
			var selector = $(".shown.rect" + element.__data__.name
												 .replace(/ /g,'')
												 .replace('(', '')
												 .replace(')', '') + " text");
			var widthArray = [];
			for (var j = 0; j < selector.length; j++) {
				widthArray.push(selector[j].offsetWidth);
			}
			return _.max(widthArray);
		};
		
		var sumOfHeights = function(element){
			var selecto2 = $(".shown.rect" + element.__data__.name
					 .replace(/ /g,'')
					 .replace('(', '')
					 .replace(')', '') + " text");
				
			var sum = 0;
			for (var j = 0; j < selecto2.length; j++) {
				sum = sum + selecto2[j].offsetHeight;
			}
			return sum; 
		};
		
		/*
		 * Setting the font-size of nodes
		 */
		var setChildrenFonts = function(){
			for(var i = 0; i < namesArray.length; i++){
				
				while((getMaxTextLength(namesArray[i]) > (document.getElementById(namesArray[i].__data__.name.replace(/ /g,'').replace('(', '').replace(')', '')).getBBox().width)-5)
						|| (sumOfHeights(namesArray[i]) > document.getElementById(namesArray[i].__data__.name.replace(/ /g,'').replace('(', '').replace(')', '')).getBBox().height)){

					var fontSize = $(".txtName." + namesArray[i]
						.__data__.name.replace(/ /g,'')
						.replace('(', '')
						.replace(')', ''))
						.css("font-size"); 
					var newSize = fontSize.substring(0, fontSize.length-2);
					var className = namesArray[i].__data__.name
												 .replace(/ /g,'')
												 .replace('(', '')
												 .replace(')', '');
					$(".txtName." + className).css("font-size", (newSize - 2) + "px");
					$(".txtvalue." + className).css("font-size", (newSize - 2) + "px");
					$(".txtcolor." + className).css("font-size", (newSize - 2) + "px");
				}
			}
		};
		
		/*
		 * Setting the font-size of the upper bar
		 */
		var setGrandparendFonts = function(){
			var grandparentText = $(".grandparent text");
			var grandparentRect = $(".grandparent rect");
			
			while (grandparentText[0].offsetWidth > 
						grandparentRect[0].width.baseVal.value) {
				
				var fontSize = grandparentText.css("font-size");
				var newSize = fontSize.substring(0, fontSize.length - 2);
				
				grandparentText.css("font-size", (newSize - 1) + "px" );
			}
		};
		
		setChildrenFonts();
		setGrandparendFonts();
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
		        .attr("class", function(node){
		        	return "shown rect" + node.name
		        							  .replace(/ /g,'')
		        							  .replace('(', '')
		        							  .replace(')', '');
		        });

		    // Filter the displaying nodes just the node that has children
		    nodeChildren.filter(function(node) {
		    	return node.children; 
		    }).classed("children", true)
		    .on("click", function(actualNode){
		    	colorCalculationFlag = 0;
				transition(actualNode);
			});
		    
		    /*
	    	 * The class that is given is to assign the proper color
	    	 * depending on the color property of each node. 
	    	 * Check the COLORBREWER.CSS file to check the values that
	    	 * it can take
	    	 */  
		    nodeChildren.append("rect")
		        .attr("class", function(node){
		        	colorCalculationFlag ++;
		        	return "q" + colorNumberGenerator(node) + "-9 parent ";
		        })
		        .attr("id", function(node){
		        	return node.name
		        	           .replace(/ /g,'')
		        	           .replace('(', '')
		        	           .replace(')', '');
		        })
		        .attr("name", function(node){
		    		return node.name;
		    	}).call(rect)
		        .append("title")
		        .text(function(node) {
		        	var tooltip = "";
		        	for ( var iter = 0; iter < tooltipProperties.length; iter++) {
						tooltip += tooltipProperties[iter] + ": " + node[tooltipProperties[iter]] + "\n";
					}
		        	return tooltip;
		        });
		    
		    /*
	         *  Change the 'd y' attribute to change the position in Y axis
	         *  of the text
	         */ 
		    nodeChildren.append("text")
		    	.attr("class", function(node){
		    		return "txtName " + node.name.replace(/ /g,'').replace('(', '').replace(')', '');
		    	})
		    	.attr("value", function(node){
		    		return node.value;
		    	})
		        .attr("dy", FIRST_NODE_NAME_MARGIN_TOP + "em")
		        .text(function(node) {
		        	return node.name; 
		        }).call(text);
		    
		    appendChildren(nodeChildren);	
		    
		    this.getChildNode = function(){
		    	return nodeChildren;
		    };
	    };
	    
	    /*
	     * This is in charge of the zoom transition of the node when a node is
	     * clicked 
	     */
		var transition = function(node) {			
			if (transitioning || !node){
				return;
			}else{
				transitioning = true;
			}

	    	var chartUpdate = updateChart(node);
	    	var grandpTransition = g1.transition()
	    							 .duration(ZOOM_TRANSITION_DURATION);
	        var parentTransition = chartUpdate.transition()
	        								  .duration(ZOOM_TRANSITION_DURATION)
	        								  .each("end", setFontSize);

		    // Update the domain only after entering new elements.
	    	x.domain([node.x, node.x + node.dx]);
		    y.domain([node.y, node.y + node.dy]);

		    // Enable anti-aliasing during the transition.
		    svg.style("shape-rendering", null);

		    // Draw child nodes on top of parent nodes.
		    svg.selectAll(".depth")
		    	.sort(function(a, b) {
		    		return a.depth - b.depth; 
		    	});

		    // Fade-in entering text.
		    chartUpdate.selectAll("text").style("fill-opacity", 0);

		    // Transition to the new view.
		    grandpTransition.selectAll("text").call(text).style("fill-opacity", 0);
		    parentTransition.selectAll("text").call(text).style("fill-opacity", 1);
		    //grandpTransition.selectAll("rect").call(rect);
		    parentTransition.selectAll(".depth .shown rect").call(rect);

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
	 *  D3 JSON reader. It is in charge of processing the chart and then
	 *  display it. This method is called once.
	 */ 
	d3.json("util/sample.json", function(root) {
		/*
		 *  The value property is not recognized as a propery of each node, so
		 *  that's why it has to be added here at the beggining. The default
		 *  properties that the json file must have are name and value 
		 */ 
		var childrenArray = Object.keys(root.children[0]); 
		childrenArray.splice(childrenArray.indexOf("children"), 1);
		childrenArray.push("value");
		tooltipProperties = childrenArray;
		propertiesToShow = ["color", "value"];
		
		initializeNode(root);
		accumulateNodeValue(root);
		calculateLayout(root);
		updateChart(root);
		setFontSize();
	});
})();