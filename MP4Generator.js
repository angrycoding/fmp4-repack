const MP4 = {};

MP4.box = (type, ...payload) => {

	type = type.split('').map(ch => ch.charCodeAt(0));

	let size = 8;
	for (let _a = 0, payload_1 = payload; _a < payload_1.length; _a++) {
		const p = payload_1[_a];
		size += p.byteLength;
	}
	const result = new Uint8Array(size);
	result[0] = (size >> 24) & 0xff;
	result[1] = (size >> 16) & 0xff;
	result[2] = (size >> 8) & 0xff;
	result[3] = size & 0xff;
	result.set(type, 4);
	size = 8;
	for (let _b = 0, payload_2 = payload; _b < payload_2.length; _b++) {
		const box = payload_2[_b];
		result.set(box, size);
		size += box.byteLength;
	}
	return result;
}

MP4.mdat = (data) => {
	return MP4.box('mdat', data);
}

MP4.mdhd = (timescale) => {
	return MP4.box('mdhd', new Uint8Array([
		// version
		0x00,
		// flags
		0x00, 0x00, 0x00,
		// creation time (in seconds since midnight, January 1, 1904)
		0x00, 0x00, 0x00, 0x00,
		// modification time
		0x00, 0x00, 0x00, 0x00,
		// time scale
		(timescale >> 24) & 0xFF,
		(timescale >> 16) & 0xFF,
		(timescale >> 8) & 0xFF,
		timescale & 0xFF,
		// duration
		0x00, 0x00, 0x00, 0x00,
		// language
		0x55, 0xc4,
		// quality
		0x00, 0x00,
	]));
}

MP4.mfhd = (sequenceNumber) => {
	return MP4.box('mfhd', new Uint8Array([
		0x00,
		0x00, 0x00, 0x00,
		// sequence number
		(sequenceNumber >> 24),
		(sequenceNumber >> 16) & 0xFF,
		(sequenceNumber >> 8) & 0xFF,
		sequenceNumber & 0xFF,
	]));
}

MP4.trex = (track) => {
	const id = track.id;
	return MP4.box('trex', new Uint8Array([
		// flags
		0x00, 0x00, 0x00, 0x00,
		// track id
		(id >> 24),
		(id >> 16) & 0XFF,
		(id >> 8) & 0XFF,
		(id & 0xFF),
		// default_sample_description_index
		0x00, 0x00, 0x00, 0x01,
		// default_sample_duration
		0x00, 0x00, 0x00, 0x3c,
		// default_sample_size
		0x00, 0x00, 0x00, 0x00,
		// default_sample_flags;
		0x00, 0x01, 0x00, 0x00,
	]));
}

MP4.moof = (sn, baseMediaDecodeTime, track) => {
	return MP4.box('moof', MP4.mfhd(sn), MP4.traf(track, baseMediaDecodeTime));
}

MP4.mvex = (tracks) => {
	return MP4.box('mvex', ...tracks.map(MP4.trex));
}

MP4.stsd = (track) => {
	return MP4.box(
		'stsd',
		new Uint8Array([
			// version
			0x00,
			// flags
			0x00, 0x00, 0x00,
			// entry count
			0x00, 0x00, 0x00, 0x01
		]),
		new Uint8Array(track.codecData)
	);
}

MP4.moov = (tracks, duration, timescale) => {
	return MP4.box(
		'moov',
		MP4.mvhd(timescale, duration),
		MP4.mvex(tracks),
		...tracks.map(MP4.trak)
	);
}

MP4.stbl = (track) => {
	return MP4.box(
		'stbl',
		
		// Sample description atom
		MP4.stsd(track),
		
		// Time-to-sample atom
		MP4.box('stts', new Uint8Array([
			0x00,
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00,
		])),
		
		// Sample-to-chunk atom
		MP4.box('stsc', new Uint8Array([
			0x00,
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00,
		])),

		// Sample Size atom
		MP4.box('stsz', new Uint8Array([
			0x00,
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00,
		])),

		// Chunk Offset atom
		MP4.box('stco', new Uint8Array([
			0x00,
			0x00, 0x00, 0x00,
			0x00, 0x00, 0x00, 0x00,
		]))
	);
}




MP4.FTYP = MP4.box('ftyp', new Uint8Array([
	0x69, 0x73, 0x6f, 0x35,
	0x00, 0x00, 0x00, 0x01,
	0x61, 0x76, 0x63, 0x31,
	0x69, 0x73, 0x6f, 0x35,
	0x64, 0x61, 0x73, 0x68,
]));



MP4.mdia = (track) => {
	return MP4.box('mdia', MP4.mdhd(track.timescale), /*MP4.HDLR,*/ MP4.minf(track));
}

MP4.minf = (track) => {
	return MP4.box('minf', MP4.box('vmhd', new Uint8Array([
		0x00,
		0x00, 0x00, 0x01,
		0x00, 0x00,
		0x00, 0x00,
		0x00, 0x00,
		0x00, 0x00,
	])), /*MP4.DINF,*/ MP4.stbl(track));
}

MP4.mvhd = (timescale, duration) => {
	return MP4.box('mvhd', new Uint8Array([
		0x00,
		0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		(timescale >> 24) & 0xFF,
		(timescale >> 16) & 0xFF,
		(timescale >> 8) & 0xFF,
		timescale & 0xFF,
		(duration >> 24) & 0xFF,
		(duration >> 16) & 0xFF,
		(duration >> 8) & 0xFF,
		duration & 0xFF,
		0x00, 0x01, 0x00, 0x00,
		0x01, 0x00,
		0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x01, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x01, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x40, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x02,
	]));
}

MP4.tkhd = (track) => {
	const { id, width, height } = track;
	return MP4.box('tkhd', new Uint8Array([
		0x00,
		0x00, 0x00, 0x01,
		0x00, 0x00, 0x00, 0x01,
		0x00, 0x00, 0x00, 0x02,
		(id >> 24) & 0xFF,
		(id >> 16) & 0xFF,
		(id >> 8) & 0xFF,
		id & 0xFF,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00,
		0x00, 0x00,
		(track.type === 'audio' ? 0x01 : 0x00), 0x00,
		0x00, 0x00,
		0x00, 0x01, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x01, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x00, 0x00, 0x00, 0x00,
		0x40, 0x00, 0x00, 0x00,
		(width >> 8) & 0xFF,
		width & 0xFF,
		0x00, 0x00,
		(height >> 8) & 0xFF,
		height & 0xFF,
		0x00, 0x00,
	]));
}

MP4.traf = (track, baseMediaDecodeTime) => {
	
	
	const id = track.id;
	const duration = track.samples[0].duration;
	console.info({duration});
	// throw 1;


	return MP4.box('traf', MP4.box('tfhd', new Uint8Array([
		// 8
		0x00,
		0x00, 0x00, 0x38,
		(id >> 24),
		(id >> 16) & 0XFF,
		(id >> 8) & 0XFF,
		(id & 0xFF),

		(duration >> 24),
		(duration >> 16) & 0XFF,
		(duration >> 8) & 0XFF,
		(duration & 0xFF),

		// 0x00, 0x00, 0x02, 0x80,
		0x00, 0x00, 0x12, 0x61,
		0x01,0x01,0x00,0x00
		
	])), MP4.box('tfdt', new Uint8Array([
		// 8
		0x00,
		0x00, 0x00, 0x00,
		(baseMediaDecodeTime >> 24),
		(baseMediaDecodeTime >> 16) & 0XFF,
		(baseMediaDecodeTime >> 8) & 0XFF,
		(baseMediaDecodeTime & 0xFF),
	])), MP4.trun(track, 16 +
		16 +
		8 +
		16 +
		8 +
		4 + 
		4 +
		4 +
		8));
}

MP4.trak = (track) => {
	track.duration = track.duration || 0xffffffff;
	return MP4.box('trak', MP4.tkhd(track), MP4.mdia(track));
}

MP4.trun = (track, offset) => {
	const samples = track.samples || [];
	const len = samples.length;
	track.isKeyFrame = true;
	const additionalLen = track.isKeyFrame ? 4 : 0;
	const arraylen = 12 + additionalLen + ((4 + 4 + 0) * len);
	const array = new Uint8Array(arraylen);
	offset += 8 + arraylen;
	array.set([
		0x00,
		0x00, 0x0A, (track.isKeyFrame ? 0x05 : 0x01),
		(len >>> 24) & 0xFF,
		(len >>> 16) & 0xFF,
		(len >>> 8) & 0xFF,
		len & 0xFF,
		(offset >>> 24) & 0xFF,
		(offset >>> 16) & 0xFF,
		(offset >>> 8) & 0xFF,
		offset & 0xFF,
	], 0);

	if (track.isKeyFrame) {
		array.set([
			0x02, 0x00, 0x00, 0x00,
		], 12);
	}

	// console.info(JSON.stringify(Array.from(array)))
	
	for (let i = 0; i < len; i++) {
		const sample = samples[i];
		// console.info(sample);

		const { size, duration, cts, dts } = sample;
		const x = cts - dts;
		array.set([


			// (duration >>> 24) & 0xFF,
			// (duration >>> 16) & 0xFF,
			// (duration >>> 8) & 0xFF,
			// duration & 0xFF,

			(size >>> 24) & 0xFF,
			(size >>> 16) & 0xFF,
			(size >>> 8) & 0xFF,
			size & 0xFF,

			(x >>> 24) & 0xFF,
			(x >>> 16) & 0xFF,
			(x >>> 8) & 0xFF,
			x & 0xFF,
		], 12 + additionalLen + 8 * i);
	}
	return MP4.box('trun', array);
}

MP4.initSegment = (tracks, duration, timescale) => {
	const movie = MP4.moov(tracks, duration, timescale);
	const result = new Uint8Array(MP4.FTYP.byteLength + movie.byteLength);
	result.set(MP4.FTYP);
	result.set(movie, MP4.FTYP.byteLength);
	return result;
}

MP4.fragmentSegment = (baseMediaDecodeTime, track, payload) => {
	const moof = MP4.moof(0, baseMediaDecodeTime, track);
	const mdat = MP4.mdat(payload);
	const result = new Uint8Array(moof.byteLength + mdat.byteLength);
	result.set(moof, 0);
	result.set(mdat, moof.byteLength);
	return result;
}

module.exports = MP4;