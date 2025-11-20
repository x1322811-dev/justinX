/**
 * iframe高度自适应通用脚本
 * 
 * 功能：自动检测页面内容高度变化，并通知父级iframe调整高度
 * 适用场景：任何嵌入在iframe中的动态内容页面
 * 
 * 使用方法：
 * 1. 在HTML页面底部引入此脚本：<script src="iframe-height-bridge.js"></script>
 * 2. 或直接将此脚本内容复制到页面的<script>标签中
 * 3. 在页面内容切换时调用：window.updateIframeHeight()
 * 
 * @version 1.0.0
 */

(function() {
    'use strict';

    /**
     * 注入动态高度样式
     * 确保页面内容可以根据实际高度自动调整
     * 只在 iframe 环境中注入，避免影响独立页面
     */
    function injectDynamicHeightStyles() {
        const styleId = 'iframe-dynamic-height-styles';
        
        // 避免重复注入
        if (document.getElementById(styleId)) {
            return;
        }
        
        // 只在 iframe 中注入样式
        const isInIframe = window.parent !== window;
        if (!isInIframe) {
            console.log('[iframe-height] 非iframe环境，跳过样式注入');
            return;
        }
        
        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* iframe 高度自适应 - 通用样式 */
            body {
                min-height: auto !important;
                height: auto !important;
            }
            
            html {
                height: auto !important;
            }
        `;
        
        document.head.appendChild(style);
        console.log('[iframe-height] 通用动态高度样式已注入');
    }

    /**
     * 计算当前页面实际内容高度
     * @returns {number} 页面高度（像素）
     */
    function calculatePageHeight() {
        // 强制浏览器重新计算布局
        document.body.offsetHeight;
        
        // 优先方案：获取主容器的实际高度
        // 按优先级查找常见的主容器元素
        const mainContainer = document.querySelector('main') || 
                            document.querySelector('#app') ||
                            document.querySelector('.app') ||
                            document.querySelector('.container') ||
                            document.querySelector('[role="main"]') ||
                            document.querySelector('.qb-module');
        
        if (mainContainer) {
            const rect = mainContainer.getBoundingClientRect();
            const containerHeight = rect.height;
            
            // 计算body的额外空间
            const bodyStyle = window.getComputedStyle(document.body);
            const bodyPaddingTop = parseFloat(bodyStyle.paddingTop) || 0;
            const bodyPaddingBottom = parseFloat(bodyStyle.paddingBottom) || 0;
            const bodyMarginTop = parseFloat(bodyStyle.marginTop) || 0;
            const bodyMarginBottom = parseFloat(bodyStyle.marginBottom) || 0;
            
            const totalHeight = containerHeight + bodyPaddingTop + bodyPaddingBottom + 
                              bodyMarginTop + bodyMarginBottom;
            
            return Math.ceil(totalHeight);
        }
        
        // 备用方案：使用body和html的高度
        const body = document.body;
        const html = document.documentElement;
        
        const heights = [
            body.scrollHeight,
            body.offsetHeight,
            html.scrollHeight,
            html.offsetHeight
        ];
        
        return Math.max(...heights);
    }

    /**
     * 更新父级iframe的高度
     * 支持两种方式：直接修改iframe样式 + postMessage通信
     */
    function updateIframeHeight() {
        // 使用requestAnimationFrame确保在渲染帧获取准确高度
        requestAnimationFrame(() => {
            const height = calculatePageHeight();
            
            // 方式1: 尝试直接修改父级iframe元素的高度
            try {
                if (window.parent && window.parent !== window) {
                    const iframes = window.parent.document.querySelectorAll('iframe');
                    for (let iframe of iframes) {
                        try {
                            if (iframe.contentWindow === window) {
                                iframe.style.height = height + 'px';
                                console.log('[iframe-height] 直接更新成功:', height + 'px');
                                break;
                            }
                        } catch (e) {
                            // 跨域限制，继续尝试下一个
                        }
                    }
                }
            } catch (e) {
                // 无法访问父级，可能是跨域
            }
            
            // 方式2: 通过postMessage通知父窗口（备用方案，支持跨域）
            try {
                if (window.parent && window.parent !== window) {
                    window.parent.postMessage({
                        type: 'setIframeHeight',
                        height: height
                    }, '*');
                    console.log('[iframe-height] postMessage发送:', height + 'px');
                }
            } catch (e) {
                console.warn('[iframe-height] 更新失败:', e.message);
            }
        });
    }

    /**
     * 页面内容切换时调用此函数
     * 会立即触发一次，然后延迟触发两次，确保获取准确高度
     */
    function onContentChange() {
        updateIframeHeight();                    // 立即触发
        setTimeout(updateIframeHeight, 50);      // 50ms后触发
        setTimeout(updateIframeHeight, 150);     // 150ms后触发
    }

    // 防抖定时器
    let debounceTimer = null;

    /**
     * 带防抖的高度更新
     * @param {number} delay 防抖延迟时间（毫秒）
     */
    function debouncedUpdate(delay = 10) {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(updateIframeHeight, delay);
    }

    // ==================== 自动监听机制 ====================

    // 1. 监听DOM变化
    const observer = new MutationObserver(() => {
        debouncedUpdate(10);
    });

    observer.observe(document.body, {
        childList: true,      // 监听子节点的添加/删除
        subtree: true,        // 监听所有后代节点
        attributes: true,     // 监听属性变化
        characterData: true   // 监听文本内容变化
    });

    // 2. 监听窗口大小变化
    window.addEventListener('resize', () => {
        debouncedUpdate(50);
    });

    // 3. 监听图片加载
    document.addEventListener('load', (e) => {
        if (e.target.tagName === 'IMG') {
            updateIframeHeight();
        }
    }, true);

    // 4. 页面加载完成后立即更新
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            injectDynamicHeightStyles();
            updateIframeHeight();
        });
    } else {
        injectDynamicHeightStyles();
        updateIframeHeight();
    }

    // 5. 监听来自父窗口的高度请求
    window.addEventListener('message', (event) => {
        if (event.data && (event.data.type === 'request-height' || event.data.type === 'requestHeight')) {
            updateIframeHeight();
        }
    });

    // ==================== 暴露全局方法 ====================

    // 将更新函数暴露到全局，供页面内容切换时调用
    window.updateIframeHeight = updateIframeHeight;
    window.onContentChange = onContentChange;

    console.log('[iframe-height] 自适应脚本已加载');

})();
