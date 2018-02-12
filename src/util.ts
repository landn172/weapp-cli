import * as regedit from 'regedit'
import * as path from 'path'
import { exec } from 'child_process'
import { readCacheFile, writeCacheFile } from './cache'

const userDirName = `微信web开发者工具`
const userDirPath = path.join(
  process.env.USERPROFILE || '~',
  `AppData/Local/${userDirName}/User Data/Default`
)

const uninstallRegUrl =
  'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\'

const muiCahceRegUrl =
  'HKCU\\Software\\Classes\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\MuiCache'
// 'HKCR\\Local Settings\\Software\\Microsoft\\Windows\\Shell\\MuiCache\\'

const softwareName = '微信web开发者工具'
const guidReg = /^\{.*\}$/

export const isMac = process.platform === 'darwin'

/**
 *
 * @param cmd
 * @example
 *  invoke('-o') 打开
 *  invoke('cli -l)  登录，在终端中打印登录二维码
 */
export async function invoke(cmd: string) {
  const cliDir = await findWeappDir()
  const cli = findCli(cliDir)
  if (cmd.indexOf('cli') !== 0) {
    cmd = `cli ${cmd}`
  }
  const child = exec(`cd ${cliDir} && ${cmd}`)

  child.stdout.on('data', data => {
    console.log(data)
  })

  child.stderr.on('data', data => {
    console.log(data)
  })

  child.on('close', function(code) {
    console.log('closing code: ' + code)
  })
}

function findCli(cliDir: string) {
  if (isMac) return path.join(cliDir, '/Contents/Resources/app.nw/bin/')
  return path.join(cliDir)
}

/**
 * 查找微信开发工具目录
 */
export function findWeappDir(): Promise<string> {
  return readCacheFile().then(
    dir => {
      return JSON.parse(dir).dir
    },
    () => {
      if (isMac) return Promise.resolve('')
      return findWeappDirInMuiCache()
        .then(ret => ret, () => findWeappInUninstallReg())
        .then(ret => {
          if (ret) {
            writeCacheFile(
              JSON.stringify({
                dir: ret
              })
            )
          }
          return ret
        })
    }
  )
}

/**
 * 从缓存中那路径
 */
function findWeappDirInMuiCache(): Promise<string> {
  return new Promise((resolve, reject) => {
    regedit.list(muiCahceRegUrl, (err: any, result: any) => {
      if (err) return console.error(err)
      const values = result[muiCahceRegUrl].values

      Object.keys(values).forEach((appPath, index) => {
        const { value } = values[appPath]
        if (value === softwareName) {
          const { dir } = path.parse(appPath)
          resolve(dir)
        }
      })

      reject()
    })
  })
}

/**
 * 从删除注册表中找工具安装目录
 */
function findWeappInUninstallReg(): Promise<string> {
  return new Promise((resolve, reject) => {
    regedit.list(uninstallRegUrl, (err: any, result: any) => {
      if (err) return console.error(err)
      const guidNames: string[] = []
      const keys: string[] = result[uninstallRegUrl]['keys']

      const targetIndex = keys.findIndex(name => {
        if (name === softwareName) {
          return true
        }
        if (name.match(guidReg)) guidNames.push(name)
        return false
      })

      if (targetIndex >= 0)
        return resolve(
          findWeappSoftInRegUrl(`${uninstallRegUrl}${keys[targetIndex]}`)
        )

      Promise.race(
        guidNames.map(name =>
          findWeappSoftInRegUrl(`${uninstallRegUrl}${name}`)
        )
      ).then(ret => {
        resolve(ret)
      })
    })
  })
}

function findWeappSoftInRegUrl(regUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    regedit.list(regUrl, (err: any, result: any) => {
      if (err) return console.error(err)
      const values = result[regUrl].values
      if (!values) return
      const { InstallSource, DisplayName, InstallLocation } = values
      if (getRegValue(DisplayName) === softwareName) {
        const appPath =
          getRegValue(InstallLocation) || getRegValue(InstallSource)
        if (appPath) resolve(appPath)
      }
    })
    reject()
  })
}

function getRegValue(RegValue: any) {
  if (!RegValue) return void 0
  return RegValue.value
}
