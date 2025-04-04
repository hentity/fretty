class BufferProcessor extends AudioWorkletProcessor {
  process(inputs) {
    const input = inputs[0]?.[0]
    if (input && input.length > 0) {
      this.port.postMessage(new Float32Array(input))
    }
    return true
  }
}

registerProcessor('buffer-processor', BufferProcessor)