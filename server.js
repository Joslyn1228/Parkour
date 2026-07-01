const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

// 加载环境变量
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// 配置环境变量
const PORT = process.env.PORT || 3333;
const NODE_ENV = process.env.NODE_ENV || 'development';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || '*';

// CORS 配置
const corsOptions = {
  origin: NODE_ENV === 'production' 
    ? CLIENT_ORIGIN.split(',').map(o => o.trim())
    : '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling']
});

app.use(cors(corsOptions));
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

function broadcastLeaderboard() {
  io.emit('leaderboardUpdate', leaderboard);
}

let leaderboard = loadLeaderboard();

io.on('connection', (socket) => {
  if (NODE_ENV === 'development') {
    console.log('客户端已连接:', socket.id);
  }
  
  socket.emit('leaderboardUpdate', leaderboard);
  
  socket.on('disconnect', () => {
    if (NODE_ENV === 'development') {
      console.log('客户端已断开连接:', socket.id);
    }
  });
});

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
  
  broadcastLeaderboard();
  
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
  broadcastLeaderboard();
  res.json({ success: true, message: '排行榜已清空' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`环境: ${NODE_ENV}`);
});