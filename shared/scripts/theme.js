var theme = localStorage.getItem("theme") ?? "dark";

function fixIcon(elem) {
    elem.setAttribute("src", `/shared/img/${theme}.png`);
}

function setTheme(t) {
    document.documentElement.className = t;
    localStorage.setItem("theme", t);
    theme = t;
    for (let elem of document.getElementsByClassName("changetheme")) {
        fixIcon(elem);
    }
}

setTheme(theme);
setTimeout(() => {
    for (let elem of document.getElementsByClassName("changetheme")) {
        fixIcon(elem);
    }
}, 500);