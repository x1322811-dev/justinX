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
    '🎨', '🎭', '🎪', '🎯', '🎲', '🎸', '🎺', '🎻',
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
    this.gamePhase = 'idle';
    this.idleAnimationInterval = null;
    
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
      restartBtn: document.getElementById('restartBtn'),
      gameStatusBar: document.getElementById('gameStatusBar'),
    };
  }

  bindEvents() {
    this.elements.startBtn.addEventListener('click', () => this.startGame());
    this.elements.skipMemoryBtn.addEventListener('click', () => this.skipMemoryPhase());
    this.elements.restartBtn.addEventListener('click', () => this.restartGame());
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('memoryMatchProgress');
      if (saved) {
        const data = JSON.parse(saved);
        this.currentLevel = data.currentLevel || 1;
        this.totalLevelsCleared = data.totalLevelsCleared || 0;
      }
    } catch (e) {
      console.error('加载进度失败:', e);
    }
    this.updateStatusBar();
    
    if (this.elements.gameStatusBar) {
      this.elements.gameStatusBar.style.display = 'none';
    }
    if (this.elements.gameHint) {
      this.elements.gameHint.style.display = 'none';
    }
  }

  startIdleAnimation() {
    const idleEmojis = ['🎨', '🎭', '🎸', '🎯'];
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
    
    const gameTips = document.getElementById('gameTips');
    if (gameTips) {
      gameTips.style.display = 'none';
    }
    
    this.gamePhase = 'memory';
    this.levelStartTime = Date.now();
    this.matchedPairs = 0;
    
    const config = this.getLevelConfig();
    this.remainingTime = config.playTime;
    
    this.updateStatusBar();
    this.generateCards(config);
    this.renderCards();
    
    this.elements.startBtn.style.display = 'none';
    this.elements.skipMemoryBtn.style.display = 'block';
    this.elements.restartBtn.style.display = 'block';
    this.elements.gameHint.textContent = '记忆阶段';
    
    this.playInitialRevealAnimation(config);
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
    
    let countdown = duration;
    this.elements.remainingTime.textContent = `剩余时间 ${countdown}s`;
    
    this.memoryTimer = setInterval(() => {
      countdown--;
      this.elements.remainingTime.textContent = `剩余时间 ${countdown}s`;
      this.elements.gameHint.textContent = `记忆阶段`;
      
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
    
    this.gamePhase = 'playing';
    this.elements.cardGrid.classList.remove('memory-phase');
    this.elements.skipMemoryBtn.style.display = 'none';
    this.elements.gameHint.textContent = '配对阶段';
    
    const cards = document.querySelectorAll('.memory-card');
    const cardArray = Array.from(cards);
    
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
    
    // 等所有卡片翻转完成后再开始计时
    const totalFlipTime = shuffledCards.length * delayPerCard + 500;
    setTimeout(() => {
      this.startPlayTimer();
    }, totalFlipTime);
  }

  startPlayTimer() {
    this.playTimer = setInterval(() => {
      if (this.gamePhase !== 'playing') {
        if (this.playTimer) {
          clearInterval(this.playTimer);
          this.playTimer = null;
        }
        return;
      }
      
      this.remainingTime--;
      
      if (this.remainingTime <= 0) {
        this.remainingTime = 0;
        this.updateRemainingTime();
        this.gameFailed();
      } else {
        this.updateRemainingTime();
      }
    }, 1000);
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
    
    const config = this.getLevelConfig();
    if (this.matchedPairs === config.pairs) {
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
    
    if (this.playTimer) {
      clearInterval(this.playTimer);
      this.playTimer = null;
    }
    
    // 隐藏底部的重新开始按钮
    this.elements.restartBtn.style.display = 'none';
    
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
    
    // 设置卡片网格背景色
    this.elements.cardGrid.classList.add('game-over');
    this.elements.cardGrid.classList.remove('level-complete');
    
    // 隐藏整个游戏主容器，显示结果面板
    const gameMainContainer = document.querySelector('.game-main-container');
    if (gameMainContainer) {
      gameMainContainer.style.display = 'none';
    }
    
    // 创建结果面板
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
          <div class="stat-value">${this.matchedPairs}对</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">游戏时长</div>
          <div class="stat-value">${playTime}s</div>
        </div>
      </div>
      
      <div class="result-actions single">
        <button class="btn btn-primary" id="retryBtn">再来一次</button>
      </div>
    `;
    
    // 绑定重试按钮
    setTimeout(() => {
      const retryBtn = document.getElementById('retryBtn');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => this.restartGame());
      }
    }, 100);
    
    // 将结果面板插入到 game-main-container 之后（外面）
    if (gameMainContainer && gameMainContainer.parentNode) {
      gameMainContainer.parentNode.insertBefore(resultPanel, gameMainContainer.nextSibling);
    }
  }

  showNextLevelCountdown() {
    const config = this.getLevelConfig();
    let countdown = 3;
    
    this.elements.gameHint.textContent = `第 ${config.level} 关完成！准备下一关... ${countdown}`;
    this.elements.gameHint.style.display = 'block';
    this.elements.gameHint.classList.add('countdown-success');
    
    const countdownTimer = setInterval(() => {
      countdown--;
      if (countdown > 0) {
        this.elements.gameHint.textContent = `第 ${config.level} 关完成！准备下一关... ${countdown}`;
      } else {
        clearInterval(countdownTimer);
        this.elements.gameHint.classList.remove('countdown-success');
        this.nextLevel();
      }
    }, 1000);
  }

  nextLevel() {
    this.currentLevel++;
    this.resetLevel();
    this.startGame();
  }

  retryLevel() {
    this.hideInlineResult();
    this.resetLevel();
    this.startGame();
  }

  restartGame() {
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
    
    this.currentLevel = 1;
    this.totalLevelsCleared = 0;
    this.levelStartTime = null;
    this.cards = [];
    this.flippedCards = [];
    this.matchedPairs = 0;
    this.isProcessing = false;
    this.remainingTime = 0;
    this.gamePhase = 'idle';
    
    try {
      localStorage.removeItem('memoryMatchProgress');
    } catch (e) {
      console.error('清除进度失败:', e);
    }
    
    this.elements.cardGrid.innerHTML = '';
    this.elements.cardGrid.className = 'card-grid';
    this.elements.cardGrid.style.display = '';
    const gameMainContainer = document.querySelector('.game-main-container');
    if (gameMainContainer) {
      gameMainContainer.style.display = '';
    }
    this.elements.startBtn.style.display = 'block';
    this.elements.skipMemoryBtn.style.display = 'none';
    this.elements.restartBtn.style.display = 'none';
    this.elements.gameHint.textContent = '记忆阶段';
    
    const gameTips = document.getElementById('gameTips');
    if (gameTips) {
      gameTips.style.display = 'flex';
    }
    
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
