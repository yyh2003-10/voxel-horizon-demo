class HUD {
  constructor(game) {
    this.g = game;
    this.markers = [];
    this.compass = document.getElementById('compass');
    this.cctx = this.compass.getContext('2d');
    this.toastMap = new Map();
    this.msQueue = [];
    this.msShowing = false;
    this.alertOn = false;
    this.minimapTimer = 0;
    this.minimapCanvas = document.getElementById('minimap');
    this.minimapCtx = this.minimapCanvas.getContext('2d');
    this.minimapBigCanvas = document.getElementById('minimap-big');
    this.minimapBigCtx = this.minimapBigCanvas.getContext('2d');
    this.minimapExpanded = false;
  }

  init() {
    const hp = document.getElementById('hp-segs');
    hp.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const d = document.createElement('div');
      d.className = 'hp-seg';
      hp.appendChild(d);
    }
    document.getElementById('haz-ico').textContent = HAZ_ICONS[this.g.palette.hazard.type] || '☢';
    // 小地图点击展开
    const minimapWrap = document.getElementById('minimap-wrap');
    if (minimapWrap) {
      minimapWrap.addEventListener('click', () => this.showExpandedMap());
      minimapWrap.addEventListener('touchend', (e) => { e.preventDefault(); this.showExpandedMap(); });
    }
    // 全屏地图点击传送
    const minimapBig = this.minimapBigCanvas;
    if (minimapBig) {
      minimapBig.addEventListener('click', (e) => this.onExpandedMapClick(e));
    }
  }

  update(dt) {
    const g = this.g, p = g.player;
    if (!p) return;
    const segs = document.querySelectorAll('.hp-seg');
    const hpFrac = p.hp / 100;
    segs.forEach((s, i) => {
      const th = (i + 1) / 4;
      s.classList.toggle('off', hpFrac < th - 0.24);
      s.classList.toggle('hurt', hpFrac < 0.3);
    });
    const sh = document.getElementById('shield-fill');
    sh.style.width = Math.max(0, Math.min(100, p.hp)) + '%';
    const haz = document.getElementById('haz-fill');
    haz.style.width = p.hazard + '%';
    haz.classList.toggle('low', p.hazard < 25);
    const ls = document.getElementById('ls-fill');
    ls.style.width = p.ls + '%';
    ls.classList.toggle('low', p.ls < 25);
    document.getElementById('jet-bar').style.height = p.jetFuel + '%';

    const night = g.sky.dayMix < 0.35;
    document.getElementById('env-icon').textContent = g.stormActive ? '⚠' : night ? '☾' : '☀';
    document.getElementById('env-label').textContent = g.stormActive ? g.palette.storm.label : night ? '夜晚 · ' + g.palette.hazard.nightLabel : '白昼 · ' + g.palette.hazard.label;

    this.drawCompass();
    this.updateMarkers(dt);
    // 小地图刷新（每0.5秒）
    this.minimapTimer += dt;
    if (this.minimapTimer >= 0.5) {
      this.minimapTimer = 0;
      this.drawMinimap();
    }
  }

  drawCompass() {
    const g = this.g, ctx = this.cctx;
    const W = this.compass.width, H = this.compass.height;
    ctx.clearRect(0, 0, W, H);
    const yaw = g.player.inShip ? g.ship.yaw : g.player.yaw;
    let deg = (-yaw * 180 / Math.PI) % 360;
    if (deg < 0) deg += 360;
    const pxPerDeg = 4.4;
    ctx.font = '600 15px Rajdhani';
    ctx.textAlign = 'center';
    for (let d = -100; d <= 100; d += 5) {
      let a = Math.round((deg + d) / 5) * 5;
      const x = W / 2 + (a - deg) * pxPerDeg;
      if (x < 10 || x > W - 10) continue;
      const norm = ((a % 360) + 360) % 360;
      const alpha = 1 - Math.pow(Math.abs(x - W / 2) / (W / 2), 1.6);
      if (norm % 90 === 0) {
        const L = ['N', 'E', 'S', 'W'][Math.round(norm / 90) % 4];
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fillText(L, x, 20);
        ctx.fillRect(x - 1, 26, 2, 10);
      } else if (norm % 45 === 0) {
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.75})`;
        ctx.fillRect(x - 0.5, 28, 1.5, 8);
      } else {
        ctx.fillStyle = `rgba(255,255,255,${alpha * 0.35})`;
        ctx.fillRect(x - 0.5, 31, 1, 5);
      }
    }
    if (!g.player.inShip) {
      const sp = g.ship.group.position;
      const dx = sp.x - g.player.pos.x, dz = sp.z - g.player.pos.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      if (dist > 8) {
        let bearing = Math.atan2(dx, -dz) * 180 / Math.PI;
        let rel = bearing - deg;
        while (rel > 180) rel -= 360;
        while (rel < -180) rel += 360;
        const x = W / 2 + rel * pxPerDeg;
        if (x > 8 && x < W - 8) {
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(x, 38); ctx.lineTo(x - 5, 46); ctx.lineTo(x + 5, 46);
          ctx.closePath(); ctx.fill();
          ctx.font = '600 10px Rajdhani';
          ctx.fillText(U.fmtDist(dist), x, 12);
          ctx.font = '600 15px Rajdhani';
        }
      }
    }
  }

  addMarker(type, pos, ttl) {
    const icons = { na: 'Na', h2: 'H', o2: 'O₂', fe: 'Fe', cu: 'Cu' };
    const el = document.createElement('div');
    el.className = 'marker ' + type;
    el.innerHTML = `<div class="m-ico">${icons[type] || '?'}</div><div class="m-dist"></div>`;
    document.getElementById('marker-layer').appendChild(el);
    this.markers.push({ el, pos, ttl, type });
  }

  updateMarkers(dt) {
    const g = this.g;
    const cam = g.camera;
    const v = new THREE.Vector3();
    for (let i = this.markers.length - 1; i >= 0; i--) {
      const m = this.markers[i];
      m.ttl -= dt;
      const blockGone = g.world.getBlock(Math.floor(m.pos.x), Math.floor(m.pos.y), Math.floor(m.pos.z)) === B.AIR;
      if (m.ttl <= 0 || blockGone) {
        m.el.remove();
        this.markers.splice(i, 1);
        continue;
      }
      v.copy(m.pos).project(cam);
      const behind = v.z > 1;
      if (behind || v.x < -1.05 || v.x > 1.05 || v.y < -1.05 || v.y > 1.05) {
        m.el.style.opacity = 0;
        continue;
      }
      const d = m.pos.distanceTo(g.player.pos);
      m.el.style.opacity = m.ttl < 3 ? m.ttl / 3 : 1;
      m.el.style.left = ((v.x + 1) / 2 * innerWidth) + 'px';
      m.el.style.top = ((-v.y + 1) / 2 * innerHeight) + 'px';
      m.el.querySelector('.m-dist').textContent = U.fmtDist(d);
    }
  }
  clearMarkers() {
    for (const m of this.markers) m.el.remove();
    this.markers = [];
  }

  scanFlash() {
    const el = document.createElement('div');
    el.style.cssText = 'position:absolute;left:50%;top:50%;width:10px;height:10px;border:2px solid rgba(120,230,245,.8);border-radius:50%;transform:translate(-50%,-50%);pointer-events:none;z-index:30';
    document.getElementById('hud').appendChild(el);
    el.animate([
      { width: '10px', height: '10px', opacity: 1 },
      { width: '160vmax', height: '160vmax', opacity: 0 }
    ], { duration: 900, easing: 'ease-out' }).onfinish = () => el.remove();
  }

  toast(itemId, n) {
    const key = itemId;
    let t = this.toastMap.get(key);
    if (t && document.body.contains(t.el)) {
      t.n += n;
      t.el.querySelector('.tc').textContent = '+' + t.n;
      clearTimeout(t.timer);
    } else {
      const el = document.createElement('div');
      el.className = 'toast';
      el.innerHTML = `<img src="${this.g.atlas.icon(itemId)}"><span>${ITEMS[itemId].name}</span><span class="tc">+${n}</span>`;
      document.getElementById('toasts').appendChild(el);
      t = { el, n };
      this.toastMap.set(key, t);
    }
    t.timer = setTimeout(() => {
      t.el.classList.add('fade');
      setTimeout(() => t.el.remove(), 500);
      this.toastMap.delete(key);
    }, 1800);
  }

  notify(text, kind) {
    const g = this.g;
    const el = document.createElement('div');
    el.className = 'notice ' + (kind || 'info');
    const kickers = { info: '信息 // INFO', success: '完成 // DONE', warn: '注意 // CAUTION', danger: '警报 // ALERT' };
    el.innerHTML = `<span class="n-kicker">${kickers[kind] || kickers.info}</span>${text}`;
    const stack = document.getElementById('notify-stack');
    stack.appendChild(el);
    while (stack.children.length > 5) stack.firstChild.remove();
    g.audio.notify(kind);
    setTimeout(() => {
      el.classList.add('fade');
      setTimeout(() => el.remove(), 450);
    }, 5200);
  }

  alert(text, on) {
    const el = document.getElementById('alert-center');
    if (on && text) {
      el.classList.remove('hidden');
      document.getElementById('alert-text').textContent = text;
    } else el.classList.add('hidden');
  }

  milestone(kicker, title, sub) {
    this.msQueue.push({ kicker, title, sub });
    this.pumpMilestone();
  }
  pumpMilestone() {
    if (this.msShowing || this.msQueue.length === 0) return;
    const m = this.msQueue.shift();
    this.msShowing = true;
    const el = document.getElementById('milestone-pop');
    document.getElementById('ms-kicker').textContent = m.kicker;
    document.getElementById('ms-title').textContent = m.title;
    document.getElementById('ms-sub').textContent = m.sub || '';
    el.classList.remove('hidden');
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = '';
    this.g.audio.milestone();
    setTimeout(() => {
      el.classList.add('hidden');
      this.msShowing = false;
      this.pumpMilestone();
    }, 3700);
  }

  setMission(title, desc, cur, max) {
    const card = document.getElementById('mission-card');
    if (!title) { card.classList.add('hidden'); return; }
    card.classList.remove('hidden');
    document.getElementById('mission-title').textContent = title;
    document.getElementById('mission-desc').textContent = desc;
    const pw = document.getElementById('mission-prog-wrap');
    if (max > 0) {
      pw.style.display = 'flex';
      document.getElementById('mission-prog').style.width = Math.min(100, cur / max * 100) + '%';
      document.getElementById('mission-count').textContent = `${Math.min(cur, max)} / ${max}`;
    } else pw.style.display = 'none';
  }

  showPrompt(key, text, prog) {
    const el = document.getElementById('interact-hint');
    el.classList.remove('hidden');
    document.getElementById('hint-key').textContent = key;
    document.getElementById('hint-text').textContent = text;
    const ring = document.getElementById('hold-ring-fg');
    ring.style.strokeDashoffset = 113 - 113 * U.clamp(prog, 0, 1);
  }
  hidePrompt() { document.getElementById('interact-hint').classList.add('hidden'); }

  setMineProgress(p) {
    document.getElementById('mine-ring-fg').style.strokeDashoffset = 151 - 151 * U.clamp(p, 0, 1);
  }
  setHeat(h, hot) {
    const el = document.getElementById('heat-bar');
    el.style.height = U.clamp(h, 0, 1) * 100 + '%';
    el.style.background = hot ? '#ff3c2c' : '';
  }

  setFlightHud(on) {
    document.getElementById('flight-hud').classList.toggle('hidden', !on);
    document.getElementById('crosshair').classList.toggle('hidden', on);
    document.getElementById('hotbar').classList.toggle('hidden', on);
    document.getElementById('stats-left').classList.toggle('hidden', on);
    document.getElementById('stats-right').classList.toggle('hidden', on);
    const fly = document.getElementById('touch-fly');
    const arc = document.getElementById('touch-arc');
    const joyBase = document.getElementById('joy-base');
    const joyZone = document.getElementById('joy-zone');
    if (fly) fly.style.display = on ? 'flex' : 'none';
    if (arc) arc.style.display = on ? 'none' : 'flex';
    if (joyBase) joyBase.style.display = on ? 'none' : '';
    if (joyZone) joyZone.style.display = on ? 'none' : '';
  }

  closeShipPanel() { this.g.ship.closePanel(); }

  /**
   * 睡觉覆盖层
   */
  showSleepScreen(on) {
    let el = document.getElementById('sleep-overlay');
    if (on && !el) {
      el = document.createElement('div');
      el.id = 'sleep-overlay';
      el.style.cssText = 'position:fixed;inset:0;z-index:100;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);pointer-events:none;';
      el.innerHTML = '<div style="color:#c8d8f0;font:700 28px Rajdhani,sans-serif;letter-spacing:3px;margin-bottom:20px;">睡觉中… // SLEEPING</div><div style="width:240px;height:6px;background:rgba(255,255,255,0.15);border-radius:3px;overflow:hidden;"><div id="sleep-bar" style="height:100%;width:0%;background:linear-gradient(90deg,#6ab4e8,#a8d8ff);border-radius:3px;transition:width 0.1s;"></div></div>';
      document.getElementById('app').appendChild(el);
    }
    if (!on && el) {
      el.style.opacity = '0';
      el.style.transition = 'opacity 0.5s';
      setTimeout(() => el.remove(), 500);
    }
    if (on) {
      // 睡觉开始时闪白
      const flash = document.getElementById('damage-flash');
      flash.style.background = 'rgba(200,220,255,0.4)';
      flash.classList.add('hit');
      setTimeout(() => { flash.classList.remove('hit'); flash.style.background = ''; }, 300);
    }
  }

  updateSleepBar(progress) {
    const bar = document.getElementById('sleep-bar');
    if (bar) bar.style.width = (progress * 100) + '%';
  }

  showTradeScreen(native) {
    this.hideTradeScreen();
    const el = document.createElement('div');
    el.id = 'trade-screen';
    el.className = 'screen';

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.style.cssText = 'position:relative;width:min(520px,90vw);max-height:80vh;display:flex;flex-direction:column;padding:24px 28px;overflow-y:auto;';

    const title = document.createElement('h3');
    title.style.cssText = 'font-family:var(--fh);font-size:18px;letter-spacing:3px;margin-bottom:16px;';
    title.textContent = native.name + ' — 交易';
    panel.appendChild(title);

    const trades = native.tradeItems || [];
    if (trades.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'detail-empty';
      empty.textContent = '没有可用的交易';
      panel.appendChild(empty);
    } else {
      for (const trade of trades) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--line2);';

        const info = document.createElement('span');
        const giveName = ITEMS[trade.give] ? ITEMS[trade.give].name : trade.give;
        const takeName = ITEMS[trade.take] ? ITEMS[trade.take].name : trade.take;
        info.textContent = '给出 ' + giveName + ' ×' + trade.giveN + '  →  获取 ' + takeName + ' ×' + trade.takeN;
        info.style.cssText = 'font-size:14px;letter-spacing:1px;';

        const btn = document.createElement('button');
        btn.className = 'btn sm';
        btn.textContent = '交易';
        btn.addEventListener('click', () => {
          this.g.natives.executeTrade(trade);
        });

        row.appendChild(info);
        row.appendChild(btn);
        panel.appendChild(row);
      }
    }

    const closeRow = document.createElement('div');
    closeRow.style.cssText = 'display:flex;justify-content:center;margin-top:18px;';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn sm';
    closeBtn.textContent = '关闭';
    closeBtn.addEventListener('click', () => this.hideTradeScreen());
    closeRow.appendChild(closeBtn);
    panel.appendChild(closeRow);

    el.appendChild(panel);
    // 点击背景关闭（触屏兼容）
    el.addEventListener('click', (e) => { if (e.target === el) this.hideTradeScreen(); });
    el.addEventListener('touchstart', (e) => { if (e.target === el) this.hideTradeScreen(); }, { passive: true });
    document.getElementById('app').appendChild(el);
  }

  hideTradeScreen() {
    const el = document.getElementById('trade-screen');
    if (el) el.remove();
  }

  planetCard(info) {
    const el = document.getElementById('planet-card');
    document.getElementById('pc-name').textContent = info.name;
    document.getElementById('pc-climate').textContent = info.climate;
    document.getElementById('pc-flora').textContent = info.flora;
    document.getElementById('pc-fauna').textContent = info.fauna;
    document.getElementById('pc-storm').textContent = info.storm;
    const res = document.getElementById('pc-res');
    res.innerHTML = '';
    for (const r of info.res) {
      const d = document.createElement('div');
      d.className = 'res-chip';
      d.style.borderColor = ITEMS[r].col || '#fff';
      d.style.color = ITEMS[r].col || '#fff';
      d.textContent = ITEMS[r].name;
      res.appendChild(d);
    }
    el.classList.remove('hidden');
    clearTimeout(this.pcT);
    this.pcT = setTimeout(() => el.classList.add('hidden'), 6000);
  }

  renderDiscoveries() {
    const g = this.g;
    const pl = document.getElementById('disc-planets');
    pl.innerHTML = '';
    for (const p of g.discoveries.planets) {
      const d = document.createElement('div');
      d.className = 'disc-row';
      d.innerHTML = `<div class="d-ico">◍</div><div>${p.name}<div style="font-size:11px;opacity:.6">${p.climate}</div></div><div class="d-sub">${p.visited}次着陆</div>`;
      pl.appendChild(d);
    }
    const sp = document.getElementById('disc-species');
    sp.innerHTML = '';
    if (g.discoveries.entries.length === 0) sp.innerHTML = '<div class="detail-empty">使用分析目镜 [F] 记录生物与植物</div>';
    for (const e of g.discoveries.entries) {
      const d = document.createElement('div');
      d.className = 'disc-row';
      const ico = e.kind === '生物' ? '❋' : e.kind === '植物' ? '❀' : '◆';
      d.innerHTML = `<div class="d-ico">${ico}</div><div>${e.name}</div><div class="d-sub">${e.kind} · ${e.planet}<br>+${e.units} ◈</div>`;
      sp.appendChild(d);
    }
    const mi = document.getElementById('disc-miles');
    mi.innerHTML = '';
    for (const def of MILESTONE_DEFS) {
      const st = g.milestones.stats[def.key] || 0;
      const tier = g.milestones.tier(def, st);
      const next = def.tiers[Math.min(tier, def.tiers.length - 1)];
      const d = document.createElement('div');
      d.className = 'mile-row';
      d.innerHTML = `<b>${def.name}</b> ${tier >= def.tiers.length ? '(满级)' : '等级 ' + tier}<span class="m-prog">${Math.floor(st)} / ${next} ${def.unit}</span>`;
      mi.appendChild(d);
    }
  }

  /* ===== 小地图系统 ===== */

  // 绘制地图图标（建筑/设备/NPC/飞船）
  drawMapIcons(ctx, W, H, range, px, pz) {
    const g = this.g;
    const scale = W / (range * 2); // 像素/格

    // --- 扫描特殊方块（宝箱/床/灯柱）---
    const interestingBlocks = [];
    for (let iy = 0; iy < H; iy += 2) {
      for (let ix = 0; ix < W; ix += 2) {
        const wx = Math.floor(px - range + ix / scale);
        const wz = Math.floor(pz - range + iy / scale);
        const sy = g.world.surfaceY(wx, wz);
        if (sy < 0) continue;
        // 检查 surface 及上方 1-3 格
        for (let dy = 0; dy <= 3; dy++) {
          const bid = g.world.getBlock(wx, sy + dy, wz);
          if (bid === B.CHEST) { interestingBlocks.push({ ix, iy, type: 'chest' }); break; }
          if (bid === B.BED) { interestingBlocks.push({ ix, iy, type: 'bed' }); break; }
          if (bid === B.LAMP) { interestingBlocks.push({ ix, iy, type: 'lamp' }); break; }
          if (bid === B.FARMLAND) { interestingBlocks.push({ ix, iy, type: 'farm' }); break; }
        }
      }
    }

    // 绘制方块图标
    for (const b of interestingBlocks) {
      if (b.type === 'chest') {
        ctx.fillStyle = '#e8c840';
        ctx.fillRect(b.ix - 1, b.iy - 1, 3, 3);
        ctx.fillStyle = '#fff';
        ctx.fillRect(b.ix, b.iy, 1, 1);
      } else if (b.type === 'bed') {
        ctx.fillStyle = '#6ab4e8';
        ctx.fillRect(b.ix - 1, b.iy - 1, 3, 3);
      } else if (b.type === 'lamp') {
        ctx.fillStyle = '#ffe880';
        ctx.beginPath();
        ctx.arc(b.ix, b.iy, 2, 0, 6.28);
        ctx.fill();
      } else if (b.type === 'farm') {
        ctx.fillStyle = '#6a8a3a';
        ctx.fillRect(b.ix, b.iy, 2, 2);
      }
    }

    // --- 飞船位置（白色菱形）---
    if (g.ship && g.ship.group) {
      const sp = g.ship.group.position;
      const sx = (sp.x - px + range) * scale;
      const sy2 = (sp.z - pz + range) * scale;
      if (sx > -6 && sx < W + 6 && sy2 > -6 && sy2 < H + 6) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(sx, sy2 - 4);
        ctx.lineTo(sx + 3, sy2);
        ctx.lineTo(sx, sy2 + 4);
        ctx.lineTo(sx - 3, sy2);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // --- 漂泊者（青色圆点）---
    if (g.npc && g.npc.list) {
      for (const npc of g.npc.list) {
        if (!npc.grp) continue;
        const np = npc.grp.position;
        const nx = (np.x - px + range) * scale;
        const ny = (np.z - pz + range) * scale;
        if (nx < -4 || nx > W + 4 || ny < -4 || ny > H + 4) continue;
        ctx.fillStyle = '#66d9e8';
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, 6.28);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    // --- 土著人（金色圆点）---
    if (g.natives && g.natives.list) {
      for (const native of g.natives.list) {
        if (!native.grp) continue;
        const np = native.grp.position;
        const nx = (np.x - px + range) * scale;
        const ny = (np.z - pz + range) * scale;
        if (nx < -4 || nx > W + 4 || ny < -4 || ny > H + 4) continue;
        ctx.fillStyle = '#ffd166';
        ctx.beginPath();
        ctx.arc(nx, ny, 2.5, 0, 6.28);
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }
  }

  // 方块类型 → 小地图颜色
  minimapColor(blockId) {
    const colorMap = {
      [B.GRASS]: '#4a8a3a',
      [B.DIRT]: '#7a5a3d',
      [B.STONE]: '#7a7f88',
      [B.SAND]: '#c8b880',
      [B.WATER]: '#2e6fa8',
      [B.LOG]: '#5a4030',
      [B.LEAVES]: '#2a6a2a',
      [B.PLANKS]: '#a08060',
      [B.GLASS]: '#8ab8d0',
      [B.ALLOY]: '#b0b8c0',
      [B.LAMP]: '#e8d080',
      [B.FERRITE]: '#8a7060',
      [B.COPPER]: '#50b890',
      [B.BEDROCK]: '#2a2d34',
      [B.FRAME]: '#6a7078',
      [B.STAIRS]: '#7a7f88',
      [B.WINDOW]: '#4a6a8a',
      [B.CHEST]: '#c8a040',
      [B.BED]: '#6ab4e8',
      [B.DOOR]: '#8a6a40',
      [B.CROP_S1]: '#5aaa40',
      [B.CROP_S2]: '#4a9a30',
      [B.CROP_S3]: '#6abb50',
      [B.FARMLAND]: '#5a4a32',
      [B.TUFT]: '#4a8a3a',
      [B.PLANT]: '#2a6a2a',
      [B.NA_PLANT]: '#d8b040',
      [B.H_CRYS]: '#6aa0d8',
      [B.O_PLANT]: '#d05a4a'
    };
    return colorMap[blockId] || '#5a5040';
  }

  drawMinimap() {
    const g = this.g;
    if (!g.player || !g.world) return;
    const ctx = this.minimapCtx;
    const W = 120, H = 120;
    const range = 60; // 周围60格
    const px = g.player.pos.x, pz = g.player.pos.z;
    const yaw = g.player.inShip ? g.ship.yaw : g.player.yaw;

    ctx.clearRect(0, 0, W, H);

    // 绘制地形
    for (let iy = 0; iy < H; iy++) {
      for (let ix = 0; ix < W; ix++) {
        const wx = Math.floor(px - range + ix * (range * 2 / W));
        const wz = Math.floor(pz - range + iy * (range * 2 / H));
        const sy = g.world.surfaceY(wx, wz);
        if (sy < 0) { ctx.fillStyle = '#1a2a3a'; ctx.fillRect(ix, iy, 1, 1); continue; }
        const bid = g.world.getBlock(wx, sy, wz);
        ctx.fillStyle = this.minimapColor(bid);
        ctx.fillRect(ix, iy, 1, 1);
      }
    }

    // 玩家位置标记（白色三角形）
    const cx = W / 2, cy = H / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-yaw);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -5);
    ctx.lineTo(-3, 4);
    ctx.lineTo(3, 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // 绘制建筑/设备/NPC图标
    this.drawMapIcons(ctx, W, H, range, px, pz);

    // 如果全屏地图打开，也刷新
    if (this.minimapExpanded) this.drawExpandedMap();
  }

  showExpandedMap() {
    if (this.minimapExpanded) return;
    this.minimapExpanded = true;
    document.getElementById('minimap-expanded').classList.remove('hidden');
    this.drawExpandedMap();
  }

  hideExpandedMap() {
    this.minimapExpanded = false;
    document.getElementById('minimap-expanded').classList.add('hidden');
  }

  drawExpandedMap() {
    const g = this.g;
    if (!g.player || !g.world) return;
    const ctx = this.minimapBigCtx;
    const W = 400, H = 400;
    const range = 200; // 周围200格
    const px = g.player.pos.x, pz = g.player.pos.z;
    const yaw = g.player.inShip ? g.ship.yaw : g.player.yaw;

    ctx.clearRect(0, 0, W, H);

    // 绘制地形
    for (let iy = 0; iy < H; iy++) {
      for (let ix = 0; ix < W; ix++) {
        const wx = Math.floor(px - range + ix * (range * 2 / W));
        const wz = Math.floor(pz - range + iy * (range * 2 / H));
        const sy = g.world.surfaceY(wx, wz);
        if (sy < 0) { ctx.fillStyle = '#1a2a3a'; ctx.fillRect(ix, iy, 1, 1); continue; }
        const bid = g.world.getBlock(wx, sy, wz);
        ctx.fillStyle = this.minimapColor(bid);
        ctx.fillRect(ix, iy, 1, 1);
      }
    }

    // 玩家位置（白色三角形）
    const cx = W / 2, cy = H / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-yaw);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(-5, 6);
    ctx.lineTo(5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 绘制建筑/设备/NPC图标
    this.drawMapIcons(ctx, W, H, range, px, pz);

    // 十字准线
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(cx, 0); ctx.lineTo(cx, H);
    ctx.moveTo(0, cy); ctx.lineTo(W, cy);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  onExpandedMapClick(e) {
    if (!this.minimapExpanded) return;
    const rect = this.minimapBigCanvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const W = 400, H = 400;
    const range = 200;
    const g = this.g;
    const px = g.player.pos.x, pz = g.player.pos.z;

    // 计算点击对应的世界坐标
    const wx = px - range + mx * (range * 2 / W);
    const wz = pz - range + my * (range * 2 / H);

    // 检查点击是否在可行走区域（非水面、非基岩）
    const sy = g.world.surfaceY(Math.floor(wx), Math.floor(wz));
    if (sy < 0) {
      g.hud.notify('无法传送至水域！', 'warn');
      return;
    }
    const bid = g.world.getBlock(Math.floor(wx), sy, Math.floor(wz));
    if (bid === B.WATER || bid === B.BEDROCK) {
      g.hud.notify('无法传送至该位置！', 'warn');
      return;
    }

    // 传送
    this.teleportTo(wx, wz);
    this.hideExpandedMap();
  }

  teleportTo(wx, wz) {
    const g = this.g;
    const p = g.player;
    if (!p) return;
    const ix = Math.floor(wx), iz = Math.floor(wz);
    const sy = g.world.surfaceY(ix, iz);
    if (sy < 0) return;
    p.pos.set(ix + 0.5, sy + 2, iz + 0.5);
    g.audio.warp();
    g.hud.notify('已传送至新位置', 'success');
  }
}
