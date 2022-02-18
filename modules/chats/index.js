const user = require('../users/index.js'); // core
const date = require('../date/index.js');
const utility = require('../utility/index.js');
const Settings = require('../settings.json')
const Telegraf = require('telegraf')
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const RedisSession = require('telegraf-session-redis')

const chatsSettings = require('./settings.json')

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

module.exports = {

  greetAndWriteAttendant: function (ctx) {
    utility.log(ctx);
    try {
      console.log('hey');
      if (!ctx.chats.attendants) ctx.chats.attendants = [];

      var isntOnDuty = 1;
      ctx.chats.attendants.forEach((attendant, index) => {
        if (attendant.telegramUsername === ctx.message.from.username) isntOnDuty = 0;
      })

      if (isntOnDuty) {
        ctx.chats.attendants.push({
          telegramUsername: ctx.message.from.username
        })
        ctx.replyWithHTML(`Привет, @${ctx.message.from.username}!`);
        ctx.telegram.sendMessage(Settings.chats.telegram_username_1.id, `@${ctx.chats.attendants[ctx.chats.attendants.length - 1].telegramUsername} + ' заступил на смену в <b>${date.getByTimestamp(ctx.message.date).hour}:${date.getByTimestamp(ctx.message.date).minuteWithZero}</b>`, Telegraf.Extra.HTML());
      } else {
        ctx.reply('Ты уже и так дежуришь 🤔');
      }
    }
    catch (err) {
      ctx.reply('Что-то пошло не так 😞 Попробуй поздороваться ещё раз');
      console.log(err);
    }
  },


  parseAndWriteReport: function (ctx) {
    var errorsInReport = '';

    //
    // ## PARSING REPORT ## {--
    var indexWherePartStarts = [];

    for (var partNumber = 0; partNumber < chatsSettings.report.length; partNumber++) {
      indexWherePartStarts[partNumber] = ctx.message.text.indexOf(chatsSettings.report[partNumber].header);
      if (indexWherePartStarts[partNumber] < 0) {
        ctx.reply(`В твоём отчёте не хватает пункта "${chatsSettings.report[partNumber].header}". Исправь это, пожалуйста.`);
        return;
      }
    }

    var text = ctx.message.text;

    /*ctx.userSession.report = {};

    for (var reportPartNumber = 0; reportPartNumber < namesOfPartsInReport.length; reportPartNumber++) {
      // If it is last part, then it continues up to last symbol (length of whole message)
      // otherwise it continues up to start of next part
      switch (reportPartNumber) {
        case 0:
          var partOne = namesOfPartsInReport[reportPartNumber];
          var partTwo = '\n\n' + namesOfPartsInReport[reportPartNumber + 1];
          ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]] = text.split(partOne)[1].split(partTwo)[0];
          break;
        case (namesOfPartsInReport.length - 1):
          var partOne = namesOfPartsInReport[reportPartNumber];
          ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]] = text.split(partOne)[1];
          break;
        default:
          var partOne = namesOfPartsInReport[reportPartNumber];
          var partTwo = '\n' + namesOfPartsInReport[reportPartNumber + 1];
          ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]] = text.split(partOne)[1].split(partTwo)[0];
          //break;
      }
      if (ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]][0] === ' ')
        ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]] = ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]].substring(1, ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]].length)
      if (ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]][0] == '\n')
        ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]] = ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]].substring(1, ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]].length)
      if (ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]][ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]].length - 1] == '\n')
        ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]] = ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]].substring(0, ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]].length - 1)


      /*if (ctx.userSession.report[nativeNamesOfPartsInReport[reportPartNumber]].indexOf('\n\n') > 0) {
        errorsInReport += '\n— В пункте <b>' + namesOfPartsInReport[reportPartNumber] + '</b> присутствуют лишние пустые строки';
      }*/
    /*}
    ctx.userSession.report.telegramUsername = ctx.message.from.username;*/
    // --} ## END OF PARSING REPORT ##
    //

    //
    // ## WRITE REPORT TO DATABASE ## {--
    var reportHour = date.getCurrent().hour;
    var reportMonth = date.getCurrent().month;
    var reportDay = date.getCurrent().dayOfMonth;

    if (reportHour < 5) {
      if (reportDay > 1) {
        reportDay = reportDay - 1
      }
    }


    /*if (typeof ctx.chats.reports[reportMonth][reportDay] === "undefined")
      ctx.chats.reports[reportMonth][reportDay] = [];

    // All days were initially pregenerated, but just in case
    if (typeof ctx.chats.reports[reportMonth][reportDay] === "undefined")
      ctx.chats.reports[reportMonth][reportDay] = [];

    var amountOfSumbittedReportsToday = ctx.chats.reports[reportMonth][reportDay].length;
    ctx.chats.reports[reportMonth][reportDay][amountOfSumbittedReportsToday] = [];

    for (var reportPartNumber = 0; reportPartNumber < Settings.namesOfPartsInC2dReport.length; reportPartNumber++) {
      if (reportPartNumber === (Settings.namesOfPartsInC2dReport.length - 1)) {
        ctx.chats.reports[reportMonth][reportDay][amountOfSumbittedReportsToday][reportPartNumber] = ctx.message.from.username;
      } else {
        ctx.chats.reports[reportMonth][reportDay][amountOfSumbittedReportsToday][reportPartNumber] = ctx.userSession.reportParts[reportPartNumber];
      }
    }*/
    // --} ## END OF WRITE REPORT TO DATABASE ##
    //

    //
    // ## REMOVING FROM ACTIVE ATTENDANTS ## {--
    var attendantID = -1;
    ctx.chats.attendants.forEach((attendant, index) => {
      if (attendant.telegramUsername === ctx.message.from.username) attendantID = index;
    })
    if (attendantID > -1) {
      ctx.chats.attendants.splice(attendantID, 1);
    } else {
      errorsInReport += '\n— Тебя не было в списке дежурных. Пожалуйста, не забывай использовать /hi при заступлении на смену';
    }
    // --} ## END OF REMOVING FROM ACTIVE ATTENDANTS ##
    //

    //
    // ## GENERATE AND SEND MESSAGE ## {--
    var summaryMessage = 'Пока, @' + ctx.message.from.username + ', спасибо за смену!'
    var summaryMessageForCommandor = '@' + ctx.message.from.username + ' сдал смену'
    if (errorsInReport.length > 0) {
      summaryMessage += '\n\n<i>Ошибки в отчёте:</i>' + errorsInReport;
      summaryMessageForCommandor += '\n\n<i>Ошибки в отчёте:</i>' + errorsInReport;
    } else {
      summaryMessageForCommandor += ', ошибок в отчёте не было'
    }

    ctx.replyWithHTML(summaryMessage, Telegraf.Extra.inReplyTo(ctx.message.message_id));
    ctx.telegram.sendMessage(Settings.chats.telegram_username_1.id, summaryMessageForCommandor, Telegraf.Extra.HTML())
    // --} ## END OF GENERATE AND SEND MESSAGE ##
    //
  },

  removeAttendant: function (ctx) {
    utility.log(ctx);
    try {
      var attendantID = -1;
      ctx.chats.attendants.forEach((attendant, index) => {
        if (attendant.telegramUsername === ctx.message.from.username) attendantID = index;
      })
      if (attendantID > -1) {
        ctx.chats.attendants.splice(attendantID, 1);
        ctx.reply(`Пока, @${ctx.message.from.username}! Спасибо за смену!`);
      } else {
        ctx.replyWithHTML('Тебя нет в списке дежурных 🤔');
      }
      //notifyAboutNextShift(ctx, 'c2d', ctx.message.from.id)
    }
    catch (err) {
      ctx.reply('Что-то пошло не так 😞 Попробуй попрощаться ещё раз');
      console.log(err);
    }
  },

  mentionCurrentAttendants: function (ctx) {
    utility.log(ctx);
    var message = '';
    ctx.chats.attendants.forEach(attendant => {
      message += `@${attendant.telegramUsername}, `
    })
    message += `капельку вашего внимания 🙏`
    ctx.replyWithHTML(message, Telegraf.Extra.inReplyTo(ctx.message.message_id));
  },



  setWeekRangeForShifts: function (ctx) {
    ctx.chats.shifts.currentWeek.range = ctx.chats.shifts.nextWeek.range;
    ctx.chats.shifts.nextWeek.data = null;

    var nextWeekStartTimestamp = date.getCurrent().timestamp + 604800;
    var nextWeekEndTimestamp = nextWeekStartTimestamp + 518400;
    var startMonth = date.getByTimestamp(nextWeekStartTimestamp).month + 1;
    var startDate = date.getByTimestamp(nextWeekStartTimestamp).dayOfMonth;
    var endMonth = date.getByTimestamp(nextWeekEndTimestamp).month + 1;
    var endDate = date.getByTimestamp(nextWeekEndTimestamp).dayOfMonth;

    if (startMonth < 10) startMonth = '0' + startMonth;
    if (startDate < 10) startDate = '0' + startDate;
    if (endMonth < 10) endMonth = '0' + endMonth;
    if (endDate < 10) endDate = '0' + endDate;


    ctx.chats.shifts.nextWeek.range = `${startDate}.${startMonth} - ${endDate}.${endMonth}`
    ctx.telegram.sendMessage(Settings.chats.test.id, `Записал новый период графика: ${startDate}.${startMonth} - ${endDate}.${endMonth}`);
  },



  getScheduleForCurrentWeek: async function (ctx) {
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

    async function getSchedule (auth) {
      var sessionInstance = new RedisSession()
      var localCalls;

      await sessionInstance.getSession('chats').then(session => {
        chats = session;
      });

      const sheets = google.sheets({
        version: 'v4',
        auth
      });
      return sheets.spreadsheets.values.get({
        spreadsheetId: '1IYkehZ8P5Ok9H-IHODHpJm5reysSd9YIsuqYvdHNll4',
        range: chats.shifts.currentWeek.range,
      }, async (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const rows = res.data.values;
        if (rows.length) {
          console.log(rows[0][2]);

          chats.shifts.currentWeek.data = {};

          rows[0].forEach((column, index) => {
            if (typeof column !== 'undefined') {
              //console.log(column);
              if (column.indexOf('@') > -1) {
                var staffUsername = column.split('@')[0];

                console.log(staffUsername)
                //crucial to remember that week starts from sunday in js
                chats.shifts.currentWeek.data[staffUsername] = [];

                //sunday
                chats.shifts.currentWeek.data[staffUsername][0] = [];
                for (var i = 145; i < 169; i++) {
                  try {
                    if (typeof rows[i][index] !== 'undefined')
                      if (rows[i][index].length > 0) chats.shifts.currentWeek.data[staffUsername][0].push(1);
                      else chats.shifts.currentWeek.data[staffUsername][0].push(0);
                    else chats.shifts.currentWeek.data[staffUsername][0].push(0);
                  } catch (err) {
                    console.log(`rows[${i}][${index}]: ${rows[i][index]}`);
                    break;
                  }
                }

                //monday
                chats.shifts.currentWeek.data[staffUsername][1] = [];
                for (var i = 1; i < 25; i++) {
                  if (typeof rows[i][index] !== 'undefined')
                    if (rows[i][index].length > 0) chats.shifts.currentWeek.data[staffUsername][1].push(1);
                    else chats.shifts.currentWeek.data[staffUsername][1].push(0);
                  else chats.shifts.currentWeek.data[staffUsername][1].push(0);
                }

                //tuesday
                chats.shifts.currentWeek.data[staffUsername][2] = [];
                for (var i = 25; i < 49; i++) {
                  if (typeof rows[i][index] !== 'undefined')
                    if (rows[i][index].length > 0) chats.shifts.currentWeek.data[staffUsername][2].push(1);
                    else chats.shifts.currentWeek.data[staffUsername][2].push(0);
                  else chats.shifts.currentWeek.data[staffUsername][2].push(0);
                }

                //wednesday
                chats.shifts.currentWeek.data[staffUsername][3] = [];
                for (var i = 49; i < 73; i++) {
                  if (typeof rows[i][index] !== 'undefined')
                    if (rows[i][index].length > 0) chats.shifts.currentWeek.data[staffUsername][3].push(1);
                    else chats.shifts.currentWeek.data[staffUsername][3].push(0);
                  else chats.shifts.currentWeek.data[staffUsername][3].push(0);
                }

                //thursday
                chats.shifts.currentWeek.data[staffUsername][4] = [];
                for (var i = 73; i < 97; i++) {
                  if (typeof rows[i][index] !== 'undefined')
                    if (rows[i][index].length > 0) chats.shifts.currentWeek.data[staffUsername][4].push(1);
                    else chats.shifts.currentWeek.data[staffUsername][4].push(0);
                  else chats.shifts.currentWeek.data[staffUsername][4].push(0);
                }

                //friday
                chats.shifts.currentWeek.data[staffUsername][5] = [];
                for (var i = 97; i < 121; i++) {
                  if (typeof rows[i][index] !== 'undefined')
                    if (rows[i][index].length > 0) chats.shifts.currentWeek.data[staffUsername][5].push(1);
                    else chats.shifts.currentWeek.data[staffUsername][5].push(0);
                  else chats.shifts.currentWeek.data[staffUsername][5].push(0);
                }

                //saturday
                chats.shifts.currentWeek.data[staffUsername][6] = [];
                for (var i = 121; i < 145; i++) {
                  if (typeof rows[i][index] !== 'undefined')
                    if (rows[i][index].length > 0) chats.shifts.currentWeek.data[staffUsername][6].push(1);
                    else chats.shifts.currentWeek.data[staffUsername][6].push(0);
                  else chats.shifts.currentWeek.data[staffUsername][6].push(0);
                }
              }
            }
          })
          sessionInstance.saveSession('chats', chats);
        } else {
          //console.log('No data found.');
        }
      });
    }
  },


  sendNextShiftForUser: function (ctx) {
    //var staffUsername = user.getUserInfoByAnotherInfo(ctx, 'staffUsername', 'telegramUsername', ctx.message.from.username);
    var staffUsername = user.getUserInfoByAnotherInfo(ctx, 'staffUsername', 'telegramUsername', 'WarmDuck');

    if (typeof staffUsername !== 'undefined') {
      var currentDayOfWeek = date.getCurrent().dayOfWeek;
      var currentHour = date.getCurrent().hour;
      var startOfNextShift = {
        day: -1,
        hour: -1
      };
      var endOfNextShift = {
        day: -1,
        hour: -1
      };

      if (ctx.chats.shifts.currentWeek.data[staffUsername] !== 'undefined') {
        try {
          console.log(ctx.chats.shifts.currentWeek.data['telegram_username_4'])
          for (let day = currentDayOfWeek; day < 7; day++) {
            if (startOfNextShift.day === -1) {
              for (let hour = currentHour; hour < 24; hour++) {
                if (ctx.chats.shifts.currentWeek.data[staffUsername][day][hour] === 1) {
                  startOfNextShift.day = day;
                  startOfNextShift.hour = hour;
                }
              }
            }
          }
          for (let day = startOfNextShift.day; day < 7; day++) {
            if (endOfNextShift.hour === -1) {
              for (let hour = startOfNextShift.hour; hour < 24; hour++) {
                if (ctx.chats.shifts.currentWeek.data[staffUsername][day][hour] === 0) {
                  if (hour !== 0) {
                    endOfNextShift.day = day;
                    endOfNextShift.hour = hour - 1;
                  } else {
                    endOfNextShift.day = day - 1;
                    endOfNextShift.hour = 23;
                  }
                }
              }
            }
          }

          if (endOfNextShift.day === -1) {
            // then check next week
          }

          console.log(startOfNextShift)
          console.log(endOfNextShift);
        } catch (err) {
          console.log(err);
        }
      } else {
        ctx.telegram.sendMessage(ctx.message.from.id, `Какие-то чудеса: не нашёл тебя в графике 🤔 \n\nЕсли это нормально, то игнорируй сообщение. Если нет - проверь, точно ли ты есть в графике. \n— <b>Если есть</b> - сообщи @example_login об ошибке. \n— <b>Если тебя нет в графике</b> - напиши @aovlasova. Это ведь не нормально, наверное?`);
      }
    } else {
      ctx.telegram.sendMessage(ctx.message.from.id, `Хотел отправить тебе информацию о следующей смене, но не знаю твой стафф 😔 \n\nНапиши его, пожалуйста, @example_login`);
    }
  }
}
