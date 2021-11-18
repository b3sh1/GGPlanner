// -------------------------- View -------------------------------------------------------------------------------------


function tb_append_player(tb, player, id) {
    // write player to the table
    // name, age
    let row = [
        id,
        player.name.to_str(),
        player.age.to_str(),
    ];
    // other player attributes
    for(let key in player_attributes) {
        if(player_attributes[key].tb_show) {
            row.push(player[key]);
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
        'data-mdb-toggle="modal" data-mdb-target="#modal-add-player">' +
        '<i class="fas fa-pencil-alt"></i>' +
        '</button>' +
        '</div>'
    );
    tb.row.add(row);
}

// init table data from persistent storage
function tb_init_players(tb) {
    for(let id in players) {
        if(id === 'next_id') {
            continue;
        }
        tb_append_player(tb, players[id], id);
    }
    tb.draw();
}


//--------------------------- APP -------------------=------------------------------------------------------------------
let players = {};

function save_new_player(player) {
    let id = players.next_id;
    if(players[id]) {
        return -1
    }
    players[id] = player;
    players.next_id += 1;
    storage_save();
    return id;
}

function add_player(tb, player) {
    let is_big_squad = is_too_many_players();
    if (is_big_squad.result){
        return is_big_squad.toast_cfg;
    }

    for(let key in players) {
        if(key !== 'next_id'){
            if(players[key].name.to_str() === player.name.to_str()) {
                player.name.nick = derive_nick(player);
            }
        }
    }

    let id = save_new_player(player);

    if(id < 0) {
        console.error("Trying to rewrite existing player from 'add_player()' function!");
        return {result: 'fail', reason: 'Error:', msg: 'Application error!'};
    }

    // write player to the table
    tb_append_player(tb, player, id);
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
    if(!players[id]) {
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
    if(!players[id]) {
        console.error("Trying to duplicate non-existing player!");
        return {result: 'fail', reason: 'Error:', msg: 'Application error!'};
    }
    //deep copy player
    let player_data = JSON.stringify(players[id].to_simple_obj());
    player_data = JSON.parse(player_data);
    let player = new Player(player_data);
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
    for(let key in players) {
        if(key !== 'next_id'){
            if(players[key].name.to_str() === player.name.to_str()) {
                player.name.nick = derive_nick(player);
            }
        }
    }
    return player.name.nick;
}

function get_nick_rank(nick) {
    if((nick.slice(-2) === 'st' || nick.slice(-2) === 'nd' || nick.slice(-2) === 'rd' || nick.slice(-2) === 'th')
        && nick.slice(0, 4) === 'the ' && (nick.length === 7 || nick.length === 8)) {
        return parseInt(nick.slice(-4, -2).trim());
    }
    return -1;
}

function generate_rnd_player() {
    let player = new Player();
    player.age.randomize();
    player.randomize_attributes();
    return player;
}

// don't allow to add more than 50 players
function is_too_many_players() {
    if (Object.keys(players).length > 50) {
        return {result: true, toast_cfg: {result: 'fail', reason: 'Failed:', msg: 'Cannot have more than 50 players!'}};
    }
    return {result: false, toast_cfg: null};
}

function storage_save() {
    // write players to persistent storage
    let serializable_players = {next_id: players.next_id};
    for(let key in players){
        if(key !== 'next_id'){
            serializable_players[key] = players[key].to_simple_obj();
        }
    }
    localStorage.setItem('players', JSON.stringify(serializable_players));
}

function storage_load() {
    // init players with default val
    players = {next_id: 1};
    // read players from persistent storage
    let deserialized_players = JSON.parse(localStorage.getItem('players'));
    if(deserialized_players) {
        for(let key in deserialized_players) {
            if(key === 'next_id'){
                players[key] = deserialized_players[key];
            }
            else
            {
                players[key] = new Player(deserialized_players[key]);
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
    return `<span class='badge' style='color: ${skill_lvl[v].txt_color}; background-color: ${skill_lvl[v].bg_color}'>${v}</span>`
}

function rsv(){
    return rand_int(0, 20);
}

//--------------------------- Utils ------------------------------------------------------------------------------------
// min and max included
function rand_int(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function rand_item(arr) {
    return arr[rand_int(0, arr.length-1)];
}

function constraint_val(val, min_val, max_val) {
    val = Math.max(val, min_val);
    val = Math.min(val, max_val);
    return val;
}

function capitalize_first(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


//--------------------------- Model ------------------------------------------------------------------------------------
// --- Age ---
let Age = function (years=17, days=0)
{
    this.years = years;
    this.days = days;

    this.add_days = function (days) {
        this.days += days;
        while (this.days >= 112) {
            this.days -= 112;
            this.years += 1;
        }
    };

    this.add_week = function () {
        this.add_days(7);
    };

    this.add_year = function () {
        this.add_days(112);
    };

    this.randomize = function () {
        this.years = rand_int(attribute_lvl.years.min, attribute_lvl.years.max);
        this.days = rand_int(attribute_lvl.days.min, attribute_lvl.days.max);
    };

    this.to_str = function () {
        return `${this.years}.${this.days}`;
    }
};

// --- Name ---
let Name = function (first="", nick="", last="") {
    this.first = first;
    this.nick = nick;
    this.last = last;

    this.to_str = function () {
        let str_name = "";
        if (this.first) {
            str_name += this.first;
        }
        if (this.nick) {
            if (str_name) {
                str_name += " ";
            }
            str_name += `'${this.nick}'`;
        }
        if (this.last) {
            if (str_name) {
                str_name += " ";
            }
            str_name += this.last;
        }
        if (!str_name) {
            str_name = "Invalid 'Erroneous' Player Name";
        }
        return str_name;
    };

    this.generate_random = function () {
        this.first = rand_item(name_pool.first);
        if (Math.random()<0.5) {
            //with very low probability give player a nick
            this.nick = rand_item(name_pool.nick);
        }
        else {
            this.nick = "";
        }
        this.last = rand_item(name_pool.last);
        return this.to_str();
    };
};

// --- Player ---
let Player = function (attr = {
    years:17, days:0, fo:8, st:8, gk:0, df:0, pm:0, wg:0, pg:0, sc:0, sp:0, lo:20, hg:false, xp:1, ls:1, tsi:0,
    first:"", nick:"", last:"", ht_id:-1, wage: 300, spec: 0, htms: 0, htms28: 0, cc: 0, fg: 0,
}){
    for(let key in attr) {
        if(key in player_attributes) {
            this[key] = attr[key];
        }
    }

    this.age = new Age(attr.years, attr.days);

    if(!(attr.first || attr.nick || attr.last)){
        this.name = new Name();
        this.name.generate_random();
    }
    else {
        this.name = new Name(attr.first, attr.nick, attr.last);
    }

    this.randomize_attributes = function () {
        for(let key in player_attributes) {
            this[key] = this.randomize_attribute(attribute_lvl[player_attributes[key].type]);
        }
    }

    this.randomize_attribute = function (attribute_levels) {
        let att_val = rand_int(attribute_levels.min, attribute_levels.max);
        if(attribute_levels.undefined && attribute_levels.undefined.includes(att_val)) {
            att_val = this.randomize_attribute(attribute_levels);
        }
        return att_val;
    }

    this.to_simple_obj = function () {
        let obj = {};
        for(let key in player_attributes) {
            obj[key] = this[key];
        }

        obj.years = this.age.years;
        obj.days = this.age.days;

        obj.first = this.name.first;
        obj.nick = this.name.nick;
        obj.last = this.name.last;

        return obj;
    }

    this.from_simple_obj = function (obj) {
        for(let key in player_attributes) {
            if(key in obj) {
                this[key] = obj[key];
            }
        }

        if('years' in obj) {
            this.age.years = obj.years;
        }
        if('days' in obj) {
            this.age.days = obj.days;
        }

        if('first' in obj) {
            this.name.first = obj.first;
        }
        if('nick' in obj) {
            this.name.nick = obj.nick;
        }
        if('last' in obj) {
            this.name.last = obj.last;
        }
    }

    this.load_from_preset = function (preset) {
        if(preset in preset_players) {
            this.from_simple_obj(preset_players[preset]);
            return true;
        }
        return false;
    }
};

// Training
let Training = function (cfg = {
    coach: 7, assistants: 10, intensity: 1, stamina: 0.1, type: 'F_PM',
    stop: {
        weeks: {set: true, val: 320},
        skill: {set: false, player_id: -1, type: null, lvl: -1},
        age: {set: false, player_id: -1, years: -1, days: -1},
    },
}) {
    // init
    for(let key in cfg) {
        this[key] = cfg[key];
    }
};


//--------------------------- Constants --------------------------------------------------------------------------------
const player_attributes = {
    "st":   {name: "Stamina",     type: "st",	    tb_show: true,	form_fld: true, },
    "fo":   {name: "Form",		  type: "fo",	    tb_show: false,	form_fld: false, },
    "gk":   {name: "Goalkeeping", type: "skill",	tb_show: true,	form_fld: true,	},
    "df":   {name: "Defending",   type: "skill",	tb_show: true,	form_fld: true, },
    "pm":   {name: "Playmaking",  type: "skill",	tb_show: true,	form_fld: true, },
    "wg":   {name: "Winger",      type: "skill",	tb_show: true,	form_fld: true, },
    "pg":   {name: "Passing",     type: "skill",	tb_show: true,	form_fld: true, },
    "sc":   {name: "Scoring",     type: "skill",	tb_show: true,	form_fld: true, },
    "sp":   {name: "Set pieces",  type: "skill",	tb_show: true,	form_fld: true, },
    "lo":   {name: "Loyalty",     type: "skill",	tb_show: false,	form_fld: false, },
    "ls":   {name: "Leadership",  type: "ls",	    tb_show: false,	form_fld: false, },
    "hg":   {name: "Homegrown",   type: "bool",	    tb_show: false,	form_fld: false, },
    "xp":   {name: "Experience",  type: "skill",	tb_show: false,	form_fld: false, },
    "tsi":  {name: "Skill index", type: "num",      tb_show: false,	form_fld: false, },
    "spec": {name: "Specialty",   type: "spec",	    tb_show: false,	form_fld: true, },
    "htms": {name: "HTMS",        type: "num",	    tb_show: false,	form_fld: false, },
    "htms28": {name: "HTMS28",    type: "num",      tb_show: false,	form_fld: false, },
    "ht_id":   {name: "ID",       type: "num",      tb_show: false,	form_fld: false, },
    "cc":   {name: "Nationality", type: "num",      tb_show: false,	form_fld: false, },
    "fg":   {name: "Foreigner",   type: "bool",     tb_show: false,	form_fld: false, },
    "wage": {name: "Wage",        type: "num",	    tb_show: false,	form_fld: false, },
};

const attribute_lvl = {
    "skill": {
        "max": 20,
        "min": 0,
        "step": 1.00,
        20: {name: "divine", txt_color: "#FFFFFF", bg_color: "#094f29"},
        19: {name: "utopian", txt_color: "#FFFFFF", bg_color: "#095826"},
        18: {name: "magical", txt_color: "#FFFFFF", bg_color: "#0A6024"},
        17: {name: "mythical", txt_color: "#FFFFFF", bg_color: "#0a6921"},
        16: {name: "extra-terrestrial", txt_color: "#FFFFFF", bg_color: "#0F7323"},
        15: {name: "titanic", txt_color: "#FFFFFF", bg_color: "#157E26"},
        14: {name: "supernatural", txt_color: "#FFFFFF", bg_color: "#1a8828"},
        13: {name: "world class", txt_color: "#FFFFFF", bg_color: "#278E32"},
        12: {name: "magnificent", txt_color: "#FFFFFF", bg_color: "#35953C"},
        11: {name: "brilliant", txt_color: "#FFFFFF", bg_color: "#429b46"},
        10: {name: "outstanding", txt_color: "#FFFFFF", bg_color: "#4DA14F"},
        9: {name: "formidable", txt_color: "#000000", bg_color: "#59A759"},
        8: {name: "excellent", txt_color: "#000000", bg_color: "#64ad62"},
        7: {name: "solid", txt_color: "#000000", bg_color: "#74B570"},
        6: {name: "passable", txt_color: "#000000", bg_color: "#84BD7E"},
        5: {name: "inadequate", txt_color: "#000000", bg_color: "#94c58c"},
        4: {name: "weak", txt_color: "#000000", bg_color: "#A6CF9F"},
        3: {name: "poor", txt_color: "#000000", bg_color: "#B8D8B2"},
        2: {name: "wretched", txt_color: "#000000", bg_color: "#CAE2C6"},
        1: {name: "disastrous", txt_color: "#000000", bg_color: "#DBECD9"},
        0: {name: "non-existent", txt_color: "#000000", bg_color: "#EDF5EC"},
    },
    "st": {
        "max": 9,
        "min": 1,
        9: {name: "formidable", txt_color: "#000000", bg_color: "#59A759"},
        8: {name: "excellent", txt_color: "#000000", bg_color: "#64ad62"},
        7: {name: "solid", txt_color: "#000000", bg_color: "#74B570"},
        6: {name: "passable", txt_color: "#000000", bg_color: "#84BD7E"},
        5: {name: "inadequate", txt_color: "#000000", bg_color: "#94c58c"},
        4: {name: "weak", txt_color: "#000000", bg_color: "#A6CF9F"},
        3: {name: "poor", txt_color: "#000000", bg_color: "#B8D8B2"},
        2: {name: "wretched", txt_color: "#000000", bg_color: "#CAE2C6"},
        1: {name: "disastrous", txt_color: "#000000", bg_color: "#DBECD9"},
    },
    "fo": {
        "max": 8,
        "min": 1,
        8: {name: "excellent", txt_color: "#000000", bg_color: "#64ad62"},
        7: {name: "solid", txt_color: "#000000", bg_color: "#74B570"},
        6: {name: "passable", txt_color: "#000000", bg_color: "#84BD7E"},
        5: {name: "inadequate", txt_color: "#000000", bg_color: "#94c58c"},
        4: {name: "weak", txt_color: "#000000", bg_color: "#A6CF9F"},
        3: {name: "poor", txt_color: "#000000", bg_color: "#B8D8B2"},
        2: {name: "wretched", txt_color: "#000000", bg_color: "#CAE2C6"},
        1: {name: "disastrous", txt_color: "#000000", bg_color: "#DBECD9"},
    },
    "ls": {
        "max": 7,
        "min": 1,
        8: {name: "excellent", txt_color: "#000000", bg_color: "#64ad62"},
        7: {name: "solid", txt_color: "#000000", bg_color: "#74B570"},
        6: {name: "passable", txt_color: "#000000", bg_color: "#84BD7E"},
        5: {name: "inadequate", txt_color: "#000000", bg_color: "#94c58c"},
        4: {name: "weak", txt_color: "#000000", bg_color: "#A6CF9F"},
        3: {name: "poor", txt_color: "#000000", bg_color: "#B8D8B2"},
        2: {name: "wretched", txt_color: "#000000", bg_color: "#CAE2C6"},
        1: {name: "disastrous", txt_color: "#000000", bg_color: "#DBECD9"},
    },
    "spec": {
        "max": 8,
        "min": 0,
        "undefined": [7],
        8: {name: "support", txt_color: "#000000", bg_color: "#64ad62"},
        6: {name: "resilient", txt_color: "#000000", bg_color: "#84BD7E"},
        5: {name: "head", txt_color: "#000000", bg_color: "#94c58c"},
        4: {name: "unpredictable", txt_color: "#000000", bg_color: "#A6CF9F"},
        3: {name: "powerful", txt_color: "#000000", bg_color: "#B8D8B2"},
        2: {name: "quick", txt_color: "#000000", bg_color: "#CAE2C6"},
        1: {name: "technical", txt_color: "#000000", bg_color: "#DBECD9"},
        0: {name: "no specialty", txt_color: "#000000", bg_color: "#DBECD9"},
    },
    "bool": {
        "max": 1,
        "min": 0,
        1: {name: "true", txt_color: "#000000", bg_color: "#DBECD9"},
        0: {name: "false", txt_color: "#000000", bg_color: "#EDF5EC"},
    },
    "num": {
        "max": 9999999,
        "min": 0,
    },
    "years": {
        "max": 41,
        "min": 17,
    },
    "days": {
        "max": 111,
        "min": 0,
    },
};

const preset_players = {
    'default': {"years": 17, "days": 3, "st": 5, "fo": 7, "gk": 5, "df": 5, "pm": 5, "wg": 5, "pg": 5, "sc": 5, "sp": 5, "lo": 20, "ls": 3, "hg": 0, "xp": 2, "spec": 0,},
}

const name_pool = {
    'first': ["Bob", "Ivan", "John", "Mohammed", "Jose", "Martin", "Ahmed", "Wei", "Ali", "David", "Li", "Pedro"],
    'nick': ["the Unstoppable", "der Bomber", "ChouChou", "el Muro", "Makač"],
    'last': ["Wang", "Liu", "Kumar", "Hernandez", "Rodriguez", "Bennet", "Blanc", "Smith", "Doe", "Abadi", "Ayad"],
}
