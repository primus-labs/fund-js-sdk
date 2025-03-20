## Receiver Guide

### Claim Tokens through your DApp

#### Prerequisites

Before you begin, ensure you have the following:

- An appSecret that matches the appID set during the funding stage. 
- The Fund SDK installed. For installation instructions, refer to the [Installation Guide](./install.md).
- Integrated wallet services. In this version, MetaMask and Wagmi are supported. Users must connect their wallets before verifying their social accounts and claiming tokens. The claimed tokens will be sent to the address that completes an attestation proving ownership of the social account. Support for AA wallets and AI agent-supported wallets will be added in the future.
- Prompt users to install the [Primus Extension](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe?pli=1) before initiating the social account ownership attestation process.

#### Frontend Implementation

```javascript
import { PrimusTip } from "@primuslabs/tip-js-sdk";

// Initialize parameters. The init function is recommended to be called when the page is initialized.
const primusTip = new PrimusTip();
console.log("supportedChainIds=", primusTip.supportedChainIds); // [10143]
console.log("supportedDataSourceIds=", primusTip.supportedDataSourceIds); // ['x', 'tiktok']
const appId = "YOUR_APPID";
const provider = YOUR_WALLET_PROVIDER // For MetaMask, use window.ethereum; for Wagmi, use useAccount().connector.getProvider(). Other wallet types, such as AA wallets or AI agents, will be supported in the future.
const initTipResult = await primusTip.init(provider, appId);
console.log("primusTip initTipResult=", initTipResult);

export async function primusTip() {
  try {
    // 1. Generate account ownership verification.
    const dataSourceID = "x";
    const userAddress = "YOUR_USER_ADDRESS";
    // Request backend signature using appSecret.
    const signFn = async (signParams) => {
      // Get signed resopnse from backend.
      const response = await fetch(`http://YOUR_URL:PORT?YOUR_CUSTOM_PARAMETER`, {
          method: 'POST',
          body: JSON.stringify(signParams),
      });
      const responseJson = await response.json();
      const signature = responseJson.signResult;
      return signature
    } 
    const attestation = await tipSdk.attest(dataSourceID, userAddress, signFn);
    console.log("attestation=", attestation);

    // 2. Submit the attestation and claim the token.
    const receipt = { idSource: "x", id: "xUserName", attestation};
    const claimRes = await tipSdk.claimBySource(receipt);
  } catch(error) {
      console.error("Error:", error);
  }
}
```

#### Backend Implementation

Here’s a basic example of how to configure and initialize the Primus Fund SDK on the backend:

```javascript
  const express = require("express");
  const cors = require("cors");
  const { PrimusZKTLS } = require("@primuslabs/zktls-js-sdk");

  const app = express();
  const port = "YOUR_PORT";

  // Just for test, developers can modify it.
  app.use(cors());

  // Listen to the client's signature request and sign the attestation request.
  app.get("/primus/sign", async (req, res) => {
    const appId = "YOUR_APPID";
    const appSecret = "YOUR_SECRET";

    // Create a PrimusZKTLS object.
    const primusTip = new PrimusZKTLS();

    // Set appId and appSecret through the initialization function.
    await primusTip.init(appId, appSecret);

    // Sign the attestation request.
    console.log("signParams=", req.query.signParams);
    const signResult = await primusTip.sign(req.query.signParams);
    console.log("signResult=", signResult);

    // Return signed result.
    res.json({ signResult });
  });

  app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
  });
```

### Claim Tokens through the Primus Extension

For users who have already installed the Primus Extension, if the social account has already been verified within the extension, they will receive an in-site notification. 

Users can claim tokens directly through the Primus Extension.
