
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
            setTimeout(() => this.resolveCb.apply(undefined, [val]));
        }
    }

    callRejectAsync(val: any) {
        // should only invoke once
        if (this.isCalled) {
            return;
        }
        this.isCalled = true;

        if (this.rejectCb) {
            setTimeout(() => this.rejectCb.apply(undefined, [val]));
        }
    }
}

export class Wish {
    private state: State = State.Pending;
    private val: any;
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


        let deferredResolve, deferredReject;
        const nextWish = new Wish(function executor(resolve, reject) {
            deferredResolve = resolve;
            deferredReject = reject;
        });

        const newSuccessCb = function (val: any) {
            if (!successCb) {
                deferredResolve(val);
                return;
            }

            try {
                const successVal = successCb(val);
                deferredResolve(successVal);
            } catch (e) {
                deferredReject(e);
            }

        };

        const newErrorCb = function (val: any) {
            if (!errorCb) {
                deferredReject(val);
                return;
            }

            try {
                const errorVal = errorCb(val);
                deferredResolve(errorVal);
            } catch (e) {
                deferredReject(e);
            }

        };

        // the promise is already resolved.
        if (this.state === State.Fullfilled) {
            setTimeout(() => newSuccessCb(this.val));
        } else if (this.state === State.Rejected) {
            setTimeout(() => newErrorCb(this.val));
        } else {
            this.subscribers.push(new Subscriber(newSuccessCb, newErrorCb));
        }

        return nextWish;
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
        if ((val !== null && typeof val === 'object') || typeof val === 'function') {
            let then = undefined;
            try {
                then = val.then;
            } catch (e) {
                this.reject(e);
            }

            if (typeof then === 'function') {
                let counter = 0;
                try {
                    then.apply(val, [
                        (v) => {
                            // only take the first call to resolve. ignore subsequent calls
                            if (counter !== 0) {
                                return;
                            }
                            counter++;
                            this.resolve(v);
                        }, (v) => {
                            if (counter !== 0) {
                                return;
                            }
                            counter++;
                            this.reject(v);
                        }]);
                } catch (e) {
                    if (this.state === State.Pending && counter === 0) {
                        this.reject(e);
                    }
                }
            } else {
                this.state = State.Fullfilled;
                this.val = val;

                // resolve directly
                for (const sub of this.subscribers) {
                    sub.callResolveAsync(val);
                }
            }
            return;
        }

        this.state = State.Fullfilled;
        this.val = val;

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
        this.val = val;
        for (const sub of this.subscribers) {
            sub.callRejectAsync(val);
        }
    }
};
