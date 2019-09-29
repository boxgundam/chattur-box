function Sockets(app) {

    // Server Emit Events
    const SERVER_USER_CONNECTED_EVENT = 'user connected';
    const SERVER_USER_DISCONNECTED_EVENT = 'user disconnected';
    const SERVER_USER_MESSAGE_EVENT = 'chat message';
    const SERVER_USER_CLAIM_EVENT = 'claim account';
    const SERVER_USER_VERIFY_EVENT = 'verify account';

    // Client Emit Events
    const CLIENT_USER_JOINED_EVENT = 'join chat';
    const CLIENT_USER_CLAIM_EVENT = 'claim account';
    const CLIENT_USER_VERIFY_EVENT = 'verify account';
    const CLIENT_USER_MESSAGE_EVENT = 'chat message';

    const Source = {
        Self    : 'self',
        Peer    : 'peer'
    };

    const io = app.get('io');
    const db = app.get('db');

    let connections = {};

    // User connected
    io.on('connection', function (socket) {

        // Join chat
        socket.on(CLIENT_USER_JOINED_EVENT, function (data) {

            // Check for registered username
            db.serialize(function () {
                db.get("SELECT * FROM users WHERE username = $username", {
                    $username: data.username
                }, function (err, row) {
                    if(err) return;

                    // Store socket user data
                    connections[socket.id] = {
                        username: `${data.username} (#${generateId()})`,
                        avatar: data.avatar,
                        registered: row ? true : false,
                        verified: false
                    };

                    socket.emit(SERVER_USER_CONNECTED_EVENT, {
                        source: Source.Self,
                        connections: connections,
                        user: connections[socket.id]              
                    });
                    socket.broadcast.emit(SERVER_USER_CONNECTED_EVENT, {
                        source: Source.Peer,
                        connections: connections,
                        user: connections[socket.id]              
                    });

                });
            });
        });

        // Claim account
        socket.on(CLIENT_USER_CLAIM_EVENT, function(data){
            let connection = connections[socket.id];
    
            if(connection.registered)
                return socket.broadcast.emit(SERVER_USER_CLAIM_EVENT, {
                    source: Source.Self,
                    status: 'fail'           
                });

            const crypto = require('crypto');

            let password = crypto.createHash('md5').update(data.password).digest("hex");
            let username = connection.username.split(' (#');

            db.serialize(function () {
                db.run("INSERT INTO users (username, password, avatar) VALUES ($username, $password, $avatar)", {
                    $username   : username[0],
                    $password   : password,
                    $avatar     : connection.avatar
                }, function (err) {
                    if(err)
                        return socket.broadcast.emit(SERVER_USER_CLAIM_EVENT, {
                            source: Source.Self,
                            status: 'fail'           
                        });

                    // Send updated verification
                    connections[socket.id].username = username[0];
                    connections[socket.id].registered = true;
                    connections[socket.id].verified = true;

                    if(connections[socket.id])

                    socket.emit(SERVER_USER_CLAIM_EVENT, {
                        source: Source.Self,
                        status: 'success',
                        connections: connections
                    });
                    socket.broadcast.emit(SERVER_USER_CLAIM_EVENT, {
                        source: Source.Peer,
                        connections: connections   
                    });
                });
            });
        });

        // Verify account
        socket.on(CLIENT_USER_VERIFY_EVENT, function(data) {
            let connection = connections[socket.id];

            const crypto = require('crypto');
            let password = crypto.createHash('md5').update(data.password).digest("hex");
            let username = connection.username.split(' (#');

            // Check for registered username
            db.serialize(function () {
                db.get("SELECT * FROM users WHERE username = $username AND password = $password", {
                    $username: username[0],
                    $password: password
                }, function (err, row) {

                    if(err || !row)
                        return socket.broadcast.emit(SERVER_USER_VERIFY_EVENT, {
                            source: Source.Self,
                            status: 'fail'           
                        });

                    // Send updated verification
                    connections[socket.id].username = username[0];
                    connections[socket.id].avatar = row.avatar;
                    connections[socket.id].registered = true;
                    connections[socket.id].verified = row ? true : false;

                    socket.emit(SERVER_USER_VERIFY_EVENT, {
                        source: Source.Self,
                        status: 'success',
                        connections: connections,
                        user: connections[socket.id]    
                    });
                    socket.broadcast.emit(SERVER_USER_VERIFY_EVENT, {
                        source: Source.Peer,
                        connections: connections   
                    });
                });
            });

        });

        // Chat message relay
        socket.on(CLIENT_USER_MESSAGE_EVENT, function(data){
            socket.broadcast.emit(SERVER_USER_MESSAGE_EVENT, {
                source: Source.Peer,
                user: connections[socket.id],
                message: data.message          
            });
        });

        // User disconnected
        socket.on('disconnect', function () {
            let connection = connections[socket.id];

            delete connections[socket.id];

            socket.broadcast.emit(SERVER_USER_DISCONNECTED_EVENT, {
                source: Source.Peer,
                connections: connections,
                user: connection              
            });
        });

    });

    function generateId() {
        return Math.ceil(Math.random() * 90000) + 10000;
    }   
}

module.exports = Sockets;