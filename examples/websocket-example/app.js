/**
 * Ejemplo simple de WebSockets en SyntroJS
 * Filosofía: "Charla con el código"
 */

import { SyntroJS } from '../src/core/TinyApi';

async function main() {
  const app = new SyntroJS({
    title: 'WebSocket Chat Example',
    logger: true,
  });

  // "Quiero un chat simple en /chat"
  app.ws('/chat', async (ws, ctx) => {
    // "Saluda a quien llegue"
    ws.send('¡Hola! Bienvenido al chat');
    
    // "Escucha mensajes y responde"
    ws.on('message', (data) => {
      console.log('Mensaje recibido:', data);
      ws.send(`Eco: ${data}`);
    });
    
    // "Si se va, avísame"
    ws.on('disconnect', () => {
      console.log('Alguien se desconectó del chat');
    });
  });

  // "Quiero un chat con rooms en /chat/:room"
  app.ws('/chat/:room', async (ws, ctx) => {
    const room = ctx.params.room;
    
    // "Únete a la sala"
    ws.join(room);
    ws.send(`Te uniste a la sala: ${room}`);
    
    // "Escucha mensajes y compártelos en la sala"
    ws.on('message', (data) => {
      console.log(`Mensaje en ${room}:`, data);
      ws.broadcast(room, 'message', {
        room,
        message: data,
        timestamp: Date.now()
      });
    });
    
    // "Si se va, avísame"
    ws.on('disconnect', () => {
      console.log(`Alguien se desconectó de la sala: ${room}`);
    });
  });

  // Ruta HTTP simple para probar
  app.get('/hello', {
    handler: async (ctx) => {
      return { message: 'Hello! WebSocket server is running' };
    },
  });

  // Iniciar servidor
  const port = 3000;
  await app.listen(port);
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log('📡 WebSocket endpoints:');
  console.log('  ws://localhost:3000/chat');
  console.log('  ws://localhost:3000/chat/general');
  console.log('  ws://localhost:3000/chat/random');
  console.log('📖 HTTP endpoint:');
  console.log('  GET http://localhost:3000/hello');
}

main().catch(console.error);
