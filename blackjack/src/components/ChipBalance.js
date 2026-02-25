// Updates the chip balance display in the header
export function updateBalance(amount) {
  const el = document.getElementById('balance-amount');
  if (el) el.textContent = amount.toLocaleString();
}
