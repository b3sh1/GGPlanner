import * as Player from "./model/MPlayer.js";
import {Squad, SquadError} from "./model/MSquad.js";
import * as PlayerForm from "./controller/CPlayerForm.js";
import * as TrainingStageForm from "./controller/CTrainingStageForm.js";
import * as Toast from "./controller/CToast.js";
import {SquadTable} from "./controller/CSquadTable.js";
import {ResultTable} from "./controller/CResultTable.js";
import {StageTable} from "./controller/CStageTable.js";
import * as Storage from "./controller/CPersistentStorage.js";
import * as Header from "./controller/CHeader.js";
import {presets} from "./model/MPlayer.js";
import {Training, TrainingStage, default_stage_cfg, checkboxes} from "./model/MTraining.js";
import * as TrainingStageAccordion from "./controller/CTrainingStagesAccordion.js";


const STORE_SQUAD = "squad";

function main() {
    // Header.init();
    let squad = new Squad().from_simple_obj(Storage.load(STORE_SQUAD));
    let tb_squad = new SquadTable().load_data(squad);
    let tb_result = new ResultTable().load_data(squad, squad);
    let tbs_stage = [];
    PlayerForm.init();  // hidden for now
    TrainingStageForm.init();

    let training = new Training(squad);

    // const tb_squad_placeholder = '<div class="table-responsive px-3"><table id="tb-squad" class="table table-striped table-hover"></table></div>'
    // new SectionCollapsible({
    //     parent: $('#squad'),
    //     name: "squad",
    //     expanded: true,
    //     children: [tb_squad_placeholder],
    // }).render();

    // --- listen to storage changes from other instances (sync) ---
    window.addEventListener('storage', function () {
        // this event fires only when storage was not modified from within this page
        squad = new Squad().from_simple_obj(Storage.load(STORE_SQUAD));
        tb_squad.reload(squad);
        // setting unique to not spam screen with toasts - only one + no autohide (=> delay=-1)
        Toast.show({
            result: 'warning', reason: 'Warning', msg: 'Data modified from other instance.', delay: -1, unique: true,
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
            // let trained_squad = training.calc();
            tb_result.reload(squad, training.trained_squads[stage_n]);
            TrainingStageAccordion.add_stage(stage_n, training_stage);
            let tb_stage = new StageTable(stage_n, training_stage);
            tb_stage.load_data(training.get_previous_stage_squad(stage_n), training.trained_squads[stage_n]);
            tbs_stage.push(tb_stage);
            // --- add listeners to training stages buttons -----------------------------------------------------------
            $(`#training-stage-${stage_n}-delete`).on('click', {'stage_n': stage_n}, function (e) {
                let final_trained_squad = training.delete_stage(stage_n);  // auto-calc
                delete tbs_stage[stage_n-1];
                TrainingStageAccordion.remove_stage(stage_n);
                tb_result.reload(squad, final_trained_squad);
                reload_training_stages_tables(tbs_stage, training);
                Toast.show({result: 'warning', reason: 'Removed:', msg: `Training stage #${stage_n}`});
            });
            $(`#training-stage-${stage_n}-edit`).on('click', {'stage_n': stage_n}, function (e) {
                console.log(`training-stage-${e.data.stage_n}-edit`);
            });
            $(`#training-stage-${stage_n}-up`).on('click', {'stage_n': stage_n}, function (e) {
                console.log(`training-stage-${e.data.stage_n}-up`);
            });
            $(`#training-stage-${stage_n}-down`).on('click', {'stage_n': stage_n}, function (e) {
                console.log(`training-stage-${e.data.stage_n}-down`);
            });
            Toast.show({result: 'success', reason: 'Added:', msg: `Training stage #${stage_n}`});
        } catch (err) {
            console.error(err);
            Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
        }
    });
    // -----------------------------------------------------------------------------------------------------------------
    // --- training stage checkboxes -----------------------------------------------------------------------------------
    let el_section_training_stages = $('#section-training-stages');
    for(const attr in checkboxes) {
        // --- when left-clicked then add player to squad/full-training/half-training
        el_section_training_stages.on('click', `.checkbox-${attr}`, function () {
            try {
                let stage_n = this.attributes.stage.value;
                let player_id = tbs_stage[stage_n - 1].get_id($(this.closest('tr')));
                // if checkbox is checked then add player_id to set (sq, ft, ht)
                if ($(this).prop("checked")) {
                    training.stages[stage_n - 1][attr].add(player_id);
                } else {
                    training.stages[stage_n - 1][attr].delete(player_id);
                }
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
                let trained_squad = training.calc();
                tb_result.reload(squad, trained_squad);
                reload_training_stages_tables(tbs_stage, training);
            } catch (err) {
                console.error(err);
                Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
            }
        });
    }
    // --- decorate collapsible item with +/- ----------------------------------------------------------------------
    $('body').on('click', '.gg-collapsible', function () {
        $(this).children('svg').toggleClass('fa-plus fa-minus');    // this works when font awesome is imported as js
        // $(this).children('i').toggleClass('fa-plus fa-minus');      // this works when font awesome is imported as css
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

function reload_training_stages_tables(tbs_stage, training) {
    for (let tb_stage of tbs_stage) {
        if(tb_stage) {
            tb_stage.reload(training.get_previous_stage_squad(tb_stage.stage_n), training.trained_squads[tb_stage.stage_n]);
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