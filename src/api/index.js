import axios from 'axios';
import {get} from 'svelte/store';
import {jwt} from '../store';

const API = axios.create({
    withCredentials: false,
    baseURL: 'http://localhost:8080/api/v1/account/',
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
    mail: _ => API.get('buy'),
    clabe: body => API.post('deposit', body),
    reset: user => API.post('password', user),
    resetPasswordStart: user => API.post('reset', user),
    verifyCode: user => API.post('validateCode', user)
};

const generic = {
    coin: _ => axios.get('https://api.coincap.io/v2/assets/ethereum'),
    usd: _ => axios.get('https://api.exchangeratesapi.io/latest?base=USD'),
    gwei: _ => axios.get('https://ethgasstation.info/json/ethgasAPI.json'),
    transactions: address => axios.get(`https://api.etherscan.io/api?module=account&action=tokentx&address=${address}&startblock=0&contractaddress=0x1E511e12e8D0135dFC3fC9AfABA0E33696c8683D&endblock=99999999&sort=asc&apikey=EYJEJPR2Y1IKJTWWU4EIMC57IDEDTT21Q7`)
};

export default {
    generic,
    user
}
