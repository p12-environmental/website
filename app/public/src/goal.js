const urlParams = new URLSearchParams(window.location.search);
const goalItem = urlParams.get("item");
const localJsonFile = `assets/goal${goalItem}.json`;

document.addEventListener("DOMContentLoaded", function () {
	fetch(localJsonFile)
		.then(response => {
			if (response.ok) {
				return response.json();
			}
			else {
				window.location.replace("/404");
			}
		})
		.then(data => {
			//finding the title tag
			pageTitle = document.getElementsByTagName("title");
			pageTitle.textContent = "Goal " + data.pageTitle;

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
			dropdown.className = "dropdown";

			//add title and dropdown to related topics
			relatedTopics.append(relatedTopicsTitle, dropdown);

			//go through relatedTopics array
			for (item of data.relatedTopics) {

				//creates the html element
				const details = document.createElement("details");
				details.className = "dropdown-details";


				const summary = document.createElement("summary");
				const desc = document.createElement("p");

				summary.textContent = item.summary
				desc.textContent = item.desc

				//make the 2 elements append to details
				details.append(summary, desc);

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
			overviewText.textContent = data.overview;

			overview.append(overviewTitle, overviewText);

			//making overview image
			overviewImg = document.createElement("img");
			overviewImg.src = data.imageSrc;
			overviewImg.alt = "goal overview image";

			//making pie charts
			overviewChart = document.createElement("div");
			overviewChart.className = "donut-chart";

			overviewLabel = document.createElement("p");
			overviewLabel.className = "label";
			overviewLabel.textContent = "Dead Fish 35%"

			overviewLabel2 = document.createElement("p");
			overviewLabel2.className = "label";
			overviewLabel2.textContent = "Trees Cut Down 55%"

			overviewChart2 = document.createElement("div");
			overviewChart2.className = "donut-chart";

			overviewChart3 = document.createElement("div");
			overviewChart3.className = "donut-chart";

			overviewLabel3 = document.createElement("p");
			overviewLabel3.className = "label";
			overviewLabel3.textContent = "Water-Level Rise 13%"



			overviewChart.append(overviewLabel);
			overviewChart2.append(overviewLabel2);
			overviewChart3.append(overviewLabel3);
			
			
			sectionElement.append(relatedTopics, overview,overviewChart,overviewChart2,overviewChart3,overviewImg);
		})
		.catch(error => {
			console.error("Error fetching goal JSON data:", error);
			window.location.replace("/404");
		});
});
