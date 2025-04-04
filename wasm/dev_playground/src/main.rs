use hound;

fn main() {
    let path = "../rsc/samples/E_0.wav";
    let correct_note = "E";
    let (signal, sample_rate) = read_wav_file(path);

    let interval_seconds = 0.5;
    let samples_per_chunk = (sample_rate as f32 * interval_seconds) as usize;

    let mut start = 0;
    let mut chunk_index = 0;

    let mut total_guesses = 0;
    let mut correct_guesses = 0;

    while start < signal.len() {
        let end = usize::min(start + samples_per_chunk, signal.len());
        let chunk = &signal[start..end];

        println!();

        let dominant = audio_utils::fundamental_frequency(chunk, sample_rate as usize);

        match dominant {
            Some(f) => {
                print!("Chunk {:>2}: {:.2} Hz", chunk_index, f);
                if let Some(note) = audio_utils::frequency_to_note(f) {
                    println!(" -> Closest note: {}", note);
                    total_guesses += 1;
                    if note == correct_note {
                        correct_guesses += 1;
                    }
                } else {
                    println!(" -> No note found matching this frequency");
                }
            }
            None => println!("Chunk {:>2}: No fundamental frequency found", chunk_index),
        }

        start += samples_per_chunk;
        chunk_index += 1;
    }

    // Calculate and print final score
    if total_guesses > 0 {
        let score = 100.0 * (correct_guesses as f32 / total_guesses as f32);
        println!("\nScore: {:.2}% ({} out of {} correct guesses)", score, correct_guesses, total_guesses);
    } else {
        println!("\nScore: 0.00% (No notes were guessed)");
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

