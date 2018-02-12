import { invoke } from './util'

const args = process.argv

const commands = args.slice(2).join(' ')
console.log(commands)
invoke(commands)
