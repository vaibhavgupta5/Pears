import Hyperswarm from 'hyperswarm';
import Hyperbee from 'hyperbee';
import Hypercore from 'hypercore';
import crypto from 'crypto';
import b4a from 'b4a';
import http from 'http';

export class PeerChat {
  constructor(username) {
    this.username = username;
    this.rooms = new Map();
    this.activeRooms = new Map(); 
    this.peers = new Map(); 
    this.onMessageCallbacks = new Map(); 
    this.onRoomUpdateCallbacks = new Set();
  }

  async joinRoom(roomName) {
    if (this.rooms.has(roomName)) {
      console.log(`Already in room: ${roomName}`);
      return;
    }
    
    const roomTopic = crypto.createHash('sha256').update(roomName).digest();
    
    // Create a Hypercore specific to this room
    const messagesCore = new Hypercore(`./data/${roomName}-messages`);
    await messagesCore.ready();
    
    const messagesBee = new Hyperbee(messagesCore, {
      keyEncoding: 'utf-8',
      valueEncoding: 'json'
    });
    await messagesBee.ready();
    
    // Set up swarm for this room
    const swarm = new Hyperswarm();
    swarm.join(roomTopic, { server: true, client: true });
    
    // Handle new connections
    swarm.on('connection', (conn, info) => {
      const peerId = b4a.toString(info.publicKey, 'hex');
      console.log(`New peer connected in room ${roomName}: ${peerId.slice(0, 8)}...`);
      
      this.peers.set(peerId, {
        connection: conn,
        room: roomName
      });
      
      // Handle data from peers
      conn.on('data', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.type === 'chat') {
            // Store message in the local database
            await this._storeMessage(messagesBee, message.data);
            
            // Trigger message callbacks
            if (this.onMessageCallbacks.has(roomName)) {
              const callback = this.onMessageCallbacks.get(roomName);
              if (callback) callback(message.data);
            }
          } else if (message.type === 'request_history') {
            // Send chat history to the requesting peer
            this._sendChatHistory(conn, messagesBee);
          }
        } catch (err) {
          console.error('Error processing message:', err);
        }
      });
      
      // Handle disconnection
      conn.on('close', () => {
        console.log(`Peer disconnected from room ${roomName}: ${peerId.slice(0, 8)}...`);
        this.peers.delete(peerId);
        this._notifyRoomUpdates();
      });
      
      // Send room info to the new peer
      this._sendRoomInfo(conn, roomName);
    });
    
    // Store room data
    this.rooms.set(roomName, {
      topic: roomTopic,
      swarm,
      messagesCore,
      messagesBee
    });
    
    // Update active rooms
    if (!this.activeRooms.has(roomName)) {
      this.activeRooms.set(roomName, {
        users: 1,
        hasNewMessages: false
      });
    } else {
      const roomInfo = this.activeRooms.get(roomName);
      if (roomInfo) {
        roomInfo.users += 1;
        this.activeRooms.set(roomName, roomInfo);
      }
    }
    
    // Request chat history from peers
    this._requestChatHistory(roomName);
    
    // Notify about room updates
    this._notifyRoomUpdates();
    
    console.log(`Joined room: ${roomName}`);
    
    // Send welcome message
    await this.sendMessage(roomName, {
      id: Date.now(),
      name: 'System',
      message: `Welcome to room ${roomName}!`,
      timestamp: new Date().toISOString()
    });
    
    return { roomName, messagesBee };
  }
  
  // Leave a chat room
  async leaveRoom(roomName) {
    if (!this.rooms.has(roomName)) {
      console.log(`Not in room: ${roomName}`);
      return;
    }
    
    const room = this.rooms.get(roomName);
    if (!room) return;
    
    // Close connections
    room.swarm.destroy();
    await room.messagesCore.close();
    
    // Update active rooms
    if (this.activeRooms.has(roomName)) {
      const roomInfo = this.activeRooms.get(roomName);
      if (roomInfo) {
        roomInfo.users -= 1;
        
        if (roomInfo.users <= 0) {
          this.activeRooms.delete(roomName);
        } else {
          this.activeRooms.set(roomName, roomInfo);
        }
      }
    }
    
    // Remove room data
    this.rooms.delete(roomName);
    
    // Notify about room updates
    this._notifyRoomUpdates();
    
    console.log(`Left room: ${roomName}`);
  }
  
  // Send a chat message to a room
  async sendMessage(roomName, msg) {
    if (!this.rooms.has(roomName)) {
      console.error(`Not in room: ${roomName}`);
      return;
    }
    
    const room = this.rooms.get(roomName);
    if (!room) return;
    
    const message = {
      ...msg,
      name: msg.name || this.username
    };
    
    // Store message locally
    await this._storeMessage(room.messagesBee, message);
    
    // Send message to all peers in the room
    this._broadcastToPeers(roomName, {
      type: 'chat',
      data: message
    });
    
    // Update room status
    if (this.activeRooms.has(roomName)) {
      const roomInfo = this.activeRooms.get(roomName);
      if (roomInfo) {
        roomInfo.hasNewMessages = true;
        this.activeRooms.set(roomName, roomInfo);
      }
    }
    
    // Notify about room updates
    this._notifyRoomUpdates();
    
    // Trigger message callbacks for local UI
    if (this.onMessageCallbacks.has(roomName)) {
      const callback = this.onMessageCallbacks.get(roomName);
      if (callback) callback(message);
    }
    
    return message;
  }
  
  // Register callback for incoming messages in a room
  onMessage(roomName, callback) {
    this.onMessageCallbacks.set(roomName, callback);
  }
  
  // Register callback for room updates
  onRoomUpdate(callback) {
    this.onRoomUpdateCallbacks.add(callback);
  }
  
  // Get list of active rooms
  getActiveRooms() {
    return Array.from(this.activeRooms.entries()).map(([room, info]) => ({
      room,
      users: info.users,
      hasNewMessages: info.hasNewMessages
    }));
  }
  
  // Get chat history for a room
  async getChatHistory(roomName) {
    if (!this.rooms.has(roomName)) {
      console.error(`Not in room: ${roomName}`);
      return [];
    }
    
    const room = this.rooms.get(roomName);
    if (!room) return [];
    
    const messages = [];
    
    // Read all messages from the database
    for await (const { value } of room.messagesBee.createReadStream()) {
      messages.push(value);
    }
    
    return messages.sort((a, b) => a.id - b.id);
  }
  
  // Private: Store a message in the hyperbee
  async _storeMessage(bee, message) {
    const key = `msg-${message.id}`;
    await bee.put(key, message);
  }
  
  // Private: Broadcast data to all peers in a room
  _broadcastToPeers(roomName, data) {
    const jsonData = JSON.stringify(data);
    
    for (const [, peer] of this.peers.entries()) {
      if (peer.room === roomName) {
        peer.connection.write(jsonData);
      }
    }
  }
  
  // Private: Send room info to a peer
  _sendRoomInfo(connection, roomName) {
    const roomInfo = this.activeRooms.get(roomName);
    connection.write(JSON.stringify({
      type: 'room_info',
      data: {
        room: roomName,
        users: roomInfo?.users || 1
      }
    }));
  }
  
  // Private: Request chat history from peers
  _requestChatHistory(roomName) {
    this._broadcastToPeers(roomName, {
      type: 'request_history'
    });
  }
  
  // Private: Send chat history to a peer
  async _sendChatHistory(connection, messagesBee) {
    const messages = [];
    
    // Read all messages from the database
    for await (const { value } of messagesBee.createReadStream()) {
      messages.push(value);
    }
    
    // Send history in chunks to avoid data size issues
    const chunkSize = 10;
    for (let i = 0; i < messages.length; i += chunkSize) {
      const chunk = messages.slice(i, i + chunkSize);
      
      connection.write(JSON.stringify({
        type: 'history_chunk',
        data: {
          messages: chunk,
          isLast: i + chunkSize >= messages.length
        }
      }));
    }
  }
  
  // Private: Notify about room updates
  _notifyRoomUpdates() {
    const rooms = this.getActiveRooms();
    
    this.onRoomUpdateCallbacks.forEach(callback => {
      callback(rooms);
    });
  }
}

// Basic web server to serve the chat UI
export class ChatServer {
  constructor(chat) {
    this.chat = chat;
    this.server = null; // Server instance
  }
  
  // Start a simple HTTP server for the chat UI
  start(port = 3000) {
    // Using a basic HTTP server
   
    
    this.server = http.createServer(async (req, res) => {
      if (req.url === '/') {
        // Serve the chat UI
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(this.getChatHTML());
      } else if (req.url === '/api/rooms') {
        // API endpoint for room list
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(this.chat.getActiveRooms()));
      } else if (req.url.startsWith('/api/history/')) {
        // API endpoint for chat history
        const roomName = req.url.split('/api/history/')[1];
        const history = await this.chat.getChatHistory(roomName);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(history));
      } else if (req.url.startsWith('/api/join/') && req.method === 'POST') {
        // API endpoint for joining a room
        const roomName = req.url.split('/api/join/')[1];
        await this.chat.joinRoom(roomName);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else if (req.url.startsWith('/api/leave/') && req.method === 'POST') {
        // API endpoint for leaving a room
        const roomName = req.url.split('/api/leave/')[1];
        await this.chat.leaveRoom(roomName);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else if (req.url.startsWith('/api/message/') && req.method === 'POST') {
        // API endpoint for sending a message
        const roomName = req.url.split('/api/message/')[1];
        
        // Get message data from request body
        let body = '';
        req.on('data', (chunk) => {
          body += chunk.toString();
        });
        
        req.on('end', async () => {
          try {
            const message = JSON.parse(body);
            await this.chat.sendMessage(roomName, message);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid message data' }));
          }
        });
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });
    
    this.server.listen(port, () => {
      console.log(`Chat server running at http://localhost:${port}`);
      console.log(`Open this URL in your browser to use the chat`);
    });
  }
  
  // Generate the chat UI HTML
  getChatHTML() {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PeerChat</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
          #app { display: flex; height: 100vh; }
          #rooms { width: 200px; border-right: 1px solid #ccc; padding: 10px; }
          #chat { flex: 1; display: flex; flex-direction: column; }
          #messages { flex: 1; overflow-y: auto; padding: 10px; }
          #input-area { padding: 10px; border-top: 1px solid #ccc; display: flex; }
          #message-input { flex: 1; padding: 8px; }
          button { padding: 8px 16px; background: #4CAF50; color: white; border: none; cursor: pointer; }
          .room-item { padding: 8px; cursor: pointer; margin-bottom: 4px; }
          .room-item:hover { background-color: #f0f0f0; }
          .room-item.active { background-color: #e0e0e0; font-weight: bold; }
          .message { margin-bottom: 8px; }
          .message .name { font-weight: bold; }
          .message .time { color: #888; font-size: 0.8em; margin-left: 8px; }
          #status { position: fixed; bottom: 10px; right: 10px; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div id="app">
          <div id="rooms">
            <h3>Rooms</h3>
            <div id="room-list"></div>
            <div style="margin-top: 10px;">
              <input type="text" id="new-room" placeholder="New room name">
              <button id="join-btn">Join</button>
            </div>
          </div>
          <div id="chat">
            <div id="messages"></div>
            <div id="input-area">
              <input type="text" id="message-input" placeholder="Type a message...">
              <button id="send-btn">Send</button>
            </div>
          </div>
        </div>
        <div id="status">P2P Connected</div>
        
        <script>
          // Chat client
          let currentRoom = '';
          const username = 'User-' + Math.floor(Math.random() * 1000);
          
          // API functions
          async function api(url, method = 'GET', data = null) {
            const options = {
              method,
              headers: {}
            };
            
            if (data) {
              options.headers['Content-Type'] = 'application/json';
              options.body = JSON.stringify(data);
            }
            
            const response = await fetch(url, options);
            return await response.json();
          }
          
          // Update the room list
          async function updateRoomList() {
            try {
              const rooms = await api('/api/rooms');
              const roomList = document.getElementById('room-list');
              roomList.innerHTML = '';
              
              rooms.forEach(room => {
                const roomEl = document.createElement('div');
                roomEl.className = 'room-item' + (room.room === currentRoom ? ' active' : '');
                roomEl.innerText = room.room + ' (' + room.users + ')';
                roomEl.onclick = () => joinRoom(room.room);
                roomList.appendChild(roomEl);
              });
            } catch (err) {
              console.error('Failed to update room list:', err);
            }
          }
          
          // Join a room
          async function joinRoom(roomName) {
            try {
              await api('/api/join/' + roomName, 'POST');
              currentRoom = roomName;
              document.getElementById('messages').innerHTML = '';
              updateRoomList();
              
              // Load chat history
              const history = await api('/api/history/' + roomName);
              history.forEach(addMessage);
              
              // Set up message polling
              if (window.messageInterval) clearInterval(window.messageInterval);
              window.messageInterval = setInterval(async () => {
                const latest = await api('/api/history/' + roomName);
                const messagesDiv = document.getElementById('messages');
                messagesDiv.innerHTML = '';
                latest.forEach(addMessage);
              }, 1000);
            } catch (err) {
              console.error('Failed to join room:', err);
            }
          }
          
          // Send a message
          async function sendMessage() {
            if (!currentRoom) return;
            
            const input = document.getElementById('message-input');
            const text = input.value.trim();
            if (!text) return;
            
            try {
              await api('/api/message/' + currentRoom, 'POST', {
                id: Date.now(),
                name: username,
                message: text,
                timestamp: new Date().toISOString()
              });
              
              input.value = '';
            } catch (err) {
              console.error('Failed to send message:', err);
            }
          }
          
          // Add a message to the UI
          function addMessage(msg) {
            const messagesDiv = document.getElementById('messages');
            const messageEl = document.createElement('div');
            messageEl.className = 'message';
            
            const nameSpan = document.createElement('span');
            nameSpan.className = 'name';
            nameSpan.innerText = msg.name + ': ';
            
            const messageText = document.createTextNode(msg.message);
            
            const timeSpan = document.createElement('span');
            timeSpan.className = 'time';
            timeSpan.innerText = new Date(msg.timestamp).toLocaleTimeString();
            
            messageEl.appendChild(nameSpan);
            messageEl.appendChild(messageText);
            messageEl.appendChild(timeSpan);
            
            messagesDiv.appendChild(messageEl);
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
          }
          
          // Event listeners
          document.getElementById('send-btn').addEventListener('click', sendMessage);
          document.getElementById('message-input').addEventListener('keypress', event => {
            if (event.key === 'Enter') sendMessage();
          });
          
          document.getElementById('join-btn').addEventListener('click', () => {
            const roomName = document.getElementById('new-room').value.trim();
            if (roomName) joinRoom(roomName);
          });
          
          // Start the app
          updateRoomList();
          joinRoom('general');
          
          // Set up polling for room updates
          setInterval(updateRoomList, 5000);
        </script>
      </body>
      </html>
    `;
  }
  
  // Stop the server
  stop() {
    if (this.server) {
      this.server.close();
      console.log('Chat server stopped');
    }
  }
}

export async function startPeerChat(username = `User-${Math.floor(Math.random() * 1000)}`) {
  const chat = new PeerChat(username);
  
  // Join the general room
  await chat.joinRoom('general');
  
  chat.onMessage('general', (message) => {
    console.log(`${message.name}: ${message.message}`);
  });
  
  chat.onRoomUpdate((rooms) => {
    console.log('Active rooms:', rooms);
  });
  
  // Start the web UI server
  const server = new ChatServer(chat);
  server.start(3000);
  
  return { chat, server };
}

// Usage example
// const { chat, server } = await startPeerChat('Alice');