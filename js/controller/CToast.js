// pop toast on screen
function show(toast_cfg) {
    // don't show more than 1 unique toasts (useful for sync toasts not to flood screen as they won't autohide)
    if (toast_cfg.unique) {
        let active_toasts = $('.toast.show .toast-body');
        for (let i = 0; i < active_toasts.length; i++) {
            if (active_toasts[i].innerText === toast_cfg.msg) {
                return;
            }
        }
    }
    let toast_class, toast_icon = '';
    let autohide = true;
    let toast_delay = 2500;  //if -1 => then turn off autohide
    if (toast_cfg.delay) {
        toast_delay = toast_cfg.delay;
        if (toast_delay === -1) {
            autohide = false;
        }
    }
    switch (toast_cfg.result) {
        case 'success':
            toast_class = 'bg-success';
            toast_icon = 'fa-check';
            break;
        case 'fail':
            toast_class = 'bg-danger';
            toast_icon = 'fa-exclamation-circle';
            break;
        case 'warning':
            toast_class = 'bg-warning';
            toast_icon = 'fa-exclamation-triangle';
            break;
        default:
            break;
    }
    let toast_html = `
            <div class="toast hide fade ${toast_class} text-white mt-3" role="alert" aria-live="assertive" aria-atomic="true"
                data-bs-delay="${toast_delay}" data-bs-autohide="${autohide}" style="max-width: 180px; font-size: .75em" >
                <div class="toast-header ${toast_class} text-white">
                    <i class="fas ${toast_icon} fa-lg me-2"></i>
                    <strong class="me-auto">${toast_cfg.reason}</strong>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">${toast_cfg.msg}</div>
            </div>`;
    let el_toast = $(toast_html).prependTo('#alert-panel');
    new bootstrap.Toast(el_toast).show();
}

export {show};