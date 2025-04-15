document.addEventListener("DOMContentLoaded", async function () {
    const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0";
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const seasonSelect = document.getElementById("season-select");
    const weekSelect = document.getElementById("week-select");
    const regTableBody = document.getElementById("regular-season-table");
    const weeklyTableBody = document.getElementById("weekly-results-table");

    // 🔧 Hilfsfunktionen
    const createOption = (value, text) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        return option;
    };

    const logError = (context, error) => {
        console.error(`❌ Fehler bei ${context}:`, error);
    };

    const showNoData = (element, cols) => {
        element.innerHTML = `<tr><td colspan="${cols}" class="text-center">Keine Daten vorhanden</td></tr>`;
    };

    // 📅 Saisons laden
    async function loadSeasons() {
        const { data, error } = await supabase
            .from("seasons")
            .select("year")
            .order("year");

        if (error) return logError("Laden der Saisons", error);

        seasonSelect.innerHTML = '<option value="">Wähle eine Saison</option>';
        data.forEach(season => seasonSelect.appendChild(createOption(season.year, season.year)));
    }

    // 📊 Tabelle laden
    async function loadRegSeason(year) {
        regTableBody.innerHTML = "";
        if (!year || isNaN(year)) return;

        const { data, error } = await supabase
            .from("regular_season_standings")
            .select("rank, name, teamname, w, l, pf, pa")
            .eq("year", year)
            .order("rank");

        if (error) return logError("Laden der Tabelle", error);
        if (!data || data.length === 0) return showNoData(regTableBody, 7);

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
            regTableBody.appendChild(tr);
        });
    }

    // 🗓 Wochen laden
    async function loadWeeks(year) {
        weekSelect.innerHTML = '<option value="">Wähle eine Woche</option>';

        const { data, error } = await supabase
            .from("rosters")
            .select("week, , count()")
            .eq("year", year)
            .order("week", { ascending: true });

        if (error) return logError("Laden der Wochen", error);
        data.forEach(week => weekSelect.appendChild(createOption(week.week, week.week)));
    }

    // 🧾 Matchups laden
    async function loadWeeklyMatchups(year, week) {
        weeklyTableBody.innerHTML = "";

        if (!year || !week) return;

        const { data, error } = await supabase
            .from("matchup_table")
            .select("team1, points1, points2, team2")
            .eq("year", year)
            .eq("week", week);

        if (error) return logError("Laden der Matchups", error);
        if (!data || data.length === 0) return showNoData(weeklyTableBody, 5);

        weeklyTableBody.innerHTML = data.map(row => `
            <tr>
                <td>${row.team1}</td>
                <td>${row.points1.toFixed(2)}</td>
                <td>-</td>
                <td>${row.points2.toFixed(2)}</td>
                <td>${row.team2}</td>
            </tr>
        `).join("");
    }

    // 🧠 Events
    seasonSelect.addEventListener("change", async (e) => {
        const year = parseInt(e.target.value, 10);
        if (!year) return;

        await loadRegSeason(year);
        await loadWeeks(year);
        weeklyTableBody.innerHTML = ""; // Alte Matchups leeren
    });

    weekSelect.addEventListener("change", (e) => {
        const year = parseInt(seasonSelect.value, 10);
        const week = parseInt(e.target.value, 10);
        if (!year || !week) return;
        loadWeeklyMatchups(year, week);
    });

    // 🚀 Initial Load
    await loadSeasons();
});
