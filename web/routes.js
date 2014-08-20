$module.config(['$stateProvider', 'CalendarViewModes',
	function($stateProvider, CalendarViewModes) {
		var states = {
			'index': {
				url: '',
				templateUrl: '/layout.html',
				controller: 'LayoutController'
			},

			'index.home': {
				url: '/hello',
				templateUrl: '/home.html',
				controller: 'HomeController'
			},

			'index.month-view': {
				url: '/views/month',
				data: {
					mode: CalendarViewModes.MODE_MONTH
				}
			}
		};

		angular.forEach(states, function(config, name) {
			$stateProvider.state(name, config);
		});
	}
]);