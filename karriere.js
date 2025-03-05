document.addEventListener("DOMContentLoaded", async function() {
    const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0";
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const searchInput = document.getElementById('search-player');

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
                <td>${row.time.toLocaleString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false,
                    }) + ' Uhr'}</td>
                <td>${row.type}</td>
                <td>${row.manager_name}</td>
                <td>${row.target}</td>
            </tr>`
        ).join("");       
    }

     searchInput.addEventListener('input', function() {
        const player = searchInput.value.trim().toLowerCase();
        loadCareerData(player);
    });
    
    await loadCareerData();
});
