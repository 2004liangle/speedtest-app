/**
 * HTTP服务器
 */

const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const config = require('../config/config');
const logger = require('../utils/logger');
const clientManager = require('../services/client-manager');

// 创建Express应用
const app = express();

// 启用CORS
app.use(cors());

// 解析JSON请求体
app.use(express.json());

// 提供静态文件
app.use(express.static(path.join(__dirname, '../../../client')));

// 设置根路由，重定向到客户端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../../../client/index.html'));
});

// API路由
const apiRouter = express.Router();

// 获取服务器信息
apiRouter.get('/server-info', (req, res) => {
  res.json({
    name: 'SpeedTest Server',
    version: '1.0.0',
    maxSpeed: config.speedTest.maxSpeed,
    uploadTestDuration: config.speedTest.uploadTestDuration,
    downloadTestDuration: config.speedTest.downloadTestDuration
  });
});

// 获取连接的客户端列表
apiRouter.get('/clients', (req, res) => {
  res.json({
    clients: clientManager.getAllClients()
  });
});

// 获取测试结果
apiRouter.get('/results', (req, res) => {
  res.json({
    results: clientManager.getAllTestResults()
  });
});

// 使用API路由
app.use('/api', apiRouter);

// 处理404
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 创建HTTP服务器
function createServer() {
  const server = http.createServer(app);
  
  // 启动服务器
  server.listen(config.server.port, config.server.host, () => {
    logger.info(`HTTP服务器已启动: http://${config.server.host === '0.0.0.0' ? 'localhost' : config.server.host}:${config.server.port}`);
  });
  
  // 错误处理
  server.on('error', (err) => {
    logger.error(`HTTP服务器错误: ${err.message}`);
    if (err.code === 'EADDRINUSE') {
      logger.error(`端口 ${config.server.port} 已被占用`);
    }
  });
  
  return server;
}

module.exports = {
  createServer
};
