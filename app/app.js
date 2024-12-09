"use strict";
import express from "express";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import swaggerUi from "swagger-ui-express";
import { rateLimit } from "express-rate-limit";
import { body, query, validationResult } from "express-validator";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const configPath = "server-config.json";
if (!fs.existsSync(configPath)) {
	fs.writeFileSync(configPath, JSON.stringify({
		port: 8080,
		baseUrl: "http://localhost:8080",
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
const db = await open({
	filename: "server.db",
	driver: sqlite3.Database
});
const createMailingList =
	`CREATE TABLE IF NOT EXISTS MailingList(
		email TEXT NOT NULL,
		date INTEGER,
		unsubscribeToken TEXT UNIQUE,
		PRIMARY KEY (email)
	);`;
await db.exec(createMailingList);
const createContactMessages =
	`CREATE TABLE IF NOT EXISTS ContactMessages(
		id INTEGER NOT NULL PRIMARY KEY,
		firstName TEXT NOT NULL,
		lastName TEXT,
		email TEXT NOT NULL,
		message TEXT NOT NULL
	);`;
await db.exec(createContactMessages);
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
	const reqPath = req.path === "/" ? "index" : req.path.slice(1);
	const viewPath = path.join(currentDir, "views", `${reqPath}.ejs`);

	res.render(viewPath, (err, html) => {
		if (err) {
			const notFoundPath = path.join(currentDir, "views", "404.ejs");
			return res.status(404).render(notFoundPath, (err, html) => {
				if (err) {
					console.error("Failed to serve 404.ejs", err);
				}

				res.send(html);
			});
		}

		res.send(html);
	});
});

app.post("/api/mailing/subscribe",
	body("email")
		.trim()
		.isEmail(),
	async (req, res) => {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			return res.status(400).json({ message: "Specified details were invalid", errors: result.array() });
		}

		const { email } = req.body;
		const subscribedStmt = await db.prepare("SELECT * FROM MailingList WHERE email = @email");
		const subscribedResult = await subscribedStmt.get({
			"@email": email
		});
		if (subscribedResult) {
			res.status(400).json({ message: "This email has already been subscribed to the mailing list" });
			return res.end();
		}

		const date = Date.now();
		const unsubscribeToken = crypto.randomBytes(64).toString("hex");
		const stmt = await db.prepare("INSERT INTO MailingList (email, date, unsubscribeToken) VALUES (@email, @date, @unsubscribeToken)");
		await stmt.run({
			"@email": email,
			"@date": date,
			"@unsubscribeToken": unsubscribeToken
		});

		const params = new URLSearchParams();
		params.set("email", email);
		params.set("unsubscribeToken", unsubscribeToken);
		params.set("accept", "text/html");

		try {
			const info = await transporter.sendMail({
				from: config.email.fromEmail,
				to: email,
				subject: "P12-Environmental mailing list confirmation",
				html: `<h1>Welcome to the P12-Environmental mailing list.</h1>
					<a href="${config.baseUrl}/unsubscribe?${params.toString()}">Unsubscribe</a>
				`,
			});
			if (!info.accepted.includes(email) || info.rejected.includes(email)) {
				res.status(422).json({ message: "Failed to send confirmation email: email was rejected" });
			}
			else {
				res.status(200).json({ message: "Confirmation sent successfully, please check your inbox" })
			}
		}
		catch (e) {
			console.log("Failed to send confirmation email", e)
			res.status(513).json({ message: "Failed to send confirmation email: internal server error" })
		}
	}
);

app.post("/api/mailing/unsubscribe",
	body("email")
		.trim()
		.isEmail(),
	body("unsubscribeToken")
		.isString()
		.notEmpty(),
	async (req, res) => {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			return res.status(400).json({ message: "Invalid input", errors: result.array() });
		}

		const { email, unsubscribeToken } = req.body;
		const stmt = await db.prepare("DELETE FROM MailingList WHERE email = @email AND unsubscribeToken = @unsubscribeToken");
		const deleteResult = await stmt.run({
			"@email": email,
			"@unsubscribeToken": unsubscribeToken
		});

		if (deleteResult.changes === 0) {
			return res.status(404).json({ message: "Subscription not found or already unsubscribed" });
		}

		res.status(200).json({ message: "Your email address has successfully been removed from our mailing list." });
	}
);

app.post("/api/contact",
	body("firstName")
		.trim()
		.isString()
		.notEmpty(),
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
	async (req, res) => {
		const result = validationResult(req);
		if (!result.isEmpty()) {
			return res.status(400).json({ message: "Specified details were invalid", errors: result.array() });
		}

		const { firstName, lastName, email, message } = req.body;
		const stmt = await db.prepare("INSERT INTO ContactMessages (firstName, lastName, email, message) VALUES (@firstName, @lastName, @email, @message)");
		await stmt.run({
			"@firstName": firstName,
			"@lastName": lastName,
			"@email": email,
			"@message": message
		});
	}
);

app.listen(config.port, () => {
	console.log(`P12 Website server running on port ${config.port}`);
});