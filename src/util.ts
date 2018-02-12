import * as regedit from 'regedit'
import * as path from 'path'

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

export function findWeappDir() {
  if (isMac) return Promise.resolve('')
  return findWeappDirInMuiCache()
    .then(ret => ret, () => findWeappInUninstallReg())
    .then(ret => {
      return ret
    })
}

/**
 * 从缓存中那路径
 */
export function findWeappDirInMuiCache(): Promise<string> {
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
export function findWeappInUninstallReg(): Promise<string> {
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

export function findWeappSoftInRegUrl(regUrl: string): Promise<string> {
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
