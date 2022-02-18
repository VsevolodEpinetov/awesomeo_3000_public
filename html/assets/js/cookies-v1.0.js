'use strict';

$(function () {

  if (typeof getCookie('token') !== 'undefined') {
    $('#tokenField')[0].value = getCookie('token');
  } else {
    $('#modalToken').each(function () {
      var modal = $(this),
        delay = 1000;
      setTimeout(function () {
        modal.modal('show')
      }, delay);
    });
  }


  function setCookie(name, value, options = {}) {

    options = {
      path: '/',
      ...options
    };

    let updatedCookie = encodeURIComponent(name) + "=" + encodeURIComponent(value);

    for (let optionKey in options) {
      updatedCookie += "; " + optionKey;
      let optionValue = options[optionKey];
      if (optionValue !== true) {
        updatedCookie += "=" + optionValue;
      }
    }

    document.cookie = updatedCookie;
  }

  function getCookie(name) {
    let matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
  }

  $('#saveToken').click(function () {
    setCookie('token', $('#tokenField').val())
  })
});
