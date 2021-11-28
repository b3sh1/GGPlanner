import * as Player from "../model/MPlayer.js";
import {Icons} from "../view/VIcons.js";
import {round2} from "../utils.js";


// these two decoration types cannot be turned on simultaneously
const DECORATE_SKILLS = false;  // apply color badges according to skill lvl
const DECORATE_DIFF = true  // apply color badges according to diff in amount of trained skill lvl
const DECORATE_COLUMNS = false;  // apply cell colors according to skill lvl
const DECORATE_ICONS = true;  // put icons if attribute specifies it (e.q. specialties)


class ResultTable {
    constructor() {
        this.datatable = this.init_datatable();
    }

    init_datatable() {
        let tb_squad_header = [{title: 'id', width: 50}, {title: "Name", width: 300}, {title: "Age", width: 50}];
        for (let key in Player.attributes) {
            if (Player.attributes[key].tb_show) {
                tb_squad_header.push({title: key.toUpperCase()});
            }
        }
        this.dttb = $('#tb-result').DataTable({
            paging: false,
            searching: false,
            bInfo: false,
            order: [[0, "asc"]],
            columns: tb_squad_header,
            autoWidth: true,
            responsive: true,
            fixedHeader: false,
            columnDefs: [
                {
                    targets: [0],
                    visible: true,
                },
                {
                    targets: [1],
                    responsivePriority: 1,
                },
            ],
            rowCallback: function(row, data, index) {
                if(DECORATE_COLUMNS) {
                    ResultTable.#decorate_columns(row, data, tb_squad_header);
                }
            },
            createdRow: function (row, data, dataIndex) {
                $('td:nth-child(2)', row).css('min-width', '155px');
            },
        });
        $("#tb-result-loading-indicator").addClass('d-none');  // hide loading spinner
        return this.dttb;
    }

    load_data(init_squad, trained_squad) {
        for (let id in trained_squad.players) {
            this.append(init_squad.players[id], trained_squad.players[id], id);
        }
        this.datatable.draw();
        return this;
    }

    append(init_player, trained_player, id) {
        // write player to the table
        // name, age
        let row = [
            id,
            trained_player.name.to_str(),
            trained_player.age.to_str(),
        ];
        // other player attributes
        for (let attr in Player.attributes) {
            if (Player.attributes[attr].tb_show) {
                let skill_lvl = ResultTable.#decorate_skill(trained_player[attr], Player.attributes[attr].type);
                skill_lvl += ResultTable.#decorate_diff(trained_player[attr]-init_player[attr]);
                row.push(skill_lvl);
            }
        }
        this.datatable.row.add(row);
        return this;
    }

    delete(jq_row) {
        let player_id = this.get_id(jq_row);
        this.datatable.row(jq_row).remove();
        return player_id;
    }

    get_id(jq_row) {
        return this.datatable.row(jq_row).data()[0];
    }

    clear() {
        this.datatable.clear();
    }

    reload(init_squad, trained_squad) {
        this.clear();
        this.load_data(init_squad, trained_squad);
    }

    draw() {
        this.datatable.draw();
    }

    static #decorate_diff(lvl_diff, mode = 'badge') {
        if(DECORATE_DIFF) {
            lvl_diff = round2(lvl_diff);
            if(lvl_diff > 0){
                if(mode === 'simple') {
                    return ` (+${lvl_diff})`;
                }
                if(mode === 'badge') {
                    return ` <span class='badge bg-success'>+${lvl_diff}</span>`;
                }
            }
            if(lvl_diff < 0){
                if(mode === 'simple') {
                    return ` (${lvl_diff})`;
                }
                if(mode === 'badge') {
                    return ` <span class='badge bg-danger'>${lvl_diff}</span>`;
                }
            }
        }

        return "";
    }

    static #decorate_skill(lvl, type, mode='compact') {
        lvl = round2(lvl);
        let lvl_key = Math.trunc(lvl);
        if(DECORATE_SKILLS) {
            if(mode === 'compact' && ('bg_color' in Player.levels[type][lvl_key])) {
                return `<span class='badge' style='color: ${Player.levels[type][lvl_key].txt_color}; 
                background-color: ${Player.levels[type][lvl_key].bg_color}'>${lvl}</span>`
            }
            if(mode === 'extended' && ('bg_color' in Player.levels[type][lvl_key])) {
                return `<span class='badge' style='color: ${Player.levels[type][lvl_key].txt_color}; 
                background-color: ${Player.levels[type][lvl_key].bg_color}'>${Player.levels[type][lvl_key].name} (${lvl})</span>`
            }
        }
        if(DECORATE_ICONS) {
            return  ResultTable.#decorate_icon(lvl, type);
        }
        // fallback
        return lvl;
    }

    static #decorate_icon(lvl, type) {
        let lvl_key = Math.trunc(lvl);
        if('icon' in Player.levels[type][lvl_key] && Player.levels[type][lvl_key].icon)
        {
            return Icons[type][lvl_key];
        }
        // fallback
        return lvl;
    }

    static #decorate_columns(row, data, tb_squad_header) {
        for(let i=0; i<data.length; i++) {
            let lvl = Number.parseInt(data[i]);
            let attr = tb_squad_header[i].title.toLowerCase();
            if(attr in Player.attributes){
                let attr_type = Player.attributes[attr].type;
                let styles = {};
                if('bg_color' in Player.levels[attr_type][lvl]) {
                    styles = {
                        color: Player.levels[attr_type][lvl].txt_color,
                        backgroundColor : Player.levels[attr_type][lvl].bg_color,
                    }
                }
                $(row).find(`td:eq(${i})`).css(styles);
            }
        }
    }
}

export {ResultTable};