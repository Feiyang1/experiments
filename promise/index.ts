
enum State {
    Pending,
    Fullfilled,
    Rejected
}

interface Executor {
    (resolve: (value: any) => void, reject: (value: any) => void): void
}

export class Wish {
    private state = State.Pending;

    constructor(func: Executor) {
        this.resolve.bind(this);
        this.reject.bind(this);
        func.apply(undefined, [this.resolve, this.reject]);
    }

    then() {

    }

    resolve() {

    }

    reject() {

    }
};
