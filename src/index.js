import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CartProvider } from "./cart_context";

// Create the root element for React
const root = ReactDOM.createRoot(document.getElementById("root"));

// Render the React application
root.render(
	<React.StrictMode>
		<CartProvider>
			<App />
		</CartProvider>
	</React.StrictMode>
);

// Optional: Register a service worker for offline capabilities
if ("serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		navigator.serviceWorker
			.register("/service-worker.js")
			.then((registration) => {
				console.log(
					"Service Worker registered with scope:",
					registration.scope
				);
			})
			.catch((error) => {
				console.error("Service Worker registration failed:", error);
			});
	});
}
