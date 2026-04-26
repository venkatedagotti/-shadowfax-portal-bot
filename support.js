const { getPage } = require('./browser');

const PAYOUT_URL = 'https://support.shadowfax.in/payout';
const PARTNER_URL = 'https://support.shadowfax.in/partner-details';

// COD DEDUCTION — check COD Pendency amount for a rider
async function checkCodPendency(rider_id) {
  const page = await getPage();
  console.log(`Checking COD pendency for rider: ${rider_id}`);

  await page.goto(PAYOUT_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // Enter rider ID in Partner id field
  await page.waitForSelector('input[placeholder*="artner"]', { timeout: 10000 });
  const inputs = await page.$$('input');
  // Last input is usually Partner id field (after mobile number OR input)
  const partnerInput = inputs[inputs.length - 1];
  await partnerInput.click({ clickCount: 3 });
  await partnerInput.type(String(rider_id), { delay: 80 });

  // Click Search button
  await page.click('button[style*="background"], .orange-btn, button');
  await page.waitForTimeout(4000);

  // Extract COD Pendency amount from summary row at top
  const result = await page.evaluate(() => {
    let codPendency = 0;
    let pendingPayout = 0;

    // Find all text nodes and look for COD Pendency label
    const allEls = Array.from(document.querySelectorAll('*'));
    for (const el of allEls) {
      const text = el.innerText || el.textContent || '';
      if (text.trim() === 'COD Pendency' && el.children.length === 0) {
        // Try sibling, parent's next child, or nearby element
        let amountEl = el.nextElementSibling
          || el.parentElement?.nextElementSibling
          || el.closest('td')?.nextElementSibling
          || el.closest('th')?.nextElementSibling;

        if (!amountEl) {
          // Try parent container approach
          const parent = el.parentElement;
          if (parent) {
            const spans = parent.querySelectorAll('span, p, div, td');
            for (const s of spans) {
              if (s !== el && s.textContent.includes('₹')) {
                amountEl = s;
                break;
              }
            }
          }
        }

        if (amountEl) {
          const raw = amountEl.textContent.replace('₹', '').replace(/,/g, '').trim();
          codPendency = parseFloat(raw) || 0;
        }
      }

      if (text.trim() === 'Pending Payout' && el.children.length === 0) {
        let amountEl = el.nextElementSibling
          || el.parentElement?.nextElementSibling;
        if (amountEl) {
          const raw = amountEl.textContent.replace('₹', '').replace(/,/g, '').trim();
          pendingPayout = parseFloat(raw) || 0;
        }
      }
    }

    return { codPendency, pendingPayout };
  });

  console.log(`Rider ${rider_id} — COD Pendency: ₹${result.codPendency}`);

  return {
    success: true,
    rider_id: String(rider_id),
    cod_pendency: result.codPendency,
    pending_payout: result.pendingPayout,
    has_pending: result.codPendency > 0
  };
}

// COD HOLD — check rider Group, Status, Client
async function checkRiderDetails(rider_id) {
  const page = await getPage();
  console.log(`Checking rider details for: ${rider_id}`);

  await page.goto(PARTNER_URL, { waitUntil: 'networkidle2', timeout: 30000 });

  // Enter rider ID
  await page.waitForSelector('input[placeholder*="artner"]', { timeout: 10000 });
  const inputs = await page.$$('input');
  const partnerInput = inputs[inputs.length - 1];
  await partnerInput.click({ clickCount: 3 });
  await partnerInput.type(String(rider_id), { delay: 80 });

  // Click Search
  await page.click('button');
  await page.waitForTimeout(4000);

  // Extract Group, Status, Client from Work Details section
  const details = await page.evaluate(() => {
    const getValue = (label) => {
      const allEls = Array.from(document.querySelectorAll('*'));
      for (const el of allEls) {
        if ((el.innerText || '').trim() === label && el.children.length === 0) {
          // Look for value in same row
          const row = el.closest('tr, .row, .detail-item, li');
          if (row) {
            const cells = row.querySelectorAll('td, span, div');
            for (const c of cells) {
              const t = (c.innerText || '').trim();
              if (t && t !== label && t !== ':') return t;
            }
          }
          // Try next sibling elements
          let sib = el.nextElementSibling;
          while (sib) {
            const t = (sib.innerText || '').trim();
            if (t && t !== ':') return t;
            sib = sib.nextElementSibling;
          }
        }
      }
      return null;
    };

    return {
      group: getValue('Group'),
      status: getValue('Status'),
      client: getValue('Client')
    };
  });

  // Eligible for hold: Group=RIDER and Client=ECOM
  const eligible = details.group === 'RIDER' && details.client === 'ECOM';

  console.log(`Rider ${rider_id} — Group: ${details.group}, Status: ${details.status}, Client: ${details.client}`);

  return {
    success: true,
    rider_id: String(rider_id),
    group: details.group,
    status: details.status,
    client: details.client,
    eligible_for_hold: eligible
  };
}

module.exports = { checkCodPendency, checkRiderDetails };
