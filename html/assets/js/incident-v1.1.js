'use strict';

$(function () {
  
  // ============
  // = Variables
  // ============
  var structure = {};

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
    'Оформление',
    'Комментарий'
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
    'incidentPaperwork',
    'incidentComment'
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
  // = Send request for incident
  // ============

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
    $('#incidentCommentText').attr("placeholder", ``  )
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
    $('#incidentCommentText').attr("placeholder", ``  )
    var token = $('#tokenField').val();
    var key = $('#incidenturl').val().split('st.yandex-team.ru/')[1];
    socket.emit('loadByKey', token, key);
  })
  
  // ============
  // = Incident Loader
  // ============

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
        
        $('#incidentCommentText').attr("placeholder", data.incident.comment)
    }
  });

  
  // ============
  // = Fields handlers
  // ============
  
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
  
  // ============
  // = Incident types handler
  // ============

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
          enableFieldDTP('Comment');
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
          enableFieldDTP('Comment');
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
          enableFieldDTP('Comment');
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
          enableFieldDTP('Comment');
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
          enableFieldDTP('Comment');
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
          enableFieldDTP('Comment');
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
          enableFieldDTP('Comment');
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
          enableFieldDTP('Comment');
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
          enableFieldDTP('Comment');
          break;
      }
    }
  })
  
  // ============
  // = Chechkbox 'add to the report' handler
  // ============

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
  

  // ============
  // = Copy incident
  // ============
  
  $('#copyincident').click(function () {
    var incidentText = ``;
    var typesOfDTP = ['ДТП', 'Инцидент', 'Пьяный водитель', 'Повреждения', 'Передача аккаунта', 'Передача управления', 'Угон авто', 'Угон аккаунта и автомобиля']
    var typesOfDTPIdRadio = ['typeOfIncidentDTPRadio', 'typeOfIncidentIncidentRadio', 'typeOfIncidentDrunkRadio', 'typeOfIncidentDamagesRadio', 'typeOfIncidentAccountTransferRadio', 'typeOfIncidentControlTransferRadio', 'typeOfIncidentCarTheftRadio', 'typeOfIncidentAccountTheftRadio']
    typesOfDTPIdRadio.forEach((type, index) => {
      if ($(`#${type}`).prop('checked')) incidentText += typesOfDTP[index];
    })
    var namesOfPartsDTP = ['⏱ Время', '📍 Адрес', '🔪 Виноват', '⚙️ Повреждения', '🔮 Хронология', '🚨 Оформление', '🤫 Комментарий'];
    var partsIDDTPCheckbox = ['incidentTimeCheckbox', 'incidentAddressCheckbox', 'incidentCulpritCheckbox', 'incidentDamageCheckbox', 'incidentChronologyCheckbox', 'incidentPaperworkCheckbox', 'incidentCommentCheckbox'];
    var partsIDDTPText = ['incidentTimeText', 'incidentAddressText', 'incidentCulpritText', 'incidentDamageText', 'incidentChronologyText', 'incidentPaperworkText', 'incidentCommentCheckbox'];
    
    if ($('#incidentCarCheckbox').prop('checked'))
      incidentText += ', ' + $('#incidentCarText').attr('placeholder');
    if ($('#incidentNameCheckbox').prop('checked'))
      incidentText += ', ' + $('#incidentNameText').attr('placeholder');
    if ($('#incidentPhoneCheckbox').prop('checked'))
      incidentText += ', ' + $('#incidentPhoneText').attr('placeholder');
    incidentText += '\n';
    
    partsIDDTPCheckbox.forEach((part, index) => {
      if (index == 6) {
        if ($(`#${part}`).prop('checked')) incidentText += `**${namesOfPartsDTP[index]}:** ${$(`#${partsIDDTPText[index]}`).attr('placeholder')}`
      } else
      if ($(`#${part}`).prop('checked')) incidentText += `**${namesOfPartsDTP[index]}:** ${$(`#${partsIDDTPText[index]}`).attr('placeholder')}\n`
    })
    var re = /undefined/gi
    incidentText = incidentText.replace(re, ' ');
    incidentText += `\n\nhttps://st.yandex-team.ru/${incident.key}`
    if ($('#doNotSendToTechsCheckbox').prop('checked')) incidentText += '\n\n```noforward```'

    try {
      if ($('#addToReport').prop('checked')) {
        var idText = `#incidentsText`;
        var idCheckbox = `#incidentsCheckbox`;
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
    } catch (err) {
      console.log('У тебя же нет поля с инцидентами 🤔');
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

});
