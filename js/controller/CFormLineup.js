import * as Match from "../model/MMatch.js";


class LineupForm {
    constructor(match) {
        this.el_lineup = $('#lineup-form');
        this.match = match;
        this.#generate_grid();
    }

    read_player(pos) {
        const el_player_select = $(`#select-lineup-player-${pos}`);
        const player_id = el_player_select.val();
        this.match.update_player(pos, player_id);
    }

    read_order(pos) {
        const el_ord_select = $(`#select-lineup-ord-${pos}`);
        const order = el_ord_select.val();
        this.match.update_order(pos, order);
        this.update_select_options(pos, order);
    }

    update_select_options(pos, ord='n') {
        for(const player_id in this.match.squad.players) {
            const player = this.match.squad.players[player_id];
            const pos_type = Match.player_positions[pos].type;
            const el_option = $(`#option-lineup-player-${pos}-${player_id}`);
            if(el_option.length) {
                el_option.html(str_player_and_strength(player, pos_type, ord));
            } else {
                const el_player_select = $(`#select-lineup-player-${pos}`);
                el_player_select.append(this.#generate_player_option(player_id, pos, pos_type, ord));
            }
        }
    }

    update_all_select_options() {
        for(const pos in Match.player_positions) {
            this.update_select_options(pos);
        }
    }

    remove_player(player_id) {
        for(const pos in Match.player_positions) {
            const el_option = $(`#option-lineup-player-${pos}-${player_id}`);
            if(el_option.is(':selected')) {
                const el_player_select = $(`#select-lineup-player-${pos}`);
                el_player_select.val('-1').change();
            }
            el_option.remove();
        }
    }

    reset(match) {
        this.match = match;
        console.log(this.match.squad.players);
        for(const pos in Match.player_positions) {
            const el_player_select = $(`#select-lineup-player-${pos}`);
            const pos_type = Match.player_positions[pos].type;
            el_player_select.html(this.#generate_player_options(pos, pos_type));
        }
    }

    // remove_player(player_id) {
    //     for(const pos in Match.player_positions) {
    //         const el_option = $(`#option-lineup-player-${pos}-${player_id}`);
    //         const el_player_select = $(`#select-lineup-player-${pos}`);
    //         if(el_player_select.val() === player_id) {
    //             el_player_select.val('-1').change();
    //         }
    //         el_option.remove();
    //     }
    // }

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
                                    position="${pos}"
                                    class="select-lineup-ord form-select form-select-sm border border-0 p-0 text-center"
                                    aria-label="select ${pos} order"
                                    style="color: #c7c7c7; background-color: #424242; outline: none;
                                    box-shadow: none; font-size: 0.9em;">
                                ${this.#generate_order_options(pos, pos_type)}
                            </select>
                        </div>
    
                        <div id="card-lineup-${pos}" class="card-body text-center px-1">
                            <select id="select-lineup-player-${pos}" name="${pos}-player"
                                    position="${pos}"
                                    class="select-lineup-player form-select form-select-sm border border-0 p-0 text-center"
                                    aria-label="select ${pos} player"
                                    style="color: #c7c7c7; background-color: #424242; outline: none;
                                    box-shadow: none; font-size: 0.9em;">
                                ${this.#generate_player_options(pos, pos_type)}
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

    #generate_player_options(pos, pos_type, ord = 'n') {
        let html_options = '<option value="-1"></option>';
        for(const player_id in this.match.squad.players) {
            html_options += this.#generate_player_option(player_id, pos, pos_type, ord);
        }
        return html_options;
    }

    #generate_player_option(player_id, pos, pos_type, ord='n') {
        const player = this.match.squad.players[player_id];
        return `<option id="option-lineup-player-${pos}-${player_id}" value="${player_id}">
                    ${str_player_and_strength(player, pos_type, ord)}
                </option>`;
    }
}

function str_player_and_strength(player, pos_type, ord, mode='short') {
    return `${player.name.to_str(mode)} (${player.positions_strength[pos_type][ord]})`;
}


export {LineupForm};
