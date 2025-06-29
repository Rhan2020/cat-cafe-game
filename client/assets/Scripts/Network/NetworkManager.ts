import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

// This is a placeholder for the actual WeChat SDK
declare const wx: any;

@ccclass('NetworkManager')
export class NetworkManager extends Component {
    private isInitialized = false;

    onLoad() {
        this.initWeChatSDK();
    }

    initWeChatSDK() {
        if (typeof wx === 'undefined') {
            console.warn('WeChat SDK (wx) not found. Running in non-WeChat environment.');
            return;
        }

        try {
            wx.cloud.init({
                // env: 'your-cloud-env-id' // Replace with your actual environment ID
            });
            this.isInitialized = true;
            console.log("WeChat Cloud SDK initialized.");
        } catch (e) {
            console.error("Failed to initialize WeChat Cloud SDK", e);
        }
    }

    async callFunction(name: string, data: object = {}): Promise<any> {
        if (!this.isInitialized) {
            console.error("WeChat Cloud SDK not initialized. Cannot call cloud function.");
            return Promise.reject("SDK not initialized");
        }

        console.log(`Calling cloud function: ${name}`);
        try {
            const result = await wx.cloud.callFunction({
                name: name,
                data: data
            });

            if (result.result.code !== 200 && result.result.code !== 201) {
                 console.error(`Cloud function ${name} returned an error:`, result.result);
                 throw new Error(result.result.message);
            }

            return result.result;
        } catch (error) {
            console.error(`Error calling cloud function ${name}:`, error);
            throw error;
        }
    }
} 