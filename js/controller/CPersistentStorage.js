import * as Player from "../model/MPlayer.js";

// write data to persistent storage
function save() {
    let serializable_players = {next_id: players.next_id};
    for (let key in players) {
        if (key !== 'next_id') {
            serializable_players[key] = players[key].to_simple_obj();
        }
    }
    localStorage.setItem('players', JSON.stringify(serializable_players));
}

// load data from persistent storage
function load() {
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

export {save, load};