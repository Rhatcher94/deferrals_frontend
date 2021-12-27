import { writable } from 'svelte/store';

export const showMessage = writable({show: false, message: "", type: ""});
export const invoices = writable([]);
export const selectedInvoice = writable([]);
export const user = writable({});
export const myOrganization = writable({});