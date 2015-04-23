;
(function ($, window, document, undefined) {

    var pluginName = "multiTimeline",
        defaults = {
            start: moment().subtract(7, 'days').format('YYYY-MM-DD'),
            end: moment().add(7, 'days').format('YYYY-MM-DD'),
            xAxisDateFormat: 'DD/MM',
            markerDateFormat: 'YYYY-MM-DD HH:mm',
            timelineSpacing: 30,
            zoomStep: 1,
            zoom: 5,
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
        this._highestLayer = 1;

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

            this._secondsCount = this.getDuration(this._startMoment, this._endMoment);
            this._daysCount = this._secondsCount / 60 / 60 / 24;
            this._percentagePerDay = 100 / (this._daysCount + 1);

            this._timelineCount = this.options.data.length;

            this
                .createStructure()
                .addTimelines()
                .addEventHandlers()
                .setWrapperDimensions()
                .setReady()
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
                label = label.format(this.options.xAxisDateFormat);
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
            return duration.asSeconds();
        },

        addTimelines: function () {
            var that = this;
            var currentLayer = 0;

            $(this.options.data).each(function (key) {
                var toMouseOut;
                var isInfinite = {start: false, end: false};
                var dataEntry = this;

                if (dataEntry.end == undefined || dataEntry.end == that.options.infinity) {
                    isInfinite.end = true;
                    dataEntry.end = that.options.infinity;
                }
                if (dataEntry.start == undefined || dataEntry.start == that.options.dawn) {
                    isInfinite.start = true;
                    dataEntry.start = that.options.dawn;
                }

                var duration = that.getDuration(moment(dataEntry.start), moment(dataEntry.end));

                var durationInDays = duration / 60 / 60 / 24;
                var startOffset = that.getDuration(moment(that.options.start), moment(dataEntry.start));
                var startOffsetInDays = startOffset / 60 / 60 / 24;

                var useLayer;
                if (dataEntry.layer === undefined) {
                    useLayer = currentLayer;
                    currentLayer++;
                    that.options.data[key].layer = useLayer;
                } else {
                    useLayer = dataEntry.layer;
                }

                // Check if timeline overflows wrapper
                var tlOverflowLeft = '', tlOverflowRight = '';
                if (startOffset < 0) {
                    duration = duration + startOffset;
                    durationInDays = duration / 60 / 60 / 24;
                    startOffsetInDays = startOffset = 0;
                    tlOverflowLeft = 'tl-overflow-left';
                }
                var width = durationInDays * that._percentagePerDay;
                if ((startOffsetInDays + durationInDays) > that._daysCount + 1) {
                    tlOverflowRight = 'tl-overflow-right';
                    width = 100;
                }
                var left = startOffsetInDays * that._percentagePerDay;
                if ((startOffsetInDays) > (that._daysCount + 1)) {
                    left = 100;
                }
                var visibility = (duration < 0) ? 'hidden' : 'visible';

                dataEntry.title = (dataEntry.title !== undefined) ? dataEntry.title : '';

                // Add Timeline
                var $timeline = $('<div class="tl-timeline">')
                    .html(that.getTimelineHtml(dataEntry))
                    .css({
                        'width': width + '%',
                        'left': left + '%',
                        'visibility': visibility,
                        'bottom': (useLayer * that.options.timelineSpacing) + 20 + 'px',
                        'background-color': (dataEntry.color !== undefined) ? dataEntry.color : null,
                        'z-index': (dataEntry.zIndex !== undefined) ? dataEntry.zIndex : 10
                    })
                    .addClass(tlOverflowLeft + ' ' + tlOverflowRight + ' ' + ((dataEntry.class !== undefined) ? dataEntry.class : '' ))
                    .attr({
                        "data-tl-start-offset": startOffset,
                        "data-tl-duration": duration,
                        "data-tl-identifier": key,
                        "data-tl-layer": useLayer,
                        "title": dataEntry.title
                    })
                    .on('click', function (event) {
                        that.options.onTimelineClick(event, dataEntry);
                    }).on('mouseenter', function () {
                        clearTimeout(toMouseOut);
                        $(this).addClass('is-hovered');
                    }).on('mouseleave', function () {
                        var $this = $(this);
                        if ($this.hasClass('is-dragging')) {
                            return;
                        }
                        toMouseOut = setTimeout(function () {
                            $this.removeClass('is-hovered');
                        }, 100);
                    });

                if (that.options.allDraggable === true || dataEntry.draggable === true) {
                    $timeline.addClass('is-draggable');
                }
                if (that.options.allResizeable === true || dataEntry.resizeable === true) {
                    $timeline.addClass('is-resizeable');
                }
                if (isInfinite.start === true) {
                    $timeline.addClass('is-infinite-start');
                }
                if (isInfinite.end === true) {
                    $timeline.addClass('is-infinite-end');
                }

                $timeline.prependTo(that.$element);

                if (parseInt($timeline.outerWidth()) < 140) {
                    $timeline.find('.tl-timeline__date-end').remove();
                }

            });
            this._layerCount = currentLayer;
            return this;
        },

        getTimelineHtml: function (dataEntry) {

            var html = '';

            // Resize Hanlder
            html += '<div class="tl-timeline__resizer tl-timeline__resizer-start"></div>';
            html += '<div class="tl-timeline__resizer tl-timeline__resizer-end"></div>';

            // Start Marker
            if (dataEntry.start != this.options.dawn && this.options.markerDateFormat !== false) {
                html += '<div class="tl-timeline__date-marker tl-timeline__date-start">';
                html += moment(dataEntry.start).format(this.options.markerDateFormat)
                html += '</div>';
            }

            // Title
            html += '<div class="tl-timeline__title">' + dataEntry.title + '</div>'

            // End Marker
            if (dataEntry.end != this.options.infinity && this.options.markerDateFormat !== false) {
                html += '<div class="tl-timeline__date-marker tl-timeline__date-end">';
                html += moment(dataEntry.end).format(this.options.markerDateFormat);
                html += '</div>'
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

            if (this.options.mousewheelPan === true || this.options.mousewheelZoom === true) {
                this.$element.on('mousewheel DOMMouseScroll onmousewheel', function (e) {
                    var e = window.event || e;
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


                $('body').css('cursor', mode);
                that.$element.find('.tl-timeline').css('z-index', 1000);

                $drag
                    .css({'z-index': 1050, 'cursor': mode})
                    .addClass('is-hovered is-dragging');


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
                    if(Math.abs(totalDelta.x) < 5 && Math.abs(totalDelta.y) < 5) return;

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

                    that.options.data[$drag.data('tl-identifier')].layer = currentLayer;

                    var currentOffset = $drag.offset();
                    var newLeft = (currentOffset.left + delta.x)
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
                    that.options.onEdit($drag, that);

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
            var daysPercent = (this._daysCount + 1) / 100;
            var add = parseInt((percent * daysPercent) * 24 * 60 * 60);

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
            if (levels === undefined) {
                levels = 1;
            }
            this.options.start = moment(this.options.start).subtract(levels * this.options.zoomStep, 'days').format('YYYY-MM-DD');
            this.options.end = moment(this.options.end).add(levels * this.options.zoomStep, 'days').format('YYYY-MM-DD');

            this._zoom = this._zoom + levels;
            this.options.onZoomChange(this._zoom);

            this.redraw();
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
                this.redraw();
            }
        },
        goRight: function () {

            var jump = Math.ceil(this._daysCount / 12);

            this.options.start = moment(this.options.start).add(jump, 'days').format('YYYY-MM-DD');
            this.options.end = moment(this.options.end).add(jump, 'days').format('YYYY-MM-DD');
            this.redraw();

        },
        goLeft: function () {

            var jump = Math.ceil(this._daysCount / 12);
            this.options.start = moment(this.options.start).subtract(jump, 'days').format('YYYY-MM-DD');
            this.options.end = moment(this.options.end).subtract(jump, 'days').format('YYYY-MM-DD');

            this.redraw();

        },
        reset: function () {
            this.$element.html('');
            this.removeEventHandlers();
            return this;
        },
        redraw: function () {
            this.reset().init();
        },
        getData: function () {
            return this.options.data;
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