/**
 * Configuration constants for saisons.js
 */
const CONFIG = {
    // Position ordering
    TOTW_ORDER: ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'K', 'DEF'],
    ROSTER_POSITIONS: [
        'QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'K', 'D/ST',
        'BN1', 'BN2', 'BN3', 'BN4', 'BN5', 'BN6', 'BN7', 'BN8', 'BN9', 'BN10',
        'BN11', 'BN12', 'BN13', 'BN14', 'BN15', 'BN16'
    ],
    MAIN_POSITIONS: ['QB', 'RB1', 'RB2', 'WR1', 'WR2', 'WR3', 'TE', 'FLEX', 'K', 'D/ST'],
    
    // Chart colors
    CHART_COLORS: [
        "#3366CC", "#DC3912", "#FF9900", "#109618",
        "#990099", "#0099C6", "#DD4477", "#66AA00",
        "#B82E2E", "#316395", "#994499", "#22AA99",
        "#AAAA11", "#6633CC", "#E67300", "#8B0707",
    ],
    
    // Position CSS classes
    POSITION_CLASSES: {
        QB: "QB", RB: "RB", WR: "WR", TE: "TE", K: "K", DEF: "DEF", other: "other"
    },
    
    // Round order for playoffs
    ROUND_ORDER: { "QF": 1, "SF": 2, "F": 3 }
};
