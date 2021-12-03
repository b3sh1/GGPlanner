import * as Training from "../model/MTraining.js";


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
    if(Number.parseInt(id) > 0) {
        toggle_buttons('edit');
    }
    else {
        toggle_buttons('add');
    }
    $("#input-training-stage-id").val(id);
    $("#input-coach").val(stage.coach);
    $("#input-assistants").val(stage.assistants);
    $("#input-intensity").val(stage.intensity * 100);
    $("#input-stamina").val(stage.stamina * 100);
    $("#input-training").val(stage.training);
    $("#select-training").val(stage.training).change();
    $("#input-stop-condition").val(stage.stop.weeks.val);
    const el_select_stop_condition = $("#select-stop-condition");
    el_select_stop_condition.val("weeks").change();
    if(stage.stop.age.active && Number.parseInt(stage.stop.age.player_id) === -2) {
        el_select_stop_condition.val("age_first").change();
    }
    if(stage.stop.age.active && Number.parseInt(stage.stop.age.player_id) === -99) {
        el_select_stop_condition.val("age_last").change();
    }
    if(stage.stop.skill.active && Number.parseInt(stage.stop.skill.player_id) === -2) {
        el_select_stop_condition.val("skill_first").change();
    }
    if(stage.stop.skill.active && Number.parseInt(stage.stop.skill.player_id) === -99) {
        el_select_stop_condition.val("skill_last").change();
    }
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

    // read set condition fields (also hidden) + set some default values
    stage_data.stop.weeks.active = true;
    stage_data.stop.weeks.val = Number.parseInt($("#input-stop-weeks").val());
    stage_data.stop.age.active = false;
    stage_data.stop.age.years = Number.parseInt($("#input-stop-age-years").val());
    stage_data.stop.age.days = Number.parseInt($("#input-stop-age-days").val());
    stage_data.stop.age.player_id = -1;
    stage_data.stop.skill.active = false;
    stage_data.stop.skill.lvl = Number.parseInt($("#input-stop-skill").val());
    stage_data.stop.skill.player_id = -1;
    stage_data.stop.skill.type = Training.training[stage_data.training].skills[0];

    // set selected stop condition (if different than default)
    switch ($("#select-stop-condition").val()) {
        case "weeks": {
            break;
        }
        case "age_first": {
            stage_data.stop.weeks.val = Training.MAX_TRAINING_WEEKS;
            stage_data.stop.age.active = true;
            stage_data.stop.age.player_id = -2;
            break;
        }
        case "age_last": {
            stage_data.stop.weeks.val = Training.MAX_TRAINING_WEEKS;
            stage_data.stop.age.active = true;
            stage_data.stop.age.player_id = -99;
            break;
        }
        case "skill_first": {
            stage_data.stop.weeks.val = Training.MAX_TRAINING_WEEKS;
            stage_data.stop.skill.active = true;
            stage_data.stop.skill.player_id = -2;
            break;
        }
        case "skill_last": {
            stage_data.stop.weeks.val = Training.MAX_TRAINING_WEEKS;
            stage_data.stop.skill.active = true;
            stage_data.stop.skill.player_id = -99;
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
    const input_stop_weeks = $("#input-stop-weeks");
    const input_stop_age_years = $("#input-stop-age-years");
    const input_stop_age_days = $("#input-stop-age-days");
    const input_stop_skill = $("#input-stop-skill");
    // show appropriate inputs for stop condition
    input_stop_weeks.closest(".hiding").removeClass('d-none');
    input_stop_age_years.closest(".hiding").addClass('d-none');
    input_stop_age_days.closest(".hiding").addClass('d-none');
    input_stop_skill.closest(".hiding").addClass('d-none');
    if(age_active) {
        input_stop_weeks.closest(".hiding").addClass('d-none');
        input_stop_age_years.closest(".hiding").removeClass('d-none');
        input_stop_age_days.closest(".hiding").removeClass('d-none');
        // update otlines
        new mdb.Input(input_stop_age_years.parent('.form-outline').get(0)).update();
        new mdb.Input(input_stop_age_days.parent('.form-outline').get(0)).update();
    } else if(skill_active){
        input_stop_weeks.closest(".hiding").addClass('d-none');
        input_stop_skill.closest(".hiding").removeClass('d-none');
        new mdb.Input(input_stop_skill.parent('.form-outline').get(0)).update();
    } else {
        new mdb.Input(input_stop_weeks.parent('.form-outline').get(0)).update();
    }
}


function toggle_buttons(mode) {
    if(mode === "add") {
        $("#btn-save-training-stage").addClass('d-none');
        $("#btn-add-training-stage").removeClass('d-none');
    }
    if(mode === "edit") {
        $("#btn-add-training-stage").addClass('d-none');
        $("#btn-save-training-stage").removeClass('d-none');
    }
}


export {init, write, read};