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
            <div style="font-size: 1.5em">
                <span>
                    <a id="a-export" href="#!"">
                        <i class="fas fa-save"></i>
                    </a>
                </span>
                <span>
                    <a id="a-import" href="#!">
                        <i class="fas fa-file-import"></i>
                    </a>
                </span>
                <span>
                    <a id="a-destroy" href="#!">
                        <i class="fas fa-trash-alt"></i>
                    </a>
                </span>
            </div>
        </div>
    </div>
`

export {html};