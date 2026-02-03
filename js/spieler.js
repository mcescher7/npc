document.addEventListener("DOMContentLoaded", async function() {
    const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0";
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const searchInput = document.getElementById('search-player');
    const suggestionsContainer = document.getElementById('player-suggestions');
    const tableBody = document.getElementById("career-table");

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
    
    async function loadCareerData(player = '') {
        const careerTbody   = document.getElementById('career-table');
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

        if (careerTbody?.parentElement) {
            careerTbody.parentElement.classList.remove('hidden');
        }
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

    async function renderPlayerCard(player) {
      const container = document.querySelector('.retro-card-container');
      const { data } = await supabaseClient
        .from('player_info')
        .select('*')
        .ilike('player_name', `%${player}%`)
        .single();
    
      const front = container.querySelector('.retro-front');
      front.innerHTML = `
        <img class="retro-player-photo" 
         src="${data.espn_id ? `https://a.espncdn.com/i/headshots/nfl/players/full/${data.espn_id}.png` : 'https://a.espncdn.com/i/headshots/nfl/players/full/3128720.png'}" 
         alt="${data.player_name}">
         
        <div class="retro-name-bar">${data.player_name}</div>
        
        ${data.awards ? `
            <div class="retro-awards">
              <div class="retro-award-badge">${data.awards}</div>
            </div>
          ` : ''}
          
        <div class="retro-front-stats">
          <div><label>Games</label><strong>${data.games || 0}</strong></div>
          <div><label>PPG</label><strong>${data.ppg || 0}</strong></div>
          <div><label>Points</label><strong>${data.points || 0}</strong></div>     
        </div>
      `;
    
      const back = container.querySelector('.retro-back');
      back.innerHTML = `
        <div class="retro-back-name">${data.player_name}</div>
        <div class="retro-back-meta">${data.position} • #${data.number}</div>
        <div class="retro-back-stats">
          <div class="retro-back-section">
            <h3>Career Stats</h3>
            ${data.passing ? `
                <div class="retro-stat-row"><span>PASSING</span><span>${data.passing}</span></div>
            ` : ''}
            ${data.receiving ? `
                <div class="retro-stat-row"><span>RECEIVING</span><span>${data.receiving}</span></div>
            ` : ''}
            ${data.rushing ? `
                <div class="retro-stat-row"><span>RUSHING</span><span>${data.rushing}</span></div>
            ` : ''}
            ${data.misc ? `
                <div class="retro-stat-row"><span>MISC</span><span>${data.misc}</span></div>
            ` : ''}
            ${data.kicking ? `
                <div class="retro-stat-row"><span>KICKING</span><span>${data.kicking}</span></div>
            ` : ''}
            ${data.defense ? `
                <div class="retro-stat-row"><span>DEFENSE</span><span>${data.defense}</span></div>
            ` : ''}
          </div>
          <div class="retro-back-section">
            <h3>Best Performance</h3>
            ${data.best_game_points ? `
                <div class="retro-stat-row retro-stat-row-center"><span>${data.best_game_points}</span></div>
            ` : ''}
            ${data.best_game_info ? `
                <div class="retro-stat-row retro-stat-row-center"><span>${data.best_game_info}</span></div>
            ` : ''}
             ${data.best_game_stats ? `
                <div class="retro-stat-row retro-stat-row-center"><span>${data.best_game_stats}</span></div>
            ` : ''}
          </div>
        </div>
      `;
    
      container.onclick = () => container.classList.toggle('flipped');
      container.classList.remove('hidden');
    }

    
    searchInput.addEventListener("input", function () {      
        const cardContainer  = document.getElementById('player-card-container');
         const careerTable   = document.querySelector('.table.hidden'); 
        if (!searchInput.value.trim()) {
            cardContainer?.classList.add('hidden');
            careerTable?.classList.add('hidden');
            return;
        }
        loadPlayerSuggestions(this.value);
    });

    searchInput.addEventListener("change", function () {
        renderPlayerCard(this.value);
        loadCareerData(this.value);      
        searchInput.blur();
    });

    searchInput.addEventListener("focus", function () {
        this.value = "";
        suggestionsContainer.innerHTML = "";
    });
});
