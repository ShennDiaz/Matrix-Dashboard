<script>
    import Dashboard from './content/dashboard.svelte';
    import Password from './content/update_password.svelte';
    import Admin from './content/admin.svelte';
    import History from './content/history.svelte';
    import QR from '../components/qr_modal.svelte';
    import Icon from 'fa-svelte';
    import {web3} from 'svelte-web3';
    import {user, wallet} from '../store'
    import {faBars, faQrcode } from '@fortawesome/free-solid-svg-icons';
    import {onMount,onDestroy} from "svelte";
    
    let balance = 0.0;

    let mobile = false;
    let account;

    $: if (findBootstrapEnvironment() === 'xs') {
        mobile = true;
    }

    const VIEWS = {
        DASHBOARD: Dashboard,
        HISTORY: History,
        ADMIN: Admin,
        PASSWORD:Password
    };

    function findBootstrapEnvironment() {
        account = $web3.eth.accounts.privateKeyToAccount($wallet);
        let envs = ['xs', 'sm', 'md', 'lg', 'xl'];

        let el = document.createElement('div');
        document.body.appendChild(el);

        let curEnv = envs.shift();

        for (let env of envs.reverse()) {
            el.classList.add(`d-${env}-none`);

            if (window.getComputedStyle(el).display === 'none') {
                curEnv = env;
                break;
            }
        }

        document.body.removeChild(el);
        return curEnv;
    }

    let currentView = VIEWS.DASHBOARD;

    function setView(view) {
        currentView = view;
    }

    function showQR() {
        document.getElementById('lunchModal').click();
    }

    async function handleMessage(event) {
        balance = event.detail.text
    }
    onMount(()=>{
        window.$('.cuenta-regresiva').countdown('2020/11/20',function(event){
            window.$('#dias').html(event.strftime('%D'));
            window.$('#horas').html(event.strftime('%H'));
            window.$('#minutos').html(event.strftime('%M'));
            window.$('#segundos').html(event.strftime('%S'));
        })
    });
</script>

<div class="main-wrapper main-wrapper-1">
    <!--menu / bar color-->
    <div class="navbar-bg line-grey"></div>
    <!--horizontal bar-->
    <nav class="navbar navbar-expand-lg main-navbar" style="height:45px; padding-top: 20px;">
        <ul class="navbar-nav mr-auto">
            <div class="navbar-brand">
                <a class="sidebar-gone-hide w-100">MATRIX COIN</a>
                <a style="margin-top: -5px; color: #9e9e9e;" class="nav-link sidebar-gone-show" data-toggle="sidebar">
                    <Icon icon={faBars}>
                    </Icon>
                </a>
            </div>
        </ul>
        <!--right bar-->
        <div class="nav navbar-nav navbar-right">
            <div style="margin-top: {mobile ? '-10px' : '0'};" class="row">
                <div class="col">
                    <div>
                        <strong>Balance</strong> {parseFloat(balance).toFixed(2)} MTX
                    </div>
                    <div>
                        {$user.name}
                    </div>
                </div>
                <div style="cursor: pointer;" on:click={showQR} class="ml-3 mr-2 pt-2">
                    <Icon icon={faQrcode}>
                    </Icon>
                </div>
            </div>
        </div>
    </nav>
    <!--vertical bar-->
    <div class="main-sidebar sidebar-style-2"
         style="overflow: hidden; outline: currentcolor none medium;" tabindex="1">
        <aside id="sidebar-wrapper">
            <!--logo-->
            <div class="sidebar-brand line">
                <img src="assets/img/1.png" class="pt-2" alt="logo" width="100">
            </div>
            <!--menu-->
            <ul class="sidebar-menu pt-3">
                <li>
                    <a on:click={_ => setView(VIEWS.DASHBOARD)} class="nav-link">
                        <img src="./assets/img/icons/menu.svg" class="icon-grey">
                        <p class="mt-3" style="font-size: 15px;">Dashboard</p>
                    </a>
                </li>

                <li class="menu-header line">WALLET</li>
                <li>
                    <a on:click={_ => setView(VIEWS.HISTORY)} class="nav-link">
                        <img src="./assets/img/icons/history.svg" class="icon-grey">
                        <p class="mt-3" style="font-size: 15px;">History</p>
                    </a>
                </li>
                <li class="menu-header line">Setting</li>
                <li>
                    <a on:click={_ => setView(VIEWS.PASSWORD)} class="nav-link">
                        <img src="./assets/img/icons/history.svg" class="icon-grey">
                        <p class="mt-3" style="font-size: 15px;">Update</p>
                    </a>
                </li>
                <!--<li>
                    <a on:click={_ => setView(VIEWS.ADMIN)} class="nav-link">
                        <img src="./assets/img/icons/arrow-l.svg" class="icon-grey">
                        <p class="mt-3" style="font-size: 15px;">Admin</p>
                    </a>
                </li> -->
                <!-- <li>
                    <a href="#" class="nav-link">
                        <img src="./assets/img/icons/book.svg" class="icon-grey">
                        <span style="font-size: 11px;">ADDRESS BOOK</span>
                    </a>
                </li>
                <li class="menu-header line">SETTINGS
                    <img src="./assets/img/icons/arrow.svg" class="icon-green"></li>
                <li>
                    <a href="#" class="nav-link">
                        <img src="./assets/img/icons/settings.svg" class="icon-grey">
                        <span style="font-size: 11px;">SETTINGS</span>
                    </a>
                </li>
                <li class="menu-header line">APP
                    <img src="./assets/img/icons/arrow.svg" class="icon-green"></li>
                <li>
                    <a href="#" class="nav-link">
                        <img src="./assets/img/icons/change.svg" class="icon-grey">
                        <span style="font-size: 11px;">CHANGELLY</span>
                    </a>
                </li> -->
            </ul>
            <!--end menu-->
        </aside>
    </div>
    <!--end vertical bar-->
    <div class="main-content" style="min-height: 680px;">
        <div class="seccionr">
            <h2>Faltan</h2>
            <div class="cuenta-regresiva">
                <ul class="clearfix">
                    <li><p id="dias" class="numero"></p>dias</li>
                    <li><p id="horas" class="numero"></p>horas</li>
                    <li><p id="minutos" class="numero"></p>minutos</li>
                    <li><p id="segundos" class="numero"></p>segundos</li>
                </ul>
            </div>
        </div>
        <svelte:component this={currentView} on:message={handleMessage} mobile="{mobile}"/>
    </div>
    <footer class="main-footer">
        <div class="footer-left">
            Copyright © 2020
            <div class="bullet"></div>
            <a href="">Matrix Coin</a>
        </div>
        <div class="footer-right"></div>
    </footer>
</div>

<QR address="{account.address}" />
<button id="lunchModal" type="button" class="invisible" data-toggle="modal"
        data-target="#qr"></button>