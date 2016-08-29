define(function(require) {

    var Adapt = require('coreJS/adapt');
    var Backbone = require('backbone');

    var MinimapView = require('extensions/adapt-minimap/js/MinimapView');

    // add svg test
    Modernizr.addTest('svg', function() {
        return document.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure", "1.1");
    });

    Adapt.on('pageView:preRender', function(pageView) {
    
    });

    Adapt.on('pageView:postRender', function(pageView) {
    
    });

    // init Splitscreen View ?
    Adapt.on('router:page', function(pageModel) {
        if (pageModel.has('_splittscreen') && pageModel.get('_splittscreen')._isEnabled && pageModel.has('_minimap')) {
            new MinimapView({model: pageModel});
        }
    });

});
