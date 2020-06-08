<script>
    import MetaButton from '../../components/metamask_button.svelte';
    import Icon from 'fa-svelte';
    import {faArrowRight, faArrowLeft} from '@fortawesome/free-solid-svg-icons';
</script>


<section class="section">
    <!--menu--->

    <!--end menu--->
    <div class="section-body" style="padding-right: 30px; padding-left: 30px">
        <div class="col-lg-3 col-md-3 col-sm-3 col-12 text-center mt-5" style="margin: 0 auto;">
            <div class="card">
                <ul class="list-group list-group-flush">
                    <li class="list-group-item">
                        <div class="row">
                            <div class="col">
                                <h4 style="font-weight: 500; color: #262626; text-align: start;">Login</h4>
                            </div>
                        </div>
                    </li>
                    <li class="list-group-item">
                        <MetaButton />
                    </li>
                </ul>
            </div>
        </div>
    </div>
</section>