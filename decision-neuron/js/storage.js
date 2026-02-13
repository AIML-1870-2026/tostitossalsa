// Decision Neuron - Storage Utilities
// localStorage management for decision history

const Storage = {
    STORAGE_KEY: 'decision-neuron-history',
    MAX_DECISIONS: 5,

    // Generate unique ID
    generateId: function() {
        return 'dn_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    },

    // Get all stored decisions
    getAll: function() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (!data) {
                return { version: '1.0', decisions: [] };
            }
            return JSON.parse(data);
        } catch (e) {
            console.error('Error reading from localStorage:', e);
            return { version: '1.0', decisions: [] };
        }
    },

    // Save all decisions
    saveAll: function(data) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            if (e.name === 'QuotaExceededError') {
                alert('Storage is full. Please delete some history to continue saving.');
            }
            return false;
        }
    },

    // Save or update a decision
    save: function(decision) {
        const data = this.getAll();
        const existingIndex = data.decisions.findIndex(d => d.id === decision.id);

        if (existingIndex >= 0) {
            // Update existing
            data.decisions[existingIndex] = {
                ...decision,
                lastModified: new Date().toISOString()
            };
        } else {
            // Add new
            data.decisions.unshift({
                ...decision,
                id: decision.id || this.generateId(),
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            });

            // Keep only MAX_DECISIONS
            if (data.decisions.length > this.MAX_DECISIONS) {
                data.decisions = data.decisions.slice(0, this.MAX_DECISIONS);
            }
        }

        return this.saveAll(data);
    },

    // Get a decision by ID
    get: function(id) {
        const data = this.getAll();
        return data.decisions.find(d => d.id === id);
    },

    // Delete a decision by ID
    delete: function(id) {
        const data = this.getAll();
        data.decisions = data.decisions.filter(d => d.id !== id);
        return this.saveAll(data);
    },

    // Get recent decisions (for history dropdown)
    getRecent: function(limit = 5) {
        const data = this.getAll();
        return data.decisions.slice(0, limit);
    },

    // Format date for display
    formatDate: function(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    },

    // Clear all history
    clearAll: function() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            return true;
        } catch (e) {
            console.error('Error clearing localStorage:', e);
            return false;
        }
    }
};

// YouTube Preset Data
const Presets = {
    youtube: {
        name: 'Should I Watch YouTube?',
        parameters: [
            { name: 'Time Available', unit: 'minutes', min: 0, max: 120 },
            { name: 'Energy Level', unit: '1-10 scale', min: 1, max: 10 },
            { name: 'Tasks Remaining', unit: 'count', min: 0, max: 10 }
        ],
        weights: [0.12633175, -0.39583948, -0.90958859],
        bias: -1.2,
        trainingData: [
            { values: [15, 3, 5], label: 'NO' },
            { values: [60, 8, 0], label: 'YES' },
            { values: [20, 5, 2], label: 'NO' },
            { values: [90, 9, 1], label: 'YES' },
            { values: [10, 2, 8], label: 'NO' },
            { values: [45, 7, 1], label: 'YES' },
            { values: [20, 4, 6], label: 'NO' },
            { values: [75, 8, 2], label: 'YES' },
            { values: [25, 6, 4], label: 'NO' },
            { values: [50, 9, 0], label: 'YES' }
        ]
    },

    // Create a blank decision
    blank: {
        name: 'Untitled Decision',
        parameters: [
            { name: 'Parameter 1', unit: '', min: 0, max: 100 },
            { name: 'Parameter 2', unit: '', min: 0, max: 100 }
        ],
        weights: [0, 0],
        bias: 0,
        trainingData: []
    }
};

// Make available globally
window.Storage = Storage;
window.Presets = Presets;
