// Enable/disable action buttons based on game phase

export function setButtons({ deal, hit, stand, double: dbl, split }) {
  document.getElementById('btn-deal').disabled   = !deal;
  document.getElementById('btn-hit').disabled    = !hit;
  document.getElementById('btn-stand').disabled  = !stand;
  document.getElementById('btn-double').disabled = !dbl;
  document.getElementById('btn-split').disabled  = !split;
}

export function disableAll() {
  setButtons({ deal: false, hit: false, stand: false, double: false, split: false });
}

export function showInsurancePrompt(show, maxAmount) {
  const label  = document.getElementById('insurance-label');
  const yesBtn = document.getElementById('btn-insurance');
  const noBtn  = document.getElementById('btn-no-insurance');
  label.hidden  = !show;
  yesBtn.hidden = !show;
  noBtn.hidden  = !show;
  if (show && maxAmount !== undefined) {
    yesBtn.textContent = `Insurance (${maxAmount})`;
  }
}
