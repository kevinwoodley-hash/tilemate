// utils.js - Helper functions for area, material calculations, and cost estimation

/**
 * Calculate area of a rectangular room.
 * @param {number} length - Length in meters.
 * @param {number} width - Width in meters.
 * @returns {number} Area in square meters.
 */
export function calculateArea(length, width) {
  return Number((length * width).toFixed(2));
}

/**
 * Estimate material quantities based on total area and substrate type.
 * @param {number} totalArea - Total area in m².
 * @param {string} substrate - One of 'concrete', 'plywood', 'tilebacker'.
 * @returns {object} Quantities for adhesive, grout, underlayment.
 */
export function estimateMaterials(totalArea, substrate) {
  const rates = {
    adhesive: 2.5, // kg per m²
    grout: 1.2, // kg per m²
    underlayment: 0.8 // kg per m² (only for certain substrates)
  };
  const underlaymentNeeded = substrate !== 'tilebacker';
  const adhesive = Number((totalArea * rates.adhesive).toFixed(2));
  const grout = Number((totalArea * rates.grout).toFixed(2));
  const underlayment = underlaymentNeeded ? Number((totalArea * rates.underlayment).toFixed(2)) : 0;
  return { adhesive, grout, underlayment };
}

/**
 * Calculate cost breakdown for materials and labour.
 * @param {object} materials - Object with adhesive, grout, underlayment quantities (kg).
 * @param {number} totalArea - Total area in m².
 * @returns {object} Detailed cost information.
 */
export function calculateCosts(materials, totalArea) {
  const prices = { adhesive: 5, grout: 4, underlayment: 3 }; // $ per kg
  const labourRate = 30; // $ per m²

  const adhesiveCost = materials.adhesive * prices.adhesive;
  const groutCost = materials.grout * prices.grout;
  const underlaymentCost = materials.underlayment * prices.underlayment;

  const materialCost = adhesiveCost + groutCost + underlaymentCost;
  const labourCost = totalArea * labourRate;
  const totalCost = materialCost + labourCost;

  return {
    adhesiveCost: Number(adhesiveCost.toFixed(2)),
    groutCost: Number(groutCost.toFixed(2)),
    underlaymentCost: Number(underlaymentCost.toFixed(2)),
    materialCost: Number(materialCost.toFixed(2)),
    labourCost: Number(labourCost.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2))
  };
}

/**
 * Format a quote as HTML.
 * @param {object} data - Quote data containing customer info and material estimates.
 * @returns {string} HTML string.
 */
export function formatQuoteHTML(data) {
  const { customerName, customerEmail, rooms, totalArea, materials } = data;
  const cost = calculateCosts(materials, totalArea);
  const roomRows = rooms.map((r, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${r.length}m × ${r.width}m</td>
      <td>${r.area} m²</td>
      <td>${r.substrate}</td>
    </tr>`).join('');

  return `
    <h3>Quote for ${customerName}</h3>
    <p>Email: ${customerEmail}</p>
    <h4>Room Breakdown</h4>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr><th>#</th><th>Dimensions</th><th>Area (m²)</th><th>Substrate</th></tr>
      </thead>
      <tbody>${roomRows}</tbody>
    </table>
    <p><strong>Total Area:</strong> ${totalArea} m²</p>
    <h4>Material Estimates</h4>
    <ul>
      <li>Adhesive: ${materials.adhesive} kg (Cost: $${cost.adhesiveCost})</li>
      <li>Grout: ${materials.grout} kg (Cost: $${cost.groutCost})</li>
      ${materials.underlayment > 0 ? `<li>Underlayment: ${materials.underlayment} kg (Cost: $${cost.underlaymentCost})</li>` : ''}
    </ul>
    <h4>Cost Breakdown</h4>
    <ul>
      <li>Material Cost: $${cost.materialCost}</li>
      <li>Labour Cost ( $30/m² ): $${cost.labourCost}</li>
      <li><strong>Total Cost: $${cost.totalCost}</strong></li>
    </ul>
  `;
}
