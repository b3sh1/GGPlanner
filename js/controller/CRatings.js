import * as Match from "../model/MMatch.js";
import * as Player from "../model/MPlayer.js";
import {constraint_val} from "../utils.js";


class Ratings {
    constructor(match) {
        this.el_sector_ratings = $('#card-sector-ratings');
        this.el_indirect_free_kicks = $('#card-indirect-free-kicks');
        this.el_tactic = $('#card-tactic');
        this.el_hatstats = $('#card-hatstats');
        this.match = match;
    }

    reset(match) {
        this.match = match;
        this.update();
    }

    update() {
        this.#write_sector_ratings();
        this.#write_hatstats();
        this.#write_idf();
    }

    #write_sector_ratings() {
        let html = `
            <table class="w-auto table table-sm table-hover table-borderless">
                <thead>
                </thead>
                <tbody>
                    ${this.#generate_sector_ratings_tbody()}
                </tbody>
            </table>`;
        this.el_sector_ratings.html(html);
    }

    #generate_sector_ratings_tbody() {
        let html = '';
        for(const sector in Match.sectors) {
            html += generate_row(Match.sectors[sector].name, this.match.sector_ratings[sector], 'skill', 'extended');
        }
        return html;
    }

    #write_hatstats() {
        let html = `
            <table class="w-auto table table-sm table-hover table-borderless">
                <thead>
                </thead>
                <tbody>
                    ${this.#generate_hatstats_tbody()}
                </tbody>
            </table>`;
        this.el_hatstats.html(html);
    }

    #generate_hatstats_tbody() {
        let html = '';
        for(const sector in Match.hatstats_sectors) {
            html += generate_row(Match.hatstats_sectors[sector].name, this.match.hatstats[sector], null, 'basic');
        }
        return html;
    }

    // indirect free kicks
    #write_idf() {
        let html = `
            <table class="w-auto table table-sm table-hover table-borderless">
                <thead>
                </thead>
                <tbody>
                    ${this.#generate_idf_tbody()}
                </tbody>
            </table>`;
        this.el_indirect_free_kicks.html(html);
    }

    #generate_idf_tbody() {
        let html = '';
        for(const sector in this.match.indirect_free_kicks) {
            html += generate_row(Match.hatstats_sectors[sector].name, this.match.indirect_free_kicks[sector], 'skill', 'extended');
        }
        return html;
    }
}


function generate_row(label, val, type, mode) {
    let decorated_lvl = decorate_lvl(val, type, mode);
    return `
        <tr>
            <th scope="row">${label}:</th>
            <td>${decorated_lvl}</td>
        </tr>`;
}


function decorate_lvl(lvl, type, mode='basic') {
    if(mode === 'basic') {
        return lvl;
    }
    let lvl_key = Math.trunc(lvl);
    lvl_key = constraint_val(lvl_key, 0, 20);
    if(type in Player.levels && lvl_key in Player.levels[type]) {
        if (mode === 'extended' && ('bg_color' in Player.levels[type][lvl_key])) {
            return `<span class='badge' style='font-size: .9em; color: ${Player.levels[type][lvl_key].txt_color}; 
            background-color: ${Player.levels[type][lvl_key].bg_color}'>${Player.levels[type][lvl_key].name} (${lvl})</span>`;
        }
    }
    return lvl;
}


export {Ratings};