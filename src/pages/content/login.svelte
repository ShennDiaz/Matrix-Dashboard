<script>
    import MetaButton from '../../components/metamask_button.svelte';
    import MetaInstall from '../../components/metamask_install.svelte';
    import Modal from '../../components/confirm_account.svelte';
    import {onMount} from "svelte";
    import {replace} from 'svelte-spa-router';
    import {wallet, user, metamask, jwt, error} from '../../store';
    import api from '../../api';
    import {ethereum, selectedAccount, web3, providerType} from 'svelte-web3';

    const metamaskConnect = () => ethereum.setBrowserProvider()
    const infuraConnect = () => ethereum.setProvider('https://mainnet.infura.io/v3/b2e24b5841304756bc426b764be4988e');

    user.subscribe(() => error.set(''));

    let hasClient = false;
    let showCreate = false;
    let metaMask = false;
    let enabled = true;
    let address = '';
    let privateKey = '';

    $: if ($providerType === 'Browser') {
        address = $selectedAccount;
        privateKey = ' ';
    }

    let state = {
        LOGIN: 'LOGIN',
        CREATE: 'CREATE',
        KEY: 'KEY'
    };
    let currentState = state.LOGIN;

    let formComplete = false;
    $: if ($user.name !== '' && $user.password !== '') {
        formComplete = true;
    }

    function setView(state) {
        currentState = state;
    }

    async function createWallet() {
        setView(state.CREATE);
        if (!metaMask) {
            let wallet = $web3.eth.accounts.create();
            address = wallet.address;
            privateKey = wallet.privateKey;
        }
    }

    function loginAccount() {
        api.user.credentials({
            name: $user.name,
            password: $user.password
        }).then(response => response.data).then(result => {
            jwt.set(result['token']);
            getUser();
        }).catch(err => error.set('Invalid credentials'))
    }

    function createAccount() {
        api.user.create({
            email: $user.name, password: $user.password, wallet: {
                private: metaMask ? 'metamask' : privateKey,
                address: address
            }
        }).then(_ => loginAccount()).catch(err => error.set('User with same email exist'))
    }

    function createFromPrivateKey() {
        let temp = privateKey.replace(/\s/g, '');
        return $web3.eth.accounts.privateKeyToAccount(temp.startsWith('0x') ? temp : '0x'.concat(temp));
    }

    function hasAccount() {
        return new Promise(resolve => {
            api.user.address({
                address: address,
            }).then(response => {
                jwt.set(response.data['token']);
                resolve(true);
            }).catch(_ => resolve(false));
        })
    }

    function getUser() {
        api.user.get().then(response => response.data).then(response => {
            address = response.wallet.address;
            privateKey = response.wallet.private;
            if (privateKey === 'metamask') {
                metaMask = true;
                if ($providerType !== 'Browser')
                    throw new Error('Please install Metamask or any web3 browser provider');
            }
            confirm();
        }).catch(err => error.set(err));
    }

    function confirm() {
        metamask.set(metaMask);
        wallet.set(privateKey);
        document.getElementById('lunchModal').click();
    }

    async function start() {
        switch (currentState) {
            case "LOGIN":
                if (formComplete) {
                    metaMask = false;
                    loginAccount();
                }
                break;
            case "KEY":
                let wallet = createFromPrivateKey();
                privateKey = wallet.privateKey;
                address = wallet.address;
                metaMask = false;
                if (await hasAccount()) confirm();
                else {
                    showCreate = true;
                    await createWallet();
                }
                break;
            case "CREATE":
                if (formComplete) createAccount();
                break;
        }
    }

    async function handleMessage(event) {
        switch (event.detail.text) {
            case
            'login'
            :
                address = $selectedAccount;
                privateKey = ' ';
                metaMask = true;
                if (!await hasAccount()) {
                    showCreate = true;
                    await createWallet();
                } else confirm();

                break;
            case
            'continue'
            :
                replace('/dashboard');
                break;
        }
    }

    onMount(async () => {
        await infuraConnect();
        await metamaskConnect();
    });


</script>

<section class="section h-100" style="">
    <!--menu--->

    <!--end menu--->
    <div class="section-body" style="padding-right: 30px; padding-left: 30px">
        <div class="col-lg-3 col-md-3 col-sm-3 col-12 text-center"
             style="margin: {currentState === state.CREATE ? '10%' : '10%'} auto;">
            <div class="card">
                <ul class="list-group list-group-flush">
                    <li class="list-group-item">
                        <div class="col">
                            <h3 style="font-weight: 600; color: #37474F; text-align: start;">Welcome</h3>
                            <h4 style="font-weight: 400; color: #37474F; text-align: start;">Sign in to Matrix
                                Wallet</h4>
                        </div>
                    </li>
                    <li class="list-group-item">
                        <p style="text-align: start; margin-left: 15px;">In order to access, you need to have a web3
                            provider installed, such as Metamask or MEW wallet in your browser</p>
                    </li>
                    <li class="list-group-item">
                        <form>
                            {#if $error}
                                <div class="alert alert-danger alert-dismissible show fade">
                                    <div class="alert-body">
                                        {$error}
                                    </div>
                                </div>
                            {/if}
                            {#if currentState === state.LOGIN}
                                <div class="form-group mb-2">
                                    <input bind:value={$user.name} type="email" class="form-control"
                                           aria-describedby="emailHelp"
                                           placeholder="Enter email">
                                </div>
                                <div class="form-group">
                                    <input bind:value={$user.password} type="password" class="form-control"
                                           placeholder="Enter password">
                                </div>
                            {:else if currentState === state.KEY}
                                <div class="form-group mb-2">
                                    <label for="keyp">Private key</label>
                                    <input bind:value={privateKey} id="keyp" type="text" class="form-control"
                                           aria-describedby="emailHelp"
                                           placeholder="Enter private key">
                                </div>
                            {:else}
                                {#if showCreate}
                                    <p>Please, set email and password for protect your account</p>
                                {/if}
                                <div class="form-group mb-2">
                                    <input bind:value={$user.name} type="email" class="form-control"
                                           aria-describedby="emailHelp"
                                           placeholder="Enter email">
                                </div>
                                <div class="form-group mb-2">
                                    <input bind:value={$user.password} type="password" class="form-control"
                                           placeholder="Enter password">
                                </div>
                                <div class="form-group mb-2">
                                    <label for="publicKey">Address</label>
                                    <input id="publicKey" bind:value={address} type="text" class="form-control"
                                           placeholder="Address">
                                </div>
                                <!--{#if !showCreate}
                                    <div class="form-group mb-3">
                                        <label for="pKey">Private key</label>
                                        <input bind:value={privateKey} type="text" class="form-control"
                                               id="pKey" placeholder="Private key">
                                    </div>
                                    <p>Keep the private key in a safe place</p>
                                {/if} -->
                            {/if}
                            <div on:click={start} class="form-group">
                                <div style="border-radius: .2rem; height: 43px; cursor: pointer; background-color: #212121;">
                                    <p class="pt-2" style="font-weight: 500; color: white; font-size: 15px;">Enter</p>
                                </div>
                            </div>
                            <p style="margin-bottom: -5px; margin-top: -15px !important;" class="mt-3">
                                {#if currentState !== state.LOGIN}
                                    <strong on:click={_ => setView(currentState = state.LOGIN)}
                                            style="cursor: pointer;">
                                        Login with credentials</strong>
                                    <!-- <strong on:click={_ => setView(currentState === state.LOGIN ? state.KEY : state.LOGIN)}
                                           style="cursor: pointer;">{currentState === state.LOGIN ? 'Private key' : 'credentials'}</strong> --->
                                {:else}
                                    <strong on:click={_ => createWallet()} class="pb-2" style="cursor: pointer;">
                                        Create new account</strong>
                                {/if}
                            </p>
                        </form>
                    </li>
                    <!-- <li class="list-group-item">
                        {#if $providerType === 'Browser'}
                            <MetaButton on:message={handleMessage}/>
                        {:else}
                            <MetaInstall/>
                        {/if}
                    </li> -->
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
</section>
<Modal address="{address}" on:message={handleMessage}/>