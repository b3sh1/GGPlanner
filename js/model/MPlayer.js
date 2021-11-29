import {rand_int, rand_item} from "../utils.js";

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
    }

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
            this.age.years = obj.years;
        }
        if ('days' in obj) {
            this.age.days = obj.days;
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
}


// --- Age ---
class Age {
    constructor(years = 17, days = 0) {
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

    to_str() {
        return `${this.years}.${this.days}`;
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

    to_str() {
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
    }
}


const attributes = {
    sq:   {name: "Debuted",     type: "bool",	tb_show: false,	form_fld: false, },
    tf:   {name: "Full training",type: "bool",  tb_show: false,	form_fld: false, },
    th:   {name: "Half training",type: "bool",	tb_show: false,	form_fld: false, },
    spec: {name: "Specialty",   type: "spec",	tb_show: true,	form_fld: true, },
    st:   {name: "Stamina",     type: "st",	    tb_show: true,	form_fld: true, },
    fo:   {name: "Form",		type: "fo",	    tb_show: false,	form_fld: false, },
    gk:   {name: "Goalkeeping", type: "skill",	tb_show: true,	form_fld: true,	},
    df:   {name: "Defending",   type: "skill",	tb_show: true,	form_fld: true, },
    pm:   {name: "Playmaking",  type: "skill",	tb_show: true,	form_fld: true, },
    wg:   {name: "Winger",      type: "skill",	tb_show: true,	form_fld: true, },
    pg:   {name: "Passing",     type: "skill",	tb_show: true,	form_fld: true, },
    sc:   {name: "Scoring",     type: "skill",	tb_show: true,	form_fld: true, },
    sp:   {name: "Set pieces",  type: "skill",	tb_show: true,	form_fld: true, },
    lo:   {name: "Loyalty",     type: "skill",	tb_show: false,	form_fld: false, },
    ls:   {name: "Leadership",  type: "ls",	    tb_show: false,	form_fld: false, },
    hg:   {name: "Homegrown",   type: "bool",	tb_show: false,	form_fld: false, },
    xp:   {name: "Experience",  type: "skill",	tb_show: false,	form_fld: false, },
    tsi:  {name: "Skill index", type: "num",    tb_show: false,	form_fld: false, },
    htms: {name: "HTMS",        type: "num",	tb_show: false,	form_fld: false, },
    htms28: {name: "HTMS28",    type: "num",    tb_show: false,	form_fld: false, },
    ht_id:  {name: "ID",        type: "num",    tb_show: false,	form_fld: false, },
    cc:   {name: "Nationality", type: "num",    tb_show: false,	form_fld: false, },
    fg:   {name: "Foreigner",   type: "bool",   tb_show: false,	form_fld: false, },
    wage: {name: "Wage",        type: "num",	tb_show: false,	form_fld: false, },
};

const levels = {
    skill: {
        max: 20,
        min: 0,
        step: 1.00,
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
        years: 17, days: 3, fo: 7, st: 4.99, gk: 5, df: 5, pm: 5, wg: 5, pg: 5, sc: 5, sp: 5, lo: 1, hg: 0, xp: 2, ls: 1,
        tsi: 0, first: "", nick: "", last: "", ht_id: -1, wage: 300, spec: 0, htms: 0, htms28: 0, cc: 0, fg: 1, sq: 1,
        tf: 1, th: 0,
    }
}

const name_pool = {
    first: ["Bob", "Ivan", "John", "Mohammed", "Jose", "Martin", "Ahmed", "Wei", "Ali", "David", "Li", "Pedro"],
    nick: ["the Unstoppable", "der Bomber", "ChouChou", "el Muro", "Makač"],
    last: ["Wang", "Liu", "Kumar", "Hernandez", "Rodriguez", "Bennet", "Blanc", "Smith", "Doe", "Abadi", "Ayad"],
}

export {Player, attributes, levels, presets};