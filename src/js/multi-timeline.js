;(function ( $, window, document, undefined ) {

    var pluginName = "multiTimeline",
        defaults = {
            propertyName: "value",
            timelineTemplate: '<div class="tl-timeline">',
            timeTemplate: '<ul class="tl-time">'
        };

    function multiTimeline( element, options ) {
        this.element = element;
        this.$element = $(element);
        this.options = $.extend( {}, defaults, options) ;
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    multiTimeline.prototype = {

        init: function() {
            this
                .createStructure()
                .addTimelines()
        },

        createStructure: function() {
            this.$element.addClass('tl-wrapper');
            $(this.options.timeTemplate).appendTo(this.$element);
            return this;
        },

        addTimelines: function() {
            $(this.options.timelineTemplate).prependTo(this.$element);
            return this;
        }
    };

    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName,
                    new multiTimeline( this, options ));
            }
        });
    };

})( jQuery, window, document );