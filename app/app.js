import express from "express";
import Database from 'better-sqlite3';
import swaggerUi from "swagger-ui-express";
import { rateLimit } from "express-rate-limit";
import { body } from "express-validator";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const configPath = "server-config.json";
if (!fs.existsSync(configPath)) {
	fs.writeFileSync(configPath, JSON.stringify({
		port: 8080,
		email: {
			host: "",
			port: 587,
			secure: false,
			auth: {
				user: "",
				pass: "",
			},
			fromEmail: ""
		}
	}, null, "\t"));
	console.log("Config file created at", configPath, "please edit before running this server again");
	process.exit(0);
}
const config = JSON.parse(fs.readFileSync(configPath).toString());
const app = express();
const swaggerDocument = JSON.parse(fs.readFileSync("swagger.json").toString());
const db = new Database("server.db");
db.pragma("journal_mode = WAL");
const createMailingList =
	`CREATE TABLE IF NOT EXISTS MailingList(
		email TEXT NOT NULL,
		date INTEGER,
		unsubscribeToken TEXT UNIQUE,
		PRIMARY KEY (email)
	);`;
db.exec(createMailingList);
const transporter = nodemailer.createTransport(config.email);

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);

// Add static file hosting middleware
app.use(express.static("public"));
// Add auutomatic JSON body parsing middleware
app.use(express.json({ limit: "10kb" }));
// Add swagger API testing middleware
app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
// Add rate limiting middleware
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 100, standardHeaders: "draft-7" }));
// Use ejs as view rendering engine
app.set("view engine", "ejs");

app.get("*", (req, res) => {
	const reqPath = req.path.slice(1);
	const viewPath = path.join(currentDir, "views", `${reqPath}.ejs`)

	if (!reqPath || req.path == "index.html") {
		return res.sendFile(path.join(currentDir, "public/index.html"), (err) => {
			if (err) {
				console.error("Failed to serve index.html", err);
			}
		})
	}

	res.render(viewPath, (err, html) => {
		if (err) {
			const notFoundPath = path.join(currentDir, "public", "404.html");
			return res.status(404).sendFile(notFoundPath, (err) => {
				if (err) {
					console.error("Failed to serve 404.html", err);
				}
			});
		}

		res.send(html);
	})	
})

app.post("/mailing/subscribe",
	body("email")
		.trim()
		.isEmail(),
	async (req, res) => {
		const { email } = req.body;
		const subscribedStmt = db.prepare("SELECT * FROM MailingList WHERE email = ?");
		if (subscribedStmt.get(email) != null) {
			res.status(400).json({ "message": "This email has already been subscribed to the mailing list" });
			return res.end();
		}

		const date = Date.now();
		const unsubscribeToken = crypto.randomBytes(64).toString("hex");
		const stmt = db.prepare("INSERT INTO MailingList (email, date, unsubscribeToken) VALUES (?, ?, ?)");
		stmt.run(email, date, unsubscribeToken);

		const info = await transporter.sendMail({
			from: config.email.fromEmail,
			to: email,
			subject: "P12-Environmental mailing list confirmation",
			html: "<h1>Welcome to the P12-Environmental mailing list.</h1>\t",
		});

		console.log(info)
		res.status(200).json({ "message": "Confirmation sent successfully, please check your inbox" })
	}
)

app.post("/mailing/unsubscribe",
	body("email")
		.trim()
		.isEmail(),
	body("unsubscribeToken")
		.isString(),
	(req, res) => {
		const { email, unsubscribeToken } = req.body;
		const stmt = db.prepare("DELETE FROM MailingList WHERE email = ? AND unsubscribeToken = ?");
		stmt.run(email, unsubscribeToken);

		const accept = req.headers["accept"] ?? req.query["accept"];
		if (accept === "text/html") {
			res.writeHead(200, { "content-type": "text/html" });
			res.write("<html>\n<head>\n\t<title>Unsubscribe</title>\n</head>\n<body>\n\t<h1>👋 Sorry to see you go!</h1>\n\t<p>You have successfully unsubscribed from our mailing list. You shouldn't receive emails from us again.</p>\n</body>\n</html>");
		}
		else if (!accept || accept === "application/json") {
			res.status(200).json({ message: "You have successfully unsubscribed from the mailing list" });
		}
		else {
			res.status(415).json({ message: "Specified accepted content type was invalid" });
		}
		return res.end();
	}
)


app.post("/contact",
	body("firstName")
		.trim()
		.isString(),
	body("lastName")
		.optional()
		.trim()
		.isString(),
	body("message")
		.trim()
		.isLength({ min: 1, max: 300 })
		.isString(),
	body("email")
		.trim()
		.isEmail(),
	(req, res) => {
		const { firstName, lastName, email, message } = req.body;
		// TODO: Insert contact info into database
	}
)

app.listen(config.port, () => {
	console.log(`P12 Website server running on port ${config.port}`)
})