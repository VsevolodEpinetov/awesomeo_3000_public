// ******
// AWESOME-O 4000 (I don't track versions)
// ******

//   ┌—————————————┐
//   │  I'M NOT A  │
//   │  DEVELOPER  │
//   │  BUT DOING  │
//   │   MY BEST   │
//   └—————————————┘
//  (\__/) ||
//  (•ㅅ•) ||
//  / 　 づ


// JFYI: All comments are HUGELY outdated

// ┌————————————————————— Table of Contents —————————————————————┐
// │ 0. Modules                                                  │
// │ 1. Sessions                                                 │
// │ 3. Calls duty                                               │
// │ 4. Duty reports handling                                    │
// │    4.1 Internal duty reports                                │
// │    4.2 External duty reports                                │
// │    4.3 Part with list of duty                               │
// │ 5. Reports builder                                          │
// │ 6. Techicians' reports                                      │
// └—————————————————————————————————————————————————————————————┘


// --------------------------------------------------------------------------
// 0. Modules
// --------------------------------------------------------------------------

// Basic modules to make telegraf bot. Strongly not recommended to comment
// anything at all - it just will cause everything to break.
const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')
const bot = new Telegraf(process.env.BOT_TOKEN)
const telegram = new Telegram(process.env.BOT_TOKEN)

const RedisSession = require('telegraf-session-redis')

// Extra modules to work with files and SheetAPI. If you comment it -
// most of the funtions will still work great.
// Used in:
// Some modules (todo: write em)
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
var cron = require('node-cron');

// Drive modules. If you comment anything from core - it will break most of
// the functions. Whatever else is at your discretion.

const user = require('./modules/users/index.js'); // core
const date = require('./modules/date/index.js'); // core
const utility = require('./modules/utility/index.js'); // core
const miscActions = require('./modules/misc/index.js');
const funActions = require('./modules/fun/index.js');
const dutyActions = require('./modules/duty/index.js');
const chatsActions = require('./modules/chats/index.js');
const callsActions = require('./modules/calls/index.js');
const dtpActions = require('./modules/dtp/index.js');
const taxiActions = require('./modules/taxi/index.js');
const statActions = require('./modules/stats/index.js');

const SETTINGS = require('./modules/settings.json')

const sendRequest = require('request-promise');

//bot.use(Telegraf.log());

function ID () {
  return `${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
};

// --------------------------------------------------------------------------
// 1. Sessions
// --------------------------------------------------------------------------
const SESSIONS = require('./modules/sessions/index.js')
bot.use(
        SESSIONS.TEST,
        SESSIONS.GAME,
        SESSIONS.DTP,
        SESSIONS.MISC,
        SESSIONS.USERS,
        SESSIONS.TAXI,
        SESSIONS.CHATS,
        SESSIONS.DUTY,
        SESSIONS.CALLS,
        SESSIONS.STATS,
        SESSIONS.USER_SESSION,
        SESSIONS.CHAT_SESSION,
        SESSIONS.UNIQUE_SESSION
      )

// --------------------------------------------------------------------------
// 2. Misc triggers
// --------------------------------------------------------------------------
// Mostly what I need right now to accomplish something

bot.command('init', (ctx) => {
  utility.log(ctx);
  if (user.hasRoleByTelegramUsername(ctx, 'root', ctx.message.from.username)) {
    ctx.dtp.locked = false;
    ctx.reply('done');
  }
})

bot.action('actionCancel', (ctx) => {
  utility.log(ctx);
  ctx.deleteMessage();
})

bot.command('load', (ctx) => {
  utility.log(ctx);
  if (chatsActions) if (chatsActions) chatsActions.getScheduleForCurrentWeek(ctx);
  //return chats.getScheduleForCurrentWeek(ctx, 'ctx.chats.shifts', '1IYkehZ8P5Ok9H-IHODHpJm5reysSd9YIsuqYvdHNll4', utility.getWeekRangeForC2dSchedule(), 'V');
  //return LoadAndParseSchedule(ctx, 'ctx.duty.shifts', '1W8lNNcsb1ViA3UVX6nXXNoeM_np7M2KDsk0fnApNsi8', utility.getWeekRangeForDutySchedule(), 'T');
})

bot.command('show', (ctx) => {
  utility.log(ctx);
  //console.log(`ctx.misc.tests.archive: ${JSON.stringify(ctx.misc.tests.archive)}`)
  //console.log(`ctx.misc.tests.active: ${JSON.stringify(ctx.misc.tests.active)}`)
  /*var operatorID = -1;
  var tasksInWork = [];

  ctx.calls.attendants.forEach((operator, id) => {
    if ('kl_333' === operator.telegramUsername) operatorID = id
    if (typeof operator.task !== 'undefined') tasksInWork.push(operator.task)
  })

  console.log(`ctx.calls.attendants[operatorID]: ${JSON.stringify(ctx.calls.attendants[operatorID])}`)
  ctx.calls.attendants[operatorID].task = undefined;
  ctx.calls.attendants[operatorID].completing = false;*/
})

bot.catch((err, ctx) => {
  console.log(`Ooops, encountered an error for ${ctx.updateType}`, err)
})

bot.command('removeuser', (ctx) => {
  utility.log(ctx);
  var StringBefore = '/removeuser '
  var number = ctx.message.text.substring(StringBefore.length, ctx.message.text.length);
  ctx.users.all.splice(number, 1);
  var last = ctx.users.all.length - 1;
  console.log(`done, last:`)
  console.log(`ctx.users.all[${last}]: ${JSON.stringify(ctx.users.all[last])}`)
})

bot.command('showt', (ctx) => {
  utility.log(ctx);
  var StringBefore = '/showt '
  var number = ctx.message.text.substring(StringBefore.length, ctx.message.text.length);
  console.log(`ctx.session.taxi: ${JSON.stringify(ctx.session.taxi)}`)
  console.log(`ctx.taxi.orders[${number}]: ${JSON.stringify(ctx.taxi.orders[number])}`);
})

bot.command('showc', (ctx) => {
  utility.log(ctx);
  console.log(`ctx.calls.attendants: ${JSON.stringify(ctx.calls.attendants)}`)
  ctx.calls.attendants[1].task = undefined;
})

bot.command('duplicates', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.id === SETTINGS.chats.test.id) {
    user.checkForDuplicates(ctx);
  }
})

bot.command('void_morning', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.id === SETTINGS.chats.test.id) {
    var tasksToRemove = [8827]
    var indexesToRemove = [];
    ctx.calls.active.forEach((task, id) => {
      tasksToRemove.forEach((taskID, index) => {
        if (task.globalID === taskID) indexesToRemove.push(id);
      });
    });

    indexesToRemove.slice().reverse().forEach(i => {
      ctx.calls.active.splice(i, 1);
    })

  }
})

bot.command('showd', (ctx) => {
  utility.log(ctx);
  console.log(ctx.dtp.tasks.active)
  console.log(ctx.dtp.tasks.given)
})

bot.command('showdtp', (ctx) => {
  utility.log(ctx);
  var StringBefore = '/showdtp '
  var number = ctx.message.text.substring(StringBefore.length, ctx.message.text.length);
  console.log(`ctx.dtp.days[10][14]: ${JSON.stringify(ctx.dtp.days[10][14])}`)
  console.log(`ctx.dtp.days[10][30]: ${JSON.stringify(ctx.dtp.days[10][30])}`)
  console.log(`ctx.dtp.days[11][16]: ${JSON.stringify(ctx.dtp.days[11][16])}`)
})

bot.command('showu', (ctx) => {
  utility.log(ctx);
  var StringBefore = '/showu '
  var number = ctx.message.text.substring(StringBefore.length, ctx.message.text.length);
  var last = ctx.users.all.length - 1;
  var lastlast = ctx.users.all.length - 2;
  console.log(`ctx.users.all[${last}]: ${JSON.stringify(ctx.users.all[last])}`)
  console.log(`ctx.users.all[${lastlast}]: ${JSON.stringify(ctx.users.all[lastlast])}`)
  console.log(`ctx.users.all[${number}]: ${JSON.stringify(ctx.users.all[number])}`)
})

bot.command('showTask', (ctx) => {
  utility.log(ctx);
  console.log(`ctx.calls.attendants: ${JSON.stringify(ctx.calls.attendants)}`)
})


bot.command('test', (ctx) => {
  utility.log(ctx);
  /*if (user.hasRoleByTelegramUsername(ctx, 'root', ctx.message.from.username)) {
    var amount = 0;
    for (var userID in ctx.game.users) {
      console.log(`${userID}: ${ctx.game.users[userID].currency.amount}`);
      if (ctx.game.users[userID].currency.amount) amount += ctx.game.users[userID].currency.amount;
    }
  };
  console.log(amount);*/
  if (ctx.message.chat.type === 'private') {
    if (miscActions) miscActions.setNewTest(ctx);
  }
})

bot.action(/actionTest_type/, (ctx) => {
  utility.log(ctx);
  if (miscActions) miscActions.setTestType(ctx);
})

bot.command('t', async (ctx) => {
  utility.log(ctx);
  if (user.hasRoleByTelegramUsername(ctx, 'root', ctx.message.from.username)) {
    /*ctx.users.all.forEach(user => {
      if (typeof user.roles.chat2desk !== 'undefined') {
        user.roles.chats = user.roles.chat2desk;
        user.roles.chat2desk = undefined;
      } else {
        user.roles.chats = 0;
      }

      if (typeof user.roles.managerChat2desk !== 'undefined') {
        user.roles.managerChats = user.roles.managerChat2desk;
        user.roles.managerChat2desk = undefined;
      } else {
        user.roles.managerChats = 0;
      }
    });*/
    /*ctx.users.all[0].roles.managerChats = 'Менеджер чатов';
    ctx.users.all[0].roles.chats = 'Чаты';*/
    //console.log(`ctx.misc.tests.archive: ${JSON.stringify(ctx.misc.tests.archive)}`)
    //console.log(`ctx.misc.tests.active: ${JSON.stringify(ctx.misc.tests.active)}`)
    //ctx.misc.tests.active = [];
    /*console.log(JSON.stringify(ctx.calls))
    console.log('done');*/
    /*ctx.test = [
      {
        greeting: "hello",
        more: ['hey', 'hiya']
      },
      {
        greeting: "hey"
      }
    ]*/
    //ctx.calls.active = [];
    //ctx.calls.completing = [];
    //ctx.calls.attendants = [];
    //console.log(`ctx.calls: ${JSON.stringify(ctx.calls)}`);
    //ctx.calls.seniorsOnShift = [];
    /*try {
      var sessionInstance = new RedisSession()
      var localCalls;

      await sessionInstance.getSession('calls').then(session => {
        localCalls = session;
      });

      localCalls.active.forEach(task => {
        if (task.priority === 0) task.priority = 1;
      })

      sessionInstance.saveSession('calls', localCalls);
      telegram.sendMessage(SETTINGS.chats.test.id, 'Unlocked morning tasks');
    } catch  (err) {
      console.log(err);
      telegram.sendMessage(SETTINGS.chats.test.id, 'Failed unlocking morning tasks');
    }*/
    /*ctx.calls.active.forEach(task => {
      if (task.priority === 0) task.priority = 1;
    });
    console.log('done')*/
    ctx.stats = {};
    console.log('done')
  };
})

bot.command('y', (ctx) => {
  utility.log(ctx);
  if (user.hasRoleByTelegramUsername(ctx, 'root', ctx.message.from.username)) {
    //console.log(`ctx.test: ${JSON.stringify(ctx.test)}`);
    //console.log(`ctx.calls: ${JSON.stringify(ctx.calls)}`);
    //console.log(`ctx.calls_old: ${JSON.stringify(ctx.calls_old)}`);
  };
})

bot.action('actionReenterDateTest', (ctx) => {
  utility.log(ctx);
  utility.hideMenu(ctx);
  ctx.replyWithHTML(`Понял. Если какая-то информация, кроме дедлайна, неверна - напиши ещё раз /test, процесс пойдёт заново. Если неверен только дедлайн - пришли его ещё раз.\n\n<i>Дедлайн считается днём, когда уже нельзя выполнить тест.\nПример: 2019-12-20</i>`)
  ctx.session.stage = 2;
})

bot.action('actionAddNotificationToTest', (ctx) => {
  utility.log(ctx);
  if (miscActions) miscActions.addNotification(ctx);
})

bot.action(/actionEditTestNotification/, (ctx) => {
  utility.log(ctx);
  if (miscActions) miscActions.editNotification(ctx);
})

bot.action(/actionAddStandtartNotificationToTest/, (ctx) => {
  utility.log(ctx);
  if (miscActions) miscActions.addStandartNotifications(ctx);
})

bot.action('actionDoneWithTest', (ctx) => {
  utility.log(ctx);
  utility.hideMenu(ctx);
  if (miscActions) miscActions.addTest(ctx);
})


bot.command('tests', (ctx) => {
  utility.log(ctx);
  if (miscActions) miscActions.offerToCompleteTheTest(ctx);
})

bot.action(/actionCompleteTest/, (ctx) => {
  utility.log(ctx);
  if (miscActions) miscActions.markTestAsCompleted(ctx);
})

bot.command('send', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.type === "private" && ctx.message.from.username === 'example_login') {
    if (miscActions) miscActions.remindAboutTest(ctx);
  }
  console.log('done');
})

bot.command('tes', (ctx) => {
  if (ctx.message.chat.type === "private" && ctx.message.from.username === 'example_login') {
    ctx.misc.tests = {};
    ctx.misc.tests.archive = [];
    ctx.misc.tests.active = [];
  }
  console.log('done');
})

// --------------------------------------------------------------------------
// 3. Outgoing calls handling
// --------------------------------------------------------------------------

bot.action(/actionDelayTaskCc/, (ctx) => {
  utility.log(ctx);
  if (callsActions) callsActions.chooseAmountForDelay(ctx);
})

bot.action(/actionDelay[0-9]+TaskCc/, (ctx) => {
  utility.log(ctx);
  if (callsActions) callsActions.delayTask(ctx);
})

bot.command(['calls', 'call'], (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.id === SETTINGS.ViolationsChatID || ctx.message.chat.id === SETTINGS.SpecialNotificationsChatID) {
    if (callsActions) callsActions.showAttendantMenu(ctx);
  }
  if (ctx.message.chat.id === SETTINGS.chats.outCalls.id || ctx.message.chat.id === SETTINGS.chats.test.id) {
    if (callsActions) callsActions.showAttendantMenuOutgoingCalls(ctx);
  }
  if (ctx.message.chat.id === SETTINGS.chats.seniorOperators.id) {
    if (callsActions) callsActions.mentionSeniorsOnShift(ctx);
  }
})

bot.action('startcallsduty', (ctx) => {
  utility.log(ctx);
  if (ctx.update.callback_query.message.chat.id === SETTINGS.chats.outCalls.id || ctx.update.callback_query.message.chat.id === SETTINGS.chats.test.id) {
    if (callsActions) callsActions.writeAttendantOutgoingCalls(ctx);
  } else {
    if (callsActions) callsActions.writeAttendant(ctx);
  }
})

bot.command('override', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.id === SETTINGS.chats.outCalls.id && user.hasRole(ctx, 'seniorOperator')) {
    try {
      if (callsActions) callsActions.removeAttendantOutgoingCallsForcefully(ctx);
    }
    catch (err) {
      console.log(err);
    }
  }
  if ((ctx.message.chat.id === SETTINGS.ViolationsChatID || ctx.message.chat.id === SETTINGS.SpecialNotificationsChatID) && user.hasRole(ctx, 'seniorOperator')) {
    if (callsActions) callsActions.removeAttendantForcefully(ctx);
  }
})

bot.command('check', (ctx) => {
  utility.log(ctx);
  if ((ctx.message.chat.id === SETTINGS.chats.moscowTechicians.id || ctx.message.chat.id === SETTINGS.chats.spbTechicians.id || ctx.message.chat.id === SETTINGS.chats.kazanTechnicians.id || ctx.message.chat.id === SETTINGS.chats.test.id) && user.hasRole(ctx, 'duty')) {
    try {
      user.checkIfIsTechnician(ctx);
    }
    catch (err) {
      console.log(err);
    }
  }
})

bot.command('give', (ctx) => {
  try {
    funActions.sendCurrencyToUser(ctx);
  }
  catch (err) {
    console.log(err);
    ctx.replyWithHTML('Что-то пошло не так. Попробуй позже ещё раз', Telegraf.Extra.inReplyTo(ctx.message.message_id));
  }
})

bot.action('resetcallsduty', (ctx) => {
  utility.log(ctx);
  if (ctx.update.callback_query.message.chat.id === SETTINGS.chats.outCalls.id || ctx.update.callback_query.message.chat.id === SETTINGS.chats.test.id) {
    if (callsActions) callsActions.removeAttendantOutgoingCalls(ctx);
  } else {
    if (callsActions) callsActions.removeAttendant(ctx);
  }
});

bot.hears(/#позвонить/gi, (ctx) => {
  if (ctx.message.chat.id === SETTINGS.chats.outCalls.id || ctx.message.chat.id === SETTINGS.chats.test.id) {
    try {
      if (callsActions) callsActions.writeTask(ctx);
    }
    catch (err) {
      console.log(err);
      ctx.replyWithHTML('Что-то пошло не так. Попробуй отправить задачу ещё раз', Telegraf.Extra.inReplyTo(ctx.message.message_id));
    }
  }
})


bot.hears(/#наутро/, (ctx) => {
  if (ctx.message.chat.id === SETTINGS.chats.outCalls.id || ctx.message.chat.id === SETTINGS.chats.test.id) {
    try {
      if (callsActions) callsActions.writeTask(ctx);
    }
    catch (err) {
      console.log(err);
      ctx.replyWithHTML('Что-то пошло не так. Попробуй отправить задачу ещё раз', Telegraf.Extra.inReplyTo(ctx.message.message_id));
    }
  }
})

bot.command('allcalls', async (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.id === SETTINGS.chats.outCalls.id || ctx.message.chat.id === SETTINGS.chats.test.id) {
    try {
      if (callsActions) callsActions.sendListOfActiveCalls(ctx);
    }
    catch (err) {
      console.log(err);
      ctx.replyWithHTML('Что-то пошло не так, попробуй ещё раз', Telegraf.Extra.inReplyTo(ctx.message.message_id));
    }
  }
})

bot.command('next', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.id === SETTINGS.chats.outCalls.id || ctx.message.chat.id === SETTINGS.chats.test.id) {
    try {
      if (callsActions) callsActions.assignTask(ctx);
    }
    catch (err) {
      console.log(err);
      ctx.replyWithHTML('Что-то пошло не так, попробуй ещё раз', Telegraf.Extra.inReplyTo(ctx.message.message_id));
    }
  }
  if (ctx.message.chat.type === "private") {
    //if (chatsActions) chatsActions.sendNextShiftForUser(ctx, ctx.message.from.username);
  }
})

bot.action(/actionCompleteTaskCc/, (ctx) => {
  utility.log(ctx);
  if (callsActions) callsActions.waitForResolution(ctx);
})

bot.action('cancelTaskCc', (ctx) => {
  utility.log(ctx);
  var operatorID = -1;
  ctx.calls.attendants.forEach ((operator, id) => {
    if (ctx.update.callback_query.from.username === operator.telegramUsername)
      operatorID = id
  })
  if (operatorID > -1) {
    ctx.answerCbQuery('Действие отменено');
    ctx.deleteMessage();
  }
});

bot.command('dutyc', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.id == SETTINGS.chats.outCalls.id) {
    if (callsActions) callsActions.mentionCurrentAttendants(ctx);
  }
})

// --------------------------------------------------------------------------
// 3. Duty and chats attendants handling
// --------------------------------------------------------------------------

bot.command('hi', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.id === SETTINGS.chats.test.id) {
    console.log('hey');
    //if (dutyActions) dutyActions.greetAndWriteAttendant(ctx);
  }

  if (ctx.message.chat.id == SETTINGS.chats.duty.id) {
    if (dutyActions) dutyActions.greetAndWriteAttendant(ctx);
  }

  if ((ctx.message.chat.id === SETTINGS.ViolationsChatID || ctx.message.chat.id === SETTINGS.chats.seniorOperators.id) && user.hasRole(ctx, 'seniorOperator')) {
    if (callsActions) callsActions.greetAndWriteSenior(ctx);
  }

  if (ctx.message.chat.id === SETTINGS.chats.chats.id && user.hasRole(ctx, 'chats')) {
    if (chatsActions) chatsActions.greetAndWriteAttendant(ctx);
  }
})

bot.command('bye', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.id === SETTINGS.chats.test.id) {
    console.log('bye!');
    //if (dutyActions) dutyActions.removeAttendant(ctx);
  }

  if (ctx.message.chat.id == SETTINGS.chats.duty.id) {
    if (dutyActions) dutyActions.removeAttendant(ctx);
  }

  if ((ctx.message.chat.id === SETTINGS.ViolationsChatID || ctx.message.chat.id === SETTINGS.chats.seniorOperators.id) && user.hasRole(ctx, 'seniorOperator')) {
    if (callsActions) callsActions.removeSenior(ctx);
  }

  if (ctx.message.chat.id === SETTINGS.chats.chats.id && user.hasRole(ctx, 'chats')) {
    if (chatsActions) chatsActions.removeAttendant(ctx);
  }
})


bot.hears(/#отчет_сервисы/, (ctx) => {
  if (ctx.chat.id === SETTINGS.chats.duty.id || ctx.chat.id === SETTINGS.chats.test.id) {
    if (dutyActions) dutyActions.parseAndWriteReportService(ctx);
    //notifyAboutNextShift(ctx, 'duty', ctx.message.from.id)
  }
})
bot.hears(/#отчет/, (ctx) => {
  if (ctx.chat.id === SETTINGS.chats.duty.id || ctx.chat.id === SETTINGS.chats.test.id) {
    if (dutyActions) dutyActions.parseAndWriteReport(ctx);
    //notifyAboutNextShift(ctx, 'duty', ctx.message.from.id)
  }
})
bot.hears(/#отчёт_чаты/, (ctx) => {
  if (ctx.chat.id == SETTINGS.chats.chats.id && user.hasRole(ctx, 'chats')) {
    if (chatsActions) chatsActions.parseAndWriteReport(ctx);
  }
})

bot.command('tasks', (ctx) => {
  utility.log(ctx);
  if (ctx.chat.id === SETTINGS.chats.test.id) {
    if (dutyActions) dutyActions.sendSeniorTasks(ctx);
  }
  if (ctx.chat.id === SETTINGS.chats.duty.id) {
    if (dutyActions) dutyActions.sendTasks(ctx);
  }
  if (ctx.message.chat.id === SETTINGS.chats.seniorTechniciansAndSupport.id) {
    if (dutyActions) dutyActions.sendSeniorTasks(ctx);
  }
  if (ctx.message.chat.type === "private") {
    if (callsActions) callsActions.sendTasksCreatedByUser(ctx);
  }
});

bot.command('service', (ctx) => {
  utility.log(ctx);
  if (ctx.chat.id === SETTINGS.chats.duty.id || ctx.chat.id === SETTINGS.chats.test.id) {
    if (dutyActions) dutyActions.sendServiceTasks(ctx);
  }
});

bot.command('alltasks', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.type === "private") {
    if (user.hasRoleByTelegramID(ctx, 'seniorOperator', ctx.message.from.id) || user.hasRoleByTelegramID(ctx, 'duty', ctx.message.from.id) || user.hasRoleByTelegramID(ctx, 'managerOperator', ctx.message.from.id)) {
      if (callsActions) callsActions.showAllTasks(ctx);
    }
  }
});

bot.action(/actionEditOrDeleteTask_[0-9]*/, (ctx) => {
  utility.log(ctx);
  if (callsActions) callsActions.offerToEditOrCancelTask(ctx);
})

bot.action(/actionCancelProcedure/, (ctx) => {
  utility.log(ctx);
  try {
    ctx.deleteMessage();
  } catch (err) {
    console.log(err);
  }
})

bot.action(/actionDeleteAllServiceTasks/, (ctx) => {
  utility.log(ctx);
  if (dutyActions) dutyActions.askDeleteOrNotAll(ctx);
})

bot.action(/actionDeleteServiceTaskByStation/, (ctx) => {
  utility.log(ctx);
  if (dutyActions) dutyActions.askDeleteOrNotByStation(ctx);
})

bot.action(/actionConfirmDeleteAll/, (ctx) => {
  utility.log(ctx);
  if (dutyActions) dutyActions.deleteAllServiceTasks(ctx);
})

bot.action(/actionConfirmDeleteByStation/, (ctx) => {
  utility.log(ctx);
  if (dutyActions) dutyActions.deleteAllServiceTasksByStation(ctx);
})

bot.action('cancelAction', (ctx) => {
  utility.log(ctx);
  ctx.deleteMessage();
})

bot.action(/actionCancelTaskCс_[0-9]*/, (ctx) => {
  utility.log(ctx);
  if (callsActions) callsActions.cancelTask(ctx);
})

bot.action(/actionEditTaskСс_[0-9]*/, (ctx) => {
  utility.log(ctx);
  if (callsActions) callsActions.waitForTaskEdit(ctx);
})

bot.action(/actionShowMenuTaskDuty_/, (ctx) => {
  utility.log(ctx);
  if (dutyActions) dutyActions.showTask(ctx);
})

bot.action(/actionCompleteTaskDuty_/, (ctx) => {
  utility.log(ctx);
  if (dutyActions) dutyActions.waitForTaskResolution(ctx);
});

bot.action(/actionEditTaskDuty_/, (ctx) => {
  utility.log(ctx);
  if (dutyActions) dutyActions.waitForTaskEdit(ctx);
});

bot.action(/actionShowMenuTaskService_[0-9]*/, (ctx) => {
  utility.log(ctx);
  if (dutyActions) dutyActions.showTaskService(ctx);
})

bot.action(/actionCompleteTaskService/, (ctx) => {
  utility.log(ctx);
  if (dutyActions) dutyActions.waitForServiceTaskResolution(ctx);
});

bot.action(/actionEditTaskService/, (ctx) => {
  utility.log(ctx);
  if (dutyActions) dutyActions.waitForServiceTaskEdit(ctx);
});

const menuPresetsAddNewUser = Telegraf.Extra
  .HTML()
  .markup((m) => m.inlineKeyboard([
    m.callbackButton('☎️ Старший оператор', 'actionAddUserOperator'),
    m.callbackButton('🛠 Техник', 'actionAddUserTechnician'),
    m.callbackButton('💙 Поддержка (чаты)', 'actionAddUserSupport'),
    m.callbackButton('👽 Свой вариант (не работает)', 'actionAddUser')
  ], {
    columns: 3
  }))

bot.command('add', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.id === SETTINGS.chats.test.id) {
    ctx.replyWithHTML('Выбери один из пресетов для добавления нового участника', menuPresetsAddNewUser);
    //if (dutyActions) dutyActions.askTypeOfNewTask(ctx);
    //if (dutyActions) dutyActions.askStationForNewServiceTask(ctx);
  }
  if (ctx.message.chat.id === SETTINGS.chats.duty.id) {
    if (dutyActions) dutyActions.askTypeOfNewTask(ctx);
  }
  if (ctx.message.chat.id === SETTINGS.chats.seniorTechniciansAndSupport.id) {
    if (dutyActions) dutyActions.askStationForNewServiceTask(ctx);
  }
  //if (ctx.message.chat.id === SETTINGS.)
})


bot.command('promo', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.type === 'private') {
    funActions.registerPromocode(ctx);
  }
})

bot.action(/actionAddNewTask_/, (ctx) => {
  utility.log(ctx);
  if (dutyActions) dutyActions.waitForNewTask(ctx);
})

bot.action(/actionAddNewServiceTask_/, (ctx) => {
  utility.log(ctx);
  if (dutyActions) dutyActions.waitForNewServiceTask(ctx);
})

bot.action('actionAddUserTechnician', (ctx) => {
  utility.log(ctx);
  ctx.deleteMessage();
  user.createBlankUser(ctx);
  user.createStagesForUser(ctx, 'technician');
})

bot.action('actionAddUserSupport', (ctx) => {
  utility.log(ctx);
  ctx.deleteMessage();
  user.createBlankUser(ctx);
  user.createStagesForUser(ctx, 'chats');
})

bot.action(['technicianspb', 'technicianmoscow', 'techniciankazan'], (ctx) => {
  utility.hideMenu(ctx);
  switch (ctx.callbackQuery.data) {
    case 'technicianmoscow':
      ctx.session.user.roles.technicianMoscow = 1;
      break;
    case 'technicianspb':
      ctx.session.user.roles.technicianSaintPetersburg = 2;
      break;
    case 'techniciankazan':
      ctx.session.user.roles.technicianKazan = 3;
      break;
  }
  ctx.users.all.push(ctx.session.user)
  ctx.session = undefined;
  ctx.replyWithHTML('Новый техник успешно добавлен!\n\n' + user.getUserCardByIndex(ctx, ctx.users.all.length - 1));
})

bot.action('actionAddUserOperator', (ctx) => {
  utility.log(ctx);
  ctx.deleteMessage();
  user.createBlankUser(ctx);
  user.createStagesForUser(ctx, 'operator');
})

bot.command('edit', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.id === SETTINGS.chats.test.id) {
    user.sendMenuEditUser(ctx);
  }
})

bot.action('actionEditUser_editRoles', (ctx) => {
  utility.log(ctx);
  user.sendMenuEditRoles(ctx);
})

bot.action('actionEditUser_editInfo', (ctx) => {
  utility.log(ctx);
  user.sendMenuEditInfo(ctx);
})

bot.action('actionEditUser_done', (ctx) => {
  utility.log(ctx);
  user.cancelEditInfo(ctx);
})

bot.action(/actionSwitchUserRole_[0-z]*/, (ctx) => {
  utility.log(ctx);
  user.switchRole(ctx);
})

bot.action(/actionEditUserInfo_[0-z]*/, (ctx) => {
  utility.log(ctx);
  user.waitForNewInfo(ctx);
})

bot.command('info', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.id === SETTINGS.chats.test.id) {
    user.sendUserCard(ctx);
  }
  if (ctx.message.from.username === 'example_login') {
    console.log(`ctx.message.chat.title: ${ctx.message.chat.title}`)
    console.log(`ctx.message.chat.id: ${ctx.message.chat.id}`)
    console.log(`{\n  "title": "${ctx.message.chat.title}",\n  "id": ${ctx.message.chat.id}\n}`)
  }
})


bot.command('flip', (ctx) => {
  utility.log(ctx);
  if (miscActions) miscActions.flipCoin(ctx);
})

// --------------------------------------------------------------------------
// x. Special: all messages triggers
// --------------------------------------------------------------------------

bot.command('duty', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.id === SETTINGS.chats.internalSupport.id || ctx.message.chat.id === SETTINGS.chats.chats.id || ctx.message.chat.id === SETTINGS.chats.test.id) {
    let message = '';
    ctx.duty.attendants.forEach(attendant => {
      message += `@${attendant.telegramUsername}, `
    })
    let options = ['призываю во имя Каптюра!', 'гляньте плз', '👆', 'помогите!', 'да свершится правосудие!', 'настал ваш час!', 'а что тут у нас такое?', 'Хьюстон, у нас проблемы!', 'объявляется конкурс на самый остроумный ответ!', 'я ничего не трогала, оно само!', 'шо за день :(', 'я не пониматi 🥺', 'тысяча извiненiї 🤧', 'привет, красавчики 😏', 'pf,sk cvtybnm hfcrkflre'];
    message += options[utility.getRandomInt(0, options.length - 1)];
    ctx.replyWithHTML(message, Telegraf.Extra.inReplyTo(ctx.message.message_id));
  }
  if (ctx.message.chat.id === SETTINGS.chats.outCalls.id || ctx.message.chat.id === SETTINGS.chats.moscowCC.id || ctx.message.chat.id === SETTINGS.chats.spbCC.id || ctx.message.chat.id === SETTINGS.chats.kazanCC.id) {
    if (callsActions) callsActions.mentionSeniorsOnShift(ctx);
  }
})

bot.command('koti', (ctx) => {
  if (ctx.message.chat.id === SETTINGS.chats.chats.id || ctx.message.chat.id === SETTINGS.chats.chatsOrganisation.id) if (chatsActions) chatsActions.mentionCurrentAttendants(ctx);
})


bot.command('all', (ctx) => {
  utility.log(ctx);
  if (miscActions) miscActions.mentionUsersBasedOnChat(ctx);
})

bot.command('dtp', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.id === SETTINGS.chats.test.id || ctx.message.chat.id === SETTINGS.DTPChatID) {
    //if (dtpActions) dtpActions.sendMenuMonths(ctx);
    if (dtpActions) dtpActions.getTasksAndGive(ctx);
  }
})

bot.command('unlock', (ctx) => {
  utility.log(ctx);
  if ((ctx.message.chat.id === SETTINGS.chats.test.id || ctx.message.chat.id === SETTINGS.DTPChatID) && (ctx.message.from.username === 'example_login' || ctx.message.from.username === 'Ekaterina_Minenok')) {
    ctx.dtp.locked = false;
    ctx.reply('Готово!')
  }
})

bot.command('me', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.id === SETTINGS.chats.test.id || ctx.message.chat.id === SETTINGS.DTPChatID) {
    if (dtpActions) dtpActions.sendAssignedDaysForUser(ctx);
  }
})

bot.command('month', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.id === SETTINGS.chats.test.id || ctx.message.chat.id === SETTINGS.DTPChatID) {
    if (dtpActions) dtpActions.sendAssignedDaysForMonth(ctx);
  }
})

bot.action(/actionDTPShowAvailableDays_[0-9]*/, (ctx) => {
  utility.log(ctx);
  if (dtpActions) dtpActions.sendMenuDays(ctx);
})

bot.command('start', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.type == "private") {
    user.greetAndWriteID(ctx);
  }
})

bot.action(/actionDTPShowMenuForDay_[0-9]*/, (ctx) => {
  utility.log(ctx);
  if (dtpActions) dtpActions.sendMenuActions(ctx);
})


bot.action(/actionDTPAssignUser_[0-9]*/, (ctx) => {
  utility.log(ctx);
  if (dtpActions) dtpActions.assignUser(ctx);
})

bot.command('taxi', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.type === "private" && user.isTechnicianByTelegramID(ctx, ctx.message.from.id)) {
    console.log('Is technician')
    if (taxiActions) return taxiActions.enterAddressFrom(ctx);
    else return;
  }
})

bot.command('nulltaxi', (ctx) => {
  utility.log(ctx);
  if (ctx.message.chat.type === "private" && user.isTechnicianByTelegramID(ctx, ctx.message.from.id)) {
    if (ctx.message.from.username === 'example_login') ctx.session.taxi = undefined;
  }
})

bot.action('actionSetDutyTaxi', (ctx) => {
  if (user.hasRoleByTelegramID(ctx, 'duty', ctx.from.id) || user.hasRoleByTelegramID(ctx, 'seniorOperator', ctx.from.id)) {
    if (taxiActions) return taxiActions.setDuty(ctx);
    else return;
  } else {
    ctx.answerCbQuery('Действие недоступно');
  }
})

bot.action(/actionCabCancelTheOrder_[0-9]*/, (ctx) => {
  utility.log(ctx);
  if (taxiActions) taxiActions.cancelCabOrder(ctx);
})

bot.action(/actionCallACabEnteredFrom*/, (ctx) => {
  utility.log(ctx);
  if (taxiActions) return taxiActions.enterAddressFavourite(ctx);
  else return;
})

bot.action('actionCallACab', (ctx) => {
  utility.log(ctx);
  if (ctx.update.callback_query.message.chat.type === "private" && user.isTechnicianByTelegramID(ctx, ctx.update.callback_query.from.id)) {
    if (taxiActions) taxiActions.enterAddressFrom(ctx);
    utility.hideMenu(ctx);
  }
})

bot.hears(/https:\/\/st.yandex-team.ru\/DRIVESECURITY-/g, (ctx) => {
  if ((ctx.message.chat.id === SETTINGS.chats.achtung.id || ctx.message.chat.id === SETTINGS.chats.test.id) && (ctx.message.text.indexOf('noforward') < 0) && (ctx.message.text.indexOf('📍 Адрес') > -1)) if (miscActions) miscActions.deletePersonalInformationAndForward(ctx);
})

bot.hears(/отмена/i, (ctx) => {
  if (ctx.message.chat.type === "private") {
    if (taxiActions) taxiActions.cancelCab(ctx);
  }
})

bot.action('actionMatchAsDoneTaxi', (ctx) => {
  if (taxiActions) taxiActions.completeTheOrder(ctx);
})

bot.command('del', (ctx) => {
  utility.log(ctx);
  if (ctx.message.from.username === 'example_login' || ctx.message.from.username === 'example_login_2' || ctx.message.from.username === 'example_login_1' || ctx.message.from.username === 'example_login_4' || ctx.message.from.username === 'example_login_3') {
    if (ctx.message.reply_to_message) ctx.telegram.deleteMessage(ctx.message.reply_to_message.chat.id, ctx.message.reply_to_message.message_id);
  }
})

bot.on('message', (ctx) => {
  if (statActions) statActions.registerMessage(ctx);
  if (ctx.message.chat.id === SETTINGS.chats.outCalls.id) {
    if (callsActions) callsActions.writeResolutionForTask(ctx);
  }
  if (ctx.message.chat.id === SETTINGS.chats.duty.id || ctx.message.chat.id === SETTINGS.chats.test.id) {
    if (ctx.duty.completing.length > 0) if (dutyActions) dutyActions.writeResolutionForTaskAndNotificateTheCreator(ctx);
    if (ctx.duty.editing.length > 0) if (dutyActions) dutyActions.writeNewTextForTask(ctx);
    if (ctx.duty.adding.length > 0) if (dutyActions) dutyActions.createNewTask(ctx);
  }
  if (ctx.message.chat.id === SETTINGS.chats.seniorTechniciansAndSupport.id) {
    if (ctx.duty.completingService.length > 0) if (dutyActions) dutyActions.writeResolutionForServiceTask(ctx);
    if (ctx.duty.editingService.length > 0) if (dutyActions) dutyActions.writeNewTextForServiceTask(ctx);
    if (ctx.duty.addingService.length > 0) if (dutyActions) dutyActions.createNewServiceTask(ctx);
  }
  if (ctx.message.chat.id === SETTINGS.chats.test.id) {
    user.waitForCreationInfo(ctx);
    if (typeof ctx.session.fieldToChange !== 'undefined') user.writeNewInfo(ctx);
  }

  /*if (ctx.message.chat.id === SETTINGS.chats.moscowTechicians.id) {
  //if (ctx.message.chat.id === SETTINGS.chats.test.id) {
    if (ctx.misc.tests.active.length > 0) {
      var testsToDelete = [];
      ctx.misc.tests.active.forEach((testID, i) => {
        if (ctx.misc.tests.archive[testID].timestampDue < date.getCurrent().timestamp) testsToDelete.push(i);
      })
      testsToDelete.slice().reverse().forEach(i => {
        ctx.misc.tests.active.splice(i, 1);
      })
      if (miscActions) miscActions.remindAboutTest(ctx);
    }
  }*/

  if (ctx.message.text) {

    // For literal comparison letter-by-letter
    switch (ctx.message.text) {
      case 'удоли':
        switch (ctx.message.from.username) {
          case 'example_login_2':
          case 'example_login':
          case 'example_login_5':
          case 'example_login_4':
          case 'example_login_6':
          case 'example_login_3':
            ctx.telegram.deleteMessage(ctx.message.reply_to_message.chat.id, ctx.message.reply_to_message.message_id);
            break;
        }
        break;
    }

    // For regular expressions
    if (ctx.message.text.search(/^ор/gi) > -1)
      if (ctx.message.chat.id === SETTINGS.chats.chatocats.id || ctx.message.chat.id === '-378057979') funActions.sendOneCurrencyToUser(ctx);

    if (ctx.message.text.search(/^дой$/gi) > -1)
      if (ctx.message.chat.type === "private") funActions.addDailyCurrency(ctx);

    if (ctx.message.text.search(/спасиб/gi) > -1)
      if (ctx.message.reply_to_message) if (ctx.message.reply_to_message.from.username === 'drivesupportdutybot') ctx.replyWithHTML('Всегда рад 🥰', Telegraf.Extra.inReplyTo(ctx.message.message_id))

    if (ctx.message.text.search(/@drivesupportdutybot/g) > -1)
      if (ctx.message.chat.id === SETTINGS.chats.dtp.id || ctx.message.chat.id === SETTINGS.chats.test.id) {
        if (ctx.message.text.search(/таск/g) > -1 ||
            ctx.message.text.search(/дай/g) > -1 ||
            ctx.message.text.search(/ещё/g) > -1 ||
            ctx.message.text.search(/еще/g) > -1 ||
            ctx.message.text.search(/исчо/g) > -1 ||
            ctx.message.text.search(/можно/g) > -1 ||
            ctx.message.text.search(/хочу/g) > -1) if (dtpActions) dtpActions.getTasksAndGive(ctx);
      }

  }



  if (ctx.message.chat.type === "private") {
    if (callsActions) callsActions.editTask(ctx);
    if (ctx.session) {
      if (ctx.session.stage) if (miscActions) miscActions.addTestHandler(ctx);
    }
    if (taxiActions) return taxiActions.writeInfoTaxi(ctx);
    else return;
  }
})

// UTC time

cron.schedule('0 6 * * *', async () => {
  try {
    var sessionInstance = new RedisSession()
    var localCalls;

    await sessionInstance.getSession('calls').then(session => {
      localCalls = session;
    });

    localCalls.active.forEach(task => {
      if (task.priority === 0) task.priority = 1;
    })

    sessionInstance.saveSession('calls', localCalls);
    telegram.sendMessage(SETTINGS.chats.test.id, 'Unlocked morning tasks');
  } catch  (err) {
    console.log(err);
    telegram.sendMessage(SETTINGS.chats.test.id, 'Failed unlocking morning tasks');
  }
});

cron.schedule('0 21 * * *', async () => {
  try {
    var sessionInstance = new RedisSession()
    var localUsers;

    await sessionInstance.getSession('users').then(session => {
      localUsers = session;
    });

    localUsers.all.forEach(user => {
      if (typeof parseInt(user.info.birthday) !== 'undefined')
        if (parseInt(user.info.birthday) !== '')
          if ((parseInt(user.info.birthday) > date.getCurrent().timestamp) && (parseInt(user.info.birthday) < (date.getCurrent().timestamp + 86400)))
            telegram.sendMessage(SETTINGS.chats.birthday.id, `Сегодня день рождения у @${user.info.telegramUsername}!\n\n<b>День рождения:</b> ${date.getByTimestamp(user.info.birthday).string.birthday}\n<b>Проверить на стаффе:</b> https://staff.yandex-team.ru/${user.info.staffUsername}`, Telegraf.Extra.HTML());
    })

    // TODO: Once a month or week or 2 weeks
    //ctx.telegram.sendMessage(SETTINGS.chats.test.id, Forecast, Telegraf.Extra.HTML());*/

    telegram.sendMessage(SETTINGS.chats.test.id, 'Checked for birthdays');
  } catch (err) {
    console.log(err);
    telegram.sendMessage(SETTINGS.chats.test.id, 'Failed check for birthdays');
  }
});

cron.schedule('0 21 * * *', async () => {
  try {
    var sessionInstance = new RedisSession()
    var localGame;

    await sessionInstance.getSession('game').then(session => {
      localGame = session;
    });

    for (const user in localGame.users) {
      localGame.users[user].currency.dailyReceived = false;
    }

    sessionInstance.saveSession('game', localGame);
    telegram.sendMessage(SETTINGS.chats.test.id, 'Unlocked daily lockers for currency');
  } catch (err) {
    console.log(err);
    telegram.sendMessage(SETTINGS.chats.test.id, 'Failed unlocking daily lockers for currency');
  }
});

cron.schedule('0 21 * * *', async () => {
  try {
    var sessionInstance = new RedisSession()
    var localDTP;

    await sessionInstance.getSession('dtp').then(session => {
      localDTP = session;
    });

    localDTP.tasks.given.slice().reverse().forEach(key => {
      localDTP.tasks.active.unshift(key);
    });

    localDTP.tasks.given = [];

    sessionInstance.saveSession('dtp', localDTP);
    telegram.sendMessage(SETTINGS.chats.test.id, 'Moved all given dtp tasks keys back to active array');
  } catch (err) {
    console.log(err);
    telegram.sendMessage(SETTINGS.chats.test.id, 'Failed dtp shit');
  }
});

cron.schedule('* * * * *', async () => {
  if (miscActions) miscActions.sendRemindersAboutTests(telegram);
  if (dtpActions) dtpActions.unlockCommand(telegram);
  if (statActions) statActions.saveDataToFile(telegram);
});

/*cron.schedule('0 *//*2 * * *', async () => {
  try {
    if (chatsActions) chatsActions.getScheduleForCurrentWeek(ctx);
  } catch (err) {
    console.log(err);
    telegram.sendMessage(SETTINGS.chats.test.id, 'Failed check for birthdays');
  }
});*/




bot.launch()
