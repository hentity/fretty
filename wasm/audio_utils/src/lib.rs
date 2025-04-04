use rustfft::{FftPlanner, num_complex::Complex};

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
    let low_cutoff_hz = 70.0;
    let high_cutoff_hz = 2000.0;
    let threshold_ratio = 0.1;
    let max_peaks = 5;
    let min_peak_distance_hz = 70.0;
    
    // find power spectrum and band-pass
    let power = get_power_spectrum(&samples, sample_rate, low_cutoff_hz, high_cutoff_hz);

    // find peaks (frequencies and magnitudes)
    let peaks = find_peaks(&power, sample_rate, threshold_ratio, max_peaks, min_peak_distance_hz);

    // DEBUG
    print_peaks(&peaks);

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

    // return peaks as (freq, magnitude) in same order as provided
    accepted_peaks.iter().map(|&(_, f, m)| (f, m)).collect()
}


fn analyse_peaks(peaks: &[(f32, f32)]) -> Option<f32> {
    peaks
        .iter()
        .max_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal))
        .map(|&(freq, _)| freq)
}

pub fn print_peaks(peaks: &[(f32, f32)]) {
    println!("Found {} peaks:", peaks.len());
    for (i, &(freq, mag)) in peaks.iter().enumerate() {
        println!("  Peak {:>2}: {:>8.2} Hz | Magnitude: {:>10.2e}", i + 1, freq, mag);
    }
}

