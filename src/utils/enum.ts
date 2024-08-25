//https://stackoverflow.com/a/73939756
export function enumKeys(E: any): string[] {
    return Object.keys(E).filter(k => isNaN(Number(k)));
}

export function enumValues(E: any): string[] | number[] {
    return enumKeys(E).map(k => E[k as any]);
}