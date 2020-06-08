<script>
	import Router from "svelte-spa-router";
	import {replace} from 'svelte-spa-router';
	import { routes } from "./router";

	function conditionsFailed(event) {
		if (event.detail.userData.page === 'principal')
			replace('/');
	}
</script>

<Router {routes} on:conditionsFailed={conditionsFailed} />


