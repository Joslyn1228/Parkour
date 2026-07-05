/**
 * 公告管理器 - 从服务器拉取开发者公告并跟踪已读状态
 */
export class AnnouncementManager {
  static STORAGE_KEY = 'pixelRunner_readAnnouncementIds';
  static DEFAULT_ANNOUNCEMENTS = [
    {
      id: '2026-07-05-update',
      title: '版本更新',
      content: '新增皮肤系统、四套背景主题、下蹲奖励与咖啡倍率叠加！',
      date: '2026-07-05'
    }
  ];

  constructor() {
    this.announcements = [];
    this.readIds = this.loadReadIds();
  }

  async fetchAnnouncements() {
    try {
      const response = await fetch('/api/announcements');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        this.announcements = data;
        return this.announcements;
      }
    } catch (error) {
      console.warn('[AnnouncementManager] 拉取公告失败，使用本地默认:', error.message);
    }

    this.announcements = [...AnnouncementManager.DEFAULT_ANNOUNCEMENTS];
    return this.announcements;
  }

  getAnnouncements() {
    return this.announcements;
  }

  hasUnread() {
    return this.announcements.some(item => !this.readIds.includes(item.id));
  }

  getUnreadCount() {
    return this.announcements.filter(item => !this.readIds.includes(item.id)).length;
  }

  markAllRead() {
    const ids = this.announcements.map(item => item.id);
    this.readIds = [...new Set([...this.readIds, ...ids])];
    this.saveReadIds();
  }

  markAsRead(id) {
    if (!id || this.readIds.includes(id)) return;
    this.readIds.push(id);
    this.saveReadIds();
  }

  isRead(id) {
    return this.readIds.includes(id);
  }

  loadReadIds() {
    try {
      const saved = localStorage.getItem(AnnouncementManager.STORAGE_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('[AnnouncementManager] 读取已读状态失败:', error.message);
      return [];
    }
  }

  saveReadIds() {
    try {
      localStorage.setItem(AnnouncementManager.STORAGE_KEY, JSON.stringify(this.readIds));
    } catch (error) {
      console.warn('[AnnouncementManager] 保存已读状态失败:', error.message);
    }
  }
}
