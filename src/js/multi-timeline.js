;
(function ($, window, document, undefined) {

    var pluginName = "multiTimeline",
        defaults = {
            propertyName: "value",
            timelineTemplate: '<div class="tl-timeline">',
            timeTemplate: '<ul class="tl-time">',
            start: '2015-02-23',
            end: '2015-03-01'
        };

    function multiTimeline(element, options) {
        this.element = element;
        this.$element = $(element);
        this.moment = moment || null;
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this.init();
    }

    multiTimeline.prototype = {

        init: function () {
            this
                .createStructure()
                .addTimelines()
        },

        createStructure: function () {
            this.$element.addClass('tl-wrapper');
            var $time = $(this.options.timeTemplate);

            var current = this.moment(this.options.start);
            var end = this.moment(this.options.end);

            this._days = this.getDuration(current, end);
            this._dayPercentage = 100 / this._days;

            end = end.add(1, 'day')

            while (!current.isSame(end)) {
                $time.append('<li class="tl-time__unit">' + current.format('YYYY-MM-DD') + '</li> ');
                current = current.add(1, 'day');
            }
            $time.appendTo(this.$element);

            return this;
        },

        getDuration: function (from, to) {
            var duration = this.moment.duration(to.diff(from));
            return duration.asDays();
        },

        addTimelines: function () {
            var that = this;
            var i = 0;
            $(this.options.data).each(function () {
                var duration = that.getDuration(moment(this.start), moment(this.end));
                var startOffset = that.getDuration(moment(that.options.start), moment(this.start));
                $(that.options.timelineTemplate)
                    .html('<div class="tl-timeline__title">' + this.title + '</div>')
                    .css({
                        'width': duration * that._dayPercentage + '%',
                        'left': startOffset * that._dayPercentage + '%',
                        'bottom': (i * 30) + 20 + 'px'
                    })
                    .prependTo(that.$element);
                i++;
            });
            return this;
        }

    };

    $.fn[pluginName] = function (options) {
        return this.each(function () {
            if (!$.data(this, "plugin_" + pluginName)) {
                $.data(this, "plugin_" + pluginName,
                    new multiTimeline(this, options));
            }
        });
    };

})(jQuery, window, document);