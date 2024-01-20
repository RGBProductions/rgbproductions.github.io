let feed = [];
let feedErr = undefined;
let feedMissing = document.getElementById("feedMissing");

let refreshing = false;

async function getFeed() {
    return await fetch("./feed.json").then(async res => {
        return await res.text().then(text => {
            return text;
        });
    })
}

async function refreshFeed() {
    refreshing = true;
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
            elem.classList.add("feeditm");

            let title = document.createElement("h1");
            title.classList.add("feedtitle");
            title.innerHTML = itm.title;
            elem.appendChild(title);

            let date = document.createElement("p");
            date.classList.add("feeddate");
            date.innerHTML = itm.published;
            elem.appendChild(date);

            let body = document.createElement("p");
            body.classList.add("feedbody");
            body.innerHTML = itm.body;
            elem.appendChild(body);

            let images = document.createElement("div");
            images.classList.add("feedimgs");
            for (let image of (itm.images ?? [])) {
                let img = document.createElement("img");
                img.classList.add("feedlink");
                img.src = image.url;
                img.alt = image.alt;
                img.title = image.alt;
                images.appendChild(img);
                images.appendChild(document.createElement("br"));
            }
            elem.appendChild(images);

            let links = document.createElement("div");
            links.classList.add("feedlinks");
            for (let link of (itm.links ?? [])) {
                let button = document.createElement("a");
                button.classList.add("feedlink");
                button.target = "_blank";
                button.href = link.url;
                button.innerHTML = link.label;
                links.appendChild(button);
            }
            elem.appendChild(links);

            feedArea.appendChild(elem);
        }
    }
    if (!hasItems) {
        feedMissing.style.visibility = "visible";
    } else {
        feedMissing.style.visibility = "hidden";
    }
    refreshing = false;
}

refreshFeed();