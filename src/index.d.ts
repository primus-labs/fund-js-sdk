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
export type TokenType = 'erc20' | 'native' | 'nft'
export type TipToken = {
  tokenType: string; 
  tokenAddress: string;
}
export type  TipRecipientInfo = {
  idSource:string;// The platform of the account.
  id: string;// The unique identifier of the account.
  amount: bigint;// The amount of token when token is erc20 and native.
  nftIds: bigint[] ;// The nft token ids when token is nft.
}
