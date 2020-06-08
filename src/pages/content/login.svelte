<script>
    import MetaButton from '../../components/metamask_button.svelte';
    import MetaInstall from '../../components/metamask_install.svelte';
    import Modal from '../../components/confirm_account.svelte';
    import {onMount} from "svelte";
    import {replace} from 'svelte-spa-router';
    import {wallet} from '../../store';
    import {ethereum, selectedAccount} from 'svelte-web3';

    let hasClient = false;

    async function initClient() {
        try {
            await ethereum.setBrowserProvider();
            hasClient = true;
        } catch (e) {
            hasClient = false;
        }
    }

    async function handleMessage(event) {
        switch (event.detail.text) {
            case
            'login'
            :
                document.getElementById('lunchModal').click();
                break;
            case
            'continue'
            :
                wallet.set($selectedAccount);
                replace('/dashboard');
                break;
        }
    }

    onMount(() => {
        initClient();
    });


</script>


<section class="section h-100" style="background-color: white">
    <!--menu--->

    <!--end menu--->
    <div class="section-body" style="padding-right: 30px; padding-left: 30px">
        <div class="row">
            <div class="col-lg-3 col-md-3 col-sm-3 col-12 text-center mt-5" style="margin: 0 auto;">
                <div class="">
                    <img style="width: 50%; height: 50%" src="./assets/img/login_01.jpg">
                </div>
            </div>
            <div class="col-lg-3 col-md-3 col-sm-3 col-12 text-center mt-5" style="margin: 0 auto;">
                <div class="card">
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item">
                            <div class="col">
                                <h3 style="font-weight: 600; color: #262626; text-align: start;">Welcome</h3>
                                <h4 style="font-weight: 400; color: #262626; text-align: start;">Sign in to Matrix
                                    Wallet</h4>
                            </div>
                        </li>
                        <li class="list-group-item">
                            <p style="text-align: start; margin-left: 15px;">In order to access, you need to have a web3
                                provider installed, such as Metamask or MEW wallet in your browser</p>
                        </li>
                        <li class="list-group-item">
                            {#if hasClient}
                                <MetaButton on:message={handleMessage}/>
                            {:else}
                                <MetaInstall/>
                            {/if}
                        </li>
                        <li class="list-group-item">
                            <p style="text-align: center; font-size: 12px; margin-top: 20px; margin-bottom: -10px;">We
                                do not keep any personal data</p>
                            <button id="lunchModal" type="button" class="invisible" data-toggle="modal"
                                    data-target="#exampleModalCenter"></button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</section>
<Modal address="{$selectedAccount}" on:message={handleMessage} />