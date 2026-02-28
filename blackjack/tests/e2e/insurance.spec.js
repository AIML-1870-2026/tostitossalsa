import { test, expect } from '@playwright/test';
import { BlackjackGame } from '../helpers/game-actions.js';
import {
  buildInsuranceDealerBJDeck,
  buildInsuranceNoBJDeck,
  buildPlayerBustDeck,
} from '../helpers/deck-builder.js';

test.describe('Insurance', () => {
  let game;

  test.beforeEach(async ({ page }) => {
    await page.clock.install();
    game = new BlackjackGame(page);
    await game.navigate();
  });

  test('insurance prompt appears when dealer shows an Ace', async ({ page }) => {
    await game.injectDeck(buildInsuranceDealerBJDeck());
    await game.setBet(10);
    await game.deal();
    await expect(page.locator('#insurance-label')).toBeVisible();
    await expect(page.locator('#btn-insurance')).toBeVisible();
    await expect(page.locator('#btn-no-insurance')).toBeVisible();
  });

  test('insurance prompt is hidden when dealer does not show an Ace', async ({ page }) => {
    await game.injectDeck(buildPlayerBustDeck()); // dealer shows 8
    await game.setBet(10);
    await game.deal();
    await expect(page.locator('#btn-insurance')).toBeHidden();
    await expect(page.locator('#btn-no-insurance')).toBeHidden();
  });

  test('insurance button shows the maximum insurance amount', async ({ page }) => {
    await game.injectDeck(buildInsuranceDealerBJDeck());
    await game.setBet(100);
    await game.deal();
    // Insurance button text shows "Insurance (50)" — floor(100/2) = 50
    await expect(page.locator('#btn-insurance')).toHaveText('Insurance (50)');
  });

  test('taking insurance deducts the insurance amount from the balance', async ({ page }) => {
    // Use the no-BJ deck: with dealer BJ the deduction is immediately reversed by the payout.
    // With no-BJ, the deduction persists while the game waits for player turn.
    await game.injectDeck(buildInsuranceNoBJDeck());
    await game.setBet(100);
    await game.deal();
    const balanceAfterDeal = await game.getBalance(); // 1000 - 100 = 900
    // Click directly and read BEFORE advancing the clock so we see the deduction
    await page.waitForSelector('#btn-insurance:not([hidden])');
    await page.click('#btn-insurance'); // synchronously deducts insurance amount
    const balanceAfterInsurance = await game.getBalance();
    expect(balanceAfterInsurance).toBe(balanceAfterDeal - 50); // 900 - 50 = 850
    await page.clock.runFor(2500); // finish the round
  });

  // ── Dealer HAS blackjack ──────────────────────────────────────────────────

  test('taking insurance when dealer has BJ: net result is break-even', async () => {
    // Bet 100: -100 main loss + insurance payout (stake 50 * 3 = +150) - 50 insurance = net 0
    await game.injectDeck(buildInsuranceDealerBJDeck());
    await game.setBet(100);
    const start = await game.getBalance();
    await game.deal();
    await game.takeInsurance();
    await game.waitForOverlay();
    const final = await game.getBalance();
    expect(final).toBe(start);
  });

  test('taking insurance when dealer has BJ: overlay shows insurance win line', async () => {
    await game.injectDeck(buildInsuranceDealerBJDeck());
    await game.setBet(100);
    await game.deal();
    await game.takeInsurance();
    await game.waitForOverlay();
    const text = await game.getOverlayText();
    expect(text).toContain('Insurance');
    expect(text).toContain('+100'); // 2:1 on 50 stake = +100 net
  });

  test('declining insurance when dealer has BJ: player loses the main bet', async () => {
    await game.injectDeck(buildInsuranceDealerBJDeck());
    await game.setBet(100);
    const start = await game.getBalance();
    await game.deal();
    await game.declineInsurance();
    await game.waitForOverlay();
    const final = await game.getBalance();
    expect(final).toBe(start - 100);
  });

  test('declining insurance when dealer has BJ: overlay shows Lose', async () => {
    await game.injectDeck(buildInsuranceDealerBJDeck());
    await game.setBet(50);
    await game.deal();
    await game.declineInsurance();
    await game.waitForOverlay();
    const text = await game.getOverlayText();
    expect(text.toLowerCase()).toContain('lose');
  });

  // ── Dealer does NOT have blackjack ────────────────────────────────────────

  test('taking insurance when dealer has no BJ: player continues to player turn', async () => {
    await game.injectDeck(buildInsuranceNoBJDeck());
    await game.setBet(100);
    await game.deal();
    await game.takeInsurance(); // insurance lost, no BJ → enter player turn
    const phase = await game.getPhase();
    expect(phase).toBe('PLAYER_TURN');
  });

  test('taking insurance when dealer has no BJ: insurance loss shown in overlay', async () => {
    await game.injectDeck(buildInsuranceNoBJDeck());
    await game.setBet(100);
    await game.deal();
    await game.takeInsurance();
    await game.stand();
    await game.waitForOverlay();
    const text = await game.getOverlayText();
    expect(text).toContain('Insurance');
    expect(text).toContain('-50'); // insurance lost
  });

  test('taking insurance when dealer has no BJ, player wins: net is win minus insurance', async () => {
    // Player 10+9=19 beats dealer soft 17. Main win: +100. Insurance: -50. Net: +50.
    await game.injectDeck(buildInsuranceNoBJDeck());
    await game.setBet(100);
    const start = await game.getBalance();
    await game.deal();
    await game.takeInsurance();
    await game.stand();
    await game.waitForOverlay();
    const final = await game.getBalance();
    expect(final).toBe(start + 50);
  });

  test('declining insurance when dealer has no BJ: player wins main bet normally', async () => {
    // Player 10+9=19 beats dealer soft 17. No insurance. Net: +100.
    await game.injectDeck(buildInsuranceNoBJDeck());
    await game.setBet(100);
    const start = await game.getBalance();
    await game.deal();
    await game.declineInsurance();
    await game.stand();
    await game.waitForOverlay();
    const final = await game.getBalance();
    expect(final).toBe(start + 100);
  });
});
