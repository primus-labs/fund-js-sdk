import { Program, Idl } from "@coral-xyz/anchor";
import * as anchor from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import * as borsh from 'borsh'
const { deserialize } = borsh
const BN = anchor.BN;

export const getProgram = (idl: any, anchorProvider: any) => {
  return new Program(idl as unknown as Idl, anchorProvider);
}

export const toTokenAmount = (amount: number | string, decimals: number) => {

  const [integerPart, fractionalPart = ""] = String(amount).split(".");

  const fractionalPadded = fractionalPart.padEnd(decimals, "0").slice(0, decimals);
  const raw = integerPart + fractionalPadded;

  const cleaned = raw.replace(/^0+/, "") || "0";

  return new BN(cleaned);
}
export const fromTokenAmount = (amount: number | string, decimals: number) => {

  const bn = new BN(amount);
  const base = new BN(10).pow(new BN(decimals));

  const whole = bn.div(base).toString(); // integer part

  let fraction = bn.mod(base).toString(); // fractional part

  fraction = fraction.padStart(decimals, "0");

  fraction = fraction.replace(/0+$/, "");

  return fraction.length > 0 ? `${whole}.${fraction}` : whole;
}

export async function getTokenDecimals(mintAddress: string, connection: Connection) {
  const mintPubkey = new PublicKey(mintAddress);
  const mintInfo = await getMint(connection, mintPubkey);
  return mintInfo.decimals;
}

export const hexToUint8Array = (hex: string) => {
  let hexStr = hex.startsWith("0x") ? hex.slice(2) : hex;
  return Buffer.from(hexStr.toLowerCase(), "hex")
};
export function formatAttestation(attestation: any) {
  const { additionParams, attConditions, attestors, data, recipient,
    responseResolve,
    request,
    signatures,
    timestamp
  } = attestation;

  const formatAttestors = attestors.map(({ attestorAddr, url }: any) => {
    return {
      attestorAddr: hexToUint8Array(attestorAddr),
      url
    }
  })
  const formatSignatures = signatures.map((s: string) => hexToUint8Array(s))

  const formatAtt = {
    additionParams,
    attConditions,
    attestors: formatAttestors,
    data,
    recipient: new PublicKey(recipient).toBytes(),
    responseResolve,
    request,
    signatures: formatSignatures,
    timestamp: new anchor.BN(timestamp)
  }

  return formatAtt;
}


export async function decodeReSendEvent(eventData: string) {
  // const eventData = "kwjt4XtAncd3/3ODwSSqxXl/mCNb1SXEwfjq7/MxdGU27OFTLzWDkIJArVr8w+KA3nOTt30oMG8ESZs1UVPYejI00Wsh9J6cAAAAADUW97t3QNuPLFBY6ImNIHpkKyXIAC8TN67d0gjFHAlAgIQeAAAAAAAAAAAAAgAAAOS3lWgAAAAAAQAAAA4AAABnb29nbGUgYWNjb3VudAA="; // 你的 base58 字符串数据
  const eventBuffer = Buffer.from(eventData, "base64");
  const raw = eventBuffer.slice(8);

  // print eventBuffer first 8 bytes as uint8 array
  console.log("eventBuffer first 8 bytes:", Array.from(eventBuffer.slice(0, 8)));

  class CheckParams {
    check_type: any;
    params: any;
    constructor(fields) {
      this.check_type = fields.check_type;
      this.params = fields.params;
    }
  }
  class RESendEvent {
    id: any;
    re_sender: any;
    token_type: any;
    token_address: any;
    amount: any;
    re_type: any;
    number: any;
    timestamp: any;
    check_params: CheckParams;
    empty_ratio: any;
    constructor(fields) {
      this.id = fields.id;
      this.re_sender = fields.re_sender;
      this.token_type = fields.token_type;
      this.token_address = fields.token_address;
      this.amount = fields.amount;
      this.re_type = fields.re_type;
      this.number = fields.number;
      this.timestamp = fields.timestamp;
      this.check_params = new CheckParams(fields.check_params);
      this.empty_ratio = fields.empty_ratio;
    }
  }

  const CheckParamsJson = {
    "kind": "struct",
    "fields": [
      ["check_type", "u32"],
      ["params", "string"],
    ]
  };
  const RESendEventJson = {
    "kind": "struct",
    "fields": [
      ["id", [32]],
      ["re_sender", [32]],
      ["token_type", "u32"],
      ["token_address", [32]],
      ["amount", "u64"],
      ["re_type", "u32"],
      ["number", "u32"],
      ["timestamp", "u64"],
      ["check_params", CheckParams],
      ["empty_ratio", "u8"]
    ]
  };

  const schema = new Map<any, any>([
    [CheckParams, CheckParamsJson],
    [RESendEvent, RESendEventJson],
  ]);

  const res = deserialize(schema, RESendEvent, raw);

  console.log("decodeReSendEvent=", res);
  // console.log("res=", new PublicKey(res.re_sender).toBase58());
  return res
}

export async function decodeClaimEvent(eventData: string) {
  const eventBuffer = Buffer.from(eventData, "base64");
  const raw = eventBuffer.slice(8);

  // print eventBuffer first 8 bytes as uint8 array
  console.log("eventBuffer first 8 bytes:", Array.from(eventBuffer.slice(0, 8)));

  class REClaimEvent {
    id: any;
    user: any;
    user_id: any;
    amount: any;
    index: any;
    timestamp: any;
    token_address: any;
    constructor(fields:any) {
      this.id = fields.id;
      this.user = fields.user;
      this.user_id = fields.user_id;
      this.amount = fields.amount;
      this.index = fields.index;
      this.timestamp = fields.timestamp;
      this.token_address = fields.token_address;
    }
  }

  const REClaimEventJson = {
    "kind": "struct",
    "fields": [
      ["id", [32]],
      ["user", [32]],
      ["user_id", "string"],
      ["amount", "u64"],
      ["index", "u32"],
      ["timestamp", "u64"],
      ["token_address", [32]],
    ]
  };

  const schema = new Map<any, any>([
    [REClaimEvent, REClaimEventJson],
  ]);

  const res = deserialize(schema, REClaimEvent, raw);
  console.log("res=", res);
  console.log("res=", new PublicKey(res.user).toBase58());
  return res
}
