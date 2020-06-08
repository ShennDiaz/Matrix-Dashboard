<script>
    import {onMount} from "svelte";

    let browser = '';
    const FIREFOX = 'https://addons.mozilla.org/es/firefox/addon/ether-metamask/';
    const CHROME = 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=es';

    const PATH = {
        'Firefox': FIREFOX,
        'Chrome': CHROME
    }

    function install() {
        let win = window.open(PATH[browser], '_blank');
        win.focus();
    }

    onMount(() => {
        if (navigator.userAgent.indexOf('Firefox') > 1) browser = 'Firefox';
        if (navigator.userAgent.indexOf('Chrome') > 1) browser = 'Chrome';
    });

</script>

<div on:click={install} style="border-radius: .2rem; background-color: #212121; height: 43px; cursor: pointer;">
    <img class="pt-1 ml-1" style="float: left" width="40" src="./assets/img/metamask-light.png">
    <p class="pt-2" style="font-weight: 500; color: white; font-size: 14px;">Install Metamask for {browser}</p>
</div>