const express = require('express')
const app = express()

const sendRequest = require('request-promise');

const port = 3001

const router = express.Router();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

//var stringify = require('json-stringify-safe');

function parseTask (data) {
  var task = {};
  task.key = data.key;
  task.description = data.description;
  task.fields = [];

  for (var i = 0;  i < task.description.split('**').length; i++) {
    if (!(i % 2) && ((i + 1) < task.description.split('**').length)) i++;
    if (task.description.split('**')[i + 1]) {
      var string = task.description.split('**')[i + 1];
      if (string[0] === ' ') string = string.substring(1, string.length)
      if (string[string.length - 1] === '\n') string = string.substring(0, string.length - 1)
      // yes, twice
      if (string[string.length - 1] === '\n') string = string.substring(0, string.length - 1)

      task.fields.push({
        header: task.description.split('**')[i],
        string: string
      })
    }
  }

  var keys = [
    {
      name: 'Имя клиента',
      type: 'client',
      field: 'name',
    },
    {
      name: 'Номер телефона',
      type: 'client',
      field: 'phone'
    },
    {
      name: 'Ссылка на клиента',
      type: 'client',
      field: 'url'
    },
    {
      name: 'Модель машины',
      type: 'car',
      field: 'model'
    },
    {
      name: 'Номер машины',
      type: 'car',
      field: 'number'
    },
    {
      name: 'VIN',
      type: 'car',
      field: 'vin'
    },
    {
      name: 'Ссылка на машину',
      type: 'car',
      field: 'url'
    },
    {
      name: 'Текущий адрес машины',
      type: 'car',
      field: 'location'
    },
    {
      name: 'Хронология',
      type: 'incident',
      field: 'chronology'
    },
    {
      name: 'Виновник инцидента',
      type: 'incident',
      field: 'culprit'
    },
    {
      name: 'Список повреждений',
      type: 'incident',
      field: 'damages'
    },
    {
      name: 'Примерное время и дата инцидента',
      type: 'incident',
      field: 'time'
    },
    {
      name: 'Адрес инцидента',
      type: 'incident',
      field: 'location'
    },
    {
      name: 'Комментарий',
      type: 'incident',
      field: 'comment'
    }
  ]

 // parse client info
 task.client = {};
 task.car = {};
 task.incident = {};
 for (fieldID in task.fields) {
   keys.forEach((key, i) => {
     if (task.fields[fieldID].header.indexOf(key.name) > -1) {
       task[key.type][key.field] = task.fields[fieldID].string;
     }
   });
 }

return task;

}

io.on('connection', socket => {
  console.log(`User ${socket.id} connected`);

  socket.on('loadLast', async token => {

    const headers = {
        'Authorization': `OAuth ${token}`
    };
    const options = {
        url: 'https://yandex_service_url/api?filter=queue:DRIVESECURITY&order=-key&perPage=1',
        headers: headers
    };

    sendRequest(options)
      .then(body => {
        try {
          body = JSON.parse(body);
          if (typeof body[0] !== 'undefined') body = body[0];

          socket.emit('dataTask', parseTask(body));
        }
      catch (error) {
        socket.emit('dataTask', 'errorParsing');
        console.log(error)
      }
    })
    .catch(err => {
      switch (err.statusCode) {
        case 401:
          socket.emit('dataTask', 'errorToken')
          break;
        case 403:
          socket.emit('dataTask', 'errorScope')
          break;
        case 404:
          socket.emit('dataTask', 'errorNotFound')
          break;
        default:
          socket.emit('dataTask', 'errorUndefined')
      }
    })


  });



  socket.on('loadByKey', async (token, key) => {

    const headers = {
        'Authorization': `OAuth ${token}`
    };
    const options = {
        url: `https://yandex_service_url/api/${key}`,
        headers: headers
    };

    sendRequest(options)
      .then(body => {
        try {
          body = JSON.parse(body);
          if (typeof body[0] !== 'undefined') body = body[0];
          socket.emit('dataTask', parseTask(body));
        }
      catch (error) {
        socket.emit('dataTask', 'errorParsing');
        console.log(error)
      }
    })
    .catch(err => {
      switch (err.statusCode) {
        case 401:
          socket.emit('dataTask', 'errorToken')
          break;
        case 403:
          socket.emit('dataTask', 'errorScope')
          break;
        case 404:
          socket.emit('dataTask', 'errorNotFound')
          break;
        default:
          socket.emit('dataTask', 'errorUndefined')
      }
    })


  });

  socket.on('secretButton', async () => {
    console.log(socket.id);
  });
});

// Multiple domains handler
app.use((req, res, next) => {
  //console.log(req.path);
    switch (req.hostname) {
      case 'test.epinetov.com':
        if (req.originalUrl === '/') res.sendFile(__dirname + '/html/index-test.html');
        else res.sendFile(__dirname + '/html' + req.originalUrl);
        break;
      case 'duty.epinetov.com':
        if (req.originalUrl === '/') res.sendFile(__dirname + '/html/index-duty.html');
        else res.sendFile(__dirname + '/html' + req.originalUrl);
        break;
      case 'chats.epinetov.com':
        if (req.originalUrl === '/') res.sendFile(__dirname + '/html/index-chats.html');
        else res.sendFile(__dirname + '/html' + req.originalUrl);
        break;
      case 'service.epinetov.com':
        if (req.originalUrl === '/') res.sendFile(__dirname + '/html/index-service.html');
        else res.sendFile(__dirname + '/html' + req.originalUrl);
        break;
      case 'stats.epinetov.com':
        if (req.originalUrl === '/') res.sendFile(__dirname + '/html/index-stats.html');
        else res.sendFile(__dirname + '/html' + req.originalUrl);
        break;
      case '134.122.53.168':
        if (req.originalUrl === '/') res.sendFile(__dirname + '/html/index-chats.html');
        else res.sendFile(__dirname + '/html' + req.originalUrl);
        break;
      default:
        res.send('stop right there, you criminal scum');
    }
});

app.use(express.static(__dirname + '/html'));
app.use('/', router);
http.listen(port, () => {
  console.log(`Application is live on port ${port}!`)
})
