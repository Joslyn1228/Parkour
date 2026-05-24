/**
 * 音量控制组件
 * 
 * 提供音量滑块和静音按钮功能
 */
export class VolumeControl {
  /**
   * 构造函数
   * @param {object} audioManager - 音效管理器
   * @param {Canvas} canvas - 画布元素
   */
  constructor(audioManager, canvas) {
    this.audioManager = audioManager;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.x = 0;
    this.y = 0;
    this.width = 120;
    this.height = 40;
    
    this.volume = audioManager.getSfxVolume();
    this.isMuted = this.volume === 0;
    
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartVolume = 0;
    
    this.setupEventListeners();
  }
  
  /**
   * 设置位置
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   */
  setPosition(x, y) {
    this.x = x;
    this.y = y;
  }
  
  /**
   * 设置尺寸
   * @param {number} width - 宽度
   * @param {number} height - 高度
   */
  setSize(width, height) {
    this.width = width;
    this.height = height;
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
    this.canvas.addEventListener('mouseleave', (e) => this.handleMouseUp(e));
  }
  
  /**
   * 处理鼠标按下事件
   * @param {MouseEvent} e - 鼠标事件
   */
  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检查是否点击静音按钮
    if (this.isMuteButtonClicked(x, y)) {
      this.toggleMute();
      return;
    }
    
    // 检查是否点击滑块
    if (this.isSliderClicked(x, y)) {
      this.isDragging = true;
      this.dragStartX = x;
      this.dragStartVolume = this.volume;
      this.updateVolumeFromPosition(x);
    }
  }
  
  /**
   * 处理鼠标移动事件
   * @param {MouseEvent} e - 鼠标事件
   */
  handleMouseMove(e) {
    if (!this.isDragging) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    
    this.updateVolumeFromPosition(x);
  }
  
  /**
   * 处理鼠标释放事件
   * @param {MouseEvent} e - 鼠标事件
   */
  handleMouseUp(e) {
    this.isDragging = false;
  }
  
  /**
   * 检查是否点击静音按钮
   * @param {number} x - 鼠标X坐标
   * @param {number} y - 鼠标Y坐标
   * @returns {boolean} 是否点击静音按钮
   */
  isMuteButtonClicked(x, y) {
    const buttonX = this.x;
    const buttonY = this.y;
    const buttonSize = this.height;
    
    return x >= buttonX && x <= buttonX + buttonSize &&
           y >= buttonY && y <= buttonY + buttonSize;
  }
  
  /**
   * 检查是否点击滑块
   * @param {number} x - 鼠标X坐标
   * @param {number} y - 鼠标Y坐标
   * @returns {boolean} 是否点击滑块
   */
  isSliderClicked(x, y) {
    const sliderX = this.x + this.height + 8;
    const sliderY = this.y + (this.height - 12) / 2;
    const sliderWidth = this.width - this.height - 8;
    const sliderHeight = 12;
    
    return x >= sliderX && x <= sliderX + sliderWidth &&
           y >= sliderY && y <= sliderY + sliderHeight;
  }
  
  /**
   * 根据位置更新音量
   * @param {number} x - 鼠标X坐标
   */
  updateVolumeFromPosition(x) {
    const sliderX = this.x + this.height + 8;
    const sliderWidth = this.width - this.height - 8;
    
    let newVolume = (x - sliderX) / sliderWidth;
    newVolume = Math.max(0, Math.min(1, newVolume));
    
    this.setVolume(newVolume);
  }
  
  /**
   * 设置音量
   * @param {number} volume - 音量值 (0-1)
   */
  setVolume(volume) {
    this.volume = volume;
    this.isMuted = volume === 0;
    this.audioManager.setSfxVolume(volume);
  }
  
  /**
   * 获取当前音量
   * @returns {number} 当前音量
   */
  getVolume() {
    return this.volume;
  }
  
  /**
   * 切换静音状态
   */
  toggleMute() {
    if (this.isMuted) {
      this.setVolume(this.lastVolume || 0.8);
    } else {
      this.lastVolume = this.volume;
      this.setVolume(0);
    }
  }
  
  /**
   * 渲染音量控制组件
   */
  render() {
    this.ctx.save();
    this.ctx.imageSmoothingEnabled = false;
    
    // 渲染静音按钮背景
    this.ctx.fillStyle = this.isMuted ? '#ff6b6b' : '#636e72';
    this.ctx.fillRect(this.x, this.y, this.height, this.height);
    
    // 渲染静音按钮边框
    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(this.x + 3, this.y + 3, this.height - 6, this.height - 6);
    
    // 渲染音量图标
    this.renderVolumeIcon();
    
    // 渲染滑块背景
    const sliderX = this.x + this.height + 8;
    const sliderY = this.y + (this.height - 12) / 2;
    const sliderWidth = this.width - this.height - 8;
    
    this.ctx.fillStyle = '#2d3436';
    this.ctx.fillRect(sliderX, sliderY, sliderWidth, 12);
    
    // 渲染滑块填充
    const fillWidth = sliderWidth * this.volume;
    const gradient = this.ctx.createLinearGradient(sliderX, sliderY, sliderX + sliderWidth, sliderY);
    gradient.addColorStop(0, '#00b894');
    gradient.addColorStop(1, '#00cec9');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(sliderX, sliderY, fillWidth, 12);
    
    // 渲染滑块边框
    this.ctx.strokeStyle = '#636e72';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(sliderX, sliderY, sliderWidth, 12);
    
    // 渲染滑块手柄
    const handleX = sliderX + fillWidth - 6;
    this.ctx.fillStyle = '#ffeaa7';
    this.ctx.fillRect(handleX, sliderY - 2, 12, 16);
    
    this.ctx.restore();
  }
  
  /**
   * 渲染音量图标
   */
  renderVolumeIcon() {
    const iconX = this.x + this.height / 2;
    const iconY = this.y + this.height / 2;
    const iconSize = this.height - 12;
    
    this.ctx.fillStyle = '#ffeaa7';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    if (this.isMuted || this.volume === 0) {
      // 静音图标
      this.ctx.font = `${iconSize}px Arial`;
      this.ctx.fillText('🔇', iconX, iconY);
    } else if (this.volume < 0.5) {
      // 低音量图标
      this.ctx.font = `${iconSize}px Arial`;
      this.ctx.fillText('🔈', iconX, iconY);
    } else {
      // 高音量图标
      this.ctx.font = `${iconSize}px Arial`;
      this.ctx.fillText('🔊', iconX, iconY);
    }
  }
  
  /**
   * 销毁组件
   */
  destroy() {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
  }
}
