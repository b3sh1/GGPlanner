import {training} from "../model/MTraining.js";


function add_stage(stage_n, stage) {
    $(generate_scaffold(stage_n, stage)).appendTo('#section-training-stages');
    $(generate_cards(stage_n, stage)).appendTo(`#cards-training-stage-${stage_n}`);
}


function edit_stage(stage_n, stage) {
    $(`#btn-txt-training-stage-${stage_n}`).text(`Stage #${stage_n}: ${training[stage.training].short_name}`);
    let el_cards = $(`#cards-training-stage-${stage_n}`).empty();
    $(generate_cards(stage_n, stage)).appendTo(el_cards);
}


function remove_stage(stage_n) {
    $(`#accordion-training-stage-${stage_n}`).remove();
}


function move_stage_up(stage_n, previous_stage_n) {
    if(previous_stage_n > 0) {
        $(`#accordion-training-stage-${stage_n}`).insertBefore(`#accordion-training-stage-${previous_stage_n}`);
    }
}

function move_stage_down(stage_n, next_stage_n) {
    if(next_stage_n > 0) {
        $(`#accordion-training-stage-${next_stage_n}`).insertBefore(`#accordion-training-stage-${stage_n}`);
    }
}


function generate_scaffold(stage_n, stage) {
    return `
        <div id="accordion-training-stage-${stage_n}" class="accordion-item" style="background-color: #303030">
            <h2 class="accordion-header" id="h-training-stage-${stage_n}">
                <div class="row g-0">
                    <div class="col-8">
                        <button
                            class="btn btn-info btn-block ripple-surface text-start gg-collapsible"
                            style="background-color: #303030; border-radius: 0;"
                            type="button"
                            data-mdb-toggle="collapse"
                            data-mdb-target="#collapse-training-stage-${stage_n}"
                            aria-expanded="true"
                            aria-controls="collapse-training-stage-${stage_n}"
                        >
                            <i class="fas fa-plus fa-sm mx-2"></i> <span id="btn-txt-training-stage-${stage_n}">Stage #${stage_n}: ${training[stage.training].short_name}</span>
                        </button>
                    </div>
                    <div class="col-1">
                        <button
                            stage="${stage_n}"
                            class="btn-training-stage-delete btn btn-info btn-block ripple-surface"
                            style="background-color: #303030; border-radius: 0;"
                            type="button"
                        >
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="col-1">
                        <button
                            stage="${stage_n}"
                            class="btn-training-stage-edit btn btn-info btn-block ripple-surface"
                            style="background-color: #303030; border-radius: 0;"
                            type="button"
                            data-mdb-toggle="modal"
                            data-mdb-target="#modal-add-training-stage"
                        ><i class="fas fa-pencil-alt"></i></button>
                    </div>
                    <div class="col-1">
                        <button
                            stage="${stage_n}"
                            class="btn-training-stage-up btn btn-info btn-block ripple-surface"
                            style="background-color: #303030; border-radius: 0;"
                            type="button"
                        >
                            <i class="fas fa-chevron-up"></i>
                        </button>
                    </div>
                    <div class="col-1">
                        <button
                            stage="${stage_n}"
                            class="btn-training-stage-down btn btn-info btn-block ripple-surface"
                            style="background-color: #303030; border-radius: 0;"
                            type="button"
                        >
                            <i class="fas fa-chevron-down"></i>
                        </button>
                    </div>
                </div>
                
            </h2>
            <div
                    id="collapse-training-stage-${stage_n}"
                    class="accordion-collapse collapse"
                    aria-labelledby="h-training-stage-${stage_n}"
            >
                <div class="row g-1">
                    <div id="cards-training-stage-${stage_n}" class="col-md-4">
<!--                        card would be editable, so generated in own function-->
                    </div>
                    <div class="col-md-8">
                        <div class="card my-3 mx-2">
                            <div class="card-header">
                                Trained players
                            </div>
                            
                            <table id="tb-stage-${stage_n}" class="table table-sm table-striped table-hover" style="width: 100%">
                            </table>

                            <div id="tb-stage-${stage_n}-loading-indicator" class="d-flex justify-content-center p-4">
                                <div class="spinner-border text-info" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                </div>
                            </div>
                            
                        </div>
                    </div>
                </div>
        
            </div>
        </div>
    `;
}

function generate_cards(stage_n, stage) {
    let str_stop_condition = 'default';
    if(stage.stop.age.active) {
        if(stage.stop.age.player_id === -2) {
            str_stop_condition = `First fully training player is <strong>${stage.stop.age.years}.${stage.stop.age.days}</strong> years old.`;
        }
        if(stage.stop.age.player_id === -99) {
            str_stop_condition = `Last fully training player is <strong>${stage.stop.age.years}.${stage.stop.age.days}</strong> years old.`;
        }
    } else if(stage.stop.skill.active) {
        const str_t = training[stage.training].name;
        const lvl = stage.stop.skill.lvl;
        if(stage.stop.skill.player_id === -2) {
            str_stop_condition = `First fully training player reaches level <strong>${lvl}</strong> in <strong>${str_t}</strong>`;
        }
        if(stage.stop.skill.player_id === -99) {
            str_stop_condition = `Last fully training player reaches level <strong>${lvl}</strong> in <strong>${str_t}</strong>`;
        }
    } else if(stage.stop.weeks.active) {
        str_stop_condition = `Training for <strong>${stage.stop.weeks.val} weeks</strong>.`;
    }
    return `
        <div class="row">
            <div class="col">
                <div class="card text-start my-3 mx-2">
                    <div class="card-header">
                        Training setup:
                    </div>
                    <div class="card-body">                                       
                        <ul class="card-text mx-0 px-0" style="list-style-type:none;">
                            <li>Training: <strong>${training[stage.training].name} (${training[stage.training].category})</strong></li>
                            <li>Coach: <strong>${stage.coach}</strong></li>
                            <li>Assistans: <strong>${stage.assistants}</strong></li>
                            <li>Intensity: <strong>${stage.intensity * 100}%</strong></li>
                            <li>Stamina: <strong>${stage.stamina * 100}%</strong></li>
                        </ul>
                    </div>
                    <div class="card-footer"></div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col">
                <div class="card text-start my-3 mx-2">
                    <div class="card-header">
                        Stop condition:
                    </div>
                    <div class="card-body">
                        <p class="card-text">${str_stop_condition}</p>
                    </div>
                    <div class="card-footer"></div>
                </div>
            </div>
        </div>
    `;
}



export {add_stage, edit_stage, remove_stage, move_stage_up, move_stage_down};