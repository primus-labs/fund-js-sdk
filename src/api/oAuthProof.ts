import request from '../utils/request';

export interface Response {
  rc: number;
  mc: string;
  msg: string;
  result: any;
}

type GETAUTHATTESTATIONParams = {
  state: string;
  address: string;
};

export const getAuthAttestation = (data: GETAUTHATTESTATIONParams):Promise<Response> => {
  return request({
    method: 'get',
    url: `/public/tips/oauth/attestation`,
    data,
  });
};