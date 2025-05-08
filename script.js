// Das Menü aus der menu.html in die Seite laden
fetch('menu.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('menu-container').innerHTML = data;
    // Die Initialisierung des Menüs entfällt, da Bootstrap dies übernimmt
  })
  .catch(error => console.error('Fehler beim Laden des Menüs:', error));
