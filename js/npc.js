class Npc {
  constructor(game) {
    this.g = game;
    this.list = [];
    this.group = new THREE.Group();
    game.scene.add(this.group);
    this.materials = {};
    this.lastInteract = 0;
    this.lastTradeInteract = 0;
  }

  spawnPlanet(seed, pal) {
    this.dispose();
    const g = this.g;
    const rng = U.mulberry32(seed ^ 0x6e70c);
    // 每个星球生成 1~2 名漂泊者，落点围绕出生点/飞船
    const bx = g.ship && g.ship.group ? g.ship.group.position.x : (g.spawnPoint ? g.spawnPoint.x : 8);
    const bz = g.ship && g.ship.group ? g.ship.group.position.z : (g.spawnPoint ? g.spawnPoint.z : 8);
    const n = 1 + Math.floor(rng() * 2);
    for (let i = 0; i < n; i++) {
      const off = 6 + rng() * 10;
      const a = rng() * Math.PI * 2;
      const x = bx + Math.cos(a) * off;
      const z = bz + Math.sin(a) * off;
      const gy = g.world.topSolidY(Math.floor(x), Math.floor(z));
      if (g.world.getBlock(Math.floor(x), gy + 1, Math.floor(z)) !== B.WATER) {
        this.spawnOne(x, gy + 1, z, rng);
      }
    }
  }

  spawnOne(x, y, z, rng) {
    const grp = new THREE.Group();
    const M = this.materials;
    // 外骨骼配色（科考橙 / 哑光白 / 深灰）
    const suit = new THREE.MeshLambertMaterial({ color: '#c86a3a' });
    const suit2 = new THREE.MeshLambertMaterial({ color: '#e8e0d0' });
    const dark = new THREE.MeshLambertMaterial({ color: '#3a3f48' });
    const visorMat = new THREE.MeshLambertMaterial({ color: '#7fd0ff', emissive: '#1a3a50', emissiveIntensity: 0.6 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.0, 0.5), suit);
    body.position.y = 1.25;
    grp.add(body);
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.5, 0.26), suit2);
    chest.position.y = 1.45;
    grp.add(chest);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), suit2);
    head.position.y = 2.0;
    grp.add(head);
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.18), visorMat);
    visor.position.set(0, 2.02, 0.27);
    grp.add(visor);
    const helmet = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.24, 0.6), dark);
    helmet.position.y = 2.3;
    grp.add(helmet);
    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.34), dark);
    backpack.position.set(0, 1.4, -0.4);
    grp.add(backpack);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.16),
      new THREE.MeshLambertMaterial({ color: '#ffd166', emissive: '#ffb020', emissiveIntensity: 1.2 }));
    lamp.position.set(0, 1.8, -0.42);
    grp.add(lamp);
    const arms = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.78, 0.2), suit2);
      arm.position.set(side * 0.56, 1.18, 0);
      grp.add(arm);
      arms.push(arm);
    }
    const legs = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.8, 0.24), dark);
      leg.position.set(side * 0.2, 0.4, 0);
      grp.add(leg);
      legs.push(leg);
    }
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.0, 14), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.28, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    grp.add(shadow);

    grp.position.set(x, y, z);
    this.group.add(grp);
    const c = {
      grp, arms, legs, shadow,
      name: Math.random() < 0.5 ? '漂泊者' : '科考员',
      say: U.pick(NPC_LINES, rng),
      state: 'idle', stateT: 0,
      dir: U.rand(0, Math.PI * 2),
      phase: U.rand(0, 9),
      seed: Math.floor(rng() * 1e9),
      tradeItems: Npc.generateTrades(rng)
    };
    this.list.push(c);
    return c;
  }

  update(dt) {
    const g = this.g;
    const p = g.player;
    if (!p || !this.list.length) return;
    for (const c of this.list) {
      const pos = c.grp.position;
      const d = U.dist2(pos.x, pos.z, p.pos.x, p.pos.z);
      if (d > 120) continue;
      c.stateT -= dt;
      c.phase += dt * (c.state === 'walk' ? 10 : 2);
      if (c.stateT <= 0) {
        c.state = c.state === 'idle' ? 'walk' : 'idle';
        c.stateT = U.rand(2, 6);
        c.dir = U.rand(0, Math.PI * 2);
      }
      // 距离近时停下望向玩家
      const face = new THREE.Vector3(p.pos.x - pos.x, 0, p.pos.z - pos.z);
      if (face.lengthSq() < 7 * 7) {
        c.state = 'idle';
        c.grp.rotation.y = Math.atan2(face.x, face.z);
      } else if (c.state === 'walk') {
        const sp = 0.7;
        const nx = pos.x + Math.sin(c.dir) * sp * dt;
        const nz = pos.z + Math.cos(c.dir) * sp * dt;
        const gy = g.world.topSolidY(Math.floor(nx), Math.floor(nz));
        const curY = g.world.topSolidY(Math.floor(pos.x), Math.floor(pos.z));
        if (Math.abs(gy - curY) <= 1) {
          pos.x = nx; pos.z = nz;
          pos.y += U.clamp((gy + 1) - pos.y, -6 * dt, 6 * dt);
        } else c.dir += Math.PI * 0.6;
        c.grp.rotation.y = c.dir - Math.PI * 0.5;
      }
      const sw = c.state === 'walk' ? 0.9 : 0.05;
      c.arms.forEach((arm, i) => { arm.rotation.x = Math.sin(c.phase + i * Math.PI) * sw; });
      c.legs.forEach((leg, i) => { leg.rotation.x = Math.sin(c.phase + i * Math.PI) * sw; });
      c.shadow.position.y = 0.02;
    }
  }

  raycastNpc(origin, dir, maxDist) {
    let best = null, bestD = maxDist;
    const v = new THREE.Vector3();
    for (const c of this.list) {
      v.copy(c.grp.position).sub(origin);
      const t = v.dot(dir);
      if (t < 0 || t > bestD) continue;
      const closest = new THREE.Vector3().copy(origin).addScaledVector(dir, t);
      if (closest.distanceTo(new THREE.Vector3(c.grp.position.x, c.grp.position.y + 1.2, c.grp.position.z)) < 1.5) {
        best = c; bestD = t;
      }
    }
    return best ? { npc: best, dist: bestD } : null;
  }

  talk(c) {
    const g = this.g;
    if (g.time - this.lastInteract < 1.2) return;
    this.lastInteract = g.time;
    const line = U.pick(c.say, Math.random());
    g.audio.creatureCall(c.seed, 4);
    g.hud.notify(`「${line}」 — ${c.name}`, 'info');
  }

  openTrade(c) {
    const g = this.g;
    if (g.time - this.lastTradeInteract < 1.5) return;
    this.lastTradeInteract = g.time;
    g.hud.showTradeScreen(c);
  }

  executeTrade(trade) {
    const g = this.g;
    const p = g.player;
    if (!p) return false;
    if (g.inv.count(trade.give) < trade.giveN) {
      g.hud.notify(`需要 ${ITEMS[trade.give].name} ×${trade.giveN}`, 'warn');
      return false;
    }
    g.inv.consume(trade.give, trade.giveN);
    const added = g.inv.add(trade.take, trade.takeN);
    if (added > 0) g.hud.toast(trade.take, added);
    g.hud.notify(`交易完成：${ITEMS[trade.give].name} ×${trade.giveN} → ${ITEMS[trade.take].name} ×${trade.takeN}`, 'success');
    g.audio.craft();
    return true;
  }

  static generateTrades(rng) {
    const trades = [];
    const basePool = ['ferrite', 'carbon', 'sodium', 'copper', 'biomass'];
    const rarePool = ['metal_plate', 'nanotube', 'launch_fuel', 'warp_cell'];
    const foodPool = ['food_basic', 'food_advanced', 'seed_crop1', 'seed_crop2'];
    const tradeCount = 2 + Math.floor(rng() * 2);
    for (let i = 0; i < tradeCount; i++) {
      const roll = rng();
      let giveId, takeId, giveN, takeN;
      if (roll < 0.3) {
        // 稀有交易：给基础材料，得稀有物品
        giveId = U.pick(basePool, rng);
        takeId = U.pick(rarePool, rng);
        giveN = 15 + Math.floor(rng() * 25);
        takeN = 1;
      } else if (roll < 0.6) {
        // 食物交易：给材料，得食物/种子
        giveId = U.pick(basePool, rng);
        takeId = U.pick(foodPool, rng);
        giveN = 8 + Math.floor(rng() * 12);
        takeN = 1;
      } else {
        // 普通交易：给材料，得材料
        giveId = U.pick(basePool, rng);
        do { takeId = U.pick(basePool, rng); } while (giveId === takeId);
        giveN = 10 + Math.floor(rng() * 15);
        takeN = 5 + Math.floor(rng() * 10);
      }
      trades.push({ give: giveId, giveN, take: takeId, takeN });
    }
    return trades;
  }

  dispose() {
    for (const c of this.list) this.group.remove(c.grp);
    this.list = [];
  }
}

const NPC_LINES = [
  '这星球的风……比传闻更刺骨。',
  '别去碰那些晶簇，除非你想变成水晶。',
  '我的探测器在废墟深处捕捉到某种信号。',
  '你从哪片星域来？算了，说了我也不认得。',
  '入夜前记得躲进庇护所，这里的天不是总善意的。',
  '那条地下航道……我鼻子很灵的，底下有门道。',
  '异星野兽大多无害，但别激怒它们。',
  '修理那艘船需要合金和耐心——两者都不便宜。',
  '风暴来的时候，大地会短暂失去颜色。',
  '我已经在荒野里走了三个行星时圈，习惯了。'
];

/**
 * 土著人系统 — 友好NPC + 交易
 */
class Native {
  constructor(game) {
    this.g = game;
    this.list = [];
    this.group = new THREE.Group();
    game.scene.add(this.group);
    this.lastInteract = 0;
  }

  spawnPlanet(seed, pal) {
    this.dispose();
    const g = this.g;
    const rng = U.mulberry32(seed ^ 0x3a7b1);
    // 每个星球 2-4 个土著人
    const n = 2 + Math.floor(rng() * 3);
    // 土著人颜色方案（按星球类型）
    const colorSchemes = {
      lush: { skin: '#6a8a5a', cloth: '#8a6a4a', accent: '#c8a060' },
      scorched: { skin: '#a06030', cloth: '#c07040', accent: '#e8a050' },
      frozen: { skin: '#8ab0c8', cloth: '#c0d8e8', accent: '#e8f4ff' },
      exotic: { skin: '#8a5ac0', cloth: '#b07ae0', accent: '#d8a8ff' },
      toxic: { skin: '#6a8a30', cloth: '#8aa840', accent: '#c8d860' },
      barren: { skin: '#8a7a60', cloth: '#a89878', accent: '#c8b898' }
    };
    const scheme = colorSchemes[pal.id] || colorSchemes.lush;
    // 土著人名字前缀
    const PREFIXES = ['岩石族', '风语者', '星尘氏', '暗影族', '潮汐氏', '矿脉氏', '雾行者'];
    const SUFFIXES = ['阿卡', '贝拉', '达恩', '伊卡', '法恩', '加尔', '赫拉', '基拉', '鲁恩', '玛雅'];

    for (let i = 0; i < n; i++) {
      const off = 4 + rng() * 8;
      const a = rng() * Math.PI * 2;
      const x = (g.ship && g.ship.group ? g.ship.group.position.x : (g.spawnPoint ? g.spawnPoint.x : 8)) + Math.cos(a) * off;
      const z = (g.ship && g.ship.group ? g.ship.group.position.z : (g.spawnPoint ? g.spawnPoint.z : 8)) + Math.sin(a) * off;
      const gy = g.world.topSolidY(Math.floor(x), Math.floor(z));
      if (g.world.getBlock(Math.floor(x), gy + 1, Math.floor(z)) === B.WATER) continue;
      this.spawnNative(x, gy + 1, z, rng, scheme, pal.id, PREFIXES, SUFFIXES);
    }
  }

  spawnNative(x, y, z, rng, scheme, palId, prefixes, suffixes) {
    const grp = new THREE.Group();
    const skinMat = new THREE.MeshLambertMaterial({ color: scheme.skin });
    const clothMat = new THREE.MeshLambertMaterial({ color: scheme.cloth });
    const accentMat = new THREE.MeshLambertMaterial({ color: scheme.accent });
    const glowMat = new THREE.MeshBasicMaterial({ color: scheme.accent, transparent: true, opacity: 0.6 });

    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.0, 0.45), clothMat);
    body.position.y = 1.25;
    grp.add(body);
    const chest = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.24), accentMat);
    chest.position.y = 1.45;
    grp.add(chest);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.48, 0.48), skinMat);
    head.position.y = 2.0;
    grp.add(head);
    // 部落装饰（发光标记）
    const mark = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 0.05), glowMat);
    mark.position.set(0, 2.08, 0.26);
    grp.add(mark);
    // 头饰
    const headdress = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 5), accentMat);
    headdress.position.y = 2.45;
    grp.add(headdress);
    const arms = [];
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.72, 0.18), clothMat);
      arm.position.set(side * 0.52, 1.18, 0);
      grp.add(arm);
      arms.push(arm);
    }
    const legs = [];
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.75, 0.22), skinMat);
      leg.position.set(side * 0.2, 0.38, 0);
      grp.add(leg);
      legs.push(leg);
    }
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.9, 12), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.25, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    grp.add(shadow);

    grp.position.set(x, y, z);
    this.group.add(grp);

    // 交易配方生成
    const tradeItems = Native.generateTrades(rng, palId);

    const c = {
      grp, arms, legs, shadow,
      name: U.pick(prefixes, rng) + '·' + U.pick(suffixes, rng),
      isNative: true,
      friendly: true,
      tradeItems,
      say: U.pick(NPC_LINES, rng),
      state: 'idle', stateT: 0,
      dir: U.rand(0, Math.PI * 2),
      phase: U.rand(0, 9),
      seed: Math.floor(rng() * 1e9)
    };
    this.list.push(c);
    return c;
  }

  static generateTrades(rng, palId) {
    const trades = [];
    const basePool = ['ferrite', 'carbon', 'sodium', 'dihydrogen', 'oxygen', 'copper'];
    const rarePool = ['metal_plate', 'nanotube'];
    const seedPool = ['seed_crop1', 'seed_crop2'];
    const tradeCount = 3 + Math.floor(rng() * 3);
    for (let i = 0; i < tradeCount; i++) {
      const roll = rng();
      let giveId, takeId, giveN, takeN;
      if (roll < 0.15) {
        // 种子交易：给生物质，得种子
        giveId = 'biomass';
        takeId = U.pick(seedPool, rng);
        giveN = 5 + Math.floor(rng() * 8);
        takeN = 1;
      } else if (roll < 0.35) {
        // 稀有交易
        giveId = U.pick(basePool, rng);
        takeId = U.pick(rarePool, rng);
        giveN = 1 + Math.floor(rng() * 2);
        takeN = 1;
      } else {
        // 普通交易
        giveId = U.pick(basePool, rng);
        do { takeId = U.pick(basePool, rng); } while (giveId === takeId);
        giveN = 5 + Math.floor(rng() * 20);
        takeN = 3 + Math.floor(rng() * 10);
      }
      trades.push({ give: giveId, giveN, take: takeId, takeN });
    }
    return trades;
  }

  update(dt) {
    const g = this.g;
    const p = g.player;
    if (!p || !this.list.length) return;
    for (const c of this.list) {
      const pos = c.grp.position;
      const d = U.dist2(pos.x, pos.z, p.pos.x, p.pos.z);
      if (d > 120) continue;
      c.stateT -= dt;
      c.phase += dt * (c.state === 'walk' ? 8 : 2);
      if (c.stateT <= 0) {
        c.state = c.state === 'idle' ? 'walk' : 'idle';
        c.stateT = U.rand(2, 6);
        c.dir = U.rand(0, Math.PI * 2);
      }
      // 靠近玩家时停下
      const face = new THREE.Vector3(p.pos.x - pos.x, 0, p.pos.z - pos.z);
      if (face.lengthSq() < 5 * 5) {
        c.state = 'idle';
        c.grp.rotation.y = Math.atan2(face.x, face.z);
      } else if (c.state === 'walk') {
        const sp = 0.6;
        const nx = pos.x + Math.sin(c.dir) * sp * dt;
        const nz = pos.z + Math.cos(c.dir) * sp * dt;
        const gy = g.world.topSolidY(Math.floor(nx), Math.floor(nz));
        const curY = g.world.topSolidY(Math.floor(pos.x), Math.floor(pos.z));
        if (Math.abs(gy - curY) <= 1) {
          pos.x = nx; pos.z = nz;
          pos.y += U.clamp((gy + 1) - pos.y, -6 * dt, 6 * dt);
        } else c.dir += Math.PI * 0.6;
        c.grp.rotation.y = c.dir - Math.PI * 0.5;
      }
      const sw = c.state === 'walk' ? 0.7 : 0.04;
      c.arms.forEach((arm, i) => { arm.rotation.x = Math.sin(c.phase + i * Math.PI) * sw; });
      c.legs.forEach((leg, i) => { leg.rotation.x = Math.sin(c.phase + i * Math.PI) * sw; });
      c.shadow.position.y = 0.02;
    }
  }

  raycastNative(origin, dir, maxDist) {
    let best = null, bestD = maxDist;
    const v = new THREE.Vector3();
    for (const c of this.list) {
      v.copy(c.grp.position).sub(origin);
      const t = v.dot(dir);
      if (t < 0 || t > bestD) continue;
      const closest = new THREE.Vector3().copy(origin).addScaledVector(dir, t);
      if (closest.distanceTo(new THREE.Vector3(c.grp.position.x, c.grp.position.y + 1.2, c.grp.position.z)) < 1.5) {
        best = c; bestD = t;
      }
    }
    return best ? { native: best, dist: bestD } : null;
  }

  talk(c) {
    const g = this.g;
    if (g.time - this.lastInteract < 1.2) return;
    this.lastInteract = g.time;
    const line = U.pick(c.say, Math.random());
    g.audio.creatureCall(c.seed, 4);
    g.hud.notify(`「${line}」 — ${c.name}`, 'info');
  }

  openTrade(c) {
    const g = this.g;
    if (g.time - this.lastInteract < 1.5) return;
    this.lastInteract = g.time;
    // 打开交易UI
    g.hud.showTradeScreen(c);
  }

  executeTrade(trade) {
    const g = this.g;
    const inv = g.inv;
    if (inv.count(trade.give) < trade.giveN) {
      g.hud.notify(`缺少 ${ITEMS[trade.give].name} ×${trade.giveN}`, 'warn');
      return false;
    }
    if (!inv.canAfford([[trade.give, trade.giveN]])) return false;
    inv.consume(trade.give, trade.giveN);
    inv.add(trade.take, trade.takeN);
    g.hud.notify(`交易成功：${ITEMS[trade.give].name} ×${trade.giveN} → ${ITEMS[trade.take].name} ×${trade.takeN}`, 'success');
    g.audio.craft();
    return true;
  }

  dispose() {
    for (const c of this.list) this.group.remove(c.grp);
    this.list = [];
  }
}
