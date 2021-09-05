import { Command, flags } from '@oclif/command'
import { inject } from 'inversify'
import { TYPES } from '../ioc/types'
import { ConfigurationManager, ConfigurationProvider } from '../utils/configuration-manager'

export default class Parse extends Command {
  @inject(TYPES.ConfigurationManager) private configurationManager!: ConfigurationManager;

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
    console.log(this.configurationManager.getGoogleApiKey())
  }
}
