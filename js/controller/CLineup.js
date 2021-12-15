import * as Match from "../model/MMatch.js";

function init() {
    const el_lineup = $('#card-lineup');
    let html = '';
    let last_line = '';
    let el_last_line = null;
    for(const pos in Match.player_positions) {
        if(last_line !== Match.player_positions[pos].line) {
            last_line = Match.player_positions[pos].line;
            el_last_line = $(`<div id="lineup-line-${last_line}" class="row d-flex justify-content-center g-1"></div>`).appendTo(el_lineup);
        }
        el_last_line.append(generate_position(pos));
    }
}

function generate_position(pos) {
    let html = `<div class="col-2" style="font-size: 0.9em; font-weight: 200;">
                    <div class="card my-3">
                        <div class="card-header px-1">
                            PL
                        </div>
    
                        <div id="card-lineup" class="card-body text-center px-1">
                            ${pos.toUpperCase()}
                        </div>
    
<!--                        <div class="card-footer">-->
<!--                            FT-->
<!--                        </div>-->
                    </div>
                </div>`;
    return html;
}

export {init};