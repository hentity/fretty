use rustfft::{FftPlanner, num_complex::Complex};
use once_cell::sync::Lazy;
use std::collections::HashMap;

/// Estimates the fundamental frequency of an audio signal from peaks in the power spectrum. 
///
/// # Arguments
///
/// * `samples` - A slice of audio samples (`f32` values), typically between -1.0 and 1.0.
/// * `sample_rate` - The number of samples per second (e.g., 44100 for CD-quality audio).
///
/// # Returns
///
/// The frequency (in Hz) of the fundamental frequency component in the input signal.
pub fn fundamental_frequency(samples: &[f32], sample_rate: usize) -> Option<f32> {
    let low_cutoff_hz = 20.0;
    let high_cutoff_hz = 5000.0;
    let threshold_ratio = 0.05;
    let max_peaks = 5;
    let min_peak_distance_hz = 70.0;
    let min_peak_ratio = 0.4;
    
    // find power spectrum and band-pass
    let power = get_power_spectrum(&samples, sample_rate, low_cutoff_hz, high_cutoff_hz);

    // find peaks (frequencies and magnitudes)
    let peaks = find_peaks(&power, sample_rate, threshold_ratio, max_peaks, min_peak_distance_hz, min_peak_ratio);

    // process peaks and return fundamental frequency (if found)
    analyse_peaks(&peaks) 
}


fn get_power_spectrum(samples: &[f32], sample_rate: usize, low_cutoff_hz: f32, high_cutoff_hz: f32) -> Vec<f32> {
    let len = samples.len();
    let mut planner = FftPlanner::new();
    let fft = planner.plan_fft_forward(len);

    // convert samples to complex numbers (zero imaginary component) required by fft
    let mut buffer: Vec<Complex<f32>> = samples.iter().map(|&x| Complex::new(x, 0.0)).collect();

    // perform fft in-place
    fft.process(&mut buffer);

    // band-pass filter in range [low_cutoff_hz, high_cutoff_hz]
    for (i, bin) in buffer.iter_mut().enumerate() {
        let freq = i as f32 * sample_rate as f32 / len as f32;
        if freq < low_cutoff_hz || freq > high_cutoff_hz {
            *bin = Complex::new(0.0, 0.0);
        }
    }
    // calculate power spectrum (square of the magnitude of each frequency bin)
    buffer.iter().map(|c| c.norm_sqr()).collect()
}


fn find_peaks(
    power: &[f32],
    sample_rate: usize,
    threshold_ratio: f32,
    max_peaks: usize,
    min_distance_hz: f32,
    min_peak_ratio: f32,
) -> Vec<(f32, f32)> {
    let len = power.len();
    if len < 3 {
        return Vec::new(); // not enough data to find peaks
    }
    
    // [1] FIND RAW PEAKS

    // find max magnitude
    let max_magnitude = power
        .iter()
        .cloned()
        .fold(f32::NAN, f32::max);
    
    // identify raw candidate peaks
    let mut candidates = Vec::new();
    for i in 1..(len - 1) {
        if power[i] > power[i - 1]
            && power[i] > power[i + 1]
            && power[i] > threshold_ratio * max_magnitude
        {
            // convert index to frequency
            let freq = i as f32 * sample_rate as f32 / len as f32;
            candidates.push((i, freq, power[i])); // store (bin_index, freq, magnitude)
        }
    }

    // count original number of candidate peaks (used later for signal quality check)
    let original_count = candidates.len();
    if original_count == 0 {
        return Vec::new(); // nothing to filter
    }

    // [2] ENFORCE MINIMUM FREQUENCY DISTANCE BETWEEN PEAKS

    // sort candidates by magnitude (descending)
    candidates.sort_by(|a, b| b.2.partial_cmp(&a.2).unwrap_or(std::cmp::Ordering::Equal));
    
    // convert min distance to bins
    let min_distance_bins = min_distance_hz * (len as f32 / sample_rate as f32);

    // elimate peaks that are too close to each, prioritising larger peaks
    let mut accepted_peaks = Vec::new();
    for &(bin, freq, mag) in &candidates {
        // check if this candidate is too close to any accepted peak
        let too_close = accepted_peaks.iter().any(|&(acc_bin, _, _)| {
            (bin as f32 - acc_bin as f32).abs() < min_distance_bins
        });

        if !too_close {
            accepted_peaks.push((bin, freq, mag));
            if accepted_peaks.len() >= max_peaks {
                break;
            }
        }
    }

    // signal quality check: if a high proportion of peaks were too
    // close together then don't attempt to find fundamental
    let filtered_count = accepted_peaks.len();
    let ratio = filtered_count as f32 / original_count as f32;
    if ratio < min_peak_ratio {
        return Vec::new();
    }

    // return accepted peaks in the valid frequency range
    let lowest_detectable = 70.0;
    let highest_detectable = 1000.0;
    accepted_peaks
    .iter()
    .filter(|&&(_, freq, _)| freq >= lowest_detectable && freq <= highest_detectable)
    .map(|&(_, f, m)| (f, m))
    .collect()
}


fn analyse_peaks(peaks: &[(f32, f32)]) -> Option<f32> {
    let lowest_detectable = 70.0;
    let highest_detectable = 1000.0;
    
    // handle no peak/one peak cases
    if peaks.is_empty() {
        return None;
    }

    if peaks.len() == 1 {
        return Some(peaks[0].0);
    }

    let max_harmonic = 5;
    let threshold = 2.5;

    // generate candidate fundamentals by dividing each peak by 1..max_harmonic
    let mut candidates = Vec::new();
    for &(freq, _) in peaks {
        for divisor in 1..=max_harmonic {
            let candidate = freq / divisor as f32;
            if candidate >= lowest_detectable && candidate <= highest_detectable {
                candidates.push(candidate);
            }
        }
    }

    // for each candidate, count how many others are within threshold distance
    let mut best_group = Vec::new();

    for &candidate in &candidates {
        let group: Vec<f32> = candidates
            .iter()
            .copied()
            .filter(|&x| (x - candidate).abs() <= threshold)
            .collect();

        if group.len() > best_group.len() {
            best_group = group;
        }
    }

    // compute the average frequency of the largest group
    if best_group.is_empty() {
        return None;
    }

    let sum: f32 = best_group.iter().sum();
    let avg = sum / best_group.len() as f32;

    // only predict frequency if it is a factor of all peaks
    if best_group.len() < peaks.len() {
        return None
    }

    Some(avg)
}

pub fn print_peaks(peaks: &[(f32, f32)]) {
    println!("Found {} peaks:", peaks.len());
    for (i, &(freq, mag)) in peaks.iter().enumerate() {
        println!("  Peak {:>2}: {:>8.2} Hz | Magnitude: {:>10.2e}", i + 1, freq, mag);
    }
}

// hash map to convert frequencies to notes
static NOTE_FREQ_MAP: Lazy<HashMap<&'static str, f32>> = Lazy::new(|| {
    HashMap::from([
        ("D2", 73.42), ("D#2", 77.78), ("E2", 82.41), ("F2", 87.31), ("F#2", 92.50),
        ("G2", 98.00), ("G#2", 103.83), ("A2", 110.00), ("A#2", 116.54), ("B2", 123.47),
        ("C3", 130.81), ("C#3", 138.59), ("D3", 146.83), ("D#3", 155.56), ("E3", 164.81),
        ("F3", 174.61), ("F#3", 185.00), ("G3", 196.00), ("G#3", 207.65), ("A3", 220.00),
        ("A#3", 233.08), ("B3", 246.94), ("C4", 261.63), ("C#4", 277.18), ("D4", 293.66),
        ("D#4", 311.13), ("E4", 329.63), ("F4", 349.23), ("F#4", 369.99), ("G4", 392.00),
        ("G#4", 415.30), ("A4", 440.00), ("A#4", 466.16), ("B4", 493.88), ("C5", 523.25),
        ("C#5", 554.37), ("D5", 587.33), ("D#5", 622.25), ("E5", 659.25), ("F5", 698.46),
        ("F#5", 739.99), ("G5", 783.99), ("G#5", 830.61), ("A5", 880.00), ("A#5", 932.33),
        ("B5", 987.77),
    ])
});

/// get frequency of a note, if known.
pub fn note_to_frequency(note: &str) -> Option<f32> {
    NOTE_FREQ_MAP.get(note).copied()
}

// find the note associated with a frequency (no octave info)
pub fn frequency_to_note(freq: f32) -> Option<String> {
    // extract min and max frequencies in the map
    let min_freq = NOTE_FREQ_MAP.values().cloned().fold(f32::INFINITY, f32::min);
    let max_freq = NOTE_FREQ_MAP.values().cloned().fold(f32::NEG_INFINITY, f32::max);

    let closest = NOTE_FREQ_MAP
        .iter()
        .map(|(&note, &note_freq)| (note, (note_freq - freq).abs()))
        .min_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal));

    // if freq is inside the note range, always return closest note
    // otherwise only return a note if it's within the threshold
    let threshold = 3.0;
    match closest {
        Some((note, diff)) => {
            if freq >= min_freq && freq <= max_freq || diff <= threshold {
                // Remove the last character (octave number)
                Some(note[..note.len().saturating_sub(1)].to_string())
            } else {
                None
            }
        }
        None => None,
    }
}


