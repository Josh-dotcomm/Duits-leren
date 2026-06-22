import { registerRootComponent } from 'expo';
import App from './App';

// SDK 54 entry point. registerRootComponent calls AppRegistry.registerComponent
// and sets up the root view for both Expo Go and native builds.
registerRootComponent(App);
