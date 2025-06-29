import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

// This provides type hints for wx cloud functions, if you have miniprogram-api-typings
declare const wx: any;

@ccclass('NetworkManager')
export class NetworkManager extends Component {

    public static Instance: NetworkManager = null;

    onLoad() {
        if (NetworkManager.Instance === null) {
            NetworkManager.Instance = this;
            // Make this node persistent across scenes
            this.node.parent = null; 
        } else {
            this.destroy();
            return;
        }
    }

    /**
     * Calls a cloud function and returns its result.
     * @param name The name of the cloud function to call.
     * @param data The data to pass to the cloud function.
     * @returns A promise that resolves with the result from the cloud function.
     */
    public async callCloudFunction(name: string, data: object = {}): Promise<any> {
        console.log(`[NetworkManager] Calling cloud function: ${name}`, data);
        
        // Basic check to see if we're in the WeChat Mini Game environment
        if (typeof wx === 'undefined' || !wx.cloud) {
            console.error("[NetworkManager] Not in WeChat Mini Game environment or cloud not initialized.");
            // In a real game, you might want to return a mock response for testing on web.
            return Promise.reject({ errCode: -1, errMsg: "Not in WeChat environment" });
        }
        
        try {
            const response = await wx.cloud.callFunction({
                name: name,
                data: data
            });

            console.log(`[NetworkManager] Response from ${name}:`, response);

            // The 'result' field contains the object returned by the cloud function's main method
            if (response.result) {
                // You can add centralized error handling here, e.g., checking response.result.code
                if (response.result.code && response.result.code !== 200 && response.result.code !== 201) {
                   console.error(`[NetworkManager] Cloud function ${name} returned an error:`, response.result);
                   // Optionally show a generic error message to the user
                }
                return response.result;
            } else {
                // This case is unusual but good to handle
                throw new Error("Cloud function response did not contain a 'result' field.");
            }
        } catch (err) {
            console.error(`[NetworkManager] Error calling cloud function ${name}:`, err);
            // In a real game, you might want to show a network error UI to the user
            return Promise.reject(err);
        }
    }
} 