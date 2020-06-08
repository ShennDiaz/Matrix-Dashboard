<script>
    import blockies from 'ethereum-blockies';
    import randomColor from 'randomcolor';
    import {onMount} from "svelte";
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    export let address;

    async function continueFire() {
        dispatch('message', {
            text: 'continue'
        });
    }

    onMount(() => {
        let icon = blockies.create({
            seed: address,
            color: randomColor(),
            bgcolor: randomColor(),
            size: 15,
            scale: 4,
            spotcolor: randomColor()
        });
        document.getElementById('blockie').appendChild(icon);
    });

</script>

<div class="modal fade" id="exampleModalCenter" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <p style="color: black; font-weight: 500; font-size: 20px;" class="modal-title" id="exampleModalLongTitle">Confirm address</p>
                <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body">
                <div class="row">
                    <div class="col">
                        <div class="row">
                            <div class="ml-3" id="blockie"> </div>
                            <div class="col">
                                <p style="font-size: 15px; color: black; font-weight: 500">ETH Address</p>
                                <p style="margin-top: -18px;">{address}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button on:click={continueFire} data-dismiss="modal" type="button" class="btn btn-primary-outline">Accept</button>
            </div>
        </div>
    </div>
</div>