<script>
    import { faArrowDown } from '@fortawesome/free-solid-svg-icons';
    import Icon from 'fa-svelte';
    export let bg;
    export let transaction;

    function openEtherscan(hash) {
        window.open(`https://ropsten.etherscan.io/tx/${hash}`,'_blank');
    }
</script>

<div class="container-fluid {bg ? 'bg-white' : ''} pt-3 pb-3" style="border-radius: 10px; display: flex; align-items: center;">
    <div class="row w-100">
        <div class="col-lg-2 col-md-1 col-sm-1 col-12">
            <div>
                <p style="font-size: 16px; color: black; font-weight: 600" class="pb-0 mb-0 mt-1">Tx Hash</p>
                <p class="pb-0 mb-0">{transaction.hash.substring(0, 20)}...</p>
            </div>
        </div>
        <div class="col-lg-2 col-md-1 col-sm-1 col-12">
            <div>
                <p style="font-size: 16px; color: black; font-weight: 600" class="pb-0 mb-0 mt-1">Block</p>
                <p class="pb-0 mb-0">{transaction.blockNumber}</p>
            </div>
        </div>
        <div class="col-lg-2 col-md-1 col-sm-1 col-12">
            <div>
                <p style="font-size: 16px; color: black; font-weight: 600" class="pb-0 mb-0 mt-1">Date</p>
                <p class="pb-0 mb-0">{new Date(parseInt(transaction.timeStamp)*1000).toDateString()}</p>
            </div>
        </div>
        <div class="col-lg-2 col-md-1 col-sm-1 col-12">
            <div>
                <p style="font-size: 16px; color: black; font-weight: 600" class="pb-0 mb-0 mt-1">Token</p>
                <p class="pb-0 mb-0">{transaction.tokenName}</p>
            </div>
        </div>
        <div class="col-lg-2 col-md-1 col-sm-1 col-12">
            <div>
                <p style="font-size: 16px; color: black; font-weight: 600" class="pb-0 mb-0 mt-1">Amount</p>
                <p class="pb-0 mb-0">{(parseFloat(transaction.value) / 1e18).toFixed(2)}</p>
            </div>
        </div>
        <div class="col-lg-1 col-md-1 col-sm-1 col-12" style="display: flex; align-items: center;">
            <button on:click={_ => openEtherscan(transaction.hash)} type="button" class="btn btn-primary">
                Explorer
            </button>
        </div>
    </div>
</div>