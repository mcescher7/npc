/**
 * DOM element references for saisons.js
 * Centralized cache to avoid repeated getElementById calls
 */
const DOM = {
    // Selects
    seasonSelect: document.getElementById("season-select"),
    weekSelect: document.getElementById("week-select"),
    totwWeekSelect: document.getElementById("totw-week-select"),
    
    // Table bodies
    regTableBody: document.getElementById("regular-season-table"),
    weeklyTableBody: document.getElementById("weekly-results-table"),
    awardTableBody: document.getElementById("awards-table"),
    totwTableBody: document.getElementById("totw-table"),
    totyTableBody: document.getElementById("toty-table"),
    
    // Panels - Ergebnisse/TOTW
    panelErgebnisse: document.getElementById("panel-ergebnisse"),
    panelTotw: document.getElementById("panel-totw"),
    ergebnisseControls: document.getElementById("ergebnisse-woche-controls"),
    totwControls: document.getElementById("totw-woche-controls"),
    
    // Toggles - Ergebnisse/TOTW
    toggleErgebnisse: document.getElementById("toggle-ergebnisse"),
    toggleTotw: document.getElementById("toggle-totw"),
    
    // Panels - Awards/TOTY
    panelHonors: document.getElementById("panel-honors"),
    panelToty: document.getElementById("panel-toty"),
    
    // Toggles - Awards/TOTY
    toggleHonors: document.getElementById("toggle-honors"),
    toggleToty: document.getElementById("toggle-toty"),
    
    // Regular Season panels
    panelRegularTable: document.getElementById("panel-regular-table"),
    panelRegularPlayoff: document.getElementById("panel-regular-playoff"),
    panelRegularSchedule: document.getElementById("panel-regular-schedule"),
    
    // Regular Season toggles
    toggleRegularTable: document.getElementById("toggle-regular-table"),
    toggleRegularPlayoff: document.getElementById("toggle-regular-playoff"),
    toggleRegularSchedule: document.getElementById("toggle-regular-schedule"),
    
    // Playoff odds toggles
    togglePlayoffPct: document.getElementById("toggle-playoff-pct"),
    toggleByePct: document.getElementById("toggle-bye-pct"),
    
    // Schedule matrix
    scheduleMatrixHead: document.getElementById("schedule-matrix-head"),
    scheduleMatrixBody: document.getElementById("schedule-matrix-body"),
    
    // Chart
    playoffChart: document.getElementById("regular-playoff-chart"),
    
    // Draft
    draftBoard: document.getElementById("draft-board"),
    
    // Brackets
    quarterfinals: document.getElementById("quarterfinals"),
    semifinals: document.getElementById("semifinals"),
    finals: document.getElementById("finals"),
    
    // Modal
    rosterModal: document.getElementById("rosterModal"),
    rosterContent: document.getElementById("roster-content"),
    
    /**
     * Get all bracket containers
     */
    getBracketContainers() {
        return ['quarterfinals', 'semifinals', 'finals', 'champion']
            .map(id => document.getElementById(id))
            .filter(el => el !== null);
    }
};
