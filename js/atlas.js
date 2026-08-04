class TextureAtlas {
  constructor() {
    this.size = 8;
    this.px = 16;
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.canvas.height = this.size * this.px;
    this.ctx = this.canvas.getContext('2d');
    this.texture = null;
    this.iconCache = {};
  }

  tileRect(t) {
    const s = this.px;
    return [(t % this.size) * s, Math.floor(t / this.size) * s, s, s];
  }

  uv(t) {
    const s = 1 / this.size;
    const u = (t % this.size) * s, v = Math.floor(t / this.size) * s;
    const e = 0.001;
    return [u + e, 1 - v - s + e, u + s - e, 1 - v - e];
  }

  build(pal, seed) {
    const ctx = this.ctx, px = this.px;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const rng = U.mulberry32(seed ^ 0x51ab);

    const tile = (t, fn) => {
      const [ox, oy] = this.tileRect(t);
      ctx.save();
      ctx.translate(ox, oy);
      fn((x, y, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); });
      ctx.restore();
    };
    const noiseFill = (put, base, amt, holes) => {
      for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) {
        if (holes && rng() < holes) continue;
        put(x, y, U.vary(base, rng, amt));
      }
    };

    tile(T.GRASS_TOP, p => {
      noiseFill(p, pal.grass, 20);
      for (let i = 0; i < 26; i++) p(U.randi(0, 15), U.randi(0, 15), U.vary(pal.grassAlt, rng, 16));
      for (let i = 0; i < 5; i++) p(U.randi(0, 15), U.randi(0, 15), U.shade(pal.grass, 1.35));
    });
    tile(T.DIRT, p => {
      noiseFill(p, pal.dirt, 18);
      for (let i = 0; i < 10; i++) p(U.randi(0, 15), U.randi(0, 15), U.shade(pal.dirt, 0.72));
    });
    tile(T.GRASS_SIDE, p => {
      noiseFill(p, pal.dirt, 18);
      for (let x = 0; x < px; x++) {
        const d = 2 + Math.floor(rng() * 3);
        for (let y = 0; y < d; y++) p(x, y, U.vary(y < d - 1 ? pal.grass : pal.grassAlt, rng, 18));
      }
    });
    tile(T.STONE, p => {
      noiseFill(p, '#8a8f96', 14);
      for (let i = 0; i < 9; i++) { const x = U.randi(0, 14), y = U.randi(0, 14); p(x, y, '#6f747c'); p(x + 1, y, '#7a7f88'); }
    });
    tile(T.SAND, p => {
      noiseFill(p, pal.sand, 12);
      for (let i = 0; i < 8; i++) p(U.randi(0, 15), U.randi(0, 15), U.shade(pal.sand, 0.82));
    });
    tile(T.LOG, p => {
      for (let x = 0; x < px; x++) {
        const c = (x % 4 === 0) ? U.shade(pal.wood, 0.68) : pal.wood;
        for (let y = 0; y < px; y++) p(x, y, U.vary(c, rng, 10));
      }
    });
    tile(T.LOG_TOP, p => {
      noiseFill(p, U.shade(pal.wood, 1.15), 10);
      for (let r = 2; r < 8; r += 2) for (let a = 0; a < 30; a++) {
        const x = Math.round(8 + Math.cos(a) * r * 0.8), y = Math.round(8 + Math.sin(a) * r * 0.8);
        if (x >= 0 && x < 16 && y >= 0 && y < 16) p(x, y, U.shade(pal.wood, 0.75));
      }
    });
    tile(T.LEAVES, p => {
      noiseFill(p, pal.leaves[0], 22, 0.16);
      for (let i = 0; i < 20; i++) p(U.randi(0, 15), U.randi(0, 15), U.vary(pal.leaves[1] || pal.leaves[0], rng, 18));
    });
    tile(T.PLANKS, p => {
      const base = U.shade(pal.wood, 1.25);
      for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) {
        let c = U.vary(base, rng, 8);
        if (y % 4 === 3) c = U.shade(base, 0.6);
        if ((y < 4 && x === 7) || (y >= 4 && y < 8 && x === 13) || (y >= 8 && y < 12 && x === 3) || (y >= 12 && x === 10)) c = U.shade(base, 0.6);
        p(x, y, c);
      }
    });
    tile(T.GLASS, p => {
      for (let i = 0; i < px; i++) { p(i, 0, '#dfeef4'); p(i, 15, '#dfeef4'); p(0, i, '#dfeef4'); p(15, i, '#dfeef4'); }
      p(3, 3, '#ffffff'); p(4, 4, '#ffffff'); p(5, 5, '#cfe8f0'); p(11, 10, '#cfe8f0'); p(12, 11, '#ffffff');
    });
    tile(T.ALLOY, p => {
      noiseFill(p, '#c8cdd4', 6);
      for (let i = 0; i < px; i++) { p(i, 0, '#e8ecf0'); p(i, 15, '#8f959e'); p(0, i, '#dfe3e8'); p(15, i, '#9aa0a8'); }
      for (let x = 2; x < 6; x++) p(x, 12, '#ff8a5c');
      p(2, 2, '#7a8088'); p(13, 2, '#7a8088'); p(2, 13, '#7a8088'); p(13, 13, '#7a8088');
    });
    tile(T.FRAME, p => {
      noiseFill(p, '#6a7078', 10);
      // 网格骨架纹理：十字交叉的金属梁 + 镂空
      for (let i = 0; i < px; i++) {
        p(i, 0, '#8f959e'); p(i, 7, '#8f959e'); p(i, 15, '#8f959e');
        p(0, i, '#8f959e'); p(7, i, '#8f959e'); p(15, i, '#8f959e');
      }
      p(0, 0, '#c8cdd4'); p(15, 0, '#c8cdd4'); p(0, 15, '#c8cdd4'); p(15, 15, '#c8cdd4');
      for (let x = 2; x < 6; x++) p(x, 12, '#ff8a5c');
    });
    tile(T.LAMP, p => {
      noiseFill(p, '#ffe9b0', 8);
      for (let y = 2; y < 14; y++) for (let x = 2; x < 14; x++) p(x, y, U.vary('#fff4cf', rng, 6));
      for (let i = 0; i < px; i++) { p(i, 0, '#a89058'); p(i, 15, '#a89058'); p(0, i, '#a89058'); p(15, i, '#a89058'); }
    });
    tile(T.WATER, p => {
      const w = pal.water || '#2e7fa8';
      noiseFill(p, w, 10);
      for (let i = 0; i < 6; i++) { const x = U.randi(0, 12), y = U.randi(0, 15); p(x, y, U.shade(w, 1.3)); p(x + 1, y, U.shade(w, 1.2)); }
    });

    const drawCross = (t, fn) => tile(t, fn);
    drawCross(T.TUFT, p => {
      for (let i = 0; i < 9; i++) {
        const x = 1 + U.randi(0, 13), h = 4 + U.randi(0, 7);
        for (let y = 0; y < h; y++) p(x + (y > h - 3 && rng() < 0.4 ? (rng() < 0.5 ? 1 : -1) : 0), 15 - y, U.vary(pal.grassAlt, rng, 26));
      }
    });
    drawCross(T.PLANT, p => {
      for (let y = 8; y < 16; y++) p(8, y, U.shade(pal.wood, 1.1));
      const c = pal.leaves[1] || pal.leaves[0];
      for (let i = 0; i < 22; i++) {
        const a = rng() * 6.28, r = rng() * 4.2;
        p(Math.round(8 + Math.cos(a) * r), Math.round(6 + Math.sin(a) * r * 0.75), U.vary(c, rng, 24));
      }
      p(8, 5, '#ffffff');
    });
    drawCross(T.NA, p => {
      for (let y = 9; y < 16; y++) p(8, y, '#7a6a30');
      const pts = [[8, 4], [6, 6], [10, 6], [7, 8], [9, 8], [8, 6], [5, 5], [11, 5]];
      for (const [x, y] of pts) { p(x, y, '#ffd166'); p(x, y - 1, '#ffe9a8'); }
      p(8, 3, '#fff6d0'); p(4, 8, '#ffd166'); p(12, 8, '#ffd166');
    });
    drawCross(T.H, p => {
      const shard = (bx, by, h, c1, c2) => {
        for (let y = 0; y < h; y++) { p(bx, 15 - y, y > h - 3 ? c2 : c1); if (y < h - 4) p(bx + 1, 15 - y, U.shade(c1, 0.8)); }
      };
      shard(4, 15, 8, '#5a9ae8', '#bcd9ff'); shard(8, 15, 12, '#6aaaf4', '#e0eeff'); shard(11, 15, 6, '#4a8ad8', '#a8ccff');
      p(8, 3, '#ffffff');
    });
    drawCross(T.O2, p => {
      for (let y = 8; y < 16; y++) p(8, y, '#5f7a40');
      const c = ['#ff6a5a', '#ff8a7a', '#ffb0a0'];
      for (const [x, y] of [[8, 4], [6, 5], [10, 5], [7, 7], [9, 7], [8, 6], [8, 2], [5, 7], [11, 7]]) p(x, y, U.pick(c, rng));
      p(8, 5, '#fff0e8'); p(4, 10, '#ff8a7a'); p(12, 10, '#ff8a7a');
    });
    tile(T.FERRITE, p => {
      noiseFill(p, '#6f6a62', 12);
      for (let i = 0; i < 14; i++) { const x = U.randi(1, 14), y = U.randi(1, 14); p(x, y, '#c9825a'); if (rng() < 0.5) p(x + 1, y, '#a86a48'); }
    });
    tile(T.COPPER, p => {
      noiseFill(p, '#7d8288', 12);
      for (let i = 0; i < 12; i++) { const x = U.randi(1, 13), y = U.randi(1, 13); p(x, y, '#7de8c3'); p(x + 1, y, '#4ec9a0'); if (rng() < 0.4) p(x, y + 1, '#a8f4dc'); }
    });
    tile(T.BEDROCK, p => {
      noiseFill(p, '#3a3d44', 20);
      for (let i = 0; i < 12; i++) p(U.randi(0, 15), U.randi(0, 15), '#14161c');
    });
    tile(T.STAIRS, p => {
      noiseFill(p, '#8a8f96', 12);
      // 阶梯纹理：下半实心，上半斜面阴影
      for (let x = 0; x < px; x++) for (let y = 0; y < px; y++) {
        if (y < 8) { p(x, y, U.vary('#7a7f88', rng, 8)); }
        else if (y < 12) { p(x, y, U.vary('#9aa0a8', rng, 8)); }
        else { p(x, y, U.vary('#aab0b8', rng, 6)); }
      }
      // 阶梯分割线
      for (let x = 0; x < px; x++) { p(x, 7, '#5a5f66'); p(x, 11, '#6a6f76'); }
      // 侧面纹理
      for (let i = 0; i < 6; i++) { const x = U.randi(0, 14), y = U.randi(0, 5); p(x, y, '#6f747c'); p(x + 1, y, '#7a7f88'); }
    });
    tile(T.WINDOW, p => {
      // 透明窗格：金属框架 + 半透明玻璃
      for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) p(x, y, U.vary('#2a3a4a', rng, 8));
      // 玻璃区域（内框）
      for (let y = 3; y < 13; y++) for (let x = 3; x < 13; x++) p(x, y, U.vary('#1a2a3a', rng, 6));
      // 反光高光
      for (let i = 0; i < 8; i++) { const x = U.randi(4, 11), y = U.randi(4, 11); p(x, y, '#4a6a8a'); }
      p(5, 5, '#7ab0d8'); p(6, 6, '#5a8ab8'); p(10, 9, '#3a5a7a');
      // 金属框架（外框）
      for (let i = 0; i < px; i++) { p(i, 0, '#8f959e'); p(i, 1, '#a8aeb6'); p(i, 14, '#7a8088'); p(i, 15, '#6a7078'); }
      for (let i = 0; i < px; i++) { p(0, i, '#8f959e'); p(1, i, '#a8aeb6'); p(14, i, '#7a8088'); p(15, i, '#6a7078'); }
      // 十字窗棂
      for (let i = 2; i < 14; i++) { p(i, 7, '#9aa0a8'); p(i, 8, '#8f959e'); }
      for (let i = 2; i < 14; i++) { p(7, i, '#9aa0a8'); p(8, i, '#8f959e'); }
    });

    for (let s = 0; s < 3; s++) {
      tile(T.CRACK0 + s, p => {
        const n = 8 + s * 12;
        let x = 8, y = 8;
        for (let i = 0; i < n; i++) {
          p(x & 15, y & 15, 'rgba(10,8,6,0.85)');
          x += U.randi(-2, 2); y += U.randi(-2, 2);
          if (rng() < 0.3) { x = U.randi(3, 12); y = U.randi(3, 12); }
        }
      });
    }

    // 宝箱纹理
    tile(T.CHEST, p => {
      // 木箱主体
      noiseFill(p, '#8a6a40', 12);
      // 金属边框
      for (let i = 0; i < px; i++) { p(i, 0, '#6a7078'); p(i, 15, '#5a6068'); }
      for (let i = 0; i < px; i++) { p(0, i, '#6a7078'); p(15, i, '#5a6068'); }
      // 木板横纹
      for (let y = 4; y < px; y += 4) for (let x = 0; x < px; x++) p(x, y, U.shade('#8a6a40', 0.7));
      // 锁扣
      for (let x = 6; x <= 9; x++) for (let y = 6; y <= 9; y++) p(x, y, '#c8a040');
      p(7, 7, '#e8d070'); p(8, 8, '#e8d070');
      // 高光
      for (let i = 0; i < 5; i++) p(U.randi(2, 14), U.randi(2, 5), U.shade('#a08050', 1.3));
    });

    // 床纹理
    tile(T.BED, p => {
      // 床板
      noiseFill(p, U.shade(pal.wood, 1.15), 10);
      // 床单（蓝色调）
      for (let y = 3; y < 14; y++) for (let x = 2; x < 14; x++) p(x, y, U.vary('#6ab4e8', rng, 14));
      // 枕头
      for (let y = 1; y < 5; y++) for (let x = 4; x < 12; x++) p(x, y, U.vary('#e8e4dc', rng, 6));
      // 枕头高光
      p(6, 2, '#ffffff'); p(7, 2, '#f0f0f0');
      // 床单褶皱
      for (let i = 0; i < 6; i++) { const x = U.randi(3, 13), y = U.randi(5, 13); p(x, y, U.shade('#6ab4e8', 0.8)); }
      // 床框边
      for (let x = 0; x < px; x++) { p(x, 0, '#6a5040'); p(x, 15, '#6a5040'); }
    });

    // 门纹理
    tile(T.DOOR, p => {
      // 门框
      for (let x = 0; x < px; x++) { p(x, 0, '#5a4030'); p(x, 15, '#5a4030'); }
      for (let y = 0; y < px; y++) { p(0, y, '#5a4030'); p(15, y, '#5a4030'); }
      // 门板
      noiseFill(p, U.shade(pal.wood, 1.1), 10);
      // 木板横纹
      for (let y = 3; y < px; y += 3) for (let x = 1; x < 15; x++) p(x, y, U.shade(pal.wood, 0.7));
      // 门把手
      for (let x = 10; x <= 11; x++) for (let y = 7; y <= 8; y++) p(x, y, '#c8a040');
      p(10, 7, '#e8d070');
      // 高光
      for (let i = 0; i < 4; i++) p(U.randi(2, 14), U.randi(1, 5), U.shade(pal.wood, 1.3));
    });

    // 作物种子阶段
    tile(T.CROP_S1, p => {
      // 土壤小土堆
      for (let x = 4; x <= 11; x++) p(x, 13, '#6a5a3d'); p(5, 12, '#6a5a3d'); p(10, 12, '#6a5a3d');
      // 小芽
      p(7, 11, '#5aaa40'); p(8, 11, '#5aaa40');
      p(7, 10, '#6abb50');
    });

    // 作物幼苗阶段
    tile(T.CROP_S2, p => {
      // 土壤
      for (let x = 3; x <= 12; x++) p(x, 14, '#6a5a3d'); p(4, 13, '#6a5a3d'); p(11, 13, '#6a5a3d');
      // 茎
      p(7, 12, '#4a9a30'); p(8, 12, '#4a9a30');
      p(7, 11, '#5aaa40'); p(8, 11, '#5aaa40');
      p(7, 10, '#5aaa40'); p(8, 10, '#5aaa40');
      // 小叶
      p(6, 10, '#6abb50'); p(9, 10, '#6abb50');
      p(7, 9, '#6abb50'); p(8, 9, '#6abb50');
    });

    // 作物成熟阶段
    tile(T.CROP_S3, p => {
      // 土壤
      for (let x = 2; x <= 13; x++) p(x, 14, '#6a5a3d'); p(3, 13, '#6a5a3d'); p(12, 13, '#6a5a3d');
      // 茎（更高更粗）
      for (let y = 6; y <= 13; y++) { p(7, y, '#4a9a30'); p(8, y, '#4a9a30'); }
      // 叶子
      p(5, 9, '#6abb50'); p(6, 8, '#6abb50'); p(9, 8, '#6abb50'); p(10, 9, '#6abb50');
      p(5, 11, '#5aaa40'); p(10, 11, '#5aaa40');
      // 果实/花朵
      p(6, 5, '#e8c84a'); p(7, 5, '#e8d070'); p(8, 5, '#e8d070'); p(9, 5, '#e8c84a');
      p(7, 4, '#f0e080'); p(8, 4, '#f0e080');
    });

    // 农田纹理
    tile(T.FARMLAND, p => {
      // 深棕色土壤底色
      noiseFill(p, '#5a4a32', 14);
      // 田垄条纹（水平）
      for (let y = 0; y < px; y++) {
        const rowColor = (y % 4 < 2) ? '#6a5a3d' : '#4a3a28';
        for (let x = 0; x < px; x++) p(x, y, U.vary(rowColor, rng, 10));
      }
      // 少量绿色芽点
      for (let i = 0; i < 6; i++) {
        const x = U.randi(1, 14), y = U.randi(1, 14);
        p(x, y, '#6a8a3a'); p(x, y - 1, '#7a9a4a');
      }
      // 边框阴影
      for (let i = 0; i < px; i++) { p(i, 0, '#3a2a1a'); p(i, 15, '#3a2a1a'); }
      for (let i = 0; i < px; i++) { p(0, i, '#3a2a1a'); p(15, i, '#3a2a1a'); }
    });

    if (this.texture) this.texture.dispose();
    const tex = new THREE.CanvasTexture(this.canvas);
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
    this.texture = tex;
    this.iconCache = {};
    this.avgCache = {};
    return tex;
  }

  tileAvg(t, f) {
    this.avgCache = this.avgCache || {};
    const key = t + '_' + f;
    if (this.avgCache[key]) return this.avgCache[key];
    const [ox, oy, s] = this.tileRect(t);
    const d = this.ctx.getImageData(ox, oy, s, s).data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] < 40) continue; r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; }
    n = Math.max(n, 1);
    const out = U.rgbHex((r / n) * f, (g / n) * f, (b / n) * f);
    this.avgCache[key] = out;
    return out;
  }

  icon(itemId) {
    if (this.iconCache[itemId]) return this.iconCache[itemId];
    const def = ITEMS[itemId];
    const c = document.createElement('canvas');
    c.width = c.height = 48;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;

    if (def.place !== undefined) {
      const bd = BLOCK_DEF[def.place];
      const tt = bd.tiles.top !== undefined ? bd.tiles.top : bd.tiles.all;
      const ts = bd.tiles.side !== undefined ? bd.tiles.side : bd.tiles.all;
      if (bd.cross) {
        const [ox, oy, s] = this.tileRect(tt);
        x.drawImage(this.canvas, ox, oy, s, s, 4, 4, 40, 40);
      } else {
        const top = this.tileAvg(tt, 1.0), left = this.tileAvg(ts, 0.78), right = this.tileAvg(ts, 0.56);
        const cx = 24, cy = 25, w = 19, h = 10;
        x.fillStyle = top;
        x.beginPath(); x.moveTo(cx, cy - h * 2 + 1); x.lineTo(cx + w, cy - h + 1); x.lineTo(cx, cy + 1); x.lineTo(cx - w, cy - h + 1); x.closePath(); x.fill();
        x.fillStyle = left;
        x.beginPath(); x.moveTo(cx - w, cy - h + 1); x.lineTo(cx, cy + 1); x.lineTo(cx, cy + h * 2); x.lineTo(cx - w, cy + h); x.closePath(); x.fill();
        x.fillStyle = right;
        x.beginPath(); x.moveTo(cx + w, cy - h + 1); x.lineTo(cx, cy + 1); x.lineTo(cx, cy + h * 2); x.lineTo(cx + w, cy + h); x.closePath(); x.fill();
        x.strokeStyle = 'rgba(255,255,255,0.25)'; x.lineWidth = 1;
        x.beginPath(); x.moveTo(cx, cy - h * 2 + 1); x.lineTo(cx + w, cy - h + 1); x.lineTo(cx, cy + 1); x.lineTo(cx - w, cy - h + 1); x.closePath(); x.stroke();
      }
    } else if (def.sym) {
      x.fillStyle = def.col + '33';
      x.strokeStyle = def.col;
      x.lineWidth = 2;
      x.beginPath(); x.moveTo(24, 3); x.lineTo(45, 24); x.lineTo(24, 45); x.lineTo(3, 24); x.closePath();
      x.fill(); x.stroke();
      x.fillStyle = def.col;
      x.font = '700 ' + (def.sym.length > 1 ? 15 : 19) + 'px Rajdhani, sans-serif';
      x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText(def.sym, 24, 25);
    } else {
      const g = def.glyph, col = def.col || '#fff';
      x.strokeStyle = col; x.fillStyle = col; x.lineWidth = 2.4;
      if (g === 'plate') {
        for (let i = 0; i < 3; i++) { x.strokeRect(9 + i * 3, 12 + i * 5, 26, 8); }
      } else if (g === 'tube') {
        x.beginPath();
        for (let t = 0; t <= 40; t++) { const px2 = 6 + t * 0.9, py = 24 + Math.sin(t * 0.55) * 8; t ? x.lineTo(px2, py) : x.moveTo(px2, py); }
        x.stroke();
        x.beginPath();
        for (let t = 0; t <= 40; t++) { const px2 = 6 + t * 0.9, py = 24 - Math.sin(t * 0.55) * 8; t ? x.lineTo(px2, py) : x.moveTo(px2, py); }
        x.stroke();
      } else if (g === 'fuel') {
        x.strokeRect(15, 8, 18, 32); x.fillRect(19, 4, 10, 5);
        x.fillRect(18, 26, 12, 11);
      } else if (g === 'warp') {
        x.beginPath(); x.arc(24, 24, 15, 0, 6.28); x.stroke();
        x.beginPath(); x.arc(24, 24, 7, 0, 6.28); x.fill();
        x.beginPath(); x.moveTo(24, 2); x.lineTo(24, 12); x.moveTo(24, 36); x.lineTo(24, 46); x.moveTo(2, 24); x.lineTo(12, 24); x.moveTo(36, 24); x.lineTo(46, 24); x.stroke();
      } else if (g === 'batt') {
        x.strokeRect(14, 10, 20, 32); x.fillRect(20, 5, 8, 5);
        x.beginPath(); x.moveTo(26, 16); x.lineTo(19, 27); x.lineTo(24, 27); x.lineTo(21, 37); x.lineTo(30, 24); x.lineTo(25, 24); x.closePath(); x.fill();
      } else if (g === 'o2c') {
        x.beginPath(); x.ellipse(24, 24, 10, 17, 0, 0, 6.28); x.stroke();
        x.font = '700 13px Rajdhani'; x.textAlign = 'center'; x.fillText('O₂', 24, 28);
      } else if (g === 'med') {
        x.strokeRect(10, 14, 28, 22);
        x.fillRect(21, 19, 6, 12); x.fillRect(18, 22, 12, 6);
      } else if (g === 'armor') {
        // 盾牌形状
        x.beginPath(); x.moveTo(24, 5); x.lineTo(40, 14); x.lineTo(38, 32); x.lineTo(24, 44); x.lineTo(10, 32); x.lineTo(8, 14); x.closePath();
        x.fill(); x.stroke();
        x.fillStyle = '#c0d0e0';
        x.beginPath(); x.moveTo(24, 10); x.lineTo(34, 16); x.lineTo(32, 28); x.lineTo(24, 36); x.lineTo(16, 28); x.lineTo(14, 16); x.closePath(); x.fill();
      } else if (g === 'armor2') {
        // 高级盾牌
        x.beginPath(); x.moveTo(24, 3); x.lineTo(42, 13); x.lineTo(40, 34); x.lineTo(24, 45); x.lineTo(8, 34); x.lineTo(6, 13); x.closePath();
        x.fill(); x.stroke();
        x.fillStyle = '#f0d870';
        x.beginPath(); x.moveTo(24, 9); x.lineTo(35, 16); x.lineTo(33, 30); x.lineTo(24, 38); x.lineTo(15, 30); x.lineTo(13, 16); x.closePath(); x.fill();
        // 星形装饰
        x.fillStyle = '#fff';
        x.beginPath(); x.arc(24, 22, 3, 0, 6.28); x.fill();
      } else if (g === 'bed') {
        // 床图标
        x.fillStyle = '#8a6a40';
        x.fillRect(6, 32, 36, 6); // 床板
        x.fillStyle = '#6ab4e8';
        x.fillRect(8, 18, 32, 14); // 床单
        x.fillStyle = '#e8e4dc';
        x.fillRect(10, 12, 14, 8); // 枕头
        x.fillRect(28, 12, 14, 8); // 枕头2
        x.strokeStyle = col; x.lineWidth = 1.5;
        x.strokeRect(6, 12, 36, 26);
      } else if (g === 'door') {
        // 门图标
        x.fillStyle = '#8a6a40';
        x.fillRect(14, 4, 20, 38); // 门板
        x.fillStyle = '#5a4030';
        x.fillRect(12, 2, 24, 2); x.fillRect(12, 42, 24, 2); // 上下框
        x.fillRect(12, 2, 2, 42); x.fillRect(34, 2, 2, 42); // 左右框
        x.fillStyle = '#c8a040';
        x.fillRect(28, 22, 4, 4); // 把手
        x.strokeStyle = col; x.lineWidth = 1;
        x.strokeRect(12, 2, 24, 42);
      } else if (g === 'seed1' || g === 'seed2') {
        // 种子图标
        const c1 = g === 'seed1' ? '#7ab84a' : '#e8a040';
        x.fillStyle = c1;
        x.beginPath(); x.arc(24, 24, 8, 0, 6.28); x.fill();
        x.fillStyle = '#fff';
        x.beginPath(); x.arc(22, 22, 2, 0, 6.28); x.fill();
        x.strokeStyle = col; x.lineWidth = 1.5;
        x.beginPath(); x.arc(24, 24, 8, 0, 6.28); x.stroke();
      } else if (g === 'food1' || g === 'food2') {
        // 食材图标
        const c2 = g === 'food1' ? '#7ab84a' : '#e8a040';
        x.fillStyle = c2;
        x.fillRect(10, 14, 28, 20); // 碗
        x.fillStyle = '#fff';
        x.fillRect(12, 16, 24, 2); // 高光
        x.strokeStyle = col; x.lineWidth = 1.5;
        x.strokeRect(10, 14, 28, 20);
      } else if (g === 'food_b' || g === 'food_a') {
        // 料理图标
        const c3 = g === 'food_b' ? '#6ab84a' : '#e8c84a';
        x.fillStyle = '#8a6a40';
        x.fillRect(8, 8, 32, 30); // 碗
        x.fillStyle = c3;
        x.fillRect(10, 10, 28, 16); // 食物
        x.fillStyle = '#fff';
        x.fillRect(12, 12, 8, 2); // 高光
        x.strokeStyle = col; x.lineWidth = 1.5;
        x.strokeRect(8, 8, 32, 30);
      } else if (g === 'farmland') {
        // 农田图标：等距方块 + 田垄
        x.fillStyle = '#5a4a32';
        x.fillRect(8, 14, 32, 24);
        // 田垄条纹
        x.fillStyle = '#6a5a3d';
        for (let y = 14; y < 38; y += 6) x.fillRect(8, y, 32, 3);
        // 绿色芽点
        x.fillStyle = '#6a8a3a';
        x.fillRect(14, 20, 2, 3); x.fillRect(24, 26, 2, 3); x.fillRect(34, 22, 2, 3);
        x.strokeStyle = col; x.lineWidth = 1.5;
        x.strokeRect(8, 14, 32, 24);
      }
    }
    const url = c.toDataURL();
    this.iconCache[itemId] = url;
    return url;
  }
}
