(function ($, window, document, undefined) {

    var pluginName = "multiTimeline",
        defaults = {
            start: moment().subtract(7, 'days').format('YYYY-MM-DD'),
            end: moment().add(7, 'days').format('YYYY-MM-DD'),
            xAxisDateFormat: 'DD/MM',
            xAxisUnit: 'days',
            markerDateFormat: 'YYYY-MM-DD HH:mm',
            timelineSpacing: 30,
            zoomStep: 1,
            zoom: 5,
            flatten: false,
            maxLabelCount: 20,
            infinity: '9999-12-31',
            dawn: '0000-01-01',
            data: [],
            mousewheelPan: true,
            mousewheelZoom: true,
            allDraggable: true,
            allResizeable: true,
            gridPrecision: 15,
            onTimelineClick: function (event, data) {
            },
            onZoomChange: function (newZoom) {
            },
            onDragEnd: function (element, timeline) {
            },
            onResizeEnd: function (element, timeline) {
            },
            onEdit: function (element, timeline) {
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
        this._dragging = false;
        this._highestLayer = 1;
        this._layerUsage = [];

        this.init();

        if (this.options.zoom != 5) {
            this.setZoom(this.options.zoom);
        }

        return this;

    }

    multiTimeline.prototype = {

        SECONDS_PER_DAY : 60 * 60 * 24,
        DAYS_PER_WEEK   : 7,

        init: function () {

            if (this.options.start === null || this.options.end === null) {
                console.error('multi-timeline.js: start or end date is missing!');
                return false;
            }

            this._startMoment = moment(this.options.start);
            this._endMoment = moment(this.options.end);

            if ( ! this._endMoment.isAfter(this._startMoment)) {
                console.error('multi-timline.js: end date has to be a date after start date!');
                return false;
            }

            this._secondsCount      = this.getDuration(this._startMoment, this._endMoment);
            this._daysCount         = this._secondsCount / this.SECONDS_PER_DAY;
            this._weeksCount        = this._daysCount / this.DAYS_PER_WEEK;
            this._percentagePerDay  = 100 / (this._daysCount + 1);
            this._percentagePerWeek = 100 / (this._weeksCount + 1);

            this._unitCount      = this.options.xAxisUnit === 'days' ? this._daysCount : this._weeksCount;
            this._unitPercentage = this.options.xAxisUnit === 'days' ? this._percentagePerDay : this._percentagePerWeek;

            this._timelineCount = this.options.data.length;

            this
                .createStructure()
                .addTimelines()
                .addEventHandlers()
                .setWrapperDimensions()
                .setReady();
        },

        setReady: function () {
            this.$element.addClass('is-ready');
            return this;
        },

        createStructure: function () {

            this.$element.addClass('tl-wrapper');
            this.addMarks();

            return this;
        },

        addMarks: function () {

            var unit = this.options.xAxisUnit === 'days' ? 'day' : 'week';

            var current = this._startMoment;
            var end = this._endMoment.add(1, 'day');

            var $time = $('<ul class="tl-time">');
            var timeUnitCount = -1;
            var label = '';

            while ( ! current.isAfter(end, unit)) {
                timeUnitCount++;
                current = current.add(1, unit);
                label = current;

                // If there are more than 10 days
                // write only every nth date to prevent overlap
                if (this._unitCount > 10 && timeUnitCount % Math.round(this._unitCount / this.options.maxLabelCount) !== 0) {
                    label = '';
                }
                var isToday = current.isSame(new Date(), unit);
                this.addTimeUnit($time, label, (timeUnitCount + 1), isToday);

            }
            $time.appendTo(this.$element);
        },

        addTimeUnit: function ($time, label, position, isToday) {
            if (moment.isMoment(label)) {
                label = label.format(this.options.xAxisDateFormat);
            }

            var $unit = $('<li class="tl-time__unit">')
                .html(label)
                .css({left: (position * this._unitPercentage) + '%'})
                .append('<span>');

            if (isToday) {
                $unit.addClass('is-today');
            }
            $unit.appendTo($time);
        },

        getDuration: function (from, to) {
            var duration = moment.duration(to.diff(from));
            return duration.asSeconds();
        },

        getDraggingStatus: function () {
            return this._dragging;
        },

        addTimelines: function () {
            var that = this;
            var currentLayer = 0;

            $(this.options.data).each(function (key) {
                this.key = key;
                that.addTimeline(this, currentLayer);
            });
            return this;
        },

        addTimeline: function(dataEntry) {

            var that = this;

            var toMouseOut;
            var classes = [];
            var useLayer;

            dataEntry = this.handleStartAndEndDates(dataEntry);

            var isInfinite = {
                start: dataEntry.start == this.options.dawn,
                end: dataEntry.end == this.options.infinity
            };

            if (dataEntry.layer === undefined) {

                useLayer = this.options.flatten !== true
                                ? this._layerCount
                                : this.getNextFreeLayer(moment(dataEntry.start), moment(dataEntry.end));

                this._layerCount++;
                this.options.data[dataEntry.key].layer = useLayer;
            } else {
                useLayer = dataEntry.layer;
            }

            this._layerUsage.push({layer: useLayer, start: moment(dataEntry.start), end: moment(dataEntry.end)});

            dataEntry.hasPhases = false;

            if(dataEntry.hasOwnProperty('phases') && dataEntry.phases.length > 0) {

                classes.push('tl-has-phases');
                this.options.allDraggable = false;
                this.options.allResizeable = false;

                dataEntry.hasPhases = true;

                dataEntry.phases.forEach(function(phase) {
                    phase.key = dataEntry.key;
                    phase.layer = useLayer;
                    that.addTimeline(phase);
                });

            }

            var durationIn        = {};

            durationIn.seconds    = this.getDuration(moment(dataEntry.start), moment(dataEntry.end));
            durationIn.days       = durationIn.seconds / this.SECONDS_PER_DAY;
            durationIn.weeks      = durationIn.days / this.DAYS_PER_WEEK;

            if(durationIn.seconds === 0) {
                classes.push('tl-point');
            }

            var startOffsetIn     = {};

            startOffsetIn.seconds = this.getDuration(moment(this.options.start), moment(dataEntry.start));
            startOffsetIn.days    = startOffsetIn.seconds / this.SECONDS_PER_DAY;
            startOffsetIn.weeks   = startOffsetIn.days / this.DAYS_PER_WEEK;

            // Check if timeline overflows wrapper
            var tlOverflowLeft = '', tlOverflowRight = '';
            if (startOffsetIn.seconds < 0) {
                durationIn.seconds  = durationIn.seconds + startOffsetIn.seconds;
                durationIn.days     = durationIn.seconds / this.SECONDS_PER_DAY;
                durationIn.weeks    = durationIn.days / this.DAYS_PER_WEEK;
                startOffsetIn.days  = startOffsetIn.seconds = 0;

                classes.push('tl-overflow-left');
            }

            var width = durationIn[this.options.xAxisUnit] * this._unitPercentage;
            if(width > 100) width = 100;

            if ((startOffsetIn.days + durationIn.days) > this._daysCount + 1) {
                classes.push('tl-overflow-right');
            }

            var left = startOffsetIn[this.options.xAxisUnit] * this._unitPercentage;
            if(left > 100) left = 100;

            var visibility = (durationIn.seconds < 0) ? 'hidden' : 'visible';

            dataEntry.title = (dataEntry.title !== undefined) ? dataEntry.title : '';

            if(dataEntry.class !== undefined) classes.push(dataEntry.class);
            if($.isArray(dataEntry.color))    classes.push('has-color-bars');

            var styles = {
                'width'           : width + '%',
                'left'            : left + '%',
                'visibility'      : visibility,
                'bottom'          : (useLayer * this.options.timelineSpacing) + 20 + 'px',
                'z-index'         : (dataEntry.zIndex !== undefined) ? dataEntry.zIndex : 10,
                'background-color': dataEntry.color !== undefined && ! $.isArray(dataEntry.color) ? dataEntry.color : null
            };

            // Add Timeline
            var $timeline = $('<div class="tl-timeline">')
                .html(this.getTimelineHtml(dataEntry))
                .css(styles)
                .addClass(classes.join(' '))
                .attr({
                    "data-tl-start-offset": startOffsetIn.seconds,
                    "data-tl-duration": durationIn.seconds,
                    "data-tl-start": dataEntry.start,
                    "data-tl-end": dataEntry.end,
                    "data-tl-identifier": dataEntry.key,
                    "data-tl-layer": useLayer,
                    "title": dataEntry.title
                })
                .on('click', function (event) {
                    if (that._dragging === true) return;
                    that.options.onTimelineClick(event, dataEntry);
                })
                .on('mouseenter', function () {
                    clearTimeout(toMouseOut);
                    $(this).addClass('is-hovered');
                })
                .on('mouseleave', function () {
                    var $this = $(this);
                    if ($this.hasClass('is-dragging')) {
                        return;
                    }
                    toMouseOut = setTimeout(function () {
                        $this.removeClass('is-hovered');
                    }, 100);
                });

            if (this.options.allDraggable === true || dataEntry.draggable === true) {
                $timeline.addClass('is-draggable');
            }
            if (this.options.allResizeable === true || dataEntry.resizeable === true) {
                $timeline.addClass('is-resizeable');
            }
            if (isInfinite.start === true) {
                $timeline.addClass('is-infinite-start');
            }
            if (isInfinite.end === true) {
                $timeline.addClass('is-infinite-end');
            }

            $timeline.prependTo(this.$element);

            if (parseInt($timeline.outerWidth()) < 140) {
                $timeline.find('.tl-timeline__date-end').remove();
            }
        },

        getNextFreeLayer: function(start, end) {
            var freeLayer = 0;

            this._layerUsage.forEach(function(usage) {

                if(usage.layer != freeLayer) return;

                if(
                    (
                           (usage.start.isAfter(start) || usage.start.isSame(start))
                        && (usage.start.isBefore(end)  || usage.start.isSame(end))
                    ) || (
                           (usage.end.isAfter(start) || usage.end.isSame(start))
                        && (usage.end.isBefore(end)  || usage.end.isSame(end))
                    )
                ) {
                    freeLayer++;
                }
                return false;
            });

            return freeLayer;
        },


        handleStartAndEndDates: function(dataEntry) {

            if(dataEntry.hasOwnProperty('phases') && dataEntry.phases.length > 0) {
                dataEntry.start = dataEntry.phases[0].start;
                dataEntry.end = dataEntry.phases[dataEntry.phases.length - 1].end;
            }

            if (dataEntry.end === undefined || dataEntry.end == this.options.infinity) {
                dataEntry.end = this.options.infinity;
            }

            if (dataEntry.start === undefined || dataEntry.start == this.options.dawn) {
                dataEntry.start = this.options.dawn;
            }

            return dataEntry;
        },

        getTimelineHtml: function (dataEntry) {

            var html = '';

            if(dataEntry.hasPhases) {
                return '<div class="tl-timeline__phase-line"></div>';
            }

            // Resize Handler
            html += '<div class="tl-timeline__resizer tl-timeline__resizer-start"></div>';
            html += '<div class="tl-timeline__resizer tl-timeline__resizer-end"></div>';

            // Color Bars
            if($.isArray(dataEntry.color)) {
                dataEntry.color.forEach(function(color) {
                    html += '<div class="tl-timeline__color-bar" style="background-color: ' + color + '"></div>';
                });
            }

            // Start Marker
            if (dataEntry.start != this.options.dawn && this.options.markerDateFormat !== false) {
                html += '<div class="tl-timeline__date-marker tl-timeline__date-start">';
                html += moment(dataEntry.start).format(this.options.markerDateFormat);
                html += '</div>';
            }

            // Title
            html += '<div class="tl-timeline__title">' + dataEntry.title + '</div>';

            // End Marker
            if (dataEntry.end != this.options.infinity && this.options.markerDateFormat !== false) {
                html += '<div class="tl-timeline__date-marker tl-timeline__date-end">';
                html += moment(dataEntry.end).format(this.options.markerDateFormat);
                html += '</div>';
            }

            return html;
        },

        setWrapperDimensions: function () {
            var that = this;
            var timelineHeight = 0;
            var outerWidth = this.$element.outerWidth();

            this.$element.find('.tl-timeline').each(function () {
                var left = 100 / outerWidth * parseInt($(this).css('left'));

                // only look for timelines that are currently on screen
                if (left > 0 && left < 100) {
                    var layer = $(this).data('tl-layer');
                    if (layer > that._highestLayer)
                        that._highestLayer = layer;

                    if (timelineHeight === 0)
                        that.timelineHeight = parseInt($(this).outerHeight());
                }
            });

            // space for two layers
            var totalHeight = timelineHeight + ((this._highestLayer + 2) * this.options.timelineSpacing);

            // add space for markers
            totalHeight = totalHeight + 5;

            this.$element
                .css('height', totalHeight)
                .find('.tl-time__unit span').css({'height': totalHeight, 'top': totalHeight * (-1)});

            return this;
        },

        addEventHandlers: function () {
            var that = this;
            if (this.options.zoomInControl !== null) {
                this.options.zoomInControl.on('click', function (e) {
                    e.preventDefault();
                    that.zoomIn();
                });
            }
            if (this.options.zoomOutControl !== null) {
                this.options.zoomOutControl.on('click', function (e) {
                    e.preventDefault();
                    that.zoomOut();
                });
            }
            if (this.options.goRightControl !== null) {
                this.options.goRightControl.on('click', function (e) {
                    e.preventDefault();
                    that.goRight();
                });
            }
            if (this.options.goLeftControl !== null) {
                this.options.goLeftControl.on('click', function (e) {
                    e.preventDefault();
                    that.goLeft();
                });
            }

            if (this.options.mousewheelPan === true || this.options.mousewheelZoom === true) {
                this.$element.on('mousewheel DOMMouseScroll onmousewheel', function (e) {
                    e = window.event || e;
                    var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));

                    if (e.ctrlKey === true && that.options.mousewheelZoom === true) {
                        if (delta > 0) {
                            that.zoomIn();
                        } else {
                            that.zoomOut();
                        }
                    } else if (that.options.mousewheelPan === true) {
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
                drag = {x: 0, y: 0, isDragging: false};

            that.$element.on('mousedown', '.tl-timeline', function (e) {

                var mode = false;
                if ($(this).hasClass('is-draggable')) {
                    mode = 'move';
                }
                if ($(this).hasClass('is-resizeable')) {
                    if ($(e.target).hasClass('tl-timeline__resizer-start') || $(this).hasClass('is-infinite-end')) {
                        mode = 'w-resize';
                    } else if ($(e.target).hasClass('tl-timeline__resizer-end') || $(this).hasClass('is-infinite-start')) {
                        mode = 'e-resize';
                    }
                }

                if (mode === false) {
                    return;
                }

                if (drag.isDragging) return;
                drag.isDragging = true;

                var $drag = $(this);


                var startDrag = {x: e.pageX, y: e.pageY};
                var totalDelta = {x: 0, y: 0};

                drag.x = e.pageX;
                drag.y = e.pageY;

                var $mouseMoveTargets = $(this).parents();

                $mouseMoveTargets.on("mousemove", function (e) {

                    delta.x = e.pageX - drag.x;
                    delta.y = e.pageY - drag.y;

                    var currentLayer = parseInt($drag.data('tl-layer'));

                    totalDelta.x = startDrag.x - e.pageX;
                    totalDelta.y = startDrag.y - e.pageY;

                    // Drag thresold
                    if (Math.abs(totalDelta.x) < 5 && Math.abs(totalDelta.y) < 5) return;

                    that.$element.find('.tl-timeline').css('z-index', 1000);
                    $('body').css('cursor', mode);

                    $drag
                        .css({'z-index': 1050, 'cursor': mode})
                        .addClass('is-hovered is-dragging');


                    that._dragging = true;

                    if (totalDelta.y > that.options.timelineSpacing) {

                        $drag.css('bottom', ((currentLayer + 1) * that.options.timelineSpacing) + 20 + 'px');
                        $drag.data('tl-layer', currentLayer + 1);

                        startDrag.y = e.pageY;
                        that.setWrapperDimensions();

                    } else if (totalDelta.y < that.options.timelineSpacing * (-1)) {

                        var useForSpacing = currentLayer - 1;
                        if (useForSpacing < 0) {
                            useForSpacing = 0;
                            currentLayer = 1;
                        }

                        $drag.css('bottom', (useForSpacing * that.options.timelineSpacing) + 20 + 'px');
                        $drag.data('tl-layer', currentLayer - 1);

                        startDrag.y = e.pageY;
                        that.setWrapperDimensions();
                    }

                    that.options.data[$drag.data('tl-identifier')].layer = this._layerCount;

                    var currentOffset = $drag.offset();
                    var newLeft = (currentOffset.left + delta.x);
                    var dragWidth = parseFloat($drag.css('width'));

                    switch (mode) {
                        case 'move':
                            $drag.offset({
                                left: newLeft
                            });
                            break;
                        case 'w-resize':
                            if (dragWidth - delta.x < 50) return;
                            $drag
                                .offset({left: newLeft})
                                .css('width', dragWidth - delta.x);
                            break;
                        case 'e-resize':
                            if (dragWidth + delta.x < 50) return;
                            $drag.css('width', dragWidth + delta.x);
                            break;
                    }

                    var pxLeft = parseInt($drag.css('left'));
                    var percentLeft = 100 / parseInt(that.$element.innerWidth()) * pxLeft;

                    that.updateDates($drag, that.percentToDate(percentLeft));

                    drag.x = e.pageX;
                    drag.y = e.pageY;
                });

                $(document).on('mouseup', function () {

                    if (!drag.isDragging) return;
                    drag.isDragging = false;

                    var oldLeft = parseInt($drag.css('left'));
                    var percentLeft = 100 / parseInt(that.$element.innerWidth()) * oldLeft;

                    $('body').css('cursor', 'default');
                    $drag
                        .css({'left': percentLeft + '%', cursor: 'default'})
                        .removeClass('is-dragging is-hovered');

                    $mouseMoveTargets.off('mousemove');
                    $(document).off('mouseup');

                    that._highestLayer = 1;
                    that.setWrapperDimensions();

                    if (mode == 'move') {
                        that.options.onDragEnd($drag, that);
                    } else {
                        that.options.onResizeEnd($drag, that);
                    }
                    if (that._dragging) {
                        that.options.onEdit($drag, that);
                    }

                    // Wait for click event to be fired, then reset
                    setTimeout(function () {
                        that._dragging = false;
                    }, 40);

                });
                e.preventDefault(); // disable selection
            });

            return this;
        },

        updateDates: function ($element, startDate) {

            if ($element.hasClass('is-infinite-start')) {
                startDate = moment(this.options.dawn);
            }

            var pxLeft = parseInt($element.css('left'));
            var percentLeft = 100 / parseInt(this.$element.innerWidth()) * (pxLeft + $element.outerWidth());

            var endDate = ($element.hasClass('is-infinite-end')) ? moment(this.options.infinity) : this.percentToDate(percentLeft);


            // Update data objects
            this.options.data[$element.data('tl-identifier')].start = startDate.format('YYYY-MM-DD HH:mm:ss');
            this.options.data[$element.data('tl-identifier')].end = endDate.format('YYYY-MM-DD HH:mm:ss');

            if ($element.hasClass('is-infinite-start')) {
                delete this.options.data[$element.data('tl-identifier')].start;
            }
            if ($element.hasClass('is-infinite-end')) {
                delete this.options.data[$element.data('tl-identifier')].end;
            }

            $element.data('tl-duration', this.getDuration(startDate, endDate));

            // Update markers
            if (this.options.markerDateFormat !== false) {
                $element.find('.tl-timeline__date-start').html(startDate.format(this.options.markerDateFormat));
            }
            if (this.options.markerDateFormat !== false) {
                $element.find('.tl-timeline__date-end').html(endDate.format(this.options.markerDateFormat));
            }

        },

        percentToDate: function (percent) {
            var secondsPer = {
                days:  this.SECONDS_PER_DAY,
                weeks: this.SECONDS_PER_DAY * this.DAYS_PER_WEEK
            };
            var unitPercent = (this._unitCount + 1) / 100;
            var add = parseInt((percent * unitPercent) * secondsPer[this.options.xAxisUnit]);
            var date = moment(this.options.start).add(add, 'seconds');
            var minutes = date.get('minute');

            date.set('minute', Math.round(minutes / this.options.gridPrecision) * this.options.gridPrecision);
            date.set('second', 0);

            return date;
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
            if (this.options.mousewheelPan === true || this.options.mousewheelZoom === true) {
                this.$element.off('mousewheel DOMMouseScroll onmousewheel');
            }
            this.$element.off('mousedown', '.tl-timeline');
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
            if (levels === undefined) levels = 1;

            this.options.start = moment(this.options.start).subtract(levels * this.options.zoomStep, 'days').format('YYYY-MM-DD');
            this.options.end = moment(this.options.end).add(levels * this.options.zoomStep, 'days').format('YYYY-MM-DD');

            this._zoom = this._zoom + levels;
            this.options.onZoomChange(this._zoom);

            this.redraw();
        },

        zoomIn: function (levels) {
            if (levels === undefined) levels = 1;

            var newStart = moment(this.options.start).add(levels * this.options.zoomStep, 'days');
            var newEnd = moment(this.options.end).subtract(levels * this.options.zoomStep, 'days');

            if (newStart.isBefore(newEnd)) {
                this.options.start = newStart.format('YYYY-MM-DD');
                this.options.end = newEnd.format('YYYY-MM-DD');
                this._zoom = this._zoom - levels;
                this.options.onZoomChange(this._zoom);
                this.redraw();
            }
        },

        goRight: function () {

            var jump = Math.ceil(this._unitCount / 12);

            this.options.start = moment(this.options.start).add(jump, this.options.xAxisUnit).format('YYYY-MM-DD');
            this.options.end = moment(this.options.end).add(jump, this.options.xAxisUnit).format('YYYY-MM-DD');
            this.redraw();

        },

        goLeft: function () {

            var jump = Math.ceil(this._unitCount / 12);
            this.options.start = moment(this.options.start).subtract(jump, this.options.xAxisUnit).format('YYYY-MM-DD');
            this.options.end = moment(this.options.end).subtract(jump, this.options.xAxisUnit).format('YYYY-MM-DD');

            this.redraw();

        },

        reset: function () {
            this.$element.html('');
            this._layerCount = 0;
            this._layerUsage = [];
            this.removeEventHandlers();
            return this;
        },

        redraw: function () {
            this.reset().init();
        },

        getData: function () {
            return this.options.data;
        },

        setData: function (data) {
            this.options.data = data;
            this.redraw();
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
