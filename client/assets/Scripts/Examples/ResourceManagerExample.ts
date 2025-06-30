/**
 * 资源管理器使用示例
 * 演示如何在游戏中使用SimpleResourceManager加载不同分辨率的素材
 */

import { SimpleResourceManager, AssetQuality, DevicePerformanceLevel } from '../Utils/SimpleResourceManager';

export class ResourceManagerExample {
    private resourceManager: SimpleResourceManager;

    constructor() {
        this.resourceManager = SimpleResourceManager.getInstance();
        this.demonstrateUsage();
    }

    /**
     * 演示资源管理器的各种使用方法
     */
    private demonstrateUsage() {
        console.log("=== 资源管理器使用示例 ===");
        
        this.showDeviceInfo();
        this.loadUIAssets();
        this.loadCharacterAssets();
        this.loadItemAssets();
        this.loadSceneAssets();
        this.demonstrateQualityManagement();
        this.showAssetPaths();
    }

    /**
     * 显示设备信息
     */
    private showDeviceInfo() {
        console.log("\n📱 设备信息:");
        console.log(`- 设备性能: ${this.resourceManager.getDevicePerformance()}`);
        console.log(`- 当前素材质量: ${this.resourceManager.getCurrentQuality()}`);
    }

    /**
     * 加载UI素材示例
     */
    private loadUIAssets() {
        console.log("\n🎨 加载UI素材:");
        
        const uiAssets = ['gold_coin', 'diamond', 'coffee_cup', 'fish'];
        
        uiAssets.forEach(assetName => {
            const path = this.resourceManager.getAssetPath('ui', assetName);
            const info = this.resourceManager.getAssetInfo('ui', assetName);
            
            console.log(`- ${assetName}: ${path} (${info?.size})`);
            
            // 在实际游戏中，这里会调用Cocos Creator的资源加载API
            // resources.load(path, SpriteFrame, (err, spriteFrame) => { ... });
        });
    }

    /**
     * 加载角色素材示例
     */
    private loadCharacterAssets() {
        console.log("\n🐱 加载角色素材:");
        
        const catAssets = ['orange_cat', 'white_cat', 'black_cat', 'sakura_cat'];
        
        catAssets.forEach(catName => {
            const path = this.resourceManager.getAssetPath('cats', catName);
            const fallbackPaths = this.resourceManager.getAssetPathsWithFallback('cats', catName);
            
            console.log(`- ${catName}: ${path}`);
            console.log(`  降级路径: ${fallbackPaths.slice(1).join(', ')}`);
        });
    }

    /**
     * 加载道具素材示例
     */
    private loadItemAssets() {
        console.log("\n🎒 加载道具素材:");
        
        const itemAssets = ['coffee_beans', 'milk', 'cat_cookie', 'destiny_watch'];
        
        itemAssets.forEach(itemName => {
            const path = this.resourceManager.getAssetPath('items', itemName);
            console.log(`- ${itemName}: ${path}`);
        });
    }

    /**
     * 加载场景素材示例
     */
    private loadSceneAssets() {
        console.log("\n🏪 加载场景素材:");
        
        const sceneAssets = ['coffee_shop_bg', 'fishing_area_bg', 'main_menu_bg'];
        
        sceneAssets.forEach(sceneName => {
            const path = this.resourceManager.getAssetPath('scenes', sceneName);
            console.log(`- ${sceneName}: ${path}`);
        });
    }

    /**
     * 演示素材质量管理
     */
    private demonstrateQualityManagement() {
        console.log("\n⚙️  素材质量管理:");
        
        const originalQuality = this.resourceManager.getCurrentQuality();
        console.log(`原始质量: ${originalQuality}`);
        
        // 临时切换到高质量
        this.resourceManager.setQuality(AssetQuality.HIGH);
        const goldCoinHighPath = this.resourceManager.getAssetPath('ui', 'gold_coin');
        console.log(`高质量金币路径: ${goldCoinHighPath}`);
        
        // 临时切换到低质量
        this.resourceManager.setQuality(AssetQuality.LOW);
        const goldCoinLowPath = this.resourceManager.getAssetPath('ui', 'gold_coin');
        console.log(`低质量金币路径: ${goldCoinLowPath}`);
        
        // 恢复原始质量
        this.resourceManager.setQuality(originalQuality);
        console.log(`恢复到原始质量: ${originalQuality}`);
    }

    /**
     * 显示各种资产路径
     */
    private showAssetPaths() {
        console.log("\n📂 素材路径示例:");
        
        const examples = [
            { category: 'ui', name: 'gold_coin', desc: '金币图标' },
            { category: 'cats', name: 'orange_cat', desc: '橙色猫咪' },
            { category: 'items', name: 'destiny_watch', desc: '命运怀表' },
            { category: 'scenes', name: 'coffee_shop_bg', desc: '咖啡馆背景' }
        ];
        
        examples.forEach(example => {
            const path = this.resourceManager.getAssetPath(example.category, example.name);
            const info = this.resourceManager.getAssetInfo(example.category, example.name);
            console.log(`- ${example.desc}: ${path} (${info?.size})`);
        });
    }

    /**
     * 模拟游戏运行时的资源加载
     */
    public simulateGameResourceLoading() {
        console.log("\n🎮 模拟游戏资源加载:");
        
        // 模拟游戏启动时的关键资源预加载
        const criticalAssets = [
            { category: 'ui', name: 'gold_coin', priority: 'high' },
            { category: 'ui', name: 'diamond', priority: 'high' },
            { category: 'cats', name: 'orange_cat', priority: 'medium' },
            { category: 'scenes', name: 'main_menu_bg', priority: 'high' }
        ];
        
        criticalAssets.forEach((asset, index) => {
            setTimeout(() => {
                const path = this.resourceManager.getAssetPath(asset.category, asset.name);
                console.log(`⏳ [${asset.priority}] 加载: ${asset.name} -> ${path}`);
                
                // 模拟加载完成
                setTimeout(() => {
                    console.log(`✅ [${asset.priority}] 完成: ${asset.name}`);
                }, 100);
                
            }, index * 200);
        });
    }

    /**
     * 获取内存使用统计
     */
    public getMemoryUsage(): string {
        // 在实际实现中，这里会调用资源管理器的内存统计功能
        return `当前加载素材: 预计内存使用约2-5MB`;
    }

    /**
     * 清理资源缓存
     */
    public cleanup() {
        console.log("🧹 清理资源缓存...");
        // 在实际实现中，这里会清理加载的素材缓存
        console.log("✅ 缓存清理完成");
    }
}

// 使用示例
export function runResourceManagerExample() {
    console.log("启动资源管理器示例...");
    
    const example = new ResourceManagerExample();
    
    // 延迟执行模拟加载，以便观察效果
    setTimeout(() => {
        example.simulateGameResourceLoading();
    }, 1000);
    
    // 显示内存使用情况
    setTimeout(() => {
        console.log(`\n💾 ${example.getMemoryUsage()}`);
    }, 3000);
    
    return example;
}

// 如果直接运行此文件，执行示例
if (typeof window === 'undefined') {
    // Node.js环境下的测试
    runResourceManagerExample();
}