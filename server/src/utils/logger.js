/**
 * 日志工具
 */

const winston = require('winston');
const path = require('path');
const fs = require('fs');
const config = require('../config/config');

// 创建日志目录
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// 创建日志记录器
const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
  ),
  transports: [
    // 控制台输出
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(info => `${info.timestamp} ${info.level}: ${info.message}`)
      )
    }),
    // 文件输出
    new winston.transports.File({ 
      filename: path.join(logDir, config.logging.filename),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  ]
});

module.exports = logger;
