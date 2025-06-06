// Store journals globally
let journalsData = [];

// Add dictionary loading at the top of the file
async function loadDictionary() {
    try {
        const response = await fetch('./src/data/dictionary.csv');
        const text = await response.text();
        const rows = text.split('\n').slice(1); // Skip header
        return rows.reduce((dict, row) => {
            const [field, full, short] = row.split(',').map(s => s.replace(/"/g, ''));
            dict[field] = { full, short };
            return dict;
        }, {});
    } catch (error) {
        console.error('Error loading dictionary:', error);
        return {};
    }
}

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
    const dictionary = await loadDictionary();
    initializeTheme();
    initializeSearch();
    loadJournalRankings(dictionary);
});

function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Update initial icon
    const currentTheme = document.documentElement.getAttribute('data-theme');
    updateThemeIcon(currentTheme);

    // Toggle theme when button is clicked
    themeToggle.addEventListener('click', () => {
        const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    });

    // Listen for system theme changes
    prefersDark.addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            const newTheme = e.matches ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            updateThemeIcon(newTheme);
        }
    });
}

function updateThemeIcon(theme) {
    const icon = document.querySelector('#themeToggle i');
    if (icon) {
        icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

function initializeSearch() {
    const searchButton = document.getElementById('searchButton');
    const searchModal = document.getElementById('searchModal');
    const closeModal = document.querySelector('.close-modal');
    const modalSearch = document.getElementById('modalJournalSearch');
    const fieldFilter = document.getElementById('fieldFilter');
    const sortBy = document.getElementById('sortBy');
    const searchResults = document.getElementById('searchResults');

    if (!searchModal || !searchButton) return;

    // Add search handler
    const handleSearch = () => {
        const query = modalSearch?.value?.toLowerCase() || '';
        const field = fieldFilter?.value;
        const sort = sortBy?.value;

        const results = journalsData
            .filter(journal => {
                const matchQuery = journal['OA_Journal Name']?.toLowerCase().includes(query) ||
                                 journal['OA_ISSN-L']?.includes(query) ||
                                 journal.SCIMAGO_Categories?.toLowerCase().includes(query);
                const matchField = !field || journal.SCIMAGO_Categories?.includes(field);
                return matchQuery && matchField;
            })
            .sort((a, b) => {
                switch(sort) {
                    case 'impact': return (b.SCIMAGO_SJR || 0) - (a.SCIMAGO_SJR || 0);
                    case 'name': return (a['OA_Journal Name'] || '').localeCompare(b['OA_Journal Name'] || '');
                    case 'recent': return (b['SCIMAGO_Total Docs. (2024)'] || 0) - (a['SCIMAGO_Total Docs. (2024)'] || 0);
                    default: return 0;
                }
            })
            .slice(0, 20);

        // Update just the search results HTML template in the handleSearch function
        searchResults.innerHTML = results.length ? results
            .map(j => `
                <div class="search-result" onclick="window.location.href='./src/ever/Details.html?id=${encodeURIComponent(j['OA_ISSN-L'])}'" style="cursor: pointer">
                    <h3>${j['OA_Journal Name']}</h3>
                    <div class="result-meta">
                        <span>SJR: ${j.SCIMAGO_SJR || 'N/A'}</span>
                        <span>${j.SCIMAGO_Categories || j.OA_Discipline || 'N/A'}</span>
                    </div>
                </div>
            `).join('') : '<div class="no-results">No matching journals found</div>';
    };

    // Add event listeners to search inputs
    modalSearch?.addEventListener('input', handleSearch);
    fieldFilter?.addEventListener('change', handleSearch);
    sortBy?.addEventListener('change', handleSearch);

    // Open modal
    searchButton.addEventListener('click', () => {
        searchModal.classList.add('active');
        modalSearch.focus();
        document.body.style.overflow = 'hidden';
    });

    // Close modal
    closeModal?.addEventListener('click', () => {
        searchModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Close on outside click
    searchModal.addEventListener('click', (e) => {
        if (e.target === searchModal) {
            searchModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && searchModal.classList.contains('active')) {
            searchModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Update loadJournalRankings to store data globally
function loadJournalRankings(dictionary) {
    // Get current page path to determine correct data path
    const currentPath = window.location.pathname;
    const dataPath = currentPath.includes('/src/ever/') 
        ? '../../src/data/factorsphere_data.json'  // Path from us.html
        : './src/data/factorsphere_data.json';     // Path from index.html
    
    console.log('Attempting to load data from:', dataPath);
    
    fetch(dataPath)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log('Response received:', response.status);
            return response.json();
        })
        .then(data => {
            journalsData = data.filter(j => Object.keys(j).length > 1); // Store valid journals globally
            console.log('Data loaded, entries:', journalsData.length);
            displayJournalRankings(journalsData, dictionary);
        })
        .catch(error => {
            console.error('Error loading journal rankings:', error);
            // Show error in UI
            const containers = document.querySelectorAll('.rankings-grid, .lists-grid');
            containers.forEach(container => {
                container.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-triangle"></i>
                        Error loading journal data. Please try again later.
                    </div>
                `;
            });
        });
}

function displayJournalRankings(journals, dictionary) {
    const rankingsContainer = document.querySelector('.rankings-grid');
    const listsContainer = document.querySelector('.lists-grid');
    if (!rankingsContainer || !listsContainer) return;
    
    // Clear containers
    rankingsContainer.innerHTML = '';
    listsContainer.innerHTML = '';

    // Sort journals by SCIMAGO_Rank for rankings section
    const topRanked = [...journals]
        .filter(j => j.SCIMAGO_Rank)
        .sort((a, b) => a.SCIMAGO_Rank - b.SCIMAGO_Rank)
        .slice(0, 20);

    // Sort journals by citations for popular lists
    const mostCited = [...journals]
        .filter(j => j['OA_Cited By Count']) // Fixed property name
        .sort((a, b) => b['OA_Cited By Count'] - a['OA_Cited By Count'])
        .slice(0, 20);

    // Display top ranked journals
    topRanked.forEach(journal => {
        const journalElement = createJournalCard(journal, true, dictionary);
        rankingsContainer.appendChild(journalElement);
    });

    // Display most cited journals
    mostCited.forEach(journal => {
        const journalElement = createJournalCard(journal, false, dictionary);
        listsContainer.appendChild(journalElement);
    });
}

function createJournalCard(journal, isRanking, dictionary) {
    const journalElement = document.createElement('div');
    journalElement.classList.add('journal-card');
    
    const getFieldDisplay = (fieldName) => {
        const dict = dictionary[fieldName] || { short: fieldName, full: fieldName };
        return `<span title="${dict.full}">${dict.short}</span>`;
    };
    
    journalElement.innerHTML = `
        <h3 class="journal-title">
            ${isRanking ? `#${journal.SCIMAGO_Rank} - ` : ''}
            ${journal['OA_Journal Name'] || journal.SCIMAGO_Title}
        </h3>
        <div class="journal-meta">
            <span class="issn" title="${dictionary['OA_ISSN-L'].full}">
                ${getFieldDisplay('OA_ISSN-L')}: ${journal['OA_ISSN-L'] || journal.SCIMAGO_Issn}
            </span>
            <span class="field" title="${dictionary['SCIMAGO_Categories'].full}">
                ${getFieldDisplay('SCIMAGO_Categories')}: ${journal.SCIMAGO_Categories || journal.OA_Discipline}
            </span>
        </div>
        <div class="journal-metrics">
            ${isRanking ? `
                <div class="impact-score" title="${dictionary['SCIMAGO_SJR'].full}">
                    <i class="fas fa-chart-line"></i>
                    ${getFieldDisplay('SCIMAGO_SJR')}: ${journal.SCIMAGO_SJR || 'N/A'}
                </div>
            ` : `
                <div class="citations" title="${dictionary['OA_Cited By Count'].full}">
                    <i class="fas fa-quote-right"></i>
                    ${getFieldDisplay('OA_Cited By Count')}: ${journal['OA_Cited By Count']?.toLocaleString() || 'N/A'}
                </div>
            `}
            <div class="h-index" title="${dictionary['SCIMAGO_H index'].full}">
                <i class="fas fa-chart-bar"></i>
                ${getFieldDisplay('SCIMAGO_H index')}: ${journal['SCIMAGO_H index'] || 'N/A'}
            </div>
        </div>
        <div class="last-updated" title="${dictionary['SCIMAGO_Coverage'].full}">
            <i class="fas fa-clock"></i>
            ${getFieldDisplay('SCIMAGO_Coverage')}: ${journal.SCIMAGO_Coverage || 'N/A'}
        </div>
    `;
    
    // Add click handler to navigate to details page
    journalElement.addEventListener('click', () => {
        const journalId = journal['OA_ISSN-L'];
        console.log('Navigating to journal:', journalId); // Debug log
        window.location.href = `./src/ever/Details.html?id=${encodeURIComponent(journalId)}`;
    });

    return journalElement;
}