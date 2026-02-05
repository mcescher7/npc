// Das Menü aus der components/menu.html in die Seite laden
const inPagesFolder = window.location.pathname.includes('/pages/');
const menuPath = inPagesFolder ? '../components/menu.html' : 'components/menu.html';

fetch(menuPath)
  .then(response => response.text())
  .then(data => {
    document.getElementById('menu-container').innerHTML = data;
    setActiveMenuItem();
    initDarkModeToggle();
  })
  .catch(error => console.error('Fehler beim Laden des Menüs:', error));

// Funktion zum Aktivieren des aktiven Menüpunktes
function setActiveMenuItem() {
  const currentPage = location.pathname.split('/').pop();

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
