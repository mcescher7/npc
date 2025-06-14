document.addEventListener("DOMContentLoaded", async function() {
    const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0";

    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const managerSelect = document.getElementById("manager-select");
    let managerId = null;
    let selectedManagerName = "";

    async function loadManagers() {
        const { data, error } = await supabaseClient
            .from("managers")
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

    async function loadManagerRecords(managerId) {
    const tableBody = document.getElementById("records-table");

    if (!managerId || isNaN(managerId)) {
        tableBody.innerHTML = "";
        return;
    }

    const { data, error } = await supabaseClient
        .from("manager_stats")
        .select("*")
        .eq("manager_id", managerId)
        .single();

    if (error) {
        console.error("Fehler beim Laden der Statistiken:", error);
        return;
    }

    if (!data) {
        tableBody.innerHTML = "<tr><td colspan='3'>Keine Daten gefunden</td></tr>";
        return;
    }

    const formatPoints = (value) => {
        if (value === null || value === undefined) return "-";
        return parseFloat(value).toFixed(2);
    };
        
    const records = [
        {rekord: "längste Siegesserie", 
         wert: data.max_win_streak ? `${data.max_win_streak}` : "-",  
         details: data.win_streak_details || ""},
        {rekord: "längste Niederlagenserie", 
         wert: data.max_loss_streak ? `${data.max_loss_streak}` : "-",  
         details: data.loss_streak_details || ""},
        {rekord: "bester Saisonstart", 
         wert: data.start_win_streak ? `${data.start_win_streak}-0` : "-",  
         details: data.start_win_years || ""},
        {rekord: "schlechtester Saisonstart", 
         wert: data.start_loss_streak ? `0-${data.start_loss_streak}` : "-",  
         details: data.start_loss_years || ""},
        {rekord: "meiste Punkte", 
         wert: data.most_points ? `${formatPoints(data.most_points)}` : "-",  
         details: data.most_points_details || ""},
        {rekord: "wenigste Punkte", 
         wert: data.least_points ? `${formatPoints(data.least_points)}` : "-",  
         details: data.least_points_details || ""},
        {rekord: "höchster Sieg", 
         wert: data.biggest_win_margin ? `${formatPoints(data.biggest_win_margin)}` : "-",  
         details: data.biggest_win_details || ""},
        {rekord: "höchste Niederlage", 
         wert: data.biggest_loss_margin ? `${formatPoints(data.biggest_loss_margin)}` : "-",  
         details: data.biggest_loss_details || ""},
        {rekord: "knappster Sieg", 
         wert: data.closest_win_margin ? `${formatPoints(data.closest_win_margin)}` : "-",  
         details: data.closest_win_details || ""},
        {rekord: "knappste Niederlage", 
         wert: data.closest_loss_margin ? `${formatPoints(data.closest_loss_margin)}` : "-",  
         details: data.closest_loss_details || ""}
    ];

    tableBody.innerHTML = "";
    records.forEach(record => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${record.rekord}</td>
            <td>${record.wert}</td>
            <td>${record.details}</td>
        `;
        tableBody.appendChild(tr);
        });
    }
    
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
            .limit(10);

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

    async function loadManagerMatchups(managerId) {
        const { data, error } = await supabaseClient
            .from("manager_matchups_alltime")
            .select("manager1_name, manager2_id, manager2_name, wins, losses, points_for, points_against")
            .eq("manager1_id", managerId)
            .order("wins", { ascending: false })
            .order("losses", { ascending: true });

        if (error) {
            console.error("Fehler beim Laden der Matchups:", error);
            return;
        }

        const tableBody = document.getElementById("manager-matchups-table");
        tableBody.innerHTML = "";
        data.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.manager2_name}</td>
                <td>${row.wins}</td>
                <td>${row.losses}</td>
                <td>${parseFloat(row.points_for).toFixed(2)}</td>
                <td>${parseFloat(row.points_against).toFixed(2)}</td>
            `;
            tr.style.cursor = "pointer";

            tr.addEventListener("click", () => {
                showMatchDetails(managerId, row.manager1_name, row.manager2_id, row.manager2_name);
            });
            tableBody.appendChild(tr);
        });
    }

    async function showMatchDetails(managerId, managerName, opponentId, opponentName) {
    const { data, error } = await supabaseClient
        .from("matchups_detail")
        .select("year, week, manager_points, opponent_points, round")
        .eq("manager_id", managerId)
        .eq("opponent_id", opponentId)
        .order("year", { ascending: true })
        .order("week", { ascending: true });

    const contentDiv = document.getElementById("match-details-content");

    if (error || !data) {
        contentDiv.innerHTML = `<div class="text-danger">Fehler beim Laden der Matchdetails.</div>`;
    } else if (data.length === 0) {
        contentDiv.innerHTML = `<p>Keine Matches gefunden.</p>`;
    } else {
        const translateRound = (round) => {
            if (round === "QF") return "VF";
            if (round === "SF") return "HF";
            return round ?? "";
        };

        const rows = data.map(match => {
            const mp = parseFloat(match.manager_points).toFixed(2);
            const op = parseFloat(match.opponent_points).toFixed(2);

            const managerWon = match.manager_points > match.opponent_points;
            const mpClass = managerWon ? "text-success" : "text-danger";
            const opClass = managerWon ? "text-danger" : "text-success";

            return `
                <tr>
                    <td>${match.year}</td>
                    <td>${match.week}</td>
                    <td>${translateRound(match.round)}</td>
                    <td class="${mpClass}">${mp}</td>
                    <td class="${opClass}">${op}</td>
                </tr>
            `;
        }).join("");

        contentDiv.innerHTML = `
            <div class="table-responsive">
                <table class="table table-sm table-bordered table-striped">
                    <thead>
                        <tr>
                            <th class="text-nowrap" style="width: 60px;">Jahr</th>
                            <th class="text-nowrap" style="width: 60px;">Woche</th>
                            <th class="text-nowrap" style="width: 70px;">Playoff</th>
                            <th class="text-nowrap" style="width: 70px;">${managerName}</th>
                            <th class="text-nowrap" style="width: 70px;">${opponentName}</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;


    }

    const modal = new bootstrap.Modal(document.getElementById("matchDetailsModal"));
    modal.show();
}


    /*
    document.getElementById("manager-matchups-table").addEventListener("click", function(e) {
        const row = e.target.closest("tr");
        if (!row || !managerId) return;

        const opponentId = row.dataset.opponent_id;
        const opponentName = row.dataset.opponent_name;

        if (opponentId) {
            showMatchDetails(managerId, opponentId, opponentName);
        }
    });
    */

    managerSelect.addEventListener("change", (event) => {
        managerId = parseInt(event.target.value, 10) || null;
        selectedManagerName = managerSelect.options[managerSelect.selectedIndex].text;
        loadManagerRecords(managerId);
        loadTopPlayers(managerId);
        loadManagerMatchups(managerId);
    });

    await loadManagers();
});
