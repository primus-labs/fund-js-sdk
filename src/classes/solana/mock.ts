import * as anchor from "@coral-xyz/anchor";
import { ERC20_TYPE, NATIVE_TYPE, CHECK_TYPE_ACCOUNT, CHECK_TYPE_X_FOLLOWING, waitForTransactionConfirmation } from "./sdk";
import { createMint, getAssociatedTokenAddress, mintTo, getAccount, getOrCreateAssociatedTokenAccount } from "@solana/spl-token";
import { Keypair } from "@solana/web3.js";

export function getMockAttestor() {
  const ethAddressStr = "0xe05fcC23807536bEe418f142D19fa0d21BB0cfF7";
  const ethAddressBytes = Buffer.from(ethAddressStr.slice(2), "hex");
  const attestor = {
    attestorAddr: Array.from(ethAddressBytes),
    url: "https://@0xF1.com/",
  };
  return attestor;
}
export function getMockAttestor2() {
  const ethAddressStr = "0x570B4A56255f7509266783a81C3438fd5D7067B6";
  const ethAddressBytes = Buffer.from(ethAddressStr.slice(2), "hex");
  const attestor = {
    attestorAddr: Array.from(ethAddressBytes),
    url: "https://@0xF2.com/",
  };
  return attestor;
}


function getMockAttestationXFollowing() {
  const request = {
    "url": "https://x.com/i/api/graphql/U15Q5V7hgjzCEg6WpSWhqg/UserByScreenName?variables=%7B%22screen_name%22%3A%22pharos_network%22%7D&features=%7B%22responsive_web_grok_bio_auto_translation_is_enabled%22%3Afalse%2C%22hidden_profile_subscriptions_enabled%22%3Atrue%2C%22payments_enabled%22%3Afalse%2C%22profile_label_improvements_pcf_label_in_post_enabled%22%3Atrue%2C%22rweb_tipjar_consumption_enabled%22%3Atrue%2C%22verified_phone_label_enabled%22%3Afalse%2C%22subscriptions_verification_info_is_identity_verified_enabled%22%3Atrue%2C%22subscriptions_verification_info_verified_since_enabled%22%3Atrue%2C%22highlights_tweets_tab_ui_enabled%22%3Atrue%2C%22responsive_web_twitter_article_notes_tab_enabled%22%3Atrue%2C%22subscriptions_feature_can_gift_premium%22%3Atrue%2C%22creator_subscriptions_tweet_preview_api_enabled%22%3Atrue%2C%22responsive_web_graphql_skip_user_profile_image_extensions_enabled%22%3Afalse%2C%22responsive_web_graphql_timeline_navigation_enabled%22%3Atrue%7D&fieldToggles=%7B%22withAuxiliaryUserLabels%22%3Atrue%7D",
    "header": "",
    "method": "GET",
    "body": ""
  };
  const response1 = {
    "keyName": "",
    "parseType": "",
    "parsePath": "$.data.user.result.relationship_perspectives.following"
  };
  const response2 = {
    "keyName": "",
    "parseType": "",
    "parsePath": "$.data.user.result.core.screen_name"
  };
  let attestor1 = {
    attestorAddr: Array.from(Buffer.from("0xdb736b13e2f522dbe18b2015d0291e4b193d8ef6".slice(2), "hex")),
    url: "https://primuslabs.xyz"
  }
  let signature =
    "f3aa92774147956813764bfe77fecc51aa7e25ffce1ea7a7e5d931013e6a46c077f800b9c73101cc8e19d7f846cdfc416e442accb2521a2f3b71bf53b0dceecd1c";

  const attestation = {
    recipient: Buffer.from("eb0c48db39a7d43dc8dffffa7f89fcbcae034331465a1ced296d0b5f6957a97e".toLowerCase(), "hex"),
    request: request,
    responseResolve: [response1, response2],
    data: "{\"screen_name\":\"superMan\"}",
    attConditions: "[{\"op\":\"STREQ\",\"field\":\"$.data.user.result.relationship_perspectives.following\",\"value\":\"true\"},{\"op\":\"STREQ\",\"field\":\"$.data.user.result.core.screen_name\",\"value\":\"pharos_network\"},{\"op\":\"REVEAL_STRING\",\"field\":\"$.screen_name\"}]",
    timestamp: new anchor.BN("1753839145163"),
    additionParams: "{\"redPacketInfo\":{\"checkParams\":[0,\"pharos_network\"],\"reType\":1,\"id\":\"0xdd6bcf7ca1765fe331a07601f51acea4e979241967d849a4711ee9a54b080e19\"},\"algorithmType\":\"proxytls\",\"launch_page\":\"https://x.com/pharos_network\",\"requests[1].url\":\"https://api.x.com/1.1/account/settings.json?include_ext_sharing_audiospaces_listening_data_with_followers=true&include_mention_filter=true&include_nsfw_user_flag=true&include_nsfw_admin_flag=true&include_ranked_timeline=true&include_alt_text_compose=true&ext=ssoConnections&include_country_code=true&include_ext_dm_nsfw_media_filter=true\",\"requests[1].method\":\"GET\",\"requests[1].body\":\"\",\"requests[1].header\":\"\",\"reponseResolves[1][0].keyName\":\"screen_name\",\"reponseResolves[1][0].parseType\":\"\",\"reponseResolves[1][0].parsePath\":\"$.screen_name\"}",
    attestors: [attestor1],
    signatures: [Buffer.from(signature, "hex")],
  };

  return attestation;
}

function getMockAttestationAccount() {
  const request = {
    "url": "https://developers.google.com/_d/profile/user",
    "header": "",
    "method": "POST",
    "body": ""
  };
  const response1 = {
    "keyName": "2",
    "parseType": "",
    "parsePath": "$[2]"
  };
  let attestor1 = {
    attestorAddr: Array.from(Buffer.from("0xdb736b13e2f522dbe18b2015d0291e4b193d8ef6".slice(2), "hex")),
    url: "https://primuslabs.xyz",
  }
  let signature =
    "9f61d6d12887d5a3d4a4d4919d3cf8ba43caef3d2f570fbc833d94594b97504b2e3b916f89499b5de97e9d7591fdc3382539e94aef6abb028f6bd2b7a0e6e2511c";

  const attestation = {
    recipient: Buffer.from("eb0c48db39a7d43dc8dffffa7f89fcbcae034331465a1ced296d0b5f6957a97e".toLowerCase(), "hex"),
    request: request,
    responseResolve: [response1],
    data: "{\"2\":\"abc@gmail.com\"}",
    attConditions: "[{\"op\":\"REVEAL_STRING\",\"field\":\"$[2]\"}]",
    timestamp: new anchor.BN("1753839065297"),
    additionParams: "{\"redPacketInfo\":{\"checkParams\":[1,\"google account\"],\"reType\":1,\"id\":\"0x53c51c24e2d85aa4aa6ca58c096d82fdcc268264daa5b6852c2e907caa671770\"},\"algorithmType\":\"proxytls\"}",
    attestors: [attestor1],
    signatures: [Buffer.from(signature, "hex")],
  };

  return attestation;
}

export function getMockAttestation(xFollowing: boolean = true) {
  if (xFollowing) {
    return getMockAttestationXFollowing();
  }
  return getMockAttestationAccount();
}


export function getMockReSendParams(xFollowing: boolean = true) {
  // const tipToken = {// TODO
  //   tokenType: NATIVE_TYPE, // 0,ERC20_TYPE; 1,NATIVE_TYPE
  //   tokenAddress: anchor.web3.PublicKey.default,
  // };
  const tipToken = {// TODO
    tokenType: ERC20_TYPE, // 0,ERC20_TYPE; 1,NATIVE_TYPE
    tokenAddress: new PublicKey('4aEvQMXgLVwzJsg5SjDpuQ1mA7wM2qj5jdMezRyRMXT5'),
  };
  let checkParams = {
    checkType: CHECK_TYPE_ACCOUNT, // 0,CHECK_TYPE_X_FOLLOWING; 1,CHECK_TYPE_ACCOUNT
    params: "google account", // TODO
  };
  if (xFollowing) {
    checkParams.checkType = CHECK_TYPE_X_FOLLOWING;
    checkParams.params = "pharos_network";
    // TODO primus_labs
  }
  // about 135 compute units per non-empty-red-envelope
  // max non-empty-red-envelope of 20w CUs is (200000 - 49200) / 135 = 1117
  // let { n, r } = { n: 1, r: 0 };
  // let { n, r } = { n: 1117, r: 0 };
  // let { n, r } = { n: 5678, r: 90 };
  let { n, r } = { n: 2, r: 0 };
  // let { n, r } = { n: 10000, r: 95 };
  // let { n, r } = { n: 17000, r: 97 };
  // let { n, r } = { n: 50000, r: 99 };
  const reSendParam = {
    reType: 0,
    number: n,
    amount: new anchor.BN(2_000_000),
    checkContract: anchor.web3.PublicKey.default,
    checkParams: checkParams,
    emptyRatio: r,
  };
  return { tipToken, reSendParam };
}

// Helper to create mint + mint tokens
// TODO???
export async function createMintAndAccounts(provider: anchor.AnchorProvider, payer: Keypair, userKey: anchor.web3.PublicKey): Promise<{
  mint: anchor.web3.PublicKey; senderTokenAccount: anchor.web3.PublicKey;
}> {
  const mint = await createMint(
    provider.connection,
    payer,
    payer.publicKey,
    null, // freeze authority
    6 // decimals
  );

  // const senderTokenAccount = await getAssociatedTokenAddress(mint, userKey);
  const ata = await getOrCreateAssociatedTokenAccount(
    provider.connection,
    payer,           // fee payer
    mint,
    userKey          // token account owner
  );

  // Mint 100_000_000 tokens to sender
  await mintTo(
    provider.connection,
    payer,
    mint,
    ata.address,
    payer,
    100_000_000
  );

  return { mint, senderTokenAccount: ata.address };
}

import {
  Connection,
  SystemProgram,
  Transaction,
  PublicKey,
} from '@solana/web3.js';

export async function getOrCreateMockAccount(
  secretKey: Uint8Array,
  connection: Connection,
  payer?: Keypair,
): Promise<Keypair> {
  const tempAccount = Keypair.fromSecretKey(secretKey);
  const accountInfo = await connection.getAccountInfo(tempAccount.publicKey);
  if (accountInfo) {
    return tempAccount;
  }

  const lamports = await connection.getMinimumBalanceForRentExemption(0);

  const tx = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer.publicKey,
      newAccountPubkey: tempAccount.publicKey,
      lamports,
      space: 0,
      programId: SystemProgram.programId,
    })
  );

  const sig = await connection.sendTransaction(tx, [payer, tempAccount]);
  await connection.confirmTransaction(sig, 'confirmed');
  console.log('create account:', tempAccount.publicKey.toBase58());

  return tempAccount;
}

export function generateKepair() {
  const keypair = anchor.web3.Keypair.generate();
  console.log('sk', Array.from(keypair.secretKey).map(b => b.toString(16).padStart(2, '0')).join(''));
  console.log('pk', keypair.publicKey.toBase58());
}

export async function getMockAccount1(
  connection: Connection,
  payer?: Keypair,
): Promise<Keypair> {
  const secretKey = Uint8Array.from([
    48, 182, 31, 87, 219, 175, 241, 122, 22, 24, 17,
    13, 245, 245, 126, 86, 140, 114, 254, 239, 49, 61,
    21, 108, 140, 172, 128, 22, 13, 16, 81, 129, 235,
    12, 72, 219, 57, 167, 212, 61, 200, 223, 255, 250,
    127, 137, 252, 188, 174, 3, 67, 49, 70, 90, 28,
    237, 41, 109, 11, 95, 105, 87, 169, 126
  ]);
  return await getOrCreateMockAccount(secretKey, connection, payer);

}

export async function getMockAccount2(
  connection: Connection,
  payer?: Keypair,
): Promise<Keypair> {
  const secretKey = Uint8Array.from([
    77, 29, 50, 175, 153, 221, 107, 128, 229, 216, 246,
    171, 207, 24, 210, 143, 92, 196, 107, 202, 146, 55,
    238, 38, 88, 254, 118, 145, 84, 217, 133, 17, 11,
    213, 113, 89, 36, 91, 80, 36, 104, 114, 129, 181,
    255, 228, 215, 156, 34, 110, 135, 143, 208, 27, 89,
    219, 0, 50, 243, 231, 181, 122, 15, 206
  ]);
  return await getOrCreateMockAccount(secretKey, connection, payer);
}

export async function getMockAccount3(
  connection: Connection,
  payer?: Keypair,
): Promise<Keypair> {
  const secretKey = Uint8Array.from([
    227, 36, 70, 174, 215, 41, 246, 13, 118, 144, 43,
    135, 50, 188, 229, 62, 53, 235, 106, 98, 102, 239,
    79, 27, 40, 52, 77, 68, 9, 160, 212, 29, 196,
    61, 106, 177, 215, 5, 163, 230, 86, 129, 13, 25,
    189, 255, 167, 191, 235, 64, 68, 235, 194, 9, 235,
    204, 139, 224, 97, 62, 22, 18, 165, 86
  ]);
  return await getOrCreateMockAccount(secretKey, connection, payer);
}

export const getAttRecipientAcc = getMockAccount1;
export const getFeeRecipientAcc = getMockAccount2;