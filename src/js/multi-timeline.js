;
(function ($, window, document, undefined) {

    var pluginName = "multiTimeline",
        defaults = {
            start: moment().subtract(7, 'days').format('YYYY-MM-DD'),
            end: moment().add(7, 'days').format('YYYY-MM-DD'),
            dateFormat: 'DD/MM',
            timelineSpacing: 30,
            zoomStep: 1,
            zoom: 5,
            maxLabelCount: 20,
            infinity: '9999-12-31',
            dawn: '0000-01-01',
            data: [],
            useMousewheel: true,
            onTimelineClick: function (event, data) {
            },
            onZoomChange: function (newZoom) {
            },
            zoomInControl: null,
            zoomOutControl: null,
            goLeftControl: null,
            goRightControl: null
        };

    function multiTimeline(element, options) {

        this.element = element;
        this.$element = $(element);
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
        this._zoom = 5;
        this._layerCount = 0;

        this.init();

        if (this.options.zoom != 5) {
            this.setZoom(this.options.zoom);
        }

        return this;

    }

    multiTimeline.prototype = {

        init: function () {

            if (this.options.start === null || this.options.end === null) {
                console.error('multi-timeline.js: start or end date is missing!');
                return false;
            }

            this._startMoment = moment(this.options.start);
            this._endMoment = moment(this.options.end);

            if (!this._endMoment.isAfter(this._startMoment)) {
                console.error('multi-timline.js: end date has to be a date after start date!');
                return false;
            }

            this._daysCount = this.getDuration(this._startMoment, this._endMoment);
            this._percentagePerDay = 100 / (this._daysCount + 1);

            this._timelineCount = this.options.data.length;

            this
                .createStructure()
                .addTimelines()
                .addEventHandlers()
                .setWrapperDimensions();
        },

        createStructure: function () {

            this.$element.addClass('tl-wrapper');
            this.addMarks();

            return this;
        },

        addMarks: function () {

            var current = this._startMoment;
            var end = this._endMoment.add(1, 'day');

            var $time = $('<ul class="tl-time">');
            var timeUnitCount = -1;
            var label = '';

            while (!current.isSame(end)) {
                timeUnitCount++;
                current = current.add(1, 'day');
                label = current;

                if (this._daysCount > 10 // If there are more than 10 days
                    && timeUnitCount % Math.round(this._daysCount / this.options.maxLabelCount) !== 0 // write only every nth date to prevent overlap
                ) {
                    label = '';
                }
                var isToday = current.isSame(new Date(), "day");
                this.addTimeUnit($time, label, (timeUnitCount + 1), isToday);

            }
            $time.appendTo(this.$element);
        },

        addTimeUnit: function ($time, label, position, isToday) {
            if (moment.isMoment(label)) {
                label = label.format(this.options.dateFormat);
            }
            var $unit = $('<li class="tl-time__unit">')
                .html(label)
                .css({left: (position * this._percentagePerDay) + '%'})
                .append('<span>');

            if (isToday) {
                $unit.addClass('is-today');
            }
            $unit.appendTo($time);
        },

        getDuration: function (from, to) {
            var duration = moment.duration(to.diff(from));
            return duration.asDays();
        },

        addTimelines: function () {
            var that = this;
            var currentLayer = 0;

            $(this.options.data).each(function () {
                var dataEntry = this;

                if (dataEntry.end == undefined) {
                    dataEntry.end = that.options.infinity;
                }

                if (dataEntry.start == undefined) {
                    dataEntry.start = that.options.dawn;
                }

                var duration = that.getDuration(moment(dataEntry.start), moment(dataEntry.end));
                var startOffset = that.getDuration(moment(that.options.start), moment(dataEntry.start));

                var useLayer;
                if (dataEntry.layer === undefined) {
                    useLayer = currentLayer;
                    currentLayer++;
                } else {
                    useLayer = dataEntry.layer;
                }

                // Check if timline overflows wrapper
                var tlOverflowLeft = '', tlOverflowRight = '';
                if (startOffset < 0) {
                    duration = duration + startOffset;
                    startOffset = 0;
                    tlOverflowLeft = 'tl-overflow-left';
                }
                var width = duration * that._percentagePerDay;
                if ((startOffset + duration) > that._daysCount + 1) {
                    tlOverflowRight = 'tl-overflow-right';
                    width = 100;
                }
                var left = startOffset * that._percentagePerDay;
                if (startOffset > that._daysCount + 1) {
                    left = 100;
                }
                var visibility = (duration < 0) ? 'hidden' : 'visible';
                var title = (dataEntry.title !== undefined) ? dataEntry.title : '&nbsp;';

                // Add Timeline
                $('<div class="tl-timeline">')
                    .html('<div class="tl-timeline__title">' + title + '</div>')
                    .css({
                        'width': width + '%',
                        'left': left + '%',
                        'visibility': visibility,
                        'bottom': (useLayer * that.options.timelineSpacing) + 20 + 'px',
                        'background-color': (dataEntry.color !== undefined) ? dataEntry.color : null,
                        'z-index': (dataEntry.zIndex !== undefined) ? dataEntry.zIndex : 10
                    })
                    .addClass(tlOverflowLeft + ' ' + tlOverflowRight + ' ' + ((dataEntry.class !== undefined) ? dataEntry.class : '' ))
                    .attr({"data-startOffset": startOffset, "data-duration": duration, "title": title})
                    .on('click', function (event) {
                        that.options.onTimelineClick(event, dataEntry);
                    })
                    .prependTo(that.$element);

            });
            this._layerCount = currentLayer;
            return this;
        },

        setWrapperDimensions: function () {
            var timelineHeight = parseInt(this.$element.find('.tl-timeline:first').outerHeight());
            var timelineCount = this.$element.find('.tl-timeline').length || 1;

            this.$element.css('height', timelineHeight + (timelineCount * this.options.timelineSpacing));
        },

        addEventHandlers: function () {
            var that = this;
            if (this.options.zoomInControl !== null) {
                this.options.zoomInControl.on('click', function (e) {
                    that.zoomIn();
                    e.preventDefault()
                })
            }
            if (this.options.zoomOutControl !== null) {
                this.options.zoomOutControl.on('click', function (e) {
                    that.zoomOut();
                    e.preventDefault()
                })
            }
            if (this.options.goRightControl !== null) {
                this.options.goRightControl.on('click', function (e) {
                    that.goRight();
                    e.preventDefault()
                })
            }
            if (this.options.goLeftControl !== null) {
                this.options.goLeftControl.on('click', function (e) {
                    that.goLeft();
                    e.preventDefault()
                })
            }

            if (this.options.useMousewheel === true) {
                this.$element.on('mousewheel DOMMouseScroll onmousewheel', function (e) {
                    var e = window.event || e;
                    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

                    if (e.ctrlKey === true) {
                        if (delta > 0) {
                            that.zoomIn();
                        } else {
                            that.zoomOut();
                        }
                    } else {
                        if (delta > 0) {
                            that.goLeft();
                        } else {
                            that.goRight();
                        }
                    }
                    e.preventDefault();
                });
            }

            var delta = {x: 0, y: 0},
                drag = {x: 0, y: 0, isDragging: false}

            that.$element.on('mousedown', '.tl-timeline', function (e) {

                if (drag.isDragging) return;
                drag.isDragging = true;

                var $drag = $(this);
                $('body').css('cursor', 'move');
                $drag.css('cursor', 'move');

                drag.x = e.pageX;
                drag.y = e.pageY;

                var $mouseMoveTargets = $(this).parents();
                $mouseMoveTargets.on("mousemove", function (e) {

                    delta.x = e.pageX - drag.x;
                    delta.y = e.pageY - drag.y;

                    var currentOffset = $drag.offset();
                    $drag.offset({
                        left: (currentOffset.left + delta.x)
                    });

                    drag.x = e.pageX;
                    drag.y = e.pageY;
                });

                $(document).on('mouseup', function () {

                    if (!drag.isDragging) return;

                    drag.isDragging = false;

                    $('body').css('cursor', 'default');
                    $drag.css('cursor', 'default');

                    var oldLeft = parseInt($drag.css('left'));
                    var percentLeft = 100 / parseInt(that.$element.innerWidth()) * oldLeft;
                    console.log(that.percentToDate(percentLeft));
                    $drag.css({'left': percentLeft + '%'});

                    $mouseMoveTargets.off('mousemove');
                    $(document).off('mouseup');
                });
                e.preventDefault(); // disable selection
            })

            return this;
        },

        percentToDate: function(percent) {
            var daysPercent = (this._daysCount + 1) / 100;
            var addSeconds = parseInt((percent * daysPercent) * 24 * 60 * 60);

            console.log(addSeconds);

            return moment(this.options.start).add(addSeconds, 'seconds').format('YYYY-MM-DD HH:MM:SS');
        },

        removeEventHandlers: function () {
            if (this.options.zoomInControl !== null) {
                this.options.zoomInControl.off('click');
            }
            if (this.options.zoomOutControl !== null) {
                this.options.zoomOutControl.off('click');
            }
            if (this.options.goRightControl !== null) {
                this.options.goRightControl.off('click');
            }
            if (this.options.goLeftControl !== null) {
                this.options.goLeftControl.off('click');
            }
            if (this.options.useMousewheel === true) {
                this.$element.off('mousewheel DOMMouseScroll onmousewheel');
            }
            $('body').off('mousedown', '.tl-timeline');
            return this;
        },
        setZoom: function (zoom) {
            if (zoom < 0) return;
            var diff = this._zoom - zoom;
            if (diff > 0) {
                this.zoomIn(diff);
            }
            else if (diff < 0) {
                this.zoomOut(Math.abs(diff));
            }
        },
        zoomOut: function (levels) {
            if (levels === undefined) {
                levels = 1;
            }
            this.options.start = moment(this.options.start).subtract(levels * this.options.zoomStep, 'days').format('YYYY-MM-DD');
            this.options.end = moment(this.options.end).add(levels * this.options.zoomStep, 'days').format('YYYY-MM-DD');

            this._zoom = this._zoom + levels;
            this.options.onZoomChange(this._zoom);

            this.reset().init();
        },
        zoomIn: function (levels) {
            if (levels === undefined) {
                levels = 1;
            }
            var newStart = moment(this.options.start).add(levels * this.options.zoomStep, 'days');
            var newEnd = moment(this.options.end).subtract(levels * this.options.zoomStep, 'days');

            if (newStart.isBefore(newEnd)) {
                this.options.start = newStart.format('YYYY-MM-DD');
                this.options.end = newEnd.format('YYYY-MM-DD');
                this._zoom = this._zoom - levels;
                this.options.onZoomChange(this._zoom);
                this.reset().init();
            }
        },
        goRight: function () {

            var jump = Math.round(this._daysCount / 12);

            this.options.start = moment(this.options.start).add(jump, 'days').format('YYYY-MM-DD');
            this.options.end = moment(this.options.end).add(jump, 'days').format('YYYY-MM-DD');
            this.reset().init();

        },
        goLeft: function () {

            var jump = Math.round(this._daysCount / 12);

            this.options.start = moment(this.options.start).subtract(jump, 'days').format('YYYY-MM-DD');
            this.options.end = moment(this.options.end).subtract(jump, 'days').format('YYYY-MM-DD');

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
            if (!$.data(this, pluginName)) {
                $.data(this, pluginName,
                    new multiTimeline(this, options));
            }
            return this;
        });
    };

})(jQuery, window, document);