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
}
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
	console.error("Could not find server config at", configPath, "or provided config was invalid")
	process.exit(1)
}
const app = express();
const swaggerDocument = JSON.parse(fs.readFileSync("swagger.json").toString());
const db = await JSONFilePreset("db.json", { subscriptions: [], contactMessages: [] })
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
		}
		await db.update(({ subscriptions }) => subscriptions.push(subscriptionObject))

		// Send email and HTTP response
		const params = new URLSearchParams();
		params.set("email", email);
		params.set("unsubscribeToken", unsubscribeToken);
		params.set("accept", "text/html");
		const unsubscribeUrl = `${config.baseUrl}/unsubscribe?${params.toString()}`

		try {
			const info = await transporter.sendMail({
				from: config.email.fromEmail,
				to: email,
				subject: "P12-Environmental mailing list confirmation",
				headers: {
					"List-Unsubscribe": `<mailto:unsubscribe@${config.email.fromEmail}>, <${unsubscribeUrl}>`,
				},
				html: `
					<html>
						<head>
							<style>
								body {
									font-family: 'Assistant', sans-serif;
									color: #3363c2;
									background: linear-gradient(to bottom, #add8e6, #ffffff, #add8e6);
									margin: 0;
									padding: 0;
									line-height: 1.5;
								}

								h1 {
									font-family: 'Assistant', sans-serif;
									font-weight: lighter;
									color: #3363c2;
									text-align: center;
									margin-top: 40px;
									font-size: 2.5rem;
								}

								p {
									font-size: 1.125rem;
									margin: 20px 0;
									text-align: center;
								}

								ul {
									list-style-type: none;
									padding: 0;
									text-align: left;
									max-width: 600px;
									margin: 0 auto;
								}

								li {
									font-size: 1.125rem;
									margin-bottom: 10px;
								}

								a {
									color: #3363c2;
									text-decoration: none;
									font-weight: bold;
								}

								a:hover {
									color: #2554a7;
								}

								.footer {
									text-align: center;
									padding: 20px;
									background-color: #c5e2ff;
									margin-top: 30px;
								}

								.footer p {
									font-size: 0.875rem;
									color: #3363c2;
									margin-bottom: 10px;
								}

								.social-links {
									list-style: none;
									padding: 0;
									display: flex;
									justify-content: center;
									gap: 15px;
								}

								.social-links li {
									font-size: 1.125rem;
								}

								.social-links a {
									color: #3363c2;
									text-decoration: none;
								}

								.social-links a:hover {
									color: #2554a7;
								}
							</style>
						</head>
						<body>
							<h1>Welcome to the P12-Environmental Mailing List!</h1>
							<p>Thank you for joining the P12-Environmental community. We're excited to have you on board as we work together towards creating a sustainable future!</p>
							<p>As part of our mailing list, you'll receive updates on:</p>
							<ul>
								<li>Environmental news and updates</li>
								<li>Upcoming initiatives and events</li>
								<li>Educational resources on sustainability</li>
								<li>Insights on climate change, renewable energy, and green technology</li>
							</ul>
							<p>To ensure you never miss an update, we recommend adding our email to your safe senders list. You can also customise your preferences at any time through the links below.</p>
							<p>If you didn’t subscribe or if you’ve changed your mind, you can <a href="${unsubscribeUrl}">unsubscribe here</a>.</p>
							<p>We'd love to hear your thoughts and ideas! Feel free to reply to this email or join our discussions on our <a href="${config.baseUrl}/community-forum">community forum</a>.</p>
							<p>Thank you for being part of this journey towards a greener planet!</p>
							<p><strong>The P12-Environmental Team</strong></p>
							<p>Follow us on social media for the latest updates:</p>
							<ul class="social-links">
								<li><a href="https://facebook.com/P12Environmental">Facebook</a></li>
								<li><a href="https://twitter.com/P12Environmental">Twitter</a></li>
								<li><a href="https://instagram.com/P12Environmental">Instagram</a></li>
							</ul>
							<div class="footer">
								<p><small>If you no longer wish to receive emails from us, you can <a href="${unsubscribeUrl}">unsubscribe here</a>.</small></p>
							</div>
						</body>
					</html>
				`
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
		await db.update(({ subscriptions }) => subscriptions.splice(subscriptions.indexOf(foundSubscription), 1))
		
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
		await db.update(({ contactMessages }) => contactMessages.push(contactMessageObject))
	}
);

app.listen(config.port, () => {
	console.log(`P12 Website server running on port ${config.port}`);
});