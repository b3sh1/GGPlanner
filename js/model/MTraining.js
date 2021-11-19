
class TrainingPhase {
    constructor(cfg = {
        coach: 7, assistants: 10, intensity: 1, stamina: 0.1, type: 'F_PM',
        stop: {
            weeks: {set: true, val: 320},
            skill: {set: false, player_id: -1, type: null, lvl: -1},
            age: {set: false, player_id: -1, years: -1, days: -1},
        },
    }) {
        // init
        for (let key in cfg) {
            this[key] = cfg[key];
        }
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
    assistant: {
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
        "C_SC-SP": 0.0150,
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
        "full": 1.0,
        "half": 0.5,
        // specify training minutes e.g.: Minutes["spec"](36, 90) => playing 36m in full training spot and 90m in half
        "other": function (t_full, t_half) { return (Math.min(t_full, 90) + Math.min(t_half, 90 - t_full) * 0.5) / 90 }
    },
}

export {TrainingPhase};