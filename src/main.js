/**
 * 像素跑酷游戏主入口类
 * 
 * 负责整合所有游戏模块，协调各组件之间的通信
 * 处理用户输入、游戏循环和渲染流程
 */
import { GameEngine, RenderLayer } from './engine/GameEngine.js';
import { Player } from './player/Player.js';
import { SkinManager } from './player/SkinManager.js';
import { SpeedControl } from './speed/SpeedControl.js';
import { ObstacleManager } from './obstacle/ObstacleManager.js';
import { ItemManager } from './obstacle/ItemManager.js';
import { GameScene } from './scene/GameScene.js';
import { GameState } from './state/GameState.js';
import { GameUI } from './ui/GameUI.js';
import { LeaderboardUI } from './ui/LeaderboardUI.js';
import { WeatherManager } from './weather/WeatherManager.js';
import { AudioManager } from './audio/AudioManager.js';

export class PixelRunnerGame {
  /**
   * 构造函�?- 初始化游戏实�?
   * @param {string} canvasId - 画布元素的ID
   */
  constructor(canvasId) {
    this.engine = new GameEngine(canvasId);
    this.canvas = this.engine.canvas;
    
    this.gameState = new GameState();
    this.audioManager = new AudioManager();
    this.speedControl = new SpeedControl();
    this.scene = new GameScene(this.engine.width, this.engine.height);
    this.obstacleManager = new ObstacleManager(this.engine.width, this.engine.height);
    this.itemManager = new ItemManager(this.engine.width, this.engine.height);
    this.ui = new GameUI(this.canvas, this.audioManager);
    this.leaderboardUI = new LeaderboardUI(this.canvas, this.gameState.leaderboardManager);
    this.weatherManager = new WeatherManager(this.engine.width, this.engine.height);
    this.skinManager = new SkinManager(this.gameState.getHighScore());
    this.previewPlayer = new Player(0, 0, this.audioManager);
    
    this.player = null;
    this.gameStartTime = 0;
    
    this.keys = {};
    
    this.coffeeBuffs = [];
    this.COFFEE_MULTIPLIER_STEP = 2;
    
    this.init();
  }

  isDevHost() {
    const hostname = window.location?.hostname ?? '';
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '';
  }

  /**
   * 开发环境调试：增加分数（用于测试背景切换）
   * @param {number} points
   */
  addDebugScore(points) {
    if (!this.isDevHost() || !this.gameState.isPlaying()) return;

    this.gameState.addScore(points);
    const score = this.gameState.getScore();
    this.scene.checkScoreMilestones(score);
    this.ui.setRoundDisplay(
      this.scene.getRoundDisplay().bigRound,
      this.scene.getRoundDisplay().smallRound
    );
    console.log(`[Debug] +${points} 分，当前 ${score}，轮次 ${this.scene.getRoundDisplay().bigRound}/${this.scene.getRoundDisplay().smallRound}`);
  }

  /**
   * 开发环境调试：设置最高分（用于测试皮肤解锁）
   */
  setDebugHighScore(score) {
    if (!this.isDevHost()) return;

    this.gameState.highScore = score;
    localStorage.setItem('pixelRunner_highScore', String(score));
    this.skinManager.setHighScore(score);
    this.ui.setHighScore(score);
    console.log(`[Debug] 最高分设为 ${score}，已解锁 ${this.skinManager.getUnlockedSkins().length} 款皮肤`);
  }

  /**
   * 初始化游�?- 设置事件监听和回�?
   */
  async init() {
    this.setupEventListeners();
    this.setupCallbacks();
    await this.syncGameData();
    this.setupLeaderboardSync();
    this.leaderboardUI.init();
    this.ui.setSkinManager(this.skinManager, this.previewPlayer);
    this.ui.setHighScore(this.gameState.getHighScore());
    this.engine.start();
  }
  
  async syncGameData() {
    try {
      const serverLeaderboard = await this.gameState.leaderboardManager.fetchLeaderboard();
      console.log('[Game] 已从服务器同步排行榜数据');
      
      const localHighScore = this.gameState.highScore;
      const serverHighScore = serverLeaderboard.length > 0 ? serverLeaderboard[0].score : 0;

      // 不自动覆盖本地最高分（localStorage 保存的是个人记录），
      // 只记录服务器最高分用于�?UI 中显示全局榜单�?
      // 如果需要在界面上显示服务器最高分，可使用 this.serverHighScore�?
      this.serverHighScore = serverHighScore;

      if (serverHighScore > 0 && serverHighScore !== localHighScore) {
        console.log('[Game] 服务器最高分:', serverHighScore, '本地最高分:', localHighScore);
      }
    } catch (error) {
      console.warn('[Game] 同步游戏数据失败:', error.message);
    }
  }
  
  setupLeaderboardSync() {
    this.gameState.leaderboardManager.onLeaderboardUpdate = (leaderboard) => {
      console.log('[Game] 排行榜数据已更新');
      this.leaderboardUI.loadLeaderboard();
      // 确保本地最高分�?UI 中同步（若用户已清空 localStorage，应显示 0�?
      if (typeof this.leaderboardUI.loadLocalHighScore === 'function') {
        this.leaderboardUI.loadLocalHighScore();
      }
    };
  }

  /**
   * 设置事件监听�?- 键盘和鼠标事�?
   */
  setupEventListeners() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    this.canvas.addEventListener('click', (e) => this.handleClick(e));
  }

  /**
   * 设置回调函数 - 建立模块间通信
   */
  setupCallbacks() {
    this.engine.onUpdate = (deltaTime) => this.update(deltaTime);
    this.engine.onRender = (ctx) => this.render(ctx);
    this.engine.onCollision = (a, b) => this.handleCollision(a, b);
    
    this.gameState.onStateChange = (newState, oldState) => this.onStateChange(newState, oldState);
    this.gameState.onScoreChange = (score) => this.ui.setScore(score);
    this.gameState.onGameOver = (data) => this.onGameOver(data);
    
    this.obstacleManager.onObstacleSpawn = (obstacle) => this.onObstacleSpawn(obstacle);
    this.obstacleManager.onObstacleRemove = (obstacle) => this.onObstacleRemove(obstacle);
    this.scene.onRoundChange = (bigRound, smallRound) => {
      this.ui.setRoundDisplay(bigRound, smallRound);
    };

    this.obstacleManager.onDifficultyChange = (difficulty) => this.ui.setDifficulty(difficulty);
    
    this.itemManager.onItemSpawn = (item) => this.onItemSpawn(item);
    this.itemManager.onItemCollect = (item) => this.onItemCollect(item);
    
    this.ui.onStart = () => this.startGame();
    this.ui.onRestart = () => this.restartGame();
    this.ui.onPause = () => this.togglePause();
    this.ui.onLeaderboardToggle = (show) => this.onLeaderboardToggle(show);
    
    this.leaderboardUI.onClose = () => {
      this.ui.showLeaderboard = false;
    };
    
    this.leaderboardUI.onNicknameSubmit = (nickname, score, rank) => {
      console.log(`[Leaderboard] ${nickname} 获得�?${rank} 名，分数: ${score}`);
      this.gameState.saveNickname(nickname);
      console.log('[GameState] 昵称已保�?', nickname);
    };
  }

  /**
   * 处理键盘按下事件
   * @param {KeyboardEvent} e - 键盘事件
   */
  handleKeyDown(e) {
    if (this.leaderboardUI.showNicknameInput) {
      if (this.leaderboardUI.handleKeyInput(e.key)) {
        e.preventDefault();
        return;
      }
    }
    
    this.keys[e.key] = true;
    
    if (!this.gameState.isPlaying()) {
      if (this.gameState.isPaused()) {
        if (e.key === 'p' || e.key === 'P') {
          this.togglePause();
        } else if (e.key === 'Escape') {
          this.restartGame();
        }
        return;
      }

      this.ui.handleKeyDown(e.key);
      return;
    }
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        this.player.moveLeft();
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        this.player.moveRight();
        break;
      case 'ArrowUp':
      case 'w':
      case 'W':
      case ' ':
        e.preventDefault();
        this.player.jump();
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.player.slide();
        break;
      case 'p':
      case 'P':
        this.togglePause();
        break;
      case ']':
        if (this.isDevHost()) {
          this.addDebugScore(500);
        }
        break;
    }
  }

  /**
   * 处理键盘释放事件
   * @param {KeyboardEvent} e - 键盘事件
   */
  handleKeyUp(e) {
    this.keys[e.key] = false;
    
    if (!this.gameState.isPlaying()) return;
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (!this.keys['ArrowLeft'] && !this.keys['a'] && !this.keys['A'] &&
            !this.keys['ArrowRight'] && !this.keys['d'] && !this.keys['D']) {
          this.player.stopMoving();
        }
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        this.player.releaseSlide();
        break;
    }
  }

  /**
   * 处理鼠标点击事件
   * @param {MouseEvent} e - 鼠标事件
   */
  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (this.ui.showLeaderboard && this.leaderboardUI.handleClick(x, y)) {
      return;
    }
    
    this.ui.handleMouseClick(x, y);
  }

  /**
   * 更新游戏状态（每帧调用�?
   * @param {number} deltaTime - 帧间隔时间（毫秒�?
   */
  update(deltaTime) {
    if (isNaN(deltaTime) || deltaTime <= 0) return;
    
    if (this.gameState.isPlaying()) {
      const currentTime = performance.now() - this.gameStartTime;
      
      this.speedControl.update(currentTime);
      const speed = this.speedControl.getSpeed();
      
      this.checkCoffeeBoost(currentTime);
      
      this.scene.update(speed, this.gameState.getScore());
      this.obstacleManager.update(currentTime, speed, this.engine.getObstacleSpeedMultiplier(), deltaTime);
      this.itemManager.update(currentTime, speed, deltaTime);
      this.gameState.update(deltaTime);
      this.ui.update(deltaTime);
      this.weatherManager.update(deltaTime, this.gameState.getScore());
      
      if (this.player) {
        this.player.update(deltaTime);
        
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x + this.player.width > this.engine.width) {
          this.player.x = this.engine.width - this.player.width;
        }
      }
    } else {
      this.ui.update(deltaTime);
    }
  }
  
  /**
   * 检查咖啡加速效果是否结�?
   * @param {number} currentTime - 当前游戏时间
   */
  checkCoffeeBoost(currentTime) {
    const before = this.coffeeBuffs.length;
    this.coffeeBuffs = this.coffeeBuffs.filter(buff => buff.endTime > currentTime);

    if (this.coffeeBuffs.length !== before) {
      this.syncCoffeeEffects(currentTime);
    } else {
      this.ui.setCoffeeBuffs(this.getCoffeeBuffTimeLeft(currentTime));
    }
  }

  getCoffeeBuffTimeLeft(currentTime) {
    return this.coffeeBuffs.map(buff => Math.max(0, buff.endTime - currentTime));
  }

  getCoffeeScoreMultiplier() {
    const count = this.coffeeBuffs.length;
    return count === 0 ? 1 : count * this.COFFEE_MULTIPLIER_STEP;
  }

  syncCoffeeEffects(currentTime) {
    this.gameState.setScoreMultiplier(this.getCoffeeScoreMultiplier());
    this.ui.setScoreMultiplier(this.getCoffeeScoreMultiplier());
    this.ui.setCoffeeBuffs(this.getCoffeeBuffTimeLeft(currentTime));
  }

  clearCoffeeBuffs() {
    this.coffeeBuffs = [];
    this.gameState.setScoreMultiplier(1);
    this.ui.setScoreMultiplier(1);
    this.ui.setCoffeeBuffs([]);
    this.speedControl.removeTemporaryBoost();
  }

  /**
   * 渲染游戏画面
   * @param {CanvasRenderingContext2D} ctx - 画布上下�?
   */
  render(ctx) {
    this.scene.render(ctx);
    this.weatherManager.render(ctx);
    
    if (this.player && this.gameState.isPlaying()) {
      this.player.render(ctx);
    }
    
    this.obstacleManager.render(ctx);
    this.itemManager.render(ctx);
    
    if (this.gameState.isMenu()) {
      this.ui.renderStartScreen();
      if (this.ui.showLeaderboard) {
        const centerX = this.canvas.width / 2;
        this.leaderboardUI.renderLeaderboard(centerX, 230);
      }
    } else if (this.gameState.isPlaying() || this.gameState.isPaused()) {
      this.ui.renderGameHUD();
      if (this.gameState.isPaused()) {
        this.ui.renderPauseScreen();
      }
    } else if (this.gameState.isGameOver()) {
      this.ui.renderGameOverScreen();
      this.leaderboardUI.renderRank(this.gameState.getCurrentRank());
    }
    
    if (this.leaderboardUI.showNicknameInput) {
      this.leaderboardUI.renderNicknameInput();
    }
  }

  /**
   * 处理碰撞事件
   * @param {object} a - 碰撞实体A
   * @param {object} b - 碰撞实体B
   */
  handleCollision(a, b) {
    const player = a.entityType === 'player' ? a : (b.entityType === 'player' ? b : null);
    const obstacle = a.entityType === 'obstacle' ? a : (b.entityType === 'obstacle' ? b : null);
    const item = a.entityType === 'item' ? a : (b.entityType === 'item' ? b : null);
    
    if (player && obstacle) {
      if (obstacle.isPlatform) {
        if (player.velocityY > 0 && player.y + player.height <= obstacle.y + 10) {
          player.y = obstacle.y - player.height;
          player.velocityY = 0;
          player.onGround = true;
          player.canDoubleJump = false;
        }
      } else {
        this.audioManager.playCollision();
        this.gameState.setState('gameover');
      }
    }
    
    if (player && item) {
      this.itemManager.collectItem(item);
    }
  }
  
  onPlayerSlideStart() {
    if (!this.gameState.isPlaying()) return;

    const rewardPoints = this.gameState.registerCrouch();
    this.ui.setCrouchCount(this.gameState.getCrouchCount());

    if (rewardPoints > 0) {
      this.ui.addAppleNotification(rewardPoints);
    }
  }

  /**
   * 处理道具收集事件
   * @param {object} item - 被收集的道具
   */
  onItemCollect(item) {
    const currentTime = performance.now() - this.gameStartTime;
    
    this.audioManager.playItemCollect(item.typeId);
    
    if (item.typeId === 'coffee') {
      this.coffeeBuffs.push({ endTime: currentTime + item.duration });
      this.speedControl.addTemporaryBoost(0.2, item.duration, currentTime);
      this.syncCoffeeEffects(currentTime);
      console.log('[DEBUG] Coffee collected - active count:', this.coffeeBuffs.length, 'multiplier:', this.getCoffeeScoreMultiplier());
    } else if (item.typeId === 'apple') {
      console.log('[DEBUG] Apple collected - scoreAmount:', item.scoreAmount);
      this.gameState.addScore(item.scoreAmount);
      this.ui.addAppleNotification(item.scoreAmount);
    }
  }

  /**
   * 处理游戏状态变�?
   * @param {string} newState - 新状�?
   * @param {string} oldState - 旧状�?
   */
  onStateChange(newState, oldState) {
    if (newState === 'playing') {
      this.engine.resume();
    } else if (newState === 'paused') {
      this.engine.pause();
    } else if (newState === 'gameover') {
      this.engine.pause();
    } else if (newState === 'menu') {
      this.engine.pause();
    }
  }
  
  /**
   * 处理排行榜显示切�?
   * @param {boolean} show - 是否显示排行�?
   */
  onLeaderboardToggle(show) {
    console.log('[DEBUG] Leaderboard toggle:', show);
  }

  /**
   * 处理游戏结束事件
   * @param {object} data - 游戏结束数据
   */
  onGameOver(data) {
    this.audioManager.playGameOver();
    
    this.ui.setScore(data.score);
    this.ui.setHighScore(this.gameState.getHighScore());
    this.skinManager.setHighScore(this.gameState.getHighScore());
    
    this.clearCoffeeBuffs();
    this.ui.setCrouchCount(0);
    
    if (data.score > 0) {
      this.leaderboardUI.lastScore = data.score;
      const savedNickname = this.gameState.getNickname();
      
      if (savedNickname) {
        this.submitScoreToServer(data.score, savedNickname);
      } else {
        this.leaderboardUI.showInput();
        this.gameState.setCurrentRank(0);
      }
    } else {
      this.gameState.setCurrentRank(0);
    }
    
    localStorage.removeItem('pixelRunner_coffeeRemaining');
    localStorage.removeItem('pixelRunner_coffeeActive');
  }
  
  /**
   * 提交分数到服务器
   * @param {number} score - 分数
   * @param {string} nickname - 昵称
   */
  async submitScoreToServer(score, nickname) {
    try {
      const rank = await this.gameState.leaderboardManager.submitScoreToServer(score, nickname);
      this.gameState.setCurrentRank(rank);
      this.leaderboardUI.loadLeaderboard();
      console.log('[Game] 分数已提交到服务器！昵称:', nickname, '分数:', score, '排名:', rank);
    } catch (error) {
      console.error('[Game] 提交分数失败:', error);
      this.gameState.leaderboardManager.submitScore(score, nickname);
      this.gameState.setCurrentRank(
        this.gameState.leaderboardManager.findRank(score)
      );
    }
  }

  /**
   * 处理障碍物生成事�?
   * @param {object} obstacle - 生成的障碍物
   */
  onObstacleSpawn(obstacle) {
    this.engine.addEntity(obstacle);
  }

  /**
   * 处理障碍物移除事�?
   * @param {object} obstacle - 移除的障碍物
   */
  onObstacleRemove(obstacle) {
    this.engine.removeEntity(obstacle);
  }
  
  /**
   * 处理道具生成事件
   * @param {object} item - 生成的道�?
   */
  onItemSpawn(item) {
    this.engine.addItem(item);
  }

  /**
   * 开始游�?
   */
  startGame() {
    this.engine.clear();
    this.obstacleManager.clear();
    this.itemManager.reset();
    this.scene.reset();
    
    this.player = new Player(100, this.scene.getGroundY() - 48, this.audioManager);
    this.player.applySkin(this.skinManager.getSelectedColors());
    this.player.onSlideStart = () => this.onPlayerSlideStart();
    this.engine.addEntity(this.player);

    this.gameState.startNewRound();
    this.gameState.setState('playing');
    this.gameStartTime = performance.now();
    
    this.speedControl.reset();
    
    this.clearCoffeeBuffs();
    this.ui.setCrouchCount(0);
    this.ui.setRoundDisplay(1, 1);

    this.ui.setHighScore(this.gameState.getHighScore());
    
    this.audioManager.playGameStart();
    
    setTimeout(() => {
      console.log('[DEBUG] Forcing obstacle spawn');
      this.obstacleManager.spawnObstacle('bird');
    }, 100);
    
    setTimeout(() => {
      console.log('[DEBUG] Forcing item spawn');
      this.itemManager.spawnItem();
    }, 500);
  }
  
  

  /**
   * 重新开始游戏（返回菜单�?
   */
  restartGame() {
    this.gameState.setState('menu');
    this.engine.clear();
    this.player = null;
    this.ui.setScore(0);
  }

  /**
   * 切换暂停状�?
   */
  togglePause() {
    if (this.gameState.isPlaying()) {
      this.gameState.pause();
    } else if (this.gameState.isPaused()) {
      this.gameState.resume();
      this.ui.setScore(this.gameState.getScore());
      this.ui.setCrouchCount(this.gameState.getCrouchCount());
      this.ui.setRoundDisplay(this.scene.getRoundDisplay().bigRound, this.scene.getRoundDisplay().smallRound);
    }
  }

  /**
   * 销毁游戏实�?
   */
  destroy() {
    this.engine.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('click', this.handleClick);
  }
}






