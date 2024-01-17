const FS = require('fs');
const MP4Box = require('mp4box');
const MP4Generator = require('./MP4Generator');

const getFragmentInfo = (path) => {

	const data = FS.readFileSync(path);

	var mp4boxfile = MP4Box.createFile();
	var arrayBuffer = new Uint8Array(data).buffer;
	arrayBuffer.fileStart = 0;
	mp4boxfile.appendBuffer(arrayBuffer);

	const mdatSection = mp4boxfile.mdats[0];
	let mdatSectionData = data.subarray(mdatSection.start + 8, mdatSection.start + mdatSection.size);

	const result = mp4boxfile.moov.traks.map(trak => {

		
		
		console.info('---------------- ' + path + '-----------------------------')

		let codecData = Buffer.from([]);

		for (entry of trak.mdia.minf.stbl.stsd.entries) {
			codecData = Buffer.concat([
				codecData,
				data.subarray(
					entry.start,
					entry.start + entry.size
				)
			])

		}

		return {
			id: trak.tkhd.track_id,
			timescale: trak.mdia.mdhd.timescale,
			codecData,
			samples: trak.samples,
			mdat: Buffer.from([])
		}
	});

	const chunk_offsets = [];
	for (const trak of mp4boxfile.moov.traks) {
		chunk_offsets.push(
			...trak.mdia.minf.stbl.stco.chunk_offsets
		);
	}

	chunk_offsets.sort((a, b) => a - b);

	let trackNumber = 0;


	while (chunk_offsets.length) {
		const [ start, end ] = [chunk_offsets.shift(), chunk_offsets[0]];
		const chunkLen = end - start;

		let frag = mdatSectionData;

		if (chunkLen) {
			frag = mdatSectionData.subarray(0, chunkLen);
			// console.info('frag.length', frag.length)
			mdatSectionData = mdatSectionData.subarray(chunkLen);
		}

		result[trackNumber % result.length].mdat = Buffer.concat([
			result[trackNumber % result.length].mdat,
			frag
		])


		trackNumber++;
	}

	
	return result;

}


let info = getFragmentInfo('./videofrags/1.mp4');
var init = MP4Generator.initSegment(info, 1);

const frags = [];


frags.push(MP4Generator.fragmentSegment(0, info[0], info[0].mdat));
frags.push(MP4Generator.fragmentSegment(0, info[1], info[1].mdat));


info = getFragmentInfo('./videofrags/2.mp4');
frags.push(MP4Generator.fragmentSegment(16000 * 1, info[0], info[0].mdat));
frags.push(MP4Generator.fragmentSegment(48000 * 1, info[1], info[1].mdat));

info = getFragmentInfo('./videofrags/3.mp4');
frags.push(MP4Generator.fragmentSegment(16000 * 2, info[0], info[0].mdat));
frags.push(MP4Generator.fragmentSegment(48000 * 2, info[1], info[1].mdat));

info = getFragmentInfo('./videofrags/4.mp4');
frags.push(MP4Generator.fragmentSegment(16000 * 3, info[0], info[0].mdat));
frags.push(MP4Generator.fragmentSegment(48000 * 3, info[1], info[1].mdat));


FS.writeFileSync('./0.mp4', Buffer.concat([init, Buffer.concat(frags)]));
