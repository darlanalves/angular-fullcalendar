describe('FullCalendar object constructor', function() {
	beforeEach(module('angular-fullcalendar'));

	describe('interacting with fullcalendar navigation API method', function() {
		var element, $element, $scope, FullCalendar;
		beforeEach(inject(function($rootScope, _FullCalendar_) {
			$scope = $rootScope.$new();
			element = document.createElement('div');
			$element = jQuery(element);
			FullCalendar = _FullCalendar_;
		}));

		function testNavigationMethod(methodName) {
			it('"' + methodName + '()"', function() {
				var calendar = new FullCalendar($scope, $element, {}),
					navSpy = spyOn(jQuery.fn, 'fullCalendar').andCallThrough();

				expect(typeof calendar[methodName]).toBe('function');
				calendar[methodName]();
				expect(navSpy).toHaveBeenCalledWith(methodName);
			});
		}

		testNavigationMethod('next');
		testNavigationMethod('prev');
		testNavigationMethod('nextYear');
		testNavigationMethod('prevYear');
		testNavigationMethod('today');
		testNavigationMethod('render');

		it('goTo()', function() {
			var calendar = new FullCalendar($scope, $element, {}),
				gotoSpy = spyOn(jQuery.fn, 'fullCalendar').andCallThrough(),
				year = 2014,
				month = 2,
				day = 1;

			expect(typeof calendar.goTo).toBe('function');
			calendar.goTo(year, month, day);
			expect(gotoSpy).toHaveBeenCalledWith('gotoDate', year, month, day);
		});
	});

	describe('changing the events into calendar:', function() {

		function testAddEvent() {
			var element, $element, $scope, calendar;

			inject(function($rootScope, FullCalendar) {
				$scope = $rootScope.$new();
				element = document.createElement('div');
				$element = jQuery(element);
				calendar = new FullCalendar($scope, $element, {});
			});

			var addEventSpy = spyOn(jQuery.fn, 'fullCalendar').andCallThrough(),
				eventObj = {};

			expect(typeof calendar.addEvent).toBe('function');
			calendar.addEvent(eventObj, false);
			expect(addEventSpy).toHaveBeenCalledWith('renderEvent', eventObj, false);
		}

		function testRemoveEvent(event) {
			var element, $element, $scope, calendar;

			inject(function($rootScope, FullCalendar) {
				$scope = $rootScope.$new();
				element = document.createElement('div');
				$element = jQuery(element);
				calendar = new FullCalendar($scope, $element, {});
			});

			var removeEventSpy = spyOn(jQuery.fn, 'fullCalendar').andCallThrough(),
				// either an event object or a number are valid parameters
				eventId = angular.isObject(event) ? event.id : event;

			expect(typeof calendar.removeEvent).toBe('function');
			calendar.removeEvent(event);
			expect(removeEventSpy).toHaveBeenCalledWith('removeEvents', eventId);
		}

		it('addEvent(eventObj, bStick)', function() {
			testAddEvent();
		});

		it('removeEvent(eventObject)', function() {
			testRemoveEvent({
				id: 123
			});
		});

		it('removeEvent(eventId)', function() {
			testRemoveEvent(456);
		});

		it('updateEvent(eventObj)', function() {
			var element, $element, $scope, calendar;

			inject(function($rootScope, FullCalendar) {
				$scope = $rootScope.$new();
				element = document.createElement('div');
				$element = jQuery(element);
				calendar = new FullCalendar($scope, $element, {});

				var calendarSpy = spyOn(jQuery.fn, 'fullCalendar').andCallThrough(),
					eventObj = {
						id: 123
					};

				expect(typeof calendar.updateEvent).toBe('function');

				calendar.updateEvent(eventObj);
				expect(calendarSpy.calls.length).toBe(2);

				var addCallArgs = calendarSpy.calls.pop().args,
					removeCallArgs = calendarSpy.calls.pop().args;

				// remove the current event: the plugin only needs of our event id
				expect(angular.equals(removeCallArgs, ['removeEvents', eventObj.id])).toBe(true);

				// adds the event again, passing the object to render
				expect(angular.equals(addCallArgs, ['renderEvent', eventObj, false])).toBe(true);
			});
		});
	});
});