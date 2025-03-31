import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { CartProvider } from "./cart_context";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.Fragment>
		<CartProvider>
			<App />
		</CartProvider>
	</React.Fragment>
);
