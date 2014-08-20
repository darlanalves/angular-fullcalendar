(function(undefined){

var $module = angular.module('app-mock', ['app', 'ngMockE2E']);
$module.run(function($httpBackend) {
	$httpBackend.whenGET('/foo').respond(200, 'whoo');
});
}());