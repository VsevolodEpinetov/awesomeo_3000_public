'use strict';

$(function () {

  $('#testbutton').click(function () {
    socket.emit('secretButton');
  })

  /*socket.on('dataTask', data => {
  });*/

});
