import { join } from 'path'
import { writeFile, readFile, accessSync } from 'fs'

const cacheFileName = '.weappcache'

function getCacheFileName() {
  return join(__dirname, '../', cacheFileName)
}

export function readCacheFile(): Promise<string> {
  return new Promise((resolve, reject) => {
    const filePath = getCacheFileName()
    const exist = isExistFile(filePath)
    if (!exist) return reject()
    readFile(getCacheFileName(), 'utf8', (err, data) => {
      if (err || !data) {
        reject()
        return console.error(err)
      }
      resolve(data)
    })
  })
}

function isExistFile(filePath: string) {
  try {
    accessSync(filePath)
  } catch (e) {
    return false
  }
  return true
}

export function writeCacheFile(data: string) {
  return new Promise((resolve, reject) => {
    writeFile(getCacheFileName(), data, err => {
      if (err) {
        reject()
        console.error(err)
      }
    })
  })
}
