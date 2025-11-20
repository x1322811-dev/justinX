/**
 * QB小工具 - 日夜模式自动同步脚本 V2
 * Dark Mode Auto Sync for QB Tools V2
 * 
 * 功能说明：
 * 1. 优先检测浏览器的日夜模式设置（localStorage），其次检测系统偏好
 * 2. 通过设置 data-color-scheme 属性来控制样式
 * 3. 监听系统模式变化并实时切换
 * 4. 支持手动切换并持久化用户偏好
 */

(function() {
  'use strict';

  // 本地存储的键名
  const STORAGE_KEY = 'qb-color-scheme';
  
  /**
   * 获取浏览器存储的模式偏好
   * @returns {string|null} 'dark', 'light' 或 null（未设置）
   */
  function getBrowserPreference() {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      console.debug('[Dark Mode Sync V2] 无法访问 localStorage:', e.message);
      return null;
    }
  }

  /**
   * 保存模式偏好到浏览器
   * @param {string} scheme - 'dark' 或 'light'
   */
  function saveBrowserPreference(scheme) {
    try {
      localStorage.setItem(STORAGE_KEY, scheme);
      console.log('[Dark Mode Sync V2] 已保存用户偏好:', scheme);
    } catch (e) {
      console.debug('[Dark Mode Sync V2] 无法保存到 localStorage:', e.message);
    }
  }

  /**
   * 检测系统是否为夜间模式
   * @returns {boolean} true表示夜间模式，false表示日间模式
   */
  function isSystemDarkMode() {
    // 针对iOS做特殊处理
    if (isIOS()) {
      try {
        // 如果在iframe中，尝试获取主iframe的html
        let targetRoot = document.querySelector('html');
        
        // 尝试访问父窗口的document（如果在iframe中）
        try {
          if (window.parent && window.parent !== window && window.parent.document) {
            targetRoot = window.parent.document.querySelector('html');
          }
        } catch (e) {
          // 跨域限制，继续使用当前document
        }
        
        const darkAttr = targetRoot.attributes.getNamedItem('data-darkreader-scheme');
        
        if (darkAttr) {
          if (darkAttr.value === 'dark') {
            return true; // 夜间模式
          } else {
            return false; // 日间模式
          }
        } else {
          return false;
        }
      } catch (e) {
        console.debug('[Dark Mode Sync V2] iOS特殊处理失败:', e.message);
      }
      return;
    }
    
    // 适配darkreader.js
    if (window.__DARKREADER_COLOR_SCHEME__) {
      return window.__DARKREADER_COLOR_SCHEME__ === 'dark';
    }

    if (window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    return false;
  }

  /**
   * 获取当前应该使用的模式
   * 优先级：浏览器设置 > 系统设置
   * @returns {string} 'dark' 或 'light'
   */
  function getCurrentScheme() {
    // 1. 优先使用浏览器存储的偏好
    const browserPref = getBrowserPreference();
    if (browserPref === 'dark' || browserPref === 'light') {
      console.log('[Dark Mode Sync V2] 使用浏览器偏好:', browserPref);
      return browserPref;
    }

    // 2. 其次使用系统偏好
    const systemIsDark = isSystemDarkMode();
    const scheme = systemIsDark ? 'dark' : 'light';
    console.log('[Dark Mode Sync V2] 使用系统偏好:', scheme);
    return scheme;
  }

  /**
   * 检测是否为iOS QQ浏览器
   */
  function isQQBrowser() {
    const ua = navigator.userAgent.toLowerCase();
    return ua.indexOf('mqqbrowser') > -1 || ua.indexOf('qq/') > -1;
  }

  /**
   * 检测是否为iOS设备
   */
  function isIOS() {
    const ua = navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test(ua);
  }

  /**
   * 移除硬编码的白色背景
   */
  function removeHardcodedWhiteBackgrounds() {
    try {
      // 查找所有可能包含硬编码白色背景的元素
      const allElements = document.querySelectorAll('*');
      let removedCount = 0;
      
      allElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        const bgColor = computedStyle.backgroundColor;
        
        // 检测是否为白色背景 (rgb(255, 255, 255) 或 #ffffff 或 #fff)
        if (bgColor === 'rgb(255, 255, 255)' || bgColor === '#ffffff' || bgColor === '#fff') {
          const inlineStyle = element.style.backgroundColor;
          // 只移除内联样式中的白色背景
          if (inlineStyle && (inlineStyle.toLowerCase() === '#ffffff' || 
              inlineStyle.toLowerCase() === '#fff' || 
              inlineStyle.toLowerCase() === 'white' ||
              inlineStyle.toLowerCase() === 'rgb(255, 255, 255)')) {
            element.style.backgroundColor = '';
            removedCount++;
            console.log('[Dark Mode Sync V2] 已移除硬编码白色背景:', element.tagName, element.className);
          }
        }
      });
      
      if (removedCount > 0) {
        console.log('[Dark Mode Sync V2] 共移除', removedCount, '个硬编码白色背景');
      }
    } catch (e) {
      console.debug('[Dark Mode Sync V2] 移除硬编码背景时出错:', e.message);
    }
  }

  /**
   * 强制修复iOS QQ浏览器的输入框背景
   */
  function forceFixIOSQQBrowserInputs() {
    if (!isIOS() || !isQQBrowser()) {
      return;
    }

    try {
      // 查找所有输入框和文本域
      const inputs = document.querySelectorAll('input, textarea, .qb-input, .qb-textarea, .birthday-input');
      let fixedCount = 0;

      inputs.forEach(input => {
        // 强制设置背景色
        const darkBg = getComputedStyle(document.documentElement).getPropertyValue('--qb-bg-white-dark').trim() || '#1A1A1A';
        input.style.setProperty('background-color', darkBg, 'important');
        input.style.setProperty('background', darkBg, 'important');
        
        // 强制设置文字颜色
        const darkText = getComputedStyle(document.documentElement).getPropertyValue('--qb-text-a1-dark').trim() || '#A3A3A3';
        input.style.setProperty('color', darkText, 'important');
        input.style.setProperty('-webkit-text-fill-color', darkText, 'important');
        
        fixedCount++;
      });

      if (fixedCount > 0) {
        console.log('[Dark Mode Sync V2] iOS QQ浏览器: 已强制修复', fixedCount, '个输入框');
      }
    } catch (e) {
      console.debug('[Dark Mode Sync V2] 修复iOS QQ浏览器输入框时出错:', e.message);
    }
  }

  /**
   * 应用日夜模式
   * @param {string} scheme - 'dark' 或 'light'
   * @param {boolean} savePreference - 是否保存到浏览器（默认false）
   */
  function applyColorScheme(scheme, savePreference = false) {
    const htmlElement = document.documentElement;
    const bodyElement = document.body;
    
    // 设置 data-color-scheme 属性到 html 和 body
    htmlElement.setAttribute('data-color-scheme', scheme);
    if (bodyElement) {
      bodyElement.setAttribute('data-color-scheme', scheme);
    }
    
    // 如果是夜间模式，移除硬编码的白色背景
    if (scheme === 'dark') {
      // 延迟执行以确保DOM完全加载
      setTimeout(() => {
        removeHardcodedWhiteBackgrounds();
        // iOS QQ浏览器需要额外的强制修复
        if (isIOS() && isQQBrowser()) {
          forceFixIOSQQBrowserInputs();
          // 多次尝试修复，因为QQ浏览器可能会延迟应用样式
          setTimeout(forceFixIOSQQBrowserInputs, 200);
          setTimeout(forceFixIOSQQBrowserInputs, 500);
        }
      }, 100);
    }
    
    console.log('[Dark Mode Sync V2] 已切换到', scheme === 'dark' ? '夜间模式' : '日间模式');
    
    // 如果需要，保存用户偏好
    if (savePreference) {
      saveBrowserPreference(scheme);
    }
  }

  /**
   * 初始化日夜模式
   */
  function initColorScheme() {
    const scheme = getCurrentScheme();
    applyColorScheme(scheme, false);
    console.log('[Dark Mode Sync V2] 初始化完成，当前模式:', scheme === 'dark' ? '夜间' : '日间');
  }

  // 全局标记，防止重复初始化监听器
  let isWatchingSystemColorScheme = false;
  
  /**
   * 监听系统日夜模式变化
   * 注意：只有在用户未手动设置偏好时，才响应系统变化
   */
  function watchSystemColorScheme() {
    // 防止重复初始化
    if (isWatchingSystemColorScheme) {
      console.log('[Dark Mode Sync V2] 系统监听已初始化，跳过重复设置');
      return;
    }
    
    // 复用的处理逻辑
    const handleChange = (e) => {
      // 只有在没有浏览器偏好设置时，才响应系统变化
      const browserPref = getBrowserPreference();
      if (!browserPref) {
        const scheme = e.matches ? 'dark' : 'light';
        applyColorScheme(scheme, false);
        console.log('[Dark Mode Sync V2] 系统模式已变化:', scheme === 'dark' ? '夜间' : '日间');
      } else {
        console.log('[Dark Mode Sync V2] 检测到系统模式变化，但浏览器偏好优先，保持当前设置');
      }
    };
    
    // 针对iOS做特殊处理
    if (isIOS()) {
      // 获取需要 hook 的 DarkReader 对象（优先主 frame，其次当前 window）
      let targetDarkReader = null;
      let targetWindow = null;
      
      try {
        // 尝试访问父窗口的 DarkReader（如果在 iframe 中）
        if (window.parent && window.parent !== window && window.parent.DarkReader) {
          targetDarkReader = window.parent.DarkReader;
          targetWindow = window.parent;
          console.log('[Dark Mode Sync V2] iOS: 找到父窗口的DarkReader');
        }
      } catch (e) {
        console.debug('[Dark Mode Sync V2] iOS: 无法访问父窗口DarkReader（跨域限制）:', e.message);
      }
      
      // 如果无法访问父窗口，使用当前窗口的 DarkReader
      if (!targetDarkReader && window.DarkReader) {
        targetDarkReader = window.DarkReader;
        targetWindow = window;
        console.log('[Dark Mode Sync V2] iOS: 使用当前窗口的DarkReader');
      }
      
      // 复写DarkReader方法来监听日夜间切换
      if (targetDarkReader) {
        // 检查是否已经被 hook 过了
        if (!targetDarkReader._qbHooked) {
          // 保存原始方法
          const originalForceEnable = targetDarkReader.forceEnable;
          const originalForceDisable = targetDarkReader.forceDisable;
          
          // 复写forceEnable
          targetDarkReader.forceEnable = function() {
            // 调用原始forceEnable
            if (originalForceEnable) {
              originalForceEnable.apply(this, arguments);
            }
            // 执行监听
            handleChange({"matches": true});
          };
          
          // 复写forceDisable
          targetDarkReader.forceDisable = function() {
            // 调用原始forceDisable
            if (originalForceDisable) {
              originalForceDisable.apply(this, arguments);
            }
            // 执行监听
            handleChange({"matches": false});
          };
          
          // 标记已经被 hook
          targetDarkReader._qbHooked = true;
          
          console.log('[Dark Mode Sync V2] iOS: 已设置DarkReader监听', targetWindow === window.parent ? '(主窗口)' : '(当前窗口)');
        } else {
          console.log('[Dark Mode Sync V2] iOS: DarkReader已被hook，跳过重复设置');
        }
        
        console.log('[Dark Mode Sync V2] iOS: 已开始监听系统模式变化');

      // 标记已初始化
      isWatchingSystemColorScheme = true;
      return;

      } else {
        console.log('[Dark Mode Sync V2] iOS: DarkReader未找到，跳过监听设置');
      }
      
    }
    
    // 原有逻辑
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      // 监听变化（现代浏览器）
      if (darkModeQuery.addEventListener) {
        darkModeQuery.addEventListener('change', handleChange);
      } 
      // 兼容旧版浏览器
      else if (darkModeQuery.addListener) {
        darkModeQuery.addListener(handleChange);
      }
      
      console.log('[Dark Mode Sync V2] 已开始监听系统模式变化');
    }
    
    // 标记已初始化
    isWatchingSystemColorScheme = true;
  }

  /**
   * 向父窗口通知当前模式（可选功能）
   */
  function notifyParentWindow(scheme) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({
          type: 'iframe-color-scheme-change',
          colorScheme: scheme,
          source: 'qb-tool-iframe'
        }, '*');
        console.log('[Dark Mode Sync V2] 已通知父窗口模式变化:', scheme);
      }
    } catch (e) {
      console.debug('[Dark Mode Sync V2] 无法通知父窗口:', e.message);
    }
  }

  /**
   * 切换日夜模式
   * @param {boolean} savePreference - 是否保存用户偏好（默认true）
   */
  function toggleColorScheme(savePreference = true) {
    const currentScheme = document.documentElement.getAttribute('data-color-scheme');
    const newScheme = currentScheme === 'dark' ? 'light' : 'dark';
    applyColorScheme(newScheme, savePreference);
    notifyParentWindow(newScheme);
    return newScheme;
  }

  /**
   * 设置指定的日夜模式
   * @param {string} scheme - 'dark' 或 'light'
   * @param {boolean} savePreference - 是否保存用户偏好（默认true）
   */
  function setColorScheme(scheme, savePreference = true) {
    if (scheme !== 'dark' && scheme !== 'light') {
      console.error('[Dark Mode Sync V2] 无效的模式:', scheme);
      return;
    }
    applyColorScheme(scheme, savePreference);
    notifyParentWindow(scheme);
  }

  /**
   * 清除浏览器偏好，恢复使用系统设置
   */
  function resetToSystemPreference() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log('[Dark Mode Sync V2] 已清除浏览器偏好');
    } catch (e) {
      console.debug('[Dark Mode Sync V2] 无法清除 localStorage:', e.message);
    }
    initColorScheme();
  }

  // ==================== 自动执行 ====================

  // 页面加载时立即初始化（在脚本执行时就尝试设置）
  if (document.readyState === 'loading') {
    // 立即设置一次，避免闪烁
    const scheme = getCurrentScheme();
    document.documentElement.setAttribute('data-color-scheme', scheme);
    
    document.addEventListener('DOMContentLoaded', () => {
      initColorScheme();
      watchSystemColorScheme();
    });
  } else {
    // 如果脚本加载时DOM已就绪，立即执行
    initColorScheme();
    watchSystemColorScheme();
  }

  // ==================== 暴露全局方法 ====================

  window.QBColorScheme = {
    // 获取当前模式
    get current() {
      return document.documentElement.getAttribute('data-color-scheme') || 'light';
    },
    
    // 检测系统是否为夜间模式
    isSystemDark: isSystemDarkMode,
    
    // 获取浏览器存储的偏好
    getBrowserPreference: getBrowserPreference,
    
    // 设置指定模式（会保存偏好）
    set: (scheme) => setColorScheme(scheme, true),
    
    // 设置指定模式（不保存偏好）
    setTemporary: (scheme) => setColorScheme(scheme, false),
    
    // 切换日夜模式
    toggle: toggleColorScheme,
    
    // 重置为系统偏好
    reset: resetToSystemPreference,
    
    // 强制刷新模式
    refresh: initColorScheme
  };

  console.log('[Dark Mode Sync V2] 脚本已加载，全局方法已暴露: window.QBColorScheme');
  console.log('[Dark Mode Sync V2] 使用示例:');
  console.log('  - 切换模式: QBColorScheme.toggle()');
  console.log('  - 设置夜间: QBColorScheme.set("dark")');
  console.log('  - 设置日间: QBColorScheme.set("light")');
  console.log('  - 重置偏好: QBColorScheme.reset()');

})();
