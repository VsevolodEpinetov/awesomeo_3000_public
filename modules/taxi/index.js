const Telegraf = require('telegraf')
const date = require('../date/index.js');
const utility = require('../utility/index.js');
const user = require('../users/index.js');
const Settings = require('../settings.json')
const YandexGeocoder = require('nodejs-yandex-geocoder')
const request = require('request');

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

function getAddressByCoordinates (coordinates) {
  return new Promise(function (resolve, reject) {
    request(`https://geocode-maps.yandex.ru/1.x/?apikey=e84ddeff-cc15-48bb-9929-b9fbdb3dd78a&geocode=${coordinates}&kind=house&format=json&results=1`, function (error, res, body) {
      if (!error && res.statusCode == 200) {
        var json = JSON.parse(body);
        try {
          resolve(json.response.GeoObjectCollection.featureMember[0].GeoObject.name);
        }
        catch (err) {
          console.log(body);
          console.log(err);
          resolve('undefined');
        }
      } else {
        reject(error);
      }
    });
  });
}

const menuCallACabDutyActions = Telegraf.Extra
  .HTML()
  .markup((m) => m.inlineKeyboard([
    m.urlButton('🚕 Вызвать такси', 'https://business.taxi.yandex.ru/order'),
    m.urlButton('✏️ Внести в список', 'https://wiki.yandex-team.ru/eva/drive/tosenior/howto/taxi/'),
    m.callbackButton('✅ Отметить выполненным', 'actionMatchAsDoneTaxi'),
  ], {
    columns: 2
  }))

const menuActionsWithTaxiOrder = Telegraf.Extra
  .HTML()
  .markup((m) => m.inlineKeyboard([
    m.callbackButton('Взять в работу', 'actionSetDutyTaxi')
  ]))

const menuCallACab = Telegraf.Extra
  .HTML()
  .markup((m) => m.inlineKeyboard([
    m.callbackButton('🚕 Заказать такси', 'actionCallACab')
  ]))

const menuCallACabMoscowPopularPlacesFrom = Telegraf.Extra
  .HTML()
  .markup((m) => m.inlineKeyboard([
    m.callbackButton('Цветочный проезд, 13', 'actionCallACabEnteredFromTsvetochniy'),
    m.callbackButton('улица Декабристов, вл47а', 'actionCallACabEnteredFromDecabristov'),
    m.callbackButton('Major Volvo МКАД 47 км', 'actionCallACabEnteredFrom47'),
    m.callbackButton('Новая Рига, BMW центр', 'actionCallACabEnteredFromNovayaRiga'),
    m.callbackButton('Mercedes-Benz МКАД 92 км', 'actionCallACabEnteredFrom92'),
    m.callbackButton('Audi, МКАД 18 км', 'actionCallACabEnteredFrom18')
  ], {
    columns: 1
  }))


function getCabMessage (ctx, orderNumber) {
  var userID = user.getIDByTelegramUsername(ctx, ctx.taxi.orders[orderNumber].telegramUsername)
  var message = 'Заявка №' + orderNumber + ' от @' + ctx.taxi.orders[orderNumber].telegramUsername + '!\n' +
    '\n' +
    '<b>От:</b> ' + ctx.taxi.orders[orderNumber].from + '\n' +
    '<b>До:</b> ' + ctx.taxi.orders[orderNumber].to + '\n' +
    '<b>Номер телефона:</b> ' + ctx.users.all[userID].info.phone + '\n' +
    '<b>ФИО:</b> ' + ctx.users.all[userID].info.name + '\n' +
    '\n' +
    '<b>Текущий статус:</b> ' + ctx.taxi.orders[orderNumber].status;
  return message;
}

module.exports = {
  enterAddressFrom: function (ctx) {
    if (typeof ctx.session.taxi === 'undefined') {
      if (typeof ctx.update.callback_query === 'undefined') {
        ctx.session.taxi = {
          telegramUsername: ctx.message.from.username,
        }
        if (user.hasRoleByTelegramID(ctx, 'technicianMoscow', ctx.message.from.id)) {
          return ctx.replyWithHTML('Пришли адрес, <b>откуда</b> нужно тебя забрать.\n\n<i>Вместо текста можно прислать геолокацию через встроенный функционал Telegram. Если нужно отменить заказ, напиши слово "отмена"</i>', menuCallACabMoscowPopularPlacesFrom).then((nctx) => {
            ctx.session.taxi.messageIDTo = nctx.message_id;
          })
        } else {
          return ctx.replyWithHTML('Пришли адрес, <b>откуда</b> нужно тебя забрать.\n\n<i>Вместо текста можно прислать геолокацию через встроенный функционал Telegram. Если нужно отменить заказ, напиши слово "отмена"</i>').then((nctx) => {
            ctx.session.taxi.messageIDTo = nctx.message_id;
          })
        }
      } else {
        ctx.session.taxi = {
          telegramUsername: ctx.update.callback_query.from.username
        }
        if (user.hasRoleByTelegramID(ctx, 'technicianMoscow',  ctx.update.callback_query.from.id)) {
          return ctx.replyWithHTML('Пришли адрес, <b>откуда</b> нужно тебя забрать.\n\n<i>Вместо текста можно прислать геолокацию через встроенный функционал Telegram. Если нужно отменить заказ, напиши слово "отмена"</i>', menuCallACabMoscowPopularPlacesFrom).then((nctx) => {
            ctx.session.taxi.messageIDTo = nctx.message_id;
          })
        } else {
          return ctx.replyWithHTML('Пришли адрес, <b>откуда</b> нужно тебя забрать.\n\n<i>Вместо текста можно прислать геолокацию через встроенный функционал Telegram. Если нужно отменить заказ, напиши слово "отмена"</i>').then((nctx) => {
            ctx.session.taxi.messageIDTo = nctx.message_id;
          })
        }
      }
    } else {
      if (typeof ctx.session.taxi.from === 'undefined') {
        ctx.replyWithHTML('Ты уже и так вызываешь такси, жду от тебя адрес <b>отправления</b>')
      } else {
        if (typeof ctx.session.taxi.to === 'undefined') {
          ctx.replyWithHTML('Ты уже и так вызываешь такси, жду адрес <b>прибытия</b>')
        }
      }
    }
  },


  enterAddressFavourite: function (ctx) {
    var fromInAction = ctx.callbackQuery.data.split('actionCallACabEnteredFrom')[1];
    var from = '';
    switch (fromInAction) {
      case 'Tsvetochniy':
        from = 'Цветочный проезд, 13';
        break;
      case 'Decabristov':
        from = 'улица Декабристов, вл47а';
        break;
      case '47':
        from = 'Major Volvo МКАД 47 км';
        break;
      case 'NovayaRiga':
        from = 'Новорижское шоссе, 25-й километр, 22';
        break;
      case '92':
        from = 'Мерседес-Бенц Автофорум';
        break;
      case '18':
        from = 'ФИО';
        break;
    }
    ctx.session.taxi.from = from;
    ctx.deleteMessage();
    return ctx.replyWithHTML('Успешно выбран <b>' + from + '</b>! \n\nПришли адрес, <b>куда</b> нужно доехать.\n\n<i>Вместо текста можно прислать геолокацию через встроенный функционал Telegram. Если нужно отменить заказ, напиши слово "отмена"</i>').then((nctx) => {
      ctx.session.taxi.messageIDFrom = nctx.message_id;
    });
  },


  writeInfoTaxi: async function (ctx) {
    try {
      if (typeof ctx.session.taxi === 'undefined') {return;}
      if (typeof ctx.session.taxi.from === 'undefined') {
        ctx.telegram.deleteMessage(ctx.message.from.id, ctx.session.taxi.messageIDTo);
        if (ctx.message.location) {
          var longitude = ctx.message.location.longitude;
          var latitude = ctx.message.location.latitude;
          var coordinates = `${longitude},${latitude}`;
          ctx.replyWithHTML('Минуточку, ищу адрес...')

          var address = await getAddressByCoordinates(coordinates);

          if (typeof address !== 'undefined') {
            ctx.session.taxi.from = `${address}`;
            return ctx.replyWithHTML(`<b>Записал адрес отправления:</b> ${address}\n\nПришли адрес, <b>куда</b> нужно доехать.\n<i>Вместо текста можно прислать геолокацию через встроенный функционал Telegram. Если нужно отменить заказ, напиши слово "отмена"</i>\n\n`).then((nctx) => {
              ctx.session.taxi.messageIDFrom = nctx.message_id;
            });
            return;
          } else {
            ctx.telegram.sendMessage(Settings.chats.test.id, `У @${ctx.session.taxi.telegramUsername} ошибка получения данных от Геокодера на этапе отравления откуда, пользователь отправлял геолокацию. Адрес неизвестен.`);
            ctx.replyWithHTML('Ошибка получения данных. Давай попробуем ещё раз 🙃', menuCallACab);
            return;
          }

        } else {
          // If it is not location, but coordinates
          if (ctx.message.text.search(/([0-9][0-9])\.([0-9]+)\,([0-9][0-9])\.([0-9]+)/gi) > -1) {
            // Actually we need to swap coordinates in message, so let's do it
            // TODO: change to .split()
            var longitude = ctx.message.text.split(',')[1];
            var latitude = ctx.message.text.split(',')[0];
            ctx.replyWithHTML('Минуточку, ищу адрес...')
            var coordinates = `${longtitude},${latitude}`;

            var address = await getAddressByCoordinates(coordinates);

            if (typeof address !== 'undefined') {
              ctx.session.taxi.from = `${ctx.message.text} (${address})`;
              return ctx.replyWithHTML(`<b>Записал адрес отправления:</b> ${address}\n\nПришли адрес, <b>куда</b> нужно доехать.\n<i>Вместо текста можно прислать геолокацию через встроенный функционал Telegram. Если нужно отменить заказ, напиши слово "отмена"</i>\n\n`).then((nctx) => {
                ctx.session.taxi.messageIDFrom = nctx.message_id;
              });
            } else {
              ctx.telegram.sendMessage(Settings.chats.test.id, `У @${ctx.session.taxi.telegramUsername} ошибка получения данных от Геокодера на этапе отравления откуда, пользователь отправлял координаты. Адрес неизвестен.`);
              ctx.replyWithHTML('Ошибка получения данных. Давай попробуем ещё раз 🙃', menuCallACab);
              return;
            }

          } else {
            ctx.session.taxi.from = ctx.message.text;
            return ctx.replyWithHTML(`<b>Записал адрес отправления:</b> ${ctx.message.text}\n\nПришли адрес, <b>куда</b> нужно доехать.\n<i>Вместо текста можно прислать геолокацию через встроенный функционал Telegram. Если нужно отменить заказ, напиши слово "отмена"</i>\n\n`).then((nctx) => {
              ctx.session.taxi.messageIDFrom = nctx.message_id;
            });
          }
        }
      }
      else {
        if (typeof ctx.session.taxi.to === 'undefined') {
          ctx.telegram.deleteMessage(ctx.message.from.id, ctx.session.taxi.messageIDFrom);
          if (ctx.message.location) {
            var longitude = ctx.message.location.longitude;
            var latitude = ctx.message.location.latitude;
            var coordinates = `${longitude},${latitude}`;
            ctx.replyWithHTML('Минуточку, ищу адрес...')

            var address = await getAddressByCoordinates(coordinates);

            if (typeof address !== 'undefined') {
              ctx.session.taxi.to = `${address}`;
            } else {
              ctx.telegram.sendMessage(Settings.chats.test.id, `У @${ctx.session.taxi.telegramUsername} ошибка получения данных от Геокодера на этапе отравления куда, пользователь отправлял геолокацию. Адрес неизвестен.`);
              ctx.replyWithHTML('Ошибка получения данных. Давай попробуем ещё раз 🙃', menuCallACab);
            }
          } else {
            if (ctx.message.text.search(/([0-9][0-9])\.([0-9]+)\,([0-9][0-9])\.([0-9]+)/gi) > -1) {
              ctx.replyWithHTML('Минуточку, ищу адрес...')
              //TODO: change to .split()
              var longitude = ctx.message.text.split(',')[1];
              var latitude = ctx.message.text.split(',')[0];
              var coordinates = `${longitude},${latitude}`;

              var address = await getAddressByCoordinates(coordinates);

              if (typeof address !== 'undefined') {
                ctx.session.taxi.to = `${ctx.message.text} (${address})`;
              } else {
                ctx.telegram.sendMessage(Settings.chats.test.id, `У @${ctx.session.taxi.telegramUsername} ошибка получения данных от Геокодера на этапе отравления куда, пользователь отправлял координаты. Адрес неизвестен.`);
                ctx.replyWithHTML('Ошибка получения данных. Давай попробуем ещё раз 🙃', menuCallACab);
                return;
              }
            } else {
              ctx.session.taxi.to = ctx.message.text;
            }
          }
          ctx.session.taxi.timestamp = ctx.message.date;
          ctx.session.taxi.status = 'Ожидание дежурного';

          var userID = -1;
          userID = user.getIDByTelegramUsername(ctx, ctx.session.taxi.telegramUsername);
          if (userID > -1) {
            ctx.session.taxi.telegramID = ctx.users.all[userID].info.telegramID;
            ctx.session.taxi.chat = {};
            if (user.hasRoleByTelegramUsername(ctx, 'technicianSaintPetersburg', ctx.session.taxi.telegramUsername)) ctx.session.taxi.chat.id = Settings.chats.spbTechicians.id;
            else if (user.hasRoleByTelegramUsername(ctx, 'technicianKazan', ctx.session.taxi.telegramUsername)) ctx.session.taxi.chat.id = Settings.chats.kazanTechnicians.id;
            else ctx.session.taxi.chat.id = Settings.chats.moscowTechicians.id;
          } else {
            ctx.telegram.sendMessage(Settings.chats.test.id, '@' + ctx.taxi.orders[orderNumber].telegramUsername + ' дошёл до конца заказа такси, но не смог найти его ID в базе.');
            return;
          }

          var orderNumber = ctx.taxi.orders.length;

          const menuCabCancelTheOrder = Telegraf.Extra
            .HTML()
            .markup((m) => m.inlineKeyboard([
              m.callbackButton('❌ Отменить заказ ❌', `actionCabCancelTheOrder_${orderNumber}`)
            ]))

          ctx.taxi.orders.push(ctx.session.taxi);
          ctx.session.taxi = undefined;
          var messageID;
          return ctx.replyWithHTML('Твоя заявка принята! Номер ' + orderNumber + '\n' +
            '\n' +
            '<b>От:</b> ' + ctx.taxi.orders[orderNumber].from + '\n' +
            '<b>До:</b> ' + ctx.taxi.orders[orderNumber].to + '\n' +
            '\n' +
            'Когда заказ на такси будет размещён, тебе придёт уведомление в этот чат, а также СМС-уведомление на телефон.', menuCabCancelTheOrder).then((nctx) => {
                ctx.taxi.orders[orderNumber].messageID = nctx.message_id;
                return ctx.telegram.sendMessage(ctx.taxi.orders[orderNumber].chat.id, getCabMessage(ctx, orderNumber), menuActionsWithTaxiOrder).then((m) => {
                  ctx.taxi.orders[orderNumber].chat.messageID = m.message_id;
                });
            })
        }
      }
    }
    catch (err) {
      console.log(err);
      ctx.reply('С заказом, определённо, пошло что-то не так, поэтому ты пока что не сможешь заказать такси через бота. Закажи через дежурных просто словами и напиши @example_login, что у тебя ошибка при заказе такси. Пытаться ещё раз вызвать смысла нет, скорее всего ошибка так и будет показываться');
    }
  },


  setDuty: function (ctx) {
    var text = ctx.update.callback_query.message.text;
    var startIndex = 8;
    var endIndex = text.indexOf(' от @');
    var orderNumber = text.substring(startIndex, endIndex);

    ctx.taxi.orders[orderNumber].ordered = {};
    ctx.taxi.orders[orderNumber].ordered.telegramUsername = ctx.from.username;
    ctx.taxi.orders[orderNumber].ordered.telegramID = ctx.from.id;
    ctx.taxi.orders[orderNumber].status = 'Дежурный вызывает такси';

    var message = getCabMessage(ctx, orderNumber);
    ctx.editMessageText(message + '\n<i>Вызывает</i> @' + ctx.from.username, Telegraf.Extra.HTML())

    return ctx.telegram.sendMessage(ctx.from.id, message, menuCallACabDutyActions).then((m) => {
      ctx.taxi.orders[orderNumber].ordered.messageID = m.message_id;
    })
  },


  completeTheOrder: function (ctx) {
    var text = ctx.update.callback_query.message.text;

    var startIndex = 8;
    var endIndex = text.indexOf(' от @');
    var orderNumber = text.substring(startIndex, endIndex);

    ctx.taxi.orders[orderNumber].ordered.timestamp = date.getCurrent().string.DDMMhhmm;
    ctx.taxi.orders[orderNumber].status = 'Такси заказано';
    ctx.telegram.sendMessage(ctx.taxi.orders[orderNumber].telegramID, `Заказ <b>№${orderNumber}</b> успешно размещён. Подробная информация будет в СМС-сообщении.\n\n<i>Чтобы заказать новое такси, используй кнопку ниже или команду /taxi</i>`, menuCallACab)

    var message = getCabMessage(ctx, orderNumber) + '\n<i>Вызвал</i> @' + ctx.taxi.orders[orderNumber].ordered.telegramUsername;

    ctx.telegram.editMessageText(ctx.taxi.orders[orderNumber].chat.id, ctx.taxi.orders[orderNumber].chat.messageID, undefined, message, Telegraf.Extra.HTML());

    //ctx.telegram.editMessageText(ctx.taxi.orders[orderNumber].ordered.telegramID, ctx.taxi.orders[orderNumber].ordered.messageID, undefined, message, Telegraf.Extra.HTML());

    // Remove the menu from the message
    message = 'Твоя заявка принята! Номер ' + orderNumber + '\n' +
      '\n' +
      '<b>От:</b> ' + ctx.taxi.orders[orderNumber].from + '\n' +
      '<b>До:</b> ' + ctx.taxi.orders[orderNumber].to + '\n' +
      'Когда заказ на такси будет размещён, тебе придёт уведомление в этот чат, а также СМС-уведомление на телефон.';

    ctx.telegram.editMessageText(ctx.taxi.orders[orderNumber].telegramID, ctx.taxi.orders[orderNumber].messageID, undefined, message, Telegraf.Extra.HTML());

    utility.hideMenu(ctx);
  },


  cancelCabOrder: function (ctx) {
    var orderNumber = ctx.callbackQuery.data.split('_')[1];

    ctx.taxi.orders[orderNumber].status = 'Такси отменено техником';
    var message = getCabMessage(ctx, orderNumber) + '\n<i>Отменено техником</i>';

    if (typeof ctx.taxi.orders[orderNumber].ordered === 'undefined') {
      ctx.telegram.sendMessage(ctx.taxi.orders[orderNumber].chat.id, `@${ctx.taxi.orders[orderNumber].telegramUsername} отменил вызов такси`)
      ctx.telegram.editMessageText(ctx.taxi.orders[orderNumber].chat.id, ctx.taxi.orders[orderNumber].chat.messageID, undefined, message, Telegraf.Extra.HTML());
    } else {
      ctx.telegram.sendMessage(ctx.taxi.orders[orderNumber].chat.id, `@${ctx.taxi.orders[orderNumber].telegramUsername}, @${ctx.taxi.orders[orderNumber].telegramUsername} отменил вызов такси`)
      ctx.telegram.editMessageText(ctx.taxi.orders[orderNumber].chat.id, ctx.taxi.orders[orderNumber].chat.messageID, undefined, message, Telegraf.Extra.HTML());
      ctx.telegram.editMessageText(ctx.taxi.orders[orderNumber].ordered.telegramID, ctx.taxi.orders[orderNumber].ordered.messageID, undefined, message, Telegraf.Extra.HTML());
    }
    ctx.telegram.sendMessage(ctx.taxi.orders[orderNumber].telegramID, `Заказ <b>№${orderNumber}</b> успешно отменён\n\n<i>Чтобы заказать новое такси, используй кнопку ниже или команду /taxi</i>`, menuCallACab)

    // Remove the menu from the message
    message = 'Твоя заявка принята! Номер ' + orderNumber + '\n' +
      '\n' +
      '<b>От:</b> ' + ctx.taxi.orders[orderNumber].from + '\n' +
      '<b>До:</b> ' + ctx.taxi.orders[orderNumber].to + '\n' +
      'Когда заказ на такси будет размещён, тебе придёт уведомление в этот чат, а также СМС-уведомление на телефон.';

    utility.hideMenu(ctx);
  },

  cancelCab: function (ctx) {
    ctx.session = undefined;
    ctx.replyWithHTML('Заказ успешно отменён\n\n<i>Чтобы заказать новое такси, используй кнопку ниже или команду /taxi</i>', menuCallACab)
  }
}
