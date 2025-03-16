/**
 * 局域网测速软件服务端入口文件
 */

const fs = require('fs');
const path = require('path');
const { createServer } = require('./src/server-dir/http-server');
const { createSocketServer } = require('./src/server-dir/socket-server');
const logger = require('./src/utils/logger');
const config = require('./src/config/config');

// 确保日志目录存在
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 打印启动信息
logger.info('=== 局域网测速软件服务端 ===');
logger.info(`版本: 1.0.0`);
logger.info(`配置: 端口=${config.server.port}, 最大速度=${config.speedTest.maxSpeed}MB/s`);

// 创建HTTP服务器
const httpServer = createServer();

// 创建Socket.io服务器
const io = createSocketServer(httpServer);

// 处理进程退出
process.on('SIGINT', () => {
  logger.info('接收到SIGINT信号，正在关闭服务器...');
  httpServer.close(() => {
    logger.info('HTTP服务器已关闭');
    process.exit(0);
  });
});

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  logger.error(`未捕获的异常: ${err.message}`);
  logger.error(err.stack);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝');
  logger.error(reason);
});

// 打印服务器地址信息
const interfaces = require('os').networkInterfaces();
logger.info('可用的服务器地址:');
for (const name of Object.keys(interfaces)) {
  for (const iface of interfaces[name]) {
    // 跳过内部和非IPv4地址
    if (iface.internal || iface.family !== 'IPv4') continue;
    logger.info(`- http://${iface.address}:${config.server.port}`);
  }
}

// 打印客户端访问信息
logger.info('');
logger.info('客户端访问信息:');
logger.info('1. 在浏览器中访问以上任一地址即可打开测速客户端');
logger.info('2. 客户端会自动连接到服务器并进行测速');
logger.info('3. 服务器已自动托管客户端网页，无需单独部署客户端');
logger.info('');
logger.info('服务器已准备就绪，等待客户端连接...');
