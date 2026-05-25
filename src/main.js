/**
 * 像素跑酷游戏主入口类
 * 
 * 负责整合所有游戏模块，协调各组件之间的通信
 * 处理用户输入、游戏循环和渲染流程
 */
import { GameEngine, RenderLayer } from './engine/GameEngine.js';
import { Player } from './player/Player.js';
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
   * 构造函数 - 初始化游戏实例
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
    
    this.player = null;
    this.gameStartTime = 0;
    
    this.keys = {};
    
    this.hasCoffeeBoost = false;
    this.coffeeBoostEndTime = 0;
    this.scoreMultiplier = 1;
    
    this.init();
  }

  /**
   * 初始化游戏 - 设置事件监听和回调
   */
  async init() {
    this.setupEventListeners();
    this.setupCallbacks();
    await this.syncGameData();
    this.setupLeaderboardSync();
    this.leaderboardUI.init();
    this.engine.start();
  }
  
  async syncGameData() {
    try {
      const serverLeaderboard = await this.gameState.leaderboardManager.fetchLeaderboard();
      console.log('[Game] 已从服务器同步排行榜数据');
      
      const localHighScore = this.gameState.highScore;
      const serverHighScore = serverLeaderboard.length > 0 ? serverLeaderboard[0].score : 0;

      // 不自动覆盖本地最高分（localStorage 保存的是个人记录），
      // 只记录服务器最高分用于在 UI 中显示全局榜单。
      // 如果需要在界面上显示服务器最高分，可使用 this.serverHighScore。
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
      // 确保本地最高分在 UI 中同步（若用户已清空 localStorage，应显示 0）
      if (typeof this.leaderboardUI.loadLocalHighScore === 'function') {
        this.leaderboardUI.loadLocalHighScore();
      }
    };
  }

  /**
   * 设置事件监听器 - 键盘和鼠标事件
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
      console.log(`[Leaderboard] ${nickname} 获得第 ${rank} 名，分数: ${score}`);
      this.gameState.saveNickname(nickname);
      console.log('[GameState] 昵称已保存:', nickname);
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
   * 更新游戏状态（每帧调用）
   * @param {number} deltaTime - 帧间隔时间（毫秒）
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
   * 检查咖啡加速效果是否结束
   * @param {number} currentTime - 当前游戏时间
   */
  checkCoffeeBoost(currentTime) {
    if (this.hasCoffeeBoost && currentTime >= this.coffeeBoostEndTime) {
      this.hasCoffeeBoost = false;
      this.gameState.setScoreMultiplier(1);
      this.speedControl.removeTemporaryBoost();
      console.log('[DEBUG] Coffee boost ended');
    }
  }

  /**
   * 渲染游戏画面
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
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
    } else if (this.gameState.isPlaying()) {
      this.ui.renderGameHUD();
    } else if (this.gameState.isPaused()) {
      this.ui.renderPauseScreen();
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
  
  /**
   * 处理道具收集事件
   * @param {object} item - 被收集的道具
   */
  onItemCollect(item) {
    const currentTime = performance.now() - this.gameStartTime;
    
    this.audioManager.playItemCollect(item.typeId);
    
    if (item.typeId === 'coffee') {
      this.hasCoffeeBoost = true;
      this.coffeeBoostEndTime = currentTime + item.duration;
      this.gameState.setScoreMultiplier(2);
      this.speedControl.addTemporaryBoost(0.2, item.duration);
      this.ui.startCoffeeEffect(item.duration);
      console.log('[DEBUG] Coffee collected - duration:', item.duration);
    } else if (item.typeId === 'apple') {
      console.log('[DEBUG] Apple collected - scoreAmount:', item.scoreAmount);
      this.gameState.addScore(item.scoreAmount);
      this.ui.addAppleNotification(item.scoreAmount);
    }
  }

  /**
   * 处理游戏状态变更
   * @param {string} newState - 新状态
   * @param {string} oldState - 旧状态
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
   * 处理排行榜显示切换
   * @param {boolean} show - 是否显示排行榜
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
    this.ui.setHighScore(data.highScore);
    
    this.hasCoffeeBoost = false;
    this.coffeeBoostEndTime = 0;
    this.speedControl.removeTemporaryBoost();
    this.gameState.setScoreMultiplier(1);
    
    this.ui.stopCoffeeEffect();
    
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
   * 处理障碍物生成事件
   * @param {object} obstacle - 生成的障碍物
   */
  onObstacleSpawn(obstacle) {
    this.engine.addEntity(obstacle);
  }

  /**
   * 处理障碍物移除事件
   * @param {object} obstacle - 移除的障碍物
   */
  onObstacleRemove(obstacle) {
    this.engine.removeEntity(obstacle);
  }
  
  /**
   * 处理道具生成事件
   * @param {object} item - 生成的道具
   */
  onItemSpawn(item) {
    this.engine.addItem(item);
  }

  /**
   * 开始游戏
   */
  startGame() {
    this.engine.clear();
    this.obstacleManager.clear();
    this.itemManager.reset();
    this.scene.reset();
    
    this.player = new Player(100, this.scene.getGroundY() - 48, this.audioManager);
    this.engine.addEntity(this.player);
    
    this.gameState.setState('playing');
    this.gameStartTime = performance.now();
    
    this.speedControl.reset();
    
    this.hasCoffeeBoost = false;
    this.coffeeBoostEndTime = 0;
    this.scoreMultiplier = 1;
    this.gameState.setScoreMultiplier(1);
    
    this.ui.stopCoffeeEffect();
    
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
   * 重新开始游戏（返回菜单）
   */
  restartGame() {
    this.gameState.setState('menu');
    this.engine.clear();
    this.player = null;
    this.ui.setScore(0);
  }

  /**
   * 切换暂停状态
   */
  togglePause() {
    if (this.gameState.isPlaying()) {
      this.gameState.pause();
    } else if (this.gameState.isPaused()) {
      this.gameState.resume();
    }
  }

  /**
   * 销毁游戏实例
   */
  destroy() {
    this.engine.stop();
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    this.canvas.removeEventListener('click', this.handleClick);
  }
}