import MP4Box from 'mp4box';
import MP4Generator from './MP4Generator';

interface Track {
	id: number;
	mdat: Uint8Array
	timescale: number
	codecData: Uint8Array
	samples: {size: number, duration: number}[];
}

const concat = (arrays: Uint8Array[]): Uint8Array => {
	if (!arrays.length) return new Uint8Array(0);
	let totalLength = arrays.reduce((acc, value) => acc + value.length, 0);
	const result = new Uint8Array(totalLength);
	let length = 0;
	for (let array of arrays) {
		result.set(array, length);
		length += array.length;
	}
	return result;
}

const getFragmentInfo = (data: Uint8Array): Track[] | undefined => {

	const mp4boxfile = MP4Box.createFile();
	const arrayBuffer = new Uint8Array(data).buffer;
	// @ts-ignore
	arrayBuffer.fileStart = 0;
	mp4boxfile.appendBuffer(arrayBuffer);
	
	const result = mp4boxfile.moov.traks.map(trak => {
		const entries = trak.mdia.minf.stbl.stsd.entries;

		
		return {
			id: trak.tkhd.track_id,
			timescale: trak.mdia.mdhd.timescale,
			codecData: data.subarray(
				entries[0].start,
				entries[entries.length - 1].start + entries[entries.length - 1].size
			),
			samples: trak.samples,
			// .map(sample => ({
				// size: sample.size,
				// duration: sample.duration
			// })),
			mdat: Buffer.from([])
		}
	});





	// get offsets of all chunks for all tracks
	const chunk_offsets = [];
	for (const trak of mp4boxfile.moov.traks) {
		chunk_offsets.push(
			...trak.mdia.minf.stbl.stco.chunk_offsets
		);
	}
	// sort them
	chunk_offsets.sort((a, b) => a - b);



	let trackNumber = 0;
	const mdatSection = mp4boxfile.mdats[0];
	let mdatSectionData = data.subarray(mdatSection.start + 8, mdatSection.start + mdatSection.size);



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


	// while (chunk_offsets.length) {
	// 	const [ start, end ] = [chunk_offsets.shift(), chunk_offsets[0]];
	// 	const frag = data.subarray(start, end ? end : start + mdatlen);
	// 	result[trackNumber % result.length].mdat.push(frag);
	// 	trackNumber++;
	// }

	// for (const trak of result) {
	// 	trak.mdat = concat(trak.mdat);
	// }



	
	return result;

}

class Fragmenter {

	private timescales = [0, 0];
	private headerSent: boolean = false;
	private baseMediaDecodeTimes = [0, 0];

	push = (data: Uint8Array): Uint8Array => {

		const response = [];
		const tracks = getFragmentInfo(data);

		// console.info(tracks.map(t => t.timescale))
		if (!this.headerSent) {
			this.headerSent = true;
			for (let c = 0; c < tracks.length; c++) {
				this.timescales[c] = tracks[c].timescale;
			}
			response.push(MP4Generator.initSegment(tracks));
		}

		for (let c = 0; c < tracks.length; c++) {
			response.push(
				MP4Generator.fragmentSegment(
					this.baseMediaDecodeTimes[c],
					tracks[c],
					tracks[c].mdat
				)
			);
			this.baseMediaDecodeTimes[c] += this.timescales[c];
		}


		return concat(response);
		
	}
}

export default Fragmenter;