d3.svg.multiBrush = function() {
  //var event = d3.dispatch(brush, "brushstart", "brush", "brushend");
  var brushDispatcher = d3.dispatch(brush, "brushstart", "brush", "brushend");
  var extentCloseClassName = "multi-brush-extent-close";
  var x = null, // x-scale, optional
      y = null, // y-scale, optional
      xExtent = [0, 0], // [x0, x1] in integer pixels
      yExtent = [0, 0], // [y0, y1] in integer pixels
      //xExtentDomain, // x-extent in data space
      //yExtentDomain, // y-extent in data space
      xClamp = true, // whether to clamp the x-extent to the range
      yClamp = true, // whether to clamp the y-extent to the range
      resizes = d3_svg_brushResizes[0],
      extentIndex = 0,
      brushSelection,
      backgroundSelection;

  function brush(g) {
    g.each(function() {

      // Prepare the brush container for events.
      brushSelection = d3.select(this)
          .style("pointer-events", "all")
          .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)")
          .on("mousedown.brush", brushstart)
          .on("touchstart.brush", brushstart);

      // An invisible, mouseable area for starting a new brush.
      backgroundSelection = brushSelection.selectAll(".background")
          .data([{
            brush: this,
            extents: []
          }]);
      
      backgroundSelection.enter()
          .append("rect")
          .attr("class", "background")
          .style("visibility", "hidden")
          .style("cursor", "crosshair");

      // // The visible brush extent; style this as you like!
      // g.selectAll(".extent")
      //     .data([0])
      //   .enter().append("rect")
      //     .attr("class", "extent")
      //     .style("cursor", "move");

      // // More invisible rects for resizing the extent.
      // var resize = g.selectAll(".resize")
      //     .data(resizes, function(d) { return d;});

      // // Remove any superfluous resizers.
      // resize.exit().remove();

      // resize.enter().append("g")
      //     .attr("class", function(d) { return "resize " + d; })
      //     .style("cursor", function(d) { return d3_svg_brushCursor[d]; })
      //   .append("rect")
      //     .attr("x", function(d) { return /[ew]$/.test(d) ? -3 : null; })
      //     .attr("y", function(d) { return /^[ns]/.test(d) ? -3 : null; })
      //     .attr("width", 6)
      //     .attr("height", 6)
      //     .style("visibility", "hidden");

      // // Show or hide the resizers.
      // resize.style("display", brush.empty() ? "none" : null);

      // When called on a transition, use a transition to update.
      var gUpdate = d3.transition(brushSelection),
          backgroundUpdate = d3.transition(backgroundSelection),
          range;

      // Initialize the background to fill the defined range.
      // If the range isn't defined, you can post-process.
      if (x) {
        range = d3_scaleRange(x);
        backgroundUpdate.attr("x", range[0]).attr("width", range[1] - range[0]);
        //redrawX(gUpdate);
      }
      if (y) {
        range = d3_scaleRange(y);
        backgroundUpdate.attr("y", range[0]).attr("height", range[1] - range[0]);
        //redrawY(gUpdate);
      }
      //redraw(gUpdate);
    });
  }

  // brush.event = function(g) {
  //   g.each(function() {
  //     var event_ = event.of(this, arguments),
  //         extent1 = {x: xExtent, y: yExtent, i: xExtentDomain, j: yExtentDomain},
  //         extent0 = this.__chart__ || extent1;
  //     this.__chart__ = extent1;
  //     if (d3_transitionInheritId) {
  //       d3.select(this).transition()
  //           .each("start.brush", function() {
  //             xExtentDomain = extent0.i; // pre-transition state
  //             yExtentDomain = extent0.j;
  //             xExtent = extent0.x;
  //             yExtent = extent0.y;
  //             event_({type: "brushstart"});
  //           })
  //           .tween("brush:brush", function() {
  //             var xi = d3_interpolateArray(xExtent, extent1.x),
  //                 yi = d3_interpolateArray(yExtent, extent1.y);
  //             xExtentDomain = yExtentDomain = null; // transition state
  //             return function(t) {
  //               xExtent = extent1.x = xi(t);
  //               yExtent = extent1.y = yi(t);
  //               event_({type: "brush", mode: "resize"});
  //             };
  //           })
  //           .each("end.brush", function() {
  //             xExtentDomain = extent1.i; // post-transition state
  //             yExtentDomain = extent1.j;
  //             event_({type: "brush", mode: "resize"});
  //             event_({type: "brushend"});
  //           });
  //     } else {
  //       event_({type: "brushstart"});
  //       event_({type: "brush", mode: "resize"});
  //       event_({type: "brushend"});
  //     }
  //   });
  // };

  // function redraw(g) {
  //   //g.selectAll(".resize").attr("transform", function(d) {
  //   //  return "translate(" + xExtent[+/e$/.test(d)] + "," + yExtent[+/^s/.test(d)] + ")";
  //   //});
  // }

  // function redrawX(g) {
  //   //g.select(".extent").attr("x", xExtent[0]);
  //   //g.selectAll(".extent,.n>rect,.s>rect").attr("width", xExtent[1] - xExtent[0]);
  // }

  // function redrawY(g) {
  //   //console.log(yExtent);
  //   g.selectAll(".extent").attr("y", yExtent[0]);
  //   g.selectAll(".extent").attr("height", yExtent[1] - yExtent[0]);
  // }

  function brushstart() {
    var target = this,
        eventTarget = d3.select(d3.event.target),
        xExtent, yExtent,
        //event_ = event.of(target, arguments),
        g = d3.select(target),
        resizing = (/^(n|s)$/.test(eventTarget.datum()) || /^(e|w)$/.test(eventTarget.datum())) ? eventTarget.datum() : null,
        resizingX = !/^(n|s)$/.test(resizing) && x,
        resizingY = !/^(e|w)$/.test(resizing) && y,
        dragging = eventTarget.classed("extent"),
        newExtent = eventTarget.datum().brush !== null,
        //dragRestore = d3_event_dragSuppress(),
        center,
        origin = d3.mouse(target),
        offset,
        extentSelection;

    currentSelection = eventTarget;
    if(resizing || dragging) {
      extentSelection = d3.select(currentSelection.node().parentNode);
      g = d3.select(extentSelection.node().parentNode);

      xExtent = extentSelection.datum().xExtent;
      yExtent = extentSelection.datum().yExtent;
    }

    var w = d3.select(window)
        .on("keydown.brush", keydown)
        .on("keyup.brush", keyup);

    if (d3.event.changedTouches) {
      //WTF
      w.on("touchmove.brush", brushmove).on("touchend.brush", brushend);
    } else {
      w.on("mousemove.brush", brushmove).on("mouseup.brush", brushend);
    }

    // //WTF
    // // Interrupt the transition, if any.
    // g.interrupt().selectAll("*").interrupt();

    // // If the extent was clicked on, drag rather than brush;
    // // store the point between the mouse and extent origin instead.
    if (dragging) {
       origin[0] = xExtent[0] - origin[0];
       origin[1] = yExtent[0] - origin[1];
     }

    // // If a resizer was clicked on, record which side is to be resized.
    // // Also, set the origin to the opposite side.
    else if (resizing) {
        var ex = +/w$/.test(resizing),
            ey = +/^n/.test(resizing);
        offset = [xExtent[1 - ex] - origin[0], yExtent[1 - ey] - origin[1]];
        origin[0] = xExtent[ex];
        origin[1] = yExtent[ey];
    }

    // If the ALT key is down when starting a brush, the center is at the mouse.
    else if (newExtent) {
      if (d3.event.altKey) {
          center = origin.slice();
      }

      xExtent = [origin[0], origin[0]];
      yExtent = [origin[1], origin[1]];

      var extents = g.selectAll(".extent-container").data();
      extents.push({
          id: extentIndex++,
          xExtent: xExtent,
          yExtent: yExtent
      });

      extentSelection = updateExtents(g, extents);
    }

    // // Propagate the active cursor to the body for the drag duration.
    g.style("pointer-events", "none")
        .selectAll(".resize").style("display", null);
    // d3.select("body").style("cursor", eventTarget.style("cursor"));

    // // Notify listeners.
    brushDispatcher.brush({type: "brushstart"});
    
    brushmove();

    function updateExtents(g, extents) {

      var extentContainerSelection = g
          .selectAll(".extent-container")
          .data(extents, function(d) { return d.id; });

      var addedExtentContainerSelection = extentContainerSelection.enter()
          .append('svg:g')
          .attr("class", "extent-container");

      addedExtentContainerSelection.append('rect')
          .style("cursor", "move")
          .attr('class', 'extent')
          .attr("x", -8)
          .attr("width", 16)
          .on('mouseover', mouseover)
          .on('mouseout', mouseout);

      extentContainerSelection
          .exit().remove();

      var resizeSelection = addedExtentContainerSelection.selectAll(".resize")
          .data(resizes, function(d) { return d;});

      resizeSelection.enter()
          .append("rect")
          .attr("class", function(d) { return "resize " + d; })
          .style("cursor", function(d) { return d3_svg_brushCursor[d]; })
          .attr("x", function(d) { return /[ew]$/.test(d) ? -3 : -8; })
          .attr("y", function(d) { return /^[ns]/.test(d) ? -3 : -8; })
          .attr("width", 16)
          .attr("height", 6)
          .style("visibility", "hidden");

      return extentContainerSelection;
    }

    function keydown() {
      if (d3.event.keyCode == 32) {
        if (!dragging) {
          center = null;
          origin[0] -= xExtent[1];
          origin[1] -= yExtent[1];
          dragging = 2;
        }
        d3_eventPreventDefault();
      }
    }

    function keyup() {
      if (d3.event.keyCode == 32 && dragging == 2) {
        origin[0] += xExtent[1];
        origin[1] += yExtent[1];
        dragging = 0;
        d3_eventPreventDefault();
      }
    }

    function mouseover() {
      hideCloseButtonIfShown();

      showCloseButton(this);
    }

    function mouseout() {
      var target = d3.select(this);
      var relTarg = d3.event.relatedTarget || d3.event.toElement;

      if(relTarg.className.indexOf && relTarg.className.indexOf(extentCloseClassName) >= 0) {
        d3.select(relTarg)
            .on('mouseout', function() {
              hideCloseButtonIfShown();
            })
            .on('click', function() {
              var allExtents = g.selectAll(".extent-container").data();
              var extentToDelete = target.datum();
              if (allExtents) {
                for(var i = 0; i < allExtents.length; i++) {
                  if(allExtents[i] == extentToDelete) {
                    allExtents.splice(i, 1);

                    var updatedExtentSelection = updateExtents(g, allExtents);

                    //redrawExtentX(updatedExtentSelection);
                    redrawExtentY(updatedExtentSelection);

                    redrawResizers(updatedExtentSelection);

                    brushDispatcher.brush({type: "brush"});
                    break;
                  }
                }
              }

              hideCloseButtonIfShown();
            });
      } else {
        hideCloseButtonIfShown();
      }
    }

    function hideCloseButtonIfShown() {
      var extentCloseDiv = document.querySelector("." + extentCloseClassName);
      if(extentCloseDiv) {
        extentCloseDiv.remove();
      }
    }

    function showCloseButton(where) {
      var extentCloseDiv = document.createElement('div');
      extentCloseDiv.className = extentCloseClassName;

      var rect = where.getBoundingClientRect();
      extentCloseDiv.style.position = "absolute";
      extentCloseDiv.style.left = rect.left + rect.width + "px";
      extentCloseDiv.style.top = rect.top + "px";

      document.body.appendChild(extentCloseDiv);
    }

    function brushmove() {
      var point = d3.mouse(target),
          moved = false;
      // Preserve the offset for thick resizers.
      if (offset) {
        point[0] += offset[0];
        point[1] += offset[1];
      }

      if (!dragging) {

        // If needed, determine the center from the current extent.
        if (d3.event.altKey) {
          if (!center) center = [(xExtent[0] + xExtent[1]) / 2, (yExtent[0] + yExtent[1]) / 2];

          // Update the origin, for when the ALT key is released.
          origin[0] = xExtent[+(point[0] < center[0])];
          origin[1] = yExtent[+(point[1] < center[1])];
        }

        // When the ALT key is released, we clear the center.
        else center = null;
      }

      // Update the brush extent for each dimension.
      // TODO: why not to use x/yExtent instead of 0/1 
      if (resizingX && move1(point, x, 0)) {
        redrawExtentX(extentSelection);
        moved = true;
      }
      if (resizingY && move1(point, y, 1)) {
        redrawExtentY(extentSelection);
        moved = true;
      }

      // Final redraw and notify listeners.
      if (moved) {
        redrawResizers(extentSelection);
        brushDispatcher.brush({type: "brush", mode: dragging ? "move" : "resize"});
      }
    }

    function move1(point, scale, i) {
      var range = d3_scaleRange(scale),
          r0 = range[0],
          r1 = range[1],
          position = origin[i],
          extent = i ? yExtent : xExtent,
          size = extent[1] - extent[0],
          min,
          max;

      // When dragging, reduce the range by the extent size and position.
      if (dragging) {
        r0 -= position;
        r1 -= size + position;
      }

      // Clamp the point (unless clamp set to false) so that the extent fits within the range extent.
      min = (i ? yClamp : xClamp) ? Math.max(r0, Math.min(r1, point[i])) : point[i];
      
      // Compute the new extent bounds.
      if (dragging) {
        max = (min += position) + size;
      } else {

        // If the ALT key is pressed, then preserve the center of the extent.
        if (center) position = Math.max(r0, Math.min(r1, 2 * center[i] - min));

        // Compute the min and max of the position and point.
        if (position < min) {
          max = min;
          min = position;
        } else {
          max = position;
        }
      }

      // Update the stored bounds.
      if (extent[0] != min || extent[1] != max) {
        // if (i) yExtentDomain = null;
        // else xExtentDomain = null;
        extent[0] = min;
        extent[1] = max;
        return true;
      }
    }

    function brushend() {
      brushmove();
      
      var currentExtent = extentSelection.datum();
      var extentToDelete = [], extentToMerge = [];
      var allExtents = g.selectAll(".extent-container").data();
      if (allExtents) {
        var updatedExtents = [currentExtent];
        for (var i = 0; i < allExtents.length; i++) {
          if(currentExtent == allExtents[i] || (currentExtent.yExtent[0] <= allExtents[i].yExtent[0] && currentExtent.yExtent[1] >= allExtents[i].yExtent[1])) {
            
          } else if(currentExtent.yExtent[1] >= allExtents[i].yExtent[1] && currentExtent.yExtent[0] <= allExtents[i].yExtent[1]) {
            currentExtent.yExtent[0] = allExtents[i].yExtent[0];
          } else if(currentExtent.yExtent[0] <= allExtents[i].yExtent[0] && currentExtent.yExtent[1] >= allExtents[i].yExtent[0]) {
            currentExtent.yExtent[1] = allExtents[i].yExtent[1];
          } else {
            updatedExtents.push(allExtents[i]);
          }
        }

        var updatedExtentSelection = updateExtents(g, updatedExtents);

        //redrawExtentX(updatedExtentSelection);
        redrawExtentY(updatedExtentSelection);

        redrawResizers(updatedExtentSelection);
      }
      // reset the cursor styles
      //g.style("pointer-events", "all").selectAll(".resize").style("display", brush.empty() ? "none" : null);
      g.style("pointer-events", "all").selectAll(".resize").style("display", null);
      d3.select("body").style("cursor", null);

      w .on("mousemove.brush", null)
        .on("mouseup.brush", null)
        .on("touchmove.brush", null)
        .on("touchend.brush", null)
        .on("keydown.brush", null)
        .on("keyup.brush", null);

      //dragRestore();
      brushDispatcher.brushend({type: "brushend"});
    }
  }

  function redrawResizers(selection) {
    if(!selection.empty()) {
      selection.each(function(d) {
        var xExtent = d.xExtent,
            yExtent = d.yExtent;
        d3.select(this).selectAll(".resize").attr("transform", function(d) {
          return "translate(" + xExtent[+/e$/.test(d)] + "," + yExtent[+/^s/.test(d)] + ")";
        });
      });
    }
  }

  function redrawExtentX(selection) {
    //selection.attr("x", xExtent[0]);
    //g.selectAll(".extent,.n>rect,.s>rect").attr("width", xExtent[1] - xExtent[0]);
  }

  function redrawExtentY(selection) {
    selection.select('rect')
        .attr("y", function(d) { return d.yExtent[0]; });
    selection.select('rect')
        .attr("height", function(d) { return d.yExtent[1] - d.yExtent[0]; });
  }

  brush.x = function(z) {
    if (!arguments.length) return x;
    x = z;
    resizes = d3_svg_brushResizes[!x << 1 | !y]; // fore!
    return brush;
  };

  brush.y = function(z) {
    if (!arguments.length) return y;
    y = z;
    resizes = d3_svg_brushResizes[!x << 1 | !y]; // fore!
    return brush;
  };

  brush.clamp = function(z) {
    if (!arguments.length) return x && y ? [xClamp, yClamp] : x ? xClamp : y ? yClamp : null;
    if (x && y) xClamp = !!z[0], yClamp = !!z[1];
    else if (x) xClamp = !!z;
    else if (y) yClamp = !!z;
    return brush;
  };

  brush.extent = function(z) {
    //var x0, x1, y0, y1, t;
    var result = [];
    brushSelection.selectAll(".extent")
        .each(function(d) {
          if(y) {

            if(y.invert) {
              y0 = y.invert(d.yExtent[0]);
              y1 = y.invert(d.yExtent[1]);
            }

            if(y0 > y1) {
              result.push([y1, y0]);
            } else {
              result.push([y0, y1]);
            }
          }
        });
    return result;
    // Invert the pixel extent to data-space.
    // if (!arguments.length) {
    //   if (x) {
    //     if (xExtentDomain) {
    //       x0 = xExtentDomain[0], x1 = xExtentDomain[1];
    //     } else {
    //       x0 = xExtent[0], x1 = xExtent[1];
    //       if (x.invert) x0 = x.invert(x0), x1 = x.invert(x1);
    //       if (x1 < x0) t = x0, x0 = x1, x1 = t;
    //     }
    //   }
    //   if (y) {
    //     if (yExtentDomain) {
    //       y0 = yExtentDomain[0], y1 = yExtentDomain[1];
    //     } else {
    //       y0 = yExtent[0], y1 = yExtent[1];
    //       if (y.invert) y0 = y.invert(y0), y1 = y.invert(y1);
    //       if (y1 < y0) t = y0, y0 = y1, y1 = t;
    //     }
    //   }
    //   return x && y ? [[x0, y0], [x1, y1]] : x ? [x0, x1] : y && [y0, y1];
    // }

    // // Scale the data-space extent to pixels.
    // if (x) {
    //   x0 = z[0], x1 = z[1];
    //   if (y) x0 = x0[0], x1 = x1[0];
    //   xExtentDomain = [x0, x1];
    //   if (x.invert) x0 = x(x0), x1 = x(x1);
    //   if (x1 < x0) t = x0, x0 = x1, x1 = t;
    //   if (x0 != xExtent[0] || x1 != xExtent[1]) xExtent = [x0, x1]; // copy-on-write
    // }
    // if (y) {
    //   y0 = z[0], y1 = z[1];
    //   if (x) y0 = y0[1], y1 = y1[1];
    //   yExtentDomain = [y0, y1];
    //   if (y.invert) y0 = y(y0), y1 = y(y1);
    //   if (y1 < y0) t = y0, y0 = y1, y1 = t;
    //   if (y0 != yExtent[0] || y1 != yExtent[1]) yExtent = [y0, y1]; // copy-on-write
    // }

    // return brush;
  };

  brush.clear = function() {
    if (!brush.empty()) {
      xExtent = [0, 0], yExtent = [0, 0]; // copy-on-write
      xExtentDomain = yExtentDomain = null;
    }
    return brush;
  };

  brush.empty = function() {
    return brushSelection.selectAll(".extent").size() === 0;
    // return !!x && xExtent[0] == xExtent[1]
    //     || !!y && yExtent[0] == yExtent[1];
  };

  function d3_scaleExtent(domain) {
	  var start = domain[0], stop = domain[domain.length - 1];
	  return start < stop ? [ start, stop ] : [ stop, start ];
	}
	function d3_scaleRange(scale) {
	  return scale.rangeExtent ? scale.rangeExtent() : d3_scaleExtent(scale.range());
	}

  return d3.rebind(brush, brushDispatcher, "on");
};

var d3_svg_brushCursor = {
  n: "ns-resize",
  e: "ew-resize",
  s: "ns-resize",
  w: "ew-resize",
  nw: "nwse-resize",
  ne: "nesw-resize",
  se: "nwse-resize",
  sw: "nesw-resize"
};

var d3_svg_brushResizes = [
  ["n", "e", "s", "w", "nw", "ne", "se", "sw"],
  ["e", "w"],
  ["n", "s"],
  []
];