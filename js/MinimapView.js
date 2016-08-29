/*
    
pathData = [
    {
        componentId: "c-10",
        iconId: "circle-1",
        offsetTop: 520,
        pathLength: 168.14,
        progressId: "path-1",
        view: [Object],
        pathEl: DomElement
    },
    {...}
]

*/

define(['coreJS/adapt','backbone','underscore','velocity'], function(Adapt, Backbone, _, Velocity) {
   
    var MinimapView = Backbone.View.extend({

        className: 'minimap-container',
        debug: false,

        initialize: function() {
            if (Modernizr.svg) {
                $('html').addClass('svg');
            } else {
                $('html').addClass('no-svg');
                return;
            }

            this.pathData = [];
            this.$window = $(window);

            this.listenTo(Adapt, 'remove', this.remove);
            this.listenTo(Adapt, 'pageView:postRender', this.onPageViewPostRender);
            this.listenTo(Adapt, 'pageView:ready', this.onPageViewReady);
            this.listenTo(Adapt, 'componentView:postRender', this.onComponentViewPostRender);
            this.listenTo(Adapt, 'device:resize', this.onDeviceResize);

            this.setupScrollHandler();
            this.render();
        },

        render: function() {
            var template = Handlebars.templates.minimap;
            this.$el.html(template());

            return this;
        },

        setPathSrc: function() {
            var config = this.model.get('_minimap');
            this.iconAnimation = config._iconAnimation;
            $('#minimap-doc').attr('data', config._path);
        },

        setupComponentCompleteListener: function(componentModel) {
            componentModel.once('change:_isComplete', this.onComponentComplete, this);
        },

        onComponentComplete: function(model, value, options) {
            if (value === true) {
                var minimapModel = model.get('_minimap');
                this.markComponentInMinimapAsComplete(minimapModel);
            }
        },

        checkMinimapComponentsCompleted: function() {
            // when learner opens page again, mark components as complete in minimap
            for (var i = this.pathData.length - 1; i >= 0; i--) {
                if (this.pathData[i].view.model.get('_isComplete')) {
                    var minimapModel = this.pathData[i].view.model.get('_minimap');
                    this.markComponentInMinimapAsComplete(minimapModel);
                } else {
                    this.setupComponentCompleteListener(this.pathData[i].view.model);
                }
            }
        },

        onPageViewPostRender: function(pageView) {
            $('#splittscreen-body').append(this.$el);
            $('#minimap-doc').on('load', _.bind(this.onMinimapLoad, this));

            this.getViewportHeight();
        },

        onComponentViewPostRender: function(componentView) {
            if (!componentView.model.has('_minimap')) return;

            var progressId = componentView.model.get('_minimap')._progressId;
            var iconId = componentView.model.get('_minimap')._iconId;
            var labelId = componentView.model.get('_minimap')._labelId;

            // check if componentId already is in pathData, fix when Hotgraphic changes to narrative
            // todo: update item when item already exists
            var inPathData = _.find(this.pathData, function(item) {
                return item.componentId === componentView.model.get('_id');
            });

            if (!inPathData) {
                this.pathData.push({
                    componentId: componentView.model.get('_id'),
                    view: componentView,
                    progressId: progressId,
                    iconId: iconId,
                    labelId: labelId,
                    pathLength: 0,
                    offsetTop: 0
                });
            }
        },

        setupScrollCache: function() {
            if (!this.svgDoc) {
                return;
            }

            for (var i = 0; i < this.pathData.length; i++) {
                var path = this.svgDoc.getElementById(this.pathData[i].progressId);
                var pathLength = 0;

                if (path) {
                    pathLength = path.getTotalLength();
                } else {
                    pathLength = this.pathData[i].view.$el.height();
                }
                
                this.pathData[i].pathLength = pathLength;
                this.pathData[i].offsetTop = this.pathData[i].view.$el.offset().top;
            }
            // make sure offset increases in ascending order
            this.pathData = _.sortBy(this.pathData, 'offsetTop');
        },

        onMinimapLoad: function() {
            this.svgDoc = document.getElementById("minimap-doc").getSVGDocument();

            this.setupScrollCache();
            this.setupPaths();
            this.setupNavigationEvents();
            
            this.checkMinimapComponentsCompleted();

            // window.svgDoc = this.svgDoc;
        },

        markComponentInMinimapAsComplete: function(minimapModel) {
            var elm = this.svgDoc.getElementById(minimapModel._iconId); 
            for (var i = 0; i < this.iconAnimation.length; i++) {
                Velocity(elm, this.iconAnimation[i][0], this.iconAnimation[i][1]);
            }
        },

        setupPaths: function() {
            this.mainPath = this.svgDoc.getElementById('main');
            if (!this.mainPath) {
                return;
            }
            this.mainPathLength = this.mainPath.getTotalLength();
            this.mainPath.style.strokeDasharray = this.mainPathLength + ' ' + this.mainPathLength;
            this.mainPath.style.strokeDashoffset = this.mainPathLength;
        },

        setupNavigationEvents: function() {
            var that = this;
            _.each(this.pathData, function(item) {
                $(that.svgDoc.getElementById(item.iconId)).on('click', _.bind(that.onNavigationClick, that));
                $(that.svgDoc.getElementById(item.labelId)).on('click', _.bind(that.onNavigationClick, that));
            });
        },

        onNavigationClick: function(event) {
            if (!event) {
                return;
            }
            
            var parentGroup = $(event.target).parent('g');
            var id = parentGroup[0].id;

            var component = _.find(this.pathData, function(item) {
                return item.iconId === id || item.labelId === id;
            });

            Adapt.scrollTo('.'+component.componentId, { duration: 750 });
        },

        setupScrollHandler: function() {
            this.$window.on('scroll', _.bind(this.onScroll, this));
        },

        onScroll: function() {
            if (!this.svgDoc || !this.mainPath || this.pathData.length === 0) {
                return;
            }

            var scrollPos = this.$window.scrollTop() + this.scrollPosOffset;
            // lower border
            if (scrollPos <= this.pathData[0].offsetTop) {
                // before the relvant components
                this.mainPath.style.strokeDashoffset = this.mainPathLength;
                this.highlightLabel(-1);
                return;
            } else if (scrollPos >= this.pathData[this.pathData.length-1].offsetTop) {
                // after the relvant components
                // draw the full path
                this.svgDoc.getElementById('main').style.strokeDashoffset = 0;
                this.highlightLabel(this.pathData.length-1);
                return;
            } else {
                // in between the relevant components
                for (var i = 0; i < this.pathData.length-1; i++) {
                    if (scrollPos > this.pathData[i].offsetTop && scrollPos < this.pathData[i+1].offsetTop) {
                        currentPathIndex = i;
                        break;
                    }
                }
            }

            var pathOffset = 0;
            var scrolledDistance = scrollPos - this.pathData[currentPathIndex].offsetTop;
            var scrollDistance = this.pathData[currentPathIndex+1].offsetTop - this.pathData[currentPathIndex].offsetTop;

            var pathLength = this.pathData[currentPathIndex].pathLength - (this.pathData[currentPathIndex].pathLength * (scrolledDistance / scrollDistance));
            
            if (pathLength <= 0) {
                pathLength = 0;
            }

            for (var i = 0; i < currentPathIndex; i++) {
                pathOffset += this.pathData[i].pathLength;
            }

            var mainPathStrokeOffset = this.mainPathLength - pathOffset + pathLength - this.pathData[currentPathIndex].pathLength;
            this.svgDoc.getElementById('main').style.strokeDashoffset = mainPathStrokeOffset;

            this.highlightLabel(currentPathIndex);
        },

        highlightLabel: function(currentPathIndex) {
            // index -1 -> no item active -> remove classes
            // add id of active label as class to the root element 
            
            var $layer = $(this.svgDoc.getElementById('layer1'));

            if (currentPathIndex === -1) {
                $layer.attr('class', '');
            } else {
                $layer.attr('class', '');
                var labelId = this.pathData[currentPathIndex].labelId;
                $layer.attr('class', labelId);
            }
        },

        onPageViewReady: function(pageView) {
            this.setPathSrc();

            if (this.debug) {
                this.showScrollMarker(pageView);
            }

            this.pathData;
            Adapt;
        },


        showScrollMarker: function(pageView) {
            var marker = $('<div >', {
                'class': 'scrollmarker'
            });

            marker.css('top', this.scrollPosOffset+'px');

            pageView.$el.append(marker);
        },

        getViewportHeight: function() {
            this.viewportHeight = this.$window.height();
            this.scrollPosOffset = 100;
        },

        onDeviceResize: function(screenWidth) {
            this.setupScrollCache();
            this.$window.trigger('scroll');
        },

        remove: function() {            
            this.$window.off('scroll');
            $('#minimap-doc').off('load');
            
            _.each(this.pathData, _.bind(function(item) {
                $(this.svgDoc.getElementById(item.iconId)).off('click');
            }, this));

            Backbone.View.prototype.remove.call(this);
        }

    });

    return MinimapView;

});
