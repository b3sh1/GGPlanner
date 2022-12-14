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
import * as Footer from "./controller/CFooter.js";
import {presets} from "./model/MPlayer.js";
import {Training, TrainingError, TrainingStage, default_stage_cfg, checkboxes} from "./model/MTraining.js";
import * as TrainingStagesAccordion from "./controller/CTrainingStagesAccordion.js";
import {LineupForm} from "./controller/CFormLineup.js";
import {Match} from "./model/MMatch.js";
import {Ratings} from "./controller/CRatings.js";
import {MatchSetupForm} from "./controller/CFormMatchSetup.js";
import {parse_clipboard_table} from "./controller/CPlayerForm.js";


const STORE_SQUAD = "squad";
const STORE_TRAINING = "training";
const STORE_MATCH = "lineup";

function main() {
    Header.init();
    PlayerForm.init();  // modal
    TrainingStageForm.init();  // modal
    Footer.init();

    let squad;
    let training;
    let match;
    let tb_squad = new SquadTable();
    let tb_result = new ResultTable();
    let tbs_stage;
    let cards_ratings;
    let form_match_setup;
    let form_lineup;

    let init_result = init_from_store(squad, training, match, tb_squad, tb_result, tbs_stage, cards_ratings, form_match_setup, form_lineup);
    squad = init_result.squad;
    training = init_result.training;
    match = init_result.match;
    tb_squad = init_result.tb_squad;
    tb_result = init_result.tb_result;
    tbs_stage = init_result.tbs_stage;
    cards_ratings = init_result.cards_ratings;
    form_match_setup = init_result.form_match_setup;
    form_lineup = init_result.form_lineup;
    Toast.show({
        result: 'info', reason: 'Info', msg: 'Data loaded from local storage.',
    });


    // --- listen to storage changes from other instances (sync) ---
    window.addEventListener('storage', function () {
        // this event fires only when storage was not modified from within this page
        let init_result = init_from_store(squad, training, match, tb_squad, tb_result, tbs_stage, cards_ratings, form_match_setup, form_lineup);
        squad = init_result.squad;
        training = init_result.training;
        match = init_result.match;
        tb_squad = init_result.tb_squad;
        tb_result = init_result.tb_result;
        tbs_stage = init_result.tbs_stage;
        cards_ratings = init_result.cards_ratings;
        form_match_setup = init_result.form_match_setup;
        form_lineup = init_result.form_lineup;
        // setting unique to not spam screen with toasts - only one + no autohide (=> delay=-1)
        Toast.show({
            result: 'warning', reason: 'Warning', msg: 'Data modified from another instance!', delay: -1, unique: true,
        });
    });

    // --- export data ---
    $("#btn-save-file").on("click", function () {
        try {
            let export_data = {squad: "", training: "", match: ""};
            export_data.squad = Storage.load(STORE_SQUAD);
            export_data.training = Storage.load(STORE_TRAINING);
            export_data.match = Storage.load(STORE_MATCH);
            let export_uri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(export_data));
            let export_filename = $("#input-export-filename").val();
            let link = document.createElement('a');
            link.setAttribute('href', export_uri);
            link.setAttribute('download', export_filename);
            link.click();
            link.remove();
        }
        catch (err) {
            console.error(err);
            Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
        }
    });
    // --- import data ---
    $("#btn-import").on("click", function () {
        $("#input-import-data").click();
    });
    $("#input-import-data").on("change", function () {
        try {
            let import_file = this.files[0];
            const reader = new FileReader();
            reader.addEventListener('load', (e) => {
                try {
                    let import_data = JSON.parse(e.target.result.toString());
                    Storage.save(STORE_SQUAD, import_data.squad)
                    Storage.save(STORE_TRAINING, import_data.training);
                    Storage.save(STORE_MATCH, import_data.match);
                    window.location.reload();
                }
                catch (err) {
                    console.error(err);
                    Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
                }
            });
            reader.readAsText(import_file);
        }
        catch (err) {
            console.error(err);
            Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
        }
    });
    $("#btn-destroy-confirm").on("click", function () {
        try {
            Storage.clear();
            window.location.reload();
        }
        catch (err) {
            console.error(err);
            Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
        }
    });
    // --- button add players - opens modal ---
    $("#btn-add-players").on("click", function () {
        // let player = new Player.Player().random();
        let player = new Player.Player();
        PlayerForm.write(player);
    });
    // --- modal add/edit player buttons ---------------------------------------------------------------------------
    // --- button add player - form submit ---
    $("#btn-add-player").on("click", function () {
        try {
            let player = new Player.Player().from_simple_obj(PlayerForm.read());
            let player_id = squad.add(player);
            Storage.save(STORE_SQUAD, squad.to_simple_obj())
            tb_squad.append(player, player_id).draw(squad);
            set_training_stages_player_default_checkboxes(player_id, training);
            let trained_squad = training.calc();
            Storage.save(STORE_TRAINING, training.to_simple_obj());
            tb_result.reload(squad, trained_squad);
            reload_training_stages_tables(tbs_stage, training);
            match.update_squad(trained_squad);
            Storage.save(STORE_MATCH, match.to_simple_obj());
            form_lineup.update_all_select_options();
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
            match.update_squad(trained_squad);
            Storage.save(STORE_MATCH, match.to_simple_obj());
            form_lineup.update_all_select_options();
            cards_ratings.update();
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
    // --- On 'paste data from clipboard' to add all players using Foxtrick table copy function ---
    $("body").on("paste", function (e) {
        // don't try to do pasting of full table if 'add player' modal window is visible
        if(!$("#modal-add-player").is(":visible")) {
            try {
                e.preventDefault();
                //e.clipboardData does not work in Firefox for security reasons, but this trick does work for now
                let paste_text = (event.clipboardData || window.clipboardData).getData('text');
                // validate right format of pasted data and add players accordingly
                if(paste_text.startsWith("[table]") && paste_text.includes("[playerid=")) {
                    for (const player_cfg of PlayerForm.parse_clipboard_table(paste_text)) {
                        try {
                            let player = new Player.Player().from_simple_obj(player_cfg);
                            let player_id = squad.add(player);
                            Storage.save(STORE_SQUAD, squad.to_simple_obj())
                            tb_squad.append(player, player_id).draw(squad);
                            set_training_stages_player_default_checkboxes(player_id, training);
                            let trained_squad = training.calc();
                            Storage.save(STORE_TRAINING, training.to_simple_obj());
                            tb_result.reload(squad, trained_squad);
                            reload_training_stages_tables(tbs_stage, training);
                            match.update_squad(trained_squad);
                            Storage.save(STORE_MATCH, match.to_simple_obj());
                            form_lineup.update_all_select_options();
                            Toast.show({
                                result: 'success',
                                reason: 'Added:',
                                msg: player.name.to_str(),
                                delay: 5000
                            });
                        }
                        catch (err) {
                            if(err instanceof SquadError) {
                                Toast.show({result: 'fail', reason: 'Error:', msg: err.message});
                            } else {
                                console.error(err);
                                Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
                            }
                        }
                    }
                }
                else {
                    Toast.show({
                        result: 'fail',
                        reason: 'Error:',
                        msg: "Trying to paste data in unknown format!",
                        delay: 5000
                    });
                }
            }
            catch (err) {
                console.error(err);
                Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
            }
        }
    });
    // --- On 'paste data from clipboard' to 'add player' modal window ---
    $("#modal-add-player").on("paste", function (e) {
        try {
            e.preventDefault();
            //e.clipboardData does not work in Firefox for security reasons, but this trick does work for now
            let paste_text = (event.clipboardData || window.clipboardData).getData('text');
            // validate paste text format and add/edit player accordingly
            if(paste_text.includes("[playerid=")) {
                // check if player is really using 'Copy to clipboard' - forbid 'Copy player ad' data pasting
                if (!paste_text.includes("HTMS ") && !paste_text.startsWith("[table]")) {
                    let player_data = PlayerForm.read();
                    let player_cfg = PlayerForm.parse_clipboard_player(paste_text);
                    // edit player
                    if (Number.parseInt(player_data.id) > 0) {
                        let player = new Player.Player(player_cfg);
                        PlayerForm.write(player, player_data.id);
                    }
                    // add player
                    else {
                        let player = new Player.Player(player_cfg);
                        PlayerForm.write(player);
                    }
                    // nick field label update
                    new mdb.Input($("#input-player-nick").parent('.form-outline').get(0)).update();
                } else {
                    Toast.show({
                        result: 'fail',
                        reason: 'Error:',
                        msg: "Use 'Copy to clipboard' from player page to paste player data!",
                        delay: 5000
                    });
                }
            }
            else {
                Toast.show({result: 'fail', reason: 'Error:', msg: "Trying to paste data in unknown format!"});
            }
        }
        catch (err) {
            console.error(err);
            Toast.show({result: 'fail', reason: 'Error:', msg: "Application error!"});
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
            tb_squad.draw(squad);
            unset_training_stages_player_default_checkboxes(player_id, training);
            let trained_squad = training.calc();
            Storage.save(STORE_TRAINING, training.to_simple_obj());
            tb_result.reload(squad, trained_squad);
            reload_training_stages_tables(tbs_stage, training);
            match.remove_player(player_id);
            form_lineup.remove_player(player_id);
            match.update_squad(trained_squad);
            Storage.save(STORE_MATCH, match.to_simple_obj());
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
            tb_squad.append(new_player, new_player_id).draw(squad);
            Storage.save(STORE_SQUAD, squad.to_simple_obj());
            set_training_stages_player_default_checkboxes(new_player_id, training);
            let trained_squad = training.calc();
            Storage.save(STORE_TRAINING, training.to_simple_obj());
            tb_result.reload(squad, trained_squad);
            reload_training_stages_tables(tbs_stage, training);
            match.update_squad(trained_squad);
            Storage.save(STORE_MATCH, match.to_simple_obj());
            form_lineup.update_all_select_options();
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
            match.update_squad(training.get_trained_squad());
            Storage.save(STORE_MATCH, match.to_simple_obj());
            form_lineup.update_all_select_options();
            cards_ratings.update();
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
            match.update_squad(trained_squad);
            Storage.save(STORE_MATCH, match.to_simple_obj());
            form_lineup.update_all_select_options();
            cards_ratings.update();
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
        match.update_squad(final_trained_squad);
        Storage.save(STORE_MATCH, match.to_simple_obj());
        form_lineup.update_all_select_options();
        cards_ratings.update();
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
        match.update_squad(final_trained_squad);
        Storage.save(STORE_MATCH, match.to_simple_obj());
        form_lineup.update_all_select_options();
        cards_ratings.update();
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
        match.update_squad(final_trained_squad);
        Storage.save(STORE_MATCH, match.to_simple_obj());
        form_lineup.update_all_select_options();
        cards_ratings.update();
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
                match.update_squad(trained_squad);
                Storage.save(STORE_MATCH, match.to_simple_obj());
                form_lineup.update_all_select_options();
                cards_ratings.update();
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
                match.update_squad(trained_squad);
                Storage.save(STORE_MATCH, match.to_simple_obj());
                form_lineup.update_all_select_options();
                cards_ratings.update();
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
            $(row.child()).addClass('no-hover-row');
            tr.addClass('shown');
            $("[data-mdb-toggle=popover]").popover();
        }
    });
    // -----------------------------------------------------------------------------------------------------------------
    // --- tb_result - show player details ---
    tb_result.datatable.on('click', 'tbody td.td-collapsible', function () {
        let tr = $(this).closest('tr');
        let row = tb_result.datatable.row(tr);
        let player_id = tb_result.get_id(tr);
        let player = training.get_trained_squad().get(player_id);

        if(row.child.isShown()) {
            row.child.hide();
            tr.removeClass('shown');
        }
        else {
            row.child(ExtendedPlayerDetails.html(player)).show();
            $(row.child()).addClass('no-hover-row');
            tr.addClass('shown');
            $("[data-mdb-toggle=popover]").popover();
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
            $(row.child()).addClass('no-hover-row');
            tr.addClass('shown');
            $("[data-mdb-toggle=popover]").popover();
        }
    });

    // --- lineup ------------------------------------------------------------------------------------------------------
    // --- change position order in lineup  ---
    $('.select-lineup-ord').on('change', function () {
        let pos = this.attributes.position.value;
        form_lineup.read_order(pos);
        cards_ratings.update();
        Storage.save(STORE_MATCH, match.to_simple_obj());
    });
    // --- change player in lineup  ---
    $('.select-lineup-player').on('change', function () {
        let pos = this.attributes.position.value;
        form_lineup.read_player(pos);
        cards_ratings.update();
        Storage.save(STORE_MATCH, match.to_simple_obj());
    });
    // --- reset lineup ---
    $('#lineup-reset').on('click', function () {
        match = new Match(training.get_trained_squad());
        form_lineup.reset(match);
        cards_ratings.reset(match);
        Storage.save(STORE_MATCH, match.to_simple_obj());
    });
    // -----------------------------------------------------------------------------------------------------------------

    // --- match setup -------------------------------------------------------------------------------------------------
    // --- change team attitude  ---
    $('#select-match-attitude').on('change', function () {
        form_match_setup.read_attitude();
        cards_ratings.update();
        Storage.save(STORE_MATCH, match.to_simple_obj());
    });
    // --- change match venue  ---
    $('#select-match-venue').on('change', function () {
        form_match_setup.read_venue();
        cards_ratings.update();
        Storage.save(STORE_MATCH, match.to_simple_obj());
    });
    // --- change team spirit  ---
    $('#input-match-spirit').on('change', function () {
        form_match_setup.read_team_spirit();
        cards_ratings.update();
        Storage.save(STORE_MATCH, match.to_simple_obj());
    });
    // --- change confidence  ---
    $('#input-match-confidence').on('change', function () {
        form_match_setup.read_confidence();
        cards_ratings.update();
        Storage.save(STORE_MATCH, match.to_simple_obj());
    });
    // --- change play style  ---
    $('#input-match-play-style').on('change', function () {
        form_match_setup.read_play_style();
        cards_ratings.update();
        Storage.save(STORE_MATCH, match.to_simple_obj());
    });
    // -----------------------------------------------------------------------------------------------------------------

    // --- decorate collapsible item with +/- ----------------------------------------------------------------------
    $('body').on('click', '.gg-collapsible', function () {
        $(this).children('svg').toggleClass('fa-plus fa-minus');    // this works when font awesome is imported as js
        // $(this).children('i').toggleClass('fa-plus fa-minus');      // this works when font awesome is imported as css
        // this.scrollIntoView();  // + scroll this accordion to view
        // $('html,body').animate({scrollTop: $(this).offset().top}, 'slow');
        // update all form notches to fit the label text (apparently need to be visible to work)
        document.querySelectorAll('.form-outline').forEach((formOutline) => {
            new mdb.Input(formOutline).update();
        });
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
function init_from_store(squad, training, match, tb_squad, tb_result, tbs_stage, cards_ratings, form_match_setup, form_lineup) {
    squad = new Squad().from_simple_obj(Storage.load(STORE_SQUAD));
    training = new Training(squad).from_simple_obj(Storage.load(STORE_TRAINING));
    tb_squad.reload(squad);

    // init training stages accordion + reload result table
    tb_result.clear(squad);
    TrainingStagesAccordion.reset();
    for(const i in training.stages_order) {
        let stage_n = training.stages_order[i];
        let training_stage = training.stages[stage_n-1];
        TrainingStagesAccordion.add_stage(stage_n, training_stage);
        if(Number.parseInt(i) === training.stages_order.length-1) {
            const trained_squad = training.get_trained_squad(stage_n);
            tb_result.reload(squad, trained_squad);
            match = new Match(trained_squad);
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
    // init ratings
    if(!match || training.stages_order.length <= 0) {
        match = new Match(squad);
    }
    match.from_simple_obj(Storage.load(STORE_MATCH));
    if(!form_lineup) {
        form_lineup = new LineupForm(match);
        form_lineup.update_all_select_options();
    } else {
        form_lineup.reset(match);
    }
    if(!form_match_setup) {
        form_match_setup = new MatchSetupForm(match);
    }
    form_match_setup.reset(match);
    if(!cards_ratings) {
        cards_ratings = new Ratings(match);
        cards_ratings.update();
    } else {
        cards_ratings.reset(match);
    }
    return {squad: squad, training: training, match: match, tb_squad: tb_squad, tb_result: tb_result, tbs_stage: tbs_stage, cards_ratings: cards_ratings, form_match_setup: form_match_setup, form_lineup: form_lineup};
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