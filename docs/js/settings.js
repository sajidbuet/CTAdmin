/* CTAdmin – custom settings modal (values are stored but not yet used by the plan; see Phase 3) */
const settingsGear  = document.getElementById('settingsGear');
const settingsModal = document.getElementById('settingsModal');
const useCustom     = document.getElementById('useCustomSettings');
const customSection = document.getElementById('customSettings');
const inpStart = document.getElementById('customStartRoll'),
      inpCount = document.getElementById('customStudentCount'),
      inpLabel = document.getElementById('customSectionLabel'),
      inpRows  = document.getElementById('customSeatRows'),
      inpCols  = document.getElementById('customSeatCols');
const fileLoadInput = document.getElementById('loadSettings');
const LS_KEY = 'ctadmin_customSettings';

const getSettingsObject = () => ({
  useCustom: useCustom.checked, startRoll: +inpStart.value, studentCount: +inpCount.value,
  sectionLabel: inpLabel.value, seatRows: +inpRows.value, seatCols: +inpCols.value,
});
function applySettingsObject(d) {
  useCustom.checked = !!d.useCustom;
  inpStart.value = d.startRoll    || inpStart.value;
  inpCount.value = d.studentCount || inpCount.value;
  inpLabel.value = d.sectionLabel || inpLabel.value;
  inpRows.value  = d.seatRows     || inpRows.value;
  inpCols.value  = d.seatCols     || inpCols.value;
  customSection.style.display = useCustom.checked ? 'block' : 'none';
}
const saveSettingsToStorage = () => localStorage.setItem(LS_KEY, JSON.stringify(getSettingsObject()));
function loadSettingsFromStorage() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return;
  try { applySettingsObject(JSON.parse(raw)); } catch { console.warn('Failed to parse saved settings'); }
}

settingsGear.addEventListener('click', () => { loadSettingsFromStorage(); settingsModal.style.display = 'flex'; });
document.getElementById('settingsClose').addEventListener('click', () => settingsModal.style.display = 'none');
useCustom.addEventListener('change', () => {
  customSection.style.display = useCustom.checked ? 'block' : 'none';
  saveSettingsToStorage();
});
[inpStart, inpCount, inpLabel, inpRows, inpCols].forEach(el => el.addEventListener('input', saveSettingsToStorage));

document.getElementById('saveSettings').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(getSettingsObject(), null, 2)], { type: 'application/json' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'ctadmin-settings.json' });
  a.click();
  URL.revokeObjectURL(url);
});
document.getElementById('loadSettingsBtn').addEventListener('click', () => fileLoadInput.click());
fileLoadInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try { applySettingsObject(JSON.parse(reader.result)); saveSettingsToStorage(); }
    catch { alert('Invalid settings file'); }
  };
  reader.readAsText(file);
});
loadSettingsFromStorage();
