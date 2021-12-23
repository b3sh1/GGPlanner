import * as Match from "../model/MMatch.js";

class MatchSetupForm {
    constructor(match) {
        this.match = match;
        this.el_select_attitude = $('#select-match-attitude');
        this.el_select_venue = $('#select-match-venue');
        this.el_range_team_spirit = $('#input-match-spirit');
        this.el_range_confidence = $('#input-match-confidence');
        this.el_range_play_style = $('#input-match-play-style');
        this.#init_attitude();
        this.#init_venue();
    }

    reset(match) {
        this.match = match;
        this.el_select_attitude.val(match.attitude);
        this.el_select_venue.val(match.venue);
        this.el_range_team_spirit.val(match.team_spirit);
        this.el_range_confidence.val(match.confidence);
        this.el_range_play_style.val(match.play_style);
    }

    read_attitude() {
        this.match.attitude = this.el_select_attitude.val();
        this.match.calc_ratings();
    }

    read_venue() {
        this.match.venue = this.el_select_venue.val();
        this.match.calc_ratings();
    }

    read_team_spirit() {
        this.match.team_spirit = this.el_range_team_spirit.val();
        this.match.calc_ratings();
    }

    read_confidence() {
        this.match.confidence = this.el_range_confidence.val();
        this.match.calc_ratings();
    }

    read_play_style() {
        this.match.play_style = this.el_range_play_style.val();
        this.match.calc_ratings();
    }


    #init_attitude() {
        // const el_input = $('#input-match-attitude');
        // el_input.val('dummy');
        // new mdb.Input(el_input.parent('.form-outline').get(0)).init();
        new mdb.Input($('#input-match-attitude').parent('.form-outline').get(0)).update();
        for(const attitude in Match.team_attitude) {
            const attitude_text = Match.team_attitude[attitude].name;
            this.el_select_attitude.append(this.#generate_option(attitude, attitude_text));
        }
    }

    #init_venue() {
        // const el_input = $('#input-match-venue');
        // el_input.val('dummy');
        // new mdb.Input(el_input.parent('.form-outline').get(0)).init();
        new mdb.Input($('#input-match-venue').parent('.form-outline').get(0)).update();
        for(const venue in Match.venue) {
            const venue_text = Match.venue[venue].name;
            this.el_select_venue.append(this.#generate_option(venue, venue_text));
        }
    }

    #generate_option(value, text) {
        return `<option value="${value}">${text}</option>`;
    }
}


export {MatchSetupForm};