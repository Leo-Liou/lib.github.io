// met-art-automation.js
const fs = require('fs');

class MetArtAutomation {
    constructor() {
        this.baseURL = 'https://collectionapi.metmuseum.org/public/collection/v1';
        this.processedIds = new Set();
    }

    // 搜索欧洲绘画部的精选作品
    async searchHighlightPaintings(limit = 30) {
        try {
            console.log('🔍 搜索大都会博物馆精选绘画...');
            const searchUrl = `${this.baseURL}/search?isHighlight=true&departmentId=11&hasImages=true&q=painting`;
            const response = await fetch(searchUrl);
            
            if (!response.ok) throw new Error(`API请求失败: ${response.status}`);
            
            const data = await response.json();
            console.log(`✅ 找到 ${data.total} 件精选作品，处理前 ${limit} 件`);
            
            return data.objectIDs.slice(0, limit);
        } catch (error) {
            console.error('❌ 搜索失败:', error.message);
            return [];
        }
    }

    // 获取单件作品详情
    async getArtworkDetails(objectID) {
        try {
            const objectUrl = `${this.baseURL}/objects/${objectID}`;
            const response = await fetch(objectUrl);
            
            if (!response.ok) throw new Error(`获取作品详情失败: ${response.status}`);
            
            const data = await response.json();
            
            // 验证数据完整性
            if (!data.primaryImage || !data.title || !data.artistDisplayName) {
                throw new Error('作品数据不完整，跳过');
            }
            
            return data;
        } catch (error) {
            console.log(`❌ 获取作品 ${objectID} 失败:`, error.message);
            return null;
        }
    }

    // 生成中文描述
    generateChineseDescription(metData) {
        const artist = metData.artistDisplayName || '未知艺术家';
        const title = metData.title;
        const date = metData.objectDate || '创作年代未知';
        const medium = metData.medium || '材质未知';
        
        let description = `《${title}》是${artist}的${medium}作品`;
        
        if (metData.objectBeginDate) {
            description += `，创作于${metData.objectBeginDate}年前后`;
        }
        
        if (metData.tags && metData.tags.length > 0) {
            const tags = metData.tags.map(tag => tag.term).slice(0, 3);
            description += `。作品主题涉及${tags.join('、')}`;
        }
        
        description += '。这件作品现藏于纽约大都会艺术博物馆。';
        
        return description;
    }

    // 推断艺术流派
    inferArtStyle(metData) {
        const styleMap = {
            'Oil on canvas': '油画',
            'Watercolor': '水彩画', 
            'Tempera': '蛋彩画',
            'Fresco': '湿壁画',
            'Ink': '水墨画'
        };
        
        // 根据材质推断基础类型
        const medium = metData.medium || '';
        let style = '绘画';
        
        for (const [key, value] of Object.entries(styleMap)) {
            if (medium.includes(key)) {
                style = value;
                break;
            }
        }
        
        // 根据年代推断流派
        const year = metData.objectBeginDate;
        if (year) {
            if (year >= 1870 && year <= 1900) style += ' · 印象派';
            else if (year >= 1900 && year <= 1950) style += ' · 现代主义';
            else if (year >= 1400 && year <= 1600) style += ' · 文艺复兴';
        }
        
        return style;
    }

    // 转换数据格式
    transformToLocalFormat(metData) {
        return {
            imageUrl: metData.primaryImage,
            title: metData.title,
            artist: metData.artistDisplayName,
            year: metData.objectBeginDate ? metData.objectBeginDate.toString() : metData.objectDate || '未知',
            style: this.inferArtStyle(metData),
            description: this.generateChineseDescription(metData),
            // 扩展字段
            metadata: {
                museum: '大都会艺术博物馆',
                objectID: metData.objectID,
                isPublicDomain: metData.isPublicDomain,
                department: metData.department
            }
        };
    }

    // 去重检查
    isDuplicate(artwork, existingPaintings) {
        return existingPaintings.some(painting => 
            painting.title === artwork.title && 
            painting.artist === artwork.artist
        );
    }

    // 主执行函数
    async runAutomation() {
        console.log('🎨 开始自动化充实名画数据库...\n');
        
        // 读取现有数据
        let existingPaintings = [];
        try {
            const existingData = fs.readFileSync('paintings.js', 'utf8');
            const match = existingData.match(/const paintings = (\[.*?\]);/s);
            if (match) {
                existingPaintings = eval(`(${match[1]})`);
                console.log(`📊 现有数据库包含 ${existingPaintings.length} 件作品`);
            }
        } catch (error) {
            console.log('ℹ️ 未找到现有数据文件，将创建新数据库');
        }

        // 获取作品ID列表
        const artworkIDs = await this.searchHighlightPaintings(20);
        if (artworkIDs.length === 0) {
            console.log('❌ 未找到可处理的作品ID');
            return;
        }

        const newPaintings = [];
        
        // 逐个获取作品详情
        for (let i = 0; i < artworkIDs.length; i++) {
            const objectID = artworkIDs[i];
            console.log(`\n📥 处理作品 ${i + 1}/${artworkIDs.length} (ID: ${objectID})`);
            
            const artworkData = await this.getArtworkDetails(objectID);
            if (!artworkData) continue;
            
            const transformedData = this.transformToLocalFormat(artworkData);
            
            // 去重检查
            if (this.isDuplicate(transformedData, existingPaintings)) {
                console.log(`⏭️ 跳过重复作品: ${transformedData.title}`);
                continue;
            }
            
            newPaintings.push(transformedData);
            console.log(`✅ 添加: ${transformedData.title} - ${transformedData.artist}`);
            
            // 请求间隔，避免对API造成压力
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        if (newPaintings.length === 0) {
            console.log('\nℹ️ 没有新增作品，数据库已是最新');
            return;
        }

        // 合并数据
        const allPaintings = [...existingPaintings, ...newPaintings];
        
        // 生成新的JavaScript文件
        const jsContent = `// 自动化生成的名画数据库 - 最后更新: ${new Date().toLocaleString('zh-CN')}
// 数据来源: 大都会艺术博物馆Open Access API
// 作品数量: ${allPaintings.length}件

const paintings = ${JSON.stringify(allPaintings, null, 2)};

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = paintings;
}`;

        // 保存文件
        fs.writeFileSync('paintings-enhanced.js', jsContent);
        
        console.log('\n🎉 自动化充实完成!');
        console.log(`📈 新增作品: ${newPaintings.length}件`);
        console.log(`📂 总作品数: ${allPaintings.length}件`);
        console.log(`💾 数据已保存至: paintings-enhanced.js`);
    }
}

// 执行自动化
const automator = new MetArtAutomation();
automator.runAutomation().catch(console.error);
