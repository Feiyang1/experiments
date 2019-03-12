
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

        if(this.rejectCb) {
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

    then(success?: CallBack, error?: CallBack) {
        this.subscribers.push(new Subscriber(success, error));
    }

    resolve(val: any) {
        if (val === this) {
            this.reject(TypeError("Can't resolve with self!"));
            return;
        }

        // if resolved with a promise (wish)
        if (val instanceof Wish) {

            return;
        }

        // if resolved with a promise like object
        if (val.then) {

            return;
        }

        this.state = State.Fullfilled;

        // resolve directly
        for (const sub of this.subscribers) {
            sub.callResolveAsync(val);
        }
    }

    reject(val: any) {

    }
};
