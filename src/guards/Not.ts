export function Not(func: Function) {
    return (...args) => !func(...args)
}