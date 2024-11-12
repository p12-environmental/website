document.querySelector(".member h4").textContent = "Testing"

let localJsonFile = "/JSON/teamdata.json";

let sectionElement = document.querySelector(".member")

document.addEventListener('DOMContentLoaded', ()=>{
	fetch(localJsonFile)
	.then(response => response.json())
	.then (responseData =>{ 
		
		for (item of responseData){
		const schedule = document.createElement('article');
		console.log(schedule)
		sectionElement.appendChild(schedule)
		const test = document.createElement('h1');
		test.textContent = item.name;
		schedule.appendChild(test);
	}})
})
