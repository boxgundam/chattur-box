function Sockets(io) {
    
    // User connected
    io.on('connection', function(socket){
        
        console.log('A user connected');

        socket.on('chat message', function(message){
            io.emit('chat message', message);
        });

        // User disconnected
        socket.on('disconnect', function(){
            console.log('User disconnected');
        });

    });
}

module.exports = Sockets;