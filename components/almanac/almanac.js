// 全局变量
let currentDate = new Date();
let lunar = null;

// DOM 元素 - 延迟获取以确保 DOM 完全加载
let elements = {};

function initializeElements() {
  elements = {
    solarDate: document.getElementById('solarDate'),
    lunarDate: document.getElementById('lunarDate'),
    ganzhiInfo: document.getElementById('ganzhiInfo'),
    zodiacInfo: document.getElementById('zodiacInfo'),
    xishen: document.getElementById('xishen'),
    fushen: document.getElementById('fushen'),
    caishen: document.getElementById('caishen'),
    chongshaInfo: document.getElementById('chongshaInfo'),
    yi: document.getElementById('yi'),
    ji: document.getElementById('ji'),
    solarDateSection: document.getElementById('solarDateSection'),
    datePickerPanel: document.getElementById('datePickerPanel'),
    yearSelect: document.getElementById('yearSelect'),
    monthSelect: document.getElementById('monthSelect'),
    daysGrid: document.getElementById('daysGrid'),
    prevYear: document.getElementById('prevYear'),
    prevMonth: document.getElementById('prevMonth'),
    nextMonth: document.getElementById('nextMonth'),
    nextYear: document.getElementById('nextYear'),
    backTodayBtn: document.getElementById('backTodayBtn'),
    prevDay: document.getElementById('prevDay'),
    nextDay: document.getElementById('nextDay')
  };
}

// 日期选择器状态
let pickerDate = new Date();
let isPickerOpen = false;

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  initializeElements();
  initializeApp();
  bindEvents();
});

// 初始化应用
function initializeApp() {
  initializeDatePicker();
  updateDisplay();
}

// 初始化日期选择器
function initializeDatePicker() {
  pickerDate = new Date(currentDate);
  populateYearSelect();
  populateMonthSelect();
  updatePickerSelects();
  renderCalendar();
}

// 填充年份选择器
function populateYearSelect() {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 50;
  const endYear = currentYear + 50;
  
  elements.yearSelect.innerHTML = '';
  for (let year = startYear; year <= endYear; year++) {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year + '年';
    elements.yearSelect.appendChild(option);
  }
}

// 填充月份选择器
function populateMonthSelect() {
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', 
                 '7月', '8月', '9月', '10月', '11月', '12月'];
  
  elements.monthSelect.innerHTML = '';
  months.forEach((month, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = month;
    elements.monthSelect.appendChild(option);
  });
}

// 更新选择器的值
function updatePickerSelects() {
  elements.yearSelect.value = pickerDate.getFullYear();
  elements.monthSelect.value = pickerDate.getMonth();
}

// 渲染日历
function renderCalendar() {
  const year = pickerDate.getFullYear();
  const month = pickerDate.getMonth();
  
  // 获取当月第一天和最后一天
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  
  // 获取第一天是星期几（0=星期日）
  const firstDayWeek = firstDay.getDay();
  
  // 获取当月天数
  const daysInMonth = lastDay.getDate();
  
  // 获取上个月的最后几天
  const prevMonth = new Date(year, month - 1, 0);
  const daysInPrevMonth = prevMonth.getDate();
  
  // 清空日历网格
  elements.daysGrid.innerHTML = '';
  
  // 添加上个月的日期
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dayCell = createDayCell(day, true, new Date(year, month - 1, day));
    elements.daysGrid.appendChild(dayCell);
  }
  
  // 添加当月的日期
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayCell = createDayCell(day, false, date);
    elements.daysGrid.appendChild(dayCell);
  }
  
  // 添加下个月的日期（填满6行）
  const totalCells = elements.daysGrid.children.length;
  const remainingCells = 42 - totalCells; // 6行 × 7列 = 42
  
  for (let day = 1; day <= remainingCells; day++) {
    const date = new Date(year, month + 1, day);
    const dayCell = createDayCell(day, true, date);
    elements.daysGrid.appendChild(dayCell);
  }
}

// 创建日期单元格
function createDayCell(day, isOtherMonth, date) {
  const dayCell = document.createElement('div');
  dayCell.className = 'day-cell';
  dayCell.textContent = day;
  
  if (isOtherMonth) {
    dayCell.classList.add('other-month');
  }
  
  // 检查是否是今天
  const today = new Date();
  if (date.toDateString() === today.toDateString()) {
    dayCell.classList.add('today');
  }
  
  // 检查是否是选中的日期
  if (date.toDateString() === currentDate.toDateString()) {
    dayCell.classList.add('selected');
  }
  
  // 添加点击事件
  dayCell.addEventListener('click', function() {
    if (!isOtherMonth) {
      currentDate = new Date(date);
      pickerDate = new Date(date);
      updateDisplay();
      renderCalendar();
      closeDatePicker();
    } else {
      // 如果点击的是其他月份的日期，切换到那个月
      pickerDate = new Date(date);
      currentDate = new Date(date);
      updatePickerSelects();
      renderCalendar();
      updateDisplay();
    }
  });
  
  return dayCell;
}

// 切换日期选择器显示/隐藏
function toggleDatePicker() {
  if (isPickerOpen) {
    closeDatePicker();
  } else {
    openDatePicker();
  }
}

// 打开日期选择器
function openDatePicker() {
  pickerDate = new Date(currentDate);
  updatePickerSelects();
  renderCalendar();
  elements.datePickerPanel.style.display = 'block';
  elements.solarDateSection.classList.add('active');
  isPickerOpen = true;
}

// 关闭日期选择器
function closeDatePicker() {
  elements.datePickerPanel.style.display = 'none';
  elements.solarDateSection.classList.remove('active');
  isPickerOpen = false;
}

// 绑定事件
function bindEvents() {
  // 日期选择器点击事件
  if (elements.solarDateSection) {
    elements.solarDateSection.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleDatePicker();
    });
  }

  // 年份选择器事件
  if (elements.yearSelect) {
    elements.yearSelect.addEventListener('change', function() {
      pickerDate.setFullYear(parseInt(this.value));
      renderCalendar();
    });
  }

  // 月份选择器事件
  if (elements.monthSelect) {
    elements.monthSelect.addEventListener('change', function() {
      pickerDate.setMonth(parseInt(this.value));
      renderCalendar();
    });
  }

  // 导航按钮事件
  if (elements.prevYear) {
    elements.prevYear.addEventListener('click', function() {
      pickerDate.setFullYear(pickerDate.getFullYear() - 1);
      updatePickerSelects();
      renderCalendar();
    });
  }

  if (elements.prevMonth) {
    elements.prevMonth.addEventListener('click', function() {
      pickerDate.setMonth(pickerDate.getMonth() - 1);
      updatePickerSelects();
      renderCalendar();
    });
  }

  if (elements.nextMonth) {
    elements.nextMonth.addEventListener('click', function() {
      pickerDate.setMonth(pickerDate.getMonth() + 1);
      updatePickerSelects();
      renderCalendar();
    });
  }

  if (elements.nextYear) {
    elements.nextYear.addEventListener('click', function() {
      pickerDate.setFullYear(pickerDate.getFullYear() + 1);
      updatePickerSelects();
      renderCalendar();
    });
  }

  // 回到今日按钮事件
  if (elements.backTodayBtn) {
    elements.backTodayBtn.addEventListener('click', function() {
      const today = new Date();
      currentDate = new Date(today);
      updateDisplay();
    });
  }

  // 点击外部关闭选择器
  document.addEventListener('click', function(e) {
    if (isPickerOpen && !elements.datePickerPanel.contains(e.target) && !elements.solarDateSection.contains(e.target)) {
      closeDatePicker();
    }
  });

  // 日期导航按钮事件
  if (elements.prevDay) {
    elements.prevDay.addEventListener('click', function() {
      currentDate.setDate(currentDate.getDate() - 1);
      updateDisplay();
    });
  }

  if (elements.nextDay) {
    elements.nextDay.addEventListener('click', function() {
      currentDate.setDate(currentDate.getDate() + 1);
      updateDisplay();
    });
  }

  // 键盘导航支持
  document.addEventListener('keydown', function(e) {
    if (isPickerOpen) {
      if (e.key === 'Escape') {
        closeDatePicker();
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      currentDate.setDate(currentDate.getDate() - 1);
      updateDisplay();
    } else if (e.key === 'ArrowRight') {
      currentDate.setDate(currentDate.getDate() + 1);
      updateDisplay();
    } else if (e.key === 'Home') {
      currentDate = new Date();
      updateDisplay();
    }
  });
}

// 更新显示
function updateDisplay() {
  try {
    // 创建农历对象
    lunar = Lunar.fromDate(currentDate);
    
    // 更新阳历日期
    updateSolarDate();
    
    // 更新农历日期
    updateLunarDate();
    
    // 更新干支信息
    updateGanzhiInfo();
    
    // 更新方向信息
    updateDirectionInfo();
    
    // 更新冲煞信息
    updateChongshaInfo();
    
    // 更新宜忌事项
    updateYiJiItems();
    
  } catch (error) {
    console.error('更新显示时出错:', error);
  }
}

// 更新阳历日期
function updateSolarDate() {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const day = currentDate.getDate();
  const weekday = weekdays[currentDate.getDay()];
  
  elements.solarDate.textContent = `${year}年${month}月${day}日 ${weekday}`;
}

// 更新农历日期
function updateLunarDate() {
  const lunarDay = lunar.getDay();
  const lunarMonth = lunar.getMonth();
  
  // 农历月份
  const monthNames = ['正月', '二月', '三月', '四月', '五月', '六月', 
                     '七月', '八月', '九月', '十月', '冬月', '腊月'];
  
  // 农历日期
  const dayNames = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
                   '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
                   '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
  
  // 显示完整的农历日期：月份 + 日期
  const monthStr = monthNames[lunarMonth - 1];
  const dayStr = dayNames[lunarDay - 1];
  const lunarDateStr = monthStr + dayStr;
  
  elements.lunarDate.textContent = lunarDateStr;
}

// 更新干支信息
function updateGanzhiInfo() {
  const yearGanzhi = lunar.getYearInGanZhi();
  const monthGanzhi = lunar.getMonthInGanZhi();
  const dayGanzhi = lunar.getDayInGanZhi();
  
  elements.ganzhiInfo.textContent = `${yearGanzhi}年 ${monthGanzhi}月 ${dayGanzhi}日`;
  
  // 更新生肖
  const zodiac = lunar.getYearShengXiao();
  elements.zodiacInfo.textContent = `生肖 ${zodiac}`;
}

// 更新方向信息
function updateDirectionInfo() {
  try {
    const day = lunar.getDay();
    
    // 喜神方位
    const xishenDirections = ['艮', '乾', '坤', '离', '巽', '艮', '乾', '坤', '离', '巽'];
    const xishenIndex = (day - 1) % 10;
    elements.xishen.textContent = xishenDirections[xishenIndex];
    
    // 福神方位
    const fushenDirections = ['坤', '艮', '乾', '巽', '离', '坤', '艮', '乾', '巽', '离'];
    const fushenIndex = (day - 1) % 10;
    elements.fushen.textContent = fushenDirections[fushenIndex];
    
    // 财神方位
    const caishenDirections = ['震', '巽', '离', '坤', '兑', '乾', '坎', '艮', '震', '巽'];
    const caishenIndex = (day - 1) % 10;
    elements.caishen.textContent = caishenDirections[caishenIndex];
    
  } catch (error) {
    console.error('更新方向信息时出错:', error);
    elements.xishen.textContent = '东';
    elements.fushen.textContent = '南';
    elements.caishen.textContent = '西';
  }
}

// 更新冲煞信息
function updateChongshaInfo() {
  try {
    const dayZhi = lunar.getDayZhi();
    const chongMap = {
      '子': '午/南', '丑': '未/西南', '寅': '申/西南', '卯': '酉/西',
      '辰': '戌/西北', '巳': '亥/西北', '午': '子/北', '未': '丑/东北',
      '申': '寅/东北', '酉': '卯/东', '戌': '辰/东南', '亥': '巳/东南'
    };
    
    const chongsha = chongMap[dayZhi] || '无';
    elements.chongshaInfo.textContent = chongsha;
    
  } catch (error) {
    console.error('更新冲煞信息时出错:', error);
    elements.chongshaInfo.textContent = '无';
  }
}

// 更新宜忌事项
function updateYiJiItems() {
  try {
    // 获取宜忌数据
    const yi = lunar.getDayYi() || [];
    const ji = lunar.getDayJi() || [];
    
    // 更新宜事项
    updateItemsContainer(elements.yi, yi, 'suitable-chip');
    
    // 更新忌事项
    updateItemsContainer(elements.ji, ji, 'avoid-chip');
    
  } catch (error) {
    console.error('更新宜忌事项时出错:', error);
    // 使用默认数据
    const defaultYi = ['祭祀', '沐浴', '修造', '动土'];
    const defaultJi = ['开市', '纳财', '栽种', '嫁娶'];
    
    updateItemsContainer(elements.yi, defaultYi, 'suitable-chip');
    updateItemsContainer(elements.ji, defaultJi, 'avoid-chip');
  }
}

// 更新事项容器
function updateItemsContainer(container, items, chipClass) {
  container.innerHTML = '';
  
  if (items.length === 0) {
    const emptyChip = document.createElement('div');
    emptyChip.className = `item-chip ${chipClass}`;
    emptyChip.textContent = '无';
    container.appendChild(emptyChip);
    return;
  }
  
  items.forEach(item => {
    const chip = document.createElement('div');
    chip.className = `item-chip ${chipClass}`;
    chip.textContent = item;
    container.appendChild(chip);
  });
}