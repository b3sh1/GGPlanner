import * as Header from "../view/VHeader.js"

function init() {
    let el_header = $('#header');
    $(Header.html).appendTo(el_header);
}

export {init};