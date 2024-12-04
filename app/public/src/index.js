let goals = document.querySelector('#goalsList');

goals.addEventListener("mouseover", () => {
	document.querySelector("#dropDown").classList.toggle("nav-visible");
});