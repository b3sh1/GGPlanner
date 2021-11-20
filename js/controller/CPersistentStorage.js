
// write data to persistent storage
function save(name, simple_obj) {
    localStorage.setItem(name, JSON.stringify(simple_obj));
    return name;
}

// load data from persistent storage
function load(name) {
    return JSON.parse(localStorage.getItem(name));
}

export {save, load};