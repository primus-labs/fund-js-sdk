## Example

This guide will walk you through the fundamental steps to integrate the Primus Fund SDK and complete a transaction to the fund contract.

:::note
Integration requires configuring specific SDK parameters.
:::

### Prerequisites

Before you begin, ensure you have the following:

- A paired appId and appSecret, which can be obtained from the [Primus Developer Hub](https://dev.primuslabs.xyz/)
- The Fund SDK installed. For installation instructions, refer to the [Installation Guide](./install.md).

### Customized Parameters

#### Token Information

The SDK supports sending **native tokens** or **ERC-20 tokens**. For ERC-20 tokens, the token's contract address must be provided.

For native tokens:

```javascript
const tokenInfo = {
  tokenType: 1,
};
```

For ERC-20 tokens:

```javascript
const tokenInfo = {
  tokenType: 0,
  tokenAddress: "0x",
};
```

#### Receiver's Information

To send crypto directly to a receiver's social account, the following information is required:

 -  **Social platform**: The name of the social platform supported by the Fund SDK.
 -  **User identifier**: The user’s unique identifier on the platform (e.g., a Twitter handle).
 -  **Token Amount**: The number of tokens to send. For example, to send 1 token, enter 1; to send 0.1 token, enter 0.1, and so on. Different amounts can be set for each user.

Below is a list of currently supported platforms and their corresponding user identifier formats. This list will continue to expand.

| Social Platform | User Identifier |
| --------------- | --------------- |
| X               | Username (handle)         |
| TikTok          | Username        |
| Google Account  | Email address   |

The SDK supports configuring multiple receivers across different social platforms.

```javascript
const recipientInfo = [
  {
    socialPlatform: "x",
    userIdentifier: "xUserName",
    tokenAmount: "1",
  },
  {
    socialPlatform: "tiktok",
    userIdentifier: "tiktokUserName",
    tokenAmount: "0.1",
  },
];
```


### Frontend Implementation

:::note
Integration involves configuring [customized parameters](#customized-parameters). The example below provides default configurations for these parameters, which can be adjusted to suit your requirements.
:::

**For fund users**:

```javascript
  import { PrimusFund } from "@primuslabs/fund-js-sdk";

  // Initialize parameters. The init function is recommended to be called when the page is initialized.
  const primusFund = new PrimusFund();
  console.log("supportedChainIds=", primusFund.supportedChainIds); // [10143]
  console.log("supportedSocialPlatforms=", primusFund.supportedSocialPlatforms); // ['x', 'tiktok', 'google account']
  const appId = "YOUR_APPID";
  const provider = YOUR_WALLET_PROVIDER // For MetaMask, pass `window.ethereum`; for Wagmi, pass `useAccount().connector.getProvider`; Other wallet types, such as AA wallets or AI agents, will be supported in the future.
  const chainId = 10143;
  await primusFund.init(provider, chainId, appId);

  export async function primusFundFn() {
    try {
      // Set the token information.
      const tokenInfo = {
        tokenType: 0,
        tokenAddress: "0x", 
      };
      // Set receiver's information, multiple receivers are supported.
      const recipientInfos = [
        {
          socialPlatform: "x",
          userIdentifier: "xUserName",
          tokenAmount: "1",
        },
        {
          socialPlatform: "tiktok",
          userIdentifier: "tiktokUserName",
          tokenAmount: "0.1",
        },
      ];
      const fundParam = {
        tokenInfo,
        recipientInfos,
      };
      // Send transaction to the fund contract.
      const fundTxReceipt = await primusFund.fund(fundParam);
      console.log("fundTxReceipt=", fundTxReceipt)
    } catch(error) {
      console.error("Error:", error);
    }
  }
```

**For refunding unclaimed tokens**:

In the current version, the fund contract has a 30-day processing period. If the funded tokens are not claimed within this period, you can initiate a refund transaction to return all unclaimed tokens to your original sending wallet address.

```javascript
  import { PrimusFund } from "@primuslabs/fund-js-sdk";

  // Initialize parameters. The init function is recommended to be called when the page is initialized.
  const primusFund = new PrimusFund();
  console.log("supportedChainIds=", primusFund.supportedChainIds); // [10143]
  const provider = YOUR_WALLET_PROVIDER // For MetaMask, pass `window.ethereum`; for Wagmi, pass `useAccount().connector.getProvider`; Other wallet types, such as AA wallets or AI agents, will be supported in the future.
  const appId = "YOUR_APPID";
  const chainId = 10143;
  await primusFund.init(provider, chainId, appId);

  export async function primusFundFn() {
    try {
      // Set receiver's information
      const recipients = [
        {
          socialPlatform: "x",
          userIdentifier: "xHandle"
        },
        {
          socialPlatform: "tiktok",
          userIdentifier: "tiktokUserName"
        },
      ];
      const refundTxReceipt = await primusFund.refund(recipients);
      console.log("refundTxReceipt=", refundTxReceipt)
    } catch(error) {
      console.error("Error:", error);
    }
  }
```
