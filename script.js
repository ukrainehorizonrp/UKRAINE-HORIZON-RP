"use strict";

function debounce(fn, wait = 180) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}


const imageLazyObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const img = entry.target;
    const src = img.dataset.src;
    if (!src) return;

    if (entry.isIntersecting) {
      if (img.getAttribute("src") !== src) {
        img.setAttribute("src", src);
      }
    } else if (img.getAttribute("src")) {
      img.removeAttribute("src");
    }
  });
}, {
  root: null,
  rootMargin: "600px 0px", 
  threshold: 0.01
});

function observeLazyImages(container) {
  if (!container) return;
  container.querySelectorAll("img[data-src]").forEach((img) => {
    imageLazyObserver.observe(img);
  });
}


const TAB_HASH_MAP = {
  home: "rules",
  roles: "role",
  organs: "organs",
  codes: "codes",
  licenses: "player-information",
  community: "community"
};

function setHash(hash) {
  history.replaceState(null, "", "#" + hash);
}

function getHash() {
  return location.hash.replace("#", "");
}

function animateCardsIn(cards, startDelay = 0.15, stepDelay = 0.10, duration = 0.75) {

    cards.forEach(card => {
        card.style.opacity = "0";
        card.style.transform = "translate3d(0,40px,0) scale(.97)";
        card.style.transition = "none";
        card.style.willChange = "transform, opacity";
    });

    requestAnimationFrame(() => {

        requestAnimationFrame(() => {

            cards.forEach((card,index)=>{

                const delay = startDelay + index * stepDelay;

                card.style.transition = `
                    opacity ${duration}s cubic-bezier(.22,1,.36,1) ${delay}s,
                    transform ${duration}s cubic-bezier(.22,1,.36,1) ${delay}s
                `;

                card.style.opacity="1";
                card.style.transform="translate3d(0,0,0) scale(1)";

                // Прибираємо willChange одразу після завершення переходу -
                // інакше браузер тримає шар у GPU-пам'яті нескінченно,
                // навіть коли картка вже давно нерухома.
                const clearWillChange = () => {
                    card.style.willChange = "auto";
                    card.removeEventListener("transitionend", clearWillChange);
                };
                card.addEventListener("transitionend", clearWillChange);

            });

        });

    });

}


(function initTabs() {
  const buttons = document.querySelectorAll(".tab-btn");
  const contents = document.querySelectorAll(".tab-content");

function restartCardAnimations(container) {
    if (!container) return;

    // Спочатку перезапускаємо заголовок і поле пошуку (вони йдуть першими)
    const heading = container.querySelector("h2");
    const searchInput = container.querySelector(".text-input");
    [heading, searchInput].forEach(el => {
      if (!el) return;
      el.style.animation = "none";
      void el.offsetWidth;
      el.style.animation = "";
    });

    const cards = Array.from(container.querySelectorAll(
      ".rule-card, .role-card, .organ-btn, .license-check-box, .review-card, .leave-review-btn"
    ));
    animateCardsIn(cards, 0.15, 0.12);
  }

  function openTab(id, updateHash) {
    buttons.forEach(b => b.classList.toggle("active", b.getAttribute("data-tab") === id));
    contents.forEach(c => c.classList.toggle("active", c.id === id));

    const target = document.getElementById(id);
    restartCardAnimations(target);

    if (updateHash !== false && TAB_HASH_MAP[id]) {
      setHash(TAB_HASH_MAP[id]);
    }
  }

  buttons.forEach(button => {
    button.addEventListener("click", () => {
      openTab(button.getAttribute("data-tab"));
    });
  });

  
  const hash = getHash();
  if (hash.startsWith("role")) {
    openTab("roles", false);
  } else if (hash.startsWith("organs")) {
    openTab("organs", false);
  } else if (hash.startsWith("codes")) {
    openTab("codes", false);
  } else if (hash.startsWith("player-information")) {
    openTab("licenses", false);
  } else if (hash.startsWith("community")) {
  openTab("community", false);
  } else {
    openTab("home", false);
  }

  window.__openTab = openTab;
})();


(function initCopyButton() {
  const copyBtn = document.getElementById("copyBtn");
  const serverCode = document.getElementById("serverCode");
  if (!copyBtn || !serverCode) return;

  copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(serverCode.textContent).then(() => {
      const original = copyBtn.textContent;
      copyBtn.textContent = "Скопійовано!";
      setTimeout(() => { copyBtn.textContent = original; }, 1500);
    }).catch(() => {
      copyBtn.textContent = "Помилка";
      setTimeout(() => { copyBtn.textContent = "Копіювати"; }, 1500);
    });
  });
})();


function highlightText(text, query) {
  if (!query) return text;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  return text.replace(regex, '<span class="highlight">$1</span>');
}

(function initRules() {
  const rulesGrid = document.getElementById("rulesGrid");
  const modalOverlay = document.getElementById("modalOverlay");
  const modalTitle = document.getElementById("modalTitle");
  const modalBody = document.getElementById("modalBody");
  const modalClose = document.getElementById("modalClose");
  const modalCopyLink = document.getElementById("modalCopyLink");
  const ruleSearch = document.getElementById("ruleSearch");
  const ruleSearchResults = document.getElementById("ruleSearchResults");

  if (!rulesGrid || typeof rulesData === "undefined") return;

  let currentRuleNumber = null;

  const BASE_DELAY = 0.15;
  const STEP_DELAY = 0.12; 

  
  const INITIAL_REVEAL_DELAY = 1.9;
  const INITIAL_STEP_DELAY = 0.12; 
  let isFirstRender = true;

  function renderRuleCards() {
    rulesGrid.innerHTML = "";

    const wasFirstRender = isFirstRender;
    const startDelay = wasFirstRender ? INITIAL_REVEAL_DELAY : BASE_DELAY;
    const stepDelay = wasFirstRender ? INITIAL_STEP_DELAY : STEP_DELAY;

    const cards = [];
    rulesData.forEach((rule) => {
      const card = document.createElement("div");
      card.className = "rule-card";
      card.dataset.number = rule.number;
      card.innerHTML = `<span class="rule-num">${rule.number}</span> ${rule.title}`;
      card.addEventListener("click", () => openRuleModal(rule, null));
      rulesGrid.appendChild(card);
      cards.push(card);
    });

    animateCardsIn(cards, startDelay, stepDelay);
    isFirstRender = false;
  }


  function openRuleModal(rule, searchQuery) {
    currentRuleNumber = rule.number;
    modalTitle.textContent = `Пункт ${rule.number}`;

    const articlesHtml = rule.articles.map(article => {
      const title = highlightText(article.title, searchQuery);
      const paragraphs = article.text.split("\n\n").map(p =>
        `<p class="article-paragraph">${highlightText(p, searchQuery)}</p>`
      ).join("");
      const punishment = highlightText(article.punishment, searchQuery);
      const image = article.image
        ? `<img src="${article.image}" class="article-image" alt="" loading="lazy" decoding="async">`
        : "";

      return `
        <div class="article-block">
          <div class="article-title">${title}</div>
          <div class="article-text">${paragraphs}</div>
          ${image}
          <div class="article-punishment">Покарання: ${punishment}</div>
        </div>
      `;
    }).join("");

    modalBody.innerHTML = `
      <h3 class="modal-big-title">${highlightText(rule.title, searchQuery)}</h3>
      ${articlesHtml}
    `;

    modalOverlay.classList.add("active");
    setHash("rules" + rule.number);

    if (searchQuery) {
      setTimeout(() => {
        modalBody.querySelectorAll(".highlight").forEach(el => el.classList.add("fade-out"));
      }, 6000);
    }
  }

  function closeRuleModal() {
    modalOverlay.classList.remove("active");
    setHash("rules");
  }

  modalClose.addEventListener("click", closeRuleModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeRuleModal();
  });

  if (modalCopyLink) {
    modalCopyLink.addEventListener("click", () => {
      if (currentRuleNumber === null) return;
      const url = `${location.origin}${location.pathname}#rules${currentRuleNumber}`;
      navigator.clipboard.writeText(url).then(() => {
        modalCopyLink.classList.add("copied");
        setTimeout(() => modalCopyLink.classList.remove("copied"), 1500);
      });
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modalOverlay.classList.contains("active")) closeRuleModal();
  });

  ruleSearch.addEventListener("input", debounce(() => {
    const query = ruleSearch.value.trim().toLowerCase();
    ruleSearchResults.innerHTML = "";
    if (query.length < 2) return;

    let found = 0;
    rulesData.forEach(rule => {
      const match = rule.articles.some(a =>
        a.title.toLowerCase().includes(query) ||
        a.text.toLowerCase().includes(query) ||
        a.punishment.toLowerCase().includes(query)
      );
      if (match) {
        found++;
        const item = document.createElement("div");
        item.className = "search-result-item";
        item.textContent = `Пункт ${rule.number}. ${rule.title}`;
        item.addEventListener("click", () => openRuleModal(rule, query));
        ruleSearchResults.appendChild(item);
      }
    });

    if (found === 0) {
      const noResult = document.createElement("div");
      noResult.className = "search-result-item no-results";
      noResult.textContent = "Нічого не знайдено. Спробуйте інше слово.";
      ruleSearchResults.appendChild(noResult);
    }
  }));

  renderRuleCards();

  const hash = getHash();
  if (hash.startsWith("rules") && hash.length > "rules".length) {
    const number = hash.replace("rules", "");
    const rule = rulesData.find(r => String(r.number) === number);
    if (rule) {
      setTimeout(() => openRuleModal(rule, null), 300);
    }
  }
})();

(function initRoles() {
  const rolesGrid = document.getElementById("rolesGrid");
  const staffModalOverlay = document.getElementById("staffModalOverlay");
  const staffModalTitle = document.getElementById("staffModalTitle");
  const staffModalBody = document.getElementById("staffModalBody");
  const staffModalClose = document.getElementById("staffModalClose");
  const staffSearch = document.getElementById("staffSearch");
  const staffSearchResults = document.getElementById("staffSearchResults");

  if (!rolesGrid || typeof staffData === "undefined") return;

  function renderStaffMember(member) {
    const avatar = member.avatar || "https://via.placeholder.com/68";
    return `
      <div class="staff-member">
        <img data-src="${avatar}" alt="" decoding="async">
        <div class="staff-member-text">
          <b>${member.name}</b>
          <span>Username: ${member.nick}</span><br>
          <a href="${member.telegram}" target="_blank" rel="noopener">Telegram</a>
        </div>
      </div>
    `;
  }

  function openStaffModal(categoryKey) {
    const category = staffData[categoryKey];
    staffModalTitle.textContent = category.title;

    staffModalBody.innerHTML = category.members.length === 0
      ? `<p class="placeholder-text">Тут поки що немає доданих співробітників.</p>`
      : category.members.map(renderStaffMember).join("");

    staffModalOverlay.classList.add("active");
    observeLazyImages(staffModalBody);
  }


  const ROLES_INITIAL_REVEAL_DELAY = 2.15;
  const ROLES_INITIAL_STEP_DELAY = 0.12; 
  const ROLES_BASE_DELAY = 0.15;
  const ROLES_STEP_DELAY = 0.12; 
  let rolesIsFirstRender = true;

  function renderRoleCards() {
    rolesGrid.innerHTML = "";

    const wasFirstRender = rolesIsFirstRender;
    const startDelay = wasFirstRender ? ROLES_INITIAL_REVEAL_DELAY : ROLES_BASE_DELAY;
    const stepDelay = wasFirstRender ? ROLES_INITIAL_STEP_DELAY : ROLES_STEP_DELAY;

    const cards = [];
    Object.keys(staffData).forEach((key) => {
      const category = staffData[key];
      const card = document.createElement("div");
      card.className = "role-card";
      card.innerHTML = `
        <div class="role-card-text">
          <h3>${category.title}</h3>
          <p>${category.members.length} співробітник(ів)</p>
        </div>
      `;
      card.addEventListener("click", () => openStaffModal(key));
      rolesGrid.appendChild(card);
      cards.push(card);
    });

    animateCardsIn(cards, startDelay, stepDelay);
    rolesIsFirstRender = false;
  }

  staffModalClose.addEventListener("click", () => staffModalOverlay.classList.remove("active"));
  staffModalOverlay.addEventListener("click", (e) => {
    if (e.target === staffModalOverlay) staffModalOverlay.classList.remove("active");
  });

  staffSearch.addEventListener("input", debounce(() => {
    const query = staffSearch.value.trim().toLowerCase();
    staffSearchResults.innerHTML = "";
    if (query.length < 2) return;

    let found = 0;
    Object.keys(staffData).forEach(key => {
      staffData[key].members.forEach(member => {
        const nickMatch = member.nick.toLowerCase().startsWith(query);
        const tgMatch = member.telegram.toLowerCase().includes(query);
        if (nickMatch || tgMatch) {
          found++;
          const item = document.createElement("div");
          item.className = "search-result-item";
          item.textContent = `${member.name} — ${member.nick} (${staffData[key].title})`;
          item.addEventListener("click", () => openStaffModal(key));
          staffSearchResults.appendChild(item);
        }
      });
    });

    if (found === 0) {
      const noResult = document.createElement("div");
      noResult.className = "search-result-item no-results";
      noResult.textContent = "Такого гравця не знайдено. Перевірте правильність ніку.";
      staffSearchResults.appendChild(noResult);
    }
  }));

  renderRoleCards();
})();

(function initOrgans() {
  const organButtons = document.getElementById("organButtons");
  const organCard = document.getElementById("organCard");

  if (!organButtons || !organCard || typeof organsData === "undefined") return;

  if (organsData.length === 0) {
    organButtons.innerHTML = `<p class="placeholder-text">Органи ще не додані.</p>`;
    return;
  }

  
  function renderSectionText(text) {
    const parts = text.split("\n\n").map(p => p.trim()).filter(Boolean);
    const isNumberedList = parts.length > 1 && parts.every(p => /^\d+\.\s/.test(p));

    if (isNumberedList) {
      const items = parts.map(p => p.replace(/^\d+\.\s*/, "")).map(p => `<li>${p}</li>`).join("");
      return `<ol class="organ-list">${items}</ol>`;
    }

    return parts.map(p => `<p class="organ-paragraph">${p}</p>`).join("");
  }

  function renderOrgan(index) {
    const organ = organsData[index];
    if (!organ) return;

  
    organCard.classList.remove("active");
    void organCard.offsetWidth;

    organCard.innerHTML = `
      <h3 class="organ-name">${organ.name}</h3>
      ${organ.sections.map(section => `
        <div class="organ-section">
          <div class="organ-section-title">${section.title}</div>
          <div class="organ-section-text">${renderSectionText(section.text)}</div>
        </div>
      `).join("")}
    `;
    organCard.classList.add("active");

    [...organButtons.children].forEach((btn, i) => {
      btn.classList.toggle("active", i === index);
    });
  }

  organButtons.innerHTML = organsData.map((o, i) =>
    `<button type="button" class="organ-btn" data-index="${i}">${o.name}</button>`
  ).join("");

  animateCardsIn([...organButtons.children], 1.9, 0.1);

  organButtons.addEventListener("click", (e) => {
    const btn = e.target.closest(".organ-btn");
    if (!btn) return;
    const index = Number(btn.dataset.index);
    renderOrgan(index);
    setHash("organs" + (index + 1));
  });


  const hash = getHash();
  if (hash.startsWith("organs") && hash.length > "organs".length) {
    const number = parseInt(hash.replace("organs", ""), 10);
    const index = number - 1;
    if (organsData[index]) {
      renderOrgan(index);
    }
  }
})();

(function initCodes() {
  const codeTypeButtons = document.getElementById("codeTypeButtons");
  const codesWrap = document.getElementById("codesArticlesWrap");
  const codesGrid = document.getElementById("codesGrid");
  const codeSearch = document.getElementById("codeSearch");
  const codeSearchResults = document.getElementById("codeSearchResults");
  const codeModalOverlay = document.getElementById("codeModalOverlay");
  const codeModalTitle = document.getElementById("codeModalTitle");
  const codeModalBody = document.getElementById("codeModalBody");
  const codeModalClose = document.getElementById("codeModalClose");
  const codeModalCopyLink = document.getElementById("codeModalCopyLink");

  if (!codeTypeButtons || typeof codesData === "undefined") return;

  const codeKeys = Object.keys(codesData);
  if (codeKeys.length === 0) return;

  let currentCodeKey = null;
  let currentArticleNumber = null;

  function closeCodeModal() {
    codeModalOverlay.classList.remove("active");
    if (currentCodeKey) setHash("codes" + currentCodeKey);
  }

  codeModalClose.addEventListener("click", closeCodeModal);
  codeModalOverlay.addEventListener("click", (e) => {
    if (e.target === codeModalOverlay) closeCodeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && codeModalOverlay.classList.contains("active")) closeCodeModal();
  });

  if (codeModalCopyLink) {
    codeModalCopyLink.addEventListener("click", () => {
      if (!currentCodeKey || currentArticleNumber === null) return;
      const url = `${location.origin}${location.pathname}#codes${currentCodeKey}${currentArticleNumber}`;
      navigator.clipboard.writeText(url).then(() => {
        codeModalCopyLink.classList.add("copied");
        setTimeout(() => codeModalCopyLink.classList.remove("copied"), 1500);
      });
    });
  }

  function openCodeArticleModal(rule, searchQuery) {
    currentArticleNumber = rule.number;
    codeModalTitle.textContent = `Стаття ${rule.number}`;

    const articlesHtml = rule.articles.map(article => {
      const title = highlightText(article.title, searchQuery);
      const paragraphs = article.text.split("\n\n").map(p =>
        `<p class="article-paragraph">${highlightText(p, searchQuery)}</p>`
      ).join("");
      const punishment = highlightText(article.punishment, searchQuery);
      const image = article.image
        ? `<img src="${article.image}" class="article-image" alt="" loading="lazy" decoding="async">`
        : "";

      return `
        <div class="article-block">
          <div class="article-title">${title}</div>
          <div class="article-text">${paragraphs}</div>
          ${image}
          <div class="article-punishment">Покарання: ${punishment}</div>
        </div>
      `;
    }).join("");

    codeModalBody.innerHTML = `
      <h3 class="modal-big-title">${highlightText(rule.title, searchQuery)}</h3>
      ${articlesHtml}
    `;

    codeModalOverlay.classList.add("active");
    setHash("codes" + currentCodeKey + rule.number);

    if (searchQuery) {
      setTimeout(() => {
        codeModalBody.querySelectorAll(".highlight").forEach(el => el.classList.add("fade-out"));
      }, 6000);
    }
  }

  function renderCodeGrid(key, isInitialNavigation) {
    currentCodeKey = key;
    codesGrid.innerHTML = "";
    codeSearch.value = "";
    codeSearchResults.innerHTML = "";

    [...codeTypeButtons.children].forEach(btn => {
      btn.classList.toggle("active", btn.dataset.key === key);
    });

    const cards = [];
    codesData[key].rules.forEach(rule => {
      const card = document.createElement("div");
      card.className = "rule-card";
      card.dataset.number = rule.number;
      card.innerHTML = `<span class="rule-num">${rule.number}</span> ${rule.title}`;
      card.addEventListener("click", () => openCodeArticleModal(rule, null));
      codesGrid.appendChild(card);
      cards.push(card);
    });

    animateCardsIn(cards, 0.15, 0.12);

    if (!isInitialNavigation) {
      setHash("codes" + key);
    }
  }

  codeSearch.addEventListener("input", debounce(() => {
    const query = codeSearch.value.trim().toLowerCase();
    codeSearchResults.innerHTML = "";
    if (query.length < 2 || !currentCodeKey) return;

    let found = 0;
    codesData[currentCodeKey].rules.forEach(rule => {
      const match = rule.articles.some(a =>
        a.title.toLowerCase().includes(query) ||
        a.text.toLowerCase().includes(query) ||
        a.punishment.toLowerCase().includes(query)
      );
      if (match) {
        found++;
        const item = document.createElement("div");
        item.className = "search-result-item";
        item.textContent = `Стаття ${rule.number}. ${rule.title}`;
        item.addEventListener("click", () => openCodeArticleModal(rule, query));
        codeSearchResults.appendChild(item);
      }
    });

    if (found === 0) {
      const noResult = document.createElement("div");
      noResult.className = "search-result-item no-results";
      noResult.textContent = "Нічого не знайдено. Спробуйте інше слово.";
      codeSearchResults.appendChild(noResult);
    }
  }));

  codeTypeButtons.innerHTML = codeKeys.map(key =>
    `<button type="button" class="organ-btn" data-key="${key}">${codesData[key].name}</button>`
  ).join("");

  animateCardsIn([...codeTypeButtons.children], 1.9, 0.1);

  codeTypeButtons.addEventListener("click", (e) => {
    const btn = e.target.closest(".organ-btn");
    if (!btn) return;
    renderCodeGrid(btn.dataset.key, false);
  });

  
  const hash = getHash();
  if (hash.startsWith("codes") && hash.length > "codes".length) {
    const rest = hash.replace("codes", "");
    const matchedKey = codeKeys.find(k => rest.startsWith(k));
    if (matchedKey) {
      renderCodeGrid(matchedKey, true);
      const numberPart = rest.replace(matchedKey, "");
      if (numberPart) {
        const rule = codesData[matchedKey].rules.find(r => String(r.number) === numberPart);
        if (rule) setTimeout(() => openCodeArticleModal(rule, null), 300);
      }
    }
  }
})();


(function initLicenses() {
  const typeSelect = document.getElementById("licenseTypeSelect");
  const nickInput = document.getElementById("licenseNickInput");
  const searchBtn = document.getElementById("licenseSearchBtn");
  const result = document.getElementById("licenseResult");

  if (!typeSelect || typeof licensesData === "undefined") return;

  function checkDuplicates() {
    const seen = {};
    licensesData.forEach(lic => {
      if (seen[lic.number]) {
        console.warn(` Номер ліцензії "${lic.number}" використано двічі! Перевір licenses-data.js`);
      }
      seen[lic.number] = true;
    });
  }

  function checkLicense() {
    const type = typeSelect.value;
    const query = nickInput.value.trim().toLowerCase();

    if (!type || !query) {
      result.innerHTML = `<p class="placeholder-text">Оберіть категорію і введіть username або номер ліцензії.</p>`;
      return;
    }

    const found = licensesData.find(lic =>
      lic.type === type &&
      (lic.nick.toLowerCase() === query || String(lic.number) === query)
    );

    if (found) {
      result.innerHTML = `
        <div class="license-result-card">
          <span class="license-result-status"> Ліцензія дійсна</span>
          <div class="license-result-row"><span>Нік гравця</span><span>${found.nick}</span></div>
          <div class="license-result-row"><span>Тип ліцензії</span><span>${licenseTypeNames[found.type]}</span></div>
          <div class="license-result-row"><span>Термін дії</span><span>${found.validFrom} — ${found.validTo}</span></div>
          <div class="license-result-row"><span>Номер ліцензії</span><span>${found.number}</span></div>
        </div>
      `;
    } else {
      result.innerHTML = `
        <div class="license-result-card invalid">
          <span class="license-result-status invalid"> Ліцензію не знайдено</span>
          <div class="license-result-row"><span>Запит</span><span>${query}</span></div>
          <div class="license-result-row"><span>Категорія</span><span>${licenseTypeNames[type]}</span></div>
        </div>
      `;
    }
  }

  searchBtn.addEventListener("click", checkLicense);
  nickInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") checkLicense();
  });

  checkDuplicates();
})();

(function initLightbox() {
  const lightbox = document.getElementById("imageLightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  if (!lightbox || !lightboxImg) return;

  let zoom = 1;

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("article-image")) {
      zoom = 1;
      lightboxImg.style.transform = "scale(1)";
      lightboxImg.src = e.target.src;
      lightbox.classList.add("active");
    }
  });

  lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox) lightbox.classList.remove("active");
  });

  lightbox.addEventListener("wheel", (e) => {
    e.preventDefault();
    zoom += e.deltaY > 0 ? -0.1 : 0.1;
    zoom = Math.min(Math.max(zoom, 1), 3);
    lightboxImg.style.transform = `scale(${zoom})`;
  }, { passive: false });
})();

(function initClock() {
  const clockEl = document.getElementById("clock");
  if (!clockEl) return;

  function updateClock() {
    const now = new Date().toLocaleTimeString("uk-UA", {
      timeZone: "Europe/Kyiv",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    clockEl.textContent = `Київський час: ${now}`;
  }

  updateClock();
  setInterval(updateClock, 1000);
})();


(function initReviews() {
  const reviewCard = document.getElementById("reviewCard");
  const prevBtn = document.getElementById("reviewPrev");
  const nextBtn = document.getElementById("reviewNext");

  if (!reviewCard || !prevBtn || !nextBtn) return;
  if (typeof reviewsData === "undefined" || reviewsData.length === 0) return;

  let currentIndex = 0;

  function renderReview(index) {
    const review = reviewsData[index];
    const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);

    reviewCard.style.animation = "none";
    void reviewCard.offsetWidth;

reviewCard.innerHTML = `
<div class="review-content">

    <div class="review-header">

        <div class="review-left">

            <img src="${review.avatar}" class="review-avatar" alt="" loading="lazy" decoding="async">

            <div class="review-meta">
                <div class="review-nick">${review.nick}</div>
            </div>

        </div>

        <div class="review-right">
            <div class="review-stars">${stars}</div>
            <div class="review-date">${review.date}</div>
        </div>

    </div>

    <div class="review-text">
        ${review.text}
    </div>

</div>
`;

    reviewCard.style.animation = "";

    const nickEl = reviewCard.querySelector(".review-nick");
    if (nickEl) {
      nickEl.addEventListener("click", () => {
        nickEl.classList.toggle("expanded");
      });
    }
  }

  function goNext() {
    currentIndex = (currentIndex + 1) % reviewsData.length;
    renderReview(currentIndex);
  }

  function goPrev() {
    currentIndex = (currentIndex - 1 + reviewsData.length) % reviewsData.length;
    renderReview(currentIndex);
  }

  let autoTimer = setInterval(goNext, 10000);

  function resetAutoTimer() {
    clearInterval(autoTimer);
    autoTimer = setInterval(goNext, 10000);
  }

  prevBtn.addEventListener("click", () => { goPrev(); resetAutoTimer(); });
  nextBtn.addEventListener("click", () => { goNext(); resetAutoTimer(); });

  renderReview(currentIndex);
})();


(()=>{
const bg=document.querySelector(".bg");
if(!bg)return;

window.addEventListener("mousemove",e=>{
const x=(e.clientX/window.innerWidth-.5)*8;
const y=(e.clientY/window.innerHeight-.5)*8;
bg.style.transform=`translate(${x}px,${y}px) scale(1.03)`;
},{passive:true});
})();


(() => {
const sequence=[
".hero-text",
".join-box",
".menu-tabs",
"#home",
"#roles",
"#organs",
"#codes",
"#licenses",
"#community"      
];

sequence.forEach(selector=>{
const el=document.querySelector(selector);
if(!el)return;
el.dataset.animate="true";
el.style.opacity="0";
el.style.transform="translateY(35px)";
});

window.addEventListener("load",()=>{

requestAnimationFrame(()=>{

sequence.forEach((selector,index)=>{

const el=document.querySelector(selector);
if(!el)return;

setTimeout(()=>{

el.style.transition="opacity 1s cubic-bezier(.22,1,.36,1),transform 1s cubic-bezier(.22,1,.36,1)";
el.style.opacity="1";
el.style.transform="translateY(0)";

},550+index*260);

});

});

});

})();

(()=>{
const observer=new IntersectionObserver((entries)=>{
entries.forEach(entry=>{
if(!entry.isIntersecting)return;

entry.target.classList.add("show");

observer.unobserve(entry.target);

});
},{
threshold:.12,
rootMargin:"0px 0px -60px 0px"
});

document.querySelectorAll(
".review-card,.join-box,.license-result-card,.reviews-header,.rules-grid,.roles-grid,.gallery-card"
).forEach(el=>{

el.classList.add("animate-item");

observer.observe(el);

});
})();