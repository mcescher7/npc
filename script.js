// Das Menü aus der menu.html in die Seite laden
fetch('menu.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('menu-container').innerHTML = data;
    setActiveMenuItem();  // Funktion zum Aktivieren des aktiven Menüpunktes nach dem Laden
  })
  .catch(error => console.error('Fehler beim Laden des Menüs:', error));

// Funktion zum Aktivieren des aktiven Menüpunktes
function setActiveMenuItem() {
  // Aktuellen Dateinamen extrahieren (z. B. "saisons.html")
  const currentPage = location.pathname.split('/').pop();

  // Alle Links im Menü durchgehen und bei Übereinstimmung "active" setzen
  document.querySelectorAll('.navbar-nav .nav-link').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}
