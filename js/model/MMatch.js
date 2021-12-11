import {round0p25} from '../utils.js';

class Match {
    constructor() {
        this.players_count = 0;
        for(const position in player_positions) {
            this[position] = {player: null, order: 'n'};
        }
    }

    add_player(player, position, order) {
        if(!this[position].player && this.players_count >= 1) {
            return 'Too many players!'
        }


    }
}

class Position {

    constructor() {

    }

}

function ht_rating_to_hatstats(rating, sector) {
    return hatstats_sector_multiplier[sector] * round0p25(rating, sector) / 0.25;
}

const MAX_PLAYERS = 11;

const player_positions = {
    gk:  {name: 'Goalkeeper',               	type: 'gk', orders: ['n'],          		},
    mcd: {name: 'Central Defender (Middle)',	type: 'cd', orders: ['n', 'o'],     		},
    rcd: {name: 'Central Defender (Right)', 	type: 'cd', orders: ['n', 'o', 'w'],		},
    lcd: {name: 'Central Defender (Left)',  	type: 'cd', orders: ['n', 'o', 'w'],		},
    rwb: {name: 'Wing Back (Right)',			type: 'wb',	orders: ['n', 'o', 'd', 'm'],	},
    lwb: {name: 'Wing Back (Left)',  			type: 'wb',	orders: ['n', 'o', 'd', 'm'],	},
    cim: {name: 'Inner Midfielder (Central)',  	type: 'im',	orders: ['n', 'o', 'd'],		},
    rim: {name: 'Inner Midfielder (Right)',  	type: 'im',	orders: ['n', 'o', 'd', 'w'],	},
    lim: {name: 'Inner Midfielder (Left)',  	type: 'im',	orders: ['n', 'o', 'd', 'w'],	},
    rwg: {name: 'Winger (Right)',  				type: 'wg',	orders: ['n', 'o', 'd', 'm'],	},
    lwg: {name: 'Winger (Left)',  				type: 'wg',	orders: ['n', 'o', 'd', 'm'],	},
    cfw: {name: 'Forward (Central)',  			type: 'fw',	orders: ['n', 'd', 'w'],		},
    rfw: {name: 'Forward (Right)',  			type: 'fw',	orders: ['n', 'd', 'w'],		},
    lfw: {name: 'Forward (Left)',  				type: 'fw',	orders: ['n', 'd', 'w'],		},
}


const player_position_types = {
    gk: {name: 'Goalkeeper',        },
    cd: {name: 'Central Defender',	},
    wb: {name: 'Wing Back',			},
    im: {name: 'Inner Midfielder',	},
    wg: {name: 'Winger',  		 	},
    fw: {name: 'Forward',  			},
}

const player_orders = {
    n:	{name: "",					before_pos: false,  },
    o:	{name: "Offensive",			before_pos: true,   },
    d:	{name: "Defensive",			before_pos: true,   },
    td:	{name: "Defensive",	        before_pos: true,   },
    m:	{name: "Towards Middle",	before_pos: false,  },
    w:	{name: "Towards Wing",		before_pos: false,  },
}


// this is used in player strength calculation for comparative purposes (which position is best for particular player)
const hatstats_sector_multiplier = {
    md: 3,  // md has 3x multiplier because is has only one sector compared to 3x both df and att
    df: 1,
    at: 1,
    cd: 1,
    rd: 1,
    ld: 1,
    ca: 1,
    ra: 1,
    la: 1,
};


const overcrowding_penalties = {
    cd: {1:1.0, 2: 0.964, 3: 0.9},
    im: {1:1.0, 2: 0.935, 3: 0.825},
    fw: {1:1.0, 2: 0.945, 3: 0.865},
}

// rating constants
const rc = {
    // midfield
    md: {
        cd: {
            n: {pm: 0.02775},
            o: {pm: 0.0444},
            w: {pm: 0.016649999999999998},
        },
        wb: {
            n: {pm: 0.016649999999999998},
            o: {pm: 0.0222},
            m: {pm: 0.0111},
            d: {pm: 0.0222},
        },
        im: {
            n: {pm: 0.111},
            o: {pm: 0.10545},
            d: {pm: 0.10545},
            w: {pm: 0.0999},
        },
        wg: {
            n: {pm: 0.04995},
            o: {pm: 0.033299999999999996},
            m: {pm: 0.033299999999999996},
            d: {pm: 0.06105000000000001},
        },
        fw: {
            n: {pm: 0.02775},
            d: {pm: 0.038849999999999996},
            w: {pm: 0.016649999999999998},
        }
    },
    // central defense
    cd: {
        gk: {
            n: {gk: 0.135333285, df: 0.054444425000000005},
        },
        cd: {
            n: {df: 0.1555555},
            o: {df: 0.11355551500000001},
            w: {df: 0.10422218500000001},
        },
        wb: {
            n: {df: 0.059111090000000005},
            o: {df: 0.054444425000000005},
            m: {df: 0.10888885000000001},
            d: {df: 0.066888865},
        },
        im: {
            n: {df: 0.062222200000000005},
            o: {df: 0.024888880000000002},
            d: {df: 0.09022219000000001},
            w: {df: 0.051333315000000004},
        },
        wg: {
            n: {df: 0.031111100000000003},
            o: {df: 0.020222215},
            m: {df: 0.038888875},
            d: {df: 0.038888875},
        },
    },
    // side defense
    sd: {
        gk: {
            n: {gk: 0.15555, df: 0.06375},
        },
        mcd: {
            n: {df: 0.0663},
            o: {df: 0.051000000000000004},
        },
        scd: {
            n: {df: 0.1326},
            o: {df: 0.10200000000000001},
            w: {df: 0.20655},
        },
        wb: {
            n: {df: 0.2346},
            o: {df: 0.1887},
            m: {df: 0.19125},
            d: {df: 0.255},
        },
        cim: {
            n: {df: 0.022949999999999998},
            o: {df: 0.0102},
            d: {df: 0.0357},
        },
        sim: {
            n: {df: 0.04845},
            o: {df: 0.022949999999999998},
            d: {df: 0.06885000000000001},
            w: {df: 0.0612},
        },
        wg: {
            n: {df: 0.08925},
            o: {df: 0.056100000000000004},
            m: {df: 0.07395},
            d: {df: 0.15555},
        },
    },
    // central attack
    ca: {
        im: {
            n: {pg: 0.0533775, sc: 0.035585},
            o: {pg: 0.0792575, sc: 0.0501425},
            d: {pg: 0.029115, sc: 0.0210275},
            w: {pg: 0.0372025},
        },
        wg: {
            n: {pg: 0.0177925},
            o: {pg: 0.0210275},
            d: {pg: 0.008087500000000001},
            m: {pg: 0.02588},
        },
        fw: {
            n: {pg: 0.0533775, sc: 0.16175},
            d: {pg: 0.08572750000000001, sc: 0.09058000000000001},
            w: {pg: 0.0372025, sc: 0.106755},
        }
    },
    // side attack
    sa: {
        scd: {
            w: {wg: 0.04966},
        },
        wb: {
            n: {wg: 0.11269},
            o: {wg: 0.13179},
            m: {wg: 0.06684999999999999},
            d: {wg: 0.08595},
        },
        cim: {
            n: {pg: 0.02483},
            o: {pg: 0.03438},
            d: {pg: 0.013370000000000002},
        },
        sim: {
            n: {pg: 0.04966},
            o: {pg: 0.06876},
            d: {pg: 0.026740000000000003},
            w: {pg: 0.05921, wg: 0.11269},
        },
        wg: {
            n: {pg: 0.04966, wg: 0.16426},
            o: {pg: 0.055389999999999995, wg: 0.191},
            d: {pg: 0.04011, wg: 0.13179},
            m: {pg: 0.02865, wg: 0.14134},
        },
        fw: {
            n: {pg: 0.026740000000000003, wg: 0.04584, sc: 0.051570000000000005},
            d: {pg: 0.05921, wg: 0.02483, sc: 0.02483},
            td: {pg: 0.07830999999999999, wg: 0.02483, sc: 0.02483},
            w: {pg: 0.04011, wg: 0.12224, sc: 0.09741},
        },
    },
    // other side attack
    oa: {
        fw: {
            w: {pg: 0.01146, wg: 0.04011, sc: 0.03629},
        },
    },
}


// rating contributions by position
const prc = {
    gk: {
        n: {
            cd: rc.cd.gk.n,
            ld: rc.sd.gk.n,
            rd: rc.sd.gk.n,
        },
    },
    mcd: {
        n: {
            md: rc.md.cd.n,
            cd: rc.cd.cd.n,
            ld: rc.sd.mcd.n,
            rd: rc.sd.mcd.n,
        },
        o: {
            md: rc.md.cd.o,
            cd: rc.cd.cd.o,
            ld: rc.sd.mcd.o,
            rd: rc.sd.mcd.o,
        },
    },
    rcd: {
        n: {
            md: rc.md.cd.n,
            cd: rc.cd.cd.n,
            rd: rc.sd.scd.n,
        },
        o: {
            md: rc.md.cd.o,
            cd: rc.cd.cd.o,
            rd: rc.sd.scd.o,
        },
        w: {
            md: rc.md.cd.w,
            cd: rc.cd.cd.w,
            rd: rc.sd.scd.w,
            ra: rc.sa.scd.w,
        },
    },
    lcd: {
        n: {
            md: rc.md.cd.n,
            cd: rc.cd.cd.n,
            ld: rc.sd.scd.n,
        },
        o: {
            md: rc.md.cd.o,
            cd: rc.cd.cd.o,
            ld: rc.sd.scd.o,
        },
        w: {
            md: rc.md.cd.w,
            cd: rc.cd.cd.w,
            ld: rc.sd.scd.w,
            la: rc.sa.scd.w,
        },
    },
    rwb: {
        n: {
            md: rc.md.wb.n,
            cd: rc.cd.wb.n,
            rd: rc.sd.wb.n,
            ra: rc.sa.wb.n,
        },
        o: {
            md: rc.md.wb.o,
            cd: rc.cd.wb.o,
            rd: rc.sd.wb.o,
            ra: rc.sa.wb.o,
        },
        m: {
            md: rc.md.wb.m,
            cd: rc.cd.wb.m,
            rd: rc.sd.wb.m,
            ra: rc.sa.wb.m,
        },
        d: {
            md: rc.md.wb.d,
            cd: rc.cd.wb.d,
            rd: rc.sd.wb.d,
            ra: rc.sa.wb.d,
        },
    },
    lwb: {
        n: {
            md: rc.md.wb.n,
            cd: rc.cd.wb.n,
            ld: rc.sd.wb.n,
            la: rc.sa.wb.n,
        },
        o: {
            md: rc.md.wb.o,
            cd: rc.cd.wb.o,
            ld: rc.sd.wb.o,
            la: rc.sa.wb.o,
        },
        m: {
            md: rc.md.wb.m,
            cd: rc.cd.wb.m,
            ld: rc.sd.wb.m,
            la: rc.sa.wb.m,
        },
        d: {
            md: rc.md.wb.d,
            cd: rc.cd.wb.d,
            ld: rc.sd.wb.d,
            la: rc.sa.wb.d,
        },
    },
    cim: {
        n: {
            md: rc.md.im.n,
            cd: rc.cd.im.n,
            rd: rc.sd.cim.n,
            ld: rc.sd.cim.n,
            ca: rc.ca.im.n,
            ra: rc.sa.cim.n,
            la: rc.sa.cim.n,
        },
        o: {
            md: rc.md.im.o,
            cd: rc.cd.im.o,
            rd: rc.sd.cim.o,
            ld: rc.sd.cim.o,
            ca: rc.ca.im.o,
            ra: rc.sa.cim.o,
            la: rc.sa.cim.o,
        },
        d: {
            md: rc.md.im.d,
            cd: rc.cd.im.d,
            rd: rc.sd.cim.d,
            ld: rc.sd.cim.d,
            ca: rc.ca.im.d,
            ra: rc.sa.cim.d,
            la: rc.sa.cim.d,
        },
    },
    rim: {
        n: {
            md: rc.md.im.n,
            cd: rc.cd.im.n,
            rd: rc.sd.sim.n,
            ca: rc.ca.im.n,
            ra: rc.sa.sim.n,
        },
        o: {
            md: rc.md.im.o,
            cd: rc.cd.im.o,
            rd: rc.sd.sim.o,
            ca: rc.ca.im.o,
            ra: rc.sa.sim.o,
        },
        d: {
            md: rc.md.im.d,
            cd: rc.cd.im.d,
            rd: rc.sd.sim.d,
            ca: rc.ca.im.d,
            ra: rc.sa.sim.d,
        },
        w: {
            md: rc.md.im.w,
            cd: rc.cd.im.w,
            rd: rc.sd.sim.w,
            ca: rc.ca.im.w,
            ra: rc.sa.sim.w,
        },
    },
    lim: {
        n: {
            md: rc.md.im.n,
            cd: rc.cd.im.n,
            ld: rc.sd.sim.n,
            ca: rc.ca.im.n,
            la: rc.sa.sim.n,
        },
        o: {
            md: rc.md.im.o,
            cd: rc.cd.im.o,
            ld: rc.sd.sim.o,
            ca: rc.ca.im.o,
            la: rc.sa.sim.o,
        },
        d: {
            md: rc.md.im.d,
            cd: rc.cd.im.d,
            ld: rc.sd.sim.d,
            ca: rc.ca.im.d,
            la: rc.sa.sim.d,
        },
        w: {
            md: rc.md.im.w,
            cd: rc.cd.im.w,
            ld: rc.sd.sim.w,
            ca: rc.ca.im.w,
            la: rc.sa.sim.w,
        },
    },
    rwg: {
        n: {
            md: rc.md.wg.n,
            cd: rc.cd.wg.n,
            rd: rc.sd.wg.n,
            ca: rc.ca.wg.n,
            ra: rc.sa.wg.n,
        },
        o: {
            md: rc.md.wg.o,
            cd: rc.cd.wg.o,
            rd: rc.sd.wg.o,
            ca: rc.ca.wg.o,
            ra: rc.sa.wg.o,
        },
        m: {
            md: rc.md.wg.m,
            cd: rc.cd.wg.m,
            rd: rc.sd.wg.m,
            ca: rc.ca.wg.m,
            ra: rc.sa.wg.m,
        },
        d: {
            md: rc.md.wg.d,
            cd: rc.cd.wg.d,
            rd: rc.sd.wg.d,
            ca: rc.ca.wg.d,
            ra: rc.sa.wg.d,
        },
    },
    lwg: {
        n: {
            md: rc.md.wg.n,
            cd: rc.cd.wg.n,
            ld: rc.sd.wg.n,
            ca: rc.ca.wg.n,
            la: rc.sa.wg.n,
        },
        o: {
            md: rc.md.wg.o,
            cd: rc.cd.wg.o,
            ld: rc.sd.wg.o,
            ca: rc.ca.wg.o,
            la: rc.sa.wg.o,
        },
        m: {
            md: rc.md.wg.m,
            cd: rc.cd.wg.m,
            ld: rc.sd.wg.m,
            ca: rc.ca.wg.m,
            la: rc.sa.wg.m,
        },
        d: {
            md: rc.md.wg.d,
            cd: rc.cd.wg.d,
            ld: rc.sd.wg.d,
            ca: rc.ca.wg.d,
            la: rc.sa.wg.d,
        },
    },
    cfw: {
        n: {
            md: rc.md.fw.n,
            ca: rc.ca.fw.n,
            ra: rc.sa.fw.n,
            la: rc.sa.fw.n,
        },
        d: {
            md: rc.md.fw.d,
            ca: rc.ca.fw.d,
            ra: rc.sa.fw.d,
            la: rc.sa.fw.d,
        },
        td: {
            md: rc.md.fw.d,
            ca: rc.ca.fw.d,
            ra: rc.sa.fw.td,
            la: rc.sa.fw.td,
        },
    },
    lfw: {
        n: {
            md: rc.md.fw.n,
            ca: rc.ca.fw.n,
            ra: rc.sa.fw.n,
            la: rc.sa.fw.n,
        },
        d: {
            md: rc.md.fw.d,
            ca: rc.ca.fw.d,
            ra: rc.sa.fw.d,
            la: rc.sa.fw.d,
        },
        td: {
            md: rc.md.fw.d,
            ca: rc.ca.fw.d,
            ra: rc.sa.fw.td,
            la: rc.sa.fw.td,
        },
        w: {
            md: rc.md.fw.w,
            ca: rc.ca.fw.w,
            ra: rc.oa.fw.w,
            la: rc.sa.fw.w,
        },
    },
    rfw: {
        n: {
            md: rc.md.fw.n,
            ca: rc.ca.fw.n,
            ra: rc.sa.fw.n,
            la: rc.sa.fw.n,
        },
        d: {
            md: rc.md.fw.d,
            ca: rc.ca.fw.d,
            ra: rc.sa.fw.d,
            la: rc.sa.fw.d,
        },
        td: {
            md: rc.md.fw.d,
            ca: rc.ca.fw.d,
            ra: rc.sa.fw.td,
            la: rc.sa.fw.td,
        },
        w: {
            md: rc.md.fw.w,
            ca: rc.ca.fw.w,
            ra: rc.sa.fw.w,
            la: rc.oa.fw.w,
        },
    },
}

const prc_for_player_strength_calc = {gk: prc.gk, wb: prc.rwb, cd: prc.rcd, im: prc.rim, wg: prc.rwg, fw: prc.rfw};



export {ht_rating_to_hatstats, prc_for_player_strength_calc, overcrowding_penalties, player_position_types, player_orders};