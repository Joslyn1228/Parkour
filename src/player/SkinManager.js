/**
 * 皮肤管理器 - 按最高分解锁并保存所选皮肤
 */
export class SkinManager {
  static UNLOCK_STEP = 600;
  static STORAGE_KEY = 'pixelRunner_selectedSkin';

  static SKINS = [
    {
      id: 'classic_red',
      name: '经典红装',
      unlockScore: 0,
      kind: 'outfit',
      colors: {
        body: '#ff6b6b',
        head: '#ffeaa7',
        eyes: '#2d3436',
        shoes: '#2d3436',
        hat: '#d63031',
        hatBrim: '#b71540',
        hatBand: '#ffeaa7'
      }
    },
    {
      id: 'ocean_runner',
      name: '海洋蓝装',
      unlockScore: 600,
      kind: 'outfit',
      colors: {
        body: '#0984e3',
        head: '#ffeaa7',
        eyes: '#2d3436',
        shoes: '#2d3436',
        hat: '#d63031',
        hatBrim: '#b71540',
        hatBand: '#ffeaa7'
      }
    },
    {
      id: 'sunset_cap',
      name: '夕阳帽',
      unlockScore: 1200,
      kind: 'hat',
      colors: {
        body: '#ff6b6b',
        head: '#ffeaa7',
        eyes: '#2d3436',
        shoes: '#2d3436',
        hat: '#fdcb6e',
        hatBrim: '#e17055',
        hatBand: '#d63031'
      }
    },
    {
      id: 'forest_suit',
      name: '森林绿装',
      unlockScore: 1800,
      kind: 'outfit',
      colors: {
        body: '#00b894',
        head: '#ffeaa7',
        eyes: '#2d3436',
        shoes: '#2d3436',
        hat: '#d63031',
        hatBrim: '#b71540',
        hatBand: '#ffeaa7'
      }
    },
    {
      id: 'royal_cap',
      name: '皇家紫帽',
      unlockScore: 2400,
      kind: 'hat',
      colors: {
        body: '#ff6b6b',
        head: '#ffeaa7',
        eyes: '#2d3436',
        shoes: '#2d3436',
        hat: '#6c5ce7',
        hatBrim: '#341f97',
        hatBand: '#a29bfe'
      }
    },
    {
      id: 'night_suit',
      name: '午夜蓝装',
      unlockScore: 3000,
      kind: 'outfit',
      colors: {
        body: '#2d3436',
        head: '#ffeaa7',
        eyes: '#dfe6e9',
        shoes: '#636e72',
        hat: '#d63031',
        hatBrim: '#b71540',
        hatBand: '#ffeaa7'
      }
    },
    {
      id: 'cyber_cap',
      name: '赛博霓虹帽',
      unlockScore: 3600,
      kind: 'hat',
      colors: {
        body: '#ff6b6b',
        head: '#ffeaa7',
        eyes: '#2d3436',
        shoes: '#2d3436',
        hat: '#00cec9',
        hatBrim: '#e94560',
        hatBand: '#fd79a8'
      }
    },
    {
      id: 'champion_gold',
      name: '冠军金装',
      unlockScore: 4200,
      kind: 'outfit',
      colors: {
        body: '#fdcb6e',
        head: '#ffeaa7',
        eyes: '#2d3436',
        shoes: '#e17055',
        hat: '#d63031',
        hatBrim: '#b71540',
        hatBand: '#ffffff'
      }
    }
  ];

  constructor(highScore = 0) {
    this.highScore = highScore;
    this.selectedIndex = 0;
    this.loadSelectedSkin();
    this.clampSelectedToUnlocked();
  }

  setHighScore(highScore) {
    this.highScore = highScore;
    this.clampSelectedToUnlocked();
  }

  getUnlockedSkins() {
    return SkinManager.SKINS.filter(skin => this.highScore >= skin.unlockScore);
  }

  isUnlocked(skin) {
    return this.highScore >= skin.unlockScore;
  }

  getSelectedSkin() {
    return SkinManager.SKINS[this.selectedIndex];
  }

  getSelectedColors() {
    return { ...this.getSelectedSkin().colors };
  }

  selectNext() {
    const unlocked = this.getUnlockedSkins();
    if (unlocked.length <= 1) return false;

    const currentId = this.getSelectedSkin().id;
    const currentPos = unlocked.findIndex(skin => skin.id === currentId);
    const next = unlocked[(currentPos + 1) % unlocked.length];
    this.selectedIndex = SkinManager.SKINS.findIndex(skin => skin.id === next.id);
    this.saveSelectedSkin();
    return true;
  }

  selectPrevious() {
    const unlocked = this.getUnlockedSkins();
    if (unlocked.length <= 1) return false;

    const currentId = this.getSelectedSkin().id;
    const currentPos = unlocked.findIndex(skin => skin.id === currentId);
    const prev = unlocked[(currentPos - 1 + unlocked.length) % unlocked.length];
    this.selectedIndex = SkinManager.SKINS.findIndex(skin => skin.id === prev.id);
    this.saveSelectedSkin();
    return true;
  }

  getNextLockedSkin() {
    return SkinManager.SKINS.find(skin => !this.isUnlocked(skin));
  }

  loadSelectedSkin() {
    try {
      const savedId = localStorage.getItem(SkinManager.STORAGE_KEY);
      if (!savedId) return;

      const index = SkinManager.SKINS.findIndex(skin => skin.id === savedId);
      if (index >= 0) {
        this.selectedIndex = index;
      }
    } catch (error) {
      console.warn('[SkinManager] 加载皮肤失败:', error.message);
    }
  }

  saveSelectedSkin() {
    try {
      localStorage.setItem(SkinManager.STORAGE_KEY, this.getSelectedSkin().id);
    } catch (error) {
      console.warn('[SkinManager] 保存皮肤失败:', error.message);
    }
  }

  clampSelectedToUnlocked() {
    if (this.isUnlocked(this.getSelectedSkin())) {
      return;
    }

    const unlocked = this.getUnlockedSkins();
    if (unlocked.length === 0) {
      this.selectedIndex = 0;
      return;
    }

    this.selectedIndex = SkinManager.SKINS.findIndex(skin => skin.id === unlocked[0].id);
    this.saveSelectedSkin();
  }
}
