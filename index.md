---
title: Nathan Peterman Cup
---

<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Supabase Tabelle</title>
</head>
<body>
    <h2>Daten aus Supabase</h2>
    <table border="1" id="data-table">
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
            const response = await fetch("https://hcjinenoxuulhcoadmgh.supabase.co/rest/v1/seasons", {
                headers: {
                    "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0",
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0"
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

