import * as Match from "../model/MMatch.js";
import {player_positions} from "../model/MMatch.js";


class LineupForm {
    constructor(match) {
        this.el_lineup = $('#lineup-form');
        this.match = match;
        this.#generate_grid();
    }

    update() {

    }

    #generate_grid() {
        let last_line = '';
        let el_last_line = null;
        for(const pos in Match.player_positions) {
            if(last_line !== Match.player_positions[pos].line) {
                last_line = Match.player_positions[pos].line;
                el_last_line = $(`<div id="lineup-line-${last_line}" class="row d-flex justify-content-center g-1"></div>`).appendTo(this.el_lineup);
            }
            el_last_line.append(this.#generate_position(pos, Match.player_positions[pos].type));
        }
    }

    #generate_position(pos, pos_type) {
        return `<div class="col-2" style="font-size: 0.9em; font-weight: 200;">
                    <div class="card my-3">
                        <div class="card-header text-center px-1">
                            <select id="select-lineup-ord-${pos}" name="${pos}-ord"
                                    class="form-select form-select-sm border border-0 p-0 text-center"
                                    aria-label="select ${pos} order"
                                    style="color: #c7c7c7; background-color: #424242; outline: none;
                                    box-shadow: none; font-size: 0.9em;">
                                ${this.#generate_order_options(pos, pos_type)}
                            </select>
                        </div>
    
                        <div id="card-lineup-${pos}" class="card-body text-center px-1">
                            <select id="select-lineup-player-${pos}" name="${pos}-player"
                                    class="form-select form-select-sm border border-0 p-0 text-center"
                                    aria-label="select ${pos} player"
                                    style="color: #c7c7c7; background-color: #424242; outline: none;
                                    box-shadow: none; font-size: 0.9em;">
                                ${this.#generate_player_options(pos_type)}
                            </select>
                        </div>
    
<!--                        <div class="card-footer">-->
<!--                            FT-->
<!--                        </div>-->
                    </div>
                </div>`;
    }

    #generate_order_options(pos, pos_type) {
        let html_options = '';
        for(const ord of Match.player_positions[pos].orders) {
            html_options += `<option value="${ord}">${Match.position_to_str(pos_type, ord, 'compact')}</option>`;
        }
        return html_options;
    }

    #generate_player_options(pos_type, ord = 'n') {
        let html_options = '<option value="-1"></option>';
        for(const player_id in this.match.squad.players) {
            const player = this.match.squad.players[player_id];
            html_options += `<option value="${player_id}">${player.name.to_str('short')} (${player.positions_strength[pos_type][ord]})</option>`;
        }
        return html_options;
    }
}


export {LineupForm};
