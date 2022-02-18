const date = require('../date/index.js');
const utility = require('../utility/index.js');
const userActions = require('../users/index.js');
const SETTINGS = require('../settings.json')
const Telegraf = require('telegraf')
const RedisSession = require('telegraf-session-redis')



function standtardNotificationsPresence (ctx) {
  var standartNotifications = [ctx.session.test.timestampDue - 223200, ctx.session.test.timestampDue - 180000, ctx.session.test.timestampDue - 136800, ctx.session.test.timestampDue - 93600, ctx.session.test.timestampDue - 50400, ctx.session.test.timestampDue - 7200];
  var count = 0;
  standartNotifications.forEach((stN, i) => {
    ctx.session.test.notifications.forEach(notification => {
      if (notification.timestamp === stN) count++;
    })
  })
  return count;
}


module.exports = {

  LoadAndParseSchedule: async function (ctx, arrayToWriteSchedule, SpreadsheetID, weekRange, lastLetter) {
    const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
    const TOKEN_PATH = 'token.json';

    await fs.readFile('credentials.json', async (err, content) => {
      if (err) return console.log('Error loading client secret file:', err);
      authorize(JSON.parse(content), getSchedule);
    });

    await utility.sleep(5000);

    function authorize(credentials, callback) {
      const {
        client_secret,
        client_id,
        redirect_uris
      } = credentials.installed;
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
      fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
      });
    }

    function getNewToken(oAuth2Client, callback) {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });
      console.log('Authorize this app by visiting this url:', authUrl);
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
          if (err) return console.error('Error while trying to retrieve access token', err);
          oAuth2Client.setCredentials(token);
          // Store the token to disk for later program executions
          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) return console.error(err);
            console.log('Token stored to', TOKEN_PATH);
          });
          callback(oAuth2Client);
        });
      });
    }

    function getSchedule(auth) {
      const sheets = google.sheets({
        version: 'v4',
        auth
      });
      return sheets.spreadsheets.values.get({
        spreadsheetId: SpreadsheetID,
        range: weekRange + '!C1:' + lastLetter + '170',
      }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values;
        if (rows.length) {
          var amountOfDuty = rows[0].length;
          arrayWithSchedule = [];

          for (var dutyNumber = 0; dutyNumber < amountOfDuty; dutyNumber++) {
            arrayWithSchedule[dutyNumber] = [];
            arrayWithSchedule[dutyNumber][0] = rows[0][dutyNumber];

            //Fill all the days of weeks with 0's
            for (var dayOfWeek = 1; dayOfWeek < 8; dayOfWeek++) {
              arrayWithSchedule[dutyNumber][dayOfWeek] = [];
              for (var hour = 0; hour < 24; hour++) {
                arrayWithSchedule[dutyNumber][dayOfWeek][hour] = 0;
              }
            }

            //Parse data and fill the arrays
            var startHour = 1;
            var endHour = 25;
            var shift = 1;

            for (var dayOfWeek = 1; dayOfWeek < 8; dayOfWeek++) {
              arrayWithSchedule[dutyNumber][dayOfWeek] = [];
              for (var hour = startHour; hour < endHour; hour++) {
                if (typeof rows[hour][dutyNumber] != "undefined") {
                  if (rows[hour][dutyNumber].length > 0) arrayWithSchedule[dutyNumber][dayOfWeek][hour - shift] = 1;
                }
              }
              startHour = startHour + 24;
              endHour = endHour + 24;
              shift = shift + 24;
            }
          }
          var result = 'Загружено расписание на <b>' + amountOfDuty + '</b> людей.\n\n<b>Период:</b> ' + weekRange + '\n<b>ID таблицы:</b> ' + SpreadsheetID;
          /*for (var i = 0; i < amountOfDuty; i++) {
            Result += arrayWithSchedule[i][0] + '\n';
          }*/
          if (SpreadsheetID === '1W8lNNcsb1ViA3UVX6nXXNoeM_np7M2KDsk0fnApNsi8') result += ' <i>(Duty)</i>'
          if (SpreadsheetID === '1IYkehZ8P5Ok9H-IHODHpJm5reysSd9YIsuqYvdHNll4') result += ' <i>(Chat2Desk)</i>'
          //ctx.telegram.sendMessage(SETTINGS.chats.test.id, Result, Telegraf.Extra.HTML());
          eval(arrayToWriteSchedule + ' = arrayWithSchedule');
        } else {
          //console.log('No data found.');
        }
      });
    }
  },



  flipCoin: function (ctx) {
    var stringBefore = '/flip '
    var amountOfFlips = ctx.message.text.substring(stringBefore.length, ctx.message.text.length);
    var stickerId0 = "CAADAgADRgADch9zBUmr755SWr_5Ag";
    var stickerId1 = "CAADAgADRwADch9zBZFa5OiS90rIAg";
    if (amountOfFlips.length === 0) {
      result = Math.floor(Math.random() * 2);
      if (result === 0) {
        ctx.telegram.sendSticker(ctx.message.chat.id, stickerId0);
      } else {
        ctx.telegram.sendSticker(ctx.message.chat.id, stickerId1);
      }
    } else {
      if (isNaN(parseInt(amountOfFlips)) === false) {
        amountOfFlips = parseInt(amountOfFlips);
        if (amountOfFlips >= 105062) amountOfFlips = 105062;
        var amountOf0 = 0;
        var amountOf1 = 0;
        for (var currentFlip = 0; currentFlip < amountOfFlips; currentFlip++) {
          result = Math.floor(Math.random() * 2);
          if (result === 0) {
            amountOf0++;
          } else {
            amountOf1++;
          }
        }
        var winner;
        if (amountOf0 > amountOf1) {
          winner = 0;
        }
        if (amountOf0 < amountOf1) {
          winner = 1;
        }
        if (amountOf0 === amountOf1) {
          winner = -1;
        }

        message = 'Результат: <b>';
        if (winner === 0) {
          message += 'Решка!</b>'
        }
        if (winner === 1) {
          message += 'Орёл!</b>'
        }
        if (winner === -1) {
          message += 'Ничья!</b>'
        }
        message += '\n\n<i>Статистика:</i>\n<b>Решка</b> — ' + amountOf0 + '\n<b>Орёл</b> — ' + amountOf1;
        ctx.replyWithHTML(message);

        if (winner === 0) {
          ctx.telegram.sendSticker(ctx.message.chat.id, stickerId0);
        }
        if (winner === 1) {
          ctx.telegram.sendSticker(ctx.message.chat.id, stickerId1);
        }
      } else {
        var factor = amountOfFlips.length * 314;
        var seed = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < 14; i++) {
          seed += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        result = Math.floor(Math.random() * factor);
        message = 'Результат: <b>';
        if ((result % 2) === 0) {
          message += 'Решка!</b>'
          ctx.telegram.sendSticker(ctx.message.chat.id, stickerId0);
        } else {
          message += 'Орёл!</b>'
          ctx.telegram.sendSticker(ctx.message.chat.id, stickerId1);
        }
        message += '\n\n<b>Чать сгенерированного ядра:</b> ' + seed + '...';
        ctx.replyWithHTML(message);
      }
    }
  },



  mentionUsersBasedOnChat: async function (ctx) {
    var textPart = "<b>Друзья! Пожалуйста, обратите внимание на сообщение выше️ ☝</b>"
    var listOfPeopleToMention = [];
    var role;

    switch (ctx.message.chat.id) {
      case SETTINGS.chats.internalSupport.id:
        role = 'support';
        break;
      case SETTINGS.chats.duty.id:
        role = 'duty';
        break;
      case SETTINGS.chats.chatsOrganisation.id:
        role = 'chats';
        break;
      case SETTINGS.chats.chats.id:
        role = 'chats';
        break;
      case SETTINGS.chats.seniorOperators.id:
        role = 'seniorOperator';
        break;
    }

    if (role) {
      ctx.users.all.forEach((user, id) => {
        if (user.roles[role]) if (user.info.telegramUsername.length > 0) if (id > 0) listOfPeopleToMention.push(user.info.telegramUsername)
      })

      if (listOfPeopleToMention.length > 0) {
        var amountOfPersonsPerMessage = 8;
        var amountOfMessagesNeeded;
        amountOfMessagesNeeded = ((listOfPeopleToMention.length - (listOfPeopleToMention.length % amountOfPersonsPerMessage)) / amountOfPersonsPerMessage) + 1;

        ctx.replyWithHTML(textPart);
        await utility.sleep(1000);
        for (var i = 0; i < amountOfMessagesNeeded; i++) {
          var mentions = ' ';
          for (var n = 0; n < amountOfPersonsPerMessage; n++) {
            if (typeof listOfPeopleToMention[n + i * amountOfPersonsPerMessage] !== "undefined") mentions += '@' + listOfPeopleToMention[n + i * amountOfPersonsPerMessage] + ' ';
          }
          ctx.replyWithHTML(mentions);
          await utility.sleep(1000);
        }
        ctx.replyWithHTML(textPart);
      } else {
        ctx.replyWithHTML('Некого призывать, милорд')
      }
    }
  },


  deletePersonalInformationAndForward: function (ctx) {
    var incidentText = ctx.message.text;
    var wherePartOfIncidentStarts = [];
    var partsOfIncident = [];
    // 8 parts:
    // wherePartOfIncidentStarts[0] - header
    // wherePartOfIncidentStarts[1] - time
    // wherePartOfIncidentStarts[2] - address
    // wherePartOfIncidentStarts[3] - culprit
    // wherePartOfIncidentStarts[4] - damages
    // wherePartOfIncidentStarts[5] - chronology
    // wherePartOfIncidentStarts[6] - registration
    // wherePartOfIncidentStarts[7] - task number
    wherePartOfIncidentStarts[0] = 0;
    partsOfIncident[0] = 0;
    for (var partNumber = 1; partNumber < SETTINGS.incidentPartsNames.length; partNumber++) {
      wherePartOfIncidentStarts[partNumber] = incidentText.indexOf(SETTINGS.incidentPartsNames[partNumber])
      if (wherePartOfIncidentStarts[partNumber] > -1) {
        partsOfIncident.push(partNumber);
      }
    }

    var generatedIncidentText = "";
    var textOfParts = [];
    for (var partNumber = 0; partNumber < partsOfIncident.length; partNumber++) {
      if (partNumber === (partsOfIncident.length - 1)) {
        //generatedIncidentText += SETTINGS.incidentPartsNames[partsOfIncident[partNumber]] + incidentText.substring(wherePartOfIncidentStarts[partsOfIncident[partNumber]] + SETTINGS.incidentPartsNames[partsOfIncident[partNumber]].length, wherePartOfIncidentStarts[partsOfIncident[partNumber + 1]])
        textOfParts.push(SETTINGS.incidentPartsNames[partsOfIncident[partNumber]] + incidentText.substring(wherePartOfIncidentStarts[partsOfIncident[partNumber]] + SETTINGS.incidentPartsNames[partsOfIncident[partNumber]].length, incidentText.length))
      } else {
        textOfParts.push('<b>' + SETTINGS.incidentPartsNames[partsOfIncident[partNumber]] + '</b>' + incidentText.substring(wherePartOfIncidentStarts[partsOfIncident[partNumber]] + SETTINGS.incidentPartsNames[partsOfIncident[partNumber]].length, wherePartOfIncidentStarts[partsOfIncident[partNumber + 1]]))
      }
    }

    var whereVinEndsInHeader = textOfParts[0].indexOf('VIN: ');
    textOfParts[0] = textOfParts[0].substring(0, whereVinEndsInHeader + 22) + '\n';
    for (var partNumber = 0; partNumber < textOfParts.length; partNumber++) {
      generatedIncidentText += textOfParts[partNumber];
    }

    var whereCommentStarts = generatedIncidentText.indexOf('🤫 Комментарий: ');

    if (whereCommentStarts > 0) {
      var whereURLStarts = generatedIncidentText.indexOf('https://st.yandex-team.ru/DRIVESECURITY-');
      var body = generatedIncidentText.substring(0, whereCommentStarts);
      var footer = generatedIncidentText.substring(whereURLStarts);

      generatedIncidentText = `${body}\n\n${footer}`;
    }

    var chatID = 1;
    if (generatedIncidentText.indexOf('Санкт-Петербург') > -1 || generatedIncidentText.indexOf('Ленинградская область') > -1) {
      chatID = SETTINGS.chats.spbTechicians.id;
    } else {
      if (generatedIncidentText.indexOf('Москва') > -1 || generatedIncidentText.indexOf('Московская область') > -1) {
        chatID = SETTINGS.chats.moscowTechicians.id;
      } else {
        if (generatedIncidentText.indexOf('Казань') > -1) {
          chatID = SETTINGS.chats.kazanTechnicians.id;
        }
      }
    }


    if (chatID < 0) {
      ctx.telegram.sendMessage(chatID, generatedIncidentText, Telegraf.Extra.HTML());
    }
  },


  greetNewUser: function (ctx, user) {
    var message = `Привет`

    if (user.info.name.length > 2 && user.name.indexOf(' ') < 0) message += `, ${user.info.name}!`
    else message += `!`

    message += ` Рад, что мы познакомились :) Тебе доступен следующий функционал: \n\n`

    if (user.roles.technicianMoscow || user.roles.technicianSaintPetersburg || user.roles.technicianKazan) {
      message += `<b>Техник</b>\n<i>— Вызов такси в личке бота по команде /taxi</i>`
    } else {

    }

    if (user.roles.support) {
      message += `<b>Поддержка Драйва</b>\n<i>— Призыв дежурных в чате Support.Drive внутренний по команде /duty</i>`
    }

  },


  setNewTest: function (ctx) {
    try {
      if (typeof ctx.misc.tests === 'undefined') ctx.misc.tests = {};
      if (typeof ctx.misc.tests.archive === 'undefined') ctx.misc.tests.archive = [];
      if (typeof ctx.misc.tests.active === 'undefined') ctx.misc.tests.active = [];

      ctx.session.test = {};

      var menu = [];
      var counter = 0;
      var message = `Выбери <b>вид</b> добавляемого теста из предлагаемых вариантов`;
      SETTINGS.TESTS.TYPES.forEach(testType => {
        if (userActions.hasRoleByTelegramID(ctx, testType.ROLE_WHO_CAN_CREATE, ctx.message.from.id)) {
          menu.push(Telegraf.Markup.callbackButton(`${testType.NAME}`, `actionTest_type${testType.ID}`))
          counter++;
        }
      })

      if (counter > 0) {
        ctx.session.stage = 'chooseType'
        ctx.replyWithHTML(message, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menu, {
          columns: 1
        })));
      } else {
        ctx.session = undefined;
        ctx.replyWithHTML(`Может ты хотел использовать /tests? 🤔`);
      }
    } catch (error) {
      utility.logError(ctx, error)
      ctx.replyWithHTML('Что-то пошло не так, сообщи Севе');
    }
  },


  setTestType: function (ctx) {
    try {
      if (ctx.session.stage === 'chooseType') {
        var type = ctx.callbackQuery.data.split('type')[1];
        ctx.deleteMessage();
        var counter = 0;
        SETTINGS.TESTS.TYPES.forEach(testType => {
          if (testType.ID === type) {
            ctx.session.test.type = testType;
            counter++;
          }
        })

        if (counter > 0) {
          if (counter > 1) {
            ctx.replyWithHTML('В настройке существует несколько видов тестирований с одинаковым ID. Сообщи это Севе');
            ctx.session = undefined;
          } else {
            ctx.replyWithHTML('Пришли <b>название</b> нового теста, чтобы в будущем их было проще различать');
            ctx.session.stage = 'setName'
          }
        } else {
          ctx.replyWithHTML('Не смог найти в файле настроек тест с указанным ID. Сообще Севе');
          ctx.session = undefined;
        }
      }
    } catch (error) {
      utility.logError(ctx, error)
      ctx.replyWithHTML('Что-то пошло не так, сообщи Севе');
    }
  },

  addTestHandler: function (ctx) {
      switch (ctx.session.stage) {
        case 'chooseType':
          ctx.replyWithHTML('Выбери <b>вид</b> добавляемого теста из предлагаемых вариантов с помощью меню выше');
          //ctx.replyWithHTML('Пришли <b>название</b> нового теста, чтобы в будущем их было проще различать');
          //ctx.session.stage = 'setName'
          break;
        case 'setName':
          switch (ctx.message.text) {
            case 'упс':
              ctx.session.test = undefined;
              ctx.session.stage = undefined;
              ctx.replyWithHTML(`Отменил добавление теста`);
              break;
            default:
              ctx.session.test.name = ctx.message.text;
              if (typeof ctx.message.from.username !== 'undefined') ctx.session.test.telegramUsername = ctx.message.from.username;
              ctx.session.test.telegramID = ctx.message.from.id;
              ctx.replyWithHTML(`Записал название <code>${ctx.session.test.name}</code>. Пришли <b>ссылку</b> на тест.`);
              ctx.session.stage = 'setURL';
              break;
          }
          break;
        case 'setURL':
          switch (ctx.message.text) {
            case 'упс':
              ctx.session.test = undefined;
              ctx.session.stage = undefined;
              ctx.replyWithHTML(`Отменил добавление теста`);
              break;
            default:
              ctx.session.test.url = ctx.message.text;
              if (ctx.session.test.type.NOTIFICATE_ONE_PERSON_ONLY) {
                ctx.replyWithHTML(`Записал ссылку <code>${ctx.session.test.url}</code>. Пришли <b>логин</b> того, кому будут приходить уведомления (можно как с знаком <code>@</code>, так и без него)`);
                ctx.session.stage = 'setUsernameWhomToNotificate';
              } else {
                ctx.replyWithHTML(`Записал ссылку <code>${ctx.session.test.url}</code>. Пришли <b>дедлайн</b> для теста.\n\n<i>Дедлайн считается днём, когда уже нельзя выполнить тест.\nНапример, чтобы установить дедлайн <b>${date.getByTimestamp(date.getCurrent().timestamp + 604800).string.testDeadline}</b>, пришли в чат <code>${date.getByTimestamp(date.getCurrent().timestamp + 604800).string.dateAsMoment}</code></i>`);
                ctx.session.stage = 'setDeadline';
              }
              break;
          }
          break;
        case 'setUsernameWhomToNotificate':
          switch (ctx.message.text) {
            case 'упс':
              ctx.session.test = undefined;
              ctx.session.stage = undefined;
              ctx.replyWithHTML(`Отменил добавление теста`);
              break;
            default:
              if (ctx.message.text.indexOf('@') > -1) ctx.session.test.whomNotificate = ctx.message.text.split('@')[1]
              else ctx.session.test.whomNotificate = ctx.message.text

              ctx.replyWithHTML(`Записал логин, кого буду уведомлять: @${ctx.session.test.whomNotificate}. Пришли <b>дедлайн</b> для теста.\n\n<i>Дедлайн считается днём, когда уже нельзя выполнить тест.\nНапример, чтобы установить дедлайн <b>${date.getByTimestamp(date.getCurrent().timestamp + 604800).string.testDeadline}</b>, пришли в чат <code>${date.getByTimestamp(date.getCurrent().timestamp + 604800).string.dateAsMoment}</code></i>`);
              ctx.session.stage = 'setDeadline';
              break;
          }
          break;
        case 'setDeadline':
          switch (ctx.message.text) {
            case 'упс':
              ctx.session.test = undefined;
              ctx.session.stage = undefined;
              ctx.replyWithHTML(`Отменил добавление теста`);
              break;
            default:
              if (date.convertStringToTimestamp(ctx.message.text) > 0) {
                ctx.session.test.timestampDue = date.convertStringToTimestamp(ctx.message.text);
                ctx.session.test.notifications = [];
                var message = `Тест можно пройти вплоть до <code>${date.getByTimestamp(ctx.session.test.timestampDue).string.testDeadline}</code> Теперь давай определимся, когда дежурным будут присылаться напоминания о необходимости пройти тест.\n\nДля добавления уведомления нажми кнопку "➕ Добавить"`;
                var menu = Telegraf.Extra
                  .HTML()
                  .markup((m) => m.inlineKeyboard([
                    m.callbackButton('➕ Добавить', `actionAddNotificationToTest`),
                    m.callbackButton(`📌 Добавить стандартные`, `actionAddStandtartNotificationToTest`)
                  ], {
                    columns: 1
                }))
                ctx.replyWithHTML(message, menu);
                ctx.session.stage = 'none';
              } else {
                ctx.replyWithHTML(`Похоже, что ты прислал дату в неверном формате. Давай попробуем ещё раз.\n\nНапример, чтобы установить дедлайн <b>${date.getByTimestamp(date.getCurrent().timestamp + 604800).string.DDMMhhmmYYYY}</b>, пришли в чат <code>${date.getByTimestamp(date.getCurrent().timestamp + 604800).string.dateAsMoment}</code>`);
              }
              break;
          }
          break;
        case 'addNotification':
          switch (ctx.message.text) {
            case 'упс':
              ctx.session.test = undefined;
              ctx.session.stage = undefined;
              ctx.replyWithHTML(`Отменил добавление теста`);
              break;
            default:
              if (date.convertStringToTimestamp(ctx.message.text) > 0) {
                var timestamp = date.convertStringToTimestamp(ctx.message.text);
                if (timestamp > date.getCurrent().timestamp) {
                  if (timestamp < ctx.session.test.timestampDue) {
                    var menu = [];
                    var message = ``;

                    var alreadyPresent = false;
                    ctx.session.test.notifications.forEach(notification => {
                      if (notification.timestamp === timestamp) alreadyPresent = true;
                    })
                    if (!alreadyPresent) {
                      ctx.session.test.notifications.push({
                        timestamp: timestamp,
                        sent: false
                      })
                      message = `Добавил уведомление <code>${date.getByTimestamp(timestamp).string.DDMMhhmmYYYY}</code>`;
                    } else  {
                      message = `Уведомление в это время уже существует`;
                    }
                    message += `\n\n<b>Все уведомления</b>`

                    ctx.session.test.notifications.forEach((notification, index) => {
                      message += `\n${index + 1}. ${date.getByTimestamp(notification.timestamp).string.DDMMhhmmYYYY}`
                      menu.push(Telegraf.Markup.callbackButton(`${date.getByTimestamp(notification.timestamp).string.DDMMhhmmYYYY}`, `actionEditTestNotification_id${index}`))
                    })

                    menu.push(Telegraf.Markup.callbackButton(`➕ Добавить`, `actionAddNotificationToTest`))

                    if (standtardNotificationsPresence(ctx) > 0) {
                      if (standtardNotificationsPresence(ctx) < 6) menu.push(Telegraf.Markup.callbackButton(`📌 Добавить остальные стандартные`, `actionAddStandtartNotificationToTest`))
                    } else menu.push(Telegraf.Markup.callbackButton(`📌 Добавить стандартные`, `actionAddStandtartNotificationToTest`))

                    menu.push(Telegraf.Markup.callbackButton(`✅ Готово`, `actionDoneWithTest`))
                    message += `\n\n<i>Чтобы добавить или изменить уведомление, нажми на соответствующую кнопку ниже</i>`
                    ctx.replyWithHTML(message, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menu, {
                      columns: 1
                    })));
                    ctx.session.stage = 'none';
                  }
                  else {
                    ctx.replyWithHTML(`Ты хочешь уведомить людей о тесте после дедлайна 🤔. Давай попробуем ещё раз\n\nНапример, чтобы уведомление было отправлено <code>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.DDMMhhmmYYYY}</code>, пришли в чат <code>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.dateAsMomentWithHour}</code>`)
                  }
                } else {
                  ctx.replyWithHTML(`Ты хочешь уведомить людей о тесте в прошедшем времени 🤔. Давай попробуем ещё раз\n\nНапример, чтобы уведомление было отправлено <code>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.DDMMhhmmYYYY}</code>, пришли в чат <code>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.dateAsMomentWithHour}</code>`)
                }
              } else {
                ctx.replyWithHTML(`Похоже, что ты прислал дату в неверном формате. Давай попробуем ещё раз.\n\nНапример, чтобы уведомление было отправлено <code>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.DDMMhhmmYYYY}</code>, пришли в чат <code>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.dateAsMomentWithHour}</code>`);
              }
              break;
          }
          break;
        case 'none':
          var message = `Ожидаю от тебя нажатие на меню в одном из предыдущих сообщений для завершения создания теста`
          ctx.replyWithHTML(message);
          break;
        case 'editNotification':
          if (typeof ctx.session.test.editNotificationID !== 'undefined') {
            if (ctx.session.test.notifications[ctx.session.test.editNotificationID]) {
              switch (ctx.message.text) {
                case 'упс':
                  ctx.session.test = undefined;
                  ctx.session.stage = undefined;
                  ctx.replyWithHTML(`Отменил добавление теста`);
                  break;
                case 'удалить':
                  var message = `Удалил уведомление <code>${date.getByTimestamp(ctx.session.test.notifications[ctx.session.test.editNotificationID].timestamp).string.DDMMhhmmYYYY}</code>\n\n<b>Все уведомления</b>`
                  var menu = [];

                  ctx.session.test.notifications.splice(ctx.session.test.editNotificationID, 1)

                  ctx.session.test.notifications.forEach((notification, index) => {
                    message += `\n${index + 1}. ${date.getByTimestamp(notification.timestamp).string.DDMMhhmmYYYY}`
                    menu.push(Telegraf.Markup.callbackButton(`${date.getByTimestamp(notification.timestamp).string.DDMMhhmmYYYY}`, `actionEditTestNotification_id${index}`))
                  })
                  menu.push(Telegraf.Markup.callbackButton(`➕ Добавить`, `actionAddNotificationToTest`))
                  if (standtardNotificationsPresence(ctx) > 0) {
                    if (standtardNotificationsPresence(ctx) < 6) menu.push(Telegraf.Markup.callbackButton(`📌 Добавить остальные стандартные`, `actionAddStandtartNotificationToTest`))
                  } else menu.push(Telegraf.Markup.callbackButton(`📌 Добавить стандартные`, `actionAddStandtartNotificationToTest`))
                  menu.push(Telegraf.Markup.callbackButton(`✅ Готово`, `actionDoneWithTest`))
                  message += `\n\n<i>Чтобы добавить или изменить уведомление, нажми на соответствующую кнопку ниже</i>`
                  ctx.replyWithHTML(message, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menu, {
                    columns: 1
                  })));
                  ctx.session.stage = 'none';
                  ctx.session.test.editNotificationID = undefined;
                  break;
                case 'ой':
                  var message = `Отменил изменение уведомления <code>${date.getByTimestamp(ctx.session.test.notifications[ctx.session.test.editNotificationID].timestamp).string.DDMMhhmmYYYY}</code>\n\n<b>Все уведомления</b>`
                  var menu = [];

                  ctx.session.test.notifications.forEach((notification, index) => {
                    message += `\n${index + 1}. ${date.getByTimestamp(notification.timestamp).string.DDMMhhmmYYYY}`
                    menu.push(Telegraf.Markup.callbackButton(`${date.getByTimestamp(notification.timestamp).string.DDMMhhmmYYYY}`, `actionEditTestNotification_id${index}`))
                  })
                  menu.push(Telegraf.Markup.callbackButton(`➕ Добавить`, `actionAddNotificationToTest`))
                  if (standtardNotificationsPresence(ctx) > 0) {
                    if (standtardNotificationsPresence(ctx) < 6) menu.push(Telegraf.Markup.callbackButton(`📌 Добавить остальные стандартные`, `actionAddStandtartNotificationToTest`))
                  } else menu.push(Telegraf.Markup.callbackButton(`📌 Добавить стандартные`, `actionAddStandtartNotificationToTest`))
                  menu.push(Telegraf.Markup.callbackButton(`✅ Готово`, `actionDoneWithTest`))
                  message += `\n\n<i>Чтобы добавить или изменить уведомление, нажми на соответствующую кнопку ниже</i>`
                  ctx.replyWithHTML(message, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menu, {
                    columns: 1
                  })));
                  ctx.session.stage = 'none';
                  ctx.session.test.editNotificationID = undefined;
                  break;
                default:
                  if (date.convertStringToTimestamp(ctx.message.text) > 0) {
                    var timestamp = date.convertStringToTimestamp(ctx.message.text);
                    if (timestamp < ctx.session.test.timestampDue) {
                      if (timestamp > date.getCurrent().timestamp) {
                        var present = false;
                        ctx.session.test.notifications.forEach(notification => {
                          if (notification.timestamp === timestamp) present = true;
                        })

                        if (!present) {
                          var message = `Изменил уведомление <code>${date.getByTimestamp(ctx.session.test.notifications[ctx.session.test.editNotificationID].timestamp).string.DDMMhhmmYYYY}</code> на <code>${date.getByTimestamp(timestamp).string.DDMMhhmmYYYY}</code>\n\n<b>Все уведомления</b>`
                          ctx.session.test.notifications[ctx.session.test.editNotificationID].timestamp = timestamp;
                          var menu = [];

                          ctx.session.test.notifications.forEach((notification, index) => {
                            message += `\n${index + 1}. ${date.getByTimestamp(notification.timestamp).string.DDMMhhmmYYYY}`
                            menu.push(Telegraf.Markup.callbackButton(`${date.getByTimestamp(notification.timestamp).string.DDMMhhmmYYYY}`, `actionEditTestNotification_id${index}`))
                          })
                          menu.push(Telegraf.Markup.callbackButton(`➕ Добавить`, `actionAddNotificationToTest`))
                          if (standtardNotificationsPresence(ctx) > 0) {
                            if (standtardNotificationsPresence(ctx) < 6) menu.push(Telegraf.Markup.callbackButton(`📌 Добавить остальные стандартные`, `actionAddStandtartNotificationToTest`))
                          } else menu.push(Telegraf.Markup.callbackButton(`📌 Добавить стандартные`, `actionAddStandtartNotificationToTest`))
                          menu.push(Telegraf.Markup.callbackButton(`✅ Готово`, `actionDoneWithTest`))
                          message += `\n\n<i>Чтобы добавить или изменить уведомление, нажми на соответствующую кнопку ниже</i>`

                          ctx.replyWithHTML(message, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menu, {
                            columns: 1
                          })));
                          ctx.session.stage = 'none';
                          ctx.session.test.editNotificationID = undefined;
                        } else {
                          ctx.replyWithHTML(`Это уведомление уже существует 🤔. Давай попробуем ещё раз\n\nНапример, чтобы уведомление было отправлено <code>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.DDMMhhmmYYYY}</code>, пришли в чат <code>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.dateAsMomentWithHour}</code>`)
                        }
                      } else {
                        ctx.replyWithHTML(`Ты хочешь уведомить людей о тесте в прошедшем времени 🤔. Давай попробуем ещё раз\n\nНапример, чтобы уведомление было отправлено <code>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.DDMMhhmmYYYY}</code>, пришли в чат <code>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.dateAsMomentWithHour}</code>`)
                      }
                    }
                    else {
                      ctx.replyWithHTML(`Ты хочешь уведомить людей о тесте после дедлайна 🤔. Давай попробуем ещё раз\n\nНапример, чтобы уведомление было отправлено <code>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.DDMMhhmmYYYY}</code>, пришли в чат <code>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.dateAsMomentWithHour}</code>`)
                    }
                  } else {
                    ctx.replyWithHTML(`Похоже, что ты прислал дату в неверном формате. Давай попробуем ещё раз.\n\nНапример, чтобы уведомление было отправлено <code>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.DDMMhhmmYYYY}</code>, пришли в чат <code>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.dateAsMomentWithHour}</code>`);
                  }
                  break;
              }
            } else {
              ctx.replyWithHTML(`Ошибка: ожидаю редактирование уведомления, но самого уведомления не существует 🤔`)
            }
          } else {
            ctx.replyWithHTML(`Ошибка: нахожусь в стадии ожидания редактирования уведомления, но нет индекса. Сообщи Севе`)
          }
          break;
      }
  },


  addNotification: function (ctx) {
    var message = `Пришли время уведомления для теста. Например, чтобы уведомление было отправлено <b>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.DDMMhhmmYYYY}</b>, пришли в чат <code>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.dateAsMomentWithHour}</code>\n\n<i>Естественно, уведомление не должно быть после дедлайна и не ранее сегодня</i>`
    ctx.session.stage = 'addNotification';
    ctx.replyWithHTML(message);
    ctx.deleteMessage();
  },



  editNotification: function (ctx) {
    var notificationID = parseInt(ctx.callbackQuery.data.split('id')[1]);
    if (ctx.session.test.notifications[notificationID]) {
      var message = `Введи новую дату и время для уведомления <code>${date.getByTimestamp(ctx.session.test.notifications[notificationID].timestamp).string.DDMMhhmmYYYY}</code>.\nЕсли хочешь удалить - напиши <code>удалить</code>\nЕсли передумал менять это уведомление - напиши <code>ой</code>\n\nНапример, чтобы уведомление было отправлено <b>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.DDMMhhmmYYYY}</b>, пришли в чат <code>${date.getByTimestamp(date.getCurrent().timestamp + 302400).string.dateAsMomentWithHour}</code>`
      ctx.session.test.editNotificationID = notificationID;
      ctx.session.stage = 'editNotification';
      ctx.replyWithHTML(message);
      ctx.deleteMessage();
    } else {
      ctx.replyWithHTML(`Странно, не вижу выбранного тобой уведомления 🤔`)
    }
  },



  addStandartNotifications: function (ctx) {
    var standartNotifications = [ctx.session.test.timestampDue - 223200, ctx.session.test.timestampDue - 180000, ctx.session.test.timestampDue - 136800, ctx.session.test.timestampDue - 93600, ctx.session.test.timestampDue - 50400, ctx.session.test.timestampDue - 7200];
    standartNotifications.forEach(stN => {
      var present = false;
      ctx.session.test.notifications.forEach(notification => {
        if (notification.timestamp === stN) present = true;
      })
      if (!present && stN > date.getCurrent().timestamp) {
        ctx.session.test.notifications.push({
          timestamp: stN,
          sent: false
        })
      }
    })
    var message = `Добавил стандартные уведомления к тесту\n\n<b>Все уведомления</b>`
    var menu = [];

    ctx.session.test.notifications.forEach((notification, index) => {
      message += `\n${index + 1}. ${date.getByTimestamp(notification.timestamp).string.DDMMhhmmYYYY}`
      menu.push(Telegraf.Markup.callbackButton(`${date.getByTimestamp(notification.timestamp).string.DDMMhhmmYYYY}`, `actionEditTestNotification_id${index}`))
    })
    menu.push(Telegraf.Markup.callbackButton(`➕ Добавить`, `actionAddNotificationToTest`))
    console.log(standtardNotificationsPresence(ctx));
    if (standtardNotificationsPresence(ctx) > 0) {
      if (standtardNotificationsPresence(ctx) < 6) menu.push(Telegraf.Markup.callbackButton(`📌 Добавить остальные стандартные`, `actionAddStandtartNotificationToTest`))
    } else menu.push(Telegraf.Markup.callbackButton(`📌 Добавить стандартные`, `actionAddStandtartNotificationToTest`))
    menu.push(Telegraf.Markup.callbackButton(`✅ Готово`, `actionDoneWithTest`))
    message += `\n\n<i>Чтобы добавить или изменить уведомление, нажми на соответствующую кнопку ниже</i>`
    ctx.replyWithHTML(message, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menu, {
      columns: 1
    })));
    ctx.session.stage = 'none';
    ctx.deleteMessage();
  },

  addTest: function (ctx) {
    ctx.session.test.whoCompleted = [];
    ctx.misc.tests.archive.push(ctx.session.test);
    var id = ctx.misc.tests.archive.length - 1;
    ctx.misc.tests.active.push(id);
    ctx.session.test = undefined;
    ctx.session.stage = undefined;
    var message = `Успешно добавил тест №${id}!\n\n<b>Название:</b> ${ctx.misc.tests.archive[id].name}\n<b>Ссылка:</b> ${ctx.misc.tests.archive[id].url}\n<b>Дедлайн:</b> ${date.getByTimestamp(ctx.misc.tests.archive[id].timestampDue).string.date}\n\n<b>Уведомления</b>`;
    ctx.misc.tests.archive[id].notifications.forEach((notification, index) => {
      message += `\n${index + 1}. ${date.getByTimestamp(notification.timestamp).string.DDMMhhmmYYYY}`
    })
    ctx.replyWithHTML(message);
  },


  sendRemindersAboutTests: async function (telegram) {
    // We use the function from the cron process so it doesn't have access
    // to the context. Therefore we need to declare sessions.

    // 1. Sessions
    var sessionInstance = new RedisSession()

    var localMisc;
    await sessionInstance.getSession('misc').then(session => {
      localMisc = session;
    });

    var localUsers;
    await sessionInstance.getSession('users').then(session => {
      localUsers = session;
    });


    // We have global and personal reminders

    // 2. Create list of all tests that need reminders
    var notifications = [];
    localMisc.tests.active.forEach((testID) => {
      localMisc.tests.archive[testID].notifications.forEach((notification, notificationID) => {
        if (notification.timestamp < date.getCurrent().timestamp && notification.sent === false) {
          notifications.push({
            testID: testID,
            notificationID: notificationID,
            testType: localMisc.tests.archive[testID].type
          });
        }
      })
    })


    if (notifications.length > 0) {

      // 3. Build list of all users with roles, that are used in tests
      var users = {};

      // 3.1 Find all needed roles
      notifications.forEach(notification => {
        notification.testType.ROLE_WHO_CAN_CREATE.forEach(role => {
          if (!users[role]) users[role] = [];
        });
        notification.testType.ROLE_WHO_SHOULD_COMPLETE.forEach(role => {
          if (!users[role]) users[role] = [];
        });
        notification.testType.ROLE_WHO_SHOULD_BE_IGNORED.forEach(role => {
          if (!users[role]) users[role] = [];
        });
      });

      // 3.2 Add user if role applies
      for (const role in users) {
        localUsers.all.forEach((user, id) => {
          if (id > 0) {
            if (user.roles[role]) {
              if (user.info.telegramUsername.length > 0 && user.info.telegramID) {
                users[role].push({
                  telegramUsername: user.info.telegramUsername,
                  telegramID: user.info.telegramID
                })
              }
            }
          }
        })
      }

      // Add to notifications object those who we need to remind
      notifications.forEach(notification => {
        if (!notification.users) notification.users = [];

        // If only 1 person has to be reminded
        if (notification.testType.NOTIFICATE_ONE_PERSON_ONLY) {
          localUsers.all.forEach(user => {
            if (user.info.telegramUsername === localMisc.tests.archive[notification.testID].whomNotificate) {
              if (user.info.telegramUsername.length > 0 && user.info.telegramID) {
                notification.users.push({
                  telegramUsername: user.info.telegramUsername,
                  telegramID: user.info.telegramID
                })
              }
            }
          });
        }

        else {

          users[notification.testType.ROLE_WHO_SHOULD_COMPLETE].forEach(user => {

            var shouldBeIgnored = false;
            notification.testType.ROLE_WHO_SHOULD_BE_IGNORED.forEach(role => {
              users[role].forEach(ignoredUser => {
                if (user.telegramUsername === ignoredUser.telegramUsername) shouldBeIgnored = true;
              });
            });

            var alreadyCompleted = false;
            localMisc.tests.archive[notification.testID].whoCompleted.forEach(telegramUsername => {
              if (user.telegramUsername === telegramUsername) alreadyCompleted = true;
            });


            if (!shouldBeIgnored && !alreadyCompleted) {
              notification.users.push(user);
            }
          });

        }
      })

      notifications.forEach((notification) => {
        if (notification.users.length > 0) {
          var personalHeader = ``;
          var personalFooter = ``;

          if (notification.testType.CUSTOM_PERSONAL_HEADER) {
            personalHeader = notification.testType.CUSTOM_PERSONAL_HEADER
          } else {
            personalHeader = `Привет 🥰\nНапоминаю, что у тебя есть <b>непройденный тест</b>`
          }

          if (notification.testType.CUSTOM_PERSONAL_FOOTER) {
            personalFooter = notification.testType.CUSTOM_PERSONAL_FOOTER
          } else {
            personalFooter = `<i>Если ты уже выполнил(а) тест, используй команду /tests в этом чате и отметь тест</i>`
          }

          var personalMessage = `${personalHeader}\n\n<b>Название:</b> ${localMisc.tests.archive[notification.testID].name}\n<b>Ссылка:</b> ${localMisc.tests.archive[notification.testID].url}\nПожалуйста, пройди его до <b>${date.getByTimestamp(localMisc.tests.archive[notification.testID].timestampDue).string.date}</b>\n\n${personalFooter}`;

          var globalMessage = `Ребятушки, напоминаю, что ещё не все прошли тест!\n\n<b>Название:</b> ${localMisc.tests.archive[notification.testID].name}\n<b>Ссылка:</b> ${localMisc.tests.archive[notification.testID].url}\n<b>Пройти до</b>: ${date.getByTimestamp(localMisc.tests.archive[notification.testID].timestampDue).string.date} (в этот день тест пройти уже нельзя)\n\n<b>Кто ещё не успел пройти:</b>`



          //var personalMessage = `Привет 🥰\nНапоминаю, что у тебя есть непройденный тест.\n\n<b>Название:</b>${localMisc.tests.archive[notification.testID].name}\n<b>Ссылка:</b> ${localMisc.tests.archive[notification.testID].url}\nПожалуйста, пройди его до <b>${date.getByTimestamp(localMisc.tests.archive[notification.testID].timestampDue).string.date}</b>\n\n<i>Если ты уже выполнил(а) тест, используй команду /tests в этом чате и отметь тест</i>`;
          //var globalMessage = `Ребятушки, напоминаю, что ещё не все прошли тест!\n\n<b>Название:</b>${localMisc.tests.archive[notification.testID].name}\n<b>Ссылка:</b> ${localMisc.tests.archive[notification.testID].url}\n<b>Пройти до</b>: ${date.getByTimestamp(localMisc.tests.archive[notification.testID].timestampDue).string.date} (в этот день тест пройти уже нельзя)\n\n<b>Кто ещё не успел пройти:</b>`

          if (notification.testType.NOTIFICATE_PERSONALLY) {
            //var temp = `Уведомил бы в личку: `
            notification.users.forEach(user => {
              try {
                telegram.sendMessage(user.telegramID, personalMessage, Telegraf.Extra.HTML());
                //temp += ` @${user.telegramUsername}`
              } catch (err) {
                telegram.sendMessage(SETTINGS.chats.test.id, `Пытался уведомить @${user.telegramUsername}, но не удалось`, Telegraf.Extra.HTML());
                console.log(err)
              }
            })
            //console.log(temp);
          }

          if (notification.testType.NOTIFICATE_GLOBALLY) {
            //var temp = `Уведомил бы в чат: `
            notification.users.forEach(user => {
              globalMessage += ` @${user.telegramUsername}`
              //temp += ` @${user.telegramUsername}`
            })
            telegram.sendMessage(notification.testType.CHAT_ID, globalMessage, Telegraf.Extra.HTML());
            //console.log(temp);
          }

          //console.log('hey');
          localMisc.tests.archive[notification.testID].notifications[notification.notificationID].sent = true;
        }
      })
    }

    sessionInstance.saveSession('misc', localMisc);
  },


  offerToCompleteTheTest: function (ctx) {
    if (ctx.misc.tests.active.length > 0) {
      var activeTestsForUser = [];

      ctx.misc.tests.active.forEach(testID => {
        if (ctx.misc.tests.archive[testID].type.NOTIFICATE_ONE_PERSON_ONLY) {

          if (ctx.misc.tests.archive[testID].whomNotificate === ctx.message.from.username && ctx.misc.tests.archive[testID].whoCompleted.indexOf(ctx.message.from.username) < 0) {
            activeTestsForUser.push(testID)
          }

        }
        else {

          var userFits = false;

          /*var isManager = false;
          ctx.misc.tests.archive[testID].type.ROLE_WHO_CAN_CREATE.forEach(role => {
            if (userActions.hasRoleByTelegramID(ctx, role, ctx.message.from.id)) {
              isManager = true;
            }
          });*/

          var shouldBeIgnored = false;
          ctx.misc.tests.archive[testID].type.ROLE_WHO_SHOULD_BE_IGNORED.forEach(role => {
            if (userActions.hasRoleByTelegramID(ctx, role, ctx.message.from.id)) {
              shouldBeIgnored = true;
            }
          });

          if (/*!isManager &&*/ !shouldBeIgnored) {
            ctx.misc.tests.archive[testID].type.ROLE_WHO_SHOULD_COMPLETE.forEach(role => {
              if (userActions.hasRoleByTelegramID(ctx, role, ctx.message.from.id)) {
                userFits = true;
              }
            });
          }

          if (userFits && ctx.misc.tests.archive[testID].whoCompleted.indexOf(ctx.message.from.username) < 0) activeTestsForUser.push(testID)

        }
      })

      if (activeTestsForUser.length > 0) {
        var word = `теста`;
        if (activeTestsForUser.length === 1) word = `тест`
        if (activeTestsForUser.length > 4) word = `тестов`

        var message = `Тебе нужно пройти ещё ${activeTestsForUser.length} ${word}`
        var menu = [];
        activeTestsForUser.forEach((testID, index) => {
          message += `\n\n${index + 1}. <b>${ctx.misc.tests.archive[testID].name}</b>\n<b>Пройти до:</b> ${date.getByTimestamp(ctx.misc.tests.archive[testID].timestampDue).string.date}\n<b>Ссылка:</b> ${ctx.misc.tests.archive[testID].url}`
          menu.push(Telegraf.Markup.callbackButton(`${ctx.misc.tests.archive[testID].name}`, `actionCompleteTest_id${testID}_user${ctx.message.from.username}`))
        })
        message += `\n\n<i>Чтобы отметить тест выполненным, нажми соответствующую кнопку ниже. После нажатия тест <b>сразу</b> будет отмечен выполненным</i>`

        ctx.replyWithHTML(message, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menu, {
          columns: 1
        })));
      } else {
        ctx.replyWithHTML(`Похоже, что все тесты пройдены 🥳`)
      }
    } else {
      ctx.replyWithHTML(`Похоже, что все тесты пройдены 🥳`)
    }
  },


  markTestAsCompleted: function (ctx) {
    var testID = parseInt(ctx.callbackQuery.data.split('id')[1].split('_')[0]);
    var telegramUsername = ctx.callbackQuery.data.split('user')[1];

    ctx.misc.tests.archive[testID].whoCompleted.push(telegramUsername);
    var message = `Отметил, что ты выполнил(а) тест <b>${ctx.misc.tests.archive[testID].name}</b>. Так держать! :)`

    ctx.replyWithHTML(message);
    ctx.deleteMessage();
  }
}
