const newsletterForm = document.getElementById("newsletterForm");

newsletterForm.addEventListener("submit", async function(e) {
	e.preventDefault();

	const { email } = newsletterForm.elements;
	const requestObj = {
		email: email.value
	};

	try {
		const res = await fetch("/mailing/subscribe", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(requestObj)
		});
		if (!res.ok) {
			const error = await res.json();
			console.error("Failed to subscribe to newsletter:", error);
		}
	
		const data = await res.json();
		console.log("Successfuly subscribed to newsletter:", data);
	}
	catch (error) {
		console.error("Failed to submit form:", error)
	}
});