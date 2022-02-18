'use strict';

$(async function () {

  // ============
  // = Variables
  // ============
  var SETTINGS = {};
  
  await $.getJSON("./assets/js/duty/settings.json", (json) => {
    SETTINGS = json;
  });

  
  // ============
  // = Generating part with report
  // ============
  var html = '';
  SETTINGS.report.forEach((field, index) => {
    if (field.web.showField) {
      let id = field.name;
      let idCheckbox = `${id}Checkbox`;
      let idText = `${id}Text`;
      var placeholder = '';
      if (field.web.placeholder) {
        placeholder = field.web.placeholder;
      } else {
        placeholder = field.header.split(':')[0];
      }
      
      html += `
      <div class="col-md-6">
        <div class="custom-control custom-checkbox" id="${id}">
          <input type="checkbox" class="custom-control-input" id="${idCheckbox}">
          <label class="custom-control-label" id="${id}">
            <h5 id="${id}">${field.header.split(':')[0]}</h5>
          </label>
        </div>
        <div class="form-group">
          <textarea class="form-control" placeholder="${placeholder}" rows="5" disabled id="${idText}"></textarea>
          <div class="invalid-feedback">В этом пункте явно что-то не так 🤔</div>
        </div>
      </div>`
    }
  })
  $('#report').html(html);

  // ============
  // = Enabling and Disabling Field in Report
  // ============
  $('#report').click(function () {
    if (event.target.id != '') {
      var index = -1;
      SETTINGS.report.forEach((field, id) => {
        if (event.target.id === field.name) index = id;
      })
      var idText = `#${SETTINGS.report[index].name}Text`;
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
    
    var header = ''
    SETTINGS.report.forEach(field => {
      if (field.name === 'header') header = field.header;
    })
    
    var report = `${header} ${date} ${monthNames[month]} ${$('#shiftfrom').children("option:selected").val()}-${$('#shiftto').children("option:selected").val()}`;
    SETTINGS.report.forEach((field, index) => {
      if (field.web.showField) {
        let idText = `#${field.name}Text`
        if ($(idText).prop('disabled')) {
          report += `\n\n**${field.header}** __отсутствует.__`
        } else {
          report += `\n\n**${field.header}**\n${$(idText)[0].value}`
        }
      }
    })
    
    var footer = ''
    SETTINGS.report.forEach(field => {
      if (field.name === 'wishes') footer = field.header;
    })
    
    report += `\n\n**${footer}** хорошей смены :)`;
    
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


  $('#repairreport').click(function () {
    SETTINGS.report.forEach((field, index) => {
      if (field.web.showField) {
        let text = getCookie(`${field.name}Text`);
        let idText = `#${field.name}Text`;
        let idCheckbox = `#${field.name}Checkbox`
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
      }
    })
  })

});
