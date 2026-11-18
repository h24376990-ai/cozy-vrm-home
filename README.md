# Cozy VRM Home

https://github.com/mokage2009-cell/cozy-world-studio.git コードを取り込んだ後　自宅の3Dルームのアバターを、ブロック調の人形から本物の人間型3Dモデル（VRM形式）にアップグレードしてください。

【1. VRMモデルの読み込みと髪の物理演算】
・`@pixiv/three-vrm` ライブラリを導入し、`public/default-avatar.vrm` を初期アバターとして自宅の3D空間に表示する。
・VRMに内蔵されているSpringBone（揺れもの物理演算）を有効にし、移動時やポーズ変更時に髪の毛や服が自然に揺れるようにする。

【2. 複数アバターの切り替え・アップロード機能】
・VRoid StudioやAvatar Makerなどで作成した他の `.vrm` ファイルを、ユーザーが画面上の「VRMモデルを読み込む」ボタンから選択して、その場でアバターを差し替えられる機能をつける。
・読み込んだVRMモデルに対しても、身長・体重（体型スケール）の調整や、自作した服のテクスチャ反映、家具タップ時の移動・アクションがそのまま連動するようにする。

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2461d8c6-a832-4497-87e3-95d9e3d746df).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
