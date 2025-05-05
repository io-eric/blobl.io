# blobl.io - Open Source Multiplayer Game

[![License: AGPL v3](https://img.shields.io/badge/License-AGPLv3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

![blobl.io Game Screenshot](https://github.com/io-eric/blobl.io/blob/main/preview.png)  

A complete, self-hostable implementation of the blobl.io multiplayer game, featuring server, client, obufscator, authentication, and load balancing components.

## Community Showcases  
Watch these community-created videos to see blobl.io in action:  

1. [NOVO UPDATE no Bloble.io by Godenot](https://www.youtube.com/watch?v=IHBgW5UDOWI&ab_channel=Godenot) 
2. [Blobl.io | 1 Million Score | BLOBLE.IO by Kingslayer](https://www.youtube.com/watch?v=skbQvWQswDE&ab_channel=Kingslayer)
3. [Blobl.io | Kingslayer | BLOBLE.IO by Kingslayer](https://www.youtube.com/watch?v=7hT4s7M0saQ&ab_channel=Kingslayer) 

## Overview

**blobl.io** is an open-source multiplayer IO game inspired by the original **bloble.io**. It is a real-time strategy game where players compete to capture bases, build and destroy structures, command units. The game features a distributed architecture designed for scalability and performance.

### Key Features:
- **Base Capturing**: Strategize and capture enemy bases to expand your territory.
- **Themes**: Choose from a variety of visual themes to customize your gameplay experience.
- **Building Mechanics**: Upgrade, place, and destroy buildings to strengthen your position.
- **Unit Commanding**: Take control of units and lead them into battle.
- **In-Game Chat**: Communicate with other players in real-time.
- **Accounts & Progression**: Create an account, log in with Discord, unlock skins, and track your progress.
- **Minimap**: Navigate the battlefield with ease using the built-in minimap.
- **Changelog**: Stay updated with the latest features and fixes.

This repository contains everything you need to run your own instance of **blobl.io**, including:

- **Server**: The core game server written in Go.
- **Client**: Browser-based game interface (JavaScript, HTML, CSS) with built-in obfuscation.
- **Authentication**: Secure user management with Discord integration. Node.js
- **Load Balancer**: Traffic distribution for multi-server deployments. Node.js

## Prerequisites

| Component | Version | Purpose |
|-----------|---------|---------|
| [Go](https://golang.org/doc/install) | 1.23+ | Server runtime |
| [Node.js](https://nodejs.org/) | 14.0+ LTS | Supporting services |

## Project Structure

```
blobl.io/
├── server/          # Go-based game server
│   └── main/        # Main server application
├── client/          # Browser game interface
│   └── blofuscator/ # Client-side code protection
├── auth-server/     # Authentication with Discord integration
├── loadbalancer/    # Traffic distribution service
├── nginx_default    # Web server configuration
└── README.md        # Documentation
```

## Installation & Setup

### Game Server

```bash
# Navigate to server directory
cd server/main

# Production build
GOOS=linux GOARCH=amd64 go build -o server

# Development build (with debugging symbols)
GOOS=linux GOARCH=amd64 go build -gcflags="all=-N -l" -o server

# Quick start (no build)
go run *.go
```

### Client Setup

This section outlines the steps to set up and run the client application for both local development and production.

**Local Development**

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development environment:**
    Use a live server for hot-reloading and a better development experience. For example, with `npm`:
    ```bash
    # If you have a live server package installed (e.g., live-server)
    npm start
    ```
**Production Build**

1.  **Navigate to the client directory:**
    ```bash
    cd client
    ```

2.  **Install dependencies (if you haven't already):**
    ```bash
    npm install
    ```

3.  **Build for production:**
    ```bash
    npm run build
    ```

4.  **Webpack Worker Configuration (Important for Production):**
    When building for production with Webpack, you need to adjust the worker initialization in `client/src/network/Network.js`.

    * **Uncomment the Webpack worker import:**
        ```js
        import Worker from './network.worker.js'; // First line of the file
        this.worker = new Worker({ type: 'module' }); // Inside the _initWorker() function
        ```

    * **Comment out the inline worker import:**
        ```js
        // this.worker = new Worker('src/network/network.worker.js', { type: 'module' }); // Inside the _initWorker() function
        ```

    **Note:** These changes ensure that the Webpack bundled worker is correctly utilized in the production build.

5.  **Locate Production Build:**
    After the build process is complete, the obfuscated, minified, and bundled JavaScript files will be located in the `dist/` directory.

### Authentication Server

```bash
# Navigate to auth directory
cd auth-server

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Discord credentials and other settings

# Start service
npm start
```

### Load Balancer Setup

**Local Development:**

For local development, the load balancer is typically **not required** and can be skipped. When the client application runs on `localhost` or `127.0.0.1`, it is generally configured to directly connect to the game server running on its default address and port,`localhost:8080`. Therefore, the load balancer step is unnecessary in a local testing environment.

**Production Deployment:**

The load balancer becomes **essential for production deployments** to manage traffic, ensure high availability, and facilitate scalability across multiple game server instances.

**Setup Instructions (for Production or Advanced Local Testing):**

If you are setting up a production environment or have a specific need for a load balancer in your local testing:

1.  **Navigate to the load balancer directory:**
    ```bash
    cd loadbalancer
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the load balancer service:**
    ```bash
    npm start
    ```
    
**Note:** The configuration of your load balancer dictates how many game server instances are launched and managed. You'll need to configure it according to your desired capacity and scaling strategy.

## Network Architecture

### Service Endpoints

| Service | Port | Endpoint | Description |
|---------|------|----------|-------------|
| Authentication | 3000 | `/api/*`, `/user`, `/check`, `/logout` | User authentication and session management |
| Server Discovery | 3002 | `/get-server` | Returns available game servers in current region |
| Game Servers | 8080-8085 | `/ffa1`,`/ffa2` ... | Standard game instances |
| Experimental Server | 9090 | `/ffa99` | Testing environment for new features |

## Deployment

**Important Deployment Note:** I strongly recommend using Nginx as a reverse proxy for production environments. This will help manage traffic efficiently and improve scalability by directing requests to the appropriate services. A sample Nginx configuration file (`nginx_default`) is included in this repository to help you get started.

The services within this project are designed to operate behind a reverse proxy. If you choose not to use a reverse proxy, you will need to implement request origin validation directly within the game server, load balancer, and other services to prevent unauthorized access and bot activity. This is crucial for maintaining the integrity and security of your game server.

## Contributing

This project is **no longer actively maintained** and is considered abandoned. However, you are welcome to fork the repository and make your own modifications or improvements. If you do fork the project, please ensure that you adhere to the original **AGPLv3 License** terms and provide proper attribution to the original author.

### Forking the Project
1. Click the "Fork" button at the top right of this repository to create your own copy.
2. Clone your forked repository to your local machine:
   ```bash
   git clone https://github.com/eric-io/blobl.io.git
   ```

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPLv3)**. This means you are free to:
- **Use** the software for any purpose.
- **Modify** the software to suit your needs.
- **Distribute** the original or modified versions of the software.
- **Run the software as a service, but you must provide access to the modified source code if you make any changes.**

However, you must:
- **Include the original license** in any distributions or modifications.
- **Disclose the source code** of any modified versions.
- **Use the same license** for any derivative works.
- **Ensure that users of a networked version of the software can obtain the full source code, including modifications.**

For more details, refer to the full [AGPLv3 License](LICENSE) file in this repository.

