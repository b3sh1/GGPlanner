
const MAX_TRAINING_WEEKS = 320;

class Training {
    constructor(stages = [new TrainingStage()]) {
        this.stages = stages;
    }

    add(stage_cfg = default_stage_cfg) {
        this.stages.push(new TrainingStage(stage_cfg));
    }

    to_simple_arr() {
        let arr = [];
        for(let stage of this.stages) {
            arr.push(stage.to_simple_obj());
        }
        return arr;
    }

    from_simple_arr(arr, rewrite = true) {
        if(rewrite) {
            this.stages = [];
        }
        for(let stage_cfg of arr) {
            this.add(stage_cfg);
        }
        return this;
    }
}

class TrainingStage {
    constructor(cfg = default_stage_cfg) {
        // init
        for (let key in default_stage_cfg) {
            this[key] = cfg[key];
        }
    }

    to_simple_obj() {
        let obj = {};
        for(let key in default_stage_cfg) {
            obj[key] = this[key];
        }
        return obj;
    }

    from_simple_obj(obj) {
        for(let key in obj) {
            if(key in default_stage_cfg) {
                this[key] = obj[key];
            }
        }
        return this;
    }
}

const default_stage_cfg = {
    coach: 7, assistants: 10, intensity: 1, stamina: 0.1, type: 'F_PM',
    stop: {
        weeks: {set: true, val: MAX_TRAINING_WEEKS},
        skill: {set: false, player_id: -1, type: null, lvl: -1},
        age: {set: false, player_id: -1, years: -1, days: -1},
    }
}

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
    type: {
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
        // specify training minutes e.g.: TC.minutes.other(36, 90) ==> playing 36m in full training spot and 90m in half
        other: function (t_full, t_half) { return (Math.min(t_full, 90) + Math.min(t_half, 90 - t_full) * 0.5) / 90 }
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
    },
    type: {
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
    }
}

const types = {
    // Focused
    "F_GK": {name: "Keeper", category: "focused"},
    "F_DF": {name: "Defending", category: "focused"},
    "F_PM": {name: "Playmaking", category: "focused"},
    "F_WG": {name: "Winger", category: "focused"},
    "F_PG": {name: "Passing", category: "focused"},
    "F_SC": {name: "Scoring", category: "focused"},
    "F_SP": {name: "Set pieces", category: "focused"},
    // Extended
    "E_PG": {name: "Passing", category: "extended"},
    "E_DF": {name: "Defending", category: "extended"},
    "E_WG": {name: "Winger", category: "extended"},
    // Combined
    "C_SC&SP": {name: "Scoring and Set pieces", category: "combined"},
    // Osmosis
    "O_F_DF": {name: "Defending", category: "osmosis", subcategory: "focused"},
    "O_F_PM": {name: "Playmaking", category: "osmosis", subcategory: "focused"},
    "O_F_WG": {name: "Winger", category: "osmosis", subcategory: "focused"},
    "O_F_PG": {name: "Passing", category: "osmosis", subcategory: "focused"},
    "O_F_SC": {name: "Scoring", category: "osmosis", subcategory: "focused"},
    "O_E_PG": {name: "Passing", category: "osmosis", subcategory: "extended"},
    "O_E_DF": {name: "Defending", category: "osmosis", subcategory: "extended"},
    "O_E_WG": {name: "Winger", category: "osmosis", subcategory: "extended"},
}

const categories = {
    focused: ["F_GK", "F_DF", "F_PM", "F_WG", "F_PG", "F_SC", "F_SP", ],
    extended: ["E_PG", "E_DF", "E_WG", ],
    combined: ["C_SC&SP", ],
    osmosis: ["O_F_DF", "O_F_PM", "O_F_WG", "O_F_PG", "O_F_SC", "O_E_PG", "O_E_DF", "O_E_WG", ],
}

export {TrainingStage};