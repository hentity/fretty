use wasm_bindgen::prelude::*;
use js_sys::Float32Array;
use audio_utils::{fundamental_frequency, frequency_to_note};


#[wasm_bindgen]
pub fn detect_note(samples: &Float32Array, sample_rate: usize) -> Option<String> {
    let rust_samples = samples.to_vec();
    if let Some(freq) = fundamental_frequency(&rust_samples, sample_rate) {
        frequency_to_note(freq)
    } else {
        None
    }
}

#[wasm_bindgen]
pub fn greet(name: &str) -> String {
    format!("Hello, {} (from rust).", name)
}
