const socket = io();

jQuery(document).ready(function($) {

    // Step 1
    $('#usernameForm').on('submit', function(e) {
        event.preventDefault();
        var usernameField = $(this).find('[name="username"]');
        setUsername(usernameField.val());
        usernameField.val('');
    });

    // Step 2
    $('#messageForm').on('submit', function(e) {
        event.preventDefault();
        var messageField = $(this).find('[name="message"]');
        sendMessage(messageField.val());
        messageField.val('');
    });
});

function setUsername(username) {
    if(!username) return;
    socket.emit('set username', username);
}

function sendMessage(message) {
    if(!message) return;
    socket.emit('chat message', message);
}

// Server Events (listen)

    // Server info
    socket.on('chat info', function(message) {
        $('#chat').append(`
            <p>
                <em>${message}</em>
            </p>
        `);
    });

    // User message
    socket.on('chat message', function(data) {
        $('#chat').append(`
            <p>
                <span class="usernanme"><strong>${data.username}</strong>#${data.id}:</span>
                ${data.message}
            </p>
        `);
    });


