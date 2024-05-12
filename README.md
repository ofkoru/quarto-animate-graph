# Animate-graph Extension For Quarto

Create clear, step-by-step visualizations to enhance your teaching and explanations in [Reveal.js](https://revealjs.com/) without any coding knowledge. By defining HTML elements with specific attributes, such as divs and spans, users can specify data and customize visual elements. The package automatically converts these elements into SVG elements using [D3.js](https://d3js.org/), enabling smooth transitions and animations. It can plot curves, points, and filled areas along with annotations and animate their transitions (position or appearance) synchronized with Reveal.js fragments. All you need to know is [how to add divs and spans](https://quarto.org/docs/authoring/markdown-basics.html#sec-divs-and-spans) in your [Quarto](https://quarto.org/) document.


You can check the [minimal example](https://omerfarukkoru.com/Packages/quarto-animate-graph/documentation/slides/example.html), [slides](https://omerfarukkoru.com/Packages/quarto-animate-graph/documentation/slides/slides.html) with more detailed explanatins, or the [full documentation](https://omerfarukkoru.com/Packages/quarto-animate-graph/documentation/documentation.html).


__Key Features:__

- Simplified integration with Reveal.js presentations.
- No coding required; users define visual elements using HTML attributes.
- Supports step-by-step animations and transitions.
- Plots curves, points, filled areas, and annotations.


![](assets/example.gif)

## Installing 

```bash
quarto add ofkoru/quarto-animate-graph
```

This will install the extension under the `_extensions` subdirectory.

## Enabling


This package depends on [D3.js](https://d3js.org/); it must be loaded along with the plug in utilizing `include-in-header`. 
To use the extension, add the following to your document's front matter:

```yaml
format:
  revealjs: 
    include-in-header: 
      - text: '<script src="https://cdn.jsdelivr.net/npm/d3@7"></script>'
revealjs-plugins:
  - animate-graph
```

If you want to render math expressions, you also need to use Katex for the math method:

```yaml
format:
  revealjs:
    html-math-method: katex
```




## Basic Usage

- There are four main components of this plug in:
  - `graph`, `element`, `move`, and `setAttribute`.
- To generate an animated graph:
  - Create a div with class __animategraph__.
  - Create a span within `div.animategraph` with class __addElement__ to add an element.
  - Create a span within `div.animategraph` with class __move__ to change the position of an element.
  - Create a span within `div.animategraph` with class __setAttribute__ to the appearance of an element.




```{verbatim}
:::{.animategraph}

[]{.addElement required-attributes}
[]{.move required-attributes}
[]{.setAttribute required-attributes}

:::
```




- The plug in comes with a predefined data named `econ`.
  - It is the default data for the graph. 
    - See [`econ` Dataset](#econ-dataset) section below for the list of variables available.
  - To define a new data, please see [Defining Data](#defining-data) section below.
  

### Required Attributes

- Required attributes for `addElement`.
  - `type`: type of the element. Possible values: `line`, `points`, `area`, `text`, `tick`.
  - `id`: required if it will be modified by `move` or `setAttribute` later.
  
- Required attributes for type `line`:
  - `var-x` and `var-y`: three possibilities:
    1. Both are variable names in `df`. 
    2. One is variable name, the other one is single number for constant value. If `var-x` is constant, it is a vertical line. If `var-y` is constant then it is a horizontal line.
    3. Both are semicolon separated two numbers to draw straight line (var-x='number1; number2', var-y='number3;number4'). A line is drawn between (number1, number3) and (number2,number4).
  - Example
```{.markdown}
[]{ .addElement type='line' var-x='quantity' var-y='demand'}
```

- Required attributes for type `point`:
  - `var-x` and `var-y`: two possibilities:
    1. Both are single number. A point is drawn at the coordinate. 
    2. Both are variable name in `df`. A point is drawn at the first intersection of two lines.
  - Example
```{.markdown}
[]{ .addElement type='point' var-x='quantity' var-y='demand; supply'}
[]{ .addElement type='point' var-x='2' var-y='5'}
```    
    
- Required attributes for type `area`:
  - `var-x`: A variable name in `df`.
  - `var-y`: 
    1. Both of them are variable names. The area between the two lines is filled.
    2. One of them is a variable, and the other one is a single number. The area between the line and the horizontal line is filled.
    3. Both of them are number. Area between two horizontal line is filled.
  - Example
```{.markdown}
[]{ .addElement type='area' var-x='quantity' var-y='demand; supply'}
``` 
    
- Required attributes for type `text`:
  - `var-x` and `var-y`: Both must be a single number. Coordinates for the text element.
  - `text`: Text to be printed on the graph.
  - Example
```{.markdown}
[]{ .addElement type='text' var-x='5' var-y='2' text='Consumer Surplus'}
```

- Required attributes for type `tick`:
  - `var-x` and/or `var-y`: Semicolon separated numbers. Values for the position of ticks on x and y axes, respectively.
  - `label-x` and/or `label-y`: Labels to be printed on values.
  - Example
```{.markdown}
[]{ .addElement type='tick' var-x='2.5' label-x='$q^\\star$'}
```   


- Required attributes for `move`:
  - `id`: id of the element to be moved.
  - `var-x` and `var-y`: New position of the element `id`.
  - `index`: Fragment when the movement will happen.
  - Example
```{.markdown}
[]{ .move id='demand' var-x='quantity' var-y='demand_right'}
```
  
- Required attributes for `setAttribute`:
  - `id`: id of the element to be moved.
  - A set of	attributes to be passed to the SVG element for styling (color, width, etc.).
  - Example 
```{.markdown}
[]{ .setAttribute id='demand' color="red"}
```   
- For optional attributes, see the [full documentation](https://omerfarukkoru.com/Packages/quarto-animate-graph/documentation/documentation.html).


### `econ` Dataset

`econ` dataset allows users to draw supply and demand curves. Below is the name of the variables available in the dataset. Deman is actually an _inverse_ demand (price as a function of quantity).

- `quantity`: equally spaced grid on the x-axis between 0 and 5.
- `demand`: downward sloping linear line. 
- `supply`: upward-sloping linear line. 
- `demandCurve`: downward sloping convex function. 
- `supplyCurve`: upward sloping convex function.
- `*_right`: right-shifted version of demand and supply `*` can be supply, demand, supplyCurve or demandCurve.
- `*_left`: left-shifted version of demand and supply (linear or curved).

## Minimal Example

```{.markdown}

:::{.animategraph}

[]{ .addElement type='line' var-x='quantity' var-y='supply'  }
[]{ .addElement type='line' var-x='quantity' var-y='demand' id='demand' index=0 } 
[]{ .addElement type='point' var-x='2.5' var-y='2.5' id='equilibrium' index=1   lines="true" }
[]{ .addElement type='tick' var-x='2.5' label-x="$q^\\star$" var-y='2.5' label-y="$p^\\star$"  index=2 }
[]{ .addElement type='area' var-x='quantity' var-y0='supply' var-y1='demand' index=3 id='surplus'  }
[]{ .addElement type='text' var-x='1' var-y='2.5' text="Total Surplus" index=3   }
[]{ .move var-x='quantity' var-y='demand_right' id='demand' index=4  }
[]{ .move var-x='3' var-y='3' id='equilibrium' index=5  }
[]{ .addElement type='tick' var-x='3' label-x="$q^{\\star}_{new}$" var-y='3' label-y="$p^\\star_{new}$"  index=6 }
[]{ .move id='surplus' var-x='quantity' var-y0='supply' var-y1='demand_right' index=7  }

:::


```

You may check the [working version](https://omerfarukkoru.com/Packages/quarto-animate-graph/documentation/slides/example.html).




## More Information

For more information, please see

- [slides](https://omerfarukkoru.com/Packages/quarto-animate-graph/documentation/slides/slides.html) with more detailed explanatins, or
- the [full documentation](https://omerfarukkoru.com/Packages/quarto-animate-graph/documentation/documentation.html).
