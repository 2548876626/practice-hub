#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
图片下载脚本
用于下载计算题中的图片到本地
"""

import os
import json
import requests
from urllib.parse import urlparse
import time

def download_image(url, local_path):
    """下载单个图片"""
    try:
        print(f"正在下载: {url}")
        
        # 设置请求头，模拟浏览器访问
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://mooc1-1.chaoxing.com/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        }
        
        # 发送请求
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()
        
        # 创建目录（如果不存在）
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        
        # 保存图片
        with open(local_path, 'wb') as f:
            f.write(response.content)
        
        print(f"✅ 下载成功: {local_path}")
        return True
        
    except Exception as e:
        print(f"❌ 下载失败: {url}")
        print(f"   错误信息: {str(e)}")
        return False

def main():
    """主函数"""
    print("🚀 开始下载计算题图片...")
    
    # 创建images目录
    images_dir = "images"
    os.makedirs(images_dir, exist_ok=True)
    
    # 读取题目数据
    with open('gongpeidian_calculation_questions.json', 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    download_count = 0
    success_count = 0
    
    # 遍历题目，下载图片
    for question in questions:
        question_id = question['id']
        
        # 处理单个图片 (hasImage + imageUrl)
        if question.get('hasImage') and question.get('imageUrl'):
            url = question['imageUrl']
            # 从URL中提取文件名
            parsed_url = urlparse(url)
            filename = os.path.basename(parsed_url.path)
            if not filename or '.' not in filename:
                filename = f"question_{question_id}.png"
            
            local_path = os.path.join(images_dir, filename)
            download_count += 1
            
            if download_image(url, local_path):
                success_count += 1
                # 更新JSON中的路径
                question['imageUrl'] = f"images/{filename}"
            
            # 添加延迟，避免请求过快
            time.sleep(1)
        
        # 处理多个图片 (imageUrls数组)
        if question.get('imageUrls'):
            new_image_urls = []
            for i, url in enumerate(question['imageUrls']):
                # 从URL中提取文件名
                parsed_url = urlparse(url)
                filename = os.path.basename(parsed_url.path)
                if not filename or '.' not in filename:
                    filename = f"question_{question_id}_{i+1}.png"
                
                local_path = os.path.join(images_dir, filename)
                download_count += 1
                
                if download_image(url, local_path):
                    success_count += 1
                    new_image_urls.append(f"images/{filename}")
                else:
                    new_image_urls.append(url)  # 保留原URL作为备用
                
                # 添加延迟，避免请求过快
                time.sleep(1)
            
            # 更新JSON中的路径
            question['imageUrls'] = new_image_urls
    
    # 保存更新后的JSON文件
    if success_count > 0:
        backup_file = 'gongpeidian_calculation_questions_backup.json'
        print(f"\n📋 备份原文件到: {backup_file}")
        
        # 备份原文件
        with open('gongpeidian_calculation_questions.json', 'r', encoding='utf-8') as f:
            original_data = f.read()
        with open(backup_file, 'w', encoding='utf-8') as f:
            f.write(original_data)
        
        # 保存更新后的文件
        with open('gongpeidian_calculation_questions.json', 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        
        print(f"✅ 已更新JSON文件，图片路径已改为本地路径")
    
    # 输出统计信息
    print(f"\n📊 下载统计:")
    print(f"   总计图片: {download_count}")
    print(f"   成功下载: {success_count}")
    print(f"   失败数量: {download_count - success_count}")
    
    if success_count == download_count:
        print("\n🎉 所有图片下载完成！")
    elif success_count > 0:
        print(f"\n⚠️  部分图片下载成功，请检查失败的图片")
    else:
        print(f"\n❌ 所有图片下载失败，请检查网络连接")

if __name__ == "__main__":
    main()
