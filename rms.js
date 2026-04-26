const { getPage } = require('./browser');

// IP TICKET — navigate directly to edit page and change Group to IP RIDERS
async function setRiderIP(rider_id) {
  const page = await getPage();
  console.log(`Setting IP RIDERS for rider: ${rider_id}`);

  // Navigate directly to the edit work details page
  const editUrl = `https://rms.shadowfax.in/#!/edit-rider/${rider_id}/edit-work-details/`;
  await page.goto(editUrl, { waitUntil: 'networkidle2', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Verify page loaded correctly
  const pageTitle = await page.title();
  console.log('RMS page title:', pageTitle);

  // Find the Group dropdown
  // It's a custom Angular ui-select dropdown — label says "Group *"
  // Strategy: find the label "Group" then click the nearby dropdown container
  const groupDropdown = await page.evaluateHandle(() => {
    const labels = Array.from(document.querySelectorAll('label, span, div'));
    for (const el of labels) {
      if ((el.innerText || '').trim() === 'Group *' || (el.innerText || '').trim() === 'Group') {
        // Find the nearest dropdown container (sibling or cousin)
        const parent = el.closest('.form-group, .col-md-3, .col-sm-3, td, .field');
        if (parent) {
          const dropdown = parent.querySelector(
            '.ui-select-container, .select2-container, select, [class*="dropdown"], [class*="select"]'
          );
          if (dropdown) return dropdown;
        }
      }
    }
    // Fallback: find any dropdown that currently shows "Rider"
    const allSelects = document.querySelectorAll('.ui-select-container, select, [class*="select"]');
    for (const s of allSelects) {
      if ((s.innerText || s.value || '').includes('Rider')) return s;
    }
    return null;
  });

  if (!groupDropdown) throw new Error('Group dropdown not found on RMS page');

  // Click to open the dropdown
  await groupDropdown.click();
  await page.waitForTimeout(1500);
  console.log('Group dropdown opened');

  // Find and click "IP RIDERS" in the dropdown options
  const clicked = await page.evaluate(() => {
    const options = document.querySelectorAll(
      '.ui-select-choices-row, .select2-result, option, li[role="option"], .dropdown-item, li'
    );
    for (const opt of options) {
      const text = (opt.innerText || opt.textContent || '').trim();
      if (text === 'IP RIDERS' || text.toUpperCase() === 'IP RIDERS') {
        opt.click();
        return true;
      }
    }
    return false;
  });

  if (!clicked) throw new Error('"IP RIDERS" option not found in Group dropdown');
  await page.waitForTimeout(1000);
  console.log('Selected IP RIDERS');

  // Click the Update button
  const updateBtn = await page.$('button[ng-click*="update"], button[ng-click*="save"], .btn-success, button.btn-primary');
  if (!updateBtn) {
    // Fallback: find any green Update button by text
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await page.evaluate(el => el.innerText, btn);
      if (text.trim() === 'Update') {
        await btn.click();
        await page.waitForTimeout(2000);
        console.log('Update button clicked');
        return {
          success: true,
          rider_id: String(rider_id),
          message: 'Rider group changed to IP RIDERS in RMS'
        };
      }
    }
    throw new Error('Update button not found');
  }

  await updateBtn.click();
  await page.waitForTimeout(2000);
  console.log(`Rider ${rider_id} updated to IP RIDERS in RMS`);

  return {
    success: true,
    rider_id: String(rider_id),
    message: 'Rider group changed to IP RIDERS in RMS'
  };
}

module.exports = { setRiderIP };
