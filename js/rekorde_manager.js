document.addEventListener("DOMContentLoaded", function () {
    const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0";
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    async function loadRecords() {
        let query = supabaseClient.from("record_stats")
          .select("*");
        const { data, error } = await query;

        if (error) {
            console.error("Fehler beim Laden der Rekorde:", error);
            return;
        }        

        const tableBody = document.getElementById("records-table");
        tableBody.innerHTML = "";

        data.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.record}</td>
                <td>${row.manager}</td>
                <td>${row.value}</td>
                <td>${row.details}</td>
            `;
            tableBody.appendChild(tr);
        });
    }  

    loadRecords();
});
