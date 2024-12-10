# P12 Environmental Website
Website for P12 Group Project Climate Action, Sustainable Consumption and Production &amp;
Biodiversity, Forests, and Desertification project.

This project is a climate action website aimed at raising awareness, providing resources,
and engaging users to take climate-positive actions. The website includes various interactive
pages, resources, and informational content designed to promote sustainability and climate responsibility.

## Project Structure and Contributors

| Page                                              | Type | Lead Maintainer  |
|---------------------------------------------------|------|------------------|
| [/index](./app/views/index.ejs)                   | EJS  | Lewis            |
| [/goals](./app/views/goals.ejs)                   | EJS  | Ben/Lewis        |
| [/goal](./app/views/goal.ejs)                     | EJS  | Ben              |
| [/team](./app/views/team.ejs)                     | EJS  | Lewis            |
| [/form](./app/views/form.ejs)                     | EJS  | Sidra            |
| [/unsubscribe](./app/views/unsubscribe.ejs)       | EJS  | Zekiah           |
| [/404](./app/views/404.ejs)                       | EJS  | Zekiah           |

## Development Guide:
1. ### Cloning sources:
    - **Command line:**
        ```bash
        # 1. Cloning the respository
        git clone https://github.com/p12-environmental/website.git p12-website
        ```
    - **GitHub Desktop:**
        1. Open GitHub Desktop.
        2. Go to File > Clone Repository and paste the URL for this repository.
2. ### Testing the website:
    - **Command line:**
        ```sh
        # 1. Install npm dependencies
        npm install
        ```
        ```sh
        # 2. Run server
        node app.js
        ```
3. ### Making Changes:
    Edit the necessary files in vscode and save all modified files.
    - **Command line:**
        ```bash
        # 1. Include any new files in the git repo
        git add -A
        ```
        ```bash
        # 2. Create the commit, labelled with a commit message
        git commit -a -m "[commit message summarizing changes]"
        ```
        ```bash
        # 3. Push changes from local clone of repo to github
        git push origin main
        ```
    - **Github desktop:**
        1. Return to GitHub Desktop, where you’ll see your changes listed.
        2. Write a commit message summarizing changes.
        3. Click Commit to main, make sure to select including any newly created files.
        4. After committing, click Push origin to upload your changes to GitHub.

## Licensing
All rights to the content, design, and code of this project are reserved to the group members listed above. Any unauthorized reproduction, distribution, or modification is strictly prohibited unless explicitly approved by the authors.

© 2024 Group P12 Members.
