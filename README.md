# [bencode](https://deno.land/x/dt_bencode) [![Custom badge](https://img.shields.io/endpoint?url=https%3A%2F%2Fdeno-visualizer.danopia.net%2Fshields%2Flatest-version%2Fx%2Fdt_bencode%2Fmod.ts)](https://deno.land/x/dt_bencode)

Bencode encoding and decoding.

## Usage

### Encode

```typescript
  import { Bencoder } from 'https://deno.land/x/dt_bencode/mod.ts'

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

This is a simple way of use

```typescript
  import { Bdecoder } from 'https://deno.land/x/dt_bencode/mod.ts'

  // decode bitTorrent file
  const torrent = './ubuntu-22.04.2-live-server-amd64.iso.torrent'

  // create decoder
  const decoder = new Bdecoder()

  // if string is valid utf-8 string, it will be decoded to string, like 'hello'
  // or it will be decoded to Uint8Array string (it's a custom format), like 'Unit8Array[number, number, number, ...]', such as pieces in torrent file
  // d(source: BufReader | Uint8Array | Buffer, writer?: Writer): source can be Uint8Array or Buffer or BufReader, writer is optional,if you want to write result to stdout or file, you can pass a Writer
  const result = await decoder.d(Deno.readFileSync(torrent))
```

**!!!NOTE TAHT!!!**
**when decoding byte string, you will encounter two situations**

#### 1. Byte string as value of the dict

when decode torrent file, the pieces is a byte string, but is not a valid utf-8 string, so it will be convert to Unit8Array, like [number, number, number, ...],the number is a byte

``` typescript

  //  when decode torrent file, result is a js object, like this:
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
  //   "pieces": [42,56,162,55,...]
  
```

#### 2. Byte string as key of the dict

when decode a response of a tracker scrape, such as `https://torrent.ubuntu.com/scrape`

part of response is below:

```txt
d5:filesd20:Fx��x0�Wsz�����O�d8:completei38e10:downloadedi0e10:incompletei0e4:name33:lubuntu-16.04.6-desktop-amd64.isoe20:��+\0��*aT�5q��L�d8:completei312e10:downloadedi7e10:incompletei12e4:name36:ubuntu-18.04.6-live-server-amd64.isoe20:���<�!�ɺ��S����d8:completei25e10:downloadedi0e10:incompletei0e4:name32:kubuntu-16.04.6-desktop-i386.isoe20:#ܷx] �����t'zf��d8:completei184e10:downloadedi5e10:incompletei9e4:name37:ubuntu-mate-22.04.3-desktop-amd64.isoe20:���D��429...

```

Obviously, each key of the files dict is infohash(20 bytes), it's a invalid utf-8 string.

So, when decode a response of a tracker scrape, the invliad utf-8 key will be converted to a **"Unit8Array[number, number, number, ...]" string**

like this:

```json
{
  files: {
    "Unit8Array[0,70,120,242,226,120,16,48,188,87,115,122,135,250,247,170,251,23,79,248]": {
      complete: 38,
      downloaded: 0,
      incomplete: 0,
      name: "lubuntu-16.04.6-desktop-amd64.iso"
    },
    "Unit8Array[0,178,28,249,43,92,48,207,246,42,18,97,84,194,53,113,151,154,76,171]": {
      complete: 310,
      downloaded: 6,
      incomplete: 12,
      name: "ubuntu-18.04.6-live-server-amd64.iso"
    }
}

```

if you want to confirm the key is a Unit8Array string or not, you can use `Bdecoder.isByteKey` function

```typescript
  import { Bdecoder } from 'https://deno.land/x/dt_bencode/mod.ts'

  const key = 'Unit8Array[0,70,120,242,226,120,16,48,188,87,115,122,135,250,247,170,251,23,79,248]'

  const result = Bdecoder.isByteKey(key) // true

```

if you want to convert it to Unit8Array:

```typescript
  import { Bdecoder } from 'https://deno.land/x/dt_bencode/mod.ts'

  const key = 'Unit8Array[0,70,120,242,226,120,16,48,188,87,115,122,135,250,247,170,251,23,79,248]'

  if(Bdecoder.isByteKey(key)){
    const result = Bdecoder.byteKeyToUint8Array(key)
    // [0,70,120,242,226,120,16,48,188,87,115,122,135,250,247,170,251,23,79,248]
  }

```

## Test

```bash
deno task test

# running 16 tests from ./test/decoder.test.ts
# decode string ... ok (10ms)
# decode empty string ... ok (6ms)
# decode number ... ok (5ms)
# decode negative number ... ok (6ms)
# decode zero ... ok (4ms)
# decode max number ... ok (5ms)
# decode min number ... ok (5ms)
# decode simple list ... ok (6ms)
# decode complex list ... ok (6ms)
# encdoe empty list ... ok (4ms)
# decode list with empty string ... ok (4ms)
# decode dictionary ... ok (5ms)
# decode dictionary sort ... ok (4ms)
# decode empty dictionary ... ok (5ms)
# decode torrent ... ok (20ms)
# decode byte string as dict key ... ok (28ms)
# running 19 tests from ./test/encoder.test.ts
# encode string ... ok (10ms)
# encode utf-8 string ... ok (5ms)
# encode empty string ... ok (5ms)
# encode buffer string ... ok (6ms)
# encode Uint8Array string ... ok (3ms)
# encode number ... ok (4ms)
# encode negative number ... ok (5ms)
# encode zero ... ok (5ms)
# encode max number ... ok (5ms)
# encode min number ... ok (5ms)
# encode float number will throw error ... ok (5ms)
# encode simple list ... ok (5ms)
# encode complex list ... ok (4ms)
# encdoe empty list ... ok (4ms)
# encode list with empty string ... ok (4ms)
# encode dictionary ... ok (5ms)
# encode dictionary sort ... ok (5ms)
# encode empty dictionary ... ok (4ms)
# encode complex dictionary ... ok (5ms)
# running 1 test from ./test/utf8.test.ts
# isUtf8 function ... ok (10ms)

# ok | 36 passed | 0 failed (373ms)
```
