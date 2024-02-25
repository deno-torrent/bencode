import { Buffer } from 'std/io/mod.ts'
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
  private te = new TextEncoder()
  private buffer = new Buffer() // 用于缓存编码后的数据

  /**
   * 编码数据
   * @param data
   * @returns
   */
  async e(data: BencodeType): Promise<Uint8Array> {
    // 重置buffer
    this.buffer.reset()
    // 开始编码
    await this.encode(data)
    // 返回编码后的数据
    return this.buffer.bytes()
  }

  private async encode(data: BencodeType) {
    if (isBencodeString(data)) {
      logd('start to encode string')
      await this.encodeByteString(data)
    } else if (isBencodeInteger(data)) {
      logd('start to encode integer')
      await this.encodeInt(data)
    } else if (isBencodeList(data)) {
      logd('start to encode list')
      await this.encodeList(data)
    } else if (isBencodeDict(data)) {
      logd('start to encode dict')
      await this.encodeDict(data)
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
  private async encodeByteString(str: BencodeString) {
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

    // 编码字符串的长度,字符串的编码格式为:字符串的长度 + ':' + 字符串,例如:4:spam
    await this.buffer.write(this.te.encode(`${str.length}:`))

    // 编码字符串内容
    await this.buffer.write(u8String)
  }

  /**
   * 编码数字
   * @param integer 数字
   */
  private async encodeInt(integer: number) {
    if (!Number.isInteger(integer)) {
      throw new Error('bencode only support encode integer')
    }
    // 数字的编码格式为:'i' + 数字 + 'e'
    // 例如:i3e或者 i-5e
    await this.buffer.write(this.te.encode(`i${integer}e`))
  }

  /**
   * 编码列表
   * @param list
   */
  private async encodeList(list: BencodeList) {
    logd(` start encodeList`)
    await this.buffer.write(this.te.encode('l'))
    // 遍历列表中的元素
    for (const element of list) {
      logd(` start itre ${element}`)
      // 递归调用Encode方法,编码列表中的元素
      await this.encode(element)
    }
    logd(` end encodeList`)

    await this.buffer.write(this.te.encode('e'))
  }

  /**
   * 编码字典
   * @param dict
   */
  private async encodeDict(dict: BencodeDict) {
    // 字典的编码格式为:'d' + 字典中的key-value + 'e'
    await this.buffer.write(this.te.encode('d'))

    // 创建一个数组,用于存储字典的key
    const keys: string[] = Object.keys(dict)

    // 对数组进行排序
    keys.sort()

    // 遍历数组,将字典的key和value写入到buffer
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i]

      // 写入 key:
      logd(` start encode key ${k}`)
      await this.encodeByteString(k)

      // 写入 value
      const value = dict[k]
      await this.encode(value)
    }

    // 写入结束符 e
    await this.buffer.write(this.te.encode('e'))
  }
}
