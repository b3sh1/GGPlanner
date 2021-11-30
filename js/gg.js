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
import {Training, TrainingStage, default_stage_cfg} from "./model/MTraining.js";
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
            let trained_squad = training.calc();
            tb_result.reload(squad, trained_squad);
            for(let stage of tbs_stage) {
                stage.reload(training.trained_squads[stage.stage_n-1], training.trained_squads[stage.stage_n]);
            }
            Toast.show({result: 'success', reason: 'Added:', msg: player.name.to_str()});
        }
        catch (err) {
            if(err instanceof SquadError) {
                Toast.show({result: 'fail', reason: 'Error:', msg: err.message});
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
            let trained_squad = training.calc();
            tb_result.reload(squad, trained_squad);
            for(let stage of tbs_stage) {
                stage.reload(training.trained_squads[stage.stage_n-1], training.trained_squads[stage.stage_n]);
            }
            Toast.show({result: 'success', reason: 'Edited:', msg: player.name.to_str()});
        }
        catch (err) {
            if(err instanceof SquadError) {
                Toast.show({result: 'fail', reason: 'Error:', msg: err.message});
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
            let trained_squad = training.calc();
            tb_result.reload(squad, trained_squad);
            for(let stage of tbs_stage) {
                stage.reload(training.trained_squads[stage.stage_n-1], training.trained_squads[stage.stage_n]);
            }
            Toast.show({result: 'warning', reason: "Removed:", msg: player_name});
        }
        catch (err) {
            if(err instanceof SquadError) {
                Toast.show({result: 'fail', reason: 'Error:', msg: err.message});
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
            let trained_squad = training.calc();
            tb_result.reload(squad, trained_squad);
            for(let stage of tbs_stage) {
                stage.reload(training.trained_squads[stage.stage_n-1], training.trained_squads[stage.stage_n]);
            }
            Toast.show({result: 'success', reason: 'Added:', msg: new_player.name.to_str()});
        }
        catch (err) {
            if(err instanceof SquadError) {
                Toast.show({result: 'fail', reason: 'Error:', msg: err.message});
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
        // try {
        let training_stage = new TrainingStage(TrainingStageForm.read());
        let n = training.add_stage(training_stage); // auto-calc
        // let trained_squad = training.calc();
        tb_result.reload(squad, training.trained_squads[n]);
        TrainingStageAccordion.add_stage(n, training_stage, training.trained_squads[n]);
        let tb_stage = new StageTable(n, training_stage);
        tb_stage.load_data(training.trained_squads[n-1], training.trained_squads[n]);
        tbs_stage.push(tb_stage);
        Toast.show({result: 'success', reason: 'Added:', msg: `${n}. training stage`});
        // }
        // catch (err) {
        //     console.error(err);
        //     // if(err instanceof SquadError) {
        //     //     Toast.show({result: 'fail', reason: 'Error:', msg: err.message});
        //     // }
        // }
    });
    // --- training stage checkboxes -----------------------------------------------------------------------------------
    for(const attr in Player.attributes) {
        if(Player.attributes[attr].tb_checkbox) {
            $('#section-training-stages').on('click', `.checkbox-${attr}`, {'attr': attr}, function (event) {
                let attr = event.data.attr;
                let stage_n = this.attributes.stage.value;
                // tbs_stage
                console.log($(this.closest('tr')));
            });
        }
    }
    // --- decorate collapsible item with +/- ----------------------------------------------------------------------
    $('body').on('click', '.gg-collapsible', function () {
        $(this).children('svg').toggleClass('fa-plus fa-minus');    // this works when font awesome is imported as js
        $(this).children('i').toggleClass('fa-plus fa-minus');      // this works when font awesome is imported as css
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

// await new Promise(r => setTimeout(r, 5000));
// main();

$(document).ready(function () {
    main();
});