import express from "express"

const port = 8080
const app = express()

app.use(express.static("public"))

app.get("/", (req, res) => {
	res.sendFile("public/index.html", err =>  {
		if (err) {
			console.error("Failed to serve index.html", err)
		}
	})
})

app.listen(port, () => {
	console.log(`P12 Website server running on port ${port}`)
})