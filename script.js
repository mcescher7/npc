document.addEventListener("DOMContentLoaded", async function () {
    const menuContainer = document.createElement("div");
    document.body.prepend(menuContainer);

    const response = await fetch("menu.html");
    const menuHtml = await response.text();
    menuContainer.innerHTML = menuHtml;

    // Hamburger-Menü-Funktionalität
    document.getElementById("menu-toggle").addEventListener("click", function () {
        document.getElementById("menu-list").classList.toggle("show");
    });
});

