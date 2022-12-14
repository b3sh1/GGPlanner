import {round0p25, round2} from '../utils.js';

class Match {
    constructor(squad) {
        this.players_count = {total: 0, field: 0, gk: 0, df: 0, md: 0, at: 0};
        this.squad = squad;
        for(const pos in player_positions) {
            this[pos] = {player_id: '-1', order: 'n'};
        }
        this.attitude = 'pin';
        this.venue = 'away';
        this.team_spirit = 4.5;
        this.confidence = 4.5;
        this.play_style = 0;
        this.sector_ratings = {};
        this.indirect_free_kicks = {};
        this.tactic = {};
        this.hatstats = {};
        this.calc_ratings();
    }

    update_squad(squad) {
        this.squad = squad;
        this.calc_ratings();
    }

    update_player(position, player_id) {
        if(this[position].player_id <= -1) {
            this.#count_pos_up(position);
        }
        if(player_id <= -1 && this.players_count.total >= 0) {
            this.#count_pos_down(position);
        }
        this[position].player_id = player_id;
        this.calc_ratings();
    }

    update_order(position, order) {
        this[position].order = order;
        this.calc_ratings();
    }

    remove_player(player_id) {
        for(const pos in player_positions) {
            if(player_id === this[pos].player_id) {
                this[pos] = {player_id: '-1', order: 'n'};
                this.#count_pos_down(pos);
            }
        }
        this.calc_ratings();
    }

    calc_ratings() {
        this.#reset_ratings();
        this.#calc_sector_ratings_and_idf();    // sector ratings and indirect free kicks
        this.#calc_hatstats()
    }

    #calc_sector_ratings_and_idf() {
        let count_pos_types = {cd: 0, im: 0, fw: 0};
        let idf = {sum_sc: 0, sum_df: 0, sum_sp: 0, max_sp: -1, gk_sp: 0, gk_gk: 0}

        // add player contribution to ratings + count number of player in central positions
        for(const pos in player_positions) {
            if(this[pos].player_id > -1) {
                // count IMs/CDs/FWs to apply overcrowding penalty later
                if(player_positions[pos].type in count_pos_types) {
                    count_pos_types[player_positions[pos].type]++;
                }

                const player = this.squad.players[this[pos].player_id];
                const player_rating_contributions = player.rating_contributions[pos][this[pos].order];
                for(const sector in player_rating_contributions) {
                    this.sector_ratings[sector] += player_rating_contributions[sector];
                }

                if(pos === 'gk') {
                    idf.gk_sp = player.sp;
                    idf.gk_gk = player.gk;
                } else {
                    if(player.sp > idf.max_sp) {
                        idf.max_sp = player.sp;
                    }
                    idf.sum_sc += player.sc;
                    idf.sum_df += player.df;
                    idf.sum_sp += player.sp;
                }
            }
        }
        this.#calc_sector_ratings(count_pos_types); // calc final sector ratings
        this.#calc_idf(idf);    // calc indirect free kicks ratings
    }

    #calc_sector_ratings(count_pos_types) {
        for(const sector in this.sector_ratings) {
            let overcrowding_penalty = 1.0;
            let sector_multiplier = 1.0;
            if(sector === 'md') {
                overcrowding_penalty = overcrowding_penalties['im'][count_pos_types['im']];
                let ts_factor = (1.0 + (this.team_spirit-4.5) * 0.07);
                sector_multiplier = venue[this.venue].c * team_attitude[this.attitude].c * ts_factor * overcrowding_penalty;
            }
            if(sector === 'rd' || sector === 'cd' || sector === 'ld') {
                if(sector === 'cd') {
                    overcrowding_penalty = overcrowding_penalties['cd'][count_pos_types['cd']];
                }
                let play_style_factor = 1.005 + (this.play_style * -0.00123);
                sector_multiplier = play_style_factor * overcrowding_penalty;
            }
            if(sector === 'ra' || sector === 'ca' || sector === 'la') {
                if (sector === 'ca') {
                    overcrowding_penalty = overcrowding_penalties['fw'][count_pos_types['fw']];
                }
                let confidence_factor = (1.0 + (this.confidence-4.5) * 0.05);
                let play_style_factor = 0.977 + (this.play_style * 0.00097);
                sector_multiplier = confidence_factor * play_style_factor * overcrowding_penalty;
            }
            this.sector_ratings[sector] = round2(Math.pow(this.sector_ratings[sector] * sector_multiplier, SECTOR_RATING_POWER) + BASE_SECTOR_RATING);
        }
    }

    #calc_hatstats() {
        for(const sector in sectors) {
            let partial_sector_hatstats = sector_multiplier[sector] * (round0p25(this.sector_ratings[sector]) - BASE_SECTOR_RATING) / 0.25;
            this.hatstats[sectors[sector].type] += partial_sector_hatstats
            this.hatstats.total += partial_sector_hatstats;
        }
    }

    #calc_idf(idf) {
        const n = Math.max(1, this.players_count.field);
        this.indirect_free_kicks.at = round2(0.5 * idf.sum_sc/n + 0.3 * idf.sum_sp/n + 0.09 * idf.max_sp);
        this.indirect_free_kicks.df = round2(0.4 * idf.sum_df/n + 0.3 * idf.sum_sp/n + 0.1 * idf.gk_sp + 0.08 * idf.gk_gk);
    }

    #reset_ratings() {
        for(const sector in sectors) {
            this.sector_ratings[sector] = 0.0;
        }
        this.indirect_free_kicks = {df: 0, at: 0};
        this.tactic = {type: null, lvl: 0};
        for(const sector in hatstats_sectors) {
            this.hatstats[sector] = 0;
        }
    }

    #count_pos_up(pos) {
        const line = player_positions[pos].line;
        this.players_count.total++;
        this.players_count[line]++;
        if(line !== 'gk') {
            this.players_count.field++;
        }
    }

    #count_pos_down(pos) {
        const line = player_positions[pos].line;
        this.players_count.total--;
        this.players_count[line]--;
        if(line !== 'gk') {
            this.players_count.field--;
        }
    }

    to_simple_obj() {
        let obj = {
            players_count: this.players_count,
            attitude: this.attitude,
            venue: this.venue,
            team_spirit: this.team_spirit,
            confidence: this.confidence,
            play_style: this.play_style,
        };
        for(const pos in player_positions) {
            obj[pos] = this[pos];
        }
        return obj;
    }

    from_simple_obj(obj) {
        if(!obj) {
            return this;
        }
        for(const key in obj.players_count) {
            this.players_count[key] = Number.parseInt(obj.players_count[key]);
        }
        this.attitude = obj.attitude;
        this.venue = obj.venue;
        this.team_spirit = Number.parseFloat(obj.team_spirit);
        this.confidence = Number.parseFloat(obj.confidence);
        this.play_style = Number.parseInt(obj.play_style);
        for(const pos in player_positions) {
            this[pos] = obj[pos];
        }
        this.calc_ratings();
        return this;
    }
}

class MatchError extends Error {
    constructor(message) {
        super(message);
        this.name = "MatchError";
    }
}


function ht_player_strength_to_hatstats(rating) {
    return round0p25(Math.pow(rating, SECTOR_RATING_POWER)) / 0.25;
}


function position_to_str(pos_type, ord, mode='normal') {
    let str = '';
    if(mode === 'extended' || mode === 'normal') {
        str = `${player_position_types[pos_type].name}`;
        if(player_orders[ord].before_pos) {
            str = `${player_orders[ord].name} ${str}`;
        } else {
            str += ` ${player_orders[ord].name}`;
        }
    }
    if(mode === 'compact') {
        str = `${player_position_types[pos_type].short}`;
        if(player_orders[ord].before_pos) {
            str = `${player_orders[ord].short}${str}`;
        } else {
            str += `${player_orders[ord].short}`;
        }
    }
    return str;
}


const MAX_PLAYERS = 11;
const BASE_SECTOR_RATING = 0.75;
const SECTOR_RATING_POWER = 1.165;

const player_positions = {
    gk:  {name: 'Goalkeeper',               	type: 'gk', line: 'gk', orders: ['n'],          		},
    rwb: {name: 'Wing Back (Right)',			type: 'wb', line: 'df', orders: ['n', 'o', 'd', 'm'],	},
    rcd: {name: 'Central Defender (Right)', 	type: 'cd', line: 'df', orders: ['n', 'o', 'w'],		},
    mcd: {name: 'Central Defender (Middle)',	type: 'cd', line: 'df', orders: ['n', 'o'],     		},
    lcd: {name: 'Central Defender (Left)',  	type: 'cd', line: 'df', orders: ['n', 'o', 'w'],		},
    lwb: {name: 'Wing Back (Left)',  			type: 'wb', line: 'df', orders: ['n', 'o', 'd', 'm'],	},
    rwg: {name: 'Winger (Right)',  				type: 'wg', line: 'md', orders: ['n', 'o', 'd', 'm'],	},
    rim: {name: 'Inner Midfielder (Right)',  	type: 'im', line: 'md', orders: ['n', 'o', 'd', 'w'],	},
    cim: {name: 'Inner Midfielder (Central)',  	type: 'im', line: 'md', orders: ['n', 'o', 'd'],		},
    lim: {name: 'Inner Midfielder (Left)',  	type: 'im', line: 'md', orders: ['n', 'o', 'd', 'w'],	},
    lwg: {name: 'Winger (Left)',  				type: 'wg', line: 'md', orders: ['n', 'o', 'd', 'm'],	},
    rfw: {name: 'Forward (Right)',  			type: 'fw', line: 'at', orders: ['n', 'd', 'w'],		},
    cfw: {name: 'Forward (Central)',  			type: 'fw', line: 'at', orders: ['n', 'd',],		    },
    lfw: {name: 'Forward (Left)',  				type: 'fw', line: 'at', orders: ['n', 'd', 'w'],		},
}


const player_position_types = {
    gk: {name: 'Goalkeeper',        short: 'GK'},
    cd: {name: 'Central Defender',	short: 'CD'},
    wb: {name: 'Wing Back',			short: 'WB'},
    im: {name: 'Inner Midfielder',	short: 'IM'},
    wg: {name: 'Winger',  		 	short: 'W'},
    fw: {name: 'Forward',  			short: 'F'},
}

const player_orders = {
    n:	{name: "",					short: "",		before_pos: false,  },
    o:	{name: "Offensive",			short: "O",		before_pos: true,   },
    d:	{name: "Defensive",			short: "D",		before_pos: true,   },
    td:	{name: "Defensive",	        short: "D",		before_pos: true,   },
    m:	{name: "Towards Middle",	short: "TM",	before_pos: false,  },
    w:	{name: "Towards Wing",		short: "TW",	before_pos: false,  },
}


// this is used in player strength calculation for comparative purposes (which position is best for particular player)
const sector_multiplier = {
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

const sectors = {
    md: {name: "Midfield",          type: 'md', },
    rd: {name: "Right Defense",     type: 'df', },
    cd: {name: "Central Defense",   type: 'df', },
    ld: {name: "Left Defense",      type: 'df', },
    ra: {name: "Right Attack",      type: 'at', },
    ca: {name: "Central Attack",    type: 'at', },
    la: {name: "Left Attack",       type: 'at', },
}

const hatstats_sectors = {
    df: {name: "Defense",   },
    md: {name: "Midfield",  },
    at: {name: "Attack",    },
    total: {name: "Total",  },
}


const overcrowding_penalties = {
    cd: {0: 1.0, 1: 1.0, 2: 0.964, 3: 0.9,   },
    im: {0: 1.0, 1: 1.0, 2: 0.935, 3: 0.825, },
    fw: {0: 1.0, 1: 1.0, 2: 0.945, 3: 0.865, },
}

const team_attitude = {
    pin:  {name: "Normal",				c: 1.0, 	},
    pic:  {name: "Play it Cool", 		c: 0.83945, },
    mots: {name: "Match of the Season", c: 1.1149, 	},
}

const venue = {
    away:  {name: "Away", 	        c: 1.0,     },
    home:  {name: "Home",			c: 1.19892, },
    derby: {name: "Derby (Away)",   c: 1.11493, },
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
            d: {pm: 0.0111},
            m: {pm: 0.0222},
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
            d: {pm: 0.033299999999999996},
            m: {pm: 0.06105000000000001},
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
            d: {df: 0.038888875},
            m: {df: 0.038888875},
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
            d: {df: 0.15555},
            m: {df: 0.07395},
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

const prc_for_player_strength_calc = {
    gk: 'gk',
    rwb: 'wb',
    rcd: 'cd',
    rim: 'im',
    rwg: 'wg',
    rfw: 'fw',
};



export {Match, MatchError, ht_player_strength_to_hatstats, position_to_str, SECTOR_RATING_POWER, prc, prc_for_player_strength_calc, overcrowding_penalties, sector_multiplier, sectors, hatstats_sectors, player_positions, player_position_types, player_orders, team_attitude, venue};