import { WebSocket, WebSocketServer } from 'ws';
import { Server } from 'http';
import { verifyToken } from '../../utils/jwt';
import { subscribeToMarketData } from '../trading/marketDataService';
import logger from '../../utils/logger';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
  isAuthenticated?: boolean;
}

export const setupWebSocketServer = (server: Server) => {
  const wss = new WebSocketServer({ server, path: '/ws' });

  // Start market data broadcast
  const unsubscribe = subscribeToMarketData((marketData) => {
    const message = JSON.stringify({
      type: 'market_data',
      data: marketData
    });

    wss.clients.forEach((client: WebSocket) => {
      const authClient = client as AuthenticatedWebSocket;
      if (authClient.readyState === WebSocket.OPEN && authClient.isAuthenticated) {
        client.send(message);
      }
    });
  });

  wss.on('connection', (ws: AuthenticatedWebSocket) => {
    logger.info('WebSocket client connected');
    ws.isAuthenticated = false;

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'auth') {
          // Authenticate WebSocket connection
          try {
            const payload = verifyToken(data.token, 'access');
            ws.userId = payload.userId;
            ws.isAuthenticated = true;
            
            ws.send(JSON.stringify({
              type: 'auth_success',
              message: 'Authentication successful'
            }));
            
            logger.info('WebSocket client authenticated', { userId: payload.userId });
          } catch (error) {
            ws.send(JSON.stringify({
              type: 'auth_error',
              message: 'Authentication failed'
            }));
            ws.close();
          }
        } else if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
      } catch (error) {
        logger.error('WebSocket message error', { error });
      }
    });

    ws.on('close', () => {
      logger.info('WebSocket client disconnected', { userId: ws.userId });
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error', { error, userId: ws.userId });
    });
  });

  logger.info('WebSocket server initialized');

  return () => {
    unsubscribe();
    wss.close();
  };
};
