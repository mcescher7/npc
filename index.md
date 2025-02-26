<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Supabase Tabelle</title>
    <style>
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            border: 1px solid black;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
    </style>
</head>
<body>
    <h2>Daten aus Supabase</h2>
    <table id="data-table">
        <thead>
            <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Punkte</th>
            </tr>
        </thead>
        <tbody></tbody>
    </table>

    <script>
        async function loadData() {
            const response = await fetch("https://xyzcompany.supabase.co/rest/v1/deine_tabelle", {
                headers: {
                    "apikey": "DEIN_ANON_KEY",
                    "Authorization": "Bearer DEIN_ANON_KEY",
                    "Content-Type": "application/json"
                }
            });
            const data = await response.json();
            const tableBody = document.querySelector("#data-table tbody");

            data.forEach(row => {
                const tr = document.createElement("tr");
                tr.innerHTML = `<td>${row.id}</td><td>${row.name}</td><td>${row.punkte}</td>`;
                tableBody.appendChild(tr);
            });
        }

        loadData();
    </script>
</body>
</html>
