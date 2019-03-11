import { Wish } from '../index';

export function deferred() {
    let resolve, reject;
    const wish = new Wish(function(res, rej){
        resolve = res;
        reject = rej;
    });

    return {
        promise: wish,
        resolve,
        reject
    };
}