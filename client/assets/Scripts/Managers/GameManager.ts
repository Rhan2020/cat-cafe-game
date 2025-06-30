import { _decorator, Component, director } from 'cc';
import { NetworkManager } from '../Network/NetworkManager';
import { SimpleResourceManager } from '../Utils/SimpleResourceManager';

const { ccclass, property } = _decorator;

// Define the structure for type safety, mirroring the database documents
export interface UserData {
    _id: string;
    nickname: string;
    gold: number;
    // ... other user fields
}

@ccclass('GameManager')
export class GameManager extends Component {
    public static Instance: GameManager = null;

    public currentUser: UserData | null = null;
    public gameConfigs: any = null; // Will hold all game configurations
    public resourceManager: SimpleResourceManager;

    onLoad() {
        if (GameManager.Instance) {
            this.destroy();
            return;
        }
        GameManager.Instance = this;
        director.addPersistRootNode(this.node);
    }

    async start() {
        try {
            console.log("[GameManager] Starting game flow...");

            // 0. Initialize Resource Manager
            this.resourceManager = SimpleResourceManager.getInstance();
            console.log("[GameManager] Resource manager initialized");

            // 1. User Login
            const loginResponse = await NetworkManager.Instance.callCloudFunction('user_login');
            if (!loginResponse || (loginResponse.code !== 200 && loginResponse.code !== 201)) {
                console.error("Login failed:", loginResponse?.message);
                return;
            }
            this.currentUser = loginResponse.data.user;
            console.log("[GameManager] User logged in:", this.currentUser);

            // 2. Fetch Game Configs
            const configResponse = await NetworkManager.Instance.callCloudFunction('get_game_configs');
            if (!configResponse || configResponse.code !== 200) {
                console.error("Failed to get game configs:", configResponse?.message);
                return;
            }
            this.gameConfigs = this.processConfigs(configResponse.data);
            console.log("[GameManager] Game configs loaded:", this.gameConfigs);


            // 3. Proceed to main scene
            director.loadScene('Main');

        } catch (error) {
            console.error("[GameManager] Critical error during startup:", error);
        }
    }
    
    /**
     * Processes the raw config array from the DB into a more accessible key-value object.
     * e.g., from [{_id: 'animal_breeds', data: [...]}] to { animal_breeds: [...] }
     */
    private processConfigs(configArray: any[]): any {
        if (!configArray) return {};
        return configArray.reduce((acc, config) => {
            acc[config._id] = config.data;
            return acc;
        }, {});
    }
} 