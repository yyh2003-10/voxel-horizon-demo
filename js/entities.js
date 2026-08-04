class Fauna {
  constructor(game) {
    this.g = game;
    this.creatures = [];
    this.monsters = [];
    this.group = new THREE.Group();
    game.scene.add(this.group);
    this.speciesList = [];
    this.monsterSpecies = [];
    this.callTimer = 0;
    // 怪物攻击音效冷却
    this.monsterAtkCd = 0;
  }

  spawnPlanet(seed, pal) {
    this.dispose();
    const rng = U.mulberry32(seed ^ 0xfa17);
    const nSpecies = Math.max(1, pal.fauna + Math.floor(rng() * 3));
    this.speciesList = [];
    const BUILDS = ['quad', 'quad', 'biped', 'stubby', 'tall', 'armored', 'antler'];
    for (let s = 0; s < nSpecies; s++) {
      this.speciesList.push({
        seed: Math.floor(rng() * 1e9),
        name: U.creatureName(rng),
        col: U.pick(pal.creatures, rng),
        col2: U.pick(pal.creatures, rng),
        size: 0.5 + rng() * 0.9,
        legs: rng() < 0.6 ? 4 : 2,
        horn: rng() < 0.45,
        tail: rng() < 0.6,
        build: U.pick(BUILDS, rng),
        belly: rng() < 0.5,
        backSpikes: rng() < 0.35,
        dropScale: 1 + rng() * 0.8,
        speed: 1.2 + rng() * 1.6
      });
    }
    const px = this.g.spawnPoint ? this.g.spawnPoint.x : 8;
    const pz = this.g.spawnPoint ? this.g.spawnPoint.z : 8;
    const count = 14 + Math.floor(rng() * 12);
    for (let i = 0; i < count; i++) {
      const sp = this.speciesList[Math.floor(rng() * this.speciesList.length)];
      let x = px + (rng() - 0.5) * 320, z = pz + (rng() - 0.5) * 320;
      for (let t = 0; t < 8; t++) {
        const gy = this.g.world.surfaceY(Math.floor(x), Math.floor(z));
        if (!pal.sea || gy > CFG.SEA) break;
        x = px + (rng() - 0.5) * 320; z = pz + (rng() - 0.5) * 320;
      }
      this.spawnCreature(sp, x, z, rng);
    }

    // --- 怪物系统 ---
    this.monsterSpecies = [];
    const ATTACK_TYPES = ['melee', 'ranged', 'charge', 'poison'];
    const MONSTER_COLS = ['#8a2020', '#2a1a3a', '#1a3a2a', '#4a2a10', '#3a1a4a', '#1a2a3a'];
    const nMonsterSpecies = 2 + Math.floor(rng() * 3);
    for (let s = 0; s < nMonsterSpecies; s++) {
      const atkType = U.pick(ATTACK_TYPES, rng);
      this.monsterSpecies.push({
        seed: Math.floor(rng() * 1e9),
        name: U.creatureName(rng) + '·掠食者',
        col: U.pick(MONSTER_COLS, rng),
        col2: U.pick(pal.creatures, rng),
        size: 0.6 + rng() * 0.8,
        legs: rng() < 0.5 ? 4 : 2,
        horn: rng() < 0.6,
        tail: rng() < 0.5,
        build: U.pick(['stubby', 'tall', 'armored'], rng),
        belly: rng() < 0.3,
        backSpikes: rng() < 0.5,
        speed: 2.0 + rng() * 1.5,
        attackType: atkType,
        attackDmg: atkType === 'charge' ? 12 + Math.floor(rng() * 8) : (atkType === 'ranged' ? 6 + Math.floor(rng() * 5) : 5 + Math.floor(rng() * 6)),
        attackRange: atkType === 'ranged' ? 5 : (atkType === 'charge' ? 3 : 2),
        attackInterval: atkType === 'charge' ? 2.5 + rng() : (1.5 + rng() * 1.5),
        aggroRange: 16 + Math.floor(rng() * 9),
        poisonDmg: atkType === 'poison' ? 2 + Math.floor(rng() * 2) : 0
      });
    }
    const monsterCount = 3 + Math.floor(rng() * 4);
    for (let i = 0; i < monsterCount; i++) {
      const sp = this.monsterSpecies[Math.floor(rng() * this.monsterSpecies.length)];
      let x = px + (rng() - 0.5) * 200, z = pz + (rng() - 0.5) * 200;
      for (let t = 0; t < 8; t++) {
        const gy = this.g.world.surfaceY(Math.floor(x), Math.floor(z));
        if (!pal.sea || gy > CFG.SEA) break;
        x = px + (rng() - 0.5) * 200; z = pz + (rng() - 0.5) * 200;
      }
      this.spawnMonster(sp, x, z, rng);
    }
  }

  spawnCreature(sp, x, z, rng) {
    const grp = new THREE.Group();
    const s = sp.size;
    const mBody = new THREE.MeshLambertMaterial({ color: sp.col });
    const mAcc = new THREE.MeshLambertMaterial({ color: sp.col2 });
    const mBelly = sp.belly ? new THREE.MeshLambertMaterial({ color: '#e8e0d0' }) : mAcc;
    const build = sp.build;
    // 各 build 的比例调整
    const bodyW = build === 'stubby' ? 2.0 : (build === 'tall' ? 1.2 : 1.5);
    const bodyH = build === 'stubby' ? 1.15 : (build === 'tall' ? 0.7 : 0.85);
    const bodyL = build === 'antler' ? 1.05 : 0.9;
    const legH = build === 'stubby' ? 0.5 : 0.7;
    const neckOff = build === 'tall' ? s * 1.7 : s * 1.3;
    const bodyBaseY = build === 'tall' ? s * 1.15 : s * 0.95;

    const body = new THREE.Mesh(new THREE.BoxGeometry(s * bodyW, s * bodyH, s * bodyL), mBody);
    body.position.y = bodyBaseY;
    grp.add(body);
    let head = new THREE.Mesh(new THREE.BoxGeometry(s * 0.62, s * 0.58, s * 0.6), mAcc);
    head.position.set(s * 0.95, neckOff, 0);
    grp.add(head);
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#1a1a22' });
    for (const dz of [-0.18, 0.18]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(s * 0.09, s * 0.09, s * 0.09), eyeMat);
      eye.position.set(s * 1.27, neckOff + s * 0.08, s * dz * 2);
      grp.add(eye);
    }
    if (sp.horn) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(s * 0.1, build === 'antler' ? s * 0.7 : s * 0.5, 5), mBody);
      horn.position.set(s * 0.95, neckOff + s * 0.45, 0);
      grp.add(horn);
      if (build === 'antler') {
        const horn2 = new THREE.Mesh(new THREE.ConeGeometry(s * 0.08, s * 0.5, 5), mBody);
        horn2.position.set(s * 1.15, neckOff + s * 0.4, s * 0.1);
        horn2.rotation.z = 0.5;
        grp.add(horn2);
      }
    }
    if (build === 'armored') {
      const shell = new THREE.Mesh(new THREE.BoxGeometry(s * 1.7, s * 0.5, s * 1.0), mAcc);
      shell.position.set(-s * 0.1, bodyBaseY + s * 0.6, 0);
      grp.add(shell);
    }
    if (sp.backSpikes) {
      for (let i = -1; i <= 1; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(s * 0.08, s * 0.5, 4), mAcc);
        spike.position.set(i * s * 0.45, bodyBaseY + s * 0.75, 0);
        grp.add(spike);
      }
    }
    const legs = [];
    const legGeo = new THREE.BoxGeometry(s * 0.2, s * legH, s * 0.2);
    legGeo.translate(0, -s * legH * 0.5, 0);
    const legPos = sp.legs === 4 ? [[0.5, 0.3], [0.5, -0.3], [-0.5, 0.3], [-0.5, -0.3]] : [[0.25, 0.28], [0.25, -0.28]];
    for (const [lx, lz] of legPos) {
      const leg = new THREE.Mesh(legGeo, sp.belly ? mBelly : mAcc);
      leg.position.set(s * lx, s * legH * 0.5, s * lz);
      grp.add(leg);
      legs.push(leg);
    }
    if (sp.belly) {
      const belly = new THREE.Mesh(new THREE.BoxGeometry(s * bodyW * 0.8, s * 0.25, s * bodyL * 0.8), mBelly);
      belly.position.y = bodyBaseY - s * bodyH * 0.5;
      grp.add(belly);
    }
    let tail = null;
    if (sp.tail) {
      tail = new THREE.Mesh(new THREE.BoxGeometry(s * (build === 'tall' ? 1.0 : 0.7), s * 0.16, s * 0.16), mAcc);
      tail.position.set(-s * 1.05, bodyBaseY + s * 0.15, 0);
      grp.add(tail);
    }
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(s * 0.9, 12), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.25, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    grp.add(shadow);
    const y = this.g.world.surfaceY(Math.floor(x), Math.floor(z)) + 1;
    grp.position.set(x, y, z);
    this.group.add(grp);
    const c = {
      grp, sp, legs, tail, shadow,
      state: 'idle', stateT: U.rand(1, 4),
      dir: U.rand(0, Math.PI * 2),
      hp: 20 * sp.size,
      phase: U.rand(0, 9),
      panic: 0,
      seed: Math.floor((rng ? rng() : Math.random()) * 1e9)
    };
    this.creatures.push(c);
    return c;
  }

  spawnMonster(sp, x, z, rng) {
    const grp = new THREE.Group();
    const s = sp.size;
    const mBody = new THREE.MeshLambertMaterial({ color: sp.col });
    const mAcc = new THREE.MeshLambertMaterial({ color: sp.col2 });
    const mBelly = sp.belly ? new THREE.MeshLambertMaterial({ color: '#3a1a1a' }) : mAcc;
    const build = sp.build;
    const bodyW = build === 'stubby' ? 2.0 : (build === 'tall' ? 1.2 : 1.5);
    const bodyH = build === 'stubby' ? 1.15 : (build === 'tall' ? 0.7 : 0.85);
    const bodyL = 0.9;
    const legH = build === 'stubby' ? 0.5 : 0.7;
    const neckOff = build === 'tall' ? s * 1.7 : s * 1.3;
    const bodyBaseY = build === 'tall' ? s * 1.15 : s * 0.95;

    const body = new THREE.Mesh(new THREE.BoxGeometry(s * bodyW, s * bodyH, s * bodyL), mBody);
    body.position.y = bodyBaseY;
    grp.add(body);
    const head = new THREE.Mesh(new THREE.BoxGeometry(s * 0.62, s * 0.58, s * 0.6), mAcc);
    head.position.set(s * 0.95, neckOff, 0);
    grp.add(head);
    // 发光眼睛
    const eyeMat = new THREE.MeshBasicMaterial({ color: sp.attackType === 'poison' ? '#44ff44' : '#ff3333' });
    for (const dz of [-0.18, 0.18]) {
      const eye = new THREE.Mesh(new THREE.BoxGeometry(s * 0.1, s * 0.1, s * 0.1), eyeMat);
      eye.position.set(s * 1.27, neckOff + s * 0.08, s * dz * 2);
      grp.add(eye);
    }
    if (sp.horn) {
      const horn = new THREE.Mesh(new THREE.ConeGeometry(s * 0.12, s * 0.55, 5), mBody);
      horn.position.set(s * 0.95, neckOff + s * 0.45, 0);
      grp.add(horn);
    }
    if (build === 'armored') {
      const shell = new THREE.Mesh(new THREE.BoxGeometry(s * 1.7, s * 0.5, s * 1.0), mAcc);
      shell.position.set(-s * 0.1, bodyBaseY + s * 0.6, 0);
      grp.add(shell);
    }
    if (sp.backSpikes) {
      for (let i = -1; i <= 1; i++) {
        const spike = new THREE.Mesh(new THREE.ConeGeometry(s * 0.1, s * 0.55, 4), mAcc);
        spike.position.set(i * s * 0.45, bodyBaseY + s * 0.75, 0);
        grp.add(spike);
      }
    }
    const legs = [];
    const legGeo = new THREE.BoxGeometry(s * 0.22, s * legH, s * 0.22);
    legGeo.translate(0, -s * legH * 0.5, 0);
    const legPos = sp.legs === 4 ? [[0.5, 0.3], [0.5, -0.3], [-0.5, 0.3], [-0.5, -0.3]] : [[0.25, 0.28], [0.25, -0.28]];
    for (const [lx, lz] of legPos) {
      const leg = new THREE.Mesh(legGeo, mAcc);
      leg.position.set(s * lx, s * legH * 0.5, s * lz);
      grp.add(leg);
      legs.push(leg);
    }
    let tail = null;
    if (sp.tail) {
      tail = new THREE.Mesh(new THREE.BoxGeometry(s * 0.7, s * 0.18, s * 0.18), mAcc);
      tail.position.set(-s * 1.05, bodyBaseY + s * 0.15, 0);
      grp.add(tail);
    }
    // 怪物标记：红色光环
    const ring = new THREE.Mesh(new THREE.RingGeometry(s * 0.9, s * 1.05, 16), new THREE.MeshBasicMaterial({ color: '#ff2222', transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.03;
    grp.add(ring);
    const shadow = new THREE.Mesh(new THREE.CircleGeometry(s * 0.9, 12), new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.3, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    grp.add(shadow);
    const y = this.g.world.surfaceY(Math.floor(x), Math.floor(z)) + 1;
    grp.position.set(x, y, z);
    grp.visible = false; // 夜晚才显示
    this.group.add(grp);
    const m = {
      grp, sp, legs, tail, shadow, ring,
      state: 'hide', stateT: U.rand(1, 4),
      dir: U.rand(0, Math.PI * 2),
      hp: 25 * sp.size,
      maxHp: 25 * sp.size,
      phase: U.rand(0, 9),
      seed: Math.floor((rng ? rng() : Math.random()) * 1e9),
      homeX: x, homeZ: z,
      attackCd: 0,
      chargeVx: 0, chargeVz: 0, charging: false
    };
    this.monsters.push(m);
    return m;
  }

  update(dt) {
    const g = this.g;
    const p = g.player;
    if (!p) return;
    this.callTimer -= dt;
    for (const c of this.creatures) {
      const pos = c.grp.position;
      const d = U.dist2(pos.x, pos.z, p.pos.x, p.pos.z);
      if (d > 140) continue;
      c.stateT -= dt;
      c.phase += dt * (c.state === 'walk' || c.panic > 0 ? 9 : 2);
      if (c.panic > 0) c.panic -= dt;
      if (c.stateT <= 0) {
        c.state = c.state === 'idle' ? 'walk' : (Math.random() < 0.4 ? 'walk' : 'idle');
        c.stateT = U.rand(1.5, 5);
        c.dir = U.rand(0, Math.PI * 2);
      }
      if (c.panic > 0) {
        c.dir = Math.atan2(pos.x - p.pos.x, pos.z - p.pos.z);
        c.state = 'walk';
      }
      if (c.state === 'walk') {
        const sp = c.sp.speed * (c.panic > 0 ? 2.2 : 1);
        const nx = pos.x + Math.sin(c.dir) * sp * dt;
        const nz = pos.z + Math.cos(c.dir) * sp * dt;
        const gy = this.g.world.topSolidY(Math.floor(nx), Math.floor(nz));
        const curY = this.g.world.topSolidY(Math.floor(pos.x), Math.floor(pos.z));
        if (Math.abs(gy - curY) <= 1 && this.g.world.getBlock(Math.floor(nx), gy + 1, Math.floor(nz)) !== B.WATER) {
          pos.x = nx; pos.z = nz;
          pos.y += U.clamp((gy + 1) - pos.y, -6 * dt, 6 * dt);
        } else {
          c.dir += Math.PI * 0.6;
        }
        c.grp.rotation.y = c.dir - Math.PI * 0.5;
      }
      const sw = c.state === 'walk' ? 0.5 : 0.06;
      c.legs.forEach((leg, i) => { leg.rotation.z = Math.sin(c.phase + i * Math.PI) * sw; });
      if (c.tail) c.tail.rotation.y = Math.sin(c.phase * 0.7) * 0.4;
      c.shadow.position.y = 0.02;
      if (this.callTimer <= 0 && Math.random() < 0.02 && d < 40) {
        g.audio.creatureCall(c.seed, d);
        this.callTimer = 2.5;
      }
    }

    // --- 怪物更新 ---
    const isNight = g.sky.dayMix < 0.35;
    this.monsterAtkCd = Math.max(0, this.monsterAtkCd - dt);
    for (const m of this.monsters) {
      const pos = m.grp.position;
      const d = U.dist2(pos.x, pos.z, p.pos.x, p.pos.z);
      if (d > 140) continue;

      // 夜晚激活，白天隐藏
      if (!isNight) {
        if (m.state !== 'hide') {
          m.state = 'hide';
          m.charging = false;
          m.grp.visible = false;
        }
        continue;
      }
      if (m.state === 'hide') {
        m.state = 'patrol';
        m.grp.visible = true;
      }

      m.stateT -= dt;
      m.phase += dt * (m.state === 'chase' || m.state === 'attack' ? 10 : 3);
      m.attackCd = Math.max(0, m.attackCd - dt);

      // 状态机
      if (m.state === 'patrol') {
        if (m.stateT <= 0) {
          m.dir = U.rand(0, Math.PI * 2);
          m.stateT = U.rand(2, 5);
        }
        // 检测玩家仇恨
        if (d < m.sp.aggroRange) {
          m.state = 'chase';
          m.stateT = 0;
        }
        // 巡逻移动
        const nx = pos.x + Math.sin(m.dir) * m.sp.speed * 0.5 * dt;
        const nz = pos.z + Math.cos(m.dir) * m.sp.speed * 0.5 * dt;
        const gy = g.world.topSolidY(Math.floor(nx), Math.floor(nz));
        const curY = g.world.topSolidY(Math.floor(pos.x), Math.floor(pos.z));
        if (Math.abs(gy - curY) <= 1 && g.world.getBlock(Math.floor(nx), gy + 1, Math.floor(nz)) !== B.WATER) {
          pos.x = nx; pos.z = nz;
          pos.y += U.clamp((gy + 1) - pos.y, -6 * dt, 6 * dt);
        } else {
          m.dir += Math.PI * 0.6;
        }
        m.grp.rotation.y = m.dir - Math.PI * 0.5;
      } else if (m.state === 'chase') {
        // 追击玩家
        m.dir = Math.atan2(p.pos.x - pos.x, p.pos.z - pos.z);
        const atkDist = m.sp.attackRange;
        if (d <= atkDist + 0.5) {
          m.state = 'attack';
        } else if (d > m.sp.aggroRange * 1.5) {
          m.state = 'patrol';
          m.stateT = U.rand(1, 3);
        }
        // 冲锋特殊逻辑
        if (m.sp.attackType === 'charge' && m.charging) {
          pos.x += m.chargeVx * dt;
          pos.z += m.chargeVz * dt;
          const gy = g.world.topSolidY(Math.floor(pos.x), Math.floor(pos.z));
          pos.y += U.clamp((gy + 1) - pos.y, -6 * dt, 6 * dt);
          m.grp.rotation.y = Math.atan2(m.chargeVx, m.chargeVz);
          // 冲锋碰撞玩家
          if (d < 1.8 && this.monsterAtkCd <= 0) {
            p.damage(m.sp.attackDmg, '怪物冲锋');
            this.monsterAtkCd = m.sp.attackInterval;
            m.charging = false;
            m.state = 'attack';
            m.attackCd = m.sp.attackInterval;
            g.fx.shake(0.4);
          }
          // 冲锋撞墙停止
          const gx = Math.floor(pos.x + Math.sin(m.dir) * 1.5);
          const gz = Math.floor(pos.z + Math.cos(m.dir) * 1.5);
          const blockAhead = g.world.getBlock(gx, Math.floor(pos.y), gz);
          if (blockAhead !== B.AIR && BLOCK_DEF[blockAhead] && BLOCK_DEF[blockAhead].solid) {
            m.charging = false;
            m.attackCd = m.sp.attackInterval;
          }
          continue;
        }
        // 追击移动
        const speed = m.sp.speed * (m.sp.attackType === 'charge' ? 1.8 : 1.2);
        const nx = pos.x + Math.sin(m.dir) * speed * dt;
        const nz = pos.z + Math.cos(m.dir) * speed * dt;
        const gy = g.world.topSolidY(Math.floor(nx), Math.floor(nz));
        const curY = g.world.topSolidY(Math.floor(pos.x), Math.floor(pos.z));
        if (Math.abs(gy - curY) <= 1 && g.world.getBlock(Math.floor(nx), gy + 1, Math.floor(nz)) !== B.WATER) {
          pos.x = nx; pos.z = nz;
          pos.y += U.clamp((gy + 1) - pos.y, -6 * dt, 6 * dt);
        } else {
          m.dir += Math.PI * 0.4;
        }
        m.grp.rotation.y = m.dir - Math.PI * 0.5;
      } else if (m.state === 'attack') {
        m.dir = Math.atan2(p.pos.x - pos.x, p.pos.z - pos.z);
        m.grp.rotation.y = m.dir - Math.PI * 0.5;
        if (d > m.sp.attackRange + 1.5) {
          m.state = 'chase';
        }
        if (m.attackCd <= 0 && this.monsterAtkCd <= 0) {
          this.monsterAtkCd = 0.5;
          m.attackCd = m.sp.attackInterval;
          if (m.sp.attackType === 'charge') {
            // 发起冲锋
            m.charging = true;
            m.chargeVx = Math.sin(m.dir) * m.sp.speed * 3;
            m.chargeVz = Math.cos(m.dir) * m.sp.speed * 3;
            m.state = 'chase';
          } else if (m.sp.attackType === 'ranged') {
            // 远程攻击：发射粒子弹（需在射程内）
            if (d < m.sp.attackRange + 1.0) {
              const tip = pos.clone();
              tip.y += m.sp.size;
              const target = p.eyePos();
              g.fx.spawn(target.x, target.y, target.z, { n: 8, col: '#ff4444', speed: 1.5, life: 0.4, grav: 0 });
              p.damage(m.sp.attackDmg, '远程攻击');
              g.audio.monsterAttack();
              g.fx.shake(0.15);
            }
          } else if (m.sp.attackType === 'poison') {
            // 毒击：近战伤害 + 扣生命维持（装甲也减毒）
            if (d < m.sp.attackRange + 0.5) {
              p.damage(m.sp.attackDmg, '毒物攻击');
              const poisonReduction = p.armorDef > 0 ? (1 - p.armorDef) : 1;
              p.ls = Math.max(0, p.ls - m.sp.poisonDmg * poisonReduction);
              g.audio.monsterAttack();
              g.fx.spawn(pos.x, pos.y + m.sp.size, pos.z, { n: 6, col: '#44ff44', speed: 1.5, life: 0.5 });
              g.fx.shake(0.2);
            }
          } else {
            // 普通近战
            if (d < m.sp.attackRange + 0.5) {
              p.damage(m.sp.attackDmg, '怪物攻击');
              g.audio.monsterAttack();
              g.fx.shake(0.2);
            }
          }
        }
      }

      // 动画
      const sw = m.state === 'patrol' ? 0.5 : (m.state === 'chase' ? 0.7 : 0.15);
      m.legs.forEach((leg, i) => { leg.rotation.z = Math.sin(m.phase + i * Math.PI) * sw; });
      if (m.tail) m.tail.rotation.y = Math.sin(m.phase * 0.7) * 0.5;
      m.shadow.position.y = 0.02;
      m.ring.position.y = 0.03;
    }
  }

  raycastCreature(origin, dir, maxDist) {
    let best = null, bestD = maxDist;
    const v = new THREE.Vector3();
    for (const c of this.creatures) {
      v.copy(c.grp.position).sub(origin);
      const t = v.dot(dir);
      if (t < 0 || t > bestD) continue;
      const closest = new THREE.Vector3().copy(origin).addScaledVector(dir, t);
      const r = c.sp.size * 1.3;
      if (closest.distanceTo(new THREE.Vector3(c.grp.position.x, c.grp.position.y + c.sp.size, c.grp.position.z)) < r) {
        best = c; bestD = t;
      }
    }
    return best ? { creature: best, dist: bestD } : null;
  }

  hit(c, dmg) {
    c.hp -= dmg;
    c.panic = 4;
    const pos = c.grp.position;
    this.g.audio.creatureHurt(0);
    this.g.fx.spawn(pos.x, pos.y + c.sp.size, pos.z, { n: 6, col: '#c04a4a', speed: 2, life: 0.5 });
    if (c.hp <= 0) {
      this.g.fx.spawn(pos.x, pos.y + c.sp.size, pos.z, { n: 18, col: c.sp.col, speed: 3.2, life: 0.8 });
      this.group.remove(c.grp);
      this.creatures.splice(this.creatures.indexOf(c), 1);
      const inv = this.g.inv;
      inv.add('biomass', U.randi(2, 4));
      inv.add('carbon', U.randi(3, 6));
      this.g.hud.toast('biomass', 3);
      return true;
    }
    return false;
  }

  dispose() {
    for (const c of this.creatures) this.group.remove(c.grp);
    this.creatures = [];
    for (const m of this.monsters) this.group.remove(m.grp);
    this.monsters = [];
  }

  hitMonster(m, dmg) {
    m.hp -= dmg;
    const pos = m.grp.position;
    this.g.audio.creatureHurt(0);
    this.g.fx.spawn(pos.x, pos.y + m.sp.size, pos.z, { n: 6, col: '#c04a4a', speed: 2, life: 0.5 });
    if (m.hp <= 0) {
      this.g.fx.spawn(pos.x, pos.y + m.sp.size, pos.z, { n: 18, col: m.sp.col, speed: 3.2, life: 0.8 });
      this.group.remove(m.grp);
      this.monsters.splice(this.monsters.indexOf(m), 1);
      const inv = this.g.inv;
      inv.add('biomass', U.randi(2, 5));
      inv.add('carbon', U.randi(3, 8));
      this.g.hud.toast('biomass', 3);
      this.g.hud.notify('怪物已消灭！', 'success');
      return true;
    }
    return false;
  }

  raycastMonster(origin, dir, maxDist) {
    let best = null, bestD = maxDist;
    const v = new THREE.Vector3();
    for (const m of this.monsters) {
      if (!m.grp.visible) continue;
      v.copy(m.grp.position).sub(origin);
      const t = v.dot(dir);
      if (t < 0 || t > bestD) continue;
      const closest = new THREE.Vector3().copy(origin).addScaledVector(dir, t);
      const r = m.sp.size * 1.3;
      if (closest.distanceTo(new THREE.Vector3(m.grp.position.x, m.grp.position.y + m.sp.size, m.grp.position.z)) < r) {
        best = m; bestD = t;
      }
    }
    return best ? { monster: best, dist: bestD } : null;
  }
}
