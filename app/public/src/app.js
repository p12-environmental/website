const newsletterForm = document.getElementById("newsletterForm");
const goalList = document.getElementById("goalList");
const dropDown = document.getElementById("dropDown");
const navList = document.getElementById("navList");
const hamburger = document.getElementById("hamburger");
const hamburgerIcon = document.getElementById("hamburgerIcon");
const goalsDropBtn = document.getElementById("goalsDropBtn");
const nav = document.querySelector("nav");

goalsDropBtn.addEventListener("click", function(e) {
	dropDown.classList.toggle("open");
});

nav.addEventListener("click", function(e) {
	if (e.target === nav) {
		closeNav();
	}
});

hamburger.addEventListener("click", function(e) {
	e.stopPropagation();
	if (navList.classList.contains("open")) {
		closeNav();
	}
	else {
		openNav();
	}
});

function closeNav() {
	navList.classList.remove("open");
	hamburgerIcon.classList.replace("fa-xmark", "fa-bars");
}

function openNav() {
	navList.classList.add("open");
	hamburgerIcon.classList.replace("fa-bars", "fa-xmark");
}

newsletterForm.addEventListener("submit", async function(e) {
	e.preventDefault();

	const { email } = newsletterForm.elements;
	const requestObj = {
		email: email.value
	};

	try {
		const res = await fetch("/api/mailing/subscribe", {
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
	newsletterForm.reset();
});