document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const journalId = urlParams.get('id');
    
    console.log('Loading details for journal ID:', journalId); // Debug log
    
    if (!journalId) {
        showError('No journal ID provided');
        return;
    }

    try {
        const response = await fetch('../../src/data/factorsphere_data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const journals = await response.json();
        console.log('Loaded journals:', journals.length); // Debug log
        
        const journal = journals.find(j => j['OA_ISSN-L'] === journalId);
        console.log('Found journal:', journal); // Debug log
        
        if (!journal) {
            showError('Journal not found');
            return;
        }

        displayJournalDetails(journal);
    } catch (error) {
        console.error('Error loading journal details:', error);
        showError(`Failed to load journal details: ${error.message}`);
    }
});

async function getFavicon(journalUrl) {
    try {
        // Extract the hostname from the journal URL
        const url = new URL(journalUrl);
        const hostname = url.hostname;
        
        // Use Google's favicon service directly
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
    } catch (error) {
        console.error('Error getting favicon:', error);
        return null;
    }
}

// Update the displayJournalDetails function
async function displayJournalDetails(journal) {
    // Update title with favicon
    const titleElement = document.getElementById('journalTitle');
    const journalUrl = journal.OA_Homepage;
    
    if (journalUrl) {
        const faviconUrl = await getFavicon(journalUrl);
        if (faviconUrl) {
            titleElement.innerHTML = `
                <div class="journal-title-wrapper">
                    <img src="${faviconUrl}" alt="Journal icon" class="journal-favicon" 
                         style="width: 24px; height: 24px; margin-right: 10px; vertical-align: middle;">
                    <span>${journal['OA_Journal Name']}</span>
                </div>
            `;
        } else {
            titleElement.textContent = journal['OA_Journal Name'];
        }
    } else {
        titleElement.textContent = journal['OA_Journal Name'];
    }

    // Update basics
    document.getElementById('issn').textContent = `ISSN: ${journal['OA_ISSN-L']}`;
    document.getElementById('publisher').textContent = journal['OA_Publisher'];

    // Update metrics
    document.getElementById('sjrScore').textContent = journal.SCIMAGO_SJR?.toLocaleString() || 'N/A';
    document.getElementById('citedByCount').textContent = journal['OA_Cited By Count']?.toLocaleString() || 'N/A';
    document.getElementById('hIndex').textContent = journal['SCIMAGO_H index'] || 'N/A';
    document.getElementById('bestQuartile').textContent = journal['SCIMAGO_SJR Best Quartile'] || 'N/A';

    // Publication metrics
    const publicationMetrics = document.getElementById('publicationMetrics');
    publicationMetrics.innerHTML = `
        <dl class="metrics-list">
            <dt>Recent Documents (2024)</dt>
            <dd>${journal['SCIMAGO_Total Docs. (2024)'] || 'N/A'}</dd>
            
            <dt>Documents (3 years)</dt>
            <dd>${journal['SCIMAGO_Total Docs. (3years)'] || 'N/A'}</dd>
            
            <dt>Citations per Document (2 years)</dt>
            <dd>${journal['SCIMAGO_Citations / Doc. (2years)'] || 'N/A'}</dd>
            
            <dt>References per Document</dt>
            <dd>${journal['SCIMAGO_Ref. / Doc.'] || 'N/A'}</dd>
        </dl>
    `;

    // Categories and disciplines
    const categories = document.getElementById('categories');
    categories.innerHTML = `
        <div class="categories-list">
            <h3>SCImago Categories</h3>
            <p>${journal.SCIMAGO_Categories || 'N/A'}</p>
            
            <h3>Disciplines</h3>
            <p>${journal.OA_Discipline || 'N/A'}</p>
        </div>
    `;

    // Additional information
    const additionalInfo = document.getElementById('additionalInfo');
    additionalInfo.innerHTML = `
        <dl class="info-list">
            <dt>Country</dt>
            <dd>${journal.SCIMAGO_Country || 'N/A'}</dd>
            
            <dt>Region</dt>
            <dd>${journal.SCIMAGO_Region || 'N/A'}</dd>
            
            <dt>Coverage Years</dt>
            <dd>${journal.SCIMAGO_Coverage || 'N/A'}</dd>
            
            <dt>Homepage</dt>
            <dd>${journal.OA_Homepage ? `<a href="${journal.OA_Homepage}" target="_blank">Visit Journal</a>` : 'N/A'}</dd>
        </dl>
    `;
}

// Update showError to be more visible
function showError(message) {
    console.error('Error:', message); // Debug log
    document.getElementById('journalTitle').textContent = 'Error';
    document.querySelector('.journal-basics').innerHTML = `
        <div class="error-message" style="color: red; padding: 1rem;">
            <i class="fas fa-exclamation-triangle"></i>
            ${message}
        </div>
    `;
}