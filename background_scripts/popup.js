$(document).ready(function(){
    $("body").addClass('ispopup');
    $("#quicktexts-table").addClass("table-hover");
    $('#quicktexts-table tr').click(function(e){
        // A quicktext item was clicked. Insert it into the compose area
        var key = $(this).attr("key").split("qt-")[1];
        insertQuicktext(key);
    });

    $(document).keydown(function(e){
        var current = $('#quicktexts-table tbody tr.active:not(.hide)');
        if (current.length == 0){
            // find the first non-hidden element and make it active
            $('#quicktexts-table tbody tr:not(.hide):first').addClass('active');
            return;
        }

        var next = null;
        if (e.keyCode == 13) { // enter
            var key = current.attr("key").split("qt-")[1];
            insertQuicktext(key);
            return;
        } else if (e.keyCode == 38) { // up arrow
            next = $(current.prevAll("tr:not(.hide)")[0]);
        } else if (e.keyCode == 40) { // down arrow
            next = $(current.nextAll("tr:not(.hide)")[0]);
        } else {
            return;
        }

        if (next && next.length && !next.hasClass("hide")){
            current.removeClass('active');
            next.addClass('active');

            // scroll to the active item
            var scrollContainer = $("#quicktexts-table-container");
            scrollContainer.scrollTop(
                next.offset().top - scrollContainer.offset().top + scrollContainer.scrollTop()
            );
        }
    });
});

// Insert quicktext into compose area
function insertQuicktext(key){
    console.log(key);
}
