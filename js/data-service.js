/**
 * Data Service Layer
 * Handles all Supabase queries
 */

const DataService = {
    // ── Seasons ────────────────────────────────────────────────
    async getSeasons() {
        const { data, error } = await supabaseClient
            .from("seasons")
            .select("year")
            .order("year", { ascending: true });
        if (error) throw error;
        return data;
    },

    async getSeasonWeeks(year) {
        const { data, error } = await supabaseClient
            .from('seasons')
            .select('weeks')
            .eq('year', year)
            .single();
        if (error) throw error;
        return data;
    },

    // ── Regular Season ─────────────────────────────────────────
    async getRegularSeasonStandings(year) {
        const { data, error } = await supabaseClient
            .from("regular_season_standings")
            .select("rank, name, teamname, w, l, pf, pa, manager_id")
            .eq("year", year)
            .order("rank");
        if (error) throw error;
        return data;
    },

    async getScheduleMatrix(year) {
        const { data, error } = await supabaseClient
            .from("schedule_swap")
            .select("year, manager, schedule, wins, losses, ties")
            .eq("year", year);
        if (error) throw error;
        return data;
    },

    // ── Weekly Matchups ────────────────────────────────────────
    async getWeeklyMatchups(year, week) {
        const { data, error } = await supabaseClient
            .from("matchup_table")
            .select("team1, team1_id, points1, points2, team2, team2_id")
            .eq("year", year)
            .eq("week", week);
        if (error) throw error;
        return data;
    },

    // ── TOTW (Team of the Week) ────────────────────────────────
    async getTotw(year, week) {
        const { data, error } = await supabaseClient
            .from('totw')
            .select('position, player_name, points')
            .eq('year', year)
            .eq('week', week);
        if (error) throw error;
        return data;
    },

    // ── TOTY (Team of the Year - week 0) ───────────────────────
    async getToty(year) {
        const { data, error } = await supabaseClient
            .from('totw')
            .select('position, player_name, points')
            .eq('year', year)
            .eq('week', 0);
        if (error) throw error;
        return data;
    },

    // ── Awards / Honors ────────────────────────────────────────
    async getAwards(year) {
        const { data, error } = await supabaseClient
            .from("award_winners")
            .select("award, player")
            .eq("year", year)
            .order("award_order");
        if (error) throw error;
        return data;
    },

    // ── Draft Board ────────────────────────────────────────────
    async getDraftBoard(year) {
        const { data, error } = await supabaseClient
            .from("draft_board")
            .select("round, pick_no, teamname, first_name, last_name, position, keeper_id")
            .eq("year", year)
            .order("pick_no");
        if (error) throw error;
        return data;
    },

    // ── Playoff Bracket ────────────────────────────────────────
    async getPlayoffMatches(year) {
        const { data, error } = await supabaseClient
            .from("playoff_matches")
            .select("*")
            .eq("year", year);
        if (error) throw error;
        return data;
    },

    // ── Playoff Odds ───────────────────────────────────────────
    async getPlayoffOdds(year) {
        const { data, error } = await supabaseClient
            .from("playoff_odds")
            .select("year, week, manager_id, playoff_pct, bye_pct")
            .eq("year", year)
            .order("week", { ascending: true });
        if (error) throw error;
        return data;
    },

    // ── Rosters ─────────────────────────────────��──────────────
    async getRosterInfo(managerId, year, week) {
        const { data, error } = await supabaseClient
            .from('roster_info')
            .select('position, player_name, points, stats, game_info, timeslot, projection')
            .eq('manager_id', managerId)
            .eq('year', year)
            .eq('week', week);
        if (error) throw error;
        return data;
    },

    async getMatchupRosters(homeId, awayId, year, week) {
        const [homeData, awayData] = await Promise.all([
            this.getRosterInfo(homeId, year, week),
            this.getRosterInfo(awayId, year, week)
        ]);
        return { homeRoster: homeData, awayRoster: awayData };
    }
};
