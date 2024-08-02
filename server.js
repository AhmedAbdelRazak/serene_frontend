/** @format */

const express = require("express");
const compression = require("compression");
const path = require("path");
const helmet = require("helmet");
const app = express();

// Use helmet for basic security enhancements
app.use(helmet());

// Enable gzip compression
app.use(compression());

// Serve static assets from the "build" directory with caching
app.use(
	express.static(path.join(__dirname, "build"), {
		maxAge: "1y", // Cache static assets for 1 year
		etag: false,
	})
);

// Serve static assets from the "public" directory with caching
app.use(
	express.static(path.join(__dirname, "public"), {
		maxAge: "1y", // Cache static assets for 1 year
		etag: false,
	})
);

// Catch-all route to serve the React app's index.html for SPA
app.get("*", (req, res) => {
	res.sendFile(path.join(__dirname, "build", "index.html"));
});

// Set the port from environment variables or default to 3101
const PORT = process.env.PORT || 3101;

// Start the server
app.listen(PORT, () => {
	console.log(`App is running on port ${PORT}`);
});
