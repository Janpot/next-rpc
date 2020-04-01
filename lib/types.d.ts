// Remove after https://github.com/DefinitelyTyped/DefinitelyTyped/pull/43389 has landed
declare module 'async_hooks' {
  /**
   * When having multiple instances of `AsyncLocalStorage`, they are independent
   * from each other. It is safe to instantiate this class multiple times.
   */
  class AsyncLocalStorage<T> {
    /**
     * This method disables the instance of `AsyncLocalStorage`. All subsequent calls
     * to `asyncLocalStorage.getStore()` will return `undefined` until
     * `asyncLocalStorage.run()` or `asyncLocalStorage.runSyncAndReturn()`
     * is called again.
     *
     * When calling `asyncLocalStorage.disable()`, all current contexts linked to the
     * instance will be exited.
     *
     * Calling `asyncLocalStorage.disable()` is required before the
     * `asyncLocalStorage` can be garbage collected. This does not apply to stores
     * provided by the `asyncLocalStorage`, as those objects are garbage collected
     * along with the corresponding async resources.
     *
     * This method is to be used when the `asyncLocalStorage` is not in use anymore
     * in the current process.
     */
    disable(): void;

    /**
     * This method returns the current store.
     * If this method is called outside of an asynchronous context initialized by
     * calling `asyncLocalStorage.run` or `asyncLocalStorage.runAndReturn`, it will
     * return `undefined`.
     */
    getStore(): T | undefined;

    /**
     * Calling `asyncLocalStorage.run(callback)` will create a new asynchronous
     * context.
     * Within the callback function and the asynchronous operations from the callback,
     * `asyncLocalStorage.getStore()` will return an instance of `Map` known as
     * "the store". This store will be persistent through the following
     * asynchronous calls.
     *
     * The callback will be ran asynchronously. Optionally, arguments can be passed
     * to the function. They will be passed to the callback function.
     *
     * If an error is thrown by the callback function, it will not be caught by
     * a `try/catch` block as the callback is ran in a new asynchronous resource.
     * Also, the stacktrace will be impacted by the asynchronous call.
     */
    // TODO: Apply generic vararg once available
    run(store: T, callback: (...args: any[]) => void, ...args: any[]): void;

    /**
     * Calling `asyncLocalStorage.exit(callback)` will create a new asynchronous
     * context.
     * Within the callback function and the asynchronous operations from the callback,
     * `asyncLocalStorage.getStore()` will return `undefined`.
     *
     * The callback will be ran asynchronously. Optionally, arguments can be passed
     * to the function. They will be passed to the callback function.
     *
     * If an error is thrown by the callback function, it will not be caught by
     * a `try/catch` block as the callback is ran in a new asynchronous resource.
     * Also, the stacktrace will be impacted by the asynchronous call.
     */
    exit(callback: (...args: any[]) => void, ...args: any[]): void;

    /**
     * This methods runs a function synchronously within a context and return its
     * return value. The store is not accessible outside of the callback function or
     * the asynchronous operations created within the callback.
     *
     * Optionally, arguments can be passed to the function. They will be passed to
     * the callback function.
     *
     * If the callback function throws an error, it will be thrown by
     * `runSyncAndReturn` too. The stacktrace will not be impacted by this call and
     * the context will be exited.
     */
    runSyncAndReturn<R>(
      store: T,
      callback: (...args: any[]) => R,
      ...args: any[]
    ): R;

    /**
     * This methods runs a function synchronously outside of a context and return its
     * return value. The store is not accessible within the callback function or
     * the asynchronous operations created within the callback.
     *
     * Optionally, arguments can be passed to the function. They will be passed to
     * the callback function.
     *
     * If the callback function throws an error, it will be thrown by
     * `exitSyncAndReturn` too. The stacktrace will not be impacted by this call and
     * the context will be re-entered.
     */
    exitSyncAndReturn<R>(callback: (...args: any[]) => R, ...args: any[]): R;

    /**
     * Calling `asyncLocalStorage.enterWith(store)` will transition into the context
     * for the remainder of the current synchronous execution and will persist
     * through any following asynchronous calls.
     */
    enterWith(store: T): void;
  }
}
