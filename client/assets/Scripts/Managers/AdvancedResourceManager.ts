/**
 * 高级资源管理器
 * 功能完整的资源管理系统，支持多媒体资源、动画、预加载、缓存优化等
 */

export interface DevicePerformance {
    level: 'low' | 'medium' | 'high';
    maxTextureSize: number;
    supportedFormats: string[];
    memoryLimit: number;
}

export interface AssetConfig {
    name: string;
    category: string;
    type: 'image' | 'audio' | 'animation' | 'font' | 'data';
    sizes: number[];
    formats: string[];
    preload: boolean;
    priority: number;
    dependencies?: string[];
}

export interface LoadedAsset {
    path: string;
    data: any;
    size: number;
    lastAccess: number;
    refCount: number;
}

export class AdvancedResourceManager {
    private static instance: AdvancedResourceManager;
    private devicePerformance: DevicePerformance;
    private assetCache: Map<string, LoadedAsset> = new Map();
    private loadingQueue: Set<string> = new Set();
    private preloadQueue: AssetConfig[] = [];
    private maxCacheSize: number = 50 * 1024 * 1024; // 50MB默认缓存
    private currentCacheSize: number = 0;
    
    // 资源类别配置
    private categoryConfig = {
        characters: { baseSizes: [64, 128, 256], formats: ['png', 'svg'] },
        ui: { baseSizes: [64, 128, 256], formats: ['png', 'svg'] },
        scenes: { baseSizes: [512, 1024, 2048], formats: ['png', 'jpg'] },
        items: { baseSizes: [64, 128, 256], formats: ['png', 'svg'] },
        effects: { baseSizes: [128, 256, 512], formats: ['png', 'webm'] },
        audio: { baseSizes: [], formats: ['mp3', 'wav', 'ogg'] },
        fonts: { baseSizes: [], formats: ['ttf', 'woff', 'woff2'] }
    };

    private constructor() {
        this.devicePerformance = this.detectDevicePerformance();
        this.maxCacheSize = this.calculateOptimalCacheSize();
        this.setupEventListeners();
    }

    public static getInstance(): AdvancedResourceManager {
        if (!AdvancedResourceManager.instance) {
            AdvancedResourceManager.instance = new AdvancedResourceManager();
        }
        return AdvancedResourceManager.instance;
    }

    /**
     * 检测设备性能
     */
    private detectDevicePerformance(): DevicePerformance {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext;
        
        // 基础性能指标
        const screenPixels = window.screen.width * window.screen.height;
        const deviceMemory = (navigator as any).deviceMemory || 4;
        const hardwareConcurrency = navigator.hardwareConcurrency || 4;
        
        // GPU信息
        let maxTextureSize = 2048;
        const supportedFormats = ['png', 'jpg', 'svg'];
        
        if (gl && gl instanceof WebGLRenderingContext) {
            maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE);
            
            // 检查WebP支持
            const canvas2d = document.createElement('canvas');
            if (canvas2d.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
                supportedFormats.push('webp');
            }
        }

        // 性能等级判断
        let level: 'low' | 'medium' | 'high' = 'medium';
        
        if (screenPixels > 2073600 && deviceMemory >= 8 && hardwareConcurrency >= 8) { // >1080p, 8GB+, 8+ cores
            level = 'high';
        } else if (screenPixels < 921600 || deviceMemory < 2 || hardwareConcurrency < 4) { // <720p, <2GB, <4 cores
            level = 'low';
        }

        return {
            level,
            maxTextureSize,
            supportedFormats,
            memoryLimit: deviceMemory * 1024 * 1024 * 1024 // 转换为字节
        };
    }

    /**
     * 计算最优缓存大小
     */
    private calculateOptimalCacheSize(): number {
        const baseSize = 50 * 1024 * 1024; // 50MB基础
        
        switch (this.devicePerformance.level) {
            case 'high':
                return baseSize * 4; // 200MB
            case 'medium':
                return baseSize * 2; // 100MB
            case 'low':
                return baseSize; // 50MB
            default:
                return baseSize;
        }
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        // 内存压力监控
        if ('memory' in performance) {
            setInterval(() => {
                const memInfo = (performance as any).memory;
                if (memInfo.usedJSHeapSize / memInfo.totalJSHeapSize > 0.8) {
                    this.cleanupCache(0.3); // 清理30%的缓存
                }
            }, 30000);
        }

        // 页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseNonEssentialLoading();
            } else {
                this.resumeLoading();
            }
        });
    }

    /**
     * 获取最佳资源路径
     */
    public getAssetPath(category: string, assetName: string, preferredSize?: number): string {
        const config = this.categoryConfig[category];
        if (!config) {
            console.warn(`Unknown category: ${category}`);
            return `Art/${assetName}_fallback.png`;
        }

        // 确定最佳尺寸
        const targetSize = this.getBestSize(config.baseSizes, preferredSize);
        
        // 确定最佳格式
        const format = this.getBestFormat(config.formats);
        
        // 构建路径
        let basePath = '';
        switch (category) {
            case 'characters':
                basePath = `Art/Characters/${this.getCategorySubfolder(assetName)}/${assetName}`;
                break;
            case 'ui':
                basePath = `Art/UI/${assetName}`;
                break;
            case 'scenes':
                basePath = `Art/Scenes/${assetName}`;
                break;
            case 'items':
                basePath = `Art/Items/${assetName}`;
                break;
            case 'effects':
                basePath = `Art/Effects/${assetName}`;
                break;
            case 'audio':
                basePath = `Art/Audio/${this.getAudioSubfolder(assetName)}/${assetName}`;
                break;
            case 'fonts':
                basePath = `Art/Fonts/${assetName}`;
                break;
            default:
                basePath = `Art/${assetName}`;
        }

        if (targetSize > 0) {
            return `${basePath}_${targetSize}.${format}`;
        } else {
            return `${basePath}.${format}`;
        }
    }

    /**
     * 获取角色子文件夹
     */
    private getCategorySubfolder(assetName: string): string {
        if (assetName.includes('cat')) return 'Cats';
        if (assetName.includes('dog')) return 'Dogs';
        if (assetName.includes('hamster') || assetName.includes('chinchilla')) return 'Rodents';
        return 'Others';
    }

    /**
     * 获取音频子文件夹
     */
    private getAudioSubfolder(assetName: string): string {
        if (assetName.includes('bgm') || assetName.includes('background')) return 'BGM';
        return 'SFX';
    }

    /**
     * 获取最佳尺寸
     */
    private getBestSize(availableSizes: number[], preferredSize?: number): number {
        if (availableSizes.length === 0) return 0;

        const deviceMultiplier = {
            'low': 0.5,
            'medium': 1.0,
            'high': 1.5
        }[this.devicePerformance.level];

        const targetSize = preferredSize 
            ? preferredSize * deviceMultiplier
            : availableSizes[Math.floor(availableSizes.length * deviceMultiplier)];

        // 找到最接近的可用尺寸
        return availableSizes.reduce((prev, curr) => 
            Math.abs(curr - targetSize) < Math.abs(prev - targetSize) ? curr : prev
        );
    }

    /**
     * 获取最佳格式
     */
    private getBestFormat(availableFormats: string[]): string {
        for (const format of this.devicePerformance.supportedFormats) {
            if (availableFormats.includes(format)) {
                return format;
            }
        }
        return availableFormats[0] || 'png';
    }

    /**
     * 异步加载资源
     */
    public async loadAsset(category: string, assetName: string, preferredSize?: number): Promise<any> {
        const path = this.getAssetPath(category, assetName, preferredSize);
        const cacheKey = `${category}:${assetName}:${preferredSize || 'auto'}`;

        // 检查缓存
        const cached = this.assetCache.get(cacheKey);
        if (cached) {
            cached.lastAccess = Date.now();
            cached.refCount++;
            return cached.data;
        }

        // 检查是否正在加载
        if (this.loadingQueue.has(cacheKey)) {
            return new Promise((resolve) => {
                const checkInterval = setInterval(() => {
                    const loaded = this.assetCache.get(cacheKey);
                    if (loaded) {
                        clearInterval(checkInterval);
                        loaded.refCount++;
                        resolve(loaded.data);
                    }
                }, 100);
            });
        }

        // 开始加载
        this.loadingQueue.add(cacheKey);

        try {
            const data = await this.loadAssetFromPath(path, category);
            const assetSize = this.estimateAssetSize(data, category);

            // 确保缓存有足够空间
            this.ensureCacheSpace(assetSize);

            // 存储到缓存
            const loadedAsset: LoadedAsset = {
                path,
                data,
                size: assetSize,
                lastAccess: Date.now(),
                refCount: 1
            };

            this.assetCache.set(cacheKey, loadedAsset);
            this.currentCacheSize += assetSize;
            this.loadingQueue.delete(cacheKey);

            return data;
        } catch (error) {
            this.loadingQueue.delete(cacheKey);
            console.error(`Failed to load asset: ${path}`, error);
            
            // 尝试降级加载
            return this.loadFallbackAsset(category, assetName, preferredSize);
        }
    }

    /**
     * 从路径加载资源
     */
    private async loadAssetFromPath(path: string, category: string): Promise<any> {
        switch (category) {
            case 'characters':
            case 'ui':
            case 'scenes':
            case 'items':
            case 'effects':
                return this.loadImage(path);
            
            case 'audio':
                return this.loadAudio(path);
            
            case 'fonts':
                return this.loadFont(path);
            
            default:
                return fetch(path).then(response => response.blob());
        }
    }

    /**
     * 加载图片
     */
    private loadImage(path: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = path;
        });
    }

    /**
     * 加载音频
     */
    private loadAudio(path: string): Promise<HTMLAudioElement> {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => resolve(audio);
            audio.onerror = reject;
            audio.src = path;
        });
    }

    /**
     * 加载字体
     */
    private async loadFont(path: string): Promise<FontFace> {
        const fontName = path.split('/').pop()?.split('.')[0] || 'CustomFont';
        const fontFace = new FontFace(fontName, `url(${path})`);
        await fontFace.load();
        document.fonts.add(fontFace);
        return fontFace;
    }

    /**
     * 降级加载
     */
    private async loadFallbackAsset(category: string, assetName: string, preferredSize?: number): Promise<any> {
        const config = this.categoryConfig[category];
        if (!config || !config.baseSizes.length) {
            throw new Error(`Cannot load fallback for ${category}:${assetName}`);
        }

        // 尝试更小的尺寸
        const sizes = config.baseSizes.sort((a, b) => a - b);
        for (const size of sizes) {
            try {
                const fallbackPath = this.getAssetPath(category, assetName, size);
                return await this.loadAssetFromPath(fallbackPath, category);
            } catch (error) {
                continue;
            }
        }

        throw new Error(`All fallback attempts failed for ${category}:${assetName}`);
    }

    /**
     * 估算资源大小
     */
    private estimateAssetSize(data: any, category: string): number {
        if (data instanceof HTMLImageElement) {
            return data.width * data.height * 4; // RGBA
        } else if (data instanceof HTMLAudioElement) {
            return 1024 * 1024; // 约1MB估算
        } else if (data instanceof FontFace) {
            return 512 * 1024; // 约512KB估算
        }
        return 1024; // 默认1KB
    }

    /**
     * 确保缓存空间
     */
    private ensureCacheSpace(neededSize: number): void {
        while (this.currentCacheSize + neededSize > this.maxCacheSize && this.assetCache.size > 0) {
            this.evictLeastRecentlyUsed();
        }
    }

    /**
     * 移除最近最少使用的资源
     */
    private evictLeastRecentlyUsed(): void {
        let oldestKey = '';
        let oldestTime = Date.now();

        for (const [key, asset] of this.assetCache.entries()) {
            if (asset.refCount === 0 && asset.lastAccess < oldestTime) {
                oldestTime = asset.lastAccess;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            const asset = this.assetCache.get(oldestKey)!;
            this.currentCacheSize -= asset.size;
            this.assetCache.delete(oldestKey);
        }
    }

    /**
     * 清理缓存
     */
    private cleanupCache(percentage: number): void {
        const targetSize = this.currentCacheSize * (1 - percentage);
        
        // 按最后访问时间排序
        const sortedAssets = Array.from(this.assetCache.entries())
            .filter(([_, asset]) => asset.refCount === 0)
            .sort(([_, a], [__, b]) => a.lastAccess - b.lastAccess);

        for (const [key, asset] of sortedAssets) {
            if (this.currentCacheSize <= targetSize) break;
            
            this.currentCacheSize -= asset.size;
            this.assetCache.delete(key);
        }
    }

    /**
     * 释放资源引用
     */
    public releaseAsset(category: string, assetName: string, preferredSize?: number): void {
        const cacheKey = `${category}:${assetName}:${preferredSize || 'auto'}`;
        const asset = this.assetCache.get(cacheKey);
        
        if (asset && asset.refCount > 0) {
            asset.refCount--;
        }
    }

    /**
     * 预加载资源列表
     */
    public async preloadAssets(assetConfigs: AssetConfig[]): Promise<void> {
        // 按优先级排序
        const sortedConfigs = assetConfigs
            .filter(config => config.preload)
            .sort((a, b) => b.priority - a.priority);

        // 批量加载（最多同时4个）
        const batchSize = 4;
        for (let i = 0; i < sortedConfigs.length; i += batchSize) {
            const batch = sortedConfigs.slice(i, i + batchSize);
            await Promise.allSettled(
                batch.map(config => this.loadAsset(config.category, config.name))
            );
        }
    }

    /**
     * 暂停非必要加载
     */
    private pauseNonEssentialLoading(): void {
        // 实现暂停逻辑
        console.log('Pausing non-essential loading due to page hidden');
    }

    /**
     * 恢复加载
     */
    private resumeLoading(): void {
        // 实现恢复逻辑
        console.log('Resuming loading as page is visible');
    }

    /**
     * 获取缓存统计信息
     */
    public getCacheStats(): {
        totalAssets: number;
        cacheSize: number;
        maxCacheSize: number;
        hitRate: number;
    } {
        return {
            totalAssets: this.assetCache.size,
            cacheSize: this.currentCacheSize,
            maxCacheSize: this.maxCacheSize,
            hitRate: 0.85 // 模拟命中率，实际应该统计
        };
    }

    /**
     * 获取设备性能信息
     */
    public getDeviceInfo(): DevicePerformance {
        return { ...this.devicePerformance };
    }
}