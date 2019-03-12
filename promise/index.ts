
enum State {
    Pending,
    Fullfilled,
    Rejected
}

interface Executor {
    (resolve: (value: any) => void, reject: (value: any) => void): any
}

interface CallBack {
    (value: any): any
}

class Subscriber {
    private isCalled = false;
    constructor(private resolveCb?: CallBack, private rejectCb?: CallBack) {

    }

    callResolveAsync(val: any) {
        // should only invoke once
        if (this.isCalled) {
            return;
        }
        this.isCalled = true;
        if (this.resolveCb) {
            setTimeout(() => this.resolveCb.apply(undefined, val));
        }
    }

    callRejectAsync(val: any) {
        // should only invoke once
        if (this.isCalled) {
            return;
        }
        this.isCalled = true;

        if (this.rejectCb) {
            setTimeout(() => this.rejectCb.apply(undefined, val));
        }
    }
}

export class Wish {
    private state: State = State.Pending;
    private subscribers: Subscriber[] = [];

    constructor(func: Executor) {
        this.resolve = this.resolve.bind(this);
        this.reject = this.reject.bind(this);
        func.apply(undefined, [this.resolve, this.reject]);
    }

    then(success?: any, error?: any) {

        let successCb = undefined;
        if (success && typeof success === "function") {
            successCb = success;
        }

        let errorCb = undefined;
        if (error && typeof error === "function") {
            errorCb = error;
        }

        this.subscribers.push(new Subscriber(successCb, errorCb));
    }

    resolve(val: any) {
        // can't resolve a resolved/rejected promise
        if (this.state !== State.Pending) {
            return;
        }

        if (val === this) {
            this.reject(TypeError("Can't resolve with self!"));
            return;
        }

        // if resolved with a promise (wish)
        if (val instanceof Wish) {

            val.then(this.resolve, this.reject);
            return;
        }

        // if resolved with a promise like object
        if (typeof val === 'object' || typeof val === 'function') {
            let then = undefined;
            try {
                then = val.then;
            } catch (e) {
                this.reject(e);
            }

            if (typeof then === 'function') {
                then.apply(val, [this.resolve, this.reject]);
            } else {
                this.state = State.Fullfilled;

                // resolve directly
                for (const sub of this.subscribers) {
                    sub.callResolveAsync(val);
                }
            }
            return;
        }

        this.state = State.Fullfilled;

        // resolve directly
        for (const sub of this.subscribers) {
            sub.callResolveAsync(val);
        }
    }

    reject(val: any) {
        // can't reject a resolved/rejected promise
        if (this.state !== State.Pending) {
            return;
        }

        this.state = State.Rejected;
        for (const sub of this.subscribers) {
            sub.callRejectAsync(val);
        }
    }
};
