const Settings = require('../settings.json')
var moment = require('moment');

module.exports = {
  getByTimestamp: function (timestamp) {
    var dt = new Date(timestamp * 1000);
    var UTC = dt.getTime() + (dt.getTimezoneOffset() * 60000);
    var MSK = new Date(UTC + (3600000 * 3));
    var minutes = MSK.getMinutes();
    if (minutes > -1 && minutes < 10) minutes = '0' + minutes;
    var month = MSK.getMonth() + 1;
    if (month > -1 && month < 10) month = '0' + month;
    var hour = MSK.getHours();
    if (hour > -1 && hour < 10) hour = '0' + hour;
    //return [MSK.getMonth(), MSK.getDate(), MSK.getHours(), minutes, stringVariant, stringVariantWithYear, stringVariantBirthday];
    return {
      minute: MSK.getMinutes(),
      minuteWithZero: minutes,
      hour: MSK.getHours(),
      dayOfWeek: MSK.getDay(),
      dayOfMonth: MSK.getDate(),
      month: MSK.getMonth(),
      string: {
        DDMMhhmm: `${MSK.getDate()} ${Settings.MonthNames[MSK.getMonth()]} ${MSK.getHours()}:${minutes}`,
        DDMMhhmmYYYY: `${MSK.getDate()} ${Settings.MonthNames[MSK.getMonth()]} ${MSK.getHours()}:${minutes} ${MSK.getFullYear()} г.`,
        birthday: `${MSK.getDate()} ${Settings.MonthNames[MSK.getMonth()]}`,
        date: `${MSK.getDate()} ${Settings.MonthNames[MSK.getMonth()]}`,
        dateAsMoment: `${MSK.getFullYear()}-${month}-${MSK.getDate()}`,
        dateAsMomentWithHour: `${MSK.getFullYear()}-${month}-${MSK.getDate()} ${hour}:${minutes}`,
        testDeadline: `${MSK.getDate()} ${Settings.MonthNames[MSK.getMonth()]} ${MSK.getFullYear()} г.`
      }
    }
  },

  getCurrent: function () {
    var dt = new Date();
    var UTC = dt.getTime() + (dt.getTimezoneOffset() * 60000);
    var MSK = new Date(UTC + (3600000 * 3));
    var timestamp = dt.getTime() / 1000;
    var minutes = MSK.getMinutes();
    var hours = MSK.getHours();
    var seconds = MSK.getSeconds();
    if (minutes > -1 && minutes < 10) minutes = '0' + minutes;
    if (hours > -1 && hours < 10) hours = '0' + hours;
    if (seconds > -1 && seconds < 10) seconds = '0' + seconds;
    var stringVariant = MSK.getDate() + ' ' + Settings.MonthNames[MSK.getMonth()] + ' ' + MSK.getHours() + ':' + minutes;
    var stringVariantWithYear = stringVariant + ' ' + MSK.getFullYear() + ' г.';
    var stringForLog = `${hours}:${minutes}:${seconds}`;
    var anotherString = MSK.getDate() + ' ' + Settings.MonthNames[MSK.getMonth()];
    //return [MSK.getMonth(), MSK.getDate(), MSK.getHours(), Minutes, stringVariant, stringVariantWithYear, MSK.getDay(), MSK.getMinutes()];
    return {
      minute: MSK.getMinutes(),
      minuteWithZero: minutes,
      hour: MSK.getHours(),
      dayOfWeek: MSK.getDay(),
      dayOfMonth: MSK.getDate(),
      month: MSK.getMonth(),
      timestamp: timestamp,
      string: {
        DDMMhhmm: stringVariant,
        DDMMhhmmYYYY: stringVariantWithYear,
        hhmmss: stringForLog,
        date: anotherString
      }
    }
  },


  convertStringToTimestamp: function (string) {
    if (moment(string).isValid()) {
      return moment(string).unix() - 10800;
    } else {
      return -1;
    }
  },
}
