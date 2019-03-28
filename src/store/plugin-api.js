// TODO current adapter
var _GORGIAS_API_PLUGIN = function () {
    var apiBaseURL = Config.apiBaseURL;

    // Settings
    var _localStorageSettings = {
        get: function(key, def, callback) {
            if (key in window.localStorage && window.localStorage[key] !== "") {
                return callback(JSON.parse(window.localStorage[key]));
            } else {
                if (!def) {
                    // return the default in the Settings
                    return callback(Settings.defaults[key]);
                } else {
                    // return the supplied default
                    return callback(def);
                }
            }
        },
        set: function(key, value, callback) {
            if (_.isEqual(value, Settings.defaults[key])) {
                return callback(this.clear(key));
            } else {
                window.localStorage[key] = JSON.stringify(value);
                return callback(window.localStorage[key]);
            }
        },
        clear: function(key) {
            return delete window.localStorage[key];
        }
    };

    var _chromeStorageSettings = {
        get: function(key, def, callback) {
            chrome.storage.sync.get(key, function(data) {
                if (
                    chrome.runtime.lastError ||
                    _.isEmpty(data)
                ) {
                    if (!def) {
                        return callback(Settings.defaults[key]);
                    } else {
                        return callback(def);
                    }
                } else {
                    return callback(data[key]);
                }
            });
        },
        set: function(key, value, callback) {
            var data = {};
            data[key] = value;

            // remove value/reset default
            if (typeof value === 'undefined') {
                chrome.storage.sync.remove(key, function() {
                    return callback(data);
                });
                return;
            }

            chrome.storage.sync.set(data, function() {
                chrome.storage.sync.get(key, function(data) {
                    return callback(data);
                });
            });
        }
    };

    var Settings = {
        get: function(key, def, callback) {
            if (chrome && chrome.storage) {
                return _chromeStorageSettings.get(key, def, callback);
            } else {
                return _localStorageSettings.get(key, def, callback);
            }
        },
        set: function(key, value, callback) {
            if (chrome && chrome.storage) {
                return _chromeStorageSettings.set(key, value, callback);
            } else {
                return _localStorageSettings.set(key, value, callback);
            }
        },
        defaults: {
            settings: {
                // settings for the settings view
                dialog: {
                    enabled: true,
                    shortcut: "ctrl+space", // shortcut that triggers the complete dialog
                    auto: false, //trigger automatically while typing - should be disabled cause it's annoying sometimes
                    delay: 1000, // if we want to trigger it automatically
                    limit: 100 // how many templates are shown in the dialog
                },
                qaBtn: {
                    enabled: true,
                    shownPostInstall: false,
                    caseSensitiveSearch: false,
                    fuzzySearch: true
                },
                keyboard: {
                    enabled: true,
                    shortcut: "tab"
                },
                stats: {
                    enabled: true // send anonymous statistics
                },
                blacklist: [],
                fields: {
                    tags: false,
                    subject: true
                },
                editor: {
                    enabled: true // new editor - enable for new users
                }
            },
            // refactor this into 'local' and 'remote'
            isLoggedIn: false,
            syncEnabled: false,
            words: 0,
            syncedWords: 0,
            lastStatsSync: null,
            lastSync: null,
            hints: {
                postInstall: true,
                subscribeHint: true
            }
        }
    };

    var getSettings = function (params) {
        return new Promise((resolve, reject) => {
            Settings.get(params.key, params.def, resolve);
        });
    };

    var setSettings = function (params) {
        return new Promise((resolve, reject) => {
            Settings.set(params.key, params.val, resolve);
        });
    };

    var getAccount = function (params) {
        return fetch(`${apiBaseURL}account`)
            .then((res) => res.json());
    };

    var setAccount = function (params) {
        return fetch(`${apiBaseURL}account`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        }).then((res) => res.json());
    };

    var getLoginInfo = function (params) {
        return fetch(`${apiBaseURL}login-info`)
            .then((res) => res.json());
    };

    return {
        getSettings: getSettings,
        setSettings: setSettings,

        getLoginInfo: getLoginInfo,
        getAccount: getAccount,
        setAccount: setAccount,
    };
}();
