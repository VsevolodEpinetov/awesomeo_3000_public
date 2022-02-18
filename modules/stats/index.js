const SETTINGS = require('./settings.json')
const user = require('../users/index.js');
const fs = require('fs');
const RedisSession = require('telegraf-session-redis')

module.exports = {
  registerMessage: ctx => {
    //console.log('yep')

    var chat;

    SETTINGS.CHATS.forEach(chatFromSettings => {
      if (ctx.message.chat.id === chatFromSettings.ID) chat = chatFromSettings
    });

    if (chat) {
      chat.TITLE = ctx.message.chat.title;

      var message = {
        telegramUsername: ctx.message.from.username,
        timestamp: ctx.message.date,
      }

      if (user.hasRoleByTelegramID(ctx, 'duty', ctx.message.from.id)) message.isDuty = true;

      if (ctx.message.reply_to_message) {
        message.replyTo = {
          telegramUsername: ctx.message.reply_to_message.from.username
        }

        if (user.hasRoleByTelegramID(ctx, 'duty', ctx.message.reply_to_message.from.id)) message.replyTo.isDuty = true;
      }

      if (ctx.message.sticker) {
        message.type = 'sticker'
      } else {
        if (ctx.message.photo) {
          if (ctx.message.caption) {
            message.type = 'photoWithText'
          } else {
            message.type = 'photo'
          }
        } else {
          if (ctx.message.text) {
            message.type = 'text'
          }
        }
      }

      var objectAddress = chat.ID.toString();
      if (!ctx.stats[objectAddress]) ctx.stats[objectAddress] = [];
      ctx.stats[objectAddress].push(message)
    }
  },


  saveDataToFile: async (telegram) => {
    var sessionInstance = new RedisSession()

    var localStats;
    await sessionInstance.getSession('stats').then(session => {
      localStats = session;
    });

    var data = JSON.stringify(localStats, null, 2);
    fs.writeFileSync('chatsStats.json', data);
    console.log('[INFO] Saved stats to file');
  }
}
