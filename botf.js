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
//const SESSION_KEYS = require('./modules/sessionKeys.json')
var fs = require('fs');

bot.command('hey', (ctx) => {
  console.log('hi');
})


bot.launch()
