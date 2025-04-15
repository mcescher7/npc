document.addEventListener("DOMContentLoaded", async function() {
    const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0";

    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const seasonSelect = document.getElementById("season-select");
    const weekSelect = document.getElementById("week-select");
    
    // Season-Dropdown befüllen
    async function loadSeasons() {
        const { data, error } = await supabaseClient
            .from("seasons")
            .select("year")
            .order("year");

        if (error) {
            console.error("Fehler beim Laden der Saisons:", error);
            return;
        }

        data.forEach(season => {
            const option = document.createElement("option");
            option.value = season.year;
            option.textContent = season.year;
            seasonSelect.appendChild(option);
        });
    }

    // Tabelle abrufen, wenn eine Saison ausgewählt wird
    async function loadRegSeason(year) {
        const tableBody = document.getElementById("regular-season-table");
        tableBody.innerHTML = "";
      
        if (!year || isNaN(year)) { 
            return;
        }

        const { data, error } = await supabaseClient
            .from("regular_season_standings") 
            .select("rank, name, teamname, w, l, pf, pa")
            .eq("year", year)
            .order("rank");
        
        if (error) {
            console.error("Fehler beim Laden der Tabelle:", error);
            return;
        }

        data.forEach(manager => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${manager.rank}</td>
                <td>${manager.name}</td>
                <td>${manager.teamname}</td>
                <td>${manager.w}</td>
                <td>${manager.l}</td>
                <td>${manager.pf.toFixed(2)}</td>
                <td>${manager.pa.toFixed(2)}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Wochen-Dropdown befüllen
    async function loadWeeks(year) {
        const { data, error } = await supabaseClient
            .from("rosters")
            .select("week", {distinct: true})
            .eq("year", year)
            .order('week', { ascending: true });

        if (error) {
            console.error("Fehler beim Laden der Wochen:", error);
            return;
        }

        data.forEach(week => {
            const option = document.createElement("option");
            option.value = week.week;
            option.textContent = week.week;
            weekSelect.appendChild(option);
        });
    }
  
    async function loadWeeklyMatchups(year, week) {
        const { data, error } = await supabaseClient
            .from("matchup_table")
            .select("team1, points1, points2, team2")
            .eq("year", year)
            .eq("week", week);
    
        if (error) {
            console.error("Fehler beim Laden der Matchups:", error);
            return;
        }
    
        const tableBody = document.getElementById("weekly-results-table");
        tableBody.innerHTML = data.map(row =>
            `<tr>
                <td>${row.team1}</td>
                <td>${row.points1.toFixed(2)}</td>
                <td>${-}</td>
                <td>${row.points2.toFixed(2)}</td>
                <td>${row.team2}</td>
            </tr>`
        ).join("");
    }

    // Event-Listener für Dropdown
    seasonSelect.addEventListener("change", (event) => {
        const year = parseInt(event.target.value, 10) || null;
        loadRegSeason(year);
        loadWeeks(year);
    });

    weekSelect.addEventListener("change", (event) => {
        const year = 2024;
        const week = parseInt(event.target.value, 10) || null; 
        loadWeeklyMatchups(year, week);
    });

    await loadSeasons();
});
