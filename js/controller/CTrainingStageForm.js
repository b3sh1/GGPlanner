import * as Training from "../model/MTraining.js";
import {default_stage_cfg} from "../model/MTraining.js";


function init() {
    let el_form = $('#training-stage-form');

    // append training type to select
    let html_options = "";
    for(const training_category in Training.categories) {
        if(Training.categories[training_category].form_select) {
            html_options += `<optgroup label="${training_category} skill training">`;
            for(const training_type of Training.categories[training_category].training) {
                html_options += `
                    <option value="${training_type}">${Training.training[training_type].name}</option>
                `;
            }
            html_options += `</optgroup>`;
        }
    }
    $(html_options).appendTo("#select-training");

    // update condition form fields based on selected field
    $('#select-stop-condition').on('change', function() {
        switch ($("#select-stop-condition").val()) {
            case "weeks": {
                show_correct_stop_condition_fields(false, false);
                break;
            }
            case "age_first": {
                show_correct_stop_condition_fields(true, false);
                break;
            }
            case "age_last": {
                show_correct_stop_condition_fields(true, false);
                break;
            }
            case "skill_first": {
                show_correct_stop_condition_fields(false, true);
                break;
            }
            case "skill_last": {
                show_correct_stop_condition_fields(false, true);
                break;
            }
            default: {
                show_correct_stop_condition_fields(false, false);
                break;
            }
        }
    });
}


function write(stage, id="0") {
    // show appropriate button
    // if(Number.parseInt(id) > 0) {
    //     toggle_buttons('edit');
    // }
    // else {
    //     toggle_buttons('add');
    // }
    $("#input-training-stage-id").val(id);
    $("#input-coach").val(stage.coach);
    $("#input-assistants").val(stage.assistants);
    $("#input-intensity").val(stage.intensity * 100);
    $("#input-stamina").val(stage.stamina * 100);
    $("#input-training").val(stage.training);
    $("#select-training").val(stage.training).change();
    $("#input-stop-condition").val(stage.stop.weeks.val);
    $("#select-stop-condition").val("weeks").change();
    $("#input-stop-weeks").val(stage.stop.weeks.val);
    $("#input-stop-age-years").val(stage.stop.age.years);
    $("#input-stop-age-days").val(stage.stop.age.days);
    $("#input-stop-skill").val(stage.stop.skill.lvl);
}

function read() {
    let stage_data = {stop: {weeks: {}, skill: {}, age: {}}};
    stage_data.id = $("#input-training-stage-id").val();
    stage_data.coach = Number.parseInt($("#input-coach").val());
    stage_data.assistants = Number.parseInt($("#input-assistants").val());
    stage_data.intensity = Number.parseInt($("#input-intensity").val()) / 100;
    stage_data.stamina = Number.parseInt($("#input-stamina").val()) / 100;
    stage_data.training = $("#select-training").val();
    switch ($("#select-stop-condition").val()) {
        case "weeks": {
            stage_data.stop.weeks.active = true;
            stage_data.stop.weeks.val = Number.parseInt($("#input-stop-weeks").val());
            stage_data.stop.age.active = false;
            stage_data.stop.skill.active = false;
            break;
        }
        case "age_first": {
            stage_data.stop.weeks.active = true;
            stage_data.stop.weeks.val = Training.MAX_TRAINING_WEEKS;
            stage_data.stop.age.active = true;
            stage_data.stop.age.years = Number.parseInt($("#input-stop-age-years").val());
            stage_data.stop.age.days = Number.parseInt($("#input-stop-age-days").val());
            stage_data.stop.age.player_id = -2;
            stage_data.stop.skill.active = false;
            break;
        }
        case "age_last": {
            stage_data.stop.weeks.active = true;
            stage_data.stop.weeks.val = Training.MAX_TRAINING_WEEKS;
            stage_data.stop.age.active = true;
            stage_data.stop.age.years = Number.parseInt($("#input-stop-age-years").val());
            stage_data.stop.age.days = Number.parseInt($("#input-stop-age-days").val());
            stage_data.stop.age.player_id = -99;
            stage_data.stop.skill.active = false;
            break;
        }
        case "skill_first": {
            stage_data.stop.weeks.active = true;
            stage_data.stop.weeks.val = Training.MAX_TRAINING_WEEKS;
            stage_data.stop.age.active = false;
            stage_data.stop.skill.active = true;
            stage_data.stop.skill.lvl = Number.parseInt($("#input-stop-skill").val());
            stage_data.stop.skill.player_id = -2;
            stage_data.stop.skill.type = Training.training[stage_data.training].skills[0];
            break;
        }
        case "skill_last": {
            stage_data.stop.weeks.active = true;
            stage_data.stop.weeks.val = Training.MAX_TRAINING_WEEKS;
            stage_data.stop.age.active = false;
            stage_data.stop.skill.active = true;
            stage_data.stop.skill.lvl = Number.parseInt($("#input-stop-skill").val());
            stage_data.stop.skill.player_id = -99;
            stage_data.stop.skill.type = Training.training[stage_data.training].skills[0];
            break;
        }
        default: {
            stage_data.stop = Training.default_stage_cfg;
            break;
        }
    }

    return stage_data;
}


function show_correct_stop_condition_fields(age_active, skill_active) {
    // show appropriate inputs for stop condition
    $("#input-stop-weeks").closest(".col").removeClass('d-none');
    $("#input-stop-age-years").closest(".col").addClass('d-none');
    $("#input-stop-age-days").closest(".col").addClass('d-none');
    $("#input-stop-skill").closest(".col").addClass('d-none');
    if(age_active) {
        $("#input-stop-weeks").closest(".col").addClass('d-none');
        $("#input-stop-age-years").closest(".col").removeClass('d-none');
        $("#input-stop-age-days").closest(".col").removeClass('d-none');
        // update otlines
        new mdb.Input($("#input-stop-age-years").parent('.form-outline').get(0)).update();
        new mdb.Input($("#input-stop-age-days").parent('.form-outline').get(0)).update();
    } else if(skill_active){
        $("#input-stop-weeks").closest(".col").addClass('d-none');
        $("#input-stop-skill").closest(".col").removeClass('d-none');
        new mdb.Input($("#input-stop-skill").parent('.form-outline').get(0)).update();
    }
}


export {init, write, read};