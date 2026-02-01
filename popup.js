// Sayfa yüklendiğinde listeyi göster
document.addEventListener('DOMContentLoaded', displayLinks);

function displayLinks() {
  chrome.storage.local.get({links: []}, (data) => {
    const listEl = document.getElementById('list');
    listEl.innerHTML = '';
    
    data.links.forEach((item) => {
      let li = document.createElement('li');
      li.innerHTML = `
        <a href="${item.url}" target="_blank" class="topic-title">${item.title.substring(0, 50)}...</a>
        <div class="footer-row">
          <span class="status-tag">${item.lastLength > 0 ? '✅ Takipte' : '⏳ Bekliyor'}</span>
          <div class="share-actions">
            <span class="share-link wa" data-url="${item.url}"><i class="fab fa-whatsapp"></i></span>
            <span class="share-link tw" data-url="${item.url}"><i class="fab fa-x-twitter"></i></span>
          </div>
        </div>
      `;
      listEl.appendChild(li);
    });

    // Paylaşım butonlarını aktif et
    document.querySelectorAll('.wa').forEach(el => {
      el.onclick = () => window.open(`https://api.whatsapp.com/send?text=Bu konuyu takip ediyorum: ${el.dataset.url}`, '_blank');
    });
    document.querySelectorAll('.tw').forEach(el => {
      el.onclick = () => window.open(`https://twitter.com/intent/tweet?text=Forumda bu şikayet konusunu takibe aldım.&url=${el.dataset.url}`, '_blank');
    });
  });
}

// Kaydet Butonu Tıklama
document.getElementById('saveBtn').onclick = async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.storage.local.get({links: []}, (data) => {
    let newList = data.links;
    if (!newList.some(l => l.url === tab.url)) {
      newList.push({ title: tab.title, url: tab.url, lastLength: 0 });
      chrome.storage.local.set({links: newList}, () => {
        displayLinks();
      });
    }
  });
};

// Excel Aktar Butonu
document.getElementById('exportBtn').onclick = () => {
  chrome.storage.local.get({links: []}, (data) => {
    if (data.links.length === 0) return alert("Henüz kayıtlı konu yok.");
    let csv = "\uFEFFBaşlık,Link\n" + data.links.map(l => `"${l.title}","${l.url}"`).join("\n");
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "takip_listesi.csv";
    a.click();
  });
};