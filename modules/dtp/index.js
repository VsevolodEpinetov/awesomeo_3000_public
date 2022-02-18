const date = require('../date/index.js');
const utility = require('../utility/index.js');
const SETTINGS = require('../settings.json')
const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')
const telegram = new Telegram(process.env.BOT_TOKEN)
const sendRequest = require('request-promise');
const RedisSession = require('telegraf-session-redis')
const YA_TOKEN = new Telegram(process.env.YA_TOKEN)

var async = require("async");


function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}


module.exports = {

  sendMenuMonths: function (ctx) {
    var availableMonths = [];
    var columns = 8;

    ctx.dtp.days.forEach((month, monthID) => {
      month.forEach(day => {
        if (day.active && typeof day.telegramUsername === 'undefined') if (availableMonths.indexOf(monthID) < 0) availableMonths.push(monthID)
      })
    })

    const menuAvailableMonths = Object.keys(availableMonths).map(key => Telegraf.Markup.callbackButton(SETTINGS.MonthNamesPlain[availableMonths[parseInt(key)]], 'actionDTPShowAvailableDays_' + availableMonths[parseInt(key)]))

    if (availableMonths.length > 8) {
      columns = availableMonths.length / 2;
    }

    ctx.replyWithHTML("Выбери интересующий месяц", Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menuAvailableMonths, {
      columns: columns
    })));
  },


  sendMenuDays: function (ctx) {
    var availableDays = [];
    var month = ctx.callbackQuery.data.split('_')[1];
    var columns = 8;

    ctx.dtp.days[month].forEach((day, dayID) => {
      if (day.active && typeof day.telegramUsername === 'undefined') availableDays.push(dayID)
    })

    const menuAvailableDays = Object.keys(availableDays).map(key => Telegraf.Markup.callbackButton(availableDays[parseInt(key)] + 1, 'actionDTPShowMenuForDay_' + month + '_' + availableDays[parseInt(key)]))

    ctx.replyWithHTML(`Выбран <b>${SETTINGS.MonthNamesPlain[month]}</b>. Выбери интересующий день`, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menuAvailableDays, {
      columns: 8
    })));
    ctx.deleteMessage();
  },


  sendMenuActions: function (ctx) {
    var month = ctx.callbackQuery.data.split('_')[1].split('_')[0];
    var day = ctx.callbackQuery.data.split('_')[2];
    const menuDTPActions = Telegraf.Extra
      .HTML()
      .markup((m) => m.inlineKeyboard([
        m.callbackButton('✅ Взять дату', 'actionDTPAssignUser_' + month + '_' + day),
        m.callbackButton('❌ Отмена', 'actionCancel'),
      ]))

    var columns = 8;
    ctx.replyWithHTML(`Выбрано <b>${parseInt(day) + 1} ${SETTINGS.MonthNames[month]}</b>. Выбери нужное действие`, menuDTPActions);
    ctx.deleteMessage();
  },

  assignUser: function (ctx) {
    var month = ctx.callbackQuery.data.split('_')[1].split('_')[0];
    var day = ctx.callbackQuery.data.split('_')[2];
    ctx.dtp.days[month][day].telegramUsername = ctx.update.callback_query.from.username;
    ctx.dtp.days[month][day].telegramID = ctx.update.callback_query.from.id;
    ctx.dtp.days[month][day].timestamp = ctx.update.callback_query.timestamp;

    var dayForLink = parseInt(day) + 1;
    if (dayForLink < 10) dayForLink = '0' + dayForLink;


    var monthForLink = parseInt(month) + 1;
    if (monthForLink < 10) monthForLink = '0' + monthForLink;

    var dayForLinkTo = parseInt(day) + 1;
    var monthForLinkTo = parseInt(month) + 2;
    if (dayForLinkTo < 10) dayForLinkTo = '0' + dayForLinkTo;
    if (monthForLinkTo < 10) monthForLinkTo = '0' + monthForLinkTo;

    var dayToShow = parseInt(day) + 1;
    var monthToShow = parseInt(month) + 1;
    if (dayToShow < 10) dayToShow = '0' + dayToShow;
    if (monthToShow < 10) monthToShow = '0' + monthToShow;

    var link = `https://st.yandex-team.ru/issues/?_f=type+priority+key+summary+description+status+resolution+updated+assignee+parent+created&_q=Queue%3A+%22Инциденты+в+сервисе+Яндекс.Драйв%22+Created%3A+%222019-${dayForLink}-${monthForLink}+00%3A00%3A00%22..%222019-${dayForLinkTo}-${monthForLinkTo}+00%3A00%3A00%22+Status%3A+Открыт`;
    ctx.replyWithHTML(`@${ctx.update.callback_query.from.username} успешно взял(а) в работу обработку тасков за <b>${dayToShow}.${monthToShow}</b>\n\n<a href="${link}">Ссылка на дату</a>`);
    ctx.deleteMessage();
  },


  sendAssignedDaysForUser: function (ctx) {
    var message = `Дни, взятые в работу ${ctx.message.from.username}\n\n`;
    var counter = 1;
    try {
      ctx.dtp.days.forEach((month, indexMonth) => {
        month.forEach((day, indexDay) => {
          if (typeof day.telegramUsername !== 'undefined')
            if (day.telegramUsername === ctx.message.from.username) {
              message += (`${counter}. ${indexDay + 1} ${SETTINGS.MonthNames[indexMonth]}\n`);
              counter++;
            }
        })
      })
      message += `\n<b>Итого дней: </b>${counter - 1}`;
      ctx.replyWithHTML(message);
    }
    catch (err) {
      ctx.replyWithHTML('Что-то пошло не так. Возможно, что сообщение слишком большое. @example_login, посмотри.')
      console.log (err)
    }

  },


  sendAssignedDaysForMonth: function (ctx) {
    var monthForMessage = parseInt(ctx.message.text.split('/month ')[1]);
    var month = monthForMessage - 1;
    if (monthForMessage < 10) monthForMessage = `0${monthForMessage}`;
    var message = `Взятые дни за <b>${SETTINGS.MonthNamesPlain[month]}</b>\n\n`;
    try {
      ctx.dtp.days[month].forEach((day, indexDay) => {
        if (typeof day.telegramUsername !== 'undefined') {
          var dayForMessage = indexDay + 1;
          if (dayForMessage < 10) dayForMessage = `0${dayForMessage}`;
          message += (`${dayForMessage}.${monthForMessage} — ${day.telegramUsername} \n`);
        }
      })
    }
    catch (err) {console.log (err)}

    ctx.replyWithHTML(message);
  },



  getTasksAndGive: async function (ctx) {
    if (!ctx.dtp) ctx.dtp = {};
    if (!ctx.dtp.tasks) ctx.dtp.tasks = {};
    if (!ctx.dtp.tasks.active) ctx.dtp.tasks.active = [];
    if (!ctx.dtp.tasks.given) ctx.dtp.tasks.given = [];

    if (!ctx.dtp.locked) {
      ctx.dtp.locked = true;
      ctx.dtp.lockedFor = ctx.message.from.username;
      ctx.dtp.lockedFrom = ctx.message.date;

      var messageID = ctx.message.message_id;
      var chatID = ctx.message.chat.id;

      ctx.replyWithHTML('<i>Ищу для тебя <b>открытые</b> таски <b>без резолюции</b>. Это может занять немного времени - подожди, пожалуйста</i>', Telegraf.Extra.inReplyTo(messageID))

      // SETTINGS
      var amountToGive = 10;
      var last = 300;
      var token = 'AQAD-qJSJzSJAAARKUJRt-ukcUEKm1iIklbabfc';


      var amountToLoad;
      var telegramUsername = ctx.message.from.username;

      var sessionInstance = new RedisSession()
      var localDTP;

      await sessionInstance.getSession('dtp').then(session => {
        localDTP = session;
      });

      const headers = {
          'Authorization': `OAuth ${token}`
      };

      var options = {
          url: 'https://yandex_service_url/api?filter=queue:DRIVESECURITY&order=-key&perPage=1',
          headers: headers
      };

      await sendRequest(options)

        // Get Last task and compare keys to determine how much
        // tasks was created from last time we checked
        .then(async (body) => {
          try {
            data = JSON.parse(body);
            if (data[0]) data = data[0];

            var key = parseInt(data.key.split('DRIVESECURITY-')[1]);

            amountToLoad = key - localDTP.tasks.last;
            localDTP.tasks.last = key;
          }
        catch (error) {
          console.log(error)
        }
      })

      // Load all new tasks and check if it is elligable for us
      .then (async () => {

        if (amountToLoad === 0) amountToLoad = 1;
        // use amount to load determined previously
        var options = {
            url: `https://yandex_service_url/api?filter=queue:DRIVESECURITY&order=-key&perPage=${amountToLoad}`,
            headers: headers
        };

        // loading
        sendRequest(options)

          // Check loaded tasks and add them if necessary
          .then(async function (body) {
            try {
              tasks = JSON.parse(body);

              var counter = 0;

              // reverse cause we use tasks' keys in another order
              tasks.slice().reverse().forEach(async (task, index) => {
                var key = task.key.split('DRIVESECURITY-')[1];

                var status = task.status.key;
                var resolution;
                if (data.resolution) resolution = task.resolution.key;

                if (status === 'open' && !resolution) {
                  if (localDTP.tasks.active.indexOf(key) < 0 && localDTP.tasks.given.indexOf(key) < 0) localDTP.tasks.active.push(key);
                  counter++;
                }
              });

              console.log(`Added ${counter} new tasks`);
            }
          catch (error) {
            console.log(error)
          }
        })

        // Assign tasks
        .then (async () => {
          var counter = 0;
          var message = `Таски для <b>@${telegramUsername}</b> от <b>${date.getCurrent().string.DDMMhhmm}</b>:\n\n`;

          async.whilst(
            function test(cb) { cb(null, counter < amountToGive) },
            function iter(callback) {
              if (localDTP.tasks.active[0]) {
                var key = localDTP.tasks.active[0];
                var options = {
                    url: `https://yandex_service_url/api/DRIVESECURITY-${key}`,
                    headers: headers
                };
                sendRequest(options)
                  .then(async (body) => {
                    var task = JSON.parse(body);
                    if (task[0]) task = task[0];

                    var status = task.status.key;
                    var resolution;
                    if (task.resolution) resolution = task.resolution.key;

                    /*console.log('------')
                    console.log(`Counter: ${counter}`)
                    console.log(`Key: DRIVESECURITY-${key}`)
                    console.log(`Status: ${status}`)
                    console.log(`Resolution: ${resolution}`)*/

                    if (status === 'open' && !resolution) {
                      localDTP.tasks.given.push(key);
                      message += `${counter + 1}. https://st.yandex-team.ru/DRIVESECURITY-${key}\n`
                      counter++;
                    }
                    localDTP.tasks.active.splice(0, 1)
                    callback(null, counter);
                  })
                .catch(async (error) => {
                  /*console.log('------')
                  console.log(`Counter: ${counter}`)
                  console.log(`Key: DRIVESECURITY-${key}`)
                  console.log(`Status: Error getting the task, probably forbidden`)*/
                  localDTP.tasks.active.splice(0, 1)
                  callback(null, counter);
                })
              } else {
                if (counter > 0) {
                  message += `\n<i>Тебе было выдано менее 10 тасков, так как их в принципе осталось менее 10</i>`
                  counter = 10;
                  callback(null, counter);
                } else {
                  message = `Открытых тасков для разбора нет! 🥳`
                  counter = 10;
                  callback(null, counter);
                }
              }
            },
            function (err, n) {
              localDTP.locked = false;
              sessionInstance.saveSession('dtp', localDTP);
              telegram.sendMessage(chatID, message, Telegraf.Extra.inReplyTo(messageID).HTML());
            }
          );
        })
      })
    } else {
      ctx.replyWithHTML(`Бот занят поиском тасков для ${ctx.dtp.lockedFor}, попробуй вновь попозже`, Telegraf.Extra.inReplyTo(messageID).HTML())
    }
  },


  unlockCommand: async function (telegram) {
    var sessionInstance = new RedisSession()

    var localDTP;
    await sessionInstance.getSession('dtp').then(session => {
      localDTP = session;
    });

    if ((date.getCurrent().timestamp > (localDTP.lockedFrom + 240)) && localDTP.locked) {
      localDTP.locked = false;
      telegram.sendMessage(SETTINGS.chats.dtp.id, `Бота вновь можно просить выдать таски`);
      sessionInstance.saveSession('dtp', localDTP);
    }
  }
}
