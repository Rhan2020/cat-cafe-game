/**
 * 资源管理器演示系统
 * 展示高级资源管理器的完整功能
 */

import { AdvancedResourceManager, AssetConfig, DevicePerformance } from './AdvancedResourceManager';

export class ResourceManagerDemo {
    private resourceManager: AdvancedResourceManager;
    private demoContainer?: HTMLElement;

    constructor() {
        this.resourceManager = AdvancedResourceManager.getInstance();
    }

    /**
     * 初始化演示
     */
    public async initDemo(): Promise<void> {
        console.log('🚀 初始化资源管理器演示系统...');
        
        // 创建演示UI容器
        this.createDemoUI();
        
        // 显示设备信息
        this.displayDeviceInfo();
        
        // 预加载核心资源
        await this.preloadCoreAssets();
        
        // 演示各种功能
        await this.demonstrateFeatures();
        
        console.log('✅ 演示系统初始化完成！');
    }

    /**
     * 创建演示UI
     */
    private createDemoUI(): void {
        // 检查是否已存在
        if (document.getElementById('resource-demo')) {
            return;
        }

        const container = document.createElement('div');
        container.id = 'resource-demo';
        container.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 350px;
            max-height: 80vh;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 15px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 12px;
            z-index: 9999;
            overflow-y: auto;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;

        container.innerHTML = `
            <h3 style="margin: 0 0 10px 0; color: #4CAF50;">🎮 资源管理器演示</h3>
            <div id="device-info"></div>
            <div id="cache-stats"></div>
            <div id="demo-log"></div>
            <div style="margin-top: 10px;">
                <button id="test-load-btn" style="margin: 2px; padding: 5px;">测试加载</button>
                <button id="test-batch-btn" style="margin: 2px; padding: 5px;">批量加载</button>
                <button id="clear-cache-btn" style="margin: 2px; padding: 5px;">清理缓存</button>
                <button id="close-demo-btn" style="margin: 2px; padding: 5px;">关闭</button>
            </div>
        `;

        document.body.appendChild(container);
        this.demoContainer = container;

        // 绑定事件
        this.bindDemoEvents();
    }

    /**
     * 绑定演示事件
     */
    private bindDemoEvents(): void {
        const testLoadBtn = document.getElementById('test-load-btn');
        const testBatchBtn = document.getElementById('test-batch-btn');
        const clearCacheBtn = document.getElementById('clear-cache-btn');
        const closeDemoBtn = document.getElementById('close-demo-btn');

        testLoadBtn?.addEventListener('click', () => this.testSingleLoad());
        testBatchBtn?.addEventListener('click', () => this.testBatchLoad());
        clearCacheBtn?.addEventListener('click', () => this.clearCacheTest());
        closeDemoBtn?.addEventListener('click', () => this.closeDemo());

        // 定期更新缓存统计
        setInterval(() => this.updateCacheStats(), 2000);
    }

    /**
     * 显示设备信息
     */
    private displayDeviceInfo(): void {
        const deviceInfo = this.resourceManager.getDeviceInfo();
        const infoElement = document.getElementById('device-info');
        
        if (infoElement) {
            infoElement.innerHTML = `
                <h4 style="margin: 5px 0; color: #2196F3;">📱 设备信息</h4>
                <div>性能等级: <span style="color: ${this.getPerformanceColor(deviceInfo.level)}">${deviceInfo.level.toUpperCase()}</span></div>
                <div>最大纹理: ${deviceInfo.maxTextureSize}px</div>
                <div>支持格式: ${deviceInfo.supportedFormats.join(', ')}</div>
                <div>内存限制: ${Math.round(deviceInfo.memoryLimit / 1024 / 1024 / 1024)}GB</div>
                <hr style="margin: 10px 0; border: 1px solid #444;">
            `;
        }
    }

    /**
     * 获取性能等级颜色
     */
    private getPerformanceColor(level: string): string {
        switch (level) {
            case 'high': return '#4CAF50';
            case 'medium': return '#FF9800';
            case 'low': return '#F44336';
            default: return '#9E9E9E';
        }
    }

    /**
     * 更新缓存统计
     */
    private updateCacheStats(): void {
        const stats = this.resourceManager.getCacheStats();
        const statsElement = document.getElementById('cache-stats');
        
        if (statsElement) {
            const cacheUsageNumber = stats.cacheSize / stats.maxCacheSize * 100;
            const cacheUsage = cacheUsageNumber.toFixed(1);
            statsElement.innerHTML = `
                <h4 style="margin: 5px 0; color: #FF9800;">💾 缓存统计</h4>
                <div>缓存资源: ${stats.totalAssets}个</div>
                <div>缓存使用: ${this.formatBytes(stats.cacheSize)} / ${this.formatBytes(stats.maxCacheSize)} (${cacheUsage}%)</div>
                <div>命中率: ${(stats.hitRate * 100).toFixed(1)}%</div>
                <div style="background: #333; height: 8px; border-radius: 4px; margin: 5px 0;">
                    <div style="background: ${cacheUsageNumber > 80 ? '#F44336' : '#4CAF50'}; height: 100%; width: ${cacheUsage}%; border-radius: 4px;"></div>
                </div>
                <hr style="margin: 10px 0; border: 1px solid #444;">
            `;
        }
    }

    /**
     * 格式化字节数
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    /**
     * 预加载核心资源
     */
    private async preloadCoreAssets(): Promise<void> {
        this.logToDemo('🔄 开始预加载核心资源...');

        const coreAssets: AssetConfig[] = [
            // 核心UI资源
            {
                name: 'gold_coin',
                category: 'ui',
                type: 'image',
                sizes: [64, 128, 256],
                formats: ['png', 'svg'],
                preload: true,
                priority: 10
            },
            {
                name: 'diamond',
                category: 'ui',
                type: 'image',
                sizes: [64, 128, 256],
                formats: ['png', 'svg'],
                preload: true,
                priority: 9
            },
            // 主要角色
            {
                name: 'orange_cat',
                category: 'characters',
                type: 'image',
                sizes: [64, 128, 256],
                formats: ['png', 'svg'],
                preload: true,
                priority: 8
            },
            // 基础场景
            {
                name: 'coffee_shop_bg',
                category: 'scenes',
                type: 'image',
                sizes: [512, 1024, 2048],
                formats: ['png', 'jpg'],
                preload: true,
                priority: 7
            }
        ];

        try {
            await this.resourceManager.preloadAssets(coreAssets);
            this.logToDemo('✅ 核心资源预加载完成');
        } catch (error) {
            this.logToDemo(`❌ 预加载失败: ${error}`);
        }
    }

    /**
     * 演示各种功能
     */
    private async demonstrateFeatures(): Promise<void> {
        this.logToDemo('🎯 开始功能演示...');

        // 演示1: 基础资源加载
        await this.demoBasicLoading();
        
        // 演示2: 自适应尺寸
        await this.demoAdaptiveLoading();
        
        // 演示3: 降级加载
        await this.demoFallbackLoading();

        this.logToDemo('🎉 功能演示完成！');
    }

    /**
     * 演示基础加载
     */
    private async demoBasicLoading(): Promise<void> {
        this.logToDemo('📥 测试基础加载...');

        try {
            // 加载金币图标
            const goldCoin = await this.resourceManager.loadAsset('ui', 'gold_coin');
            this.logToDemo(`✅ 金币加载成功: ${goldCoin.src || 'SVG格式'}`);

            // 加载猫咪角色
            const orangeCat = await this.resourceManager.loadAsset('characters', 'orange_cat');
            this.logToDemo(`✅ 橙猫加载成功: ${orangeCat.src || 'SVG格式'}`);

        } catch (error) {
            this.logToDemo(`❌ 基础加载失败: ${error}`);
        }
    }

    /**
     * 演示自适应加载
     */
    private async demoAdaptiveLoading(): Promise<void> {
        this.logToDemo('🔄 测试自适应尺寸...');

        try {
            // 测试不同尺寸偏好
            const sizes = [64, 128, 256];
            
            for (const size of sizes) {
                const path = this.resourceManager.getAssetPath('ui', 'diamond', size);
                this.logToDemo(`📏 尺寸${size}px路径: ${path}`);
            }

        } catch (error) {
            this.logToDemo(`❌ 自适应测试失败: ${error}`);
        }
    }

    /**
     * 演示降级加载
     */
    private async demoFallbackLoading(): Promise<void> {
        this.logToDemo('🔄 测试降级加载...');

        try {
            // 尝试加载不存在的资源
            const fallback = await this.resourceManager.loadAsset('ui', 'nonexistent_asset');
            this.logToDemo(`🔄 降级加载成功: ${fallback.src || '已降级到备用资源'}`);

        } catch (error) {
            this.logToDemo(`⚠️ 降级加载也失败，这是正常的演示结果`);
        }
    }

    /**
     * 测试单个加载
     */
    private async testSingleLoad(): Promise<void> {
        this.logToDemo('🔍 测试单个资源加载...');

        const testAssets = [
            { category: 'ui', name: 'coffee_cup' },
            { category: 'characters', name: 'white_cat' },
            { category: 'scenes', name: 'fishing_area_bg' }
        ];

        const randomAsset = testAssets[Math.floor(Math.random() * testAssets.length)];

        try {
            const startTime = performance.now();
            const asset = await this.resourceManager.loadAsset(randomAsset.category, randomAsset.name);
            const loadTime = (performance.now() - startTime).toFixed(2);
            
            this.logToDemo(`✅ ${randomAsset.name} 加载完成 (${loadTime}ms)`);
        } catch (error) {
            this.logToDemo(`❌ ${randomAsset.name} 加载失败: ${error}`);
        }
    }

    /**
     * 测试批量加载
     */
    private async testBatchLoad(): Promise<void> {
        this.logToDemo('📦 测试批量加载...');

        const batchAssets: AssetConfig[] = [
            { name: 'primary_normal', category: 'ui', type: 'image', sizes: [128, 256], formats: ['png'], preload: true, priority: 5 },
            { name: 'secondary_normal', category: 'ui', type: 'image', sizes: [128, 256], formats: ['png'], preload: true, priority: 4 },
            { name: 'black_cat', category: 'characters', type: 'image', sizes: [64, 128, 256], formats: ['png'], preload: true, priority: 3 }
        ];

        try {
            const startTime = performance.now();
            await this.resourceManager.preloadAssets(batchAssets);
            const loadTime = (performance.now() - startTime).toFixed(2);
            
            this.logToDemo(`✅ 批量加载完成 (${loadTime}ms)`);
        } catch (error) {
            this.logToDemo(`❌ 批量加载失败: ${error}`);
        }
    }

    /**
     * 清理缓存测试
     */
    private clearCacheTest(): void {
        this.logToDemo('🧹 执行缓存清理测试...');
        
        // 这里可以添加手动清理逻辑
        // 由于高级资源管理器的清理方法是私有的，这里只做演示
        this.logToDemo('⚠️ 缓存清理由系统自动管理');
    }

    /**
     * 记录到演示日志
     */
    private logToDemo(message: string): void {
        const logElement = document.getElementById('demo-log');
        if (logElement) {
            const timestamp = new Date().toLocaleTimeString();
            const logEntry = document.createElement('div');
            logEntry.style.cssText = 'margin: 2px 0; padding: 2px; border-left: 2px solid #4CAF50; padding-left: 5px;';
            logEntry.innerHTML = `<span style="color: #888;">[${timestamp}]</span> ${message}`;
            
            logElement.appendChild(logEntry);
            logElement.scrollTop = logElement.scrollHeight;
            
            // 限制日志条数
            while (logElement.children.length > 20) {
                logElement.removeChild(logElement.firstChild!);
            }
        }

        // 同时输出到控制台
        console.log(`[ResourceDemo] ${message}`);
    }

    /**
     * 关闭演示
     */
    private closeDemo(): void {
        if (this.demoContainer) {
            this.demoContainer.remove();
            this.demoContainer = undefined;
        }
    }

    /**
     * 获取资源管理器实例
     */
    public getResourceManager(): AdvancedResourceManager {
        return this.resourceManager;
    }
}

// 全局实例，方便在控制台调试
(window as any).ResourceManagerDemo = ResourceManagerDemo;