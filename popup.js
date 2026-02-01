document.addEventListener('DOMContentLoaded', () => {
    displayLinks();

    document.getElementById('saveBtn').onclick = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab || !tab.url.includes("r10.net")) return alert("Sadece R10'da çalışır.");

        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                // Konu Sahibini Yakala
                const owner = document.querySelector('.p-description a.username, .message-name .username');
                
                // Son Yorumcuyu Yakala (Sondaki ismi al)
                const names = document.querySelectorAll('.message-name .username, .username');
                
                return {
                    owner: owner ? owner.innerText.trim() : "Bilinmiyor",
                    last: names.length > 0 ? names[names.length - 1].innerText.trim() : "Bilinmiyor"
                };
            }
        }, (results) => {
            const info = results[0]?.result || { owner: "Bilinmiyor", last: "Bilinmiyor" };
            const cleanUrl = tab.url.split('#')[0];

            chrome.storage.local.get({links: []}, (res) => {
                let list = res.links;
                if (!list.some(l => l.url === cleanUrl)) {
                    list.push({
                        title: tab.title.replace(" - R10.net", ""),
                        url: cleanUrl,
                        author: info.owner,
                        lastPoster: info.last
                    });
                    chrome.storage.local.set({links: list}, () => displayLinks());
                }
            });
        });
    };

    document.getElementById('exportBtn').onclick = () => {
        chrome.storage.local.get({links: []}, (res) => {
            if (res.links.length === 0) return alert("Liste boş.");
            let csv = "\uFEFFKonu,Sahibi,Son Yorumcu,Link\n";
            res.links.forEach(l => csv += `"${l.title}","${l.author}","${l.lastPoster}","${l.url}"\n`);
            downloadFile(csv, "r10_liste.csv", "text/csv");
        });
    };

    document.getElementById('downloadChatBtn').onclick = async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => {
                const posts = document.querySelectorAll('.bbWrapper, .message-body');
                let txt = "R10 ARŞİV\n\n";
                posts.forEach((p, i) => txt += `${i+1}. MESAJ:\n${p.innerText.trim()}\n\n---\n\n`);
                return txt;
            }
        }, (results) => {
            if (results[0]?.result) downloadFile(results[0].result, "r10_arsiv.txt", "text/plain");
        });
    };
});

function displayLinks() {
    chrome.storage.local.get({links: []}, (res) => {
        const listEl = document.getElementById('list');
        listEl.innerHTML = '';
        res.links.reverse().forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'card';
            const wa = `https://api.whatsapp.com/send?text=${encodeURIComponent(item.title + " " + item.url)}`;
            const tw = `https://twitter.com/intent/tweet?text=${encodeURIComponent(item.title)}&url=${encodeURIComponent(item.url)}`;
            
            card.innerHTML = `
                <a href="${item.url}" target="_blank" class="t-title">${item.title}</a>
                <div class="user-info">✍️ Sahibi: <b>${item.author}</b></div>
                <div class="user-info">👤 Son Yorum: <b>${item.lastPoster}</b></div>
                <div class="share-row">
                    <a href="${wa}" target="_blank" class="share-link" style="color:#25D366;">WhatsApp</a>
                    <a href="${tw}" target="_blank" class="share-link" style="color:#1DA1F2;">Twitter</a>
                    <span class="del-btn" data-index="${res.links.length - 1 - index}">🗑️</span>
                </div>`;
            listEl.appendChild(card);
        });

        document.querySelectorAll('.del-btn').forEach(btn => {
            btn.onclick = () => {
                const idx = btn.dataset.index;
                chrome.storage.local.get({links: []}, (res) => {
                    res.links.splice(idx, 1);
                    chrome.storage.local.set({links: res.links}, () => displayLinks());
                });
            };
        });
    });
}

function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], { type: mimeType + ";charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName; a.click();
    URL.revokeObjectURL(url);
}
