/**
 * Utility functions for formatting and UI operations
 */

const Formatters = {
    /**
     * Format position code to display name
     * @param {string} pos - Position code (e.g., 'DEF', 'QB')
     * @returns {string} Formatted position
     */
    position: (pos) => pos === 'DEF' ? 'D/ST' : (pos ?? '-'),
    
    /**
     * Format win-loss-tie record
     * @param {number} w - Wins
     * @param {number} l - Losses
     * @param {number} t - Ties
     * @returns {string} Formatted record (e.g., "10-4" or "10-4-2")
     */
    record: (w, l, t) => t === 0 ? `${w}-${l}` : `${w}-${l}-${t}`,
    
    /**
     * Calculate win percentage
     * @param {number} w - Wins
     * @param {number} l - Losses
     * @param {number} t - Ties
     * @returns {number} Win percentage (0-1)
     */
    winPercentage: (w, l, t) => {
        const total = w + l + t;
        return total === 0 ? 0 : (w + 0.5 * t) / total;
    },
    
    /**
     * Format points to 2 decimal places
     * @param {number} points - Points value
     * @returns {string} Formatted points or '-'
     */
    points: (points) => points !== null && points !== undefined ? points.toFixed(2) : '-'
};

const UI = {
    /**
     * Display "no data" message in table body
     * @param {HTMLElement} element - Table body element
     * @param {number} cols - Number of columns
     */
    showNoData: (element, cols) => {
        element.innerHTML = `<tr><td colspan="${cols}" class="text-center">Keine Daten vorhanden</td></tr>`;
    },
    
    /**
     * Display loading spinner in table body
     * @param {HTMLElement} element - Table body element
     * @param {number} cols - Number of columns
     */
    showSpinner: (element, cols) => {
        element.innerHTML = `<tr><td colspan="${cols}" class="text-center"><div class="spinner-border spinner-border-sm text-secondary" role="status"><span class="visually-hidden">Laden…</span></div></td></tr>`;
    },
    
    /**
     * Log error to console with context
     * @param {string} context - Error context
     * @param {Error} error - Error object
     */
    logError: (context, error) => {
        console.error(`❌ Fehler bei ${context}:`, error);
    },
    
    /**
     * Create option element for select dropdowns
     * @param {string|number} value - Option value
     * @param {string|number} text - Display text
     * @returns {HTMLOptionElement} Option element
     */
    createOption: (value, text) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = text;
        return option;
    },
    
    /**
     * Toggle visibility of two elements
     * @param {HTMLElement} show - Element to show
     * @param {HTMLElement} hide - Element to hide
     */
    togglePanel: (show, hide) => {
        show.classList.remove("d-none");
        hide.classList.add("d-none");
    },
    
    /**
     * Add/remove CSS class on element
     * @param {HTMLElement} element - Target element
     * @param {string} className - CSS class name
     * @param {boolean} add - True to add, false to remove
     */
    toggleClass: (element, className, add) => {
        if (add) {
            element.classList.add(className);
        } else {
            element.classList.remove(className);
        }
    }
};
