<script>
    import Icon from 'fa-svelte';
    import {faExclamationCircle} from '@fortawesome/free-solid-svg-icons';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
</script>

<div class="modal fade" id="errorModal" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
            <div class="modal-header" style="background-color: #c62828;">
                <div class="col-12 text-center" style="margin-top: -41px;">
                    <a style="color: white; font-size: 63px;">
                        <Icon icon={faExclamationCircle}>
                        </Icon>
                    </a>
                </div>
            </div>
            <div class="modal-body" style="background-color: #F8F8F8;">
                <div class="row pt-4">
                    <div class="col text-center">
                        <p style="font-weight: 500 !important; font-size: 28px; color: black;">Error!</p>
                        <p style="font-weight: 500 !important; font-size: 18px;">An error occurred while processing the transaction, please try again later</p>
                    </div>
                </div>
                <button style="margin-top: 20px; float: right; background-color: rgb(118, 210, 117); color: white; width: 100px; font-weight: 500;" data-dismiss="modal" type="button" class="btn btn-primary-outline">Accept</button>
            </div>
        </div>
    </div>
</div>