import { Hook } from '@oclif/config'
import { Container } from 'inversify'
import { TYPES } from '../../ioc/types';
import { ConfigurationProviderConf } from '../../utils/configuration-provider-conf';
import { ConfigurationManager, ConfigurationProvider } from '../../utils/configuration-manager';

export let container: Container;
const hook: Hook<'init'> = async function (opts) {
  container = new Container();
  container.bind<ConfigurationProvider>(TYPES.ConfigurationProvider).to(ConfigurationProviderConf)
  container.bind<ConfigurationManager>(TYPES.ConfigurationManager).to(ConfigurationManager)
}

export default hook