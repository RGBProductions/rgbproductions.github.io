window.addEventListener("mousemove", (e) => {
    let mx = e.clientX-window.innerWidth/2;
    let my = e.clientY-window.innerHeight/2;
    document.getElementById("lights").style.transform = `translate(${mx/4}px, ${my/4}px)`;
})

function openMenu() {
    document.getElementById("menu").style.left = "0px";
}

function closeMenu() {
    document.getElementById("menu").style.left = "-256px";
}