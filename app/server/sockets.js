function Sockets(io) {
    var connections = {}
    
    // User connected
    io.on('connection', function(socket){

        // On connect: Store socket user data
        connections[socket.id] = { 
            id: generateId()
        };

        // Set Username
        socket.on('set username', function(username) {
            var connection = connections[socket.id];

            if(connection.username) return;
            connection.username = username;

            io.emit('chat info', `${username}#${connection.id} has connected`);
        });

        socket.on('chat message', function(message){
            var connection = connections[socket.id];
            if(!connection.username) return;

            io.emit('chat message', {
                id          : connection.id,
                username    : connection.username,
                message     : message
            });
        });

        // User disconnected
        socket.on('disconnect', function(){
            var connection = connections[socket.id];
            if(!connection.username) return;
            io.emit('chat info', `${connection.username} has left the chat`);
            delete connections[socket.id];
        });

    });
}

function generateId() {
    return Math.ceil(Math.random() * 90000) + 10000;
}

module.exports = Sockets;