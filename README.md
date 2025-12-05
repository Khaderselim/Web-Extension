# Clean My Web 

A lightweight Chrome extension that lets you hide unwanted elements on any website. Perfect for removing distracting ads, annoying popups, clutter, or any content you don't want to see.

## Features

- **Visual Element Selection** - Click any element on any webpage to hide it
- **Persistent Storage** - Hidden elements stay hidden across sessions
- **Per-Site Management** - Different hiding rules for different websites
- **Easy Restoration** - Unhide individual elements or reset entire sites
- **Clean Interface** - Simple, intuitive popup design
- **No Account Required** - Everything stored locally in your browser

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the folder containing the extension files
6. The extension icon will appear in your Chrome toolbar

## How to Use

### Hiding Elements

1. **Click the extension icon** in your Chrome toolbar
2. **Click "Start Selection Mode"** - a purple indicator will appear on the page
3. **Hover over any element** you want to hide - it will be highlighted with a blue outline
4. **Click the element** - it will immediately disappear
5. **Press ESC** or click "Stop Selection Mode" when done

The element will stay hidden every time you visit that website!

### Managing Hidden Elements

**View Hidden Elements:**
- Open the extension popup
- See all hidden elements for the current site
- Each element shows its HTML tag and identifier

**Restore a Single Element:**
- Find the element in the "Hidden Elements" list
- Click the green "Show" button next to it
- The element reappears immediately

**Clear All Elements on Current Site:**
- Click "Clear All Hidden Elements"
- Confirm the action
- All hidden elements on this site will be shown and removed from storage

### Managing Multiple Sites

**View All Cleaned Sites:**
- Click "View All Cleaned Sites" in the popup
- See a list of every website you've customized
- Shows how many elements are hidden on each site

**Reset a Specific Site:**
- In the "All Cleaned Sites" view
- Click "Reset" next to any site
- Confirms before removing all rules for that site

**Reset Everything:**
- In the "All Cleaned Sites" view
- Click "Reset All Sites"
- Confirms before clearing all data from all websites

## Tips & Tricks

- **Be Specific:** Click the exact element you want to hide (e.g., click the ad container, not the page background)
- **Use the Badge:** The floating badge shows what element you're hovering over
- **Undo Mistakes:** Immediately restore accidentally hidden elements from the popup
- **Clean Navigation:** Hide persistent headers, footers, or sidebars that take up screen space
- **Remove Distractions:** Hide comment sections, recommendation widgets, or notification banners

## Technical Details

**Storage:**
- Uses Chrome's local storage API
- Data is stored per-domain
- Uses XPath for reliable element identification
- Includes fallback to ID/class selectors

**Permissions:**
- `storage` - Save your hidden elements preferences
- `activeTab` - Access the current page to hide/show elements
- `scripting` - Inject the selection mode interface

**Browser Support:**
- Chrome (Manifest V3)
- Edge (Chromium-based)

## Privacy

- **No data collection** - Everything stays on your device
- **No external servers** - No network requests
- **No tracking** - Your browsing habits are private
- **Open source** - Inspect the code yourself

## Troubleshooting

**Elements reappear after page reload:**
- This can happen if the website's structure changes
- Simply hide the element again to update the selector

**Selection mode won't activate:**
- Refresh the page and try again
- Some protected pages (chrome://, browser settings) cannot be modified

**Extension not working:**
- Check that it's enabled in `chrome://extensions/`
- Refresh the page after installing the extension
- Check the browser console for error messages

## File Structure

```
clean-my-web/
├── manifest.json      # Extension configuration
├── content.js         # Main logic for hiding elements
├── popup.html         # Extension popup interface
├── popup.js           # Popup functionality
└── README.md          # This file
```

## Contributing

Found a bug or want to suggest a feature? Feel free to:
- Open an issue
- Submit a pull request
- Fork and modify for your needs

## License

Free to use and modify for personal use.

---
