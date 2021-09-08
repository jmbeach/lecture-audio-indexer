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
    execSync(`ffmpeg -i "${args.file}" "${args.file}.mp3"`)
    const base64 = fs.readFileSync(`${args.file}.mp3`, { encoding: 'base64' })
    const result = await client.recognize({
      audio: {
        content: base64
      }
    });
    console.log(result);
    fs.rmdirSync(`${args.file}.mp3`)
  }
}
