document.addEventListener("DOMContentLoaded", async function() {
    const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0";
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const searchInput = document.getElementById('search-player');
    const suggestionsContainer = document.getElementById('suggestions-container'); // Container für Vorschläge

    // Funktion zum Formatieren des Datums
    function formatDate(date) {
        const rowTime = new Date(date);
        return rowTime.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false, // Verhindert das 12-Stunden-Format
        }) + ' Uhr';
    }

    // Funktion zum Setzen der Schriftfarbe basierend auf dem Typ
    function setRowColor(type) {
        if (type === 'add') {
            return 'color: darkgreen;';
        } else if (type === 'drop') {
            return 'color: darkred;';
        }
        return ''; // Standardfarbe, wenn der Typ weder 'add' noch 'drop' ist
    }

    async function loadCareerData(player = '') {
        const { data, error } = await supabaseClient
            .from("roster_changes")
            .select("*")
            .filter('player_name', 'ilike', player);

        if (error) {
            console.error("Fehler beim Laden der Daten:", error);
            return;
        }

        const tableBody = document.getElementById("roster-changes-table");
        tableBody.innerHTML = data.map(row =>
            `<tr>
                <td style="${setRowColor(row.type)}">${formatDate(row.time)}</td>
                <td style="${setRowColor(row.type)}">${row.type}</td>
                <td style="${setRowColor(row.type)}">${row.manager_name}</td>
                <td style="${setRowColor(row.type)}">${row.target}</td>
            </tr>`
        ).join("");       
    }

    async function loadPlayerSuggestions(query) {
        // Abrufen der Spieler, die zur aktuellen Eingabe passen
        const { data, error } = await supabaseClient
            .from('roster_changes')
            .select('distinct player_name')
            .ilike('player_name', `${query}%`)
            .limit(5);  // Maximale Anzahl an Vorschlägen

        if (error) {
            console.error("Fehler beim Laden der Vorschläge:", error);
            return;
        }

        // Vorschläge im UI anzeigen
        suggestionsContainer.innerHTML = data.map(player =>
            `<div class="suggestion-item" data-player="${player.player_name}">${player.player_name}</div>`
        ).join("");

        // Event Listener für das Klicken auf einen Vorschlag
        const suggestionItems = document.querySelectorAll('.suggestion-item');
        suggestionItems.forEach(item => {
            item.addEventListener('click', function() {
                searchInput.value = item.getAttribute('data-player'); // Eingabefeld mit Vorschlag füllen
                suggestionsContainer.innerHTML = ''; // Vorschläge ausblenden
                loadCareerData(item.getAttribute('data-player')); // Daten für den ausgewählten Spieler laden
            });
        });
    }

    // Beim Eingeben in das Textfeld Vorschläge laden
    searchInput.addEventListener('input', function() {
        const player = searchInput.value.trim().toLowerCase();
        if (player.length > 0) {
            loadPlayerSuggestions(player); // Vorschläge laden
        } else {
            suggestionsContainer.innerHTML = ''; // Vorschläge ausblenden, wenn das Textfeld leer ist
        }
    });

    // Den Container für Vorschläge im HTML definieren:
    // <div id="suggestions-container" class="suggestions-container"></div>

    // Initiale Daten laden (optional, falls der Textfeld leer ist)
    await loadCareerData();
});
