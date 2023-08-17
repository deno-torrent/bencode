import { Buffer, concat } from './deps.ts'
import { logd } from './log.ts'

import {
  BencodeDict,
  BencodeList,
  BencodeString,
  BencodeType,
  isBencodeDict,
  isBencodeInteger,
  isBencodeList,
  isBencodeString
} from './type.ts'

export class Bencoder {
  private te: TextEncoder = new TextEncoder()

  encode(data: BencodeType) {
    if (isBencodeString(data)) {
      logd('start to encode string')
      return this.encodeByteString(data)
    } else if (isBencodeInteger(data)) {
      logd('start to encode integer')
      return this.encodeInt(data)
    } else if (isBencodeList(data)) {
      logd('start to encode list')
      return this.encodeList(data)
    } else if (isBencodeDict(data)) {
      logd('start to encode dict')
      return this.encodeDict(data)
    } else {
      // 不支持的数据类型
      throw new Error(`unsupported data type '${typeof data}'`)
    }
  }

  /**
   * 编码字节字符串
   * @param str 字节字符串
   *
   * 支持编码空字符串,例如 0:
   * 但不支持null或者undefined
   */
  private encodeByteString(str: BencodeString): Uint8Array {
    if (str === null || str === undefined) {
      throw new Error("undefined or null string isn't be supported to be encode")
    }

    let u8String: Uint8Array

    // 如果不是Unit8Array,则将其转换为Unit8Array
    if (typeof str === 'string') {
      u8String = this.te.encode(str)
    } else if (str instanceof Buffer) {
      u8String = str.bytes()
    } else {
      u8String = str
    }

    // 字符串的编码格式为：字符串的长度 + ':' + 字符串,例如：4:spam

    // 编码字符串的长度
    const buffers: Uint8Array[] = [this.te.encode(`${str.length}:`)]

    // 编码字符串内容
    buffers.push(u8String)

    return concat(...buffers)
  }

  /**
   * 编码数字
   * @param integer 数字
   */
  private encodeInt(integer: number): Uint8Array {
    if (!Number.isInteger(integer)) {
      throw new Error('bencode only support encode integer')
    }
    // 数字的编码格式为：'i' + 数字 + 'e'
    // 例如：i3e或者 i-5e
    return this.te.encode(`i${integer}e`)
  }

  /**
   * 编码列表
   * @param list
   */
  private encodeList(list: BencodeList): Uint8Array {
    logd(` start encodeList`)
    const buffers: Uint8Array[] = [this.te.encode('l')]
    // 遍历列表中的元素
    for (const element of list) {
      logd(` start itre ${element}`)
      // 递归调用Encode方法,编码列表中的元素
      buffers.push(this.encode(element))
    }
    logd(` end encodeList`)

    buffers.push(this.te.encode('e'))

    return concat(...buffers)
  }

  /**
   * 编码字典
   * @param dict
   */
  private encodeDict(dict: BencodeDict): Uint8Array {
    // 字典的编码格式为：'d' + 字典中的key-value + 'e'
    const buffers: Uint8Array[] = [this.te.encode('d')]

    // 创建一个数组,用于存储字典的key
    const keys: string[] = Object.keys(dict)

    // 对数组进行排序
    keys.sort()

    // 遍历数组,将字典的key和value写入到buffer
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]

      // 写入 key:
      logd(` start encode key ${k}`)
      buffers.push(this.encodeByteString(k))

      // 写入 value
      const value = dict[k]
      buffers.push(this.encode(value))
    }

    // 写入结束符 e
    buffers.push(this.te.encode('e'))

    return concat(...buffers)
  }
}
