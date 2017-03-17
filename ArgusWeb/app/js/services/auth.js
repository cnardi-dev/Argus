angular.module('argus.services.auth', [])
.factory('Auth', ['$resource', '$location', 'CONFIG', 'growl', 'Storage', function ($resource, $location, CONFIG, growl, Storage) {
    var refreshPath = 'refresh';

    return {
        login: function (username, password) {
            var creds = {
                username: username,
                password: password
            };
            $resource(CONFIG.wsUrl + 'auth/login', {}, {}).save(creds, function (result) {
                Storage.set('user', result);

                //-------Token Based Authentication----------
                //save tokens
                Storage.set('accessToken', result.accessToken);
                Storage.set('refreshToken', result.refreshToken);


                var target = Storage.get('target');
                $location.path(target === null || target === '/login' ? '/' : target);
            }, function (error) {
                Storage.reset(); //not sure if reset  is good, cause it deletes user option preference too.
                growl.error('Login failed');
            });
        },
        logout: function () {
            Storage.reset(); //not sure if reset  is good, cause it deletes user option preference too.
            $resource(CONFIG.wsUrl + 'auth/logout', {}, {}).get({}, function (result) {
                growl.info('You are now logged out');
                //-------Token Based Authentication----------
                //remove token
                // Storage.clear('accessToken');
                // Storage.clear('refreshToken');

                $location.path('/login');
            }, function (error) {
                growl.error('Logout failed');
            });
        },
        setTarget: function (target) {
            Storage.set('target', target);
        },
        getTarget: function () {
            return Storage.get('target');
        },
        remoteUser: function () {
            return Storage.get('user');
        },
        getUsername: function() {
            var user = this.remoteUser();
            if (user) {
                return user.userName;
            } else {
                return null;
            }
        },
        isLoggedIn: function () {
            return this.remoteUser() !== null;
        },
        isPrivileged: function () {
            var user = this.remoteUser();
            return (user) ? user.privileged : null;
        },
        isDisabled: function (item) {
            var user = Storage.get('user');
            return !(user && (user.privileged || user.userName === item.ownerName));
        },
        getRefreshPath: function(){
            return refreshPath;
        },
        refreshToken: function(){
            var creds = {
                refreshToken: Storage.get('refreshToken')
            };
            return $resource(CONFIG.wsUrl + refreshPath, {}, {}).save(creds, function(data){
                Storage.set('accessToken', data.accessToken);
            }, function(error){
                growl.error(error);
            });
        }
    };
}]);