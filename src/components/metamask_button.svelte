<script>
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    async function loginFire() {
        dispatch('message', {
            text: 'login'
        });
    }

</script>

<div on:click="{loginFire}" style="border-radius: .2rem; background-color: #37474F; height: 43px; cursor: pointer;">
    <img class="pt-1 ml-1" style="float: left" width="40" src="./assets/img/metamask-light.png">
    <p class="pt-2" style="font-weight: 500; color: white; font-size: 14px;">Enter with
        Metamask</p>
</div>