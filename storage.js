// storage.js — Save and load listings

function saveResult(productName, content) {
  const saved = JSON.parse(localStorage.getItem('etsySaved') || '[]');
  saved.unshift({
    id: crypto.randomUUID?.() || (Date.now().toString() + Math.random()),
    productName,
    content,
    date: new Date().toLocaleDateString()
  });
  localStorage.setItem('etsySaved', JSON.stringify(saved));
  renderDashboard();
}

function renderDashboard() {
  const saved = JSON.parse(localStorage.getItem('etsySaved') || '[]');
  const container = document.getElementById('savedListings');
  
  if (saved.length === 0) {
    container.innerHTML = '<p class="empty-msg">No saved listings yet. Generate content and save it!</p>';
    return;
  }

  container.innerHTML = saved.map(item => `
    <div class="saved-item">
      <div class="saved-item-header">
        <span class="saved-item-title">${item.productName}</span>
        <div>
          <span class="saved-item-date">${item.date}</span>
          <button class="delete-btn" onclick="deleteItem('${item.id}')">🗑️</button>
        </div>
      </div>
      <div>${item.content}</div>
    </div>
  `).join('');
}

function deleteItem(id) {
  let saved = JSON.parse(localStorage.getItem('etsySaved') || '[]');

  saved = saved.filter(item => String(item.id) !== String(id));

  localStorage.setItem('etsySaved', JSON.stringify(saved));

  renderDashboard();
}