# adapt-minimap

main goals of this extension:
- give a visual representation of the pages content by drawing a learning path on a map
- individual components can be added to the path, represented as icons
- highlight the learners progress in the course by drawing a line on the path
- shows whitch components on the page are completed
- learner can directly navigate to a component by clicking on an icon

## Settings Overview

### Attributes in contentObjects.json

**_pageLevelProgress** (object): The Container for the minimap configuration.  
>**_path** (string): Path to the svg map that should be used for this page. Please see setting up the map for more details.
>**_iconAnimation** (Array): Array containing velocity.js property and options objects. [[p1,o1],[p2,o2]] 

### Attributes in components.json
**_minimap** (object): The Container for the minimap configuration.  
>**_labelId** (string): Id of the Components label (= SVG Element) in the map.   
>**_progressId** (string): Id of the path connecting 2 Components (= SVG Element) in the map.   
>**_iconId** (string): Id of the Components icon (= SVG Element) in the map.   

### setting up the map
![map setup](https://raw.githubusercontent.com/LearnChamp/adapt-minimap/master/examples/mapDescription.png "")

| item         | components._minimap[xxx] | SVG Element   | SVG id attribute                   | Image label |
|--------------|--------------------------|---------------|------------------------------------|-------------|
|**Hotspot label** used for navigation | _labelId | `<g />` | required, any valid attribute name | A |
|**Icon** highlights if a component is completed | _iconId | `<path />,<circle />, <rectangle />` | required, any valid attribute name | B |
|**Path** connecting 2 components | _progressId | `<path />` | required, any valid attribute name | C |
|**Path** used to show learners progress |  | `<path />` | required, must be named ",main" | D |
|**Wrapper** |  | `<g />` | required, must be named ",layer1" | E |


### Animations:
As the leraner scrolls through the course, Label id is added dynamicly to the wrapper element. This can be used to add CSS animations to the map. These styles should be added to the svg map directly: 
``` CSS
<style
   type="text/css"
   id="style6"><![CDATA[
    .pin {
      fill: #00926F;
      transition: fill 0.2s ease-in-out;
    }
    .label-1 #label-1 .pin {
      fill: #005384;
    }
    .label-2 #label-2 .pin {
      fill: #005384;
    }
    .label-3 #label-3 .pin {
      fill: #005384;
    }
    .label-4 #label-4 .pin {
      fill: #005384;
    }
    #label-1,#label-2,#label-3,#label-4 {
      cursor: pointer;
    }
]]></style>
```

## Limitations

----------------------------
**Framework versions:**  2.0         
**Accessibility support:** no   
**RTL support:** no     
**Cross-platform coverage:**    

| Browser           | Status                  |
|-------------------|-------------------------|
| IE 8              | Fallback without map    |
| IE 9              | OK - no CSS transitions |
| IE 10+            | OK                      |
| Firefox           | OK                      |
| Chrome            | OK                      |
| Safari iOS        | OK                      |
| Chrome on Android | OK                      |