/* 3D robot — realistic humanoid, black and white, ZEYVIO wordmark on the chest.
   Drag to rotate. Falls back to the SVG robot if WebGL or three.js is unavailable. */
(function(){
  var host = document.getElementById('robot3d');
  var wrap = host && host.closest('.robot-wrap');
  if (!host || !wrap || !window.THREE) return;

  var W = host.clientWidth || 320, H = host.clientHeight || 360;
  if (!W || !H) return;

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
  } catch (err) { return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(W, H);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  if (THREE.sRGBEncoding) renderer.outputEncoding = THREE.sRGBEncoding;
  host.appendChild(renderer.domElement);
  wrap.classList.add('is3d');

  var scene  = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(31, W / H, 0.1, 100);
  camera.position.set(0, 2.75, 9.2);
  camera.lookAt(0, 2.25, 0);

  /* ---- materials: painted white shell, graphite joints, dark glass visor ---- */
  var shell = new THREE.MeshStandardMaterial({color:0xF3F2EF, roughness:.42, metalness:.16});
  var shell2= new THREE.MeshStandardMaterial({color:0xE2E2DE, roughness:.5,  metalness:.12});
  var mid   = new THREE.MeshStandardMaterial({color:0xA9ADA9, roughness:.34, metalness:.42});
  var dark  = new THREE.MeshStandardMaterial({color:0x1B1E21, roughness:.44, metalness:.3});
  var glass = new THREE.MeshStandardMaterial({color:0x0D0F11, roughness:.14, metalness:.6});
  var glow  = new THREE.MeshStandardMaterial({color:0xFFFFFF, emissive:0xFFFFFF, emissiveIntensity:.9, roughness:.2});

  /* ---- lighting: soft studio setup so a white robot still reads on a white page ---- */
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9aa0a6, .55));
  var key = new THREE.DirectionalLight(0xffffff, .85);
  key.position.set(4.5, 8, 5.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -5; key.shadow.camera.right = 5;
  key.shadow.camera.top = 6;   key.shadow.camera.bottom = -1;
  key.shadow.radius = 3;
  scene.add(key);
  var fill = new THREE.DirectionalLight(0xffffff, .32); fill.position.set(-5, 3, 3);  scene.add(fill);
  var rim  = new THREE.DirectionalLight(0xffffff, .40); rim.position.set(-2, 4, -6);  scene.add(rim);

  // ground shadow only — no visible floor
  var ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({opacity:.16}));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /* ---- geometry helpers ---- */
  function roundedBox(w, h, d, r, mat){
    var s = new THREE.Shape();
    var x = -w/2, y = -h/2;
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);      s.absarc(x + w - r, y + r, r, -Math.PI/2, 0);
    s.lineTo(x + w, y + h - r);  s.absarc(x + w - r, y + h - r, r, 0, Math.PI/2);
    s.lineTo(x + r, y + h);      s.absarc(x + r, y + h - r, r, Math.PI/2, Math.PI);
    s.lineTo(x, y + r);          s.absarc(x + r, y + r, r, Math.PI, Math.PI*1.5);
    var bevel = Math.min(.045, d/4);
    var geo = new THREE.ExtrudeGeometry(s, {
      depth: Math.max(.02, d - bevel*2), bevelEnabled:true,
      bevelThickness:bevel, bevelSize:bevel, bevelSegments:2, curveSegments:8
    });
    geo.center();
    var m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    return m;
  }
  function cyl(rt, rb, h, mat, seg){
    var m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg || 24), mat);
    m.castShadow = true; return m;
  }
  function ball(r, mat){
    var m = new THREE.Mesh(new THREE.SphereGeometry(r, 26, 20), mat);
    m.castShadow = true; return m;
  }
  function seam(w, h, d, x, y, z, parent){
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), dark);
    m.position.set(x, y, z); parent.add(m); return m;
  }

  var pivot = new THREE.Group();
  var body  = new THREE.Group();
  pivot.add(body); scene.add(pivot);

  /* ---- legs and feet: planted, so the robot has weight ---- */
  function leg(side){
    var g = new THREE.Group();
    g.position.x = side * .40;
    var foot = roundedBox(.40, .18, .62, .07, shell2); foot.position.set(0, .09, .09); g.add(foot);
    var ankle = ball(.13, mid);   ankle.position.y = .22;  g.add(ankle);
    var shin  = cyl(.155, .175, .60, shell); shin.position.y = .55; g.add(shin);
    var knee  = ball(.185, mid);  knee.position.y = .87;   g.add(knee);
    var thigh = cyl(.20, .185, .60, shell);  thigh.position.y = 1.18; g.add(thigh);
    seam(.30, .012, .04, 0, .55, .17, g);
    body.add(g); return g;
  }
  leg(-1); leg(1);

  // hips + waist
  var hips = roundedBox(1.06, .40, .74, .16, shell); hips.position.y = 1.60; body.add(hips);
  var waist = cyl(.34, .38, .26, dark); waist.position.y = 1.86; body.add(waist);

  /* ---- torso with the ZEYVIO plate ---- */
  var torso = roundedBox(1.50, 1.36, 1.00, .26, shell); torso.position.y = 2.55; body.add(torso);
  var collar = roundedBox(1.10, .22, .80, .10, shell2); collar.position.y = 3.24; body.add(collar);
  seam(1.30, .014, .02, 0, 2.05, .50, body);
  seam(.014, .70, .02, -.62, 2.60, .48, body);
  seam(.014, .70, .02,  .62, 2.60, .48, body);

  // dark chest plate the wordmark sits on
  var plate = roundedBox(1.06, .50, .10, .10, dark);
  plate.position.set(0, 2.62, .49); body.add(plate);

  // wordmark drawn to a canvas, then mapped onto the plate
  var cvs = document.createElement('canvas');
  cvs.width = 640; cvs.height = 260;
  var tex = new THREE.CanvasTexture(cvs);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy ? renderer.capabilities.getMaxAnisotropy() : 1;

  function drawWordmark(){
    var c = cvs.getContext('2d');
    c.clearRect(0, 0, cvs.width, cvs.height);
    c.fillStyle = '#F6F5F1';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.font = '600 132px "Inter Tight", Inter, Helvetica, Arial, sans-serif';
    c.letterSpacing = '10px';           // ignored by older engines, harmless
    c.fillText('ZEYVIO', cvs.width/2, cvs.height/2 + 4);
    tex.needsUpdate = true;
  }
  drawWordmark();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(drawWordmark);

  var label = new THREE.Mesh(
    new THREE.PlaneGeometry(.92, .375),
    new THREE.MeshBasicMaterial({map:tex, transparent:true})
  );
  label.position.set(0, 2.62, .552); body.add(label);

  // status light below the plate
  var core = ball(.075, glow); core.position.set(0, 2.16, .50); body.add(core);
  var coreRing = cyl(.135, .135, .03, mid, 28); coreRing.rotation.x = Math.PI/2;
  coreRing.position.set(0, 2.16, .49); body.add(coreRing);

  /* ---- head ---- */
  var neck = cyl(.20, .22, .26, dark); neck.position.y = 3.42; body.add(neck);
  var head = new THREE.Group(); head.position.y = 3.98; body.add(head);

  var skull = roundedBox(1.34, 1.06, 1.14, .30, shell); head.add(skull);
  var brow  = roundedBox(1.30, .16, 1.02, .07, shell2); brow.position.set(0, .44, .04); head.add(brow);
  var visor = roundedBox(1.10, .46, .10, .18, glass);   visor.position.set(0, .02, .56); head.add(visor);
  var eyeL = ball(.075, glow); eyeL.position.set(-.25, .04, .615); head.add(eyeL);
  var eyeR = ball(.075, glow); eyeR.position.set( .25, .04, .615); head.add(eyeR);
  var mouth = roundedBox(.44, .10, .06, .04, mid); mouth.position.set(0, -.34, .55); head.add(mouth);

  // ear pods
  function pod(side){
    var g = new THREE.Group();
    var outer = cyl(.20, .20, .12, shell2, 28); outer.rotation.z = Math.PI/2;
    var inner = cyl(.11, .11, .15, dark, 24);   inner.rotation.z = Math.PI/2;
    g.add(outer); g.add(inner);
    g.position.set(side * .70, -.02, 0);
    head.add(g);
  }
  pod(-1); pod(1);

  // antenna
  var stalk = cyl(.03, .03, .46, mid, 12); stalk.position.y = .72; head.add(stalk);
  var tip = ball(.085, glow); tip.position.y = .98; head.add(tip);

  /* ---- arms ---- */
  function arm(side){
    var g = new THREE.Group();
    g.position.set(side * .86, 3.02, 0);

    var shoulder = ball(.28, mid); g.add(shoulder);
    var pauldron = roundedBox(.34, .46, .72, .14, shell);
    pauldron.position.set(side * .12, -.06, 0); g.add(pauldron);

    var upper = cyl(.155, .14, .62, shell); upper.position.y = -.52; g.add(upper);
    var elbow = ball(.155, mid);            elbow.position.y = -.86; g.add(elbow);

    var fore = new THREE.Group(); fore.position.y = -.86; g.add(fore);
    var forearm = cyl(.14, .125, .58, shell); forearm.position.y = -.32; fore.add(forearm);
    var wrist = ball(.115, mid);              wrist.position.y = -.62; fore.add(wrist);
    var palm  = roundedBox(.24, .28, .16, .06, shell2); palm.position.y = -.80; fore.add(palm);
    var f1 = roundedBox(.06, .17, .07, .025, mid); f1.position.set(-.06, -.98, .02); fore.add(f1);
    var f2 = roundedBox(.06, .17, .07, .025, mid); f2.position.set( .02, -.99, .02); fore.add(f2);
    var thumb = roundedBox(.06, .12, .07, .025, mid);
    thumb.position.set(side * .11, -.90, .03); thumb.rotation.z = side * .5; fore.add(thumb);

    body.add(g);
    return {root:g, fore:fore};
  }
  var armL = arm(-1), armR = arm(1);

  /* ---- interaction ---- */
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var yaw = -0.38, pitch = 0, dragging = false, lastX = 0, lastY = 0, lastInput = 0;

  function down(e){
    dragging = true; host.classList.add('dragging');
    var p = e.touches ? e.touches[0] : e;
    lastX = p.clientX; lastY = p.clientY; lastInput = performance.now();
  }
  function move(e){
    if (!dragging) return;
    var p = e.touches ? e.touches[0] : e;
    yaw += (p.clientX - lastX) * 0.009;
    pitch = Math.max(-.28, Math.min(.28, pitch + (p.clientY - lastY) * 0.0035));
    lastX = p.clientX; lastY = p.clientY; lastInput = performance.now();
    if (e.cancelable && e.touches) e.preventDefault();
  }
  function up(){ dragging = false; host.classList.remove('dragging'); }

  host.addEventListener('mousedown', down);
  window.addEventListener('mousemove', move, {passive:true});
  window.addEventListener('mouseup', up);
  host.addEventListener('touchstart', down, {passive:true});
  host.addEventListener('touchmove', move, {passive:false});
  window.addEventListener('touchend', up);

  var tpx = 0, tpy = 0, px = 0, py = 0;
  window.addEventListener('mousemove', function(e){
    if (dragging) return;
    var r = host.getBoundingClientRect();
    tpx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width/2)) / (window.innerWidth * .45)));
    tpy = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height*.3)) / (window.innerHeight * .5)));
  }, {passive:true});

  var visible = true;
  if (window.IntersectionObserver){
    new IntersectionObserver(function(en){ visible = en[0].isIntersecting; }, {threshold:0}).observe(host);
  }
  window.addEventListener('resize', function(){
    var w = host.clientWidth, h = host.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  });

  if (reduce){
    pivot.rotation.y = yaw;
    renderer.render(scene, camera);
    return;
  }

  var t0 = performance.now();
  function tick(now){
    requestAnimationFrame(tick);
    if (!visible) return;
    var t = (now - t0) / 1000;

    if (!dragging && now - lastInput > 2200){
      yaw += 0.0026;                       // slow idle turn
      pitch += (0 - pitch) * 0.02;
    }
    px += (tpx - px) * .06;
    py += (tpy - py) * .06;

    pivot.rotation.y = yaw;
    pivot.rotation.x = pitch;

    // idle: breathing and a small weight shift, feet stay planted
    body.position.y = Math.sin(t * 1.1) * 0.022;
    body.rotation.z = Math.sin(t * .62) * 0.008;
    torso.scale.set(1, 1 + Math.sin(t * 1.1) * 0.006, 1);

    head.rotation.y = px * 0.40;
    head.rotation.x = py * 0.15 + Math.sin(t * .8) * .01;
    head.rotation.z = px * 0.05;

    armL.root.rotation.x = Math.sin(t * 1.1) * 0.055;
    armR.root.rotation.x = -Math.sin(t * 1.1) * 0.055;
    armL.fore.rotation.x = Math.sin(t * 1.1 + .5) * 0.045;
    armR.fore.rotation.x = -Math.sin(t * 1.1 + .5) * 0.045;

    var beat = .55 + Math.abs(Math.sin(t * 1.6)) * .75;
    glow.emissiveIntensity = beat;
    tip.scale.setScalar(.92 + Math.sin(t * 1.6) * .1);

    var cycle = t % 5.8;
    var lid = cycle > 5.62 ? .1 : 1;
    eyeL.scale.y = lid; eyeR.scale.y = lid;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(tick);
})();

/* realtime robot — eyes and head follow the pointer, idle drift when it's still */
(function(){
  var svg    = document.querySelector('.robot');
  var head   = document.getElementById('r-head');
  var pupils = document.getElementById('r-pupils');
  if (!svg || !head || !pupils) return;
  if (svg.closest('.robot-wrap').classList.contains('is3d')) return; // 3D took over

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  var tx = 0, ty = 0;      // target, normalised -1..1
  var cx = 0, cy = 0;      // current, eased toward target
  var lastMove = 0;
  var IDLE_AFTER = 2600;   // ms of stillness before it looks around on its own

  function onMove(e){
    var p = e.touches ? e.touches[0] : e;
    var r = svg.getBoundingClientRect();
    if (!r.width) return;
    var ex = r.left + r.width / 2;
    var ey = r.top + r.height * 0.30;   // roughly where the eyes sit
    tx = Math.max(-1, Math.min(1, (p.clientX - ex) / (window.innerWidth * 0.42)));
    ty = Math.max(-1, Math.min(1, (p.clientY - ey) / (window.innerHeight * 0.45)));
    lastMove = performance.now();
  }

  window.addEventListener('mousemove', onMove, {passive:true});
  window.addEventListener('touchmove', onMove, {passive:true});

  function frame(now){
    // no pointer for a while: sweep the room slowly instead of freezing
    if (now - lastMove > IDLE_AFTER){
      tx = Math.sin(now / 2400) * 0.72;
      ty = Math.sin(now / 3700) * 0.34;
    }

    cx += (tx - cx) * 0.075;
    cy += (ty - cy) * 0.075;

    // pupils travel furthest, head tilts a little, both read as "looking"
    pupils.setAttribute('transform',
      'translate(' + (cx * 5.2).toFixed(2) + ',' + (cy * 3.4).toFixed(2) + ')');
    head.setAttribute('transform',
      'translate(' + (cx * 6).toFixed(2) + ',' + (cy * 2.4).toFixed(2) + ') ' +
      'rotate(' + (cx * 3.4).toFixed(2) + ' 150 174)');

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* running code background — decorative, built in JS to keep the markup clean */
(function(){
  var host = document.getElementById('codebg');
  if (!host) return;

  var snippets = [
"async function runAgent(goal) {",
"  const plan = await reason(goal);",
"  for (const step of plan) {",
"    const result = await act(step);",
"    if (result.needsHuman) await approve(step);",
"  }",
"  return summarize(plan);",
"}",
"",
"class Retriever(nn.Module):",
"    def forward(self, query, docs):",
"        scores = query @ docs.T / self.temp",
"        return scores.softmax(dim=-1)",
"",
"def embed(chunks: list[str]) -> None:",
"    vectors = model.encode(chunks)",
"    index.upsert(vectors, namespace=tenant)",
"",
"pipeline:",
"  - extract: documents",
"  - classify: intent",
"  - route: workflow",
"  - act: erp.create_order()",
"",
"SELECT customer_id, churn_score",
"FROM intelligence.predictions",
"WHERE confidence > 0.85;",
"",
"const layer = zeyvio.connect({",
"  crm: true, erp: true, warehouse: true,",
"  policy: 'human-in-the-loop'",
"});",
"",
"model.fit(train, epochs=12)",
"eval.report(accuracy, latency, drift)",
"",
"@agent.tool",
"def create_ticket(summary: str) -> str:",
"    return jira.issues.create(summary)",
""
  ];

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cols = window.innerWidth < 860 ? 2 : 4;

  function esc(t){
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  var KW = /^(async|await|function|const|let|var|for|of|in|return|class|def|if|else|import|from|new|yield|true|false|null|None|self|select|where|pipeline|model)$/i;

  function highlight(line){
    // comments swallow the rest of the line
    var cut = line.search(/#|\/\//);
    var comment = '';
    if (cut > -1){ comment = line.slice(cut); line = line.slice(0, cut); }

    // one pass only — a second .replace() would match the spans this one inserts
    var TOKEN = /("[^"]*"|'[^']*')|\b(\d+\.?\d*)\b|\b([A-Za-z_][A-Za-z0-9_]*)\b/g;
    var out = esc(line).replace(TOKEN, function(m, str, num, word){
      if (str) return '<span class="st">' + str + '</span>';
      if (num) return '<span class="st">' + num + '</span>';
      if (word && KW.test(word)) return '<span class="kw">' + word + '</span>';
      return m;
    });

    if (comment) out += '<span class="cm">' + esc(comment) + '</span>';
    return out;
  }

  for (var c = 0; c < cols; c++){
    var col = document.createElement('div');
    col.className = 'codecol';
    var lines = [];
    var offset = c * 9;
    for (var i = 0; i < 46; i++){
      lines.push(highlight(snippets[(i + offset) % snippets.length]));
    }
    var body = lines.join('\n');
    var pre = document.createElement('pre');
    pre.innerHTML = body + '\n' + body; // duplicated for a seamless loop
    col.appendChild(pre);
    if (!reduce){
      col.style.animationDuration = (46 + c * 11) + 's';
      col.style.animationDelay = (-c * 7) + 's';
    }
    host.appendChild(col);
  }
})();

(function(){
  var track = document.getElementById('loop');
  if (!track) return;
  var nodes = track.querySelectorAll('.node');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce){
    track.classList.add('lit');
    Array.prototype.forEach.call(nodes, function(n){ n.classList.add('on'); });
    return;
  }
  setTimeout(function(){
    track.classList.add('lit');
    Array.prototype.forEach.call(nodes, function(n, i){
      setTimeout(function(){ n.classList.add('on'); }, i * 290);
    });
  }, 500);
})();

/* mobile menu: the Menu button builds a drawer from the desktop links */
(function(){
  var btn = document.querySelector('.nav-burger');
  var links = document.querySelector('.nav-links');
  var nav = document.querySelector('.nav');
  if (!btn || !links || !nav) return;

  var drawer = document.createElement('div');
  drawer.className = 'nav-drawer';
  drawer.innerHTML = links.innerHTML + '<a href="talk.html">Talk to Zeyvio</a>';
  nav.appendChild(drawer);

  btn.setAttribute('aria-expanded','false');
  btn.addEventListener('click', function(){
    var open = drawer.classList.toggle('open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.textContent = open ? 'Close' : 'Menu';
  });
})();
