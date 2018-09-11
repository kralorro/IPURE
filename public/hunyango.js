var api_url = "http://localhost:8080";
var app = angular.module('myApp', ['smart-table', 'ui.filters']);
app.controller('myCtrl', function($scope, $http){
//var slists = ["EMM", "TERRA", "FASTDATA"];
//var mlists = [["calltype", "sharedplans"],
               // ["PGW_usage_type.parm", "DCB_sun_usage_type.parm"],
              //["POSTPAID.csv", "SMS_MERGER_usage_type.parm"]];
    
//$scope.lists = slists;
/**$scope.items = [];
$scope.getModules = function(){
    var key = $scope.lists.indexOf($scope.system_name);
    var nextOption = mlists[key];
    $scope.items = nextOption; 
    console.log($scope);
}**/

//main.html
$http.get(api_url + '/get_params')
    .then(function(response){
      $scope.head = true;
      $scope.footer = true;
      $scope.disprec = true;
      $scope.add = false;
      $scope.display_records = response.data;
      $scope.info = response.data;
});

//viewparams.html
$scope.getnames = function(param_name){
    $http.get(api_url + '/get_param_data?param_name=' + param_name)
    .then(function(response){
      $scope.get_records = response.data[0].data;
      $scope.info = response.data[0].data;
      $scope.footer = true;    
      $scope.head = true;
      $scope.disprec = false;
      $scope.records = true;
      $scope.add = true;
      $scope.paramname = param_name;
      console.log($scope);
    });
};

/*$scope.refresh = function (){
    location.reload();
};*/

//addnew
$scope.addnew = function(){
    $http.get(api_url + '/get_param_struct?param_name=' + $scope.paramname)
     .then(function(response){
        //$scope.newrecord = JSON.stringify(response.data, null, 4);
        $scope.newrecords = response.data;
        console.log($scope);
        $scope.disprec = false;
        $scope.records = false;
        $scope.head = false;
        $scope.txtarea = true;
        $scope.add = false;
        $scope.save = true;
});
};
    
//savenew
$scope.saveinfo = function(){
    $http.get(api_url + '/add_param?param_name=' + $scope.paramname + '&new_record=' + $scope.newrecord)
        .then(function(){
            console.log($scope);
            alert('Successfully added')
        $scope.txtarea = false;
        $scope.save = false;
        $scope.records = true;
        });          
    };
   
//};    
//$scope.submitbut = function(system_name){
   /* $http.get('http://10.31.81.213:3000/getname')
        .then(function(response){
        $scope.loading = true;
        $scope.head = true;
        $scope.info = response.data;
        //console.log($scope);
        $scope.loading = false;
    })

   // $scope.viewRecord = function(system_type){
   
        $http.get('http://10.31.81.213:3000/getname?param-name=sharedplans_calltype')
            .then(function(response){
                $scope.viewpar = response.data;
            });  
     //};
    */
});