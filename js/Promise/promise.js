const PENDING = 'PENDING';
const FULFILLED = 'FULFILLED';
const REJECTED = 'REJECTED';

const resolvePromise = (promise2, x, resolve, reject) => {
  // Promise/A+ 2.3.1
  if (promise2 === x) {
    return reject(new TypeError('Chaining cycle detected for promise #<Promise>'))
  }
  // Promise/A+ 2.3.3.3.3 只能调用一次
  let called;
  // Promise/A+ 2.3.2
  // Promise/A+ 2.3.3
  if ((typeof x === 'object' && x != null) || typeof x === 'function'){
    try {
      // Promise/A+ 2.3.3.1
      let then = x.then
      // Promise/A+ 2.3.3.3
      if (typeof then === 'function') {
        then.call(x, y => { // Promise/A+ 2.3.3.3.1 -- 递归调用，y可能也是Promise
          if (called) return;
          called = true;
          resolvePromise(promise2, y, resolve, reject); 
        }, r => { // Promise/A+ 2.3.3.3.2
          if (called) return;
          called = true;
          reject(r)
        })
      } else {
        // Promise/A+ 2.3.3.4
        resolve(x)
      }
    } catch (error) {
      // Promise/A+ 2.3.3.2 在try中可能改变了status
      if (called) return;
      called = true;
      reject(error)
    }
  } else {
    // Promise/A+2.3.4
    resolve(x)
  }
}
class Promise {
  constructor(executor) {
    if (typeof executor !== 'function') {
      throw TypeError(`Promise resolver ${executor} is not a function`)
    }
    // 状态
    this.status = PENDING;
    // 成功值
    this.value = undefined;
    // 失败原因
    this.reason = undefined;
    // 存放成功的回调
    this.onResolvedCallbacks = [];
    // 存放失败的回调
    this.onRejectedCallbacks= [];
    const resolve = (value) => {
      if(value instanceof Promise){
        return value.then(resolve,reject)
      }
      if (this.status === PENDING) {
        this.status = FULFILLED
        this.value = value
        this.onResolvedCallbacks.forEach(fn => fn())
      }
    }
    const reject = (reason) => {
      if (this.status === PENDING) {
        this.status = REJECTED
        this.reason = reason
        this.onRejectedCallbacks.forEach(fn => fn())
      }
    }
    try{
      executor(resolve, reject)
    } catch (error){
      reject(error)
    }
  }
  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : v => v
    onRejected = typeof onRejected === 'function' ? onRejected : e => {throw e}
    let promise2 = new Promise((resolve, reject) => {
      //Promise/A+ 2.2.2
      //Promise/A+ 2.2.4 --- setTimeout
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            //Promise/A+ 2.2.7.1
            //如果onFulfilled或onRjected返回一个值x，运行promise解决程序[[Resolve]](promise2,x)
            let x = onFulfilled(this.value)
            resolvePromise(promise2, x, resolve, reject)
          } catch (error) {
            //Promise/A+ 2.2.7.2
            reject(error)
          }
        }, 0)
      }
      if (this.status === REJECTED) {
        //Promise/A+ 2.2.3
        //Promise/A+ 2.2.4 --- setTimeout
        setTimeout(() => {
          try {
            let x = onRejected(this.reason)
            resolvePromise(promise2, x, resolve, reject)
          } catch (error) {
            //Promise/A+ 2.2.7.2
            reject(error)
          }
        }, 0)
      }
      if (this.status === PENDING) {
        // 如果promise的状态是 pending，需要将 onFulfilled 和 onRejected 函数存放起来，等待状态确定后，再依次将对应的函数执行
        this.onResolvedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onFulfilled(this.value)
              resolvePromise(promise2, x, resolve, reject)
            } catch (error) {
              reject(error)
            }
          }, 0)
        })
        // 如果promise的状态是 pending，需要将 onFulfilled 和 onRejected 函数存放起来，等待状态确定后，再依次将对应的函数执行
        this.onRejectedCallbacks.push(() => {
          setTimeout(() => {
            try {
              let x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject)
            } catch (e) {
              reject(e)
            }
          }, 0);
        })
      }
    })
    return promise2
  }
}

Promise.defer = Promise.deferred = function () {
  let dfd = {};
  dfd.promise = new Promise((resolve,reject)=>{
      dfd.resolve = resolve;
      dfd.reject = reject;
  })
  return dfd;
}
module.exports = Promise
