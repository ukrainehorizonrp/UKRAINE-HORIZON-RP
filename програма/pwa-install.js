
let deferredInstallPrompt = null;
const installBtn = document.getElementById("installAppBtn");

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});

if (installBtn) {
  installBtn.addEventListener("click", async () => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

    if (isIOS) {
      alert(
        "Щоб встановити застосунок на iPhone/iPad:\n\n" +
        "1. Натисніть кнопку 'Поділитися' (квадрат зі стрілкою) в Safari\n" +
        "2. Оберіть 'На екран Домівки'\n" +
        "3. Натисніть 'Додати'"
      );
      return;
    }

   
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches
      || window.navigator.standalone === true;

    if (isStandalone) {
      alert("Застосунок вже встановлено і відкритий саме як застосунок ");
      return;
    }

    if (!deferredInstallPrompt) {
      alert("Застосунок уже встановлено або встановлення недоступне у цьому браузері. Можете звернутися до розробника сайта t.me/kitsuxen (@kitsuxen) для отримання допомоги.");
      return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
  });
}

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
});



if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).then((registration) => {

 
      registration.update();


      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        newWorker.addEventListener("statechange", () => {
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
 
            newWorker.postMessage("SKIP_WAITING");
          }
        });
      });
    });

    
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}