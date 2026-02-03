// Das Menü aus der components/menu.html in die Seite laden
// Prüfen ob wir im /pages Ordner sind oder im Root
const inPagesFolder = window.location.pathname.includes('/pages/');
const menuPath = inPagesFolder ? '../components/menu.html' : 'components/menu.html';

fetch(menuPath)
  .then(response => response.text())
  .then(data => {
    document.getElementById('menu-container').innerHTML = data;
    fixMenuPaths();        // Pfade im Menü korrigieren
    setActiveMenuItem();   // Funktion zum Aktivieren des aktiven Menüpunktes nach dem Laden
    initDarkModeToggle();  // Dark Mode Toggle initialisieren
  })
  .catch(error => console.error('Fehler beim Laden des Menüs:', error));

// Funktion zum Korrigieren der Menü-Pfade basierend auf aktuellem Standort
function fixMenuPaths() {
  const isInPages = window.location.pathname.includes('/pages/');
  const pathPrefix = isInPages ? '../' : 'pages/';
  
  // Alle Links mit data-href Attribut finden und korrekte href setzen
  document.querySelectorAll('[data-href]').forEach(link => {
    const target = link.getAttribute('data-href');
    
    // index.html bleibt im Root
    if (target === 'index.html') {
      link.href = isInPages ? '../index.html' : 'index.html';
    } else {
      // Alle anderen Seiten sind in /pages
      link.href = pathPrefix + target;
    }
  });
}

// Funktion zum Aktivieren des aktiven Menüpunktes
function setActiveMenuItem() {
  // Aktuellen Dateinamen extrahieren (z. B. "saisons.html")
  const currentPage = location.pathname.split('/').pop();

  // Alle Links im Menü durchgehen und bei Übereinstimmung "active" setzen
  document.querySelectorAll('.navbar-nav .nav-link, .dropdown-item').forEach(link => {
    const linkPage = link.getAttribute('href')?.split('/').pop();
    if (linkPage === currentPage) {
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
