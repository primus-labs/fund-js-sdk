## Receiver Guide

### Claim Tokens through your DApp

#### Prerequisites

Before you begin, ensure you have the following:

- An appSecret that matches the appID set during the funding stage. 
- The Fund SDK installed. For installation instructions, refer to the [Installation Guide](./install.md).
- Integrated wallet services. In this version, MetaMask and Wagmi are supported. Users must connect their wallets before verifying their social accounts and claiming tokens. The claimed tokens will be sent to the address that completes an attestation proving ownership of the social account. Support for AA wallets and AI agent-supported wallets will be added in the future.
- Prompt users to install the [Primus Extension](https://chromewebstore.google.com/detail/primus-prev-pado/oeiomhmbaapihbilkfkhmlajkeegnjhe?pli=1) before initiating the social account ownership verification process.

#### Frontend Implementation

```javascript
import { PrimusFund } from "@primuslabs/fund-js-sdk";

// Initialize parameters. The init function is recommended to be called when the page is initialized.
const primusFund = new PrimusFund();
console.log("supportedChainIds=", primusFund.supportedChainIds); // [10143]
console.log("supportedSocialPlatforms=", primusFund.supportedSocialPlatforms); // ['x', 'tiktok', 'google account']
const appId = "YOUR_APPID";
const provider = YOUR_WALLET_PROVIDER // For MetaMask, use window.ethereum; for Wagmi, use useAccount().connector.getProvider(). Other wallet types, such as AA wallets or AI agents, will be supported in the future.
const chainId = 10143;
const initializationResult = await primusFund.init(provider, chainId, appId);
console.log("primusFund initializationResult=", initializationResult);

export async function primusFundFn() {
  try {
    // 1. Generate social account ownership verification.
    const socialPlatform = "x";
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
    const attestation = await primusFund.attest(socialPlatform, userAddress, signFn);
    console.log("attestation=", attestation);

    // 2. Submit the attestation and claim the token.
    const receipt = { socialPlatform: "x", userIdentifier: "xUserName", attestation};
    const claimTxReceipt = await primusFund.claim(receipt);
    console.log("claimTxReceipt=", claimTxReceipt);
  } catch(error) {
      console.error("Error:", error);
  }
}
```

#### Backend Implementation

When conducting the social account ownership verification process, your paired appSecret must be used for signing. For security reasons, the appSecret should be implemented on the backend. 

The integration method is the same as zkTLS-js-sdk. You can refer to the [Backend Implementation](https://docs.primuslabs.xyz/data-verification/zk-tls-sdk/production#backend-implementation) for more details.


### Claim Tokens through the Primus Extension

For users who have already installed the Primus Extension, if the social account has already been verified within the extension, they will receive an in-site notification. 

Users can claim tokens directly through the Primus Extension.
