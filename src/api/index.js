import axios from 'axios';
import {get} from 'svelte/store';
import {jwt} from '../store';

const API = axios.create({
    withCredentials: false,
    baseURL: 'https://api.mymatrixcoin.com/api/v1/account/',
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        Authorization: {
            toString() {
                return `Bearer ${get(jwt)}`
            }
        }


    }
});

const user = {
    create: user => API.post('create', user),
    address: address => API.post('address', address),
    credentials: credentials => API.post('login', credentials),
    get: _ => API.get(''),
    mail: _ => API.get('buy')
};

const generic = {
    usd: _ => axios.get('https://api.coincap.io/v2/assets/ethereum'),
    gwei: _ => axios.get('https://ethgasstation.info/json/ethgasAPI.json'),
    transactions: address => axios.get(`https://api-ropsten.etherscan.io/api?module=account&action=tokentx&address=${address}&startblock=0&contractaddress=0xA129c25991C138F0b60B34236dc098a3353Baa10&endblock=99999999&sort=asc&apikey=EYJEJPR2Y1IKJTWWU4EIMC57IDEDTT21Q7`)
};

export default {
    generic,
    user
}
