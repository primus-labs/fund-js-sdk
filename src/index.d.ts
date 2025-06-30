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
// ERC721_TYPE = 2;
export type TokenType = 0 | 1 | 2
export type ERC20TokenInfo = { tokenType: 0; tokenAddress: string }
export type NATIVETokenInfo = { tokenType: 1; tokenAddress?: string }
export type NFTTokenInfo = { tokenType: 2; tokenAddress: string }
export type TokenInfo = ERC20TokenInfo | NATIVETokenInfo | NFTTokenInfo; 

export type  RecipientBaseInfo = {
    socialPlatform: string;// The name of the social platform.
    userIdentifier: string;// The user’s unique identifier on the platforms.
}
export type RefundParam = RecipientBaseInfo &{
    tipTimestamp?: number; // unit: s
}
export type  RecipientInfo = RecipientBaseInfo & {
    tokenAmount: string;// The amount of the token
    nftIds?: bigint[] | [];// The nft token ids when token is nft.
}

export type FundParam = {
    tokenInfo: TokenInfo;
    recipientInfos: RecipientInfo[];
}

export type ClaimParam = RecipientBaseInfo & {
    attestation: Attestation;
    fundIndex?: number;
}

export type AttestParams = {
    socialPlatform: string;
    userIdentifier: string;
    address: string
}


export type RedPacketType = 0 | 1;// 0 means random red packet, 1 means average red packet.
export type CheckParams = [bigint, string]
export type SendForRedPacketParam = {
    reType: RedPacketType;
    number: bigint; // number indicates how many people the red packet is sent to.
    amount: string; // The total amount of the red packet.
    checkContract: string;// A contract used to check whether you are eligible to receive a red packet.
    checkParams: string;
}
export type FundForRedPacketParam = {
    tokenInfo: TokenInfo;
    sendParam: SendForRedPacketParam;
}
export type FundERC20ForRedPacketParam = {
    tokenInfo: ERC20TokenInfo;
    sendParam: SendForRedPacketParam;
}
export type RedPacketId = bigint;
export type ApproveParams = {
    spenderAddress: string;
    approveAmount: string;
    otherParams?:any
}

export type AttestCommonParams = {
    templateId: string;
    address: string;
    genAppSignature: (signParams: string) => Promise<string>;
    conditions?: any[];
    backUrl?: string;
}
export type ApproveForRedPacketParams = {
    tokenInfo: ERC20TokenInfo;
    approveAmount: string;
}