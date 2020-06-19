import {writable} from 'svelte/store';

export const metamask = writable(false);
export const wallet = writable('');
export const jwt = writable('');
export const error = writable('');

export const user = writable({
    name: '',
    password: ''
});
