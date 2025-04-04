fn main() {
    let sample_rate = 44100;
    let len = 44100;
    let freq = 440.0;

    // test signal: sine wave at 440 Hz
    let signal: Vec<f32> = (0..len)
        .map(|i| (2.0 * std::f32::consts::PI * freq * i as f32 / sample_rate as f32).sin())
        .collect();

    let dominant = audio_utils::fundamental_frequency(&signal, sample_rate);

    match dominant {
        Some(f) => println!("Dominant frequency: {:.2} Hz", f),
        None => println!("No dominant frequency found"),
    }
}
