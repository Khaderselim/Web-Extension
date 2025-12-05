let currentUrl = '';
let hiddenElementsSet = new Set();
let selectionModeActive = false;
let allSites = {};

const toggleSelectionBtn = document.getElementById('toggleSelectionBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const hiddenList = document.getElementById('hiddenList');
const status = document.getElementById('status');
const countBadge = document.getElementById('countBadge');
const viewAllSitesBtn = document.getElementById('viewAllSitesBtn');
const allSitesModal = document.getElementById('allSitesModal');
const closeModalBtn = document.getElementById('closeModal');
const allSitesList = document.getElementById('allSitesList');
const resetAllBtn = document.getElementById('resetAllBtn');

// Initialize: get current URL and load saved hidden elements
(async function init() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentUrl = new URL(tab.url).hostname;
    await loadSavedHiddenElements();
    displayHiddenElements();
})();

async function loadAllSites() {
    return new Promise((resolve) => {
        chrome.storage.local.get(null, (result) => {
            allSites = {};
            for (const key in result) {
                // Only include keys that are arrays (site data)
                if (Array.isArray(result[key]) && result[key].length > 0) {
                    allSites[key] = result[key];
                }
            }
            resolve();
        });
    });
}

async function loadSavedHiddenElements() {
    return new Promise((resolve) => {
        chrome.storage.local.get([currentUrl], (result) => {
            const saved = result[currentUrl] || [];
            hiddenElementsSet = new Set(saved.map(item => getElementKey(item)));
            updateCountBadge();
            resolve();
        });
    });
}

function getElementKey(item) {
    // Use unique ID as the primary key
    if (item.uniqueId) {
        return item.uniqueId;
    }

    // Fallback for elements with ID or classes
    let key = item.tagName;
    if (item.id) key += `#${item.id}`;
    if (item.classes && item.classes.length) key += `.${item.classes.join('.')}`;
    return key;
}

function parseElementKey(key) {
    const parts = key.match(/^([A-Z]+)(#[^.]+)?(.*)$/);
    if (!parts) return { tagName: key, id: null, classes: [] };

    return {
        tagName: parts[1],
        id: parts[2] ? parts[2].substring(1) : null,
        classes: parts[3] ? parts[3].split('.').filter(Boolean) : []
    };
}

function updateCountBadge() {
    const count = hiddenElementsSet.size;
    if (count > 0) {
        countBadge.textContent = count;
        countBadge.style.display = 'inline-block';
    } else {
        countBadge.style.display = 'none';
    }
}

toggleSelectionBtn.addEventListener('click', async () => {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        const response = await sendMessageToTab(tab.id, {
            action: 'toggle-selection-mode'
        });

        selectionModeActive = response.active;

        if (selectionModeActive) {
            toggleSelectionBtn.innerHTML = '⏸️ Stop Selection Mode';
            toggleSelectionBtn.classList.add('active');
            showStatus('Selection mode active! Hover and click elements to hide them. Press ESC to exit.', 'info');
        } else {
            toggleSelectionBtn.innerHTML = '▶️ Start Selection Mode';
            toggleSelectionBtn.classList.remove('active');
            showStatus('Selection mode stopped', 'success');
        }
    } catch (error) {
        showStatus('Error toggling selection mode: ' + error.message, 'error');
    }
});

viewAllSitesBtn.addEventListener('click', async () => {
    await loadAllSites();
    displayAllSites();
    allSitesModal.style.display = 'flex';
});

closeModalBtn.addEventListener('click', () => {
    allSitesModal.style.display = 'none';
});

allSitesModal.addEventListener('click', (e) => {
    if (e.target === allSitesModal) {
        allSitesModal.style.display = 'none';
    }
});

function displayAllSites() {
    allSitesList.innerHTML = '';

    const siteKeys = Object.keys(allSites);

    if (siteKeys.length === 0) {
        allSitesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">🌐</div>
                <div class="empty-state-text">No cleaned sites yet.<br>Start hiding elements on any website!</div>
            </div>
        `;
        return;
    }

    siteKeys.forEach(site => {
        const elements = allSites[site];
        const item = document.createElement('div');
        item.className = 'site-item';

        const info = document.createElement('div');
        info.className = 'site-info';

        const siteName = document.createElement('div');
        siteName.className = 'site-name';
        siteName.textContent = site;

        const siteCount = document.createElement('div');
        siteCount.className = 'site-count';
        siteCount.textContent = `${elements.length} hidden element${elements.length > 1 ? 's' : ''}`;

        info.appendChild(siteName);
        info.appendChild(siteCount);

        const resetBtn = document.createElement('button');
        resetBtn.className = 'site-reset-btn';
        resetBtn.textContent = 'Reset';
        resetBtn.onclick = async () => {
            if (confirm(`Reset all hidden elements for ${site}?\n\nThis will show all hidden elements and remove them from storage.`)) {
                try {
                    // Remove from storage
                    await chrome.storage.local.remove(site);
                    delete allSites[site];

                    // If it's the current site, reload the page
                    if (site === currentUrl) {
                        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                        chrome.tabs.reload(tab.id);
                        await loadSavedHiddenElements();
                        displayHiddenElements();
                    }

                    displayAllSites();
                    showStatus(`✓ Reset ${site}`, 'success');
                } catch (error) {
                    showStatus(`✗ Error resetting ${site}`, 'error');
                }
            }
        };

        item.appendChild(info);
        item.appendChild(resetBtn);
        allSitesList.appendChild(item);
    });
}

resetAllBtn.addEventListener('click', async () => {
    const siteCount = Object.keys(allSites).length;
    if (siteCount === 0) {
        showStatus('No sites to reset', 'info');
        return;
    }

    if (confirm(`⚠️ Reset ALL ${siteCount} cleaned sites?\n\nThis will:\n• Remove all hidden elements from ALL websites\n• Cannot be undone\n\nAre you sure?`)) {
        try {
            await chrome.storage.local.clear();
            allSites = {};
            displayAllSites();

            // Reload current page
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            chrome.tabs.reload(tab.id);

            await loadSavedHiddenElements();
            displayHiddenElements();

            showStatus('✓ All sites reset', 'success');
            allSitesModal.style.display = 'none';
        } catch (error) {
            showStatus('✗ Error resetting all sites', 'error');
        }
    }
});

async function saveHiddenElements() {
    const hiddenArray = Array.from(hiddenElementsSet).map(key => parseElementKey(key));
    await chrome.storage.local.set({ [currentUrl]: hiddenArray });
    updateCountBadge();
    displayHiddenElements();
}

function displayHiddenElements() {
    hiddenList.innerHTML = '';

    if (hiddenElementsSet.size === 0) {
        return;
    }

    // Get full data from storage to display properly
    chrome.storage.local.get([currentUrl], (result) => {
        const savedElements = result[currentUrl] || [];

        savedElements.forEach(savedItem => {
            const elementKey = getElementKey(savedItem);

            if (!hiddenElementsSet.has(elementKey)) return;

            const item = document.createElement('div');
            item.className = 'element-item';

            const label = document.createElement('div');
            label.className = 'element-label';

            // Build a nice display label
            let displayText = savedItem.tagName.toLowerCase();
            if (savedItem.id) displayText += `#${savedItem.id}`;
            if (savedItem.classes && savedItem.classes.length) {
                displayText += `.${savedItem.classes.slice(0, 2).join('.')}`;
            }
            if (savedItem.text) {
                displayText += ` — ${savedItem.text.substring(0, 40)}...`;
            }

            label.textContent = displayText;

            const showBtn = document.createElement('button');
            showBtn.className = 'show-btn';
            showBtn.textContent = 'Show';

            showBtn.onclick = async () => {
                showBtn.disabled = true;
                showBtn.textContent = 'Showing...';

                try {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

                    // First remove from storage
                    hiddenElementsSet.delete(elementKey);

                    const updatedElements = savedElements.filter(el =>
                        getElementKey(el) !== elementKey
                    );
                    await chrome.storage.local.set({ [currentUrl]: updatedElements });

                    updateCountBadge();

                    // Then show the element - FIXED: Added xpath parameter
                    await sendMessageToTab(tab.id, {
                        action: 'show-element',
                        tagName: savedItem.tagName,
                        id: savedItem.id,
                        classes: savedItem.classes,
                        uniqueId: savedItem.uniqueId,
                        xpath: savedItem.xpath
                    });

                    displayHiddenElements();
                    showStatus('✓ Element shown', 'success');

                } catch (err) {
                    console.error('Error showing element:', err);
                    showBtn.disabled = false;
                    showBtn.textContent = 'Show';
                    showStatus('✗ ' + (err.message || err), 'error');
                }
            };

            item.appendChild(label);
            item.appendChild(showBtn);
            hiddenList.appendChild(item);
        });
    });
}

clearAllBtn.addEventListener('click', async () => {
    if (hiddenElementsSet.size === 0) {
        showStatus('No hidden elements to clear', 'error');
        return;
    }

    const confirmed = confirm(`Clear all ${hiddenElementsSet.size} hidden elements for ${currentUrl}?`);
    if (!confirmed) return;

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // Get all saved elements
        const result = await new Promise(resolve => {
            chrome.storage.local.get([currentUrl], resolve);
        });

        const savedElements = result[currentUrl] || [];

        // Show all hidden elements - FIXED: Added xpath parameter
        for (const item of savedElements) {
            await sendMessageToTab(tab.id, {
                action: 'show-element',
                tagName: item.tagName,
                id: item.id,
                classes: item.classes,
                uniqueId: item.uniqueId,
                xpath: item.xpath
            });
        }

        // Clear storage
        hiddenElementsSet.clear();
        await chrome.storage.local.set({ [currentUrl]: [] });

        updateCountBadge();
        displayHiddenElements();
        showStatus('✓ All elements shown and cleared', 'success');

    } catch (err) {
        showStatus('✗ Error clearing elements: ' + err.message, 'error');
    }
});

async function sendMessageToTab(tabId, message) {
    return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
                // Content script might not be loaded, ignore the error
                console.log('Content script not responding (this is okay):', chrome.runtime.lastError.message);
                return reject(new Error(chrome.runtime.lastError.message));
            }
            resolve(response);
        });
    });
}

function showStatus(message, type) {
    status.textContent = message;
    status.className = 'status ' + type;
    setTimeout(() => {
        status.textContent = '';
        status.className = '';
    }, 3000);
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'element-hidden') {
        // An element was hidden in selection mode
        loadSavedHiddenElements().then(() => {
            displayHiddenElements();
            showStatus('Element hidden', 'success');
        });
    } else if (request.action === 'selection-mode-off') {
        // User pressed ESC
        selectionModeActive = false;
        toggleSelectionBtn.innerHTML = '▶️ Start Selection Mode';
        toggleSelectionBtn.classList.remove('active');
    }
});