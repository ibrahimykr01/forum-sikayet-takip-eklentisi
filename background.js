chrome.alarms.create("r10Gozcu", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "r10Gozcu") {
    await checkR10Links();
  }
});

async function checkR10Links() {
  const data = await chrome.storage.local.get({links: []});
  let changesDetected = false;

  for (let item of data.links) {
    try {
      const response = await fetch(item.url, { cache: "no-store" });
      const text = await response.text();
      const currentSize = text.length;
      if (item.lastLength > 0 && Math.abs(item.lastLength - currentSize) > 20) {
        item.isUpdated = true; // Konuyu güncellendi olarak işaretle
        changesDetected = true;

        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icon128.png',
          title: 'R10 Güncelleme!',
          message: `${item.title.substring(0, 30)}... yeni mesaj var!`,
          priority: 2
        });
      }
      item.lastLength = currentSize;
    } catch (e) {
      console.error("Takip hatası:", e);
    }
  }

  if (changesDetected || data.links.length > 0) {
    await chrome.storage.local.set({links: data.links});
  }
}

chrome.runtime.onInstalled.addListener(() => {
  checkR10Links();
});
