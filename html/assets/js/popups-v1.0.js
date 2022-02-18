'use strict';

$(function () {
  page.config({
    disableAOSonMobile: true,
    smoothScroll: true,
  });


  // ============
  // = Generating popups
  // ============
  function addPopup(html, id, type, title, text, idTextArea) {
    if (type === 'error') {
      if (typeof idTextArea !== 'undefined') {
        html += `
          <div id="${id}" class="popup bg-img text-white border-0 col-10 col-md-4 p-6" data-position="top-center" data-animation="slide-down" style="background: #cb2d3e;background: -webkit-linear-gradient(to right, #cb2d3e, #ef473a);background: linear-gradient(to right, #cb2d3e, #ef473a);" data-overlay="1" data-autohide="20000">
            <button type="button" class="close" data-dismiss="popup" aria-label="Close">
              <span aria-hidden="true">×</span>
            </button>

            <div class="text-center position-relative">
              <h3 class="fw-200">${title}</h3>
              <p class="lead-1">${text}</p>
              <textarea class="form-control" placeholder="" rows="10" id="${idTextArea}"></textarea>
            </div>
          </div>`
      } else {
        html += `
          <div id="${id}" class="popup bg-img text-white border-0 col-10 col-md-4 p-6" data-position="top-center" data-animation="slide-down" style="background: #cb2d3e;background: -webkit-linear-gradient(to right, #cb2d3e, #ef473a);background: linear-gradient(to right, #cb2d3e, #ef473a);" data-overlay="1" data-autohide="20000">
            <button type="button" class="close" data-dismiss="popup" aria-label="Close">
              <span aria-hidden="true">×</span>
            </button>

            <div class="text-center position-relative">
              <h3 class="fw-200">${title}</h3>
              <p class="lead-1">${text}</p>
            </div>
          </div>`
      }
    } else {
      html += `<div id="${id}" class="popup bg-img text-white border-0 col-10 col-md-4 p-6" data-position="top-center" data-animation="slide-down" style="background: #56CCF2;background: -webkit-linear-gradient(to right, #56CCF2, #2F80ED);background: linear-gradient(to right, #56CCF2, #2F80ED);" data-overlay="1" data-autohide="3000">
        <button type="button" class="close" data-dismiss="popup" aria-label="Close">
          <span aria-hidden="true">×</span>
        </button>

        <div class="text-center position-relative">
          <h3 class="fw-200">${title}</h3>
          <p class="lead-1">${text}</p>
        </div>
      </div>`
    }
    return html;
  }

  var html = '';

  html = addPopup(html, 'popupIncidentSuccess', 'success', 'ДТП скопировано', 'Теперь ты его можешь отправить в чат &#x1F917;');
  html = addPopup(html, 'popupIncidentError', 'error', 'Упс...', 'Что-то определённо пошло не так &#128532; Но ты можешь скопировать инцидент вручную из поля ниже', 'generated-incident');

  html = addPopup(html, 'popupReportSuccess', 'success', 'Отчёт скопирован', 'Теперь ты его можешь отправить в чат. Только убедись, что верно выставил время и дату дежурства');
  html = addPopup(html, 'popupReportError', 'error', 'Упс...', 'Что-то определённо пошло не так &#128532; Но ты можешь скопировать отчёт вручную из поля ниже', 'generated-report');


  html = addPopup(html, 'popupIncidentErrorToken', 'error', 'Неверный токен', 'Похоже, что введённый тобой токен не работает. Используй ссылку внизу страницы, чтобы ввести новый');
  html = addPopup(html, 'popupIncidentErrorScope', 'error', 'Нет доступа', 'Похоже, что у тебя нет доступа к таску. Попробуй открыть его напрямую по ссылке через СтарТрек');
  html = addPopup(html, 'popupIncidentErrorNotFound', 'error', 'Нет такого таска', 'Похоже, что такого таска нет, проверь ссылку ещё раз');
  html = addPopup(html, 'popupIncidentErrorUndefined', 'error', 'Упс...', 'Что-то определённо пошло не так &#128532; Возможно, что проблемы с самим трекером. Попробуй загрузить другой таск/зайти в таск через СтарТрек"</i>');
  html = addPopup(html, 'popupIncidentErrorParsing', 'error', 'Ошибка парсинга', 'Буду краток: таск я получил, но распарсить не смог. Отправь номер таска Севе, он посмотрит. Информацию о нём получить пока что не удастся. Если ошибка массовая - скорее всего поменяли саму форму.');
  
  html = addPopup(html, 'popupReportErrorTime', 'error', 'Постойте-ка...', 'Попридержи коней: похоже, что ты забыл ввести время дежурства. Если это не так - просто игнорируй сообщение, отчёт всё равно скопирован');
  
  $('#popups').html(html);
});
