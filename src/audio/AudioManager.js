/**
 * 音效管理器类
 * 
 * 负责管理游戏中的所有音效，包括：
 * - 音效加载和播放
 * - 音量控制
 * - 音效类型管理
 * - 使用Web Audio API生成像素风格音效
 */
export class AudioManager {
  /**
   * 构造函数 - 初始化音效管理器
   */
  constructor() {
    this.audioContext = null;
    this.gainNode = null;
    this.masterVolume = 0.7;
    this.sfxVolume = 0.8;
    
    this.audioEnabled = true;
    
    this.activeSounds = [];
    
    this.initAudioContext();
    this.setupVolumeControls();
  }
  
  /**
   * 初始化Web Audio上下文
   */
  initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.masterVolume;
    } catch (error) {
      console.warn('[AudioManager] Web Audio API not supported:', error.message);
      this.audioEnabled = false;
    }
  }
  
  /**
   * 设置音量控制
   */
  setupVolumeControls() {
    this.masterGain = this.audioContext ? this.audioContext.createGain() : null;
    this.sfxGain = this.audioContext ? this.audioContext.createGain() : null;
    
    if (this.masterGain && this.sfxGain) {
      this.masterGain.connect(this.gainNode);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.gain.value = this.masterVolume;
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }
  
  /**
   * 设置主音量
   * @param {number} volume - 音量值 (0-1)
   */
  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain) {
      this.masterGain.gain.value = this.masterVolume;
    }
  }
  
  /**
   * 获取主音量
   * @returns {number} 当前主音量
   */
  getMasterVolume() {
    return this.masterVolume;
  }
  
  /**
   * 设置音效音量
   * @param {number} volume - 音效音量值 (0-1)
   */
  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.sfxVolume;
    }
  }
  
  /**
   * 获取音效音量
   * @returns {number} 当前音效音量
   */
  getSfxVolume() {
    return this.sfxVolume;
  }
  
  /**
   * 切换音效开关
   * @param {boolean} enabled - 是否启用音效
   */
  setAudioEnabled(enabled) {
    this.audioEnabled = enabled;
    if (this.audioContext) {
      if (enabled && this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }
    }
  }
  
  /**
   * 检查音效是否启用
   * @returns {boolean} 是否启用音效
   */
  isAudioEnabled() {
    return this.audioEnabled && this.audioContext;
  }
  
  /**
   * 播放跳跃音效
   * @param {boolean} isDoubleJump - 是否为二段跳
   */
  playJump(isDoubleJump = false) {
    if (!this.isAudioEnabled()) return;
    
    const now = this.audioContext.currentTime;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    if (isDoubleJump) {
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(440, now);
      oscillator.frequency.exponentialRampToValueAtTime(660, now + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(330, now + 0.3);
      
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      oscillator.start(now);
      oscillator.stop(now + 0.4);
    } else {
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(330, now);
      oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.08);
      oscillator.frequency.exponentialRampToValueAtTime(220, now + 0.25);
      
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      
      oscillator.start(now);
      oscillator.stop(now + 0.35);
    }
  }
  
  /**
   * 播放落地音效
   */
  playLand() {
    if (!this.isAudioEnabled()) return;
    
    const now = this.audioContext.currentTime;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(150, now);
    oscillator.frequency.exponentialRampToValueAtTime(80, now + 0.1);
    
    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    oscillator.start(now);
    oscillator.stop(now + 0.2);
    
    const noise = this.createNoise();
    const noiseGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.15);
    
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    noise.start(now);
    noise.stop(now + 0.15);
  }
  
  /**
   * 播放碰撞音效
   */
  playCollision() {
    if (!this.isAudioEnabled()) return;
    
    const now = this.audioContext.currentTime;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(180, now);
    oscillator.frequency.exponentialRampToValueAtTime(60, now + 0.15);
    
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    
    oscillator.start(now);
    oscillator.stop(now + 0.4);
    
    const noise = this.createNoise();
    const noiseGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.frequency.exponentialRampToValueAtTime(100, now + 0.2);
    
    noiseGain.gain.setValueAtTime(0.12, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    
    noise.start(now);
    noise.stop(now + 0.2);
  }
  
  /**
   * 播放道具拾取音效
   * @param {string} itemType - 道具类型 (coffee/apple)
   */
  playItemCollect(itemType) {
    if (!this.isAudioEnabled()) return;
    
    const now = this.audioContext.currentTime;
    
    if (itemType === 'coffee') {
      const oscillator1 = this.audioContext.createOscillator();
      const oscillator2 = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator1.connect(gainNode);
      oscillator2.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      oscillator1.type = 'sine';
      oscillator1.frequency.setValueAtTime(523, now);
      oscillator1.frequency.setValueAtTime(659, now + 0.1);
      oscillator1.frequency.setValueAtTime(784, now + 0.2);
      
      oscillator2.type = 'triangle';
      oscillator2.frequency.setValueAtTime(262, now);
      oscillator2.frequency.setValueAtTime(330, now + 0.1);
      oscillator2.frequency.setValueAtTime(392, now + 0.2);
      
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      
      oscillator1.start(now);
      oscillator1.stop(now + 0.5);
      oscillator2.start(now);
      oscillator2.stop(now + 0.5);
    } else {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.sfxGain);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(440, now);
      oscillator.frequency.setValueAtTime(554, now + 0.08);
      oscillator.frequency.setValueAtTime(659, now + 0.16);
      oscillator.frequency.setValueAtTime(880, now + 0.24);
      
      gainNode.gain.setValueAtTime(0.12, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      
      oscillator.start(now);
      oscillator.stop(now + 0.4);
    }
  }
  
  /**
   * 播放滑行音效
   */
  playSlide() {
    if (!this.isAudioEnabled()) return;
    
    const now = this.audioContext.currentTime;
    
    const noise = this.createNoise();
    const noiseGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1500, now);
    filter.Q.setValueAtTime(10, now);
    
    noiseGain.gain.setValueAtTime(0.06, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    
    noise.start(now);
    noise.stop(now + 0.3);
  }
  
  /**
   * 播放闪现音效
   */
  playFlash() {
    if (!this.isAudioEnabled()) return;
    
    const now = this.audioContext.currentTime;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, now);
    oscillator.frequency.exponentialRampToValueAtTime(1760, now + 0.1);
    oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.2);
    
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    
    oscillator.start(now);
    oscillator.stop(now + 0.25);
    
    const noise = this.createNoise();
    const noiseGain = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, now);
    
    noiseGain.gain.setValueAtTime(0.1, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    
    noise.start(now);
    noise.stop(now + 0.15);
  }
  
  /**
   * 播放游戏开始音效
   */
  playGameStart() {
    if (!this.isAudioEnabled()) return;
    
    const now = this.audioContext.currentTime;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(262, now);
    oscillator.frequency.setValueAtTime(330, now + 0.1);
    oscillator.frequency.setValueAtTime(392, now + 0.2);
    oscillator.frequency.setValueAtTime(523, now + 0.3);
    
    gainNode.gain.setValueAtTime(0.15, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    
    oscillator.start(now);
    oscillator.stop(now + 0.5);
  }
  
  /**
   * 播放游戏结束音效
   */
  playGameOver() {
    if (!this.isAudioEnabled()) return;
    
    const now = this.audioContext.currentTime;
    
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.sfxGain);
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(330, now);
    oscillator.frequency.setValueAtTime(294, now + 0.15);
    oscillator.frequency.setValueAtTime(262, now + 0.3);
    oscillator.frequency.setValueAtTime(220, now + 0.45);
    
    gainNode.gain.setValueAtTime(0.18, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
    
    oscillator.start(now);
    oscillator.stop(now + 0.6);
  }
  
  /**
   * 创建白噪声生成器
   * @returns {AudioBufferSourceNode} 噪声源节点
   */
  createNoise() {
    const bufferSize = this.audioContext.sampleRate * 0.5;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const output = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    
    return noise;
  }
  
  /**
   * 销毁音效管理器
   */
  destroy() {
    if (this.audioContext) {
      this.audioContext.close();
    }
    this.activeSounds = [];
  }
}

/**
 * 音效类型枚举
 */
export const SoundType = {
  JUMP: 'jump',
  DOUBLE_JUMP: 'doubleJump',
  LAND: 'land',
  COLLISION: 'collision',
  ITEM_COLLECT: 'itemCollect',
  SLIDE: 'slide',
  FLASH: 'flash',
  GAME_START: 'gameStart',
  GAME_OVER: 'gameOver'
};
