document.addEventListener("DOMContentLoaded", async function() {
    const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0";

    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    async function loadData() {
        const { data, error } = await supabaseClient
            .from("seasons")
            .select("*")
            .limit(50);

        if (error) {
            console.error("Fehler beim Laden der Daten:", error);
            return;
        }

        const tableBody = document.getElementById("data-table");
        tableBody.innerHTML = "";

        data.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.year}</td>
                <td>${row.draft_date}</td>
                <td>${row.playoff_teams}</td>
                <td>${row.weeks}</td>
                <td>${row.ppr}</td>
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
                <td>${row.waiver_type}</td>
                <td>${row.tiebreaker}</td>
                <td>${row.platform}</td>
                <td>${row.teams}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    await loadData();
});
