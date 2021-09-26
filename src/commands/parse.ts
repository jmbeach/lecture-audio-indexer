import { Command, flags } from '@oclif/command'
import { IConfig } from '@oclif/config';
import { container } from '../hooks/init/init';
import { TYPES } from '../ioc/types'
import { ConfigurationManager } from '../utils/configuration-manager'
import speech from '@google-cloud/speech';
import { execSync } from 'child_process'
import * as fs from 'fs';
import { grpc, GoogleAuth } from 'google-gax';

export default class Parse extends Command {
  configurationManager: ConfigurationManager;
  constructor(argv: string[], config: IConfig) {
    super(argv, config)
    this.configurationManager = container.get<ConfigurationManager>(TYPES.ConfigurationManager)
  }

  static description = 'Transcribes the audio from a lecture video and saves it'

  static examples = [
    `$ lecture-audio-indexer parse <video-file>
`,
  ]

  static flags = {
  }

  static args = [{ name: 'file' }]

  nanosToTimestamp(seconds: number, nanos: number) {
    const secondsInMinute = 60;
    const nanosInSecond = 1000000000.0;
    const minutes = Math.floor(seconds / secondsInMinute);
    const minutesString = minutes < 10 ? `0${minutes}` : minutes.toString();
    seconds = seconds - (minutes * secondsInMinute);
    const secondsString = seconds < 10 ? `0${seconds}` : seconds
    const nanoString = Math.floor((nanos / nanosInSecond) * 1000)
    return `${minutesString}:${secondsString}.${nanoString}`
  }

  async run() {
    const { args, flags } = this.parse(Parse)
    if (!this.configurationManager.getGoogleApiKey()) {
      console.error('No API key configured. Run "lecture-audio-indexer conf google-api-key <your-api-key>"')
      return;
    }

    const sslCreds = grpc.credentials.createSsl();
    const googleAuth = new GoogleAuth();
    const authClient = googleAuth.fromAPIKey(this.configurationManager.getGoogleApiKey());
    const credentials = grpc.credentials.combineChannelCredentials(sslCreds, grpc.credentials.createFromGoogleCredential(authClient))
    const client = new speech.SpeechClient({
      sslCreds: credentials
    })
    // execSync(`ffmpeg -i "${args.file}" -f s16le -c:a pcm_s16le "${args.file}.raw"`)
    // const base64 = fs.readFileSync(`${args.file}.raw`, { encoding: 'base64' })
    const name = '6.1.1 IP Addressing.mp4.flac'
    const [operation] = await client.longRunningRecognize({
      audio: {
        // content: base64
        uri: `gs://jared-audio-indexer/${name}`
      },
      config: {
        languageCode: 'en-US',
        enableWordTimeOffsets: true,
        enableAutomaticPunctuation: true,
        encoding: 'FLAC'
      }
    });
    const [response] = await operation.promise();
    const transcriptions = response.results
      .map(result => result.alternatives[0].transcript);
    let vttChunks = []
    for (let i = 0; i < transcriptions.length; i++) {
      const transcription = transcriptions[i];
      const words = response.results[i].alternatives[0].words;
      const sentences = transcription?.split('.')
        .map(x => x.split(','))
        // flatmap
        .reduce((a, b) => [...b, ...a], [])
        .map(x => x.split('?'))
        // flatmap
        .reduce((a, b) => [...b, ...a], [])
        .filter(x => x).map(x => x.trim());
      let wordStart = 0;
      for (let j = 0; j < sentences?.length; j++) {
        const sentence = sentences[j];
        const sentenceWords = sentence.split(' ');
        const startTimeStamp = this.nanosToTimestamp(words[wordStart].startTime?.seconds, words[wordStart].startTime?.nanos);
        const endTimeStamp = this.nanosToTimestamp(words[wordStart + sentenceWords.length - 1].endTime?.seconds, words[wordStart + sentenceWords.length - 1].endTime?.nanos);
        const vttChunk = `${startTimeStamp} --> ${endTimeStamp}
- ${sentence.split('\n').join('\n- ')}`
        vttChunks.push(vttChunk);
        wordStart += sentenceWords.length - 1;
      }
    }
    if (!fs.existsSync('./out/')) {
      fs.mkdirSync('./out/');
    }
    fs.writeFileSync(`./out/${name}.txt`, transcriptions.join('\n'));
    fs.writeFileSync(`./out/${name}.vtt`, vttChunks.join('\n\n'));
  }
}
