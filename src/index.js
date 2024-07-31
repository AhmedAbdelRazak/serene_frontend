import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { CartProvider } from "./cart_context";

const App = lazy(() => import("./App"));

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<CartProvider>
			<Suspense fallback={<div>Loading...</div>}>
				<App />
			</Suspense>
		</CartProvider>
	</React.StrictMode>
);

// Register service worker for caching static assets
if ("serviceWorker" in navigator) {
	window.addEventListener("load", function () {
		navigator.serviceWorker.register("/sw.js").then(
			function (registration) {
				console.log(
					"ServiceWorker registration successful with scope: ",
					registration.scope
				);
			},
			function (err) {
				console.log("ServiceWorker registration failed: ", err);
			}
		);
	});
}
