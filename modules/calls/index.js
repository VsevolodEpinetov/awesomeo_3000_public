const Telegraf = require('telegraf')

const date = require('../date/index.js');
const utility = require('../utility/index.js');
const settings = require('../settings.json')

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

const callsMenu = Telegraf.Extra
  .HTML()
  .markup((m) => m.inlineKeyboard([
    m.callbackButton('Сдать дежурство', 'resetcallsduty'),
    m.callbackButton('Заступить на дежурство', 'startcallsduty'),
    m.callbackButton('Отмена', 'cancelprocedure')
  ], {
    columns: 2
}))

module.exports = {


  showAttendantMenuOutgoingCalls: function (ctx) {

    try {
      if (typeof ctx.calls.attendants === 'undefined') ctx.calls.attendants = [];
      if (ctx.calls.attendants.length === 0)
        ctx.reply('Выберите нужное действие с дежурством на исходящих звонках.\n<i>Сейчас дежурного нет.</i>', callsMenu);
      else {
        if (ctx.calls.attendants.length === 1) {
          ctx.reply(`Выберите нужное действие с дежурством на исходящих звонках.\n<i>Сейчас дежурит</i> @${ctx.calls.attendants[0].telegramUsername}`, callsMenu);
        } else {
          var attendants = '';
          ctx.calls.attendants.forEach (operator => {
            attendants += ' @' + operator.telegramUsername;
          })
          ctx.reply(`Выберите нужное действие с дежурством на исходящих звонках.\n<i>Сейчас дежурят</i>${attendants}`, callsMenu);
        }
      }
    }
    catch (error) {
      console.log(error);
      ctx.replyWithHTML('Что-то пошло не так :( Попробуй использовать команду ещё раз, если не получится - скажи Севе', Telegraf.Extra.inReplyTo(ctx.message.message_id));
    }
  },


  showAttendantMenu: function (ctx) {

    try {
      if (typeof ctx.session.attendants === 'undefined') {
        ctx.session.attendants = [];
      }
      if (ctx.session.attendants.length === 0)
        ctx.reply('Выберите нужное действие с дежурством на исходящих звонках.\n<i>Сейчас дежурного нет.</i>', callsMenu);
      else {
        if (ctx.session.attendants.length === 1) {
          ctx.reply(`Выберите нужное действие с дежурством на исходящих звонках.\n<i>Сейчас дежурит</i> @${ctx.session.attendants[0]}`, callsMenu);
        } else {
          var attendants = '';
          ctx.session.attendants.forEach (operator => {
            attendants += ' @' + operator;
          })
          ctx.reply(`Выберите нужное действие с дежурством на исходящих звонках.\n<i>Сейчас дежурят</i>${attendants}`, callsMenu);
        }
      }
    }
    catch (error) {
      console.log(`Got an error during showing attendant menu in chat for outgoing calls:\n${error}`);
      ctx.replyWithHTML('Что-то пошло не так :( Попробуй использовать команду ещё раз, если не получится - скажи Севе', Telegraf.Extra.inReplyTo(ctx.message.message_id));
    }
  },



  writeAttendantOutgoingCalls: function (ctx) {

    try {
      var operatorID = -1;
      ctx.calls.attendants.forEach ((operator, id) => {
        if (ctx.update.callback_query.from.username === operator.telegramUsername)
          operatorID = id
      })
      if (operatorID < 0) {
        ctx.calls.attendants.push({
          telegramUsername: ctx.from.username
        });
        ctx.reply(`@${ctx.from.username} заступил на дежурство.`);
        ctx.answerCbQuery('Ты заступил на дежурство!');
      } else {
        ctx.replyWithHTML('Ты уже и так дежуришь');
      }
      utility.hideMenu(ctx);
    }
    catch (error) {
      console.log(`Got an error during adding attendant in chat for outgoing calls:\n${error}`);
      ctx.replyWithHTML('Что-то пошло не так :( Попробуй заступить на дежурство ещё раз, если не получится - скажи Севе');
    }
  },



  writeAttendant: function (ctx) {

    try {
      ctx.session.attendants.push(ctx.from.username);
      ctx.reply(`@${ctx.from.username} заступил на дежурство.`);
      ctx.answerCbQuery('Ты заступил на дежурство!');
      utility.hideMenu(ctx);
    }
    catch (error) {
      console.log(`Got an error during adding attendant in chat for vialotions etc. calls:\n${error}`);
      ctx.replyWithHTML('Что-то пошло не так :( Попробуй заступить на дежурство ещё раз, если не получится - скажи Севе');
    }
  },



  removeAttendantOutgoingCalls: function (ctx) {

    try {
      var operatorID = -1;
      ctx.calls.attendants.forEach((operator, id) => {
        if (ctx.from.username === operator.telegramUsername) {
          operatorID = id;
        }
      })
      if (operatorID < 0) {
        utility.hideMenu(ctx);
        ctx.reply('Тебя не было на дежурстве 🤔');
      }
      else {
        if (ctx.calls.seniorsOnShift.length > 0) {
          var mentions = ``;
          ctx.calls.seniorsOnShift.forEach(senior => {
            mentions += `@${senior}, `
          })
          ctx.replyWithHTML(`@${ctx.from.username} сдал дежурство.\n\n${mentions}назначьте нового дежурного!`);
        } else {
          ctx.replyWithHTML(`@${ctx.from.username} сдал дежурство.\n\nПохоже, что ни одного старшего нет на смене. Если ты знаешь, кто сейчас на смене - призови его сюда`);
        }
        if (ctx.calls.attendants[operatorID].task) ctx.calls.active.push(ctx.calls.attendants[operatorID].task);
        ctx.calls.attendants.splice(operatorID, 1);
        utility.hideMenu(ctx);
        ctx.answerCbQuery('Дежурство сдано!');
      }
    }
    catch (error) {
      console.log(`Got an error during removing attendant in chat for outgoing calls:\n${error}`);
      ctx.replyWithHTML('Что-то пошло не так :( Попробуй сдать дежурство ещё раз, если не получится - скажи Севе');
    }
  },

  removeAttendantOutgoingCallsForcefully: function (ctx) {
    try {
      let telegramUsername = utility.getCommandParameter(ctx);
      if (typeof telegramUsername !== 'undefined') {
        if (telegramUsername.indexOf('@') > -1) telegramUsername = telegramUsername.split('@')[1];
        var operatorID = -1;
        ctx.calls.attendants.forEach((operator, id) => {
          if (telegramUsername === operator.telegramUsername) {
            operatorID = id;
          }
        })
        if (operatorID < 0) {
          ctx.reply(`@${telegramUsername} не было на дежурстве 🤔`);
        }
        else {
          ctx.replyWithHTML(`@${telegramUsername} был успешно сброшен с дежурства`);
          if (ctx.calls.attendants[operatorID].task) ctx.calls.active.push(ctx.calls.attendants[operatorID].task);
          ctx.calls.attendants.splice(operatorID, 1);
        }
      } else {
        ctx.calls.attendants = [];
        ctx.replyWithHTML(`Список дежурных успешно обнулён`);
      }
    }
    catch (error) {
      console.log(`Got an error during removing attendant in chat for outgoing calls:\n${error}`);
      ctx.replyWithHTML('Что-то пошло не так :( Попробуй сдать дежурство ещё раз, если не получится - скажи Севе');
    }
  },

  removeAttendantForcefully: function (ctx) {
    try {
      let telegramUsername = utility.getCommandParameter(ctx);
      if (typeof telegramUsername !== 'undefined') {
        if (telegramUsername.indexOf('@') > 0) telegramUsername = telegramUsername.split('@')[1];
        var index = -1;
        ctx.session.attendants.forEach((operator, id) => {
          if (telegramUsername === operator.telegramUsername) {
            index = id;
          }
        })
        if (index < 0) {
          ctx.reply(`@${telegramUsername} не было на дежурстве 🤔`);
        }
        else {
          ctx.replyWithHTML(`@${telegramUsername} был успешно сброшен с дежурства`);
          ctx.session.attendants.splice(index, 1);
        }
      } else {
        ctx.session.attendants = [];
        ctx.replyWithHTML(`Список дежурных успешно обнулён`);
      }
    }
    catch (error) {
      console.log(`Got an error during removing attendant in chat for outgoing calls:\n${error}`);
      ctx.replyWithHTML('Что-то пошло не так :( Попробуй сдать дежурство ещё раз, если не получится - скажи Севе');
    }
  },

  removeAttendant: function (ctx) {

    try {
      var index = -1;
      ctx.session.attendants.forEach((operator, id) => {
        if (operator === ctx.from.username)
          index = id;
      })
      if (index < 0) {
        utility.hideMenu(ctx);
        ctx.reply('Тебя не было на дежурстве 🤔');
      }
      else {
        if (ctx.calls.seniorsOnShift.length > 0) {
          var mentions = ``;
          ctx.calls.seniorsOnShift.forEach(senior => {
            mentions += `@${senior}, `
          })
          ctx.replyWithHTML(`@${ctx.from.username} сдал дежурство. <b>Не забудь залогиниться на линию входящих!</b>\n\n${mentions}назначьте нового дежурного!`);
        } else {
          ctx.replyWithHTML(`@${ctx.from.username} сдал дежурство. <b>Не забудь залогиниться на линию входящих!</b>\n\nПохоже, что ни одного старшего нет на смене. Если ты знаешь, кто сейчас на смене - призови его сюда`);
        }
        utility.hideMenu(ctx);
        ctx.answerCbQuery('Дежурство сдано!');
        ctx.session.attendants.splice(index, 1);
      }
    }
    catch (error) {
      console.log(`Got an error during removing attendant in chat for outgoing calls:\n${error}`);
      ctx.replyWithHTML('Что-то пошло не так :( Попробуй сдать дежурство ещё раз, если не получится - скажи Севе');
    }
  },



  assignTask: function (ctx) {
    var operatorID = -1;
    var tasksInWork = [];

    ctx.calls.attendants.forEach((operator, id) => {
      if (ctx.message.from.username === operator.telegramUsername) operatorID = id
      if (typeof operator.task !== 'undefined') tasksInWork.push(operator.task)
    })

    if (operatorID > -1) {
      if (!ctx.calls.attendants[operatorID].task) {

        if (ctx.calls.active.length > 0) {
          var taskWasFound = false;
          var message = '';
          var taskID = -1;
          var maxPriority = 0;

          for (let i = 0; i < settings.calls.queues.length; i++) {
            settings.calls.queues.forEach(queue => {
              if (maxPriority < queue.priority) maxPriority = queue.priority;
            })
          }

          for (priority = maxPriority; priority > 0; priority--) {
            for (let i = 0; i < ctx.calls.active.length; i++) {
              if (!task) {
                if (ctx.calls.active[i].priority === priority) {
                  if (ctx.calls.active[i].lockedDue) {
                    if (ctx.message.date > ctx.calls.active[i].lockedDue) {
                      var task = ctx.calls.active[i];
                      taskID = i;
                      break;
                    }
                  } else {
                    var task = ctx.calls.active[i];
                    taskID = i;
                    break;
                  }
                }
              }
            }
          }

          if (task) {
            ctx.calls.attendants[operatorID].task = task;
            ctx.calls.active.splice(taskID, 1);
          } else {
            ctx.replyWithHTML('<b>Текущих задач на прозвон нет</b> 🥳');
          }
        } else {
          ctx.replyWithHTML('<b>Текущих задач на прозвон нет</b> 🥳');
        }
      }

      const menuCurrentTaskCc = Telegraf.Extra
        .HTML()
        .markup((m) => m.inlineKeyboard([
          m.callbackButton('✅ Выполнить', 'actionCompleteTaskCc'),
          m.callbackButton('⏰ Отложить', 'actionDelayTaskCc'),
          m.callbackButton('❌ Отмена', 'cancelTaskCc')
        ], {
          columns: 2
      }))


      if (ctx.calls.attendants[operatorID].task) {
        if (ctx.calls.attendants[operatorID].task.text[0] === '\n') ctx.calls.attendants[operatorID].task.text = ctx.calls.attendants[operatorID].task.text.substring(1);
        try {
          message = `Задание на звонок <b>№${ctx.calls.attendants[operatorID].task.globalID}</b>\n\n<b>Текст:</b>${ctx.calls.attendants[operatorID].task.text}\n\n<b>Кто отдал на прозвон:</b> @${ctx.calls.attendants[operatorID].task.telegramUsername}\n<b>Кто звонит:</b> @${ctx.message.from.username}`;
          ctx.replyWithHTML(message, menuCurrentTaskCc);
        } catch (err) {
          try {
            message = `Задание на звонок <b>№${ctx.calls.attendants[operatorID].task.globalID}</b>\n\n<b>Текст:</b><code>${ctx.calls.attendants[operatorID].task.text}</code>\n<b>Кто отдал на прозвон:</b> @${ctx.calls.attendants[operatorID].task.telegramUsername}\n<b>Кто звонит:</b> @${ctx.message.from.username}`;
            ctx.replyWithHTML(message, menuCurrentTaskCc);
          } catch (err) {
            message = `Не смог отправить задание на звонок <b>№${ctx.calls.attendants[operatorID].task.globalID}</b>, ошибка текста. Уточни текст у того, кто делал задачу на прозвон.\n<b>Кто отдал на прозвон:</b> @${ctx.calls.attendants[operatorID].task.telegramUsername}\n<b>Кто звонит:</b> @${ctx.message.from.username}`
            ctx.replyWithHTML(message, menuCurrentTaskCc);
          }
        }
      }
    } else {
      ctx.replyWithHTML('Брать в работу звонки может только действующий дежурный');
    }
  },



  chooseAmountForDelay: function (ctx) {

    var operatorID = -1;
    ctx.calls.attendants.forEach ((operator, id) => {
      if (ctx.update.callback_query.from.username === operator.telegramUsername)
        operatorID = id;
    })

    if (operatorID > -1) {
      //var taskNumber = ctx.callbackQuery.data.split('_')[1];
      if (ctx.calls.attendants[operatorID].task) {
        const menuDelayTaskCc = Telegraf.Extra
          .HTML()
          .markup((m) => m.inlineKeyboard([[
            m.callbackButton('5', 'actionDelay5TaskCc'),
            m.callbackButton('10', 'actionDelay10TaskCc'),
            m.callbackButton('15', 'actionDelay15TaskCc'),
            m.callbackButton('20', 'actionDelay20TaskCc'),
            m.callbackButton('30', 'actionDelay30TaskCc'),
            m.callbackButton('60', 'actionDelay60TaskCc')
          ], [
            //m.callbackButton('✏️ Ввести вручную', 'actionDelayCustomTaskCc_' + taskNumber),
            m.callbackButton('❌ Отмена', 'cancelprocedure')
          ]
          ], {
            columns: 6
          }))
        ctx.replyWithHTML('Выбери количество минут, на которые будет отложен звонок', menuDelayTaskCc);
        utility.hideMenu(ctx);
      }
    }
  },



  delayTask: function (ctx) {

    var operatorID = -1;
    ctx.calls.attendants.forEach ((operator, id) => {
      if (ctx.update.callback_query.from.username === operator.telegramUsername)
        operatorID = id
    })
    if (operatorID > -1) {
      if (ctx.calls.attendants[operatorID].task) {
        var delay = parseInt(ctx.callbackQuery.data.split('actionDelay')[1].split('TaskCc')[0]);
        var delayInSeconds = delay * 60;
        ctx.calls.attendants[operatorID].task.lockedDue = ctx.callbackQuery.message.date + delayInSeconds;
        ctx.calls.active.push(ctx.calls.attendants[operatorID].task);
        ctx.replyWithHTML(`Задача <b>№${ctx.calls.attendants[operatorID].task.globalID}</b> отложена на <b>${delay}</b> минут\n\n<i>Чтобы взять в работу следующую задачу, используй команду /next</i>`);
        ctx.calls.attendants[operatorID].task = undefined;
        ctx.calls.attendants[operatorID].completing = false;
        ctx.deleteMessage();
      }
    }
  },



  waitForResolution: function (ctx) {
    var operatorID = -1;
    ctx.calls.attendants.forEach((operator, id) => {
      if (ctx.update.callback_query.from.username === operator.telegramUsername)
        operatorID = id
    })
    if (operatorID > -1) {
      if (ctx.calls.attendants[operatorID].task) {
        ctx.calls.attendants[operatorID].completing = true;
        ctx.replyWithHTML('Пришли резолюцию задачи отдельным сообщением.\n\n<i>Резолюция должна содержать полную информацию об итогах решения данной задачи.</i>');
        utility.hideMenu(ctx);
      } else {
        ctx.answerCbQuery('Эта задача в работе у другого оператора');
      }
    }
  },



  writeResolutionForTask: function (ctx) {
    var operatorID = -1;
    ctx.calls.attendants.forEach ((operator, id) => {
      if (ctx.message.from.username === operator.telegramUsername) operatorID = id
    })
    if (operatorID > -1) {
      if (ctx.calls.attendants[operatorID].completing) {
        ctx.replyWithHTML(`<b>Задача №${ctx.calls.attendants[operatorID].task.globalID} успешно выполнена!</b>\n\n<b>Текст задачи:</b> ${ctx.calls.attendants[operatorID].task.text}\n\n<b>Резолюция:</b> ${ctx.message.text}\n\n<b>Кто отдавал на прозвон:</b> @${ctx.calls.attendants[operatorID].task.telegramUsername}\n<b>Кто позвонил:</b> @${ctx.message.from.username}\n\n<i>Чтобы взять в работу следующую задачу, используй команду /next</i>`)
        ctx.calls.attendants[operatorID].task = undefined;
        ctx.calls.attendants[operatorID].completing = false;
      }
    }
  },



  writeTask: function (ctx) {
    // if (!ctx.calls.archive) ctx.calls.archive = {};
    // got rid of archive cause it is useless and just takes a lot of performance

    if (!ctx.calls.active) ctx.calls.active = [];
    if (!ctx.calls.counter) ctx.calls.counter = 0;

    ctx.calls.counter++;

    var text;
    var message;
    var newNumber = 1;
    var queue;

    settings.calls.queues.forEach(q => {
      if (ctx.message.text.indexOf(q.prefix) > -1) queue = q;
    })

    if (ctx.message.text.split(queue.prefix)[1].length > ctx.message.text.split(queue.prefix)[0].length) text = ctx.message.text.split(queue.prefix)[1];
    else text = ctx.message.text.split(queue.prefix)[0];

    ctx.calls.active.forEach(task => {
      if (!(task.priority < queue.priority)) newNumber++;
    })

    ctx.calls.active.push({
      "telegramUsername": ctx.message.from.username,
      "timestamp": ctx.message.date,
      "text": text,
      "priority": queue.priority,
      "globalID": ctx.calls.counter
    })


    switch (queue.priority) {
      case 0:
        message = `Задача на звонок утром принята!\n\n<b>Глобальный номер задачи: </b>${ctx.calls.counter}`;
        break;
      case 1:
        message = `Задача на звонок принята! Когда звонок будет в работе, бот призовёт тебя в чат.\n\n<b>Текущий номер в очереди:</b> ${newNumber}\n<b>Глобальный номер задачи:</b> ${ctx.calls.counter}`;
        break;
      case 2:
        message = `Задача на <b>срочный</b> звонок принята! Когда звонок будет в работе, бот призовёт тебя в чат.\n\n<b>Текущий номер в очереди:</b> ${newNumber}\n<b>Глобальный номер задачи:</b> ${ctx.calls.counter}`;
        break;
      case 3:
       message = `Задача на <b>супер-пупер-мега срочный</b> звонок принята! Когда звонок будет в работе, бот призовёт тебя в чат.\n\n<b>Текущий номер в очереди:</b> ${newNumber}\n<b>Глобальный номер задачи:</b> ${ctx.calls.counter}`;
       break;
    }

    ctx.replyWithHTML(message, Telegraf.Extra.inReplyTo(ctx.message.message_id));
  },



  sendListOfActiveCalls: async function (ctx) {
    var message = `<b>На данный момент есть:</b>`;
    var queues = [];
    var counterGlobal = 0;


    // I want to have all high priority tasks at the very beginning so
    // I use the very same function several times
    // Probably should parse amount of queues and generate the message based
    // on that stuff
    ctx.calls.active.forEach(task => {
      if (!queues[task.priority]) queues[task.priority] = {
        counter: 0,
        messages: []
      };
      let localMessage = ``;
      counterGlobal++;

      queues[task.priority].counter++;

      if (task.priority === 0) localMessage += `☀️ `
      if (task.priority === 2) localMessage += `🔥 `
      if (task.priority === 3) localMessage += `🚨 `
      localMessage += `${task.text} (создано ${date.getByTimestamp(task.timestamp).string.DDMMhhmm}) (${task.globalID})`
      if (task.lockedDue) localMessage += ` (отложено до ${date.getByTimestamp(task.lockedDue).string.DDMMhhmm})`
      queues[task.priority].messages.push(localMessage);
    })

    if (counterGlobal > 0) {
      queues.slice().reverse().forEach((queue, priority) => {
        if (queue.counter > 0) {
          message += `\n— <b>${queue.counter}</b> `
          switch (priority) {
            case 0:
              message += `задач на утро ☀️`
              break;
            case 1:
              message += `задач`
              break;
            case 2:
              message += `срочных задач 🔥`
              break;
            case 3:
              message += `супер-пупер-мега-срочных задач 🚨`
              break;
          }
        }
      })

      message += '\n';

      var counterGlobal = 0;
      queues.slice().reverse().forEach((queue, priority) => {
        if (queue.counter > 0) {
          queue.messages.forEach(task => {
            counterGlobal++;
            message += `\n${counterGlobal}. ${task}`;
          })
        }
      })
      message += '\n\nЧтобы взять в работу следующий в очереди звонок, дежурный должен использовать команду /next'

      utility.splitMessageAndReply(ctx, message);
    } else {
      ctx.replyWithHTML('<b>Текущих задач нет</b> 🥳');
    }
  },



  replyWithListOfAttendants: function (ctx) {

    if (ctx.message.chat.id === settings.ViolationsChatID || ctx.message.chat.id === settings.SpecialNotificationsChatID) {
      if (ctx.session.attendants.length === 0)
        ctx.reply('Сейчас никто не дежурит на исходящих звонках! Используй /calls, чтобы взять дежурство');
      else {
        if (ctx.session.attendants.length === 1) {
          ctx.reply(`Сейчас дежурит @${ctx.session.attendants[0]}`);
        } else {
          var attendants = '';
          ctx.session.attendants.forEach (operator => {
            attendants += ' @' + operator;
          })
          ctx.reply(`Сейчас дежурят ${attendants}`);
        }
      }
    }
    if (ctx.message.chat.id === settings.chats.outCalls.id || ctx.message.chat.id === settings.chats.test.id) {
      if (ctx.calls.attendants.length === 0)
        ctx.reply('Сейчас никто не дежурит на исходящих звонках! Используй /calls, чтобы взять дежурство');
      else {
        if (ctx.calls.attendants.length === 1) {
          ctx.reply(`Сейчас дежурит @${ctx.calls.attendants[0].telegramUsername}`);
        } else {
          var attendants = '';
          ctx.calls.attendants.forEach (operator => {
            attendants += ' @' + operator.telegramUsername;
          })
          ctx.reply(`Сейчас дежурят ${attendants}`);
        }
      }
    }
  },



  greetAndWriteSenior: function (ctx) {
    if (typeof ctx.calls.seniorsOnShift === 'undefined') ctx.calls.seniorsOnShift = [];
    var operatorID = -1;
    ctx.calls.seniorsOnShift.forEach((senior, id) => {
      if (ctx.message.from.username === senior) operatorID = id;
    })

    if (operatorID < 0) {
      ctx.calls.seniorsOnShift.push(ctx.message.from.username)
      ctx.replyWithHTML('Привет, @' + ctx.message.from.username + '!');
    } else {
      ctx.reply('Ты уже и так дежуришь 🤔');
    }
  },


  removeSenior: function (ctx) {
    var operatorID = -1;
    ctx.calls.seniorsOnShift.forEach((senior, id) => {
      if (ctx.message.from.username === senior) operatorID = id;
    })
    if (operatorID > -1) {
      ctx.calls.seniorsOnShift.splice(operatorID, 1)
      ctx.reply('Пока, @' + ctx.message.from.username + '! Спасибо за смену!');
    } else {
      ctx.reply('Тебя нет в списке дежурных 🤔');
    }
  },


  mentionSeniorsOnShift: function (ctx) {
    var message = ``;
    if (ctx.calls.seniorsOnShift.length > 0) {
      ctx.calls.seniorsOnShift.forEach(senior => {
        message += `@${senior}, `
      })
      ctx.replyWithHTML(`${message}посмотрите, пожалуйста`, Telegraf.Extra.inReplyTo(ctx.message.message_id))
    } else {
      ctx.replyWithHTML(`Нет ни одного старшего на смене 🤔`)
    }
  },



  sendListOfActiveCallsFromUser: function (ctx) {

    /*if (ctx.message.chat.type === "private") {
      var tasks = [];
      ctx.calls.active.forEach((task, taskID) => {
          if (task.telegramUsername == ctx.message.from.username) {
          var temp = task;
          temp.taskID = taskID;
          tasks.push(temp);
        }
      })
      if (tasks.length > 0) {
        var word = 'активные задачи'
        if (tasks.length === 1) {
          word = 'активная задача'
        }
        var message = `У тебя есть <b>${tasks.length}</b> ${word}\n`;
        tasks.forEach((task, taskID) => {
          message += `\n${taskID + 1}. ${task.text} (создано ${date.getByTimestamp(task.timestamp).string.DDMMhhmm}, глобальный номер ${task.taskID})`
        })
        const menuChooseTask = tasks.map((task, localNumber) => Telegraf.Markup.callbackButton(`${parseInt(localNumber) + 1} (${task.taskID})`, `actionEditOrDeleteTask_${task.taskID}`));
        ctx.replyWithHTML(message, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menuChooseTask, {
          columns: 4
        })));
      } else {
        ctx.reply('У тебя нет активных задач');
      }
    }*/
  },


  mentionCurrentAttendants: function (ctx) {
    var message = `Сейчас дежурят `
    ctx.calls.attendants.forEach(attendant => {
      message += `@${attendant.telegramUsername} `
    })
    ctx.replyWithHTML(message);
  },



  sendTasksCreatedByUser: function (ctx) {
    try {
      var tasksCreatedByUser = [];
      ctx.calls.active.forEach(task => {
        if (task.telegramUsername === ctx.message.from.username)
          tasksCreatedByUser.push(task)
      })
      if (tasksCreatedByUser.length > 0) {
        var word = 'активные задачи'
        if (tasksCreatedByUser.length === 1) {
          word = 'активная задача'
        }
        var message = `У тебя есть <b>${tasksCreatedByUser.length}</b> ${word}\n`;
        tasksCreatedByUser.forEach((task, localNumber) => {
          message += `\n${localNumber + 1}. ${task.text} (создано ${date.getByTimestamp(task.timestamp).string.DDMMhhmm}, глобальный номер ${task.globalID})`
        })
        const menuChooseTask = tasksCreatedByUser.map((task, localNumber) => Telegraf.Markup.callbackButton(`${parseInt(localNumber) + 1} (${task.globalID})`, `actionEditOrDeleteTask_${task.globalID}`));
        ctx.replyWithHTML(message, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menuChooseTask, {
          columns: 4
        })));
      } else {
        ctx.reply('У тебя нет активных задач');
      }
    } catch (err) {
      ctx.replyWithHTML('Что-то пошло не так. Сообщи об этом @example_login')
      console.log(err);
    }
  },



  showAllTasks: function (ctx) {
    try {
      var tasks = [];
      ctx.calls.active.common.forEach((taskID) => {
        tasks.push(taskID)
      })
      ctx.calls.active.priority.forEach((taskID) => {
        tasks.push(taskID)
      })
      ctx.calls.active.locked.forEach((taskID) => {
        tasks.push(taskID)
      })
      if (tasks.length > 0) {
        var word = 'активные задачи'
        if (tasks.length === 1) {
          word = 'активная задача'
        }
        var message = `На данный момент есть <b>${tasks.length}</b> ${word}\n`;
        tasks.forEach((taskID, taskNumber) => {
          message += `\n${taskNumber + 1}. ${ctx.calls.archive[taskID].text} (создано ${date.getByTimestamp(ctx.calls.archive[taskID].timestamp).string.DDMMhhmm}, глобальный номер ${taskID})`
        })
        const menuChooseTask = tasks.map((taskID, localNumber) => Telegraf.Markup.callbackButton(`${parseInt(localNumber) + 1} (${taskID})`, `actionEditOrDeleteTask_${taskID}`));
        console.log(message);
        console.log(`${message[313]}${message[314]}${message[315]}`);
        utility.splitMessageAndReply(ctx, message, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menuChooseTask, { columns: 4 })));
        /*ctx.replyWithHTML(message, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menuChooseTask, {
          columns: 4
        })));*/
      } else {
        ctx.reply('У тебя нет активных задач');
      }
    } catch (err) {
      ctx.replyWithHTML('Что-то пошло не так. Сообщи об этом @example_login')
      console.log(err);
    }
  },



  offerToEditOrCancelTask: function (ctx) {
    try {
      var taskID = parseInt(ctx.callbackQuery.data.split('_')[1]);
      var task;

      ctx.calls.active.forEach(taskTemp => {
        if (taskTemp.globalID == taskID) task = taskTemp;
      })

      if (task) {
        const taskMenuDuty = Telegraf.Extra
          .HTML()
          .markup((m) => m.inlineKeyboard([
            m.callbackButton('❌ Удалить', `actionCancelTaskCс_${taskID}`),
            m.callbackButton('✏️ Изменить', `actionEditTaskСс_${taskID}`),
            m.callbackButton('Отмена', 'cancelAction')
          ], {
            columns: 2
          }))
        var message = `Выбери нужное действие с задачей <b>${taskID}</b>\n\n<b>Кто создал:</b> @${task.telegramUsername}\n<b>Текст:</b> ${task.text}\n`
        ctx.replyWithHTML(message, taskMenuDuty);
      } else {
        ctx.replyWithHTML(`Задача <b>${taskID}</b> либо в работе у оператора, либо уже была завершена. Проверь по истории сообщений в чате.`);
      }
      utility.hideMenu(ctx);
    } catch (err) {
      ctx.replyWithHTML('Что-то пошло не так. Сообщи об этом @example_login')
      console.log(err);
    }
  },


  cancelTask: function (ctx) {
    try {
      var taskID = parseInt(ctx.callbackQuery.data.split('_')[1]);
      var task;
      var index;

      ctx.calls.active.forEach((taskTemp, i) => {
        if (taskTemp.globalID === taskID) {
          task = taskTemp;
          index = i;
        }
      })

      if (task) {
        if (index) {
          ctx.calls.active.splice(index, 1)
          ctx.replyWithHTML(`Завершил задачу №<b>${taskID}</b>`)
        }
        else ctx.replyWithHTML(`Странно, нашёл задачу <b>${taskID}</b>, но не смог записать её индекс. Сообщи об этом @example_login`)
      } else {
        ctx.replyWithHTML(`Задача <b>${taskID}</b> либо в работе у оператора, либо уже была завершена. Проверь по истории сообщений в чате.`);
      }
      ctx.deleteMessage();
    } catch (err) {
      ctx.replyWithHTML('Что-то пошло не так. Сообщи об этом @example_login')
      console.log(err);
    }
  },


  waitForTaskEdit: function (ctx) {
    try {
      var taskID = parseInt(ctx.callbackQuery.data.split('_')[1]);

      var task;
      ctx.calls.active.forEach((taskTemp, i) => {
        if (taskTemp.globalID === taskID) task = taskTemp;
      })

      if (task) {
        ctx.session.taskID = taskID;
        ctx.replyWithHTML(`Пришли новый текст задачи <b>${taskID}</b>\n<b>Старый текст:</b> ${task.text}\n\n<i>Помни, что текст задачи должен быть содержательным, но лаконичным</i>`)
      } else {
        ctx.replyWithHTML(`Задача <b>${taskID}</b> либо в работе у оператора, либо уже была завершена. Проверь по истории сообщений в чате.`);
      }

      ctx.deleteMessage();
    } catch (err) {
      ctx.replyWithHTML('Что-то пошло не так. Сообщи об этом @example_login')
      console.log(err);
    }
  },



  editTask: function (ctx) {
    try {
      if (ctx.session.taskID) {
        var taskID = ctx.session.taskID;

        var task;
        var index;
        ctx.calls.active.forEach((taskTemp, i) => {
          if (taskTemp.globalID === taskID) {
            task = taskTemp;
            index = i;
          }
        })

        if (task) {
          ctx.calls.active[index].text = ctx.message.text;
          ctx.replyWithHTML(`Задача <b>${taskID}</b> успешно изменена!\n\n<b>Новый текст:</b>${ctx.message.text}`);
          ctx.session.taskID = undefined;
        } else {
          ctx.replyWithHTML(`Задача <b>${taskID}</b> либо в работе у оператора, либо уже была завершена. Проверь по истории сообщений в чате.`);
        }
      }
    } catch (err) {
      ctx.replyWithHTML('Что-то пошло не так. Сообщи об этом @example_login')
      console.log(err);
    }
  }
}
