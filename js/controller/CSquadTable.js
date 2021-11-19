import * as Player from "../model/MPlayer.js";


function init(tb, players) {
    for (let id in players) {
        if (id === 'next_id') {
            continue;
        }
        append(tb, players[id], id);
    }
    tb.draw();
}

function append(tb, player, id) {
    // write player to the table
    // name, age
    let row = [
        id,
        player.name.to_str(),
        player.age.to_str(),
    ];
    // other player attributes
    for (let attr in Player.attributes) {
        if (Player.attributes[attr].tb_show) {
            row.push(player[attr]);
        }
    }
    // edit buttons
    row.push('' +
        '<div style="font-size: .75em">' +
        '<button type="button" class="btn-delete-player btn btn-outline-info btn-sm ripple-surface me-1">' +
        '<i class="fas fa-times fa-lg"></i>' +
        '</button>' +
        '<button type="button" class="btn-clone-player btn btn-outline-info btn-sm ripple-surface me-1">' +
        '<i class="far fa-clone"></i>' +
        '</button>' +
        '<button type="button" class="btn-edit-player btn btn-outline-info btn-sm ripple-surface"' +
        ' data-mdb-toggle="modal" data-mdb-target="#modal-add-player">' +
        '<i class="fas fa-pencil-alt"></i>' +
        '</button>' +
        '</div>'
    );
    tb.row.add(row);
}

export {init, append};