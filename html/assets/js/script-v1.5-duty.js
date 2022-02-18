'use strict';

$(function () {
  page.config({
    disableAOSonMobile: true,
    smoothScroll: true,
  });


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


  // ============
  // = Variables
  // ============
  var structure = {};
  var socket = io();


  // Report structure
  structure.report = {};
  structure.report.field = {};
  structure.report.field.name = [
    "🚔 Тяжелые/значимые инциденты",
    "🆘 Факапы",
    "⚙️ Баг-репорты/новые таски",
    "✍️ Топ-5 запросов",
    "🙂 Интересное/смешное",
    "🥰 Лояльность (такси/еда)",
    "💻 Сборка",
    "🗓 Текущие задачи",
  ]
  structure.report.field.placeholder = [
    "🚔 Тяжелые/значимые инциденты",
    "🆘 Факапы",
    "⚙️ Баг-репорты/новые таски",
    "✍️ Топ-5 запросов",
    "🙂 Интересное/смешное",
    "🥰 Лояльность (такси/еда)",
    "💻 Сборка",
    '- Задача №1&#10;- Задача №2'
  ]
  structure.report.field.id = [
    'incidents',
    'fuckups',
    'newTasks',
    'top5requests',
    'interesting',
    'loyalty',
    'workingchats',
    'currenttasks'
  ]

  // Incident structure
  structure.incident = {};
  structure.incident.field = {};
  structure.incident.field.name = [
    'ФИО',
    'Телефон',
    'Автомобиль',
    'Время',
    'Адрес',
    'Виноват',
    'Повреждения',
    'Хронология',
    'Оформление'
  ]
  structure.incident.field.id = [
    'incidentName',
    'incidentPhone',
    'incidentCar',
    'incidentTime',
    'incidentAddress',
    'incidentCulprit',
    'incidentDamage',
    'incidentChronology',
    'incidentPaperwork'
  ]

  structure.incident.type = {};
  structure.incident.type.name = [
    'ДТП',
    'Инцидент',
    'Пьяный водитель',
    'Повреждения',
    'Передача аккаунта',
    'Передача управления',
    'Угон авто',
    'Угон аккаунта и автомобиля'
  ]
  structure.incident.type.id = [
    'typeOfIncidentDTP',
    'typeOfIncidentIncident',
    'typeOfIncidentDrunk',
    'typeOfIncidentDamages',
    'typeOfIncidentAccountTransfer',
    'typeOfIncidentControlTransfer',
    'typeOfIncidentCarTheft',
    'typeOfIncidentAccountTheft'
  ]


  var incident = {};


  // ============
  // = Generating part with report
  // ============
  var html = '';
  structure.report.field.name.forEach((field, index) => {
    let id = structure.report.field.id[index];
    let idCheckbox = `${id}Checkbox`;
    let idText = `${id}Text`;
    let placeholder = structure.report.field.placeholder[index];
    html += `
    <div class="col-md-6">
      <div class="custom-control custom-checkbox" id="${id}">
        <input type="checkbox" class="custom-control-input" id="${idCheckbox}">
        <label class="custom-control-label" id="${id}">
          <h5 id="${id}">${field}</h5>
        </label>
      </div>
      <div class="form-group">
        <textarea class="form-control" placeholder="${placeholder}" rows="5" disabled id="${idText}"></textarea>
        <div class="invalid-feedback">В этом пункте явно что-то не так 🤔</div>
      </div>
    </div>`
  })
  $('#report').html(html);

  // ============
  // = Generating incident loader
  // ============

  var partWithTypes = ``;
  structure.incident.type.name.forEach((name, index) => {
    let id = structure.incident.type.id[index];
    let idRadio = `${id}Radio`;
    let idLabel = `${id}Label`;
    if (index === 0)
      partWithTypes += `
        <div class="custom-control custom-radio" id='${id}'>
          <input type="radio" class="custom-control-input" name="typeOfDTP" checked id='${idRadio}'>
          <label class="custom-control-label" id="${idLabel}">${name}</label>
        </div>`;
    else
      partWithTypes += `
        <div class="custom-control custom-radio" id ='${id}'>
          <input type="radio" class="custom-control-input" name="typeOfDTP" id='${idRadio}'>
          <label class="custom-control-label" id="${idLabel}">${name}</label>
        </div>`;
  })

  var html = `
    <div class="col-md-6">
      <div class="form-group">
        <input class="form-control" type="text" id="incidenturl">
      </div>
      <div class="form-group">
        <button type="button" class="btn btn-sm btn-block btn-primary" id="dtpLoadLast">Загрузить самый свежий</button>
        <button type="button" class="btn btn-sm btn-block btn-success" id="loadByLink">Загрузить по ссылке</button>
      </div>
      <div class="custom-control custom-checkbox">
        <input type="checkbox" class="custom-control-input" id="doNotSendToTechsCheckbox">
        <label class="custom-control-label">Не пересылать техникам</label>
      </div>
      <div class="custom-control custom-checkbox" id="addIncidentToReport">
        <input type="checkbox" class="custom-control-input" id="addToReport">
        <label class="custom-control-label">Добавить в отчёт</label>
      </div>
    </div>
    <div class="col-md-6">
      <div class="custom-controls-stacked" id="incidenttypes">
        ${partWithTypes}
      </div>
    </div>`

  $('#dtploader').html(html);


  // ============
  // = Generating incident handler
  // ============
  var html = '';
  structure.incident.field.name.forEach((name, index) => {
    let id = structure.incident.field.id[index];
    let idCheckbox = `${id}Checkbox`;
    let idText = `${id}Text`;
    let idLabel = `${id}Label`;
    html += `
      <div class="col-md-6">
        <div class="form-group">
          <div class="custom-control custom-checkbox" id='${id}'>
            <input type="checkbox" class="custom-control-input" checked id='${idCheckbox}'>
            <label class="custom-control-label" id='${idLabel}'>${name}</label>
          </div>
          <input class="form-control form-incident-enabled" type="text" disabled id='${idText}'>
        </div>
      </div>`
  })
  html += `
    <div class="col-md-6">
      <button type="button" class="btn btn-xs btn-block btn-outline-success" id="callingGIBDD">Вызывает</button>
      <button type="button" class="btn btn-xs btn-block btn-outline-danger" id="noPapers">Не оформлено</button>
    </div>`
  $('#dtpcontainer').html(html);

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

  html = '';

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
  
  // ============
  // = Enabling and Disabling Field in Report
  // ============
  $('#report').click(function () {
    if (event.target.id != '') {
      var index = structure.report.field.id.indexOf(event.target.id)
      var idText = `#${structure.report.field.id[index]}Text`;
    }
    if (index > -1) {
      if ($(idText).prop('disabled')) {
        $(idText).prop("disabled", false);
        if ($(idText)[0].value.length > 0) {
          if ($(idText)[0].value.indexOf('\n\n') > -1) {
            addClassInvalid($(idText)[0]);
          } else {
            if ($(partIDText)[0].value[0] !== '-') {
              addClassInvalid($(idText)[0]);
            } else {
              addClassValid($(idText)[0]);
            }
          }
        } else {
          addClassValid($(idText)[0]);
        }
      } else {
        $(idText).prop("disabled", true);
        if ($(idText)[0].className.indexOf('is-invalid') > -1) {
          $(idText).removeClass('is-invalid');
        }
        if ($(idText)[0].className.indexOf('is-valid') > -1) {
          $(idText).removeClass('is-valid');
        }
      }
    }
  })

  // ============
  // = Dynamic field validation
  // ============
  $('#report').keyup(function () {
    if (event.target.value.length > 0) {
      if (event.target.value.indexOf('\n\n') > -1) {
        addClassInvalid(event.target);
      } else {
        if (event.target.value[0] !== '-') {
          addClassInvalid(event.target);
        } else {
          addClassValid(event.target);
        }
      }
      setCookie(event.target.id, event.target.value)
    } else {
      addClassValid(event.target);
    }
  })

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


  // ============
  // = Report Copying
  // ============
  $('#copyreport').click(function () {
    var monthNames = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
    var today = new Date();
    var month = today.getMonth();
    var date = today.getDate();
    var hour = today.getHours();
    if (hour < 2 && date > 1)
      date--;
    var report = `#отчет ${date} ${monthNames[month]} ${$('#shiftfrom').children("option:selected").val()}-${$('#shiftto').children("option:selected").val()}`;
    structure.report.field.name.forEach((name, index) => {
      let idText = `#${structure.report.field.id[index]}Text`
      if ($(idText).prop('disabled')) {
        report += `\n\n**${name + ':'}** __отсутствует.__`
      } else {
        report += `\n\n**${name + ':'}**\n${$(idText)[0].value}`
      }
    })
    report += '\n\n**❤️ Хорошей смены:** хорошей смены :)'
    try {
      copyToClipboard(report);
      document.execCommand("copy");
      if ($('#shiftfrom').children("option:selected").val() == '0:00' && $('#shiftto').children("option:selected").val() == '1:00') {
        var target = '#popupReportErrorTime',
          popup = $(target);
        if (target !== undefined && popup.length) {
          if (popup.hasClass('show')) {
            popup.removeClass('show');
          } else {
            popupShow(popup);
          }
        }
      } else {
        var target = '#popupReportSuccess',
          popup = $(target);
        if (target !== undefined && popup.length) {
          if (popup.hasClass('show')) {
            popup.removeClass('show');
          } else {
            popupShow(popup);
          }
        }
      }
    } catch (err) {
      console.log(err);
      $('#generated-report')[0].value = report;
      var target = '#popupReportError',
        popup = $(target);
      if (target !== undefined && popup.length) {
        if (popup.hasClass('show')) {
          popup.removeClass('show');
        } else {
          popupShow(popup);
        }
      }
    }
  })

  $('#dtpLoadLast').click(function () {
    $('#incidenturl').attr("placeholder", ``)
    $('#incidentNameText').attr("placeholder", ``)
    $('#incidentPhoneText').attr("placeholder", ``)
    $('#incidentCarText').attr("placeholder", ``)
    $('#incidentTimeText').attr("placeholder", ``)
    $('#incidentAddressText').attr("placeholder", ``)
    $('#incidentCulpritText').attr("placeholder", ``)
    $('#incidentDamageText').attr("placeholder", ``)
    $('#incidentChronologyText').attr("placeholder", ``)
    $('#incidentPaperworkText').attr("placeholder", ``  )
    var token = $('#tokenField').val();
    socket.emit('loadLast', token);
  })

  $('#loadByLink').click(function () {
    $('#incidenturl').attr("placeholder", ``)
    $('#incidentNameText').attr("placeholder", ``)
    $('#incidentPhoneText').attr("placeholder", ``)
    $('#incidentCarText').attr("placeholder", ``)
    $('#incidentTimeText').attr("placeholder", ``)
    $('#incidentAddressText').attr("placeholder", ``)
    $('#incidentCulpritText').attr("placeholder", ``)
    $('#incidentDamageText').attr("placeholder", ``)
    $('#incidentChronologyText').attr("placeholder", ``)
    $('#incidentPaperworkText').attr("placeholder", ``  )
    var token = $('#tokenField').val();
    var key = $('#incidenturl').val().split('st.yandex-team.ru/')[1];
    socket.emit('loadByKey', token, key);
  })

  socket.on('dataTask', data => {
    switch (data) {
      case 'errorToken':
        var target = '#popupIncidentErrorToken',
          popup = $(target);
        if (target !== undefined && popup.length) {
          if (popup.hasClass('show')) {
            popup.removeClass('show');
          } else {
            popupShow(popup);
          }
        }
        break;
      case 'errorScope':
        var target = '#popupIncidentErrorScope',
          popup = $(target);
        if (target !== undefined && popup.length) {
          if (popup.hasClass('show')) {
            popup.removeClass('show');
          } else {
            popupShow(popup);
          }
        }
        break;
      case 'errorNotFound':
        var target = '#popupIncidentErrorNotFound',
          popup = $(target);
        if (target !== undefined && popup.length) {
          if (popup.hasClass('show')) {
            popup.removeClass('show');
          } else {
            popupShow(popup);
          }
        }
        break;
      case 'errorUndefined':
        var target = '#popupIncidentErrorUndefined',
          popup = $(target);
        if (target !== undefined && popup.length) {
          if (popup.hasClass('show')) {
            popup.removeClass('show');
          } else {
            popupShow(popup);
          }
        }
        break;
      case 'errorParsing':
        var target = '#popupIncidentErrorParsing',
          popup = $(target);
        if (target !== undefined && popup.length) {
          if (popup.hasClass('show')) {
            popup.removeClass('show');
          } else {
            popupShow(popup);
          }
        }
        break;
      default:
        incident = data;
        $('#incidenturl').attr("placeholder", `https://st.yandex-team.ru/${data.key}`)
        $('#incidentNameText').attr("placeholder", data.client.name)
        $('#incidentPhoneText').attr("placeholder", data.client.phone)
        $('#incidentCarText').attr("placeholder", `${data.car.number}, ${data.car.model}, VIN: ${data.car.vin}`)
        $('#incidentTimeText').attr("placeholder", data.incident.time)
        if (data.incident.location) {
          if (data.incident.location.length > 0) $('#incidentAddressText').attr("placeholder", data.incident.location)
          else {
            $('#incidentAddressText').attr("placeholder", data.car.location)
          }
        }
        else {
          $('#incidentAddressText').attr("placeholder", data.car.location)
        }
        $('#incidentCulpritText').attr("placeholder", data.incident.culprit)
        $('#incidentDamageText').attr("placeholder", data.incident.damages)
        if (data.incident.chronology)
          $('#incidentChronologyText').attr("placeholder", data.incident.chronology)
        else
          $('#incidentChronologyText').attr("placeholder", 'Отсутствует')

        if (typeof data.incident.gibdd !== 'undefined')
          $('#incidentPaperworkText').attr("placeholder", data.incident.gibdd)
        else
          $('#incidentPaperworkText').attr("placeholder", "Неизвестно")
        break;
    }
  });


  $('#callingGIBDD').click(function () {
    $('#incidentPaperworkText').attr("placeholder", 'Вызывает')
  })

  $('#noPapers').click(function () {
    $('#incidentPaperworkText').attr("placeholder", 'Не оформлено')
  })


  function enableFieldDTP(fieldName) {
    let idCheckbox = `#incident${fieldName}Checkbox`
    let idLabel = `#incident${fieldName}Label`
    let idText = `#incident${fieldName}Text`
    $(idCheckbox).prop("checked", true)
    $(idLabel).css("color", '#757575')
    if ($(idText)[0].className.indexOf('form-incident-disabled') > -1) {
      $(idText)[0].className = $(idText)[0].className.replace(' form-incident-disabled', '');
    }
    if ($(idText)[0].className.indexOf('form-incident-enabled') < 0) {
      $(idText)[0].className += ' form-incident-enabled'
    }
  }

  function enableFieldDTPWithoutCheckbox(fieldName) {
    let idLabel = `#incident${fieldName}Label`
    let idText = `#incident${fieldName}Text`
    $(idLabel).css("color", '#757575')
    if ($(idText)[0].className.indexOf('form-incident-disabled') > -1) {
      $(idText)[0].className = $(idText)[0].className.replace(' form-incident-disabled', '');
    }
    if ($(idText)[0].className.indexOf('form-incident-enabled') < 0) {
      $(idText)[0].className += ' form-incident-enabled'
    }
  }

  function disableFieldDTP(fieldName) {
    let idCheckbox = `#incident${fieldName}Checkbox`
    let idLabel = `#incident${fieldName}Label`
    let idText = `#incident${fieldName}Text`
    $(idCheckbox).prop("checked", false)
    $(idLabel).css("color", '#C0C0C0')
    if ($(idText)[0].className.indexOf('form-incident-enabled') > -1) {
      $(idText)[0].className = $(idText)[0].className.replace(' form-incident-enabled', '');
    }
    if ($(idText)[0].className.indexOf('form-incident-disabled') < 0) {
      $(idText)[0].className += ' form-incident-disabled'
    }
  }

  function disableFieldDTPWithoutCheckbox(fieldName) {
    let idLabel = `#incident${fieldName}Label`
    let idText = `#incident${fieldName}Text`
    $(idLabel).css("color", '#C0C0C0')
    if ($(idText)[0].className.indexOf('form-incident-enabled') > -1) {
      $(idText)[0].className = $(idText)[0].className.replace(' form-incident-enabled', '');
    }
    if ($(idText)[0].className.indexOf('form-incident-disabled') < 0) {
      $(idText)[0].className += ' form-incident-disabled'
    }
  }

  $('#dtpcontainer').click(function () {
    if (event.target.id.indexOf('Label') > 0) {
      var name = event.target.id.split('incident')[1].split('Label')[0];
      let idCheckbox = `#incident${name}Checkbox`
      if ($(idCheckbox).prop('checked'))
        disableFieldDTPWithoutCheckbox(name);
      else
        enableFieldDTPWithoutCheckbox(name);
    }
  })

  $('#incidenttypes').click(function () {
    var type = '';
    if (event.target.id != '') type = event.target.id.split('typeOfIncident')[1].split('Label')[0];

    if (type.length > 1) {
      switch (type) {
        case 'DTP':
          enableFieldDTP('Name');
          enableFieldDTP('Phone');
          enableFieldDTP('Car');
          enableFieldDTP('Time');
          enableFieldDTP('Address');
          enableFieldDTP('Culprit');
          enableFieldDTP('Damage');
          enableFieldDTP('Chronology');
          enableFieldDTP('Paperwork');
          break;
        case 'Incident':
          enableFieldDTP('Name');
          enableFieldDTP('Phone');
          enableFieldDTP('Car');
          enableFieldDTP('Time');
          enableFieldDTP('Address');
          enableFieldDTP('Culprit');
          enableFieldDTP('Damage');
          enableFieldDTP('Chronology');
          enableFieldDTP('Paperwork');
          break;
        case 'Drunk':
          enableFieldDTP('Name');
          enableFieldDTP('Phone');
          enableFieldDTP('Car');
          enableFieldDTP('Time');
          disableFieldDTP('Address');
          disableFieldDTP('Culprit');
          disableFieldDTP('Damage');
          enableFieldDTP('Chronology');
          disableFieldDTP('Paperwork');
          break;
        case 'Drunk':
          enableFieldDTP('Name');
          enableFieldDTP('Phone');
          enableFieldDTP('Car');
          enableFieldDTP('Time');
          disableFieldDTP('Address');
          disableFieldDTP('Culprit');
          disableFieldDTP('Damage');
          enableFieldDTP('Chronology');
          disableFieldDTP('Paperwork');
          break;
        case 'AccountTransfer':
          enableFieldDTP('Name');
          enableFieldDTP('Phone');
          enableFieldDTP('Car');
          enableFieldDTP('Time');
          disableFieldDTP('Address');
          disableFieldDTP('Culprit');
          disableFieldDTP('Damage');
          enableFieldDTP('Chronology');
          disableFieldDTP('Paperwork');
          break;
        case 'ControlTransfer':
          enableFieldDTP('Name');
          enableFieldDTP('Phone');
          enableFieldDTP('Car');
          enableFieldDTP('Time');
          disableFieldDTP('Address');
          disableFieldDTP('Culprit');
          disableFieldDTP('Damage');
          enableFieldDTP('Chronology');
          disableFieldDTP('Paperwork');
          break;
        case 'CarTheft':
          enableFieldDTP('Name');
          enableFieldDTP('Phone');
          enableFieldDTP('Car');
          enableFieldDTP('Time');
          enableFieldDTP('Address');
          enableFieldDTP('Culprit');
          enableFieldDTP('Damage');
          enableFieldDTP('Chronology');
          enableFieldDTP('Paperwork');
          break;
        case 'AccountTheft':
          enableFieldDTP('Name');
          enableFieldDTP('Phone');
          enableFieldDTP('Car');
          enableFieldDTP('Time');
          enableFieldDTP('Address');
          enableFieldDTP('Culprit');
          enableFieldDTP('Damage');
          enableFieldDTP('Chronology');
          enableFieldDTP('Paperwork');
          break;
        case 'Damages':
          disableFieldDTP('Name');
          disableFieldDTP('Phone');
          enableFieldDTP('Car');
          disableFieldDTP('Time');
          disableFieldDTP('Address');
          disableFieldDTP('Culprit');
          enableFieldDTP('Damage');
          enableFieldDTP('Chronology');
          disableFieldDTP('Paperwork');
          break;
      }
    }
  })

  $('#addIncidentToReport').click(function () {
    if ($('#copyincident')[0].className.indexOf('btn-primary') > -1) {
      $('#copyincident')[0].className = $('#copyincident')[0].className.replace('btn-primary', 'btn-info');
      $('#copyincident')[0].innerHTML = 'Скопировать и добавить в отчёт'
      return;
    }
    if ($('#copyincident')[0].className.indexOf('btn-info') > -1) {
      $('#copyincident')[0].className = $('#copyincident')[0].className.replace('btn-info', 'btn-primary');
      $('#copyincident')[0].innerHTML = 'Скопировать'
      return;
    }
  })

  $('#copyincident').click(function () {
    var incidentText = ``;
    var typesOfDTP = ['ДТП', 'Инцидент', 'Пьяный водитель', 'Повреждения', 'Передача аккаунта', 'Передача управления', 'Угон авто', 'Угон аккаунта и автомобиля']
    var typesOfDTPIdRadio = ['typeOfIncidentDTPRadio', 'typeOfIncidentIncidentRadio', 'typeOfIncidentDrunkRadio', 'typeOfIncidentDamagesRadio', 'typeOfIncidentAccountTransferRadio', 'typeOfIncidentControlTransferRadio', 'typeOfIncidentCarTheftRadio', 'typeOfIncidentAccountTheftRadio']
    typesOfDTPIdRadio.forEach((type, index) => {
      if ($(`#${type}`).prop('checked')) incidentText += typesOfDTP[index];
    })
    var namesOfPartsDTP = ['⏱ Время', '📍 Адрес', '🔪 Виноват', '⚙️ Повреждения', '🔮 Хронология', '🚨 Оформление'];
    var partsIDDTPCheckbox = ['incidentTimeCheckbox', 'incidentAddressCheckbox', 'incidentCulpritCheckbox', 'incidentDamageCheckbox', 'incidentChronologyCheckbox', 'incidentPaperworkCheckbox'];
    var partsIDDTPText = ['incidentTimeText', 'incidentAddressText', 'incidentCulpritText', 'incidentDamageText', 'incidentChronologyText', 'incidentPaperworkText'];
    if ($('#incidentCarCheckbox').prop('checked'))
      incidentText += ', ' + $('#incidentCarText').attr('placeholder');
    if ($('#incidentNameCheckbox').prop('checked'))
      incidentText += ', ' + $('#incidentNameText').attr('placeholder');
    if ($('#incidentPhoneCheckbox').prop('checked'))
      incidentText += ', ' + $('#incidentPhoneText').attr('placeholder');
    incidentText += '\n';
    partsIDDTPCheckbox.forEach((part, index) => {
      if (index == 5) {
        if ($(`#${part}`).prop('checked')) incidentText += `**${namesOfPartsDTP[index]}:** ${$(`#${partsIDDTPText[index]}`).attr('placeholder')}`
      } else
      if ($(`#${part}`).prop('checked')) incidentText += `**${namesOfPartsDTP[index]}:** ${$(`#${partsIDDTPText[index]}`).attr('placeholder')}\n`
    })
    var re = /undefined/gi
    incidentText = incidentText.replace(re, 'неизвестно');
    incidentText += `\n\nhttps://st.yandex-team.ru/${incident.key}`
    if ($('#doNotSendToTechsCheckbox').prop('checked')) incidentText += '\n\n```noforward```'

    if ($('#addToReport').prop('checked')) {
      var index = structure.report.field.name.indexOf('🚔 Тяжелые/значимые инциденты');
      var idText = `#${structure.report.field.id[index]}Text`;
      var idCheckbox = `#${structure.report.field.id[index]}Checkbox`;
      if ($(idText).prop('disabled')) {
        $(idCheckbox).prop('checked', true);
        $(idText).prop("disabled", false);
        var reportOld = $(idText)[0].value;

        if (reportOld.length > 0) {

          if (reportOld.indexOf(incident.key) < 0) {
            $(idText)[0].value += `${reportOld}\n- https://st.yandex-team.ru/${incident.key} - ${incident.car.number}, ${incident.car.model}`;
          }

          // validate
          if ($(idText)[0].value.indexOf('\n\n') > -1) {
            addClassInvalid($(idText)[0]);
          } else {
            if ($(idText)[0].value[0] !== '-') {
              addClassInvalid($(idText)[0]);
            } else {
              addClassValid($(idText)[0]);
            }
          }

        } else {
          $(idText)[0].value = `${reportOld}- https://st.yandex-team.ru/${incident.key} - ${incident.car.number}, ${incident.car.model}`;
          addClassValid($(idText)[0]);
        }
      } else {
        var reportOld = $(idText)[0].value;
        if (reportOld.indexOf(incident.key) < 0)
          $(idText)[0].value = `${reportOld}\n- https://st.yandex-team.ru/${incident.key} - ${incident.car.number}, ${incident.car.model}`;
      }
    }

    try {
      copyToClipboard(incidentText);
      var target = '#popupIncidentSuccess',
        popup = $(target);
      if (target !== undefined && popup.length) {
        if (popup.hasClass('show')) {
          popup.removeClass('show');
        } else {
          popupShow(popup);
        }
      }
    } catch (err) {
      console.log(err);
      $('#generated-incident')[0].value = incidentText;
      var target = '#popupIncidentError',
        popup = $(target);
      if (target !== undefined && popup.length) {
        if (popup.hasClass('show')) {
          popup.removeClass('show');
        } else {
          popupShow(popup);
        }
      }
    }
  })

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

  $('#repairreport').click(function () {
    structure.report.field.id.forEach((id, index) => {
      //setCookie(event.target.id, event.target.value)
      let text = getCookie(`${id}Text`);
      let idText = `#${id}Text`;
      let idCheckbox = `#${id}Checkbox`
      if (typeof text !== 'undefined') {
        $(idText)[0].value = text;
        $(idCheckbox).prop("checked", true)
        if ($(idText).prop('disabled')) {
          $(idText).prop("disabled", false);
          if ($(idText)[0].value.length > 0) {
            if ($(idText)[0].value.indexOf('\n\n') > -1) {
              addClassInvalid($(idText)[0]);
            } else {
              if ($(idText)[0].value[0] !== '-') {
                addClassInvalid($(idText)[0]);
              } else {
                addClassValid($(idText)[0]);
              }
            }
          } else {
            addClassValid($(idText)[0]);
          }
        } else {
          $(idText).prop("disabled", true);
          if ($(idText)[0].className.indexOf('is-invalid') > -1) {
            $(idText).removeClass('is-invalid');
          }
          if ($(idText)[0].className.indexOf('is-valid') > -1) {
            $(idText).removeClass('is-valid');
          }
        }
      }
    })
  })

  $('#saveToken').click(function () {
    setCookie('token', $('#tokenField').val())
  })
});
