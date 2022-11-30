import {constraint_val, rand_int, rand_item, round0p25, round2} from "../utils.js";
import {
    ht_player_strength_to_hatstats,
    position_to_str,
    SECTOR_RATING_POWER,
    prc,
    prc_for_player_strength_calc,
    overcrowding_penalties,
    sector_multiplier,
    player_position_types,
    player_orders,
    player_positions
} from "./MMatch.js";

const P_NICK = 0.5; // probability of generating nick for player

// --- Player ---
class Player {
    constructor(cfg = presets.default) {
        this.age = new Age(cfg.years, cfg.days);

        if (!(cfg.first || cfg.nick || cfg.last)) {
            this.name = new Name();
            this.name.randomize();
        } else {
            this.name = new Name(cfg.first, cfg.nick, cfg.last);
        }

        for (let attr in cfg) {
            if (attr in attributes) {
                this[attr] = Number.parseFloat(cfg[attr]);
            }
        }

        this.rating_contributions = {};
        this.positions_strength = {};
        this.best_position = {};

        this.calc_derived_attributes();

        // console.log(`${this.name.to_str()} (${this.age.to_str()}) => tsi: ${this.tsi}; wage: ${this.wage}; htms: ${this.htms}; htms28: ${this.htms28}; best_position: ${this.best_position.pos}_${this.best_position.ord} = ${this.best_position.val}`);
        // console.log(this.rating_contributions);
        // console.log(this.positions_strength);
        // console.log(this.best_position);
    }

    // set(attr, val) {
    //     if (attr in attributes) {
    //         this[attr] = Number.parseFloat(cfg[attr]);
    //     } else {
    //
    //     }
    // }

    random() {
        this.age.randomize();
        this.randomize_attributes();
        return this;
    }

    randomize_attributes() {
        for (let attr in attributes) {
            this[attr] = this.#randomize_attribute(levels[attributes[attr].type]);
        }
        return this;
    }

    #randomize_attribute(attribute_levels) {
        let attr_val = rand_int(attribute_levels.min, attribute_levels.max);
        if (attribute_levels.undefined && attribute_levels.undefined.includes(attr_val)) {
            attr_val = this.#randomize_attribute(attribute_levels);
        }
        return attr_val;
    }

    calc_derived_attributes() {
        // TSI, wage, htms/28, rating contribution
        let age_c = constraint_val(this.age.years, age_reduction.min, age_reduction.max)

        let max = {skill: 'none', val: -1.0}
        for(const skill of MAIN_SKILLS) {
            if(max.val < this[skill]) {
                max.skill = skill;
                max.val = this[skill];
            }
        }
        this.#calc_xp();
        this.#calc_tsi(max.skill, age_c);
        this.#calc_wage(max.skill, age_c);
        this.#calc_htms();
        this.#calc_player_strength();
    }

    // starting at 2xp and raise by 0.6 per season (which is approx. 11 league matches and 3 cup matches every season)
    #calc_xp() {
        this.xp = constraint_val((this.age.years - 17) * 0.6 + (this.age.days * 0.6 / 112) + 2, levels.skill.min, levels.skill.max);
        return this.xp;
    }

    #calc_tsi(max_skill, age_c) {
        let tsi;

        if(max_skill === 'gk') {
            tsi = 3 * Math.pow(this.gk, 3.359) * Math.pow(this.fo, 0.5);
            tsi *= age_reduction.age[age_c].tsi_gk;
        } else {
            tsi = Math.pow(1.03 * Math.pow(this.df-1.0, 3) + 1.03 * Math.pow(this.pm-1.0, 3) + 1.03 * Math.pow(this.sc-1.0, 3) + Math.pow(this.pg-1.0, 3) + 0.84 * Math.pow(this.wg-1.0, 3), 2) * Math.pow(this.st-1.0, 0.5) * Math.pow(this.fo-1.0, 0.5) / 1000;
            tsi *= age_reduction.age[age_c].tsi;
        }

        this.tsi = round_tsi(tsi);
        return this.tsi;
    }

    #calc_wage(max_skill, age_c) {
        let wage;
        if(max_skill === 'gk') {
            // if max gk skill, just return wages
            if(this.gk-1 >= wage_factor.gk.length-1) {
                wage = wage_factor.gk[wage_factor.gk.length-1];
                this.wage = wage * age_reduction.age[age_c].wage;
                return this.wage;
            }
            // if skill is less than maximum, then do linear interpolation between current and next value based on sublevel
            const gk_full_lvl = constraint_val(Math.floor(this.gk-1), 0, 18);
            const gk_sub_lvl = round2(this.gk % 1);
            wage = wage_factor.gk[gk_full_lvl] + (wage_factor.gk[gk_full_lvl+1] - wage_factor.gk[gk_full_lvl]) * gk_sub_lvl;
        } else {
            // wage = (main_skill_component + SUM(secondary_skill_component / 2)) * (1 + (set_pieces * 0,0025)) + 250
            let primary_skill_component = f_wage_component(max_skill, this[max_skill]);
            let sum_secondary_skills_component = 0;
            for(const skill of MAIN_SKILLS) {
                if(skill !== 'gk' && skill !== max_skill) {
                    sum_secondary_skills_component += f_wage_component(skill, this[skill]) / 2;
                }
            }
            wage = (primary_skill_component + sum_secondary_skills_component) * (1+ (this.sp * 0.0025)) + MIN_WAGE;
            wage *= age_reduction.age[age_c].wage;
        }
        this.wage = Math.round(Math.max(MIN_WAGE, wage));
        return this.wage;
    }

    #calc_htms() {
        let htms = 0;
        let htms28;
        // htms
        for(const skill in htms_factor) {
            let lvl = constraint_val(Math.floor(this[skill]-1), 0, 19);
            htms += htms_factor[skill][lvl];
        }
        //htms28
        const y = constraint_val(this.age.years, 17, 35);
        const d_percentage = this.age.days / 112;
        htms28 = htms + htms28_factor[y] + (htms28_factor[y+1] - htms28_factor[y]) * d_percentage;

        this.htms = htms;
        this.htms28 = Math.round(htms28);
        return {htms: htms, htms28: htms28};
    }

    #calc_player_strength() {
        // let prc = prc_for_player_strength_calc;
        let contribution_by_pos = {};  // contribution to sector ratings by position
        let strength_by_pos = {};  // composite rating by position (how good is player at given position)
        let max_rating_contribution = {pos: null, ord: null, val: -1};  // best position
        for(const pos in prc) {
            const pos_type = player_positions[pos].type;
            contribution_by_pos[pos] = {};
            if(pos in prc_for_player_strength_calc) {
                strength_by_pos[pos_type] = {};
            }
            for(const ord in prc[pos]) {
                // TDF should calc with 'td' order not 'd'
                let prc_ord = ord;
                if(pos_type === 'fw' && ord === 'd' && this.spec === 1) {
                    prc_ord = 'td';
                }
                if(ord === 'td') {
                    continue;
                }
                contribution_by_pos[pos][ord] = {};
                if(pos in prc_for_player_strength_calc) {
                    strength_by_pos[pos_type][ord] = 0;
                }
                for(const sector in prc[pos][prc_ord]) {
                    contribution_by_pos[pos][ord][sector] = 0;
                    for(const skill in prc[pos][prc_ord][sector]) {
                        // effective_skill = (skill + loyalty + hg + exp) * form
                        let eff_skill = (this[skill] + (this.lo-1)/19 + (this.hg*0.5) + (Math.log10(this.xp)*4/3)) * Math.pow((this.fo-1)/7, 0.6666);
                        // rating_contribution_to_sector = effective_skill * constant_for_that_position_and_order
                        contribution_by_pos[pos][ord][sector] += eff_skill * prc[pos][prc_ord][sector][skill];
                    }

                    // player (position) strength calculation
                    if(pos in prc_for_player_strength_calc) {
                        let overcrowding_penalty = 1.0;
                        if(pos_type in overcrowding_penalties) {
                            // apply overcrowding penalty as if playing 4-4-2 formation (2xCD, 2xIM, 2xFW)
                            overcrowding_penalty = overcrowding_penalties[pos_type]['2'];
                        }
                        let player_sector_rating = Math.pow(contribution_by_pos[pos][ord][sector] * overcrowding_penalty * sector_multiplier[sector], SECTOR_RATING_POWER);
                        strength_by_pos[pos_type][ord] += player_sector_rating;
                    }
                }
                if(pos in prc_for_player_strength_calc) {
                    strength_by_pos[pos_type][ord] = round2(strength_by_pos[pos_type][ord]);
                }
                // find best position
                if(pos in prc_for_player_strength_calc) {
                    if (max_rating_contribution.val < strength_by_pos[pos_type][ord]) {
                        max_rating_contribution.val = strength_by_pos[pos_type][ord];
                        max_rating_contribution.pos = pos_type;
                        max_rating_contribution.ord = ord;
                    }
                }
            }
        }
        this.rating_contributions = contribution_by_pos;
        this.positions_strength = strength_by_pos;
        this.best_position = max_rating_contribution;
        return contribution_by_pos;
    }

    // for serialization
    to_simple_obj() {
        let obj = {};
        for (let attr in attributes) {
            obj[attr] = this[attr];
        }

        obj.years = this.age.years;
        obj.days = this.age.days;

        obj.first = this.name.first;
        obj.nick = this.name.nick;
        obj.last = this.name.last;

        return obj;
    }

    // for deserialization
    from_simple_obj(obj) {
        for (let attr in attributes) {
            if (attr in obj) {
                this[attr] = Number.parseFloat(obj[attr]);
            }
        }

        if ('years' in obj) {
            this.age.years = Number.parseInt(obj.years);
        }
        if ('days' in obj) {
            this.age.days = Number.parseInt(obj.days);
        }

        if ('first' in obj) {
            this.name.first = obj.first;
        }
        if ('nick' in obj) {
            this.name.nick = obj.nick;
        }
        if ('last' in obj) {
            this.name.last = obj.last;
        }

        this.calc_derived_attributes();

        return this;
    }

    get_attributes(attrs = ['st', 'gk', 'df', 'pm', 'wg', 'pg', 'sc', 'sp']) {
        let obj = {};
        for(let attr of attrs) {
            obj[attr] = this[attr];
        }
        return obj;
    }

    load_from_preset(preset) {
        return this.from_simple_obj(preset);
    }

    best_position_to_str(mode='extended') {
        return this.#strength_on_position_to_str(this.best_position, mode);
    }

    strength_on_positions_to_str() {
        let arr = [];
        let str = '';
        for(const pos in this.positions_strength) {
            for(const ord in this.positions_strength[pos]) {
                let player_strength = {pos: pos, ord: ord, val: this.positions_strength[pos][ord]};
                arr.push(`${this.#strength_on_position_to_str(player_strength)}`);
            }
        }
        arr = arr.sort(function (a, b) {
            return (+b.split(/(\d+\.?\d*)/)[1]) - (+a.split(/(\d+\.?\d*)/)[1]);
        });
        for(const strength of arr) {
            str += `${strength}<br/>`;
        }
        return str;
    }

    #strength_on_position_to_str(player_strength, mode='normal') {
        let str = position_to_str(player_strength.pos, player_strength.ord, mode);
        if(mode === 'extended') {
            str += ` (${player_strength.val})`;
        }
        if(mode === 'normal') {
            str += `: ${player_strength.val}`;
        }
        if(mode === 'compact') {
            str += ` ${player_strength.val}`;
        }
        return str;
    }
}


// --- Age ---
class Age {
    constructor(years = '17', days = '0') {
        this.years = Number.parseInt(years);
        this.days = Number.parseInt(days);
    }

    add_days(days) {
        days = Number.parseInt(days);
        this.days += days;
        while (this.days >= 112) {
            this.days -= 112;
            this.years += 1;
        }
    }

    add_week() {
        this.add_days(7);
    }

    add_year() {
        this.add_days(112);
    }

    is_older_than(years, days) {
        if(this.years > years) {
            return true;
        } else if(this.years === years && this.days > days) {
            return true
        }
        return false;
    }

    randomize() {
        this.years = rand_int(levels.years.min, levels.years.max);
        this.days = rand_int(levels.days.min, levels.days.max);
    }

    diff(age) {
        let days = this.days - age.days;
        let years;
        if(days >= 0) {
            years = this.years - age.years;
        } else {
            days += 112;
            years = this.years - age.years - 1;
        }
        return `${years}.${days.toString().padStart(3, '0')}`;
    }

    to_str() {
        return `${this.years}.${this.days.toString().padStart(3, '0')}`;
    }

    static average(players_ages = []) {
        let total_age_raw = 0;
        let avg_age_raw = 0;
        for(const player_age of players_ages) {
            total_age_raw += player_age.years + (player_age.days / 112)
        }
        avg_age_raw = total_age_raw / players_ages.length;
        const years = Math.trunc(avg_age_raw);
        const days = (avg_age_raw % 1) * 112;
        return new Age(years, days);
    }
}


// --- Name ---
class Name {
    constructor(first = "", nick = "", last = "") {
        this.first = first;
        this.nick = nick;
        this.last = last;
    }

    randomize() {
        this.first = rand_item(name_pool.first);
        if (Math.random() < P_NICK) {
            //with some probability give player a nick
            this.nick = rand_item(name_pool.nick);
        } else {
            this.nick = "";
        }
        this.last = rand_item(name_pool.last);
        return this.to_str();
    };

    to_str(mode='normal') {
        let str_name = "";
        if(mode === 'normal') {
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
        }
        if(mode === 'short') {
            if (this.first) {
                str_name += this.first[0];
                str_name += '.';
            }
            if (this.last) {
                if (str_name) {
                    str_name += " ";
                }
                str_name += this.last;
            }
            if (!str_name) {
                str_name = "Error";
            }
        }
        return str_name;
    }
}


function f_wage_component(skill, lvl) {
    let wage_component = wage_factor[skill].a * Math.pow(Math.max(lvl-1, 0), wage_factor[skill].b);
    if(wage_component > 20000) {
        wage_component = (wage_component - 20000) * wage_factor[skill].c + 20000;
    }
    return wage_component;
}


function wage_to_str(week_wage) {
    let week_foreign_wage = Math.trunc(week_wage * 1.2);
    let season_wage = week_wage * 16;
    let season_foreign_wage = week_foreign_wage * 16;
    return `<p class="p-0 mb-1">${week_foreign_wage.toLocaleString()} € <span style="color: #aaaaaa">(${week_wage.toLocaleString()} €)</span>/week</p>
            <p class="p-0 my-1">${season_foreign_wage.toLocaleString()} € <span style="color: #aaaaaa">(${season_wage.toLocaleString()} €)</span>/season</p>`;
}


function round_tsi(tsi) {
    return Math.floor(tsi / 10) * 10;
}

function spec_to_index(str_specialty) {
    let spec_keys = Object.keys(levels.spec);
    let spec_index = 0;
    for(let i = 0; i < spec_keys.length; i++) {
        if(levels.spec[spec_keys[i]].name === str_specialty.toLowerCase()) {
            spec_index = spec_keys[i];
            break;
        }
    }
    return spec_index;
}

const MAIN_SKILLS = ['gk', 'df', 'pm', 'pg', 'wg', 'sc'];
const MIN_WAGE = 250;
const age_reduction = {
    min: 27,
    max: 39,
    age: {
        27: {tsi: 1,        tsi_gk: 1,      wage: 1     },
        28: {tsi: 0.875,    tsi_gk: 1,      wage: 1     },
        29: {tsi: 0.75,     tsi_gk: 1,      wage: 0.9   },
        30: {tsi: 0.625,    tsi_gk: 1,      wage: 0.8   },
        31: {tsi: 0.5,      tsi_gk: 0.9,    wage: 0.7   },
        32: {tsi: 0.375,    tsi_gk: 0.8,    wage: 0.6   },
        33: {tsi: 0.25,     tsi_gk: 0.7,    wage: 0.5   },
        34: {tsi: 0.125,    tsi_gk: 0.6,    wage: 0.4   },
        35: {tsi: 0.125,    tsi_gk: 0.5,    wage: 0.3   },
        36: {tsi: 0.125,    tsi_gk: 0.4,    wage: 0.2   },
        37: {tsi: 0.125,    tsi_gk: 0.3,    wage: 0.1   },
        38: {tsi: 0.125,    tsi_gk: 0.2,    wage: 0.1   },
        39: {tsi: 0.125,    tsi_gk: 0.1,    wage: 0.1   },
    }
}

const wage_factor = {
    df:{a: 0.0007145560, b: 6.4607813171, c: 0.7921, },
    pm:{a: 0.0009418058, b: 6.4407950328, c: 0.7832, },
    pg:{a: 0.0004476257, b: 6.5136791026, c: 0.7707, },
    wg:{a: 0.0004437607, b: 6.4641257225, c: 0.7789, },
    sc:{a: 0.0009136982, b: 6.4090063683, c: 0.7984, },
    gk:[250, 270, 350, 450, 610, 830, 1150, 1610, 2250, 3190, 4550, 6450, 9190, 12930, 18130, 24270, 31720, 41150, 53840, 68750],
}

const htms_factor = {
    gk: [2, 12, 23, 39, 56, 76, 99, 123, 150, 183, 222, 268, 321, 380, 446, 519, 600, 691, 797, 924],
    df: [4, 18, 39, 65, 98, 134, 175, 221, 271, 330, 401, 484, 580, 689, 809, 942, 1092, 1268, 1487, 1791],
    pm: [4, 17, 34, 57, 84, 114, 150, 190, 231, 281, 341, 412, 493, 584, 685, 798, 924, 1070, 1247, 1480],
    wg: [2, 12, 25, 41, 60, 81, 105, 132, 161, 195, 238, 287, 344, 407, 478, 555, 642, 741, 855, 995],
    pg: [3, 14, 31, 51, 75, 104, 137, 173, 213, 259, 315, 381, 457, 540, 634, 738, 854, 988, 1148, 1355],
    sc: [4, 17, 36, 59, 88, 119, 156, 197, 240, 291, 354, 427, 511, 607, 713, 830, 961, 1114, 1300, 1547],
    sp: [1, 2, 5, 9, 15, 21, 28, 37, 46, 56, 68, 81, 95, 112, 131, 153, 179, 210, 246, 287],
}

const htms28_factor = {
    17:	1641,
    18:	1481,
    19:	1323,
    20:	1166,
    21:	1011,
    22:	858,
    23:	708,
    24:	560,
    25:	416,
    26:	274,
    27:	136,
    28:	0,
    29:	-129,
    30:	-255,
    31:	-378,
    32:	-497,
    33:	-614,
    34:	-727,
    35:	-837,
    36:	-837,
}


const attributes = {
    spec: {name: "Specialty",   type: "spec",	tb_show: true,	 tb_exp_left: false, tb_exp_right: true,  form_fld: true,  },
    st:   {name: "Stamina",     type: "st",	    tb_show: true,	 tb_exp_left: true,  tb_exp_right: false, form_fld: true,  },
    fo:   {name: "Form",		type: "fo",	    tb_show: false,	 tb_exp_left: false, tb_exp_right: false, form_fld: false, },
    gk:   {name: "Goalkeeping", type: "skill",	tb_show: true,	 tb_exp_left: true,  tb_exp_right: false, form_fld: true,  },
    df:   {name: "Defending",   type: "skill",	tb_show: true,	 tb_exp_left: true,  tb_exp_right: false, form_fld: true,  },
    pm:   {name: "Playmaking",  type: "skill",	tb_show: true,	 tb_exp_left: true,  tb_exp_right: false, form_fld: true,  },
    wg:   {name: "Winger",      type: "skill",	tb_show: true,	 tb_exp_left: true,  tb_exp_right: false, form_fld: true,  },
    pg:   {name: "Passing",     type: "skill",	tb_show: true,	 tb_exp_left: true,  tb_exp_right: false, form_fld: true,  },
    sc:   {name: "Scoring",     type: "skill",	tb_show: true,	 tb_exp_left: true,  tb_exp_right: false, form_fld: true,  },
    sp:   {name: "Set pieces",  type: "skill",	tb_show: true,	 tb_exp_left: true,  tb_exp_right: false, form_fld: true,  },
    lo:   {name: "Loyalty",     type: "skill",	tb_show: false,	 tb_exp_left: false, tb_exp_right: false, form_fld: false, },
    ls:   {name: "Leadership",  type: "ls",	    tb_show: false,	 tb_exp_left: false, tb_exp_right: false, form_fld: false, },
    hg:   {name: "Homegrown",   type: "bool",	tb_show: false,	 tb_exp_left: false, tb_exp_right: false, form_fld: false, },
    xp:   {name: "Experience",  type: "skill",	tb_show: false,	 tb_exp_left: false, tb_exp_right: true,  form_fld: false, },
    tsi:  {name: "TSI",         type: "num",    tb_show: false,	 tb_exp_left: false, tb_exp_right: true,  form_fld: false, },
    htms: {name: "HTMS",        type: "num",	tb_show: false,	 tb_exp_left: false, tb_exp_right: true,  form_fld: false, },
    htms28: {name: "HTMS28",    type: "num",    tb_show: false,	 tb_exp_left: false, tb_exp_right: true,  form_fld: false, },
    ht_id:  {name: "ID",        type: "num",    tb_show: false,	 tb_exp_left: false, tb_exp_right: false, form_fld: false, },
    cc:   {name: "Nationality", type: "num",    tb_show: false,	 tb_exp_left: false, tb_exp_right: false, form_fld: false, },
    fg:   {name: "Foreigner",   type: "bool",   tb_show: false,	 tb_exp_left: false, tb_exp_right: false, form_fld: false, },
    wage: {name: "Wage",        type: "num",	tb_show: false,	 tb_exp_left: false, tb_exp_right: true,  form_fld: false, },
};

const levels = {
    skill: {
        max: 25,
        min: 0,
        step: 1.00,
        25: {name: "divine +5", txt_color: "#FFFFFF", bg_color: "#094f29"},
        24: {name: "divine +4", txt_color: "#FFFFFF", bg_color: "#094f29"},
        23: {name: "divine +3", txt_color: "#FFFFFF", bg_color: "#094f29"},
        22: {name: "divine +2", txt_color: "#FFFFFF", bg_color: "#094f29"},
        21: {name: "divine +1", txt_color: "#FFFFFF", bg_color: "#094f29"},
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
    st: {
        max: 9,
        min: 1,
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
    fo: {
        max: 8,
        min: 1,
        8: {name: "excellent", txt_color: "#000000", bg_color: "#64ad62"},
        7: {name: "solid", txt_color: "#000000", bg_color: "#74B570"},
        6: {name: "passable", txt_color: "#000000", bg_color: "#84BD7E"},
        5: {name: "inadequate", txt_color: "#000000", bg_color: "#94c58c"},
        4: {name: "weak", txt_color: "#000000", bg_color: "#A6CF9F"},
        3: {name: "poor", txt_color: "#000000", bg_color: "#B8D8B2"},
        2: {name: "wretched", txt_color: "#000000", bg_color: "#CAE2C6"},
        1: {name: "disastrous", txt_color: "#000000", bg_color: "#DBECD9"},
    },
    ls: {
        max: 7,
        min: 1,
        8: {name: "excellent", txt_color: "#000000", bg_color: "#64ad62"},
        7: {name: "solid", txt_color: "#000000", bg_color: "#74B570"},
        6: {name: "passable", txt_color: "#000000", bg_color: "#84BD7E"},
        5: {name: "inadequate", txt_color: "#000000", bg_color: "#94c58c"},
        4: {name: "weak", txt_color: "#000000", bg_color: "#A6CF9F"},
        3: {name: "poor", txt_color: "#000000", bg_color: "#B8D8B2"},
        2: {name: "wretched", txt_color: "#000000", bg_color: "#CAE2C6"},
        1: {name: "disastrous", txt_color: "#000000", bg_color: "#DBECD9"},
    },
    spec: {
        max: 8,
        min: 0,
        undefined: [7],
        8: {name: "support", 		icon: true, },
        6: {name: "resilient",		icon: true, },
        5: {name: "head", 			icon: true, },
        4: {name: "unpredictable",	icon: true, },
        3: {name: "powerful",		icon: true, },
        2: {name: "quick",			icon: true, },
        1: {name: "technical",		icon: true, },
        0: {name: "no specialty",	icon: true, },
    },
    bool: {
        max: 1,
        min: 0,
        1: {name: "true",  checkbox: true, },
        0: {name: "false", checkbox: true, },
    },
    num: {
        max: 9999999,
        min: 0,
    },
    years: {
        max: 41,
        min: 17,
    },
    days: {
        max: 111,
        min: 0,
    },
};

const presets = {
    default: {
        years: 17, days: 0, fo: 7, st: 4.99, gk: 5, df: 5, pm: 5, wg: 5, pg: 5, sc: 5, sp: 5, lo: 1, hg: 0, xp: 2, ls: 1,
        tsi: 0, first: "", nick: "", last: "", ht_id: -1, wage: 300, spec: 0, htms: 0, htms28: 0, cc: 0, fg: 1,
    }
}

const name_pool = {
    first: ["Bob", "Ivan", "John", "Mohammed", "Jose", "Martin", "Ahmed", "Wei", "Ali", "David", "Li", "Pedro"],
    nick: ["the Unstoppable", "der Bomber", "ChouChou", "el Muro", "Makač"],
    last: ["Wang", "Liu", "Kumar", "Hernandez", "Rodriguez", "Bennet", "Blanc", "Smith", "Doe", "Abadi", "Ayad"],
}

export {Player, Age, wage_to_str, spec_to_index, attributes, levels, presets};