import World, { NamedExport } from './other';

export default function something() {
    for (let i = 0; i < NamedExport; i++) {
        console.log(`Hello ${World}`)
    }
}

something();

export { something };