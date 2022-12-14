import {Squad, SquadError} from "./MSquad.js";
import {constraint_val, examine} from "../utils.js";

const MAX_TRAINING_WEEKS = 335;
const MAX_TRAINING_STAGES = 68;


// --- Training --------------------------------------------------------------------------------------------------------
class Training {
    constructor(squad, stages = []) {
        this.trained_squads = [squad];
        this.stages = stages;
        this.stages_order = [];
    }

    calc() {
        this.trained_squads = [this.trained_squads[0]];
        let squad = new Squad().from_simple_obj(this.trained_squads[0].to_simple_obj());
        for(const stage_n of this.stages_order) {
            const stage = this.stages[Number.parseInt(stage_n)-1];
            if(stage) {
                squad = stage.calc(squad);
                this.trained_squads.push(new Squad().from_simple_obj(squad.to_simple_obj()));
            }
        }
        return squad;
    }

    add_stage(training_stage) {
        if(this.stages_order.length >= MAX_TRAINING_STAGES) {
            throw new TrainingError(`Reached maximum number of training stages (${MAX_TRAINING_STAGES})!`);
        }
        this.stages.push(training_stage);
        const stage_n = this.stages.length;
        this.stages_order.push(stage_n);
        this.calc();
        return stage_n;
    }

    edit_stage(stage_data, stage_n) {
        stage_n = Number.parseInt(stage_n);
        return this.stages[stage_n-1].from_simple_obj(stage_data);
    }

    delete_stage(stage_n) {
        stage_n = Number.parseInt(stage_n);
        delete this.stages[stage_n-1];
        const idx = this.stages_order.indexOf(stage_n);
        this.stages_order.splice(idx, 1);
        return this.calc();
    }

    move_stage_order_up(stage_n) {
        stage_n = Number.parseInt(stage_n);
        const i = this.stages_order.indexOf(stage_n);
        if(i > 0) {
            const previous_stage_n = this.stages_order[i-1];
            this.stages_order[i-1] = this.stages_order[i];
            this.stages_order[i] = previous_stage_n;
            return previous_stage_n;
        }
        return -1;
    }

    move_stage_order_down(stage_n) {
        stage_n = Number.parseInt(stage_n);
        const i = this.stages_order.indexOf(stage_n);
        if(i < this.stages_order.length-1) {
            const next_stage_n = this.stages_order[i+1];
            this.stages_order[i+1] = this.stages_order[i];
            this.stages_order[i] = next_stage_n;
            return next_stage_n;
        }
        return -1;
    }

    get_previous_stage_squad(stage_n) {
        stage_n = Number.parseInt(stage_n);
        const i = this.stages_order.indexOf(stage_n);
        return this.trained_squads[i];
    }

    get_trained_squad(stage_n=-1) {
        // last stage
        if(stage_n === -1) {
            return this.trained_squads[this.trained_squads.length-1];
        }
        // stage_n
        stage_n = Number.parseInt(stage_n);
        const i = this.stages_order.indexOf(stage_n);
        return this.trained_squads[i+1];
    }

    to_simple_obj() {
        // examine(this);
        let obj = {trained_squads: [], stages: [], stages_order: this.stages_order};
        for(let stage of this.stages) {
            if(stage) {
                obj.stages.push(stage.to_simple_obj());
            } else {
                obj.stages.push(null);
            }
        }
        return obj;
    }

    from_simple_obj(obj) {
        // examine(obj);
        if(!obj) {
            return this;
        }
        this.stages_order = obj.stages_order;
        this.stages = [];
        for(let stage_cfg of obj.stages) {
            if(stage_cfg) {
                let training_stage = new TrainingStage().from_simple_obj(stage_cfg);
                this.stages.push(training_stage);
            } else {
                this.stages.push(null);
            }
        }
        this.calc();
        return this;
    }
}

class TrainingError extends Error {
    constructor(message) {
        super(message);
        this.name = "TrainingError";
    }
}

// --- Training Stage --------------------------------------------------------------------------------------------------
class TrainingStage {
    constructor(squad = null, cfg = default_stage_cfg) {
        cfg = JSON.parse(JSON.stringify(cfg));  // deep-copy
        // init
        for (let key in default_stage_cfg) {
            if(key in checkboxes) {
                this[key] = new Set();
                if(checkboxes[key] && squad) {
                    this.set_all_ids(key, squad);
                }
            } else {
                this[key] = cfg[key];
            }
        }
    }

    calc(squad) {
        // let squad = new Squad().from_simple_obj(this.squad.to_simple_obj());
        let stop = false;
        let n_fully_training_players = this.count_fully_training_players();
        for(let i=0; i<this.stop.weeks.val; i++) {
            let skill_reach_count = 0;
            let age_reach_count = 0;
            for(const player_id in squad.players) {
                if(!this.sq.has(player_id) || (this.ft.size <= 0 && this.ht.size <= 0)) {
                    continue;
                }
                let player = squad.players[player_id];
                player.age.add_week();
                let minutes;
                if(this.ft.has(player_id)) {
                    minutes = 'full';
                } else if(this.ht.has(player_id)) {
                    minutes = 'half';
                } else {
                    minutes = 'none';
                }
                // raise trained skill
                for(let trained_skill of training[this.training].skills) {
                    player[trained_skill] += f_training(trained_skill, player[trained_skill], this.coach, this.assistants, this.intensity, this.stamina, this.training, player.age.years, minutes);
                }
                // drop all skills (age dependent skill drop that happens on mondays)
                for(let dropped_skill of training.ALL.skills) {
                    player[dropped_skill] -= f_age_drop(dropped_skill, player.age.years);
                    if(player[dropped_skill] < 0.0) {
                        player[dropped_skill] = 0.0;
                    }
                }
                // stamina training
                player.st += f_stamina(player.age.years, player.st, this.stamina, this.intensity);
                // update trained player
                squad.players[player_id] = player;
                // training stage break condition

                // player reaches specified skill level
                if(this.ft.has(player_id) &&
                    this.stop.skill.active &&
                    player[this.stop.skill.type] >= this.stop.skill.lvl
                ) {
                    // specific player reach skill lvl
                    if(Number.parseInt(player_id) === this.stop.skill.player_id) {
                        stop = true;
                    }
                    // first player to reach skill lvl
                    if(this.stop.skill.player_id === -2) {
                        stop = true;
                    }
                    // last player to reach skill lvl
                    skill_reach_count++;
                    if(this.stop.skill.player_id === -99 && skill_reach_count >= n_fully_training_players) {
                        stop = true;
                    }
                }

                // player reaches specified age
                if(this.ft.has(player_id) &&
                    this.stop.age.active &&
                    player.age.is_older_than(this.stop.age.years, this.stop.age.days)
                ) {
                    // specific player reaches age
                    if(Number.parseInt(player_id) === this.stop.age.player_id) {
                        stop = true;
                    }
                    // first player reaches age
                    if(this.stop.age.player_id === -2) {
                        stop = true;
                    }
                    // last player reaches age
                    // last player to reach skill lvl
                    age_reach_count++;
                    if(this.stop.age.player_id === -99 && age_reach_count >= n_fully_training_players) {
                        stop = true;
                    }
                }
                player.calc_derived_attributes();
            }
            if(stop) {
                break;
            }
        }
        squad.update_summary();
        return squad;
    }

    count_fully_training_players() {
        let n = 0;
        for(const player_id of this.ft) {
            if(this.sq.has(player_id)) {
                n++;
            }
        }
        return n;
    }

    set_default_checkboxes(player_id) {
        for(const attr in checkboxes) {
            if(checkboxes[attr]) {
                this[attr].add(player_id.toString())
            }
        }
        return player_id;
    }

    unset_checkboxes(player_id) {
        for(const attr in checkboxes) {
            this[attr].delete(player_id.toString());
        }
        return player_id;
    }

    set_all_ids(attr, squad) {
        for(const player_id in squad.players) {
            this[attr].add(player_id);
        }
        return this[attr];
    }

    unset_all_ids(attr, squad) {
        this[attr].clear();
        return this[attr];
    }

    to_simple_obj() {
        let obj = {};
        for(let key in default_stage_cfg) {
            if(key in checkboxes) {
                obj[key] = Array.from(this[key]);
            } else {
                obj[key] = this[key];
            }
        }
        return obj;
    }

    from_simple_obj(obj) {
        for(let key in obj) {
            if(key in default_stage_cfg) {
                if(key in checkboxes) {
                    this[key] = new Set(obj[key]);
                } else {
                    this[key] = obj[key];
                }
            }
        }
        return this;
    }
}


const default_stage_cfg = {
    coach: 8, assistants: 10, intensity: 1.0, stamina: 0.1, training: 'F_PM', sq: null, ft: null, ht: null,
    stop: {
        weeks: {active: true, val: 16}, // this should be always active with at most MAX_TRAINING_WEEKS val
        skill: {active: false, player_id: -1, type: 'pm', lvl: 15},
        age: {active: false, player_id: -1, years: 22, days: 0},
    }
}


// if the checkbox should be checked by default or not
const checkboxes = {'sq': true, 'ft': true, 'ht': false};


// --- training prediction functions -----------------------------------------------------------------------------------
function f_age(player_years) {
    return 54/(player_years+37);
}


function f_skill(skill_lvl)
{
    skill_lvl = skill_lvl - 1;
    if(skill_lvl < 9.0) {
        return 16.289 * Math.exp(-0.1396 * skill_lvl);
    }
    else {
        return 54.676 / skill_lvl - 1.438;
    }
}


// raise of skill during the training
function f_skill_training_raise(skill_lvl, coach_lvl, ass_lvl, train_int, stamina_share, train_type, player_years, play_time) {
    if(play_time in TC.minutes) {
        play_time = TC.minutes[play_time];
    }
    else {
        play_time = TC.minutes.calc(play_time);
    }
    return Math.min(
        f_skill(skill_lvl) * TC.coach[coach_lvl] * TC.assistants[ass_lvl] * train_int * (1.0-stamina_share) * TC.training[train_type] * f_age(player_years) * play_time,
        1.0
    );
}


// reduction of skill increment during the training - based on level and age
function f_skill_training_drop(skill_type, skill_lvl, player_years) {
    let calc_lvl = skill_lvl - 1;
    let drop_lvl = 0;
    // lvl component
    if(calc_lvl >= 14.0 && calc_lvl < 20.0) {
        drop_lvl += f_lvl_drop(calc_lvl);
    }
    if(calc_lvl > 20.0) {
        drop_lvl += f_lvl_drop(calc_lvl + 0.39);
    }
    // lvl_age component
    if(calc_lvl <= 20.0) {
        drop_lvl += f_lvl_age_drop(calc_lvl, player_years);
    }
    else {
        drop_lvl += f_lvl_age_drop(calc_lvl + 1.0, player_years);
    }
    // final result
    return drop_lvl;
}


function f_lvl_drop(calc_lvl) {
    return TC.drop.lvl.a * Math.pow(calc_lvl, 3) + TC.drop.lvl.b * Math.pow(calc_lvl, 2) + TC.drop.lvl.c * calc_lvl + TC.drop.lvl.d;
}


function f_lvl_age_drop(skill_type, calc_lvl, player_years) {
    if(player_years < levels.drop.lvl_age.min) {
        return 0.0;
    }
    if(player_years in TC.drop.lvl_age) {
        return TC.drop.lvl_age[player_years].m * calc_lvl + TC.drop.lvl_age[player_years].n;
    }
    if(player_years > levels.drop.lvl_age.max) {
        return TC.drop.lvl_age[levels.drop.lvl_age.max].m * calc_lvl + TC.drop.lvl_age[levels.drop.lvl_age.max].n;
    }
    return 0.0;
}


function f_training(skill_type, skill_lvl, coach_lvl, ass_lvl, train_int, stamina_share, train_type, player_years, play_time) {
    let lvl_gain = f_skill_training_raise(skill_lvl, coach_lvl, ass_lvl, train_int, stamina_share, train_type, player_years, play_time);
    lvl_gain -= f_skill_training_drop(skill_type, skill_lvl + lvl_gain, player_years);
    return Math.max(0.0, lvl_gain);
}


// skill drop that is happening on mondays
function f_age_drop(skill_type, player_years) {
    let drop_lvl = 0.0;
    let nodrop_age = TC.drop.age.nodrop[skill_type];
    if(player_years > nodrop_age) {
        let key = player_years - nodrop_age;
        if(key in TC.drop.age.c) {
            drop_lvl = TC.drop.age.c[key];
        } else if(key > levels.drop.age.c.max) {
            drop_lvl = TC.drop.age.c[levels.drop.age.c.max];
        }
    }
    return drop_lvl;
}


// stamina training function
function f_stamina(player_years, stamina_lvl, stamina_share, train_int) {
    let lvl_gain = 0.0;
    if(!(player_years in TC.stamina.k)) {
        player_years = constraint_val(player_years, levels.stamina.k.min, levels.stamina.k.max);
    }
    let Kage = TC.stamina.k[player_years] * 7/30;
    let L = Kage + (stamina_lvl - 1.0);
    let S = stamina_share * train_int;
    if(L >= 7.56) {
        lvl_gain = -1.05 * Math.pow(S, 2) + 2.1 * S + TC.stamina.a * Math.pow(L, 3) + TC.stamina.b * Math.pow(L, 2) + TC.stamina.c * L + TC.stamina.d;
    }
    if(L > 7.0 && L < 7.56) {
        lvl_gain = -1.05 * Math.pow(S, 2) + 2.1 * S + TC.stamina.e * Math.pow(L, 3) + TC.stamina.f * Math.pow(L, 2) + TC.stamina.g * L + TC.stamina.h;
    }
    if(L <= 7.0) {
        lvl_gain = (-1.05 * Math.pow(S, 2) + 2.1 * S) * (TC.stamina.m * Math.pow(L, 3) + TC.stamina.n * Math.pow(L, 2) + TC.stamina.o * L + TC.stamina.p) - 0.21;
    }
    return lvl_gain;
}


// --- const -----------------------------------------------------------------------------------------------------------
// training coefficients
const TC = {
    coach: {
        8: 1.0375,
        7: 1.0,
        6: 0.92,
        5: 0.8324,
        4: 0.7343,
    },
    assistants: {
        10: 1.3500,
        9: 1.3150,
        8: 1.2800,
        7: 1.2450,
        6: 1.2100,
        5: 1.1750,
        4: 1.1400,
        3: 1.1050,
        2: 1.0700,
        1: 1.0350,
        0: 1.0000,
    },
    training: {
        // Focused
        "F_GK": 0.0510,
        "F_DF": 0.0288,
        "F_PM": 0.0336,
        "F_WG": 0.0480,
        "F_PG": 0.0360,
        "F_SC": 0.0324,
        "F_SP": 0.1470,
        // Extended
        "E_PG": 0.0315,
        "E_DF": 0.0138,
        "E_WG": 0.0312,
        // Combined
        "C_SC&SP": 0.0150,
        // Osmosis
        "O_F_DF": 0.0048,
        "O_F_PM": 0.0042,
        "O_F_WG": 0.0060,
        "O_F_PG": 0.0060,
        "O_F_SC": 0.0054,
        "O_E_PG": 0.0053,
        "O_E_DF": 0.0023,
        "O_E_WG": 0.0040,
    },
    minutes: {
        full: 1.0,
        half: 0.5,
        none: 0.0,
        // specify training minutes e.g.: TC.minutes.other(36, 90) ==> playing 36m in full training spot and 90m in half
        calc: function (t_full, t_half) { return (Math.min(t_full, 90) + Math.min(t_half, 90 - t_full) * 0.5) / 90 }
    },
    drop: {
        lvl: {
            a: 0.000006111,
            b: 0.000808,
            c: -0.026017,
            d: 0.192775,
        },
        lvl_age: {
            31: {
                m: 0.00031,
                n: -0.00434,
            },
            32: {
                m: 0.00118,
                n: -0.01625,
            },
            33: {
                m: 0.00264,
                n: -0.03551,
            },
            34: {
                m: 0.00468,
                n: -0.06086,
            },
            35: {
                m: 0.00732,
                n: -0.09104,
            },
            36: {
                m: 0.01066,
                n: -0.12554,
            },
            37: {
                m: 0.01460,
                n: -0.16021,
            }
        },
        age: {
            // last year when the skill is not dropping
            nodrop: {
                gk: 29,
                df: 28,
                pm: 27,
                wg: 27,
                pg: 27,
                sc: 26,
                sp: 30,
            },
            // skill drop by years after nodrop year
            c: {
                1: 0.0003,
                2: 0.0014,
                3: 0.0037,
                4: 0.0074,
                5: 0.0127,
                6: 0.0197,
                7: 0.0285,
                8: 0.0393,
                9: 0.0522,
                10: 0.0673,
                11: 0.0846,
            }
        },
    },
    stamina: {
        k: {
            17:	3,
            18:	3,
            19:	3,
            20:	0,
            21:	0,
            22:	0,
            23:	0,
            24:	0,
            25:	1,
            26:	2,
            27:	3,
            28:	4,
            29:	5,
            30:	6,
            31:	7,
            32:	8,
            33:	9,
            34:	11,
            35:	13,
            36:	15,
            37:	17,
            38:	19,
            39:	21,
        },
        a: -0.00016,
        b: -0.00544,
        c: 0.0013,
        d: -0.0185,
        e: -0.00772,
        f: 0.0636,
        g: -0.0178,
        h: -0.554,
        m: 0.00013,
        n: 0.0048,
        o: -0.301,
        p: 2.826,
    },
}

const levels = {
    coach: {
        max: 8,
        min: 4,
        step: 1.00,
        8: {name: "excellent", },
        7: {name: "solid", },
        6: {name: "passable", },
        5: {name: "inadequate", },
        4: {name: "weak", },
    },
    assistants: {
        max: 10,
        min: 0,
        step: 1.00,
    },
    intensity: {
        max: 1.0,
        min: 0.0,
        step: 0.01,
    },
    stamina: {
        max: 1.0,
        min: 0.1,
        step: 0.01,
        k: {
            min: 17,
            max: 39,
        },
    },
    training: {
        "F_GK":    {min:0, max:2, full: 2, half: 0, step: 1},
        "F_DF":    {min:0, max:10, full: 10, half: 0, step: 1},
        "F_PM":    {min:0, max:10, full: 6, half: 4, step: 1},
        "F_WG":    {min:0, max:8, full: 4, half: 4, step: 1},
        "F_PG":    {min:0, max:16, full: 16, half: 0, step: 1},
        "F_SC":    {min:0, max:6, full: 6, half: 0, step: 1},
        "F_SP":    {min:0, max:22, full: 22, half: 0, bonus: 2, step: 1},
        "E_PG":    {min:0, max:20, full: 20, half: 0, step: 1},
        "E_DF":    {min:0, max:22, full: 22, half: 0, step: 1},
        "E_WG":    {min:0, max:10, full: 10, half: 0, step: 1},
        "C_SC&SP": {min:0, max:22, full: 22, half: 0, step: 1},
        "O_F_DF":  {min:0, max:22, full: 22, half: 0, step: 1},
        "O_F_PM":  {min:0, max:22, full: 22, half: 0, step: 1},
        "O_F_WG":  {min:0, max:22, full: 22, half: 0, step: 1},
        "O_F_PG":  {min:0, max:22, full: 22, half: 0, step: 1},
        "O_F_SC":  {min:0, max:22, full: 22, half: 0, step: 1},
        "O_E_PG":  {min:0, max:22, full: 22, half: 0, step: 1},
        "O_E_DF":  {min:0, max:22, full: 22, half: 0, step: 1},
        "O_E_WG":  {min:0, max:22, full: 22, half: 0, step: 1},
    },
    drop: {
        lvl_age: {
            min: 31,
            max: 37,
        },
        age: {
            c: {
                min: 1,
                max: 11,
            }
        }
    }
}

const training = {
    // all trainable skills
    "ALL": {skills: ['gk', 'df', 'pm', 'wg', 'pg', 'sc', 'sp']},
    // Focused
    "F_GK": {name: "Keeper", 		short_name: "GK",	category: "Focused", skills: ['gk']},
    "F_DF": {name: "Defending", 	short_name: "DF",	category: "Focused", skills: ['df']},
    "F_PM": {name: "Playmaking", 	short_name: "PM",	category: "Focused", skills: ['pm']},
    "F_WG": {name: "Winger", 		short_name: "WG",	category: "Focused", skills: ['wg']},
    "F_PG": {name: "Passing", 		short_name: "PG",	category: "Focused", skills: ['pg']},
    "F_SC": {name: "Scoring", 		short_name: "SC",	category: "Focused", skills: ['sc']},
    "F_SP": {name: "Set pieces", 	short_name: "SP",	category: "Focused", skills: ['sp']},
    // Extended
    "E_DF": {name: "Defending", 	short_name: "DF(E)",	category: "Extended", skills: ['df']},
    "E_WG": {name: "Winger", 		short_name: "WG(E)",	category: "Extended", skills: ['wg']},
    "E_PG": {name: "Passing", 		short_name: "PG(E)",	category: "Extended", skills: ['pg']},
    // Combined
    "C_SC&SP": {name: "Scoring and Set pieces", short_name: "SC&SP",	category: "Combined", skills: ['sc', 'sp']},
    // Osmosis
    "O_F_DF": {name: "Defending", 	short_name: "DF(O)",	category: "osmosis", subcategory: "Focused", skills: ['df']},
    "O_F_PM": {name: "Playmaking", 	short_name: "PM(O)",	category: "osmosis", subcategory: "Focused", skills: ['pm']},
    "O_F_WG": {name: "Winger", 		short_name: "WG(O)",	category: "osmosis", subcategory: "Focused", skills: ['wg']},
    "O_F_PG": {name: "Passing", 	short_name: "PG(O)",	category: "osmosis", subcategory: "Focused", skills: ['pg']},
    "O_F_SC": {name: "Scoring", 	short_name: "SC(O)",	category: "osmosis", subcategory: "Focused", skills: ['sc']},
    "O_E_PG": {name: "Passing", 	short_name: "PG(EO)",	category: "osmosis", subcategory: "Extended", skills: ['pg']},
    "O_E_DF": {name: "Defending", 	short_name: "DF(EO)",	category: "osmosis", subcategory: "Extended", skills: ['df']},
    "O_E_WG": {name: "Winger", 		short_name: "WG(EO)",	category: "osmosis", subcategory: "Extended", skills: ['wg']},
}

const categories = {
    Focused: {training: ["F_GK", "F_DF", "F_PM", "F_WG", "F_PG", "F_SC", "F_SP", ], form_select: true},
    Extended: {training: ["E_DF", "E_WG", "E_PG", ], form_select: true},
    Combined: {training: ["C_SC&SP", ], form_select: true},
    Osmosis: {training: ["O_F_DF", "O_F_PM", "O_F_WG", "O_F_PG", "O_F_SC", "O_E_PG", "O_E_DF", "O_E_WG", ], form_select: false},
}


export {Training, TrainingError, TrainingStage, training, categories, default_stage_cfg, MAX_TRAINING_WEEKS, checkboxes};