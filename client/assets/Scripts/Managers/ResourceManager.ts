import { _decorator, Component, resources, SpriteFrame, sys, view } from 'cc';
const { ccclass, property } = _decorator;

// 设备性能等级枚举
export enum DevicePerformanceLevel {
    LOW = 'low',        // 低性能设备
    MEDIUM = 'medium',  // 中等性能设备
    HIGH = 'high'       // 高性能设备
}

// 素材质量等级
export enum AssetQuality {
    LOW = 'low',      // 低质量 - 512x512
    MEDIUM = 'medium', // 中等质量 - 1024x1024  
    HIGH = 'high'     // 高质量 - 2048x2048
}

// 素材配置接口
export interface AssetConfig {
    basePath: string;
    versions: {
        [key in AssetQuality]: string;
    };
}

@ccclass('ResourceManager')
export class ResourceManager extends Component {
    public static Instance: ResourceManager = null;

    private currentQuality: AssetQuality = AssetQuality.MEDIUM;
    private devicePerformance: DevicePerformanceLevel = DevicePerformanceLevel.MEDIUM;
    private loadedAssets: Map<string, SpriteFrame> = new Map();
    private assetConfigs: Map<string, AssetConfig> = new Map();

    onLoad() {
        if (ResourceManager.Instance) {
            this.destroy();
            return;
        }
        ResourceManager.Instance = this;
    }

    start() {
        this.detectDevicePerformance();
        this.initializeAssetConfigs();
        console.log(`[ResourceManager] 初始化完成 - 设备性能: ${this.devicePerformance}, 素材质量: ${this.currentQuality}`);
    }

    /**
     * 检测设备性能并设置对应的素材质量
     */
    private detectDevicePerformance() {
        const screenSize = view.getVisibleSize();
        const screenPixels = screenSize.width * screenSize.height;
        const platform = sys.platform;
        
        // 基于屏幕分辨率和平台判断设备性能
        if (platform === sys.Platform.WECHAT_GAME) {
            // 微信小游戏平台特殊处理
            if (screenPixels > 2000000) { // 大于2M像素
                this.devicePerformance = DevicePerformanceLevel.HIGH;
                this.currentQuality = AssetQuality.HIGH;
            } else if (screenPixels > 1000000) { // 1-2M像素
                this.devicePerformance = DevicePerformanceLevel.MEDIUM;
                this.currentQuality = AssetQuality.MEDIUM;
            } else {
                this.devicePerformance = DevicePerformanceLevel.LOW;
                this.currentQuality = AssetQuality.LOW;
            }
        } else {
            // 其他平台使用默认中等质量
            this.devicePerformance = DevicePerformanceLevel.MEDIUM;
            this.currentQuality = AssetQuality.MEDIUM;
        }

        console.log(`[ResourceManager] 设备检测: 屏幕${screenSize.width}x${screenSize.height}, 平台${platform}`);
    }

    /**
     * 初始化素材配置
     */
    private initializeAssetConfigs() {
        // 角色素材配置
        this.assetConfigs.set('cats', {
            basePath: 'Art/Characters/Cats',
            versions: {
                [AssetQuality.LOW]: 'low_res',
                [AssetQuality.MEDIUM]: 'medium_res', 
                [AssetQuality.HIGH]: 'high_res'
            }
        });

        // UI素材配置
        this.assetConfigs.set('ui', {
            basePath: 'Art/UI',
            versions: {
                [AssetQuality.LOW]: 'low_res',
                [AssetQuality.MEDIUM]: 'medium_res',
                [AssetQuality.HIGH]: 'high_res'
            }
        });

        // 场景素材配置
        this.assetConfigs.set('scenes', {
            basePath: 'Art/Scenes',
            versions: {
                [AssetQuality.LOW]: 'low_res',
                [AssetQuality.MEDIUM]: 'medium_res',
                [AssetQuality.HIGH]: 'high_res'
            }
        });

        // 道具素材配置
        this.assetConfigs.set('items', {
            basePath: 'Art/Items',
            versions: {
                [AssetQuality.LOW]: 'low_res',
                [AssetQuality.MEDIUM]: 'medium_res',
                [AssetQuality.HIGH]: 'high_res'
            }
        });
    }

    /**
     * 加载素材
     * @param category 素材类别 (cats, ui, scenes, items)
     * @param assetName 素材名称
     * @param callback 加载完成回调
     */
    public loadAsset(category: string, assetName: string, callback: (spriteFrame: SpriteFrame) => void) {
        const cacheKey = `${category}_${assetName}_${this.currentQuality}`;
        
        // 检查缓存
        if (this.loadedAssets.has(cacheKey)) {
            callback(this.loadedAssets.get(cacheKey));
            return;
        }

        const config = this.assetConfigs.get(category);
        if (!config) {
            console.error(`[ResourceManager] 未知的素材类别: ${category}`);
            return;
        }

        const qualityPath = config.versions[this.currentQuality];
        const fullPath = `${config.basePath}/${qualityPath}/${assetName}`;

        // 尝试加载当前质量级别的素材
        this.loadAssetWithFallback(fullPath, assetName, cacheKey, callback);
    }

    /**
     * 带降级的素材加载
     */
    private loadAssetWithFallback(fullPath: string, assetName: string, cacheKey: string, callback: (spriteFrame: SpriteFrame) => void) {
        resources.load(`${fullPath}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.warn(`[ResourceManager] 加载失败: ${fullPath}, 尝试降级加载`);
                this.loadFallbackAsset(fullPath, assetName, cacheKey, callback);
                return;
            }

            this.loadedAssets.set(cacheKey, spriteFrame);
            callback(spriteFrame);
        });
    }

    /**
     * 降级加载素材
     */
    private loadFallbackAsset(originalPath: string, assetName: string, cacheKey: string, callback: (spriteFrame: SpriteFrame) => void) {
        // 获取素材类别
        const category = originalPath.split('/')[1];
        const config = this.assetConfigs.get(category);
        
        if (!config) return;

        // 尝试使用低一级的质量
        const fallbackQualities = [AssetQuality.MEDIUM, AssetQuality.LOW];
        
        for (const quality of fallbackQualities) {
            if (quality === this.currentQuality) continue;
            
            const fallbackPath = `${config.basePath}/${config.versions[quality]}/${assetName}`;
            
            resources.load(`${fallbackPath}/spriteFrame`, SpriteFrame, (err, spriteFrame) => {
                if (!err) {
                    console.log(`[ResourceManager] 降级加载成功: ${fallbackPath}`);
                    this.loadedAssets.set(cacheKey, spriteFrame);
                    callback(spriteFrame);
                    return;
                }
            });
        }

        console.error(`[ResourceManager] 所有质量级别加载失败: ${assetName}`);
    }

    /**
     * 预加载关键素材
     */
    public preloadCriticalAssets() {
        const criticalAssets = [
            { category: 'ui', name: 'main_background' },
            { category: 'ui', name: 'loading_screen' },
            { category: 'cats', name: 'default_cat' },
            { category: 'ui', name: 'gold_coin' },
            { category: 'ui', name: 'diamond' }
        ];

        let loadedCount = 0;
        const totalCount = criticalAssets.length;

        criticalAssets.forEach(asset => {
            this.loadAsset(asset.category, asset.name, (spriteFrame) => {
                loadedCount++;
                console.log(`[ResourceManager] 预加载进度: ${loadedCount}/${totalCount}`);
                
                if (loadedCount === totalCount) {
                    console.log('[ResourceManager] 关键素材预加载完成');
                }
            });
        });
    }

    /**
     * 清理缓存
     */
    public clearCache() {
        this.loadedAssets.clear();
        console.log('[ResourceManager] 素材缓存已清理');
    }

    /**
     * 获取当前素材质量
     */
    public getCurrentQuality(): AssetQuality {
        return this.currentQuality;
    }

    /**
     * 手动设置素材质量
     */
    public setQuality(quality: AssetQuality) {
        if (this.currentQuality !== quality) {
            this.currentQuality = quality;
            this.clearCache(); // 清理缓存以重新加载新质量的素材
            console.log(`[ResourceManager] 素材质量已设置为: ${quality}`);
        }
    }

    /**
     * 获取内存使用情况
     */
    public getMemoryUsage(): { loadedAssets: number; totalSize: string } {
        return {
            loadedAssets: this.loadedAssets.size,
            totalSize: `约 ${(this.loadedAssets.size * 2).toFixed(1)}MB` // 粗略估算
        };
    }
}