import { Platform } from 'react-native';

// Web環境ではreact-native-mapsをインポートしない
let MapView: any = null;
let Marker: any = null;
let PROVIDER_DEFAULT: any = null;

if (Platform.OS !== 'web') {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
}

export { MapView, Marker, PROVIDER_DEFAULT };
export const isMapAvailable = Platform.OS !== 'web';
