"use strict";
import express from "express";
import { JSONFilePreset } from "lowdb/node";
import swaggerUi from "swagger-ui-express";
import { rateLimit } from "express-rate-limit";
import { body, query, validationResult } from "express-validator";
import nodemailer from "nodemailer";
import crypto from "crypto";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const defaultConfig = {
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
};
const configPath = "server-config.json";
let config = null;
if (!fs.existsSync(configPath)) {
	fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, "\t"));
	console.log("Config file created at", configPath, "please edit and restart the server to override defaults");
	config = JSON.parse(fs.readFileSync(configPath).toString());
}
else {
	config = JSON.parse(fs.readFileSync(configPath).toString());
}
if (config == null) {
	console.error("Could not find server config at", configPath, "or provided config was invalid");
	process.exit(1);
}
const app = express();
const swaggerDocument = JSON.parse(fs.readFileSync("swagger.json").toString());
const db = await JSONFilePreset("db.json", { subscriptions: [], contactMessages: [] });
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

app.get("/api/team", (req, res) => {
    const filePath = path.join(currentDir, "team.json");
    res.sendFile(filePath);
});

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
		const { subscriptions } = db.data;
		const existingSubscription = subscriptions.find(subscription => subscription.email === email);
		if (existingSubscription) {
			res.status(400).json({ message: "This email has already been subscribed to the mailing list" });
			return res.end();
		}

		// Insert into db
		const date = new Date();
		const unsubscribeToken = crypto.randomBytes(64).toString("hex");
		const subscriptionObject = {
			email,
			date,
			unsubscribeToken
		};
		await db.update(({ subscriptions }) => subscriptions.push(subscriptionObject));

		// Send email and HTTP response
		const { baseUrl } = config;
		const params = new URLSearchParams();
		params.set("email", email);
		params.set("unsubscribeToken", unsubscribeToken);
		params.set("accept", "text/html");
		const unsubscribeUrl = `${baseUrl}/unsubscribe?${params.toString()}`;
		const unsubscribeEmail = `unsubscribe@${config.email.fromEmail}`;
		const emailTemplatePath = path.join(currentDir, "email-template.ejs");

		try {
			res.render(emailTemplatePath, { baseUrl, unsubscribeEmail, unsubscribeUrl }, async (err, html) => {
			    if (err) {
					console.log("Failed to render confirmation email", err);
					return res.status(513).json({ message: "Failed to send confirmation email: internal server error" });
				}
			  
				const info = await transporter.sendMail({
					from: config.email.fromEmail,
					to: email,
					subject: "P12-Environmental mailing list confirmation",
					headers: {
						"List-Unsubscribe": `<mailto:${unsubscribeEmail}>, <${unsubscribeUrl}>`,
					},
					html: html
				});
				if (!info.accepted.includes(email) || info.rejected.includes(email)) {
					res.status(422).json({ message: "Failed to send confirmation email: email was rejected" });
				}
				else {
					res.status(200).json({ message: "Confirmation sent successfully, please check your inbox" });
				}
			});
		}
		catch (e) {
			console.log("Failed to send confirmation email", e)
			res.status(513).json({ message: "Failed to send confirmation email: internal server error" });
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

		// Insert into db
		const { email, unsubscribeToken } = req.body;
		const { subscriptions } = db.data;
		const foundSubscription = subscriptions.find(subscription => subscription.email === email);
		if (!foundSubscription) {
			return res.status(404).json({ message: "Subscription not found or already unsubscribed" });
		}
		if (foundSubscription.unsubscribeToken !== unsubscribeToken) {
			return res.status(403).json({ message: "Specified unsubscription token was invalid" });
		}
		await db.update(({ subscriptions }) => subscriptions.splice(subscriptions.indexOf(foundSubscription), 1));
		
		// Send response
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
		// Validate
		const result = validationResult(req);
		if (!result.isEmpty()) {
			return res.status(400).json({ message: "Specified details were invalid", errors: result.array() });
		}

		// Insert into db
		const { firstName, lastName, email, message } = req.body;
		const date = new Date();
		const { contactMessages } = db.data;
		const largestId = Math.max(...contactMessages.map(contactMessage => contactMessage.id));
		const contactMessageObject = {
			id: largestId + 1,
			firstName,
			lastName,
			email,
			message,
			date
		};
		await db.update(({ contactMessages }) => contactMessages.push(contactMessageObject));
		return res.status(200).json({ message: "Message received successfully, we will get back to you shortly" });
	}
);

app.listen(config.port, () => {
	console.log(`P12 Website server running on port ${config.port}`);
});