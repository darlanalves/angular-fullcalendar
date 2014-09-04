var jQuery = window.jQuery = function(e) {
	if (this instanceof jQuery === false) {
		return new jQuery(e);
	}

	this[0] = e;
	this.length = 1;


};

jQuery.fn = jQuery.prototype;

jQuery.fn.fullCalendar = function() {};