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

    // Settings Elements
    const settingsPanel = document.getElementById('settings-panel');
    const settingsToggle = document.getElementById('settings-toggle');
    const closeSettingsBtn = document.getElementById('close-settings');
    const closeSettingsX = document.getElementById('close-settings-x');

    // Settings Inputs
    const trowelSelect = document.getElementById('trowel-size');
    const bagSizeInput = document.getElementById('adhesive-bag-size');
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
    closeSettingsX.addEventListener('click', toggleSettings);

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

        // 2. Adhesive (Weight + Bags)
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

});
