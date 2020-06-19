<script>
    import Icon from 'fa-svelte';
    import {faArrowRight} from '@fortawesome/free-solid-svg-icons';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
    export let eth;
    export let mtx;

    async function continueFire() {
        dispatch('message', {
            text: 'accept'
        });
    }
</script>

<div class="modal fade" id="exampleModalCenter" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
            <div class="modal-header" style="background-color: white;">
                <p style="color: rgb(118, 210, 117); font-weight: 600; font-size: 22px;" class="modal-title pb-3" id="exampleModalLongTitle">Confirm exchange</p>
                <button style="color: white;" type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body" style="background-color: #F8F8F8;">
                <div class="row pt-4">
                    <div class="col-6 text-center">
                        <h4>{eth} ETH</h4>
                    </div>
                    <div class="col-1" style="margin-top: -5px;">
                        <a style="color: #76d275; font-size: 25px;">
                            <Icon icon={faArrowRight}>
                            </Icon>
                        </a>
                    </div>
                    <div class="col text-center">
                        <h4>{mtx} MTX</h4>
                    </div>
                </div>
                <button style="margin-top: 20px; float: right; background-color: rgb(118, 210, 117); color: white; width: 100px; font-weight: 500;" on:click={continueFire} data-dismiss="modal" type="button" class="btn btn-primary-outline">Accept</button>
            </div>
        </div>
    </div>
</div>