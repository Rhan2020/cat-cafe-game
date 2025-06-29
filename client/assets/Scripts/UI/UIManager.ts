import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
    start() {
        // Initialization
    }

    public showLoading(message: string) {
        console.log(`Showing loading: ${message}`);
    }

    public hideLoading() {
        console.log("Hiding loading");
    }
} 