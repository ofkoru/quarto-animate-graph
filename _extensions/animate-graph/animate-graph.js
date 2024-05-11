window.RevealAnimategraph = function () {
  return {
    id: "RevealAnimategraph",
            init: function(deck) {
            // TODO: Implement your plugin functionality
            initAnimateGraph(deck);

        },
  };
};



if(typeof animateGraphData !=='object'){
  var animateGraphData = [];
}
var animateGraphObj = [];



function initAnimateGraph(Reveal) {}



// get size of an DOM element
// useful for katexRender
function getElementSize(element) {
    let width = element.node().getBoundingClientRect().width / Reveal.getScale();
    let height = element.node().getBoundingClientRect().height / Reveal.getScale();
    element.node().querySelectorAll("*").forEach(d => {
        if (d.getBoundingClientRect().width > 0) {
            height = Math.max(height, d.getBoundingClientRect().height / Reveal.getScale())
        }
        if (d.getBoundingClientRect().height > 0) {
            width = Math.max(width, d.getBoundingClientRect().width / Reveal.getScale())
        }
    })
    return {
        width: width,
        height: height
    }
}

function katexRender(string) {
  // render math expressions in STRING inputs using katex
    if (typeof katex !== 'undefined') { // check whether Katex is loaded
        if (string === undefined) {
            return '<span class="katexRender"> No Label! </span>'
        } else {
            let matches = string.match(/\$(.*?)\$/);
            var katexLabel;

            while (matches !== null) {
                katexLabel = katex.renderToString(matches[1], {
                    displayMode: false
                });
                string = string.replace(matches[0], katexLabel);
                matches = string.match(/\$(.*?)\$/);
            }
        }
    }
    return ('<span class="katexRender" >' + string + '</span>')
}

// parse style a:b; x:y to {a:b, x:y}
function parseStyle(style) {
    let output = {};
    style = style.trim();
    style = style.split(/[;,]+/);
    style.forEach(s => {
        let parts = s.split(':');
        if (parts.length === 2) {
            parts[1] = parts[1].trim();
            if (/^\d+$/.test(parts[1])) {
                output[parts[0].trim()] = Number.isInteger(parts[1]) ? parseInt(parts[1]) : parseFloat(parts[1]);
            } else {
                output[parts[0].trim()] = parts[1];
            }
        }
    })
    return output;
}

// default values

var possibleTypes = ["line", "point", "area", "text", "tick"];

var defaultVals = {
    graph: {
        margin: 0.1,
        width: 400,
        height: 400,
        ylimit: [0, 10],
        xlimit: [0, 10],
        legend: "false",
        ticks: "false"
    },
    line: {
        strokeWidth: 3,
        stroke: "steelblue",
        dasharray: 0,
        legend: "false",
        duration: 2000,
        fill: "none"
    },
    point: {
        r: 5,
        fill: "red",
        color: "red",
        duration: 2000
    },
    area: {
        stroke: "none",
        opacity: 0.3,
        duration: 2000,
        rangeX: "intersection, left"
    },
    text: {
        duration: 2000,
        anchorX: "middle",
        anchorY: "middle",
        vertical: "false"
    },
    tick: {
        stroke: "black",
        duration: 2000
    }
}

var svgtypeList = {
    line: "path",
    point: "circle",
    area: "path",
    text: "g",
    tick: "g"
};

var colorPalette = {
    line: ["steelblue", "orange", "purple", "crimson"],
    point: ["red", "pink", "violet"],
    area: ["lightblue", "lightgray", "lightgreen"],
    text: ["black"],
    tick: ["black"]
};



// conversion of some attribute names
function paramsConversion(params) {
    params.stroke = params.color !== undefined ? params.color : params.stroke;
    params.strokeWidth = params.width !== undefined ? params.width : params.strokeWidth;
    params.strokeDasharray = params.dasharray !== undefined ? params.dasharray : params.strokeDasharray;
    if (params.type == "point" | params.type == "area") {
        params.fill = params.color !== undefined ? params.color : params.fill;
        params.r = params.size !== undefined ? params.size : params.r;
    }
}

// setting default values
function setDefaultValues(params) {
    paramsConversion(params);
    for (key in defaultVals[params.type]) {
        if (params[key] === undefined) {
            params[key] = defaultVals[params.type][key];
        }
    }
}


// finding the slide id of a DOM element
function findSlideId(element) {
    var ind = false;
    var parent = element.parentNode;
    while (!ind) {
        if (parent.tagName == "SECTION") {
            ind = true;
        } else {
            parent = parent.parentNode;
        }
    }
    return (parent.id)
}

// convert dash-separated strings to camel case for-example becomes forExample.
function convertToCamelCase(inputString) {
    return inputString.split('-')
        .map((word, index) => index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

// convert from camel case to dash-separated: from camelCase to camel-case
function camelToDash(inputString) {
    // Use regular expression to insert a dash before all uppercase letters
    return inputString.replace(/([A-Z])/g, "-$1").toLowerCase();
}

// convert attributes to data-attributes
function convertAttributesToData(element) {
    var out = JSON.parse(JSON.stringify(element.dataset));
    // Iterate over the attributes of the element
    for (let i = element.attributes.length - 1; i >= 0; i--) {
        let attr = element.attributes[i];
        // Skip class and id attributes
        if (attr.name === 'class' || Object.keys(out).includes(attr.name)) {
            continue;
        }
        // Check if the attribute name doesn't start with 'data-'
        if (!attr.name.startsWith('data-')) {
            // If not, convert it to a 'data-' attribute
            var name = convertToCamelCase(attr.name);
            out[name] = attr.value;
            // Remove the original attribute
            //element.removeAttribute(attr.name);
        }
    }
    out.style = element.getAttribute("style") === null ? undefined : element.getAttribute("style");
    return (out)
}


// find intersection of two lines definde over the same x variable Y0(X)=Y1(X)
function findIntersection(df, varX, varY0, varY1) {
    let i = 0;
    let ret = {};

    if (df[0][varY0] != df[0][varY1]) {
        for (i = 0; i < df.length; i++) {
            if ((df[i][varY0] - df[i][varY1]) * (df[0][varY0] - df[0][varY1]) < 0) {
                break;
            }
        }
        if (i == df.length) {
            console.log("No intersection of " + varX + " " + varY0 + " " + varY1 + "!");
            return ret;
        }
        // Take i and i-1, and do a linear interpolation
        let b0 = (df[i - 1][varY0] * df[i][varX] - df[i][varY0] * df[i - 1][varX]) / (df[i][varX] - df[i - 1][varX]);
        let b1 = (df[i - 1][varY1] * df[i][varX] - df[i][varY1] * df[i - 1][varX]) / (df[i][varX] - df[i - 1][varX]);
        let a0 = (df[i][varY0] - b0) / df[i][varX];
        let a1 = (df[i][varY1] - b1) / df[i][varX];
        // Calculate the intersection point using linear interpolation
        ret.y = (b0 * a1 - b1 * a0) / (a1 - a0);
        ret.x = (ret.y - b0) / a0;

    } else {
        ret = {
            x: df[0][varX],
            y: df[0][varY0]
        };
    }

    return ret;
}


// random id generator
function randomIdGenerate(length = 7) {
    let temp = "a" + window.crypto.randomUUID().substr(0, length);
    while (document.getElementById(temp) !== null) {
        temp = "a" + window.crypto.randomUUID().substr(0, length);
    }
    return (temp)
}


/////////////////////////////////////////////////////////////////////////////
/////////////////// CLASS ////////////////// //////////////////////
/////////////////////////////////////////////////////////////////////////////  



class AnimateGraph {
    constructor(params) {

        // create legend
        this.legend = {};
        this.title = {};
        this.legend.rightPos = 0;
        // is legend added to graph?
        this.legend.addLegend = params.legend;

        // create svg

        var svgContainer = d3.select(params.selector).append("div")
            .attr("class", "animate-graph-svg-container");

        var svgDom = document.querySelector(params.selector);
        // get height of the parent div
        params.height = svgDom.offsetHeight;
        params.width = svgDom.offsetWidth;
        // get params.width of the parent div
        if (params.width == 0) {
            defaultVals.graph.width = 400
        };
        if (params.height == 0) {
            defaultVals.graph.height = 400
        };
        // legend height is 7% of the parent div
        this.legend.height = params.legend == "true" ? params.height * 0.07 : 0;

        // add title
        if (params.title !== undefined) { // if title is not empty, then add it
            let katexLabel = katexRender(params.title);
            this.title.p = svgContainer.append("div")
                .attr("class", "animategraph-title").html(katexLabel)
            this.title.height = getElementSize(this.title.p).height;

        } else {
            this.title.height = 0;
        }
        params.titleHeight = this.title.height;
        params.height = params.height - this.legend.height - this.title.height;


        this.svg = d3.select(params.selector + " .animate-graph-svg-container")
            .append("svg")
            .attr("preserveAspectRatio", "xMinYMin meet")
            .classed("svg-content", true);
        this.svg.attr("viewBox", "0 0 " + params.width + " " + params.height).attr("width", params.width + "px").attr("height", params.height + "px")
            .style("top", this.title.height + "px");
        this.svg.attr("id", params.id + "_svg");


        this.axes = {};
        var axis = {};
        ["x", "y"].forEach(z => {
            var coef = z == "x" ? 1 : 0;
            var side = z == "x" ? "Bottom" : "Left";
            var axis = {};
            var Zcap = z.toUpperCase();
            axis["var" + z] = params["var" + z];
            if (params["range" + Zcap] !== undefined) {
                var limits = params["range" + Zcap].trim().replace(/^([^\d.]?)(.*?)?([^\d])$/, '$2').split(/[,;]/);
                axis.domain = [parseFloat(limits[0]), parseFloat(limits[1])];
            } else {
                axis.domain = d3.extent(animateGraphData[params.dfLabel], function(d) {
                    return +d[params["var" + Zcap]];
                });
                axis.domain[0] -= Math.abs(axis.domain[0]) * 0.1;
                axis.domain[1] += Math.abs(axis.domain[1]) * 0.1;
            }

            // render axis label using katex
            if (params["label" + z.toUpperCase()] === undefined) {
                params["label" + z.toUpperCase()] = "";
            }
            var katexLabel = katexRender(params["label" + z.toUpperCase()]);
            // enclose with a span to center label
            katexLabel = `<span style="display:flex; justify-content:center;"> ${katexLabel} </span>`;
            // append label as foreign object
            axis.label = this.svg.append("foreignObject").attr("class", z + "lab")
                .attr("x", -params.height * (1 - coef))
                .attr("y", 0) // position
                .attr("height", "50px").attr("width", params.width * coef + (1 - coef) * params.height) // size
                .style('-webkit-transform', 'rotate(' + (1 - coef) * 270 + 'deg)').html(katexLabel); // rotate y label
            axis.labelSize = getElementSize(axis.label.select("span")); // get size           
            axis.label.attr("height", axis.labelSize.height * coef + axis.labelSize.width * (1 - coef)); // update height
            axis.label.attr("y", (1 - coef) * params.width * params.margin + coef * (params.height * (1 - params.margin)));
            this.axes[z] = axis;

        })
        var a = ["x", "y"];
        a.forEach(z => {
            var coef = z == "x" ? 1 : 0;
            var side = z == "x" ? "Bottom" : "Left";
            var zNeg = z == "x" ? "y" : "x";
            axis = this.axes[z];
            axis.map = d3.scaleLinear().domain(d3.extent(axis.domain))
                .range([(1 - coef) * params.height * (1 - params.margin) - this.axes.x.labelSize.height * (1 - coef) +
                    coef * (params.width * params.margin + this.axes.y.labelSize.width * 2),
                    coef * params.width * (1 - params.margin) + (1 - coef) * params.height * params.margin
                ]);
            axis.line = this.svg.append("g").attr("class", "axis" + z.toUpperCase())
                .call(d3["axis" + side](axis.map));
        })
        a.forEach(z => {
            var coef = z == "x" ? 1 : 0;
            var side = z == "x" ? "Bottom" : "Left";
            var zNeg = z == "x" ? "y" : "x";
            axis = this.axes[z];

            axis.label.select("span").style("margin-left", coef * (params.width * params.margin + this.axes.y.labelSize.width * 2) +
                (1 - coef) * (params.height * params.margin + this.axes.x.labelSize.height) + "px");
            axis.label.select("span").style("width", coef * (params.width * (1 - params.margin * 2) - this.axes.y.labelSize.width * 2) +
                (1 - coef) * (params.height * (1 - params.margin * 2) - this.axes.x.labelSize.height) + "px");
            if (0 <= this.axes[zNeg].domain[0] | 0 > this.axes[zNeg].domain[1]) {
                axis.line.attr("transform", "translate(" + (1 - coef) * (this.axes.y.labelSize.width * 2 + params.width * params.margin) + ", " + coef * (params.height * (1 - params.margin) - this.axes.x.labelSize.height) + ")")
            } else {
                axis.line.attr("transform", "translate(" + (1 - coef) * this.axes.x.map(0) + ", " + coef * this.axes.y.map(0) + ")")
            }
            this.axes[z] = axis;
        })



        // legend
        if (params.legend == "true") {
            this.legend.svg = d3.select(params.selector + " .animate-graph-svg-container").append("div").classed("legend animategraph", true).style("height", this.legend.height + "px").style("width", params.width * (1 - params.margin * 2) + "px").style("margin-left", params.width * params.margin + "px").append("svg")
                  .attr("width", "100%").attr("height", "100%");
            this.legend.elemWidth = Math.min(params.width * (1 - params.margin * 2) / 8, 100);
            this.legend.cumPos = 0;
            this.legend.dx = this.legend.elemWidth * 0.2;
            this.legend.svg.attr("")

        }



        this.elements = {};
        this.params = params;
        this.counter = {}
        possibleTypes.forEach(t => this.counter[t] = 0)
        this.id = params.id;
        //this.attributes = [];

    }


}



AnimateGraph.prototype.setAttributes = function(params) {

    var obj = this.elements[params.id];
    paramsConversion(params);




    for (key in params) {
        if (["varX", "varY", "id", "slideid", "style"].includes(key)) {
            continue;
        }
        obj.svg.attr(camelToDash(key), params[key]);
    }
    if (params.style !== undefined) {
        this.setStyle(params);
    }

}



AnimateGraph.prototype.setStyle = function(params) {
    var obj = this.elements[params.id];

    let style = parseStyle(params.style);
    for (key in style) {
        obj.svg.style(key, style[key]);
    }
    //obj.styles.push( obj.svg.attr("style") );
}

function addFragment(obj, params) {
    if (params.index >= 0) {
        obj.classed("fragment", true);
        obj.attr("data-fragment-index", params.index)
    }
    if (params.indexOut >= 0) {
        if (params.index >= 0) {
            g = d3.select(obj.node().parentNode).append("g");
            g.classed("fragment fade-out", true);
            g.attr("data-fragment-index", params.indexOut);
            g.node().appendChild(obj.node());
        } else {
            obj.classed("fragment fade-out", true);
            obj.attr("data-fragment-index", params.indexOut)
        }
    }
}


AnimateGraph.prototype.move = function(params) {

    if (params.duration === undefined) {
        params.duration = 2000;
    }
    var obj = this.elements[params.id];
    if (params.df !== undefined) {
        var df;
        try {
            df = JSON.parse(params.df)
        } catch (e) {
            try {
                df = [...params.df]
                df.forEach(row => {
                    for (key in row) {
                        if (key === params.varX || key === params.varY || key === params.varY0 || key === params.varY1) {
                            if (!isNaN(row[key]) && typeof row[key] !== 'number') {
                                row[key] = parseFloat(row[key]);
                            }
                        } else {
                            delete row[key];
                        }

                    }
                })
            } catch (e) {
                df = [...animateGraphData[params.dfLabel]];

            }
        }


    } else {
        df = [...animateGraphData[params.dfLabel]];
    }

    if (obj.type == "line") {
        var varXval = params.varX.split(/[;,\s]/).filter(s => {
            return s != ''
        });
        var varYval = params.varY.split(/[;,\s]/).filter(s => {
            return s != ''
        });

        if (!isNaN(varXval[0]) & varXval.length == 1) {
            df.forEach(i => i.varX = parseFloat(varXval[0]));
            params.varX = "varX";
        } else if (!isNaN(varYval[0]) & varYval.length == 1) {
            df.forEach(i => i.varY = parseFloat(varYval[0]));
            params.varY = "varY";
        } else if (varXval.length > 1) {
            if (!isNaN(varXval[0]) & !isNaN(varXval[1]) & !isNaN(varYval[0]) & !isNaN(varYval[1])) {
                df = [{
                        varX: parseFloat(varXval[0]),
                        varY: parseFloat(varYval[0])
                    },
                    {
                        varX: parseFloat(varXval[1]),
                        varY: parseFloat(varYval[1])
                    }
                ];
                params.varX = "varX";
                params.varY = "varY";
            }
        }


        df.sort((a, b) => a[params.varX] - b[params.varX]);
        obj.svg.transition().duration(params.duration).attr("d", d3.line()
            .x((d) => this.axes.x.map(+d[params.varX]))
            .y((d) => this.axes.y.map(+d[params.varY]))
            .defined((d) => Number.isFinite(+d[params.varY]) &&
                +d[params.varY] >= this.axes.y.domain[0] && +d[params.varY] <= this.axes.y.domain[1] &&
                +d[params.varX] >= this.axes.x.domain[0] && +d[params.varX] <= this.axes.x.domain[1] &&
                Number.isFinite(d[params.varX]))(df) // Omit empty values.
        )
    } else if (obj.type == "point") {
        if (isNaN(params.varX)) {
          if (params.varY !== undefined) {
            let varY = params.varY.split(/[;,\s]/).filter(d => d != '');
            if (varY.length>1) {
                let sol = findIntersection(df, params.varX, varY[0], varY[1]);
                params.varX = sol.x;
                params.varY = sol.y;
            }
          }
        }

        obj.svg
            .transition().duration(params.duration)
            .attr('cx', this.axes.x.map(params.varX))
            .attr('cy', this.axes.y.map(params.varY));

        if (obj.lines == "true" & params.lines != "false") {
            for (coef = 0; coef < 2; coef++) {
                var z = coef == 1 ? "x" : "y"
                var paramsline = {
                    color: "black",
                    dasharray: 3,
                    id: params.id + z + "line",
                    varX: 'x',
                    varY: 'y',
                    type: 'line',
                    showlegend: 'false',
                    duration: params.duration
                };
                paramsline.df = [{
                    x: this.axes.x.domain[0] * (1 - coef) + coef * params.varX,
                    y: coef * this.axes.y.domain[0] + (1 - coef) * params.varY
                }, {
                    x: params.varX,
                    y: params.varY
                }];
                this.move(paramsline);
            }
        }

    } else if (obj.type == "area") {

        if (params.varY !== undefined) {
            let varY = params.varY.split(/[;,\s]/).filter(d => d != '');

            params.varY0 = varY[0];
            if (varY.length > 1) params.varY1 = varY[1];
        }

        if (!isNaN(params.varY0)) {
            df.forEach(i => i.varY0 = parseFloat(params.varY0));
            params.varY0 = "varY0";
        }
        if (!isNaN(params.varY1)) {
            df.forEach(i => i.varY1 = parseFloat(params.varY1));
            params.varY1 = "varY1";
        }
        if (params.rangeX !== "full") {
            var x1 = this.axes.x.domain[0];
            let range = params.rangeX.split(/[,;\s]/).filter(s => s != '');
            if (range.length == 1) range[1] = "left";
            var x0 = this.axes.x.domain[1];
            if (range[0].trim() == "intersection") {
                var sol = findIntersection(df, params.varX, params.varY0, params.varY1);
                var soltemp = {};
                if (Object.keys(sol).length != 0) {
                    soltemp[params.varX] = sol.x;
                    soltemp[params.varY0] = sol.y;
                    soltemp[params.varY1] = sol.y;
                    df.push(soltemp);
                    x0 = sol.x;
                } else {
                    x0 = df[df.length - 1][params.varX];
                    
                }
            } else if (!isNaN(range[0])) {
                x0 = parseFloat(range[0]);
            }
            if (range[1].trim() == "left") {
                df = df.filter(s => s[params.varX] <= x0);
            } else if (range[1].trim() == "right") {
                df = df.filter(s => s[params.varX] >= x0);
            } else if (!isNaN(range[1])) {
                let x1 = parseFloat(range[1]);
                range = d3.extent([x0, x1]);
                df = df.filter(s => s[params.varX] >= range[0] && s[params.varX] <= range[1]);
            }


        }

        df.sort((a, b) => a[params.varX] - b[params.varX]);
        if (params.varY0 !== undefined) {

            obj.svg.transition().duration(params.duration)
                .attr("d", d3.area()
                    .x((d) => this.axes.x.map(+d[params.varX]))
                    .y0((d) => this.axes.y.map(+d[params.varY0]))
                    .y1((d) => this.axes.y.map(+d[params.varY1]))(df)
                )
        } else {
            obj.svg.transition().duration(params.duration)
                .attr("d", d3.area()
                    .x0((d) => this.axes.x.map(+d[params.varX0]))
                    .x1((d) => this.axes.x.map(+d[params.varX1]))
                    .y((d) => this.axes.y.map(+d[params.varY]))(df)
                )
        }
        //// AREA ENDSS HERE
    } else if (params.type == "text") {
        /// TEXT
        let ancX = 1 / 2;
        if (params.anchorX == "left") {
            ancX = 0;
        } else if (params.anchorX == "right") {
            ancX = 1;
        }
        let ancY = 1 / 2;
        if (params.anchorY == "top") {
            ancY = 0;
        } else if (params.anchorY == "bottom") {
            ancY = 1;
        }
        var katexLabel = katexRender(params.text);
        if (obj.svg.select("foreignObject").empty()) {
            var annotate = obj.svg.append("foreignObject").attr("class", "animategraph text")
                .attr("height", "500px").attr("width", "500px").html(katexLabel);
        } else {
            var annotate = obj.svg.select("foreignObject")
                .attr("height", "500px").attr("width", "500px").html(katexLabel);
        }
        var size = getElementSize(annotate.select(".katexRender"));
        let vertical = params.vertical=="true" ? 1 : 0;
        let posX = this.axes.x.map(params.varX) - size.width * ancX;
        let posY = this.axes.y.map(params.varY) -size.height * ancY ;
        annotate.attr("height", ((size.height*(1-vertical)+size.width*vertical) * 1.01) + "px").attr("width",  ((size.height*(vertical)+size.width*(1-vertical) )* 1.01) + "px")
        annotate
            .style("transform", "rotate(" + (270*vertical) + "deg)")
            .attr("x", posX*(1-vertical) + (-posY-(2-ancX)*size.width)*vertical  )
            .attr("y", posY*(1-vertical) + posX*vertical  );
        if (params.style !== undefined) {
            this.setStyle(params);
        }
    }
}


AnimateGraph.prototype.addLegend = function(params) {

    params.label = params.label === undefined ? params.id : params.label;

    var leg = this.legend.svg.append("g").attr("class", "legenditem animategraph");
    leg.append("rect").attr("width", this.legend.elemWidth).attr("height", this.legend.height / 2)
        .attr("x", this.legend.cumPos + this.legend.dx).attr("y", this.legend.height / 4).attr("fill", params.color);
    this.legend.curPos += this.legend.elemWidth;
    var katexLabel = katexRender(params.label);
    katexLabel = leg.append("foreignObject").attr("class", "legendlabel animategraph")
        .attr("height", this.legend.height).attr("width", 200).html(katexLabel);

    var size = getElementSize(katexLabel.select("span"));
    katexLabel.select("span").style("height", this.legend.height).style("line-height", this.legend.height + "px")

    katexLabel.attr("height", Math.max(this.legend.height, size.height * 1.1)).attr("width", size.width * 1.1)
        .attr("x", this.legend.cumPos + this.legend.elemWidth + this.legend.dx * 2);


    this.legend.cumPos += (this.legend.dx * 3 + this.legend.elemWidth + size.width);

    if (params.index >= 0) {
        leg.classed("fragment", true);
        leg.attr("data-fragment-index", params.index);
    }

}


AnimateGraph.prototype.addElement = function(params) {

    let svgtype = svgtypeList[params.type];

    setDefaultValues(params);

    this.elements[params.id] = {};
    var obj = this.elements[params.id];
    obj.type = params.type;
    obj.options = [];
    //obj.attributes = [];
    obj.clone = 0;

    obj.svg = this.svg.append(svgtype)
        .attr("fill", params.fill)
        .attr("id", this.svg.attr('id') + '_' + params.type + '_' + params.id)
        .attr("class", "animategraph " + params.type);
    addFragment(obj.svg, params);

    //obj.attributes.push(params);
    this.setAttributes(params);
    obj.options.push(params);
    params.duration = 0;
    this.move(params);
    if (this.legend.addLegend == "true" & params.showlegend != "false" & params.type == "line") {
        this.addLegend(params);
    }
    if (params.type == "point" & params.lines == "true") {
        obj.lines = "true";
        for (coef = 0; coef < 2; coef++) {
            var z = coef == 1 ? "x" : "y"
            var paramsline = {
                color: "black",
                dasharray: 3,
                id: params.id + z + "line",
                varX: 'x',
                varY: 'y',
                type: 'line',
                showlegend: 'false',
                index: params.index,
                indexOut: params.indexOut
            };
            paramsline.df = [{
                x: this.axes.x.domain[0] * (1 - coef) + coef * params.varX,
                y: coef * this.axes.y.domain[0] + (1 - coef) * params.varY
            }, {
                x: params.varX,
                y: params.varY
            }];

            this.addElement(paramsline);
            addFragment(this.elements[params.id + z + "line"].svg, paramsline);
        }
    }
    if (params.type == "point" & params.tickX !== undefined) {
        this.addTicks({
            values: params.varX,
            labels: params.tickX,
            axis: 'x',
            index: params.index,
            indexOut: params.indexOut
        })
    }
    if (params.type == "point" & params.tickY !== undefined) {
        this.addTicks({
            values: params.varY,
            labels: params.tickX,
            axis: 'y',
            index: params.index,
            indexOut: params.indexOut
        })
    }

    this.counter[params.type] += 1;
}

AnimateGraph.prototype.addTicks = function(params) {


    let axes = ["x", "y"];
    let mainid = params.id;
    for (coef = 0; coef < 2; coef++) {
        let z = coef == 1 ? "x" : "y";
        if (params["var" + z.toUpperCase()] !== undefined) {

            let values = params["var" + z.toUpperCase()].split(/[;,]+/);
            let labels = params["label" + z.toUpperCase()].split(/[;,]+/);
            for (i = 0; i < values.length; i++) {
                params.id = mainid + "_" + z + "_" + i;
                this.elements[params.id] = {};
                obj = this.elements[params.id];
                let katexLabel = katexRender(labels[i]);
                let tick = this.axes[z].line.append("g").classed("animategraph tick", true);
                tick.label = tick.append("foreignObject").attr("class", "tick animategraph")
                    .attr("height", "50px").attr("width", "50px").html(katexLabel);
                let size = getElementSize(tick.label.select("span"));
                tick.label.attr("height", size.height * 1.2 + "px").attr("width", size.width * 1.2)
                    .attr("transform",
                        "translate(" + (coef * (this.axes[z].map(values[i]) - size.width / 2) - (1 - coef) * (size.width * 1.2 + 6)) + ", " + (1 - coef) * (this.axes[z].map(values[i]) - size.height / 2) + coef * 6 + ")");
                tick.line = tick.append("line").attr("x2", -6 * (1 - coef)).attr("y2", 6 * coef).attr("transform",
                    "translate(" + (coef * (this.axes[z].map(values[i]))) + ", " +
                    (1 - coef) * (this.axes[z].map(values[i])) + ")").attr("stroke", "black");
                addFragment(tick, params);
                obj.svg = tick;
                if (params.style !== undefined) {
                    this.setStyle(params);
                }
                obj.options = [];
                obj.options.push({
                    value: values[i],
                    label: labels[i],
                    axis: z
                });

            }
        }
    }




}




Reveal.on('ready', function() {

    // generate graphs

    document.querySelectorAll("section").forEach(d => d.style.display = "block");

    

    document.querySelectorAll("div.animategraph").forEach(d => {

        if (d.id === '') {
            d.id = "graph" + randomIdGenerate();
        }
        

        if (d.dataset.df !== undefined) {
            if (d.dataset.dfLabel === undefined) {
                d.dataset.dfLabel = d.id;
            }
            if (animateGraphData[d.dataset.dfLabel] !== undefined) {
                console.log("Dataset " + d.dataset.dfLabel + " defined multiple times!");
            } else {
                animateGraphData[d.dataset.dfLabel] = JSON.parse(d.dataset.df);
            }
            delete d.dataset.df;
        }

        var params = convertAttributesToData(d);
        params.slideid = findSlideId(d);
        params.selector = "#" + params.slideid + " .animategraph#" + params.id;
        for (key in defaultVals.graph) {
            if (params[key] === undefined) {
                params[key] = defaultVals.graph[key];
            }
        }
        //params.addValueLines = d.matches(":scope:has([type='point'][data-lines])");
        if (params.dfLabel === undefined) {
            let dflabel = d.querySelector(".addElement[type='line'][data-df-label]");
            if (dflabel === null) {
                params.dfLabel = "econ";
                params.varX = "quantity";
                params.varY = "supply";
            } else {
                params.dfLabel = d.querySelector(".addElement[type='line'][data-df-label]").dataset.dfLabel;
            }
            d.dataset.dfLabel = params.dfLabel;
        }
        // if varX and varY is not defined
        if (params.varX === undefined) {
            let temp = d.querySelector(".addElement[type='line'][data-var-x]");
            params.varX = temp !== null ? temp.dataset.varX : Object.keys(animateGraphData[params.dfLabel][0])[0];
        }
        if (params.varY === undefined) {
            let temp = d.querySelector(".addElement[type='line'][data-var-y]");
            if (temp === null) {
                if (Object.keys(animateGraphData[params.dfLabel][0]).length > 1) {
                    params.varY = Object.keys(animateGraphData[params.dfLabel][0])[0];
                } else {
                    params.varY = Object.keys(animateGraphData[params.dfLabel][0])[0];
                }
            } else {
                params.varY = temp.dataset.varY;
            }
        }



        animateGraphObj.push(new AnimateGraph(params));
        if (d.dataset.ticks == "false") {
            animateGraphObj[animateGraphObj.length - 1].svg.selectAll(".tick:not(.animategraph)").remove()
        }
        if (d.dataset.legend == "false") {
            d.querySelectorAll(".animategraph[data-type='line']").forEach(s => s.setAttribute("data-legend", "false"));
        }


        ["line", "points"].forEach(s => {
            animateGraphObj[animateGraphObj.length - 1].counter[s + "Total"] = d.querySelectorAll("span.addElement[type='" + s + "']").length;
        })

        d.dataset.graphid = animateGraphObj.length - 1;


    })
    // add random id to missing addElement spans
    document.querySelectorAll("span.addElement:not([id])").forEach(elem => {
        var temp = randomIdGenerate(length = 7);
        elem.id = temp;
    })

    // add lines






    document.querySelectorAll("div.animategraph:has(span)").forEach(d => {
        d.querySelectorAll("span").forEach(
            s => {
                s.dataset.graphid = d.dataset.graphid;
            })
    })


    document.querySelectorAll("span[data-index]:not(.fragment), span[data-fragment-index]:not(.fragment)").forEach(
        d => {
            d.classList.add("fragment");
            if (d.dataset.fragmentIndex === undefined) {
                d.dataset.fragmentIndex = d.dataset.index
            }
        }
    )

    document.querySelectorAll("div.animategraph:has(.addElement[type='tick'])").forEach(d => {
        graph = animateGraphObj[d.dataset.graphid];
        graph.svg.selectAll(".tick:not(.animategraph)").remove()
        d.querySelectorAll(".addElement[type='tick']").forEach(elem => {
            //var params =JSON.parse(JSON.stringify(elem.dataset));
            var params = convertAttributesToData(elem)
            params.style = elem.getAttribute("style") === null ? undefined : elem.getAttribute("style");

            graph.addTicks(params);

        })
    })


    // clone elements for .move[data-clone='true']
    document.querySelectorAll("div.animategraph:has(span)").forEach(d => {
        graph = animateGraphObj[d.dataset.graphid];
        let slideid = findSlideId(d);

        let clones = [];
        var elements = [];
        let counter = {};
        possibleTypes.forEach(t => counter[t] = 0);
        d.querySelectorAll("span.addElement").forEach(s => {


            var params = convertAttributesToData(s);
            params.dfLabel = params.dfLabel === undefined ? d.dataset.dfLabel : params.dfLabel;
            let svgtype = svgtypeList[params.type];
            if (params.color === undefined & params.stroke === undefined) {
                params.color = colorPalette[params.type][counter[params.type] % colorPalette[params.type].length];
                s.dataset.color = params.color;
            }

            setDefaultValues(params);
            counter[params.type] += 1;
            elements[params.id] = [];
            if (s.dataset.index != undefined) {
                for (let i = -1; i < s.index; i++) elements[params.id].push(0);
            }
            elements[params.id].push(params);

        })

        let f = -1;
        d.querySelectorAll("[data-fragment-index]").forEach(s => {
            f = Math.max(f, s.dataset.fragmentIndex);
        })
        d.querySelectorAll("[data-index]").forEach(s => {
            f = Math.max(f, s.dataset.index);
        })
        d.querySelectorAll("[data-index-out]").forEach(s => {
            f = Math.max(f, s.dataset.indexOut);
        })
        let skip = 0;
        for (let i = 0; i <= f; i++) {

            if (document.querySelector("section#" + slideid + ":has([data-fragment-index='" + i + "'])") === null) {
                skip += 1;
            }
            for (key in elements) {
                if (i > elements[key].length - 2) {
                    //                elements[key].push(elements[key][i])
                    elements[key].push(JSON.parse(JSON.stringify(elements[key][i])));
                }
            }
            d.querySelectorAll("span[data-fragment-index='" + i + "']").forEach(s => {
                    s.dataset.index -= skip;
                    s.dataset.fragmentIndex = s.dataset.index;
                    var params = convertAttributesToData(s);
                    for (key in params) {
                        elements[s.id][i + 1 - skip][key] = params[key];
                    }
                }

            )
        }
        graph.elemAttributes = elements;


    })




    document.querySelectorAll("div.animategraph:has([data-clone='true'])").forEach(d => {

        graph = animateGraphObj[d.dataset.graphid];

        d.querySelectorAll("span[data-clone='true']").forEach(elem => {

            //        graph.elements[elem.id.replace(/_clone/g, "")].clone += 1;
            var mainid = elem.id;
            let n = elem.id.split("_clone").length;
            var tempid = elem.id + "_clone";
            let initAttribute = {
                ...graph.elemAttributes[elem.id][elem.dataset.index]
            };
            graph.elemAttributes[tempid] = [];
            for (let i = 0; i < graph.elemAttributes[elem.id].length; i++) {
                graph.elemAttributes[tempid][i] = {
                    ...graph.elemAttributes[elem.id][i]
                };
                graph.elemAttributes[tempid][i].id = tempid;
                graph.elemAttributes[tempid][i].color = d3.quantize(d3.interpolateHcl(graph.elemAttributes[tempid][i].color, "white"), 9)[n + 1]
            }
            for (let i = elem.dataset.index; i < graph.elemAttributes[elem.id].length; i++) {
                graph.elemAttributes[elem.id][i] = initAttribute;
            }




            let referenceElem = d.querySelector("span.addElement[id='" + mainid + "']");
            let span = referenceElem.cloneNode(true);
            span.id = tempid;
            span.setAttribute("label", span.getAttribute("label") + "$^\\prime$");
            span.dataset.index = elem.dataset.index;
            referenceElem.parentNode.insertBefore(span, referenceElem);

            for (let i = elem.dataset.index; i < graph.elemAttributes[mainid].length; i++) {
                //graph.elemAttributes[elem.id][i] = {...initAttribute};
                let tempfrags = d.querySelectorAll("span[id='" + mainid + "'][data-fragment-index='" + i + "']");
                if (tempfrags !== undefined) {
                    d.querySelectorAll("span[id='" + mainid + "'][data-fragment-index='" + i + "']").forEach(
                        frag => frag.id = tempid);
                }
            }



        })

    })

    document.querySelectorAll("div.animategraph:has(span.addElement").forEach(d => {

        graph = animateGraphObj[d.dataset.graphid];
        //var dfLabel = d.dataset.dfLabel;
        d.querySelectorAll("span.addElement:not([type='tick'])").forEach(elem => {
            var params = convertAttributesToData(elem);
            params.dfLabel = params.dfLabel === undefined ? d.dataset.dfLabel : params.dfLabel;
            graph.addElement(params);
            
            elem.dataset.color = params.color;
        })
    })

    Reveal.on("fragmentshown", event => {
        a = event;
        event.fragments.forEach(d => {
            if (d.matches("div.animategraph span.move, div.animategraph span.setAttribute")) {
              
                graph = animateGraphObj[d.dataset.graphid];
                let index = Number(Reveal.getCurrentSlide().dataset.fragment) + 1;
                var params = graph.elemAttributes[d.id][index];
                graph.move(params);
                graph.setAttributes(params);
                for (key in graph.elemAttributes) {
                    let m = key.match(d.id + "_clone");
                    if (m !== null) {
                        if (m.index == 0) {
                            params = graph.elemAttributes[key][index];
                            graph.move(params);
                            graph.setAttributes(params);
                        }
                    }
                }
            }
        })
    })

    Reveal.on("fragmenthidden", event => {
        a = event;
        event.fragments.forEach(d => {
            if (d.matches("div.animategraph span.move, div.animategraph span.setAttribute")) {
                graph = animateGraphObj[d.dataset.graphid];
                let index = Number(Reveal.getCurrentSlide().dataset.fragment) + 1;
                //var params = graph.elements[d.id].options[graph.elements[d.id].options.length-2];
                var params = graph.elemAttributes[d.id][index];
                params.duration = d.dataset.duration;
                if (params.id.match("_clone")) {
                    params.duration = 0;
                }
                graph.move(params);

                if (params.style === undefined) {
                    graph.elements[params.id].svg.attr("style", "");
                } else {
                    graph.elements[params.id].svg.attr("style", params.style);
                }
                graph.setAttributes(params);

                for (key in graph.elemAttributes) {
                    let m = key.match(d.id + "_clone");
                    if (m !== null) {
                        if (m.index == 0) {
                            params = graph.elemAttributes[key][index];
                            params.duration = d.dataset.duration;
                            graph.move(params);
                            graph.setAttributes(params);
                        }
                    }
                }
            }
        })

    })




    Reveal.on("slidechanged", event => {
        a = event;
        var f = -1;
        Array.from(a.currentSlide.querySelectorAll(".fragment.visible")).forEach(d => {
            return f = Math.max(f, d.dataset.fragmentIndex)
        })
        if (event.currentSlide.querySelectorAll(".fragment.visible").length >= 0) {
            event.currentSlide.querySelectorAll("div.animategraph").forEach(d => {
                let graph = animateGraphObj[d.dataset.graphid];

                d.querySelectorAll("span.addElement:not([type='tick'])").forEach(e => {
                    var params = {
                        ...graph.elemAttributes[e.id][f + 1]
                    };
                    params.duration = 0;
                    graph.move(params);
                    graph.setAttributes(params);
                })
            })
        }
    })



    Reveal.getCurrentSlide().querySelectorAll("div.animategraph").forEach(d => {
        let graph = animateGraphObj[d.dataset.graphid];
        d.querySelectorAll("span.addElement:not([type='tick'])").forEach(e => {
            var params = {
                ...graph.elemAttributes[e.id][0]
            };
            params.duration = 0;
            graph.move(params);
            graph.setAttributes(params);
        })
    })
})
animateGraphData['econ'] = [{"quantity":0,"demandCurve":10,"supplyCurve":0,"demand":5,"supply":0},{"quantity":0.2,"demandCurve":8.3333,"supplyCurve":0.016,"demand":4.8,"supply":0.2},{"quantity":0.4,"demandCurve":7.1429,"supplyCurve":0.064,"demand":4.6,"supply":0.4},{"quantity":0.6,"demandCurve":6.25,"supplyCurve":0.144,"demand":4.4,"supply":0.6},{"quantity":0.8,"demandCurve":5.5556,"supplyCurve":0.256,"demand":4.2,"supply":0.8},{"quantity":1,"demandCurve":5,"supplyCurve":0.4,"demand":4,"supply":1},{"quantity":1.2,"demandCurve":4.5455,"supplyCurve":0.576,"demand":3.8,"supply":1.2},{"quantity":1.4,"demandCurve":4.1667,"supplyCurve":0.784,"demand":3.6,"supply":1.4},{"quantity":1.6,"demandCurve":3.8462,"supplyCurve":1.024,"demand":3.4,"supply":1.6},{"quantity":1.8,"demandCurve":3.5714,"supplyCurve":1.296,"demand":3.2,"supply":1.8},{"quantity":2,"demandCurve":3.3333,"supplyCurve":1.6,"demand":3,"supply":2},{"quantity":2.2,"demandCurve":3.125,"supplyCurve":1.936,"demand":2.8,"supply":2.2},{"quantity":2.4,"demandCurve":2.9412,"supplyCurve":2.304,"demand":2.6,"supply":2.4},{"quantity":2.6,"demandCurve":2.7778,"supplyCurve":2.704,"demand":2.4,"supply":2.6},{"quantity":2.8,"demandCurve":2.6316,"supplyCurve":3.136,"demand":2.2,"supply":2.8},{"quantity":3,"demandCurve":2.5,"supplyCurve":3.6,"demand":2,"supply":3},{"quantity":3.2,"demandCurve":2.381,"supplyCurve":4.096,"demand":1.8,"supply":3.2},{"quantity":3.4,"demandCurve":2.2727,"supplyCurve":4.624,"demand":1.6,"supply":3.4},{"quantity":3.6,"demandCurve":2.1739,"supplyCurve":5.184,"demand":1.4,"supply":3.6},{"quantity":3.8,"demandCurve":2.0833,"supplyCurve":5.776,"demand":1.2,"supply":3.8},{"quantity":4,"demandCurve":2,"supplyCurve":6.4,"demand":1,"supply":4},{"quantity":4.2,"demandCurve":1.9231,"supplyCurve":7.056,"demand":0.8,"supply":4.2},{"quantity":4.4,"demandCurve":1.8519,"supplyCurve":7.744,"demand":0.6,"supply":4.4},{"quantity":4.6,"demandCurve":1.7857,"supplyCurve":8.464,"demand":0.4,"supply":4.6},{"quantity":4.8,"demandCurve":1.7241,"supplyCurve":9.216,"demand":0.2,"supply":4.8},{"quantity":5,"demandCurve":1.6667,"supplyCurve":10,"demand":0,"supply":5}] ;

let dx=1;
for(let i =0; i<animateGraphData['econ'].length; i++){
  ["demand",  "demandCurve", ].forEach(d=>{
    animateGraphData['econ'][i][d + "_right"] = animateGraphData['econ'][i][d]+dx;
    animateGraphData['econ'][i][d + "_left"] = animateGraphData['econ'][i][d]-dx;
  })
}

for(let i =0; i<animateGraphData['econ'].length; i++){
  [ "supply",  "supplyCurve"].forEach(d=>{
    animateGraphData['econ'][i][d + "_right"] = animateGraphData['econ'][i][d]-dx;
    animateGraphData['econ'][i][d + "_left"] = animateGraphData['econ'][i][d]+dx;
  })
}



