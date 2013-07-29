//function fillCanvas() {
//    var canvas = $('#canvas');
//    var context = canvas.getContext('2d');
//    var spritesheet = new Image();
//    // TODO: draw line of black blocks
//}

$(document).ready(
    function() {
        // Toggle hide about info
        $('.about').hide();

        $('.title').click(
            function () {
                $('.about').toggle('slow');
            }
        );
    }
);
