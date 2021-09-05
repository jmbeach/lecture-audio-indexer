import { Hook } from '@oclif/config'
import { Container } from 'inversify'
import { TYPES } from '../../ioc/types';
import { ConfigurationProviderConf } from '../../utils/configuration-provider-conf';
import { ConfigurationProvider } from '../../utils/configuration-parser';

const hook: Hook<'init'> = async function (opts) {
  const container = new Container();
  container.bind<ConfigurationProvider>(TYPES.ConfigurationProvider).to(ConfigurationProviderConf)
}

export default hook
