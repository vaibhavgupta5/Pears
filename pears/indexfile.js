import { startPeerChat } from './peerChat.js';

// Start the chat application with a custom username
const { chat, server } = await startPeerChat('YourUsername');

// Keep the application running
process.on('SIGINT', async () => {
  console.log('Shutting down...');
  server.stop();
  process.exit(0);
});