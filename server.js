const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const DATA_FILE = path.join(__dirname, 'leaderboard.json');

function loadLeaderboard() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('读取排行榜数据失败:', error);
      return [];
    }
  }
  return [];
}

function saveLeaderboard(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('保存排行榜数据失败:', error);
    return false;
  }
}

let leaderboard = loadLeaderboard();

app.get('/api/leaderboard', (req, res) => {
  res.json(leaderboard);
});

app.post('/api/leaderboard', (req, res) => {
  const { nickname, score } = req.body;
  
  if (!nickname || typeof score !== 'number') {
    return res.status(400).json({ success: false, message: '无效的参数' });
  }
  
  const trimmedNickname = nickname.trim();
  if (trimmedNickname.length < 2 || trimmedNickname.length > 12) {
    return res.status(400).json({ success: false, message: '昵称长度必须在2-12个字符之间' });
  }
  
  const existingIndex = leaderboard.findIndex(entry => entry.nickname === trimmedNickname);
  
  if (existingIndex !== -1) {
    if (score > leaderboard[existingIndex].score) {
      leaderboard[existingIndex].score = score;
      leaderboard[existingIndex].timestamp = Date.now();
    }
  } else {
    leaderboard.push({
      nickname: trimmedNickname,
      score: score,
      timestamp: Date.now()
    });
  }
  
  leaderboard.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.timestamp - b.timestamp;
  });
  
  leaderboard = leaderboard.slice(0, 10);
  
  saveLeaderboard(leaderboard);
  
  const rank = leaderboard.findIndex(entry => entry.nickname === trimmedNickname) + 1;
  
  res.json({
    success: true,
    rank: rank,
    leaderboard: leaderboard
  });
});

app.get('/api/leaderboard/clear', (req, res) => {
  leaderboard = [];
  saveLeaderboard(leaderboard);
  res.json({ success: true, message: '排行榜已清空' });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});