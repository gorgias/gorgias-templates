// fetch template content from the extension
App.templates = function() {

    var load = function() {
        $.get(chrome.extension.getURL('pages/content.html'), function (data) {
            var vars = [
                'App.autocomplete.dialog.qaBtnTemplate',
                'App.autocomplete.dialog.qaBtnTooltip',
                'App.autocomplete.dialog.template',
                'App.autocomplete.dialog.liTemplate'
            ];

            for (var i in vars) {
                var v = vars[i];
                var start = data.indexOf(v);
                var end = data.lastIndexOf(v);
                // todo(@xarg): sorry the barbarian splitting, could have been done much better.
                App.autocomplete.dialog[v.split('.').slice(-1)] = data.slice(start + v.length + 3, end - 4);
            }

            window.postMessage({
                action: 'g-templates-loaded'
            }, '*');
        }, 'html');
    };

    return {
        load: load
    };
}();