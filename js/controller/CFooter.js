import * as Footer from "../view/VFooter.js"

function init() {
    let el_footer = $('#footer');
    $(Footer.html).appendTo(el_footer);
}

export {init};