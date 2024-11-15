import express from "express"
import Database from 'better-sqlite3';
import swaggerUi from "swagger-ui-express";
import fs from "fs";

const port = 8080
const app = express()
const swaggerDocument = JSON.parse(fs.readFileSync("swagger.json").toString())
const db = new Database("server.db");
db.pragma("journal_mode = WAL");
const createSubscribedEmails = 
	`CREATE TABLE IF NOT EXISTS SubscribedEmails(
		email TEXT NOT NULL,
		date INTEGER,
		unsubscribeToken TEXT
	);`
db.exec(createSubscribedEmails)

// Add static file hosting middleware
app.use(express.static("public"));
// Add auutomatic JSON body parsing middleware
app.use(express.json());
// Add swagger API testing middleware

app.use("/swagger", swaggerUi.serve, swaggerUi.setup(swaggerDocument));


app.get("/", (req, res) => {
	return res.sendFile("public/index.html", err =>  {
		if (err) {
			console.error("Failed to serve index.html", err)
		}
	})
})

app.post("/mailing/subscribe", (req, res) => {
	const email = req.body.email
	// Validate email, TODO: Use regexes or similar to check it is formatted correctly
	if (!email || typeof email !== "string") {
		// Status 400 bad request - Data supplied to server was invalid
		res.writeHead(400, { "content-type": "application/json" })
		res.write(JSON.stringify({ "message": "Specified email was invalid" }))
		return res.end();
	}
	//const stmt = db.prepare("INSERT INTO SubscribedEmails (email, date, unsubscribeToken) VALUES (?, ?, ?)");
	//stmt.run();
})

app.post("/mailing/unsubscribe", (req, res) => {
	const { email, unsubscribeToken } = req.body
	if (!email || typeof email !== "string") {
		// Status 400 bad request - Data supplied to server was invalid
		res.writeHead(400, { "content-type": "application/json" })
		res.write(JSON.stringify({ "message": "Specified email was invalid" }))
		return res.end();
	}
	if (!unsubscribeToken || typeof unsubscribeToken !== "string") {
		// Status 400 bad request - Data supplied to server was invalid
		res.writeHead(400, { "content-type": "application/json" })
		res.write(JSON.stringify({ "message": "Specified unsubscription token was invalid" }))
		return res.end();
	}

})

app.listen(port, () => {
	console.log(`P12 Website server running on port ${port}`)
})