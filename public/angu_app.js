        var TestApp = angular.module('TestApp', ['TestApp.controllers', 'smart-table']);
        var api_url = "http://localhost:8080";
        
        angular.module('TestApp.controllers', []).controller('testController',  ['$scope', '$http', function($scope, $http) {
            console.log($scope);
            $scope.loading = false;
            $scope.getData = function() {
                $scope.loading = true;
                $http.get(api_url + "/get_changes")
                    .then(function(response){
                    $scope.profile = response.data;
                    $scope.loading = false;
                });
            };
                

            $scope.deleteRow = function (param_name) {
                console.log(param_name);
                $http.get(api_url + "/tag_as_implemented?param_name=" + param_name)
                    .then(function(response){
                    $scope.profile = response.data;
                    $scope.loading = false;
                    });        
                
                    $http.get(api_url + "/get_changes")
                        .then(function(response){
                        $scope.profile = response.data;
                        $scope.loading = false;
                        $scope.display_records = response.data;
                    });

                console.log($scope);
                $scope.getData();
            };

            $scope.getData();
                        
        }]);