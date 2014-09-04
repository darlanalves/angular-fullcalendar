var angular = require('angular');

var $module = angular.module('angular-fullcalendar', []);
$module.factory('FullCalendar', ['$locale', 'FullCalendarViewModes', 'FullCalendarLocale',
	function($locale, CalendarViewModes, CalendarLocale) {
		function Calendar($scope, $element, config) {
			var self = this;

			self.$scope = $scope;
			self.$element = $element;
			self.config = config;

			setTimeout(function() {
				var options = getCalendarOptions(self);
				if ($element.fullCalendar) $element.fullCalendar(options);
			});

			$scope.$on('view.change', function($e, view) {
				self.currentView = view;
			});
		}

		Calendar.prototype = {
			constructor: Calendar,

			/**
			 * Force render on calendar
			 */
			render: function() {
				callPlugin(this, 'render');
				return this;
			},

			/**
			 * Jump to next month/week/day
			 */
			next: function() {
				callPlugin(this, 'next');
				return this;
			},

			/**
			 * Jump to previous month/week/day
			 */
			prev: function() {
				callPlugin(this, 'prev');
				return this;
			},

			/**
			 * Jump to previous year
			 */
			prevYear: function() {
				callPlugin(this, 'prevYear');
				return this;
			},

			/**
			 * Jump to next year
			 */
			nextYear: function() {
				callPlugin(this, 'nextYear');
				return this;
			},

			/**
			 * Jump to current date (today)
			 */
			today: function() {
				callPlugin(this, 'today');
				return this;
			},

			/**
			 * Jump to a specific date. Either a Date or year/month/day values
			 *
			 * @param {Date|Number} date/year		Date object or year
			 * @param {Number} [month]				Month (zero-based!)
			 * @param {Number} [day]				Day number
			 */
			goTo: function(year, month, day) {
				callPlugin(this, 'gotoDate', year, month, day);
				return this;
			},

			/**
			 * Adds a single event to calendar
			 * @param {Object} event 			Event data
			 * @param {Boolean} [stick=false]	Make the event 'sticky', it won't disappear on page change or refresh
			 */
			addEvent: function(event, stick) {
				callPlugin(this, 'renderEvent', event, !!stick);
				return this;
			},

			/**
			 * Removes an event from calendar
			 * @param {Object|Number}	Event object or event id
			 */
			removeEvent: function(event) {
				var eventId = (angular.isObject(event) && event.id) ? event.id : Number(event);
				callPlugin(this, 'removeEvents', eventId);
				return this;
			},

			updateEvent: function(event) {
				this.removeEvent(event);
				this.addEvent(event);
			},

			/**
			 * Removes all events from calendar
			 */
			clear: function() {
				callPlugin(this, 'removeEvents');
				return this;
			},

			/**
			 * Rerenders all events on the calendar
			 */
			refresh: function() {
				callPlugin(this, 'rerenderEvents');
				return this;
			},

			/**
			 * Changes calendar view mode
			 * @param {String} view
			 */
			changeView: function(mode) {
				this.mode = mode;
				callPlugin(this, 'changeView', mode);
				return this;
			},

			/**
			 * Select events in a date range
			 * @param {Date} startDate
			 * @param {Date} endDate
			 * @param {Boolean} allDay
			 */
			selectEvents: function(startDate, endDate, allDay) {
				callPlugin(this, 'select', startDate, endDate, allDay);
				return this;
			},

			unselect: function() {
				callPlugin(this, 'unselect');
				return this;
			},

			/**
			 * Sets a option value into plugin
			 * @param option
			 * @param value
			 * @return this
			 */
			setCalendarOption: function(option, value) {
				callPlugin(this, 'option', option, value);
				return this;
			},

			setEvents: function(events) {
				this.setCalendarOption('events', events);
				return this;
			},

			getCurrentView: function() {
				return this.currentView;
			}
		};

		var slice = Array.prototype.slice;

		function callPlugin() {
			var args = slice.call(arguments),
				instance = args.shift(),
				$element = instance.$element;

			return $element.fullCalendar.apply($element, args);
		}

		function getCalendarOptions(instance) {
			var options = angular.copy(defaultOptions),
				config = instance.config;

			// buttons to show on header
			if ('header' in config) {
				options.header = config.header;
			}

			// transforms models into JSON data
			if (config.transformFunction) {
				options.eventDataTransform = config.transformFunction;
			}

			var scopeEvents = new ScopeEvents(instance.$scope);

			// called everytime the plugin needs more data
			options.loading = scopeEvents.onLoadEvents;

			// i18n & locale options
			angular.extend(options, getLocaleOptions());

			// event drag/drop
			options.eventDragStart = scopeEvents.onEventDrag;
			options.eventDragStop = scopeEvents.onEventDragEnd;
			options.eventDrop = scopeEvents.onEventDrop;

			// called on day click
			options.dayClick = scopeEvents.onDayClick;

			options.eventClick = scopeEvents.onEventClick;
			options.eventMouseover = scopeEvents.onEventMouseOver;
			options.eventMouseout = scopeEvents.onEventMouseOut;
			options.eventResize = scopeEvents.onEventResize;

			// called whenever the view mode changes
			options.viewDisplay = scopeEvents.onViewDisplay;

			// called if user selects event range
			options.select = scopeEvents.onSelect;

			// called if user unselect events
			options.unselect = scopeEvents.onUnselect;

			// events can be edited
			options.editable = config.editable;

			options.unselectAuto = true;

			if ('selectable' in config) {
				options.selectable = config.selectable;
				options.selectHelper = true;
			}

			// view mode
			options.defaultView = config.mode;

			// first day
			options.firstDay = config.firstDay;

			options.eventAfterAllRender = config.onAfterAllRender;

			if ('events' in config) {
				options.events = config.events;
			}

			var sources = [];
			if (config.endpoint) {
				sources.push(config.endpoint);
			}

			var eventList = config.eventList;
			if (eventList) {
				if (angular.isArray(eventList)) {
					sources = sources.concat(eventList);
				} else {
					sources.push(eventList);
				}
			}

			if (angular.isFunction(config.eventLoader)) {
				sources.push(config.eventLoader);
			}

			// TODO do we need of loader functions support?
			// event sources: URLs, event array or functions
			options.eventSources = sources;

			return options;
		}

		angular.extend(Calendar.prototype, CalendarViewModes);

		/* 
			== Calendar Events ==
			onDayClick => click.day
			onEventClick => click.event
			onViewDisplay => view.change
			onSelect => event.select
			onUnselect => event.unselect
			onLoadEvents => event.load
			onEventDrag => event.drag
			onEventDragEnd => event.dragend
			onEventDrop => event.drop
			onEventMouseOut => event.mouseleave
			onEventMouseOver => event.mouseenter
			onEventResize => event.resize
			onAfterAllRender => render
		*/

		function ScopeEvents($scope) {
			function emit() {
				var args = arguments;

				if (!$scope.$$phase) {
					$scope.$apply(function() {
						$scope.$emit.apply($scope, args);
					});
				} else {
					$scope.$emit.apply($scope, args);
				}
			}

			return {
				onDayClick: function(date, allDay, jsEvent, view) {
					emit('click.day', date, allDay, jsEvent, view);
				},

				onEventClick: function(event, jsEvent, view) {
					emit('click.event', event.id, event, jsEvent, view);
				},

				onEventMouseOver: function(event, jsEvent, view) {
					emit('event.mouseenter', event.id, event, jsEvent, view);
				},

				onEventMouseOut: function(event, jsEvent, view) {
					emit('event.mouseleave', event.id, event, jsEvent, view);
				},

				onAfterAllRender: function(view) {
					emit('afterrender', view);
				},

				onViewDisplay: function(view) {
					emit('view.change', view);
				},

				onEventDrag: function(event) {
					emit('event.drag', event.id, event);
				},

				onEventDragEnd: function(event) {
					emit('event.dragend', event.id, event);
				},

				onEventDrop: function(eventObject, revert, jsEvent) {
					var oldDate = eventObject.start._i,
						newDate = eventObject.start._d;

					emit('event.drop', eventObject, revert, newDate, oldDate, jsEvent);
				},

				onEventResize: function(event, dayDelta, minuteDelta, revertFunc) {
					emit('event.resize', event.id, event, dayDelta, minuteDelta, revertFunc);
				},

				onSelect: function(startDate, endDate, allDay, jsEvent, view) {
					emit('select', startDate, endDate, allDay, jsEvent, view);
				},

				onUnselect: function(view, jsEvent) {
					emit('unselect', view, jsEvent);
				},

				onLoadEvents: function(isLoading, currentView) {
					emit('load', isLoading, currentView);
				}
			};
		}

		var defaultOptions = {
			/**
			 * True to hide weekends on calendar
			 * @cfg [hideWeekends=false]
			 */
			hideWeekends: false,

			/**
			 * The day each week begins. `0` for Sunday
			 * @cfg [firstDay=0]
			 */
			firstDay: 0,

			/**
			 * View mode
			 */
			mode: CalendarViewModes.MODE_MONTH,

			/**
			 * @cfg {Array|Object} events
			 *
			 * Array of JSON objects with event data.
			 * Each event has at least a `title` string and a `start` Date property
			 *
			 * Object with jQuery AJAX options, passed as config to $.ajax when new events need to be loaded
			 */
			events: false,

			/**
			 * @cfg {String} endpoint
			 * URL to fetch **JSON** event data. The GET url will have `start` and `end` parameters
			 * with UNIX timestamps of selected range
			 */
			endpoint: false,

			/**
			 * @cfg [editable=false]
			 * Whether the events can be edited or not
			 */
			editable: false,

			/**
			 * @cfg [selectable=false]
			 * Whether a date range can be selected
			 */
			selectable: false,

			/**
			 * Buttons to show on header. One of `title`, `prev`, `next`, `prevYear`, `nextYear`, `today`
			 * or view modes (month, basicWeek, basicDay, agendaWeek or agendaDay)
			 *
			 * Use SPACE to separate blocks, and COMMA to group toggles
			 *
			 * @cfg {Object} header
			 *
			 *		header = {
			 *			left: 'title',
			 *			center: 'prev,next',
			 *			right: 'today month,basicWeek,basicDay'
			 *		}
			 */
			header: {
				left: 'title',
				center: 'prev,next',
				right: 'today'
			}
		};

		function getDateFormat(format) {
			var re = /(m+?)|(d+?)|(y+?)|$/g,
				dateFormat = '',
				index = 0;

			format.replace(re, function(match, m, d, y, offset) {
				dateFormat += format.slice(index, offset);

				if (m) {
					dateFormat += 'MM';
				}

				if (d) {
					dateFormat += 'dd';
				}

				if (y) {
					dateFormat += 'yy';
				}

				index = offset + match.length;
			});

			return dateFormat;
		}

		/**
		 * @private
		 * Returns locale options to plugin (month names, day names...)
		 * @return {Object}
		 */
		function getLocaleOptions() {
			var dateFormat = getDateFormat($locale.DATETIME_FORMATS.shortDate);

			return {
				columnFormat: {
					month: 'ddd',
					week: dateFormat,
					day: 'dddd ' + dateFormat
				},

				monthNames: $locale.DATETIME_FORMATS.MONTH,
				dayNames: $locale.DATETIME_FORMATS.DAY,

				// generates short names based on $locale definitions
				monthNamesShort: $locale.DATETIME_FORMATS.SHORTMONTH,
				dayNamesShort: $locale.DATETIME_FORMATS.SHORTDAY,

				buttonText: {
					today: CalendarLocale.getLabel('today'),
					month: CalendarLocale.getLabel('month'),
					day: CalendarLocale.getLabel('day'),
					week: CalendarLocale.getLabel('week')
				}
			};
		}

		/**
		 * @event click.day
		 * Day cell clicked
		 * @param {Date} date
		 * @param {Boolean} allDay
		 * @param {Object} event
		 * @param {EventObject} jQEvent
		 */

		/**
		 * @event click.event
		 * Event clicked
		 * @param {Number} eventId
		 * @param {Object} eventData
		 * @param {EventObject} jQEvent
		 * @param {Object} view
		 */

		/**
		 * @event viewchange
		 * View mode has changed
		 * @param {Object} view
		 */

		/**
		 * @event select
		 * A date range was selected
		 * @param {Date} startDate
		 * @param {Date} endDate
		 * @param {Boolean} allDay
		 * @param {Object} jsEvent
		 * @param {Object} currentView
		 */

		/**
		 * @event unselect
		 * Date range unselected
		 * @param {Object} jsEvent
		 * @param {Object} currentView
		 */

		/**
		 * @event load
		 * Called whenever the plugins stars/stops loading data
		 */

		/**
		 * Called when user start drag event
		 * @event event.drag
		 * @param {Number} eventId
		 * @param {Object} eventData
		 */

		/**
		 * Called when user drops event, but before event change
		 * This event is always fired on event drop, even if event was not modified
		 * @event event.dragend
		 */

		/**
		 * @event event.resize
		 * Called when an event is resized
		 * @param eventId
		 * @param event
		 * @param dayDelta
		 * @param minuteDelta
		 * @param revertFunc
		 */

		/**
		 * Called when user drops an event
		 * @event event.drop
		 * @param {Number} eventId				Event id
		 * @param {Object} eventData			Event data
		 * @param {Number} dayDelta				# days changed
		 * @param {Number} minuteDelta			# minutes changes
		 * @param {Boolean} allDay				True to all-day event
		 * @param {Function} revertFunction		A function to revert drop if it was invalid
		 */

		return Calendar;
	}
]);
$module.factory('FullCalendarLocale', function() {
	var strings = {};

	function setValues(values) {
		if (!angular.isObject(values)) return;

		angular.forEach(values, function(value, key) {
			setValue(key, value);
		});
	}

	function setValue(key, value) {
		strings[key] = value;
	}

	function getValue(key) {
		return key ? strings[key] : strings;
	}

	return {
		getLabel: getValue,
		setLabels: setValues,
		setLabel: setValue
	};
});
$module.value('FullCalendarViewModes', {
	MODE_MONTH: 'month',
	MODE_BASIC_WEEK: 'basicWeek',
	MODE_BASIC_DAY: 'basicDay',
	MODE_AGENDA_WEEK: 'agendaWeek',
	MODE_AGENDA_DAY: 'agendaDay'
});

module.exports = $module;