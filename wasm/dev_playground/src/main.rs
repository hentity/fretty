use hound;

fn main() {
    let path = "../rsc/samples/A_0.wav";
    let (signal, sample_rate) = read_wav_file(path);

    let dominant = audio_utils::fundamental_frequency(&signal, sample_rate as usize);

    match dominant {
        Some(f) => println!("Dominant frequency: {:.2} Hz", f),
        None => println!("No dominant frequency found"),
    }
}

fn read_wav_file(path: &str) -> (Vec<f32>, u32) {
    let mut reader = hound::WavReader::open(path).expect("Failed to open WAV file");
    let spec = reader.spec();
    let sample_rate = spec.sample_rate;
    let bits_per_sample = spec.bits_per_sample;

    let samples: Vec<f32> = match spec.sample_format {
        hound::SampleFormat::Int => reader
            .samples::<i32>()
            .map(|s| {
                let s = s.unwrap();
                // Normalize to -1.0..1.0 based on bit depth
                s as f32 / (2_i32.pow(bits_per_sample as u32 - 1) as f32)
            })
            .collect(),
        hound::SampleFormat::Float => reader
            .samples::<f32>()
            .map(|s| s.unwrap())
            .collect(),
    };

    (samples, sample_rate)
}

