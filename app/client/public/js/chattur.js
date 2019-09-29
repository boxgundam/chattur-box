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

const socket = io();

var user = null;
var users = {};

jQuery(document).ready(function($) {

    // Join Chat
    $('#joinForm').on('submit', function(e) {
        e.preventDefault();

        var usernameField = $(this).find('[name="username"]');
        var username = usernameField.val();
            usernameField.val('');

        if(!username) return;

        socket.emit(CLIENT_USER_JOINED_EVENT, { username: username });
    });

    // Claim/Register Account
    $('#verifyForm').on('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        var passwordField = $(this).find('[name="password"]');
        var password = passwordField.val();
            passwordField.val('');

        if(!password) return;

        socket.emit(user.registered ?
            CLIENT_USER_VERIFY_EVENT : 
            CLIENT_USER_CLAIM_EVENT, 
            {  password: password }
        );
    });

    // Send Chat Message
    $('#messageForm').on('submit', function(e) {
        e.preventDefault();

        var messageField = $(this).find('[name="message"]');
        var message = messageField.val();
            messageField.val('');

        if(!message) return;

        addUserMessage(user, message);
        socket.emit(CLIENT_USER_MESSAGE_EVENT, { message: message });
    });

    $('#verifyButton').on('click', function(e) {
        e.preventDefault();

        $('#verifyForm').toggle();
    });

});


// Server Events (listen)

    // User joined
    socket.on(SERVER_USER_CONNECTED_EVENT, function(data) {
        if(!data.user) return;

        updateUserList(data.connections);

        if(data.source == Source.Self) {
            user = data.user;

            $('#joinForm').hide();
            $('#chatroom').show();

            $('#chatroom h1 span em').text(`Joined as ${data.user.username}`);

            if(user.registered) {
                $('#verifyButton').text('Verify');
                $('#verifyForm button').text('Verify');
            } else {
                $('#verifyButton').text('Claim');
                $('#verifyForm button').text('Claim');
            }

            addSystemMessage(`You have joined the chat.`);
        } else if(data.source == Source.Peer) {
            addSystemMessage(`${data.user.username} has joined the chat.`);
        }
    });

    // User disconnected
    socket.on(SERVER_USER_DISCONNECTED_EVENT, function(data) {
        if(!data.user) return;

        updateUserList(data.connections);

        if(data.source == Source.Peer)
            addSystemMessage(`${data.user.username} has left the chat.`);
    });

    // Message received
    socket.on(SERVER_USER_MESSAGE_EVENT, function(data) {
        if(!data.user) return;

        if(data.source == Source.Peer)
            addUserMessage(data.user, data.message);
    });

    // Claimed
    socket.on(SERVER_USER_CLAIM_EVENT, function(data) {
        if(!data) return;

        if(data.source == Source.Self && data.status == 'success') {
            user.username = user.username.split(' (#')[0];
            user.verified = true;

            $('#chatroom h1 span em').text(`Verified as ${user.username}`);

            $('#chatroom h1 button').remove();
            $('#verifyForm').remove();


            updateUserList(data.connections);
        } else if (data.source == Source.Peer) {
            updateUserList(data.connections);
        }
    });

    // Verified
    socket.on(SERVER_USER_VERIFY_EVENT, function(data) {
        if(!data) return;

        if(data.source == Source.Self && data.status == 'success') {
            user.username = user.username.split(' (#')[0];
            user.verified = true;

            $('#chatroom h1 span em').text(`Verified as ${user.username}`);

            $('#chatroom h1 button').remove();
            $('#verifyForm').remove();

            updateUserList(data.connections);
        } else if (data.source == Source.Peer) {
            updateUserList(data.connections);
        }
    });


function updateUserList(connections) {
    $('#userList ul').empty();
        
    $.each(connections, function(i, c) {
        $('#userList ul').append(`<li class="${c.verified ? 'verified' : ''}" data-id="${c.id}">${c.username}</li>`);
    });
}

function addSystemMessage(message) {
    $('#chat').append(`<p><em>${message}</em></p>`);
}

function addUserMessage(user, message) {
    $('#chat').append(`<p>
        <strong class="usernanme ${user.verified ? 'verified' : ''}">${user.username}</strong>${message}
    </p>`);
}