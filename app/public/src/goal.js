const urlParams = new URLSearchParams(window.location.search);
const goalItem = urlParams.get("goal")
//const localJsonFile = `assets/goal${goalItem}.json`

let localJsonFile = "/assets/goal1.json"

	document.addEventListener("DOMContentLoaded", function () {
		fetch(localJsonFile)
        .then(response => response.json())
        .then(data => {
			console.log(data);

			//finding the header
			headerElement = document.getElementById("goal-header");
			headerElement.style.backgroundImage = `url("${data.titleImgURL}")`;

			//create title
			title = document.createElement("h1");
			title.innerHTML = "<strong>" + data.title + "</strong>";


			//create tagline
			tagline = document.createElement("p");
			tagline.textContent = data.tagLine;

			//add title and tagline to header
			headerElement.append(title, tagline)


            sectionElement = document.getElementById("goalContent");
			
			//create relatedTopics
			relatedTopics = document.createElement("div");
			relatedTopics.className = "related-topics";

			//create title for it ^
			relatedTopicsTitle = document.createElement("h3");
			relatedTopicsTitle.innerHTML = "<strong>Related Topics:</strong>";

			//create dropdown div
			dropdown = document.createElement("div");
			dropdown.className = "dropdown"

			//add title and dropdown to related topics
			relatedTopics.append(relatedTopicsTitle,dropdown);

			//go through relatedTopics array
			for (item of data.relatedTopics) {

				//creates the html element
				const details = document.createElement("details");
				details.className = "dropdown-details"


				const summary = document.createElement("summary");
				const desc = document.createElement("p");

				summary.textContent = item.summary
				desc.textContent = item.desc

				//make the 2 elements append to details
				details.append(summary,desc);
				
				// Append the elements to the "goalContent" section
				dropdown.append(details);
			}

			//making the overview
			overview = document.createElement("div");
			overview.className = "overview";

			//create title for it ^
			overviewTitle = document.createElement("h3");
			overviewTitle.innerHTML = "<strong>Overview:</strong>";

			//create p for it ^
			overviewText = document.createElement("p");
			overviewText.textContent = data.overview

			overview.append(overviewTitle,overviewText);

			//making overview image
			overviewImgDiv = document.createElement("div");
			overviewImgDiv.className = "overview-image";

			overviewImg = document.createElement("img");
			overviewImg.src = data.imageSrc;
			overviewImg.alt = "goal overview image"

			overviewImgDiv.append(overviewImg)

			sectionElement.append(relatedTopics,overview,overviewImg)
        })
        .catch(error => console.error("Error fetching JSON data:", error));
});