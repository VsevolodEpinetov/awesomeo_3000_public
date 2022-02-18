const socket = io();

function copyToClipboard(text) {
    var dummy = document.createElement("textarea");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
  }  


function popupShow(popup) {

    var autohide = parseInt(popup.dataAttr('autohide', 0)),
      once_key = popup.dataAttr('once', '');

    // Check if it was a once popup
    if (once_key != '') {
      if (localStorage.getItem(once_key) == 'displayed') {
        return;
      }

      var once_btn = popup.find('[data-once-button="true"]');
      if (once_btn.length) {
        once_btn.on('click', function () {
          localStorage.setItem(once_key, 'displayed');
        });
      } else {
        localStorage.setItem(once_key, 'displayed');
      }
    }

    popup.addClass('show');
    setTimeout(function () {
      popup.find('input:text:visible:first').focus();
    }, 300);

    if (autohide > 0) {
      setTimeout(function () {
        popup.removeClass('show')
      }, autohide);
    }
  }

  function addClassInvalid(element) {
    if (element.className.indexOf('is-valid') > -1) {
      element.className = element.className.replace(' is-valid', '');
    }
    if (element.className.indexOf('is-invalid') < 0) {
      element.className += ' is-invalid'
    }
  }

  function addClassValid(element) {
    if (element.className.indexOf('is-invalid') > -1) {
      element.className = element.className.replace(' is-invalid', '');
    }
    if (element.className.indexOf('is-valid') < 0) {
      element.className += ' is-valid'
    }
  }