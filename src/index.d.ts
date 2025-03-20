export type AttNetworkRequest = {
    url: string,
    header: string, // json string
    method: string,
    body: string
}
export type AttNetworkResponseResolve = {
    keyName: string,
    parseType: string, //json or html
    parsePath: string
}
export type Attestor = {
    attestorAddr: string,
    url: string
}
export type Attestation = {
    recipient: string,
    request: AttNetworkRequest,
    reponseResolve: AttNetworkResponseResolve[],
    data: string, // json string
    attConditions: string, // json string
    timestamp: number,
    additionParams: string,
    attestors: Attestor[],
    signatures: string[],
}
declare global {
    interface Window {
        primus?: any;
    }
}

// start
//
// ERC20_TYPE = 0;
// NATIVE_TYPE = 1;
export type TokenType = 0 | 1
export type FundToken =
  | { tokenType: 0; tokenAddress: string }
  | { tokenType: 1; tokenAddress?: string }; 

export type  RecipientBaseInfo = {
    socialPlatform: string;// The name of the social platform.
    userIdentifier: string;// The user’s unique identifier on the platforms.
}

export type  RecipientInfo = RecipientBaseInfo & {
    tokenAmount: string;// The amount of the token
    nftIds?: bigint[];// The nft token ids when token is nft.
}

export type FundParam = {
    fundToken: FundToken;
    fundRecipientInfos: RecipientInfo[];
}

export type ClaimParam = RecipientBaseInfo & {
    attestation: Attestation;
    fundIndex?: number;
}