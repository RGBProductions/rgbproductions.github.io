const params = new URL(window.location.toLocaleString()).searchParams;
let iframe = document.getElementById("tool");
if (params.has("tool")) {
    iframe.setAttribute("src", params.get("tool"));
}
