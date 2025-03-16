# 局域网测速软件

一个简单易用的局域网测速工具，可以测试局域网内设备之间的网络速度。

## 功能特点

- 支持上传和下载速度测试
- 实时显示测试进度和速度
- 美观的仪表盘和图表展示
- 自动检测客户端设备信息
- 服务端自动托管客户端网页

## 服务端结构

speedtest-server/

├── package.json           # 项目依赖和脚本

├── server.js              # 主入口文件

├── src/

│   ├── config.js          # 配置文件

│   ├── server/            # 服务器相关代码

│   ├── services/          # 业务逻辑服务

│   └── utils/             # 工具函数

└── public/                # 静态文件（如有）

## 客户端结构
speedtest-client/

├── index.html             # 主HTML文件

├── css/                   # 样式文件

├── js/                    # JavaScript文件

│   ├── main.js            # 主逻辑

│   ├── socket-client.js   # 通信客户端

│   ├── speed-test.js      # 测速逻辑

│   └── components/        # UI组件

└── assets/                # 图像等资源


![image](https://github.com/user-attachments/assets/3f7d73f2-793f-420e-af1b-0db19b881f2d)
![image](https://github.com/user-attachments/assets/81d707f1-2161-4a9a-adba-b97447b7ee35)

## 快速开始

### Windows 10/11 (标准版本)
1. 下载并解压缩项目文件
2. 双击运行 `portable-server.bat`
3. 在浏览器中访问显示的URL (例如 http://192.168.1.100:3000)

### Windows 7 (兼容版本)
1. 下载并解压缩项目文件
2. 双击运行 `start-server-win7.bat`
3. 在浏览器中访问显示的URL (例如 http://192.168.1.100:3000)

## 注意事项
- 确保服务器和客户端在同一个局域网内
- 测试结果受网络环境和设备性能影响
- 服务器日志会显示连接的客户端信息和测试结果

## 故障排除
### 无法启动服务器
- 确保您有足够的权限运行脚本
- 检查防火墙设置，确保端口3000未被阻止
- 尝试使用管理员权限运行启动脚本

### 客户端无法连接到服务器
- 确保客户端和服务器在同一个局域网内
- 检查服务器的防火墙设置
- 确保使用正确的服务器IP地址和端口

### 测试速度异常
- 确保局域网内没有其他大量占用带宽的应用
- 尝试重新启动服务器和客户端
- 检查网络设备(路由器、交换机)状态
