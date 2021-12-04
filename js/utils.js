// min and max included
function rand_int(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}


function rand_item(arr) {
    return arr[rand_int(0, arr.length-1)];
}


function capitalize_first(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}


function constraint_val(val, min_val, max_val) {
    val = Math.max(val, min_val);
    val = Math.min(val, max_val);
    return val;
}

function round(num, decimals) {
    let d = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * d) / d;
}

function round2(num) {
    return round(num, 2);
}

function examine(e, r='root') {
    if(typeof e === 'object') {
        if(Array.isArray(e)) {
            for(const v in e) {
                examine(v, e);
            }
        } else {
            for(const k in e) {
                if(e.hasOwnProperty(k)) {
                    examine(e[k], e);
                }
            }
        }
    } else {
        console.log(`${r}: ${e} (${typeof e})`);
    }
}

export {rand_int, rand_item, capitalize_first, constraint_val, round, round2, examine};