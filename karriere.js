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
                <td style="${setRowColor(row.type)}">${row.manager_name}</td>
                <td style="${setRowColor(row.type)}">${row.target}</td>
            </tr>`
        ).join("");       
    }

       async function loadPlayerSuggestions(query) {
        if (!query.trim()) return; // Falls das Feld leer ist, nichts tun
    
        const { data, error } = await supabaseClient
            .from('roster_changes')
            .select('player_name')
            .ilike('player_name', `%${query}%`)
            .order('player_name', { ascending: true });
            
    
        if (error) {
            console.error("Fehler beim Laden der Vorschläge:", error);
            return;
        }
    
        // Doppelte Namen entfernen
        const uniquePlayers = [...new Set(data.map(player => player.player_name?.trim()).filter(Boolean))];
    
        // Vorschläge in das `datalist`-Element einfügen
        const suggestionsContainer = document.getElementById("player-suggestions");
        suggestionsContainer.innerHTML = uniquePlayers.map(player =>
            `<option value="${player}"></option>`
        ).join("");
    }
    
    // Event-Listener für die Texteingabe
    document.getElementById('search-player').addEventListener('input', function () {
        loadPlayerSuggestions(this.value);
    });

    // Initiale Daten laden (optional, falls der Textfeld leer ist)
    await loadCareerData();
});
