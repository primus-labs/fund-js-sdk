import { serialize, deserialize } from 'borsh';

class Attestor {
  attestorAddr: Uint8Array;
  url: string;

  constructor(fields: { attestorAddr: Uint8Array; url: string }) {
    this.attestorAddr = fields.attestorAddr;
    this.url = fields.url;
  }
}

class AttNetworkRequest {
  url: string;
  header: string;
  method: string;
  body: string;

  constructor(fields: { url: string; header: string; method: string; body: string }) {
    this.url = fields.url;
    this.header = fields.header;
    this.method = fields.method;
    this.body = fields.body;
  }
}

class AttNetworkResponseResolve {
  keyName: string;
  parseType: string;
  parsePath: string;

  constructor(fields: { keyName: string; parseType: string; parsePath: string }) {
    this.keyName = fields.keyName;
    this.parseType = fields.parseType;
    this.parsePath = fields.parsePath;
  }
}

class Attestation {
  recipient: Uint8Array;
  request: AttNetworkRequest;
  responseResolve: AttNetworkResponseResolve[];
  data: string;
  attConditions: string;
  timestamp: bigint;
  additionParams: string;
  attestors: Attestor[];
  signatures: Uint8Array[];

  constructor(fields: {
    recipient: Uint8Array;
    request: AttNetworkRequest;
    responseResolve: AttNetworkResponseResolve[];
    data: string;
    attConditions: string;
    timestamp: bigint;
    additionParams: string;
    attestors: Attestor[];
    signatures: Uint8Array[];
  }) {
    this.recipient = fields.recipient;
    this.request = new AttNetworkRequest(fields.request);
    this.responseResolve = fields.responseResolve.map(x => new AttNetworkResponseResolve(x));
    this.data = fields.data;
    this.attConditions = fields.attConditions;
    this.timestamp = fields.timestamp;
    this.additionParams = fields.additionParams;
    this.attestors = fields.attestors.map(x => new Attestor(x));
    this.signatures = fields.signatures;
  }
}

const schema = new Map<any, any>([
  [Attestor, {
    kind: 'struct',
    fields: [
      ['attestorAddr', [20]],
      ['url', 'string'],
    ] as const,
  }],
  [AttNetworkRequest, {
    kind: 'struct',
    fields: [
      ['url', 'string'],
      ['header', 'string'],
      ['method', 'string'],
      ['body', 'string'],
    ] as const,
  }],
  [AttNetworkResponseResolve, {
    kind: 'struct',
    fields: [
      ['keyName', 'string'],
      ['parseType', 'string'],
      ['parsePath', 'string'],
    ] as const,
  }],
  [Attestation, {
    kind: 'struct',
    fields: [
      ['recipient', [32]],
      ['request', AttNetworkRequest],
      ['responseResolve', [AttNetworkResponseResolve]],
      ['data', 'string'],
      ['attConditions', 'string'],
      ['timestamp', 'u64'],
      ['additionParams', 'string'],
      ['attestors', [Attestor]],
      ['signatures', [['u8']]],
    ] as const,
  }],
]);

function normalizeAttestationInput(obj: any): Attestation {
  return new Attestation({
    ...obj,
    request: new AttNetworkRequest(obj.request),
    responseResolve: obj.responseResolve.map((x: any) => new AttNetworkResponseResolve(x)),
    attestors: obj.attestors.map((x: any) => new Attestor(x)),
  });
}

export function serializeAttestation(attObj: any): Uint8Array {
  const borshObj = normalizeAttestationInput(attObj)
  console.log('attObj', attObj,'serializeAttestation-borshObj',borshObj)
  const buffer = serialize(schema, borshObj);
  return buffer;
}