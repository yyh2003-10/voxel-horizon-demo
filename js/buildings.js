/**
 * buildings.js — 建筑生成模块 (v3)
 * 修复地形不平导致的建筑破损问题
 */

class BuildingGenerator {
  constructor(world) {
    this.world = world;
    this.seed = world.seed;
  }

  /**
   * 生成建筑
   */
  generate(chunk, cx, cz) {
    const rng = U.mulberry32(this.seed ^ (cx * 7717 + cz * 26951));

    // 每个区块 15% 概率生成建筑
    if (rng() > 0.15) return;

    // 选择建筑类型
    const buildingType = this.selectBuildingType(rng);

    // 在区块中心附近选择位置
    const bx = 4 + Math.floor(rng() * 8);
    const bz = 4 + Math.floor(rng() * 8);
    const gx = cx * 16 + bx;
    const gz = cz * 16 + bz;

    // 获取地表高度
    const gy = this.world.surfaceY(gx, gz);
    const sea = this.world.pal.sea ? CFG.SEA : -1;

    // 检查生成条件
    if (sea >= 0 && gy <= sea + 2) return;
    if (gy > CFG.WORLD_H - 20) return;
    if (chunk.get(bx, gy, bz) !== B.GRASS && chunk.get(bx, gy, bz) !== B.DIRT) return;

    // 设置方块辅助函数
    const set = (lx, y, lz, id) => {
      if (lx < 0 || lx > 15 || lz < 0 || lz > 15 || y < 1 || y >= CFG.WORLD_H) return;
      chunk.set(lx, y, lz, id);
    };

    // 根据建筑类型生成
    switch (buildingType) {
      case 'small_house':
        this.generateSmallHouse(set, bx, bz, gy, rng);
        this.placeChests(set, bx, bz, gy, 5, 5, 4, rng);
        this.placeDoors(set, bx, bz, gy, 5);
        this.placeFarmland(chunk, cx, cz, bx, bz, gy, 5, 5, rng);
        break;
      case 'cabin':
        this.generateCabin(set, bx, bz, gy, rng);
        this.placeChests(set, bx, bz, gy, 6, 7, 4, rng);
        this.placeDoors(set, bx, bz, gy, 6);
        this.placeFarmland(chunk, cx, cz, bx, bz, gy, 6, 7, rng);
        break;
      case 'tower_house':
        this.generateTowerHouse(set, bx, bz, gy, rng);
        this.placeChests(set, bx, bz, gy, 5, 5, 7, rng);
        this.placeDoors(set, bx, bz, gy, 5);
        this.placeFarmland(chunk, cx, cz, bx, bz, gy, 5, 5, rng);
        break;
      case 'l_shaped':
        this.generateLShaped(set, bx, bz, gy, rng);
        this.placeChests(set, bx, bz, gy, 9, 5, 4, rng);
        this.placeDoors(set, bx, bz, gy, 5);
        this.placeFarmland(chunk, cx, cz, bx, bz, gy, 5, 5, rng);
        break;
      default:
        this.generateSmallHouse(set, bx, bz, gy, rng);
        this.placeChests(set, bx, bz, gy, 5, 5, 4, rng);
        this.placeDoors(set, bx, bz, gy, 5);
        this.placeFarmland(chunk, cx, cz, bx, bz, gy, 5, 5, rng);
    }
  }

  /**
   * 选择建筑类型
   */
  selectBuildingType(rng) {
    const types = [
      { type: 'small_house', weight: 35 },
      { type: 'cabin', weight: 25 },
      { type: 'tower_house', weight: 20 },
      { type: 'l_shaped', weight: 20 }
    ];

    const totalWeight = types.reduce((sum, t) => sum + t.weight, 0);
    let rand = rng() * totalWeight;

    for (const t of types) {
      rand -= t.weight;
      if (rand <= 0) return t.type;
    }
    return 'small_house';
  }

  /**
   * 小木屋 - 最基础的可居住建筑
   */
  generateSmallHouse(set, bx, bz, baseY, rng) {
    const width = 5;
    const depth = 5;
    const wallHeight = 4;
    const doorX = Math.floor(width / 2);

    const wall = rng() < 0.6 ? B.PLANKS : B.STONE;
    const roof = rng() < 0.5 ? B.PLANKS : B.ALLOY;

    // 先平整地基（确保所有位置高度一致）
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < depth; dz++) {
        const y = baseY;
        set(bx + dx, y, bz + dz, B.PLANKS);
        // 清除上方可能存在的方块
        for (let clearY = y + 1; clearY < y + wallHeight + 3; clearY++) {
          set(bx + dx, clearY, bz + dz, B.AIR);
        }
      }
    }

    // 四面墙
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < depth; dz++) {
        const isEdge = dx === 0 || dx === width - 1 || dz === 0 || dz === depth - 1;
        if (!isEdge) continue;

        const y = baseY;

        // 前墙（有门）
        if (dz === 0) {
          if (dx !== doorX) {
            for (let h = 1; h <= wallHeight; h++) {
              set(bx + dx, y + h, bz + dz, wall);
            }
          }
          continue;
        }

        // 后墙
        if (dz === depth - 1) {
          for (let h = 1; h <= wallHeight; h++) {
            set(bx + dx, y + h, bz + dz, wall);
          }
          // 后墙窗户
          if (dx === Math.floor(width / 2) && wallHeight >= 3) {
            set(bx + dx, y + 3, bz + dz, B.GLASS);
          }
          continue;
        }

        // 侧墙
        if (dx === 0 || dx === width - 1) {
          for (let h = 1; h <= wallHeight; h++) {
            set(bx + dx, y + h, bz + dz, wall);
          }
          // 侧墙窗户
          if (dz === Math.floor(depth / 2) && wallHeight >= 3) {
            set(bx + dx, y + 3, bz + dz, B.GLASS);
          }
        }
      }
    }

    // 人字形屋顶
    const roofPeak = wallHeight + 2;

    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < depth; dz++) {
        const y = baseY;
        const distFromCenter = Math.abs(dx - Math.floor(width / 2));

        let roofY;
        if (distFromCenter === 0) roofY = roofPeak;
        else if (distFromCenter === 1) roofY = wallHeight + 1;
        else roofY = wallHeight;

        set(bx + dx, y + roofY, bz + dz, roof);
      }
    }

    // 门上方横梁
    set(bx + doorX, baseY + wallHeight, bz, B.PLANKS);
  }

  /**
   * 林间小屋 - 带门廊
   */
  generateCabin(set, bx, bz, baseY, rng) {
    const width = 6;
    const depth = 7;
    const wallHeight = 4;
    const porchDepth = 2;

    const wall = rng() < 0.6 ? B.PLANKS : B.STONE;
    const roof = rng() < 0.5 ? B.PLANKS : B.ALLOY;

    // 平整地基（包括门廊）
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < depth + porchDepth; dz++) {
        set(bx + dx, baseY, bz + dz, B.PLANKS);
        // 清除上方
        for (let clearY = baseY + 1; clearY < baseY + wallHeight + 3; clearY++) {
          set(bx + dx, clearY, bz + dz, B.AIR);
        }
      }
    }

    // 门廊柱子
    set(bx + 1, baseY + 1, bz + depth, wall);
    set(bx + 1, baseY + 2, bz + depth, wall);
    set(bx + width - 2, baseY + 1, bz + depth, wall);
    set(bx + width - 2, baseY + 2, bz + depth, wall);

    // 门廊顶
    for (let dx = 0; dx < width; dx++) {
      set(bx + dx, baseY + 3, bz + depth, roof);
    }

    // 主屋墙壁
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < depth; dz++) {
        const isEdge = dx === 0 || dx === width - 1 || dz === 0 || dz === depth - 1;
        if (!isEdge) continue;

        // 前墙（有门，连接门廊）
        if (dz === 0) {
          if (dx !== Math.floor(width / 2)) {
            for (let h = 1; h <= wallHeight; h++) {
              set(bx + dx, baseY + h, bz + dz, wall);
            }
          }
          continue;
        }

        // 后墙
        if (dz === depth - 1) {
          for (let h = 1; h <= wallHeight; h++) {
            set(bx + dx, baseY + h, bz + dz, wall);
          }
          continue;
        }

        // 侧墙
        if (dx === 0 || dx === width - 1) {
          for (let h = 1; h <= wallHeight; h++) {
            set(bx + dx, baseY + h, bz + dz, wall);
          }
          // 窗户
          if (dz === Math.floor(depth / 2) || dz === Math.floor(depth / 3) || dz === Math.floor(depth * 2 / 3)) {
            set(bx + dx, baseY + 3, bz + dz, B.GLASS);
          }
        }
      }
    }

    // 屋顶
    const roofPeak = wallHeight + 2;
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < depth; dz++) {
        const distFromCenter = Math.abs(dx - Math.floor(width / 2));

        let roofY;
        if (distFromCenter === 0) roofY = roofPeak;
        else if (distFromCenter === 1) roofY = wallHeight + 1;
        else roofY = wallHeight;

        set(bx + dx, baseY + roofY, bz + dz, roof);
      }
    }
  }

  /**
   * 塔楼 - 两层建筑
   */
  generateTowerHouse(set, bx, bz, baseY, rng) {
    const width = 5;
    const depth = 5;
    const firstFloorHeight = 4;
    const secondFloorHeight = 3;
    const totalHeight = firstFloorHeight + secondFloorHeight;

    const wall = rng() < 0.6 ? B.PLANKS : B.STONE;
    const roof = rng() < 0.5 ? B.PLANKS : B.ALLOY;

    // 平整地基
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < depth; dz++) {
        set(bx + dx, baseY, bz + dz, B.PLANKS);
        // 清除上方
        for (let clearY = baseY + 1; clearY < baseY + totalHeight + 4; clearY++) {
          set(bx + dx, clearY, bz + dz, B.AIR);
        }
      }
    }

    // 墙壁（两层）
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < depth; dz++) {
        const isEdge = dx === 0 || dx === width - 1 || dz === 0 || dz === depth - 1;
        if (!isEdge) continue;

        // 前墙（有门）
        if (dz === 0) {
          if (dx !== Math.floor(width / 2)) {
            for (let h = 1; h <= totalHeight; h++) {
              set(bx + dx, baseY + h, bz + dz, wall);
            }
          }
          continue;
        }

        // 其他墙
        for (let h = 1; h <= totalHeight; h++) {
          set(bx + dx, baseY + h, bz + dz, wall);
        }

        // 窗户
        if (isEdge) {
          // 一楼窗户
          if (dz === Math.floor(depth / 2) || dx === Math.floor(width / 2)) {
            set(bx + dx, baseY + 3, bz + dz, B.GLASS);
          }
          // 二楼窗户
          if (dz === Math.floor(depth / 2) || dx === Math.floor(width / 2)) {
            set(bx + dx, baseY + firstFloorHeight + 2, bz + dz, B.GLASS);
          }
        }
      }
    }

    // 二楼地板
    for (let dx = 1; dx < width - 1; dx++) {
      for (let dz = 1; dz < depth - 1; dz++) {
        set(bx + dx, baseY + firstFloorHeight, bz + dz, B.PLANKS);
      }
    }

    // 尖顶屋顶
    const roofPeak = totalHeight + 3;
    for (let dx = 0; dx < width; dx++) {
      for (let dz = 0; dz < depth; dz++) {
        const distFromCenter = Math.sqrt(
          Math.pow(dx - Math.floor(width / 2), 2) +
          Math.pow(dz - Math.floor(depth / 2), 2)
        );

        let roofY;
        if (distFromCenter < 1) roofY = roofPeak;
        else if (distFromCenter < 1.5) roofY = totalHeight + 2;
        else if (distFromCenter < 2) roofY = totalHeight + 1;
        else roofY = totalHeight;

        set(bx + dx, baseY + roofY, bz + dz, roof);
      }
    }
  }

  /**
   * 在建筑内部放置宝箱（1-2个，随机角落位置）
   */
  placeChests(set, bx, bz, baseY, width, depth, wallHeight, rng) {
    const chestCount = rng() < 0.5 ? 1 : 2;
    const corners = [
      [1, 1], [1, depth - 2], [width - 2, 1], [width - 2, depth - 2]
    ];
    // 打乱角落顺序
    for (let i = corners.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [corners[i], corners[j]] = [corners[j], corners[i]];
    }
    for (let i = 0; i < chestCount && i < corners.length; i++) {
      const [dx, dz] = corners[i];
      set(bx + dx, baseY + 1, bz + dz, B.CHEST);
    }
  }

  /**
   * 在建筑门洞位置放置门方块
   */
  placeDoors(set, bx, bz, baseY, width) {
    const doorX = Math.floor(width / 2);
    // 门放在门洞底部（baseY + 1 = 地板上方一格）
    set(bx + doorX, baseY + 1, bz, B.DOOR);
  }

  /**
   * L形房 - 两个房间连接
   */
  generateLShaped(set, bx, bz, baseY, rng) {
    const room1Width = 5;
    const room1Depth = 5;
    const room2Width = 4;
    const room2Depth = 4;
    const wallHeight = 4;

    const wall = rng() < 0.6 ? B.PLANKS : B.STONE;
    const roof = rng() < 0.5 ? B.PLANKS : B.ALLOY;

    // 平整地基（两个房间）
    for (let dx = 0; dx < room1Width + room2Width; dx++) {
      for (let dz = 0; dz < Math.max(room1Depth, room2Depth); dz++) {
        if (dx < room1Width && dz < room1Depth) {
          set(bx + dx, baseY, bz + dz, B.PLANKS);
        }
        if (dx >= room1Width && dz < room2Depth) {
          set(bx + dx, baseY, bz + dz, B.PLANKS);
        }
        // 清除上方
        for (let clearY = baseY + 1; clearY < baseY + wallHeight + 3; clearY++) {
          set(bx + dx, clearY, bz + dz, B.AIR);
        }
      }
    }

    // 房间1墙壁
    for (let dx = 0; dx < room1Width; dx++) {
      for (let dz = 0; dz < room1Depth; dz++) {
        const isEdge = dx === 0 || dx === room1Width - 1 || dz === 0 || dz === room1Depth - 1;
        if (!isEdge) continue;

        // 前墙（有门）
        if (dz === 0) {
          if (dx !== Math.floor(room1Width / 2)) {
            for (let h = 1; h <= wallHeight; h++) {
              set(bx + dx, baseY + h, bz + dz, wall);
            }
          }
          continue;
        }

        // 后墙和侧墙
        for (let h = 1; h <= wallHeight; h++) {
          set(bx + dx, baseY + h, bz + dz, wall);
        }

        // 窗户
        if (dz === Math.floor(room1Depth / 2) || dx === Math.floor(room1Width / 2)) {
          set(bx + dx, baseY + 3, bz + dz, B.GLASS);
        }
      }
    }

    // 房间2墙壁
    for (let dx = 0; dx < room2Width; dx++) {
      for (let dz = 0; dz < room2Depth; dz++) {
        const isEdge = dx === 0 || dx === room2Width - 1 || dz === 0 || dz === room2Depth - 1;
        if (!isEdge) continue;

        // 连接处不建墙（与房间1相通）
        if (dx === 0 && dz < room1Depth) continue;

        // 其他墙
        for (let h = 1; h <= wallHeight; h++) {
          set(bx + room1Width + dx, baseY + h, bz + dz, wall);
        }

        // 窗户
        if (dz === Math.floor(room2Depth / 2) || dx === Math.floor(room2Width / 2)) {
          set(bx + room1Width + dx, baseY + 3, bz + dz, B.GLASS);
        }
      }
    }

    // L形屋顶
    const roofPeak = wallHeight + 2;

    // 房间1屋顶
    for (let dx = 0; dx < room1Width; dx++) {
      for (let dz = 0; dz < room1Depth; dz++) {
        const distFromCenter = Math.abs(dx - Math.floor(room1Width / 2));

        let roofY;
        if (distFromCenter === 0) roofY = roofPeak;
        else if (distFromCenter === 1) roofY = wallHeight + 1;
        else roofY = wallHeight;

        set(bx + dx, baseY + roofY, bz + dz, roof);
      }
    }

    // 房间2屋顶
    for (let dx = 0; dx < room2Width; dx++) {
      for (let dz = 0; dz < room2Depth; dz++) {
        const distFromCenter = Math.abs(dx - Math.floor(room2Width / 2));

        let roofY;
        if (distFromCenter === 0) roofY = roofPeak;
        else if (distFromCenter === 1) roofY = wallHeight + 1;
        else roofY = wallHeight;

        set(bx + room1Width + dx, baseY + roofY, bz + dz, roof);
      }
    }
  }

  /**
   * 在建筑附近放置农田（优先放在门前，检查附近有水）
   */
  placeFarmland(chunk, cx, cz, bx, bz, baseY, width, depth, rng) {
    const world = this.world;
    const doorX = Math.floor(width / 2);
    const candidates = [];

    // 门前方扫描（dz = -1 ~ -3）
    for (let dz = -1; dz >= -3; dz--) {
      for (let dx = -2; dx <= 2; dx++) {
        const wx = cx * 16 + bx + doorX + dx;
        const wz = cz * 16 + bz + dz;
        const sy = world.surfaceY(wx, wz);
        if (sy !== baseY) continue;
        const block = world.getBlock(wx, sy, wz);
        if (block !== B.GRASS && block !== B.DIRT) continue;
        if (world.nearWater(wx, sy, wz, 5)) {
          candidates.push({ wx, wz });
        }
      }
    }

    // 门前方不够，尝试侧面
    if (candidates.length < 3) {
      for (let side = -1; side <= 1; side += 2) {
        const sx = cx * 16 + bx + (side < 0 ? -2 : width + 1);
        for (let dz = 0; dz < depth; dz += 2) {
          const wz = cz * 16 + bz + dz;
          const sy = world.surfaceY(sx, wz);
          if (sy !== baseY) continue;
          const block = world.getBlock(sx, sy, wz);
          if (block !== B.GRASS && block !== B.DIRT) continue;
          if (world.nearWater(sx, sy, wz, 5)) {
            candidates.push({ wx: sx, wz });
          }
        }
      }
    }

    // 如果附近没有水，也接受无水的平坦位置（至少 3 块）
    if (candidates.length < 3) {
      for (let dz = -1; dz >= -3; dz--) {
        for (let dx = -2; dx <= 2; dx++) {
          if (candidates.length >= 6) break;
          const wx = cx * 16 + bx + doorX + dx;
          const wz = cz * 16 + bz + dz;
          const sy = world.surfaceY(wx, wz);
          if (sy !== baseY) continue;
          const block = world.getBlock(wx, sy, wz);
          if (block !== B.GRASS && block !== B.DIRT) continue;
          // 避免重复
          if (candidates.some(c => c.wx === wx && c.wz === wz)) continue;
          candidates.push({ wx, wz });
        }
      }
    }

    // 选择 3-6 块放置农田
    const count = Math.min(3 + Math.floor(rng() * 4), candidates.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(rng() * candidates.length);
      const c = candidates.splice(idx, 1)[0];
      if (!c) continue;
      world.setBlock(c.wx, baseY, c.wz, B.FARMLAND);

      // 部分农田上自动种植作物（stage 1 或 2，看起来像已在生长）
      if (rng() < 0.5) {
        const cropType = rng() < 0.4 ? 2 : 1;
        const stage = 1 + Math.floor(rng() * 2); // stage 1 或 2
        const cropBlock = stage === 1 ? B.CROP_S2 : B.CROP_S3;
        world.setBlock(c.wx, baseY + 1, c.wz, cropBlock);
        world.setCropState(c.wx, baseY + 1, c.wz, stage, Math.random() * 60, cropType);
      }
    }
  }
}

// 导出到全局
window.BuildingGenerator = BuildingGenerator;
