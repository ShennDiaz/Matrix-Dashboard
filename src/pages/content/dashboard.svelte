<script>
    import Icon from 'fa-svelte';
    import {ethereum, web3, selectedAccount, whenReady} from 'svelte-web3';
    import {onMount} from "svelte";
    import {faArrowRight, faArrowLeft} from '@fortawesome/free-solid-svg-icons';
    import { createEventDispatcher } from 'svelte';

    $: balance = whenReady($selectedAccount, a => $web3.eth.getBalance(a));

    const dispatch = createEventDispatcher();
    export let address;

    async function balanceFire() {
        dispatch('message', {
            text: await balance
        });
    }

    async function initClient() {
        try {
            await ethereum.setBrowserProvider();
            balanceFire();
        } catch (e) {}
    }

    onMount(() => {
        initClient();
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
                                <p style="font-size: 15px; margin:0px;">1 ETH = 235 USD</p>
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
                                <p style="font-size: 15px;">SENDING ADDRESS</p>
                                <div class="text-truncate" style="margin-top: -10px; font-size: 15px;">
                                    {$selectedAccount}
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
                                    <p style="font-size: 15px;">AMOUNT</p>
                                    <div style="margin-top: -10px; font-size: 15px;">
                                        0.00000000 <strong>ETH</strong>
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
                                    <a style="color: #06ceab; font-size: 25px;">
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
                                <h4>ETHEREUM</h4>
                            </div>
                            <div class="card-body">
                                <p style="font-size: 15px; margin:0px;">1 ETH = 100000 MTX</p>
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
                                <p style="font-size: 15px;">RECEIVER ADDRESS</p>
                                <div class="text-truncate" style="margin-top: -10px; font-size: 15px;">
                                    {$selectedAccount}
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
                                    <p style="font-size: 15px;">AMOUNT</p>
                                    <div style="margin-top: -10px; font-size: 15px;">
                                        0.00000000 <strong>MTX</strong>
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
                                    0.00000000 ETH</p>
                            </div>
                        </div>
                        <!--img--->
                        <img src="./assets/img/etc.svg" style="height: 85px; margin: 5px auto; float: right;">
                    </div>
                </div>
            </div>
            <!--col 2--->
            <div class="col-lg-2 col-md-5 col-sm-5 col-12" align="center" style="margin: 30px auto;">
                <a style="color: #9e9e9e; font-size: 30px; font-weight: lighter" class=""
                   data-toggle="sidebar">
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
                                    0.00000000 MTX</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <!--end col 3--->
        </div>
        <!--end row 2--->
        <div class="col-lg-3 col-md-3 col-sm-3 col-12 text-center mt-5" style="margin: 0 auto;">
            <div class="card">
                <!--margin color--->
                <div class="card-wrap">
                    <!--info--->
                    <div class="card-body">
                        <div class="col">
                            <img src="./assets/img/cha-img3.svg" style="width: 150px; margin-bottom:20px; cursor: pointer;">
                            <hr class="mt-3 mb-3"/>
                            <div class="form-check form-check-inline mt-3">
                                <input class="form-check-input" type="checkbox" id="agree_exchange" value="option1">
                                <label class="form-check-label" for="agree_exchange">I agree to exchange coins</label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>