<script>
    import Icon from 'fa-svelte';
    import {ethereum, web3, selectedAccount, whenReady} from 'svelte-web3';
    import Transaction from '../../components/transaction.svelte';
    import {onMount} from "svelte";
    import  api from '../../api';
    import {wallet, metamask} from '../../store';
    import {faArrowRight, faArrowLeft} from '@fortawesome/free-solid-svg-icons';
    import { createEventDispatcher } from 'svelte';

    let transactions = [];


    onMount(() => {
        api.generic.transactions($metamask ? $selectedAccount : $web3.eth.accounts.privateKeyToAccount($wallet).address).then(response => response.data).then(result => {
            transactions = result.result;
        });
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
        {#each transactions as transaction, i}
            <Transaction transaction="{transaction}" bg="{i % 2}" />
        {/each}
    </div>
</section>