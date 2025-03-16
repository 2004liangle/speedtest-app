/**
 * 客户端管理器
 */

const logger = require('../utils/logger');

class ClientManager {
  constructor() {
    // 存储所有连接的客户端
    this.clients = new Map();
    
    // 存储测试结果
    this.testResults = new Map();
  }
  
  /**
   * 添加客户端
   * @param {string} socketId - Socket.io连接ID
   * @param {Object} clientInfo - 客户端信息
   */
  addClient(socketId, clientInfo) {
    this.clients.set(socketId, {
      id: socketId,
      info: clientInfo,
      connectedAt: new Date(),
      status: 'connected'
    });
    
    // 构建日志信息，包含电脑名称（如果有）
    let logInfo = `客户端已连接: ${socketId} (${clientInfo.ip})`;
    if (clientInfo.computerName) {
      logInfo += ` - 电脑: ${clientInfo.computerName}`;
    }
    
    logger.info(logInfo);
    return this.clients.get(socketId);
  }
  
  /**
   * 移除客户端
   * @param {string} socketId - Socket.io连接ID
   */
  removeClient(socketId) {
    const client = this.clients.get(socketId);
    if (client) {
      // 构建日志信息，包含电脑名称（如果有）
      let logInfo = `客户端已断开连接: ${socketId} (${client.info.ip})`;
      if (client.info.computerName) {
        logInfo += ` - 电脑: ${client.info.computerName}`;
      }
      
      logger.info(logInfo);
      this.clients.delete(socketId);
    }
  }
  
  /**
   * 获取客户端
   * @param {string} socketId - Socket.io连接ID
   * @returns {Object|undefined} - 客户端对象或undefined
   */
  getClient(socketId) {
    return this.clients.get(socketId);
  }
  
  /**
   * 获取所有客户端
   * @returns {Array} - 客户端对象数组
   */
  getAllClients() {
    return Array.from(this.clients.values());
  }
  
  /**
   * 更新客户端状态
   * @param {string} socketId - Socket.io连接ID
   * @param {string} status - 新状态
   */
  updateClientStatus(socketId, status) {
    const client = this.clients.get(socketId);
    if (client) {
      client.status = status;
      
      // 构建日志信息，包含电脑名称（如果有）
      let logInfo = `客户端状态已更新: ${socketId} (${client.info.ip}) -> ${status}`;
      if (client.info.computerName) {
        logInfo += ` - 电脑: ${client.info.computerName}`;
      }
      
      logger.info(logInfo);
    }
  }
  
  /**
   * 存储测试结果
   * @param {string} socketId - Socket.io连接ID
   * @param {string} testType - 测试类型 ('upload' 或 'download')
   * @param {Object} result - 测试结果
   */
  storeTestResult(socketId, testType, result) {
    const client = this.clients.get(socketId);
    if (!client) return;
    
    if (!this.testResults.has(socketId)) {
      this.testResults.set(socketId, {});
    }
    
    const clientResults = this.testResults.get(socketId);
    clientResults[testType] = {
      ...result,
      timestamp: new Date()
    };
    
    // 构建日志信息，包含电脑名称（如果有）
    let logInfo = `测试结果已存储: ${socketId} (${client.info.ip}) - ${testType}: ${result.averageSpeed.toFixed(2)} MB/s`;
    if (client.info.computerName) {
      logInfo += ` - 电脑: ${client.info.computerName}`;
    }
    
    logger.info(logInfo);
  }
  
  /**
   * 获取客户端的测试结果
   * @param {string} socketId - Socket.io连接ID
   * @returns {Object|undefined} - 测试结果或undefined
   */
  getClientTestResults(socketId) {
    return this.testResults.get(socketId);
  }
  
  /**
   * 获取所有测试结果
   * @returns {Array} - 测试结果数组
   */
  getAllTestResults() {
    const results = [];
    this.testResults.forEach((result, socketId) => {
      const client = this.clients.get(socketId);
      if (client) {
        results.push({
          clientId: socketId,
          clientInfo: client.info,
          results: result
        });
      }
    });
    
    return results;
  }
}

// 创建单例实例
const clientManager = new ClientManager();

module.exports = clientManager;
