const contactForm = document.getElementById("contactForm");

contactForm.addEventListener("submit", async function(event) {
	event.preventDefault();

	const { firstName, lastName, email, message } = contactForm.elements; 
	const formData = {
		firstName: firstName.value,
		lastName: lastName.value,
		email: email.value,
		message: message.value
	};

	try {
		const res = await fetch("/contact", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(formData)
		});

		if (!res.ok) {
			const error = await res.json();
			console.error("Failed to send contact message:", error);
		}

		const data = await res.json();
		console.log("Sucessfully sent contact message:", data);
		window.location.href = "/submit"
	}
	catch (error) {
		console.error("Failed to submit form:", error);
	}
});