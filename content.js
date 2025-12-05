// Wrap everything in an IIFE to prevent redeclaration errors
(function() {
    'use strict';

    // Check if already initialized
    if (window.cmwInitialized) {
        console.log('Clean My Web: Already initialized, skipping');
        return;
    }
    window.cmwInitialized = true;

    let selectionMode = false;
    let isDisabled = false;
    let currentHoveredElement = null;
    let badge = null;
    let modeIndicator = null;

    function injectStyles() {
        if (document.getElementById('cmw-styles')) return;

        const style = document.createElement('style');
        style.id = 'cmw-styles';
        style.textContent = `
        .cmw-hidden-element {
            display: none !important;
        }
        .cmw-hover-highlight {
            outline: 3px solid #667eea !important;
            outline-offset: 2px !important;
            background: rgba(102, 126, 234, 0.1) !important;
            cursor: crosshair !important;
            transition: all 0.1s ease !important;
        }
        @keyframes cmw-slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
        (document.head || document.documentElement).appendChild(style);
    }

    (function autoHideElements() {
        const url = window.location.hostname;

        console.log('Clean My Web: Initializing on', url);
        injectStyles();

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', applyHiddenElements);
        } else {
            applyHiddenElements();
        }

        function applyHiddenElements() {
            chrome.storage.local.get([url, `${url}_disabled`], (result) => {
                isDisabled = result[`${url}_disabled`] || false;

                console.log('Clean My Web: Disabled?', isDisabled);
                console.log('Clean My Web: Found saved elements:', result[url]);

                if (!isDisabled && result[url] && result[url].length > 0) {
                    console.log('Clean My Web: Applying', result[url].length, 'hidden elements');

                    // Small delay to ensure DOM is fully rendered
                    setTimeout(() => {
                        result[url].forEach(item => {
                            hideElementByData(item);
                        });
                    }, 100);
                }
            });
        }
    })();

    function hideElementByData(item) {
        console.log('Clean My Web: Attempting to hide element:', item);

        // First check if this element already has the unique ID attribute
        if (item.uniqueId) {
            const existingEl = document.querySelector(`[data-cmw-unique-id="${item.uniqueId}"]`);
            if (existingEl) {
                console.log('Clean My Web: Found existing element with unique ID');
                existingEl.classList.add('cmw-hidden-element');
                return;
            }
        }

        // Try using XPath
        if (item.xpath) {
            try {
                const result = document.evaluate(
                    item.xpath,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                );

                const element = result.singleNodeValue;

                if (element) {
                    console.log('Clean My Web: Found element using XPath:', item.xpath);
                    if (item.uniqueId) {
                        element.setAttribute('data-cmw-unique-id', item.uniqueId);
                    }
                    element.classList.add('cmw-hidden-element');
                    return;
                } else {
                    console.warn('Clean My Web: XPath found no elements:', item.xpath);
                }
            } catch (error) {
                console.warn('Clean My Web: Invalid XPath:', item.xpath, error);
            }
        }

        // Fallback to ID or classes (for backwards compatibility)
        let selector = null;

        if (item.id) {
            selector = `${item.tagName}#${item.id}`;
        } else if (item.classes && item.classes.length > 0) {
            selector = `${item.tagName}.${item.classes.join('.')}`;
        } else {
            console.warn('Clean My Web: Cannot reliably hide element without XPath, ID, or classes:', item);
            return;
        }

        console.log('Clean My Web: Hiding selector:', selector);

        try {
            const elements = document.querySelectorAll(selector);
            console.log('Clean My Web: Found', elements.length, 'elements matching', selector);

            if (elements.length === 0) {
                console.warn('Clean My Web: No elements found for selector:', selector);
                return;
            }

            elements.forEach(el => {
                if (item.uniqueId && !el.hasAttribute('data-cmw-unique-id')) {
                    el.setAttribute('data-cmw-unique-id', item.uniqueId);
                }
                el.classList.add('cmw-hidden-element');
                console.log('Clean My Web: Successfully hid element');
            });
        } catch (error) {
            console.error('Clean My Web: Error hiding element:', error);
        }
    }

    function showElementByData(item) {
        console.log('Clean My Web: Attempting to show element:', item);

        // First try to find by unique ID
        if (item.uniqueId) {
            const existingEl = document.querySelector(`[data-cmw-unique-id="${item.uniqueId}"]`);
            if (existingEl) {
                console.log('Clean My Web: Found element with unique ID, showing it');
                existingEl.classList.remove('cmw-hidden-element');
                existingEl.removeAttribute('data-cmw-unique-id');
                return;
            }
        }

        // Try using XPath
        if (item.xpath) {
            try {
                const result = document.evaluate(
                    item.xpath,
                    document,
                    null,
                    XPathResult.FIRST_ORDERED_NODE_TYPE,
                    null
                );

                const element = result.singleNodeValue;

                if (element) {
                    console.log('Clean My Web: Found element using XPath:', item.xpath);
                    element.classList.remove('cmw-hidden-element');
                    element.removeAttribute('data-cmw-unique-id');
                    return;
                } else {
                    console.warn('Clean My Web: XPath found no elements:', item.xpath);
                }
            } catch (error) {
                console.warn('Clean My Web: Invalid XPath:', item.xpath, error);
            }
        }

        // Fallback to ID or classes (for backwards compatibility)
        let selector = null;

        if (item.id) {
            selector = `${item.tagName}#${item.id}`;
        } else if (item.classes && item.classes.length > 0) {
            selector = `${item.tagName}.${item.classes.join('.')}`;
        } else {
            console.warn('Clean My Web: Cannot reliably show element without XPath, ID, or classes:', item);
            return;
        }

        console.log('Clean My Web: Showing selector:', selector);

        try {
            const elements = document.querySelectorAll(selector);
            console.log('Clean My Web: Found', elements.length, 'elements to show');

            if (elements.length === 0) {
                console.warn('Clean My Web: No elements found for selector:', selector);
                return;
            }

            elements.forEach(el => {
                el.classList.remove('cmw-hidden-element');
                if (el.hasAttribute('data-cmw-unique-id')) {
                    el.removeAttribute('data-cmw-unique-id');
                }
                console.log('Clean My Web: Successfully showed element');
            });
        } catch (error) {
            console.error('Clean My Web: Error showing element:', error);
        }
    }

    function createBadge() {
        if (badge) return badge;

        badge = document.createElement('div');
        badge.className = 'cmw-element-badge';
        badge.style.cssText = `
        position: fixed !important;
        background: rgba(0, 0, 0, 0.85) !important;
        color: white !important;
        padding: 6px 12px !important;
        border-radius: 6px !important;
        font-family: 'Courier New', monospace !important;
        font-size: 12px !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
        display: none !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3) !important;
    `;
        document.body.appendChild(badge);
        return badge;
    }

    function updateBadge(element, x, y) {
        if (!badge) createBadge();

        const tagName = element.tagName.toLowerCase();
        const id = element.id ? `#${element.id}` : '';
        const classes = element.classList.length ?
            `.${Array.from(element.classList).filter(c => !c.startsWith('cmw-')).slice(0, 2).join('.')}` : '';

        badge.textContent = `${tagName}${id}${classes}`;
        badge.style.display = 'block';
        badge.style.left = (x + 15) + 'px';
        badge.style.top = (y + 15) + 'px';
    }

    function hideBadge() {
        if (badge) {
            badge.style.display = 'none';
        }
    }

    function createModeIndicator() {
        if (modeIndicator) return;

        modeIndicator = document.createElement('div');
        modeIndicator.className = 'cmw-mode-indicator';
        modeIndicator.style.cssText = `
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
        color: white !important;
        padding: 16px 20px !important;
        border-radius: 12px !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif !important;
        font-size: 14px !important;
        z-index: 2147483647 !important;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
        display: flex !important;
        align-items: center !important;
        gap: 12px !important;
        pointer-events: none !important;
        animation: cmw-slideIn 0.3s ease-out !important;
    `;

        modeIndicator.innerHTML = `
        <div style="font-size: 20px;">✂️</div>
        <div>
            <div style="font-weight: 600; margin-bottom: 2px;">Selection Mode Active</div>
            <div style="font-size: 12px; opacity: 0.9;">Click elements to hide • ESC to exit</div>
        </div>
    `;

        document.body.appendChild(modeIndicator);
        console.log('Clean My Web: Mode indicator created');
    }

    function removeModeIndicator() {
        if (modeIndicator) {
            modeIndicator.remove();
            modeIndicator = null;
        }
    }

    function enableSelectionMode() {
        console.log('Clean My Web: Enabling selection mode');
        selectionMode = true;
        injectStyles();
        createBadge();
        createModeIndicator();
        document.body.style.cursor = 'crosshair';
    }

    function disableSelectionMode() {
        console.log('Clean My Web: Disabling selection mode');
        selectionMode = false;
        hideBadge();
        removeModeIndicator();
        document.body.style.cursor = '';

        if (currentHoveredElement) {
            currentHoveredElement.classList.remove('cmw-hover-highlight');
            currentHoveredElement = null;
        }
    }

    document.addEventListener('mousemove', (e) => {
        if (!selectionMode) return;

        const element = e.target;

        if (element.classList.contains('cmw-mode-indicator') ||
            element.classList.contains('cmw-element-badge') ||
            element.closest('.cmw-mode-indicator')) {
            return;
        }

        if (element === currentHoveredElement) {
            updateBadge(element, e.clientX, e.clientY);
            return;
        }

        if (currentHoveredElement) {
            currentHoveredElement.classList.remove('cmw-hover-highlight');
        }

        currentHoveredElement = element;
        element.classList.add('cmw-hover-highlight');
        updateBadge(element, e.clientX, e.clientY);
    }, true);

    document.addEventListener('click', (e) => {
        if (!selectionMode) return;

        if (e.target.classList.contains('cmw-mode-indicator') ||
            e.target.classList.contains('cmw-element-badge') ||
            e.target.closest('.cmw-mode-indicator')) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const element = e.target;

        const uniqueId = 'cmw-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        element.setAttribute('data-cmw-unique-id', uniqueId);

        // Generate XPath for the element
        const getXPath = (el) => {
            if (el.id) {
                return `//*[@id="${el.id}"]`;
            }

            if (el === document.body) {
                return '/html/body';
            }

            let path = '';
            let current = el;

            while (current && current !== document.body) {
                let index = 1;
                let sibling = current.previousElementSibling;

                while (sibling) {
                    if (sibling.tagName === current.tagName) {
                        index++;
                    }
                    sibling = sibling.previousElementSibling;
                }

                const tagName = current.tagName.toLowerCase();
                path = `/${tagName}[${index}]${path}`;
                current = current.parentElement;
            }

            return `/html/body${path}`;
        };

        const elementData = {
            tagName: element.tagName,
            id: element.id || null,
            classes: element.classList ?
                Array.from(element.classList).filter(c => !c.startsWith('cmw-')) : [],
            text: (element.textContent || '').trim().slice(0, 100),
            uniqueId: uniqueId,
            xpath: getXPath(element) // Store XPath
        };

        console.log('Clean My Web: Hiding element', elementData);
        console.log('Clean My Web: XPath:', elementData.xpath);

        element.classList.add('cmw-hidden-element');

        const url = window.location.hostname;
        chrome.storage.local.get([url], (result) => {
            const hiddenElements = result[url] || [];

            const exists = hiddenElements.some(item => item.uniqueId === uniqueId);

            if (!exists) {
                hiddenElements.push(elementData);
                chrome.storage.local.set({ [url]: hiddenElements }, () => {
                    console.log('Clean My Web: Element saved to storage', elementData);
                });
            }
        });

        // Send message to popup if it's open
        chrome.runtime.sendMessage({
            action: 'element-hidden',
            element: elementData
        }).catch(() => {});

        if (currentHoveredElement) {
            currentHoveredElement.classList.remove('cmw-hover-highlight');
        }
        currentHoveredElement = null;
    }, true);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && selectionMode) {
            disableSelectionMode();
            chrome.runtime.sendMessage({ action: 'selection-mode-off' }).catch(() => {});
        }
    });

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        console.log('Clean My Web: Received message', request);

        if (request.action === 'toggle-selection-mode') {
            if (selectionMode) {
                disableSelectionMode();
            } else {
                enableSelectionMode();
            }
            sendResponse({ active: selectionMode });
        }
        else if (request.action === 'hide-element') {
            hideElementByData(request);
            sendResponse({ success: true });
        }
        else if (request.action === 'show-element') {
            showElementByData(request);
            sendResponse({ success: true });
        }
        else if (request.action === 'reload-page') {
            window.location.reload();
            sendResponse({ success: true });
        }

        return true;
    });

})(); // End of IIFE