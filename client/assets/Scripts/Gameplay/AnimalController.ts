import { _decorator, Component, Label } from 'cc';
const { ccclass, property } = _decorator;

// Define the structure of animal data for type safety
export interface AnimalData {
    _id: string;
    name: string;
    level: number;
    exp: number;
    // ... other fields like breedId, status, etc.
}

@ccclass('AnimalController')
export class AnimalController extends Component {

    @property(Label)
    private nameLabel: Label | null = null;

    @property(Label)
    private levelLabel: Label | null = null;

    private _animalData: AnimalData | null = null;

    /**
     * Initializes the animal with its data and updates its visual representation.
     * @param data The data for this specific animal.
     */
    public setup(data: AnimalData) {
        this._animalData = data;
        this.updateDisplay();
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
        
        // Here you could also change the sprite frame based on the animal's breed,
        // show a status icon (working, idle), etc.
    }
} 