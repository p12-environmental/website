const header = document.getElementById("header");
const description = document.getElementById("description");

const urlParams = new URLSearchParams(window.location.search);
const email = urlParams.get("email");
const unsubscribeToken = urlParams.get("unsubscribeToken");

if (!email || !unsubscribeToken) {
	header.textContent = "Unsubscription failed: Invalid or missing parameters";
	description.textContent = "We could not process your request due to missing or incorrect information. Please ensure you accessed the link correctly.";
}
else {
	const requestObj = {
		email, unsubscribeToken
	};
	
	fetch("/api/mailing/unsubscribe", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(requestObj)
	})
		.then(response => {
			if (response.ok) {
				header.textContent = "Unsubscribed successfully!";
			}
			else {
				header.textContent = "Unsubscription failed";
			}
			return response.json();
		})
		.then(data => {
			description.textContent = data.message || "We could not process your request. Please try again later.";
		})
		.catch(error => {
			console.error("Error:", error);
			header.textContent = "Unsubscription failed: An error occurred";
			description.textContent = "We encountered an issue while processing your request. Please try again later.";
		});	
}