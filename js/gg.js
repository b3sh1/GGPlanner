import * as Player from "./model/MPlayer.js";
import {Squad, SquadError} from "./model/MSquad.js";
import * as PlayerForm from "./controller/CPlayerForm.js";
import * as TrainingStageForm from "./controller/CTrainingStageForm.js";
import * as Toast from "./controller/CToast.js";
import {SquadTable} from "./controller/CSquadTable.js";
import {ResultTable} from "./controller/CResultTable.js";
import {StageTable} from "./controller/CStageTable.js";
import * as ExtendedPlayerDetails from "./controller/CTablePlayerDetails.js"
import * as Storage from "./controller/CPersistentStorage.js";
import * as Header from "./controller/CHeader.js";
import {presets} from "./model/MPlayer.js";
import {Training, TrainingError, TrainingStage, default_stage_cfg, checkboxes} from "./model/MTraining.js";
import * as TrainingStagesAccordion from "./controller/CTrainingStagesAccordion.js";


const STORE_SQUAD = "squad";
const STORE_TRAINING = "training";

function main() {
    // Header.init();
    PlayerForm.init();  // modal
    TrainingStageForm.init();  // modal

    let squad;
    let training;
    let tb_squad = new SquadTable();
    let tb_result = new ResultTable();
    let tbs_stage;

    let init_result = init_from_store(squad, training, tb_squad, tb_result, tbs_stage);
    squad = init_result.squad;
    training = init_result.training;
    tb_squad = init_result.tb_squad;
    tb_result = init_result.tb_result;
    tbs_stage = init_result.tbs_stage;
    Toast.show({
        result: 'info', reason: 'Info', msg: 'Data loaded from local storage.',
    });

    // --- listen to storage changes from other instances (sync) ---
    window.addEventListener('storage', function () {
        // this event fires only when storage was not modified from within this page
        let init_result = init_from_store(squad, training, tb_squad, tb_result, tbs_stage);
        squad = init_result.squad;
        training = init_result.training;
        tb_squad = init_result.tb_squad;
        tb_result = init_result.tb_result;
        tbs_stage = init_result.tbs_stage;
        // setting unique to not spam screen with toasts - only one + no autohide (=> delay=-1)
        Toast.show({
            result: 'warning', reason: 'Warning', msg: 'Data modified from another instance!', delay: -1, unique: true,
        });
    });

    // --- button add players - opens modal ---
    $("#btn-add-players").on("click", function () {
        let player = new Player.Player().random();
        PlayerForm.write(player);
    });
    // --- modal add/edit player buttons ---------------------------------------------------------------------------
    // --- button add player - form submit ---
    $("#btn-add-player").on("click", function () {
        try {
            let player = new Player.Player().from_simple_obj(PlayerForm.read());
            let player_id = squad.add(player);
            Storage.save(STORE_SQUAD, squad.to_simple_obj())
            tb_squad.append(player, player_id).draw();
            set_training_stages_player_default_checkboxes(player_id, training);
            let trained_squad = training.calc();
            Storage.save(STORE_TRAINING, training.to_simple_obj());
            tb_result.reload(squad, trained_squad);
            reload_training_stages_tables(tbs_stage, training);
            Toast.show({result: 'success', reason: 'Added:', msg: player.name.to_str()});
        }
        catch (err) {
            if(err instanceof SquadError) {
                Toast.show({result: 'fail', reason: 'Error:', msg: err.message});
            } else {
                console.error(err);
                Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
            }
        }
    });

    // --- button save player - form submit ---
    $("#btn-save-player").on("click", function () {
        try {
            let player_data = PlayerForm.read();
            let player = squad.edit(player_data, player_data.id);
            Storage.save(STORE_SQUAD, squad.to_simple_obj())
            // after editing rewrite the whole table
            tb_squad.reload(squad);
            set_training_stages_player_default_checkboxes(player_data.id, training);
            let trained_squad = training.calc();
            Storage.save(STORE_TRAINING, training.to_simple_obj());
            tb_result.reload(squad, trained_squad);
            reload_training_stages_tables(tbs_stage, training);
            Toast.show({result: 'success', reason: 'Edited:', msg: player.name.to_str()});
        }
        catch (err) {
            if(err instanceof SquadError) {
                Toast.show({result: 'fail', reason: 'Error:', msg: err.message});
            } else {
                console.error(err);
                Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
            }
        }
    });
    // --- button random player ---
    $("#btn-random-player").on("click", function () {
        let player_data = PlayerForm.read();
        // edit player - keep name and age
        if (Number.parseInt(player_data.id) > 0) {
            let player = new Player.Player(player_data).randomize_attributes();
            PlayerForm.write(player, player_data.id);
        }
        // add player - generate also random name
        else {
            let player = new Player.Player().random();
            PlayerForm.write(player);
        }
        // nick field label update - to not overlap with new randomized value
        new mdb.Input($("#input-player-nick").parent('.form-outline').get(0)).update();
    });
    // --- button default player ---
    $("#btn-default-player").on("click", function () {
        let player_data = PlayerForm.read();
        // edit player
        if (Number.parseInt(player_data.id) > 0) {
            // keep player name
            let player_cfg = Player.presets.default;
            player_cfg.first = player_data.first;
            player_cfg.nick = player_data.nick;
            player_cfg.last = player_data.last;
            let player = new Player.Player(player_cfg);
            PlayerForm.write(player, player_data.id);
        }
        // add player
        else {
            let player = new Player.Player();
            PlayerForm.write(player);
        }
        // nick field label update - to not overlap with new randomized value
        new mdb.Input($("#input-player-nick").parent('.form-outline').get(0)).update();
    });
    // -------------------------------------------------------------------------------------------------------------
    // --- table player edit buttons -------------------------------------------------------------------------------
    // --- button remove player ---
    tb_squad.datatable.on('click', '.btn-delete-player', function () {
        try {
            let player_id = tb_squad.delete($(this.closest('tr')));
            let player_name = squad.remove(player_id);
            Storage.save(STORE_SQUAD, squad.to_simple_obj());
            tb_squad.draw();
            unset_training_stages_player_default_checkboxes(player_id, training);
            let trained_squad = training.calc();
            Storage.save(STORE_TRAINING, training.to_simple_obj());
            tb_result.reload(squad, trained_squad);
            reload_training_stages_tables(tbs_stage, training);
            Toast.show({result: 'warning', reason: "Removed:", msg: player_name});
        }
        catch (err) {
            if(err instanceof SquadError) {
                Toast.show({result: 'fail', reason: 'Error:', msg: err.message});
            } else {
                console.error(err);
                Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
            }
        }
    });
    // --- button edit player => bootstrap auto-opens modal with form ---
    tb_squad.datatable.on('click', '.btn-edit-player', function () {
        let player_id = tb_squad.get_id($(this.closest('tr')));
        PlayerForm.write(squad.get(player_id), player_id);
    });
    // --- button clone player ---
    tb_squad.datatable.on('click', '.btn-clone-player', function () {
        try {
            let old_player_id = tb_squad.get_id($(this.closest('tr')));
            let new_player_id = squad.clone(old_player_id);
            let new_player = squad.get(new_player_id);
            tb_squad.append(new_player, new_player_id).draw();
            Storage.save(STORE_SQUAD, squad.to_simple_obj());
            set_training_stages_player_default_checkboxes(new_player_id, training);
            let trained_squad = training.calc();
            Storage.save(STORE_TRAINING, training.to_simple_obj());
            tb_result.reload(squad, trained_squad);
            reload_training_stages_tables(tbs_stage, training);
            Toast.show({result: 'success', reason: 'Added:', msg: new_player.name.to_str()});
        }
        catch (err) {
            if(err instanceof SquadError) {
                Toast.show({result: 'fail', reason: 'Error:', msg: err.message});
            } else {
                console.error(err);
                Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
            }
        }
    });

    // --- button add training stage - opens modal ---
    $("#btn-add-training-stages").on("click", function () {
        let training_stage= new TrainingStage();
        TrainingStageForm.write(training_stage);
    });
    // --- modal add training stage ------------------------------------------------------------------------------------
    // --- button add training stage - form submit ---
    $("#btn-add-training-stage").on("click", function () {
        try {
            // squad for training stage here is just for initialization of default squad/trained players
            let training_stage = new TrainingStage(squad).from_simple_obj(TrainingStageForm.read());
            let stage_n = training.add_stage(training_stage); // auto-calc
            Storage.save(STORE_TRAINING, training.to_simple_obj());
            // let trained_squad = training.calc();
            tb_result.reload(squad, training.get_trained_squad(stage_n));
            TrainingStagesAccordion.add_stage(stage_n, training_stage);
            let tb_stage = new StageTable(stage_n, training_stage);
            tb_stage.load_data(training.get_previous_stage_squad(stage_n), training.get_trained_squad(stage_n));
            tbs_stage.push(tb_stage);
            Toast.show({result: 'success', reason: 'Added:', msg: `Training stage #${stage_n}`});
        } catch (err) {
            if(err instanceof TrainingError) {
                Toast.show({result: 'fail', reason: 'Error:', msg: err.message});
            } else {
                console.error(err);
                Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
            }
        }
    });
    // --- button edit training stage ==> save data from form ---
    $("#btn-save-training-stage").on("click", function () {
        try {
            let stage_data = TrainingStageForm.read();
            let training_stage = training.edit_stage(stage_data, stage_data.id);
            let trained_squad = training.calc();
            Storage.save(STORE_TRAINING, training.to_simple_obj());
            tb_result.reload(squad, trained_squad);
            TrainingStagesAccordion.edit_stage(stage_data.id, training_stage);
            reload_training_stages_tables(tbs_stage, training);
            Toast.show({result: 'success', reason: 'Edited:', msg: `Training stage #${stage_data.id}`});
        } catch (err) {
            console.error(err);
            Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
        }
    });
    // --- listeners to training stages buttons ------------------------------------------------------------------------
    let el_section_training_stages = $('#section-training-stages');
    // --- delete training stage ---
    // el_section_training_stages.on('click', `.checkbox-${attr}`, function () {
    el_section_training_stages.on('click', '.btn-training-stage-delete',  function () {
        let stage_n = this.attributes.stage.value;
        let final_trained_squad = training.delete_stage(stage_n);  // auto-calc
        delete tbs_stage[stage_n-1];
        // if no stages left => empty the null filled training.stages and tbs_stage
        if(training.stages_order.length <= 0) {
            training.stages = [];
            tbs_stage = [];
        }
        Storage.save(STORE_TRAINING, training.to_simple_obj());
        TrainingStagesAccordion.remove_stage(stage_n);
        tb_result.reload(squad, final_trained_squad);
        reload_training_stages_tables(tbs_stage, training);
        Toast.show({result: 'warning', reason: 'Removed:', msg: `Training stage #${stage_n}`});
    });
    // --- edit training stage ==> opens modal ---
    el_section_training_stages.on('click', '.btn-training-stage-edit', function () {
        let stage_n = this.attributes.stage.value;
        TrainingStageForm.write(training.stages[stage_n-1], stage_n);
    });
    // --- move training stage up ---
    el_section_training_stages.on('click', '.btn-training-stage-up', function () {
        let stage_n = this.attributes.stage.value;
        const previous_stage_n = training.move_stage_order_up(stage_n);
        Storage.save(STORE_TRAINING, training.to_simple_obj());
        const final_trained_squad = training.calc();
        TrainingStagesAccordion.move_stage_up(stage_n, previous_stage_n);
        tb_result.reload(squad, final_trained_squad);
        reload_training_stages_tables(tbs_stage, training);
    });
    // --- move training stage down ---
    el_section_training_stages.on('click', '.btn-training-stage-down', function () {
        let stage_n = this.attributes.stage.value;
        const next_stage_n = training.move_stage_order_down(stage_n);
        Storage.save(STORE_TRAINING, training.to_simple_obj());
        const final_trained_squad = training.calc();
        TrainingStagesAccordion.move_stage_down(stage_n, next_stage_n);
        tb_result.reload(squad, final_trained_squad);
        reload_training_stages_tables(tbs_stage, training);
    });
    // -----------------------------------------------------------------------------------------------------------------
    // --- training stage checkboxes -----------------------------------------------------------------------------------
    for(const attr in checkboxes) {
        // --- when left-clicked then add player to squad/full-training/half-training
        el_section_training_stages.on('click', `.checkbox-${attr}`, function () {
            try {
                let stage_n = this.attributes.stage.value;
                let player_id = tbs_stage[stage_n-1].get_id($(this.closest('tr')));
                // if checkbox is checked then add player_id to set (sq, ft, ht)
                if ($(this).prop("checked")) {
                    training.stages[stage_n - 1][attr].add(player_id);
                } else {
                    training.stages[stage_n - 1][attr].delete(player_id);
                }
                Storage.save(STORE_TRAINING, training.to_simple_obj());
                let trained_squad = training.calc();
                tb_result.reload(squad, trained_squad);
                reload_training_stages_tables(tbs_stage, training);
            } catch (err) {
                console.error(err);
                Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
            }
        });
        // --- when right-clicked then select all checkboxes a that type for this stage -----------------------------
        el_section_training_stages.on('contextmenu', `.checkbox-${attr}`, function (e) {
            e.preventDefault();
            try {
                let stage_n = this.attributes.stage.value;
                // if checkbox is checked then add player_id to set (sq, ft, ht)
                if ($(this).prop("checked")) {
                    training.stages[stage_n - 1].unset_all_ids(attr, squad);
                } else {
                    training.stages[stage_n - 1].set_all_ids(attr, squad);
                }
                Storage.save(STORE_TRAINING, training.to_simple_obj());
                let trained_squad = training.calc();
                tb_result.reload(squad, trained_squad);
                reload_training_stages_tables(tbs_stage, training);
            } catch (err) {
                console.error(err);
                Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
            }
        });
    }

    // -----------------------------------------------------------------------------------------------------------------
    // --- tb_squad - show player details ---
    tb_squad.datatable.on('click', 'tbody td.td-collapsible', function () {
        let tr = $(this).closest('tr');
        let row = tb_squad.datatable.row(tr);
        let player_id = tb_squad.get_id(tr);
        let player = squad.get(player_id);

        if(row.child.isShown()) {
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            row.child(ExtendedPlayerDetails.html(player)).show();
            tr.addClass('shown');
        }
    });
    // -----------------------------------------------------------------------------------------------------------------
    // --- tb_result - show player details ---
    tb_result.datatable.on('click', 'tbody td.td-collapsible', function () {
        let tr = $(this).closest('tr');
        let row = tb_result.datatable.row(tr);
        let player_id = tb_result.get_id(tr);
        let player = training.get_trained_squad(-1).get(player_id);

        if(row.child.isShown()) {
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            row.child(ExtendedPlayerDetails.html(player)).show();
            tr.addClass('shown');
        }
    });
    // -----------------------------------------------------------------------------------------------------------------
    // --- tbs_stage - show player details ---
    el_section_training_stages.on('click', 'tbody td.td-collapsible', function () {
        let stage_n = this.closest('table').attributes.stage.value;
        let tr = $(this).closest('tr');
        let row = tbs_stage[stage_n-1].datatable.row(tr);
        let player_id = tbs_stage[stage_n-1].get_id(tr);
        let player = training.get_trained_squad(stage_n).get(player_id);

        if(row.child.isShown()) {
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            row.child(ExtendedPlayerDetails.html(player)).show();
            tr.addClass('shown');
        }
    });

    // --- decorate collapsible item with +/- ----------------------------------------------------------------------
    $('body').on('click', '.gg-collapsible', function () {
        $(this).children('svg').toggleClass('fa-plus fa-minus');    // this works when font awesome is imported as js
        // $(this).children('i').toggleClass('fa-plus fa-minus');      // this works when font awesome is imported as css
        // this.scrollIntoView();  // + scroll this accordion to view
        // $('html,body').animate({scrollTop: $(this).offset().top}, 'slow');
    });
    // --- back to top button --------------------------------------------------------------------------------------
    let btn_back_to_top = $('#btn-back-to-top');
    window.onscroll = function () {
        if (
            document.body.scrollTop > 20 ||
            document.documentElement.scrollTop > 20
        ) {
            btn_back_to_top.fadeIn('fast');
        } else {
            btn_back_to_top.fadeOut('fast');
        }
    };
    btn_back_to_top.on('click', function () {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    });
}


// init page from permanent storage values
function init_from_store(squad, training, tb_squad, tb_result, tbs_stage) {
    squad = new Squad().from_simple_obj(Storage.load(STORE_SQUAD));
    training = new Training(squad).from_simple_obj(Storage.load(STORE_TRAINING));
    tb_squad.reload(squad);

    // init training stages accordion + reload result table
    TrainingStagesAccordion.reset();
    for(const i in training.stages_order) {
        let stage_n = training.stages_order[i];
        let training_stage = training.stages[stage_n-1];
        TrainingStagesAccordion.add_stage(stage_n, training_stage);
        if(Number.parseInt(i) === training.stages_order.length-1) {
            tb_result.reload(squad, training.get_trained_squad(stage_n));
        }
    }
    // init training stages tables
    tbs_stage = [];
    for(const n in training.stages) {
        const stage_n = Number.parseInt(n) + 1;
        const training_stage = training.stages[n];
        if(training_stage) {
            let tb_stage = new StageTable(stage_n, training_stage);
            tb_stage.load_data(training.get_previous_stage_squad(stage_n), training.get_trained_squad(stage_n));
            tbs_stage.push(tb_stage);
        } else {
            tbs_stage.push(null);
        }
    }
    return {squad: squad, training: training, tb_squad: tb_squad, tb_result: tb_result, tbs_stage: tbs_stage};
}

function reload_training_stages_tables(tbs_stage, training) {
    for (let tb_stage of tbs_stage) {
        if(tb_stage) {
            tb_stage.reload(training.get_previous_stage_squad(tb_stage.stage_n), training.get_trained_squad(tb_stage.stage_n));
        }
    }
}

function set_training_stages_player_default_checkboxes(player_id, training) {
    for(const stage of training.stages) {
        if(stage) {
            stage.set_default_checkboxes(player_id);
        }
    }
}

function unset_training_stages_player_default_checkboxes(player_id, training) {
    for(const stage of training.stages) {
        if(stage) {
            stage.unset_checkboxes(player_id);
        }
    }
}

// await new Promise(r => setTimeout(r, 5000));
// main();

$(document).ready(function () {
    main();
});