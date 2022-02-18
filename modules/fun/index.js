const settings = require('../settings.json')
const promocodes = require('./promocodes.json')
const date = require('../date/index.js')
const Telegraf = require('telegraf')
const Telegram = require('telegraf/telegram')
var moment = require('moment');


function ID () {
  return `${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}-${Math.random().toString(36).substr(2, 9)}`;
};

module.exports = {

  sendHlop: function (ctx) {
    ctx.replyWithHTML('Хлоп!');
  },

  addDailyCurrency: function (ctx) {
    if (!ctx.game.users) ctx.game.users = {};
    if (!ctx.game.users[ctx.message.from.username]) ctx.game.users[ctx.message.from.username] = {
      "currency": {
        "amount": 0,
        "history": [],
        "dailyReceived": false
      }
    };

    if (!ctx.game.users[ctx.message.from.username].currency.dailyReceived) {
      ctx.game.users[ctx.message.from.username].currency.amount += 5;
      ctx.game.users[ctx.message.from.username].currency.dailyReceived = true;
      ctx.game.users[ctx.message.from.username].currency.history.push({
        "type": "+",
        "telegramUsername": "telegram_username_general",
        "reason": "daily",
        "timestamp": ctx.message.date,
        "id": ID()
      })
      var message = `Выдал тебе ежедневные 5 оров.\n\n<b>Текущий баланс:</b> ${ctx.game.users[ctx.message.from.username].currency.amount}🗣`;
      ctx.replyWithHTML(message, Telegraf.Extra.inReplyTo(ctx.message.message_id))
    } else {
      var message = `Похоже, что ты уже сегодня получал свои оры 🤔\n\n<b>Текущий баланс:</b> ${ctx.game.users[ctx.message.from.username].currency.amount}🗣`;
      ctx.replyWithHTML(message, Telegraf.Extra.inReplyTo(ctx.message.message_id))
    }
  },



  sendCurrencyToUser: function (ctx) {
    if (ctx.message.reply_to_message) {
      if (!ctx.game.users) ctx.game.users = {};
      if (!ctx.game.users[ctx.message.from.username]) ctx.game.users[ctx.message.from.username] = {
        "currency": {
          "amount": 0,
          "history": []
        }
      };

      if (!ctx.game.users[ctx.message.reply_to_message.from.username]) ctx.game.users[ctx.message.reply_to_message.from.username] = {
        "currency": {
          "amount": 0,
          "history": []
        }
      };

      var amountToSend = Math.round(parseInt(ctx.message.text.split(' ')[1]));
      if (amountToSend) {
        if ((ctx.game.users[ctx.message.from.username].currency.amount - amountToSend) >= 0) {
          var timestamp = ctx.message.date;
          var id = ID();

          ctx.game.users[ctx.message.from.username].currency.amount -= amountToSend;
          ctx.game.users[ctx.message.from.username].currency.history.push({
            "type": "-",
            "telegramUsername": ctx.message.reply_to_message.from.username,
            "reason": `command in chat ${ctx.message.chat.title} (${ctx.message.chat.id})`,
            "timestamp": timestamp,
            "id": id
          })

          ctx.game.users[ctx.message.reply_to_message.from.username].currency.amount += amountToSend;
          ctx.game.users[ctx.message.reply_to_message.from.username].currency.history.push({
            "type": "+",
            "telegramUsername": ctx.message.from.username,
            "reason": `command in chat ${ctx.message.chat.title} (${ctx.message.chat.id})`,
            "timestamp": timestamp,
            "id": id
          })

          ctx.replyWithHTML(`Успешно отправил ${amountToSend}🗣!`, Telegraf.Extra.inReplyTo(ctx.message.message_id))
        } else {
          ctx.replyWithHTML(`Котик, похоже, что ты уже проорал всё своё состояние 😭`, Telegraf.Extra.inReplyTo(ctx.message.message_id))
        }
      } else {
        ctx.replyWithHTML(`Похоже, что ты <b>забыл указать целое число</b> передаваемых оров  (или указал не число, глупышка 🥰)`, Telegraf.Extra.inReplyTo(ctx.message.message_id))
      }
    } else {
      ctx.replyWithHTML(`Используй команду /give <b>отвечая</b> на сообщение, указав <b>целое</b> количество передаваемых оров.\n<b>Пример:</b> /give 2`, Telegraf.Extra.inReplyTo(ctx.message.message_id))
    }
  },


  sendOneCurrencyToUser: function (ctx) {
    if (ctx.message.reply_to_message) {
      if (!ctx.game.users) ctx.game.users = {};
      if (!ctx.game.users[ctx.message.from.username]) ctx.game.users[ctx.message.from.username] = {
        "currency": {
          "amount": 0,
          "history": []
        }
      };

      if (!ctx.game.users[ctx.message.reply_to_message.from.username]) ctx.game.users[ctx.message.reply_to_message.from.username] = {
        "currency": {
          "amount": 0,
          "history": []
        }
      };

      var amountToSend = 1;
      if (amountToSend) {
        if ((ctx.game.users[ctx.message.from.username].currency.amount - amountToSend) >= 0) {
          var timestamp = ctx.message.date;
          var id = ID();

          ctx.game.users[ctx.message.from.username].currency.amount -= amountToSend;
          ctx.game.users[ctx.message.from.username].currency.history.push({
            "type": "-",
            "telegramUsername": ctx.message.reply_to_message.from.username,
            "reason": `command in chat ${ctx.message.chat.title} (${ctx.message.chat.id})`,
            "timestamp": timestamp,
            "id": id
          })

          ctx.game.users[ctx.message.reply_to_message.from.username].currency.amount += amountToSend;
          ctx.game.users[ctx.message.reply_to_message.from.username].currency.history.push({
            "type": "+",
            "telegramUsername": ctx.message.from.username,
            "reason": `command in chat ${ctx.message.chat.title} (${ctx.message.chat.id})`,
            "timestamp": timestamp,
            "id": id
          })

          ctx.replyWithHTML(`Отправил один ор`, Telegraf.Extra.inReplyTo(ctx.message.message_id))
        }
      }
    }
  },


  registerPromocode: function (ctx) {
    if (!ctx.game.users) ctx.game.users = {};
    if (!ctx.game.users[ctx.message.from.username]) ctx.game.users[ctx.message.from.username] = {
      "currency": {
        "amount": 0,
        "history": []
      }
    }
    if (!ctx.game.users[ctx.message.from.username].promocodes) ctx.game.users[ctx.message.from.username].promocodes = [];

    var promocodeFromUser = ctx.message.text.split(' ')[1];
    if (promocodeFromUser) {
      var promocode;
      for (var index in promocodes) {
        if (promocodes[index].name === promocodeFromUser) promocode = promocodes[index];
      }

      if (promocode) {
        var dateIsFine = false;

        if (promocode.dueTo) {
          if (date.convertStringToTimestamp(promocode.dueTo) > date.getCurrent().timestamp) dateIsFine = true;
        }
        else {
          dateIsFine = true;
        }

        if (dateIsFine) {
          if (ctx.game.users[ctx.message.from.username].promocodes.indexOf(promocode.name) < 0) {
            if (parseInt(promocode.amount)) {
              try {
                var id = ID();

                ctx.game.users[ctx.message.from.username].currency.amount += parseInt(promocode.amount);
                ctx.game.users[ctx.message.from.username].currency.history.push({
                  "type": "+",
                  "telegramUsername": ctx.message.from.username,
                  "reason": `used promocode ${promocode.name}`,
                  "timestamp": ctx.message.date,
                  "id": id
                })
                ctx.game.users[ctx.message.from.username].promocodes.push(promocode.name)

                var message = `Выдал тебе ${promocode.amount}🗣 по промокоду ${promocode.name} \n\n<b>Текущий баланс:</b> ${ctx.game.users[ctx.message.from.username].currency.amount}🗣`;
                ctx.replyWithHTML(message, Telegraf.Extra.inReplyTo(ctx.message.message_id))
              } catch (err) {
                console.log(err);
                ctx.replyWithHTML('Что-то пошло не так, попробуй позже')
              }
            } else {
              ctx.replyWithHTML('Ошибка промокода')
            }
          } else {
            ctx.replyWithHTML(`Ты уже использовал промокод <b>${promocodeFromUser}</b> 🤔\n\n<i>Все промокоды - одноразовы, использовать дважды их не получится</i>`)
          }
        } else {
          ctx.replyWithHTML(`Промокод <b>${promocodeFromUser}</b> можно было использовать вплоть до <b>${date.getByTimestamp(date.convertStringToTimestamp(promocode.dueTo)).string.DDMMhhmmYYYY}</b> 🧐`)
        }
      } else {
        ctx.replyWithHTML(`Не нашёл промокод <b>${promocodeFromUser}</b>. Убедись в правильности написания, спроси совета у родных и близких, возможно, что они знают, где ошибка`)
      }
    } else {
      ctx.replyWithHTML(`Пупсик, похоже, что ты забыл ввести промокод. Попробуй ещё разок 🥰`)
    }
  }
}
