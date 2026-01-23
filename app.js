// app.js - Main application logic for TilerMate

import { calculateArea, estimateMaterials, formatQuoteHTML } from './utils.js';
import { uploadQuoteFile } from './drive.js';

let rooms = [];

function addRoom() {
    const container = document.getElementById('rooms-container');
    const roomIndex = rooms.length + 1;
    const roomDiv = document.createElement('div');
    roomDiv.className = 'room-form';
    roomDiv.innerHTML = `
    <h3>Room ${roomIndex}</h3>
    <div class="form-group">
      <label for="length-${roomIndex}">Length (m)</label>
      <input type="number" step="0.01" id="length-${roomIndex}" required />
    </div>
    <div class="form-group">
      <label for="width-${roomIndex}">Width (m)</label>
      <input type="number" step="0.01" id="width-${roomIndex}" required />
    </div>
    <div class="form-group">
      <label for="substrate-${roomIndex}">Substrate</label>
      <select id="substrate-${roomIndex}">
        <option value="concrete">Concrete</option>
        <option value="plywood">Plywood</option>
        <option value="tilebacker">Tile Backer</option>
      </select>
    </div>
    <button type="button" class="btn-secondary" onclick="removeRoom(${roomIndex})">Remove Room</button>
    <hr />
  `;
    container.appendChild(roomDiv);
    rooms.push({ length: 0, width: 0, substrate: 'concrete', area: 0 });
}

function removeRoom(index) {
    const container = document.getElementById('rooms-container');
    const roomDivs = container.getElementsByClassName('room-form');
    if (roomDivs[index - 1]) {
        container.removeChild(roomDivs[index - 1]);
        rooms.splice(index - 1, 1);
        // Re‑index remaining rooms
        const headings = container.querySelectorAll('.room-form h3');
        headings.forEach((h, i) => (h.textContent = `Room ${i + 1}`));
    }
}

function gatherRoomData() {
    rooms.forEach((room, i) => {
        const idx = i + 1;
        const length = parseFloat(document.getElementById(`length-${idx}`).value) || 0;
        const width = parseFloat(document.getElementById(`width-${idx}`).value) || 0;
        const substrate = document.getElementById(`substrate-${idx}`).value;
        const area = calculateArea(length, width);
        rooms[i] = { length, width, substrate, area };
    });
}

function generateQuote(event) {
    event.preventDefault();
    const customerName = document.getElementById('customer-name').value.trim();
    const customerEmail = document.getElementById('customer-email').value.trim();
    gatherRoomData();
    const totalArea = rooms.reduce((sum, r) => sum + r.area, 0);
    const materials = estimateMaterials(totalArea, 'concrete'); // For simplicity, using first room substrate; can be enhanced.
    const quoteHTML = formatQuoteHTML({
        customerName,
        customerEmail,
        rooms,
        totalArea: totalArea.toFixed(2),
        materials,
    });

    const quoteSection = document.getElementById('quote-section');
    const quoteContent = document.getElementById('quote-content');
    quoteContent.innerHTML = quoteHTML;
    quoteSection.classList.remove('hidden');
}

async function saveToDrive() {
    const quoteContent = document.getElementById('quote-content').innerHTML;
    const fileName = `Quote_${new Date().toISOString().split('T')[0]}.pdf`;
    // Convert HTML to PDF using html2pdf (already loaded in index.html)
    const element = document.createElement('div');
    element.innerHTML = quoteContent;
    const pdfBlob = await html2pdf().from(element).output('blob');
    const reader = new FileReader();
    reader.onload = async function () {
        const base64 = btoa(reader.result);
        try {
            const result = await uploadQuoteFile(fileName, base64);
            alert('Quote saved to Google Drive! File ID: ' + result.id);
        } catch (e) {
            console.error(e);
            alert('Failed to save to Drive: ' + e.message);
        }
    };
    reader.readAsBinaryString(pdfBlob);
}

function copyQuote() {
    const quoteContent = document.getElementById('quote-content').innerText;
    navigator.clipboard.writeText(quoteContent).then(() => alert('Quote copied to clipboard'));
}

function shareEmail() {
    const subject = encodeURIComponent('Your TilerMate Quote');
    const body = encodeURIComponent(document.getElementById('quote-content').innerText);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

function shareWhatsApp() {
    const text = encodeURIComponent(document.getElementById('quote-content').innerText);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

// Event listeners
document.getElementById('add-room-btn').addEventListener('click', addRoom);
document.getElementById('job-form').addEventListener('submit', generateQuote);
document.getElementById('save-drive-btn').addEventListener('click', saveToDrive);
document.getElementById('copy-quote-btn').addEventListener('click', copyQuote);
document.getElementById('share-email-btn').addEventListener('click', shareEmail);
document.getElementById('share-whatsapp-btn').addEventListener('click', shareWhatsApp);
