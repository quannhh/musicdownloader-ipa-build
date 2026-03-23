# 🎵 Music Downloader - Tải nhạc từ TikTok, YouTube & hơn thế nữa

App iOS cho phép bạn tải nhạc từ **TikTok, YouTube, SoundCloud, Instagram, Facebook, Twitter** và bất kỳ nguồn nào khác, biến thành file MP3 và nghe trực tiếp trên iPhone.

![React Native](https://img.shields.io/badge/React_Native-0.76.9-blue)
![Platform](https://img.shields.io/badge/Platform-iOS-lightgrey)
![License](https://img.shields.io/badge/License-MIT-green)

## ✨ Tính năng

- 🔗 **Nhập link** từ TikTok, YouTube, SoundCloud, Instagram, Facebook, Twitter
- 🎵 **Tự động chuyển đổi** video thành MP3 chất lượng cao
- 🎧 **Trình phát nhạc** đầy đủ với giao diện đẹp (play, pause, next, previous, shuffle, repeat)
- 📚 **Thư viện nhạc** với tìm kiếm, lọc theo nguồn, sắp xếp
- ❤️ **Yêu thích** bài hát
- 🎨 **Giao diện Dark mode** xịn xò
- 📱 **Background audio** - nghe nhạc khi tắt màn hình
- 🔔 **Control Center** - điều khiển từ Lock Screen
- 📋 **Clipboard paste** - dán link nhanh từ clipboard

## 📁 Cấu trúc dự án

```
e:\quan\nhac\
├── backend/                    # Backend API Server
│   ├── server.js               # Express server chính
│   ├── downloads/              # Thư mục chứa file nhạc đã tải
│   ├── songs.json              # Database JSON
│   └── package.json
│
├── MusicDownloader/            # React Native App
│   ├── App.js                  # App entry point
│   ├── index.js                # Register app & TrackPlayer
│   ├── src/
│   │   ├── screens/
│   │   │   ├── HomeScreen.js       # Màn hình tải nhạc
│   │   │   ├── LibraryScreen.js    # Thư viện nhạc
│   │   │   ├── PlayerScreen.js     # Trình phát nhạc full
│   │   │   └── SettingsScreen.js   # Cài đặt
│   │   ├── components/
│   │   │   └── MiniPlayer.js       # Mini player bar
│   │   ├── services/
│   │   │   ├── api.js              # API service
│   │   │   └── PlayerService.js    # Track Player service
│   │   ├── utils/
│   │   │   └── config.js           # Config (API URL, Colors)
│   │   └── assets/
│   │       └── default-album.png   # Default album art
│   └── ios/                    # iOS native files
│
└── README.md                   # File này
```

## 🚀 Cài đặt & Sử dụng

### Bước 1: Cài đặt công cụ trên máy tính

```bash
# Cài yt-dlp (công cụ tải video/audio)
pip install yt-dlp

# Cài ffmpeg (công cụ chuyển đổi audio)
# Windows: tải từ https://ffmpeg.org/download.html và thêm vào PATH
# macOS: brew install ffmpeg
# Linux: sudo apt install ffmpeg
```

### Bước 2: Chạy Backend Server

```bash
cd e:\quan\nhac\backend
node server.js
```

Server sẽ chạy tại `http://localhost:3000`

### Bước 3: Cấu hình IP cho App

Mở file `MusicDownloader/src/utils/config.js` và đổi IP thành IP máy tính của bạn:

```javascript
// Tìm IP máy tính:
// Windows: ipconfig → IPv4 Address
// Mac: ifconfig → en0 → inet
export const API_BASE_URL = 'http://192.168.1.XXX:3000';
```

### Bước 4: Build IPA cho iPhone

## 📱 HƯỚNG DẪN BUILD IPA CHI TIẾT

### Cách 1: Build trên Mac (Khuyến nghị)

**Yêu cầu:**
- macOS 12+
- Xcode 14+
- CocoaPods
- Apple Developer Account (miễn phí cũng được)

```bash
# 1. Copy project sang Mac
# 2. Cài dependencies
cd MusicDownloader
npm install

# 3. Cài CocoaPods
cd ios
pod install
cd ..

# 4. Mở Xcode
open ios/MusicDownloader.xcworkspace

# 5. Trong Xcode:
#    - Chọn Team (Apple ID của bạn)
#    - Đổi Bundle Identifier thành unique (vd: com.yourname.musicdownloader)
#    - Chọn device iPhone của bạn (cắm dây USB)
#    - Nhấn ▶ Run

# 6. Build IPA (Archive):
#    - Product → Archive
#    - Distribute App → Ad Hoc / Development
#    - Export → Lấy file .ipa
```

### Cách 2: Sử dụng GitHub Actions (Không cần Mac)

1. Push code lên GitHub
2. Tạo file `.github/workflows/build-ios.yml`:

```yaml
name: Build iOS IPA
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd MusicDownloader
          npm install
      
      - name: Install CocoaPods
        run: |
          cd MusicDownloader/ios
          pod install
      
      - name: Build IPA
        run: |
          cd MusicDownloader/ios
          xcodebuild -workspace MusicDownloader.xcworkspace \
            -scheme MusicDownloader \
            -configuration Release \
            -sdk iphoneos \
            -archivePath $PWD/build/MusicDownloader.xcarchive \
            archive \
            CODE_SIGN_IDENTITY="" \
            CODE_SIGNING_REQUIRED=NO \
            CODE_SIGNING_ALLOWED=NO
          
          # Tạo IPA
          mkdir -p $PWD/build/Payload
          cp -r $PWD/build/MusicDownloader.xcarchive/Products/Applications/MusicDownloader.app $PWD/build/Payload/
          cd $PWD/build
          zip -r MusicDownloader.ipa Payload
      
      - name: Upload IPA
        uses: actions/upload-artifact@v4
        with:
          name: MusicDownloader-IPA
          path: MusicDownloader/ios/build/MusicDownloader.ipa
```

### Cách 3: Sử dụng Codemagic (Miễn phí 500 phút/tháng)

1. Đăng ký tại https://codemagic.io
2. Kết nối GitHub repo
3. Chọn React Native project
4. Build → Tải file IPA

### Cách 4: Sử dụng EAS Build (Expo Application Services)

```bash
# Cài EAS CLI
npm install -g eas-cli

# Cấu hình
cd MusicDownloader
eas init
eas build:configure

# Build iOS
eas build --platform ios
```

## 📲 CÀI IPA LÊN IPHONE

### Cách 1: AltStore (Không cần jailbreak) ⭐ Khuyến nghị

1. **Cài AltStore trên máy tính:**
   - Tải AltServer từ https://altstore.io
   - Windows: Cài AltServer + iTunes + iCloud
   - Mac: Cài AltServer
   
2. **Cài AltStore lên iPhone:**
   - Cắm iPhone qua USB
   - Mở AltServer → Install AltStore → Chọn iPhone
   - Nhập Apple ID

3. **Cài IPA:**
   - Mở AltStore trên iPhone
   - Tab "My Apps" → Nhấn "+"
   - Chọn file MusicDownloader.ipa
   - Đợi cài đặt xong

### Cách 2: Sideloadly (Không cần jailbreak)

1. Tải Sideloadly từ https://sideloadly.io
2. Cắm iPhone qua USB
3. Kéo file .ipa vào Sideloadly
4. Nhập Apple ID → Start
5. Trên iPhone: Settings → General → VPN & Device Management → Trust

### Cách 3: Xcode (Cần Mac)

1. Cắm iPhone vào Mac qua USB
2. Mở Xcode → Window → Devices and Simulators
3. Kéo file .ipa vào iPhone trong danh sách

### Cách 4: TrollStore (iOS 14-16.6.1)

Nếu iPhone chạy iOS 14.0 - 16.6.1:
1. Cài TrollStore theo hướng dẫn: https://github.com/opa334/TrollStore
2. Mở TrollStore → Cài file .ipa
3. App sẽ được cài vĩnh viễn, không cần gia hạn

## 🔧 Sử dụng App

1. **Đảm bảo** iPhone và máy tính cùng mạng WiFi
2. **Chạy server** trên máy tính: `cd backend && node server.js`
3. **Mở app** trên iPhone
4. **Copy link** từ TikTok/YouTube
5. **Dán link** vào app → Nhấn "Tải xuống"
6. **Nghe nhạc** trong tab Thư viện

## 🔒 Lưu ý quan trọng

- App cần kết nối với server backend qua mạng WiFi
- Server backend chạy trên máy tính của bạn (localhost)
- File nhạc được lưu trên server, app stream qua mạng
- Nếu dùng AltStore, cần gia hạn app mỗi 7 ngày
- Nếu dùng TrollStore, app cài vĩnh viễn

## 🛠 Khắc phục sự cố

| Vấn đề | Giải pháp |
|--------|-----------|
| Server không kết nối | Kiểm tra IP trong config.js, đảm bảo cùng WiFi |
| Tải nhạc thất bại | Kiểm tra yt-dlp đã cài: `yt-dlp --version` |
| Không chuyển đổi được | Kiểm tra ffmpeg: `ffmpeg -version` |
| App crash | Xoá và cài lại, kiểm tra CocoaPods |
| Không phát được nhạc | Kiểm tra URL server, kiểm tra file tồn tại |

## 📝 API Endpoints

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /api/health | Kiểm tra server |
| GET | /api/songs | Lấy tất cả bài hát |
| POST | /api/download | Tải nhạc từ URL |
| DELETE | /api/songs/:id | Xoá bài hát |
| PUT | /api/songs/:id/favorite | Toggle yêu thích |
| GET | /api/search?q=... | Tìm kiếm |
| GET | /api/playlists | Lấy playlists |
| POST | /api/playlists | Tạo playlist |

## 📄 License

MIT License - Sử dụng cho mục đích cá nhân.
