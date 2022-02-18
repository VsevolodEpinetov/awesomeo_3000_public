const RedisSession = require('telegraf-session-redis')

const test = new RedisSession({
  property: 'test',
  getSessionKey: () => { return "hey-hey" }
})

const calls = new RedisSession({
  property: 'calls',
  getSessionKey: () => { return "calls" }
})

const duty = new RedisSession({
  property: 'duty',
  getSessionKey: () => { return "duty" }
})

const chats = new RedisSession({
  property: 'chats',
  getSessionKey: () => { return "chats" }
})

const taxi = new RedisSession({
  property: 'taxi',
  getSessionKey: () => { return "taxi" }
})

const users = new RedisSession({
  property: 'users',
  getSessionKey: () => { return "users" }
})

const dtp = new RedisSession({
  property: 'dtp',
  getSessionKey: () => { return "dtp" }
})

const misc = new RedisSession({
  property: 'misc',
  getSessionKey: () => { return "misc" }
})


const game = new RedisSession({
  property: 'game',
  getSessionKey: () => { return "game" }
})

const stats = new RedisSession({
  property: 'stats',
  getSessionKey: () => { return "stats" }
})

const userSession = new RedisSession({
  property: 'userSession',
  getSessionKey: (ctx) => { if (ctx.from) return ctx.from.id }
})

const chatSession = new RedisSession({
  property: 'chatSession',
  getSessionKey: (ctx) => { if (ctx.chat) return ctx.chat.id }
})

const session = new RedisSession({
  getSessionKey: (ctx) => {
    if (!ctx.chat && !ctx.from) {
      return
    }
    return `${ctx.from.id}:${ctx.chat.id}`
  }
})


module.exports = {
    CALLS: calls,
    DUTY: duty,
    CHATS: chats,
    TAXI: taxi,
    USERS: users,
    MISC: misc,
    DTP: dtp,
    GAME: game,
    TEST: test,
    STATS: stats,
    USER_SESSION: userSession,
    CHAT_SESSION: chatSession,
    UNIQUE_SESSION: session
};
