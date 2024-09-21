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

    for (let obj of item.contents) {
        let type = obj.type;
        if (type == "text") {
            let lineElem = document.createElement("p");
            lineElem.innerText = obj.contents;
            contents.appendChild(lineElem);
        }
        if (type == "header") {
            let lineElem = document.createElement("h1");
            lineElem.innerText = obj.contents;
            contents.appendChild(lineElem);
        }
        if (type == "image") {
            let imgElem = document.createElement("img");
            imgElem.src = obj.src;
            imgElem.setAttribute("alt", obj.alt);
            contents.appendChild(imgElem);
            if (obj.caption) {
                let captionElem = document.createElement("p");
                captionElem.innerText = obj.caption;
                captionElem.classList.add("image-caption");
                contents.appendChild(captionElem);
            }
        }
    }

    let links = document.createElement("div");
    links.id = "links";

    for (let obj of item.links) {
        let link = document.createElement("a");
        link.classList.add("link-container");
        link.classList.add("feedlink");
        link.innerText = obj.label;
        link.href = obj.href;
        links.appendChild(link);
    }

    box.appendChild(contents);
    box.appendChild(links);

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

let allFeedItems = [];

function pushFeed(items) {
    items = items ?? allFeedItems;
    let feedArea = document.getElementById("feed");
    while (feedArea.firstChild) {
        feedArea.removeChild(feedArea.firstChild);
    }

    for (let itm of items) {
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
            summaryText = body;
        }
        summary.innerHTML = summaryText;
        detailsArea.appendChild(summary);

        elem.appendChild(detailsArea);

        elem.onclick = function() {
            createFeedPopout(itm);
        }

        feedArea.appendChild(elem);
    }

    let feedMissing = document.getElementById("feedMissing");
    feedMissing.style.display = items.length == 0 ? "initial" : "none";
}

async function refreshFeed() {
    let feedLoading = document.getElementById("feedLoading");
    let feedMissing = document.getElementById("feedMissing");
    feedLoading.style.display = "initial";
    feedMissing.style.display = "none";
    refreshing = true;
    allFeedItems = [];
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
            let body = "";
            for (let obj of itm.contents) {
                if (obj.type == "text") {
                    body += obj.contents + " ";
                }
                if (obj.type == "header") {
                    body += obj.contents + " ";
                }
                if (obj.type == "image") {
                    body += (obj.caption ?? obj.alt ?? "") + " ";
                }
            }
            itm.body = body;
            allFeedItems.push(itm);
        }
    }
    pushFeed();
    refreshing = false;
    feedLoading.style.display = "none";
}

document.addEventListener("keydown", (e) => {
    if (e.key == "Escape") {
        let container = document.getElementsByClassName("popout-container")[0];
        if (container) {
            container.style.opacity = "0";
        }
    }
})

window.addEventListener("resize", (e) => {
    let container = document.getElementsByClassName("popout-container")[0];
    if (container) {
        container.style.height = `${window.innerHeight}px`;
    }
})

function sortedFeed(feed, method) {

}

function searchFeed(query) {
    if (query.length == 0) {
        pushFeed(allFeedItems);
        return;
    }
    let fuse = new Fuse(allFeedItems, {keys: ["title", "summary", "body"]});
    let results = fuse.search(query);
    pushFeed(results.map(v => v.item));
}

setTimeout(() => {
    refreshFeed();
}, 200);

fetch("https://discord.com/api/guilds/965485027410468868/widget.json").then((res) => {
    res.json().then(obj => {
        document.getElementById("online-count").innerText = `${obj.presence_count} online`;
    }).catch(console.error)
}).catch(console.error)

fetch("https://decapi.me/twitch/uptime/rgbproductionsgames").then((res) => {
    res.text().then(text => {
        if (!text.includes("offline")) {
            document.getElementById("is-live").innerText = `LIVE`;
        }
    }).catch(console.error)
}).catch(console.error)