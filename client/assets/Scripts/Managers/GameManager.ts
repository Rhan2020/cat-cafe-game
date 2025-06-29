import { _decorator, Component, Node } from 'cc';
import { NetworkManager } from '../Network/NetworkManager';
const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    public static instance: GameManager | null = null;

    @property(NetworkManager)
    public networkManager: NetworkManager | null = null;

    onLoad() {
        if (GameManager.instance === null) {
            GameManager.instance = this;
            // DontDestroyOnLoad(this.node); // Cocos Creator 3.x uses a different API for persistent nodes
        } else {
            this.destroy();
            return;
        }
    }

    start() {
        // Initialize the game
        console.log("GameManager started");
        this.login();
    }

    async login() {
        if (!this.networkManager) {
            console.error("NetworkManager is not assigned.");
            return;
        }
        try {
            const loginResponse = await this.networkManager.callFunction('user_login');
            console.log('Login response:', loginResponse);
            
            if (loginResponse.code === 200 || loginResponse.code === 201) {
                // Now get all user data
                this.loadGameData();
            } else {
                console.error("Login failed:", loginResponse.message);
            }
        } catch (error) {
            console.error("Error during login process:", error);
        }
    }

    async loadGameData() {
        if (!this.networkManager) {
            console.error("NetworkManager is not assigned.");
            return;
        }
        try {
            const [configs, userData] = await Promise.all([
                this.networkManager.callFunction('get_game_configs'),
                this.networkManager.callFunction('get_user_data')
            ]);
            
            console.log("Game Configs:", configs.data);
            console.log("User Data:", userData.data);

            // TODO: Store this data in a model and update the UI
            
        } catch (error) {
            console.error("Error loading game data:", error);
        }
    }
} 