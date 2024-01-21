# Fragmented mp4 (fmp4) repacker

You've got bunch of mp4 files and you want to make a solid stream out of them? This library is exactly for this purpose.
This was made for [Telegram Contest for JavaScript Developers, Round 1](https://t.me/contest/357) especially for it's first part (streaming).

### What is fmp4 and why you need them for streaming

Imagine that you have one mp4 file that you want to play in your web-browser, also imagine that this mp4 file has size around 250Mb. You just
create <video /> tag set link to that file and voila, your browser will have to download whole 250Mb before it can actually start playing it? Why?

Secret is hidden in mp4 file structure. Mp4 files are represented in tree - like structure. To get yourself familiar with it, just get any mp4 file
and upload it here: [https://gpac.github.io/mp4box.js/test/filereader.html](https://gpac.github.io/mp4box.js/test/filereader.html). You'll get something like this:

![image](https://github.com/angrycoding/fmp4-repack/assets/895042/9e447043-0096-462c-a062-86f67341d3d3)

See this ftyp, free, mdat and moov? It's called boxes or atoms. Each atom represent some specific bit of information which is important for the video player to
play it. Different atoms holds different kind of information, some of them are not mandatory, other ones are really important. Here we interested in atoms called moov and mdat.

### Moov atom

> The moov atom aka movie atom, defines the timescale, duration, and display characteristics of the movie, as well as sub-atoms containing information for each track in the movie.

So this thing contains all informations that is needed for the player to understand what is this file, how to play it, where is the actual data and so on so on. So our first problem is
that by default, this moov atom is located at the end of mp4 file. Meaning that browser will have to download whole file to understand what's in it.

### Mdat atom

This section contains actual data together for audio and video in one huge blob.

So if we somehow could move this moov atom to the beginning, then browser could possibly start playing the file right away. Problem solved. For one file. But what if we have bunch of files
and we want to play it one after another? We could just restructure our mp4 file and make it look like moov mdat moov mdat? Unfortunately not, because one mp4 file can only contain one moov section.
This is solved by so called "fragmented mp4".

### Fragmented mp4

Not much to say here, just read this document [https://www.ramugedia.com/mp4-container](https://www.ramugedia.com/mp4-container) to understand the theory. So the idea is that at the end
we have to have moov moof mdat moof mdat moof mdat. Sounds easy right?

# Library usage

```typescript
import FS from 'fs';
import Fragmenter from './src/fragmenter';

const readFileUint8 = (path: string) => {
	return new Uint8Array(FS.readFileSync(path))
}

const fragmenter = new Fragmenter();

FS.writeFileSync('./0.mp4', Buffer.concat([
	fragmenter.push(readFileUint8('./videofrags/0.mp4')).data,
	fragmenter.push(readFileUint8('./videofrags/1.mp4')).data,
	fragmenter.push(readFileUint8('./videofrags/2.mp4')).data,
	fragmenter.push(readFileUint8('./videofrags/3.mp4')).data,
	fragmenter.push(readFileUint8('./videofrags/4.mp4')).data,
	fragmenter.push(readFileUint8('./videofrags/5.mp4')).data,
	fragmenter.push(readFileUint8('./videofrags/6.mp4')).data,
	fragmenter.push(readFileUint8('./videofrags/7.mp4')).data,
	fragmenter.push(readFileUint8('./videofrags/8.mp4')).data,
	fragmenter.push(readFileUint8('./videofrags/9.mp4')).data,
]));
```

Yeah well, I know it's not library, just need some time to make this tsconfig, rollup and all that important stuff so you can just yarn add it. I'll do it when I'll have some time.
