<script>
    import Dashboard from './content/dashboard.svelte';
    import Admin from './content/admin.svelte';
    import History from './content/history.svelte';
    import Icon from 'fa-svelte';
    import {user} from '../store'
    import {faBars} from '@fortawesome/free-solid-svg-icons/faBars';

    let balance = 0.0;
    const VIEWS = {
        DASHBOARD: Dashboard,
        HISTORY: History,
        ADMIN: Admin
    };

    let currentView = VIEWS.DASHBOARD;

    function setView(view) {
        currentView = view;
    }

    async function handleMessage(event) {
        balance = event.detail.text
    }
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
            <div class="col">
                <div>
                    <strong>Balance</strong> {parseFloat(balance).toFixed(2)} MTX
                </div>
                <div>
                    {$user.name}
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
        <svelte:component this={currentView} on:message={handleMessage}/>
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