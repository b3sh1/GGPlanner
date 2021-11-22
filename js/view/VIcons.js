
let specialty = {
    // support
    8: `
        <span>
            <i class="fas fa-people-carry"></i> 
        </span>
    `,
    // resilient
    6: `
        <span>
            <i class="fas fa-user-injured"></i> 
        </span>
    `,
    //header
    5: `
        <span>
            <span class="fa-layers fa-fw">
                <i class="fas fa-user-alt" data-fa-transform="shrink-1 left-2"></i>
                <i class="fas fa-futbol" data-fa-transform="shrink-8 up-10 right-6"></i>
            </span>
        </span>`,
    // unpredictable
    4: `
        <span>
            <i class="fas fa-dice" data-fa-transform="grow-2"></i> 
        </span>
    `,
    // powerful
    3: `
        <span>
            <i class="fas fa-shield-alt" data-fa-transform="grow-2"></i>
        </span>
    `,
    // quick
    2: `
        <span>
            <span class="fa-layers fa-fw">
                <i class="fas fa-wind fa-flip-horizontal" data-fa-transform="shrink-4 left-8"></i>
                <i class="fas fa-running" data-fa-transform="right-4 grow-3"></i>
            </span>
        </span>`,
    // technical
    1: `
        <span>
            <i class="fas fa-cogs" data-fa-transform="grow-2"></i>
        </span>
    `,
    // no specialty
    0: ``,
}


export {specialty};