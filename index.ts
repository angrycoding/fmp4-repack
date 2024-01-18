import FS from 'fs';
import Fragmenter from './fragmenter';


const readFileUint8 = (path) => {
	return new Uint8Array(FS.readFileSync(path))
}

const fragmenter = new Fragmenter();


const buf = [
	fragmenter.push(readFileUint8('./test-1minute/output000.mp4')),
]


// const buf = [];
// for (let c = 0; c <= 0; c++) {
// 	const fragment = fragmenter.push(readFileUint8(`./test-1minute/output${String(c).padStart(3, '0')}.mp4`));
// 	buf.push(fragment);
// }

FS.writeFileSync('./0.mp4', Buffer.concat(buf));

// FS.writeFileSync('./0.mp4', Buffer.concat([
// 	fragmenter.push(readFileUint8('./videofrags/1.mp4')),
// 	fragmenter.push(readFileUint8('./videofrags/2.mp4')),
// 	fragmenter.push(readFileUint8('./videofrags/3.mp4')),
// 	fragmenter.push(readFileUint8('./videofrags/4.mp4')),
// 	fragmenter.push(readFileUint8('./videofrags/5.mp4')),
// 	fragmenter.push(readFileUint8('./videofrags/6.mp4')),
// 	fragmenter.push(readFileUint8('./videofrags/7.mp4')),
// 	fragmenter.push(readFileUint8('./videofrags/8.mp4')),
// ]));