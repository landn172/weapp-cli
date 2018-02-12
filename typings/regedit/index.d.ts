type StringOrArray = string | string[]

type ListStrData = 'data' | 'finish'

interface IRegeditList {
  on(name: ListStrData, func: (entry?: any) => void): this
}

declare module 'regedit' {
  export function list(
    regPath: StringOrArray,
    callback: (err: any, result: any) => void
  ): void

  export function list(regPath: StringOrArray): IRegeditList
}
