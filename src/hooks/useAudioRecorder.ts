import { useRef, useState, useCallback, useEffect } from 'react'

export function useAudioRecorder(onChunk: (blob: Blob) => void) {
  const [isRecording, setIsRecording] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onChunkRef = useRef(onChunk)
  useEffect(() => { onChunkRef.current = onChunk }, [onChunk])

  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isActiveRef = useRef(false)

  const startNewCycle = useCallback((stream: MediaStream) => {
    if (!isActiveRef.current) return

    const recorder = new MediaRecorder(stream)
    mediaRecorderRef.current = recorder
    chunksRef.current = []

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data)
      }
    }

    recorder.onstop = () => {
      if (!isActiveRef.current) return

      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
      chunksRef.current = []

      if (blob.size > 5000) {
        onChunkRef.current(blob)
      }
    }

    recorder.start()
  }, [])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      isActiveRef.current = true
      setIsRecording(true)
      setError(null)

      startNewCycle(stream)

      intervalRef.current = setInterval(() => {
        if (!isActiveRef.current) return

        const recorder = mediaRecorderRef.current
        if (recorder && recorder.state === 'recording') {
          recorder.onstop = () => {
            if (!isActiveRef.current) return

            const blob = new Blob(chunksRef.current, {
              type: recorder.mimeType || 'audio/webm',
            })
            chunksRef.current = []

            if (blob.size > 5000) {
              onChunkRef.current(blob)
            }

            if (isActiveRef.current && streamRef.current) {
              startNewCycle(streamRef.current)
            }
          }
          recorder.stop()
        }
      }, 10000)

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setError(msg.includes('denied')
        ? 'Microphone access denied. Please allow mic access.'
        : 'Could not start recording: ' + msg)
    }
  }, [startNewCycle])

  const stopRecording = useCallback(() => {
    isActiveRef.current = false

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    const recorder = mediaRecorderRef.current
    if (recorder) {
      recorder.ondataavailable = null
      recorder.onstop = null
      if (recorder.state !== 'inactive') {
        recorder.stop()
      }
      mediaRecorderRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }

    chunksRef.current = []
    setIsRecording(false)
  }, [])

  return { isRecording, startRecording, stopRecording, error }
}
