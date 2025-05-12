document.addEventListener("DOMContentLoaded", async function () {
    const SUPABASE_URL = "https://hcjinenoxuulhcoadmgh.supabase.co";
    const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhjamluZW5veHV1bGhjb2FkbWdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzgxODMzNjMsImV4cCI6MjA1Mzc1OTM2M30.LSNcn8Vl0D5Admpc5S7gyS2HkTGJr0fe30JdiJJOfC0";
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    const seasonSelect = document.getElementById("season-select");
    const weekSelect = document.getElementById("week-select");
    const bracketDiv = document.getElementById("playoff-bracket");
    const regTableBody = document.getElementById("regular-season-table");
    const weeklyTableBody = document.getElementById("weekly-results-table");

    // 🔧 Hilfsfunktionen
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

    // 📅 Saisons laden
    async function loadSeasons() {
        const { data, error } = await supabase
            .from("seasons")
            .select("year")
            .order("year");

        if (error) return logError("Laden der Saisons", error);

        seasonSelect.innerHTML = '<option value="">Bitte wählen...</option>';
        data.forEach(season => seasonSelect.appendChild(createOption(season.year, season.year)));
    }

    // 📊 Tabelle laden
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

    // 🗓 Wochen laden
    async function loadWeeks(year) {
        weekSelect.innerHTML = '<option value="">Bitte wählen...</option>';

        const { data, error } = await supabase
            .from("seasons")
            .select("weeks")
            .eq("year", year)
            .single();

        if (error || !data) return logError("Laden der Wochen", error);
        
        const weeks = data.weeks;
        for (let i = 1; i <= weeks; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = i;
            weekSelect.appendChild(option);
    }
    }

    // 🧾 Matchups laden
    async function loadWeeklyMatchups(year, week) {
        weeklyTableBody.innerHTML = "";

        if (!year || !week) return;

        const { data, error } = await supabase
            .from("matchup_table")
            .select("team1, points1, points2, team2")
            .eq("year", year)
            .eq("week", week);

        if (error) return logError("Laden der Matchups", error);
        if (!data || data.length === 0) return showNoData(weeklyTableBody, 5);

        weeklyTableBody.innerHTML = data.map(row => `
            <tr>
                <td>${row.team1}</td>
                <td>${row.points1.toFixed(2)}</td>
                <td>-</td>
                <td>${row.points2.toFixed(2)}</td>
                <td>${row.team2}</td>
            </tr>
        `).join("");
    }

    // 🧠 Events
    seasonSelect.addEventListener("change", async (e) => {
        const year = parseInt(e.target.value, 10);
        if (!year) return;

        await loadBracket(year);
        await loadRegSeason(year);
        await loadWeeks(year);
        await loadDraftBoard(year);
        weeklyTableBody.innerHTML = "";
    });

    weekSelect.addEventListener("change", (e) => {
        const year = parseInt(seasonSelect.value, 10);
        const week = parseInt(e.target.value, 10);
        if (!year || !week) return;
        loadWeeklyMatchups(year, week);
    });

    // 🚀 Initial Load
    await loadSeasons();

    // Draft
    async function loadDraftBoard(year) {
    const board = document.getElementById("draft-board");
    board.innerHTML = "";

    const { data, error } = await supabase
        .from("draft_board")
        .select("round, pick_no, teamname, first_name, last_name, position, keeper_id")
        .eq("year", year)
        .order("pick_no");

    if (error) {
        console.error("Fehler beim Laden des Draft Boards:", error);
        return;
    }

    const teams = [...new Set(data.map(p => p.teamname))];
    const maxRounds = Math.max(...data.map(p => p.round));
    board.className = `draft-board-grid cols-${teams.length + 2}`; // +2 für Rundennummern

    // Kopfzeile: leere Ecke + Teamnamen + leere Ecke
    board.appendChild(document.createElement("div")); // Leerfeld oben links
    teams.forEach(team => {
        const header = document.createElement("div");
        header.className = "draft-team-header";
        header.textContent = team;
        board.appendChild(header);
    });
    board.appendChild(document.createElement("div")); // Leerfeld oben rechts

    for (let r = 1; r <= maxRounds; r++) {
        // Rundennummer links
        const leftLabel = document.createElement("div");
        leftLabel.className = "round-label-left";
        leftLabel.textContent = (r % 2 === 1) ? `${r} →` : `${r} ←`;
        board.appendChild(leftLabel);

        let picks = data.filter(p => p.round === r);
        if (r % 2 === 0) picks.reverse(); // Snake-Draft

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

        // Rundennummer rechts
        const rightLabel = document.createElement("div");
        rightLabel.className = "round-label-right";
        rightLabel.textContent = (r % 2 === 1) ? `→ ${r}` : `← ${r}`;
        board.appendChild(rightLabel);
    }
}

    // Playoffs
async function loadBracket(year) {
  // Container zuerst leeren
  ['quarterfinals', 'semifinals', 'finals', 'champion'].forEach(id => {
    const container = document.getElementById(id)
    if (container) container.innerHTML = ''
  })

  const { data, error } = await supabase
    .from('playoff_matches')
    .select('*')
    .eq('year', year)

  if (error) {
    console.error(error)
    return
  }

    const qfColumn = document.getElementById('quarterfinals')
    const hasQuarterfinals = data.some(g => g.round === 'QF')
    
    if (qfColumn) {
      qfColumn.classList.toggle('d-none', !hasQuarterfinals)
    }
    
    
      // Sortierung
    const roundOrder = { 'QF': 1, 'SF': 2, 'F': 3 }
    
    const sortedData = data.slice().sort((a, b) => {
        if (a.round !== b.round) return roundOrder[a.round] - roundOrder[b.round]
        return a.slot - b.slot
      })

  sortedData.forEach(game => {
    const roundId =
      game.round === 'QF' ? 'quarterfinals' :
      game.round === 'SF' ? 'semifinals' :
      game.round === 'F'  ? 'finals' : null

    const isBye = game.l_name === null
    const container = roundId ? document.getElementById(roundId) : null
    if (!container) return

    const div = document.createElement('div')
    div.className = 'card my-2 p-2 text-start'
    div.style.maxWidth = '250px'

    const wPoints = game.w_points?.toFixed(2) ?? ''
    const lPoints = game.l_points?.toFixed(2) ?? ''

    const winnerPointsClass = 'text-success'
    const loserPointsClass = 'text-danger'

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
  </div>
`
    } else {
        let topSeed, bottomSeed
        const wSlot = game.w_slot
        const lSlot = game.l_slot
        
        if (wSlot !== null && lSlot !== null) {
          topSeed = wSlot < lSlot ? 'w' : 'l'
        } else {
          topSeed = game.w_rank < game.l_rank ? 'w' : 'l'
        }
        
        bottomSeed = topSeed === 'w' ? 'l' : 'w'

      const topRank = game[`${topSeed}_rank`]
      const topName = game[`${topSeed}_name`]
      const topPoints = (game[`${topSeed}_points`] ?? 0).toFixed(2)

      const bottomRank = game[`${bottomSeed}_rank`]
      const bottomName = game[`${bottomSeed}_name`]
      const bottomPoints = (game[`${bottomSeed}_points`] ?? 0).toFixed(2)

      const topClass = (game.w_rank === topRank) ? 'text-success' : 'text-danger'
      const bottomClass = (game.w_rank === bottomRank) ? 'text-success' : 'text-danger'

      // Finale: Gewinner fett + gold
      const topNameClass = (game.round === 'F' && game.w_rank === topRank) ? 'text-warning fw-bold' : ''
      const bottomNameClass = (game.round === 'F' && game.w_rank === bottomRank) ? 'text-warning fw-bold' : ''

    div.innerHTML = `
  <div class="d-flex justify-content-between">
    <div class="me-2 flex-grow-1">
      <small class="text-muted">${topRank}</small> ${topName}
    </div>
    <span class="${topClass}">${topPoints}</span>
  </div>
  <div class="d-flex justify-content-between">
    <div class="me-2 flex-grow-1">
      <small class="text-muted">${bottomRank}</small> ${bottomName}
    </div>
    <span class="${bottomClass}">${bottomPoints}</span>
  </div>
`

    }

    container.appendChild(div)
  })
}

});
