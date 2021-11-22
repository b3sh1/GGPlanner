import * as Player from "../model/MPlayer.js";
import {Icons} from "../view/VIcons.js";


// these two decoration types cannot be turned on simultaneously
const DECORATE_SKILLS = false;  // apply color badges according to skill lvl
const DECORATE_COLUMNS = false;  // apply cell colors according to skill lvl
const DECORATE_ICONS = true;  // put icons if attribute specifies it (e.q. specialties)


class SquadTable {
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
        tb_squad_header.push({title: "Edit", width: 155});
        this.dttb = $('#tb-squad').DataTable({
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
                {
                    targets: [-1],
                    orderable: false,
                    responsivePriority: 2,
                },
            ],
            rowCallback: function(row, data, index) {
                if(DECORATE_COLUMNS) {
                    for(let i=0; i<data.length; i++) {
                        let lvl = data[i];
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
            },
            createdRow: function (row, data, dataIndex) {
                $('td:last-child', row).css('min-width', '155px');
            },
        });
        $("#tb-loading-indicator").addClass('d-none');  // hide loading spinner
        return this.dttb;
    }

    load_data(squad) {
        for (let id in squad.players) {
            this.append(squad.players[id], id);
        }
        this.datatable.draw();
        return this;
    }

    append(player, id) {
        // write player to the table
        // name, age
        let row = [
            id,
            player.name.to_str(),
            player.age.to_str(),
        ];
        // other player attributes
        for (let attr in Player.attributes) {
            if (Player.attributes[attr].tb_show) {
                let skill_lvl = SquadTable.#decorate_skill(player[attr], Player.attributes[attr].type);
                row.push(skill_lvl);
            }
        }
        // edit buttons
        row.push('' +
            '<div style="font-size: .75em">' +
            '<button type="button" class="btn-delete-player btn btn-outline-info btn-sm ripple-surface me-1">' +
            '<i class="fas fa-times fa-lg"></i>' +
            '</button>' +
            '<button type="button" class="btn-clone-player btn btn-outline-info btn-sm ripple-surface me-1">' +
            '<i class="far fa-clone"></i>' +
            '</button>' +
            '<button type="button" class="btn-edit-player btn btn-outline-info btn-sm ripple-surface"' +
            ' data-mdb-toggle="modal" data-mdb-target="#modal-add-player">' +
            '<i class="fas fa-pencil-alt"></i>' +
            '</button>' +
            '</div>'
        );
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

    reload(squad) {
        this.clear();
        this.load_data(squad);
    }

    draw() {
        this.datatable.draw();
    }

    static #decorate_skill(lvl, type, mode='compact') {
        if(DECORATE_SKILLS) {
            if(mode === 'compact' && ('bg_color' in Player.levels[type][lvl])) {
                return `<span class='badge' style='color: ${Player.levels[type][lvl].txt_color}; 
                background-color: ${Player.levels[type][lvl].bg_color}'>${lvl}</span>`
            }
            if(mode === 'extended' && ('bg_color' in Player.levels[type][lvl])) {
                return `<span class='badge' style='color: ${Player.levels[type][lvl].txt_color}; 
                background-color: ${Player.levels[type][lvl].bg_color}'>${Player.levels[type][lvl].name} (${lvl})</span>`
            }
        }
        if(DECORATE_ICONS) {
            return  SquadTable.#decorate_icon(lvl, type);
        }
        // fallback
        return lvl;
    }

    static #decorate_icon(lvl, type) {
        if('icon' in Player.levels[type][lvl] && Player.levels[type][lvl].icon)
        {
            return Icons[type][lvl];
        }
        // fallback
        return lvl;
    }
}

export {SquadTable};