var socket = io();

socket.emit('chat message', 'HI!');

socket.on('chat message', function(message) {
    alert(message);
});