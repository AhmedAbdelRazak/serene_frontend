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
