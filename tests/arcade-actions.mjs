// Real UI actions shared by browser regressions across the two arcade games.
export async function resumeArcade(page) {
  if (await page.locator('#control-panel').isVisible()) await page.locator('#panel-resume').click();
  else await page.locator('#pause').click();
}

export async function restartArcade(page) {
  const invaders = await page.locator('body').getAttribute('data-game') === 'invaders';
  if (invaders && !await page.locator('#start').isVisible() && !await page.locator('#control-panel').isVisible()) await page.locator('#pause').click();
  let button = page.locator('#start');
  if (invaders && await page.locator('#control-panel').isVisible()) {
    await page.locator('#panel-restart').click();
    button = page.locator('#restart-confirm-yes');
  }
  await button.waitFor({ state: 'visible' });
  return button.evaluate(button => { button.click(); return document.getElementById('status').textContent; });
}
