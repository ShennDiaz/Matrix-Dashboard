<script>
    import Icon from 'fa-svelte';
    import Dialog from '../../components/dialog.svelte';
    import Success from '../../components/sucess.svelte';
    import Error from '../../components/error.svelte';
    import api from '../../api'
    import {ethereum, web3, selectedAccount, whenReady, providerType} from 'svelte-web3';
    import {onMount} from "svelte";
    import {faArrowRight, faArrowLeft, faPencilAlt, faSortUp} from '@fortawesome/free-solid-svg-icons';
    import {createEventDispatcher} from 'svelte';
    import {metamask, wallet} from '../../store';

    import * as Matrix from "../../contracts/Matrix.json";
    import * as GenericCrowdsale from "../../contracts/Crowdsale.json";

    let ethPrice = '0.0';
    let editReceiver = false;
    let mtxTokens = 0.0;

    let addrReceiver;
    let addrBase = $selectedAccount;

    $: if ($providerType === 'Browser') {
        addrBase = $selectedAccount;
    }

    let accept = true;
    let showAccept = false;

    // token
    let rate = 0;
    let amount = 0;
    let symbol;
    let left;
    let decimals;
    let balanceMAT = 0;

    let crowdsale;
    let token;

    $: balance = whenReady(addrBase, a => $web3.eth.getBalance(a));
    $: amountETH = mtxTokens / rate;

    const CROWDSALE = '0x3153358dcc0eE53C732aEb94ad9A856357245715';


    const dispatch = createEventDispatcher();

    function balanceFire() {
        dispatch('message', {
            text: balanceMAT
        });
    }

    async function getTokenBalance() {
        return (await token.methods.balanceOf(addrBase).call()) / 1e18;
    }

    async function getTokenRate() {
        return await crowdsale.methods.rate().call();
    }

    async function getTokenSymbol() {
        return await token.methods.symbol().call();
    }

    async function getTokenDecimals() {
        return await token.methods.decimals().call();
    }

    async function getCrowdSaleBalance() {
        return (await token.methods.balanceOf(CROWDSALE).call()) / 1e18;
    }

    function buy(ev) {
        ev.preventDefault();
        if (accept) {
            if (mtxTokens > 0) document.getElementById('lunchDialog').click();
        } else showAccept = true;
    }

    function onChange() {
        showAccept = false;
    }

    async function withMetamask() {
        await ethereum.setBrowserProvider();
        addrReceiver = addrBase;
        crowdsale = new $web3.eth.Contract(GenericCrowdsale.abi, CROWDSALE);
        return new Promise(resolve => {
            crowdsale.methods
                    .token()
                    .call()
                    .then(item => {
                        token = new $web3.eth.Contract(Matrix.abi, item);
                        resolve();
                    });
        });
    }

    async function withProvider() {
        let account = $web3.eth.accounts.privateKeyToAccount($wallet);
        await ethereum.setProvider('https://ropsten.infura.io/v3/b2e24b5841304756bc426b764be4988e');
        addrReceiver = account.address;
        addrBase = account.address;
        crowdsale = new $web3.eth.Contract(GenericCrowdsale.abi, CROWDSALE);
        return new Promise(resolve => {
            crowdsale.methods
                    .token()
                    .call()
                    .then(item => {
                        token = new $web3.eth.Contract(Matrix.abi, item);
                        resolve();
                    });
        });
    }

    async function initClient() {
        try {
            if ($metamask)
                return withMetamask()
            else return withProvider();
        } catch (e) {
        }
    }

    function getETHPrice() {
        api.generic.usd().then(result => result.data)
                .then(result => result.data)
                .then(result => {
                    ethPrice = parseFloat(result.priceUsd).toFixed(3);
                });
    }

    function setNewAddress() {
        editReceiver = false;
    }

    function buyMetamask() {
        let temp = $web3.utils.toWei((mtxTokens / rate).toPrecision(8), "ether");
        let amountSent = $web3.utils.toBN(temp);
        let dec = $web3.utils.toBN(decimals);
        const sent = amountSent.mul($web3.utils.toBN(10).pow(dec));
        crowdsale.methods
                .buyTokens(addrBase)
                .send({
                    value: $web3.utils.fromWei(sent, "ether"),
                    from: addrBase
                })
                .then(_ => {
                    api.user.mail();
                    document.getElementById('lunchSuccess').click();
                })
                .catch(console.log);
    }

    async function buyProvider() {
        let temp = $web3.utils.toWei((mtxTokens / rate).toPrecision(8), "ether");
        let amountSent = $web3.utils.toBN(temp);
        let dec = $web3.utils.toBN(decimals);
        const sent = amountSent.mul($web3.utils.toBN(10).pow(dec));

        //let data = contract.methods.splitFunds(to).encodeABI();
        let data = crowdsale.methods
                .buyTokens(addrBase).encodeABI();
        let block = await $web3.eth.getBlock('latest');
        let nonce = await $web3.eth.getTransactionCount(addrBase, 'pending');
        let gwei = (await api.generic.gwei()).data.fast;
        const gasPrice = gwei * 1e9;
        const tx = {
            from: addrBase,
            to: CROWDSALE,
            gasLimit: block.gasLimit,
            gasPrice: gasPrice,
            nonce: nonce,
            value: $web3.utils.fromWei(sent, "ether"),
            data: data
        };

        const signPromise = $web3.eth.accounts.signTransaction(tx, $wallet);
        signPromise.then((signedTx) => {
            const sentTx = $web3.eth.sendSignedTransaction(signedTx.rawTransaction);
            sentTx.on('confirmation', (confirmationNumber, receipt) => {
                console.log('confirmation: ' + confirmationNumber);
            });

            sentTx.on('transactionHash', hash => {
                document.getElementById('lunchSuccess').click();
                console.log('hash');
                console.log(hash);
                api.user.mail();
            });

            sentTx.on('receipt', receipt => {
                console.log('reciept');
                console.log(receipt);
            });

            sentTx.on('error', _ => {
                document.getElementById('lunchError').click();
            });

        }).catch((err) => {
            document.getElementById('lunchError').click();
        });
    }

    function acceptExchange(event) {
        let result = event.detail.text;
        switch (result) {
            case 'accept':
                if($metamask) buyMetamask();
                else buyProvider();
                break;
        }
    }

    onMount(async () => {
        getETHPrice();
        await initClient();
        rate = await getTokenRate();
        symbol = await getTokenSymbol();
        left = await getCrowdSaleBalance();
        decimals = await getTokenDecimals();
        balanceMAT = await getTokenBalance();
        await balanceFire();
    });
</script>

<style>
    .vertical {
        border-left: 1px solid #e1e1e1;
        height: 100%;
        position: absolute;
        left: 50%;
    }
</style>
<section class="section">
    <!--menu--->

    <!--end menu--->
    <div class="section-body" style="padding-right: 30px; padding-left: 30px">
        <div class="row">
            <!--col 1--->
            <div class="col-lg-5 col-md-5 col-sm-5 col-12">
                <!--1.1--->
                <div class="card card-statistic-1">
                    <!--margin color--->
                    <div class="row" style="padding: 15px;">
                        <!--img--->
                        <div class="">
                            <img src="./assets/img/etc.svg" class="mt-2"
                                 style="height:50px; margin-right:0; margin-left:10px;">
                        </div>
                        <!--info--->
                        <div class="card-wrap">
                            <div class="card-header">
                                <h4>ETHEREUM</h4>
                            </div>
                            <div class="card-body">
                                <p style="font-size: 15px; margin:0;">1 ETH = {ethPrice} USD</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <!--margin color--->
                    <div class="flex-nowrap" style="">
                        <div class="card-wrap">
                            <!--info--->
                            <div class="card-body">
                                <p style="font-size: 16px; color: #424242;">SENDING ADDRESS</p>
                                <div class="text-truncate" style="margin-top: -10px; font-size: 15px;">
                                    {addrBase}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!--1.2--->
                <div class="card">
                    <!--margin color--->
                    <div class="row" style="">
                        <div class="card-wrap">
                            <!--info--->
                            <div class="card-body">
                                <div class="col">
                                    <p style="font-size: 16px; color: #424242;">BALANCE</p>
                                    <div style="margin-top: -10px; font-size: 15px;">
                                        {#await balance} {:then value} {(value / 1e18).toFixed(8)}
                                            <strong>&nbsp;ETH</strong> {/await}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <!--col 2--->
            <div class="col-lg-2 col-md-5 col-sm-5 col-12 d-none d-lg-block">
                <!--1.1--->
                <div class="">
                    <div class="vertical-divider">
                        <div class="center-element d-flex justify-content-around">
                            <div class="text-center" id="circle">
                                <div class="col-lg-10 mt-2" style="margin-left: 10px;">
                                    <a style="color: #76d275; font-size: 25px;">
                                        <Icon icon={faArrowRight}>
                                        </Icon>
                                    </a>
                                    <a style="color: #9e9e9e; font-size: 25px;">
                                        <Icon icon={faArrowLeft}>
                                        </Icon>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!--col 3--->
            <div class="col-lg-5 col-md-5 col-sm-5 col-12">
                <!--3.1--->
                <div class="card card-statistic-1">
                    <!--margin color--->
                    <div class="row" style="padding: 15px;">
                        <!--img--->
                        <div class="">
                            <img src="./assets/img/mtx.svg" class="mt-2"
                                 style="height:50px; margin-right:0; margin-left:10px;">
                        </div>
                        <!--info--->
                        <div class="card-wrap">
                            <div class="card-header">
                                <h4>MATRIX COIN</h4>
                            </div>
                            <div class="card-body">
                                <p style="font-size: 15px; margin:0px;">1 MTX = 0.011 USD</p>
                            </div>
                        </div>
                    </div>
                </div>
                <!--3.2--->
                <div class="card">
                    <!--margin color--->
                    <div class="flex-nowrap" style="">
                        <div class="card-wrap">
                            <!--info--->
                            <div class="card-body">
                                <p style="font-size: 16px; color: #424242;">RECEIVER ADDRESS</p>
                                <div class="text-truncate" style="margin-top: -10px; font-size: 15px;">
                                    <div class="row ml-0">
                                        {#if !editReceiver}
                                            {addrReceiver}
                                            <div on:click={_ => editReceiver = true}
                                                 style="cursor: pointer; font-size: 12px; margin-left: 10px;">
                                                <Icon icon={faPencilAlt}>
                                                </Icon>
                                            </div>
                                        {:else}
                                            <div class="col-7" style="margin-left: -15px;">
                                                <input bind:value={addrReceiver} type="text" class="form-control"
                                                       placeholder="Enter receiver address">
                                            </div>
                                            <div class="col-3">
                                                <div style="cursor: pointer;" on:click={setNewAddress}>
                                                    <p class="pt-2"
                                                       style="font-weight: 500; color: black; font-size: 15px;">
                                                        Accept</p>
                                                </div>
                                            </div>
                                        {/if}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <!--3.3--->
                <div class="card">
                    <!--margin color--->
                    <div class="row" style="">
                        <div class="card-wrap">
                            <!--info--->
                            <div class="card-body">
                                <div class="col">
                                    <p style="font-size: 16px; color: #424242;">BALANCE</p>
                                    <div style="margin-top: -10px; font-size: 15px;">
                                        {balanceMAT.toFixed(3)} <strong>MTX</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!--end row 2--->
        <div class="row" style="background-color:#fff; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.03);">
            <!--col 1--->
            <div class="col-lg-5 col-md-5 col-sm-5 col-12">
                <div class="card card-statistic-1" style="
                                            box-shadow: none;
                                            background-color: transparent;
                                            border-radius: 0;
                                            border-color: transparent;
                                            position: relative;
                                            margin-bottom: 0;">
                    <div class="card" style="flex-direction: row; float: right;
                                            box-shadow: none;
                                            background-color: transparent;
                                            border-radius: 0;
                                            border-color: transparent;
                                            position: relative;
                                            margin-bottom: 0;">
                        <!--info--->
                        <div class="card-wrap" style="margin-top: 10px;">
                            <div class="card-header pr-0" style="text-align: right;">
                                <h4>YOU ARE EXCHANGING</h4>
                            </div>
                            <div class="card-body" style="text-align: right;">
                                <p style="font-size: 18px; color: #797979; font-weight: 400 !important;">
                                    {Number.isNaN(parseFloat(amountETH)) ? 0 : parseFloat(amountETH).toFixed(8)} ETH</p>
                            </div>
                        </div>
                        <!--img--->
                        <img src="./assets/img/etc.svg" style="height: 85px; margin: 5px auto; float: right;">
                    </div>
                </div>
            </div>
            <!--col 2--->
            <div class="col-lg-2 col-md-5 col-sm-5 col-12" align="center" style="margin: 30px auto;">
                <a style="color: #9e9e9e; font-size: 30px; font-weight: lighter">
                    <Icon icon={faArrowRight}>
                    </Icon>
                </a>
            </div>
            <!--col 3--->
            <div class="col-lg-5 col-md-5 col-sm-5 col-12">
                <div class="card card-statistic-1" style="
                                            box-shadow: none;
                                            background-color: transparent;
                                            border-radius: 0;
                                            border-color: transparent;
                                            position: relative;
                                            margin-bottom: 0;">
                    <div class="card" style="flex-direction: row; float: left;
                                            box-shadow: none;
                                            background-color: transparent;
                                            border-radius: 0;
                                            border-color: transparent;
                                            position: relative;
                                            margin-bottom: 0;">
                        <!--img--->
                        <div class="">
                            <img src="./assets/img/mtx.svg" style="height:100px; margin-right:0; margin-left:10px;">
                        </div>
                        <!--info--->
                        <div class="card-wrap" style="margin-top: 10px;">
                            <div class="card-header">
                                <h4>YOU WILL RECEIVE</h4>
                            </div>
                            <div class="card-body">
                                <p style="font-size: 18px; margin:0; color: #797979; font-weight: 400 !important;">
                                    {mtxTokens === undefined ? 0 : mtxTokens} MTX</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!--end col 3--->
        </div>
        <!--end row 2--->
        <div class="col-lg-3 col-md-3 col-sm-3 col-12 text-center mt-3" style="margin: 0 auto;">
            <div class="card">
                <!--margin color--->
                <div class="card-wrap">
                    <!--info--->
                    <div class="card-body">
                        <div class="col">
                            <div class="form-check mt-3 pl-0">
                                <input id="mat" bind:value={mtxTokens} type="number" class="form-control"
                                       placeholder="Enter number of tokens to buy">
                                <div class="form-check form-check-inline mt-3">
                                    <input on:change={onChange} bind:checked={accept} class="form-check-input"
                                           type="checkbox"
                                           id="agree_exchange">
                                    <label class="form-check-label" for="agree_exchange">I agree to exchange
                                        coins</label>
                                </div>
                                {#if showAccept}
                                    <p style="color: #f44336;">Please accept check</p>
                                {/if}
                            </div>
                            <hr class="mt-2"/>
                            <img on:click={buy} class="ml-4 mt-2" src="./assets/img/cha-img3.svg"
                                 style="width: 150px; margin-bottom:20px; cursor: pointer;">
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>
<button id="lunchDialog" type="button" class="invisible" data-toggle="modal"
        data-target="#exampleModalCenter"></button>
<Dialog on:message={acceptExchange} eth="{parseFloat(amountETH).toFixed(8)}" mtx="{mtxTokens}"/>
<button id="lunchSuccess" type="button" class="invisible" data-toggle="modal"
        data-target="#successModal"></button>
<Success on:message={acceptExchange} />
<button id="lunchError" type="button" class="invisible" data-toggle="modal"
        data-target="#errorModal"></button>
<Error on:message={acceptExchange} />