import * as Player from "./model/MPlayer.js";
import {Squad} from "./model/MSquad.js";
import * as PlayerForm from "./controller/CPlayerForm.js";
import * as Toast from "./controller/CToast.js";
import {SquadTable} from "./controller/CSquadTable.js"





//--------------------------- APP -------------------=------------------------------------------------------------------

let players = {};

function main() {
    let squad = new Squad().from_simple_obj(storage_load('squad'));
    let tb_squad = new SquadTable().load_data(squad);
    PlayerForm.init();  // hidden for now

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
        squad.from_simple_obj(storage_load('squad'));
        tb_squad.reload(squad);
        // // setting unique to not spam screen with toasts - only one + no autohide (=> delay=-1)
        // Toast.show({
        //     result: 'warning', reason: 'Warning', msg: 'Data modified from other instance.', delay: -1, unique: true,
        // });
    });


    // --- button add players - opens modal ---
    $("#btn-add-players").on("click", function () {
        let player = new Player.Player().random();
        PlayerForm.write(player);
    });
    // --- modal add/edit player buttons ---------------------------------------------------------------------------
    // --- button add player - form submit ---
    $("#btn-add-player").on("click", function () {
        let player = new Player.Player(PlayerForm.read());
        let player_id = squad.add(player);
        storage_save('squad', squad.to_simple_obj())
        tb_squad.append(player, player_id).draw();
        // Toast.show(result);
    });
    // --- button save player - form submit ---
    $("#btn-save-player").on("click", function () {
        let player_data = PlayerForm.read();
        let player = squad.edit(player_data, player_data.id);
        storage_save('squad', squad.to_simple_obj())
        // Toast.show(result);
        // after editing rewrite the whole table
        tb_squad.reload(squad);
    });
    // --- button random player ---
    $("#btn-random-player").on("click", function () {
        let player_data = PlayerForm.read();
        // edit player - keep name and age
        if (Number.parseInt(player_data.id) > 0) {
            let player = new Player.Player(player_data).randomize_attributes();
            PlayerForm.write(player, player_data.id);
        }
        // add player - get also random name
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
            let player = new Player.Player(player_data).load_from_preset(Player.presets.default);
            PlayerForm.write(player, player_data.id);
        }
        // add player
        else {
            let player = new Player.Player(Player.presets.default);
            PlayerForm.write(player);
        }
        // nick field label update - to not overlap with new randomized value
        new mdb.Input($("#input-player-nick").parent('.form-outline').get(0)).update();
    });
    // -------------------------------------------------------------------------------------------------------------
    // --- table player edit buttons -------------------------------------------------------------------------------
    // --- button remove player ---
    tb_squad.datatable.on('click', '.btn-delete-player', function () {
        let player_id = tb_squad.delete($(this.closest('tr')));
        let player_name = squad.remove(player_id);
        storage_save('squad', squad.to_simple_obj());
        tb_squad.draw();
        //Toast.show(result);
    });
    // --- button edit player => bootstrap auto-opens modal with form ---
    tb_squad.datatable.on('click', '.btn-edit-player', function () {
        let player_id = tb_squad.get_id($(this.closest('tr')));
        PlayerForm.write(squad.get(player_id), player_id);
    });
    // --- button clone player ---
    tb_squad.datatable.on('click', '.btn-clone-player', function () {
        let old_player_id = tb_squad.get_id($(this.closest('tr')));
        let new_player_id = squad.clone(old_player_id);
        tb_squad.append(squad.get(new_player_id), new_player_id).draw();
        storage_save('squad', squad.to_simple_obj());
        //Toast.show(result);
    });
    // ------------------------------------------------------------------------------------------------------------
    // --- decorate collapsible item with +/- ----------------------------------------------------------------------
    $('.gg-collapsible').on('click', function () {
        $(this).children('i').toggleClass('fas fa-plus fas fa-minus');
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

// write data to persistent storage
function storage_save(name, simple_obj) {
    localStorage.setItem(name, JSON.stringify(simple_obj));
    return name;
}

// load data from persistent storage
function storage_load(name) {
    return JSON.parse(localStorage.getItem(name));
}


// -------------------------- View -------------------------------------------------------------------------------------



//--------------------------- View --------------------------------------------------------------------------------





main();