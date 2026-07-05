import { VolumeControl } from './VolumeControl.js';
import { SkinManager } from '../player/SkinManager.js';

export class GameUI {
  constructor(canvas, audioManager = null) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.audioManager = audioManager;
    
    this.elements = [];
    
    this.score = 0;
    this.highScore = 0;
    
    this.onStart = null;
    this.onRestart = null;
    this.onPause = null;
    this.onLeaderboardToggle = null;
    
    this.showLeaderboard = false;
    this.showGuide = false;
    this.guideCurrentPage = 0;
    this.guideTotalPages = 3;
    
    this.showAnnouncement = false;
    this.announcementManager = null;
    this.announcementView = 'list';
    this.selectedAnnouncement = null;
    this.announcementPage = 0;
    this.announcementsPerPage = 6;
    this.announcementListButtons = [];
    this.announcementCloseButton = { x: 0, y: 0, width: 160, height: 32 };
    this.announcementBackButton = { x: 0, y: 0, width: 120, height: 32 };
    this.announcementPrevButton = { x: 0, y: 0, width: 28, height: 28 };
    this.announcementNextButton = { x: 0, y: 0, width: 28, height: 28 };
    this.mailButton = { x: 0, y: 0, width: 40, height: 40 };
    
    this.pixelFont = 'pixel';
    
    this.coffeeBuffs = [];
    this.scoreMultiplier = 1;
    this.bigRound = 1;
    this.smallRound = 1;
    this.appleNotifications = [];
    this.crouchCount = 0;
    
    this.volumeControl = null;
    this.showVolumeControl = true;

    this.skinManager = null;
    this.previewPlayer = null;
    this.skinLeftButton = { x: 0, y: 0, width: 28, height: 28 };
    this.skinRightButton = { x: 0, y: 0, width: 28, height: 28 };
    
    this.initElements();
  }

  setSkinManager(skinManager, previewPlayer) {
    this.skinManager = skinManager;
    this.previewPlayer = previewPlayer;
  }

  setAnnouncementManager(announcementManager) {
    this.announcementManager = announcementManager;
  }

  openAnnouncements() {
    this.showAnnouncement = true;
    this.announcementView = 'list';
    this.selectedAnnouncement = null;
    this.announcementPage = 0;
  }

  closeAnnouncements() {
    this.showAnnouncement = false;
    this.announcementView = 'list';
    this.selectedAnnouncement = null;
  }

  openAnnouncementDetail(announcement) {
    if (!announcement) return;
    this.selectedAnnouncement = announcement;
    this.announcementView = 'detail';
    if (this.announcementManager) {
      this.announcementManager.markAsRead(announcement.id);
    }
  }

  backToAnnouncementList() {
    this.announcementView = 'list';
    this.selectedAnnouncement = null;
  }

  getAnnouncementList() {
    if (this.announcementManager) {
      return this.announcementManager.getAnnouncements();
    }
    return [];
  }

  syncPreviewSkin() {
    if (this.skinManager && this.previewPlayer) {
      this.previewPlayer.applySkin(this.skinManager.getSelectedColors());
    }
  }

  initElements() {
    this.elements = {
      startScreen: null,
      gameHUD: null,
      pauseScreen: null,
      gameOverScreen: null,
      speedSlider: null
    };
    
    if (this.audioManager) {
      this.volumeControl = new VolumeControl(this.audioManager, this.canvas);
      const volumeX = this.canvas.width - 160;
      const volumeY = this.canvas.height - 60;
      this.volumeControl.setPosition(volumeX, volumeY);
    }
  }

  renderStartScreen() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    
    this.drawMailIcon(this.canvas.width - 55, 25);

    if (this.skinManager && this.previewPlayer) {
      this.renderSkinSelector(centerX, centerY);
    }
    
    this.ctx.fillStyle = '#ff6b6b';
    this.drawPixelText('PIXEL RUNNER', centerX, centerY - 100, 48);
    
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('按 ENTER 开始游戏', centerX, centerY - 30, 24);
    
    this.ctx.fillStyle = '#74b9ff';
    this.drawPixelText('← → 或 A D 移动', centerX, centerY + 30, 16);
    this.drawPixelText('空格 跳跃', centerX, centerY + 55, 16);
    this.drawPixelText('↓ 或 S 滑行', centerX, centerY + 80, 16);
    
    this.drawLeaderboardButton(centerX, centerY + 110);
    this.drawGuideButton(centerX, centerY + 150);
    
    if (this.showGuide) {
      this.renderGuideScreen();
    }

    if (this.showAnnouncement) {
      this.renderAnnouncementScreen();
    }
    
    this.ctx.restore();
  }

  renderSkinSelector(centerX, centerY) {
    const panelX = 28;
    const panelY = centerY - 95;
    const panelW = 176;
    const panelH = 220;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    this.ctx.fillRect(panelX, panelY, panelW, panelH);
    this.ctx.strokeStyle = '#636e72';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(panelX, panelY, panelW, panelH);

    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('皮肤', panelX + panelW / 2, panelY + 18, 14);

    this.ctx.fillStyle = '#4a4a6a';
    this.ctx.fillRect(panelX + 20, panelY + 118, panelW - 40, 8);
    this.ctx.fillStyle = '#5a4a3a';
    this.ctx.fillRect(panelX + 20, panelY + 126, panelW - 40, 6);

    this.syncPreviewSkin();
    this.previewPlayer.renderPreview(this.ctx, panelX + 72, panelY + 72);

    const selectorY = panelY + 152;
    const leftX = panelX + 16;
    const rightX = panelX + panelW - 44;

    this.skinLeftButton.x = leftX;
    this.skinLeftButton.y = selectorY;
    this.skinRightButton.x = rightX;
    this.skinRightButton.y = selectorY;

    this.ctx.fillStyle = '#636e72';
    this.ctx.fillRect(leftX, selectorY, 28, 28);
    this.ctx.fillRect(rightX, selectorY, 28, 28);
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('<', leftX + 14, selectorY + 15, 16);
    this.drawPixelText('>', rightX + 14, selectorY + 15, 16);

    const skin = this.skinManager.getSelectedSkin();
    const unlockedCount = this.skinManager.getUnlockedSkins().length;
    const totalCount = SkinManager.SKINS.length;

    this.ctx.fillStyle = skin.kind === 'hat' ? '#fdcb6e' : '#74b9ff';
    this.drawPixelText(skin.kind === 'hat' ? '帽子' : '衣服', panelX + panelW / 2, selectorY + 2, 10);

    this.ctx.fillStyle = '#dfe6e9';
    this.drawPixelText(skin.name, panelX + panelW / 2, selectorY + 44, 11);

    this.ctx.fillStyle = '#b2bec3';
    this.drawPixelText(`${unlockedCount}/${totalCount}`, panelX + panelW / 2, panelY + panelH - 38, 10);

    const nextLocked = this.skinManager.getNextLockedSkin();
    if (nextLocked) {
      this.ctx.fillStyle = '#fd79a8';
      this.drawPixelText(`下一款 ${nextLocked.unlockScore}分`, panelX + panelW / 2, panelY + panelH - 18, 9);
    } else {
      this.ctx.fillStyle = '#00b894';
      this.drawPixelText('已全部解锁', panelX + panelW / 2, panelY + panelH - 18, 9);
    }
  }

  drawMailIcon(x, y) {
    this.mailButton.x = x;
    this.mailButton.y = y;
    this.mailButton.width = 40;
    this.mailButton.height = 32;
    
    this.ctx.fillStyle = '#6c5ce7';
    this.ctx.fillRect(x, y, 36, 28);
    
    this.ctx.fillStyle = '#a29bfe';
    this.ctx.fillRect(x + 2, y + 2, 32, 24);
    
    this.ctx.strokeStyle = '#6c5ce7';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y + 10);
    this.ctx.lineTo(x + 18, y + 22);
    this.ctx.lineTo(x + 36, y + 10);
    this.ctx.stroke();
    
    this.ctx.fillStyle = '#ffffff';
    this.drawPixelText('@', x + 18, y + 18, 16);

    if (this.announcementManager && this.announcementManager.hasUnread()) {
      this.ctx.fillStyle = '#ff7675';
      this.ctx.fillRect(x + 28, y - 2, 10, 10);
      this.ctx.fillStyle = '#ffffff';
      this.drawPixelText('!', x + 33, y + 4, 8);
    }
  }

  renderAnnouncementScreen() {
    if (this.announcementView === 'detail' && this.selectedAnnouncement) {
      this.renderAnnouncementLetter(this.selectedAnnouncement);
    } else {
      this.renderAnnouncementList();
    }
  }

  renderAnnouncementList() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const panelWidth = Math.min(520, this.canvas.width - 40);
    const panelHeight = Math.min(420, this.canvas.height - 60);
    const panelX = centerX - panelWidth / 2;
    const panelY = centerY - panelHeight / 2;
    const announcements = this.getAnnouncementList();
    const totalPages = Math.max(1, Math.ceil(announcements.length / this.announcementsPerPage));
    const page = Math.min(this.announcementPage, totalPages - 1);
    const pageItems = announcements.slice(
      page * this.announcementsPerPage,
      page * this.announcementsPerPage + this.announcementsPerPage
    );

    this.announcementListButtons = [];

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(panelX + 4, panelY + 4, panelWidth - 8, panelHeight - 8);

    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('收件箱', centerX, panelY + 28, 20);

    this.ctx.fillStyle = '#74b9ff';
    this.drawPixelText('点击标题阅读信件', centerX, panelY + 52, 10);

    if (announcements.length === 0) {
      this.ctx.fillStyle = '#b2bec3';
      this.drawPixelText('暂无公告', centerX, centerY, 16);
    } else {
      const listTop = panelY + 72;
      const entryHeight = 44;
      const listWidth = panelWidth - 40;

      pageItems.forEach((announcement, index) => {
        const entryY = listTop + index * entryHeight;
        const entryX = panelX + 20;
        const isUnread = this.announcementManager && !this.announcementManager.isRead(announcement.id);

        this.announcementListButtons.push({
          id: announcement.id,
          announcement,
          x: entryX,
          y: entryY,
          width: listWidth,
          height: entryHeight - 6
        });

        this.ctx.fillStyle = isUnread ? '#243447' : '#16213e';
        this.ctx.fillRect(entryX, entryY, listWidth, entryHeight - 6);

        if (isUnread) {
          this.ctx.fillStyle = '#ff7675';
          this.ctx.fillRect(entryX + 8, entryY + 14, 8, 8);
        }

        this.ctx.fillStyle = isUnread ? '#ffeaa7' : '#dfe6e9';
        this.ctx.textAlign = 'left';
        this.ctx.font = '12px "Press Start 2P", monospace';
        this.ctx.fillText(announcement.title, entryX + (isUnread ? 22 : 12), entryY + 20);
        this.ctx.textAlign = 'right';
        this.ctx.fillStyle = '#fdcb6e';
        this.ctx.font = '9px "Press Start 2P", monospace';
        this.ctx.fillText(announcement.date || '', entryX + listWidth - 10, entryY + 20);
        this.ctx.textAlign = 'center';
        this.ctx.font = '16px "Press Start 2P", monospace';
      });
    }

    this.renderAnnouncementFooter(panelX, panelY, panelWidth, panelHeight, centerX, page, totalPages);
  }

  renderAnnouncementLetter(announcement) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    const panelWidth = Math.min(520, this.canvas.width - 40);
    const panelHeight = Math.min(420, this.canvas.height - 60);
    const panelX = centerX - panelWidth / 2;
    const panelY = centerY - panelHeight / 2;
    const letterX = panelX + 24;
    const letterY = panelY + 56;
    const letterWidth = panelWidth - 48;
    const letterHeight = panelHeight - 130;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(panelX + 4, panelY + 4, panelWidth - 8, panelHeight - 8);

    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('信件', centerX, panelY + 28, 20);

    this.ctx.fillStyle = '#f5e6c8';
    this.ctx.fillRect(letterX, letterY, letterWidth, letterHeight);
    this.ctx.strokeStyle = '#d4a574';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(letterX, letterY, letterWidth, letterHeight);

    this.ctx.fillStyle = '#c8956c';
    this.ctx.fillRect(letterX + 12, letterY - 8, letterWidth - 24, 16);
    this.ctx.fillStyle = '#e8c9a0';
    this.ctx.beginPath();
    this.ctx.moveTo(letterX + 12, letterY - 8);
    this.ctx.lineTo(letterX + letterWidth / 2, letterY + 8);
    this.ctx.lineTo(letterX + letterWidth - 12, letterY - 8);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.fillStyle = '#8b5a2b';
    this.ctx.textAlign = 'left';
    this.ctx.font = '11px "Press Start 2P", monospace';
    this.ctx.fillText(`主题: ${announcement.title}`, letterX + 16, letterY + 28);
    this.ctx.fillStyle = '#a67c52';
    this.ctx.font = '9px "Press Start 2P", monospace';
    this.ctx.fillText(`日期: ${announcement.date || ''}`, letterX + 16, letterY + 48);

    this.ctx.strokeStyle = '#d4a574';
    this.ctx.beginPath();
    this.ctx.moveTo(letterX + 16, letterY + 58);
    this.ctx.lineTo(letterX + letterWidth - 16, letterY + 58);
    this.ctx.stroke();

    const contentLines = this.wrapText(announcement.content, 24);
    this.ctx.fillStyle = '#4a3728';
    this.ctx.font = '10px "Press Start 2P", monospace';
    contentLines.slice(0, 10).forEach((line, lineIndex) => {
      this.ctx.fillText(line, letterX + 16, letterY + 82 + lineIndex * 18);
    });
    this.ctx.textAlign = 'center';
    this.ctx.font = '16px "Press Start 2P", monospace';

    const backX = panelX + 24;
    const backY = panelY + panelHeight - 38;
    this.announcementBackButton.x = backX;
    this.announcementBackButton.y = backY;
    this.announcementBackButton.width = 120;
    this.announcementBackButton.height = 32;

    this.ctx.fillStyle = '#636e72';
    this.ctx.fillRect(backX, backY, 120, 32);
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('返回', backX + 60, backY + 16, 12);

    const closeX = centerX + 40;
    this.announcementCloseButton.x = closeX;
    this.announcementCloseButton.y = backY;
    this.announcementCloseButton.width = 120;
    this.announcementCloseButton.height = 32;

    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.fillRect(closeX, backY, 120, 32);
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('关闭', closeX + 60, backY + 16, 12);
  }

  renderAnnouncementFooter(panelX, panelY, panelWidth, panelHeight, centerX, page, totalPages) {
    const navY = panelY + panelHeight - 78;
    const closeY = panelY + panelHeight - 38;
    const closeX = centerX - 80;

    this.announcementCloseButton.x = closeX;
    this.announcementCloseButton.y = closeY;
    this.announcementCloseButton.width = 160;
    this.announcementCloseButton.height = 32;

    if (totalPages > 1) {
      const prevX = panelX + 24;
      const nextX = panelX + panelWidth - 52;

      this.announcementPrevButton.x = prevX;
      this.announcementPrevButton.y = navY;
      this.announcementNextButton.x = nextX;
      this.announcementNextButton.y = navY;

      this.ctx.fillStyle = page > 0 ? '#636e72' : '#2d3436';
      this.ctx.fillRect(prevX, navY, 28, 28);
      this.ctx.fillStyle = page < totalPages - 1 ? '#636e72' : '#2d3436';
      this.ctx.fillRect(nextX, navY, 28, 28);

      this.ctx.fillStyle = '#ffeaa7';
      this.drawPixelText('<', prevX + 14, navY + 15, 14);
      this.drawPixelText('>', nextX + 14, navY + 15, 14);
      this.drawPixelText(`${page + 1}/${totalPages}`, centerX, navY + 15, 12);
    }

    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.fillRect(closeX, closeY, 160, 32);
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('关闭', centerX, closeY + 16, 12);
  }

  wrapText(text, maxLength) {
    const lines = [];
    let currentLine = '';
    
    text.split('').forEach(char => {
      if (currentLine.length >= maxLength) {
        lines.push(currentLine);
        currentLine = '';
      }
      currentLine += char;
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  drawGuideButton(x, y) {
    const buttonWidth = 160;
    const buttonHeight = 32;
    const buttonX = x - buttonWidth / 2;
    const buttonY = y;
    
    this.ctx.fillStyle = '#9b59b6';
    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(buttonX + 4, buttonY + 4, buttonWidth - 8, buttonHeight - 8);
    
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('图鉴与玩法', x, buttonY + buttonHeight / 2, 10);
  }

  renderGuideScreen() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.92)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    const guideWidth = Math.min(520, this.canvas.width - 40);
    const guideHeight = Math.min(620, this.canvas.height - 80);
    const guideX = (this.canvas.width - guideWidth) / 2;
    const guideY = (this.canvas.height - guideHeight) / 2;
    
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(guideX, guideY, guideWidth, guideHeight);
    
    this.ctx.fillStyle = '#16213e';
    this.ctx.fillRect(guideX + 6, guideY + 6, guideWidth - 12, guideHeight - 12);
    
    this.ctx.fillStyle = '#e94560';
    this.ctx.fillRect(guideX + 8, guideY + 8, guideWidth - 16, 45);
    
    this.ctx.fillStyle = '#ffeaa7';
    this.ctx.font = 'bold 26px "Press Start 2P", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('图鉴与玩法', this.canvas.width / 2, guideY + 30);
    
    const pageTitles = ['操作说明', '道具说明', '障碍物说明'];
    const pageColors = ['#00d9ff', '#00ff88', '#ff6b9d'];
    
    this.ctx.fillStyle = pageColors[this.guideCurrentPage];
    this.drawPixelText(pageTitles[this.guideCurrentPage], this.canvas.width / 2, guideY + 68, 18);
    
    const contentY = guideY + 95;
    const contentWidth = guideWidth - 24;
    const contentX = guideX + 12;
    
    if (this.guideCurrentPage === 0) {
      this.renderControlsPage(contentX, contentY, contentWidth);
    } else if (this.guideCurrentPage === 1) {
      this.renderItemsPage(contentX, contentY, contentWidth);
    } else if (this.guideCurrentPage === 2) {
      this.renderObstaclesPage(contentX, contentY, contentWidth);
    }
    
    this.drawGuideNavigation(guideX, guideY, guideWidth, guideHeight);
    
    this.ctx.fillStyle = '#636e72';
    this.drawPixelText('按 ESC 关闭', this.canvas.width / 2, guideY + guideHeight - 28, 12);
    
    this.ctx.restore();
  }

  renderControlsPage(x, y, width) {
    const controls = [
      { key: '空格/↑ W', action: '基础跳跃', desc: '单次按键实现普通跳跃', extra: '', color: '#00ff88' },
      { key: '空格/↑ W×2', action: '二段跳', desc: '连续两次按键实现二段跳', extra: '', color: '#00d9ff' },
      { key: '↓ / S', action: '滑行', desc: '蹲下躲避高空障碍物', extra: '', color: '#ffaa00' },
      { key: '空格/↑ W×3', action: '闪现', desc: '连续三次按键触发闪现', extra: '2秒无敌效果，4秒冷却时间', color: '#ff6b9d' }
    ];
    
    controls.forEach((control, index) => {
      const cardX = x + (index % 2) * (width / 2);
      const cardY = y + Math.floor(index / 2) * 100;
      
      this.ctx.fillStyle = '#16213e';
      this.ctx.fillRect(cardX, cardY, width / 2 - 8, 90);
      
      this.ctx.fillStyle = '#0f3460';
      this.ctx.fillRect(cardX + 3, cardY + 3, width / 2 - 14, 84);
      
      this.ctx.fillStyle = control.color;
      this.ctx.fillRect(cardX + 4, cardY + 4, 4, 18);
      
      this.ctx.fillStyle = '#ffeaa7';
      this.drawPixelText(control.key, cardX + (width / 4), cardY + 24, 14);
      
      this.ctx.fillStyle = '#ffffff';
      this.drawPixelText(control.action, cardX + (width / 4), cardY + 46, 14);
      
      this.ctx.fillStyle = '#b2bec3';
      this.drawPixelText(control.desc, cardX + (width / 4), cardY + 66, 10);
      
      if (control.extra) {
        this.ctx.fillStyle = '#ff6b9d';
        this.drawPixelText(control.extra, cardX + (width / 4), cardY + 82, 9);
      }
    });
  }

  renderItemsPage(x, y, width) {
    const items = [
      { name: '苹果', color: '#E74C3C', desc: '获得30分', extra: '', icon: 'apple', accent: '#00ff88' },
      { name: '咖啡', color: '#8B4513', desc: '得分倍率+2，移动加速', extra: '【可叠加，各10秒】', icon: 'coffee', accent: '#ffaa00' }
    ];
    
    items.forEach((item, index) => {
      const cardX = x + index * (width / 2);
      const cardY = y;
      
      this.ctx.fillStyle = '#16213e';
      this.ctx.fillRect(cardX, cardY, width / 2 - 8, 130);
      
      this.ctx.fillStyle = '#0f3460';
      this.ctx.fillRect(cardX + 3, cardY + 3, width / 2 - 14, 124);
      
      this.ctx.fillStyle = item.accent;
      this.ctx.fillRect(cardX + 4, cardY + 4, 4, 22);
      
      const iconX = cardX + (width / 4) - 18;
      const iconY = cardY + 20;
      const iconSize = 36;
      
      if (item.icon === 'apple') {
        this.drawGameAppleIcon(this.ctx, iconX, iconY, iconSize);
      } else {
        this.drawGameCoffeeIcon(this.ctx, iconX, iconY, iconSize);
      }
      
      this.ctx.fillStyle = '#ffffff';
      this.drawPixelText(item.name, cardX + (width / 4), cardY + 72, 16);
      
      this.ctx.fillStyle = '#b2bec3';
      this.drawPixelText(item.desc, cardX + (width / 4), cardY + 92, 11);
      
      if (item.extra) {
        this.ctx.fillStyle = '#ff6b9d';
        this.drawPixelText(item.extra, cardX + (width / 4), cardY + 108, 10);
      }
    });
  }

  renderObstaclesPage(x, y, width) {
    const obstacles = [
      { id: 'bird', name: '飞鸟', color: '#E17055', desc: '低空飞行障碍物，需滑行躲避', type: 'low' },
      { id: 'bat', name: '蝙蝠', color: '#2D3436', desc: '低空飞行障碍物，需滑行躲避', type: 'low' },
      { id: 'barrier', name: '障碍物', color: '#00CEC9', desc: '低空障碍，需滑行或二段跳', type: 'low' },
      { id: 'purple_block', name: '紫色方块', color: '#6C5CE7', desc: '可跳跃的浮动平台', type: 'low' },
      { id: 'cloud_obstacle', name: '云朵障碍', color: '#DFE6E9', desc: '中高空障碍物，需二段跳', type: 'high' },
      { id: 'butterfly', name: '蝴蝶', color: '#FD79A8', desc: '高空飞行障碍物，需二段跳', type: 'high' },
      { id: 'balloon', name: '气球', color: '#00B894', desc: '高空障碍物，需二段跳', type: 'high' }
    ];
    
    const typeColors = {
      ground: '#636e72',
      low: '#00d9ff',
      high: '#ff6b9d'
    };
    
    obstacles.forEach((obstacle, index) => {
      const cardX = x + (index % 2) * (width / 2);
      const cardY = y + Math.floor(index / 2) * 92;
      
      this.ctx.fillStyle = '#16213e';
      this.ctx.fillRect(cardX, cardY, width / 2 - 8, 86);
      
      this.ctx.fillStyle = '#0f3460';
      this.ctx.fillRect(cardX + 3, cardY + 3, width / 2 - 14, 80);
      
      this.ctx.fillStyle = typeColors[obstacle.type];
      this.ctx.fillRect(cardX + 4, cardY + 4, 4, 20);
      
      const iconX = cardX + 16;
      const iconY = cardY + 16;
      const iconSize = 28;
      
      this.drawObstacleIcon(this.ctx, obstacle.id, obstacle.color, iconX, iconY, iconSize);
      
      this.ctx.fillStyle = '#ffffff';
      this.drawPixelText(obstacle.name, cardX + (width / 4), cardY + 24, 14);
      
      this.ctx.fillStyle = '#b2bec3';
      this.drawPixelText(obstacle.desc, cardX + (width / 4), cardY + 46, 10);
      
      this.ctx.fillStyle = typeColors[obstacle.type];
      const typeText = obstacle.type === 'ground' ? '地面' : obstacle.type === 'low' ? '低空' : '高空';
      this.drawPixelText(typeText, cardX + (width / 4), cardY + 66, 10);
    });
  }

  drawGameAppleIcon(ctx, x, y, size) {
    ctx.fillStyle = '#E74C3C';
    ctx.beginPath();
    ctx.arc(x + size / 2, y + size / 2, size / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#27AE60';
    ctx.beginPath();
    ctx.moveTo(x + size / 2, y + 4);
    ctx.lineTo(x + size / 2 - 5, y);
    ctx.lineTo(x + size / 2 + 5, y);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(x + size / 2 - 4, y + size / 2 - 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  drawGameCoffeeIcon(ctx, x, y, size) {
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(x + 2, y + 6, size - 4, size - 6);
    
    ctx.fillStyle = '#D2691E';
    ctx.fillRect(x + 4, y + 8, size - 8, size - 14);
    
    ctx.fillStyle = '#FFF';
    ctx.fillRect(x + 3, y + 3, size - 6, 4);
    
    ctx.fillStyle = '#333';
    ctx.fillRect(x + 6, y, 2, 4);
    ctx.fillRect(x + size - 8, y, 2, 4);
  }

  drawObstacleIcon(ctx, id, color, x, y, size) {
    ctx.fillStyle = color;
    
    switch(id) {
      case 'crate':
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#654321';
        ctx.fillRect(x + 2, y + 2, size - 4, 2);
        ctx.fillRect(x + 2, y + size - 4, size - 4, 2);
        ctx.fillRect(x + 2, y + 2, 2, size - 4);
        ctx.fillRect(x + size - 4, y + 2, 2, size - 4);
        break;
      case 'spike':
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y);
        ctx.lineTo(x + size, y + size);
        ctx.lineTo(x, y + size);
        ctx.closePath();
        ctx.fill();
        break;
      case 'bird':
        ctx.fillRect(x + 4, y + 4, 16, 6);
        ctx.fillStyle = '#D63031';
        ctx.beginPath();
        ctx.arc(x + 20, y + 7, 3, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'bat':
        ctx.fillStyle = '#2D3436';
        ctx.beginPath();
        ctx.ellipse(x + size / 2, y + size / 2, size / 2, size / 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'barrier':
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#00B894';
        ctx.fillRect(x + 2, y + 4, size - 4, 4);
        ctx.fillRect(x + 2, y + size / 2, size - 4, 4);
        break;
      case 'purple_block':
        ctx.fillRect(x, y, size, size);
        ctx.fillStyle = '#8E7CC3';
        ctx.fillRect(x + 2, y + 2, size - 4, 2);
        ctx.fillRect(x + 2, y + 2, 2, size - 4);
        break;
      case 'cloud_obstacle':
        ctx.beginPath();
        ctx.arc(x + 8, y + 8, 6, 0, Math.PI * 2);
        ctx.arc(x + 14, y + 6, 7, 0, Math.PI * 2);
        ctx.arc(x + 20, y + 8, 6, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'butterfly':
        ctx.beginPath();
        ctx.ellipse(x + size / 2 - 5, y + 5, 5, 4, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + size / 2 + 5, y + 5, 5, 4, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FDCB6E';
        ctx.fillRect(x + size / 2 - 1, y + 4, 2, 6);
        break;
      case 'balloon':
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2 + 2, size / 2 - 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(x + size / 2 - 4, y + size / 2 - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2D3436';
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y + size - 2);
        ctx.lineTo(x + size / 2 - 4, y + size + 4);
        ctx.moveTo(x + size / 2, y + size - 2);
        ctx.lineTo(x + size / 2 + 4, y + size + 4);
        ctx.stroke();
        break;
      case 'floating_spike':
        ctx.beginPath();
        ctx.moveTo(x + size / 2, y + size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
        break;
      default:
        ctx.fillRect(x, y, size, size);
    }
  }

  drawGuideNavigation(x, y, width, height) {
    const navY = y + height - 52;
    
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText(`${this.guideCurrentPage + 1} / ${this.guideTotalPages}`, this.canvas.width / 2, navY, 16);
    
    const leftArrowX = x + 25;
    const rightArrowX = x + width - 35;
    
    const pageColors = ['#00d9ff', '#00ff88', '#ff6b9d'];
    const currentColor = pageColors[this.guideCurrentPage];
    
    this.ctx.fillStyle = this.guideCurrentPage > 0 ? currentColor : '#4a5568';
    this.drawArrow(this.ctx, leftArrowX, navY, 'left');
    
    this.ctx.fillStyle = this.guideCurrentPage < this.guideTotalPages - 1 ? currentColor : '#4a5568';
    this.drawArrow(this.ctx, rightArrowX, navY, 'right');
    
    this.ctx.fillStyle = '#16213e';
    this.ctx.fillRect(x + 60, navY - 12, width - 120, 24);
    
    this.ctx.fillStyle = '#0f3460';
    this.ctx.fillRect(x + 62, navY - 10, width - 124, 20);
    
    for (let i = 0; i < this.guideTotalPages; i++) {
      const dotX = x + width / 2 - 18 + i * 18;
      this.ctx.fillStyle = i === this.guideCurrentPage ? currentColor : '#4a5568';
      this.ctx.beginPath();
      this.ctx.arc(dotX, navY, 5, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  drawArrow(ctx, x, y, direction) {
    ctx.beginPath();
    if (direction === 'left') {
      ctx.moveTo(x + 18, y - 10);
      ctx.lineTo(x, y);
      ctx.lineTo(x + 18, y + 10);
    } else {
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x + 18, y);
      ctx.lineTo(x, y + 10);
    }
    ctx.closePath();
    ctx.fill();
  }

  

  renderGameHUD() {
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(10, 10, 150, 100);

    this.ctx.fillStyle = '#a29bfe';
    this.drawPixelText(`${this.bigRound}/${this.smallRound}`, 85, 28, 14);

    this.ctx.fillStyle = '#ffeaa7';
    const scoreText = `分数: ${this.score}`;
    this.drawPixelText(scoreText, 85, 52, 16);
    
    if (this.scoreMultiplier > 1) {
      const scoreWidth = this.ctx.measureText(scoreText).width;
      this.ctx.fillStyle = '#fdcb6e';
      this.ctx.font = 'bold 12px "Press Start 2P", monospace';
      this.ctx.fillText(`×${this.scoreMultiplier}`, 85 + scoreWidth + 10, 49);
      this.ctx.font = '16px "Press Start 2P", monospace';
    }
    
    this.ctx.fillStyle = '#fd79a8';
    this.drawPixelText(`最高分: ${this.highScore}`, 85, 77, 12);

    this.ctx.fillStyle = '#74b9ff';
    this.drawPixelText('P 暂停', 85, 100, 12);
    
    this.renderCoffeeEffect();
    this.renderCrouchCounter();
    this.renderAppleNotifications();
    
    this.ctx.restore();
  }
  
  renderCoffeeEffect() {
    if (this.coffeeBuffs.length === 0) return;

    const iconX = this.canvas.width - 50;
    const iconSize = 32;
    const fadeDuration = 1000;

    this.coffeeBuffs.forEach((timeLeft, index) => {
      if (timeLeft <= 0) return;

      const iconY = 80 + index * 48;
      const fadeAlpha = timeLeft < fadeDuration ? timeLeft / fadeDuration : 1;
      const pulse = Math.sin(Date.now() * 0.01 + index) * 0.2 + 0.8;
      const finalAlpha = 0.8 * pulse * fadeAlpha;

      this.ctx.fillStyle = `rgba(253, 196, 110, ${finalAlpha})`;
      this.ctx.shadowColor = '#fdcb6e';
      this.ctx.shadowBlur = 10 * pulse * fadeAlpha;

      this.ctx.fillRect(iconX, iconY, iconSize, iconSize);

      this.ctx.fillStyle = `rgba(45, 52, 54, ${fadeAlpha})`;
      this.ctx.fillRect(iconX + 4, iconY + 8, 8, 16);
      this.ctx.fillRect(iconX + 20, iconY + 8, 8, 16);
      this.ctx.fillRect(iconX + 8, iconY + 20, 16, 8);

      this.ctx.shadowBlur = 0;

      const secondsLeft = Math.ceil(timeLeft / 1000);
      this.ctx.fillStyle = `rgba(253, 203, 110, ${fadeAlpha})`;
      this.drawPixelText(`${secondsLeft}s`, iconX + iconSize / 2, iconY + iconSize + 15, 12);
    });
  }
  
  renderCrouchCounter() {
    const boxWidth = 130;
    const boxHeight = 40;
    const boxX = this.canvas.width - boxWidth - 10;
    const boxY = 10;

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);

    this.ctx.fillStyle = '#a29bfe';
    this.drawPixelText(`下蹲 ${this.crouchCount}/5`, boxX + boxWidth / 2, boxY + 25, 12);
  }

  renderAppleNotifications() {
    this.appleNotifications.forEach((notification, index) => {
      if (notification.alpha <= 0) return;
      
      this.ctx.save();
      this.ctx.globalAlpha = notification.alpha;
      this.ctx.fillStyle = '#00b894';
      this.ctx.font = 'bold 24px "Press Start 2P", monospace';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(`+${notification.score}`, this.canvas.width / 2, notification.y);
      this.ctx.restore();
    });
  }
  
  update(deltaTime) {
    if (isNaN(deltaTime) || deltaTime <= 0) return;
    
    this.appleNotifications = this.appleNotifications.filter(notification => {
      notification.y -= 0.5;
      notification.alpha -= deltaTime / 1500;
      return notification.alpha > 0;
    });
  }
  
  setCoffeeBuffs(timeLeftList) {
    this.coffeeBuffs = timeLeftList;
  }

  setScoreMultiplier(multiplier) {
    this.scoreMultiplier = multiplier;
  }

  setRoundDisplay(bigRound, smallRound) {
    this.bigRound = bigRound;
    this.smallRound = smallRound;
  }

  addAppleNotification(score = 30) {
    this.appleNotifications.push({
      score: score,
      y: this.canvas.height / 2 - 50,
      alpha: 1
    });
  }

  setCrouchCount(count) {
    this.crouchCount = count;
  }

  renderPauseScreen() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText('游戏暂停', centerX, centerY - 30, 32);

    this.ctx.fillStyle = '#fdcb6e';
    this.drawPixelText(`当前分数: ${this.score}`, centerX, centerY + 15, 16);
    
    this.ctx.fillStyle = '#74b9ff';
    this.drawPixelText('按 P 继续', centerX, centerY + 50, 20);
    
    this.ctx.fillStyle = '#fd79a8';
    this.drawPixelText('按 ESC 返回菜单', centerX, centerY + 85, 16);
    
    this.ctx.restore();
  }

  renderGameOverScreen() {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;
    
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    
    this.ctx.fillStyle = '#ff6b6b';
    this.drawPixelText('游戏结束', centerX, centerY - 60, 40);
    
    this.ctx.fillStyle = '#ffeaa7';
    this.drawPixelText(`最终分数: ${this.score}`, centerX, centerY - 10, 24);
    
    if (this.score >= this.highScore && this.score > 0) {
      this.ctx.fillStyle = '#fdcb6e';
      this.drawPixelText('🎉 新纪录! 🎉', centerX, centerY + 20, 20);
    } else {
      this.ctx.fillStyle = '#fd79a8';
      this.drawPixelText(`最高分: ${this.highScore}`, centerX, centerY + 25, 18);
    }
    
    this.ctx.fillStyle = '#74b9ff';
    this.drawPixelText('按 ENTER 重新开始', centerX, centerY + 70, 20);
    
    this.ctx.fillStyle = '#636e72';
    this.drawPixelText('按 ESC 返回菜单', centerX, centerY + 100, 16);
    
    this.ctx.restore();
  }

  drawLeaderboardButton(x, y) {
    const buttonWidth = 160;
    const buttonHeight = 32;
    const buttonX = x - buttonWidth / 2;
    const buttonY = y;
    
    this.ctx.fillStyle = this.showLeaderboard ? '#00b894' : '#636e72';
    this.ctx.fillRect(buttonX, buttonY, buttonWidth, buttonHeight);
    
    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(buttonX + 4, buttonY + 4, buttonWidth - 8, buttonHeight - 8);
    
    this.ctx.fillStyle = '#ffeaa7';
    const buttonText = this.showLeaderboard ? '隐藏排行榜' : '显示排行榜';
    this.drawPixelText(buttonText, x, buttonY + buttonHeight / 2, 10);
  }
  
  drawPixelText(text, x, y, size) {
    this.ctx.font = `${size}px "Press Start 2P", monospace`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x, y);
  }

  setScore(score) {
    this.score = score;
  }

  setHighScore(highScore) {
    this.highScore = highScore;
  }

  setDifficulty(difficulty) {
    this.difficulty = difficulty;
  }

  handleKeyDown(key) {
    if (this.showGuide) {
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        if (this.guideCurrentPage > 0) {
          this.guideCurrentPage--;
        }
        return;
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        if (this.guideCurrentPage < this.guideTotalPages - 1) {
          this.guideCurrentPage++;
        }
        return;
      }
    } else if (this.showAnnouncement) {
      if (this.announcementView === 'detail') {
        if (key === 'Escape') {
          this.backToAnnouncementList();
        }
        return;
      }

      const announcements = this.getAnnouncementList();
      const totalPages = Math.max(1, Math.ceil(announcements.length / this.announcementsPerPage));

      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        if (this.announcementPage > 0) {
          this.announcementPage--;
        }
        return;
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        if (this.announcementPage < totalPages - 1) {
          this.announcementPage++;
        }
        return;
      } else if (key === 'Escape') {
        this.closeAnnouncements();
        return;
      }
    } else if (this.skinManager) {
      if (key === 'ArrowLeft' || key === 'a' || key === 'A') {
        this.skinManager.selectPrevious();
        this.syncPreviewSkin();
        return;
      } else if (key === 'ArrowRight' || key === 'd' || key === 'D') {
        this.skinManager.selectNext();
        this.syncPreviewSkin();
        return;
      }
    }
    
    if (this.showAnnouncement) {
      return;
    }

    if (key === 'Enter') {
      if (typeof this.onStart === 'function') {
        this.onStart();
      }
    } else if (key === 'p' || key === 'P') {
      if (typeof this.onPause === 'function') {
        this.onPause();
      }
    } else if (key === 'Escape') {
      if (this.showGuide) {
        this.showGuide = false;
      } else if (typeof this.onRestart === 'function') {
        this.onRestart();
      }
    }
  }

  handleMouseClick(x, y) {
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    if (!this.showGuide && this.skinManager) {
      if (x >= this.skinLeftButton.x && x <= this.skinLeftButton.x + this.skinLeftButton.width &&
          y >= this.skinLeftButton.y && y <= this.skinLeftButton.y + this.skinLeftButton.height) {
        this.skinManager.selectPrevious();
        this.syncPreviewSkin();
        return;
      }
      if (x >= this.skinRightButton.x && x <= this.skinRightButton.x + this.skinRightButton.width &&
          y >= this.skinRightButton.y && y <= this.skinRightButton.y + this.skinRightButton.height) {
        this.skinManager.selectNext();
        this.syncPreviewSkin();
        return;
      }
    }
    
    const leaderboardButtonY = this.canvas.height / 2 + 110;
    const guideButtonY = this.canvas.height / 2 + 150;
    
    const buttonWidth = 160;
    const buttonHeight = 32;
    const leaderboardButtonX = centerX - buttonWidth / 2;
    
    if (x >= leaderboardButtonX && x <= leaderboardButtonX + buttonWidth &&
        y >= leaderboardButtonY && y <= leaderboardButtonY + buttonHeight) {
      this.showLeaderboard = !this.showLeaderboard;
      if (typeof this.onLeaderboardToggle === 'function') {
        this.onLeaderboardToggle(this.showLeaderboard);
      }
    }
    
    if (x >= leaderboardButtonX && x <= leaderboardButtonX + buttonWidth &&
        y >= guideButtonY && y <= guideButtonY + buttonHeight) {
      this.showGuide = !this.showGuide;
      this.guideCurrentPage = 0;
    }
    
    if (x >= this.mailButton.x && x <= this.mailButton.x + this.mailButton.width &&
        y >= this.mailButton.y && y <= this.mailButton.y + this.mailButton.height) {
      if (this.showAnnouncement) {
        this.closeAnnouncements();
      } else {
        this.openAnnouncements();
      }
      return;
    }

    if (this.showAnnouncement) {
      const closeBtn = this.announcementCloseButton;
      if (x >= closeBtn.x && x <= closeBtn.x + closeBtn.width &&
          y >= closeBtn.y && y <= closeBtn.y + closeBtn.height) {
        this.closeAnnouncements();
        return;
      }

      if (this.announcementView === 'detail') {
        const backBtn = this.announcementBackButton;
        if (x >= backBtn.x && x <= backBtn.x + backBtn.width &&
            y >= backBtn.y && y <= backBtn.y + backBtn.height) {
          this.backToAnnouncementList();
        }
        return;
      }

      for (const item of this.announcementListButtons) {
        if (x >= item.x && x <= item.x + item.width &&
            y >= item.y && y <= item.y + item.height) {
          this.openAnnouncementDetail(item.announcement);
          return;
        }
      }

      const prevBtn = this.announcementPrevButton;
      const nextBtn = this.announcementNextButton;
      const announcements = this.getAnnouncementList();
      const totalPages = Math.max(1, Math.ceil(announcements.length / this.announcementsPerPage));

      if (x >= prevBtn.x && x <= prevBtn.x + prevBtn.width &&
          y >= prevBtn.y && y <= prevBtn.y + prevBtn.height &&
          this.announcementPage > 0) {
        this.announcementPage--;
        return;
      }

      if (x >= nextBtn.x && x <= nextBtn.x + nextBtn.width &&
          y >= nextBtn.y && y <= nextBtn.y + nextBtn.height &&
          this.announcementPage < totalPages - 1) {
        this.announcementPage++;
        return;
      }

      return;
    }
    
    if (this.showGuide) {
      const guideWidth = Math.min(500, this.canvas.width - 40);
      const guideHeight = Math.min(500, this.canvas.height - 80);
      const guideX = (this.canvas.width - guideWidth) / 2;
      const guideY = (this.canvas.height - guideHeight) / 2;
      const navY = guideY + guideHeight - 50;
      
      const leftArrowX = guideX + 20;
      const rightArrowX = guideX + guideWidth - 30;
      
      if (x >= leftArrowX && x <= leftArrowX + 15 && y >= navY - 8 && y <= navY + 8) {
        if (this.guideCurrentPage > 0) {
          this.guideCurrentPage--;
        }
      }
      
      if (x >= rightArrowX && x <= rightArrowX + 15 && y >= navY - 8 && y <= navY + 8) {
        if (this.guideCurrentPage < this.guideTotalPages - 1) {
          this.guideCurrentPage++;
        }
      }
    }
  }
  
  toggleLeaderboard() {
    this.showLeaderboard = !this.showLeaderboard;
    if (typeof this.onLeaderboardToggle === 'function') {
      this.onLeaderboardToggle(this.showLeaderboard);
    }
    return this.showLeaderboard;
  }
  
  getShowLeaderboard() {
    return this.showLeaderboard;
  }
}

export class PixelButton {
  constructor(x, y, width, height, text, onClick) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.text = text;
    this.onClick = onClick;
    this.hovered = false;
  }

  render(ctx) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    
    if (this.hovered) {
      ctx.fillStyle = '#ffeaa7';
    } else {
      ctx.fillStyle = '#ff6b6b';
    }
    ctx.fillRect(this.x, this.y, this.width, this.height);
    
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(this.x + 4, this.y + 4, this.width - 8, this.height - 8);
    
    if (this.hovered) {
      ctx.fillStyle = '#ffeaa7';
    } else {
      ctx.fillStyle = '#ff6b6b';
    }
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, this.x + this.width / 2, this.y + this.height / 2);
    
    ctx.restore();
  }

  checkHover(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
}



