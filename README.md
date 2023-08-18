# [bencode](https://deno.land/x/dt_bencode) [![Custom badge](https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Flatest-version%2Fx%2Fdt_bencode%2Fmod.ts)](https://deno.land/x/dt_bencode)

Bencode encoding and decoding.

## Usage

### Encode

```typescript
  import { Bencoder } from 'https://deno.land/x/dt_bencode@0.0.1/mod.ts'

  const data = 'hello'
  // const data = 123
  // const data = [1, 2, 3]
  // const data = { a: 1, b: 2, c: 3 }
  // const data = { a: [1, 2, 3], b: { c: 1, d: 2, e: 3 } }

  // create encoder
  const encoder = new Bencoder()

  // encode result is a Unit8Array
  // if encode a 'hello' string, result is [53, 58, 104, 101, 108, 108, 111], whitch is '5:hello' ascii code array
  const result = await encoder.e(data)

  // write to file
  Deno.writeFileSync('./bencode', result)

  // open with text editor, you will see '5:hello' string.

```

### Decode

```typescript
  import { Bdecoder } from 'https://deno.land/x/dt_bencode@0.0.1/mod.ts'

  // decode bitTorrent file
  const torrent = './ubuntu-22.04.2-live-server-amd64.iso.torrent'

  // create decoder
  const decoder = new Bdecoder()

  // if string is valid utf-8 string, it will be decoded to string, like 'hello'
  // or it will be decoded to Uint8Array, like [number, number, number, ...], such as pieces in torrent file
  // d(source: BufReader | Uint8Array | Buffer, writer?: Writer): source can be Uint8Array or Buffer or BufReader, writer is optional,if you want to write result to stdout or file, you can pass a Writer
  const result = await decoder.d(Deno.readFileSync(torrent))

  // result is a object, like this:

  // {
  // "announce": "https://torrent.ubuntu.com/announce",
  // "announce-list": [
  //   [
  //     "https://torrent.ubuntu.com/announce"
  //   ],
  //   [
  //     "https://ipv6.torrent.ubuntu.com/announce"
  //   ]
  // ],
  // "comment": "Ubuntu CD releases.ubuntu.com",
  // "created by": "mktorrent 1.1",
  // "creation date": 1677174459,
  // "info": {
  //   "length": 1975971840,
  //   "name": "ubuntu-22.04.2-live-server-amd64.iso",
  //   "piece length": 262144,
  //   "pieces": [
  //     42,
  //     56,
  //     162,
  //     55,
  // ....
```

## Test

```bash
deno task test

# running 15 tests from ./test/decoder.test.ts
# decode string ... ok (7ms)
# decode empty string ... ok (5ms)
# decode number ... ok (3ms)
# decode negative number ... ok (4ms)
# decode zero ... ok (4ms)
# decode max number ... ok (4ms)
# decode min number ... ok (3ms)
# decode simple list ... ok (4ms)
# decode complex list ... ok (4ms)
# encdoe empty list ... ok (4ms)
# decode list with empty string ... ok (4ms)
# decode dictionary ... ok (5ms)
# decode dictionary sort ... ok (5ms)
# decode empty dictionary ... ok (10ms)
# decode torrent ... ok (18ms)
# running 19 tests from ./test/encoder.test.ts
# encode string ... ok (6ms)
# encode utf-8 string ... ok (4ms)
# encode empty string ... ok (3ms)
# encode buffer string ... ok (5ms)
# encode Uint8Array string ... ok (4ms)
# encode number ... ok (4ms)
# encode negative number ... ok (4ms)
# encode zero ... ok (4ms)
# encode max number ... ok (4ms)
# encode min number ... ok (4ms)
# encode float number will throw error ... ok (5ms)
# encode simple list ... ok (4ms)
# encode complex list ... ok (4ms)
# encdoe empty list ... ok (4ms)
# encode list with empty string ... ok (4ms)
# encode dictionary ... ok (4ms)
# encode dictionary sort ... ok (4ms)
# encode empty dictionary ... ok (4ms)
# encode complex dictionary ... ok (4ms)
# running 1 test from ./test/utf8.test.ts
# isUtf8 function ... ok (10ms)
```
