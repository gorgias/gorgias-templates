gqApp.controller('OptionsCtrl', function($scope, QuicktextService, SettingsService, ProfileService) {
    $scope.quicktexts = [];
    $scope.tags = [];
    $scope.filterTags = [];

    QuicktextService.quicktexts().then(function(response){
        $scope.quicktexts = response; 
    }); 

    QuicktextService.allTags().then(function(response){
        $scope.tags = response;
    });

    $scope.profile = ProfileService;
    $scope.settings = SettingsService;

    $scope.sidebarHidden = SettingsService.get('sidebarHidden');
    $scope.tabcompleteEnabled = SettingsService.get('tabcompleteEnabled');
    $scope.autocompleteEnabled = SettingsService.get('autocompleteEnabled');

    $scope.$on('$routeChangeSuccess', function () {
        $("[data-toggle=tooltip]").tooltip();
        $("[data-toggle=popover").popover();
    }); 

    // Show the form for adding a new quicktext or creating one
    $scope.showForm = function(id){
        var defaults = {
            'id': '', 
            'key': '', 
            'subject': '', 
            'shortcut': '', 
            'title': '', 
            'tags': '', 
            'body': ''
        }; 
        if (!this.quicktext){ // new qt
            $scope.selectedQt = angular.copy(defaults);
        } else { // update qt
            QuicktextService.get(this.quicktext.id).then(function(r){
                $scope.selectedQt = angular.copy(r);
            });
        }

        $('.modal').modal();
        $('.modal').on('shown.bs.modal', function () { //put focus on the first text input
            $(this).find('input[type=text]:first').focus();
        });
    };

    // Delete a quicktext. This operation should first delete from the localStorage
    // then it should imedially go to the service and delete on the server
    $scope.deleteQt = function(){
        QuicktextService.delete(this.quicktext.id);
        QuicktextService.quicktexts().then(function(r){$scope.quicktexts = r;}); 
    };

    // Delete all quicktexts. This will not delete the quicktexts on the server side
    $scope.deleteAll = function (){
        var r = confirm("Are you sure you want to delete all Quicktexts?\n\nNote: they will NOT be deleted from the sync server.");
        if (r === true){
            QuicktextService.deleteAll();
        }
        QuicktextService.quicktexts().then(function(r){$scope.quicktexts = r;}); 
    };

    // Save a quicktext, perform some checks before
    $scope.saveQt = function() {
        if (!$scope.selectedQt.title){
            alert("Please enter a Title");
            return false;
        }

        if (!$scope.selectedQt.body){
            alert("Please enter a Quicktext Template");
            return false;
        }
        if ($scope.selectedQt.id) {
            QuicktextService.update($scope.selectedQt);
        } else {
            QuicktextService.create($scope.selectedQt);
        }
        // hide teh modal
        $('.modal').modal('hide');
        QuicktextService.quicktexts().then(function(r){$scope.quicktexts = r;}); 
    };

    $scope.toggleFilterTag = function(tag){
        var index = $scope.filterTags.indexOf(tag); 
        if (index === -1) {
            $scope.filterTags.push(tag);
        } else {
            $scope.filterTags.splice(index, 1); // remove from tags
        }
    };

    $scope.toggleSidebar = function(){
        $scope.sidebarHidden = !$scope.sidebarHidden; 
        // put in settings
        SettingsService.set('sidebarHidden', $scope.sidebarHidden);
    };
});
