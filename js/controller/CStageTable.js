import * as Player from "../model/MPlayer.js";
import {training, checkboxes} from "../model/MTraining.js";
import {Icons} from "../view/VIcons.js";
import {round2} from "../utils.js";


// these two decoration types cannot be turned on simultaneously
const DECORATE_SKILLS = false;  // apply color badges according to skill lvl
const DECORATE_DIFF = true  // apply color badges according to diff in amount of trained skill lvl/age
const DECORATE_AGE_DIFF = true  // apply color badges according to diff in amount of age
const DECORATE_COLUMNS = false;  // apply cell colors according to skill lvl
const DECORATE_ICONS = true;  // put icons if attribute specifies it (e.q. specialties)


class StageTable {

    constructor(stage_n, stage) {
        this.stage_n = stage_n;
        this.stage = stage;
        this.datatable = this.init_datatable();
        this.update_columns_visibility();
    }

    init_datatable() {
        let tb_stage_header = []
        tb_stage_header.push({title: 'id', width: 50});
        for(const checkbox_tag in checkboxes) {
            tb_stage_header.push({title: checkbox_tag.toUpperCase(), width: 30});
        }
        tb_stage_header.push({title: "Name", width: 300, className: 'td-collapsible'});
        tb_stage_header.push({title: "Age", width: 50});
        tb_stage_header.push({title: "st".toUpperCase()});
        for (const skill of training.ALL.skills) {
            if(skill in Player.attributes) {
                tb_stage_header.push({title: skill.toUpperCase(), name: skill});
            }
        }
        let dttb = $(`#tb-stage-${this.stage_n}`).DataTable({
            paging: false,
            searching: false,
            bInfo: false,
            order: [[0, "asc"]],
            columns: tb_stage_header,
            autoWidth: true,
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
            ],
            rowCallback: function(row, data, index) {
                if(DECORATE_COLUMNS) {
                    StageTable.#decorate_columns(row, data, tb_stage_header);
                }
                StageTable.#set_column_width(row, data, tb_stage_header, 'Name', 155);
            },
        });
        $(`#tb-stage-${this.stage_n}-loading-indicator`).addClass('d-none');  // hide loading spinner
        return dttb;
    }

    load_data(init_squad, trained_squad) {
        for (let id in trained_squad.players) {
            this.append(init_squad.players[id], trained_squad.players[id], id);
        }
        this.update_columns_visibility();
        this.datatable.draw();
        this.update_summary(trained_squad);
        return this;
    }

    append(init_player, trained_player, id) {
        // write player to the table
        // name, age
        let row = [
            id,
        ];
        for(const attr in checkboxes) {
            let is_set = false;
            if(this.stage[attr].has(id)) {
                is_set = true;
            }
            row.push(this.html_checkbox(attr, is_set));
        }
        row.push(trained_player.name.to_str());
        row.push(trained_player.age.to_str() + StageTable.#decorate_age_diff(trained_player.age.diff(init_player.age)));
        let st_lvl = StageTable.#decorate_skill(trained_player['st'], Player.attributes['st'].type);
        st_lvl += StageTable.#decorate_diff(trained_player['st']-init_player['st']);
        row.push(st_lvl);
        // other player attributes
        for (let skill of training.ALL.skills) {
            if (skill in Player.attributes) {
                let skill_lvl = StageTable.#decorate_skill(trained_player[skill], Player.attributes[skill].type);
                skill_lvl += StageTable.#decorate_diff(trained_player[skill]-init_player[skill]);
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
        this.datatable.draw();
    }

    reload(init_squad, trained_squad) {
        this.datatable.clear();
        this.load_data(init_squad, trained_squad);
    }

    draw(trained_squad) {
        this.datatable.draw();
        this.update_summary(trained_squad);
    }

    update_columns_visibility() {
        let trained_skills = training[this.stage.training].skills;
        for (const skill of training.ALL.skills) {
            if(trained_skills.includes(skill)) {
                this.datatable.column(`${skill}:name`).visible(true);
            } else {
                this.datatable.column(`${skill}:name`).visible(false);
            }
        }
    }

    html_checkbox(attr, is_set) {
        let el_checked = "";
        if(is_set) {
            el_checked = 'checked=""'
        }
        return `
            <div class="form-check">
                <input stage="${this.stage_n}" class="form-check-input checkbox-${attr}" type="checkbox" name="${attr}" ${el_checked}>
            </div>`;
    }

    update_summary(squad) {
        const tb_footer = $(`#tb-stage-${this.stage_n}-footer`);
        tb_footer.html(`
            <div class="row pb-0 mb-0">
                <div class="col-lg-4 pb-0 mb-0">
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
                <div class="col-lg-8 pb-0 mb-0">
                    <table class="w-auto table table-sm table-borderless pb-0 mb-0">
<!--                    <table class="w-auto table table-sm table-bordered pb-0 mb-0">-->
                        <tr>
                            <th scope="row" class="px-0">?? Wages:</th>
                            <td class="px-2 pb-0">${Player.wage_to_str(squad.summary.total_wages)}</td>
                        </tr>
                    </table>
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

    static #decorate_age_diff(age_diff, mode = 'badge') {
        if(DECORATE_AGE_DIFF) {
            if(age_diff !== "0.000") {
                if(mode === 'simple') {
                    return ` (+${age_diff})`;
                }
                if(mode === 'badge') {
                    return ` <span class='badge bg-info'>+${age_diff}</span>`;
                }
            }
        }
        return "";
    }

    static #decorate_diff(lvl_diff, mode = 'badge') {
        if(DECORATE_DIFF) {
            lvl_diff = round2(lvl_diff).toFixed(2);
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
            return  StageTable.#decorate_icon(lvl, type);
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

    static #set_column_width(row, data, tb_header, col_title, min_width) {
        for(let i=0; i<data.length; i++) {
            if(tb_header[i].title === col_title) {
                $(row).find(`td:eq(${i})`).css('min-width', `${min_width}px`);
            }
        }
    }
}


export {StageTable};