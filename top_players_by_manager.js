document.addEventListener("DOMContentLoaded", async function() {
    const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0";

    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const managerSelect = document.getElementById("manager-select");
    const tableBody = document.getElementById("data-table");

    // Manager-Dropdown befüllen
    async function loadManagers() {
        const { data, error } = await supabaseClient
            .from("managers")  // Ersetze mit deinem Tabellennamen
            .select("id, name");

        if (error) {
            console.error("Fehler beim Laden der Manager:", error);
            return;
        }

        data.forEach(manager => {
            const option = document.createElement("option");
            option.value = manager.id;
            option.textContent = manager.name;
            managerSelect.appendChild(option);
        });
    }

    // Spieler-Daten abrufen, wenn ein Manager ausgewählt wird
    async function loadTopPlayers(managerId) {
        if (!managerId) {
            tableBody.innerHTML = "";
            return;
        }

        const { data, error } = await supabaseClient
            .from("players")  // Ersetze mit deiner Tabelle
            .select("name, points, position, team")
            .eq("manager_id", managerId)
            .order("points", { ascending: false })
            .limit(10);

        if (error) {
            console.error("Fehler beim Laden der Spieler:", error);
            return;
        }

        tableBody.innerHTML = "";
        data.forEach(player => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${player.name}</td>
                <td>${player.points}</td>
                <td>${player.position}</td>
                <td>${player.team}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Event-Listener für Dropdown
    managerSelect.addEventListener("change", (event) => {
        const managerId = event.target.value;
        loadTopPlayers(managerId);
    });

    await loadManagers();
});
