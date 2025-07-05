console.log("rrrr")
document.addEventListener('DOMContentLoaded', () => {
    const messagesDiv = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const testButton = document.getElementById('testButton');

    // Connect to WebSocket
    const socket = new WebSocket(`ws://${window.location.host}/ws?id=test-2&t=${Date.now()}`);

    socket.onopen = () => {
        addMessage('Connected to WebSocket server');
    };

    socket.onmessage = (event) => {
        addMessage(`Received: ${event.data}`);
    };

    socket.onclose = () => {
        addMessage('Disconnected from WebSocket server');
    };

    socket.onerror = (error) => {
        addMessage(`WebSocket error: ${error}`);
    };

    sendButton.addEventListener('click', () => {
        const message = messageInput.value.trim();
        if (message) {
            socket.send(message);
            addMessage(`Sent: ${message}`);
            messageInput.value = '';
        }
    });

    testButton.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/ws/broadcastMsg');
            const data = await response.json();
            addMessage(`API response: ${JSON.stringify(data)}`);
        } catch (error) {
            addMessage(`API error: ${error}`);
        }
    });

    function addMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.textContent = message;
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
});