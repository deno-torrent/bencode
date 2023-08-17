let BENCODE_DEBUG_ENABLE = false

export function disableDebug() {
  BENCODE_DEBUG_ENABLE = false
}

export function enableDebug() {
  BENCODE_DEBUG_ENABLE = true
}

export function logd(message?: any, ...optionalParams: any[]) {
  if (!BENCODE_DEBUG_ENABLE) return

  // format current date: 2021-01-01 00:00:00
  const date = new Date()
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  const time = `${year}-${month}-${day} ${hour}:${minute}:${second}`

  // 为time添加颜色
  const formattedTime = `\x1b[36m${time}\x1b[0m`

  const formattedMessage = `[${formattedTime}] ${message}`

  console.log(formattedMessage, ...optionalParams)
}