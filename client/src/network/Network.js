// import Worker from './network.worker.js'; // Note: Uncomment when using Webpack to bundle the worker (also see _initWorker())

export default class Network {
    constructor (loadBalancerAddress, core) {
        this.core = core;
        this.loadBalancerAddress = loadBalancerAddress;
        this.isDev = this.isLocalDomain(); // Detect if it's a local domain
        this.serverAddress = null;

        // Event listeners
        this.eventListeners = {
            open: [],
            message: [],
            close: [],
            error: [],
        };
        this.worker = null;
        this.retryDelay = 3000; // Delay between retries in milliseconds
        this._initWorker();
    }

    _initWorker () {
        //this.worker = new Worker({type: 'module' }); // Webpack, bundled
        this.worker = new Worker('src/network/network.worker.js', { type: 'module'}); // Local dev, unbundled

        // Listen for messages from the worker
        this.worker.onmessage = (event) => {
            const { type, data } = event.data;
            switch (type) {
                case 'connected':
                    this.onConnect(data);
                    break;
                case 'disconnected':
                    this.onDisconnect(data);
                    this.retryConnect();
                    break;
                case 'message':
                    this.onMessage(data);
                    break;
                case 'error':
                    this.onError(data);
                    this.retryConnect();
                    break;
                default:
                    console.warn('Unknown message type:', type);
            }
        }
    };

    async connect () {
        if (this.isDev) {
            // Development mode: Connect to localhost
            this.serverAddress = 'localhost:8080';
            this.worker.postMessage({ type: 'connect', data: `ws://${this.serverAddress}` });

        } else {
            // Production mode: Fetch server address and connect
            const response = await fetch(`${this.loadBalancerAddress}/get-server`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch server address');
            }

            const data = await response.json();
            if (!data.server_address) {
                throw new Error('Server address not found in response');
            }

            this.serverAddress = data.server_address;
            this.worker.postMessage({ type: 'connect', data: `wss://${this.serverAddress}` });
        }
    }

    async retryConnect () {
        console.log(`Reconnecting in ${this.retryDelay / 1000} seconds...`);
        await this.delay(this.retryDelay);
        this.connect(); // Try to reconnect
    }

    onConnect (data) {
        console.log('Connected to server:', data);
        this.triggerEvent('open', data);
    }

    onDisconnect (data) {
        console.warn('Disconnected from server:', data);
        this.triggerEvent('close', data);
    }

    onMessage (data) {
        this.triggerEvent('message', data);
    }

    onError (data) {
        console.error('Worker error:', data);
        this.triggerEvent('error', data);
    }

    sendMessage (message) {
        this.worker.postMessage({ type: 'sendMessage', data: message.encodeMessage() });
    }

    // Triggering events for listeners
    triggerEvent (type, data) {
        this.eventListeners[type]?.forEach((callback) => callback(data));
    }

    // Add event listener method
    addEventListener (type, callback) {
        if (this.eventListeners[type]) {
            this.eventListeners[type].push(callback);
        } else {
            console.warn("Unknown event type:", type);
        }
    }

    isLocalDomain () {
        // Check if the current hostname is a local domain
        const localDomains = ['localhost', '127.0.0.1'];
        const hostname = window.location.hostname;
        return localDomains.includes(hostname);
    }

    static async pingServer (serverAddress) {
        try {
            const startTime = performance.now();
            const response = await fetch(`${serverAddress}/ping`, { method: 'HEAD' });
            if (!response.ok) {
                throw new Error(`Server returned status: ${response.status}`);
            }
            const endTime = performance.now();
            return endTime - startTime; // Returns the ping time in milliseconds
        } catch (error) {
            console.error(`Failed to ping server ${serverAddress}:`, error);
            return Infinity; // Return a high number if the server is unreachable
        }
    }

    delay (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
