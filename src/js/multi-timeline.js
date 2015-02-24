;
(function ($, window, document, undefined) {

    var pluginName = "multiTimeline",
        defaults = {
            start: null,
            end: null,
            dateFormat: 'YYYY-MM-DD',
            unitFormat: 'DD/MM',
            timelineSpacing: 30,
            zoomStep: 1,
            maxLabelCount: 20,
            timelineClick: function (event, data) {
            }
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

            this._timelineCount = this.options.data.length;

            this
                .createStructure()
                .addTimelines()
                .addEventHandlers()
                .setWrapperDimensions()
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

            while (!current.isSame(end)) {
                timeUnitCount++;
                current = current.add(1, 'day');
                label = current;
                // write only every nth date to prevent overlap
                if (this._days > 10 && timeUnitCount % Math.round(this._days / this.options.maxLabelCount) !== 0) {
                    label = '';
                }
                this.addTimeUnit($time, label, (timeUnitCount + 1));

                printedDates.push(current.format(this.options.dateFormat));
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
            var layer = 0;

            $(this.options.data).each(function () {
                var dataEntry = this;
                var duration = that.getDuration(moment(dataEntry.start), moment(dataEntry.end));
                var startOffset = that.getDuration(moment(that.options.start), moment(dataEntry.start));
                var useLayer = (dataEntry.layer !== undefined) ? dataEntry.layer : layer;


                // Check if timline overflows wrapper
                var tlOverflowLeft = '', tlOverflowRight = '';
                if (startOffset < 0) {
                    duration = duration + startOffset;
                    startOffset = 0;
                    tlOverflowLeft = 'tl-overflow-left';
                }
                if ((startOffset + duration) > that._days) {
                    tlOverflowRight = 'tl-overflow-right';
                }
                var left = startOffset * that._dayPercentage;
                if (startOffset > that._days + 1) {
                    left = 100;
                }
                var visibility = (duration < 0) ? 'hidden' : 'visible';

                // Add Timeline
                $('<div class="tl-timeline">')
                    .html('<div class="tl-timeline__title">' + dataEntry.title + '</div>')
                    .css({
                        'width': duration * that._dayPercentage + '%',
                        'left': left + '%',
                        'visibility': visibility,
                        'bottom': (useLayer * that.options.timelineSpacing) + 20 + 'px',
                        'background-color': (dataEntry.color !== undefined) ? dataEntry.color : '#333333'
                    })
                    .addClass(tlOverflowLeft + ' ' + tlOverflowRight + ' ' + ((dataEntry.class !== undefined) ? dataEntry.class : '' ))
                    .attr({"data-startOffset": startOffset, "data-duration": duration})
                    .on('click', function (event) {
                        that.options.timelineClick(event, dataEntry);
                    })
                    .prependTo(that.$element);

                layer++;
            });
            return this;
        },

        setWrapperDimensions: function () {
            var timelineHeight = parseInt($('.tl-timeline:first').outerHeight());
            this.$element.css('height', timelineHeight + (this._timelineCount * this.options.timelineSpacing));
        },

        addEventHandlers: function () {
            var that = this;
            if (this.options.zoomInHandler !== undefined) {
                this.options.zoomInHandler.on('click', function (e) {
                    that.zoomIn();
                    e.preventDefault()
                })
            }
            if (this.options.zoomOutHandler !== undefined) {
                this.options.zoomOutHandler.on('click', function (e) {
                    that.zoomOut();
                    e.preventDefault()
                })
            }
            if (this.options.goRightHandler !== undefined) {
                this.options.goRightHandler.on('click', function (e) {
                    that.goRight();
                    e.preventDefault()
                })
            }
            if (this.options.goLeftHandler !== undefined) {
                this.options.goLeftHandler.on('click', function (e) {
                    that.goLeft();
                    e.preventDefault()
                })
            }
            return this;
        },

        removeEventHandlers: function () {
            if (this.options.zoomInHandler !== undefined) {
                this.options.zoomInHandler.off('click');
            }
            if (this.options.zoomOutHandler !== undefined) {
                this.options.zoomOutHandler.off('click');
            }
            if (this.options.goRightHandler !== undefined) {
                this.options.goRightHandler.off('click');
            }
            if (this.options.goLeftHandler !== undefined) {
                this.options.goLeftHandler.off('click');
            }
            return this;
        },

        zoomOut: function () {
            this.options.start = moment(this.options.start).subtract(this.options.zoomStep, 'days').format('YYYY-MM-DD');
            this.options.end = moment(this.options.end).add(this.options.zoomStep, 'days').format('YYYY-MM-DD');

            this.reset().init();
        },
        zoomIn: function () {
            var newStart = moment(this.options.start).add(this.options.zoomStep, 'days');
            var newEnd = moment(this.options.end).subtract(this.options.zoomStep, 'days');

            if (newStart.isBefore(newEnd)) {
                this.options.start = newStart.format('YYYY-MM-DD');
                this.options.end = newEnd.format('YYYY-MM-DD');
                this.reset().init();
            }
        },
        goRight: function () {
            this.options.start = moment(this.options.start).add(1, 'days').format('YYYY-MM-DD');
            this.options.end = moment(this.options.end).add(1, 'days').format('YYYY-MM-DD');
            this.reset().init();

        },
        goLeft: function () {
            this.options.start = moment(this.options.start).subtract(1, 'days').format('YYYY-MM-DD');
            this.options.end = moment(this.options.end).subtract(1, 'days').format('YYYY-MM-DD');

            this.reset().init();
        },
        reset: function () {
            this.$element.html('');
            this.removeEventHandlers();
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