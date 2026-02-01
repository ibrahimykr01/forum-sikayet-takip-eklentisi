// Her 30 dakikada bir kontrol kur
chrome.alarms.create("checkUpdates", { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkUpdates") {
    chrome.storage.local.get({links: []}, (data) => {
      data.links.forEach(item => {
        fetch(item.url)
          .then(response => response.text())
          .then(html => {
            // Basit bir kontrol: Sayfanın uzunluğu değişmişse yeni mesaj gelmiş olabilir
            if (item.lastLength && html.length !== item.lastLength) {
              chrome.notifications.create({
                type: 'basic',
                iconUrl: 'icon.png',
                title: 'Konu Güncellendi!',
                message: item.title + " konusunda hareketlilik var.",
                priority: 2
              });
            }
            // Mevcut uzunluğu kaydet
            item.lastLength = html.length;
            chrome.storage.local.set({links: data.links});
          });
      });
    });
  }
});