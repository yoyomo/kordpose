export interface SynthResource {
  base_frequency: number
  base_octave: number
  vco_signal: OscillatorType
  sound_on: boolean
  cut_off_frequency: number
  attack: string | number
  release: string | number

  id: number | void
  user_id: number | void

}