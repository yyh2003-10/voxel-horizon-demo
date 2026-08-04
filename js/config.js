const CFG = {
  VERSION: '1.0',
  CHUNK: 16,
  WORLD_H: 64,
  SEA: 29,
  DAY_LEN: 780,
  GRAVITY: 24,
  REACH: 6,
  SAVE_KEY: 'voxelhorizon_save_v1',
  SET_KEY: 'voxelhorizon_settings_v1'
};

const B = {
  AIR: 0, GRASS: 1, DIRT: 2, STONE: 3, SAND: 4, LOG: 5, LEAVES: 6, PLANKS: 7,
  GLASS: 8, ALLOY: 9, LAMP: 10, WATER: 11, TUFT: 12, PLANT: 13, NA_PLANT: 14,
  H_CRYS: 15, O_PLANT: 16, FERRITE: 17, COPPER: 18, BEDROCK: 19, FRAME: 20,
  STAIRS: 21, WINDOW: 22, CHEST: 23, BED: 24,
  DOOR: 25, CROP_S1: 26, CROP_S2: 27, CROP_S3: 28, FARMLAND: 29
};

const T = {
  GRASS_TOP: 0, GRASS_SIDE: 1, DIRT: 2, STONE: 3, SAND: 4, LOG: 5, LOG_TOP: 6,
  LEAVES: 7, PLANKS: 8, GLASS: 9, ALLOY: 10, LAMP: 11, WATER: 12, TUFT: 13,
  PLANT: 14, NA: 15, H: 16, O2: 17, FERRITE: 18, COPPER: 19, BEDROCK: 20,
  CRACK0: 21, CRACK1: 22, CRACK2: 23, FRAME: 24, STAIRS: 25, WINDOW: 26,
  CHEST: 27, BED: 28,
  DOOR: 29, CROP_S1: 30, CROP_S2: 31, CROP_S3: 32, FARMLAND: 33
};

const BLOCK_DEF = [];
BLOCK_DEF[B.AIR] = { name: '空气', solid: false };
BLOCK_DEF[B.GRASS] = { name: '苔原', solid: true, tiles: { top: T.GRASS_TOP, side: T.GRASS_SIDE, bottom: T.DIRT }, hard: 0.4, snd: 'grass', drops: [{ id: 'b_dirt', n: [1, 1] }] };
BLOCK_DEF[B.DIRT] = { name: '泥土', solid: true, tiles: { all: T.DIRT }, hard: 0.4, snd: 'grass', drops: [{ id: 'b_dirt', n: [1, 1] }] };
BLOCK_DEF[B.STONE] = { name: '岩石', solid: true, tiles: { all: T.STONE }, hard: 0.95, snd: 'stone', drops: [{ id: 'b_stone', n: [1, 1] }, { id: 'ferrite', n: [1, 2], p: 0.75 }] };
BLOCK_DEF[B.SAND] = { name: '硅沙', solid: true, tiles: { all: T.SAND }, hard: 0.38, snd: 'sand', drops: [{ id: 'b_sand', n: [1, 1] }] };
BLOCK_DEF[B.LOG] = { name: '异星原木', solid: true, tiles: { top: T.LOG_TOP, side: T.LOG, bottom: T.LOG_TOP }, hard: 0.65, snd: 'wood', drops: [{ id: 'b_log', n: [1, 1] }, { id: 'carbon', n: [1, 2] }] };
BLOCK_DEF[B.LEAVES] = { name: '叶簇', solid: true, cutout: true, tiles: { all: T.LEAVES }, hard: 0.2, snd: 'grass', drops: [{ id: 'carbon', n: [1, 2], p: 0.8 }] };
BLOCK_DEF[B.PLANKS] = { name: '复合板材', solid: true, tiles: { all: T.PLANKS }, hard: 0.55, snd: 'wood', drops: [{ id: 'b_planks', n: [1, 1] }] };
BLOCK_DEF[B.GLASS] = { name: '晶化玻璃', solid: true, glass: true, tiles: { all: T.GLASS }, hard: 0.3, snd: 'glass', drops: [{ id: 'b_glass', n: [1, 1] }] };
BLOCK_DEF[B.ALLOY] = { name: '合金嵌板', solid: true, tiles: { all: T.ALLOY }, hard: 0.8, snd: 'metal', drops: [{ id: 'b_alloy', n: [1, 1] }] };
BLOCK_DEF[B.LAMP] = { name: '光源灯柱', solid: true, emissive: true, tiles: { all: T.LAMP }, hard: 0.4, snd: 'metal', drops: [{ id: 'b_lamp', n: [1, 1] }] };
BLOCK_DEF[B.WATER] = { name: '液态水', solid: false, water: true, tiles: { all: T.WATER } };
BLOCK_DEF[B.TUFT] = { name: '荧纹草', solid: false, cross: true, tiles: { all: T.TUFT }, hard: 0.12, snd: 'grass', drops: [{ id: 'carbon', n: [1, 1], p: 0.6 }], flora: true };
BLOCK_DEF[B.PLANT] = { name: '碳基孢林', solid: false, cross: true, tiles: { all: T.PLANT }, hard: 0.15, snd: 'grass', drops: [{ id: 'carbon', n: [2, 3] }], flora: true };
BLOCK_DEF[B.NA_PLANT] = { name: '钠光花', solid: false, cross: true, tiles: { all: T.NA }, hard: 0.15, snd: 'crystal', drops: [{ id: 'sodium', n: [2, 3] }], flora: true, scan: 'na' };
BLOCK_DEF[B.H_CRYS] = { name: '双氢晶簇', solid: false, cross: true, tiles: { all: T.H }, hard: 0.5, snd: 'crystal', drops: [{ id: 'dihydrogen', n: [3, 4] }], flora: true, scan: 'h2' };
BLOCK_DEF[B.O_PLANT] = { name: '呼吸红花', solid: false, cross: true, tiles: { all: T.O2 }, hard: 0.15, snd: 'crystal', drops: [{ id: 'oxygen', n: [2, 3] }], flora: true, scan: 'o2' };
BLOCK_DEF[B.FERRITE] = { name: '铁屑岩', solid: true, tiles: { all: T.FERRITE }, hard: 0.8, snd: 'stone', drops: [{ id: 'ferrite', n: [3, 5] }], scan: 'fe' };
BLOCK_DEF[B.COPPER] = { name: '铜矿脉', solid: true, tiles: { all: T.COPPER }, hard: 1.25, snd: 'stone', drops: [{ id: 'copper', n: [2, 4] }], scan: 'cu' };
BLOCK_DEF[B.BEDROCK] = { name: '星核岩', solid: true, tiles: { all: T.BEDROCK }, hard: Infinity, snd: 'stone', drops: [] };
BLOCK_DEF[B.FRAME] = { name: '合金骨架', solid: true, tiles: { all: T.FRAME }, hard: 0.85, snd: 'metal', drops: [{ id: 'b_frame', n: [1, 1] }] };
BLOCK_DEF[B.STAIRS] = { name: '阶梯块', solid: true, tiles: { all: T.STAIRS }, hard: 0.7, snd: 'stone', drops: [{ id: 'b_stairs', n: [1, 1] }] };
BLOCK_DEF[B.WINDOW] = { name: '观察窗格', solid: true, glass: true, tiles: { all: T.WINDOW }, hard: 0.35, snd: 'glass', drops: [{ id: 'b_window', n: [1, 1] }] };
BLOCK_DEF[B.CHEST] = { name: '宝箱', solid: true, tiles: { all: T.CHEST }, hard: 2.0, snd: 'wood', drops: [] };
BLOCK_DEF[B.BED] = { name: '床', solid: true, tiles: { all: T.BED }, hard: 1.0, snd: 'wood', drops: [{ id: 'item_bed', n: [1, 1] }] };
BLOCK_DEF[B.DOOR] = { name: '门', solid: true, tiles: { all: T.DOOR }, hard: 0.8, snd: 'wood', drops: [{ id: 'item_door', n: [1, 1] }], door: true };
BLOCK_DEF[B.CROP_S1] = { name: '作物·种子', solid: false, cross: true, tiles: { all: T.CROP_S1 }, hard: 0.1, snd: 'grass', drops: [], flora: true, crop: true, cropStage: 0 };
BLOCK_DEF[B.CROP_S2] = { name: '作物·幼苗', solid: false, cross: true, tiles: { all: T.CROP_S2 }, hard: 0.1, snd: 'grass', drops: [], flora: true, crop: true, cropStage: 1 };
BLOCK_DEF[B.CROP_S3] = { name: '作物·成熟', solid: false, cross: true, tiles: { all: T.CROP_S3 }, hard: 0.1, snd: 'grass', drops: [], flora: true, crop: true, cropStage: 2 };
BLOCK_DEF[B.FARMLAND] = { name: '农田', solid: true, tiles: { all: T.FARMLAND }, hard: 0.5, snd: 'grass', drops: [{ id: 'b_farmland', n: [1, 1] }] };

const ITEMS = {
  carbon: { name: '碳', type: '元素 · 生命燃料', sym: 'C', col: '#e05252', stack: 250, desc: '构成异星植物的基础元素，几乎所有科技合成都离不开它。' },
  ferrite: { name: '铁尘', type: '元素 · 金属', sym: 'Fe', col: '#c9b8a6', stack: 250, desc: '从岩石中提取的金属粉尘，是修复与建造的骨架材料。' },
  sodium: { name: '钠', type: '元素 · 催化剂', sym: 'Na', col: '#ffd166', stack: 250, desc: '在黄色荧光植物中富集，可为危险防护模块充能。' },
  dihydrogen: { name: '双氢', type: '元素 · 推进剂', sym: 'H', col: '#7ab8ff', stack: 250, desc: '蓝色晶簇中的高能气体，是启动燃料的核心原料。' },
  oxygen: { name: '氧', type: '元素 · 生命维持', sym: 'O2', col: '#ff8a7a', stack: 250, desc: '从红色呼吸花中采集，为生命维持系统补充能量。' },
  copper: { name: '铜', type: '元素 · 导体', sym: 'Cu', col: '#7de8c3', stack: 250, desc: '地下矿脉中的导电金属，跃迁科技的必需品。' },
  biomass: { name: '生物质', type: '素材 · 有机', sym: 'β', col: '#b7e07a', stack: 99, desc: '生物体的有机残留，可用于合成修复凝胶。' },
  b_dirt: { name: '泥土块', type: '建材 · 方块', place: B.DIRT, stack: 64, desc: '最朴素的建材，但足以在夜晚来临前搭起一面墙。' },
  b_stone: { name: '岩石块', type: '建材 · 方块', place: B.STONE, stack: 64, desc: '坚固的岩石，庇护所的可靠选择。' },
  b_sand: { name: '硅沙块', type: '建材 · 方块', place: B.SAND, stack: 64, desc: '细腻的硅沙，也是玻璃的原料。' },
  b_log: { name: '异星原木', type: '建材 · 方块', place: B.LOG, stack: 64, desc: '异星树木的躯干，散发着淡淡的荧光。' },
  b_planks: { name: '复合板材', type: '建材 · 方块', place: B.PLANKS, stack: 64, desc: '原木加工的板材，温暖而结实。' },
  b_glass: { name: '晶化玻璃', type: '建材 · 方块', place: B.GLASS, stack: 64, desc: '透明晶体嵌板，仰望星空的最佳选择。' },
  b_alloy: { name: '合金嵌板', type: '建材 · 方块', place: B.ALLOY, stack: 64, desc: '星际标准建材，白色涂层带有科考编号。' },
  b_frame: { name: '合金骨架', type: '建材 · 方块', place: B.FRAME, stack: 64, desc: '结构骨架框架，为庇护所与瞭望塔提供支撑。' },
  b_lamp: { name: '光源灯柱', type: '建材 · 光源', place: B.LAMP, stack: 64, desc: '恒久发光的灯柱，驱散寒夜。' },
  b_stairs: { name: '阶梯块', type: '建材 · 方块', place: B.STAIRS, stack: 64, desc: '拾级而上的台阶，让庇护所与瞭望塔不再需要跳跃。' },
  b_window: { name: '观察窗格', type: '建材 · 方块', place: B.WINDOW, stack: 64, desc: '带金属框架的透明窗格，挡风遮雨却不挡星光。' },
  metal_plate: { name: '金属镀层', type: '科技组件', glyph: 'plate', col: '#d8dee6', stack: 10, desc: '轧制成型的装甲板，修复起飞推进器的关键部件。' },
  nanotube: { name: '碳纳米管', type: '科技组件', glyph: 'tube', col: '#e05252', stack: 10, desc: '微观尺度编织的碳结构，脉冲引擎的血管。' },
  launch_fuel: { name: '启动燃料', type: '科技组件', glyph: 'fuel', col: '#9be564', stack: 5, desc: '高压双氢燃料罐，为星舰突破重力井提供推力。' },
  warp_cell: { name: '跃迁电池', type: '科技组件', glyph: 'warp', col: '#b98bff', stack: 5, desc: '蕴含扭曲时空的能量，每次超光速跃迁消耗一枚。' },
  ion_battery: { name: '离子电池', type: '补给品', glyph: 'batt', col: '#ffd166', stack: 20, use: 'hazard', useAmt: 50, desc: '右键使用：为危险防护充能 +50。' },
  o2_capsule: { name: '氧气胶囊', type: '补给品', glyph: 'o2c', col: '#ff8a7a', stack: 20, use: 'ls', useAmt: 50, desc: '右键使用：为生命维持充能 +50。' },
  medkit: { name: '修复凝胶', type: '补给品', glyph: 'med', col: '#7de8a0', stack: 20, use: 'hp', useAmt: 40, desc: '右键使用：恢复生命 +40。' },
  armor: { name: '防护装甲', type: '装备', glyph: 'armor', col: '#8a9aaa', stack: 1, armorDef: 0.25, desc: '穿戴后减少 25% 受到的伤害。' },
  armor_alloy: { name: '合金装甲', type: '装备', glyph: 'armor2', col: '#e8c84a', stack: 1, armorDef: 0.40, desc: '高级合金装甲，减少 40% 受到的伤害。' },
  item_bed: { name: '床', type: '家具', place: B.BED, stack: 1, glyph: 'bed', col: '#6ab4e8', desc: '放置后右键睡觉，在夜晚可快速度过黑夜。' },
  item_door: { name: '木门', type: '建材 · 家具', place: B.DOOR, stack: 16, glyph: 'door', col: '#8a6a40', desc: '可开关的木门，装在建筑入口处。' },
  b_farmland: { name: '农田', type: '建材 · 农业', place: B.FARMLAND, stack: 32, glyph: 'farmland', col: '#6a5a3d', desc: '耕作过的土地，种子必须种在农田上才能生长。' },
  seed_crop1: { name: '基础种子', type: '农业', place: B.CROP_S1, stack: 32, glyph: 'seed1', col: '#7ab84a', desc: '种植后生长为基础食材。白天生长，夜晚暂停。' },
  seed_crop2: { name: '高级种子', type: '农业', place: B.CROP_S2, stack: 32, glyph: 'seed2', col: '#e8a040', desc: '种植后生长为高级食材。白天生长，夜晚暂停。' },
  crop1_raw: { name: '基础食材', type: '食材', glyph: 'food1', col: '#7ab84a', stack: 20, desc: '从基础作物收获的食材，可合成料理。' },
  crop2_raw: { name: '高级食材', type: '食材', glyph: 'food2', col: '#e8a040', stack: 20, desc: '从高级作物收获的食材，可合成高级料理。' },
  food_basic: { name: '基础料理', type: '补给品', glyph: 'food_b', col: '#6ab84a', stack: 10, use: 'food', useAmt: 0, hpAmt: 15, lsAmt: 15, hazAmt: 0, desc: '右键食用：恢复生命 +15，生命维持 +15。' },
  food_advanced: { name: '高级料理', type: '补给品', glyph: 'food_a', col: '#e8c84a', stack: 10, use: 'food', useAmt: 0, hpAmt: 30, lsAmt: 25, hazAmt: 20, desc: '右键食用：恢复生命 +30，生命维持 +25，危险防护 +20。' }
};

const RECIPES = [
  { id: 'metal_plate', out: 1, cat: '科技', req: [['ferrite', 30]], desc: '推进器修复必备的装甲板。' },
  { id: 'nanotube', out: 1, cat: '科技', req: [['carbon', 40]], desc: '脉冲引擎修复所需的微观结构。' },
  { id: 'launch_fuel', out: 1, cat: '科技', req: [['dihydrogen', 40], ['metal_plate', 1]], desc: '起飞所需。为星舰燃料舱加注 100%。' },
  { id: 'warp_cell', out: 1, cat: '科技', req: [['copper', 60], ['nanotube', 1], ['dihydrogen', 20]], desc: '跨越星海的船票。铜矿藏于地下深处。' },
  { id: 'ion_battery', out: 1, cat: '补给', req: [['ferrite', 15], ['sodium', 10]], desc: '便携防护充能装置。' },
  { id: 'o2_capsule', out: 1, cat: '补给', req: [['oxygen', 25]], desc: '便携生命维持充能装置。' },
  { id: 'medkit', out: 1, cat: '补给', req: [['biomass', 15], ['oxygen', 10]], desc: '有机修复凝胶。' },
  { id: 'b_planks', out: 4, cat: '建材', req: [['b_log', 1]], desc: '原木 → 板材，庇护所的温度。' },
  { id: 'b_glass', out: 2, cat: '建材', req: [['b_sand', 3], ['carbon', 8]], desc: '硅沙熔炼成透明晶板。' },
  { id: 'b_alloy', out: 4, cat: '建材', req: [['ferrite', 35]], desc: '星际标准科考嵌板。' },
  { id: 'b_frame', out: 4, cat: '建材', req: [['ferrite', 20], ['carbon', 10]], desc: '合金骨架 —— 支撑更高更大的建筑。' },
  { id: 'b_lamp', out: 2, cat: '建材', req: [['carbon', 15], ['ferrite', 10], ['sodium', 5]], desc: '照亮寒夜的常亮光源。' },
  { id: 'b_stairs', out: 4, cat: '建材', req: [['b_stone', 2], ['ferrite', 5]], desc: '岩石切割的阶梯，拾级而上。' },
  { id: 'b_window', out: 2, cat: '建材', req: [['b_glass', 1], ['ferrite', 4]], desc: '金属框架 + 晶化玻璃 = 观星窗。' },
  { id: 'armor', out: 1, cat: '装备', req: [['ferrite', 50], ['carbon', 20]], desc: '基础防护装甲，减少 25% 受到的伤害。' },
  { id: 'armor_alloy', out: 1, cat: '装备', req: [['metal_plate', 3], ['nanotube', 2], ['ferrite', 30]], desc: '高级合金装甲，减少 40% 受到的伤害。' },
  { id: 'item_bed', out: 1, cat: '家具', req: [['b_log', 4], ['biomass', 3]], desc: '一张简易的床，可在夜晚快速休息。' },
  { id: 'item_door', out: 2, cat: '建材', req: [['b_planks', 4], ['b_log', 1]], desc: '木板加工的门，装在建筑入口处。' },
  { id: 'b_farmland', out: 4, cat: '农业', req: [['b_dirt', 2], ['biomass', 1]], desc: '耕作土地，种子必须种在农田上才能生长。' },
  { id: 'food_basic', out: 1, cat: '补给', req: [['crop1_raw', 3], ['crop2_raw', 1]], desc: '基础食材烹制的料理，恢复生命与维持。' },
  { id: 'food_advanced', out: 1, cat: '补给', req: [['crop2_raw', 3], ['crop1_raw', 1], ['carbon', 5]], desc: '高级食材烹制的料理，全面恢复。' },
  { id: 'seed_crop1', out: 2, cat: '农业', req: [['crop1_raw', 1], ['biomass', 2]], desc: '从食材中提取种子，继续种植。' },
  { id: 'seed_crop2', out: 2, cat: '农业', req: [['crop2_raw', 1], ['biomass', 3]], desc: '从高级食材中提取种子。' }
];

const PALETTES = [
  {
    id: 'lush', climate: '温和 · 微热', grass: '#5abf74', grassAlt: '#4fae8e', dirt: '#8a6a4d', sand: '#d8c9a0',
    leaves: ['#3da566', '#69c98a', '#3f9e8e'], wood: '#7a5a40',
    skyDayTop: '#3a8fd4', skyDayHor: '#bfe4ee', skyNightTop: '#060a18', skyNightHor: '#1c2c48',
    fogDay: '#c4e2e8', fogNight: '#0c1526', sun: '#fff2d0',
    water: '#2e7fa8', sea: true,
    hazard: { type: 'heat', label: '灼热', day: 0.05, night: 0.22, nightType: 'cold', nightLabel: '严寒' },
    storm: { chance: 0.35, label: '热浪风暴' },
    trees: { density: 0.014, types: ['blob', 'tall'] }, tuft: 0.09, plant: 0.02, na: 0.010, o2: 0.010, h2: 0.011, rock: 0.014,
    creatures: ['#8a6f5a', '#5f8a72', '#a08a50', '#6a5a8a', '#c07a54', '#486f5a'], fauna: 6, floraLevel: '丰饶', stormLevel: '偶发'
  },
  {
    id: 'scorched', climate: '灼热 · 干旱', grass: '#c08a4a', grassAlt: '#b07040', dirt: '#8f5f3a', sand: '#e0b076',
    leaves: ['#c07a3a', '#d09a50'], wood: '#6f4a34',
    skyDayTop: '#c96a3f', skyDayHor: '#f2c58a', skyNightTop: '#0a0610', skyNightHor: '#301a20',
    fogDay: '#e8bc8e', fogNight: '#180e14', sun: '#ffd9a0',
    water: null, sea: false,
    hazard: { type: 'heat', label: '极端高温', day: 0.30, night: 0.10, nightType: 'heat', nightLabel: '余热' },
    storm: { chance: 0.75, label: '烈焰风暴' },
    trees: { density: 0.004, types: ['spire'] }, tuft: 0.03, plant: 0.012, na: 0.012, o2: 0.008, h2: 0.016, rock: 0.02,
    creatures: ['#b0764a', '#8f5a3a', '#caa060', '#c0a070', '#6f3030', '#d87a48'], fauna: 5, floraLevel: '稀疏', stormLevel: '频繁'
  },
  {
    id: 'frozen', climate: '严寒 · 冰封', grass: '#cfe2ec', grassAlt: '#b8d4e2', dirt: '#7a8a96', sand: '#c2cdd6',
    leaves: ['#9fd3e8', '#c8ecf4', '#8fb8d8'], wood: '#5f6a78',
    skyDayTop: '#7aa8cc', skyDayHor: '#e8f2f8', skyNightTop: '#04080f', skyNightHor: '#16283c',
    fogDay: '#dcecf4', fogNight: '#0b1420', sun: '#eef6ff',
    water: '#3a6f96', sea: true,
    hazard: { type: 'cold', label: '严寒', day: 0.22, night: 0.45, nightType: 'cold', nightLabel: '极寒' },
    storm: { chance: 0.6, label: '暴风雪' },
    trees: { density: 0.009, types: ['tall', 'blob'] }, tuft: 0.04, plant: 0.014, na: 0.010, o2: 0.010, h2: 0.014, rock: 0.016,
    creatures: ['#c8d8e0', '#8fa8b8', '#e8f0f4', '#a8c8d8', '#7898b0', '#d8e8f0'], fauna: 5, floraLevel: '稀疏', stormLevel: '常见'
  },
  {
    id: 'exotic', climate: '异常 · 辐射', grass: '#a86ad0', grassAlt: '#8f5cc0', dirt: '#5f4470', sand: '#c8a0d8',
    leaves: ['#ff7ad9', '#8f5cff', '#e08aff'], wood: '#4a3860',
    skyDayTop: '#5d3f9e', skyDayHor: '#e8a9f4', skyNightTop: '#0a0416', skyNightHor: '#2a1440',
    fogDay: '#caa6e8', fogNight: '#140a24', sun: '#ffd9f4',
    water: '#6a4a9e', sea: true,
    hazard: { type: 'rad', label: '辐射', day: 0.18, night: 0.32, nightType: 'rad', nightLabel: '强辐射' },
    storm: { chance: 0.5, label: '辐射风暴' },
    trees: { density: 0.013, types: ['shroom', 'blob'] }, tuft: 0.07, plant: 0.022, na: 0.010, o2: 0.010, h2: 0.012, rock: 0.014,
    creatures: ['#b06ad4', '#e08aa0', '#6a5ac0', '#d0a0f0', '#8a5aaa', '#c86ad0'], fauna: 7, floraLevel: '奇异', stormLevel: '常见'
  },
  {
    id: 'toxic', climate: '剧毒 · 孢雾', grass: '#7aa53d', grassAlt: '#5f8a3a', dirt: '#5a5f38', sand: '#a8a86a',
    leaves: ['#9ec84a', '#6aa848', '#c8d858'], wood: '#4f5a30',
    skyDayTop: '#6f8f4f', skyDayHor: '#cfe08a', skyNightTop: '#060a06', skyNightHor: '#1a2814',
    fogDay: '#b9c98a', fogNight: '#0c140a', sun: '#f4f0c0',
    water: '#4a7d5e', sea: true,
    hazard: { type: 'toxic', label: '剧毒', day: 0.24, night: 0.36, nightType: 'toxic', nightLabel: '毒雾' },
    storm: { chance: 0.65, label: '毒雨风暴' },
    trees: { density: 0.016, types: ['shroom', 'tall'] }, tuft: 0.08, plant: 0.026, na: 0.012, o2: 0.012, h2: 0.010, rock: 0.014,
    creatures: ['#8aa848', '#6a7a3a', '#b8c858', '#98b858', '#5f8f3a', '#c8d868'], fauna: 6, floraLevel: '疯长', stormLevel: '频繁'
  },
  {
    id: 'barren', climate: '荒芜 · 尘暴', grass: '#b8a06a', grassAlt: '#a89058', dirt: '#8a7248', sand: '#d0b884',
    leaves: ['#a8905a', '#c0a868'], wood: '#6a5a40',
    skyDayTop: '#c2925f', skyDayHor: '#eed2a8', skyNightTop: '#080608', skyNightHor: '#241a18',
    fogDay: '#e0c8a0', fogNight: '#120e0c', sun: '#ffe8c0',
    water: null, sea: false,
    hazard: { type: 'rad', label: '弱辐射', day: 0.12, night: 0.25, nightType: 'cold', nightLabel: '寒夜' },
    storm: { chance: 0.55, label: '尘暴' },
    trees: { density: 0.003, types: ['spire'] }, tuft: 0.03, plant: 0.008, na: 0.010, o2: 0.008, h2: 0.012, rock: 0.024,
    creatures: ['#a89068', '#8a7a58', '#c8b088', '#b09878', '#7a6a4a'], fauna: 4, floraLevel: '贫瘠', stormLevel: '常见'
  }
];

const HAZ_ICONS = { heat: '☀', cold: '❄', toxic: '☣', rad: '☢' };

const MILESTONE_DEFS = [
  { key: 'walk', name: '行星漫步者', unit: 'm', tiers: [500, 2000, 8000], subs: ['迈出第一步', '越过山丘', '足迹遍布大陆'] },
  { key: 'mined', name: '元素收割者', unit: '格', tiers: [50, 300, 1200], subs: ['初次开采', '熟练的矿工', '大地为之震动'] },
  { key: 'scans', name: '万物档案员', unit: '项', tiers: [3, 10, 25], subs: ['第一份记录', '目录渐丰', '行星百科全书'] },
  { key: 'placed', name: '拓荒建筑师', unit: '块', tiers: [15, 80, 300], subs: ['第一面墙', '像样的居所', '殖民地奠基人'] },
  { key: 'warps', name: '星海跃迁者', unit: '次', tiers: [1, 3, 8], subs: ['首次跃迁', '航线开拓者', '银河浪人'] },
  { key: 'crafted', name: '合成工程师', unit: '次', tiers: [5, 20, 60], subs: ['第一次合成', '工艺纯熟', '造物大师'] },
  { key: 'survive', name: '不灭远行者', unit: '秒', tiers: [600, 1800, 5400], subs: ['活过十分钟', '半小时的坚守', '与星球共存'] }
];

const DEFAULT_SETTINGS = { master: 80, music: 60, sfx: 90, sens: 100, fov: 78, dist: 4, invert: false, quality: 'auto' };

// 画质预设：控制光源、粒子、着色器动画、像素比等
const QUALITY_PRESETS = {
  high: {
    maxLights: 6,
    maxParticles: 600,
    enableSway: true,
    dpr: 1.75,
    fogNear: 0.45,
    fogFar: 1.05,
    starDensity: 1.0
  },
  medium: {
    maxLights: 4,
    maxParticles: 400,
    enableSway: true,
    dpr: 1.25,
    fogNear: 0.40,
    fogFar: 0.95,
    starDensity: 0.8
  },
  low: {
    maxLights: 3,
    maxParticles: 250,
    enableSway: false,
    dpr: 1.0,
    fogNear: 0.35,
    fogFar: 0.85,
    starDensity: 0.6
  }
};
