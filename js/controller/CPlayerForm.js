import * as Player from "../model/MPlayer.js";
import {capitalize_first, round2} from "../utils.js";

function init() {
    let el_form = $('#player-form');
    let html_row = "<div class=\"row\"></div>";
    let max_inputs_int_row = 4;
    let cur_input = 0;
    let el_dyn_inputs; //row that holds inputs (initialized later, because we can have more rows)
    for(let attr in Player.attributes) {
        if(Player.attributes[attr].form_fld) {
            let input_type = "number";
            if(attr === 'spec') {
                // add options to select
                let html_options = "";
                for(let spec_int in Player.levels.spec) {
                    if(Number.isInteger(parseInt(spec_int))) {
                        html_options += `
                            <option value="${spec_int}">${capitalize_first(Player.levels.spec[spec_int].name)}</option>
                            `
                    }
                }
                $(html_options).appendTo("#select-player-spec");
                continue;
            }
            // create new row if max elements in row
            if(cur_input % max_inputs_int_row === 0) {
                el_dyn_inputs = $(html_row).appendTo(el_form);
            }
            let min = Player.levels[Player.attributes[attr].type].min;
            let max = Player.levels[Player.attributes[attr].type].max;
            let step = Player.levels[Player.attributes[attr].type].step;

            let html_input = `
                    <div class="col-sm">
                        <div class="form-outline mb-4">
                            <input type="${input_type}" id="input-player-${attr}" name="${attr}" min="${min}" max="${max}" step="${step}" class="form-control active" autocomplete="off">
                            <label class="form-label active" for="input-player-${attr}" style="margin-left: 0px;">
                                ${Player.attributes[attr].name}
                            </label>
                        </div>
                    </div>`;
            $(html_input).appendTo(el_dyn_inputs);
            cur_input++;
        }
    }
}

function write(player, id="0") {
    // show appropriate button
    if(Number.parseInt(id) > 0) {
        toggle_buttons('edit');
    }
    else {
        toggle_buttons('add');
    }
    $("#input-player-id").val(id);
    $("#input-player-first").val(player.name.first);
    $("#input-player-nick").val(player.name.nick);
    $("#input-player-last").val(player.name.last);
    $("#input-player-years").val(player.age.years);
    $("#input-player-days").val(player.age.days);
    for(let attr in Player.attributes) {
        if (Player.attributes[attr].form_fld) {
            let el_input = $(`#input-player-${attr}`);
            if(attr === 'spec') {
                el_input.val(capitalize_first(Player.levels.spec[player[attr]].name));
                $("#select-player-spec").val(player[attr]).change();
                continue;
            }
            el_input.val(round2(player[attr]));
            // init label notches to fit the text
            new mdb.Input(el_input.parent('.form-outline').get(0)).init();
        }
    }
}

function read() {
    let player_data = {};
    $("#player-form input, #player-form select").each(function () {
        let attr = $(this).attr('name');
        if (attr) {
            player_data[attr] = $(this).val();
        }
    });
    return player_data;
}

function toggle_buttons(mode) {
    if(mode === "add") {
        $("#btn-save-player").addClass('d-none');
        $("#btn-add-player").removeClass('d-none');
    }
    if(mode === "edit") {
        $("#btn-add-player").addClass('d-none');
        $("#btn-save-player").removeClass('d-none');
    }
}

export {init, write, read};