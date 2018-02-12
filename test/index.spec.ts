import { findWeappDir, isMac, invoke } from '../src/util'
import { exec } from 'child_process'

findWeappDir().then(dir => {
  if (!dir) {
    return console.error('未找到开发工具安装目录')
  }
  console.log(dir)
})

// invoke('cli -l')
