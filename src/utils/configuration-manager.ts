import { inject, injectable } from 'inversify'
import { TYPES } from '../ioc/types';

export interface ConfigurationProvider {
  get(configKey: string): string
}

@injectable()
export class ConfigurationManager {
  @inject(TYPES.ConfigurationProvider) private configProvider!: ConfigurationProvider;

  getGoogleApiKey() {
    return this.configProvider.get('google-api-key')
  }
}
