import Conf from 'conf';
import { ConfigurationProvider } from './configuration-parser';

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