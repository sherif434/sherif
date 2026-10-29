(() => {
  'use strict';
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const storeKey = 'nova-ai-settings-v1';
  const historyKey = 'nova-ai-chat-v1';
  const defaults = { apiBase: '', chatModel: 'openai/gpt-oss-120b:fastest', saveEndpoint: true };
  let settings = { ...defaults };
  let history = [];
  let busy = false;
  let speakReplies = false;
  let recognition = null;
  let toastTimer;
  try { settings = { ...defaults, ...JSON.parse(localStorage.getItem(storeKey) || '{}') }; } catch {}
  try { history = JSON.parse(sessionStorage.getItem(historyKey) || '[]'); if (!Array.isArray(history)) history = []; } catch { history = []; }
  const safeText = (value) => String(value ?? '');
  function toast(message) { const node = $('#toast'); node.textContent = message; node.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 3600); }
  function apiRoot() { return settings.apiBase.trim().replace(/\/+$/, ''); }
  function renderStatus(text, good=false) { $('#connectionLabel').textContent = text; $('.status-dot').style.background = good ? 'var(--good)' : '#e4ad5c'; $('#modelLabel').textContent = settings.chatModel || 'نموذج مستضاف'; }
  function saveHistory() { try { sessionStorage.setItem(historyKey, JSON.stringify(history.slice(-60))); } catch {} }
  function escapeHTML(text) { return safeText(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function formatMessage(text) {
    const raw = safeText(text);
    const chunks = raw.split('```');
    return chunks.map((chunk, i) => {
      if (i % 2) { const first = chunk.indexOf('\n'); const code = first >= 0 ? chunk.slice(first + 1) : chunk; return '<pre><code>' + escapeHTML(code) + '</code></pre>'; }
      return escapeHTML(chunk).replace(/`([^`\n]+)`/g, '<code>$1</code>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    }).join('');
  }
  function addMessage(role, content, opts={}) {
    $('#welcome').hidden = true;
    const wrap = document.createElement('article'); wrap.className = 'message ' + (role === 'user' ? 'user' : 'assistant');
    const avatar = document.createElement('div'); avatar.className = 'avatar'; avatar.textContent = role === 'user' ? 'أنت' : '✦';
    const col = document.createElement('div'); col.className = 'message-column';
    const bubble = document.createElement('div'); bubble.className = 'bubble'; bubble.innerHTML = formatMessage(content); col.appendChild(bubble);
    if (role !== 'user' && !opts.pending) {
      const actions = document.createElement('div'); actions.className = 'message-actions';
      const copy = document.createElement('button'); copy.textContent = 'نسخ الرد'; copy.type = 'button'; copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(content); toast('تم نسخ الرد'); } catch { toast('تعذر النسخ في هذا السياق'); } });
      const read = document.createElement('button'); read.textContent = 'اقرأ الرد'; read.type = 'button'; read.addEventListener('click', () => speak(content)); actions.append(copy, read); col.appendChild(actions);
    }
    wrap.append(avatar, col); $('#messages').appendChild(wrap); $('#messages').scrollTop = $('#messages').scrollHeight; wrap.scrollIntoView({block:'nearest',behavior:'smooth'}); return { wrap, bubble };
  }
  function showThinking(show, label='NOVA تجهّز الرد…') { $('#thinkingIndicator').hidden = !show; $('#thinkingText').textContent = label; $('#sendButton').disabled = show; $('#sendButton').style.opacity = show ? '.55' : '1'; }
  async function requestJSON(path, body) {
    if (!apiRoot()) throw new Error('اضبط رابط خادم NOVA API من الإعدادات أولًا.');
    const response = await fetch(apiRoot() + path, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
    let data = {}; try { data = await response.json(); } catch {}
    if (!response.ok) throw new Error(data.error || ('فشل الطلب (' + response.status + ')'));
    return data;
  }
  async function sendChat(text, mode='chat') {
    const prompt = safeText(text).trim(); if (!prompt || busy) return;
    if (!apiRoot()) { toast('افتح الإعدادات وأضف رابط خادم NOVA API.'); $('#settingsDialog').showModal(); return; }
    busy = true; addMessage('user', prompt); history.push({role:'user',content:prompt}); saveHistory(); $('#promptInput').value = ''; showThinking(true, 'NOVA تحلل طلبك وتجهّز الرد…');
    const pending = addMessage('assistant', 'جارٍ الاتصال بالنموذج المستضاف…', {pending:true});
    try {
      const messages = history.slice(-24).map(m => ({ role: m.role, content: m.content }));
      const result = await requestJSON('/api/chat', { messages, model: settings.chatModel, mode });
      if (!result || typeof result.reply !== 'string' || !result.reply.trim()) throw new Error('وصل رد غير متوقع من الخادم.');
      pending.bubble.innerHTML = formatMessage(result.reply);
      const actions = document.createElement('div'); actions.className='message-actions';
      const copy = document.createElement('button'); copy.type='button'; copy.textContent='نسخ الرد'; copy.onclick=async()=>{try{await navigator.clipboard.writeText(result.reply);toast('تم نسخ الرد')}catch{toast('تعذر النسخ')}};
      const read = document.createElement('button'); read.type='button'; read.textContent='اقرأ الرد'; read.onclick=()=>speak(result.reply); actions.append(copy,read); pending.wrap.querySelector('.message-column').appendChild(actions);
      history.push({role:'assistant',content:result.reply}); saveHistory(); renderStatus('متصل بالخادم',true); if(speakReplies) speak(result.reply);
    } catch (error) { pending.bubble.textContent = 'تعذر إكمال الطلب: ' + safeText(error.message) + '\n\nتأكد من رابط الخادم، إعداد HF_TOKEN، وتوفر النموذج لدى المزوّد.'; renderStatus('تعذر الاتصال',false); }
    finally { busy=false; showThinking(false); $('#promptInput').focus(); }
  }
  function speak(text) {
    if (!('speechSynthesis' in window)) { toast('ميزة القراءة الصوتية غير مدعومة في هذا المتصفح.'); return; }
    speechSynthesis.cancel(); const utterance = new SpeechSynthesisUtterance(safeText(text).slice(0,7000)); utterance.lang = /[\u0600-\u06FF]/.test(text) ? 'ar-EG' : 'en-US'; utterance.rate = 1.03; speechSynthesis.speak(utterance);
  }
  function newChat() { history=[]; saveHistory(); $('#messages').replaceChildren(); $('#welcome').hidden=false; if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  function openView(name) { $$('.view').forEach(v=>v.classList.toggle('active',v.id===name+'View')); $$('.side-link[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name)); const titles={chat:'المحادثة',images:'استوديو الصور',browser:'مساحة المتصفح',coding:'مساعد البرمجة'}; $('#viewTitle').textContent=titles[name]||'المحادثة'; $('#sidebar').classList.remove('open'); }
  $('#chatForm').addEventListener('submit', e=>{e.preventDefault();sendChat($('#promptInput').value);});
  $('#promptInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('#chatForm').requestSubmit();}});
  $('#promptInput').addEventListener('input',e=>{e.target.style.height='auto';e.target.style.height=Math.min(e.target.scrollHeight,190)+'px';});
  $('#newChat').addEventListener('click',newChat);
  $$('.suggestion').forEach(b=>b.addEventListener('click',()=>sendChat(b.dataset.prompt)));
  $$('[data-view]').forEach(b=>b.addEventListener('click',()=>openView(b.dataset.view)));
  $('#settingsButton').addEventListener('click',()=>$('#settingsDialog').showModal()); $('#topSettings').addEventListener('click',()=>$('#settingsDialog').showModal());
  $('#menuButton').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
  $('#speakToggle').addEventListener('click',()=>{speakReplies=!speakReplies;$('#speakToggle').classList.toggle('on',speakReplies);toast(speakReplies?'تم تفعيل قراءة الردود صوتيًا':'تم إيقاف قراءة الردود تلقائيًا');});
  $('#voiceButton').addEventListener('click',()=>{
    const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SpeechRecognition){toast('التعرف على الكلام غير مدعوم هنا. جرّب متصفحًا يدعم Web Speech API.');return;}
    if(recognition){recognition.stop();recognition=null;$('#voiceButton').classList.remove('on');return;}
    recognition=new SpeechRecognition();recognition.lang='ar-EG';recognition.interimResults=true;recognition.continuous=false;
    recognition.onresult=e=>{let transcript='';for(let i=e.resultIndex;i<e.results.length;i++)transcript+=e.results[i][0].transcript;$('#promptInput').value=transcript;};
    recognition.onerror=()=>toast('تعذر التقاط الصوت؛ تحقق من إذن الميكروفون.');recognition.onend=()=>{recognition=null;$('#voiceButton').classList.remove('on');};$('#voiceButton').classList.add('on');recognition.start();
  });
  $('#saveSettings').addEventListener('click',async()=>{
    settings.apiBase=$('#apiBase').value.trim();settings.chatModel=$('#chatModel').value.trim()||defaults.chatModel;settings.saveEndpoint=$('#saveEndpoint').checked;
    if(!/^https:\/\//i.test(settings.apiBase)){ $('#settingsStatus').textContent='أدخل رابط HTTPS صحيحًا لخادم API المنشور.'; return; }
    if(settings.saveEndpoint){try{localStorage.setItem(storeKey,JSON.stringify(settings));}catch{}}else{localStorage.removeItem(storeKey);}
    $('#settingsStatus').textContent='جارٍ اختبار الخادم…';renderStatus('جارٍ الاختبار');
    try{const root=apiRoot();const r=await fetch(root+'/api/health');const data=await r.json();if(!r.ok||!data.ok)throw new Error(data.error||'فشل الفحص');$('#settingsStatus').textContent='الخادم متاح. هذا الاختبار لا يضمن نجاح طلب النموذج حتى يُجرّب.';renderStatus('الخادم متاح',true);toast('نجح اختبار اتصال الخادم');}
    catch(err){$('#settingsStatus').textContent='لم ينجح الاتصال: '+err.message;renderStatus('تعذر الاتصال');}
  });
  $('#imageForm').addEventListener('submit',async e=>{
    e.preventDefault();const prompt=$('#imagePrompt').value.trim();if(!prompt)return toast('اكتب وصف الصورة أولًا.');const button=$('#generateImage');button.disabled=true;button.textContent='جارٍ التوليد…';$('#imageResult').innerHTML='<div class="thinking-bars"><i></i><i></i><i></i></div><p>يتم إرسال الطلب إلى نموذج الصور…</p>';
    try{const data=await requestJSON('/api/image',{prompt,model:$('#imageModel').value});if(!data.image)throw new Error('لم يرجع الخادم صورة.');const img=document.createElement('img');img.alt='الصورة التي أنشأها NOVA';img.src=data.image;const link=document.createElement('a');link.className='secondary-button';link.href=data.image;link.download='nova-image.png';link.textContent='فتح / حفظ الصورة';$('#imageResult').replaceChildren(img,link);}
    catch(err){$('#imageResult').textContent='تعذر توليد الصورة: '+err.message;toast('فشل توليد الصورة. تحقق من دعم النموذج وحصة المزوّد.');}
    finally{button.disabled=false;button.textContent='✦ توليد الصورة';}
  });
  $('#browserForm').addEventListener('submit',e=>{e.preventDefault();let url;try{url=new URL($('#browserUrl').value.trim());if(!['http:','https:'].includes(url.protocol))throw new Error();}catch{toast('أدخل رابطًا يبدأ بـ https:// أو http://');return;}$('#browserFrame').src=url.href;$('#openExternal').href=url.href;});
  $('#askCoding').addEventListener('click',()=>{const p=$('#codingPrompt').value.trim();if(!p)return toast('اكتب وصف المهمة البرمجية أولًا.');const full=p+($('#includeTests').checked?'\n\nأرفق اختبارات مناسبة، وخطوات تشغيل، ومراجعة أمنية مختصرة. لا تدّعِ تشغيل الاختبارات ما لم يتم تشغيلها فعليًا.':'');openView('chat');sendChat(full,'coding');});
  // Render this browser session's saved conversation.
  if(history.length){$('#welcome').hidden=true;history.slice(-30).forEach(m=>addMessage(m.role,m.content));}
  $('#apiBase').value=settings.apiBase;$('#chatModel').value=settings.chatModel;$('#saveEndpoint').checked=settings.saveEndpoint;renderStatus(apiRoot()?'تم حفظ إعدادات الخادم':'لم يتم ضبط الخادم');
})();