const TXT_HEADER = "Hattrick Golden Generation Planner";

let html = `
    <!-- <section id="header"> -->
    <!-- <h3 class="text-center"><strong>${TXT_HEADER}</strong></h3> -->
    <!-- </section> -->
    
    <!-- <hr class="my-5"/> -->
    
    <div class="row">
        <!--Grid column-->

        <!--Grid column-->
        <div class="col">
            <div class="text-info" style="font-size: 1.5em">
                <span title="Save current data to file">
                    <a id="btn-export" href="#!" data-mdb-toggle="modal"
                            data-mdb-target="#modal-export">
                        <i class="fas fa-save"></i>
                    </a>
<!--                    <button id="btn-export" type="button" class="btn btn-link btn-lg ripple-surface ripple-surface-dark" data-mdb-ripple-color="dark" style="font-size: 1em">-->
<!--                        <i class="fas fa-save"></i>-->
<!--                    </button>-->
                </span>
                <span title="Load data from file">
                    <a id="btn-import" href="#!">
                        <i class="fas fa-file-import"></i>
                    </a>
<!--                    <button id="btn-import" type="button" class="btn btn-link btn-lg ripple-surface ripple-surface-dark" data-mdb-ripple-color="dark" style="font-size: 1em">-->
<!--                        <i class="fas fa-file-import"></i>-->
<!--                    </button>-->
                </span>
                <span title="Delete all current data">
                    <a id="btn-destroy" href="#!" data-mdb-toggle="modal"
                            data-mdb-target="#modal-destroy-data">
                        <i class="fas fa-trash-alt"></i>
                    </a>
<!--                    <button id="btn-destroy" type="button" class="btn btn-link btn-lg ripple-surface ripple-surface-dark" data-mdb-ripple-color="dark" style="font-size: 1em">-->
<!--                        <i class="fas fa-trash-alt"></i>-->
<!--                    </button>-->
                </span>
                <span title="About this website">
                    <a id="btn-about" href="#!" data-mdb-toggle="modal"
                            data-mdb-target="#modal-about">
                        <i class="fas fa-question"></i>
                    </a>
                </span>
            </div>
        </div>
    </div>
`

export {html};