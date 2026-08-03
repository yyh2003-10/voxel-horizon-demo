class Npc {
  constructor(game) {
    this.g = game;
    this.list = [];
    this.group = new THREE.Group();
    game.scene.add(this.group);
    this.materials = {};
    this.lastInteract = 0;
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
      if (!g.world.getBlock(Math.floor(x), gy + 1, Math.floor(z)) === B.WATER) {
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
      seed: Math.floor(rng() * 1e9)
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
        c.grp.rotation.y = Math.atan2(face.x, face.z) + Math.PI * 0.5;
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
