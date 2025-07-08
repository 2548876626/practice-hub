#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简单的本地HTTP服务器
用于在本地运行学习应用，避免浏览器安全策略限制
"""

import http.server
import socketserver
import webbrowser
import os
import sys

def start_server(port=8000):
    """启动本地HTTP服务器"""
    
    # 确保在正确的目录中运行
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print(f"🚀 启动本地服务器...")
    print(f"📁 服务目录: {script_dir}")
    print(f"🌐 端口: {port}")
    
    # 创建服务器
    handler = http.server.SimpleHTTPRequestHandler
    
    # 设置MIME类型，确保正确处理各种文件
    handler.extensions_map.update({
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.html': 'text/html',
    })
    
    try:
        with socketserver.TCPServer(("", port), handler) as httpd:
            server_url = f"http://localhost:{port}"
            
            print(f"✅ 服务器启动成功!")
            print(f"🔗 访问地址: {server_url}")
            print(f"📱 主页面: {server_url}/index.html")
            print(f"🧪 图片测试: {server_url}/test_images.html")
            print(f"\n💡 提示:")
            print(f"   - 按 Ctrl+C 停止服务器")
            print(f"   - 服务器运行时请保持此窗口打开")
            print(f"   - 如果端口{port}被占用，请尝试其他端口")
            
            # 自动打开浏览器
            try:
                print(f"\n🌐 正在打开浏览器...")
                webbrowser.open(f"{server_url}/index.html")
            except Exception as e:
                print(f"⚠️  无法自动打开浏览器: {e}")
                print(f"   请手动访问: {server_url}/index.html")
            
            print(f"\n🔄 服务器运行中，等待请求...")
            print(f"=" * 50)
            
            # 启动服务器
            httpd.serve_forever()
            
    except OSError as e:
        if "Address already in use" in str(e):
            print(f"❌ 端口 {port} 已被占用")
            print(f"💡 尝试使用其他端口...")
            
            # 尝试其他端口
            for new_port in range(port + 1, port + 10):
                try:
                    start_server(new_port)
                    break
                except OSError:
                    continue
            else:
                print(f"❌ 无法找到可用端口，请手动指定端口")
                sys.exit(1)
        else:
            print(f"❌ 启动服务器失败: {e}")
            sys.exit(1)
    
    except KeyboardInterrupt:
        print(f"\n\n🛑 服务器已停止")
        print(f"👋 感谢使用!")

if __name__ == "__main__":
    # 检查命令行参数
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"❌ 无效的端口号: {sys.argv[1]}")
            print(f"💡 使用方法: python start_server.py [端口号]")
            print(f"💡 示例: python start_server.py 8080")
            sys.exit(1)
    
    start_server(port)
