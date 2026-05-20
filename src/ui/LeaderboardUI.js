/**
 * 排行榜UI - 使用Canvas绘制排行榜界面
 * 支持显示排行榜、昵称输入弹窗等功能
 */
import { LeaderboardManager } from '../storage/LeaderboardManager.js';

export class LeaderboardUI {
  constructor(canvas, leaderboardManager) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.leaderboardManager = leaderboardManager;
    
    this.leaderboard = [];
    this.lastScore = 0;
    this.currentRank = 0;
    
    this.showNicknameInput = false;
    this.nicknameInput = '';
    this.inputFocused = false;
    
    this.onNicknameSubmit = null;
  }

  /**
   * 初始化
   */
  init() {
    this.loadLeaderboard();
  }

  /**
   * 加载排行榜数据
   */
  loadLeaderboard() {
    this.leaderboard = this.leaderboardManager.getLeaderboard();
  }

  /**
   * 检查分数是否进入排行榜
   * @param {number} score - 当前分数
   * @returns {boolean} 是否进入排行榜
   */
  checkHighScore(score) {
    this.lastScore = score;
    return this.leaderboardManager.isHighScore(score);
  }

  /**
   * 显示昵称输入弹窗
   */
  showInput() {
    this.showNicknameInput = true;
    this.nicknameInput = '';
    this.inputFocused = true;
  }

  /**
   * 隐藏昵称输入弹窗
   */
  hideInput() {
    this.showNicknameInput = false;
    this.nicknameInput = '';
    this.inputFocused = false;
  }

  /**
   * 处理键盘输入
   * @param {string} key - 按键
   * @returns {boolean} 是否处理了输入
   */
  handleKeyInput(key) {
    if (!this.showNicknameInput) {
      return false;
    }
    
    if (key === 'Enter') {
      this.submitNickname();
      return true;
    } else if (key === 'Escape') {
      this.hideInput();
      return true;
    } else if (key === 'Backspace') {
      this.nicknameInput = this.nicknameInput.slice(0, -1);
      return true;
    } else if (key.length === 1 && this.nicknameInput.length < 12) {
      this.nicknameInput += key;
      return true;
    }
    
    return false;
  }

  /**
   * 提交昵称
   */
  submitNickname() {
    const nickname = this.leaderboardManager.validateNickname(this.nicknameInput);
    
    if (nickname && this.lastScore > 0) {
      this.currentRank = this.leaderboardManager.submitScore(this.lastScore, nickname);
      this.loadLeaderboard();
      
      if (typeof this.onNicknameSubmit === 'function') {
        this.onNicknameSubmit(nickname, this.lastScore, this.currentRank);
      }
    }
    
    this.hideInput();
  }

  /**
   * 在游戏结算时调用
   * @param {number} score - 最终分数
   */
  onGameOver(score) {
    this.lastScore = score;
    
    if (this.checkHighScore(score)) {
      this.showInput();
      return true;
    }
    
    return false;
  }

  /**
   * 渲染排行榜（菜单页面）
   * @param {number} x - 中心X坐标
   * @param {number} y - 起始Y坐标
   */
  renderLeaderboard(x, y) {
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    
    const entryHeight = 28;
    const boardHeight = Math.max(140, 55 + this.leaderboard.length * entryHeight + 20);
    
    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(x - 150, y, 300, boardHeight);
    
    this.ctx.fillStyle = '#636e72';
    this.ctx.fillRect(x - 145, y + 5, 290, boardHeight - 10);
    
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('排行榜', x, y + 30, 18);
    
    const startY = y + 55;
    
    for (let i = 0; i < this.leaderboard.length; i++) {
      const entry = this.leaderboard[i];
      const entryY = startY + i * entryHeight;
      
      const rankColors = ['#fdcb6e', '#b2bec3', '#e17055'];
      this.ctx.fillStyle = rankColors[i];
      this.drawPixelText(`${i + 1}.`, x - 120, entryY, 14);
      
      this.ctx.fillStyle = '#dfe6e9';
      const displayName = entry.nickname.length > 10 
        ? entry.nickname.substring(0, 10) + '..' 
        : entry.nickname;
      this.drawPixelText(displayName, x - 20, entryY, 14);
      
      this.ctx.fillStyle = '#ffeaa7';
      this.drawPixelText(`${entry.score}`, x + 100, entryY, 14);
    }
    
    if (this.leaderboard.length === 0) {
      this.ctx.fillStyle = '#636e72';
      this.drawPixelText('暂无记录', x, y + 100, 14);
    }
    
    this.ctx.restore();
  }

  /**
   * 渲染昵称输入弹窗
   */
  renderNicknameInput() {
    if (!this.showNicknameInput) {
      return;
    }
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    
    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(centerX - 200, centerY - 100, 400, 200);
    
    this.ctx.fillStyle = '#00b894';
    this.ctx.fillRect(centerX - 195, centerY - 95, 390, 190);
    
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('🎉 新纪录! 🎉', centerX, centerY - 60, 20);
    
    this.ctx.fillStyle = '#dfe6e9';
    this.drawPixelText(`分数: ${this.lastScore}`, centerX, centerY - 30, 16);
    
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('输入昵称 (2-12字符)', centerX, centerY + 5, 14);
    
    const inputBgX = centerX - 120;
    const inputBgY = centerY + 20;
    const inputWidth = 240;
    const inputHeight = 40;
    
    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(inputBgX, inputBgY, inputWidth, inputHeight);
    
    const displayText = this.nicknameInput || '';
    const textColor = this.nicknameInput.length >= 2 ? '#00b894' : '#ff6b6b';
    this.ctx.fillStyle = textColor;
    this.drawPixelText(displayText, centerX, inputBgY + inputHeight / 2, 16);
    
    const cursorVisible = Math.floor(Date.now() / 500) % 2 === 0;
    if (this.inputFocused && cursorVisible) {
      const textWidth = this.ctx.measureText(displayText).width;
      this.ctx.fillRect(centerX + textWidth / 2 + 2, inputBgY + 8, 2, 24);
    }
    
    const confirmY = centerY + 75;
    const buttonWidth = 160;
    const buttonHeight = 32;
    const buttonX = centerX - buttonWidth / 2;
    
    const canSubmit = this.nicknameInput.length >= 2 && this.nicknameInput.length <= 12;
    this.ctx.fillStyle = canSubmit ? '#00b894' : '#636e72';
    this.ctx.fillRect(buttonX, confirmY, buttonWidth, buttonHeight);
    
    this.ctx.fillStyle = canSubmit ? '#ffeaa7' : '#b2bec3';
    this.drawPixelText('按 ENTER 确认', centerX, confirmY + buttonHeight / 2, 12);
    
    this.ctx.fillStyle = '#74b9ff';
    this.drawPixelText('按 ESC 跳过', centerX, confirmY + 25, 10);
    
    this.ctx.restore();
  }

  /**
   * 渲染游戏结算时的排名显示
   * @param {number} rank - 排名
   */
  renderRank(rank) {
    if (rank <= 0 || rank > 3) {
      return;
    }
    
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    const rankTexts = ['冠军', '亚军', '季军'];
    const rankColors = ['#fdcb6e', '#b2bec3', '#e17055'];
    
    this.ctx.fillStyle = rankColors[rank - 1];
    this.drawPixelText(`本次排名: ${rankTexts[rank - 1]}`, centerX, centerY + 50, 18);
  }

  /**
   * 绘制像素风格文本
   * @param {string} text - 文本内容
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @param {number} size - 字体大小
   */
  drawPixelText(text, x, y, size) {
    this.ctx.font = `${size}px "Press Start 2P", monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x, y);
  }

  /**
   * 获取排行榜
   * @returns {Array} 排行榜数据
   */
  getLeaderboard() {
    return this.leaderboard;
  }

  /**
   * 获取最后提交的分数
   * @returns {number} 最后分数
   */
  getLastScore() {
    return this.lastScore;
  }
}
