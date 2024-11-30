import { io } from 'socket.io-client';

// Socket.IO Configuration and Implementation

/**
 * Socket.IO Client Configuration
 * 
 * This module handles real-time communication between the client and server
 * using Socket.IO. It includes connection management, event handling,
 * and error handling.
 */

// Initialize Socket.IO client with server URL and options
const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:8080', {
  reconnectionDelay: 1000,        // Wait 1 second before reconnecting
  reconnectionDelayMax: 5000,     // Maximum delay between reconnections
  reconnectionAttempts: 5,        // Number of reconnection attempts
  autoConnect: true,              // Automatically connect on instantiation
});

/**
 * Connection Event Handlers
 * These functions handle various connection states and events
 */

// Handle successful connection
socket.on('connect', () => {
  console.log('Connected to server with socket ID:', socket.id);
  
  // You might want to dispatch a Redux action or update React state here
  // to indicate connected status
});

// Handle disconnection
socket.on('disconnect', (reason) => {
  console.log('Disconnected from server. Reason:', reason);
  
  // Handle different disconnect reasons
  if (reason === 'io server disconnect') {
    // Server initiated disconnect, manual reconnection needed
    socket.connect();
  }
  // Client will automatically try to reconnect for other reasons
});

// Handle connection errors
socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  
  // Implement custom error handling
  // For example, show a user-friendly message or try alternative servers
});

/**
 * Custom Event Handlers
 * Define your application-specific event handlers below
 */

// Example: Handle incoming chat messages
const handleChatMessage = (callback) => {
  socket.on('chat_message', (message) => {
    console.log('Received message:', message);
    if (callback) callback(message);
  });
};

// Example: Handle user typing status
const handleUserTyping = (callback) => {
  socket.on('user_typing', (data) => {
    console.log('User typing:', data);
    if (callback) callback(data);
  });
};

/**
 * Event Emitters
 * Functions to send events to the server
 */

// Example: Send a chat message
const sendMessage = (message) => {
  socket.emit('send_message', {
    content: message,
    timestamp: new Date(),
    senderId: socket.id
  });
};

// Example: Broadcast user typing status
const sendTypingStatus = (isTyping) => {
  socket.emit('typing_status', {
    isTyping,
    userId: socket.id,
    timestamp: new Date()
  });
};

/**
 * Room Management
 * Functions to handle joining and leaving chat rooms
 */

// Join a specific room
const joinRoom = (roomId, callback) => {
  socket.emit('join_room', roomId, (response) => {
    console.log(`Joined room: ${roomId}`);
    if (callback) callback(response);
  });
};

// Leave a specific room
const leaveRoom = (roomId, callback) => {
  socket.emit('leave_room', roomId, (response) => {
    console.log(`Left room: ${roomId}`);
    if (callback) callback(response);
  });
};

/**
 * Clean up function
 * Call this when component unmounts or when socket connection is no longer needed
 */
const cleanup = () => {
  socket.off('connect');
  socket.off('disconnect');
  socket.off('chat_message');
  socket.off('user_typing');
  socket.disconnect();
};

// Export all the functions and the socket instance
export {
  socket,
  handleChatMessage,
  handleUserTyping,
  sendMessage,
  sendTypingStatus,
  joinRoom,
  leaveRoom,
  cleanup
};
