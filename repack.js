const FS = require('fs');
const MP4Box = require('mp4box');
const MP4Generator = require('./MP4Generator');

const getFragmentInfo = (path) => {

	const data = FS.readFileSync(path);

	var mp4boxfile = MP4Box.createFile();
	var arrayBuffer = new Uint8Array(data).buffer;
	arrayBuffer.fileStart = 0;
	mp4boxfile.appendBuffer(arrayBuffer);

	// console.info(JSON.stringify(mp4boxfile, null, '\t'));
	// throw 1;

	const mdatSection = mp4boxfile.mdats[0];
	let mdatSectionData = data.subarray(mdatSection.start + 8, mdatSection.start + mdatSection.size);

	// console.info('TOTAL_MDAT_LEN', mdatSectionData.length)

	// const result = {
	// 	mdat: mdatSectionData,
	// 	tracks: []
	// }
	// console.info(mp4boxfile)
	// console.info(mp4boxfile.moov.traks)

	const result = mp4boxfile.moov.traks.map(trak => {

		
		
		console.info('---------------- ' + path + '-----------------------------')

		// let durations = 0;
		// let cts = 0;
		// let dts = 0;


		// trak.samples.forEach(s => {
		// 	console.info(s.cts)
		// 	durations+=s.duration;
		// 	cts+=s.cts;
		// 	dts+=s.dts;
		// })
		// console.info({ durations, cts, dts })
		// console.info(trak.samples)

		let codecData = Buffer.from([]);

		for (entry of trak.mdia.minf.stbl.stsd.entries) {
			codecData = Buffer.concat([
				codecData,
				data.subarray(
					entry.start,
					entry.start + entry.size
				)
			])
			// console.info(entry)
			// console.info(entry.start);
			// console.info(data.readUInt32BE(entry.start));
		}

		// throw 1;
		
// console.info(trak);
// throw 1;
		return {
			timescale: trak.mdia.mdhd.timescale,
			id: trak.tkhd.track_id,
			duration: trak.tkhd.duration,
			codecData,
			originalData: Buffer.concat([data]),
			mdatSectionData,
			samples: trak.samples,
			mdat: Buffer.from([])
		}
	});

	const chunk_offsets = [];
	for (const trak of mp4boxfile.moov.traks) {
		// console.info(trak.mdia.minf.stbl.stco.chunk_offsets)
		chunk_offsets.push(
			...trak.mdia.minf.stbl.stco.chunk_offsets
		);
	}

	chunk_offsets.sort((a, b) => a - b);

	// console.info(result[0]?.samples)
	// console.info(result[1]?.samples)

	let trackNumber = 0;


	while (chunk_offsets.length) {
		const [ start, end ] = [chunk_offsets.shift(), chunk_offsets[0]];
		const chunkLen = end - start;
		
		// console.info(trackNumber % result.length, chunkLen);
		// console.info({
		// 	trackNumber: trackNumber % result.length,
		// 	start, end,
		// 	chunkLen
		// 	// data: data.subarray(start, end - 1)
		// });

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

	// console.info(result[0].mdat.length)
	// console.info(result[1].mdat.length)
	// console.info(result[0].mdat.length + result[1].mdat.length)


	// for (const trak of mp4boxfile.moov.traks) {
	// 	console.info(trak.mdia.minf.stbl.stco)
	// 	// result.tracks.push({
	// 	// 	id: trak.tkhd.track_id,
	// 	// 	samples: trak.mdia.minf.stbl.stsz.sample_sizes.map(size => ({ size })),
	// 	// });
	// }

	return result;

}



let info = getFragmentInfo('./videofrags/1.mp4');
var init = MP4Generator.initSegment(info, Infinity, 1);

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
