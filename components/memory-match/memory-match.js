// ==================== 游戏配置 ====================
const GAME_CONFIG = {
  levels: [
    { level: 1, stage: '新手', pairs: 4, grid: '2x4', memoryTime: 5, playTime: 20 },
    { level: 2, stage: '简单', pairs: 6, grid: '3x4', memoryTime: 5, playTime: 30 },
    { level: 3, stage: '简单', pairs: 6, grid: '3x4', memoryTime: 5, playTime: 30 },
    { level: 4, stage: '中等', pairs: 8, grid: '4x4', memoryTime: 8, playTime: 40 },
    { level: 5, stage: '中等', pairs: 8, grid: '4x4', memoryTime: 8, playTime: 40 },
    { level: 6, stage: '困难', pairs: 10, grid: '4x5', memoryTime: 10, playTime: 50 },
    { level: 7, stage: '困难', pairs: 10, grid: '4x5', memoryTime: 10, playTime: 50 },
    { level: 8, stage: '困难', pairs: 10, grid: '4x5', memoryTime: 10, playTime: 50 },
    { level: 9, stage: '大师', pairs: 12, grid: '4x6', memoryTime: 10, playTime: 60 },
    { level: 10, stage: '大师', pairs: 12, grid: '4x6', memoryTime: 10, playTime: 60 },
    { level: 11, stage: '大师', pairs: 12, grid: '4x6', memoryTime: 10, playTime: 60 },
    { level: 12, stage: '大师', pairs: 12, grid: '4x6', memoryTime: 10, playTime: 60 },
    { level: 13, stage: '大师', pairs: 12, grid: '4x6', memoryTime: 10, playTime: 60 },
    { level: 14, stage: '大师', pairs: 12, grid: '4x6', memoryTime: 10, playTime: 60 },
    { level: 15, stage: '大师', pairs: 12, grid: '4x6', memoryTime: 10, playTime: 60 },
  ],
  
  emojiPool: [
    '💎', '🎭', '🎪', '🏰', '🎲', '🎡', '⛱️', '⛺️',
    '🏀', '⚽', '🏈', '🎾', '🏐', '🏓', '🏸', '🥊',
    '🧤', '🍊', '🍋', '🍌', '🍉', '🪭', '🎩', '🧶',
    '🌸', '🌺', '🌻', '🌹', '🌷', '🌼', '🌴', '🌵',
    '🦧', '🦭', '🦖', '🦄', '🦅', '🐵', '🐯', '🐸',
    '🤡', '🏎️', '🛵', '🚜', '🏔️', '🧧', '🎃', '🎈',
    '🌊', '☘️', '🍁', '🍄', '🌏', '🥥', '🥝', '🧋',
  ],
};

// ==================== 游戏状态管理 ====================
class MemoryMatchGame {
  constructor() {
    this.currentLevel = 1;
    this.totalLevelsCleared = 0;
    this.levelStartTime = null;
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.isProcessing = false;
    this.memoryTimer = null;
    this.playTimer = null;
    this.remainingTime = 0;
    this.remainingCentiseconds = 0; // 以0.01秒为单位的剩余时间
    this.gamePhase = 'idle';
    this.idleAnimationInterval = null;
    
    // 累计统计数据
    this.totalMatchedPairs = 0; // 累计配对数
    this.totalPlayTime = 0; // 累计游戏时长（仅配对阶段）
    this.playPhaseStartTime = null; // 配对阶段开始时间
    
    this.initElements();
    this.bindEvents();
    this.loadProgress();
    this.startIdleAnimation();
  }

  initElements() {
    this.elements = {
      cardGrid: document.getElementById('cardGrid'),
      currentLevel: document.getElementById('currentLevel'),
      remainingTime: document.getElementById('remainingTime'),
      gameHint: document.getElementById('gameHint'),
      startBtn: document.getElementById('startBtn'),
      skipMemoryBtn: document.getElementById('skipMemoryBtn'),
      gameStatusBar: document.getElementById('gameStatusBar'),
      gameRuleHint: document.getElementById('gameRuleHint'),
      memoryCountdownModule: document.getElementById('memoryCountdownModule'),
      memoryProgressFill: document.getElementById('memoryProgressFill'),
      playCountdownModule: document.getElementById('playCountdownModule'),
      levelCompleteHint: document.getElementById('levelCompleteHint'),
      digitTens: document.getElementById('digitTens'),
      digitOnes: document.getElementById('digitOnes'),
      digitTenths: document.getElementById('digitTenths'),
      digitHundredths: document.getElementById('digitHundredths'),
    };
  }

  bindEvents() {
    this.elements.startBtn.addEventListener('click', () => this.startGame());
    this.elements.skipMemoryBtn.addEventListener('click', () => this.skipMemoryPhase());
  }

  loadProgress() {
    // 初始化时不再自动加载进度，始终从第1关开始
    this.currentLevel = 1;
    this.totalLevelsCleared = 0;
    this.updateStatusBar();
    
    if (this.elements.gameStatusBar) {
      this.elements.gameStatusBar.style.display = 'none';
    }
    if (this.elements.gameHint) {
      this.elements.gameHint.style.display = 'none';
    }
    
    // 初始化提示区域：显示规则提示，隐藏倒计时模块
    if (this.elements.gameRuleHint) {
      this.elements.gameRuleHint.classList.add('visible');
      this.elements.gameRuleHint.classList.remove('hidden');
    }
    if (this.elements.memoryCountdownModule) {
      this.elements.memoryCountdownModule.classList.add('hidden');
      this.elements.memoryCountdownModule.classList.remove('visible');
    }
    if (this.elements.playCountdownModule) {
      this.elements.playCountdownModule.classList.add('hidden');
      this.elements.playCountdownModule.classList.remove('visible');
    }
    if (this.elements.levelCompleteHint) {
      this.elements.levelCompleteHint.classList.add('hidden');
      this.elements.levelCompleteHint.classList.remove('visible');
    }
    
    // 初始化滚动数字轨道
    this.initDigitRollers();
  }

  // 初始化数字滚动轨道
  initDigitRollers() {
    const createDigitTrack = (roller) => {
      const track = roller.querySelector('.digit-track');
      track.innerHTML = '';
      for (let i = 0; i <= 9; i++) {
        const digitItem = document.createElement('div');
        digitItem.className = 'digit-item';
        digitItem.textContent = i;
        track.appendChild(digitItem);
      }
    };
    
    if (this.elements.digitTens) {
      createDigitTrack(this.elements.digitTens);
    }
    if (this.elements.digitOnes) {
      createDigitTrack(this.elements.digitOnes);
    }
  }

  // 更新滚动数字显示 (时间单位:0.01秒)
  updateDigitDisplay(centiseconds) {
    // 转换为各个位数
    const totalSeconds = Math.floor(centiseconds / 100);
    const tens = Math.floor(totalSeconds / 10) % 10;
    const ones = totalSeconds % 10;
    const tenths = Math.floor((centiseconds % 100) / 10);
    const hundredths = centiseconds % 10;
    
    // 更新滚动数字(秒位和十秒位)
    const tensTrack = this.elements.digitTens?.querySelector('.digit-track');
    const onesTrack = this.elements.digitOnes?.querySelector('.digit-track');
    
    if (tensTrack) {
      tensTrack.style.transform = `translateY(-${tens * 48}px)`;
    }
    if (onesTrack) {
      onesTrack.style.transform = `translateY(-${ones * 48}px)`;
    }
    
    // 更新静态数字(0.1秒位和0.01秒位)
    if (this.elements.digitTenths) {
      this.elements.digitTenths.textContent = tenths;
    }
    if (this.elements.digitHundredths) {
      this.elements.digitHundredths.textContent = hundredths;
    }
  }

  startIdleAnimation() {
    // 从emojiPool中随机选取4个emoji
    const shuffled = [...GAME_CONFIG.emojiPool].sort(() => Math.random() - 0.5);
    const idleEmojis = shuffled.slice(0, 4);
    const idleCards = [];
    idleEmojis.forEach((emoji, index) => {
      idleCards.push(
        { id: index * 2, emoji, pairId: index },
        { id: index * 2 + 1, emoji, pairId: index }
      );
    });
    
    this.cards = idleCards.sort(() => Math.random() - 0.5);
    
    this.elements.cardGrid.className = 'card-grid grid-2x4';
    this.elements.cardGrid.innerHTML = '';
    
    this.cards.forEach(card => {
      const cardElement = this.createCardElement(card);
      cardElement.style.pointerEvents = 'none';
      this.elements.cardGrid.appendChild(cardElement);
    });
    
    this.playIdleFlipAnimation();
  }

  playIdleFlipAnimation() {
    const cards = document.querySelectorAll('.memory-card');
    const cardArray = Array.from(cards);
    const shuffledCards = cardArray.sort(() => Math.random() - 0.5);
    const delayPerCard = 120;
    const displayDuration = 1500;
    
    shuffledCards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('flipped');
      }, index * delayPerCard);
    });
    
    const totalRevealTime = shuffledCards.length * delayPerCard + displayDuration;
    
    setTimeout(() => {
      const shuffledBackCards = cardArray.sort(() => Math.random() - 0.5);
      shuffledBackCards.forEach((card, index) => {
        setTimeout(() => {
          card.classList.remove('flipped');
        }, index * delayPerCard);
      });
      
      const totalFlipBackTime = shuffledBackCards.length * delayPerCard + 1000;
      this.idleAnimationInterval = setTimeout(() => {
        if (this.gamePhase === 'idle') {
          this.playIdleFlipAnimation();
        }
      }, totalFlipBackTime);
      
    }, totalRevealTime);
  }

  stopIdleAnimation() {
    if (this.idleAnimationInterval) {
      clearTimeout(this.idleAnimationInterval);
      this.idleAnimationInterval = null;
    }
    
    const cards = document.querySelectorAll('.memory-card');
    cards.forEach(card => {
      card.classList.remove('flipped');
    });
  }

  saveProgress() {
    try {
      localStorage.setItem('memoryMatchProgress', JSON.stringify({
        currentLevel: this.currentLevel,
        totalLevelsCleared: this.totalLevelsCleared,
      }));
    } catch (e) {
      console.error('保存进度失败:', e);
    }
  }

  getLevelConfig() {
    const config = GAME_CONFIG.levels[this.currentLevel - 1];
    if (!config) {
      return {
        level: this.currentLevel,
        stage: '大师',
        pairs: 12,
        grid: '4x6',
        memoryTime: 10,
        playTime: 60,
      };
    }
    return config;
  }

  startGame() {
    this.stopIdleAnimation();
    
    if (this.elements.gameStatusBar) {
      this.elements.gameStatusBar.style.display = 'flex';
    }
    if (this.elements.gameHint) {
      this.elements.gameHint.style.display = 'block';
    }
    
    this.gamePhase = 'levelDisplay';
    this.levelStartTime = Date.now();
    this.matchedPairs = 0;
    
    const config = this.getLevelConfig();
    this.remainingTime = config.playTime;
    
    this.updateStatusBar();
    this.generateCards(config);
    
    this.elements.startBtn.style.display = 'none';
    this.elements.skipMemoryBtn.style.display = 'none';
    this.elements.gameHint.textContent = '记忆阶段';
    
    // 先展示关卡数，延迟渲染卡片
    this.showLevelDisplay(config);
  }

  // 展示关卡数（1秒）
  showLevelDisplay(config) {
    // 淡出记忆倒计时模块
    if (this.elements.memoryCountdownModule) {
      this.elements.memoryCountdownModule.classList.add('hidden');
      this.elements.memoryCountdownModule.classList.remove('visible');
    }
    
    // 淡出当前规则提示内容
    if (this.elements.gameRuleHint) {
      this.elements.gameRuleHint.classList.add('hidden');
      this.elements.gameRuleHint.classList.remove('visible');
    }
    
    // 等待淡出完成后切换内容并淡入（同时渲染卡片）
    setTimeout(() => {
      // 显示"第N关"文字
      if (this.elements.gameRuleHint) {
        this.elements.gameRuleHint.innerHTML = `<span class="level-display-number">第 ${config.level} 关</span>`;
        this.elements.gameRuleHint.classList.add('level-display-active');
        this.elements.gameRuleHint.classList.remove('hidden');
        this.elements.gameRuleHint.classList.add('visible');
      }
      
      // 同时渲染卡片（背面朝上）
      this.renderCards();
      
      // 确保所有卡片都是背面朝上
      const cards = document.querySelectorAll('.memory-card');
      cards.forEach(card => {
        card.classList.remove('flipped');
        card.style.pointerEvents = 'none';
      });
    }, 300);
    
    // 1秒后切换到记忆倒计时模块
    setTimeout(() => {
      // 淡出关卡显示
      if (this.elements.gameRuleHint) {
        this.elements.gameRuleHint.classList.add('hidden');
        this.elements.gameRuleHint.classList.remove('visible');
      }
      
      // 等待淡出完成后显示记忆倒计时模块
      setTimeout(() => {
        if (this.elements.gameRuleHint) {
          this.elements.gameRuleHint.classList.remove('level-display-active');
        }
        
        // 关键修改：在显示进度条模块之前，先初始化进度条为100%（无过渡）
        if (this.elements.memoryProgressFill) {
          this.elements.memoryProgressFill.style.transition = 'none';
          this.elements.memoryProgressFill.style.width = '100%';
        }
        
        if (this.elements.memoryCountdownModule) {
          this.elements.memoryCountdownModule.classList.remove('hidden');
          this.elements.memoryCountdownModule.classList.add('visible');
        }
        this.gamePhase = 'memory';
        this.elements.skipMemoryBtn.style.display = 'block';
        this.playInitialRevealAnimation(config);
      }, 300);
    }, 1000);
  }

  generateCards(config) {
    const { pairs } = config;
    const shuffled = [...GAME_CONFIG.emojiPool].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, pairs);
    
    const cardPairs = [];
    selected.forEach((emoji, index) => {
      cardPairs.push(
        { id: index * 2, emoji, pairId: index },
        { id: index * 2 + 1, emoji, pairId: index }
      );
    });
    
    this.cards = cardPairs.sort(() => Math.random() - 0.5);
  }

  renderCards() {
    const config = this.getLevelConfig();
    const gridClass = `grid-${config.grid.replace('×', 'x').replace('x', 'x')}`;
    
    this.elements.cardGrid.className = `card-grid ${gridClass}`;
    this.elements.cardGrid.innerHTML = '';
    
    this.cards.forEach(card => {
      const cardElement = this.createCardElement(card);
      cardElement.style.pointerEvents = '';
      this.elements.cardGrid.appendChild(cardElement);
    });
  }

  createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'memory-card';
    cardDiv.dataset.id = card.id;
    cardDiv.dataset.pairId = card.pairId;
    
    const backFace = document.createElement('div');
    backFace.className = 'card-face card-back';
    
    const frontFace = document.createElement('div');
    frontFace.className = 'card-face card-front';
    frontFace.textContent = card.emoji;
    
    cardDiv.appendChild(backFace);
    cardDiv.appendChild(frontFace);
    cardDiv.addEventListener('click', () => this.handleCardClick(cardDiv));
    
    return cardDiv;
  }

  playInitialRevealAnimation(config) {
    const cards = document.querySelectorAll('.memory-card');
    const totalCards = cards.length;
    const delayPerCard = 80;
    
    cards.forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('flipped');
      }, index * delayPerCard);
    });
    
    const totalRevealTime = totalCards * delayPerCard + 300;
    
    setTimeout(() => {
      this.startMemoryPhase(config.memoryTime);
    }, totalRevealTime);
  }

  startMemoryPhase(duration) {
    this.elements.cardGrid.classList.add('memory-phase');
    this.elements.gameHint.textContent = `记忆阶段`;
    
    // 进度条已经在显示前初始化为100%，这里直接开始动画
    if (this.elements.memoryProgressFill) {
      // 使用 setTimeout 确保浏览器完成前一帧的渲染
      setTimeout(() => {
        this.elements.memoryProgressFill.style.transition = `width ${duration}s linear`;
        this.elements.memoryProgressFill.style.width = '0%';
      }, 50); // 50ms延迟足够浏览器完成渲染
    }
    
    let countdown = duration;
    
    this.memoryTimer = setInterval(() => {
      countdown--;
      
      if (countdown <= 0) {
        this.endMemoryPhase();
      }
    }, 1000);
  }

  skipMemoryPhase() {
    if (this.memoryTimer) {
      clearInterval(this.memoryTimer);
      this.memoryTimer = null;
    }
    this.endMemoryPhase();
  }

  endMemoryPhase() {
    if (this.memoryTimer) {
      clearInterval(this.memoryTimer);
      this.memoryTimer = null;
    }
    
    // 淡出记忆倒计时模块
    if (this.elements.memoryCountdownModule) {
      this.elements.memoryCountdownModule.classList.add('hidden');
      this.elements.memoryCountdownModule.classList.remove('visible');
    }
    
    this.gamePhase = 'playing';
    this.elements.cardGrid.classList.remove('memory-phase');
    this.elements.skipMemoryBtn.style.display = 'none';
    this.elements.gameHint.textContent = '配对阶段';
    
    const cards = document.querySelectorAll('.memory-card');
    const cardArray = Array.from(cards);
    
    // 恢复卡片的点击功能
    cardArray.forEach(card => {
      card.style.pointerEvents = '';
    });
    
    // 随机打乱卡片顺序，创建波浪式翻转效果
    const shuffledCards = cardArray.sort(() => Math.random() - 0.5);
    const delayPerCard = 50; // 每张卡片间隔50ms
    
    shuffledCards.forEach((card, index) => {
      setTimeout(() => {
        // 强制重绘，确保动画在移动设备上正确触发
        void card.offsetHeight;
        card.classList.remove('flipped');
      }, index * delayPerCard);
    });
    
    // 等所有卡片翻转完成后显示配对倒计时并开始计时
    const totalFlipTime = shuffledCards.length * delayPerCard + 500;
    setTimeout(() => {
      // 淡入配对倒计时模块
      if (this.elements.playCountdownModule) {
        this.elements.playCountdownModule.classList.remove('hidden');
        this.elements.playCountdownModule.classList.add('visible');
        // 初始化显示当前剩余时间(转换为0.01秒单位)
        this.remainingCentiseconds = this.remainingTime * 100;
        this.updateDigitDisplay(this.remainingCentiseconds);
      }
      this.startPlayTimer();
    }, totalFlipTime);
  }

  startPlayTimer() {
    // 记录配对阶段开始时间
    this.playPhaseStartTime = Date.now();
    
    // 初始化剩余时间(0.01秒单位)
    this.remainingCentiseconds = this.remainingTime * 100;
    
    // 使用10ms间隔实现0.01秒精度
    this.playTimer = setInterval(() => {
      if (this.gamePhase !== 'playing') {
        if (this.playTimer) {
          clearInterval(this.playTimer);
          this.playTimer = null;
        }
        return;
      }
      
      this.remainingCentiseconds--;
      
      // 更新滚动数字显示
      this.updateDigitDisplay(this.remainingCentiseconds);
      
      // 每秒更新一次状态栏(减少DOM操作)
      if (this.remainingCentiseconds % 100 === 0) {
        this.remainingTime = Math.floor(this.remainingCentiseconds / 100);
        this.updateRemainingTime();
      }
      
      if (this.remainingCentiseconds <= 0) {
        this.remainingCentiseconds = 0;
        this.remainingTime = 0;
        this.updateRemainingTime();
        this.updateDigitDisplay(0);
        this.gameFailed();
      }
    }, 10); // 10ms = 0.01秒
  }

  updateRemainingTime() {
    this.elements.remainingTime.textContent = `剩余时间 ${this.remainingTime}s`;
    this.elements.remainingTime.classList.remove('warning', 'danger');
    
    if (this.remainingTime <= 0) {
      this.elements.remainingTime.classList.add('danger');
    } else if (this.remainingTime <= 5) {
      this.elements.remainingTime.classList.add('danger');
    } else if (this.remainingTime <= 10) {
      this.elements.remainingTime.classList.add('warning');
    }
  }

  handleCardClick(cardElement) {
    if (this.gamePhase !== 'playing') return;
    if (this.isProcessing) return;
    if (cardElement.classList.contains('flipped')) return;
    if (cardElement.classList.contains('matched')) return;
    if (this.flippedCards.length >= 2) return;
    
    cardElement.classList.add('flipped');
    this.flippedCards.push(cardElement);
    
    if (this.flippedCards.length === 2) {
      this.isProcessing = true;
      this.checkMatch();
    }
  }

  checkMatch() {
    const [card1, card2] = this.flippedCards;
    const pairId1 = card1.dataset.pairId;
    const pairId2 = card2.dataset.pairId;
    
    setTimeout(() => {
      if (pairId1 === pairId2) {
        this.handleMatchSuccess(card1, card2);
      } else {
        this.handleMatchFailure(card1, card2);
      }
      
      this.flippedCards = [];
      this.isProcessing = false;
    }, 600);
  }

  handleMatchSuccess(card1, card2) {
    card1.classList.add('matched', 'match-success');
    card2.classList.add('matched', 'match-success');
    
    setTimeout(() => {
      card1.classList.remove('match-success');
      card2.classList.remove('match-success');
    }, 400);
    
    this.matchedPairs++;
    this.totalMatchedPairs++; // 累计配对数
    
    const config = this.getLevelConfig();
    if (this.matchedPairs === config.pairs) {
      // 计算当前关卡配对阶段的时长
      if (this.playPhaseStartTime) {
        const playTime = Math.floor((Date.now() - this.playPhaseStartTime) / 1000);
        this.totalPlayTime += playTime; // 累计配对时长
      }
      
      if (this.playTimer) {
        clearInterval(this.playTimer);
        this.playTimer = null;
      }
      this.levelComplete();
    }
  }

  handleMatchFailure(card1, card2) {
    card1.classList.add('shake');
    card2.classList.add('shake');
    
    setTimeout(() => {
      card1.classList.remove('shake');
      card2.classList.remove('shake');
      card1.classList.add('flip-back');
      card2.classList.add('flip-back');
      
      setTimeout(() => {
        card1.classList.remove('flipped', 'flip-back');
        card2.classList.remove('flipped', 'flip-back');
      }, 500);
    }, 400);
  }

  // 关卡完成
  levelComplete() {
    // 防止重复调用
    if (this.gamePhase === 'finished') {
      return;
    }
    
    this.gamePhase = 'finished';
    
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
    
    // 淡出配对倒计时模块
    if (this.elements.playCountdownModule) {
      this.elements.playCountdownModule.classList.add('hidden');
      this.elements.playCountdownModule.classList.remove('visible');
    }
    
    this.totalLevelsCleared++;
    const playTime = Math.floor((Date.now() - this.levelStartTime) / 1000);
    
    // 保存进度
    if (this.currentLevel >= GAME_CONFIG.levels.length) {
      // 已完成所有预设关卡
      this.saveProgress();
    } else {
      this.saveProgress();
    }
    
    // 显示内联结果
    this.showInlineResult(true, playTime);
  }

  // 游戏失败
  gameFailed() {
    // 防止重复调用
    if (this.gamePhase === 'finished') {
      return;
    }
    
    this.gamePhase = 'finished';
    
    // 计算当前关卡配对阶段的时长（失败时也要累计）
    if (this.playPhaseStartTime) {
      const playTime = Math.floor((Date.now() - this.playPhaseStartTime) / 1000);
      this.totalPlayTime += playTime;
    }
    
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
    
    // 淡出配对倒计时模块
    if (this.elements.playCountdownModule) {
      this.elements.playCountdownModule.classList.add('hidden');
      this.elements.playCountdownModule.classList.remove('visible');
    }
    
    // 隐藏"配对阶段"提示
    this.elements.gameHint.style.display = 'none';
    
    const playTime = Math.floor((Date.now() - this.levelStartTime) / 1000);
    this.showInlineResult(false, playTime);
  }

  // 显示内联结果（替代弹窗）
  showInlineResult(isSuccess, playTime) {
    // 如果成功，直接显示倒计时并进入下一关
    if (isSuccess) {
      this.showNextLevelCountdown();
      return;
    }
    
    // 失败时显示结果面板
    const config = this.getLevelConfig();
    
    // 在 hint-container 中显示失败提示（复用成功提示的区域）
    if (this.elements.levelCompleteHint) {
      this.elements.levelCompleteHint.textContent = '挑战结束，你已经很棒啦！';
      this.elements.levelCompleteHint.classList.remove('hidden');
      this.elements.levelCompleteHint.classList.add('visible');
    }
    
    // 设置卡片网格背景色
    this.elements.cardGrid.classList.add('game-over');
    this.elements.cardGrid.classList.remove('level-complete');
    
    // 隐藏游戏主容器（状态栏和卡片）
    const gameMainContainer = document.querySelector('.game-main-container');
    if (gameMainContainer) {
      gameMainContainer.style.display = 'none';
    }
    
    // 创建结果面板（黄色容器）
    const resultPanel = document.createElement('div');
    resultPanel.className = 'inline-result-panel';
    resultPanel.id = 'inlineResultPanel';
    
    // 计算实际完成的关卡数（当前关卡 - 1）
    const completedLevels = this.currentLevel - 1;
    
    resultPanel.innerHTML = `
      <div class="result-icon fail">💪</div>
      <div class="result-title">挑战到第${config.level}关，再试一次吧！</div>
      <div class="result-message">继续挑战，突破自我！</div>
      
      <div class="result-stats">
        <div class="stat-item">
          <div class="stat-label">完成关卡</div>
          <div class="stat-value">${completedLevels}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">成功配对</div>
          <div class="stat-value">${this.totalMatchedPairs}对</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">游戏时长</div>
          <div class="stat-value">${this.totalPlayTime}s</div>
        </div>
      </div>
      
      <div class="result-actions single">
        <button class="btn btn-primary" id="retryBtn">再来一次</button>
      </div>
    `;
    
    // 将结果面板插入到 game-main-container 之后
    if (gameMainContainer && gameMainContainer.parentNode) {
      gameMainContainer.parentNode.insertBefore(resultPanel, gameMainContainer.nextSibling);
    }
    
    // 绑定重试按钮
    setTimeout(() => {
      const retryBtn = document.getElementById('retryBtn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => this.retryLevel());
      }
    }, 100);
  }

  showNextLevelCountdown() {
    const config = this.getLevelConfig();
    let countdown = 3;
    
    // 淡出配对倒计时模块
    if (this.elements.playCountdownModule) {
      this.elements.playCountdownModule.classList.add('hidden');
      this.elements.playCountdownModule.classList.remove('visible');
    }
    
    // 等待淡出完成后显示通关提示
    setTimeout(() => {
      // 设置通关提示文字并显示
      if (this.elements.levelCompleteHint) {
        this.elements.levelCompleteHint.textContent = `恭喜你，通过第${config.level}关！`;
        this.elements.levelCompleteHint.classList.remove('hidden');
        this.elements.levelCompleteHint.classList.add('visible');
      }
      
      // 隐藏状态栏的"配对阶段"提示
      this.elements.gameHint.style.display = 'none';
      
      // 3秒倒计时
      const countdownTimer = setInterval(() => {
        countdown--;
        if (countdown <= 0) {
          clearInterval(countdownTimer);
          
          // 淡出通关提示
          if (this.elements.levelCompleteHint) {
            this.elements.levelCompleteHint.classList.add('hidden');
            this.elements.levelCompleteHint.classList.remove('visible');
          }
          
          // 等待淡出完成后进入下一关
          setTimeout(() => {
            this.nextLevel();
          }, 300);
        }
      }, 1000);
    }, 300);
  }

  nextLevel() {
    this.currentLevel++;
    this.resetLevel();
    
    // 重新显示游戏状态栏和提示
    if (this.elements.gameStatusBar) {
      this.elements.gameStatusBar.style.display = 'flex';
    }
    if (this.elements.gameHint) {
      this.elements.gameHint.style.display = 'block';
    }
    
    this.startGame();
  }

  retryLevel() {
    // 清理定时器
    if (this.memoryTimer) {
      clearInterval(this.memoryTimer);
      this.memoryTimer = null;
    }
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
    if (this.idleAnimationInterval) {
      clearTimeout(this.idleAnimationInterval);
      this.idleAnimationInterval = null;
    }
    
    this.hideInlineResult();
    
    // 重置到初始状态
    this.currentLevel = 1;
    this.totalLevelsCleared = 0;
    this.levelStartTime = null;
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.isProcessing = false;
    this.remainingTime = 0;
    this.remainingCentiseconds = 0;
    this.gamePhase = 'idle';
    
    // 重置累计统计数据
    this.totalMatchedPairs = 0;
    this.totalPlayTime = 0;
    this.playPhaseStartTime = null;
    
    // 清除进度
    try {
      localStorage.removeItem('memoryMatchProgress');
    } catch (e) {
      console.error('清除进度失败:', e);
    }
    
    // 重置UI到初始状态
    this.elements.cardGrid.innerHTML = '';
    this.elements.cardGrid.className = 'card-grid';
    this.elements.cardGrid.style.display = '';
    
    const gameMainContainer = document.querySelector('.game-main-container');
    if (gameMainContainer) {
      gameMainContainer.style.display = '';
    }
    
    // 显示开始按钮，隐藏其他按钮
    this.elements.startBtn.style.display = 'block';
    this.elements.skipMemoryBtn.style.display = 'none';
    
    // 恢复游戏规则提示（使用淡入效果）
    if (this.elements.gameRuleHint) {
      this.elements.gameRuleHint.innerHTML = '记住卡片的位置 找出所有相同的卡片';
      this.elements.gameRuleHint.classList.remove('level-display-active', 'hidden');
      this.elements.gameRuleHint.classList.add('visible');
    }
    
    // 隐藏记忆倒计时模块
    if (this.elements.memoryCountdownModule) {
      this.elements.memoryCountdownModule.classList.add('hidden');
      this.elements.memoryCountdownModule.classList.remove('visible');
    }
    
    // 隐藏配对倒计时模块
    if (this.elements.playCountdownModule) {
      this.elements.playCountdownModule.classList.add('hidden');
      this.elements.playCountdownModule.classList.remove('visible');
    }
    
    // 隐藏通关提示模块
    if (this.elements.levelCompleteHint) {
      this.elements.levelCompleteHint.classList.add('hidden');
      this.elements.levelCompleteHint.classList.remove('visible');
    }
    
    // 隐藏游戏状态栏和提示
    if (this.elements.gameStatusBar) {
      this.elements.gameStatusBar.style.display = 'none';
    }
    if (this.elements.gameHint) {
      this.elements.gameHint.style.display = 'none';
    }
    
    this.updateStatusBar();
    this.startIdleAnimation();
  }

  hideInlineResult() {
    const panel = document.getElementById('inlineResultPanel');
    if (panel) {
      panel.remove();
    }
    // 隐藏失败提示（使用 levelCompleteHint）
    if (this.elements.levelCompleteHint) {
      this.elements.levelCompleteHint.classList.add('hidden');
      this.elements.levelCompleteHint.classList.remove('visible');
    }
    const gameMainContainer = document.querySelector('.game-main-container');
    if (gameMainContainer) {
      gameMainContainer.style.display = '';
    }
    this.elements.cardGrid.style.display = '';
    this.elements.cardGrid.classList.remove('level-complete', 'game-over');
  }

  resetLevel() {
    if (this.memoryTimer) {
      clearInterval(this.memoryTimer);
      this.memoryTimer = null;
    }
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
    
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.isProcessing = false;
    this.gamePhase = 'idle';
    
    this.elements.cardGrid.innerHTML = '';
    this.elements.cardGrid.className = 'card-grid';
  }

  updateStatusBar() {
    const config = this.getLevelConfig();
    this.elements.currentLevel.textContent = `关卡 ${config.level}`;
    
    if (this.gamePhase === 'playing') {
      this.elements.remainingTime.textContent = `剩余时间 ${this.remainingTime}s`;
    } else if (this.gamePhase === 'memory') {
      this.elements.remainingTime.textContent = `剩余时间 ${config.memoryTime}s`;
    } else {
      this.elements.remainingTime.textContent = `剩余时间 ${config.playTime}s`;
    }
    
    this.elements.remainingTime.classList.remove('warning', 'danger');
  }
}

let game;

document.addEventListener('DOMContentLoaded', () => {
  game = new MemoryMatchGame();
});
