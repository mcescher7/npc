document.addEventListener("DOMContentLoaded", async function() {
    const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0";
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    async function loadCareerData() {
        const { data, error } = await supabaseClient
            .from("roster_changes")
            .select("*");

        if (error) {
            console.error("Fehler beim Laden der Daten:", error);
            return;
        }

        const tableBody = document.getElementById("roster-changes-table");
        tableBody.innerHTML = data.map(row =>
            `<tr>
                <td>${row.time}</td>
                <td>${row.type}</td>
                <td>${row.manager_name}</td>
                <td>${row.target}</td>
            </tr>`
        ).join("");       
    }

    await loadCareerData();
});
