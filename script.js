// Das Menü aus der menu.html in die Seite laden
fetch('menu.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('menu-container').innerHTML = data;
    setActiveMenuItem();  // Funktion zum Aktivieren des aktiven Menüpunktes nach dem Laden
    initDarkModeToggle(); // Dark Mode Toggle initialisieren
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

 function initDarkModeToggle() {
  const html = document.documentElement;
  const btn = document.getElementById('darkModeToggle');
  if (!btn) {
    console.warn('Dark Mode Toggle Button nicht gefunden!');
    return;
  }

  // Gespeichertes Theme laden oder Standard "dark"
  const savedTheme = localStorage.getItem('bsTheme') || 'dark';
  html.setAttribute('data-bs-theme', savedTheme);

  // Button-Text anpassen
  btn.textContent = savedTheme === 'dark' ? 'Light Mode umschalten' : 'Dark Mode umschalten';

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-bs-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-bs-theme', next);
    localStorage.setItem('bsTheme', next);
    btn.textContent = next === 'dark' ? 'Light Mode umschalten' : 'Dark Mode umschalten';
  });
}
