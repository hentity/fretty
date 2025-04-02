use wasm_bindgen::prelude::*;
use rustfft::{FftPlanner, num_complex::Complex};

#[wasm_bindgen]
pub fn analyse(samples: &js_sys::Float32Array) -> String {
    let mut planner = FftPlanner::new();
    let fft = planner.plan_fft_forward(samples.length() as usize);
    let mut buffer: Vec<Complex<f32>> = samples.to_vec().iter().map(|&x| Complex::new(x, 0.0)).collect();
    fft.process(&mut buffer);

    format!("FFT complete, processed {} samples.", buffer.len())
}

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {} (from rust).", name)
}
