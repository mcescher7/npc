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
            order: [[0, "desc"]],
            orderSequence: ["desc", "asc"],
            responsive: true,
            searching: false,
            paging: false,
            info: false
        });
    }

    function formatDraftDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        // Monat und Tag mit führender Null, Uhrzeit ohne Sekunden
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}.${month}., ${hours}:${minutes} Uhr`;
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

        const tableBody = document.getElementById("seasons-table");
        tableBody.innerHTML = "";

        data.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.year}</td>
                <td>${formatDraftDate(row.draft_date)}</td>
                <td>${row.weeks}</td>
                <td>${row.teams}</td>
                <td>${row.playoff_teams}</td>
                <td>${row.ppr}</td>
                <td>${row.waiver_type}</td>
                <td>${row.tiebreaker}</td>
                <td>${row.platform}</td>
                <td>${row.qb}</td>
                <td>${row.rb}</td>
                <td>${row.wr}</td>
                <td>${row.te}</td>
                <td>${row["r/w"]}</td>
                <td>${row["r/w/t"]}</td>
                <td>${row.k}</td>
                <td>${row["d/st"]}</td>
                <td>${row.bench}</td>
                <td>${row.ir}</td>      
            `;
            tableBody.appendChild(tr);
        });
    }

    await loadStandingsData();
    await loadSeasonData();
});
