// Das Menü aus der menu.html in die Seite laden
fetch('menu_v2.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('menu-container').innerHTML = data;
    initializeMenu();  // Funktion zum Initialisieren des Menüs nach dem Laden
  })
  .catch(error => console.error('Fehler beim Laden des Menüs:', error));

// Funktion zum Aktivieren des Hamburger-Menüs
function initializeMenu() {
  document.getElementById('menu-icon').addEventListener('click', function() {
    const menu = document.getElementById('menu');
    menu.classList.toggle('active');
  });
}
