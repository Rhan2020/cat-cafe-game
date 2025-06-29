import { _decorator, Component, Node, Label, Prefab, instantiate } from 'cc';
import { GameManager } from '../Managers/GameManager';
import { NetworkManager } from '../Network/NetworkManager';
import { AnimalController, AnimalData } from '../Gameplay/AnimalController';
const { ccclass, property } = _decorator;

@ccclass('MainSceneManager')
export class MainSceneManager extends Component {

    @property(Label)
    public goldLabel: Label | null = null;
    
    @property(Label)
    public nicknameLabel: Label | null = null;

    @property(Node)
    public animalsContainer: Node | null = null;

    @property(Prefab)
    public animalPrefab: Prefab | null = null;

    // --- State for Animal Assignment ---
    private isAssigningMode: boolean = false;
    private selectedAnimalNode: Node | null = null;

    // --- State for Real-time Gold Generation ---
    private _totalSpeedPerSecond: number = 0;
    private _goldBuffer: number = 0;
    private _saveInterval: number = 30; // seconds
    private _saveTimer: number = 0;

    onLoad() {
        this.updateUserInfoUI();
        this.loadAndDisplayAnimals();
    }

    start() {
        this.updateUserInfoUI();
        this.loadAndDisplayAnimals();
    }

    update(dt: number) {
        if (!GameManager.Instance.currentUser) {
            return;
        }

        if (this._totalSpeedPerSecond > 0) {
            this._goldBuffer += this._totalSpeedPerSecond * dt;
            const earnedGold = Math.floor(this._goldBuffer);
            
            if (earnedGold > 0) {
                GameManager.Instance.currentUser.gold += earnedGold;
                this._goldBuffer -= earnedGold;
                this.updateUserInfoUI();
            }
        }

        // --- Auto-save logic ---
        this._saveTimer += dt;
        if (this._saveTimer >= this._saveInterval) {
            this._saveTimer = 0;
            this.saveUserData();
        }
    }

    updateUserInfoUI() {
        if (!GameManager.Instance || !GameManager.Instance.currentUser) {
            console.error("[MainSceneManager] GameManager not ready, cannot update UI.");
            return;
        }

        const user = GameManager.Instance.currentUser;
        
        if (this.goldLabel) {
            this.goldLabel.string = `金币: ${Math.floor(user.gold)}`;
        }
        
        if (this.nicknameLabel) {
            this.nicknameLabel.string = user.nickname;
        }
    }

    async loadAndDisplayAnimals() {
        if (!this.animalPrefab || !this.animalsContainer) {
            console.error("[MainSceneManager] Animal Prefab or Container not set in the editor.");
            return;
        }

        console.log("[MainSceneManager] Loading animals...");
        try {
            const response = await NetworkManager.Instance.callCloudFunction('get_animals');
            if (response && response.code === 200) {
                const animals: AnimalData[] = response.data;
                console.log(`[MainSceneManager] Found ${animals.length} animals.`);

                // Clear any existing animals in the container
                this.animalsContainer.removeAllChildren();

                // Instantiate a prefab for each animal
                for (const animalData of animals) {
                    const animalNode = instantiate(this.animalPrefab);
                    this.animalsContainer.addChild(animalNode);
                    
                    const controller = animalNode.getComponent(AnimalController);
                    if (controller) {
                        controller.setup(animalData);
                    } else {
                        console.error("Animal prefab is missing the AnimalController script.");
                    }
                }
                this.recalculateTotalSpeed(); // Initial calculation
            } else {
                console.error("[MainSceneManager] Failed to load animals:", response?.message);
            }
        } catch (error) {
            console.error("[MainSceneManager] Error loading animals:", error);
        }
    }

    /**
     * Called when an animal instance is clicked.
     * Enters "assignment mode".
     * @param event The event object, the node is the target.
     */
    public onAnimalClicked(event: Event) {
        const animalNode = event.currentTarget as Node;
        this.isAssigningMode = true;
        this.selectedAnimalNode = animalNode;
        
        const animalController = animalNode.getComponent(AnimalController);
        if (animalController) {
            console.log(`Assigning mode started for animal: ${animalController.getAnimalData()?.name}`);
            // TODO: Add visual feedback, e.g., highlight the selected animal
        }
    }

    /**
     * Called when a post/station (e.g., kitchen, bar) is clicked.
     * If in "assignment mode", it attempts to assign the selected animal.
     * @param event The event object, the node is the target.
     * @param customEventData The name of the post, configured in the Button component.
     */
    public async onPostClicked(event: Event, customEventData: string) {
        if (!this.isAssigningMode || !this.selectedAnimalNode) {
            console.log("Not in assigning mode or no animal selected.");
            return;
        }

        const postName = customEventData;
        const animalController = this.selectedAnimalNode.getComponent(AnimalController);
        const animalId = animalController?.getAnimalData()?._id;

        if (!postName || !animalId) {
            console.error("Post name or animal ID is missing.");
            this.exitAssigningMode();
            return;
        }
        
        console.log(`Attempting to assign animal ${animalId} to post ${postName}...`);

        try {
            const response = await NetworkManager.Instance.callCloudFunction('assign_animal_to_post', {
                animalId: animalId,
                post: postName,
            });

            if (response && response.code === 200) {
                console.log("Assignment successful:", response.message);
                
                // Update the assigned animal's status locally
                animalController.updateStatus('working');

                // If another animal was swapped out, update its status as well
                const swappedOutAnimalId = response.data?.swappedOutAnimalId;
                if (swappedOutAnimalId) {
                    this.updateAnimalNodeStatus(swappedOutAnimalId, 'idle');
                    console.log(`Animal ${swappedOutAnimalId} was swapped out and is now idle.`);
                }

                // Check for level up information
                const levelUpInfo = response.data?.levelUpInfo;
                if (levelUpInfo && levelUpInfo.hasLeveledUp) {
                    this.handleLevelUp(animalId, levelUpInfo.newLevel);
                }

                this.recalculateTotalSpeed(); // Recalculate after assignment changes

            } else {
                console.error("Assignment failed:", response?.message);
                // TODO: Show a user-friendly error message (e.g., using a popup)
            }
        } catch (error) {
            console.error("Error during assignment:", error);
        } finally {
            this.exitAssigningMode();
        }
    }

    private handleLevelUp(animalId: string, newLevel: number) {
        console.log(`ANIMAL ${animalId} HAS LEVELED UP TO ${newLevel}!`);
        // TODO: Trigger some cool VFX or UI animation here

        if (!this.animalsContainer) return;
        for (const animalNode of this.animalsContainer.children) {
            const controller = animalNode.getComponent(AnimalController);
            if (controller && controller.getAnimalData()?._id === animalId) {
                controller.updateLevel(newLevel);
                break;
            }
        }
    }

    /**
     * Finds an animal node by its ID and updates its status via its controller.
     * @param animalId The ID of the animal to update.
     * @param newStatus The new status.
     */
    private updateAnimalNodeStatus(animalId: string, newStatus: string) {
        if (!this.animalsContainer) return;

        for (const animalNode of this.animalsContainer.children) {
            const controller = animalNode.getComponent(AnimalController);
            if (controller && controller.getAnimalData()?._id === animalId) {
                controller.updateStatus(newStatus);
                break;
            }
        }
    }

    private exitAssigningMode() {
        console.log("Exiting assigning mode.");
        // TODO: Remove visual feedback from the selected animal
        this.isAssigningMode = false;
        this.selectedAnimalNode = null;
    }

    private recalculateTotalSpeed() {
        if (!GameManager.Instance?.gameConfigs?.animal_breeds || !this.animalsContainer) {
            this._totalSpeedPerSecond = 0;
            return;
        }

        let totalSpeed = 0;
        const animalBreeds = GameManager.Instance.gameConfigs.animal_breeds;

        for (const animalNode of this.animalsContainer.children) {
            const controller = animalNode.getComponent(AnimalController);
            const animalData = controller?.getAnimalData();
            if (controller && animalData && animalData.status === 'working') {
                const breed = animalBreeds.find(b => b.breedId === animalData.breedId);
                totalSpeed += breed?.baseAttributes?.speed || 1;
            }
        }

        this._totalSpeedPerSecond = totalSpeed;
        console.log(`[MainSceneManager] Total speed recalculated: ${this._totalSpeedPerSecond} gold/sec.`);
    }

    async saveUserData() {
        if (!GameManager.Instance.currentUser) {
            console.error("[MainSceneManager] Cannot save: user data not available.");
            return;
        }

        console.log(`[MainSceneManager] Auto-saving user data... Gold: ${GameManager.Instance.currentUser.gold}`);
        try {
            await NetworkManager.Instance.callCloudFunction('update_user_data', {
                gold: GameManager.Instance.currentUser.gold
            });
            console.log("[MainSceneManager] Auto-save successful.");
        } catch (error) {
            console.error("[MainSceneManager] Auto-save failed:", error);
        }
    }
} 