import { ng, idiom as lang, model, http, template } from 'entcore';
import { _ } from 'entcore';

import * as directives from '../directives';

const appController = ng.controller('ApplicationController', ['$scope', ($scope) => {
    template.open('main', 'applications');
    $scope.template = template;
    $scope.lang = lang;
    $scope.bookmarkedApps = model.me.bookmarkedApps;
    $scope.display = {};
    http().get('/applications-list').done(function(app){
        $scope.applications = _.filter(app.apps, function(app){
            return app.display !== false;
        });
        $scope.$apply();
    });

    $scope.addBookmark = function(prefix){
        const correspondingApp = _.findWhere(model.me.apps, { prefix });
        if (correspondingApp && !_.findWhere(model.me.bookmarkedApps, { prefix })) {
            model.me.bookmarkedApps.push(correspondingApp);
            $scope.$apply();
            http().putJson('/userbook/preference/apps', model.me.bookmarkedApps);
        }
    };

    $scope.removeBookmark = function(prefix){
        var correspondingApp = _.findWhere(model.me.bookmarkedApps, { prefix });
        if (correspondingApp){
            const itemIndex = model.me.bookmarkedApps.indexOf(correspondingApp);
            model.me.bookmarkedApps.splice(itemIndex, 1);
            $scope.$apply();
            http().putJson('/userbook/preference/apps', model.me.bookmarkedApps);
        }
    };

    $scope.filterBookmark = function(item){
        return _.findWhere($scope.bookmarkedApps, {name : item.name})
    }

    $scope.drag = function(item, event){
        event.dataTransfer.setData('application/json', JSON.stringify(item));
    };

    $scope.searchDisplayName = function(item){
        return !$scope.display.searchText ||
                lang.removeAccents(lang.translate(item.displayName)).toLowerCase().indexOf(
                    lang.removeAccents($scope.display.searchText).toLowerCase()
            ) !== -1;
    };

    $scope.order = function(app){
        return lang.translate(app.displayName);
    }
}]);

ng.controllers.push(appController);

for (let directive in directives) {
    ng.directives.push(directives[directive]);
}