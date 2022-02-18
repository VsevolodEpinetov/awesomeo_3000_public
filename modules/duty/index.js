const Telegraf = require('telegraf')

const dutySettings = require('./settings.json')
const serviceSettings = require('../service/settings.json')

const date = require('../date/index.js');
const utility = require('../utility/index.js');
const user = require('../users/index.js');
const settings = require('../settings.json')

module.exports = {

  sendTasks: function (ctx) {
    var activeTasks = [];
    if (!ctx.duty.tasks) ctx.duty.tasks = [];

    ctx.duty.tasks.active.forEach(task => {
      if (task.type === 'common') activeTasks.push(task);
    })

    if (activeTasks.length > 0) {
      var message = `<b>На данный момент есть ${activeTasks.length} `;
      if (activeTasks.length > 4) message += 'задач.</b>'
      else {
        if (activeTasks.length > 1) message += 'задачи.</b>'
        else message += 'задача.</b>'
      }
      message += '\n\n';

      var numberToShow = 0;

      activeTasks.forEach((task) => {
        numberToShow += 1;
        if (task.edits) {
          var timestampLatestEdit = task.edits[0].timestamp;
          var latestEdit = 0;
          task.edits.forEach((edit, editID) => {
            if (edit.timestamp > timestampLatestEdit)
              latestEdit = editID;
          })
          message += `${numberToShow}. ${task.edits[latestEdit].text} <i>(ред. ${date.getByTimestamp(task.edits[latestEdit].timestamp).string.DDMMhhmm})</i> <i>(${task.id})</i>\n`;
        } else {
          message += `${numberToShow}. ${task.text} <i>(${date.getByTimestamp(task.timestamp).string.DDMMhhmm})</i> <i>(${task.id})</i>\n`;
        }
      })

      const menuTasks = activeTasks.map((task, key) => Telegraf.Markup.callbackButton(parseInt(key) + 1, `actionShowMenuTaskDuty_localID${parseInt(key) + 1}_globalID${task.id}`))

      var amountOfColumns = 8;

      if (activeTasks.length > 8) amountOfColumns = activeTasks.length / 2

      ctx.replyWithHTML(message, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menuTasks, {
        columns: amountOfColumns
      })));

    } else {
      ctx.replyWithHTML('<b>Текущих задач нет</b> 🥳');
    }
  },


  sendServiceTasks: function (ctx) {
    var activeServiceTasks = [];
    var activeSeniorTasks = [];
    if (!ctx.duty.tasks) ctx.duty.tasks = [];

    ctx.duty.tasks.active.forEach((task) => {
      if (task.type === 'service') activeServiceTasks.push(task);
      if (task.type === 'senior') activeSeniorTasks.push(task);
    })

    if (activeServiceTasks.length > 0 || activeSeniorTasks.length > 0) {
      var message = 'На данный момент есть <b>';
      if (activeServiceTasks.length > 4)
        message += activeServiceTasks.length + ' сервисных задач</b>'
      else {
        if (activeServiceTasks.length > 1)
          message += activeServiceTasks.length + ' сервисные задачи</b>'
        else
          message += activeServiceTasks.length + ' сервисная задача</b>'
      }

      if (activeSeniorTasks.length > 4)
        message += ' и <b>' + activeSeniorTasks.length + ' задач для старших техников</b>'
      else {
        if (activeSeniorTasks.length > 1)
          message += ' и <b>' + activeSeniorTasks.length + ' задачи для старших техников</b>'
        else
          message += ' и <b>' + activeSeniorTasks.length + ' задача для старших техников</b>'
      }

      message += '\n\n';

      var numberToShow = 0;

      message += '<b>Сервисные задачи</b>\n'

      activeServiceTasks.forEach((task) => {
        numberToShow += 1;
        if (task.edits) {
          var timestampLatestEdit = task.edits[0].timestamp;
          var latestEdit = 0;
          task.edits.forEach((edit, editID) => {
            if (edit.timestamp > timestampLatestEdit)
              latestEdit = editID;
          })
          message += `${numberToShow}. ${task.edits[latestEdit].text} <i>(ред. ${date.getByTimestamp(task.edits[latestEdit].timestamp).string.DDMMhhmm})</i> <i>(${task.id})</i>\n`;
        } else {
          message += `${numberToShow}. ${task.text} <i>(${date.getByTimestamp(task.timestamp).string.DDMMhhmm})</i> <i>(${task.id})</i>\n`;
        }
      })

      var numberToShow = 0;

      message += '\n<b>Задачи для старших техников</b>\n'

      activeSeniorTasks.forEach((task) => {
        numberToShow += 1;
        if (task.edits) {
          var timestampLatestEdit = task.edits[0].timestamp;
          var latestEdit = 0;
          task.edits.forEach((edit, editID) => {
            if (edit.timestamp > timestampLatestEdit)
              latestEdit = editID;
          })
          message += `${numberToShow}. ${task.edits[latestEdit].text} <i>(ред. ${date.getByTimestamp(task.edits[latestEdit].timestamp).string.DDMMhhmm})</i> <i>(${task.id})</i>\n`;
        } else {
          message += `${numberToShow}. ${task.text} <i>(${date.getByTimestamp(task.timestamp).string.DDMMhhmm})</i> <i>(${task.id})</i>\n`;
        }
      })

      var menuTasks = activeServiceTasks.map((task, key) => Telegraf.Markup.callbackButton(`🔧 ${parseInt(key) + 1}`, `actionShowMenuTaskDuty_localID${parseInt(key) + 1}_globalID${task.id}`));

      activeSeniorTasks.forEach((task, key) => {
        menuTasks.push(Telegraf.Markup.callbackButton(`🦸‍♂️ ${parseInt(key) + 1}`, `actionShowMenuTaskDuty_localID${parseInt(key) + 1}_globalID${task.id}`))
      })

      if ((activeServiceTasks.length + activeSeniorTasks.length) > 8) {
        amountOfColumns = (activeServiceTasks.length + activeSeniorTasks.length) / 2;
      } else {
        amountOfColumns = 8;
      }

      ctx.replyWithHTML(message, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menuTasks, {
        columns: amountOfColumns
      })));

    } else {
      ctx.replyWithHTML('<b>Текущих задач нет</b> 🥳');
    }
  },


  notificateAboutAddingNewTask: function (ctx) {
    if (ctx.duty.flag) {
      ctx.replyWithHTML('Добавление задачи отменено.');
      ctx.duty.flag = 0;
    } else {
      ctx.replyWithHTML('Задача успешно добавлена!');
    }
  },



  parseAndWriteReport: function (ctx) {
    // For the report structure reference see dutySettings.json

    try {

      var errorsInReport = '';

      //
      // ## PARSING REPORT ## {--
      var indexWherePartStarts = [];

      for (var partNumber = 0; partNumber < dutySettings.report.length; partNumber++) {
        indexWherePartStarts[partNumber] = ctx.message.text.indexOf(dutySettings.report[partNumber].header);
        if (indexWherePartStarts[partNumber] < 0) {
          ctx.reply(`В твоём отчёте не хватает пункта "${dutySettings.report[partNumber].header}". Исправь это, пожалуйста.`);
          return;
        }
      }

      var text = ctx.message.text;

      ctx.userSession.report = {};

      dutySettings.report.forEach((part, partID) => {
        switch (partID) {
          case 0:
            var partOne = part.header;
            var partTwo = `\n\n${dutySettings.report[partID + 1].header}`;
            ctx.userSession.report[part.name] = text.split(partOne)[1].split(partTwo)[0];
            break;
          case (dutySettings.report.length - 1):
            ctx.userSession.report[part.name] = text.split(part.header)[1];
            break;
          default:
            var partOne = part.header;
            var partTwo = `\n${dutySettings.report[partID + 1].header}`;
            ctx.userSession.report[part.name] = text.split(partOne)[1].split(partTwo)[0];
        }

        if (ctx.userSession.report[part.name][0] === ' ') ctx.userSession.report[part.name] = ctx.userSession.report[part.name].substring(1, ctx.userSession.report[part.name].length)
        if (ctx.userSession.report[part.name][0] === '\n') ctx.userSession.report[part.name] = ctx.userSession.report[part.name].substring(1, ctx.userSession.report[part.name].length)

        if (ctx.userSession.report[part.name][ctx.userSession.report[part.name].length - 1] == '\n') ctx.userSession.report[part.name] = ctx.userSession.report[part.name].substring(0, ctx.userSession.report[part.name].length - 1)
      });

      ctx.userSession.report.telegramUsername = ctx.message.from.username;
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

      if (!ctx.duty.reports) ctx.duty.reports = {};
      if (!ctx.duty.reports[reportMonth]) ctx.duty.reports[reportMonth] = [];
      if (!ctx.duty.reports[reportMonth][reportDay]) ctx.duty.reports[reportMonth][reportDay] = [];

      ctx.duty.reports[reportMonth][reportDay].push(ctx.userSession.report)
      // --} ## END OF WRITE REPORT TO DATABASE ##
      //

      //
      // ## PARSE TASKS ## {--
      if (!ctx.duty.tasks) ctx.duty.tasks = {};
      if (!ctx.duty.tasks.total) ctx.duty.tasks.total = 0;
      if (!ctx.duty.tasks.active) ctx.duty.tasks.active = [];

      var amountOfAddedTasks = 0;

      var tasks = ctx.userSession.report.currentTasks;

      if (tasks.indexOf('- ') > -1) {
        tasks = tasks.slice(2);

        amountOfAddedTasks = tasks.split('\n- ').length;
        console.log(amountOfAddedTasks)

        tasks.split('\n- ').forEach(task => {
          ctx.duty.tasks.total++;
          ctx.duty.tasks.active.push({
            "telegramUsername": ctx.message.from.username,
            "timestamp": ctx.message.date,
            "text": task,
            "type": "common",
            "id": ctx.duty.tasks.total
          })
        })
      }
      // --} ## END OF PARSE TASKS ##
      //

      //
      // ## REMOVING FROM ACTIVE ATTENDANTS ## {--
      var attendantID = -1;
      ctx.duty.attendants.forEach((attendant, index) => {
        if (attendant.telegramUsername === ctx.message.from.username) attendantID = index;
      })
      if (attendantID > -1) {
        ctx.duty.attendants.splice(attendantID, 1);
      } else {
        errorsInReport += '\n— Тебя не было в списке дежурных. Пожалуйста, не забывай использовать /hi при заступлении на смену';
      }
      // --} ## END OF REMOVING FROM ACTIVE ATTENDANTS ##
      //

      //
      // ## GENERATE AND SEND MESSAGE ## {--
      var summaryMessage = 'Пока, @' + ctx.message.from.username + ', спасибо за смену!\n\n'

      if (amountOfAddedTasks > 1)
        summaryMessage += 'По твоему отчёту было добавлено <b>' + amountOfAddedTasks + ' задачи.</b>';
      else {
        if (amountOfAddedTasks === 0)
          summaryMessage += 'В твоём отчёте <b>не было обнаружено новых задач</b>';
        else
          summaryMessage += 'По твоему отчёту была успешно добавлена <b>' + amountOfAddedTasks + ' задача.</b>';
      }

      summaryMessage += '\nПосмотреть их можно с помощью команды /tasks'

      if (errorsInReport.length > 0) {
        summaryMessage += '\n\n<i>Ошибки в отчёте:</i>' + errorsInReport;
      }

      ctx.replyWithHTML(summaryMessage, Telegraf.Extra.inReplyTo(ctx.message.message_id));
      // --} ## END OF GENERATE AND SEND MESSAGE ##
      //
    }
    catch (err) {
      console.log(err);
      ctx.replyWithHTML('Что-то пошло не так. Убедись, что отчёт содержит все необходимые поля.')
    }

  },


  parseAndWriteReportService: function (ctx) {
    try {
      var errorsInReport = '';

      //
      // ## PARSING REPORT ## {--
      var indexWherePartStarts = [];
      for (var partNumber = 0; partNumber < serviceSettings.report.length; partNumber++) {
        indexWherePartStarts[partNumber] = ctx.message.text.indexOf(serviceSettings.report[partNumber].header);
        if (indexWherePartStarts[partNumber] < 0) {
          ctx.reply('В твоём отчёте не хватает пункта "' + serviceSettings.report[partNumber].header + '". Исправь это, пожалуйста.');
          return;
        }
      }

      var text = ctx.message.text;

      ctx.userSession.report = {};

      serviceSettings.report.forEach((part, partID) => {
        switch (partID) {
          case 0:
            var partOne = part.header;
            var partTwo = `\n\n${serviceSettings.report[partID + 1].header}`;
            ctx.userSession.report[part.name] = text.split(partOne)[1].split(partTwo)[0];
            break;
          case (serviceSettings.report.length - 1):
            ctx.userSession.report[part.name] = text.split(part.header)[1];
            break;
          default:
            var partOne = part.header;
            var partTwo = `\n${serviceSettings.report[partID + 1].header}`;
            ctx.userSession.report[part.name] = text.split(partOne)[1].split(partTwo)[0];
        }

        if (ctx.userSession.report[part.name][0] === ' ') ctx.userSession.report[part.name] = ctx.userSession.report[part.name].substring(1, ctx.userSession.report[part.name].length)
        if (ctx.userSession.report[part.name][0] === '\n') ctx.userSession.report[part.name] = ctx.userSession.report[part.name].substring(1, ctx.userSession.report[part.name].length)

        if (ctx.userSession.report[part.name][ctx.userSession.report[part.name].length - 1] == '\n') ctx.userSession.report[part.name] = ctx.userSession.report[part.name].substring(0, ctx.userSession.report[part.name].length - 1)
      });

      ctx.userSession.report.telegramUsername = ctx.message.from.username;
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

      if (!ctx.duty.service) ctx.duty.service = {};
      if (!ctx.duty.service.reports) ctx.duty.service.reports = {};

      if (typeof ctx.duty.service.reports[reportMonth] === "undefined")
        ctx.duty.service.reports[reportMonth] = [];

      if (typeof ctx.duty.service.reports[reportMonth][reportDay] === "undefined")
        ctx.duty.service.reports[reportMonth][reportDay] = [];

      ctx.duty.service.reports[reportMonth][reportDay].push(ctx.userSession.report)
      // --} ## END OF WRITE REPORT TO DATABASE ##
      //

      //
      // ## PARSE TASKS ## {--
      if (!ctx.duty.tasks) ctx.duty.tasks = {};
      if (!ctx.duty.tasks.total) ctx.duty.tasks.total = 0;
      if (!ctx.duty.tasks.active) ctx.duty.tasks.active = [];

      var amountOfAddedServiceTasks = 0;

      var tasks = ctx.userSession.report.tasksService;
      if (tasks.indexOf('-') > -1) {
        tasks = tasks.slice(2);

        amountOfAddedServiceTasks = tasks.split('\n- ').length;

        tasks.split('\n- ').forEach(task => {
          ctx.duty.tasks.total++;
          ctx.duty.tasks.active.push({
            "telegramUsername": ctx.message.from.username,
            "timestamp": ctx.message.date,
            "text": task,
            "type": "service",
            "id": ctx.duty.tasks.total
          })
        })
      }

      var amountOfAddedSeniorTasks = 0;

      var tasks = ctx.userSession.report.tasksSenior;
      if (tasks.indexOf('-') > -1) {
        tasks = tasks.slice(2);

        amountOfAddedSeniorTasks = tasks.split('\n- ').length;

        tasks.split('\n- ').forEach(task => {
          ctx.duty.tasks.total++;
          ctx.duty.tasks.active.push({
            "telegramUsername": ctx.message.from.username,
            "timestamp": ctx.message.date,
            "text": task,
            "type": "senior",
            "id": ctx.duty.tasks.total
          })
        })
      }
      // --} ## END OF PARSE TASKS ##
      //

      //
      // ## REMOVING FROM ACTIVE ATTENDANTS ## {--
      var attendantID = -1;
      ctx.duty.attendants.forEach((attendant, index) => {
        if (attendant.telegramUsername === ctx.message.from.username) attendantID = index;
      })
      if (attendantID > -1) {
        ctx.duty.attendants.splice(attendantID, 1);
      } else {
        errorsInReport += '\n— Тебя не было в списке дежурных. Пожалуйста, не забывай использовать /hi при заступлении на смену';
      }
      // --} ## END OF REMOVING FROM ACTIVE ATTENDANTS ##
      //

      //
      // ## GENERATE AND SEND MESSAGE ## {--
      var summaryMessage = 'Пока, @' + ctx.message.from.username + ', спасибо за смену!\n\n'

      if (amountOfAddedServiceTasks > 1)
        summaryMessage += 'По твоему отчёту было добавлено <b>' + amountOfAddedServiceTasks + ' сервисные задачи.</b>';
      else {
        if (amountOfAddedServiceTasks === 0)
          summaryMessage += 'В твоём отчёте <b>не было обнаружено новых сервисных задач</b>';
        else
          summaryMessage += 'По твоему отчёту была успешно добавлена <b>' + amountOfAddedServiceTasks + ' сервисная задача.</b>';
      }

      if (amountOfAddedSeniorTasks > 1)
        summaryMessage += '\nПо твоему отчёту было добавлено <b>' + amountOfAddedSeniorTasks + ' задачи для старших техников.</b>';
      else {
        if (amountOfAddedSeniorTasks === 0)
          summaryMessage += '\nВ твоём отчёте <b>не было обнаружено новых задач для старших техников</b>';
        else
          summaryMessage += '\nПо твоему отчёту была успешно добавлена <b>' + amountOfAddedSeniorTasks + ' задача для старших техников.</b>';
      }

      summaryMessage += '\nПосмотреть все задачи можно с помощью команды /service'

      if (errorsInReport.length > 0) {
        summaryMessage += '\n\n<i>Ошибки в отчёте:</i>' + errorsInReport;
      }

      ctx.replyWithHTML(summaryMessage, Telegraf.Extra.inReplyTo(ctx.message.message_id));
      // --} ## END OF GENERATE AND SEND MESSAGE ##
      //
    }
    catch (err) {
      console.log(err);
      ctx.replyWithHTML('Что-то пошло не так. Убедись, что отчёт содержит все необходимые поля.')
    }

  },



  greetAndWriteAttendant: function (ctx) {
    try {
      if (!ctx.duty.attendants) ctx.duty.attendants = [];

      var isntOnDuty = 1;
      ctx.duty.attendants.forEach(attendant => {
        if (attendant.telegramUsername === ctx.message.from.username) isntOnDuty = 0;
      })

      if (isntOnDuty) {
        ctx.duty.attendants.push({
          telegramUsername: ctx.message.from.username
        })

        var activeTasks = 0;
        var activeServiceTasks = 0;
        var activeSeniorTasks = 0;
        if (!ctx.duty.tasks) ctx.duty.tasks = {};
        if (!ctx.duty.tasks.active) ctx.duty.tasks = [];
        ctx.duty.tasks.active.forEach((task, taskID) => {
          if (!task.completed) {
            if (task.type === 'common') activeTasks++;
            if (task.type === 'senior') activeSeniorTasks++;
            if (task.type === 'service') activeServiceTasks++;
          }
        })

        var currentMinutes = date.getCurrent().minute;

        var userID = user.getIDByTelegramID(ctx, ctx.message.from.id);
        var idInSchedule = -1;
        for (var i = 0; i < ctx.duty.shifts.length; i++) {
          var Index = ctx.duty.shifts[i][0].indexOf('@');
          if (ctx.duty.shifts[i][0].substring(0, Index) === ctx.users.all[userID].info.staffUsername)
            idInSchedule = i;
        }

        /*if (idInSchedule < 0) {
          ctx.telegram.sendMessage(settings.chats.test.id, 'Не нашёл ' + ctx.users.all[userID].info.staffUsername + ' в графике');
        } else {
          if (ctx.duty.shifts[idInSchedule][date.getCurrent().dayOfWeek][date.getCurrent().hour] === 1) {
            if (currentMinutes > 4) {
              //ctx.telegram.sendMessage(settings.telegram_username_3ChatID, '@' + ctx.message.from.username + ' опоздал на <b>' + CurrentMinutes + '</b> мин.', Telegraf.Extra.HTML());
              ctx.telegram.sendMessage(settings.chats.test.id, '@' + ctx.message.from.username + ' опоздал на <b>' + currentMinutes + '</b> мин.', Telegraf.Extra.HTML());
            }
          }
        }*/

        var message = `Привет, @${ctx.message.from.username}! На текущий момент`;

        if (activeTasks === 0 && activeServiceTasks === 0 && activeSeniorTasks === 0) message += `<b>нет нерешённых задач</b> 🎉`
        else {
          message += ` есть:`

          if (activeTasks > 0) {
            var word = 'задачи'
            if (activeTasks === 1) word = `задача`
            if (activeTasks > 4) word = `задач`
            message += `\n— ${activeTasks} <b>${word}</b>`
          }

          if (activeServiceTasks > 0) {
            var word = 'сервисные задачи'
            if (activeServiceTasks === 1) word = `сервисная задача`
            if (activeServiceTasks > 4) word = `сервисных задач`
            message += `\n— ${activeServiceTasks} <b>${word}</b>`
          }

          if (activeSeniorTasks > 0) {
            var word = 'задачи для старших техников'
            if (activeSeniorTasks === 1) word = `задача для старших техников`
            if (activeSeniorTasks > 4) word = `задач для старших техников`
            message += `\n— ${activeSeniorTasks} <b>${word}</b>`
          }

          message += '\n\nЧтобы посмотреть '
          if (activeTasks > 0) message += `<b>обычные задачи</b>, испольуй /tasks`
          if (activeServiceTasks > 0 || activeSeniorTasks > 0) message += `, <b>сервисные или задачи для старших</b>, испольуй /service`
        }

        ctx.replyWithHTML(message);

        if (ctx.message.from.username !== "example_login")
          ctx.telegram.sendMessage(settings.chats.chats.id, '#дежурная_смена @' + ctx.message.from.username + ' заступил на дежурство!\n\nПосмотреть список всех дежурных можно с помощью команды /duty');
      } else {
        ctx.reply('Ты уже и так дежуришь 🤔');
      }
    }
    catch (err) {
      ctx.reply('Что-то пошло не так 😞 Попробуй поздороваться ещё раз');
      console.log(err);
    }
  },

  removeAttendant: function (ctx) {
    var attendantID = -1;
    ctx.duty.attendants.forEach((attendant, index) => {
      if (attendant.telegramUsername === ctx.message.from.username) attendantID = index;
    })
    if (attendantID > -1) {
      ctx.duty.attendants.splice(attendantID, 1);
      ctx.reply(`Пока, @${ctx.message.from.username}! Спасибо за смену!`);
    } else {
      ctx.reply('Тебя нет в списке дежурных 🤔');
    }
  },



  showTask: function (ctx) {
    try {
      var localTaskNumber = parseInt(ctx.callbackQuery.data.split('localID')[1].split('_')[0]);
      var taskID = parseInt(ctx.callbackQuery.data.split('globalID')[1]);
      var task;

      ctx.duty.tasks.active.forEach(taskTemp => {
        if (taskTemp.id == taskID) task = taskTemp;
      })

      //var numberToShow = parseInt(localTaskNumber) + 1;

      var message = `Просмотр `
      if (task.type === 'common') message += `<b>задачи</b>`
      if (task.type === 'service') message += `<b>сервисной задачи</b>`
      if (task.type === 'senior') message += `<b>задачи для старших техников</b>`
      message += ` <b>${localTaskNumber}</b> <i>(${task.id})</i>\n\n`;

      if (!ctx.duty.editing) ctx.duty.editing = [];
      if (!ctx.duty.completing) ctx.duty.completing = [];

      const taskMenuDuty = Telegraf.Extra
        .HTML()
        .markup((m) => m.inlineKeyboard([
          m.callbackButton('✅ Выполнить', `actionCompleteTaskDuty_localID${localTaskNumber}_globalID${task.id}`),
          m.callbackButton('✏️ Изменить', `actionEditTaskDuty_localID${localTaskNumber}_globalID${task.id}`),
          m.callbackButton('❌ Отмена', 'actionCancelProcedure')
        ], {
          columns: 2
      }))

      if (task.edits) {
        var timestampLatestEdit = task.edits[0].timestamp;
        var latestEdit = 0;
        task.edits.forEach((edit, editID) => {
          if (edit.timestamp > timestampLatestEdit)
            latestEdit = editID;
        })
        message += `${task.edits[latestEdit].text}\n\n<b>Время последнего редактирования задачи: </b>${date.getByTimestamp(task.edits[latestEdit].timestamp).string.DDMMhhmm}`;
      } else {
        message += `${task.text} \n\n<b>Время создания задачи: </b>${date.getByTimestamp(task.timestamp).string.DDMMhhmm}`;
      }
      ctx.replyWithHTML(message, taskMenuDuty);
      utility.hideMenu(ctx);
    } catch (err) {
      console.log(err);
    }
  },

  waitForTaskResolution: function (ctx) {
    try {
      var localTaskNumber = parseInt(ctx.callbackQuery.data.split('localID')[1].split('_')[0]);
      var taskID = parseInt(ctx.callbackQuery.data.split('globalID')[1]);
      var alreadyAwaiting = false;
      var task;
      var indexInArray;

      ctx.duty.tasks.active.forEach((taskTemp, i) => {
        if (taskTemp.id === taskID) {
          task = taskTemp;
          indexInArray = i;
        }
      })

      ctx.duty.completing.forEach(attendant => {
        if (attendant.telegramUsername === ctx.update.callback_query.from.username) {
          alreadyAwaiting = 1;
          task = attendant.task;
        }
      })

      if (!alreadyAwaiting) {
        ctx.duty.completing.push({
          telegramUsername: ctx.update.callback_query.from.username,
          task: task,
          arrayID: indexInArray,
          localTaskNumber: localTaskNumber
        })
        var message = `Пришли резолюцию для `
        if (task.type === 'common') message += `<b>задачи</b>`
        if (task.type === 'service') message += `<b>сервисной задачи</b>`
        if (task.type === 'senior') message += `<b>задачи для старших техников</b>`
        message += ` <b>№${localTaskNumber}</b> <i>(${task.id})</i> отдельным сообщением.\n\n<i>Резолюция должна содержать полную информацию об итогах решения данной задачи.</i>`

        ctx.replyWithHTML(message);
      } else {
        ctx.replyWithHTML(`Уже ожидаю от тебя резолюцию для задачи <b>№${task.id}</b>. После этого сможешь завершить задачу ${taskID}`);
      }
      utility.hideMenu(ctx);
    }
    catch (err) {
      console.log(err)
    }
  },


  writeResolutionForTaskAndNotificateTheCreator: function (ctx) {
    var botIsWaitingForResolution = false;
    var globalTaskNumber = -1;
    var localTaskNumber = -1;
    var attendantID;
    var task;
    var taskArrayID;

    ctx.duty.completing.forEach((attendant, index) => {
      if (attendant.telegramUsername === ctx.message.from.username) {
        task = attendant.task;
        taskArrayID = attendant.arrayID;
        localTaskNumber = attendant.localTaskNumber;
        attendantID = index;
      }
    })

    if (task) {
      var message = ``;

      if (task.type === 'common') message += `<b>Задача</b>`
      if (task.type === 'service') message += `<b>Сервисная задача</b>`
      if (task.type === 'senior') message += `<b>Задача для старших техников</b>`

      message += ` <b>№${localTaskNumber}</b> <i>(${task.id})</i> <b>успешно выполнена!</b>\n\n<b>Резолюция:</b> ${ctx.message.text}`

      ctx.replyWithHTML(message);

      try {
        if (task.telegramUsername !== ctx.message.from.username) {
          var userID = user.getIDByTelegramUsername(ctx, task.telegramUsername);

          message = `Твоя задача от ${date.getByTimestamp(task.timestamp).string.DDMMhhmm} была только что выполнена @${ctx.message.from.username}!\n\n<b>Задача:</b> ${task.text}\n<b>Резолюция:</b> ${ctx.message.text}`;

          if (userID > -1) ctx.telegram.sendMessage(ctx.users.all[userID].info.telegramID, message, Telegraf.Extra.HTML());
          else ctx.telegram.sendMessage(settings.chats.test.id, 'Пытался уведомить @' + task.telegramUsername + ', но не нашёл в списке пользователей');
        }
      }
      catch (err) {
        ctx.telegram.sendMessage(settings.chats.test.id, `Пытался уведомить @${task.telegramUsername} о завершении задачи, но что-то пошло не так`);
        console.log(err);
      }

      ctx.duty.completing.splice(attendantID, 1);
      ctx.duty.tasks.active.splice(taskArrayID, 1);
    }
  },



  waitForTaskEdit: function (ctx) {
    try {
      var localTaskNumber = parseInt(ctx.callbackQuery.data.split('localID')[1].split('_')[0]);
      var taskID = parseInt(ctx.callbackQuery.data.split('globalID')[1]);
      var alreadyAwaiting = false;
      var task;
      var indexInArray;

      if (!ctx.duty.editing) ctx.duty.editing = [];

      ctx.duty.editing.forEach(attendant => {
        if (attendant.telegramUsername === ctx.update.callback_query.from.username) {
          alreadyAwaiting = true;
          task = attendant.task;
        }
      })

      if (!alreadyAwaiting) {
        ctx.duty.tasks.active.forEach((taskTemp, i) => {
          if (taskTemp.id === taskID) {
            task = taskTemp;
            indexInArray = i;
          }
        })
        ctx.duty.editing.push({
          telegramUsername: ctx.update.callback_query.from.username,
          task: task,
          taskArrayID: indexInArray,
          localTaskNumber: localTaskNumber
        })

        var message = `Пришли новый текст для `
        if (task.type === 'common') message += `<b>задачи</b>`
        if (task.type === 'service') message += `<b>сервисной задачи</b>`
        if (task.type === 'senior') message += `<b>задачи для старших техников</b>`
        message += ` <b>№${localTaskNumber}</b> <i>(${task.id})</i> отдельным сообщением.`

        ctx.replyWithHTML(message);

      } else {
        ctx.replyWithHTML(`Уже ожидаю от тебя новый текст для задачи <b>№${task.id}</b>. После этого сможешь изменить задачу ${task.id}`);
      }
      utility.hideMenu(ctx);
    }
    catch (err) {
      console.log(err);
    }
  },


  writeNewTextForTask: function (ctx) {
    var localTaskNumber = -1;
    var attendantID = -1;
    var task;
    var taskArrayID;
    ctx.duty.editing.forEach((attendant, index) => {
      if (attendant.telegramUsername === ctx.message.from.username) {
        task = attendant.task;
        localTaskNumber = attendant.localTaskNumber;
        attendantID = index;
        taskArrayID = attendant.taskArrayID
      }
    })

    if (task) {
      if (!ctx.duty.tasks.active[taskArrayID].edits) ctx.duty.tasks.active[taskArrayID].edits = [];
      ctx.duty.tasks.active[taskArrayID].edits.push({
        "telegramUsername": ctx.message.from.username,
        "timestamp": ctx.message.date,
        "text": ctx.message.text
      })

      var message = ``;
      if (task.type === 'common') message += `<b>Задача</b>`
      if (task.type === 'service') message += `<b>Сервисная задача</b>`
      if (task.type === 'senior') message += `<b>Задача для старших техников</b>`
      message += ` <b>№${localTaskNumber}</b> <i>(${task.id})</i> <b>успешно сохранена!</b>\n\n<b>Новый текст задачи:</b> ${ctx.message.text}`;

      ctx.replyWithHTML(message);

      ctx.duty.editing.splice(attendantID, 1);
    }
  },


  askTypeOfNewTask: function (ctx) {
    const taskMenuDuty = Telegraf.Extra
      .HTML()
      .markup((m) => m.inlineKeyboard([
        m.callbackButton('Обычная', `actionAddNewTask_typecommon`),
        m.callbackButton('🔧 Сервисная', `actionAddNewTask_typeservice`),
        m.callbackButton('🦸‍♂️ Старшим', 'actionAddNewTask_typesenior')
      ], {
        columns: 3
    }))

    ctx.replyWithHTML(`Выбери тип добавляемой задачи`, taskMenuDuty);
  },


  waitForNewTask: function (ctx) {
    var type = ctx.callbackQuery.data.split('type')[1];
    var alreadyAwaiting = false;

    if (!ctx.duty.adding) ctx.duty.adding = [];
    ctx.duty.adding.forEach(attendant => {
      if (attendant.telegramUsername === ctx.from.username) alreadyAwaiting = true;
    })

    if (!alreadyAwaiting) {
      ctx.duty.adding.push({
        "telegramUsername": ctx.from.username,
        "type": type
      })
      var message = `Пришли текст для новой `
      if (type === 'common') message += `<b>задачи</b>`
      if (type === 'service') message += `<b>сервисной задачи</b>`
      if (type === 'senior') message += `<b>задачи для старших техников</b>`
      ctx.replyWithHTML(message)
      ctx.deleteMessage();
    } else {
      ctx.replyWithHTML(`Уже ожидаю от тебя текст для новой задачи, нет необходимости ещё раз использовать /add`);
    }
  },



  createNewTask: function (ctx) {
    var attendantID = -1;
    var type;

    ctx.duty.adding.forEach((attendant, index) => {
      if (attendant.telegramUsername === ctx.message.from.username) {
        attendantID = index;
        type = attendant.type;
      }
    })

    if (attendantID > -1) {
      ctx.duty.tasks.total++;
      ctx.duty.tasks.active.push({
        "telegramUsername": ctx.message.from.username,
        "timestamp": ctx.message.date,
        "text": ctx.message.text,
        "id": ctx.duty.tasks.total,
        "type": type
      })
      var message = ``;
      if (type === 'common') message += `<b>Задача</b>`
      if (type === 'service') message += `<b>Сервисная задача</b>`
      if (type === 'senior') message += `<b>Задача для старших техников</b>`
      message += ` <b>№${ctx.duty.tasks.total}</b> успешно добавлена!\n\n<b>Текст задачи:</b> ${ctx.message.text}`;

      ctx.replyWithHTML(message, Telegraf.Extra.inReplyTo(ctx.message.message_id));

      ctx.duty.adding.splice(attendantID, 1);
    }
  },



  askStationForNewServiceTask: function (ctx) {
    var stationsNames = ['Цветочный', 'Мейджор 47км', 'МКАД 18км Ауди', 'ФИО', '92-й км Автофорум Мерседес', 'Новая Рига БМВ', 'Сокольники Рено', 'Волоколамское шоссе Ниссан', 'Другое'];
    var stations = ['cvetochniy', '47', '18', 'sheremetyevo', '92', 'bmw', 'renault', 'nissan', 'misc'];
    const menu = Telegraf.Extra
      .HTML()
      .markup((m) => m.inlineKeyboard([
        m.callbackButton('Цветочный', `actionAddNewServiceTask_stationcvetochniy`),
        m.callbackButton('Мейджор 47км', `actionAddNewServiceTask_station47`),
        m.callbackButton('МКАД 18км Ауди', 'actionAddNewServiceTask_station18'),
        m.callbackButton('ФИО', 'actionAddNewServiceTask_stationsheremetyevo'),
        m.callbackButton('92-й км Автофорум Мерседес', 'actionAddNewServiceTask_station92'),
        m.callbackButton('Новая Рига БМВ', 'actionAddNewServiceTask_stationbmw'),
        m.callbackButton('Сокольники Рено', 'actionAddNewServiceTask_stationrenault'),
        m.callbackButton('Волоколамское шоссе Ниссан', 'actionAddNewServiceTask_stationnissan'),
        m.callbackButton('Другое', 'actionAddNewServiceTask_stationmisc')
      ], {
        columns: 1
    }))

    ctx.replyWithHTML(`Выбери <b>станцию</b>, к которой относится задача`, menu);
  },



  waitForNewServiceTask: function (ctx) {
    var station = ctx.callbackQuery.data.split('station')[1];
    var alreadyAwaiting = false;

    if (!ctx.duty.addingService) ctx.duty.addingService = [];
    ctx.duty.addingService.forEach(attendant => {
      if (attendant.telegramUsername === ctx.from.username) alreadyAwaiting = true;
    })

    if (!alreadyAwaiting) {
      ctx.duty.addingService.push({
        "telegramUsername": ctx.from.username,
        "station": station
      })

      var message = `Пришли текст для новой задачи для станции `

      switch (station) {
        case 'cvetochniy':
          message += '<b>Цветочный</b>'
          break;
        case '47':
          message += '<b>Мейджор 47км</b>'
          break;
        case '18':
          message += '<b>МКАД 18км Ауди</b>'
          break;
        case 'sheremetyevo':
          message += '<b>ФИО</b>'
          break;
        case '92':
          message += '<b>92-й км Автофорум Мерседес</b>'
          break;
        case 'bmw':
          message += '<b>Новая Рига БМВ</b>'
          break;
        case 'renault':
          message += '<b>Сокольники Рено</b>'
          break;
        case 'nissan':
          message += '<b>Волоколамское шоссе Ниссан</b>'
          break;
        case 'misc':
          message += '<b>Другое</b>'
          break;
        default:
          message += '<b>неизвестная станция</b>'
      }
      ctx.replyWithHTML(message)
      ctx.deleteMessage();
    } else {
      ctx.replyWithHTML(`Уже ожидаю от тебя текст для новой задачи, нет необходимости ещё раз использовать /add`);
    }
  },


  createNewServiceTask: function (ctx) {
    var attendantID = -1;
    var station;

    ctx.duty.addingService.forEach((attendant, index) => {
      if (attendant.telegramUsername === ctx.message.from.username) {
        attendantID = index;
        station = attendant.station;
      }
    })

    if (attendantID > -1) {
      if (!ctx.duty.service) ctx.duty.service = {};
      if (!ctx.duty.service.tasks) ctx.duty.service.tasks = {};
      if (!ctx.duty.service.tasks.total) ctx.duty.service.tasks.total = 0;
      if (!ctx.duty.service.tasks.active) ctx.duty.service.tasks.active = [];
      ctx.duty.service.tasks.total++;
      ctx.duty.service.tasks.active.push({
        "telegramUsername": ctx.message.from.username,
        "timestamp": ctx.message.date,
        "text": ctx.message.text,
        "id": ctx.duty.service.tasks.total,
        "station": station
      })
      var message = `Задача для станции `;
      switch (station) {
        case 'cvetochniy':
          message += '<b>Цветочный</b>'
          break;
        case '47':
          message += '<b>Мейджор 47км</b>'
          break;
        case '18':
          message += '<b>МКАД 18км Ауди</b>'
          break;
        case 'sheremetyevo':
          message += '<b>ФИО</b>'
          break;
        case '92':
          message += '<b>92-й км Автофорум Мерседес</b>'
          break;
        case 'bmw':
          message += '<b>Новая Рига БМВ</b>'
          break;
        case 'renault':
          message += '<b>Сокольники Рено</b>'
          break;
        case 'nissan':
          message += '<b>Волоколамское шоссе Ниссан</b>'
          break;
        case 'misc':
          message += '<b>Другое</b>'
          break;
        default:
          message += '<b>неизвестная станция</b>'
      }
      message += ` успешно добавлена!\n\n<b>Текст задачи:</b> ${ctx.message.text}`;

      ctx.replyWithHTML(message, Telegraf.Extra.inReplyTo(ctx.message.message_id));

      ctx.duty.addingService.splice(attendantID, 1);
    }
  },


  sendSeniorTasks: async function (ctx) {
    var activeTasks = {};
    if (!ctx.duty.service) ctx.duty.service = {};
    if (!ctx.duty.service.tasks) ctx.duty.service.tasks = {};
    if (!ctx.duty.service.tasks.total) ctx.duty.service.tasks.total = 0;
    if (!ctx.duty.service.tasks.active) ctx.duty.service.tasks.active = [];

    var stationsNames = ['Цветочный', 'Мейджор 47км', 'МКАД 18км Ауди', 'ФИО', '92-й км Автофорум Мерседес', 'Новая Рига БМВ', 'Сокольники Рено', 'Волоколамское шоссе Ниссан', 'Другое'];
    var stations = ['cvetochniy', '47', '18', 'sheremetyevo', '92', 'bmw', 'renault', 'nissan', 'misc'];

    ctx.duty.service.tasks.active.forEach(task => {
      if (!activeTasks[task.station]) activeTasks[task.station] = [];
      activeTasks[task.station].push(task)
    })

    if (ctx.duty.service.tasks.active.length > 0) {
      var message = `<b>На данный момент есть ${ctx.duty.service.tasks.active.length} `;
      if (ctx.duty.service.tasks.active.length > 4) message += 'задач:</b>'
      else {
        if (ctx.duty.service.tasks.active.length > 1) message += 'задачи:</b>'
        else message += 'задача:</b>'
      }

      for (const station in activeTasks) {
        var index = stations.indexOf(station);
        var name = stationsNames[index];

        message += `\n— ${activeTasks[station].length} по станции <b>${name}</b>`
      }

      message += '\n';

      var menu = [];

      for (const station in activeTasks) {
        var index = stations.indexOf(station);
        var name = stationsNames[index];
        message += `\n<b>${name}</b>\n`
        var numberToShow = 0;
        activeTasks[station].forEach(task => {
          numberToShow++;
          menu.push(Telegraf.Markup.callbackButton(`${numberToShow} (${task.id})`, `actionShowMenuTaskService_localID${numberToShow}_globalID${task.id}_station${station}`))
          if (task.edits) {
            var timestampLatestEdit = task.edits[0].timestamp;
            var latestEdit = 0;
            task.edits.forEach((edit, editID) => {
              if (edit.timestamp > timestampLatestEdit)
                latestEdit = editID;
            })
            message += `${numberToShow}. ${task.edits[latestEdit].text} <i>(ред. ${date.getByTimestamp(task.edits[latestEdit].timestamp).string.DDMMhhmm})</i> <i>(${task.id})</i>\n`;
          } else {
            message += `${numberToShow}. ${task.text} <i>(${date.getByTimestamp(task.timestamp).string.DDMMhhmm})</i> <i>(${task.id})</i>\n`;
          }
        })
      }

      var amountOfColumns = 8;

      if (ctx.duty.service.tasks.active.length > 8) amountOfColumns = ctx.duty.service.tasks.active.length / 2;


      var menuSpecial = [];
      var messageSpecial = `Также можешь выбрать массовое действие по задачам, если есть необходимость`

      for (const station in activeTasks) {
        var index = stations.indexOf(station);
        var name = stationsNames[index];
        menuSpecial.push(Telegraf.Markup.callbackButton(`Завершить задачи ${name}`, `actionDeleteServiceTaskByStation_station${station}`))
      }
      menuSpecial.push(Telegraf.Markup.callbackButton(`Завершить все задачи`, `actionDeleteAllServiceTasks`))

      await ctx.replyWithHTML(message, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menu, {
        columns: amountOfColumns
      })));
      ctx.replyWithHTML(messageSpecial, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menuSpecial, {
        columns: 1
      })));
    } else {
      ctx.replyWithHTML('<b>Текущих задач нет</b> 🥳');
    }
  },


  askDeleteOrNotByStation: function (ctx) {
    var station = ctx.callbackQuery.data.split('station')[1];
    var stationsNames = ['Цветочный', 'Мейджор 47км', 'МКАД 18км Ауди', 'ФИО', '92-й км Автофорум Мерседес', 'Новая Рига БМВ', 'Сокольники Рено', 'Волоколамское шоссе Ниссан', 'Другое'];
    var stations = ['cvetochniy', '47', '18', 'sheremetyevo', '92', 'bmw', 'renault', 'nissan', 'misc'];
    var index = stations.indexOf(station);
    var name = stationsNames[index];

    var message = `Точно завершить все задачи по станции <b>${name}</b>?`;
    const menu = Telegraf.Extra
      .HTML()
      .markup((m) => m.inlineKeyboard([
        m.callbackButton('✅ Да, завершить', `actionConfirmDeleteByStation_station${station}`),
        m.callbackButton('❌ Нет, ошибочка вышла', `actionCancelProcedure`)
      ], {
        columns: 2
    }))

    ctx.replyWithHTML(message, menu);
    ctx.deleteMessage();
  },

  askDeleteOrNotAll: function (ctx) {
    var message = `Точно завершить все задачи по <b>всем станциям</b>?`;
    const menu = Telegraf.Extra
      .HTML()
      .markup((m) => m.inlineKeyboard([
        m.callbackButton('✅ Да, завершить ВСЕ задачи', `actionConfirmDeleteAll`),
        m.callbackButton('❌ Нет, ошибочка вышла', `actionCancelProcedure`)
      ], {
        columns: 2
    }))

    ctx.replyWithHTML(message, menu);
    ctx.deleteMessage();
  },


  deleteAllServiceTasks: function (ctx) {
    ctx.duty.service.tasks.active = [];
    ctx.replyWithHTML('Завершил все задачи по всем станциям');
    ctx.deleteMessage();
  },

  deleteAllServiceTasksByStation: function (ctx) {
    var station = ctx.callbackQuery.data.split('station')[1];
    var stationsNames = ['Цветочный', 'Мейджор 47км', 'МКАД 18км Ауди', 'ФИО', '92-й км Автофорум Мерседес', 'Новая Рига БМВ', 'Сокольники Рено', 'Волоколамское шоссе Ниссан', 'Другое'];
    var stations = ['cvetochniy', '47', '18', 'sheremetyevo', '92', 'bmw', 'renault', 'nissan', 'misc'];
    var index = stations.indexOf(station);
    var name = stationsNames[index];

    var indexes = [];

    ctx.duty.service.tasks.active.forEach((task, i) => {
      if (task.station === station) indexes.push(i)
    });

    indexes.sort((a, b) => b - a);

    indexes.forEach(index => {
      ctx.duty.service.tasks.active.splice(index, 1);
    })

    ctx.replyWithHTML(`<b>Завершил все задачи</b> по станции <b>${name}</b>`);
    ctx.deleteMessage();
  },


  showTaskService: function (ctx) {
    try {
      var localTaskNumber = parseInt(ctx.callbackQuery.data.split('localID')[1].split('_')[0]);
      var taskID = parseInt(ctx.callbackQuery.data.split('globalID')[1].split('_')[0]);
      var station = ctx.callbackQuery.data.split('station')[1];
      var stationsNames = ['Цветочный', 'Мейджор 47км', 'МКАД 18км Ауди', 'ФИО', '92-й км Автофорум Мерседес', 'Новая Рига БМВ', 'Сокольники Рено', 'Волоколамское шоссе Ниссан', 'Другое'];
      var stations = ['cvetochniy', '47', '18', 'sheremetyevo', '92', 'bmw', 'renault', 'nissan', 'misc'];
      var index = stations.indexOf(station);
      var name = stationsNames[index];
      var task;

      ctx.duty.service.tasks.active.forEach(taskTemp => {
        if (taskTemp.id == taskID) task = taskTemp;
      })

      //var numberToShow = parseInt(localTaskNumber) + 1;

      console.log(station)
      console.log(index)
      console.log(name)
      var message = `Просмотр задачи <b>№${localTaskNumber}</b> <i>(${taskID})</i> для станции <b>${name}</b>`

      if (!ctx.duty.editingService) ctx.duty.editingService = [];
      if (!ctx.duty.completingService) ctx.duty.completingService = [];

      const menu = Telegraf.Extra
        .HTML()
        .markup((m) => m.inlineKeyboard([
          m.callbackButton('✅ Выполнить', `actionCompleteTaskService_localID${localTaskNumber}_globalID${task.id}_station${station}`),
          m.callbackButton('✏️ Изменить', `actionEditTaskService_localID${localTaskNumber}_globalID${task.id}_station${station}`),
          m.callbackButton('❌ Отмена', 'actionCancelProcedure')
        ], {
          columns: 2
      }))

      message += `\n\n`;

      if (task.edits) {
        var timestampLatestEdit = task.edits[0].timestamp;
        var latestEdit = 0;
        task.edits.forEach((edit, editID) => {
          if (edit.timestamp > timestampLatestEdit)
            latestEdit = editID;
        })
        message += `${task.edits[latestEdit].text}\n\n<b>Время последнего редактирования задачи: </b>${date.getByTimestamp(task.edits[latestEdit].timestamp).string.DDMMhhmm}`;
      } else {
        message += `${task.text} \n\n<b>Время создания задачи: </b>${date.getByTimestamp(task.timestamp).string.DDMMhhmm}`;
      }
      ctx.replyWithHTML(message, menu);
      utility.hideMenu(ctx);
    } catch (err) {
      console.log(err);
    }
  },


  waitForServiceTaskResolution: function (ctx) {
    try {
      var localTaskNumber = parseInt(ctx.callbackQuery.data.split('localID')[1].split('_')[0]);
      var taskID = parseInt(ctx.callbackQuery.data.split('globalID')[1].split('_')[0]);
      var station = ctx.callbackQuery.data.split('station')[1];
      var stationsNames = ['Цветочный', 'Мейджор 47км', 'МКАД 18км Ауди', 'ФИО', '92-й км Автофорум Мерседес', 'Новая Рига БМВ', 'Сокольники Рено', 'Волоколамское шоссе Ниссан', 'Другое'];
      var stations = ['cvetochniy', '47', '18', 'sheremetyevo', '92', 'bmw', 'renault', 'nissan', 'misc'];
      var index = stations.indexOf(station);
      var name = stationsNames[index];
      var alreadyAwaiting = false;
      var task;
      var indexInArray;

      ctx.duty.service.tasks.active.forEach((taskTemp, i) => {
        if (taskTemp.id === taskID) {
          task = taskTemp;
          indexInArray = i;
        }
      })

      ctx.duty.completingService.forEach(attendant => {
        if (attendant.telegramUsername === ctx.update.callback_query.from.username) {
          alreadyAwaiting = 1;
          task = attendant.task;
        }
      })

      if (!alreadyAwaiting) {
        ctx.duty.completingService.push({
          telegramUsername: ctx.update.callback_query.from.username,
          task: task,
          arrayID: indexInArray,
          localTaskNumber: localTaskNumber,
          station: station,
          stationName: name
        })
        var message = `Пришли резолюцию для задачи №${localTaskNumber} станции <b>${name}</b> отдельным сообщением.\n\n<i>Резолюция должна содержать полную информацию об итогах решения данной задачи.</i>`
        ctx.replyWithHTML(message);
      } else {
        ctx.replyWithHTML(`Уже ожидаю от тебя резолюцию для задачи <b>№${task.id}</b>. После этого сможешь завершить задачу ${taskID}`);
      }
      utility.hideMenu(ctx);
    }
    catch (err) {
      console.log(err)
    }
  },


  writeResolutionForServiceTask: function (ctx) {
    var botIsWaitingForResolution = false;
    var globalTaskNumber = -1;
    var localTaskNumber = -1;
    var attendantID;
    var task;
    var taskArrayID;
    var station;
    var stationName;

    ctx.duty.completingService.forEach((attendant, index) => {
      if (attendant.telegramUsername === ctx.message.from.username) {
        task = attendant.task;
        taskArrayID = attendant.arrayID;
        localTaskNumber = attendant.localTaskNumber;
        attendantID = index;
        station = attendant.station;
        stationName = attendant.stationName;
      }
    })

    if (task) {
      var message = `Задача <b>№${localTaskNumber}</b> <i>(${task.id})</i> по станции <b>${stationName}</b> <b>успешно выполнена!</b>\n\n<b>Резолюция:</b> ${ctx.message.text}`;

      ctx.replyWithHTML(message);

      ctx.duty.completingService.splice(attendantID, 1);
      ctx.duty.service.tasks.active.splice(taskArrayID, 1);
    }
  },



  waitForServiceTaskEdit: function (ctx) {
    try {
      var localTaskNumber = parseInt(ctx.callbackQuery.data.split('localID')[1].split('_')[0]);
      var taskID = parseInt(ctx.callbackQuery.data.split('globalID')[1].split('_')[0]);
      var station = ctx.callbackQuery.data.split('station')[1];
      var stationsNames = ['Цветочный', 'Мейджор 47км', 'МКАД 18км Ауди', 'ФИО', '92-й км Автофорум Мерседес', 'Новая Рига БМВ', 'Сокольники Рено', 'Волоколамское шоссе Ниссан', 'Другое'];
      var stations = ['cvetochniy', '47', '18', 'sheremetyevo', '92', 'bmw', 'renault', 'nissan', 'misc'];
      var index = stations.indexOf(station);
      var name = stationsNames[index];
      var alreadyAwaiting = false;
      var task;
      var indexInArray;

      if (!ctx.duty.editingService) ctx.duty.editingService = [];

      ctx.duty.editingService.forEach(attendant => {
        if (attendant.telegramUsername === ctx.update.callback_query.from.username) {
          alreadyAwaiting = true;
          task = attendant.task;
        }
      })

      if (!alreadyAwaiting) {
        ctx.duty.service.tasks.active.forEach((taskTemp, i) => {
          if (taskTemp.id === taskID) {
            task = taskTemp;
            indexInArray = i;
          }
        })
        ctx.duty.editingService.push({
          telegramUsername: ctx.update.callback_query.from.username,
          task: task,
          taskArrayID: indexInArray,
          localTaskNumber: localTaskNumber,
          station: station,
          stationName: name
        })

        var message = `Пришли новый текст для задачи <b>№${localTaskNumber}</b> <i>(${task.id})</i> по станции <b>${name}</b> отдельным сообщением.`

        ctx.replyWithHTML(message);

      } else {
        ctx.replyWithHTML(`Уже ожидаю от тебя новый текст для задачи <b>№${task.id}</b>. После этого сможешь изменить задачу ${task.id}`);
      }
      utility.hideMenu(ctx);
    }
    catch (err) {
      console.log(err);
    }
  },


  writeNewTextForServiceTask: function (ctx) {
    var globalTaskNumber = -1;
    var localTaskNumber = -1;
    var attendantID;
    var task;
    var taskArrayID;
    var station;
    var stationName;
    ctx.duty.editingService.forEach((attendant, index) => {
      if (attendant.telegramUsername === ctx.message.from.username) {
        task = attendant.task;
        localTaskNumber = attendant.localTaskNumber;
        attendantID = index;
        taskArrayID = attendant.taskArrayID;
        station = attendant.station;
        stationName = attendant.stationName;
      }
    })

    if (task) {
      if (!ctx.duty.service.tasks.active[taskArrayID].edits) ctx.duty.service.tasks.active[taskArrayID].edits = [];
      ctx.duty.service.tasks.active[taskArrayID].edits.push({
        "telegramUsername": ctx.message.from.username,
        "timestamp": ctx.message.date,
        "text": ctx.message.text
      })

      var message = `Задача <b>№${localTaskNumber}</b> <i>(${task.id})</i> по станции <b>${stationName}</b> <b>успешно сохранена!</b>\n\n<b>Новый текст задачи:</b> ${ctx.message.text}`;

      ctx.replyWithHTML(message);

      ctx.duty.editingService.splice(attendantID, 1);
    }
  }
}
