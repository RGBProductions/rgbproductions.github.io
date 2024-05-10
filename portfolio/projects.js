class Project {
    constructor(name,dates,contents) {
        this.name = name;
        this.dates = dates;
        this.contents = contents;
    }

    makeElement() {
        let contents = document.createElement("div");
        contents.className = "project-contents";

        let isLink = false;
        let linkBarElement;
        let linkBarWrapper;

        for (let content of this.contents) {
            if (content.type == "link") {
                let element = document.createElement("a");
                element.className = "project-contents-link";
                element.setAttribute("href", content.url);
                element.setAttribute("target", "_blank");
                element.innerText = content.text;
                let underline = document.createElement("div");
                underline.className = "underline";
                element.appendChild(underline);
                if (!isLink) {
                    linkBarWrapper = document.createElement("div");
                    linkBarWrapper.className = "linkbar-wrapper";
                    linkBarElement = document.createElement("div");
                    linkBarElement.className = "project-contents-linkbar";
                    isLink = true;
                }
                linkBarElement.appendChild(element);
            } else if (isLink) {
                isLink = false;
                linkBarWrapper.appendChild(linkBarElement);
                contents.appendChild(linkBarWrapper);
                linkBarElement = undefined;
                linkBarWrapper = undefined;
            }
            if (content.type == "text") {
                let element = document.createElement("p");
                element.className = "project-contents-text";
                element.innerText = content.text;
                contents.appendChild(element);
            }
            if (content.type == "ordered_list") {
                let wrapper = document.createElement("div");
                wrapper.className = "ordered-list-wrapper";
                let element = document.createElement("ol");
                element.className = "project-contents-ordered-list";
                for (let item of content.items) {
                    let itemElem = document.createElement("li");
                    itemElem.className = "project-contents-list-item";
                    itemElem.innerText = item;
                    element.appendChild(itemElem);
                }
                wrapper.appendChild(element);
                contents.appendChild(wrapper);
            }
            if (content.type == "header") {
                let element = document.createElement("h2");
                element.className = "project-contents-header";
                element.innerText = content.text;
                contents.appendChild(element);
            }
            if (content.type == "image") {
                let wrapper = document.createElement("div");
                wrapper.className = "image-wrapper";
                let element = document.createElement("img");
                element.className = "project-contents-image";
                element.src = content.src;
                element.setAttribute("alt", content.alt);
                wrapper.appendChild(element);
                
                if (content.caption) {
                    let caption = document.createElement("p");
                    caption.className = "project-contents-caption";
                    caption.innerText = content.caption;
                    wrapper.appendChild(caption);
                }
                contents.appendChild(wrapper);
            }
        }
        if (isLink) {
            linkBarWrapper.appendChild(linkBarElement);
            contents.appendChild(linkBarWrapper);
        }
        return contents;
    }
}

let projects = {
    canesSignUp: new Project("Raising Cane's - Caniac Club Sign-Up", "September 2023", [
        {"type": "text", "text": "This project was the first one our UX Design class at CART worked on. We were tasked with re-designing the online sign-up process for the Raising Cane's \"Caniac Club\" membership in order to make it less time consuming and more convenient for the users."},
        {"type": "image", "src": "./img/projects/canes_screens.png", "caption": "My design for the sign-up process"},
        {"type": "link", "url": "https://www.figma.com/design/uMacqClyZmeUPhGkZAUTfv/Cane's-Andrew?node-id=0%3A1&t=i4FJ5lVHUKlidQZs-1", "text": "Figma File"},
        {"type": "link", "url": "https://www.figma.com/proto/uMacqClyZmeUPhGkZAUTfv/Cane's-Andrew?node-id=19-107&t=o5vgSsT5oKkE0Fy2-1&scaling=scale-down&page-id=0%3A1&starting-point-node-id=19%3A107", "text": "Prototype"}
    ]),
    jurassicPark: new Project("Jurassic Park App - Exhibits Page", "October 2023 - December 2023", [
        {"type": "text", "text": "Our CART UX Design class' second project was for a Jurassic Park mobile app. The page I designed was the exhibits page and user flow. This was the project we showed off during our 2023 Winter Showcase."},
        {"type": "image", "src": "./img/projects/jp_screens.png", "caption": "My designs for the Jurassic Park exhibits flow"},
        {"type": "link", "url": "https://www.figma.com/design/GlLfj0SCfmmh2dmTI1464y/Jurassic-Park-App?node-id=0%3A1&t=5ArvYZQGRPLuzuOZ-1", "text": "Figma File"},
        {"type": "link", "url": "https://www.figma.com/proto/GlLfj0SCfmmh2dmTI1464y/Jurassic-Park-App?node-id=1-3&t=d6pKn3ApjAaxd40c-1&scaling=scale-down&page-id=0%3A1&starting-point-node-id=1%3A3", "text": "Prototype"}
    ]),
    outbreakOutlook: new Project("Outbreak Outlook", "February 2024 - March 2024", [
        {"type": "text", "text": "Outbreak Outlook was my third and final app design for my UX Design class. The goal of the app is to allow users to locate and avoid disease outbreaks near them."},
        {"type": "image", "src": "./img/projects/oo_screens.png", "caption": "My designs for Outbreak Outlook"},
        {"type": "link", "url": "https://www.figma.com/design/sTtu1EldqwQA0AGhPXLT1u/Project-3-Outbreak-Outlook?node-id=106%3A166&t=VyiuVGK6soeVMDOp-1", "text": "Figma File"},
        {"type": "link", "url": "https://www.figma.com/proto/sTtu1EldqwQA0AGhPXLT1u/Project-3-Outbreak-Outlook?node-id=106-168&t=kObSl7N2tGU9SPC5-1&scaling=scale-down&page-id=106%3A166&starting-point-node-id=106%3A168", "text": "Prototype"}
    ]),

    slash: new Project("The Slash of the Dice", "July 2022", [
        {"type": "text", "text": "During July of 2022, I participated in the GMTK Game Jam 2022. The theme for this jam was \"Roll of the Dice\"."},
        {"type": "text", "text": "I am planning on releasing version 1.2 during July of 2024, two years after the game's original release."},
        {"type": "image", "src": "./img/projects/slash_screen.png", "caption": "A screenshot from the game"},
        {"type": "link", "url": "https://rgbproductions.itch.io/the-slash-of-the-dice", "text": "Itch.io"},
        {"type": "link", "url": "https://github.com/RGBProductions/TheSlashOfTheDice", "text": "GitHub"},
    ])
}

function openProject(id) {
    if (projects[id]) {
        let container = document.createElement("div");
        container.className = "project-popout";

        let panel = document.createElement("div");
        panel.className = "project-panel";

        let title = document.createElement("h1");
        title.className = "project-title";
        title.innerText = projects[id].name;

        let dates = document.createElement("p");
        dates.className = "project-dates";
        dates.innerText = projects[id].dates;

        let close = document.createElement("button");
        close.className = "project-close";
        close.addEventListener("click", closeProject);

        panel.appendChild(close);
        panel.appendChild(title);
        panel.appendChild(dates);
        panel.appendChild(projects[id].makeElement());

        container.appendChild(panel);

        document.body.appendChild(container);

        container.addEventListener("transitionend", (e) => {
            if (container.style.opacity == "0") {
                container.remove();
            }
        });

        container.addEventListener("animationend", (e) => {
            if (container.style.opacity == "0") {
                container.remove();
            }
        });
    }
}

function closeProject() {
    let popout = document.getElementsByClassName("project-popout")[0];
    if (popout) {
        popout.style.opacity = "0%";
    }
}

document.addEventListener("keydown", (e) => {
    if (e.key == "Escape") {
        closeProject();
    }
})