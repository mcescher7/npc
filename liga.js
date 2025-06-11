document.addEventListener("DOMContentLoaded", async function() {
    const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0";

    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    async function loadStandingsData() {
        const { data, error } = await supabaseClient
            .from("manager_alltime_records")
            .select("*");

        if (error) {
            console.error("Fehler beim Laden der Daten:", error);
            return;
        }

        // Alte DataTables-Instanz zerstören, falls vorhanden
        if ($.fn.DataTable.isDataTable('#alltime-table')) {
            $('#alltime-table').DataTable().destroy();
        }

        // DataTables initialisieren und mit Daten befüllen
        $('#alltime-table').DataTable({
            data: data,
            columns: [
                { data: 'rank', title: 'Platz' },
                { data: 'name', title: 'Manager' },
                { data: 'seasons', title: 'Saisons' },
                { data: 'playoffs', title: 'Playoffs' },
                { data: 'titles', title: 'Titel' },
                { data: 'wins', title: 'W' },
                { data: 'losses', title: 'L' },
                { data: 'w_l_perc', title: 'W/L-%', render: data => data.toFixed(3) },
                { data: 'points_for', title: 'PF', render: data => data.toFixed(2) },
                { data: 'points_against', title: 'PA', render: data => data.toFixed(2) }
            ],
            responsive: true,
            searching: false,
            paging: false,
            info: false
        });
    }
    
    async function loadSeasonData() {
        const { data, error } = await supabaseClient
            .from("seasons")
            .select("*")
            .order("year", { ascending: true });

        if (error) {
            console.error("Fehler beim Laden der Daten:", error);
            return;
        }

        // Alte DataTables-Instanz zerstören, falls vorhanden
        if ($.fn.DataTable.isDataTable('#seasons-table')) {
            $('#seasons-table').DataTable().destroy();
        }

        // DataTables initialisieren und mit Daten befüllen
        $('#seasons-table').DataTable({
            data: data,
            columns: [
                { data: 'year', title: 'Year' },
                { data: 'draft_date', title: 'Draft Date' },
                { data: 'playoff_teams', title: 'Playoff Teams' },
                { data: 'weeks', title: 'Weeks' },
                { data: 'ppr', title: 'PPR' },
                { data: 'qb', title: 'QB' },
                { data: 'rb', title: 'RB' },
                { data: 'wr', title: 'WR' },
                { data: 'te', title: 'TE' },
                { data: 'r/w', title: 'R/W' },
                { data: 'r/w/t', title: 'R/W/T' },
                { data: 'k', title: 'K' },
                { data: 'd/st', title: 'D/ST' },
                { data: 'bench', title: 'Bench' },
                { data: 'ir', title: 'IR' },
                { data: 'waiver_type', title: 'Waiver Type' },
                { data: 'tiebreaker', title: 'Tiebreaker' },
                { data: 'platform', title: 'Platform' },
                { data: 'teams', title: 'Teams' }
            ],
            responsive: true,
            searching: false,
            paging: false,
            info: false
        });
    }

    await loadStandingsData();
    await loadSeasonData();
});
