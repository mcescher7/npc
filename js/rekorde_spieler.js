document.addEventListener("DOMContentLoaded", function () {
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
            console.error("Fehler beim Laden der Daten von top_performances:", error);
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
                <td>${row.points.toFixed(2)}</td>
            `;
            tableBody.appendChild(tr);
        });
    }  

async function loadRecordPlayers(position = "all") {
        let query = supabaseClient.from("record_players").select("*")
            .order("games", { ascending: false })
            .order("total_points", { ascending: false })
            .limit(10);

        if (position !== "all") {
            query = query.eq("position", position);
        }

        const { data, error } = await query;

        if (error) {
            console.error("Fehler beim Laden von record_players:", error);
            return;
        }

        const tableBody = document.getElementById("record-players-table");
        tableBody.innerHTML = "";

        data.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.player_name}</td>
                <td>${row.games}</td>
                <td>${row.total_points.toFixed(2)}</td>
                <td>${row.years_played}</td>
                <td>${row.managers}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    document.querySelectorAll('input[name="position-1"]').forEach(input => {
        input.addEventListener("change", (event) => {
            const pos = event.target.id.replace("-1", "");
            loadTopPerformances(pos);
        });
    });

    document.querySelectorAll('input[name="position-2"]').forEach(input => {
        input.addEventListener("change", (event) => {
            const pos = event.target.id.replace("-2", "");
            loadRecordPlayers(pos);
        });
    });

    loadTopPerformances();
    loadRecordPlayers();
});
