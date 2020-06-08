import Login from '../pages/content/login.svelte';
import Principal from '../pages/principal.svelte';
import {wrap} from 'svelte-spa-router';
import {get} from 'svelte/store';
import {wallet} from '../store';

export const routes = {
    '/': Login,
    '/dashboard': wrap(
        Principal,
        {page: 'principal'},
        () => {
            return get(wallet) !== ''
        },
    )
};
