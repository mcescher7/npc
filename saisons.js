document.addEventListener("DOMContentLoaded", async function () {
    const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0";
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const seasonSelect = document.getElementById("season-select");
    const weekSelect = document.getElementById("week-select");
    const bracketDiv = document.getElementById("playoff-bracket");
    const regTableBody = document.getElementById("regular-season-table");
    const weeklyTableBody = document.getElementById("weekly-results-table");

    const createOption = (value, text) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        return option;
    };

    const logError = (context, error) => {
        console.error(`❌ Fehler bei ${context}:`, error);
    };

    const showNoData = (element, cols) => {
        element.innerHTML = `<tr><td colspan="${cols}" class="text-center">Keine Daten vorhanden</td></tr>`;
    };

    async function loadSeasons() {
        const { data, error } = await supabase
            .from("seasons")
            .select("year")
            .order("year", { ascending: true });

        if (error) return logError("Laden der Saisons", error);
        seasonSelect.innerHTML = "";

        data.forEach(season => {
            seasonSelect.appendChild(createOption(season.year, season.year));
        });

        if (data.length > 0) {
            const newestYear = data[data.length - 1].year;
            seasonSelect.value = newestYear;

            await loadBracket(newestYear);
            await loadRegSeason(newestYear);
            await loadWeeks(newestYear); 
            await loadDraftBoard(newestYear);
        }
    }

    async function loadRegSeason(year) {
        regTableBody.innerHTML = "";
        if (!year || isNaN(year)) return;

        const { data, error } = await supabase
            .from("regular_season_standings")
            .select("rank, name, teamname, w, l, pf, pa")
            .eq("year", year)
            .order("rank");

        if (error) return logError("Laden der Tabelle", error);
        if (!data || data.length === 0) return showNoData(regTableBody, 7);

        data.forEach(manager => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${manager.rank}</td>
                <td>${manager.name}</td>
                <td>${manager.teamname}</td>
                <td>${manager.w}</td>
                <td>${manager.l}</td>
                <td>${manager.pf.toFixed(2)}</td>
                <td>${manager.pa.toFixed(2)}</td>
            `;
            regTableBody.appendChild(tr);
        });
    }

    async function loadWeeks(year) {
        weekSelect.innerHTML = "";

        const { data, error } = await supabase
            .from("seasons")
            .select("weeks")
            .eq("year", year)
            .single();

        if (error || !data) return logError("Laden der Wochen", error);

        const weeks = data.weeks;
        for (let i = 1; i <= weeks; i++) {
            weekSelect.appendChild(createOption(i, i));
        }

        if (weeks > 0) {
            weekSelect.value = weeks;
            await loadWeeklyMatchups(year, weeks);
        }
    }

    async function loadWeeklyMatchups(year, week) {
        weeklyTableBody.innerHTML = "";
        if (!year || !week) return;

        const { data, error } = await supabase
            .from("matchup_table")
            .select("team1, team1_id, points1, points2, team2, team2_id")
            .eq("year", year)
            .eq("week", week);

        if (error) return logError("Laden der Matchups", error);
        if (!data || data.length === 0) return showNoData(weeklyTableBody, 5);

        data.forEach(row => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td>${row.team1}</td>
                <td>${row.points1.toFixed(2)}</td>
                <td>-</td>
                <td>${row.points2.toFixed(2)}</td>
                <td>${row.team2}</td>
            `;
            tr.style.cursor = "pointer";

            tr.addEventListener("click", () => {
                showRosters(row.team1_id, row.team1, row.team2_id, row.team2, year, week);
            });
            weeklyTableBody.appendChild(tr);
        });
    }


   

    async function showRosters(home_id, home_team, away_id, away_team, year, week) {
    const modal = new bootstrap.Modal(document.getElementById('rosterModal'));
    const rosterContent = document.getElementById('roster-content');

    // Hole die Roster-Daten für beide Teams
    const { data: homeRoster } = await supabase
        .from('roster_positions')
        .select('position, player_name, points, own_team, game_info, opponent_team')
        .eq('manager_id', home_id)
        .eq('year', year)
        .eq('week', week);

    const { data: awayRoster } = await supabase
        .from('roster_positions')
        .select('position, player_name, points, own_team, opponent_team, game_info')
        .eq('manager_id', away_id)
        .eq('year', year)
        .eq('week', week);

    // Definiere die Positionsreihenfolge wie auf dem Screenshot
    const positions = [
        'QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'K', 'D/ST',
        'BN1', 'BN2', 'BN3', 'BN4', 'BN5', 'BN6', 'BN7', 'BN8', 'BN9', 'BN10', 'BN11', 'BN12', 'BN13', 'BN14', 'BN15', 'BN16'
    ];

    // Optional: Nur Startaufstellung anzeigen
    const visiblePositions = ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'K', 'D/ST'];

    // Hilfsfunktion für Zusatzinfos (hier kannst du beliebig erweitern)
    function getPlayerInfo(player) {
        if (!player) return '';
        // Beispiel: Gegner, Game-Info (v/@), Teams
        return `<div class="text-muted small">${player.own_team || ''} ${player.game_info || ''} ${player.opponent_team || ''}</div>`;
    }

    // Hilfsfunktion für eine Zelle
    function renderCell(player) {
        if (!player) return `<div>-</div>`;
        return `
            <div>
                <div class="fw-bold">${player.player_name || '-'}</div>
                <div class="fs-6">${player.points !== null && player.points !== undefined ? player.points.toFixed(2) : '-'}</div>
                ${getPlayerInfo(player)}
            </div>
        `;
    }

    // Roster als Map für schnellen Zugriff
    const homeMap = Object.fromEntries((homeRoster || []).map(p => [p.position, p]));
    const awayMap = Object.fromEntries((awayRoster || []).map(p => [p.position, p]));

    // Baue das Matchup-Grid
    let tableRows = visiblePositions.map(pos => `
        <tr>
            <td class="text-end pe-2 align-middle" style="width:40%;">${renderCell(homeMap[pos])}</td>
            <td class="text-center align-middle" style="width:10%;">
                <span class="badge bg-secondary">${pos}</span>
            </td>
            <td class="text-start ps-2 align-middle" style="width:40%;">${renderCell(awayMap[pos])}</td>
        </tr>
    `).join('');

    rosterContent.innerHTML = `
        <div class="container-fluid px-0">
            <div class="row">
                <div class="col text-center fw-bold">${home_team}</div>
                <div class="col-1"></div>
                <div class="col text-center fw-bold">${away_team}</div>
            </div>
            <table class="table table-borderless table-sm mt-2 mb-0">
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;

    modal.show();
}

    
    function renderRosterTable(roster) {
        if (!roster || roster.length === 0) return '<p>Keine Daten verfügbar</p>';
    
        return `
            <div class="table-responsive">
                <table class="table table-striped table-hover table-sm align-middle mb-0">
                    <thead>
                        <tr>
                            <th scope="col">Position</th>
                            <th scope="col">Spieler</th>
                            <th scope="col">Punkte</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${roster.map(player => `
                            <tr>
                                <td>${player.position}</td>
                                <td>${player.player_name}</td>
                                <td>${player.points !== null && player.points !== undefined ? player.points.toFixed(2) : '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }


    async function loadDraftBoard(year) {
        const board = document.getElementById("draft-board");
        board.innerHTML = "";

        const { data, error } = await supabase
            .from("draft_board")
            .select("round, pick_no, teamname, first_name, last_name, position, keeper_id")
            .eq("year", year)
            .order("pick_no");

        if (error) return logError("Laden des Draft Boards", error);

        const teams = [...new Set(data.map(p => p.teamname))];
        const maxRounds = Math.max(...data.map(p => p.round));
        board.className = `draft-board-grid cols-${teams.length + 2}`;

        board.appendChild(document.createElement("div"));
        teams.forEach(team => {
            const header = document.createElement("div");
            header.className = "draft-team-header";
            header.textContent = team;
            board.appendChild(header);
        });
        board.appendChild(document.createElement("div"));

        for (let r = 1; r <= maxRounds; r++) {
            const leftLabel = document.createElement("div");
            leftLabel.className = "round-label-left";
            leftLabel.textContent = (r % 2 === 1) ? `${r} →` : `${r} ←`;
            board.appendChild(leftLabel);

            let picks = data.filter(p => p.round === r);
            if (r % 2 === 0) picks.reverse();

            picks.forEach(pick => {
                const div = document.createElement("div");
                const posClass = ["QB", "RB", "WR", "TE", "K", "DEF"].includes(pick.position) ? pick.position : "other";
                div.className = `draft-cell ${posClass}`;
                const keeperMark = pick.keeper_id !== null ? `<div class="keeper-mark">K</div>` : "";
                div.innerHTML = `
                    ${keeperMark}
                    <div class="pick-no">#${pick.pick_no}</div>
                    <span>${pick.first_name}</span>
                    <span class="last-name">${pick.last_name}</span>
                `;
                board.appendChild(div);
            });

            const rightLabel = document.createElement("div");
            rightLabel.className = "round-label-right";
            rightLabel.textContent = (r % 2 === 1) ? `→ ${r}` : `← ${r}`;
            board.appendChild(rightLabel);
        }
    }

    async function loadBracket(year) {
        ['quarterfinals', 'semifinals', 'finals', 'champion'].forEach(id => {
            const container = document.getElementById(id);
            if (container) container.innerHTML = "";
        });

        const { data, error } = await supabase
            .from("playoff_matches")
            .select("*")
            .eq("year", year);

        if (error) return logError("Laden des Brackets", error);

        const roundOrder = { "QF": 1, "SF": 2, "F": 3 };
        const sortedData = data.slice().sort((a, b) => {
            if (a.round !== b.round) return roundOrder[a.round] - roundOrder[b.round];
            return a.slot - b.slot;
        });

        const qfColumn = document.getElementById("quarterfinals");
        const hasQuarterfinals = data.some(g => g.round === "QF");
        if (qfColumn) {
            qfColumn.classList.toggle("d-none", !hasQuarterfinals);
        }

        sortedData.forEach(game => {
            const roundId = game.round === "QF" ? "quarterfinals" :
                            game.round === "SF" ? "semifinals" :
                            game.round === "F" ? "finals" : null;

            const container = roundId ? document.getElementById(roundId) : null;
            if (!container) return;

            const div = document.createElement("div");
            div.className = "card my-2 p-2 text-start";
            div.style.maxWidth = "250px";

            const isBye = game.l_name === null;

            if (isBye) {
                div.innerHTML = `
                <div class="d-flex justify-content-between">
                    <div class="me-2 flex-grow-1">
                        <small class="text-muted">${game.w_rank}</small> ${game.w_name}
                    </div>
                    <span class="text-muted"></span>
                </div>
                <div class="d-flex justify-content-between">
                    <div class="me-2 flex-grow-1">
                        <small class="text-muted">–</small> <span class="text-secondary">BYE</span>
                    </div>
                    <span class="text-muted"></span>
                </div>`;
            } else {
                let topSeed, bottomSeed;
                const wSlot = game.w_slot;
                const lSlot = game.l_slot;
                topSeed = (wSlot !== null && lSlot !== null) ? (wSlot < lSlot ? "w" : "l") :
                          (game.w_rank < game.l_rank ? "w" : "l");
                bottomSeed = topSeed === "w" ? "l" : "w";

                const topRank = game[`${topSeed}_rank`];
                const topName = game[`${topSeed}_name`];
                const topPoints = (game[`${topSeed}_points`] ?? 0).toFixed(2);

                const bottomRank = game[`${bottomSeed}_rank`];
                const bottomName = game[`${bottomSeed}_name`];
                const bottomPoints = (game[`${bottomSeed}_points`] ?? 0).toFixed(2);

                const topClass = (game.w_rank === topRank) ? "text-success" : "text-danger";
                const bottomClass = (game.w_rank === bottomRank) ? "text-success" : "text-danger";

                const topNameClass = (game.round === "F" && game.w_rank === topRank) ? "text-warning fw-bold" : "";
                const bottomNameClass = (game.round === "F" && game.w_rank === bottomRank) ? "text-warning fw-bold" : "";

                div.innerHTML = `
                <div class="d-flex justify-content-between">
                    <div class="me-2 flex-grow-1">
                        <small class="text-muted">${topRank}</small> <span class="${topNameClass}">${topName}</span>
                    </div>
                    <span class="${topClass}">${topPoints}</span>
                </div>
                <div class="d-flex justify-content-between">
                    <div class="me-2 flex-grow-1">
                        <small class="text-muted">${bottomRank}</small> <span class="${bottomNameClass}">${bottomName}</span>
                    </div>
                    <span class="${bottomClass}">${bottomPoints}</span>
                </div>`;
            }

            container.appendChild(div);
        });
    }

    // 🔁 Event Listener
    seasonSelect.addEventListener("change", async (e) => {
        const year = parseInt(e.target.value, 10);
        if (!year) return;

        await loadBracket(year);
        await loadRegSeason(year);
        await loadWeeks(year);
        await loadDraftBoard(year);
    });

    weekSelect.addEventListener("change", (e) => {
        const year = parseInt(seasonSelect.value, 10);
        const week = parseInt(e.target.value, 10);
        if (!year || !week) return;
        loadWeeklyMatchups(year, week);
    });

    // 🚀 Initialisierung
    await loadSeasons();
});
