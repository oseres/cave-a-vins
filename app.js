const STORAGE_KEY = 'cave-a-vins.wines';
const defaultWines = [
  {id: crypto.randomUUID(), name:'Château Leclerc', appellation:'Bordeaux Supérieur', vintage:2020, color:'Rouge', packaging:'bottle', quantity:12, idealwinePrice:38.5},
  {id: crypto.randomUUID(), name:'Domaine des Vignes', appellation:'Sancerre', vintage:2021, color:'Blanc', packaging:'case6', quantity:2, idealwinePrice:28.2}
];
const $ = (selector) => document.querySelector(selector);
const form = $('#wineForm');
const list = $('#wineList');
const template = $('#wineTemplate');
let wines = readWines();
let editingId = null;

function readWines(){
  try { const value = JSON.parse(localStorage.getItem(STORAGE_KEY)); return Array.isArray(value) ? value : [...defaultWines]; }
  catch { return [...defaultWines]; }
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(wines)); }
function bottles(wine){ return wine.packaging === 'case6' ? wine.quantity * 6 : wine.packaging === 'case12' ? wine.quantity * 12 : wine.quantity; }
function packagingLabel(value){ return {bottle:'Bouteille(s)',case6:'Caisse de 6',case12:'Caisse de 12'}[value] || 'Bouteille(s)'; }
function formatCurrency(value){ return new Intl.NumberFormat('fr-FR', {style:'currency', currency:'EUR'}).format(value); }
function wineValue(wine){ return bottles(wine) * Number(wine.idealwinePrice || 0); }
function render(){
  const query = $('#search').value.trim().toLowerCase();
  const filtered = wines.filter(w => [w.name,w.appellation,w.color,String(w.vintage)].some(v => v.toLowerCase().includes(query)));
  list.innerHTML = '';
  if(!filtered.length){ list.innerHTML='<div class="empty"><strong>Aucun vin trouvé</strong>Ajoutez un vin ou modifiez votre recherche.</div>'; }
  filtered.forEach(wine => {
    const fragment = template.content.cloneNode(true);
    const bottleCount = bottles(wine);
    const value = wineValue(wine);
    fragment.querySelector('.wine-name').textContent = wine.name;
    fragment.querySelector('.wine-appellation').textContent = wine.appellation;
    fragment.querySelector('.wine-vintage').textContent = `Millésime ${wine.vintage}`;
    fragment.querySelector('.wine-quantity').textContent = `${bottleCount} bouteille${bottleCount>1?'s':''}`;
    fragment.querySelector('.wine-packaging').textContent = `${wine.quantity} × ${packagingLabel(wine.packaging)}`;
    fragment.querySelector('.wine-price').textContent = `Cote ${formatCurrency(Number(wine.idealwinePrice || 0))} / btl · ${formatCurrency(value)}`;
    fragment.querySelector('.wine-color').classList.add(wine.color.toLowerCase());
    fragment.querySelector('.edit').addEventListener('click', () => edit(wine.id));
    fragment.querySelector('.delete').addEventListener('click', () => remove(wine.id));
    list.appendChild(fragment);
  });
  $('#wineCount').textContent = wines.length;
  $('#bottleCount').textContent = wines.reduce((sum,w) => sum + bottles(w), 0);
  $('#redCount').textContent = wines.filter(w => w.color === 'Rouge').length;
  $('#totalValue').textContent = formatCurrency(wines.reduce((sum,w) => sum + wineValue(w), 0));
}
function resetForm(){ form.reset(); $('#color').value='Rouge'; $('#packaging').value='bottle'; $('#idealwinePrice').value=''; editingId=null; $('#formTitle').textContent='Ajouter un vin'; $('#submitButton').textContent='Ajouter le vin'; $('#cancelButton').classList.add('hidden'); }
function edit(id){
  const wine = wines.find(w => w.id === id); if(!wine) return;
  editingId=id; $('#formTitle').textContent='Modifier un vin'; $('#submitButton').textContent='Enregistrer les modifications'; $('#cancelButton').classList.remove('hidden');
  Object.entries(wine).forEach(([key,value]) => { const field = $(`#${key}`); if(field) field.value=value; });
  window.scrollTo({top:0,behavior:'smooth'});
}
function remove(id){
  const wine=wines.find(w => w.id===id); if(!wine || !confirm(`Supprimer « ${wine.name} » ?`)) return;
  wines=wines.filter(w => w.id!==id); save(); if(editingId===id) resetForm(); render();
}
form.addEventListener('submit', event => {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  data.name=data.name.trim(); data.appellation=data.appellation.trim(); data.vintage=Number(data.vintage); data.quantity=Number(data.quantity); data.idealwinePrice=Number(data.idealwinePrice);
  if(!data.name || !data.appellation || !data.vintage || Number.isNaN(data.quantity) || data.quantity < 0 || Number.isNaN(data.idealwinePrice) || data.idealwinePrice < 0) return alert('Veuillez renseigner correctement tous les champs, y compris la cote iDealwine.');
  if(editingId) wines=wines.map(w => w.id===editingId ? {...w,...data} : w); else wines=[{id:crypto.randomUUID(),...data},...wines];
  save(); resetForm(); render();
});
$('#cancelButton').addEventListener('click', resetForm);
$('#search').addEventListener('input', render);
render();
