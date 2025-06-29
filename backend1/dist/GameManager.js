"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameManager = void 0;
const messages_1 = require("./messages");
const Game_1 = require("./Game");
class GameManager {
    constructor() {
        this.games = [];
        this.pendingUser = null;
        this.users = [];
    }
    addUser(socket) {
        this.users.push(socket);
        this.addHandler(socket);
    }
    removeUser(socket) {
        this.users = this.users.filter((user) => user !== socket);
        if (this.pendingUser === socket) {
            this.pendingUser = null;
        }
        this.games = this.games.filter((game) => game.player1 !== socket && game.player2 !== socket);
    }
    addHandler(socket) {
        socket.on("message", (data) => {
            const message = JSON.parse(data.toString());
            // ✅ Find the game this socket belongs to
            const game = this.games.find((g) => g.player1 === socket || g.player2 === socket);
            switch (message.type) {
                case messages_1.INIT_GAME:
                    if (game) {
                        // "Play Again" scenario (rematch)
                        game.handleMessage(socket, message);
                        return;
                    }
                    // Initial pairing
                    if (this.pendingUser && this.pendingUser !== socket) {
                        const newGame = new Game_1.Game(this.pendingUser, socket);
                        this.games.push(newGame);
                        this.pendingUser = null;
                    }
                    else {
                        this.pendingUser = socket;
                    }
                    break;
                case messages_1.MOVE:
                case messages_1.REQUEST_REMATCH:
                    if (game) {
                        game.handleMessage(socket, message);
                    }
                    break;
                default:
                    console.warn("Unhandled message type:", message.type);
            }
        });
        socket.on("close", () => {
            this.removeUser(socket);
        });
    }
}
exports.GameManager = GameManager;
