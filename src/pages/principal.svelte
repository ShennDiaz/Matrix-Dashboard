<script>
import Dashboard from './content/dashboard.svelte';
</script>

<div class="main-wrapper main-wrapper-1">
<!--menu / bar color-->
    <div class="navbar-bg line-grey"></div>
    <!--horizontal bar-->
    <nav class="navbar navbar-expand-lg main-navbar" 
         style="height:45px; ">
         <a href="#" class="navbar-brand sidebar-gone-hide w-100">MATRIX COIN</a>
         <a href="#" class="nav-link sidebar-gone-show" data-toggle="sidebar"><i class="fas fa-bars"></i></a>
         <!--right bar-->
        <div class="breadcrumb-item col-2"><strong>Balance</strong> 5900.0000 ETH</div>
    </nav>
<!--vertical bar-->
    <div class="main-sidebar sidebar-style-2"
         style="overflow: hidden; outline: currentcolor none medium;" tabindex="1">
        <aside id="sidebar-wrapper">
        <!--logo-->
            <div class="sidebar-brand line">
                <img src="assets/img/1.png" class="pt-2" alt="logo" width="100" style="padding-top: 2rem !important;">
            </div>
            <!--menu-->
            <ul class="sidebar-menu pt-3">
                <li>
                   <a href="#" class="nav-link">
                        <img src="./assets/img/icons/menu.svg" class="icon-grey">
                        <span style="font-size: 11px;">DASHBOARD</span>
                    </a>
                </li>
                <li class="menu-header line">WALLET
                <img src="./assets/img/icons/arrow.svg" class="icon-green"></li>
                <li>
                   <a href="#" class="nav-link">
                        <img src="./assets/img/icons/arrow-r.svg" class="icon-grey">
                        <span style="font-size: 11px;">RECEIVE</span>
                    </a>
                </li>
                <li>
                   <a href="#" class="nav-link">
                        <img src="./assets/img/icons/arrow-l.svg" class="icon-grey">
                        <span style="font-size: 11px;">SEND</span>
                    </a>
                </li>
                <li>
                   <a href="#" class="nav-link">
                        <img src="./assets/img/icons/history.svg" class="icon-grey">
                        <span style="font-size: 11px;">HISTORY</span>
                    </a>
                </li>
                <li>
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
                </li>
            </ul>
            <!--end menu-->
        </aside>
    </div>
<!--end vertical bar-->
    <div class="main-content" style="min-height: 680px;">
        <svelte:component this={Dashboard}/>
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