const Telegraf = require('telegraf')
const Settings = require('../settings.json')
const utility = require('../utility/index.js');

function getUserFields (ctx) {
  var keys = [];
  Object.keys(ctx.users.all[0]).forEach((key, index) => {
    keys[index] = Object.keys(ctx.users.all[0][key])
  })
  return keys;
}

const ChooseCityMenu = Telegraf.Extra
  .HTML()
  .markup((m) => m.inlineKeyboard([
    m.callbackButton('⚓️ Питер', 'technicianspb'),
    m.callbackButton('🏰 Москва', 'technicianmoscow'),
    m.callbackButton('🕌 Казань', 'techniciankazan')
  ]))


function getInfoStages (ctx, type) {
  var fields = [];
  switch (type) {
    case 'operator':
      fields = ['telegramUsername', 'name']
      messages = ['Пришли <b>telegram логин</b> старшего оператора без знака @', 'Пришли <b>имя</b> (не ФИО, просто имя) старшего оператора\n\n<i>Имя будет использоваться ботом для обращения к человеку</i>']
      break;
    case 'chats':
      fields = ['telegramUsername', 'name']
      messages = ['Пришли <b>telegram логин</b> саппорта в чатах без знака @', 'Пришли имя (не ФИО, просто имя)\n\n<i>Имя будет использоваться ботом для обращения к человеку</i>']
      break;
    case 'technician':
      fields = ['telegramUsername', 'name', 'phone']
      messages = ['Пришли <b>telegram логин</b> техника без знака @', 'Пришли <b>ФИО</b> техника\n\n<i>ФИО используется при размещении заказа такси</i>', 'Пришли <b>телефон</b> техника в формате +799999999998\n\n<i>Телефон используется при заказе такси</i>']
      break;
  }
  return {fields, messages};
}

function getMenuLocalUser (ctx) {
  var userFields = getUserFields(ctx);
  var menu = [];
  menu.roles = [];
  menu.info = [];
  userFields[0].forEach((fieldName) => {
    menu.info.push(Telegraf.Markup.callbackButton(`${ctx.users.all[0].info[fieldName].split('<b>')[1].split('</b>')[0]} ${ctx.session.user.info[fieldName]}`, `actionEditUserInfo_${fieldName}`))
  })
  userFields[1].forEach((roleName) => {
    switch (ctx.session.user.roles[roleName]) {
      case 1:
        menu.roles.push(Telegraf.Markup.callbackButton('✅ ' + ctx.users.all[0].roles[roleName], 'actionSwitchUserRole_' + roleName))
        break;
      case 0:
        menu.roles.push(Telegraf.Markup.callbackButton('❌ ' + ctx.users.all[0].roles[roleName], 'actionSwitchUserRole_' + roleName))
        break;
    }
  })
  menu.roles.push(Telegraf.Markup.callbackButton('✍️ К информации', 'actionEditUser_editInfo'));
  menu.roles.push(Telegraf.Markup.callbackButton('✅ Готово', 'actionEditUser_done'));
  menu.info.push(Telegraf.Markup.callbackButton('⚙️ К доступам', 'actionEditUser_editRoles'));
  menu.info.push(Telegraf.Markup.callbackButton('✅ Готово', 'actionEditUser_done'));
  return menu;
}

function getUserCardByIndex (ctx, userID) {
  var keys = [];
  Object.keys(ctx.users.all[0]).forEach((key, index) => {
    keys[index] = Object.keys(ctx.users.all[0][key])
  })

  var message = '';

  if (userID < 0) {
    message = 'Информации нет. Убедись, что нет опечатки.';
  } else {
    message = 'Карточка <b>' + ctx.users.all[userID].info.telegramUsername + '</b> <i>(' + userID + ')</i>\n';

    message += '\n<i>Контактная информация</i>\n'

    keys[0].forEach((key, index) => {
      if (ctx.users.all[userID]['info'][keys[0][index]].toString().length)
        message += ctx.users.all[0]['info'][keys[0][index]] + ctx.users.all[userID]['info'][keys[0][index]] + '\n'
    });

    message += '\n<i>Доступы</i>\n'

    keys[1].forEach((key, index) => {
      if (ctx.users.all[userID]['roles'][keys[1][index]] > 0)
        message += ctx.users.all[0]['roles'][keys[1][index]] + '\n';
    });
  }
  return message;
}

function hasRoleByTelegramID (ctx, roleToCheck, telegramID) {
  for (var i = 1; i < ctx.users.all.length; i++) {
    if (ctx.users.all[i].info.telegramID == telegramID)
      return ctx.users.all[i].roles[roleToCheck];
  }
  return 0;
}

function hasRoleByTelegramUsername (ctx, roleToCheck, telegramUsername) {
  for (var i = 1; i < ctx.users.all.length; i++) {
    if (ctx.users.all[i].info.telegramUsername === telegramUsername)
      return ctx.users.all[i].roles[roleToCheck];
  }
  return 0;
}

function getIDByTelegramUsername (ctx, username) {
  var stringToSearch = new RegExp(username, 'i');
  var id = -1;
  ctx.users.all.forEach((user, index) => {
    if (user.info.telegramUsername.search(stringToSearch) > -1) id = index;
  })
  return id;
}

function getLocalUserCard (ctx) {
  var keys = getUserFields(ctx);

  var message = 'Карточка <b>' + ctx.session.user.info.telegramUsername + '</b>\n';

  message += '\n<i>Контактная информация</i>\n'

  keys[0].forEach((key, index) => {
    if (ctx.session.user['info'][keys[0][index]].toString().length)
      message += ctx.users.all[0]['info'][keys[0][index]] + ctx.session.user['info'][keys[0][index]] + '\n'
  });

  message += '\n<i>Доступы</i>\n'

  keys[1].forEach((key, index) => {
    if (ctx.session.user['roles'][keys[1][index]] > 0)
      message += ctx.users.all[0]['roles'][keys[1][index]] + '\n';
  });
  return message;
}

module.exports = {
  getIDByTelegramUsername: function (ctx, username) {
    var stringToSearch = new RegExp(username, 'i');
    var id = -1;
    ctx.users.all.forEach((user, index) => {
      if (user.info.telegramUsername.search(stringToSearch) > -1) id = index;
    })
    return id;
  },
  getTelegramIDByTelegramUsername: function (ctx, username) {
    var stringToSearch = new RegExp(username, 'i');
    var id = -1;
    ctx.users.all.forEach((user, index) => {
      if (user.info.telegramUsername.search(stringToSearch) > -1) id = user.info.telegramID;
    })
    return id;
  },
  getIDByTelegramID: function (ctx, telegramID) {
    for (var i = 1; i < ctx.users.all.length; i++) {
      if (ctx.users.all[i].info.telegramID === telegramID)
        return i;
    }
    return -1;
  },
  getIDByStaff: function (ctx, staff) {
    var stringToSearch = new RegExp(staff, 'gi');
    for (var i = 1; i < ctx.users.all.length; i++) {
      if (ctx.users.all[i].info.staffUsername.search(stringToSearch) > -1)
        return i;
    }
    return -1;
  },
  getNameByPhone: function (ctx, phone) {
    for (var i = 1; i < ctx.users.all.length; i++) {
      if (ctx.users.all[i].info.phone === phone)
        return ctx.users.all[i].info.name;
    }
    return -1;
  },
  hasRoleByTelegramID: function (ctx, roleToCheck, telegramID) {
    for (var i = 1; i < ctx.users.all.length; i++) {
      if (ctx.users.all[i].info.telegramID === telegramID)
        return ctx.users.all[i].roles[roleToCheck];
    }
    return 0;
  },
  hasRoleByTelegramUsername: function (ctx, roleToCheck, telegramUsername) {
    for (var i = 1; i < ctx.users.all.length; i++) {
      if (ctx.users.all[i].info.telegramUsername === telegramUsername)
        return ctx.users.all[i].roles[roleToCheck];
    }
    return 0;
  },
  hasRoleByPhone: function (ctx, roleToCheck, phone) {
    for (var i = 1; i < ctx.users.all.length; i++) {
      if (ctx.users.all[i].info.phone === phone)
        return ctx.users.all[i].roles[roleToCheck];
    }
    return 0;
  },
  hasRole: function (ctx, roleToCheck) { //need to rename or replace this one
    for (var i = 1; i < ctx.users.all.length; i++) {
      if (typeof ctx.message == "undefined") {
        if (ctx.users.all[i].info.telegramUsername === ctx.from.username)
          return ctx.users.all[i].roles[roleToCheck];
      } else {
        if (ctx.users.all[i].info.telegramUsername === ctx.message.from.username)
          return ctx.users.all[i].roles[roleToCheck];
      }
    }
    return 0;
  },


  createBlankUser: function (ctx) {
    var userFields = getUserFields(ctx);
    ctx.session.user = {info: {}, roles: {}};
    userFields[0].forEach((fieldName) => {
      ctx.session.user.info[fieldName] = '';
    })
    userFields[1].forEach((fieldName) => {
      ctx.session.user.roles[fieldName] = 0;
    })
  },


  getUserFields: function (ctx) {
    var keys = [];
    Object.keys(ctx.users.all[0]).forEach((key, index) => {
      keys[index] = Object.keys(ctx.users.all[0][key])
    })
    return keys;
  },


  getUserCardByIndex: function (ctx, userID) {
    var keys = [];
    Object.keys(ctx.users.all[0]).forEach((key, index) => {
      keys[index] = Object.keys(ctx.users.all[0][key])
    })

    var message = '';

    if (userID < 0) {
      message = 'Информации нет. Убедись, что нет опечатки.';
    } else {
      message = 'Карточка <b>' + ctx.users.all[userID].info.telegramUsername + '</b> <i>(' + userID + ')</i>\n';

      message += '\n<i>Контактная информация</i>\n'

      keys[0].forEach((key, index) => {
        if (ctx.users.all[userID]['info'][keys[0][index]].toString().length)
          message += ctx.users.all[0]['info'][keys[0][index]] + ctx.users.all[userID]['info'][keys[0][index]] + '\n'
      });

      message += '\n<i>Доступы</i>\n'

      keys[1].forEach((key, index) => {
        if (ctx.users.all[userID]['roles'][keys[1][index]] > 0)
          message += ctx.users.all[0]['roles'][keys[1][index]] + '\n';
      });
    }
    return message;
  },


  isTechnicianByTelegramID: function (ctx, telegramID) {
    console.log(hasRoleByTelegramID(ctx, 'technicianMoscow', telegramID))
    if (hasRoleByTelegramID(ctx, 'technicianMoscow', telegramID) || hasRoleByTelegramID(ctx, 'technicianSaintPetersburg', telegramID) || hasRoleByTelegramID(ctx, 'technicianKazan', telegramID))
      return 1;
    else
      return 0;
  },


  createStagesForUser: function (ctx, type) {
    ctx.session.currentField = 0;
    ctx.session.fields = getInfoStages(ctx, type).fields;
    ctx.session.messages = getInfoStages(ctx, type).messages;
    ctx.session.type = type;
    ctx.replyWithHTML(ctx.session.messages[ctx.session.currentField]);
  },


  waitForCreationInfo: function (ctx) {
    if (typeof ctx.session.currentField != 'undefined' && ctx.session.currentField != null) {

      // Let imagine example: we want to create user with 4 fields: username,
      // name, phone and birthday
      // length = 4
      // lastIndex = 3

      // If it is username, name or phone - write field, go further and send
      //message
      if (ctx.session.currentField < (ctx.session.fields.length - 1)) {
        ctx.session.user.info[ctx.session.fields[ctx.session.currentField]] = ctx.message.text;
        ctx.session.currentField++;
        ctx.replyWithHTML(ctx.session.messages[ctx.session.currentField])
      } else {

        // If it is lastField (birthday) - write info, set particular role
        if (ctx.session.currentField === (ctx.session.fields.length - 1)) {
          ctx.session.user.info[ctx.session.fields[ctx.session.currentField]] = ctx.message.text;
          switch (ctx.session.type) {
            case 'operator':
              ctx.session.user.roles.seniorOperator = 1;
              ctx.users.all.push(ctx.session.user)
              ctx.session = undefined;
              ctx.replyWithHTML('Новый старший оператор успешно добавлен!\n\n' + getUserCardByIndex(ctx, ctx.users.all.length - 1));
              break;
            case 'chats':
              ctx.session.user.roles.chats = 1;
              ctx.users.all.push(ctx.session.user)
              ctx.session = undefined;
              ctx.replyWithHTML('Новый чатовский успешно добавлен!\n\n' + getUserCardByIndex(ctx, ctx.users.all.length - 1));
              break;
            case 'technician':
              ctx.replyWithHTML('Выбери <b>город</b>, в котором работает техник', ChooseCityMenu);
              break;
          }
        }
      }
    }
  },


  sendMenuEditUser: function (ctx) {
    var stringBefore = '/edit '
    var loginToEdit = ctx.message.text.substring(stringBefore.length, ctx.message.text.length);
    if (loginToEdit === '') {
      ctx.reply('Использование команды\n\n/edit <telegram_login>\n\nНапример: /edit ' + ctx.message.from.username);
    } else {
      ctx.session.ID = getIDByTelegramUsername(ctx, loginToEdit);
      ctx.session.user = ctx.users.all[ctx.session.ID];
      if (ctx.session.ID < 0) {
        ctx.reply('Не найден человек с логином @' + loginToEdit);
      } else {
        var menuUserInfo = getMenuLocalUser(ctx).info;
        ctx.replyWithHTML(getUserCardByIndex(ctx, ctx.session.ID), Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menuUserInfo, {
          columns: 1
        })))
      }
    }
  },


  sendMenuEditRoles: function (ctx) {
    ctx.deleteMessage();
    var menu = getMenuLocalUser(ctx);
    ctx.replyWithHTML(`Выбери нужные роли для @${ctx.session.user.info.telegramUsername}`, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menu.roles, {
      columns: 2
    })))
  },

  sendMenuEditInfo: function (ctx) {
    ctx.deleteMessage();
    var menu = getMenuLocalUser(ctx);
    ctx.replyWithHTML(getLocalUserCard(ctx), Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menu.info, {
      columns: 1
    })))
  },

  cancelEditInfo: function (ctx) {
    ctx.deleteMessage();
    ctx.users.all[ctx.session.ID] = ctx.session.user;
    ctx.replyWithHTML('Пользователь успешно сохранён!\n\n' + getLocalUserCard(ctx))
  },

  switchRole: function (ctx) {
    var roleName = ctx.callbackQuery.data.split('_')[1];
    if (ctx.session.user.roles[roleName]) {
      ctx.session.user.roles[roleName] = 0;
    } else {
      ctx.session.user.roles[roleName] = 1;
    }
    ctx.deleteMessage();
    menu = getMenuLocalUser(ctx);
    ctx.replyWithHTML(`Выбери нужные роли для @${ctx.session.user.info.telegramUsername}`, Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menu.roles, {
      columns: 2
    })))
  },

  sendUserCard: function (ctx) {
    var stringBefore = '/info '
    var loginToCheck = ctx.message.text.substring(stringBefore.length, ctx.message.text.length);
    var userID = getIDByTelegramUsername(ctx, loginToCheck)
    ctx.replyWithHTML(getUserCardByIndex(ctx, userID));
  },

  waitForNewInfo: function (ctx) {
    ctx.session.fieldToChange = ctx.callbackQuery.data.split('_')[1];
    ctx.replyWithHTML(`Пришли новое значение поля ${ctx.users.all[0].info[ctx.session.fieldToChange].split(':')[0]}</b>`);
    utility.hideMenu(ctx);
  },

  writeNewInfo: function (ctx) {
    ctx.session.user.info[ctx.session.fieldToChange] = ctx.message.text;
    var menu = getMenuLocalUser(ctx);
    ctx.replyWithHTML('Успех!\n\n' + getLocalUserCard(ctx), Telegraf.Extra.HTML().markup((m) => m.inlineKeyboard(menu.info, {
      columns: 1
    })))
    ctx.session.fieldToChange = undefined;
  },


  checkForDuplicates: function (ctx) {
    ctx.users.all.forEach((user, index) => {
      ctx.users.all.forEach((anotherUser, anotherIndex) => {
        if (user.info.telegramUsername === anotherUser.info.telegramUsername && index !== anotherIndex) {
          console.log(`${anotherIndex} seems like a duplicate of ${index}: ${anotherUser.info.telegramUsername} === ${user.info.telegramUsername}`);
        }
      })
    })
    console.log('done');
  },

  greetAndWriteID: function (ctx) {
    var userID = getIDByTelegramUsername(ctx, ctx.message.from.username);
    if (userID > -1) {
      if (ctx.users.all[userID].info.telegramID == 0 || ctx.users.all[userID].info.telegramID == '') {
        ctx.users.all[userID].info.telegramID = ctx.message.from.id;
        ctx.telegram.sendMessage(Settings.chats.test.id, 'Записал Telegram ID для @' + ctx.message.from.username + ' <i>(' + userID + ')</i>: ' + ctx.message.from.id, Telegraf.Extra.HTML());
        if (ctx.users.all[userID].info.name.length > 2 && typeof ctx.users.all[userID].info.name !== 'undefined') ctx.replyWithHTML(`Привет, ${ctx.users.all[userID].info.name} :) Теперь тебе доступен функционал бота`); else ctx.replyWithHTML(`Привет :) Теперь тебе доступен функционал бота`);
      } else {
        ctx.replyWithHTML('Привет! Тебе доступен функционал бота, можно больше не писать /start');
      }
    }
  },


  checkIfIsTechnician: function (ctx) {
    if (typeof ctx.message.reply_to_message !== 'undefined') {
      if (typeof ctx.message.reply_to_message.from.username !== 'undefined') {
        if (hasRoleByTelegramUsername(ctx, 'technicianMoscow', ctx.message.reply_to_message.from.username) || hasRoleByTelegramUsername(ctx, 'technicianSaintPetersburg', ctx.message.reply_to_message.from.username) || hasRoleByTelegramUsername(ctx, 'technicianKazan', ctx.message.reply_to_message.from.username)) {
          if (hasRoleByTelegramID(ctx, 'technicianMoscow', ctx.message.reply_to_message.from.id) || hasRoleByTelegramID(ctx, 'technicianSaintPetersburg', ctx.message.reply_to_message.from.id) || hasRoleByTelegramID(ctx, 'technicianKazan', ctx.message.reply_to_message.from.id))
            ctx.replyWithHTML(`@${ctx.message.reply_to_message.from.username} может заказывать такси через бота.\n\n<i>Для заказа такси необходимо написать команду /taxi в ЛС @drivesupportdutybot</i>`)
          else
            ctx.replyWithHTML(`Данные о @${ctx.message.reply_to_message.from.username} у бота есть, но нужно записать ID.\n\nДля этого @${ctx.message.reply_to_message.from.username} должен <b>в ЛС @drivesupportdutybot</b> написать команду /start`)
        } else {
          ctx.replyWithHTML(`Данных о @${ctx.message.reply_to_message.from.username} нет.\n\nЕсли нужно добавить информацию о технике - @${ctx.message.reply_to_message.from.username} должен написать в ЛС @example_login ФИО и номер телефона`);
        }
      } else {
        ctx.replyWithHTML(`Похоже, что у проверяемого пользователя <b>не установлен логин телеграм</b>. Нужно это сделать в ближайшее время.`)
      }
    } else {
      ctx.replyWithHTML(`Для проверки доступов техника, используй команду /check, <b>отвечая</b> на сообщение техника.`)
    }
  },



  getUserInfoByAnotherInfo: function (ctx, fieldToGet, fieldFromName, fieldFromValue) {
    var userID = -1;
    ctx.users.all.forEach((user, index) => {
      if (user.info[fieldFromName] === fieldFromValue) userID = index;
    })

    return ctx.users.all[userID].info[fieldToGet];
  }
}
