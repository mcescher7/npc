document.addEventListener("DOMContentLoaded", async function() {
    const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0";

    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const managerSelect = document.getElementById("manager-select");
    
    // Manager-Dropdown befüllen
    async function loadManagers() {
        const { data, error } = await supabaseClient
            .from("managers")  // Ersetze mit deinem Tabellennamen
            .select("manager_id, name");

        if (error) {
            console.error("Fehler beim Laden der Manager:", error);
            return;
        }

        data.forEach(manager => {
            const option = document.createElement("option");
            option.value = manager.manager_id;
            option.textContent = manager.name;
            managerSelect.appendChild(option);
        });
    }

    // Spieler-Daten abrufen, wenn ein Manager ausgewählt wird
    async function loadTopPlayers(managerId) {
        const tableBody = document.getElementById("top-players-table");

        if (!managerId || isNaN(managerId)) { 
            tableBody.innerHTML = "";
            return;
        }

        const { data, error } = await supabaseClient
            .from("v_top_players") 
            .select("player_name, games, total_points, years_played")
            .eq("manager_id", managerId)
            .order("games", { ascending: false })
            .limit(20);
        
        if (error) {
            console.error("Fehler beim Laden der Spieler:", error);
            return;
        }

        tableBody.innerHTML = "";
        data.forEach(player => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${player.player_name}</td>
                <td>${player.games}</td>
                <td>${player.total_points}</td>
                <td>${player.years_played}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Zweite Tabelle: Manager Matchups All-Time
    async function loadManagerMatchups(managerId) {
        //const managerId = managerSelect.value;
        const { data, error } = await supabaseClient
            .from("manager_matchups_alltime")
            .select("manager2_name, wins, losses, points_for, points_against")
            .eq("manager1_id", managerId)
            .order("wins", { ascending: false })
            .order("losses", { ascending: true });
    
        if (error) {
            console.error("Fehler beim Laden der Matchups:", error);
            return;
        }
    
        const tableBody = document.getElementById("manager-matchups-table");
        tableBody.innerHTML = data.map(row =>
            `<tr>
                <td>${row.manager2_name}</td>
                <td>${row.wins}</td>
                <td>${row.losses}</td>
                <td>${row.points_for}</td>
                <td>${row.points_against}</td>
            </tr>`
        ).join("");
    }

    // Event-Listener für Dropdown
    managerSelect.addEventListener("change", (event) => {
        const managerId = parseInt(event.target.value, 10) || null;
        loadTopPlayers(managerId);
        loadManagerMatchups(managerId);
    });

    await loadManagers();
});
