import { Writer } from 'std/types.d.ts'
import { BufReader, Buffer } from './deps.ts'
import { logd } from './log.ts'
import { BencodeDict, BencodeInteger, BencodeList, BencodeString, BencodeType } from './type.ts'
import { isUtf8 } from './util.ts'
export class Bdecoder {
  private td = new TextDecoder('utf-8')
  private te = new TextEncoder()

  public async d(source: BufReader | Uint8Array | Buffer, writer?: Writer) {
    let reader: BufReader
    if (source instanceof BufReader) {
      reader = source
    } else if (source instanceof Uint8Array) {
      reader = new BufReader(new Buffer(source))
    } else if (source instanceof Buffer) {
      reader = new BufReader(source)
    } else {
      throw new Error('reader type error')
    }

    // 解码数据
    const data = await this.decode(reader)

    // 如果传入了writer,则写入到writer中
    if (writer) {
      writer.write(Uint8Array.from(this.te.encode(JSON.stringify(data, null, 2))))
    }

    // 返回解码后的数据
    return data
  }

  private async decode(reader: BufReader): Promise<BencodeType | null> {
    // 读取头部字节,用于判断需要解析的数据类型
    // peek方法不会移动游标
    const bytes = await reader.peek(1)

    if (bytes == null || bytes.length === 0) {
      logd('[decode] head bytes is null, return null')
      return null
    }

    logd(`[decode] read next byte ${this.td.decode(bytes)}`)

    switch (String.fromCharCode(bytes[0])) {
      case 'i':
        logd(`[decode] start parse integer`)
        // 消耗掉头字节
        await reader.readByte()
        // 解码整数值
        return await this.decodeInteger(reader)
      case 'l':
        logd(`[decode] start parse list`)
        // 消耗掉头字节
        await await reader.readByte()
        // 解码列表
        return this.decodeList(reader)
      case 'd':
        logd(`[decode] start parse dict`)
        // 消耗掉头字节
        await reader.readByte()
        // 解码字典
        return await this.decodeDict(reader)
      default:
        // 除开上面三种类型,剩下的都是字节字符串
        logd(`[decode] start parse byte string`)
        // 回退游标,因为这里的头字节是长度的一部分或者长度本身,例如5:hello,后面需要用于截取指定长度的字符串
        // 解码字符串
        return await this.decodeByteString(reader)
    }
  }

  private async decodeInteger(reader: BufReader): Promise<BencodeInteger> {
    logd(`[decodeInteger] start read int bytes length`)

    // 读取直到遇到'e'字节为止
    const intBuffer = await this.readUntil(reader, 'e')

    // 转换成数字
    const integer = parseInt(this.td.decode(intBuffer))

    logd(`[decodeInteger] decoded integer is ${integer}`)

    return integer
  }

  private async decodeByteString(reader: BufReader): Promise<BencodeString | number[]> {
    logd(`[decodeByteString] start read string bytes length`)

    // 获取字符串的长度
    const lengthBuffer = await this.readUntil(reader, ':')

    logd(`[decodeByteString] readed lengthBuffer value is ${lengthBuffer}`)

    // 转换成数字
    const length = parseInt(this.td.decode(lengthBuffer))

    logd(`[decodeByteString] next string bytes length is ${length}`)

    // 根据长度读取字符串对应的字节数组
    // 不要使用read,read不保证能够读取到指定长度的字节,例如read(5),但是缓冲区只有4个字节,那么就会返回4个字节
    // 但是readFull会一直读取,直到读取到指定长度的字节
    const stringBytes = await reader.readFull(new Uint8Array(length))

    if (stringBytes == null) {
      throw new Error('read string bytes error')
    }

    logd(`[decodeByteString] readed stringBuffer length is ${stringBytes ? stringBytes.length : 0}`)

    const result = this.td.decode(stringBytes)

    //  如果是utf8编码，转成字符串,不然后面转成json会是乱码
    if (isUtf8(stringBytes)) {
      return result
    }

    logd(`[decodeByteString] string is not utf8, return Uint8Array`)
    return stringBytes
  }

  /**
   * 解码列表,例如 l5:helloe 或者 l5:helloi123ee,也就是["hello"]或者["hello",123]
   * @returns list
   */
  private async decodeList(reader: BufReader): Promise<BencodeList> {
    const list = []

    while (true) {
      // 用peek读取下个字节,但是不移动游标
      const bytes = await reader.peek(1)

      // 如果读取到的是null,说明已经读取到了文件末尾,解析完毕
      if (bytes === null || bytes.length === 0) {
        break
      }

      // 如果读取到的是'e',继续解析下一个字节
      if (String.fromCharCode(bytes[0]) === 'e') {
        // 记得消耗掉'e'字节
        await reader.readByte()
        break
      }

      const item = await this.decode(reader)

      if (item == null) break

      list.push(item)
    }

    return list
  }

  /**
   * 解码字典
   * @returns object
   */
  private async decodeDict(reader: BufReader): Promise<BencodeDict> {
    const obj = {} as any
    while (true) {
      // 用peek读取下个字节,但是不移动游标
      const bytes = await reader.peek(1)

      // 如果读取到的是null,说明已经读取到了文件末尾,解析完毕
      if (bytes === null || bytes.length === 0) {
        break
      }

      // 如果读取到的是'e',继续解析下一个字节
      if (String.fromCharCode(bytes[0]) === 'e') {
        // 记得消耗掉'e'字节
        await reader.readByte()
        break
      }

      logd(`[decodeDict] start parse dict key`)
      // 解析key
      const key = (await this.decodeByteString(reader)).toString()

      logd(`[decodeDict] key is '${key}'`)

      logd(`[decodeDict] start parse dict value`)
      // 解析value
      obj[key] = await this.decode(reader)
      // logd(`[decodeDict] value is '${JSON.stringify(obj[key])}'`)
    }

    return obj
  }

  /**
   * 从字节流读取直到遇到stop字节为止，返回读取到的字符串
   * 注意: stop 字节已经被读取过了,游标已经移动到下一个字节
   * @param stop
   */
  private async readUntil(reader: BufReader, stop: string): Promise<Uint8Array> {
    logd(`[readUntil] '${stop}'`)

    // 用于存储读取到的字节
    const buffer: Buffer = new Buffer()

    while (true) {
      // 消耗一个字节
      const byte = await reader.readByte()

      logd(`[readUntil] readed bytes is ${byte}`)

      // 如果读取到的是null,说明已经读取到了文件末尾,但是都没有遇到stop字节,说明文件格式错误
      if (byte === null) {
        throw new Error(`read until '${stop}' error, reached end of file`)
      }

      // 读取到的字节是stop字节,则返回
      if (String.fromCharCode(byte) === stop) {
        logd(`[readUntil] reached stop char`)
        break
      }

      // 拼接字节
      buffer.write(Uint8Array.from([byte]))
    }

    return buffer.bytes()
  }
}
