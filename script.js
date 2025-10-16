// 1. 名画数据数组：这里存放所有名画的信息
const paintings = [
    {
        imageUrl: 'images/Generated Image.png', // 替换为你的图片路径
        title: '星月夜',
        artist: '文森特·梵高',
        year: '1889',
        style: '后印象派',
        description: '这幅画描绘了一个夸张化与充满强烈表现力的星空下的村庄。'
    },
    {
        imageUrl: 'images/washington.jpg',
        title: 'Washington Crossing the Delaware',
        artist: 'Emanuel Leutze',
        year: '1851',
        style: 'based on a photograph',
        description: '引发关于政治思想的思辩'
    },
    {
        imageUrl: 'images/The scream.jpg',
        title: '呐喊',
        artist: '爱德华·蒙克',
        year: '1893',
        style: '表现主义',
        description: '作品展现了桥上一个人因焦虑而呐喊的瞬间，是表现主义绘画的标志性作品。'
    }
    // ... 你可以继续在这里添加更多名画数据
];

// 在定义完数据后添加调试代码，检查数据
console.log('图片数据总数:', paintings.length);
console.log('第一幅画数据:', paintings[0]);

// 2. 获取网页上的元素
const paintingImage = document.getElementById('painting-image');
const paintingCaption = document.getElementById('painting-caption');
const refreshButton = document.getElementById('refresh-btn');
const autoRefreshButton = document.getElementById('auto-refresh-btn');

// 用于更新信息表格的元素
const infoTitle = document.getElementById('info-title');
const infoArtist = document.getElementById('info-artist');
const infoYear = document.getElementById('info-year');
const infoStyle = document.getElementById('info-style');
const infoDesc = document.getElementById('info-desc');

// 3. 随机选择一幅画并更新页面的函数
function getRandomPainting() {
    // 生成一个随机索引 (核心逻辑)
    const randomIndex = Math.floor(Math.random() * paintings.length);
    // 根据随机索引从数组中获取一幅画的数据
    const randomPainting = paintings[randomIndex];

    // 更新图片和提示文字
    paintingImage.src = randomPainting.imageUrl;
    paintingImage.alt = randomPainting.title;
    paintingCaption.textContent = `《${randomPainting.title}》 - ${randomPainting.artist}`;

    // 更新下方信息表格
    infoTitle.textContent = randomPainting.title;
    infoArtist.textContent = randomPainting.artist;
    infoYear.textContent = randomPainting.year;
    infoStyle.textContent = randomPainting.style;
    infoDesc.textContent = randomPainting.description;
}

// 4. 自动轮播相关的变量
let autoRefreshInterval;

function startAutoRefresh() {
    // 设置一个间隔定时器，每3000毫秒（3秒）执行一次getRandomPainting函数
    autoRefreshInterval = setInterval(getRandomPainting, 3000);
    autoRefreshButton.textContent = '停止自动轮播';
}

function stopAutoRefresh() {
    // 清除定时器，停止自动轮播
    clearInterval(autoRefreshInterval);
    autoRefreshButton.textContent = '开启自动轮播（3秒/幅）';
}

// 5. 为按钮添加点击事件监听
refreshButton.addEventListener('click', getRandomPainting);

autoRefreshButton.addEventListener('click', function() {
    // 检查当前是否已经存在自动轮播（即定时器是否存在）
    if (autoRefreshInterval) {
        stopAutoRefresh();
        autoRefreshInterval = null; // 将变量置空，表示已停止
    } else {
        startAutoRefresh();
    }
});

// 6. 页面加载完成后，立即显示一幅随机画作
document.addEventListener('DOMContentLoaded', function() {
    getRandomPainting();
});
