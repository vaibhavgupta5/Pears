'use client';

import React, { useEffect, useState, useCallback, useRef } from "react";
import { PeerChat } from '@/lib/peerChat'; // Import the PeerChat class we created

interface Message {
  id: number;
  name: string;
  message: string;
  timestamp: string;
}

interface Room {
  room: string;
  users: number;
  hasNewMessages: boolean;
}

interface ChatProps {
  room: string;
  username?: string;
}

const Chat: React.FC<ChatProps> = ({ room, username = `User-${Math.floor(Math.random() * 1000)}` }) => {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [activeRooms, setActiveRooms] = useState<Room[]>([]);

  // Ref to store the PeerChat instance
  const peerChatRef = useRef<PeerChat | null>(null);

  // Initialize PeerChat
  useEffect(() => {
    const initializePeerChat = async () => {
      try {
        // Create a new PeerChat instance
        const peerChat = new PeerChat(username);
        peerChatRef.current = peerChat;

        // Set up room update handler
        peerChat.onRoomUpdate((rooms: Room[]) => {
          setActiveRooms(rooms);
        });

        setIsConnected(true);

        return () => {
          // Cleanup if component unmounts
          if (peerChatRef.current) {
            // Get all room names from the Map
            Array.from(peerChatRef.current.rooms.keys()).forEach(roomName => {
              peerChatRef.current?.leaveRoom(roomName).catch(console.error);
            });
          }
        };
      } catch (error) {
        console.error("Failed to initialize PeerChat:", error);
        setIsConnected(false);
      }
    };

    initializePeerChat();
  }, [username]);

  // Join/switch room when room prop changes
  useEffect(() => {
    const joinRoom = async () => {
      if (!peerChatRef.current || !room || !isConnected) return;
      
      try {
        // Leave previous rooms if any
        Array.from(peerChatRef.current.rooms.keys()).forEach(roomName => {
          if (roomName !== room) {
            peerChatRef.current?.leaveRoom(roomName).catch(console.error);
          }
        });

        // Join new room if we haven't already
        if (!peerChatRef.current.rooms.has(room)) {
          await peerChatRef.current.joinRoom(room);
          
          // Set up message handler for this room
          peerChatRef.current.onMessage(room, (newMessage: Message) => {
            setMessages(prevMessages => {
              // Avoid duplicate messages
              if (prevMessages.some(msg => msg.id === newMessage.id)) {
                return prevMessages;
              }
              return [...prevMessages, newMessage];
            });
          });
          
          // Load message history
          const history = await peerChatRef.current.getChatHistory(room);
          setMessages(history);
        }
      } catch (error) {
        console.error(`Failed to join room ${room}:`, error);
      }
    };

    joinRoom();
  }, [room, isConnected]);

  const sendMessage = useCallback(() => {
    if (message.trim() && room && peerChatRef.current) {
      const newMessage = {
        id: Date.now(),
        name: username,
        message: message.trim(),
        timestamp: new Date().toISOString()
      };

      peerChatRef.current.sendMessage(room, newMessage)
        .catch((error: any) => console.error("Failed to send message:", error));
      
      setMessage("");
    }
  }, [message, room, username]);

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex text-black flex-col h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-blue-600 text-white py-4 px-6 shadow-md">
        <h2 className="text-lg font-bold">
          {isConnected ? `Chat Room: ${room}` : "Connecting..."}
        </h2>
        <div className="text-sm">
          {isConnected ? 
            `Connected as ${username} • ${activeRooms.find(r => r.room === room)?.users || 0} users online` : 
            "Establishing peer connections..."}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.name === username ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg shadow-md ${
                  msg.name === username
                    ? "bg-blue-500 text-white"
                    : msg.name === "System"
                    ? "bg-gray-300 text-gray-700"
                    : "bg-gray-200 text-black"
                }`}
              >
                <div className="flex justify-between items-baseline">
                  <p className="text-sm font-bold">{msg.name}</p>
                  <p className="text-xs opacity-70 ml-2">
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <p className="mt-1">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Room selector (if you want to show other available rooms) */}
      {activeRooms.length > 1 && (
        <div className="px-4 py-2 bg-gray-200 overflow-x-auto">
          <div className="flex space-x-2">
            {activeRooms.map((activeRoom) => (
              <button
                key={activeRoom.room}
                className={`px-3 py-1 rounded-full text-sm ${
                  activeRoom.room === room
                    ? "bg-blue-600 text-white"
                    : "bg-white text-black"
                } ${activeRoom.hasNewMessages && activeRoom.room !== room ? "animate-pulse" : ""}`}
                onClick={() => {
                  // Navigation logic would go here
                  // For this example, we assume parent component handles room changes
                  console.log(`Switch to room: ${activeRoom.room}`);
                }}
              >
                {activeRoom.room} ({activeRoom.users})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center border-t border-gray-300 p-4 bg-white">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          disabled={!isConnected}
          className="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring focus:ring-blue-300"
        />
        <button
          onClick={sendMessage}
          disabled={!isConnected || !message.trim()}
          className={`ml-4 px-6 py-2 ${
            isConnected && message.trim()
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-400"
          } text-white font-medium rounded-md shadow transition`}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Chat;