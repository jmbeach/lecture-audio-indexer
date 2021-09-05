import Conf from 'conf';
import { injectable } from 'inversify';
import { ConfigurationProvider } from './configuration-manager';

@injectable()
export class ConfigurationProviderConf implements ConfigurationProvider {
  conf: Conf;
  constructor() {
    this.conf = new Conf();
  }
  get(key: string) {
    return this.conf.get(key) as string;
  }
}