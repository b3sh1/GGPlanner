import * as Player from "../model/MPlayer.js";
import {round2, capitalize_first} from "../utils.js";
import {Icons} from "../view/VIcons.js";

function html(player) {
    let html = '';

    let tb_left = `
        <table class="table table-sm table-hover table-borderless">
            <thead>
            </thead>
            <tbody>
                ${generate_left_tbody(player)}
            </tbody>
        </table>`;

    let tb_right = `
        <table class="table table-sm table-hover table-borderless">
            <thead>
            </thead>
            <tbody>
                ${generate_right_tbody(player)}
            </tbody>
        </table>`;

    html = `
        <div class='row'>
            <div class="col">
                ${tb_left}
            </div>
            <div class="col">
                 ${tb_right}
            </div>
        </div>`;
    return html;
}

function generate_left_tbody(player) {
    let tbody = '';
    for(const attr in Player.attributes) {
        if(Player.attributes[attr].tb_exp_left) {
            tbody += generate_row(player, attr);
        }
    }
    return tbody;
}

function generate_right_tbody(player) {
    let tbody = '';
    for(const attr in Player.attributes) {
        if(Player.attributes[attr].tb_exp_right) {
            tbody += generate_row(player, attr);
        }
    }
    tbody += `
            <tr class="tr-player-strength" tabindex="0" data-mdb-html="true" data-mdb-toggle="popover" data-mdb-trigger="focus"
                data-mdb-content="${player.strength_on_positions_to_str()}">
                    <th scope="row">Best position:</th>
                    <td>${player.best_position_to_str()}</td>
            </tr>`;
    return tbody;
}

function generate_row(player, attr) {
    let decorated_attr = decorate_attr(player[attr], Player.attributes[attr].type, attr, 'extended');
    return `
        <tr>
            <th scope="row">${Player.attributes[attr].name}:</th>
            <td>${decorated_attr}</td>
        </tr>`;
}

function decorate_attr(lvl, type, attr, mode='compact') {
    lvl = round2(lvl);
    let lvl_key = Math.trunc(lvl);
    if(type in Player.levels && lvl_key in Player.levels[type]) {
        if(mode === 'compact' && ('bg_color' in Player.levels[type][lvl_key])) {
            return `<span class='badge' style='color: ${Player.levels[type][lvl_key].txt_color}; 
            background-color: ${Player.levels[type][lvl_key].bg_color}'>${lvl}</span>`;
        }
        if(mode === 'extended' && ('bg_color' in Player.levels[type][lvl_key])) {
            return `<span class='badge' style='font-size: .9em; color: ${Player.levels[type][lvl_key].txt_color}; 
            background-color: ${Player.levels[type][lvl_key].bg_color}'>${Player.levels[type][lvl_key].name} (${lvl})</span>`;
        }
        lvl = decorate_icon(lvl, type);
    } else {
        if(attr === 'wage') {
            let w_wage = lvl;
            let w_foreign_wage = Math.trunc(lvl * 1.2);
            let s_wage = lvl * 16;
            let s_foreign_wage = w_foreign_wage * 16;
            return `${w_foreign_wage.toLocaleString()} € <span style="color: #aaaaaa">(${w_wage.toLocaleString()} €)</span>/week<br/>
                    ${s_foreign_wage.toLocaleString()} € <span style="color: #aaaaaa">(${s_wage.toLocaleString()} €)</span>/season`;
        }
        if(attr === 'tsi') {
            let w_wage = lvl;
            let w_foreign_wage = Math.trunc(lvl * 1.2);
            let s_wage = lvl * 16;
            let s_foreign_wage = w_foreign_wage * 16;
            return `${lvl.toLocaleString()}`;
        }
    }
    return lvl;
}

function decorate_icon(lvl, type) {
    let lvl_key = Math.trunc(lvl);
    if('icon' in Player.levels[type][lvl_key] && Player.levels[type][lvl_key].icon)
    {
        return `${Icons[type][lvl_key]} ${capitalize_first(Player.levels[type][lvl_key].name)}`;
    }
    // fallback
    return lvl;
}

export {html};