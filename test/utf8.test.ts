import { isUtf8 } from '../src/util.ts'
import { assertEquals } from './deps.ts'

Deno.test('isUtf8 function', () => {
  assertEquals(isUtf8(new Uint8Array([0xe4, 0xb8, 0xad, 0xe6, 0x96, 0x87])), true)
  assertEquals(isUtf8(new Uint8Array([0x80, 0x80, 0x80, 0x80])), false)
  assertEquals(isUtf8(new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f])), true)
  assertEquals(isUtf8(new Uint8Array([0xff, 0xfe, 0x41, 0x42])), false)
  assertEquals(isUtf8('你好，世界！'), true)
  assertEquals(isUtf8('\x00'), true)
  assertEquals(isUtf8(''), true)
  assertEquals(isUtf8(new Uint8Array([0x80])), false)
  assertEquals(isUtf8(new Uint8Array([])), true)
  assertEquals(
    isUtf8(
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque gravida mattis rhoncus. Donec iaculis, metus quis varius accumsan, erat mauris condimentum diam, et egestas erat enim ut ligula. Praesent sollicitudin tellus eget dolor euismod euismod. Nullam ac augue nec neque varius luctus. Curabitur elit mi, consequat ultricies adipiscing mollis, scelerisque in erat. Phasellus facilisis fermentum ullamcorper. Nulla et sem eu arcu pharetra pellentesque. Praesent consectetur tempor justo, vel iaculis dui ullamcorper sit amet. Integer tristique viverra ullamcorper. Vivamus laoreet, nulla eget suscipit eleifend, lacus lectus feugiat libero, non fermentum erat nisi at risus. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut pulvinar dignissim tellus, eu dignissim lorem vulputate quis. Morbi ut pulvinar augue.'
    ),
    true
  )

  assertEquals(
    isUtf8(
      new Uint8Array([
        0xce, 0xba, 0xe1, 0xbd, 0xb9, 0xcf, 0x83, 0xce, 0xbc, 0xce, 0xb5, 0xed, 0xa0, 0x80, 0x65, 0x64, 0x69, 0x74,
        0x65, 0x64
      ])
    ),
    false
  )
})
