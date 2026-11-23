// Developer profile card (used in footer and About page)
window.TIS_PROFILE = {
  name: 'তারিকুল ইসলাম (সুমন)',
  position: 'MSc Mathematics',
  photo: 'assets/profile.jpg',
  badge: 'assets/tis-academy.jpg',
  links: [
    { k: 'yt', label: 'YouTube • TIS Academy', url: 'https://www.youtube.com/@tis.academy24', color: '#e11d48',
      svg: '<svg viewBox="0 0 24 24"><path fill="#fff" d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8z"/><path fill="#e11d48" d="M9.75 15.5 15.5 12 9.75 8.5z"/></svg>' },
    { k: 'fb', label: 'Facebook', url: 'https://www.facebook.com/tariqul.islam.422531/', color: '#1877f2',
      svg: '<svg viewBox="0 0 24 24"><path fill="#fff" d="M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H7v4h2v8h4v-8h3l1-4h-4V9c0-.6.4-1 1-1z"/></svg>' },
    { k: 'wa', label: 'WhatsApp', url: 'https://wa.me/8801755489719', color: '#16a34a',
      svg: '<svg viewBox="0 0 24 24"><path fill="none" stroke="#fff" stroke-width="1.8" d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.6 21.4l4.7-1.2A9.5 9.5 0 1 0 12 2.5z"/><path fill="#fff" d="M8.6 7.4c.3-.5.6-.5.9-.5h.6c.2 0 .4 0 .6.5l.8 1.9c.1.2.1.4 0 .6l-.5.7c-.1.2-.2.4 0 .6.5.9 1.2 1.6 2.1 2.1.2.1.4.1.6-.1l.6-.7c.2-.2.4-.2.6-.1l1.9.9c.3.1.4.3.4.5 0 .5-.2 1.2-.7 1.6-.5.4-1.3.6-2.2.4-1.5-.4-3-1.3-4.2-2.6-1.2-1.2-2-2.6-2.3-3.9-.2-.9 0-1.6.4-2z"/></svg>' },
    { k: 'gh', label: 'GitHub', url: 'https://github.com/tariqulislam4015', color: '#24292f',
      svg: '<svg viewBox="0 0 16 16"><path fill="#fff" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>' },
  ],
};
window.renderProfile = function (el) {
  const p = window.TIS_PROFILE;
  el.innerHTML = `
  <div class="profile">
    <div class="avatar">
      <img src="${p.photo}" alt="${p.name}" loading="lazy">
      <span class="badge-tis"><img src="${p.badge}" alt="TIS Academy"></span>
    </div>
    <h2 class="p-name">${p.name}</h2>
    <div class="p-pos">${p.position}</div>
    <div class="links">
      ${p.links.map((l, i) => `
        <a class="lnk" style="--lc:${l.color};--i:${i}" href="${l.url}" target="_blank" rel="noopener">
          <span class="ic">${l.svg}</span>
          <div><b>${l.label}</b><small>${l.url.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, '')}</small></div>
        </a>`).join('')}
    </div>
  </div>`;
};
