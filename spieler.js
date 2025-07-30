document.addEventListener("DOMContentLoaded", async function() {
    const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0";
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const searchInput = document.getElementById('search-player');
    const suggestionsContainer = document.getElementById('player-suggestions');
    const tableBody = document.getElementById("career-table");
    const infoDiv = document.getElementById('player-info');

    function formatDate(date) {
        const rowTime = new Date(date);
        return rowTime.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }) + ' Uhr';
    }

    function setRowColor(type) {
        if (type === 'add') {
            return "color-green";
        } else if (type === 'drop') {
            return "color-red";
        }
        return '';
    }

    async function loadPlayerInfo(player = '') {
        if (!player.trim()) {
            infoDiv.innerHTML = "";
            return;
        }
        
        const { data, error } = await supabaseClient
            .from('player_info')
            .select('*')
            .ilike('player_name', `%${player}%`)
            .single();
    
        if (error) {
            console.log("loadPlayerInfo: Spieler nicht gefunden.");
            return;
        }

        let infoHtml = '';
        
        if (data.awards)
          infoHtml += `<div style="text-align: center;"><span style="color: gold;">${data.awards}</span></div>`;
        if (data.game_info)
          infoHtml += `<div style="text-align: center;">${data.game_info}</div>`;
        if (data.passing)
          infoHtml += `<div><strong>passing:</strong> ${data.passing}</div>`;
        if (data.rushing)
          infoHtml += `<div><strong>rushing:</strong> ${data.rushing}</div>`;
        if (data.receiving)
          infoHtml += `<div><strong>receiving:</strong> ${data.receiving}</div>`;
        if (data.misc)
          infoHtml += `<div><strong>misc:</strong> ${data.misc}</div>`;
        if (data.kicking)
          infoHtml += `<div><strong>kicking:</strong> ${data.kicking}</div>`;
        if (data.defense)
          infoHtml += `<div>${data.defense}</div>`;
        
        if (!infoHtml) {
          infoDiv.innerHTML = '<div class="text-muted">Keine Statistiken vorhanden.</div>';
        } else {
          infoDiv.innerHTML = infoHtml;
        }
    }
    
    async function loadCareerData(player = '') {
        if (!player.trim()) {
            tableBody.innerHTML = "";
            return;
        }

        const { data, error } = await supabaseClient
            .from("roster_changes")
            .select("*")
            .ilike('player_name', `%${player}%`)
            .order('time');

        if (error) {
            console.error("Fehler beim Laden der Daten:", error);
            return;
        }

        tableBody.innerHTML = data.map(row =>
            `<tr>
                <td class="${setRowColor(row.type)}">${formatDate(row.time)}</td>
                <td class="${setRowColor(row.type)}">${row.manager_name}</td>
                <td class="${setRowColor(row.type)}">${row.target}</td>
            </tr>`
        ).join("");       
    }

    async function loadPlayerSuggestions(query) {
        if (!query.trim()) return;
    
        const { data, error } = await supabaseClient
            .from('roster_changes')
            .select('player_name', { distinct: true })
            .ilike('player_name', `%${query}%`)
            .order('player_name', { ascending: true });
    
        if (error) {
            console.error("Fehler beim Laden der Vorschläge:", error);
            return;
        }
    
        const uniquePlayers = [...new Set(data.map(player => player.player_name?.trim()).filter(Boolean))];
    
        suggestionsContainer.innerHTML = uniquePlayers.map(player =>
            `<option value="${player}"></option>`
        ).join("");
    }
    
    searchInput.addEventListener("input", function () {
        loadPlayerSuggestions(this.value);
    });

    searchInput.addEventListener("change", function () {
        loadPlayerInfo(this.value);
        loadCareerData(this.value);
        searchInput.blur();
    });

    searchInput.addEventListener("focus", function () {
        this.value = "";
        tableBody.innerHTML = "";
        suggestionsContainer.innerHTML = "";
        infoDiv.innerHTML = "";
    });
});
