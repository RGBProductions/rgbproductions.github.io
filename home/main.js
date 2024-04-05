let feed = [];
let feedErr = undefined;
// let feedMissing = document.getElementById("feedMissing");

let refreshing = false;

function createFeedPopout(item) {
    document.body.style.overflow = "hidden";
    let container = document.createElement("div");
    container.style.opacity = "0%";
    container.style.overflow = "hidden";

    container.style.height = `${window.innerHeight}px`;

    container.addEventListener("click", (e) => {
        container.style.opacity = "0%";
    })

    container.addEventListener("transitionend", (e) => {
        if (container.style.opacity == "0") {
            document.body.removeChild(container);
            document.body.style.overflow = "initial";
        }
    })

    let box = document.createElement("div");
    box.classList.add("feed-box");
    box.addEventListener("click", (e) => e.stopPropagation());

    let header = document.createElement("div");
    header.classList.add("feed-header");

    let title = document.createElement("h1");
    title.classList.add("feed-title");
    title.innerText = item.title;
    let date = document.createElement("p");
    date.classList.add("feed-date");
    date.innerText = item.published;
    let close = document.createElement("img");
    close.src = "/shared/img/close.png";
    close.setAttribute("width", "40px");
    close.setAttribute("height", "40px");
    close.classList.add("themed");
    close.classList.add("feed-close");
    close.addEventListener("click", () => {
        container.style.opacity = "0";
    })
    // <img src="/shared/img/close.png" width="32px" height="32px" class="closemenu themed" onclick="closeNav()">
    header.appendChild(title);
    header.appendChild(date);
    header.appendChild(close);
    box.appendChild(header);

    let contents = document.createElement("div");
    contents.classList.add("feed-contents");

    for (let line of item.body.split("\n")) {
        let lineElem = document.createElement("p");
        lineElem.innerText = line;
        contents.appendChild(lineElem);
    }
    
    box.appendChild(contents);

    container.appendChild(box);
    
    document.body.appendChild(container);
    setTimeout(() => {
        container.style.overflow = undefined;
        container.classList.add("popout-container");
        container.style.opacity = "1";
    }, 0)
}

async function getFeed() {
    return await fetch("./feed.json").then(async res => {
        return await res.text().then(text => {
            return text;
        });
    })
}

async function refreshFeed() {
    refreshing = true;
    let feedMissing = document.getElementById("feedMissing");
    let feedArea = document.getElementById("feed");
    while (feedArea.firstChild) {
        feedArea.removeChild(feedArea.firstChild);
    }
    let text = await getFeed();
    try {
        feed = JSON.parse(text);
    } catch(e) {
        feedErr = e;
        refreshing = false;
        return;
    }
    feed.reverse();
    let hasItems = false;
    for (let itm of feed) {
        if (!itm.hidden) {
            hasItems = true;
            let elem = document.createElement("section");
            elem.classList.add("feed-opener");

            if (itm.thumbnail) {
                let thumbnail = document.createElement("img");
                thumbnail.classList.add("feed-opener-thumbnail");
                thumbnail.src = itm.thumbnail;
                elem.appendChild(thumbnail);
            }

            let detailsArea = document.createElement("div");
            detailsArea.classList.add("feed-opener-details");

            let title = document.createElement("h1");
            title.classList.add("feed-opener-title");
            title.innerHTML = itm.title;
            detailsArea.appendChild(title);

            let date = document.createElement("p");
            date.classList.add("feed-opener-date");
            date.innerHTML = itm.published;
            detailsArea.appendChild(date);

            let summary = document.createElement("p");
            summary.classList.add("feed-opener-summary");
            let summaryText = itm.summary;
            if (!summaryText) {
                summaryText = itm.body;
            }
            summary.innerHTML = summaryText;
            detailsArea.appendChild(summary);

            elem.appendChild(detailsArea);

            // let body = document.createElement("p");
            // body.classList.add("feedbody");
            // body.innerHTML = itm.body;
            // elem.appendChild(body);

            // let images = document.createElement("section");
            // images.classList.add("feedimgs");
            // for (let image of (itm.images ?? [])) {
            //     let img = document.createElement("img");
            //     img.classList.add("feedlink");
            //     img.src = image.url;
            //     img.alt = image.alt;
            //     img.title = image.alt;
            //     images.appendChild(img);
            //     images.appendChild(document.createElement("br"));
            // }
            // elem.appendChild(images);

            // let links = document.createElement("section");
            // links.classList.add("feedlinks");
            // for (let link of (itm.links ?? [])) {
            //     let button = document.createElement("a");
            //     button.classList.add("feedlink");
            //     button.target = "_blank";
            //     button.href = link.url;
            //     button.innerHTML = link.label;
            //     links.appendChild(button);
            // }
            // elem.appendChild(links);

            elem.onclick = function() {
                createFeedPopout(itm);
            }

            feedArea.appendChild(elem);
        }
    }
    if (!hasItems) {
        feedMissing.style.display = "initial";
    } else {
        feedMissing.style.display = "none";
    }
    refreshing = false;
}

document.addEventListener("keydown", (e) => {
    if (e.key == "Escape") {
        let container = document.getElementsByClassName("popout-container")[0];
        if (container) {
            container.style.opacity = "0";
        }
    }
})

setTimeout(() => {
    refreshFeed();
}, 200);