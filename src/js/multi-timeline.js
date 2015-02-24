;
(function ($, window, document, undefined) {

    var pluginName = "multiTimeline",
        defaults = {
            start: null,
            end: null,
            dateFormat: 'YYYY-MM-DD',
            unitFormat: 'DD/MM'
        };

    function multiTimeline(element, options) {
        this.element = element;
        this.$element = $(element);
        this.moment = moment || null;
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;

        if (this.options.start === null || this.options.end === null) {
            console.error('multi-timeline.js: start or end date is missing!');
            return false;
        }

        this._start = moment(this.options.start);
        this._end = moment(this.options.end);

        if (!this._end.isAfter(this._start)) {
            console.error('multi-timline.js: end date has to be a date after start date!');
            return false;
        }

        this._days = this.getDuration(this._start, this._end);
        this._dayPercentage = 100 / (this._days + 1);

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
            this.addMarks();

            return this;
        },

        addMarks: function () {

            var current = this._start;
            var end = this._end.add(1, 'day');

            var $time = $('<ul class="tl-time">');
            var timeUnitCount = -1;
            var printedDates = [];
            var label = '';

            // Mark start
            this.addTimeUnit($time, current, 0);

            while (!current.isSame(end)) {
                timeUnitCount++;
                current = current.add(1, 'day');
                label = current;
                // If there are more than 10 days, wirte only every nth date
                if (this._days > 10 && timeUnitCount % 2 !== 0) {
                    label = '';
                }
                this.addTimeUnit($time, label, (timeUnitCount + 1));

                printedDates.push(current.format(this.options.dateFormat));
            }
            // Mark end (if not already marked)
            if (!$.inArray(end.format(this.options.dateFormat), printedDates)) {
                this.addTimeUnit($time, end, (timeUnitCount + 1));
            }
            $time.appendTo(this.$element);
        },

        addTimeUnit: function ($time, label, position) {
            if (moment.isMoment(label)) {
                label = label.format(this.options.unitFormat);
            }
            $('<li class="tl-time__unit">')
                .html(label)
                .css({left: (position * this._dayPercentage) + '%'})
                .append('<span>')
                .appendTo($time);
        },

        getDuration: function (from, to) {
            var duration = moment.duration(to.diff(from));
            return duration.asDays();
        },

        addTimelines: function () {
            var that = this;
            var i = 0;
            $(this.options.data).each(function () {
                var duration = that.getDuration(moment(this.start), moment(this.end));
                var startOffset = that.getDuration(moment(that.options.start), moment(this.start));

                var tlOverflowLeft = '', tlOverflowRight = '';
                if (startOffset < 0) {
                    duration = duration + startOffset;
                    startOffset = 0;
                    tlOverflowLeft = 'tl-overflow-left';
                }
                if ((startOffset + duration) > that._days) {
                    tlOverflowRight = 'tl-overflow-right';
                }

                $('<div class="tl-timeline">')
                    .html('<div class="tl-timeline__title">' + this.title + '</div>')
                    .css({
                        'width': duration * that._dayPercentage + '%',
                        'left': startOffset * that._dayPercentage + '%',
                        'bottom': (i * 30) + 20 + 'px'
                    })
                    .addClass(tlOverflowLeft + ' ' + tlOverflowRight)
                    .attr({"data-startOffset": startOffset, "data-duration": duration})
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