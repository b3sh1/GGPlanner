class CollapsibleSection {
    constructor(props = {
        parent: null,
        name: '',
        expanded: false,
        children: [],
    }) {
        this.props = props;
    }

    render() {
        let id=`collapse_${this.props.name}`;
        this.props.parent.html(
            `<button
                class="btn btn-outline-info btn-block text-start mt-2 ps-3 gg-collapsible"
                type="button"
                data-mdb-toggle="collapse"
                data-mdb-target="#${id}"
                aria-expanded="${this.props.expanded}"
                aria-controls="${id}"
                onclick="$(this).children('i').toggleClass('fas fa-plus fas fa-minus');"
            >
                <i class="fas fa-minus fa-sm mx-2"></i> ${this.props.name}
            </button>
            <div
                id="${id}"
                class="px-3 collapse ${this.#show()}"
            >
                ${this.#children()}
            </div>`
        );
    }

    #show() {
        if(this.props.expanded) {
            return "show"
        }
        return ""
    }

    #children() {
        let children = "";
        for(const child of this.props.children) {
            children += child;
        }
        return children
    }
}

export {CollapsibleSection};