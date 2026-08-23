const WebSocket = require('ws');
const url = require('url');

class WebSocketService {
    constructor() {
        this.wss = null;
        this.showRooms = new Map(); // showId -> Set of client sockets
    }

    initialize(server) {
        try {
            this.wss = new WebSocket.Server({
                server,
                path: '/ws',
                clientTracking: true,
                perMessageDeflate: false
            });

            console.log('🔌 Advanced WebSocket Server initialized on path /ws');

            this.wss.on('connection', (ws, req) => {
                this.handleConnection(ws, req);
            });

            this.wss.on('error', (err) => {
                console.error('WebSocket server error:', err);
            });

            // Heartbeat ping interval to clear stale connections
            setInterval(() => {
                if (!this.wss) return;
                this.wss.clients.forEach(ws => {
                    if (ws.isAlive === false) return ws.terminate();
                    ws.isAlive = false;
                    ws.ping();
                });
            }, 30000);

        } catch (error) {
            console.error('Failed to initialize WebSocket server:', error);
        }
    }

    handleConnection(ws, req) {
        ws.isAlive = true;
        ws.on('pong', () => { ws.isAlive = true; });

        const parameters = url.parse(req.url, true).query;
        let currentShowId = parameters.showId || parameters.movieId || null;

        if (currentShowId) {
            this.joinShowRoom(ws, currentShowId);
        }

        // Send welcome acknowledgment
        ws.send(JSON.stringify({
            type: 'connected',
            message: 'Connected to CineVerse Realtime Engine',
            showId: currentShowId,
            timestamp: Date.now()
        }));

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                this.handleMessage(ws, data);
            } catch (err) {
                console.error('Failed to parse WebSocket message:', err);
            }
        });

        ws.on('close', () => {
            if (currentShowId && this.showRooms.has(currentShowId)) {
                const room = this.showRooms.get(currentShowId);
                room.delete(ws);
                if (room.size === 0) {
                    this.showRooms.delete(currentShowId);
                } else {
                    this.broadcastToShow(currentShowId, {
                        type: 'viewers_count',
                        showId: currentShowId,
                        count: room.size
                    });
                }
            }
        });

        ws.on('error', (error) => {
            console.error('WebSocket client error:', error);
        });
    }

    handleMessage(ws, data) {
        switch (data.type) {
            case 'join_show':
                this.joinShowRoom(ws, data.showId);
                break;
            case 'leave_show':
                this.leaveShowRoom(ws, data.showId);
                break;
            case 'seat_locked_intent':
                this.broadcastToShow(data.showId, {
                    type: 'seat_locked',
                    showId: data.showId,
                    seats: data.seats,
                    senderSession: data.sessionId
                }, ws);
                break;
            case 'seat_released_intent':
                this.broadcastToShow(data.showId, {
                    type: 'seat_released',
                    showId: data.showId,
                    seats: data.seats
                }, ws);
                break;
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
                break;
            default:
                break;
        }
    }

    joinShowRoom(ws, showId) {
        if (!showId) return;

        // Clean from other rooms
        this.showRooms.forEach((clients, rId) => {
            if (rId !== showId) clients.delete(ws);
        });

        if (!this.showRooms.has(showId)) {
            this.showRooms.set(showId, new Set());
        }
        const room = this.showRooms.get(showId);
        room.add(ws);

        // Broadcast viewer count
        this.broadcastToShow(showId, {
            type: 'viewers_count',
            showId,
            count: room.size
        });
    }

    leaveShowRoom(ws, showId) {
        if (showId && this.showRooms.has(showId)) {
            const room = this.showRooms.get(showId);
            room.delete(ws);
            if (room.size === 0) {
                this.showRooms.delete(showId);
            }
        }
    }

    broadcastToShow(showId, payload, excludeWs = null) {
        if (!this.showRooms.has(showId)) return;

        const message = JSON.stringify(payload);
        const room = this.showRooms.get(showId);

        room.forEach(client => {
            if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }

    // Public method to broadcast seat updates after booking confirmation
    notifySeatStatusChanged(showId, occupiedSeats, lockedSeats) {
        this.broadcastToShow(showId, {
            type: 'seat_status_sync',
            showId,
            occupiedSeats,
            lockedSeats,
            timestamp: Date.now()
        });
    }

    isRunning() {
        return !!this.wss;
    }
}

const websocketService = new WebSocketService();
module.exports = websocketService;