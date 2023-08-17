import { concat } from './deps.ts'
import { logd } from './log.ts'
import { BencodeDict, BencodeInteger, BencodeList, BencodeString, BencodeType } from './type.ts'
import { isUtf8 } from './util.ts'

export class Bdecoder {
  private curosr = 0
  private textDecoder: TextDecoder = new TextDecoder()

  decode(data: Uint8Array): BencodeType | null {
    // 重置游标
    this.curosr = 0
    return this.parse(data)
  }

  /**
   * 读取字节数组,默认读取一个字节
   * @param length
   * @returns
   */
  private readBytes(data: Uint8Array, length = 1): Uint8Array {
    if (this.curosr + length > data.length) {
      logd(
        `[readBytes] read bytes out of range, curosr is ${this.curosr}, length is ${length}, data length is ${data.length}`
      )
      return new Uint8Array()
    }

    const bytes = data.slice(this.curosr, this.curosr + length)

    this.curosr += length

    return bytes
  }

  /**
   * 回退游标
   * @param length
   */
  private backCursor(length = 1) {
    this.curosr -= length
  }

  private parse(data: Uint8Array): BencodeType | null {
    // 读取头部字节,用于判断需要解析的数据类型
    const bytes = this.readBytes(data)

    logd(`[decode] read next byte ${this.textDecoder.decode(bytes)}`)

    if (bytes.length === 0) {
      logd('[decode] head bytes is null, return null')
      return null
    }

    switch (String.fromCharCode(bytes[0])) {
      case 'i':
        logd(`[decode] start parse integer`)
        // 解码整数值
        return this.decodeInteger(data)
      case 'l':
        logd(`[decode] start parse list`)
        // 解码列表
        return this.decodeList(data)
      case 'd':
        logd(`[decode] start parse dict`)
        // 解码字典
        return this.decodeDict(data)
      default:
        // 除开上面三种类型,剩下的都是字节字符串
        logd(`[decode] start parse byte string`)
        // 回退游标,因为这里的头字节是长度的一部分或者长度本身,例如5:hello,后面需要用于截取指定长度的字符串
        this.backCursor()
        // 解码字符串
        return this.decodeByteString(data)
    }
  }

  private decodeInteger(data: Uint8Array): BencodeInteger {
    logd(`[decodeInteger] start read int bytes length`)

    // 读取直到遇到'e'字节为止
    const intBuffer = this.readUntil(data, 'e')

    // 转换成数字
    const integer = parseInt(this.textDecoder.decode(intBuffer))

    logd(`[decodeInteger] decoded integer is ${integer}`)

    return integer
  }

  private decodeByteString(data: Uint8Array): BencodeString | number[] {
    logd(`[decodeByteString] start read string bytes length`)

    // 获取字符串的长度
    const lengthBuffer = this.readUntil(data, ':')

    logd(`[decodeByteString] readed lengthBuffer value is ${lengthBuffer}`)

    // 转换成数字
    const length = parseInt(this.textDecoder.decode(lengthBuffer))

    logd(`[decodeByteString] next string bytes length is ${length}`)

    // 根据长度读取字符串对应的字节数组
    const stringBuffer = this.readBytes(data, length)

    logd(`[decodeByteString] readed stringBuffer length is ${stringBuffer ? stringBuffer.length : 0}`)

    const result = this.textDecoder.decode(stringBuffer)

    //  如果是utf8编码，转成字符串,不然后面转成json会是乱码
    if (isUtf8(stringBuffer)) {
      return result
    } else {
      logd(`[decodeByteString] string is not utf8, return number array`)
      // 否则转换成number数组,由于js中没有byte类型,所以只能用number数组来表示字节
      return Array.from(stringBuffer)
    }
  }

  /**
   * 解码列表,例如 l5:helloe 或者 l5:helloi123ee,也就是["hello"]或者["hello",123]
   * @returns list
   */
  private decodeList(data: Uint8Array): BencodeList {
    const list = []

    while (true) {
      // 读取首字节
      const bytes = this.readBytes(data)

      if (bytes.length === 0 || String.fromCharCode(bytes[0]) === 'e') {
        break
      }

      // 如果读取到的不是'e',回退游标,继续解析
      this.backCursor()

      const item = this.parse(data)

      if (item == null) break

      list.push(item)
    }

    return list
  }

  /**
   * 解码字典
   * @returns object
   */
  private decodeDict(data: Uint8Array): BencodeDict {
    const obj = {} as any
    while (true) {
      // 读取首字节
      const bytes = this.readBytes(data)

      if (bytes.length === 0 || String.fromCharCode(bytes[0]) === 'e') {
        break
      }

      // 如果读取到的不是'e',回退游标,继续解析
      this.backCursor()

      logd(`[decodeDict] start parse dict key`)
      // 解析key
      const key = this.decodeByteString(data).toString()

      logd(`[decodeDict] key is '${key}'`)

      logd(`[decodeDict] start parse dict value`)
      // 解析value
      obj[key] = this.parse(data)
      // logd(`[decodeDict] value is '${JSON.stringify(obj[key])}'`)
    }

    return obj
  }

  /**
   * 从字节流读取直到遇到stop字节为止，返回读取到的字符串
   * 注意: stop 字节已经被读取过了,游标已经移动到下一个字节
   * @param stop
   */
  private readUntil(data: Uint8Array, stop: string): Uint8Array {
    logd(`[readUntil] '${stop}'`)

    // 用于存储读取到的字节
    const buffers: Uint8Array[] = []
    while (true) {
      // 读取一个字节
      const bytes = this.readBytes(data)

      logd(`[readUntil] readed bytes is ${bytes}`)

      // 如果已经读取到了文件末尾,或者读取到的字节是stop字节,则返回
      if (bytes.length === 0 || String.fromCharCode(...bytes) === stop) {
        logd(`[readUntil] reached stop char`)
        break
      }

      // 拼接字节
      buffers.push(bytes)
    }

    return concat(...buffers)
  }
}
