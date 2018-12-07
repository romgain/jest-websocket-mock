export default class Queue {
  pendingItems = [];
  nextItemResolver;
  nextItem = new Promise(done => (this.nextItemResolver = done));

  put(item) {
    this.pendingItems.push(item);
    this.nextItemResolver();
    this.nextItem = new Promise(done => (this.nextItemResolver = done));
  }

  get() {
    if (this.pendingItems.length) {
      // pop the next item from the queue and return it immediately
      return Promise.resolve(this.pendingItems.shift());
    }
    let resolver;
    const nextItemPromise = new Promise(done => (resolver = done));
    this.nextItem.then(() => {
      resolver(this.pendingItems.shift());
    });
    return nextItemPromise;
  }
}
