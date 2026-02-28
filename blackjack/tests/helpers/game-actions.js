/**
 * Page Object Model for the Blackjack game.
 *
 * Timing notes (all with page.clock.install() active):
 *   - deal():          runFor(3000) — covers 4-card deal + BJ detection + dealer turn if BJ
 *   - hit():           runFor(500)  — covers single card flight animation
 *   - stand():         runFor(2500) — covers dealer turn + resolution (safe from 3s auto-dismiss)
 *   - doubleDown():    runFor(2000) — covers card flight + dealer turn + resolution
 *   - split():         runFor(1000) — covers 2-card split animation
 *   - takeInsurance(): runFor(2500) — covers dealer BJ resolution or entering player turn
 *   - declineInsurance(): runFor(2500) — same as above
 */
export class BlackjackGame {
  constructor(page) {
    this.page = page;
  }

  async navigate() {
    await this.page.goto('/');
  }

  /** Inject a known card sequence before clicking Deal. Must be called before deal(). */
  async injectDeck(deckCards) {
    await this.page.evaluate((cards) => {
      window.__testDeck = cards;
    }, deckCards);
  }

  /** Type a specific bet amount into the bet input. */
  async setBet(amount) {
    const input = this.page.locator('#bet-input');
    await input.fill(String(amount));
    await input.dispatchEvent('input');
  }

  /** Click a chip button to add its denomination to the current bet.
   * Scoped to #chip-quick-select to avoid matching bet-stack chips that share data-denom. */
  async clickChip(denomination) {
    await this.page.locator(`#chip-quick-select [data-denom="${denomination}"]`).click();
  }

  /** Reset the bet input to 0. */
  async clearBet() {
    await this.page.click('#clear-bet-btn');
  }

  /** Click Deal and wait for all 4 cards to land (plus BJ resolution if applicable). */
  async deal() {
    await this.page.click('#btn-deal');
    await this.page.clock.runFor(3000);
  }

  /** Click Hit and wait for the card flight animation to complete. */
  async hit() {
    await this.page.click('#btn-hit');
    await this.page.clock.runFor(500);
  }

  /** Click Stand and wait for the dealer turn + resolution to complete. */
  async stand() {
    await this.page.click('#btn-stand');
    await this.page.clock.runFor(2500);
  }

  /** Click Double Down and wait for the card + dealer turn + resolution. */
  async doubleDown() {
    await this.page.click('#btn-double');
    await this.page.clock.runFor(2000);
  }

  /** Click Split and wait for the two split cards to be dealt. */
  async split() {
    await this.page.click('#btn-split');
    await this.page.clock.runFor(1000);
  }

  /** Click the Insurance button and wait for resolution. */
  async takeInsurance() {
    await this.page.waitForSelector('#btn-insurance:not([hidden])');
    await this.page.click('#btn-insurance');
    await this.page.clock.runFor(2500);
  }

  /** Click the No Thanks button and wait for resolution or player turn. */
  async declineInsurance() {
    await this.page.waitForSelector('#btn-no-insurance:not([hidden])');
    await this.page.click('#btn-no-insurance');
    await this.page.clock.runFor(2500);
  }

  /** Click the result overlay to dismiss it and wait for the card return animation. */
  async dismissOverlay() {
    await this.page.click('#result-overlay');
    await this.page.clock.runFor(1000);
  }

  /** Wait for the result overlay to become visible (class 'show'). */
  async waitForOverlay() {
    await this.page.waitForSelector('#result-overlay.show');
  }

  /** Read the current balance from the DOM.
   * The game uses toLocaleString() so numbers >= 1000 render as "1,100" — strip commas. */
  async getBalance() {
    const text = await this.page.textContent('#balance-amount');
    return parseInt(text.trim().replace(/,/g, ''), 10);
  }

  /** Read all text inside the result overlay. */
  async getOverlayText() {
    return this.page.textContent('#result-overlay');
  }

  /** Read the current game phase from the exposed window.__gameState. */
  async getPhase() {
    return this.page.evaluate(() => window.__gameState?.phase);
  }

  /** Count all .card elements currently visible on the table. */
  async getCardCount() {
    return this.page.locator('.card').count();
  }
}
