import Hyperswarm from 'hyperswarm';
import Hyperbee from 'hyperbee';
import Hypercore from 'hypercore';
import crypto from 'crypto';
import b4a from 'b4a';

interface ChatMessage {
  id: number;
  name: string;
  message: string;
  timestamp: string;
}

interface RoomData {
  topic: Buffer;
  swarm: any; 
  messagesCore: any; 
  messagesBee: any;
}

interface PeerData {
  connection: any; 
  room: string;
}

interface RoomInfo {
  users: number;
  hasNewMessages: boolean;
}

type MessageCallback = (message: ChatMessage) => void;
type RoomUpdateCallback = (rooms: Array<{room: string; users: number; hasNewMessages: boolean}>) => void;

export class PeerChat {
  username: string;
  rooms: Map<string, RoomData>;
  activeRooms: Map<string, RoomInfo>;
  peers: Map<string, PeerData>;
  onMessageCallbacks: Map<string, MessageCallback>;
  onRoomUpdateCallbacks: Set<RoomUpdateCallback>;

  constructor(username: string) {
    this.username = username;
    this.rooms = new Map();
    this.activeRooms = new Map(); 
    this.peers = new Map(); 
    this.onMessageCallbacks = new Map(); 
    this.onRoomUpdateCallbacks = new Set();
  }

  async joinRoom(roomName: string) {
    if (this.rooms.has(roomName)) {
      console.log(`Already in room: ${roomName}`);
      return;
    }

    const roomTopic = crypto.createHash('sha256').update(roomName).digest();
    
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
    swarm.on('connection', (conn: any, info: { publicKey: Buffer }) => {
      const peerId = b4a.toString(info.publicKey, 'hex');
      console.log(`New peer connected in room ${roomName}: ${peerId.slice(0, 8)}...`);
      
      this.peers.set(peerId, {
        connection: conn,
        room: roomName
      });
      
      // Handle data from peers
      conn.on('data', async (data: Buffer) => {
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
  async leaveRoom(roomName: string) {
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
  async sendMessage(roomName: string, msg: ChatMessage) {
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
  onMessage(roomName: string, callback: MessageCallback) {
    this.onMessageCallbacks.set(roomName, callback);
  }
  
  // Register callback for room updates
  onRoomUpdate(callback: RoomUpdateCallback) {
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
  async getChatHistory(roomName: string): Promise<ChatMessage[]> {
    if (!this.rooms.has(roomName)) {
      console.error(`Not in room: ${roomName}`);
      return [];
    }
    
    const room = this.rooms.get(roomName);
    if (!room) return [];
    
    const messages: ChatMessage[] = [];
    
    // Read all messages from the database
    for await (const { value } of room.messagesBee.createReadStream()) {
      messages.push(value);
    }
    
    return messages.sort((a, b) => a.id - b.id);
  }
  
  // Private: Store a message in the hyperbee
  async _storeMessage(bee: Hyperbee, message: ChatMessage) {
    const key = `msg-${message.id}`;
    await bee.put(key, message);
  }
  
  // Private: Broadcast data to all peers in a room
  _broadcastToPeers(roomName: string, data: object) {
    const jsonData = JSON.stringify(data);
    
    for (const [, peer] of this.peers.entries()) {
      if (peer.room === roomName) {
        peer.connection.write(jsonData);
      }
    }
  }
  
  // Private: Send room info to a peer
  _sendRoomInfo(connection: any, roomName: string) {
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
  _requestChatHistory(roomName: string) {
    this._broadcastToPeers(roomName, {
      type: 'request_history'
    });
  }
  
  // Private: Send chat history to a peer
  async _sendChatHistory(connection: any, messagesBee: Hyperbee) {
    const messages: ChatMessage[] = [];
    
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

export async function startPeerChat(username: string = `User-${Math.floor(Math.random() * 1000)}`) {
  const chat = new PeerChat(username);
  
  await chat.joinRoom('general');
  
  chat.onMessage('general', (message) => {
    console.log(`${message.name}: ${message.message}`);
  });
  
  chat.onRoomUpdate((rooms) => {
    console.log('Active rooms:', rooms);
  });
  
  return chat;
}