import * as Player from "./model/MPlayer.js";
import {Squad} from "./model/MSquad.js";
import * as PlayerForm from "./controller/CPlayerForm.js";
import * as Toast from "./controller/CToast.js";
import * as SquadTable from "./controller/CSquadTable.js";




//--------------------------- APP -------------------=------------------------------------------------------------------

let players = {};

function main() {
    let squad = new Squad();

    // const tb_squad_placeholder = '<div class="table-responsive px-3"><table id="tb-squad" class="table table-striped table-hover"></table></div>'
    // new SectionCollapsible({
    //     parent: $('#squad'),
    //     name: "squad",
    //     expanded: true,
    //     children: [tb_squad_placeholder],
    // }).render();
    // --- table players -------------------------------------------------------------------------------------------
    let tb_squad_header = [{title: 'id', width: 50}, {title: "Name", width: 300}, {title: "Age", width: 50}];
    for (let key in Player.attributes) {
        if (Player.attributes[key].tb_show) {
            tb_squad_header.push({title: key.toUpperCase()});
        }
    }
    tb_squad_header.push({title: "Edit", width: 155});
    let tb_squad = $('#tb-squad').DataTable({
        paging: false,
        searching: false,
        bInfo: false,
        order: [[0, "asc"]],
        columns: tb_squad_header,
        autoWidth: true,
        responsive: true,
        fixedHeader: false,
        columnDefs: [
            {
                targets: [0],
                visible: true,
            },
            {
                targets: [1],
                responsivePriority: 1,
            },
            {
                targets: [-1],
                orderable: false,
                responsivePriority: 2,
            },
        ],
        createdRow: function (row, data, dataIndex) {
            $('td:last-child', row).css('min-width', '155px');
        },
    });
    // --- init squad table data ---
    storage_load();
    SquadTable.init(tb_squad, players);

    // --- init player form - hidden modal ---
    PlayerForm.init();

    // --- listen to storage changes from other instances (sync) ---
    window.addEventListener('storage', function () {
        // this event fires only when storage was not modified from within this page
        storage_load();
        tb_squad.clear();
        SquadTable.init(tb_squad, players);
        // setting unique to not spam screen with toasts - only one + no autohide (=> delay=-1)
        Toast.show({
            result: 'warning', reason: 'Warning', msg: 'Data modified from other instance.', delay: -1, unique: true,
        });
    });
    // --- button add players - opens modal ---
    $("#btn-add-players").on("click", function () {
        hide_form_buttons();
        $("#btn-add-player").removeClass('d-none');
        let player = new Player.Player().random();
        PlayerForm.write(player);
    });
    // $("#modal-add-player").on('shown.bs.modal', function() {
    //     $('#input-player-st').focus();
    // });
    // --- modal add/edit player buttons ---------------------------------------------------------------------------
    // --- button add player - form submit ---
    $("#btn-add-player").on("click", function () {
        let player = new Player.Player(PlayerForm.read());
        let result = add_player(tb_squad, player);
        Toast.show(result);
    });
    // --- button save player - form submit ---
    $("#btn-save-player").on("click", function () {
        let player_data = PlayerForm.read();
        let result = edit_player(player_data, player_data.id);
        Toast.show(result);
        // after editing rewrite the whole table
        tb_squad.clear();
        SquadTable.init(tb_squad, players);
    });
    // --- button random player ---
    $("#btn-random-player").on("click", function () {
        let player_data = PlayerForm.read();
        // edit player
        if (Number.parseInt(player_data.id) > 0) {
            let player = new Player.Player(player_data).randomize_attributes();
            PlayerForm.write(player, player_data.id);
        }
        // add player
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
    tb_squad.on('click', '.btn-delete-player', function () {
        let result = remove_player(tb_squad, $(this.closest('tr')));
        Toast.show(result);
    });
    // --- button edit player - opens modal ---
    tb_squad.on('click', '.btn-edit-player', function () {
        hide_form_buttons();
        $("#btn-save-player").removeClass('d-none');
        let player_id = tb_squad.row($(this.closest('tr'))).data()[0];
        PlayerForm.write(get_player(player_id), player_id);
    });
    // --- button clone player ---
    tb_squad.on('click', '.btn-clone-player', function () {
        let result = clone_player(tb_squad, $(this.closest('tr')));
        Toast.show(result);
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

function save_new_player(player) {
    let id = players.next_id;
    if (players[id]) {
        return -1
    }
    players[id] = player;
    players.next_id += 1;
    storage_save();
    return id;
}

function add_player(tb, player) {
    let is_big_squad = is_too_many_players();
    if (is_big_squad.result) {
        return is_big_squad.toast_cfg;
    }

    for (let key in players) {
        if (key !== 'next_id') {
            if (players[key].name.to_str() === player.name.to_str()) {
                player.name.nick = derive_nick(player);
            }
        }
    }

    let id = save_new_player(player);

    if (id < 0) {
        console.error("Trying to rewrite existing player from 'add_player()' function!");
        return {result: 'fail', reason: 'Error:', msg: 'Application error!'};
    }

    // write player to the table
    SquadTable.append(tb, player, id);
    tb.draw();
    return {result: 'success', reason: 'Added:', msg: player.name.to_str()};
}

function get_player(player_id) {
    return players[player_id];
}

function edit_player(player_data, player_id) {
    players[player_id].from_simple_obj(player_data);
    storage_save();
    return {result: 'success', reason: 'Edited:', msg: players[player_id].name.to_str()}
}

function remove_player(tb, row) {
    let id = tb.row(row).data()[0];
    if (!players[id]) {
        console.error("Trying to remove non-existing player!");
        return {result: 'fail', reason: 'Error:', msg: 'Application error!'};
    }
    let player_name = players[id].name.to_str();
    delete players[id];
    storage_save();
    tb.row(row).remove().draw();
    return {result: 'warning', reason: "Removed:", msg: player_name};
}

function clone_player(tb, row) {
    let id = tb.row(row).data()[0];
    if (!players[id]) {
        console.error("Trying to duplicate non-existing player!");
        return {result: 'fail', reason: 'Error:', msg: 'Application error!'};
    }
    //deep copy player
    let player_data = JSON.stringify(players[id].to_simple_obj());
    player_data = JSON.parse(player_data);
    let player = new Player.Player(player_data);
    player.name.nick = derive_nick(player);
    return add_player(tb, player);
}

function derive_nick(player) {
    let nick_rank = get_nick_rank(player.name.nick);
    switch (nick_rank) {
        case -1:
            player.name.nick = 'the 2nd';
            break;
        case 0:
            player.name.nick = 'the 1st';
            break;
        case 1:
            player.name.nick = 'the 2nd';
            break;
        case 2:
            player.name.nick = 'the 3rd';
            break;
        default:
            player.name.nick = `the ${nick_rank + 1}th`;
    }
    for (let key in players) {
        if (key !== 'next_id') {
            if (players[key].name.to_str() === player.name.to_str()) {
                player.name.nick = derive_nick(player);
            }
        }
    }
    return player.name.nick;
}

function get_nick_rank(nick) {
    if ((nick.slice(-2) === 'st' || nick.slice(-2) === 'nd' || nick.slice(-2) === 'rd' || nick.slice(-2) === 'th')
        && nick.slice(0, 4) === 'the ' && (nick.length === 7 || nick.length === 8)) {
        return parseInt(nick.slice(-4, -2).trim());
    }
    return -1;
}



// don't allow to add more than 50 players
function is_too_many_players() {
    if (Object.keys(players).length > 50) {
        return {result: true, toast_cfg: {result: 'fail', reason: 'Failed:', msg: 'Cannot have more than 50 players!'}};
    }
    return {result: false, toast_cfg: null};
}

// write data to persistent storage
function storage_save() {
    let serializable_players = {next_id: players.next_id};
    for (let key in players) {
        if (key !== 'next_id') {
            serializable_players[key] = players[key].to_simple_obj();
        }
    }
    localStorage.setItem('players', JSON.stringify(serializable_players));
}

// load data from persistent storage
function storage_load() {
    // init players with default val
    players = {next_id: 1};
    // read players from persistent storage
    let deserialized_players = JSON.parse(localStorage.getItem('players'));
    if (deserialized_players) {
        for (let key in deserialized_players) {
            if (key === 'next_id') {
                players[key] = deserialized_players[key];
            } else {
                players[key] = new Player.Player(deserialized_players[key]);
            }
        }
    }
}

function mouse_enter(e) {
    e.addClass("gg-hover");
}

function mouse_leave(e) {
    e.removeClass("gg-hover");
}

function decorate_skill_value(v) {
    //return `<span class='badge' style='color: ${skill_lvl[v].txt_color}; background-color: ${skill_lvl[v].bg_color}'>${skill_lvl[v].name} (${v})</span>`
    return `<span class='badge' style='color: ${Player.levels[v].txt_color}; 
            background-color: ${Player.levels[v].bg_color}'>${v}</span>`
}


// -------------------------- View -------------------------------------------------------------------------------------



//--------------------------- View --------------------------------------------------------------------------------

function hide_form_buttons() {
    $("#btn-add-player").addClass('d-none');
    $("#btn-save-player").addClass('d-none');
}



main();