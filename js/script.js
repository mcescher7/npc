// Das Menü aus der components/menu.html in die Seite laden
fetch('components/menu.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('menu-container').innerHTML = data;
    setActiveMenuItem();  // Funktion zum Aktivieren des aktiven Menüpunktes nach dem Laden
    initDarkModeToggle(); // Dark Mode Toggle initialisieren
  })
  .catch(error => console.error('Fehler beim Laden des Menüs:', error));

// Funktion zum Aktivieren des aktiven Menüpunktes
function setActiveMenuItem() {
  // Aktuellen Dateinamen extrahieren (z. B. "saisons.html")
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
  const icon = document.getElementById('themeIcon');
  if (!btn || !icon) return;

  // Gespeichertes Theme laden oder Standard "dark"
  const savedTheme = localStorage.getItem('bsTheme') || 'dark';
  html.setAttribute('data-bs-theme', savedTheme);
  icon.textContent = savedTheme === 'dark' ? 'light_mode' : 'dark_mode';

  btn.addEventListener('click', () => {
    const current = html.getAttribute('data-bs-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-bs-theme', next);
    localStorage.setItem('bsTheme', next);
    icon.textContent = next === 'dark' ? 'light_mode' : 'dark_mode';
  });
}
