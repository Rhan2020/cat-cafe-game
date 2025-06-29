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

    onLoad() {
        this.updateUserInfoUI();
        this.loadAndDisplayAnimals();
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
            } else {
                console.error("[MainSceneManager] Failed to load animals:", response?.message);
            }
        } catch (error) {
            console.error("[MainSceneManager] Error loading animals:", error);
        }
    }
} 