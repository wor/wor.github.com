$(document).ready(
    function() {
        var email=reverse_str("if.iki@attaam.ase");
        var phone=reverse_str("297706414 853");
        $('#email, #email').each(
            function() {
                $(this)
                .attr('href', "mailto:" + email)
                .text(email);
            }
        );

        $('#phone').text("+" + phone);
    }
);
