// 五行穿衣指南 - 核心逻辑 v1.1

// 天干地支数据
const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 天干对应五行
const stemElements = {
    '甲': '木', '乙': '木',
    '丙': '火', '丁': '火',
    '戊': '土', '己': '土',
    '庚': '金', '辛': '金',
    '壬': '水', '癸': '水'
};

// 五行生克关系
const elementRelations = {
    '金': { generates: '水', generatedBy: '土', restrains: '木', restrainedBy: '火' },
    '木': { generates: '火', generatedBy: '水', restrains: '土', restrainedBy: '金' },
    '水': { generates: '木', generatedBy: '金', restrains: '火', restrainedBy: '土' },
    '火': { generates: '土', generatedBy: '木', restrains: '金', restrainedBy: '水' },
    '土': { generates: '金', generatedBy: '火', restrains: '水', restrainedBy: '木' }
};

// 五行对应颜色
const elementColors = {
    '金': ['白色', '银色', '金色', '杏色', '米白色', '乳白色系'],
    '木': ['绿色', '青色', '翠色', '碧色', '墨绿色', '浅绿系'],
    '水': ['黑色', '蓝色', '灰色', '深蓝色', '藏青色', '灰色系'],
    '火': ['红色', '粉色', '橙色', '紫色', '紫红色', '花色系'],
    '土': ['黄色', '咖啡色', '棕色', '土色', '橙黄色', '卡其色', '褐色系']
};

// 颜色等级说明（已移至 wearing-tips.js）

// 数字转中文
const numberToChinese = {
    0: '日', 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 7: '七', 8: '八', 9: '九', 10: '十',
    11: '十一', 12: '十二', 13: '十三', 14: '十四', 15: '十五', 16: '十六', 17: '十七', 18: '十八', 19: '十九', 20: '二十',
    21: '廿一', 22: '廿二', 23: '廿三', 24: '廿四', 25: '廿五', 26: '廿六', 27: '廿七', 28: '廿八', 29: '廿九', 30: '三十'
};

const monthToChinese = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];

// 获取当日五行及颜色推荐
function getDailyRecommendations(date) {
    // 使用轻量级农历库计算
    const lunar = LunarLite.solar2lunar(date);
    
    // 获取日天干
    const dayGan = lunar.dayGanZhi.charAt(0);
    
    // 获取当日五行
    const todayElement = stemElements[dayGan];
    
    // 根据五行生克关系推算颜色
    const relations = elementRelations[todayElement];
    
    // 获取当日五行的穿衣文案
    const tips = wearingTips[todayElement];
    
    return {
        element: todayElement,
        lunar: lunar,
        ganZhi: {
            year: lunar.yearGanZhi,
            month: lunar.monthGanZhi,
            day: lunar.dayGanZhi
        },
        colors: {
            lucky: {
                level: '吉',
                title: '贵人色',
                colors: elementColors[relations.generatedBy],
                element: relations.generatedBy,
                description: tips.lucky,
                class: 'lucky'
            },
            secondary: {
                level: '次吉',
                title: '合作色',
                colors: elementColors[todayElement],
                element: todayElement,
                description: tips.secondary,
                class: 'secondary'
            },
            neutral: {
                level: '平',
                title: '',
                colors: elementColors[relations.restrains],
                element: relations.restrains,
                description: tips.neutral,
                class: 'neutral'
            },
            poor: {
                level: '较差',
                title: '消耗色',
                colors: elementColors[relations.generates],
                element: relations.generates,
                description: tips.poor,
                class: 'poor'
            },
            avoid: {
                level: '不宜',
                title: '不利色',
                colors: elementColors[relations.restrainedBy],
                element: relations.restrainedBy,
                description: tips.avoid,
                class: 'avoid'
            }
        }
    };
}

// 当前显示的日期
let currentDate = new Date();

// 渲染页面
function renderPage(date = currentDate) {
    // 渲染日期
    const dayNumber = date.getDate();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const weekDay = date.getDay();
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    
    document.getElementById('dayNumber').textContent = dayNumber;
    document.getElementById('solarYear').textContent = `${year}年`;
    document.getElementById('solarMonth').textContent = `${monthToChinese[month]}月`;
    document.getElementById('solarWeek').textContent = `星期${weekDays[weekDay]}`;
    
    // 获取推荐数据
    const recommendations = getDailyRecommendations(date);
    const lunar = recommendations.lunar;
    
    // 渲染农历
    document.getElementById('lunarDay').textContent = 
        `${lunar.monthChinese}月${lunar.dayChinese}`;
    document.getElementById('lunarDate').textContent = 
        `${recommendations.ganZhi.year}年 ${recommendations.ganZhi.month}月 ${recommendations.ganZhi.day}日`;
    
    // 渲染颜色推荐
    const container = document.getElementById('colorRecommendations');
    container.innerHTML = '';
    
    Object.values(recommendations.colors).forEach(item => {
        const colorItem = document.createElement('div');
        colorItem.className = `color-item ${item.class}`;
        
        const titleText = item.title ? `《${item.title}》` : '';
        const colorsText = item.colors.join('、');
        
        // 获取第一个颜色作为背景色
        const firstColor = item.colors[0];
        const bgColor = getColorValue(firstColor);
        
        colorItem.innerHTML = `
            <div class="icon-wrapper" style="background: ${bgColor};">
                <img src="TShirt.svg" alt="T恤" />
            </div>
            <div class="content">
                <h3>
                    <span class="level">${item.level}</span>
                    <span class="title-text">${titleText}</span>：
                    <span class="colors">${colorsText}</span>
                </h3>
                <p class="description">${item.description}</p>
            </div>
        `;
        
        container.appendChild(colorItem);
    });
}

// 切换到前一天
function prevDay() {
    currentDate.setDate(currentDate.getDate() - 1);
    renderPage(currentDate);
}

// 切换到后一天
function nextDay() {
    currentDate.setDate(currentDate.getDate() + 1);
    renderPage(currentDate);
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        renderPage();
        // 绑定日期切换按钮事件
        document.getElementById('prevDay').addEventListener('click', prevDay);
        document.getElementById('nextDay').addEventListener('click', nextDay);
    });
} else {
    renderPage();
    // 绑定日期切换按钮事件
    document.getElementById('prevDay').addEventListener('click', prevDay);
    document.getElementById('nextDay').addEventListener('click', nextDay);
}
