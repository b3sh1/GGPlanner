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


export {rand_int, rand_item, capitalize_first, constraint_val};