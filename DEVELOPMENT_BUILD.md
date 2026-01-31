# Development Build 作成手順

このアプリは`react-native-maps`を使用しているため、**Expo Go**では動作しません。  
地図機能を使用するには、**Development Build**を作成する必要があります。

---

## Development Buildとは

Development Buildは、カスタムネイティブコード（react-native-mapsなど）を含むアプリのビルドです。  
Expo Goの制限を受けずに、すべてのネイティブモジュールが使用できます。

---

## 前提条件

- **Expo アカウント**: [https://expo.dev/signup](https://expo.dev/signup) で作成
- **EAS CLI**: `npm install -g eas-cli`でインストール
- **Expo CLI**: `npm install -g expo-cli`でインストール

---

## 手順

### 1. EAS CLIのインストール

```bash
npm install -g eas-cli
```

### 2. Expoアカウントにログイン

```bash
eas login
```

### 3. プロジェクトの設定

```bash
cd /home/ubuntu/pachislot-event-app
eas build:configure
```

### 4. Development Buildの作成

#### iOS（シミュレーター用）

```bash
eas build --profile development --platform ios
```

#### Android（実機/エミュレーター用）

```bash
eas build --profile development --platform android
```

### 5. ビルドの完了を待つ

ビルドには10〜20分かかります。  
完了すると、ダウンロードリンクが表示されます。

### 6. アプリのインストール

#### iOS

- ビルド完了後、`.tar.gz`ファイルをダウンロード
- 解凍して`.app`ファイルをシミュレーターにドラッグ&ドロップ

#### Android

- ビルド完了後、`.apk`ファイルをダウンロード
- 実機またはエミュレーターにインストール

### 7. 開発サーバーの起動

```bash
cd /home/ubuntu/pachislot-event-app
pnpm dev
```

### 8. Development Buildアプリを開く

インストールしたアプリを起動し、開発サーバーのURLを入力します。

---

## ローカルビルド（オプション）

EASを使わずにローカルでビルドする場合：

### iOS（macOS必須）

```bash
npx expo prebuild
cd ios
pod install
npx expo run:ios
```

### Android

```bash
npx expo prebuild
npx expo run:android
```

---

## トラブルシューティング

### ビルドが失敗する場合

1. `eas.json`が正しく設定されているか確認
2. `app.config.ts`の`bundleIdentifier`と`package`が一意であることを確認
3. EAS CLIを最新版に更新: `npm install -g eas-cli@latest`

### 地図が表示されない場合

1. **Google Maps API Key**が必要な場合があります
   - [Google Cloud Console](https://console.cloud.google.com/)でAPIキーを取得
   - `app.config.ts`に追加:
     ```typescript
     android: {
       config: {
         googleMaps: {
           apiKey: "YOUR_API_KEY"
         }
       }
     }
     ```

2. **位置情報パーミッション**を確認
   - iOS: `Info.plist`に`NSLocationWhenInUseUsageDescription`を追加
   - Android: `AndroidManifest.xml`に`ACCESS_FINE_LOCATION`を追加

---

## 参考リンク

- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build](https://docs.expo.dev/build/introduction/)
- [react-native-maps Documentation](https://github.com/react-native-maps/react-native-maps)
