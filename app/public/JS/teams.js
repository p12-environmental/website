const localJsonFile = "JSON/teamdata.json";

class MemberItem extends HTMLElement {
	constructor() {
		super();

		this.className = "member"

		this.figure = document.createElement("figure");
		this.img = document.createElement("img");
		this.img.alt = "profile image";

		this.figcaption = document.createElement("figcaption");
		this.nameHeading = document.createElement("h3");
		this.roleItem = document.createElement("h4");

		this.detailsList = document.createElement("ul");
		this.biographyItem = document.createElement("li")
		this.responsibilityItem = document.createElement("li")
		this.contributionsItem = document.createElement("li")

		this.detailsList.append(this.biographyItem, this.responsibilityItem, this.contributionsItem);
		this.figcaption.append(this.nameHeading,this.roleItem, this.detailsList);
		this.figure.append(this.img, this.figcaption);
		this.append(this.figure);
	}

	connectedCallback() {
		this.img.src = this.getAttribute("image");
		this.nameHeading.textContent = this.getAttribute("name");
		this.roleItem.textContent = this.getAttribute("role");
		this.biographyItem.textContent = this.getAttribute("biography");
		this.responsibilityItem.textContent = this.getAttribute("responsibility");
		this.contributionsItem.textContent = this.getAttribute("contributions");
	}
}
customElements.define("member-item", MemberItem, { extends: "article" })

document.addEventListener("DOMContentLoaded", () => {
	const sectionElement = document.querySelector("main");

	fetch(localJsonFile)
		.then(response => response.json())
		.then(responseData => {
			for (item of responseData) {
				const memberItem = document.createElement("article", { is: "member-item" });
				memberItem.setAttribute("image", item.image);
				memberItem.setAttribute("name", item.name);
				memberItem.setAttribute("role", item.role);
				memberItem.setAttribute("biography", item.biography);
				memberItem.setAttribute("responsibility", item.responsibility);
				memberItem.setAttribute("contributions", item.contributions);
				sectionElement.appendChild(memberItem);
			}
		})
})
