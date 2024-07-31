import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";
import { CartProvider } from "./cart_context";

// Lazy load the App component
const App = lazy(() => import("./App"));

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<CartProvider>
			<Router>
				<Suspense fallback={"Loading..."}>
					<App />
				</Suspense>
			</Router>
		</CartProvider>
	</React.StrictMode>
);
