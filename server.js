const express = require("express");
const compression = require("compression");
const path = require("path");
const app = express();

const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;

app.use(compression());
app.use(
	express.static(path.join(__dirname, "build"), {
		maxAge: ONE_YEAR_MS,
		setHeaders: (res, filePath) => {
			if (filePath.endsWith("index.html")) {
				res.setHeader("Cache-Control", "no-cache");
				return;
			}
			res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
		},
	})
);

app.get("*", function (req, res) {
	res.setHeader("Cache-Control", "no-cache");
	res.sendFile(path.join(__dirname, "build", "index.html"));
});

app.use(express.static(__dirname + "/public"));

const PORT = process.env.PORT || 3101;

app.listen(PORT, () => {
	console.log(`App is running on port ${PORT}`);
});
