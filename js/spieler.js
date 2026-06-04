document.addEventListener("DOMContentLoaded", async function() {
    const searchInput = document.getElementById('search-player');
    const suggestionsContainer = document.getElementById('player-suggestions');
    const careerContainer = document.getElementById('career-table');
    const timelineContainer = document.getElementById('timeline-container');
    const cardContainer = document.getElementById('player-card-container');

    function formatDate(date) {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day}.${month}. ${hours}:${minutes} Uhr`;
    }

    async function loadCareerData(player = '') {
        if (!player.trim()) {
            careerContainer.innerHTML = '';
            timelineContainer?.classList.add('hidden');
            return;
        }

        const { data, error } = await supabaseClient
            .from('roster_changes')
            .select('*')
            .ilike('player_name', `%${player}%`)
            .order('time', { ascending: true });

        if (error) {
            console.error('Fehler beim Laden der Daten:', error);
            return;
        }

        if (!data || data.length === 0) {
            careerContainer.innerHTML = '<div class="text-center text-muted py-4">Keine Daten gefunden</div>';
            timelineContainer?.classList.remove('hidden');
            return;
        }

        const grouped = {};
        data.forEach(row => {
            const year = String(row.time).slice(0, 4);
            if (!grouped[year]) grouped[year] = [];
            grouped[year].push(row);
        });

        const years = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

        careerContainer.innerHTML = years.map(year => {
            const items = grouped[year].map(row => {
                const type = row.type === 'add' ? 'add' : 'drop';
                const source = (row.target || '').toLowerCase().includes('waiver') ? 'Waiver' : 'Free Agent';

                return `
                    <div class="timeline-item ${type}">
                        <div class="timeline-card">
                            <span class="tc-date">${formatDate(row.time)}</span>
                            <span class="tc-name">${row.manager_name || ''}</span>
                            <span class="tc-source">${source}</span>
                        </div>
                    </div>`;
            }).join('');

            return `
                <div class="year-divider"><span>${year}</span></div>
                ${items}`;
        }).join('');

        timelineContainer?.classList.remove('hidden');
    }

    async function loadPlayerSuggestions(query) {
        if (!query.trim()) return;

        const { data, error } = await supabaseClient
            .from('roster_changes')
            .select('player_name', { distinct: true })
            .ilike('player_name', `%${query}%`)
            .order('player_name', { ascending: true });

        if (error) {
            console.error('Fehler beim Laden der Vorschläge:', error);
            return;
        }

        const uniquePlayers = [...new Set(data.map(player => player.player_name?.trim()).filter(Boolean))];
        suggestionsContainer.innerHTML = uniquePlayers.map(player => `<option value="${player}"></option>`).join('');
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
            <img class="retro-player-photo" src="${data.espn_id ? `https://a.espncdn.com/i/headshots/nfl/players/full/${data.espn_id}.png` : 'https://a.espncdn.com/i/headshots/nfl/players/full/3128720.png'}" alt="${data.player_name}">
            <div class="retro-name-bar">${data.player_name}</div>
            ${data.awards ? `<div class="retro-awards"><div class="retro-award-badge">${data.awards}</div></div>` : ''}
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
                    ${data.passing ? `<div class="retro-stat-row"><span>PASSING</span><span>${data.passing}</span></div>` : ''}
                    ${data.receiving ? `<div class="retro-stat-row"><span>RECEIVING</span><span>${data.receiving}</span></div>` : ''}
                    ${data.rushing ? `<div class="retro-stat-row"><span>RUSHING</span><span>${data.rushing}</span></div>` : ''}
                    ${data.misc ? `<div class="retro-stat-row"><span>MISC</span><span>${data.misc}</span></div>` : ''}
                    ${data.kicking ? `<div class="retro-stat-row"><span>KICKING</span><span>${data.kicking}</span></div>` : ''}
                    ${data.defense ? `<div class="retro-stat-row"><span>DEFENSE</span><span>${data.defense}</span></div>` : ''}
                </div>
                <div class="retro-back-section">
                    <h3>Best Performance</h3>
                    ${data.best_game_points ? `<div class="retro-stat-row retro-stat-row-center"><span>${data.best_game_points}</span></div>` : ''}
                    ${data.best_game_info ? `<div class="retro-stat-row retro-stat-row-center"><span>${data.best_game_info}</span></div>` : ''}
                    ${data.best_game_stats ? `<div class="retro-stat-row retro-stat-row-center"><span>${data.best_game_stats}</span></div>` : ''}
                </div>
            </div>
        `;

        container.onclick = () => container.classList.toggle('flipped');
        container.classList.remove('hidden');
    }

    searchInput.addEventListener('input', function () {
        if (!searchInput.value.trim()) {
            cardContainer?.classList.add('hidden');
            timelineContainer?.classList.add('hidden');
            return;
        }
        loadPlayerSuggestions(this.value);
    });

    searchInput.addEventListener('change', function () {
        renderPlayerCard(this.value);
        loadCareerData(this.value);
        searchInput.blur();
    });

    searchInput.addEventListener('focus', function () {
        this.value = '';
        suggestionsContainer.innerHTML = '';
    });
});
