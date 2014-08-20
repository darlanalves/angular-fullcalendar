$module.factory('CalendarLocale', function() {
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