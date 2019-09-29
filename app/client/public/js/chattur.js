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

let user = null;
let users = {};

jQuery(document).ready(function($) {
    $('input').val('');
    
    // Join Chat
    $('#joinForm').on('submit', function(e) {
        e.preventDefault();

        let usernameField = $(this).find('[name="username"]');
        let avatarField = $(this).find('[name="avatar"]');
        let username = usernameField.val();
        let avatar = avatarField.val();
            usernameField.val('');
            avatarField.val('');

        if(!username) return;

        socket.emit(CLIENT_USER_JOINED_EVENT, { 
            username: username,
            avatar: avatar 
        });
    });

    // Claim/Register Account
    $('#verifyForm').on('submit', function(e) {
        e.preventDefault();
        e.stopPropagation();

        let passwordField = $(this).find('[name="password"]');
        let password = passwordField.val();
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

        let messageField = $(this).find('[name="message"]');
        let message = messageField.val();
            messageField.val('');

        if(!message) return;

        addUserMessage(user, message);
        socket.emit(CLIENT_USER_MESSAGE_EVENT, { message: message });
    });

    $('#verifyButton').on('click', function(e) {
        e.preventDefault();

        $('#verifyForm').toggle();
    });

    // Allow image pasting
    $('#messageForm [name="message"]').on('paste', function(e){
        if(!e.originalEvent.clipboardData || !e.originalEvent.clipboardData.items);
        let data = e.originalEvent.clipboardData;

        for(let i in data.types) {
            if(data.types[i].toLowerCase() == 'files') {
                let blob = data.items[i].getAsFile();
                let reader = new FileReader();
                reader.onload = function(e){
                    let message = `<img src="${e.target.result}" style="max-width: 100%" />`;
                    addUserMessage(user, message);
                    socket.emit(CLIENT_USER_MESSAGE_EVENT, { message: message });
                };
                reader.readAsDataURL(blob);
            }
        }
        $(this).val('');
    } );

    $('#joinForm [name="file_avatar"]').on('change', function(e) {
        let file = $(this)[0].files[0];
        if(!file) return;

        let reader = new FileReader();

        reader.addEventListener('load', function () {
            let dataUrl = reader.result;

            // Resize image on temporary canvas
            let image = new Image();
            image.src = dataUrl;
            
            image.onload = function() {
                let canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d'),
                dimension = 100;

                canvas.width = dimension;
                canvas.height = dimension;

                let imageWidth = dimension,
                    imageHeight = dimension;

                if(image.width > image.height)
                    imageWidth = image.width / (image.height/100);
                else
                    imageHeight = image.height / (image.width/100);

                ctx.drawImage(image, -(imageWidth - dimension)/2, -(imageHeight - dimension)/2, imageWidth, imageHeight);

                // Encode image to data-uri (base64 compressed)
                let resizedImage = canvas.toDataURL();
                $('#joinForm [name="avatar"]').val(resizedImage);
                $('#avatarDisplay').html(`<img src="${resizedImage}" />`);
            }
        }, false);

        reader.readAsDataURL(file);
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
            user = data.user;

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
        let image = `<img src="${c.avatar ? c.avatar : getDefaultAvatar()}" class="avatar" />`;

        $('#userList ul').append(`<li class="${c.verified ? 'verified' : ''}">${image}${c.username}</li>`);
    });
}

function addSystemMessage(message) {
    $('#chat').append(`<p><em>${message}</em></p>`);
}

function addUserMessage(user, message) {
    let image = `<img src="${user.avatar ? user.avatar : getDefaultAvatar()}" class="avatar" />`;
    
    // Parse urls
    if(!message.startsWith('<img'))
        message = message.replace(/(?:www|https?)[^\s]+/gi, function(capture) {
            var url = capture.toLowerCase();
            url = url.startsWith('www') ? `http://${url}` : url;
            return `<a href="${url}" target="_blank">${capture}</a>`;
        });

    $('#chat').append(`<p>
        <span class="username ${user.verified ? 'verified' : ''}">
            ${image}${user.username}:
        </span>
        ${message}
    </p>`);

    $("#chat").stop().animate({ 
        scrollTop: $('#chat')[0].scrollHeight
    }, 1000);
}

function getDefaultAvatar() {
    return `data:image/png;base64,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`;
}