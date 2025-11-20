const fs = require('fs');
const path = require('path');

class ToolBuilder {
    constructor() {
        this.configPath = 'tools.config.json';
        this.config = this.loadConfig();
        this.buildCache = new Map(); // 构建缓存
    }

    loadConfig() {
        try {
            const configContent = fs.readFileSync(this.configPath, 'utf8');
            return JSON.parse(configContent);
        } catch (error) {
            console.error('❌ 配置文件加载失败:', error.message);
            process.exit(1);
        }
    }

    // 获取文件最后修改时间
    getFileModTime(filePath) {
        try {
            return fs.statSync(filePath).mtime.getTime();
        } catch {
            return 0;
        }
    }

    // 检查工具的特定平台版本是否需要重新构建
    needsRebuildForPlatform(tool, platformKey) {
        const platformConfig = this.config.platforms[platformKey];
        const outputPath = tool.platforms[platformKey].output;
        const outputModTime = this.getFileModTime(outputPath);
        
        if (outputModTime === 0) {
            return true; // 输出文件不存在
        }

        // 检查相关文件的修改时间
        const sourceFiles = [
            tool.component,
            tool.css.replace('../', ''),
            platformConfig.template,
            this.configPath
        ];

        // 检查JavaScript文件
        const jsPath = tool.component.replace('-pure.html', '.js');
        if (fs.existsSync(jsPath)) {
            sourceFiles.push(jsPath);
        }

        // 检查平台特定的CSS文件
        const platformCssPath = platformConfig.template.replace('.html', '.css');
        if (fs.existsSync(platformCssPath)) {
            sourceFiles.push(platformCssPath);
        }

        for (const file of sourceFiles) {
            if (this.getFileModTime(file) > outputModTime) {
                return true;
            }
        }

        return false;
    }

    // 检查工具是否需要重新构建（任一平台）
    needsRebuild(tool) {
        for (const [platformKey] of Object.entries(this.config.platforms)) {
            if (tool.platforms && tool.platforms[platformKey]) {
                if (this.needsRebuildForPlatform(tool, platformKey)) {
                    return true;
                }
            }
        }
        return false;
    }

    // 转换脚本路径
    transformScriptPaths(scriptContent, toolName, platformKey) {
        const pathPrefix = platformKey ? '../../' : '../';
        return scriptContent.replace(
            /src=["']\.\/([^"']+)["']/g,
            `src="${pathPrefix}components/${toolName}/$1"`
        );
    }

    // 转换CSS路径
    transformCssPath(cssPath, platformKey) {
        // 如果路径已经是相对路径（以../开头），需要调整层级
        if (cssPath.startsWith('../')) {
            // 移除原有的../，然后根据平台添加正确的层级
            const relativePath = cssPath.substring(3); // 移除 '../'
            const pathPrefix = platformKey ? '../../' : '../';
            return `${pathPrefix}${relativePath}`;
        }
        // 如果是绝对路径或其他格式，直接返回
        return cssPath;
    }

    // 读取CSS文件内容
    readCssContent(cssPath) {
        try {
            return fs.readFileSync(cssPath, 'utf8');
        } catch (error) {
            console.warn(`⚠️  CSS文件读取失败: ${cssPath}`);
            return '';
        }
    }

    // 读取JS文件内容
    readJsContent(jsPath) {
        try {
            return fs.readFileSync(jsPath, 'utf8');
        } catch (error) {
            console.warn(`⚠️  JS文件读取失败: ${jsPath}`);
            return '';
        }
    }

    // 提取工具HTML的body内容和资源
    extractToolContent(htmlContent) {
        // 提取<head>中的CSS内容
        const headCssMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/g);
        let toolCss = '';
        if (headCssMatch) {
            toolCss = headCssMatch.map(match => 
                match.replace(/<\/?style[^>]*>/g, '')
            ).join('\n');
        }

        // 分别提取<head>和<body>部分
        const headMatch = htmlContent.match(/<head[^>]*>([\s\S]*?)<\/head>/);
        const bodyMatch = htmlContent.match(/<body[^>]*>([\s\S]*?)<\/body>/);
        
        let allJavaScript = '';
        
        // 提取<head>中的JavaScript内容
        if (headMatch) {
            const headContent = headMatch[1];
            const headJsMatch = headContent.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
            if (headJsMatch) {
                const headJs = headJsMatch.filter(match => 
                    !match.includes('src=') // 只提取内联脚本，忽略外部引用
                ).map(match => 
                    match.replace(/<\/?script[^>]*>/g, '')
                ).join('\n');
                if (headJs.trim()) {
                    allJavaScript += headJs;
                }
            }
        }

        // 提取<body>中的内容
        let toolBodyContent = '';
        if (bodyMatch) {
            const originalBodyContent = bodyMatch[1];
            
            // 先从整个body中提取JavaScript（在处理main之前）
            const bodyJsMatch = originalBodyContent.match(/<script[^>]*>([\s\S]*?)<\/script>/g);
            if (bodyJsMatch) {
                console.log(`🔍 发现 ${bodyJsMatch.length} 个script标签`);
                // 修复：检查 script 标签本身是否有 src 属性，而不是检查整个内容
                const inlineScripts = bodyJsMatch.filter(match => {
                    const tagMatch = match.match(/<script([^>]*)>/);
                    return tagMatch && !tagMatch[1].includes('src=');
                });
                console.log(`📝 内联脚本数量: ${inlineScripts.length}`);
                
                const bodyJs = inlineScripts.map(match => {
                    const jsContent = match.replace(/<\/?script[^>]*>/g, '');
                    console.log(`📏 脚本长度: ${jsContent.length}字符`);
                    return jsContent;
                }).join('\n');
                
                if (bodyJs.trim()) {
                    allJavaScript += (allJavaScript ? '\n' : '') + bodyJs;
                    console.log(`✅ 成功提取JavaScript，总长度: ${allJavaScript.length}字符`);
                } else {
                    console.log(`⚠️  提取的JavaScript为空`);
                }
            } else {
                console.log('⚠️  未找到任何script标签');
            }
            
            // 从body内容中移除所有JavaScript标签
            toolBodyContent = originalBodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/g, '');
            
            // 如果内容被<main>标签包裹，提取main内的内容，同时保留main标签外的其他元素（如模态框）
            const mainMatch = toolBodyContent.match(/<main[^>]*>([\s\S]*?)<\/main>/);
            if (mainMatch) {
                const mainContent = mainMatch[1];
                // 提取main标签之后的内容（如模态框等）
                const afterMainContent = toolBodyContent.substring(toolBodyContent.indexOf('</main>') + 7);
                toolBodyContent = mainContent + afterMainContent;
            }
        }

        // 提取外部资源引用
        const externalScripts = [];
        const scriptSrcMatches = htmlContent.match(/<script[^>]*src=["']([^"']+)["'][^>]*>/g);
        if (scriptSrcMatches) {
            scriptSrcMatches.forEach(match => {
                const srcMatch = match.match(/src=["']([^"']+)["']/);
                if (srcMatch) {
                    externalScripts.push(srcMatch[1]);
                }
            });
        }

        return {
            css: toolCss,
            bodyContent: toolBodyContent.trim(),
            javascript: allJavaScript,
            externalScripts: externalScripts
        };
    }

    // 分析CSS中使用的变量
    analyzeUsedCssVariables(cssContent, htmlContent) {
        const usedVars = new Set();
        
        // 1. 从CSS中提取所有使用的变量（var(--xxx)）
        const varUsageRegex = /var\(\s*(--[a-zA-Z0-9-]+)\s*(?:,\s*[^)]+)?\)/g;
        let match;
        while ((match = varUsageRegex.exec(cssContent)) !== null) {
            usedVars.add(match[1]);
        }
        
        // 2. 从HTML内联样式中提取使用的变量
        const inlineStyleRegex = /style\s*=\s*["']([^"']*var\([^"']*\))/g;
        while ((match = inlineStyleRegex.exec(htmlContent)) !== null) {
            const inlineVars = match[1].match(/var\(\s*(--[a-zA-Z0-9-]+)\s*(?:,\s*[^)]+)?\)/g);
            if (inlineVars) {
                inlineVars.forEach(v => {
                    const varMatch = v.match(/var\(\s*(--[a-zA-Z0-9-]+)/);
                    if (varMatch) usedVars.add(varMatch[1]);
                });
            }
        }
        
        // 3. 从HTML的<style>标签中提取CSS并分析使用的变量
        const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/g;
        while ((match = styleTagRegex.exec(htmlContent)) !== null) {
            const styleCss = match[1];
            const styleVarRegex = /var\(\s*(--[a-zA-Z0-9-]+)\s*(?:,\s*[^)]+)?\)/g;
            let styleMatch;
            while ((styleMatch = styleVarRegex.exec(styleCss)) !== null) {
                usedVars.add(styleMatch[1]);
            }
        }
        
        return usedVars;
    }

    // 移除未使用的CSS变量定义
    removeUnusedCssVariables(cssContent, usedVars) {
        const lines = cssContent.split('\n');
        const result = [];
        let inBlock = false;
        let blockContent = [];
        let removedCount = 0;
        let emptyLineCount = 0;
        let mediaDepth = 0;
        let multiLineSelector = false; // 处理多行选择器
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // 检测 @media 块的开始
            if (trimmedLine.startsWith('@media') && trimmedLine.includes('prefers-color-scheme')) {
                result.push(line);
                mediaDepth++;
                continue;
            }
            
            // 检测变量块的开始
            if (!inBlock) {
                // 先检查是否在处理多行选择器（优先级更高）
                if (multiLineSelector) {
                    blockContent.push(line);
                    if (trimmedLine.endsWith('{')) {
                        inBlock = true;
                        multiLineSelector = false;
                    }
                    continue;
                }
                
                // 再检查是否是新的变量块
                if (trimmedLine.startsWith(':root') || 
                    trimmedLine.startsWith('body.light-theme') || 
                    trimmedLine.startsWith('body.dark-theme') ||
                    trimmedLine.startsWith('[data-color-scheme=')) {
                    
                    // 检查是否是多行选择器（以逗号结尾）
                    if (trimmedLine.endsWith(',')) {
                        multiLineSelector = true;
                        blockContent = [line];
                        continue;
                    } else if (trimmedLine.endsWith('{')) {
                        inBlock = true;
                        blockContent = [line];
                        continue;
                    } else {
                        // 选择器单独一行，没有 {
                        blockContent = [line];
                        multiLineSelector = true;
                        continue;
                    }
                }
            }
            
            // 在变量块内
            if (inBlock) {
                // 检测块结束
                if (trimmedLine === '}') {
                    inBlock = false;
                    
                    // 检查是否是 @media 块的结束
                    if (mediaDepth > 0 && blockContent.length === 0) {
                        mediaDepth--;
                        result.push(line);
                        continue;
                    }
                    
                    // 只有当blockContent有实际内容时才添加
                    if (blockContent.length > 1) {
                        result.push(...blockContent, line);
                    }
                    blockContent = [];
                    continue;
                }
                
                // 检查是否是变量定义行
                const varDefMatch = line.match(/^\s*(--[a-zA-Z0-9-]+)\s*:/);
                if (varDefMatch) {
                    const varName = varDefMatch[1];
                    if (usedVars.has(varName)) {
                        blockContent.push(line);
                    } else {
                        removedCount++;
                    }
                } else if (trimmedLine === '') {
                    // 跳过块内的空行
                    emptyLineCount++;
                } else {
                    // 保留注释和其他内容
                    blockContent.push(line);
                }
            } else {
                // 不在变量块内
                if (trimmedLine === '}' && mediaDepth > 0) {
                    // @media 块结束
                    mediaDepth--;
                    result.push(line);
                } else if (trimmedLine === '') {
                    // 只保留一个连续的空行
                    if (result.length > 0 && result[result.length - 1].trim() !== '') {
                        result.push(line);
                    } else {
                        emptyLineCount++;
                    }
                } else {
                    result.push(line);
                }
            }
        }
        
        if (removedCount > 0) {
            console.log(`🧹 已移除 ${removedCount} 个未使用的CSS变量`);
        }
        if (emptyLineCount > 0) {
            console.log(`🧹 已清理 ${emptyLineCount} 个空白行`);
        }
        
        return result.join('\n');
    }

    // 精简CSS注释
    minifyComments(cssContent) {
        // 保留重要的注释（包含 IMPORTANT, NOTE, WARNING, TODO 等关键词）
        const importantKeywords = ['IMPORTANT', 'NOTE', 'WARNING', 'TODO', 'FIXME', '版权', 'Copyright', 'License'];
        
        return cssContent.replace(/\/\*[\s\S]*?\*\//g, (comment) => {
            // 检查是否包含重要关键词
            const hasImportantKeyword = importantKeywords.some(keyword => 
                comment.toUpperCase().includes(keyword.toUpperCase())
            );
            
            if (hasImportantKeyword) {
                return comment; // 保留重要注释
            }
            
            return ''; // 移除普通注释
        });
    }

    // 清理CSS中的多余空白行
    cleanupCssWhitespace(cssContent) {
        const lines = cssContent.split('\n');
        const result = [];
        let inBlock = false;
        let blockDepth = 0;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmedLine = line.trim();
            
            // 跟踪块的深度
            if (trimmedLine.includes('{')) {
                blockDepth++;
                inBlock = true;
            }
            
            // 处理空白行
            if (trimmedLine === '') {
                // 在 CSS 规则块内，跳过所有空白行
                if (inBlock && blockDepth > 0) {
                    continue;
                }
                // 在块外，只保留一个连续的空白行
                if (result.length > 0 && result[result.length - 1].trim() !== '') {
                    result.push(line);
                }
            } else {
                result.push(line);
            }
            
            // 跟踪块的结束
            if (trimmedLine.includes('}')) {
                blockDepth--;
                if (blockDepth === 0) {
                    inBlock = false;
                }
            }
        }
        
        return result.join('\n');
    }

    // 内联CSS和JS到HTML内容中
    inlineAssets(templateContent, toolExtracted, tool, platformKey) {
        let inlinedContent = templateContent;

        // 1. 先处理模板中的外部script引用（在模板的 templates/ 文件夹中）
        const templateDir = path.dirname(this.config.platforms[platformKey].template);
        const templateScriptMatches = inlinedContent.match(/<script[^>]*src=["']([^"']+)["'][^>]*><\/script>/g);

        if (templateScriptMatches) {
            templateScriptMatches.forEach(scriptTag => {
                const srcMatch = scriptTag.match(/src=["']([^"']+)["']/);
                if (srcMatch) {
                    const src = srcMatch[1];
                    
                    // 只处理本地文件（不是http://或https://）
                    if (!src.startsWith('http://') && !src.startsWith('https://')) {
                        const jsPath = path.resolve(templateDir, src);
                        
                        if (fs.existsSync(jsPath)) {
                            const jsContent = this.readJsContent(jsPath);
                            if (jsContent.trim()) {
                                console.log(`📥 内联模板JS: ${src}`);
                                // 将外部引用替换为内联脚本
                                inlinedContent = inlinedContent.replace(
                                    scriptTag,
                                    `<script>\n${jsContent}\n  </script>`
                                );
                            }
                        } else {
                            console.warn(`⚠️  模板JavaScript文件不存在: ${jsPath}`);
                        }
                    }
                }
            });
        }

        // 收集所有需要分析的CSS文件
        const cssFiles = [];
        
        // 根据平台选择颜色变量
        if (platformKey === 'tn') {
            const sharedCssPath = 'components/shared/shared.css';
            const tnColorsCssPath = 'components/shared/variables-tn.css';
            
            if (fs.existsSync(sharedCssPath)) {
                cssFiles.push(sharedCssPath);
            }
            if (fs.existsSync(tnColorsCssPath)) {
                cssFiles.push(tnColorsCssPath);
            }
        } else if (platformKey === 'qb') {
            const sharedCssPath = 'components/shared/shared.css';
            const qbColorsCssPath = 'components/shared/variables-qb.css';
            
            if (fs.existsSync(sharedCssPath)) {
                cssFiles.push(sharedCssPath);
            }
            if (fs.existsSync(qbColorsCssPath)) {
                cssFiles.push(qbColorsCssPath);
            }
        }

        // 添加工具特定的CSS
        const toolCssPath = tool.component.replace('-pure.html', '-refactored.css');
        if (fs.existsSync(toolCssPath)) {
            cssFiles.push(toolCssPath);
        } else {
            const originalToolCssPath = tool.component.replace('-pure.html', '.css');
            if (fs.existsSync(originalToolCssPath)) {
                cssFiles.push(originalToolCssPath);
            }
        }

        // 合并所有CSS
        let allCssContent = '';
        if (cssFiles.length > 0) {
            allCssContent = cssFiles.map(file => {
                try {
                    return fs.readFileSync(file, 'utf8');
                } catch (error) {
                    console.warn(`⚠️  无法读取CSS文件: ${file}`);
                    return '';
                }
            }).join('\n');
        }
        
        // 添加工具内联CSS
        if (toolExtracted.css.trim()) {
            allCssContent += '\n' + toolExtracted.css;
        }

        // 优化CSS：分析使用的变量并移除未使用的
        // 需要同时分析模板内容和工具内容，因为模板中也使用了CSS变量（如 --bg-grey）
        const combinedHtmlContent = templateContent + '\n' + toolExtracted.bodyContent;
        const usedVars = this.analyzeUsedCssVariables(allCssContent, combinedHtmlContent);
        console.log(`🔍 检测到 ${usedVars.size} 个使用中的CSS变量`);
        allCssContent = this.removeUnusedCssVariables(allCssContent, usedVars);
        
        // 精简注释
        const originalLength = allCssContent.length;
        allCssContent = this.minifyComments(allCssContent);
        const savedBytes = originalLength - allCssContent.length;
        if (savedBytes > 0) {
            console.log(`📝 精简注释节省: ${(savedBytes / 1024).toFixed(2)} KB`);
        }

        // 清理CSS空白行
        allCssContent = this.cleanupCssWhitespace(allCssContent);

        // 将CSS插入到模板的style标签中
        if (allCssContent.trim()) {
            // 1. 先移除 BUILD_PLACEHOLDER 部分（开发预览用的CSS变量）
            inlinedContent = inlinedContent.replace(
                /\/\* BUILD_PLACEHOLDER_START \*\/[\s\S]*?\/\* BUILD_PLACEHOLDER_END \*\//,
                '/* CSS变量已由构建脚本内联 */'
            );
            
            // 2. 再插入优化后的CSS
            inlinedContent = inlinedContent.replace(
                /(\s*)<\/style>/,
                `\n${allCssContent}$1</style>`
            );
        }

        // 处理JavaScript文件 - 内联本地JS文件，保留外部CDN引用
        let allJavaScript = toolExtracted.javascript;
        const externalScriptTags = [];
        
        for (const src of toolExtracted.externalScripts) {
            if (src.startsWith('http://') || src.startsWith('https://')) {
                // 外部CDN资源，保留引用
                externalScriptTags.push(`  <script src="${src}"></script>`);
            } else {
                // 本地文件，读取并内联
                const jsPath = path.resolve(path.dirname(tool.component), src);
                if (fs.existsSync(jsPath)) {
                    const jsContent = this.readJsContent(jsPath);
                    if (jsContent.trim()) {
                        allJavaScript += '\n' + jsContent;
                    }
                } else {
                    console.warn(`⚠️  JavaScript文件不存在: ${jsPath}`);
                    // 如果文件不存在，仍然保留引用
                    externalScriptTags.push(`  <script src="${src}"></script>`);
                }
            }
        }

        // 添加所有JavaScript到页面底部（在日夜间模式脚本之前）
        if (allJavaScript.trim()) {
            const toolScript = `\n  <script>\n${allJavaScript}\n  </script>\n`;
            
            // 查找日夜间模式脚本的注释标记
            const templateScriptMarker = /(\s*)<!--\s*日夜间模式自动同步脚本\s*-->/;
            
            if (templateScriptMarker.test(inlinedContent)) {
                // 在日夜间模式脚本之前插入工具JS
                inlinedContent = inlinedContent.replace(
                    templateScriptMarker,
                    `${toolScript}$1<!-- 日夜间模式自动同步脚本 -->`
                );
            } else {
                // 如果没有找到标记，则插入到 </body> 之前（兜底方案）
                inlinedContent = inlinedContent.replace(
                    /(\s*)<\/body>/,
                    `${toolScript}$1</body>`
                );
            }
        }

        // 添加外部CDN脚本引用
        if (externalScriptTags.length > 0) {
            inlinedContent = inlinedContent.replace(
                /(\s*)<\/body>/,
                `\n${externalScriptTags.join('\n')}$1</body>`
            );
        }

        console.log(`🎯 CSS优化: ${cssFiles.length}个平台文件 + 工具内联CSS → 已优化`);
        
        // 清理多余的空白行（连续3个以上空行压缩为2个）
        inlinedContent = inlinedContent.replace(/\n{4,}/g, '\n\n\n');
        // 进一步清理：连续2个以上空行压缩为1个
        inlinedContent = inlinedContent.replace(/\n{3,}/g, '\n\n');
        
        return inlinedContent;
    }

    // 生成QQ浏览器XML配置文件
    generateQBXml(tool, htmlContent) {
        // 基于新的通用xml模版生成XML
        const xmlKey = `${tool.name}_tool_qb`;  // 例如: translator_tool_qb
        
        // 生成召回词（基于工具名称和标题）
        const generateRecallWords = () => {
            const toolKeywords = {
                'translator': {
                    top: '翻译;AI翻译;智能翻译;在线翻译;语言翻译;多语言翻译;文本翻译;翻译工具',
                    middle: '翻译器;免费翻译;中英翻译;英语翻译;日语翻译;韩语翻译;法语翻译;德语翻译;西班牙语翻译'
                },
                'almanac': {
                    top: '黄历;老黄历;今日黄历;黄道吉日;择吉日;万年历;吉日查询',
                    middle: '宜忌;冲煞;值神;今日运势;传统黄历;农历黄历'
                },
                'relationship': {
                    top: '亲戚称呼;亲戚关系;称呼计算器;亲属关系;家庭称呼;三姑六婆',
                    middle: '亲戚叫法;称谓;辈分;家族关系;亲属称谓'
                },
                'qrcode': {
                    top: '二维码生成;生成二维码;二维码制作;QR码生成器;扫码',
                    middle: '二维码工具;二维码美化;二维码下载;免费二维码'
                },
                'whitenoise': {
                    top: '白噪音;白噪声;助眠音乐;专注音乐;放松音乐;环境音',
                    middle: '助眠;学习音乐;工作音乐;冥想音乐;自然音效'
                },
                'petage': {
                    top: '宠物年龄;猫狗年龄;宠物年龄计算;宠物寿命;猫咪年龄;狗狗年龄',
                    middle: '宠物成长;宠物健康;猫年龄对照;狗年龄对照'
                },
                'bmi': {
                    top: 'BMI;BMI计算;身体质量指数;体重指数;健康指数;标准体重',
                    middle: '体重计算;健康评估;肥胖指数;体脂率'
                },
                'holiday': {
                    top: '放假安排;放假查询;假期安排;节假日;调休时间;法定节假日',
                    middle: '放假时间;假期日历;国庆放假;春节放假;元旦放假'
                },
                'wuxing': {
                    top: '五行穿衣;穿衣指南;今日穿衣;五行配色;穿搭颜色;幸运色',
                    middle: '穿衣建议;今日幸运色;五行颜色;穿搭指南'
                }
            };
            
            const keywords = toolKeywords[tool.name] || {
                top: `${tool.title};${tool.name}`,
                middle: `${tool.subtitle};工具;查询`
            };
            
            return keywords;
        };
        
        const recallWords = generateRecallWords();
        
        // 生成动效提示信息（motion_copy_ch）
        const generateMotionCopyCh = () => {
            const templates = {
                'translator': '好的，用户现在想使用AI智能翻译工具，支持38种语言互译，让我来写一个。',
                'almanac': '好的，用户现在想查看今日黄历，了解宜忌事项和黄道吉日，让我来写一个。',
                'relationship': '好的，用户现在想查询亲戚称呼，理清复杂的亲属关系，让我来写一个。',
                'qrcode': '好的，用户现在想生成二维码，快速制作专业的QR码，让我来写一个。',
                'whitenoise': '好的，用户现在想使用白噪音工具，定制专属的背景音环境，让我来写一个。',
                'petage': '好的，用户现在想计算宠物年龄，了解爱宠的真实年龄，让我来写一个。',
                'bmi': '好的，用户现在想计算BMI指数，科学评估身体质量，让我来写一个。',
                'holiday': '好的，用户现在想查看放假安排，了解节假日时间和调休信息，让我来写一个。',
                'wuxing': '好的，用户现在想查看五行穿衣指南，获取今日穿搭配色建议，让我来写一个。'
            };
            
            return templates[tool.name] || `好的，用户现在想使用${tool.title}工具，让我来写一个。`;
        };
        
        // 判断工具类型（用过 vs 玩过）
        const getUsedType = () => {
            const playTypes = ['whitenoise']; // 白噪音等娱乐性质的用"玩过"
            return playTypes.includes(tool.name) ? '玩过' : '用过';
        };
        
        // 生成初始使用人数
        const getInitNum = () => {
            const initNums = {
                'translator': '2856',
                'almanac': '1842',
                'relationship': '1523',
                'qrcode': '3167',
                'whitenoise': '987',
                'petage': '1256',
                'bmi': '2134',
                'holiday': '2945',
                'wuxing': '1678'
            };
            return initNums[tool.name] || '1000';
        };
        
        // 生成分享相关信息
        const getShareInfo = () => {
            const shareInfos = {
                'translator': {
                    title: '[QBot·AI智能翻译]',
                    description: '支持38种语言互译，让沟通无国界。'
                },
                'almanac': {
                    title: '[QBot·AI今日黄历]',
                    description: '每日查黄历，万事皆顺意。'
                },
                'relationship': {
                    title: '[QBot·亲戚称呼计算器]',
                    description: '理清亲属关系，称呼不再尴尬。'
                },
                'qrcode': {
                    title: '[QBot·二维码生成器]',
                    description: '快速生成专业二维码，简单高效。'
                },
                'whitenoise': {
                    title: '[QBot·白噪音工具]',
                    description: '定制专属背景音，助眠、专注、放松。'
                },
                'petage': {
                    title: '[QBot·宠物年龄计算器]',
                    description: '了解爱宠真实年龄，科学养宠。'
                },
                'bmi': {
                    title: '[QBot·BMI计算器]',
                    description: '科学评估身体质量，健康生活从了解开始。'
                },
                'holiday': {
                    title: '[QBot·放假安排查询]',
                    description: '节假日时间早知道，合理安排行程。'
                },
                'wuxing': {
                    title: '[QBot·五行穿衣指南]',
                    description: '今日穿搭配色建议，让你更有运势。'
                }
            };
            
            return shareInfos[tool.name] || {
                title: `[QBot·${tool.title}]`,
                description: `${tool.subtitle}`
            };
        };
        
        const shareInfo = getShareInfo();
        
        // CodeBuddy logo URL（用于url_logo和share_logo）
        const codeBuddyLogo = 'https://img04.sogoucdn.com/app/a/200797/099403a1-4e19-4993-bc5b-14f20c22b0a8';
        
        const xmlTemplate = `<?xml version="1.0" encoding="utf-8" standalone="yes"?>
<DOCUMENT>
  <item>
    <key><![CDATA[${xmlKey}]]></key>
    <!-- 请务必填写：key，必填标签。一定要填，用来和其他卡片区分，所以可以起的特殊一些，字母数字汉字都能组合。 -->
    <display>
      <title><![CDATA[${tool.title}]]></title>
      <!-- 标题，必填标签。最多出现1次。最少1字节，最多128字节。 -->
      <url><![CDATA[http://open-sogou（若url字段不在前端使用，请统一使用此标记）]]></url>
      <!-- url，必填标签。这条不用改，不用管。 -->
      <motion_copy><![CDATA[${htmlContent}]]></motion_copy>
      <!-- 请务必填写：AI调试好的代码，有的卡可能有特殊字符，需要让AI转为能直接粘贴到xml的cdata中的格式，多数卡片是可以直接粘贴html中代码进去。 -->
      <url_logo><![CDATA[${codeBuddyLogo}]]></url_logo>
      <!-- 底部参考来源的logo url，不同卡片可能不同，请务必取xml中的，必填标签。一般情况下是展示codebuddy的，现在这个链接是codebuddy的。 -->
      <source><![CDATA[CodeBuddy]]></source>
      <!-- 底部参考来源，必填标签。最多出现1次。最少0字节，最多1024字节。 -->
      <recall_top><![CDATA[${recallWords.top}]]></recall_top>
      <!-- 强需召回词，用户配置固排，配置在这里的词，会出在首位，只能放适合出首位的强需词；多个召回词间以英文分号分隔;，必填标签。最多出现1次。最少1字节，最多1024字节。 -->
      <recall_middle><![CDATA[${recallWords.middle}]]></recall_middle>
      <!-- 中弱需召回词，配置到这里的词，会走点调逻辑，不一定出首位；多个词以英文分号分隔；，必填标签。最多出现1次。最少0字节，最多1024字节。 -->
      <motion_copy_ch><![CDATA[${generateMotionCopyCh()}]]></motion_copy_ch>
      <!-- 动效最开始的中文提示信息，选填标签。最多出现1次。最少0字节，最多1024字节。 -->
      <brand_top><![CDATA[]]></brand_top>
      <!-- 顶部拼接用品牌名，如果没有外部合作方，这里留空不用填写 -->
      <title_share><![CDATA[${shareInfo.title}]]></title_share>
      <!-- 请务必填写：分享展示的标题，需要根据自己实际的卡片去修改为适合自己卡片的分享标题。 -->
      <description_share><![CDATA[${shareInfo.description}]]></description_share>
      <!-- 请务必填写：分享展示的描述，需要根据自己的卡片去修改为适合出的标题。 -->
      <share_logo><![CDATA[${codeBuddyLogo}]]></share_logo>
      <!-- 用于放置分享到微信使用的图标，如该字段为空，使用通用的QB logo兜底，如果想定制，请务必填写-->
      <used_type><![CDATA[${getUsedType()}]]></used_type>
      <!-- 请务必填写：用于右下角展示的xx人用过/玩过拼接用，字段中为用过时，卡片展示用过，字段中为玩过时，卡片展示玩过；原则上：小游戏类或带有玩的性质的，都填"玩过"，非游戏类填"用过" -->
      <initnum><![CDATA[${getInitNum()}]]></initnum>
      <!-- 请务必填写：用于构造右下角xxx人用过/玩过的初始数据，前端会用这个假数据作为初始值，后续自动更新 -->    
      <card_name><![CDATA[${tool.name}_card_qb]]></card_name>
      <!-- 请务必填写：卡片的名称，需要保证唯一性，同时移动和pc也要用同一个，用来给前端计算使用人数使用，确保同一张卡片/工具展示的数字能相同，并与其他工具不同；同一张卡片，即使item不同，该字段也应该相同，譬如简谱卡下，所有歌曲的item都应该展示为"简谱生成器卡123"， 这个字段不会对外展示，所以只要确保不重复就行，可以组合的特殊一些 -->
    </display>
    <!-- display，必填标签。最多出现1次。 -->
  </item>
</DOCUMENT>
`;
        
        return xmlTemplate;
    }

    // 构建单个工具的单个平台版本
    buildToolForPlatform(tool, platformKey, platformConfig, force = false) {
        const startTime = Date.now();
        const platformOutput = tool.platforms[platformKey].output;
        
        if (!force && !this.needsRebuildForPlatform(tool, platformKey)) {
            console.log(`⏭️  跳过: ${tool.title} - ${platformConfig.name} (无变化)`);
            return true;
        }

        console.log(`📦 正在生成: ${tool.title} - ${platformConfig.name} (${tool.name})`);

        try {
            // 读取组件内容
            const componentContent = fs.readFileSync(tool.component, 'utf8');
            
            // 读取对应平台的模板
            const templateContent = fs.readFileSync(platformConfig.template, 'utf8');
            
            // 提取工具的内容和资源
            const toolExtracted = this.extractToolContent(componentContent);
            
            // 替换模板变量，只插入body内容
            let finalContent = templateContent
                .replace(/\{\{TOOL_TITLE\}\}/g, tool.title)
                .replace(/\{\{TOOL_SUBTITLE\}\}/g, tool.subtitle)
                .replace(/\{\{TOOL_CSS\}\}/g, '') // 清空CSS占位符，改用内联方式
                .replace(/\{\{TOOL_CONTENT\}\}/g, toolExtracted.bodyContent);

            // 内联CSS和JS资源
            finalContent = this.inlineAssets(finalContent, toolExtracted, tool, platformKey);
            console.log(`🔗 已提取并整合工具内容，避免HTML结构冲突`);

            // 确保输出目录存在
            const outputDir = path.dirname(platformOutput);
            if (!fs.existsSync(outputDir)) {
                fs.mkdirSync(outputDir, { recursive: true });
            }

            // 写入HTML文件
            fs.writeFileSync(platformOutput, finalContent);
            
            // 如果是QQ浏览器平台，生成额外的文件
            if (platformKey === 'qb') {
                // 1. 生成XML文件（用于QB移动端配置）
                const xmlOutput = platformOutput.replace('.html', '.xml');
                const xmlContent = this.generateQBXml(tool, finalContent);
                fs.writeFileSync(xmlOutput, xmlContent);
                console.log(`📄 生成XML配置: ${xmlOutput}`);
                
                // 2. 生成未编码的TXT文件（与HTML内容完全一样）
                const txtOutput = platformOutput.replace('.html', '.txt');
                fs.writeFileSync(txtOutput, finalContent);
                const originalSize = (Buffer.byteLength(finalContent, 'utf8') / 1024).toFixed(2);
                console.log(`📄 生成TXT文件: ${txtOutput} (${originalSize}KB)`);
                
                // 3. 生成编码后的TXT文件（用于URL传参）
                const encodedTxtOutput = platformOutput.replace('.html', '-encoded.txt');
                const encodedContent = encodeURIComponent(finalContent);
                fs.writeFileSync(encodedTxtOutput, encodedContent);
                const encodedSize = (Buffer.byteLength(encodedContent, 'utf8') / 1024).toFixed(2);
                const ratio = ((encodedSize / originalSize) * 100).toFixed(2);
                console.log(`📄 生成编码TXT: ${encodedTxtOutput} (${originalSize}KB → ${encodedSize}KB, 编码率${ratio}%)`);
            }
            
            const duration = Date.now() - startTime;
            console.log(`✅ 成功: ${platformOutput} (${duration}ms)`);
            return true;

        } catch (error) {
            console.error(`❌ 失败: ${tool.title} - ${platformConfig.name}`, error.message);
            return false;
        }
    }

    // 构建单个工具的所有平台版本
    buildTool(tool, force = false) {
        let allSuccess = true;
        
        // 为每个平台构建工具
        for (const [platformKey, platformConfig] of Object.entries(this.config.platforms)) {
            if (tool.platforms && tool.platforms[platformKey]) {
                const success = this.buildToolForPlatform(tool, platformKey, platformConfig, force);
                if (!success) {
                    allSuccess = false;
                }
            }
        }
        
        return allSuccess;
    }

    // 构建所有工具
    buildAll(force = false) {
        console.log('🚀 开始构建工具...\n');
        
        const results = {
            success: 0,
            failed: 0,
            skipped: 0
        };

        for (const tool of this.config.tools) {
            const wasBuilt = this.buildTool(tool, force);
            
            // 统计每个平台的构建结果
            for (const [platformKey] of Object.entries(this.config.platforms)) {
                if (tool.platforms && tool.platforms[platformKey]) {
                    if (wasBuilt) {
                        if (force || this.needsRebuildForPlatform(tool, platformKey)) {
                            results.success++;
                        } else {
                            results.skipped++;
                        }
                    } else {
                        results.failed++;
                    }
                }
            }
        }

        console.log('\n📊 构建完成!');
        if (results.success > 0) console.log(`✅ 成功: ${results.success} 个文件`);
        if (results.skipped > 0) console.log(`⏭️  跳过: ${results.skipped} 个文件`);
        if (results.failed > 0) console.log(`❌ 失败: ${results.failed} 个文件`);

        return results.failed === 0;
    }

    // 构建指定工具
    buildSpecific(toolName) {
        const tool = this.config.tools.find(t => t.name === toolName);
        if (!tool) {
            console.error(`❌ 工具不存在: ${toolName}`);
            this.listTools();
            return false;
        }

        console.log(`🎯 构建指定工具: ${tool.title}\n`);
        return this.buildTool(tool, true); // 强制构建
    }

    // 监听模式
    watch() {
        console.log('👀 开启文件监听模式...');
        console.log('📁 监听目录: components/, templates/, tools.config.json');
        console.log('💡 提示: 按 Ctrl+C 退出监听\n');

        const chokidar = require('chokidar');
        
        // 监听相关文件
        const watcher = chokidar.watch([
            'components/**/*',
            'templates/**/*',
            'tools.config.json'
        ], {
            ignored: /node_modules/,
            persistent: true,
            ignoreInitial: true
        });

        watcher.on('change', (filePath) => {
            console.log(`📝 文件变化: ${filePath}`);
            
            // 重新加载配置
            this.config = this.loadConfig();
            
            // 判断需要重新构建的工具
            const affectedTools = this.getAffectedTools(filePath);
            
            if (affectedTools.length > 0) {
                for (const tool of affectedTools) {
                    this.buildTool(tool, true);
                }
            } else {
                console.log('🔄 重新构建所有工具...');
                this.buildAll(true);
            }
            console.log('');
        });

        watcher.on('error', error => {
            console.error('❌ 监听错误:', error);
        });
    }

    // 获取受影响的工具
    getAffectedTools(filePath) {
        const affected = [];
        
        for (const tool of this.config.tools) {
            const toolDir = `components/${tool.name}/`;
            if (filePath.startsWith(toolDir)) {
                affected.push(tool);
            }
        }
        
        return affected;
    }

    // 列出所有工具
    listTools() {
        console.log('📋 可用工具列表:\n');
        this.config.tools.forEach((tool, index) => {
            console.log(`${index + 1}. ${tool.name}`);
            console.log(`   标题: ${tool.title}`);
            console.log(`   副标题: ${tool.subtitle}`);
            console.log(`   组件: ${tool.component}`);
            
            // 显示各平台输出
            if (tool.platforms) {
                console.log(`   平台输出:`);
                for (const [platformKey, platformConfig] of Object.entries(this.config.platforms)) {
                    if (tool.platforms[platformKey]) {
                        console.log(`     ${platformConfig.name}: ${tool.platforms[platformKey].output}`);
                    }
                }
            }
            console.log('');
        });
        
        console.log('🎯 可用平台:');
        for (const [key, config] of Object.entries(this.config.platforms)) {
            console.log(`  ${key}: ${config.name} (${config.template})`);
        }
    }

    // 显示帮助信息
    showHelp() {
        console.log('🛠️  工具构建器 - 使用说明\n');
        console.log('📖 基本命令:');
        console.log('  node scripts/generate.js build           # 智能增量构建所有工具');
        console.log('  node scripts/generate.js build --force   # 强制重新构建所有工具');
        console.log('  node scripts/generate.js tool <name>     # 构建指定工具');
        console.log('  node scripts/generate.js watch           # 开启文件监听模式');
        console.log('  node scripts/generate.js list            # 列出所有工具');
        console.log('');
        console.log('📋 或使用 npm scripts:');
        console.log('  npm run build              # 智能增量构建');
        console.log('  npm run build:force        # 强制重新构建');
        console.log('  npm run build:tool <name>  # 构建指定工具');
        console.log('  npm run watch              # 文件监听模式');
        console.log('  npm run list               # 列出工具');
    }
}

// 主程序
function main() {
    const builder = new ToolBuilder();
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
        case 'build':
            const force = args.includes('--force');
            builder.buildAll(force);
            break;
            
        case 'tool':
            const toolName = args[1];
            if (!toolName) {
                console.error('❌ 请指定工具名称');
                builder.listTools();
                process.exit(1);
            }
            builder.buildSpecific(toolName);
            break;
            
        case 'watch':
            try {
                builder.watch();
            } catch (error) {
                if (error.code === 'MODULE_NOT_FOUND') {
                    console.error('❌ 监听模式需要安装 chokidar:');
                    console.error('   npm install chokidar --save-dev');
                } else {
                    console.error('❌ 监听模式启动失败:', error.message);
                }
                process.exit(1);
            }
            break;
            
        case 'list':
            builder.listTools();
            break;
            
        default:
            builder.showHelp();
    }
}

if (require.main === module) {
    main();
}

module.exports = ToolBuilder;