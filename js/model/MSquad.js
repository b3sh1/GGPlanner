import * as Player from "./MPlayer.js";
import {round2} from "../utils.js";

const MAX_PLAYERS = 50;

class Squad {
    constructor() {
        this.players = {};
        this.next_id = 1;
        this.summary = {
            total_wages: 0,
            average_wage: 0,
            total_tsi: 0,
            average_tsi: 0,
            average_stamina: 0,
            average_age: 0,
        };
    }

    get(player_id) {
        return this.players[player_id];
    }

    add(player) {
        if (Object.keys(this.players).length > MAX_PLAYERS) {
            console.warn("Cannot have more than 50 players!");
            throw new SquadError("Cannot have more than 50 players!");
        }

        for (let key in this.players) {
            if (player.name.to_str() === this.players[key].name.to_str()) {
                player.name.nick = this.#derive_nick(player);
            }
        }

        let id = this.next_id;

        if(id in this.players) {
            console.error("Trying to rewrite existing player from 'Squad.add(player)' function!");
            throw new SquadError("Application error!");
        }

        this.players[id] = player;
        this.next_id += 1;
        this.update_summary();
        return id;
    }

    edit(player_data, player_id) {
        const player = this.players[player_id].from_simple_obj(player_data)
        this.update_summary();
        return player;
    }

    remove(player_id) {
        if (!(player_id in this.players)) {
            console.error("Trying to remove non-existing player!");
            throw new SquadError("Application error!");
        }
        let player_name = this.players[player_id].name.to_str();
        delete this.players[player_id];
        this.update_summary();
        return player_name;
    }

    clone(player_id) {
        if (!(player_id in this.players)) {
            console.error("Trying to clone non-existing player!");
            throw new SquadError("Application error!");
        }
        let player = new Player.Player(this.players[player_id].to_simple_obj());
        return this.add(player);
    }


    #derive_nick(player) {
        let nick_rank = Squad.#get_nick_rank(player.name.nick);
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
        for (let key in this.players) {
            if (player.name.to_str() === this.players[key].name.to_str()) {
                player.name.nick = this.#derive_nick(player);
            }
        }
        return player.name.nick;
    }

    static #get_nick_rank(nick) {
        if ((nick.slice(-2) === 'st' || nick.slice(-2) === 'nd' || nick.slice(-2) === 'rd' || nick.slice(-2) === 'th')
            && nick.slice(0, 4) === 'the ' && (nick.length === 7 || nick.length === 8)) {
            return parseInt(nick.slice(-4, -2).trim());
        }
        return -1;
    }

    update_summary() {
        let total_players = Object.keys(this.players).length;
        let total_wages = 0;
        let total_tsi = 0;
        let total_stamina = 0;
        let players_ages = [];
        for(const id in this.players) {
            total_wages += this.players[id].wage;
            total_tsi += this.players[id].tsi;
            total_stamina += this.players[id].st;
            players_ages.push(this.players[id].age);
        }
        this.summary.average_stamina = round2(total_stamina / total_players);
        this.summary.total_tsi = total_tsi;
        this.summary.average_tsi = Math.round(total_tsi / total_players);
        this.summary.total_wages = total_wages;
        this.summary.average_wage = Math.round(total_wages / total_players);
        this.summary.average_age = Player.Age.average(players_ages).to_str();
    }


    // for serialization
    to_simple_obj() {
        let obj = {next_id: this.next_id, players: {}};
        for(let key in this.players) {
            obj.players[key] = this.players[key].to_simple_obj();
        }
        return obj;
    }

    // for deserialization
    from_simple_obj(obj) {
        if(!obj) {
            return this;
        }
        this.next_id = obj.next_id;
        if(obj.players) {
            for(let key in obj.players) {
                if(key in this.players) {
                    this.players[key].from_simple_obj(obj.players[key]);  // just rewrite existing player if exists
                }
                else {
                    this.players[key] = new Player.Player(obj.players[key]);  // create new player if doesnt exist
                }
            }
        }
        this.update_summary();
        return this;
    }
}

class SquadError extends Error {
    constructor(message) {
        super(message);
        this.name = "SquadError";
    }
}


export {Squad, SquadError};