
# multi-timeline.js
## Visualisation and management of multiple timelines

![Example visualisation](./examples/example.png)

### Demo

See [https://offline-gmbh.github.io/multi-timeline.js/](https://offline-gmbh.github.io/multi-timeline.js/)

### Install it

Install it via bower

    bower install multi-timeline --save
    
or download `multi-timeline.min.js` and `multi-timeline.min.css` manually.
 
Include [`jquery.js`](http://jquery.com/), [`moment.js`](http://momentjs.com/) and `multi-timeline.js`:

    <script src="//code.jquery.com/jquery-1.11.2.min.js"></script>
    <script src="//cdnjs.cloudflare.com/ajax/libs/moment.js/2.9.0/moment.min.js"></script>
    <script src="../dest/multi-timeline.min.js"></script>
    
Include `multi-timeline.min.css`: 

    <link rel="stylesheet" href="../dest/multi-timeline.min.css"/>

Create the root element that holds your timelines:

    <div class="multi-timeline"></div>
    
### Initalize it

    $('.multi-timeline').multiTimeline({
        data: [
            {
                title: 'Entry',
                start: '2015-02-22',
                end:   '2015-02-24'
            },{
                title: 'Another Entry',
                start: '2015-02-23',
                end:   '2015-02-28'
            }
      ]
    });
    
### Configuration

These are possible config values. Shown are defaults.

    $('.multi-timeline').multiTimeline({
        start:            '2015-02-21',             // Start of the timeline. Default is today -7 days
        end:              '2015-03-04',             // End of the timeline. Default is today +7 days
        zoom:             5,                        // Initial zoom level. 
        zoomStep:         1,                        // Number of days added before `start` and after `end` when zooming   
        zoomOutControl:   $('.zoom-out'),           // Element to trigger zoomOut on click
        zoomInControl:    $('.zoom-in'),            // Element to trigger zoomIn on click
        goRightControl:   $('.go-right'),           // Element to trigger goRight on click
        goLeftControl:    $('.go-left'),            // Element to trigger goLeft on click
        maxLabelCount:    20,                       // Max count of x-axis labels (lower it if your labels overlap)
        timelineSpacing:  30,                       // Vertical margin in pixels between two timelines 
        xAxisDateFormat:  'DD/MM',                  // x-axis date format (moment.js format)
         
        markerDateFormat: 'YYYY-MM-DD',             // Date format for start and end markers (moment.js format) 
                                                    // set to false to disable markers completely
                                                      
        mousewheelPan:    true,                     // Pan timeline on scroll
        mousewheelZoom:   true,                     // Zoom timeline on ctrl + scroll
        
        gridPrecision:    15,                       // In minutes, time gets rounded on drag
        allDraggable:     true,                     // Makes all timelines draggable (editable)
                                                    // to make only certain timelines draggable
                                                    // set to false and use the `draggable` key in 
                                                    // your timeline data object
        allResizeable:     true,                    // Makes all timelines resizeable (editable)
                                                    // to make only certain timelines resizeable
                                                    // set to false and use the `resizeable` key in 
                                                    // your timeline data object
                                                    
        onZoomChange:     function(newZoom) {       // Executed when zoom changes
        },
        onTimelineClick:  function(event, data) {   // Executed when a timeline is clicked. Receives js event and
        },                                          // data specified in `data`

        onDragEnd:  function(element, timeline) {   // Executed when a timeline has been dragged
        },
        onResizeEnd:  function(element, timeline) { // Executed when a timeline has been resized
        },
        onEdit:  function(element, timeline) {      // Executed when a timeline has been dragged or resized
        },
        data: []                                    // Timeline data (see below)
    });
    
### Timeline data

Each timeline is specified as an object and can receive the following attributes. All attributes are optional.
 
    {
        title:  'Title of your timeline',   
        start:  '2015-02-22 18:00:00',      // ISO_8601 date (with or without time)     
        end:    '2015-02-24',               // ISO_8601 date (with or without time)
        color:  '#f00',                     // background-color, is set via inline style-attribute
        class:  'important',                // Additional class for .tl-timeline elements
        zIndex: 10,                         // z-index for this timeline (to manage overlaps)
        
        layer: 0,                           // Each timeline is on it's own layer (always one higher than the one 
                                            // before). If you set a specific layer, it's possible for two 
                                            // timelines to share the same layer.
                                            
        draggable: true                     // Use when `allDraggable` is set to `false` 
                                            // makes this specific timeline draggable
                                            
        resizeable: true                    // Use when `allResizeable` is set to `false` 
                                            // makes this specific timeline resizeable
                    
    }
    
If the `start` or `end` attributes are not specified, the timeline becomes infinite in corresponding direction.

#### Get new data after modification

You can use the `getData` method to gain access to the new data of timelines. Use the `onDragEnd` event to
stay up to date:

    var timeline = $('.multi-timeline').multiTimeline({
        // Get modified data
        onDragEnd: function(element, timeline) {
            console.log(timeline.getData());
        }
    });

### External controls

You can specifiy elements to trigger certain events:

    zoomOutControl: $('.zoom-out')     // Zooms out 1 zoomStep on click
    zoomInControl:  $('.zoom-in')      // Zooms in 1 zoomStep on click
    goRightControl: $('.go-right')     // Pans the timeline to the right on click
    goLeftControl:  $('.go-left')      // Pans the timeline to the left on click
    
#### External zoom slider

Use the `onZoomChange` event to update a range-input. Use the `setZoom()` method to update the zoom level of
your timeline:

    <input type="range" min="0" max="40" value="5" class="js-set-zoom">
    <script>
    var timeline = $('.multi-timeline').multiTimeline({
        // Update slider on zoom change
        onZoomChange: function(newZoom) {
            $('.js-set-zoom').val(newZoom);
        }
    });
    
    // Set zoom on change
    $('.js-set-zoom').on('change', function() {
        timeline.data('multiTimeline').setZoom(this.value);
    });
    </script>