
## Installing the Primus Fund SDK

This is the first step in integrating Primus Fund SDK into your project. This guide will walk you through the installation process and help you get started quickly.

### Prerequisites

Before you begin, make sure you have:

- Node.js（version 18 or later）installed on your system
- npm (usually comes with Node.js) or yarn as your package manager

### Installation Steps

#### 1. Install the SDK

Open your terminal and navigate to your project directory. Then run one of the following commands:

- Using npm:

```
npm install --save @primuslabs/fund-js-sdk
```

- Using yarn:

```
yarn add --save @primuslabs/fund-js-sdk
```

This command will download and install the Primus Fund SDK and its dependencies into your project.

#### 2. Verify Installation

To ensure the SDK was installed correctly, you can check your `package.json` file. You should see `primuslabs/fund-js-sdk` listed in the `dependencies` section.

### Importing the SDK

After installation, you can import the SDK in your JavaScript or TypeScript files. Here's how:

```javascript
import { PrimusTip } from "@primuslabs/fund-js-sdk"
```

### Next Steps

After successfully installing Primus Fund SDK, you can refer to the [Example](./example.md) to learn how to set key parameters and complete the transaction with the fund contract.

If you need further support, feel free to reach out through our [community on Discord](https://discord.gg/AYGSqCkZTz).
