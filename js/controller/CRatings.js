import * as Match from "../model/MMatch.js";


class Ratings {
    constructor(match) {
        this.el_sector_ratings = $('#card-sector-ratings');
        this.el_indirect_free_kicks = $('#card-indirect-free-kicks');
        this.el_tactic = $('#card-tactic');
        this.el_hatstats = $('#card-hatstats');
        this.match = match;
    }


}

function init() {
    const el_sector_ratings = $('#card-sector-ratings');
    let html = '';
    let last_line = '';
    let el_last_line = null;
    for(const pos in Match.player_positions) {
        if(last_line !== Match.player_positions[pos].line) {
            last_line = Match.player_positions[pos].line;
            el_last_line = $(`<div id="lineup-line-${last_line}" class="row d-flex justify-content-center g-1"></div>`).appendTo(el_lineup);
        }
        el_last_line.append(generate_position(Match.player_positions[pos].type));
    }
}


export {init};