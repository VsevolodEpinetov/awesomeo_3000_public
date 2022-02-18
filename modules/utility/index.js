const date = require('../date/index.js');
const Settings = require('../settings.json')


function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

module.exports = {


  hideMenu: function (ctx) {
    try {
      ctx.editMessageReplyMarkup({
        reply_markup: {}
      });
    }
    catch (err) {}
  },


  sleep: function (ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  },

  log: function (ctx) {
    let message = `\x1b[34m[INFO]\x1b[0m \x1b[36m${date.getCurrent().string.hhmmss}\x1b[0m `
    if (typeof ctx.update.callback_query === 'undefined') {
      if (typeof ctx.message.text !== 'undefined') {
        if (ctx.message.text[0] === '/') {
          message += `@${ctx.message.from.username} has issued command \x1b[32m'/${ctx.message.text.split('/')[1]}'\x1b[0m `
          if (ctx.message.chat.type == 'private') {
            message += `in private chat`
          } else {
            message += `in chat named '${ctx.message.chat.title}' \x1b[37m(id ${ctx.message.chat.id})\x1b[0m`
          }
        }
      }
    } else {
      message += `@${ctx.update.callback_query.from.username} has called an action \x1b[32m'${ctx.callbackQuery.data}'\x1b[0m `
      if (ctx.update.callback_query.message.chat.type == 'private') {
        message += `in private chat`
      } else {
        message += `in chat named '${ctx.update.callback_query.message.chat.title}' \x1b[37m(id ${ctx.update.callback_query.message.chat.id})\x1b[0m`
      }
    }
    console.log(message);
  },

  logError: function (ctx, error) {
    let message = `\x1b[31m================\x1b[0m\n\x1b[31m[ERROR]\x1b[0m \x1b[36m${date.getCurrent().string.hhmmss}\x1b[0m `
    if (!ctx.update.callback_query) {
      if (ctx.message.text) {
        if (ctx.message.text[0] === '/') {
          message += `@${ctx.message.from.username} \x1b[31mhas issued command\x1b[0m \x1b[32m'/${ctx.message.text.split('/')[1]}'\x1b[0m `
          if (ctx.message.chat.type == 'private') {
            message += `\x1b[31min private chat\x1b[0m`
          } else {
            message += `\x1b[31min chat named\x1b[0m '${ctx.message.chat.title}' \x1b[37m(id ${ctx.message.chat.id})\x1b[0m`
          }
        }
      }
    } else {
      message += `@${ctx.update.callback_query.from.username} \x1b[31mhas called an action\x1b[0m \x1b[32m'${ctx.callbackQuery.data}'\x1b[0m `
      if (ctx.update.callback_query.message.chat.type == 'private') {
        message += `\x1b[31min private chat\x1b[0m`
      } else {
        message += `\x1b[31min chat named\x1b[0m '${ctx.update.callback_query.message.chat.title}' \x1b[37m(id ${ctx.update.callback_query.message.chat.id})\x1b[0m`
      }
    }
    message += ` \x1b[31mand got the error:\x1b[0m\n\x1b[31m${error}\x1b[0m\n\x1b[31m================\x1b[0m`
    console.log(message);
  },


  getWeekRangeForDutySchedule: function () {
    var startMonthNumber = date.getCurrent().month + 1;
    var endMonthNumber = startMonthNumber;
    var startOfWeekDayNumber = date.getCurrent().dayOfMonth - (date.getCurrent().dayOfWeek - 1);
    var endOfWeekDayNumber = startOfWeekDayNumber + 6;
    if (endOfWeekDayNumber > Settings.DaysInMonth[date.getCurrent().month]) {
      endMonthNumber = endMonthNumber + 1;
      endOfWeekDayNumber = endOfWeekDayNumber - Settings.DaysInMonth[date.getCurrent().month];
    }
    var weekRange = `${startOfWeekDayNumber}.${startMonthNumber}-${endOfWeekDayNumber}.${endMonthNumber}`;
    return weekRange;
  },


  getWeekRangeForC2dSchedule: function () {
    var startMonthNumber = date.getCurrent().month + 1;
    var endMonthNumber = startMonthNumber;
    var startOfWeekDayNumber = date.getCurrent().dayOfMonth - (date.getCurrent().dayOfWeek - 1);
    var endOfWeekDayNumber = startOfWeekDayNumber + 6;
    if (endOfWeekDayNumber > Settings.DaysInMonth[date.getCurrent().month]) {
      endMonthNumber = endMonthNumber + 1;
      endOfWeekDayNumber = endOfWeekDayNumber - Settings.DaysInMonth[date.getCurrent().month];
    }
    if (startMonthNumber < 10)
      startMonthNumber = '0' + startMonthNumber;
    if (endMonthNumber < 10)
      endMonthNumber = '0' + endMonthNumber;

    var weekRange = `${startOfWeekDayNumber}.${startMonthNumber}-${endOfWeekDayNumber}.${endMonthNumber}`;
    return weekRange;
  },


  getRandomInt: function (min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },


  splitMessageAndReply: async function (ctx, message, menu) {
    if (message.length < Settings.TelegramCharactersLimit) {
      ctx.replyWithHTML(message);
    } else {
      var amountOfMessagesNeeded = ((message.length - (message.length % Settings.TelegramCharactersLimit)) / Settings.TelegramCharactersLimit) + 1;
      ctx.reply('Сообщение получилось слишком большое, разбито на ' + amountOfMessagesNeeded + ' части.');
      await sleep(500)
      for (var i = 0; i < amountOfMessagesNeeded; i++) {
        if (typeof menu !== 'undefined') {
          if (i === amountOfMessagesNeeded - 1) {
            ctx.replyWithHTML(message.substring(0, Settings.TelegramCharactersLimit), menu);
          } else {
            ctx.replyWithHTML(message.substring(0, Settings.TelegramCharactersLimit));
            await sleep(1000)
            message = message.substring(Settings.TelegramCharactersLimit, message.length);
          }
        } else {
          ctx.replyWithHTML(message.substring(0, Settings.TelegramCharactersLimit));
          await sleep(1000)
          message = message.substring(Settings.TelegramCharactersLimit, message.length);
        }
      }
    }
  },


  getCommandParameter: function (ctx) {
    return option = ctx.message.text.split(/ +/)[1];
  }
}
