<script>
    import MetaButton from '../../components/metamask_button.svelte';
    import MetaInstall from '../../components/metamask_install.svelte';
    import {onMount} from "svelte";
    import {ethereum, web3, selectedAccount, whenReady} from 'svelte-web3';

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
        $web3.eth
                .getAccounts()
                .then(console.log);
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
                    </ul>
                </div>
            </div>
        </div>
    </div>
</section>