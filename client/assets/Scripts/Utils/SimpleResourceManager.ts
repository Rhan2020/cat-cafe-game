/**
 * 简化版资源管理器
 * 用于动态加载适配不同分辨率的素材
 */

// 素材质量等级
export enum AssetQuality {
    LOW = 'low',      // 低质量 - 64px
    MEDIUM = 'medium', // 中等质量 - 128px  
    HIGH = 'high'     // 高质量 - 256px
}

// 设备性能等级
export enum DevicePerformanceLevel {
    LOW = 'low',        // 低性能设备
    MEDIUM = 'medium',  // 中等性能设备
    HIGH = 'high'       // 高性能设备
}

// 素材配置接口
export interface AssetConfig {
    basePath: string;
    versions: {
        [key in AssetQuality]: {
            suffix: string;
            size: string;
        };
    };
}

export class SimpleResourceManager {
    private static instance: SimpleResourceManager | null = null;
    private currentQuality: AssetQuality = AssetQuality.MEDIUM;
    private devicePerformance: DevicePerformanceLevel = DevicePerformanceLevel.MEDIUM;
    private assetConfigs: Map<string, AssetConfig> = new Map();

    public static getInstance(): SimpleResourceManager {
        if (!SimpleResourceManager.instance) {
            SimpleResourceManager.instance = new SimpleResourceManager();
        }
        return SimpleResourceManager.instance;
    }

    constructor() {
        this.initializeAssetConfigs();
        this.detectDevicePerformance();
    }

    /**
     * 检测设备性能并设置对应的素材质量
     */
    private detectDevicePerformance() {
        // 简化的性能检测
        const screenWidth = window.screen ? window.screen.width : 1080;
        const screenHeight = window.screen ? window.screen.height : 1920;
        const screenPixels = screenWidth * screenHeight;
        
        // 基于屏幕分辨率判断设备性能
        if (screenPixels > 2000000) { // 大于2M像素 (1920x1080)
            this.devicePerformance = DevicePerformanceLevel.HIGH;
            this.currentQuality = AssetQuality.HIGH;
        } else if (screenPixels > 1000000) { // 1-2M像素
            this.devicePerformance = DevicePerformanceLevel.MEDIUM;
            this.currentQuality = AssetQuality.MEDIUM;
        } else {
            this.devicePerformance = DevicePerformanceLevel.LOW;
            this.currentQuality = AssetQuality.LOW;
        }

        console.log(`[SimpleResourceManager] 设备检测: ${screenWidth}x${screenHeight}, 性能: ${this.devicePerformance}, 质量: ${this.currentQuality}`);
    }

    /**
     * 初始化素材配置
     */
    private initializeAssetConfigs() {
        // UI素材配置
        this.assetConfigs.set('ui', {
            basePath: 'Art/UI',
            versions: {
                [AssetQuality.LOW]: { suffix: '_64', size: '64x64' },
                [AssetQuality.MEDIUM]: { suffix: '_128', size: '128x128' },
                [AssetQuality.HIGH]: { suffix: '_256', size: '256x256' }
            }
        });

        // 角色素材配置
        this.assetConfigs.set('cats', {
            basePath: 'Art/Characters/Cats',
            versions: {
                [AssetQuality.LOW]: { suffix: '_64', size: '64x64' },
                [AssetQuality.MEDIUM]: { suffix: '_128', size: '128x128' },
                [AssetQuality.HIGH]: { suffix: '_256', size: '256x256' }
            }
        });

        // 道具素材配置
        this.assetConfigs.set('items', {
            basePath: 'Art/Items',
            versions: {
                [AssetQuality.LOW]: { suffix: '_64', size: '64x64' },
                [AssetQuality.MEDIUM]: { suffix: '_128', size: '128x128' },
                [AssetQuality.HIGH]: { suffix: '_256', size: '256x256' }
            }
        });

        // 场景素材配置
        this.assetConfigs.set('scenes', {
            basePath: 'Art/Scenes',
            versions: {
                [AssetQuality.LOW]: { suffix: '_512', size: '512x512' },
                [AssetQuality.MEDIUM]: { suffix: '_1024', size: '1024x1024' },
                [AssetQuality.HIGH]: { suffix: '_2048', size: '2048x2048' }
            }
        });
    }

    /**
     * 获取素材路径
     * @param category 素材类别
     * @param assetName 素材名称（不含扩展名）
     * @param quality 可选的质量等级，不传则使用当前质量
     */
    public getAssetPath(category: string, assetName: string, quality?: AssetQuality): string {
        const config = this.assetConfigs.get(category);
        if (!config) {
            console.error(`[SimpleResourceManager] 未知的素材类别: ${category}`);
            return '';
        }

        const targetQuality = quality || this.currentQuality;
        const versionConfig = config.versions[targetQuality];
        
        return `${config.basePath}/${assetName}${versionConfig.suffix}.png`;
    }

    /**
     * 获取带降级的素材路径列表
     * @param category 素材类别
     * @param assetName 素材名称
     */
    public getAssetPathsWithFallback(category: string, assetName: string): string[] {
        const paths: string[] = [];
        const config = this.assetConfigs.get(category);
        
        if (!config) {
            return paths;
        }

        // 按质量优先级顺序尝试
        const qualityOrder = [this.currentQuality];
        
        // 添加降级选项
        if (this.currentQuality === AssetQuality.HIGH) {
            qualityOrder.push(AssetQuality.MEDIUM, AssetQuality.LOW);
        } else if (this.currentQuality === AssetQuality.MEDIUM) {
            qualityOrder.push(AssetQuality.LOW, AssetQuality.HIGH);
        } else {
            qualityOrder.push(AssetQuality.MEDIUM, AssetQuality.HIGH);
        }

        // 生成路径列表
        qualityOrder.forEach(quality => {
            const versionConfig = config.versions[quality];
            paths.push(`${config.basePath}/${assetName}${versionConfig.suffix}.png`);
        });

        return paths;
    }

    /**
     * 获取当前素材质量
     */
    public getCurrentQuality(): AssetQuality {
        return this.currentQuality;
    }

    /**
     * 设置素材质量
     */
    public setQuality(quality: AssetQuality) {
        this.currentQuality = quality;
        console.log(`[SimpleResourceManager] 素材质量已设置为: ${quality}`);
    }

    /**
     * 获取设备性能等级
     */
    public getDevicePerformance(): DevicePerformanceLevel {
        return this.devicePerformance;
    }

    /**
     * 获取素材配置信息
     */
    public getAssetInfo(category: string, assetName: string): { path: string; size: string } | null {
        const config = this.assetConfigs.get(category);
        if (!config) {
            return null;
        }

        const versionConfig = config.versions[this.currentQuality];
        return {
            path: this.getAssetPath(category, assetName),
            size: versionConfig.size
        };
    }
}