<script>
	import Router from "svelte-spa-router";
	import {replace} from 'svelte-spa-router';
	import { routes } from "./router";

	function conditionsFailed(event) {


	}
</script>

<Router {routes} on:conditionsFailed={conditionsFailed} />


