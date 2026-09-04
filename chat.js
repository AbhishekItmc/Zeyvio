/* Zeyvio chat agent — front end.
   Talks to /api/chat (a Vercel serverless function). The API key lives on the
   server, never here. If the endpoint is missing, this degrades to an email prompt. */
(function(){
  var CONTACT_EMAIL = 'hello@zeyvio.com';   // <-- change to the client's real address

  var GREETING = "Hi, I'm the Zeyvio assistant. I can explain what we build — AI applications, agents, enterprise AI, automation — and help scope a project. What are you working on?";
  var CHIPS = [
    'What does Zeyvio actually build?',
    'Can you automate our document processing?',
    'How long does an MVP take?',
    'I want to talk to a human'
  ];

  var history = [];      // [{role, content}] — sent to the API each turn
  var busy = false;

  /* ---------- markup ---------- */
  function build(mountInto){
    var panel = document.createElement('div');
    panel.className = 'chat-panel' + (mountInto ? ' open' : '');
    panel.innerHTML =
      '<div class="chat-head">' +
        '<span class="who">Zeyvio assistant</span>' +
        '<span class="st" data-st>online</span>' +
        (mountInto ? '' : '<button class="x" aria-label="Close chat">&times;</button>') +
      '</div>' +
      '<div class="chat-log" data-log aria-live="polite"></div>' +
      '<div class="chat-chips" data-chips></div>' +
      '<form class="chat-form" data-form>' +
        '<textarea rows="1" placeholder="Ask about your project…" data-input aria-label="Message"></textarea>' +
        '<button type="submit" data-send>Send</button>' +
      '</form>' +
      '<p class="chat-note">AI assistant — it can be wrong. For anything binding, email us.</p>';

    (mountInto || document.body).appendChild(panel);
    return panel;
  }

  var mount = document.getElementById('chat-mount');
  var panel = build(mount);
  var log   = panel.querySelector('[data-log]');
  var form  = panel.querySelector('[data-form]');
  var input = panel.querySelector('[data-input]');
  var send  = panel.querySelector('[data-send]');
  var chips = panel.querySelector('[data-chips]');
  var status= panel.querySelector('[data-st]');

  /* floating button, only when not embedded in a page */
  if (!mount){
    var fab = document.createElement('button');
    fab.className = 'chat-fab';
    fab.innerHTML = '<span class="fdot"></span>Talk to Zeyvio';
    document.body.appendChild(fab);

    fab.addEventListener('click', function(){
      panel.classList.add('open');
      fab.classList.add('hidden');
      input.focus();
      if (!history.length) greet();
    });
    panel.querySelector('.x').addEventListener('click', function(){
      panel.classList.remove('open');
      fab.classList.remove('hidden');
    });
  }

  /* ---------- rendering ---------- */
  function esc(t){
    return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  // very small subset of markdown: **bold**, blank-line paragraphs, "- " lists
  function fmt(text){
    var parts = esc(text).split(/\n{2,}/);
    return parts.map(function(block){
      block = block.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      if (/^\s*[-•]\s+/m.test(block)){
        var items = block.split(/\n/).filter(function(l){ return l.trim(); });
        return '<ul>' + items.map(function(l){
          return '<li>' + l.replace(/^\s*[-•]\s+/, '') + '</li>';
        }).join('') + '</ul>';
      }
      return '<p>' + block.replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }

  function addMsg(role, text, isErr){
    var el = document.createElement('div');
    el.className = 'msg ' + (role === 'user' ? 'me' : 'bot') + (isErr ? ' err' : '');
    el.innerHTML = role === 'user'
      ? '<p>' + esc(text).replace(/\n/g,'<br>') + '</p>'
      : '<div class="bubble">' + fmt(text) + '</div>';
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function showTyping(){
    var el = document.createElement('div');
    el.className = 'msg bot';
    el.innerHTML = '<div class="bubble typing"><i></i><i></i><i></i></div>';
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  function renderChips(list){
    chips.innerHTML = '';
    (list || []).forEach(function(t){
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = t;
      b.addEventListener('click', function(){ chips.innerHTML = ''; ask(t); });
      chips.appendChild(b);
    });
  }

  function greet(){
    addMsg('assistant', GREETING);
    renderChips(CHIPS);
  }

  /* ---------- talking to the API ---------- */
  function ask(text){
    if (busy || !text.trim()) return;
    text = text.trim().slice(0, 2000);
    busy = true;
    send.disabled = true;
    status.textContent = 'thinking';
    chips.innerHTML = '';

    addMsg('user', text);
    history.push({role:'user', content:text});
    var typing = showTyping();

    fetch('/api/chat', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({messages: history.slice(-12)})
    })
    .then(function(r){
      if (r.status === 404) throw new Error('no-endpoint');
      return r.json().then(function(d){
        if (!r.ok) throw new Error(d && d.error ? d.error : 'server');
        return d;
      });
    })
    .then(function(d){
      typing.remove();
      var reply = (d && d.reply) || '';
      if (!reply) throw new Error('empty');
      addMsg('assistant', reply);
      history.push({role:'assistant', content:reply});
      status.textContent = 'online';
    })
    .catch(function(err){
      typing.remove();
      var m = err && err.message;
      if (m === 'no-endpoint'){
        addMsg('assistant',
          "The chat backend isn't deployed yet, so I can't answer live.\n\n" +
          'Email us at **' + CONTACT_EMAIL + '** and a person will reply the same day.', true);
      } else if (m === 'rate') {
        addMsg('assistant', "That's a lot of questions at once — give it a minute and try again.", true);
      } else {
        addMsg('assistant',
          "Something broke on our side and I couldn't get an answer.\n\n" +
          'Try again in a moment, or email **' + CONTACT_EMAIL + '**.', true);
      }
      status.textContent = 'offline';
    })
    .then(function(){
      busy = false;
      send.disabled = false;
      input.focus();
    });
  }

  /* ---------- input handling ---------- */
  form.addEventListener('submit', function(e){
    e.preventDefault();
    var v = input.value;
    input.value = '';
    input.style.height = 'auto';
    ask(v);
  });

  input.addEventListener('input', function(){
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  });

  input.addEventListener('keydown', function(e){
    if (e.key === 'Enter' && !e.shiftKey){
      e.preventDefault();
      form.dispatchEvent(new Event('submit'));
    }
  });

  /* every "Talk to Zeyvio" button opens the chat instead of jumping to an anchor */
  document.querySelectorAll('[data-open-chat]').forEach(function(btn){
    btn.addEventListener('click', function(e){
      e.preventDefault();
      panel.classList.add('open');
      var f = document.querySelector('.chat-fab');
      if (f) f.classList.add('hidden');
      input.focus();
      if (!history.length) greet();
    });
  });

  if (mount) greet();   // full page: start straight away
})();
