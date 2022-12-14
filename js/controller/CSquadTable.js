import * as Player from "../model/MPlayer.js";
import {Icons} from "../view/VIcons.js";
import {round2} from "../utils.js";


// these two decoration types cannot be turned on simultaneously
const DECORATE_SKILLS = false;  // apply color badges according to skill lvl
const DECORATE_COLUMNS = false;  // apply cell colors according to skill lvl
const DECORATE_ICONS = true;  // put icons if attribute specifies it (e.q. specialties)


class SquadTable {
    constructor() {
        this.datatable = this.init_datatable();
    }

    init_datatable() {
        let tb_squad_header = [
            {title: 'id', width: 50},
            {title: "Name", width: 300, className: 'td-collapsible'},
            {title: "Age", width: 50},
        ];
        for (let attr in Player.attributes) {
            if (Player.attributes[attr].tb_show) {
                tb_squad_header.push({title: attr.toUpperCase()});
            }
        }
        tb_squad_header.push({title: "Edit", width: 155});
        let dttb = $('#tb-squad').DataTable({
            paging: false,
            searching: false,
            bInfo: false,
            order: [[0, "asc"]],
            columns: tb_squad_header,
            autoWidth: true,
            // responsive: true,
            responsive: {
                details: false
            },
            fixedHeader: false,
            columnDefs: [
                {
                    targets: [0],
                    visible: false,
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
                    SquadTable.#decorate_columns(row, data, tb_squad_header);
                }
            },
            createdRow: function (row, data, dataIndex) {
                $('td:last-child', row).css('min-width', '155px');
            },
        });
        $("#tb-squad-loading-indicator").addClass('d-none');  // hide loading spinner
        return dttb;
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
                '<button type="button" class="btn-delete-player btn btn-outline-info btn-sm ripple-surface me-1"' +
                ' title="Delete">' +
                '<i class="fas fa-times fa-lg"></i>' +
                '</button>' +
                '<button type="button" class="btn-clone-player btn btn-outline-info btn-sm ripple-surface me-1"' +
                ' title="Clone">' +
                '<i class="far fa-clone"></i>' +
                '</button>' +
                '<button type="button" class="btn-edit-player btn btn-outline-info btn-sm ripple-surface"' +
                ' data-mdb-toggle="modal" data-mdb-target="#modal-add-player" title="Edit">' +
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
        this.datatable.draw();
    }

    reload(squad) {
        this.datatable.clear();
        this.load_data(squad);
        this.update_summary(squad);
    }

    draw(squad) {
        this.update_summary(squad);
        this.datatable.draw();
    }

    update_summary(squad) {
        const tb_footer = $('#tb-squad-footer');
        tb_footer.html(`
            <div class="row pb-0 mb-0">
                <div class="col-xxl-2 col-lg-3 col-md-4 col-sm-6 pb-0 mb-0">
                    <table class="w-auto table table-sm table-borderless pb-0 mb-0">
<!--                    <table class="w-auto table table-sm table-bordered pb-0 mb-0">-->
                        <tr>
                            <th scope="row" class="px-0 pb-1">?? Age:</th>
                            <td class="px-2 pb-1">${squad.summary.average_age.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <th scope="row" class="px-0 pt-0">?? Stamina:</th>
                            <td class="px-2 pt-0">${squad.summary.average_stamina.toLocaleString()}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-xxl-2 col-lg-6 col-md-4 col-sm-6 pb-0 mb-0">
                    <table class="w-auto table table-sm table-borderless pb-0 mb-0">
<!--                        <table class="w-auto table table-sm table-bordered pb-0 mb-0">-->
                        <tr>
                            <th scope="row" class="px-0 pb-1">?? TSI:</th>
                            <td class="px-2 pb-1">${squad.summary.total_tsi.toLocaleString()}</td>
                        </tr>
                        <tr>
                            <th scope="row" class="px-0 pt-0">?? TSI:</th>
                            <td class="px-2 pt-0">${squad.summary.average_tsi.toLocaleString()}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-xxl-4 col-lg-5 col-md-6 pb-0 mb-0">
                    <table class="w-auto table table-sm table-borderless pb-0 mb-0">
<!--                    <table class="w-auto table table-sm table-bordered pb-0 mb-0">-->
                        <tr>
                            <th scope="row" class="px-0">?? Wages:</th>
                            <td class="px-2 pb-0">${Player.wage_to_str(squad.summary.total_wages)}</td>
                        </tr>
                    </table>
                </div>
                <div class="col-xxl-4 col-lg-5 col-md-6 pb-0 mb-0">
                    <table class="w-auto table table-sm table-borderless pb-0 mb-0">
<!--                    <table class="w-auto table table-sm table-bordered pb-0 mb-0">-->
                        <tr>
                            <th scope="row" class="px-0">?? Wage:</th>
                            <td class="px-2 pb-0">${Player.wage_to_str(squad.summary.average_wage)}</td>
                        </tr>
                    </table>
                </div>
            </div>`);
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
            return  SquadTable.#decorate_icon(lvl, type);
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

export {SquadTable};