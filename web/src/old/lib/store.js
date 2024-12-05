export const ssr = false;

import { writable } from "svelte/store"
import { browser } from "$app/environment"


let tokenPersisted = browser && localStorage.getItem('token') || ""
export let token = writable(tokenPersisted ? tokenPersisted : '')

if (browser) {
    token.subscribe(u => localStorage.token = u)
}

export let settingsDefault = {
    temp: 20,
    tenDegreeMode: false,
    highPower: false,
    mode: 1,
    fan: 0,
    power: 1
}
let settingsPersisted = browser && JSON.parse(localStorage.getItem('settings')) || settingsDefault
export let settings = writable(settingsPersisted ? settingsPersisted : settingsDefault)

if (browser) {
    settings.subscribe(u => localStorage.settings = u)
}