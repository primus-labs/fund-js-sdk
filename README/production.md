## Production Example

This guide will walk you through the fundamental steps to integrate Primus's Tip SDK and complete a basic tip process through your application. 

:::note
Integration in a production environment requires proper server setup and configuration of specific SDK parameters.
:::

### Prerequisites

Before you begin, ensure you have the following:

- [Primus Extension](https://chromewebstore.google.com/detail/pado/oeiomhmbaapihbilkfkhmlajkeegnjhe) installed.
- A paired appId and appSecret, along with a selected Template ID. These can be obtained from the [Primus Developer Hub](https://dev.primuslabs.xyz)
- The SDK installed. For installation instructions, refer to the [Installation Guide](./install.md).

### Frontend Implementation

:::note
Integration in a production environment involves configuring some [customized parameters](#customized-parameters). The examples provide default configurations for these parameters, which can be adjusted to suit your specific requirements.
:::

```javascript
  import { PrimusTip } from "@primuslabs/tip-js-sdk";

  // Initialize parameters, the init function is recommended to be called when the page is initialized.
  const primusTip = new PrimusTip();
  console.log("supportedChainIds=", primusTip.supportedChainIds); // [10143]
  console.log("supportedDataSourceIds=", primusTip.supportedDataSourceIds); // ['x', 'tiktok']
  const appId = "YOUR_APPID";
  const provider = YOUR_WALLET_PROVIDER
  const initTipResult = await primusTip.init(provider, appId);
  console.log("primusTip initTipResult=", initTipResult);

  export async function primusTip() {
    try {
      // 1.Tip
      // Set the tipping token information and the recipients' details.
      // When the token is a native coin, set tokenType to 1, and tokenAddress is not required.When the token is an ERC-20 token, set tokenType to 0, and tokenAddress is required.
      const tipToken = {
        tokenType: 0,
        tokenAddress: "0x",
      };
      // Support multiple recipients.
      // The unit of "amount": If you want to tip 1 token, pass "1". If you want to tip 0.1 tokens, pass "0.1".
      const tipRecipientInfo = [
        {
          idSource: "x",
          id: "xUserName",
          amount: "1",
        },
        {
          idSource: "tiktok",
          id: "tiktokUserName",
          amount: "0.1",
        },
      ];
      const tipParams = {
        tipToken,
        tipRecipientInfo,
      };
      const tipRes = await tipSdk.tip(tipParams);

      // 2. Generate attestation request.
      const dataSourceID = "x";
      const userAddress = "YOUR_USER_ADDRESS";
      // signFn will accept sign parameters and return a signature.
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

      // 3. claim the tip process.
      const receipt = { idSource: "x", id: "xUserName", attestation };
      const claimRes = await tipSdk.claimBySource(receipt);
      
    } catch(error) {
      console.error("Error:", error);
    }
    
  }
```

### Backend Implementation

Here’s a basic example of how to configure and initialize the Primus zkTLS SDK on the backend:

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

### Customized Parameters

#### Init
```javascript
  const initTipResult = await primusTip.init(provider, appId);
```
##### 1. provider
 
Your wallet provider. For example, if you are using the native MetaMask connection method, you can pass `window.ethereum`. If you are using wagmi, you can pass `useAccount().connector.getProvider` （After you connect）.

###### 2. appId

Obtain a paired appID and appSecret from [Primus Develop Hub](https://dev.primuslabs.xyz)

#### Tip
```javascript
  // donor send tips to specific users
  const tipParams = {
      tipToken,
      tipRecipientInfo,
    };
  const tipRes = await tipSdk.tip(tipParams);;
```
##### 1. tipToken
 
Donors can tip with native tokens or ERC-20 tokens. For ERC-20 tokens, the token address must also be provided.

For native tokens

```javascript
  const tipToken = {
    tokenType: 1,
  };
```

For ERC-20 tokens

```javascript
  const tipToken = {
    tokenType: 0,
    tokenAddress: "0x",
  };
```

##### 2. tipRecipientInfo

We support tipping multiple users at once. The information of the recipient includes the data source ID, the userId on that data source, and the amount of tokens tipped. Note the unit of the amount: If you want to tip 1 token, pass "1". If you want to tip 0.1 tokens, pass "0.1". just like this:

```javascript
    const tipRecipientInfo = [
      {
        idSource: "x",
        id: "xUserName",
        amount: "1",
      },
      {
        idSource: "tiktok",
        id: "tiktokUserName",
        amount: "0.1",
      },
    ];
```

#### Attest
```javascript
  const attestation = await tipSdk.attest(dataSourceID, userAddress, signFn);
```

##### 1. dataSourceID

Select one from `primusTip.supportedChainIds`.

##### 2.userAddress
  
Your wallet address, which is also the address for receiving tips.

##### 3. signFn

A function will accept sign parameters and return a signature. Note that before implementing this method, you need to have a backend service to generate the signature.

```javascript 
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
```

#### claimBySource

```javascript 
  const receipt = { idSource: "x", id: "xUserName", attestation };
  const claimRes = await tipSdk.claimBySource(receipt);
```

##### 1.idSource

the data source ID

##### 2.id

The userId on the data source.

##### 3.attestation
 
It is the return value of the `attest` method called earlier, and it looks like this:

```javascript
  {
    "recipient": "YOUR_USER_ADDRESS", // user's wallet address
    "request": {
      "url": "REQUEST_URL", // request url
      "header": "REQUEST_HEADER", // request header
      "method": "REQUEST_METHOD", // request method
      "body": "REQUEST_BODY" // request body
    },
    "reponseResolve": [
      {
        "keyName": "VERIFY_DATA_ITEMS", // the "verify data items" you set in the template
        "parseType": "",
        "parsePath": "DARA_ITEM_PATH" // json path of the data for verification
      }
    ],
    "data": "{ACTUAL_DATA}", // actual data items in the request, stringified JSON object
    "attConditions": "[RESPONSE_CONDITIONS]", // response conditions, stringified JSON object
    "timestamp": TIMESTAMP_OF_VERIFICATION_EXECUTION, // timestamp of execution
    "additionParams": "", // additionParams from zkTLS sdk
    "attestors": [ // information of the attestors
      {
        "attestorAddr": "ATTESTOR_ADDRESS",  // the address of the attestor
        "url": "https://primuslabs.org"        // the attestor's url
      }
    ],
    "signatures": [
      "SIGNATURE_OF_THIS_VERIFICATION" // attestor's signature for this verification
    ]
  }

```

