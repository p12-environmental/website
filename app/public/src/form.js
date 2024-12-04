const signupForm = document.getElementById("signup-form");

signupForm.addEventListener("submit", async function(event) {
	event.preventDefault();

	const { firstName, lastName, email, message } = signupForm.elements; 
	const formData = {
		firstName: firstName.value,
		lastName: lastName.value,
		email: email.value,
		message: message.value
	};

	const jsonData = JSON.stringify(formData);
	try {
		// TODO: Dynamically insert server URL
		const response = await fetch("http://localhost:8080", {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: jsonData
		});

		const data = await response.json();
		console.log("Form submitted successfully:", data);
	}
	catch (error) {
		console.error("Error submitting form:", error);
	}
});