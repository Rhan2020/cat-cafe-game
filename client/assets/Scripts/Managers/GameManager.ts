import { _decorator, Component, Node } from 'cc';
import { NetworkManager } from '../Network/NetworkManager';
const { ccclass, property } = _decorator;

// Forward declaration for user data structure
// This should match the structure returned from the server
interface UserData {
    _id: string;
    gold: number;
    gems: number;
    nickname: string;
    // ... other user fields
}

@ccclass('GameManager')
export class GameManager extends Component {

    public static Instance: GameManager | null = null;

    public currentUser: UserData | null = null;
    
    // This property is not needed if NetworkManager is a singleton
    // @property(NetworkManager)
    // public networkManager: NetworkManager | null = null;

    onLoad() {
        if (GameManager.Instance === null) {
            GameManager.Instance = this;
            this.node.parent = null;
        } else {
            this.destroy();
            return;
        }
    }

    async start() {
        if (!NetworkManager.Instance) {
            console.error("[GameManager] NetworkManager not initialized. Cannot log in.");
            return;
        }
        console.log("[GameManager] Starting game login process...");
        try {
            const response = await NetworkManager.Instance.callCloudFunction('user_login');
            // Check for a successful response (code 200 for existing user, 201 for new user)
            if (response && (response.code === 200 || response.code === 201)) {
                this.currentUser = response.data.user;
                console.log("[GameManager] Login successful. User data:", this.currentUser);

                const offlineEarnings = response.data.offlineEarnings;
                if (offlineEarnings && offlineEarnings.gold > 0) {
                    console.log(`[GameManager] Welcome back! You earned ${offlineEarnings.gold} gold while you were away.`);
                    // Here you would trigger a UI popup to show the earnings
                    // UIManager.Instance.showOfflineEarnings(offlineEarnings);
                }
                
                // Now that we are logged in, we can start the game, e.g., load the main scene
                // director.loadScene('MainGameScene');
            } else {
                console.error("[GameManager] Login failed:", response?.message);
                // Handle login failure, e.g., show an error message and a retry button
            }
        } catch (error) {
            console.error("[GameManager] An error occurred during the login process:", error);
            // Handle network errors, etc.
        }
    }
} 