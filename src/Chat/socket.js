// socket.js (frontend)
import io from "socket.io-client";

let socket;

export const getSocket = () => {
	if (!socket) {
		socket = io(process.env.REACT_APP_API_URL_MAIN, {
			transports: ["websocket"],
			reconnectionAttempts: 5,
			timeout: 20000,
		});

		socket.on("connect", () => {
			console.log("Connected to WebSocket server");
		});

		socket.on("disconnect", (reason) => {
			console.log(`Disconnected from WebSocket server: ${reason}`);
		});

		socket.on("connect_error", (error) => {
			console.error(`Connection error: ${error.message}`);
		});
	}

	return socket;
};

export const disconnectSocket = () => {
	if (socket) {
		socket.disconnect();
		socket = null;
	}
};

export default getSocket;
