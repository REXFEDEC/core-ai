document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('../../src/data/factorsphere_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const journals = await response.json();
        
        // Sort journals by Impact Factor
        const sortedJournals = journals
            .filter(j => j.OOIR_IF)
            .sort((a, b) => b.OOIR_IF - a.OOIR_IF);

        displayJournals(sortedJournals);
    } catch (error) {
        console.error('Error loading journals:', error);
        document.getElementById('journalsList').innerHTML = `
            <div class="error-message">
                Failed to load journal rankings: ${error.message}
            </div>
        `;
    }
});

function displayJournals(journals) {
    const container = document.getElementById('journalsList');
    
    container.innerHTML = journals.map((journal, index) => `
        <div class="journal-row" onclick="window.location.href='./Details.html?id=${encodeURIComponent(journal['OA_ISSN-L'])}'" style="cursor: pointer">
            <div class="rank">${index + 1}</div>
            <div class="journal-info">
                <h3>${journal['OA_Journal Name']}</h3>
                <div class="journal-meta">
                    <span>${journal['OA_Publisher']}</span>
                    <span>${journal.SCIMAGO_Categories || 'N/A'}</span>
                </div>
            </div>
            <div class="metrics">
                <div class="if-score" title="Impact Factor">
                    IF*: ${journal.OOIR_IF?.toFixed(2)}
                </div>
                <div class="citations">
                    Citations: ${journal['OA_Cited By Count']?.toLocaleString()}
                </div>
            </div>
        </div>
    `).join('');
}