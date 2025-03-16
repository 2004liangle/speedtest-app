/**
 * Socket.io服务器
 */

const socketIo = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');
const clientManager = require('../services/client-manager');
const speedTest = require('../services/speed-test');

/**
 * 创建Socket.io服务器
 * @param {Object} httpServer - HTTP服务器实例
 * @returns {Object} - Socket.io服务器实例
 */
function createSocketServer(httpServer) {
  // 创建Socket.io服务器
  const io = socketIo(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    maxHttpBufferSize: 10e6 // 10MB
  });
  
  // 连接事件处理
  io.on('connection', (socket) => {
    logger.info(`新的Socket连接: ${socket.id}`);
    
    // 客户端注册
    socket.on('register', (data) => {
      const clientInfo = {
        ip: socket.handshake.address,
        userAgent: socket.handshake.headers['user-agent'],
        ...data
      };
      
      // 添加客户端
      const client = clientManager.addClient(socket.id, clientInfo);
      
      // 发送确认
      socket.emit('register_ack', {
        clientId: socket.id,
        serverTime: new Date().toISOString()
      });
      
      // 广播客户端列表更新
      io.emit('clients_updated', {
        clients: clientManager.getAllClients()
      });
    });
    
    // 开始测试
    socket.on('test_start', (data) => {
      const { type } = data;
      const testId = uuidv4();
      
      logger.info(`收到测试请求: ${socket.id}, 类型: ${type}`);
      
      if (type === 'upload') {
        speedTest.startUploadTest(socket, testId);
      } else if (type === 'download') {
        speedTest.startDownloadTest(socket, testId);
      } else if (type === 'both') {
        // 先进行上传测试，然后进行下载测试
        speedTest.startUploadTest(socket, testId + '-upload');
        
        // 监听上传测试结果，然后开始下载测试
        const uploadResultHandler = (result) => {
          if (result.testId === testId + '-upload') {
            // 移除监听器
            socket.removeListener('test_result', uploadResultHandler);
            
            // 延迟1秒后开始下载测试
            setTimeout(() => {
              speedTest.startDownloadTest(socket, testId + '-download');
            }, 1000);
          }
        };
        
        socket.on('test_result', uploadResultHandler);
      } else {
        socket.emit('error', {
          message: `不支持的测试类型: ${type}`
        });
      }
    });
    
    // 断开连接
    socket.on('disconnect', () => {
      logger.info(`Socket断开连接: ${socket.id}`);
      
      // 移除客户端
      clientManager.removeClient(socket.id);
      
      // 广播客户端列表更新
      io.emit('clients_updated', {
        clients: clientManager.getAllClients()
      });
    });
  });
  
  logger.info('Socket.io服务器已启动');
  
  return io;
}

module.exports = {
  createSocketServer
};
