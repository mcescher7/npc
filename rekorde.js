document.addEventListener("DOMContentLoaded", function () {
    const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0";

    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    async function loadTopPerformances(position = "all") {
        let query = supabaseClient.from("top_10_performances").select("*")
          .order("points", { ascending: false })
          .order("year", { ascending: true })
          .order("week", { ascending: true })
          .limit(10);
        if (position !== "all") {
            query = query.eq("position", position);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Fehler beim Laden der Daten:", error);
            return;
        }

        const tableBody = document.getElementById("top-performances-table");
        tableBody.innerHTML = "";

        data.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.year}</td>
                <td>${row.week}</td>
                <td>${row.manager}</td>
                <td>${row.player}</td>
                <td>${row.points}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    document.querySelectorAll(".btn-check").forEach(input => {
        input.addEventListener("change", (event) => {
            const position = event.target.id; // Die ID des aktiven Radio-Buttons ermitteln
            loadTopPerformances(position); // Die Daten für die gewählte Position laden
        });
    });

    
    loadTopPerformances();
});
