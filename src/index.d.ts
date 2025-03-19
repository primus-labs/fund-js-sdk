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
// export type TipToken = {
//     tokenType: TokenType;
//     tokenAddress?: string;
// }
export type TipToken =
  | { tokenType: 0; tokenAddress: string }
  | { tokenType: 1; tokenAddress?: string }; 

export type  TipRecipientInfo = {
    idSource: string;// The platform of the account.
    id: string;// The unique identifier of the account.
    amount: string;// The amount of token when token is erc20 and native.
    nftIds?: bigint[];// The nft token ids when token is nft.
}

export type TipParam = {
    tipToken: TipToken;
    tipRecipientInfo: TipRecipientInfo[];
}

export type ClaimTipParam = {
    idSource: string;
    id: string;
    attestation: Attestation;
    tipIndex?: number;
}