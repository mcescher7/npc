document.addEventListener("DOMContentLoaded", function () {
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
