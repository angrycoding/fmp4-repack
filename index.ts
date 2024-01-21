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
