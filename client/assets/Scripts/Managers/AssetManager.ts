import { _decorator, Component, resources, Texture2D, SpriteFrame, AudioClip, JsonAsset, assetManager, ImageAsset } from 'cc';
import { NetworkManager } from '../Network/NetworkManager';

const { ccclass } = _decorator;

// 素材信息接口
export interface AssetInfo {
    _id: string;
    name: string;
    category: string;
    originalUrl: string;
    cdnUrl?: string;
    thumbnailUrl?: string;
    compressedUrl?: string;
    metadata?: {
        width?: number;
        height?: number;
        duration?: number;
    };
    tags: string[];
}

// 缓存项接口
interface CacheItem {
    asset: any;
    lastUsed: number;
    size: number;
}

@ccclass('AssetManager')
export class AssetManager extends Component {
    private static _instance: AssetManager | null = null;
    
    // 素材缓存
    private _assetCache = new Map<string, CacheItem>();
    private _maxCacheSize = 100 * 1024 * 1024; // 100MB缓存限制
    private _currentCacheSize = 0;
    
    // 加载队列
    private _loadingQueue = new Map<string, Promise<any>>();
    
    // 预加载配置
    private _preloadConfig = {
        'ui': ['button', 'background', 'icon'],
        'character': ['cat', 'dog'],
        'effect': ['particle']
    };

    public static get Instance(): AssetManager {
        if (!AssetManager._instance) {
            console.warn('[AssetManager] Instance not initialized yet');
        }
        return AssetManager._instance!;
    }

    onLoad() {
        if (AssetManager._instance) {
            console.warn('[AssetManager] Multiple instances detected');
            // 销毁重复实例，保持单例模式
            if (this.node) {
                this.node.destroy();
            }
            return;
        }
        
        AssetManager._instance = this;
        console.log('[AssetManager] Asset Manager initialized');
        
        // 预加载关键素材
        this.preloadCriticalAssets();
    }

    onDestroy() {
        if (AssetManager._instance === this) {
            AssetManager._instance = null;
        }
        this.clearCache();
    }

    /**
     * 预加载关键素材
     */
    private async preloadCriticalAssets() {
        try {
            console.log('[AssetManager] Starting critical assets preload...');
            
            // 预加载UI素材
            await this.loadAssetsByCategory('ui', this._preloadConfig.ui);
            
            // 预加载角色素材
            await this.loadAssetsByCategory('character', this._preloadConfig.character);
            
            console.log('[AssetManager] Critical assets preloaded successfully');
        } catch (error) {
            console.error('[AssetManager] Failed to preload critical assets:', error);
        }
    }

    /**
     * 按分类和标签加载素材
     */
    public async loadAssetsByCategory(category: string, tags?: string[]): Promise<AssetInfo[]> {
        try {
            const response = await NetworkManager.Instance.callCloudFunction('get_asset_url', {
                category,
                tags: tags ? tags.join(',') : undefined
            });

            if (response.code === 200) {
                const assets = response.data as AssetInfo[];
                console.log(`[AssetManager] Found ${assets.length} assets for category: ${category}`);
                
                // 开始预加载这些素材
                this.preloadAssets(assets);
                
                return assets;
            } else {
                console.warn(`[AssetManager] Failed to load assets for category ${category}:`, response.message);
                return [];
            }
        } catch (error) {
            console.error(`[AssetManager] Error loading assets for category ${category}:`, error);
            return [];
        }
    }

    /**
     * 获取特定素材
     */
    public async getAsset(assetId: string): Promise<AssetInfo | null> {
        try {
            const response = await NetworkManager.Instance.callCloudFunction('get_asset_url', {
                assetId
            });

            if (response.code === 200) {
                return response.data as AssetInfo;
            } else {
                console.warn(`[AssetManager] Asset not found: ${assetId}`);
                return null;
            }
        } catch (error) {
            console.error(`[AssetManager] Error getting asset ${assetId}:`, error);
            return null;
        }
    }

    /**
     * 加载纹理资源
     */
    public async loadTexture(assetInfo: AssetInfo): Promise<Texture2D | null> {
        const cacheKey = `texture_${assetInfo._id}`;
        
        // 检查缓存
        const cached = this._assetCache.get(cacheKey);
        if (cached) {
            cached.lastUsed = Date.now();
            return cached.asset as Texture2D;
        }

        // 检查是否正在加载
        const loading = this._loadingQueue.get(cacheKey);
        if (loading) {
            return loading as Promise<Texture2D>;
        }

        // 开始加载
        const loadPromise = this._loadTextureFromUrl(assetInfo);
        this._loadingQueue.set(cacheKey, loadPromise);

        try {
            const texture = await loadPromise;
            this._loadingQueue.delete(cacheKey);
            
            if (texture) {
                this._addToCache(cacheKey, texture, this._estimateTextureSize(texture));
            }
            
            return texture;
        } catch (error) {
            this._loadingQueue.delete(cacheKey);
            console.error(`[AssetManager] Failed to load texture ${assetInfo.name}:`, error);
            return null;
        }
    }

    /**
     * 加载精灵帧
     */
    public async loadSpriteFrame(assetInfo: AssetInfo): Promise<SpriteFrame | null> {
        const texture = await this.loadTexture(assetInfo);
        if (!texture) {
            return null;
        }

        const spriteFrame = new SpriteFrame();
        spriteFrame.texture = texture;
        return spriteFrame;
    }

    /**
     * 加载音频剪辑
     */
    public async loadAudioClip(assetInfo: AssetInfo): Promise<AudioClip | null> {
        const cacheKey = `audio_${assetInfo._id}`;
        
        // 检查缓存
        const cached = this._assetCache.get(cacheKey);
        if (cached) {
            cached.lastUsed = Date.now();
            return cached.asset as AudioClip;
        }

        // 检查是否正在加载
        const loading = this._loadingQueue.get(cacheKey);
        if (loading) {
            return loading as Promise<AudioClip>;
        }

        // 开始加载
        const loadPromise = this._loadAudioFromUrl(assetInfo);
        this._loadingQueue.set(cacheKey, loadPromise);

        try {
            const audioClip = await loadPromise;
            this._loadingQueue.delete(cacheKey);
            
            if (audioClip) {
                this._addToCache(cacheKey, audioClip, this._estimateAudioSize(audioClip));
            }
            
            return audioClip;
        } catch (error) {
            this._loadingQueue.delete(cacheKey);
            console.error(`[AssetManager] Failed to load audio ${assetInfo.name}:`, error);
            return null;
        }
    }

    /**
     * 从URL加载纹理
     */
    private async _loadTextureFromUrl(assetInfo: AssetInfo): Promise<Texture2D | null> {
        return new Promise((resolve) => {
            const url = assetInfo.cdnUrl || assetInfo.originalUrl;
            
            assetManager.loadRemote<ImageAsset>(url, (err, imageAsset) => {
                if (err) {
                    console.error(`[AssetManager] Failed to load image from ${url}:`, err);
                    resolve(null);
                    return;
                }

                const texture = new Texture2D();
                texture.image = imageAsset;
                resolve(texture);
            });
        });
    }

    /**
     * 从URL加载音频
     */
    private async _loadAudioFromUrl(assetInfo: AssetInfo): Promise<AudioClip | null> {
        return new Promise((resolve) => {
            const url = assetInfo.cdnUrl || assetInfo.originalUrl;
            
            assetManager.loadRemote<AudioClip>(url, (err, audioClip) => {
                if (err) {
                    console.error(`[AssetManager] Failed to load audio from ${url}:`, err);
                    resolve(null);
                    return;
                }

                resolve(audioClip);
            });
        });
    }

    /**
     * 预加载素材列表
     */
    private async preloadAssets(assets: AssetInfo[]) {
        const preloadPromises = assets.map(async (asset) => {
            try {
                if (asset.category === 'image' || asset.category === 'ui' || 
                    asset.category === 'icon' || asset.category === 'background' || 
                    asset.category === 'character') {
                    await this.loadTexture(asset);
                } else if (asset.category === 'audio') {
                    await this.loadAudioClip(asset);
                }
            } catch (error) {
                console.warn(`[AssetManager] Failed to preload asset ${asset.name}:`, error);
            }
        });

        await Promise.all(preloadPromises);
    }

    /**
     * 添加到缓存
     */
    private _addToCache(key: string, asset: any, size: number) {
        // 检查缓存大小限制
        while (this._currentCacheSize + size > this._maxCacheSize && this._assetCache.size > 0) {
            this._evictLeastRecentlyUsed();
        }

        this._assetCache.set(key, {
            asset,
            lastUsed: Date.now(),
            size
        });
        
        this._currentCacheSize += size;
        console.log(`[AssetManager] Added to cache: ${key}, size: ${size}, total cache: ${this._currentCacheSize}`);
    }

    /**
     * 清除最近最少使用的缓存项
     */
    private _evictLeastRecentlyUsed() {
        let oldestKey = '';
        let oldestTime = Date.now();

        for (const [key, item] of this._assetCache) {
            if (item.lastUsed < oldestTime) {
                oldestTime = item.lastUsed;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            const item = this._assetCache.get(oldestKey)!;
            this._assetCache.delete(oldestKey);
            this._currentCacheSize -= item.size;
            console.log(`[AssetManager] Evicted from cache: ${oldestKey}`);
        }
    }

    /**
     * 估算纹理大小
     */
    private _estimateTextureSize(texture: Texture2D): number {
        const width = texture.width || 512;
        const height = texture.height || 512;
        return width * height * 4; // RGBA
    }

    /**
     * 估算音频大小
     */
    private _estimateAudioSize(audioClip: AudioClip): number {
        // 粗略估算：1秒 = 44100 * 2 * 2 字节 (44.1kHz, 立体声, 16位)
        const duration = audioClip.duration || 1;
        return Math.floor(duration * 44100 * 2 * 2);
    }

    /**
     * 清除缓存
     */
    public clearCache() {
        console.log(`[AssetManager] Clearing cache, total size: ${this._currentCacheSize}`);
        this._assetCache.clear();
        this._currentCacheSize = 0;
    }

    /**
     * 获取缓存状态
     */
    public getCacheStatus() {
        return {
            size: this._currentCacheSize,
            maxSize: this._maxCacheSize,
            itemCount: this._assetCache.size,
            usage: (this._currentCacheSize / this._maxCacheSize * 100).toFixed(2) + '%'
        };
    }

    /**
     * 按配置类型获取素材
     */
    public async getAssetsByConfig(configType: string, configId?: string): Promise<AssetInfo[]> {
        try {
            const response = await NetworkManager.Instance.callCloudFunction('get_asset_url', {
                configType,
                configId
            });

            if (response.code === 200) {
                return response.data as AssetInfo[];
            } else {
                console.warn(`[AssetManager] No assets found for config ${configType}:${configId}`);
                return [];
            }
        } catch (error) {
            console.error(`[AssetManager] Error getting assets for config ${configType}:`, error);
            return [];
        }
    }
}

// 导出单例访问方式
export const AssetMgr = {
    get Instance() {
        return AssetManager.Instance;
    }
};