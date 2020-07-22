<script>
    import QR from './qr_item.svelte';

    export let address;
</script>

<div class="modal fade" id="qr" tabindex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered" role="document">
        <div class="modal-content">
            <div class="modal-header" style="background-color: white;">
                <p style="color: rgb(118, 210, 117); font-weight: 600; font-size: 22px;" class="modal-title pb-3" id="exampleModalLongTitle">My Address</p>
                <button style="color: white;" type="button" class="close" data-dismiss="modal" aria-label="Close">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="modal-body" style="background-color: #F8F8F8;">
                <QR codeValue="{address}" squareSize="{150}"/>
                <p class="mt-3 text-center" style="font-size: 14px;">Matrix wallet: {address}</p>
            </div>
        </div>
    </div>
</div>