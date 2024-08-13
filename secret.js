const abc=require('crypto')
const secret=abc.randomBytes(64).toString('hex')
console.log(secret)