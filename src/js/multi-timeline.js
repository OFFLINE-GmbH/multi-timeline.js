;(function ( $, window, document, undefined ) {

    var pluginName = "multi-timeline",
        defaults = {
            propertyName: "value"
        };

    function MultiTimline( element, options ) {
        this.element = element;
        this.options = $.extend( {}, defaults, options) ;
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    MultiTimline.prototype = {

        init: function() {
            // Place initialization logic here
            // You already have access to the DOM element and
            // the options via the instance, e.g. this.element
            // and this.options
            // you can add more functions like the one below and
            // call them like so: this.yourOtherFunction(this.element, this.options).
        },

        yourOtherFunction: function(el, options) {
            // some logic
        }
    };

    $.fn[pluginName] = function ( options ) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName,
                    new MultiTimline( this, options ));
            }
        });
    };

})( jQuery, window, document );