/**
 * TileMate - Core Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const roomsContainer = document.getElementById('rooms-container');
    const addRoomBtn = document.getElementById('add-room-btn');
    const roomTemplate = document.getElementById('room-template');

    // Summary Elements
    const totalAreaEl = document.getElementById('total-area');
    const totalAdhesiveEl = document.getElementById('total-adhesive');
    const adhesiveBagsEl = document.getElementById('adhesive-bags');
    const totalGroutEl = document.getElementById('total-grout');

    // Customer Elements
    const customerToggle = document.getElementById('customer-toggle');
    const customerContent = document.getElementById('customer-content');
    const customerHeader = document.getElementById('customer-header');
    const customerBadge = document.getElementById('customer-badge');
    const customerNameInput = document.getElementById('customer-name');
    const customerAddressInput = document.getElementById('customer-address');
    const customerPhoneInput = document.getElementById('customer-phone');
    const customerEmailInput = document.getElementById('customer-email');
    const clearCustomerBtn = document.getElementById('clear-customer-btn');

    // Share Elements
    const shareWhatsAppBtn = document.getElementById('share-whatsapp');
    const shareEmailBtn = document.getElementById('share-email');
    const shareCopyBtn = document.getElementById('share-copy');
    const copyFeedback = document.getElementById('copy-feedback');

    // Settings Elements
    const settingsPanel = document.getElementById('settings-panel');
    const settingsToggle = document.getElementById('settings-toggle');
    const closeSettingsBtn = document.getElementById('close-settings');

    // Settings Inputs
    const themeSelect = document.getElementById('theme-select');
    const trowelSelect = document.getElementById('trowel-size');
    const bagSizeInput = document.getElementById('adhesive-bag-size');
    const boxAreaInput = document.getElementById('box-area');
    const wastageInput = document.getElementById('wastage-percent');
    const tileLenInput = document.getElementById('tile-length');
    const tileWidInput = document.getElementById('tile-width');
    const tileThickInput = document.getElementById('tile-thickness');
    const jointWidInput = document.getElementById('joint-width');

    // --- State & Config ---
    let config = {
        adhesiveRate: parseFloat(trowelSelect.value) || 4.5,
        bagSize: parseFloat(bagSizeInput.value) || 20,
        grout: {
            l: parseFloat(tileLenInput.value) || 600,
            w: parseFloat(tileWidInput.value) || 300,
            d: parseFloat(tileThickInput.value) || 10,
            j: parseFloat(jointWidInput.value) || 3,
            density: 1.8
        }
    };

    // --- Initialization ---
    // Add one default room
    addRoom();

    // Load customer details from localStorage
    loadCustomerDetails();

    // Initialize address autocomplete
    initAddressAutocomplete();

    // --- Event Listeners ---
    addRoomBtn.addEventListener('click', addRoom);


    // Global delegation for inputs and room actions
    roomsContainer.addEventListener('input', (e) => {
        const target = e.target;

        // Handle Number Inputs (Dims) -> Just update room area text, do NOT update globals yet
        if (target.matches('input[type="number"]')) {
            const roomCard = target.closest('.room-card');
            updateRoomCalculation(roomCard);
            // updateTotals(); // DISABLED auto-update
            hideTotals();     // Hide totals if something changes
        }

        // Handle Type Radio (Wall/Floor)
        if (target.matches('.type-radio')) {
            const roomCard = target.closest('.room-card');
            const typeValue = target.value;

            // Set class on room card for CSS-based toggling
            if (typeValue === 'floor') {
                roomCard.classList.remove('type-wall');
                roomCard.classList.add('type-floor');

                // Uncheck wall options
                roomCard.querySelectorAll('.gr-wall input').forEach(i => i.checked = false);
            } else {
                roomCard.classList.remove('type-floor');
                roomCard.classList.add('type-wall');

                // Uncheck floor options
                roomCard.querySelectorAll('.gr-floor input').forEach(i => i.checked = false);
            }
            hideTotals();
        }

        // Handle Substrate Checkboxes
        if (target.matches('.sub-check')) {
            hideTotals();
        }
    });

    roomsContainer.addEventListener('click', (e) => {
        const target = e.target;
        const roomCard = target.closest('.room-card');

        // Remove Room
        if (target.closest('.remove-room-btn')) {
            roomCard.style.opacity = '0';
            setTimeout(() => {
                roomCard.remove();
                hideTotals();
            }, 200);
            return;
        }

        // Add Area Row
        if (target.classList.contains('add-area-row-btn')) {
            addMeasurementRow(roomCard);
        }

        // Remove Area Row
        if (target.closest('.remove-row-btn')) {
            const row = target.closest('.area-row-wrapper'); // Updated class
            const list = roomCard.querySelector('.area-list');
            if (list.children.length > 1) {
                row.remove();
                updateRoomCalculation(roomCard);
                hideTotals();
            } else {
                row.querySelectorAll('input').forEach(i => i.value = '');
                updateRoomCalculation(roomCard);
                hideTotals();
            }
        }
    });

    // Calculate Button
    const calculateBtn = document.getElementById('calculate-btn');
    const summaryFooter = document.getElementById('summary-footer');

    calculateBtn.addEventListener('click', () => {
        updateTotals();
        updateCustomerSummary();
        summaryFooter.classList.remove('hidden');
        // Scroll to bottom
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });

    function hideTotals() {
        summaryFooter.classList.add('hidden');
    }

    // Settings Events
    const toggleSettings = () => settingsPanel.classList.toggle('hidden');
    settingsToggle.addEventListener('click', toggleSettings);
    closeSettingsBtn.addEventListener('click', toggleSettings);

    // Theme switching
    if (themeSelect) {
        // Load saved theme
        const savedTheme = localStorage.getItem('tileMateTheme') || 'default';
        themeSelect.value = savedTheme;
        document.body.setAttribute('data-theme', savedTheme);

        themeSelect.addEventListener('change', (e) => {
            const theme = e.target.value;
            document.body.setAttribute('data-theme', theme);
            localStorage.setItem('tileMateTheme', theme);
        });
    }

    const updateConfig = () => {
        config.adhesiveRate = parseFloat(trowelSelect.value);
        config.bagSize = parseFloat(bagSizeInput.value);
        config.grout.l = parseFloat(tileLenInput.value);
        config.grout.w = parseFloat(tileWidInput.value);
        config.grout.d = parseFloat(tileThickInput.value);
        config.grout.j = parseFloat(jointWidInput.value);
        // If config changes, hide totals until recalc
        hideTotals();
    };

    [trowelSelect, bagSizeInput, tileLenInput, tileWidInput, tileThickInput, jointWidInput].forEach(el => {
        el.addEventListener('input', updateConfig);
    });

    // Customer Details Events
    customerHeader.addEventListener('click', toggleCustomerSection);

    [customerNameInput, customerAddressInput, customerPhoneInput, customerEmailInput].forEach(input => {
        input.addEventListener('input', () => {
            saveCustomerDetails();
            updateCustomerBadge();
        });
    });

    clearCustomerBtn.addEventListener('click', () => {
        if (confirm('Clear all customer details?')) {
            customerNameInput.value = '';
            customerAddressInput.value = '';
            customerPhoneInput.value = '';
            customerEmailInput.value = '';
            saveCustomerDetails();
            updateCustomerBadge();
        }
    });

    // Share Button Events
    shareWhatsAppBtn.addEventListener('click', shareViaWhatsApp);
    shareEmailBtn.addEventListener('click', shareViaEmail);
    shareCopyBtn.addEventListener('click', copyToClipboard);

    // --- Functions ---

    function addRoom() {
        const uniqueId = Date.now() + Math.random().toString(36).substr(2, 9);
        const clone = roomTemplate.content.cloneNode(true);
        const card = clone.querySelector('.room-card');

        // Initial Type State (Floor)
        card.classList.add('type-floor');

        // Update Radio Names
        card.querySelectorAll('input[name="room-type-UUID"]').forEach(r => {
            r.name = `room-type-${uniqueId}`;
        });

        roomsContainer.appendChild(card);
        addMeasurementRow(card);
    }

    function addMeasurementRow(card) {
        const rowTemplate = document.getElementById('area-row-template');
        const clone = rowTemplate.content.cloneNode(true);
        card.querySelector('.area-list').appendChild(clone);
    }

    function updateRoomCalculation(card) {
        let area = 0;
        const rows = card.querySelectorAll('.area-row-wrapper'); // Updated class
        rows.forEach(row => {
            const len = parseFloat(row.querySelector('.length').value) || 0;
            const wid = parseFloat(row.querySelector('.width').value) || 0;
            area += (len * wid);

            // Store area on the row for substrate calc (optional, but convenient)
            row.dataset.rowArea = (len * wid);
        });

        card.querySelector('.room-area-val').textContent = area.toFixed(2);
        card.dataset.area = area;
    }

    function updateTotals() {
        const cards = document.querySelectorAll('.room-card');
        let totalArea = 0;
        let totalBoard = 0;
        let totalMembrane = 0;
        let totalTanking = 0;

        cards.forEach(card => {
            // Re-run room calc to be sure
            updateRoomCalculation(card);

            const area = parseFloat(card.dataset.area) || 0;
            totalArea += area;

            // Iterate rows for granular substrates
            const rows = card.querySelectorAll('.area-row-wrapper');
            rows.forEach(row => {
                const rowArea = parseFloat(row.dataset.rowArea) || 0;
                if (rowArea <= 0) return;

                const isBoard = row.querySelector('.opt-board')?.checked;
                const isMembrane = row.querySelector('.opt-membrane')?.checked;
                const isTanking = row.querySelector('.opt-tanking')?.checked;

                if (isBoard) totalBoard += rowArea;
                if (isMembrane) totalMembrane += rowArea;
                if (isTanking) totalTanking += rowArea;
            });
        });

        // 1. Total Area
        totalAreaEl.textContent = totalArea.toFixed(2) + ' m²';

        // 2. Tile Boxes (with wastage)
        const boxArea = parseFloat(boxAreaInput.value) || 1.44;
        const wastagePercent = parseFloat(wastageInput.value) || 10;
        const wastageMultiplier = 1 + (wastagePercent / 100);
        const tilesNeeded = totalArea * wastageMultiplier;
        const boxesNeeded = Math.ceil(tilesNeeded / boxArea);

        document.getElementById('total-boxes').textContent = boxesNeeded + ' Boxes';
        document.getElementById('total-tiles-area').textContent = tilesNeeded.toFixed(2) + ' m²';
        document.getElementById('box-count-detail').textContent = wastagePercent + '% waste';

        // 3. Adhesive (Weight + Bags)
        const safetyMargin = 1.10;
        const totalAdhesiveKg = totalArea * config.adhesiveRate * safetyMargin;
        const totalBags = Math.ceil(totalAdhesiveKg / config.bagSize);

        totalAdhesiveEl.textContent = Math.ceil(totalAdhesiveKg) + ' kg';
        adhesiveBagsEl.textContent = `(${totalBags} bags)`;

        // 3. Grout
        const { l, w, d, j, density } = config.grout;
        let groutRate = 0;
        if (l > 0 && w > 0) {
            groutRate = ((l + w) / (l * w)) * j * d * density;
        }
        const totalGroutKg = totalArea * groutRate * safetyMargin;
        totalGroutEl.textContent = totalGroutKg.toFixed(1) + ' kg';

        // 4. Substrates Summary
        const subSection = document.getElementById('substrates-summary');

        const boardEl = document.getElementById('total-board');
        const countBoardEl = document.getElementById('count-board');

        const memEl = document.getElementById('total-membrane');

        const tankEl = document.getElementById('total-tanking');
        const countTankEl = document.getElementById('count-tanking');

        // Only show if any are selected
        if (totalBoard > 0 || totalMembrane > 0 || totalTanking > 0) {
            subSection.classList.remove('hidden');
        } else {
            subSection.classList.add('hidden');
        }

        // Boards: 1200x600 = 0.72m2
        const boardArea = 0.72;
        const boardCount = Math.ceil(totalBoard / boardArea);

        boardEl.parentElement.style.display = totalBoard > 0 ? 'block' : 'none';
        boardEl.parentElement.querySelector('strong').textContent = totalBoard.toFixed(2) + ' m²';
        if (countBoardEl) countBoardEl.textContent = totalBoard > 0 ? `(${boardCount} boards)` : '';

        memEl.parentElement.style.display = totalMembrane > 0 ? 'block' : 'none';
        memEl.parentElement.querySelector('strong').textContent = totalMembrane.toFixed(2) + ' m²';

        // Tanking: 4m2 coverage
        const tankingCoverage = 4.0;
        const tankingCount = Math.ceil(totalTanking / tankingCoverage);

        tankEl.parentElement.style.display = totalTanking > 0 ? 'block' : 'none';
        tankEl.parentElement.querySelector('strong').textContent = totalTanking.toFixed(2) + ' m²';
        if (countTankEl) countTankEl.textContent = totalTanking > 0 ? `(${tankingCount} kits)` : '';
    }

    // --- Customer Details Functions ---

    function toggleCustomerSection() {
        customerContent.classList.toggle('collapsed');
        customerToggle.classList.toggle('collapsed');
    }

    function saveCustomerDetails() {
        const customerData = {
            name: customerNameInput.value,
            address: customerAddressInput.value,
            phone: customerPhoneInput.value,
            email: customerEmailInput.value
        };
        localStorage.setItem('tileMateCustomer', JSON.stringify(customerData));
    }

    function loadCustomerDetails() {
        const saved = localStorage.getItem('tileMateCustomer');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                customerNameInput.value = data.name || '';
                customerAddressInput.value = data.address || '';
                customerPhoneInput.value = data.phone || '';
                customerEmailInput.value = data.email || '';
                updateCustomerBadge();
            } catch (e) {
                console.error('Failed to load customer details:', e);
            }
        }
    }

    function updateCustomerBadge() {
        const hasData = customerNameInput.value || customerAddressInput.value ||
            customerPhoneInput.value || customerEmailInput.value;
        if (hasData) {
            customerBadge.classList.remove('hidden');
        } else {
            customerBadge.classList.add('hidden');
        }
    }

    function updateCustomerSummary() {
        const customerSummary = document.getElementById('customer-summary');
        const name = customerNameInput.value.trim();
        const address = customerAddressInput.value.trim();
        const phone = customerPhoneInput.value.trim();
        const email = customerEmailInput.value.trim();

        // Only show if at least one field is filled
        if (name || address || phone || email) {
            document.getElementById('customer-summary-name').textContent = name || 'Customer';
            document.getElementById('customer-summary-address').textContent = address;
            document.getElementById('customer-summary-phone').textContent = phone;
            document.getElementById('customer-summary-email').textContent = email;
            customerSummary.classList.remove('hidden');
        } else {
            customerSummary.classList.add('hidden');
        }
    }

    // --- Share Functions ---

    function generateQuoteText() {
        const date = new Date().toLocaleDateString('en-GB');
        const name = customerNameInput.value.trim() || 'Customer';
        const address = customerAddressInput.value.trim();
        const phone = customerPhoneInput.value.trim();
        const email = customerEmailInput.value.trim();

        // Get current totals
        const totalArea = totalAreaEl.textContent;
        const totalBoxes = document.getElementById('total-boxes').textContent;
        const totalTilesArea = document.getElementById('total-tiles-area').textContent;
        const adhesive = totalAdhesiveEl.textContent;
        const adhesiveBags = adhesiveBagsEl.textContent;
        const grout = totalGroutEl.textContent;

        // Build quote text
        let quote = `═══════════════════════════\n`;
        quote += `   TILING QUOTE\n`;
        quote += `═══════════════════════════\n\n`;

        // Customer details
        quote += `CUSTOMER: ${name}\n`;
        if (address) quote += `ADDRESS: ${address}\n`;
        if (phone) quote += `PHONE: ${phone}\n`;
        if (email) quote += `EMAIL: ${email}\n`;
        quote += `\n`;

        // Room breakdown
        const cards = document.querySelectorAll('.room-card');
        if (cards.length > 0) {
            quote += `ROOM BREAKDOWN:\n`;
            quote += `───────────────────────────\n`;
            cards.forEach((card, index) => {
                const roomName = card.querySelector('.room-name-input').value || `Room ${index + 1}`;
                const roomArea = card.querySelector('.room-area-val').textContent;
                const roomType = card.querySelector('.type-radio:checked').value;
                quote += `${index + 1}. ${roomName} (${roomType})\n`;
                quote += `   Area: ${roomArea} m²\n`;

                // List measurements
                const rows = card.querySelectorAll('.area-row-wrapper');
                rows.forEach((row, i) => {
                    const len = row.querySelector('.length').value;
                    const wid = row.querySelector('.width').value;
                    if (len && wid) {
                        quote += `   └ ${len}m × ${wid}m\n`;
                    }
                });
                quote += `\n`;
            });
        }

        // Totals
        quote += `TOTAL AREA: ${totalArea}\n`;
        quote += `\n`;

        // Materials
        quote += `MATERIALS REQUIRED:\n`;
        quote += `───────────────────────────\n`;
        quote += `✓ Tiles: ${totalBoxes}\n`;
        quote += `  (${totalTilesArea})\n`;
        quote += `✓ Adhesive: ${adhesive}\n`;
        quote += `  ${adhesiveBags}\n`;
        quote += `✓ Grout: ${grout}\n`;

        // Substrates if any
        const subSection = document.getElementById('substrates-summary');
        if (!subSection.classList.contains('hidden')) {
            quote += `\nSUBSTRATES:\n`;
            const boardEl = document.getElementById('total-board');
            const memEl = document.getElementById('total-membrane');
            const tankEl = document.getElementById('total-tanking');

            if (boardEl.parentElement.style.display !== 'none') {
                const boardText = boardEl.parentElement.textContent.trim();
                quote += `✓ ${boardText}\n`;
            }
            if (memEl.parentElement.style.display !== 'none') {
                const memText = memEl.parentElement.textContent.trim();
                quote += `✓ ${memText}\n`;
            }
            if (tankEl.parentElement.style.display !== 'none') {
                const tankText = tankEl.parentElement.textContent.trim();
                quote += `✓ ${tankText}\n`;
            }
        }

        quote += `\n═══════════════════════════\n`;
        quote += `Generated by TileMate\n`;
        quote += `${date}\n`;
        quote += `═══════════════════════════`;

        return quote;
    }

    function shareViaWhatsApp() {
        const quote = generateQuoteText();
        const phone = customerPhoneInput.value.trim();

        // Format phone number for WhatsApp (remove spaces and special chars)
        const formattedPhone = phone.replace(/[^0-9+]/g, '');

        // Create WhatsApp URL
        let whatsappUrl = 'https://wa.me/';
        if (formattedPhone) {
            whatsappUrl += formattedPhone;
        }
        whatsappUrl += '?text=' + encodeURIComponent(quote);

        // Open WhatsApp
        window.open(whatsappUrl, '_blank');
    }

    function shareViaEmail() {
        const quote = generateQuoteText();
        const email = customerEmailInput.value.trim();
        const name = customerNameInput.value.trim() || 'Customer';

        const subject = `Tiling Quote for ${name}`;
        const body = quote;

        // Create mailto URL
        let mailtoUrl = 'mailto:';
        if (email) {
            mailtoUrl += email;
        }
        mailtoUrl += '?subject=' + encodeURIComponent(subject);
        mailtoUrl += '&body=' + encodeURIComponent(body);

        // Open email client
        window.location.href = mailtoUrl;
    }

    function copyToClipboard() {
        const quote = generateQuoteText();

        // Use modern clipboard API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(quote).then(() => {
                showCopyFeedback();
            }).catch(err => {
                console.error('Failed to copy:', err);
                fallbackCopy(quote);
            });
        } else {
            fallbackCopy(quote);
        }
    }

    function fallbackCopy(text) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            showCopyFeedback();
        } catch (err) {
            console.error('Fallback copy failed:', err);
            alert('Failed to copy to clipboard');
        }
        document.body.removeChild(textarea);
    }

    function showCopyFeedback() {
        copyFeedback.classList.remove('hidden');
        setTimeout(() => {
            copyFeedback.classList.add('hidden');
        }, 2000);
    }

    // --- Address Autocomplete Functions ---

    let addressSearchTimeout;
    const addressSuggestionsEl = document.getElementById('address-suggestions');

    function initAddressAutocomplete() {
        customerAddressInput.addEventListener('input', handleAddressInput);

        // Close suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.address-autocomplete-wrapper')) {
                addressSuggestionsEl.classList.add('hidden');
            }
        });
    }

    function handleAddressInput(e) {
        const query = e.target.value.trim();

        // Clear previous timeout
        clearTimeout(addressSearchTimeout);

        // Hide suggestions if query is too short
        if (query.length < 3) {
            addressSuggestionsEl.classList.add('hidden');
            return;
        }

        // Debounce the search
        addressSearchTimeout = setTimeout(() => {
            searchAddress(query);
        }, 500);
    }

    function searchAddress(query) {
        // Use Nominatim API (OpenStreetMap)
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;

        fetch(url, {
            headers: {
                'User-Agent': 'TileMate App'
            }
        })
            .then(response => response.json())
            .then(data => {
                displayAddressSuggestions(data);
            })
            .catch(error => {
                console.error('Address search error:', error);
                addressSuggestionsEl.classList.add('hidden');
            });
    }

    function displayAddressSuggestions(results) {
        if (!results || results.length === 0) {
            addressSuggestionsEl.classList.add('hidden');
            return;
        }

        // Clear previous suggestions
        addressSuggestionsEl.innerHTML = '';

        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'address-suggestion-item';

            const mainText = result.display_name.split(',').slice(0, 2).join(',');
            const subText = result.display_name.split(',').slice(2).join(',');

            item.innerHTML = `
                <div>${mainText}</div>
                ${subText ? `<small>${subText}</small>` : ''}
            `;

            item.addEventListener('click', () => {
                selectAddress(result.display_name);
            });

            addressSuggestionsEl.appendChild(item);
        });

        addressSuggestionsEl.classList.remove('hidden');
    }

    function selectAddress(address) {
        customerAddressInput.value = address;
        addressSuggestionsEl.classList.add('hidden');
        saveCustomerDetails();
        updateCustomerBadge();
    }

});
