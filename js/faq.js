// ══════════════════════════════════════════════
// FAQ — гайд по установке PWA
// ══════════════════════════════════════════════

function renderFaq(){
  const el = document.getElementById('faq-list'); if(!el) return;
  el.innerHTML = `
    <div style="padding:4px 0 20px">
      <div style="font-family:var(--serif);font-size:20px;font-weight:300;color:var(--gold);margin-bottom:6px">установка приложения</div>
      <div style="font-size:13px;color:var(--text3);line-height:1.6">Биомедики работает как PWA — устанавливается прямо с браузера без App Store и Google Play.</div>
    </div>

    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(0)">
        <span>📱 iPhone / iPad (Safari)</span>
        <svg class="faq-arrow" id="faq-arr-0" viewBox="0 0 16 16" width="14" height="14"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>
      </div>
      <div class="faq-a hidden" id="faq-a-0">
        <ol style="padding-left:18px;line-height:2">
          <li>Открой <strong style="color:var(--text)">biomediki.app</strong> в браузере Safari</li>
          <li>Нажми кнопку <strong style="color:var(--text)">Поделиться</strong> (квадрат со стрелкой вверх) внизу экрана</li>
          <li>Прокрути список действий вниз и выбери <strong style="color:var(--text)">На экран «Домой»</strong></li>
          <li>Нажми <strong style="color:var(--text)">Добавить</strong> в правом верхнем углу</li>
        </ol>
        <div style="margin-top:10px;padding:10px;background:var(--bg3);border-radius:var(--rs);font-size:12px;color:var(--text3)">
          ⚠️ Только Safari — в Chrome и других браузерах на iPhone это не работает
        </div>
      </div>
    </div>

    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(1)">
        <span>🤖 Android (Chrome)</span>
        <svg class="faq-arrow" id="faq-arr-1" viewBox="0 0 16 16" width="14" height="14"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>
      </div>
      <div class="faq-a hidden" id="faq-a-1">
        <ol style="padding-left:18px;line-height:2">
          <li>Открой <strong style="color:var(--text)">biomediki.app</strong> в Chrome</li>
          <li>Нажми <strong style="color:var(--text)">⋮</strong> (три точки) в правом верхнем углу</li>
          <li>Выбери <strong style="color:var(--text)">Добавить на главный экран</strong></li>
          <li>Нажми <strong style="color:var(--text)">Добавить</strong></li>
        </ol>
        <div style="margin-top:10px;padding:10px;background:var(--bg3);border-radius:var(--rs);font-size:12px;color:var(--text3)">
          💡 Также работает в Samsung Internet и Edge
        </div>
      </div>
    </div>

    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(2)">
        <span>💻 Компьютер (Chrome / Edge)</span>
        <svg class="faq-arrow" id="faq-arr-2" viewBox="0 0 16 16" width="14" height="14"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>
      </div>
      <div class="faq-a hidden" id="faq-a-2">
        <ol style="padding-left:18px;line-height:2">
          <li>Открой сайт в Chrome или Edge</li>
          <li>В адресной строке появится иконка <strong style="color:var(--text)">⊕</strong> (установить)</li>
          <li>Нажми на неё и подтверди установку</li>
        </ol>
        <div style="margin-top:10px;padding:10px;background:var(--bg3);border-radius:var(--rs);font-size:12px;color:var(--text3)">
          💡 Приложение откроется в отдельном окне без адресной строки
        </div>
      </div>
    </div>

    <div class="faq-item">
      <div class="faq-q" onclick="toggleFaq(3)">
        <span>🔔 Уведомления не приходят?</span>
        <svg class="faq-arrow" id="faq-arr-3" viewBox="0 0 16 16" width="14" height="14"><path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.3" fill="none" stroke-linecap="round"/></svg>
      </div>
      <div class="faq-a hidden" id="faq-a-3">
        <div style="line-height:1.8">
          <strong style="color:var(--text)">iPhone:</strong> Уведомления работают только при установке через Safari (шаг выше) и только на iOS 16.4+. Зайди в Настройки → Биомедики → Уведомления и включи их.<br><br>
          <strong style="color:var(--text)">Android:</strong> Разреши уведомления при запросе или через Настройки → Приложения → Биомедики → Уведомления.<br><br>
          <strong style="color:var(--text)">В приложении:</strong> Профиль → Настройки → Уведомления → нажми "включить".
        </div>
      </div>
    </div>

    <div style="margin-top:20px;text-align:center;font-size:12px;color:var(--text3)">биомедики · место для своих</div>
  `;
}

function toggleFaq(i){
  const ans = document.getElementById('faq-a-'+i);
  const arr = document.getElementById('faq-arr-'+i);
  if(!ans) return;
  const open = !ans.classList.contains('hidden');
  ans.classList.toggle('hidden', open);
  if(arr) arr.style.transform = open ? '' : 'rotate(180deg)';
}
