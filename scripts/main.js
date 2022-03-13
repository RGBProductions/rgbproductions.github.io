function numElementsInDiv(id) {
    return $("#" + id).find("*").length;
}

var emptyDiv = document.getElementById("empty");

if (numElementsInDiv("latest") > 0) {
    emptyDiv.style.display = "none";
}