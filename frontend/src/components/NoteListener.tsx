import { useEffect, useRef, useState } from 'react'
import init, { detect_note } from '../wasm/audio_processing'

export default function NoteListener() {
  const [note, setNote] = useState<string | null>(null)
  const [status, setStatus] = useState('Waiting for input...')
  const [isListening, setIsListening] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const bufferRef = useRef<Float32Array>(new Float32Array())

  const start = async () => {
    await init()
    const audioCtx = new AudioContext()
    audioCtxRef.current = audioCtx

    const sampleRate = audioCtx.sampleRate
    const chunkDuration = 0.5 // seconds
    const chunkSize = sampleRate * chunkDuration
    console.log('Using dynamic sample rate:', sampleRate)

    if (audioCtx.state === 'suspended') {
      await audioCtx.resume()
    }

    const workletUrl = new URL('./worklet-processor.js', import.meta.url).href
    await audioCtx.audioWorklet.addModule(workletUrl)

    const workletNode = new AudioWorkletNode(audioCtx, 'buffer-processor')

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const source = audioCtx.createMediaStreamSource(stream)
    source.connect(workletNode)

    const silentGain = audioCtx.createGain()
    silentGain.gain.value = 0
    workletNode.connect(silentGain)
    silentGain.connect(audioCtx.destination)

    console.log('Microphone connected to worklet')

    workletNode.port.onmessage = (event) => {
      const input = event.data as Float32Array
      const oldBuffer = bufferRef.current
      const combined = new Float32Array(oldBuffer.length + input.length)
      combined.set(oldBuffer)
      combined.set(input, oldBuffer.length)
      bufferRef.current = combined

      if (bufferRef.current.length >= chunkSize) {
        const chunk = bufferRef.current.slice(0, chunkSize)
        bufferRef.current = bufferRef.current.slice(chunkSize)

        const note = detect_note(chunk, sampleRate)
        setNote(note ?? '—')
        setStatus(`Detected note: ${note ?? 'None'}`)
      }
    }

    setIsListening(true)
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Live Note Detection</h2>
      <p>{status}</p>
      {note && <p style={{ fontSize: '2rem' }}>{note}</p>}
      {!isListening && <button onClick={start}>Start Listening</button>}
    </div>
  )
}
