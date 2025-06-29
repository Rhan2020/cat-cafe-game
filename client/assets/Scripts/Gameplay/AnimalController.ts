import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

// Define the structure of animal data for type safety
export interface AnimalData {
    _id: string;
    name: string;
    level: number;
    exp: number;
    status: string; // 'idle', 'working', etc.
}

@ccclass('AnimalController')
export class AnimalController extends Component {

    @property(Label)
    private nameLabel: Label | null = null;

    @property(Label)
    private levelLabel: Label | null = null;

    @property(Node)
    private statusIcon: Node | null = null; // e.g., a "Zzz" icon for idle, a "Hammer" for working

    private _animalData: AnimalData | null = null;

    /**
     * Initializes the animal with its data and updates its visual representation.
     * @param data The data for this specific animal.
     */
    public setup(data: AnimalData) {
        this._animalData = data;
        this.updateDisplay();
    }

    /**
     * Returns the animal's data.
     */
    public getAnimalData(): AnimalData | null {
        return this._animalData;
    }

    /**
     * Immediately updates the animal's status and its visual representation.
     * @param newStatus The new status string (e.g., 'working').
     */
    public updateStatus(newStatus: string) {
        if (this._animalData) {
            this._animalData.status = newStatus;
            this.updateDisplay();
        }
    }

    /**
     * Immediately updates the animal's level and its visual representation.
     * @param newLevel The new level number.
     */
    public updateLevel(newLevel: number) {
        if (this._animalData) {
            this._animalData.level = newLevel;
            this.updateDisplay();
        }
    }

    private updateDisplay() {
        if (!this._animalData) {
            return;
        }

        if (this.nameLabel) {
            this.nameLabel.string = this._animalData.name;
        }

        if (this.levelLabel) {
            this.levelLabel.string = `Lv. ${this._animalData.level}`;
        }
        
        if (this.statusIcon) {
            // Example logic: show icon only when working
            this.statusIcon.active = this._animalData.status === 'working';
        }
    }
} 