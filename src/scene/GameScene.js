/**
 * 游戏场景类
 *
 * 负责渲染游戏背景、地面和视差效果
 * 按分数区间切换四套主题，并管理大小轮进度
 */
export class GameScene {
  static SCORE_STEP = 500;
  static SCORE_TOLERANCE = 50;
  static TRANSITION_MS = 1500;

  static THEMES = [
    {
      id: 1,
      name: '清晨草地',
      skyTop: '#87CEEB',
      skyMid: '#B8E6B8',
      skyBottom: '#D4EFDF',
      mountain1: '#6B8E6B',
      mountain2: '#7A9E7A',
      groundBase: '#5a4a3a',
      grassMain: '#4a7c4a',
      grassLight: '#5a8c5a',
      grassDark: '#3a6c3a',
      dirtMain: '#8B4513',
      dirtDark: '#654321',
      starAlpha: 0.15,
      cloudColor: 'rgba(255, 255, 255, 0.65)'
    },
    {
      id: 2,
      name: '浅蓝天空',
      skyTop: '#29B6F6',
      skyMid: '#81D4FA',
      skyBottom: '#E1F5FE',
      mountain1: '#5a8aaa',
      mountain2: '#6a9aba',
      groundBase: '#4a5a6a',
      grassMain: '#3a8c7a',
      grassLight: '#4a9c8a',
      grassDark: '#2a7c6a',
      dirtMain: '#7a6a5a',
      dirtDark: '#5a4a3a',
      starAlpha: 0.1,
      cloudColor: 'rgba(255, 255, 255, 0.75)'
    },
    {
      id: 3,
      name: '黄昏',
      skyTop: '#FF6B35',
      skyMid: '#CC6677',
      skyBottom: '#553366',
      mountain1: '#4a3a5a',
      mountain2: '#6a4a5a',
      groundBase: '#4a3a3a',
      grassMain: '#6a7c4a',
      grassLight: '#7a8c5a',
      grassDark: '#5a6c3a',
      dirtMain: '#8B5A3C',
      dirtDark: '#6B4423',
      starAlpha: 0.35,
      cloudColor: 'rgba(255, 200, 180, 0.55)'
    },
    {
      id: 4,
      name: '赛博像素',
      skyTop: '#0f0c29',
      skyMid: '#302b63',
      skyBottom: '#24243e',
      mountain1: '#e94560',
      mountain2: '#0f3460',
      groundBase: '#1a1a2e',
      grassMain: '#533483',
      grassLight: '#6a44a0',
      grassDark: '#3a2560',
      dirtMain: '#2d1b4e',
      dirtDark: '#1a0f30',
      starAlpha: 1,
      cloudColor: 'rgba(233, 69, 96, 0.35)'
    }
  ];

  constructor(gameWidth, gameHeight) {
    this.width = gameWidth;
    this.height = gameHeight;

    this.layers = {
      background: [],
      midground: [],
      foreground: []
    };

    this.parallaxOffset = 0;
    this.groundY = this.height - 64;
    this.groundSpeed = 0.5;

    this.stars = [];
    this.clouds = [];
    this.groundBlocks = [];

    this.bigRound = 1;
    this.smallRound = 1;
    this.lastTriggeredMilestone = 0;

    this.currentThemeId = 1;
    this.fromTheme = GameScene.THEMES[0];
    this.toTheme = GameScene.THEMES[0];
    this.displayTheme = { ...GameScene.THEMES[0] };
    this.transitionProgress = 1;
    this.transitionStartTime = 0;

    this.onRoundChange = null;

    this.initBackground();
    this.initGround();
    this.applyDisplayTheme(GameScene.THEMES[0]);
  }

  initBackground() {
    this.stars = [];
    this.clouds = [];

    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * (this.groundY - 100),
        size: Math.random() * 2 + 1,
        brightness: Math.random()
      });
    }

    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * this.width,
        y: Math.random() * 100 + 20,
        width: Math.random() * 80 + 60,
        height: Math.random() * 20 + 15,
        speed: Math.random() * 0.3 + 0.1
      });
    }
  }

  initGround() {
    const blockWidth = 32;
    const blocksCount = Math.ceil(this.width / blockWidth) + 2;
    this.groundBlocks = [];

    for (let i = 0; i < blocksCount; i++) {
      this.groundBlocks.push({
        x: i * blockWidth,
        type: Math.random() > 0.9 ? 'grass' : 'dirt'
      });
    }
  }

  /**
   * 根据 milestone 计算大小轮与主题
   */
  getRoundStateFromMilestone(milestone) {
    const smallRound = milestone % 4 === 0 ? 1 : milestone % 4 + 1;
    const bigRound = 1 + Math.floor(milestone / 4);
    const themeId = smallRound;
    return { bigRound, smallRound, themeId };
  }

  applyMilestone(milestone) {
    const { bigRound, smallRound, themeId } = this.getRoundStateFromMilestone(milestone);

    this.bigRound = bigRound;
    this.smallRound = smallRound;
    this.lastTriggeredMilestone = milestone;
    this.startThemeTransition(themeId);

    if (typeof this.onRoundChange === 'function') {
      this.onRoundChange(bigRound, smallRound);
    }
  }

  checkScoreMilestones(score) {
    let nextMilestone = this.lastTriggeredMilestone + 1;

    while (true) {
      const bandLow = GameScene.SCORE_STEP * nextMilestone - GameScene.SCORE_TOLERANCE;
      const bandHigh = GameScene.SCORE_STEP * nextMilestone + GameScene.SCORE_TOLERANCE;
      const inBand = score >= bandLow && score <= bandHigh;
      const skippedPast = score > bandHigh;

      if (inBand || skippedPast) {
        this.applyMilestone(nextMilestone);
        nextMilestone++;
      } else {
        break;
      }
    }
  }

  startThemeTransition(themeId) {
    if (themeId === this.currentThemeId && this.transitionProgress >= 1) {
      return;
    }

    this.fromTheme = GameScene.THEMES[this.currentThemeId - 1];
    this.toTheme = GameScene.THEMES[themeId - 1];
    this.currentThemeId = themeId;
    this.transitionProgress = 0;
    this.transitionStartTime = Date.now();
  }

  updateThemeTransition() {
    if (this.transitionProgress >= 1) {
      this.applyDisplayTheme(this.toTheme);
      return;
    }

    const elapsed = Date.now() - this.transitionStartTime;
    this.transitionProgress = Math.min(elapsed / GameScene.TRANSITION_MS, 1);
    const t = this.transitionProgress;

    this.displayTheme = {
      id: this.toTheme.id,
      name: this.toTheme.name,
      skyTop: this.lerpColor(this.fromTheme.skyTop, this.toTheme.skyTop, t),
      skyMid: this.lerpColor(this.fromTheme.skyMid, this.toTheme.skyMid, t),
      skyBottom: this.lerpColor(this.fromTheme.skyBottom, this.toTheme.skyBottom, t),
      mountain1: this.lerpColor(this.fromTheme.mountain1, this.toTheme.mountain1, t),
      mountain2: this.lerpColor(this.fromTheme.mountain2, this.toTheme.mountain2, t),
      groundBase: this.lerpColor(this.fromTheme.groundBase, this.toTheme.groundBase, t),
      grassMain: this.lerpColor(this.fromTheme.grassMain, this.toTheme.grassMain, t),
      grassLight: this.lerpColor(this.fromTheme.grassLight, this.toTheme.grassLight, t),
      grassDark: this.lerpColor(this.fromTheme.grassDark, this.toTheme.grassDark, t),
      dirtMain: this.lerpColor(this.fromTheme.dirtMain, this.toTheme.dirtMain, t),
      dirtDark: this.lerpColor(this.fromTheme.dirtDark, this.toTheme.dirtDark, t),
      starAlpha: this.fromTheme.starAlpha + (this.toTheme.starAlpha - this.fromTheme.starAlpha) * t,
      cloudColor: this.lerpRgba(this.fromTheme.cloudColor, this.toTheme.cloudColor, t)
    };
  }

  applyDisplayTheme(theme) {
    this.displayTheme = { ...theme };
    this.fromTheme = theme;
    this.toTheme = theme;
    this.transitionProgress = 1;
  }

  lerpColor(from, to, t) {
    const f = this.parseHex(from);
    const target = this.parseHex(to);
    const r = Math.round(f.r + (target.r - f.r) * t);
    const g = Math.round(f.g + (target.g - f.g) * t);
    const b = Math.round(f.b + (target.b - f.b) * t);
    return `#${this.toHex(r)}${this.toHex(g)}${this.toHex(b)}`;
  }

  parseHex(hex) {
    const value = hex.replace('#', '');
    return {
      r: parseInt(value.slice(0, 2), 16),
      g: parseInt(value.slice(2, 4), 16),
      b: parseInt(value.slice(4, 6), 16)
    };
  }

  toHex(n) {
    return n.toString(16).padStart(2, '0');
  }

  lerpRgba(from, to, t) {
    const parse = (rgba) => {
      const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
      if (!match) return { r: 255, g: 255, b: 255, a: 1 };
      return {
        r: Number(match[1]),
        g: Number(match[2]),
        b: Number(match[3]),
        a: match[4] !== undefined ? Number(match[4]) : 1
      };
    };

    const f = parse(from);
    const target = parse(to);
    const r = Math.round(f.r + (target.r - f.r) * t);
    const g = Math.round(f.g + (target.g - f.g) * t);
    const b = Math.round(f.b + (target.b - f.b) * t);
    const a = f.a + (target.a - f.a) * t;
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`;
  }

  update(speed, score = 0) {
    this.parallaxOffset += speed * 0.3;

    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed * speed;
      if (cloud.x + cloud.width < 0) {
        cloud.x = this.width + Math.random() * 100;
        cloud.y = Math.random() * 100 + 20;
      }
    });

    this.groundBlocks.forEach(block => {
      block.x -= this.groundSpeed;
      if (block.x + 32 < 0) {
        block.x = this.width;
        block.type = Math.random() > 0.9 ? 'grass' : 'dirt';
      }
    });

    this.checkScoreMilestones(score);
    this.updateThemeTransition();
  }

  render(ctx) {
    this.renderBackground(ctx);
    this.renderMidground(ctx);
    this.renderForeground(ctx);
  }

  renderBackground(ctx) {
    const theme = this.displayTheme;
    const gradient = ctx.createLinearGradient(0, 0, 0, this.groundY);
    gradient.addColorStop(0, theme.skyTop);
    gradient.addColorStop(0.5, theme.skyMid);
    gradient.addColorStop(1, theme.skyBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.groundY);

    this.stars.forEach(star => {
      const twinkle = Math.sin(Date.now() / 500 + star.x) * 0.5 + 0.5;
      const alpha = star.brightness * twinkle * theme.starAlpha;
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fillRect(star.x, star.y, star.size, star.size);
    });
  }

  renderMidground(ctx) {
    const theme = this.displayTheme;

    this.clouds.forEach(cloud => {
      const offsetX = cloud.x - this.parallaxOffset * 0.2;
      ctx.fillStyle = theme.cloudColor;
      ctx.beginPath();
      ctx.arc(offsetX + cloud.width * 0.2, cloud.y + cloud.height * 0.5, cloud.height * 0.5, 0, Math.PI * 2);
      ctx.arc(offsetX + cloud.width * 0.5, cloud.y + cloud.height * 0.3, cloud.height * 0.6, 0, Math.PI * 2);
      ctx.arc(offsetX + cloud.width * 0.8, cloud.y + cloud.height * 0.5, cloud.height * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });

    const mountainX = (this.width * 0.3 - this.parallaxOffset * 0.1) % (this.width * 1.5) - this.width * 0.25;
    this.renderMountain(ctx, mountainX, this.groundY - 150, 200, theme.mountain1);

    const mountainX2 = (this.width * 1.2 - this.parallaxOffset * 0.08) % (this.width * 1.5) - this.width * 0.25;
    this.renderMountain(ctx, mountainX2, this.groundY - 100, 150, theme.mountain2);
  }

  renderMountain(ctx, x, y, width, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + 100);
    ctx.lineTo(x + width * 0.5, y - 80);
    ctx.lineTo(x + width, y + 100);
    ctx.closePath();
    ctx.fill();
  }

  renderForeground(ctx) {
    const theme = this.displayTheme;

    ctx.fillStyle = theme.groundBase;
    ctx.fillRect(0, this.groundY + 32, this.width, 32);

    this.groundBlocks.forEach(block => {
      if (block.type === 'grass') {
        this.renderGrassBlock(ctx, block.x, theme);
      } else {
        this.renderDirtBlock(ctx, block.x, theme);
      }
    });
  }

  renderGrassBlock(ctx, x, theme) {
    ctx.fillStyle = theme.grassMain;
    ctx.fillRect(x, this.groundY, 32, 32);

    ctx.fillStyle = theme.grassLight;
    ctx.fillRect(x + 4, this.groundY, 24, 4);

    ctx.fillStyle = theme.grassDark;
    ctx.fillRect(x + 8, this.groundY - 4, 4, 4);
    ctx.fillRect(x + 20, this.groundY - 6, 4, 6);
    ctx.fillRect(x + 14, this.groundY - 3, 4, 3);
  }

  renderDirtBlock(ctx, x, theme) {
    ctx.fillStyle = theme.dirtMain;
    ctx.fillRect(x, this.groundY, 32, 32);

    ctx.fillStyle = theme.dirtDark;
    ctx.fillRect(x + 4, this.groundY + 4, 4, 4);
    ctx.fillRect(x + 24, this.groundY + 24, 4, 4);
    ctx.fillRect(x + 12, this.groundY + 16, 8, 4);
  }

  getRoundDisplay() {
    return {
      bigRound: this.bigRound,
      smallRound: this.smallRound
    };
  }

  getGroundY() {
    return this.groundY;
  }

  reset() {
    this.parallaxOffset = 0;
    this.bigRound = 1;
    this.smallRound = 1;
    this.lastTriggeredMilestone = 0;
    this.currentThemeId = 1;
    this.applyDisplayTheme(GameScene.THEMES[0]);
    this.initBackground();
    this.initGround();
  }
}
