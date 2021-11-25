import * as Player from "./model/MPlayer.js";
import {Squad, SquadError} from "./model/MSquad.js";
import * as PlayerForm from "./controller/CPlayerForm.js";
import * as TrainingStageForm from "./controller/CTrainingStageForm.js";
import * as Toast from "./controller/CToast.js";
import {SquadTable} from "./controller/CSquadTable.js";
import * as Storage from "./controller/CPersistentStorage.js";
import * as Header from "./controller/CHeader.js";
import {presets} from "./model/MPlayer.js";
import {Training, TrainingStage, default_stage_cfg} from "./model/MTraining.js";

const STORE_SQUAD = "squad";

function main() {
    // Header.init();
    let squad = new Squad().from_simple_obj(Storage.load(STORE_SQUAD));
    let tb_squad = new SquadTable().load_data(squad);
    PlayerForm.init();  // hidden for now
    TrainingStageForm.init();

    let training = new Training(squad);
    // // ts_cfg.stop.weeks.val = 335;
    // // ts_cfg.stop.skill = {active: true, player_id: 8, type: 'pm', lvl: 14.0};
    // // ts_cfg.stop.age = {active: true, player_id: 8, years: 18, days: 0};
    // let TS1 = new TrainingStage();
    // TS1.training = "F_PM";
    // TS1.stop.age = {active: true, player_id: 8, years: 18, days: 0};
    // let TS2 = new TrainingStage();
    // TS2.training = "F_SC";
    // TS2.stop.age = {active: true, player_id: 8, years: 19, days: 0};
    // let T = new Training(squad,[TS1, TS2]);
    // let TS3 = new TrainingStage();
    // TS3.training = "F_WG";
    // TS3.stop.age = {active: true, player_id: 8, years: 21, days: 0};
    // T.add_stage(TS3);
    // let trained_squad = T.calc();
    // console.log(squad.players[8].age);
    // console.log(squad.players[8].get_attributes());
    // console.log(trained_squad.players[8].age);
    // console.log(trained_squad.players[8].get_attributes());

    // console.log(T.stages[2].trained_squad.players[8].age);
    // console.log(T.stages[2].trained_squad.players[8].get_attributes());
    // console.log(T.stages[2].trained_squad.players[8].pm);
    // console.log(T.stages[2].trained_squad.players[9].age);
    // console.log(T.stages[2].trained_squad.players[9].get_attributes());
    // console.log(T.stages[2].trained_squad.players[9].pm);

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
            training.calc();
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
            training.calc();
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
            training.calc();
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
            training.calc();
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
    // --- modal add/edit player buttons ---------------------------------------------------------------------------
    // --- button add player - form submit ---
    $("#btn-add-training-stage").on("click", function () {
        try {
            let training_stage = new TrainingStage(TrainingStageForm.read());
            let n = training.add_stage(training_stage);
            let trained_squad = training.calc();
            Toast.show({result: 'success', reason: 'Added:', msg: `${n}. training stage`});
        }
        catch (err) {
            console.error(err);
            // if(err instanceof SquadError) {
            //     Toast.show({result: 'fail', reason: 'Error:', msg: err.message});
            // }
        }
    });
    // --- decorate collapsible item with +/- ----------------------------------------------------------------------
    $('.gg-collapsible').on('click', function () {
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