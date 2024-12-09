const newsletterForm = document.getElementById("newsletterForm");
const goalList = document.getElementById("goalList");
const dropDown = document.getElementById("dropDown");
const navList = document.getElementById("navList");
const hamburger = document.getElementById("hamburger");
const hamburgerIcon = document.getElementById("hamburgerIcon");

hamburger.addEventListener("click", function() {
	if (navList.classList.contains("open")) {
		navList.classList.remove("open");
		hamburgerIcon.classList.replace("fa-xmark", "fa-bars");
	}
	else {
		navList.classList.add("open");
		hamburgerIcon.classList.replace("fa-bars", "fa-xmark");
	}
});

goalList.addEventListener("mouseover", function() {
	dropDown.classList.toggle("open");
});

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