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

    async function loadCareerData(playerId = '') {
        if (!playerId) {
            careerContainer.innerHTML = '';
            timelineContainer?.classList.add('hidden');
            return;
        }

        const { data, error } = await supabaseClient
            .from('roster_changes')
            .select('*')
            .eq('player_id', playerId)
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
            const year = String(row.year);
            if (!grouped[year]) grouped[year] = [];
            grouped[year].push(row);
        });

        const years = Object.keys(grouped).sort((a, b) => a.localeCompare(b));

        careerContainer.innerHTML = years.map(year => {
            const items = grouped[year].map(row => {
                const type = row.type === 'add' ? 'add' : 'drop';
                return `
                    <div class="timeline-item ${type}">
                        <div class="timeline-card">
                            <span class="tc-date">${formatDate(row.time)}</span>
                            <span class="tc-name">${row.manager_name || ''}</span>
                            <span class="tc-source">${row.target || ''}</span>
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

        // Achievement strips
        const strips = [];
        if (data.championships > 0) {
            const years = data.championship_years ? ` (${data.championship_years})` : '';
            strips.push(`<div class="retro-achievement-strip"><span>${data.championships}\u00d7 NPC Champion${years}</span></div>`);
        }
        if (data.toty > 0) {
            const years = data.toty_years ? ` (${data.toty_years})` : '';
            strips.push(`<div class="retro-achievement-strip"><span>${data.toty}\u00d7 Team of the Year${years}</span></div>`);
        }
        if (data.totw > 0) {
            strips.push(`<div class="retro-achievement-strip"><span>${data.totw}\u00d7 Team of the Week</span></div>`);
        }

        const front = container.querySelector('.retro-front');
        front.innerHTML = `
            <div class="retro-corner tl"></div>
            <div class="retro-corner tr"></div>
            <div class="retro-corner bl"></div>
            <div class="retro-corner br"></div>

            <div class="retro-ovr-badge">
                <span class="retro-ovr-number">${data.ovr ?? 96}</span>
                <span class="retro-ovr-label">OVR</span>
            </div>

            <div class="retro-photo-wrap">
                <img class="retro-player-photo"
                    src="${data.espn_id ? `https://a.espncdn.com/i/headshots/nfl/players/full/${data.espn_id}.png` : 'https://a.espncdn.com/i/headshots/nfl/players/full/3128720.png'}"
                    alt="${data.player_name}"
                    loading="lazy">
            </div>

            <div class="retro-name-bar">${data.player_name}</div>

            ${data.awards ? `<div class="retro-award-strip"><span>${data.awards}</span></div>` : ''}

            ${strips.length > 0 ? `<div class="retro-achievement-strips">${strips.join('')}</div>` : ''}

            <div class="retro-front-stats">
                <div><label>Games</label><strong>${data.games || 0}</strong></div>
                <div><label>PPG</label><strong>${data.ppg || 0}</strong></div>
                <div><label>Points</label><strong>${data.points || 0}</strong></div>
            </div>
        `;

        const back = container.querySelector('.retro-back');
        back.innerHTML = `
            <div class="retro-corner tl"></div>
            <div class="retro-corner tr"></div>
            <div class="retro-corner bl"></div>
            <div class="retro-corner br"></div>

            <div class="retro-back-name">${data.player_name}</div>
            <div class="retro-back-meta">${data.position} \u00b7 #${data.number}</div>
            <div class="retro-back-stats">
                <div class="retro-back-section">
                    <h3>Career Stats</h3>
                    ${data.passing   ? `<div class="retro-stat-row"><span>Passing</span><span>${data.passing}</span></div>` : ''}
                    ${data.receiving ? `<div class="retro-stat-row"><span>Receiving</span><span>${data.receiving}</span></div>` : ''}
                    ${data.rushing   ? `<div class="retro-stat-row"><span>Rushing</span><span>${data.rushing}</span></div>` : ''}
                    ${data.misc      ? `<div class="retro-stat-row"><span>Misc</span><span>${data.misc}</span></div>` : ''}
                    ${data.kicking   ? `<div class="retro-stat-row"><span>Kicking</span><span>${data.kicking}</span></div>` : ''}
                    ${data.defense   ? `<div class="retro-stat-row"><span>Defense</span><span>${data.defense}</span></div>` : ''}
                </div>
                <div class="retro-back-section">
                    <h3>Best Performance</h3>
                    ${data.best_game_points ? `<div class="retro-stat-row retro-stat-row-center"><span class="bp-points">${data.best_game_points} Points</span></div>` : ''}
                    ${data.best_game_info   ? `<div class="retro-stat-row retro-stat-row-center"><span>${data.best_game_info}</span></div>` : ''}
                    ${data.best_game_stats  ? `<div class="retro-stat-row retro-stat-row-center"><span>${data.best_game_stats}</span></div>` : ''}
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

    searchInput.addEventListener('change', async function () {
        const playerName = this.value.trim();
        if (!playerName) return;

        // player_id anhand des Namens aus roster_changes ermitteln
        const { data: idData } = await supabaseClient
            .from('roster_changes')
            .select('player_id')
            .ilike('player_name', `%${playerName}%`)
            .limit(1)
            .single();

        renderPlayerCard(playerName);
        if (idData?.player_id) {
            loadCareerData(idData.player_id);
        }
        searchInput.blur();
    });

    searchInput.addEventListener('focus', function () {
        this.value = '';
        suggestionsContainer.innerHTML = '';
    });
});
